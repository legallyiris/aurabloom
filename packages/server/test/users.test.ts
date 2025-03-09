import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";

import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

describe("users routes", () => {
  it("should register a new user", async () => {
    const username = `test_${Date.now()}`;
    const { data, error } = await client.api.users.users.post({
      username,
      displayName: "test user",
      password: "password123",
    });

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(data?.data.username).toBe(username);
  });

  it("should get current user", async () => {
    const username = `get_current_user_${Date.now()}`;
    const password = "password123";
    await client.api.users.users.post({
      username,
      displayName: "get current user",
      password,
    });

    const loginRes = await client.api.auth.login.post({ username, password });
    expect(loginRes.error).toBeNull();
    const authCookie = loginRes.response.headers.get("set-cookie");

    const { data, error } = await client.api.users.me.get({
      headers: {
        cookie: authCookie,
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) {
      expect(data.status).toBe("success");
      expect(data.data.username).toBe(username);
    }
  });

  it("should list user sessions", async () => {
    const username = `list_sessions_${Date.now()}`;
    const password = "password123";
    await client.api.users.users.post({
      username,
      displayName: "list sessions",
      password,
    });

    const loginRes = await client.api.auth.login.post({ username, password });
    expect(loginRes.error).toBeNull();
    const authCookie = loginRes.response.headers.get("set-cookie");

    const { data, error } = await client.api.users.me.sessions.get({
      headers: {
        cookie: authCookie,
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) {
      expect(data.status).toBe("success");
      expect(Array.isArray(data.data.sessions)).toBe(true);
      expect(data.data.sessions.length).toBeGreaterThanOrEqual(1);
      expect(data.data.sessions[0].id).toBeDefined();
      expect(data.data.sessions[0].createdAt).toBeDefined();
      expect(data.data.sessions[0].expiresAt).toBeDefined();
      expect(data.data.sessions[0].createdAtFormatted).toBeDefined();
      expect(data.data.sessions[0].expiresAtFormatted).toBeDefined();
      expect(data.data.sessions[0].userAgent).toBeDefined();
      expect(data.data.sessions[0].ipAddress).toBeDefined();
    }
  });

  it("should delete a session", async () => {
    const username = `delete_session_${Date.now()}`;
    const password = "password123";
    await client.api.users.users.post({
      username,
      displayName: "delete session",
      password,
    });

    const loginRes = await client.api.auth.login.post({ username, password });
    expect(loginRes.error).toBeNull();
    const authCookie = loginRes.response.headers.get("set-cookie");

    await client.api.auth.login.post({ username, password });

    const { data: sessions, error: sessionErr } =
      await client.api.users.me.sessions.get({
        headers: {
          cookie: authCookie,
        },
      });

    expect(sessionErr).toBeNull();
    expect(sessions).toBeDefined();

    if (!sessions) throw new Error("no sessions found");
    expect(sessions.data.sessions.length).toBeGreaterThan(1);

    const sessionIdToDelete = sessions.data.sessions.find(
      (session) => !session.current,
    )?.id;
    if (!sessionIdToDelete) throw new Error("No session ID found to delete");

    const { data, error } = await client.api.users.me
      .sessions({ sessionId: sessionIdToDelete })
      .delete({}, { headers: { cookie: authCookie } });

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
  });
});
