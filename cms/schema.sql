CREATE TABLE IF NOT EXISTS cms_admin_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  csrf_token CHAR(43) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX cms_admin_sessions_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cms_files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  byte_size INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cms_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('page','business','product','news','document') NOT NULL,
  slug VARCHAR(160) NOT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  featured_image_id CHAR(36) NULL,
  attachment_id CHAR(36) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY cms_entries_kind_slug_uq (kind, slug),
  CONSTRAINT cms_entries_image_fk FOREIGN KEY (featured_image_id) REFERENCES cms_files(id) ON DELETE SET NULL,
  CONSTRAINT cms_entries_attachment_fk FOREIGN KEY (attachment_id) REFERENCES cms_files(id) ON DELETE SET NULL,
  INDEX cms_entries_public_idx (kind, status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cms_translations (
  entry_id BIGINT UNSIGNED NOT NULL,
  locale ENUM('en','zh') NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  body LONGTEXT NOT NULL,
  PRIMARY KEY (entry_id, locale),
  CONSTRAINT cms_translations_entry_fk FOREIGN KEY (entry_id) REFERENCES cms_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cms_product_specs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entry_id BIGINT UNSIGNED NOT NULL,
  label_en VARCHAR(180) NOT NULL,
  label_zh VARCHAR(180) NOT NULL,
  value_text VARCHAR(255) NOT NULL,
  unit VARCHAR(40) NOT NULL DEFAULT '',
  source_reference VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT cms_specs_entry_fk FOREIGN KEY (entry_id) REFERENCES cms_entries(id) ON DELETE CASCADE,
  INDEX cms_specs_order_idx (entry_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
