import { fileURLToPath } from "node:url";
import { routeRequest } from "./router";

const frontendDirectory = fileURLToPath(new URL("../dist/frontend/", import.meta.url));
const frontendIndex = Bun.file(`${frontendDirectory}/index.html`);

interface ProxyTarget {
  baseUrl: string;
  referer?: string;
}

const proxyTargets = new Map<string, ProxyTarget>([
  ["/sekai-world", { baseUrl: "https://sekai-world.github.io" }],
  ["/storage", { baseUrl: "https://storage.sekai.best", referer: "https://storage.sekai.best/" }],
]);

function staticFileFor(pathname: string) {
  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const segments = decodedPathname.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === ".." || segment.includes("\0"))) {
    return null;
  }

  const relativePath = segments.join("/");
  return Bun.file(`${frontendDirectory}/${relativePath || "index.html"}`);
}

async function serveFrontend(request: Request, url: URL): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const requestedFile = staticFileFor(url.pathname);
  if (requestedFile && (await requestedFile.exists())) return new Response(requestedFile);

  // Let browser navigations reach Vue Router, while keeping missing static assets as 404s.
  if (!url.pathname.includes(".")) {
    if (await frontendIndex.exists()) return new Response(frontendIndex);
  }

  return new Response("Not Found", { status: 404 });
}

async function proxyRequest(request: Request, url: URL, prefix: string, target: ProxyTarget): Promise<Response> {
  const targetUrl = new URL(`${url.pathname.slice(prefix.length)}${url.search}`, target.baseUrl);
  const headers = new Headers(request.headers);
  headers.delete("host");
  if (target.referer) headers.set("referer", target.referer);

  return fetch(targetUrl, {
    method: request.method,
    headers,
    redirect: "follow",
    decompress: false,
  });
}

export async function handleApplicationRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return routeRequest(request);
  }

  for (const [prefix, target] of proxyTargets) {
    if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
      return proxyRequest(request, url, prefix, target);
    }
  }

  return serveFrontend(request, url);
}
