export default async function handler(req, res) {
  const pathParam = req.query.path;

  const url = `https://sekai-world.github.io/${path}`;

  const response = await fetch(url, {
    headers: {
    }
  });

  const data = await response.arrayBuffer();

  res.setHeader(
    "Content-Type",
    response.headers.get("content-type") || ""
  );

  res.status(response.status).send(Buffer.from(data));
}
