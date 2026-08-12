import { routeRequest } from "./router";

const port = Number(process.env.API_PORT ?? process.env.GACHA_API_PORT ?? 9000);

const server = Bun.serve({
  port,
  fetch: routeRequest,
});

console.log(`API listening on http://localhost:${server.port}`);
