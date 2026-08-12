import { handleLatestGachas } from "./routes/gacha";
import { handleHealth } from "./routes/health";
import { handleMusic } from "./routes/music";
import { handleTitles } from "./routes/titles";
import { handleVirtualShowDetail, handleVirtualShows } from "./routes/virtual-shows";
import { methodNotAllowed, notFound } from "./utils/http";

type RouteHandler = (url: URL) => Response | Promise<Response>;

const getRoutes = new Map<string, RouteHandler>([
  ["/api/health", () => handleHealth()],
  ["/api/gachas/latest", handleLatestGachas],
  ["/api/music", handleMusic],
  ["/api/titles", handleTitles],
  ["/api/virtual-shows", handleVirtualShows],
]);

export const routeRequest = (request: Request) => {
  const url = new URL(request.url);
  const virtualShowMatch = url.pathname.match(/^\/api\/virtual-shows\/(\d+)$/);
  const isKnownRoute = getRoutes.has(url.pathname) || Boolean(virtualShowMatch);
  if (request.method !== "GET") return isKnownRoute ? methodNotAllowed() : notFound();

  const route = getRoutes.get(url.pathname);
  if (route) return route(url);

  if (virtualShowMatch) {
    return handleVirtualShowDetail(url, Number(virtualShowMatch[1]));
  }

  return notFound();
};
