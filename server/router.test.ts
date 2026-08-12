import { describe, expect, test } from "bun:test";
import { routeRequest } from "./router";

describe("API router", () => {
  test("serves the health route", async () => {
    const response = await routeRequest(new Request("https://example.test/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("returns 405 with an Allow header for unsupported methods", async () => {
    const response = await routeRequest(
      new Request("https://example.test/api/health", { method: "POST" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
  });

  test("returns 404 for unknown routes", async () => {
    const response = await routeRequest(new Request("https://example.test/api/unknown"));
    expect(response.status).toBe(404);
  });
});
