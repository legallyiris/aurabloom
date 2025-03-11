import { beforeAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";

import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

let authCookie: string;
let userId: number;
const headers: {
  cookie: string;
} = {
  cookie: "",
};

describe("communities routes", () => {
  beforeAll(async () => {
    const username = `community_test_${Date.now()}`;

    await client.api.users.users.post({
      username,
      displayName: "community test",
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
  });

  it("should create a new community", async () => {
    const { data, error } = await client.api.communities.index.post(
      {
        name: `Test Community ${Date.now()}`,
        description: "a test community",
        isPublic: true,
      },
      {
        headers,
      },
    );

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(data?.data.name).toContain("Test Community");
    expect(data?.data.createdBy).toBe(userId);
  });

  it("should list public communities", async () => {
    const { data, error } = await client.api.communities.me.get({
      headers,
    });

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(Array.isArray(data?.data)).toBe(true);
  });
});
