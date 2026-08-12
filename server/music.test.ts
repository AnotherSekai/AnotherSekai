import { describe, expect, test } from "bun:test";
import { getMusicAudioUrl } from "./music";

describe("getMusicAudioUrl", () => {
  test("uses the vocal asset bundle instead of deriving a path from the music id", () => {
    expect(getMusicAudioUrl(18, "0018_02", "en")).toBe(
      "/storage/sekai-jp-assets/music/short/0018_02/0018_02_short.mp3",
    );
  });

  test("uses the requested asset region for server-exclusive music", () => {
    expect(getMusicAudioUrl(371, "vs_0371_01", "en")).toBe(
      "/storage/sekai-en-assets/music/short/vs_0371_01/vs_0371_01_short.mp3",
    );
    expect(getMusicAudioUrl(11012, "11012_01", "tc")).toBe(
      "/storage/sekai-tc-assets/music/short/11012_01/11012_01_short.mp3",
    );
  });

  test("returns null when upstream has no playable vocal", () => {
    expect(getMusicAudioUrl(1, undefined, "jp")).toBeNull();
  });
});
