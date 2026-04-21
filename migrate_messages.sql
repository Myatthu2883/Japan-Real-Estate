-- ============================================================
-- Migration: Replace old messages table with full-featured one
-- Run this ONCE in your MySQL database:
--   mysql -u root -p japan_real_estate < migrate_messages.sql
-- ============================================================

-- Step 1: Backup the old table (safe to drop after confirming)
CREATE TABLE IF NOT EXISTS messages_old AS SELECT * FROM messages;

-- Step 2: Drop old table
DROP TABLE IF EXISTS messages;

-- Step 3: Create new messages table matching the app's Message type
CREATE TABLE messages (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,  -- localStorage msg id e.g. "msg_uuid"
  thread_id   VARCHAR(64)  NOT NULL,              -- groups all messages in a conversation
  type        ENUM('contact','inquiry','direct','reply') NOT NULL DEFAULT 'contact',

  from_id     VARCHAR(64)  NOT NULL DEFAULT '',
  from_role   ENUM('admin','agent','user') NOT NULL DEFAULT 'user',
  from_name   VARCHAR(100) NOT NULL DEFAULT '',
  from_email  VARCHAR(255) NOT NULL DEFAULT '',

  to_id       VARCHAR(64)  NOT NULL DEFAULT '',
  to_role     ENUM('admin','agent','user') NOT NULL DEFAULT 'user',
  to_name     VARCHAR(100) NOT NULL DEFAULT '',
  to_email    VARCHAR(255) NOT NULL DEFAULT '',

  property_id VARCHAR(64)  NULL,
  subject     VARCHAR(255) NULL,
  message     TEXT         NOT NULL,

  status      ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_thread   (thread_id),
  INDEX idx_to_id    (to_id),
  INDEX idx_from_id  (from_id),
  INDEX idx_type     (type),
  INDEX idx_status   (status),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 4: Migrate old messages that have matching columns (best-effort)
-- This maps the old schema to the new one for contact/inquiry types.
INSERT IGNORE INTO messages
  (id, thread_id, type, from_id, from_role, from_name, from_email,
   to_id, to_role, to_name, to_email, property_id, message, status, created_at)
SELECT
  CONCAT('legacy_', id),
  CONCAT('thread_legacy_', id),
  type,
  IFNULL(CAST(from_user_id AS CHAR), ''),
  'user',
  from_name,
  from_email,
  IFNULL(CAST(agent_id AS CHAR), ''),
  'agent',
  '',
  '',
  CAST(property_id AS CHAR),
  message,
  status,
  created_at
FROM messages_old
WHERE from_name IS NOT NULL AND from_name != '';

SELECT CONCAT('Migration complete. Migrated ', COUNT(*), ' legacy messages.') AS result
FROM messages WHERE id LIKE 'legacy_%';
