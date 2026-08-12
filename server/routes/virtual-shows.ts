import { withRegion } from "../middleware/region";
import { getVirtualShowDetail, getVirtualShows } from "../services/virtual-shows";
import { json } from "../utils/http";

export const handleVirtualShows = (url: URL) => {
  const scope = url.searchParams.get("scope") === "archive" ? "archive" : "active";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(40, Math.max(1, Number(url.searchParams.get("pageSize")) || 16));

  return withRegion(url, async (region) => {
    try {
      const shows = await getVirtualShows(region, scope, page, pageSize);
      return json(shows, {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
        },
      });
    } catch (error) {
      console.error("Failed to load virtual shows:", error);
      return json(
        { error: "Virtual shows are temporarily unavailable." },
        { status: 502 },
      );
    }
  });
};

export const handleVirtualShowDetail = (url: URL, id: number) =>
  withRegion(url, async (region) => {
    try {
      const show = await getVirtualShowDetail(region, id);
      if (!show) return json({ error: "Virtual show not found." }, { status: 404 });

      return json(show, {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
        },
      });
    } catch (error) {
      console.error("Failed to load virtual show details:", error);
      return json(
        { error: "Virtual show details are temporarily unavailable." },
        { status: 502 },
      );
    }
  });
