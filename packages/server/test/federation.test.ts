import { beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../src/federation/crypto", () => ({
  verifySignature: async () => {
    console.log("hi");
    return true;
  },
  signData: async () => "mocked_signature",
  createHttpSignatureHeader: () => "mocked_signature_header",
  generateKeyPair: async () => ({
    publicKey: "mocked_public_key",
    privateKey: "mocked_private_key",
  }),
}));

import * as cryptoModule from "../src/federation/crypto";
const verifySignatureSpy = spyOn(cryptoModule, "verifySignature");
verifySignatureSpy.mockImplementation(async () => true);

import { treaty } from "@elysiajs/eden";
import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

let authCookie: string;
let userId: number;
const headers: { cookie: string } = { cookie: "" };
let username: string;
let communityId: string;

describe("federation routes", () => {
  beforeAll(async () => {
    username = `fed_test_${Date.now()}`;
    await client.api.users.users.post({
      username,
      displayName: "federation test",
      password: "password123",
    });

    const { data, error, response } = await client.api.auth.login.post(
      {
        username,
        password: "password123",
      },
      {
        fetch: {
          credentials: "include",
        },
      },
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.data.username).toBe(username);

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader && data) {
      authCookie = setCookieHeader;
      userId = data.data.id;
      headers.cookie = authCookie;
    }

    const { data: communityData, error: communityError } =
      await client.api.communities.index.post(
        {
          name: `test-community-${Date.now()}`,
          description: "test community",
          isPublic: true,
        },
        {
          fetch: {
            credentials: "include",
            headers: {
              Cookie: authCookie,
            },
          },
        },
      );

    expect(communityError).toBeNull();
    expect(communityData).toBeDefined();

    if (communityData) {
      communityId = communityData.data.id;
    }
  });

  it("should get webfinger information", async () => {
    const { data, error } = await client[".well-known"].webfinger.get({
      query: { resource: `acct:${username}@localhost` },
      headers: {
        host: "localhost",
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.subject).toBe(`acct:${username}@localhost`);
    expect(data?.links.length).toBeGreaterThan(0);
  });

  it("should get user actor", async () => {
    const { data, error } = await client.ap.users({ username }).index.get();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toContain(`/ap/users/${username}`);
    expect(data?.preferredUsername).toBe(username);
  });

  it("should get user outbox", async () => {
    const { data, error } = await client.ap
      .users({ username })
      .outbox.get({ query: {} });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.type).toBe("OrderedCollection");
  });

  it("should get community actor", async () => {
    const { data, error } = await client.ap
      .communities({ id: communityId })
      .index.get();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toContain(`/ap/communities/${communityId}`);
  });

  it("should get community outbox", async () => {
    const { data, error } = await client.ap
      .communities({ id: communityId })
      .outbox.get({ query: {} });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.type).toBe("OrderedCollection");
  });
});
