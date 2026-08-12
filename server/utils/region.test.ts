import { describe, expect, test } from "bun:test";
import {
  getAssetOrigin,
  getDatabaseRoot,
  getPublicAssetRoot,
  normalizeRegion,
  REGIONS,
} from "./region";

describe("region helpers", () => {
  test("defaults a missing region parameter to JP", () => {
    expect(normalizeRegion(null)).toBe("jp");
  });

  test("accepts shared regions, aliases TW to TC, and rejects unknown values", () => {
    for (const region of REGIONS) {
      expect(normalizeRegion(region)).toBe(region);
    }
    expect(normalizeRegion("tw")).toBe("tc");
    expect(normalizeRegion("unknown")).toBeNull();
  });

  test("builds regional upstream and public asset roots", () => {
    expect(getDatabaseRoot("jp")).toBe(
      "https://sekai-world.github.io/sekai-master-db-diff",
    );
    expect(getDatabaseRoot("tc")).toBe(
      "https://sekai-world.github.io/sekai-master-db-tc-diff",
    );
    expect(getAssetOrigin("en")).toBe("https://storage.sekai.best/sekai-en-assets");
    expect(getPublicAssetRoot("kr")).toBe("/storage/sekai-kr-assets");
  });
});
