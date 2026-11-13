# Oceanpower content manager setup

The pilot content manager uses the existing Astro website, the existing Node API process and MySQL 8 or newer. It supports one shared administrator account and editable Chinese and English content. Spanish and French website routes remain published using their translated source content; CMS edits currently cover Chinese and English.

## 1. Install and prepare MySQL

Install MySQL Server locally, then create a database and a restricted application user. Replace the placeholders locally; do not commit passwords.

```sql
CREATE DATABASE oceanpower_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'oceanpower_cms'@'localhost' IDENTIFIED BY 'YOUR_LOCAL_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON oceanpower_cms.* TO 'oceanpower_cms'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Configure the local environment

Create a local `.env` file and set these values:

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=oceanpower_cms
MYSQL_USER=oceanpower_cms
MYSQL_PASSWORD=YOUR_LOCAL_PASSWORD
MYSQL_SSL_MODE=DISABLED
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=A_LOCAL_PASSWORD_WITH_8_OR_MORE_CHARACTERS
```

For a hosted MySQL service that requires TLS, set `MYSQL_SSL_MODE=REQUIRED`.
This encrypts the connection but does not verify a private certificate authority.
For verified TLS, download the provider CA certificate outside Git, set
`MYSQL_SSL_MODE=VERIFY_IDENTITY`, and point `MYSQL_SSL_CA_FILE` to that file.
Never commit database passwords or provider certificates copied from a private console.

`.env` is ignored by Git. Never place real credentials in source files, screenshots or chat messages.

## 3. Create the tables and starter content

```powershell
npm run cms:migrate
npm run cms:seed
```

The administrator username and password are read from `CMS_ADMIN_USERNAME` and `CMS_ADMIN_PASSWORD` in `.env`. Existing `CMS_BOOTSTRAP_USERNAME` and `CMS_BOOTSTRAP_PASSWORD` variables are also accepted as fallbacks; the `CMS_ADMIN_*` names take precedence. No administrator password is stored in MySQL. Restart the local website after changing either value. Running `cms:seed` creates draft copies of the current homepage, About, contact, business, product and catalogue content. Review drafts before changing their status to Published.

## 4. Run the pilot

```powershell
npm start
```

`npm start` builds the current source and launches the production-style local server so the CMS API works on the same origin. Open `http://localhost:8000/admin/`. Published database content overlays the current Chinese and English website. If MySQL is stopped or unavailable, the existing static website remains visible.

Uploaded JPG, PNG, WebP, GIF, PDF, MP4 and WebM files are stored in the ignored local `uploads/` folder. Their metadata is stored in MySQL. Back up both the database and this folder. Images and PDFs are limited to 25 MB; videos are limited to 80 MB. The admin can attach up to 12 additional images and one video to a content entry, choose previously uploaded files, preview bilingual text, and restore earlier saved revisions. Run `npm run cms:migrate` again after updating this code so the revision table exists.

On a published business entry, the featured image replaces that business's card image and the image at the top of its detail page in Chinese and English. Gallery images, video and documents appear in a separate media section. Draft uploads do not appear on public pages.

The admin still has a manual **更新聊天机器人知识** control. It writes a snapshot of *published CMS products only* to `CMS_UPLOAD_DIR/published-product-chat.json` (or `uploads/published-product-chat.json` locally). The current public website does not display a chatbot, and `/api/chat` is disabled by default. The snapshot is for the retained legacy assistant only; it does not update Dify or the Haichuan PDF RAG index. Keep `ENABLE_LEGACY_CHAT` unset for this website release.

## Current boundaries

- The pilot uses one shared account, so it cannot identify which staff member made a change.
- Saving Published content makes it available immediately; there is no approval workflow.
- Earlier saved versions of an existing entry can be restored in the admin. Deleting an entry is still permanent after the browser confirmation.
- The content preview shows the edited Chinese and English text in the admin; it is not an exact website layout preview. New files uploaded before an entry is saved remain in the media library even if the edit is abandoned.
- Uploaded files remain on this computer. Online hosting will need persistent file storage or object storage.
- Cloudflare Pages cannot connect directly to a normal MySQL server. Online deployment will require a Node-capable backend host and a reachable managed MySQL database.

## Render pilot deployment

Create a Render **Web Service** from this repository and use:

```text
Build command: npm ci && npm run build && npm prune --omit=dev
Start command: node tools/preview.mjs
Health check path: /api/health/
```

Set `HOST=0.0.0.0`; Render supplies `PORT` automatically. Add the `MYSQL_*`,
`CMS_ADMIN_*`, `SITE_URL` and `PUBLIC_INDEXABLE` environment variables in the
Render dashboard. Do not copy `.env` into Git. Start with
`PUBLIC_INDEXABLE=false` while the pilot is being reviewed.
For the current Render preview, set `SITE_URL=https://oceanpower-vfhv.onrender.com`.
If an old localhost value remains, the build uses Render's `RENDER_EXTERNAL_URL`
for canonical and sitemap links. Set `SITE_URL` explicitly when the service
later moves to an approved custom domain.

The current `uploads/` directory is local filesystem storage. Render instances
can replace that filesystem during deploys, so uploaded images and documents
need a persistent disk or object-storage integration before staff rely on them.
To use a Render persistent disk, attach the disk (for example at `/var/data`)
and set `CMS_UPLOAD_DIR=/var/data/uploads`. A disk limits the service to one
instance and removes zero-downtime deploys. Files uploaded before the disk was
attached are already lost; re-upload them, because MySQL keeps only metadata.

Additional Render notes:

- Do not set `NODE_ENV=production` for the build. `npm ci` would skip the
  development dependencies that `npm run build` needs. The admin cookie is
  marked `Secure` automatically when Render forwards an HTTPS request.
- The final `npm prune --omit=dev` removes build tools and the disabled legacy
  RAG dependencies from the running service. Start with `node tools/preview.mjs`,
  not `npm start`: the latter rebuilds and needs those development dependencies.
- Set `NODE_VERSION=22.12.0` or newer to match `package.json` `engines`.
- `MYSQL_SSL_MODE=REQUIRED` encrypts the connection but does not verify the
  server certificate. For verified TLS, upload the Aiven CA certificate as a
  Render **Secret File** (for example `aiven-ca.pem`, available at
  `/etc/secrets/aiven-ca.pem`), then set
  `MYSQL_SSL_CA_FILE=/etc/secrets/aiven-ca.pem` and
  `MYSQL_SSL_MODE=VERIFY_IDENTITY`.
- Run `npm run cms:migrate` once against Aiven from a trusted computer before
  the first deploy. The web service does not create tables automatically.
- The site stays visible when MySQL is unavailable. CMS overlays and the admin
  page return errors until the database is reachable again.
