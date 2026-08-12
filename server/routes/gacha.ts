import { withRegion } from "../middleware/region";
import { getLatestGachas } from "../services/gacha";
import { json } from "../utils/http";

export const handleLatestGachas = (url: URL) =>
  withRegion(url, async (region) => {
    try {
      const gachas = await getLatestGachas(region);
      return json(gachas, {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
      });
    } catch (error) {
      console.error("Failed to load gachas:", error);
      return json(
        { error: "The latest gachas are temporarily unavailable." },
        { status: 502 },
      );
    }
  });
