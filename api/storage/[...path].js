export default async function handler(req, res) {
  const pathParam = req.query.path;
  console.log(req)
  // normalize to array safely
  const pathArray = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === "string"
      ? [pathParam]
      : [];

  const path = pathArray.join("/");

  const url = `https://storage.sekai.best/${path}`;

  const response = await fetch(url, {
    headers: {
      referer: "https://storage.sekai.best/"
    }
  });

  const data = await response.arrayBuffer();

  res.setHeader(
    "Content-Type",
    response.headers.get("content-type") || ""
  );

  res.status(response.status).send(Buffer.from(data));
}
