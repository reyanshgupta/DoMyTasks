import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth";

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("throws ApiError with server detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ detail: "Invalid token" }),
      }),
    );

    await expect(api.getAuthSession()).rejects.toThrow(ApiError);
    await expect(api.getAuthSession()).rejects.toMatchObject({
      status: 401,
      message: "Invalid token",
    });
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      }),
    );

    await expect(api.deleteTask("task-id")).resolves.toBeUndefined();
  });

  it("attaches bearer token when present", async () => {
    setToken("my-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.listWorkstreams();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workstreams",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-token",
        }),
      }),
    );
  });

  it("builds query strings for dashboard params", async () => {
    clearToken();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ columns: [], sort_by: "priority" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.getKanban({
      hide_done: "true",
      workstream_ids: ["a", "b"],
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("hide_done=true");
    expect(url).toContain("workstream_ids=a");
    expect(url).toContain("workstream_ids=b");
  });

  it("posts JSON bodies for mutations", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: "1", title: "T" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.createTask({
      workstream_id: "eng",
      title: "T",
      context: "C",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          workstream_id: "eng",
          title: "T",
          context: "C",
        }),
      }),
    );
  });
});
