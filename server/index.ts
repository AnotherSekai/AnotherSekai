import { handleApplicationRequest } from "./app";

const port = Number(process.env.API_PORT ?? process.env.GACHA_API_PORT ?? 9000);

const server = Bun.serve({
  port,
  fetch: handleApplicationRequest,
});

console.log(`Another SEKAI listening on http://localhost:${server.port}`);
