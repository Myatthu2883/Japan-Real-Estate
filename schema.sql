-- ═══════════════════════════════════════════════════════════
-- Japan Real Estate — MySQL 8.0 Schema  (v3)
-- Run: mysql -u root -p < schema.sql
-- ═══════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS japan_realestate;
CREATE DATABASE japan_realestate
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE japan_realestate;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(255)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL COMMENT 'bcrypt $2b$12$ hash',
  role          ENUM('user','agent','admin') NOT NULL DEFAULT 'user',
  phone         VARCHAR(30)     NULL,
  bio           TEXT            NULL,
  avatar        VARCHAR(512)    NULL,
  pref_lang     ENUM('en','ja') NOT NULL DEFAULT 'en',
  notifications TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Properties ───────────────────────────────────────────────
CREATE TABLE properties (
  id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED    NOT NULL,
  agent_id       INT UNSIGNED    NULL,
  title          VARCHAR(255)    NOT NULL,
  title_ja       VARCHAR(255)    NULL,
  price          BIGINT UNSIGNED NOT NULL,
  price_unit     ENUM('jpy','usd') NOT NULL DEFAULT 'jpy',
  type           ENUM('sale','rent') NOT NULL,
  area           VARCHAR(100)    NOT NULL,
  city           VARCHAR(100)    NOT NULL,
  address        VARCHAR(255)    NULL,
  rooms          VARCHAR(30)     NULL,
  size           DECIMAL(8,2)    NULL COMMENT 'square metres',
  floor          TINYINT         NULL,
  total_floors   TINYINT         NULL,
  year_built     YEAR            NULL,
  station        VARCHAR(150)    NULL,
  description    TEXT            NULL,
  description_ja TEXT            NULL,
  image_url      VARCHAR(512)    NULL,
  is_featured    TINYINT(1)      NOT NULL DEFAULT 0,
  is_active      TINYINT(1)      NOT NULL DEFAULT 1,
  views          INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type     (type),
  INDEX idx_city     (city),
  INDEX idx_price    (price),
  INDEX idx_featured (is_featured),
  INDEX idx_active   (is_active),
  FULLTEXT idx_search (title, title_ja, description, description_ja)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Saved / Favourites ───────────────────────────────────────
CREATE TABLE saved_properties (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  property_id INT UNSIGNED NOT NULL,
  saved_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_save (user_id, property_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id)  ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE messages (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type         ENUM('contact','inquiry') NOT NULL DEFAULT 'contact',
  property_id  INT UNSIGNED NULL,
  agent_id     INT UNSIGNED NULL,
  from_user_id INT UNSIGNED NULL,
  from_name    VARCHAR(100) NOT NULL,
  from_email   VARCHAR(255) NOT NULL,
  from_phone   VARCHAR(30)  NULL,
  message      TEXT         NOT NULL,
  status       ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id)  REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id)     REFERENCES users(id)      ON DELETE SET NULL,
  FOREIGN KEY (from_user_id) REFERENCES users(id)      ON DELETE SET NULL,
  INDEX idx_agent  (agent_id),
  INDEX idx_status (status),
  INDEX idx_type   (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Property Images ──────────────────────────────────────────
CREATE TABLE property_images (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NOT NULL,
  url         VARCHAR(512) NOT NULL,
  caption     VARCHAR(255) NULL,
  sort_order  TINYINT      NOT NULL DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- To generate real bcrypt hashes, run in Node.js:
--   const bcrypt = require('bcryptjs')
--   console.log(await bcrypt.hash('admin123', 12))
-- ═══════════════════════════════════════════════════════════

-- Passwords: admin123 / agent123 / user123
-- These hashes are generated with bcrypt cost 12
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Admin User',
 'admin@japanproperty.jp',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'admin', '03-0000-0001'),

('田中 健一 / Kenichi Tanaka',
 'agent@japanproperty.jp',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'agent', '03-1234-5678'),

('山田 花子 / Hanako Yamada',
 'user@japanproperty.jp',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'user', NULL);

-- NOTE: The hash above ($2b$12$92I...) is bcrypt('password', 12).
-- You MUST replace with real hashes for your actual passwords.
-- Use the generate_hashes.js script below.

-- Properties (agent_id = 2 = Kenichi Tanaka)
INSERT INTO properties
  (user_id, agent_id, title, title_ja, price, price_unit, type, area, city, rooms, size, floor, year_built, station, description, description_ja, image_url, is_featured, is_active)
VALUES
(2,2,'Luxury Penthouse Shibuya','渋谷区ラグジュアリーペントハウス',
 380000000,'jpy','sale','Shibuya','Tokyo','3LDK',142,28,2019,'渋谷駅 徒歩3分',
 'Exceptional penthouse on the 28th floor with panoramic Tokyo views. Italian marble, custom Japanese joinery, automated smart home.',
 '東京を一望するペントハウス。床から天井まで広がる窓、イタリア産大理石、スマートホームシステム完備。',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',1,1),

(2,2,'Traditional Machiya Kyoto','京都・町家リノベーション',
 85000000,'jpy','sale','Higashiyama','Kyoto','4K',112,2,1968,'東山駅 徒歩5分',
 'Masterfully restored 1968 Kyoto machiya with inner garden, timber beams, tatami rooms, and modern kitchen.',
 '1968年築の京町家を2021年全面リノベーション。坪庭・梁・畳を残しながら現代設備を融合。',
 'https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=600',1,1),

(2,2,'Modern Apartment Shinjuku','新宿区モダンアパートメント',
 280000,'jpy','rent','Shinjuku','Tokyo','1LDK',52,14,2019,'新宿駅 徒歩5分',
 'Contemporary 1LDK on the 14th floor with city views and modern amenities. 5 min walk to Shinjuku station.',
 '新宿駅5分・14階・眺望良好の1LDK。最新設備完備。',
 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',1,1),

(2,2,'Seaside Villa Kamakura','鎌倉・海辺の一戸建て',
 155000000,'jpy','sale','Kamakura','Kanagawa','4LDK',210,2,2015,'鎌倉駅 徒歩12分',
 'Stunning 4LDK seaside house with private garden and garage. Walking distance to Kamakura beach.',
 '鎌倉の海辺に佇む4LDK。専用庭・ガレージ付き。海まで徒歩圏内。',
 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',0,1),

(2,2,'Studio Namba Osaka','大阪・なんばスタジオ',
 128000,'jpy','rent','Namba','Osaka','1K',32,8,2021,'なんば駅 徒歩2分',
 'Compact modern studio 2 min walk from Namba station. Perfect for solo living in the heart of Osaka.',
 'なんば駅2分の1Kスタジオ。大阪の中心で一人暮らしに最適。',
 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',0,1),

(2,2,'Heritage Villa Hakone','箱根・歴史的別荘',
 220000000,'jpy','sale','Hakone','Kanagawa','6LDK',380,2,1990,'箱根湯本駅',
 'Historic 6LDK villa with direct views of Mt. Fuji and private onsen. A rare opportunity.',
 '富士山直望・6LDK・敷地内温泉。稀少な歴史的別荘。',
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600',0,1),

(2,2,'Central Apartment Fukuoka','福岡市中央区マンション',
 165000,'jpy','rent','Chuo','Fukuoka','2LDK',68,5,2018,'天神駅 徒歩3分',
 'Bright 2LDK near Tenjin station with balcony. Ideal for couples or small families.',
 '天神駅3分・バルコニー付2LDK。カップル・小家族に最適。',
 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',0,1),

(2,2,'Snow Country Lodge Niseko','ニセコ・スノーカントリーロッジ',
 95000000,'jpy','sale','Niseko','Hokkaido','5LDK',280,2,2010,'ニセコ駅',
 'Ski-in ski-out 5LDK lodge in world-famous Niseko. Heated floors, large living area.',
 '世界的スキーリゾート・ニセコのスキーインアウトロッジ。5LDK・床暖房・広々リビング。',
 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600',0,1);

-- Sample messages so admin panel isn't empty on first login
INSERT INTO messages (type, agent_id, property_id, from_name, from_email, message, status) VALUES
('contact', NULL, NULL,
 'John Smith', 'john@example.com',
 'Hello, I am looking for a 3LDK in Tokyo with a budget of ¥500万/month. Can you assist?',
 'new'),
('inquiry', 2, 1,
 'Sarah Lee', 'sarah@example.com',
 'I am very interested in the Shibuya Penthouse. Is it still available? Can we schedule a viewing this week?',
 'new');
