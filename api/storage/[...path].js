export default async function handler(req, res) {
  const path = req.query.path.join("/");

  const url = `https://storage.sekai.best/${path}`;

  const response = await fetch(url, {
    headers: {
      referer: "https://storage.sekai.best/"
    }
  });

  const data = await response.arrayBuffer();

  res.setHeader("Content-Type", response.headers.get("content-type") || "");
  res.status(response.status).send(Buffer.from(data));
}
