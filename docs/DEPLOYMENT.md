# Production deployment

## Purpose

Build, deploy, verify, troubleshoot, and roll back the Berks County Amish
Heritage static site on the shared Fisher Book Hetzner server.

## Access and production layout

- Repository: `rmyers64/berks-county-amish-heritage`
- Server: `178.156.194.35`
- SSH: use your own named key and server account; do not share another person's
  private key.
- Public site container: `berks-county-amish-heritage-static`
- Reverse proxy container: `caddy`
- Docker network: `thefisherbook`
- Site root: `/opt/berks-county-amish-heritage`
- Fisher Book application container: `thefisherbook-app`

The Berks site shares the host and reverse proxy with The Fisher Book. Build
locally so a production build cannot consume the live server's resources.

## Build and verify locally

Use Node.js 20 and pnpm 10.

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm exec pagefind --site out --output-path out/_pagefind
pnpm run check:static-links
```

The build must finish with the static-link check passing. Confirm that `out`
does not contain an `admin` directory or unpublished archive material.

Create the upload artifact:

```powershell
tar --exclude='./admin' -czf berks-static-out.tar.gz -C out .
```

## Deploy

Use a unique release name so the currently running release remains available
for rollback.

```powershell
scp berks-static-out.tar.gz <user>@178.156.194.35:/tmp/
scp Caddyfile.static <user>@178.156.194.35:/tmp/Caddyfile.berks
ssh <user>@178.156.194.35
```

On the server, set `<release>` to a unique value such as
`site-20260722-1700`, then run:

```bash
sudo mkdir -p /opt/berks-county-amish-heritage/<release>
sudo tar -xzf /tmp/berks-static-out.tar.gz \
  -C /opt/berks-county-amish-heritage/<release>
sudo cp /tmp/Caddyfile.berks \
  /opt/berks-county-amish-heritage/Caddyfile.static
sudo docker run --rm \
  -v /opt/berks-county-amish-heritage/Caddyfile.static:/etc/caddy/Caddyfile:ro \
  caddy:2.10-alpine caddy validate --config /etc/caddy/Caddyfile
```

Start and verify a candidate before switching production:

```bash
sudo docker run -d --name berks-static-next \
  --network thefisherbook --restart unless-stopped \
  -v /opt/berks-county-amish-heritage/<release>:/usr/share/caddy:ro \
  -v /opt/berks-county-amish-heritage/Caddyfile.static:/etc/caddy/Caddyfile:ro \
  caddy:2.10-alpine
sudo docker exec berks-static-next wget -qO- http://127.0.0.1/docs/ >/dev/null
```

When the candidate passes, retain the old container as the rollback copy and
promote the candidate:

```bash
sudo docker stop berks-county-amish-heritage-static
sudo docker rename berks-county-amish-heritage-static \
  berks-county-amish-heritage-static-rollback-<timestamp>
sudo docker rename berks-static-next berks-county-amish-heritage-static
sudo docker restart caddy
```

Do not remove the rollback container until production verification is complete.

## Production verification

```bash
curl -I https://berkscountyamishheritage.com/
curl -I https://www.berkscountyamishheritage.com/
curl -I https://berkscountyamishheritage.com/docs/
curl -I https://thefisherbook.com/
```

Both Berks domains must redirect `/` to `/docs/`; the documentation homepage
must return `200`. The Fisher Book must remain healthy. Also click the homepage
cards and logo in desktop and mobile Chrome before closing the deployment.

## Logs and troubleshooting

```bash
sudo docker ps -a
sudo docker logs --tail 200 berks-county-amish-heritage-static
sudo docker logs --tail 200 caddy
sudo docker logs --tail 200 thefisherbook-app
sudo docker inspect berks-county-amish-heritage-static
```

## Rollback

Stop and rename the failed container, restore the retained rollback container
to `berks-county-amish-heritage-static`, restart it, restart `caddy`, and repeat
the production verification checks. Never delete a release or rollback
container until the replacement has been verified.
