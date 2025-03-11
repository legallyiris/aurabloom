import { beforeAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";

import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

let authCookie: string;
let communityId: string;
let channelId: string;
let userId: number;
const headers: { cookie: string } = { cookie: "" };

describe("messages routes", () => {
  beforeAll(async () => {
    const username = `message_test_${Date.now()}`;

    await client.api.users.users.post({
      username,
      displayName: "message test",
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

    const { data: channelData, error: channelError } = await client.api
      .channels({ communityId })
      .post(
        {
          name: `test-channel-${Date.now()}`,
          type: "text",
        },
        {
          headers,
        },
      );

    expect(channelError).toBeNull();
    expect(channelData).toBeDefined();

    if (channelData) {
      channelId = channelData.data.id;
    }
  });

  it("should send a new message", async () => {
    const messageContent = `test message ${Date.now()}`;
    const { data, error } = await client.api.messages({ channelId }).post(
      {
        content: messageContent,
      },
      {
        headers,
      },
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) {
      expect(data.status).toBe("success");
      expect(data.data.content).toBe(messageContent);
      expect(data.data.userId).toBe(userId);
      expect(data.data.channelId).toBe(channelId);
    }
  });

  it("should get messages from a channel", async () => {
    const { data, error } = await client.api
      .messages({ channelId })
      .get({ headers, query: {} });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) {
      expect(data.status).toBe("success");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      expect(data.data[0].content).toBeDefined();
      expect(data.data[0].author).toBeDefined();
      expect(data.data[0].author.id).toBeDefined();
      expect(data.data[0].author.username).toBeDefined();
      expect(data.data[0].author.displayName).toBeDefined();
    }
  });
});
