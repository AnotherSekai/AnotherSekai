import { getLatestGachas, isSupportedRegion } from "./gacha";
import { getMusicCatalog, isSupportedMusicRegion } from "./music";
import { getTitleCatalog, isSupportedTitleRegion } from "./titles";
import {
  getVirtualShowDetail,
  getVirtualShows,
  isSupportedVirtualShowRegion,
} from "./virtual-shows";

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

    if (request.method === "GET" && url.pathname === "/api/titles") {
      const region = url.searchParams.get("region") ?? "jp";
      if (!isSupportedTitleRegion(region)) {
        return json({ error: "Unsupported region." }, { status: 400 });
      }

      try {
        const titles = await getTitleCatalog(region);
        return json(titles, {
          headers: {
            "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
          },
        });
      } catch (error) {
        console.error("Failed to load titles:", error);
        return json({ error: "Titles are temporarily unavailable." }, { status: 502 });
      }
    }

    if (request.method === "GET" && url.pathname === "/api/music") {
      const region = url.searchParams.get("region") ?? "jp";
      if (!isSupportedMusicRegion(region)) {
        return json({ error: "Unsupported region." }, { status: 400 });
      }

      try {
        const musics = await getMusicCatalog(region);
        return json(musics, {
          headers: {
            "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
          },
        });
      } catch (error) {
        console.error("Failed to load music:", error);
        return json({ error: "Music is temporarily unavailable." }, { status: 502 });
      }
    }

    if (request.method === "GET" && url.pathname === "/api/virtual-shows") {
      const region = url.searchParams.get("region") ?? "jp";
      const scope = url.searchParams.get("scope") === "archive" ? "archive" : "active";
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      const pageSize = Math.min(40, Math.max(1, Number(url.searchParams.get("pageSize")) || 16));

      if (!isSupportedVirtualShowRegion(region)) {
        return json({ error: "Unsupported region." }, { status: 400 });
      }

      try {
        const shows = await getVirtualShows(region, scope, page, pageSize);
        return json(shows, {
          headers: {
            "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
          },
        });
      } catch (error) {
        console.error("Failed to load virtual shows:", error);
        return json({ error: "Virtual shows are temporarily unavailable." }, { status: 502 });
      }
    }

    const virtualShowMatch = url.pathname.match(/^\/api\/virtual-shows\/(\d+)$/);
    if (request.method === "GET" && virtualShowMatch) {
      const region = url.searchParams.get("region") ?? "jp";
      if (!isSupportedVirtualShowRegion(region)) {
        return json({ error: "Unsupported region." }, { status: 400 });
      }

      try {
        const show = await getVirtualShowDetail(region, Number(virtualShowMatch[1]));
        if (!show) return json({ error: "Virtual show not found." }, { status: 404 });

        return json(show, {
          headers: {
            "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
          },
        });
      } catch (error) {
        console.error("Failed to load virtual show details:", error);
        return json({ error: "Virtual show details are temporarily unavailable." }, { status: 502 });
      }
    }

    return json({ error: "Not found." }, { status: 404 });
  },
});

console.log(`API listening on http://localhost:${port}`);
