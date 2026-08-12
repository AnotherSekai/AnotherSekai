import { withRegion } from "../middleware/region";
import { getMusicCatalog } from "../services/music";
import { json } from "../utils/http";

export const handleMusic = (url: URL) =>
  withRegion(url, async (region) => {
    try {
      const music = await getMusicCatalog(region);
      return json(music, {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
        },
      });
    } catch (error) {
      console.error("Failed to load music:", error);
      return json({ error: "Music is temporarily unavailable." }, { status: 502 });
    }
  });
