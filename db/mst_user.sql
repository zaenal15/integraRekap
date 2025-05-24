/*
 Navicat Premium Dump SQL

 Source Server         : IntegraDbPg
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : 145.79.13.61:5432
 Source Catalog        : e_rekap_labschool_smp
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: 24/05/2025 15:53:29
*/


-- ----------------------------
-- Table structure for mst_user
-- ----------------------------
DROP TABLE IF EXISTS "public"."mst_user";
CREATE TABLE "public"."mst_user" (
  "id" int4 NOT NULL DEFAULT nextval('mst_user_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "username" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "user_status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "group_position" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "failed_attempts" int4 NOT NULL DEFAULT 0,
  "last_login" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_failed_pass" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of mst_user
-- ----------------------------
INSERT INTO "public"."mst_user" VALUES (22, 'Guest', 'guest', 'guest@gmail.com', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP03', 0, '2025-05-24 15:45:55', '2025-04-22 12:51:39');
INSERT INTO "public"."mst_user" VALUES (22, 'Admin LKBBT', 'adminlabs1', 'adminlabs@gmail.com', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP04', 0, '2025-05-24 15:45:55', '2025-05-24 16:35:35.997109');
INSERT INTO "public"."mst_user" VALUES (17, 'Admin LSCK', 'adminlabs2__smp', 'admincoc2@gmail.com', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP05', 0, '2025-04-19 03:40:48', '2025-04-18 18:43:13');
INSERT INTO "public"."mst_user" VALUES (18, 'Admin LABSPHORE', 'admincoc3__smp', 'adminlabs3', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP06', 0, '2025-04-19 03:26:24', '2025-04-18 14:42:59.112306');
INSERT INTO "public"."mst_user" VALUES (19, 'Admin LABSRING', 'adminlabs4__smp', 'admincoc4@gmail.com', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP07', 0, '2025-04-19 03:28:27', '2025-04-18 14:43:39.215217');
INSERT INTO "public"."mst_user" VALUES (1, 'Zaenal', 'zaenal', 'zainal@digitaloptima.id', '12872d7926c98c00dfa04abf9c17cd0b', 'active', 'EP00', 0, '2025-05-24 08:15:52', '2025-05-17 08:45:11');
INSERT INTO "public"."mst_user" VALUES (20, 'Super Admin', 'superadmincoc', 'superadmin@gmailcom', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP00', 0, '2025-04-18 15:07:03.01849', '2025-04-18 15:07:03.01849');
INSERT INTO "public"."mst_user" VALUES (21, 'Juri Labscoutition', 'jurilabscoutition', 'superadmin1@gmail.com', 'b671d8886d12a12e61fb93b17528621a', 'active', 'EP01', 0, '2025-04-19 04:07:49', '2025-04-18 15:08:01.986454');
