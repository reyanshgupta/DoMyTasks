import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, getToken, hasToken, setToken } from "@/lib/auth";

describe("auth token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token stored", () => {
    expect(getToken()).toBeNull();
    expect(hasToken()).toBe(false);
  });

  it("stores and retrieves token", () => {
    setToken("secret");
    expect(getToken()).toBe("secret");
    expect(hasToken()).toBe(true);
  });

  it("clears token", () => {
    setToken("secret");
    clearToken();
    expect(getToken()).toBeNull();
    expect(hasToken()).toBe(false);
  });
});
