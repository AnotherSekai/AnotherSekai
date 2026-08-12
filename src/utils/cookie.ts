export const getCookie = (name: string, defaultVal: string): string => {
  if (typeof document === "undefined") return defaultVal;
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));
  if (!cookie) return defaultVal;

  try {
    return decodeURIComponent(cookie.slice(encodedName.length));
  } catch {
    return defaultVal;
  }
};

const getExpiry = (days: number) => {
  const safeDays = Number.isFinite(days) ? days : 30;
  const date = new Date(Date.now() + safeDays * 86_400_000);
  return date.toUTCString();
};

export const setCookie = (name: string, value: string, days = 30): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${getExpiry(days)}; path=/; SameSite=Lax`;
};

export const delCookie = (name: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

const regions = ["en", "jp", "cn", "tc", "kr"] as const;
export type Region = (typeof regions)[number];

export const getRegion = (): Region => {
  const region = getCookie("sekai-region", "jp");
  return regions.includes(region as Region) ? (region as Region) : "jp";
};
