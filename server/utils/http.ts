export const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });

export const notFound = () => json({ error: "Not found." }, { status: 404 });

export const methodNotAllowed = () =>
  json(
    { error: "Method not allowed." },
    {
      status: 405,
      headers: { Allow: "GET" },
    },
  );
