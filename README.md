<img src="https://github.com/AnotherSekai.png" alt="Another Sekai icon" width="128" height="128" align="right">

<h1>Another Sekai</h1>

🌟Another [Sekai Viewer](https://sekai.best/) client in your browser!

## Usage for everyone

AnotherSekai is using Bun, so make sure you have it before entering sekai Here are [official Bun installation guide](https://bun.sh/docs/installation)

Okay so you have bun now.

Download and extract a prebuilt bundle from [releases](https://github.com/AnotherSekai/AnotherSekai/releases), then run:

```sh
bun server.js
```

Finally, open AnotherSekai in your browser(default is `http://localhost:9000`). Wonderhoy!

## Development

This project uses [Bun](https://bun.sh/) for dependency management and scripts.

```sh
bun install --frozen-lockfile
bun run dev
```

Production builds also run entirely on Bun:

```sh
bun run build
```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
Third-party assets remain subject to their respective rights and notices; see
[the image asset notice](public/images/README.md).
