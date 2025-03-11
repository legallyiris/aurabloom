import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";

import type { App } from "../src/eden";
const client = treaty<App>("localhost:3000");

describe("auth routes", () => {
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

  it("should login with valid credentials", async () => {
    const username = `login_test_${Date.now()}`;
    await client.api.users.users.post({
      username,
      displayName: "login test",
      password: "password123",
    });

    const { data, error } = await client.api.auth.login.post({
      username,
      password: "password123",
    });

    expect(error).toBeNull();
    expect(data?.status).toBe("success");
    expect(data?.data.username).toBe(username);
  });

  it("should reject login with invalid credentials", async () => {
    const { data, error } = await client.api.auth.login.post({
      username: "nonexistent",
      password: "wrongpassword",
    });

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.status).toBe(401);
  });
});
