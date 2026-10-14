# Oceanpower content manager setup

The pilot content manager uses the existing Astro website, the existing Node API process and MySQL 8 or newer. It supports one shared administrator account and editable Chinese and English content. Spanish and French retain their current static content.

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

Copy `.env.example` to `.env` and set these values:

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=oceanpower_cms
MYSQL_USER=oceanpower_cms
MYSQL_PASSWORD=YOUR_LOCAL_PASSWORD
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=A_LOCAL_PASSWORD_WITH_8_OR_MORE_CHARACTERS
```

`.env` is ignored by Git. Never place real credentials in source files, screenshots or chat messages.

## 3. Create the tables and starter content

```powershell
npm run cms:migrate
npm run cms:seed
```

The administrator username and password are read only from `CMS_ADMIN_USERNAME` and `CMS_ADMIN_PASSWORD` in `.env`; no administrator password is stored in MySQL. Restart the local website after changing either value. Running `cms:seed` creates draft copies of the current homepage, About, contact, business, product and catalogue content. Review drafts before changing their status to Published.

## 4. Run the pilot

```powershell
npm start
```

`npm start` builds the current source and launches the production-style local server so the CMS API works on the same origin. Open `http://localhost:8000/admin/`. Published database content overlays the current Chinese and English website. If MySQL is stopped or unavailable, the existing static website remains visible.

Uploaded JPG, PNG, WebP, GIF and PDF files are stored in the ignored local `uploads/` folder. Their metadata is stored in MySQL. Back up both the database and this folder.

## Current boundaries

- The pilot uses one shared account, so it cannot identify which staff member made a change.
- Saving Published content makes it available immediately; there is no approval workflow.
- Deleting content is permanent after the browser confirmation.
- Uploaded files remain on this computer. Online hosting will need persistent file storage or object storage.
- Cloudflare Pages cannot connect directly to a normal MySQL server. Online deployment will require a Node-capable backend host and a reachable managed MySQL database.
