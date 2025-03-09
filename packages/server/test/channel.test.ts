import { beforeAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";

import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

let authCookie: string;
let communityId: string;
let userId: number;
const headers: { cookie: string } = { cookie: "" };

describe("channels routes", () => {
  beforeAll(async () => {
    const username = `channel_test_${Date.now()}`;

    await client.api.users.users.post({
      username,
      displayName: "channel test",
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

  it("should create a new text channel", async () => {
    const channelName = `test-channel-${Date.now()}`;
    const { data, error } = await client.api.channels({ communityId }).post(
      {
        name: channelName,
        type: "text",
      },
      {
        headers,
      },
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();

    if (data) {
      expect(data.status).toBe("success");
      expect(data.data.name).toBe(channelName);
      expect(data.data.communityId).toBe(communityId);
      expect(data.data.type).toBe("text");
    }
  });

  it("should create a new category channel", async () => {
    const channelName = `test-category-${Date.now()}`;
    const { data, error } = await client.api.channels({ communityId }).post(
      {
        name: channelName,
        type: "category",
      },
      {
        headers,
      },
    );

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(data?.data.name).toBe(channelName);
    expect(data?.data.communityId).toBe(communityId);
    expect(data?.data.type).toBe("category");
  });

  it("should list channels in a community", async () => {
    const { data, error } = await client.api
      .channels({ communityId })
      .get({ headers });

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(Array.isArray(data?.data)).toBe(true);
    expect(data?.data.length).toBeGreaterThanOrEqual(2);
  });
});
