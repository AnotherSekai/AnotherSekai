import { withRegion } from "../middleware/region";
import { getTitleCatalog } from "../services/titles";
import { json } from "../utils/http";

export const handleTitles = (url: URL) =>
  withRegion(url, async (region) => {
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
  });
