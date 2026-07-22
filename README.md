# Berks County Amish Heritage

TinaDocs-based archive site for Berks County Amish Heritage.

The public site is currently an empty archive shell with sections for:

- Books
- Articles and Stories
- Source Documents

No archive books, articles, source documents, or downloads are published yet.

## Development

```bash
pnpm install
pnpm run dev
```

## Static production build

```bash
docker build -f Dockerfile.static -t berks-county-amish-heritage-static .
docker run --rm -p 8080:80 berks-county-amish-heritage-static
```

The image serves the export with Caddy on port 80 and redirects `/` to the
documentation homepage at `/docs/`. Tina editing is disabled for this
deployment. The Docker build normalizes bundled API schemas into static files,
skips the unused Tina admin bundle, omits the generated `/admin` directory, and
excludes runtime-only API routes that cannot run from static files. The page
copy control remains available without its server-dependent export actions.
The image build also checks every generated internal link and fails if a target
is missing from the static export.

Use Node.js 20 and pnpm 10 for this production build.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the production server workflow,
verification steps, logs, and rollback procedure.
