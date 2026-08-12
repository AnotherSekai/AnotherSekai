import { describe, expect, test } from "bun:test";
import { withRegion } from "./region";

describe("region middleware", () => {
  test("passes the default JP region to route handlers", async () => {
    const response = await withRegion(new URL("https://example.test/api/music"), (region) =>
      Response.json({ region }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ region: "jp" });
  });

  test("normalizes the TW compatibility alias to TC", async () => {
    const response = await withRegion(
      new URL("https://example.test/api/music?region=tw"),
      (region) => Response.json({ region }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ region: "tc" });
  });

  test("rejects unsupported regions before invoking a route handler", async () => {
    let invoked = false;
    const response = await withRegion(
      new URL("https://example.test/api/music?region=unknown"),
      () => {
        invoked = true;
        return Response.json({ ok: true });
      },
    );

    expect(invoked).toBeFalse();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unsupported region." });
  });
});
