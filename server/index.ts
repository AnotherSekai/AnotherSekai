import { getLatestGachas, isSupportedRegion } from "./gacha";

const port = Number(process.env.GACHA_API_PORT || 9000);

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/api/gachas/latest") {
      const region = url.searchParams.get("region") ?? "jp";
      if (!isSupportedRegion(region)) {
        return json({ error: "Unsupported region." }, { status: 400 });
      }

      try {
        const gachas = await getLatestGachas(region);
        return json(gachas, {
          headers: {
            "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          },
        });
      } catch (error) {
        console.error("Failed to load gachas:", error);
        return json({ error: "The latest gachas are temporarily unavailable." }, { status: 502 });
      }
    }

    return json({ error: "Not found." }, { status: 404 });
  },
});

console.log(`Gacha API listening on http://localhost:${port}`);
