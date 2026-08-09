export type VirtualShowStatus = "live" | "upcoming" | "ended";
export type VirtualShowScope = "active" | "archive";

export interface VirtualShowSummary {
  id: number;
  name: string;
  type: string;
  startAt: number;
  endAt: number;
  nextScheduleAt: number | null;
  status: VirtualShowStatus;
  scheduleCount: number;
  castCount: number;
  cardImageUrl: string;
  bannerUrl: string;
}

export interface VirtualShowDetail extends VirtualShowSummary {
  platform: string;
  logoUrl: string;
  schedules: Array<{
    id: number;
    startAt: number;
    endAt: number;
    isAfterEvent: boolean;
  }>;
  recurringSchedules: Array<{
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  cast: Array<{
    id: number;
    name: string;
    shortName: string;
    color: string;
  }>;
  setlist: Array<{
    id: number;
    sequence: number;
    type: string;
    title: string | null;
    jacketUrl: string | null;
  }>;
  rewardCount: number;
}

export interface VirtualShowPage {
  items: VirtualShowSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

const getErrorMessage = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || fallback;
};

export const fetchVirtualShows = async (
  region: string,
  scope: VirtualShowScope,
  page = 1,
): Promise<VirtualShowPage> => {
  const params = new URLSearchParams({
    region,
    scope,
    page: String(page),
    pageSize: "16",
  });
  const response = await fetch(`/api/virtual-shows?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Virtual shows could not be loaded."));
  }

  return response.json() as Promise<VirtualShowPage>;
};

export const fetchVirtualShowDetail = async (
  region: string,
  id: number,
): Promise<VirtualShowDetail> => {
  const params = new URLSearchParams({ region });
  const response = await fetch(`/api/virtual-shows/${id}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Virtual show details could not be loaded."));
  }

  return response.json() as Promise<VirtualShowDetail>;
};
