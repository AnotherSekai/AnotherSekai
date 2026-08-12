import { json } from "../utils/http";
import { normalizeRegion, type Region } from "../utils/region";

type RegionHandler = (region: Region) => Response | Promise<Response>;

export const withRegion = (url: URL, handler: RegionHandler) => {
  const region = normalizeRegion(url.searchParams.get("region"));
  return region
    ? handler(region)
    : json({ error: "Unsupported region." }, { status: 400 });
};
