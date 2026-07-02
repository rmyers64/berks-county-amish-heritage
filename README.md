# Berks County Amish Heritage

TinaDocs-based archive site for Berks County Amish Heritage.

Initial structure:

- Books
- Articles and Stories
- Source Documents

The first hosted source document is `public/source-documents/40819_NSH--Interior--PROOF5.pdf`.

## Development

```bash
pnpm install
pnpm run dev
```

## Static production build

```bash
EXPORT_MODE=static UNOPTIMIZED_IMAGES=true pnpm exec tinacms build --content=local --skip-cloud-checks -c "next build"
```

The static export is written to `out/` and can be served by Caddy/Nginx.
