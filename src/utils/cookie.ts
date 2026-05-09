export const getCookie = (name: string, defaultVal: string): string => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match && match[2]) return match[2];
  return defaultVal;
};

export const setCookie = (name: string, value: string, days: number = 30): void => {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
};

export const delCookie = (name: string): void => {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const getRegion = (): string => {
  return getCookie("sekai-region", "jp");
};
