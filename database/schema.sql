-- ============================================================
-- Electronic Components B2B Platform
-- Database: db_electronic
-- MySQL: 5.7.44
-- Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS `db_electronic`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `db_electronic`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. Manufacturers / 制造商
-- ============================================================
DROP TABLE IF EXISTS `manufacturers`;
CREATE TABLE `manufacturers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `name` VARCHAR(100) NOT NULL COMMENT '制造商名称 / Manufacturer Name',
  `code` VARCHAR(50) DEFAULT NULL COMMENT '制造商编码 / Manufacturer Code',
  `logo_url` VARCHAR(500) DEFAULT NULL COMMENT 'Logo 地址 / Logo URL',
  `website` VARCHAR(500) DEFAULT NULL COMMENT '官方网站 / Official Website',
  `description` TEXT COMMENT '制造商简介 / Manufacturer Description',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用 / Status: 1 Active, 0 Disabled',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_manufacturers_name` (`name`),
  UNIQUE KEY `uk_manufacturers_code` (`code`),
  KEY `idx_manufacturers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='制造商表 / Manufacturers';

-- ============================================================
-- 2. Product Categories / 产品分类
-- ============================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `parent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '父分类 ID / Parent Category ID',
  `name_zh` VARCHAR(100) NOT NULL COMMENT '中文名称 / Chinese Name',
  `name_en` VARCHAR(100) NOT NULL COMMENT '英文名称 / English Name',
  `slug` VARCHAR(120) NOT NULL COMMENT 'URL 标识 / URL Slug',
  `description_zh` TEXT COMMENT '中文描述 / Chinese Description',
  `description_en` TEXT COMMENT '英文描述 / English Description',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标 / Icon',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用 / Status: 1 Active, 0 Disabled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品分类表 / Product Categories';

-- ============================================================
-- 3. Products / 产品
-- ============================================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `part_number` VARCHAR(150) NOT NULL COMMENT '产品型号 / Part Number',
  `manufacturer_id` BIGINT UNSIGNED NOT NULL COMMENT '制造商 ID / Manufacturer ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '产品分类 ID / Category ID',
  `package` VARCHAR(100) DEFAULT NULL COMMENT '封装类型 / Package',
  `title_zh` VARCHAR(255) NOT NULL COMMENT '中文产品标题 / Chinese Product Title',
  `title_en` VARCHAR(255) NOT NULL COMMENT '英文产品标题 / English Product Title',
  `description_zh` TEXT COMMENT '中文产品描述 / Chinese Product Description',
  `description_en` TEXT COMMENT '英文产品描述 / English Product Description',
  `status` ENUM('In Stock','Available','Request Quote','Discontinued') NOT NULL DEFAULT 'Available' COMMENT '产品状态 / Product Status',
  `stock_quantity` BIGINT DEFAULT NULL COMMENT '库存数量 / Stock Quantity',
  `unit` VARCHAR(30) NOT NULL DEFAULT 'pcs' COMMENT '库存单位 / Unit',
  `datasheet_url` VARCHAR(1000) DEFAULT NULL COMMENT '数据手册地址 / Datasheet URL',
  `image_url` VARCHAR(1000) DEFAULT NULL COMMENT '产品图片地址 / Product Image URL',
  `is_featured` TINYINT NOT NULL DEFAULT 0 COMMENT '是否推荐：1是 0否 / Featured: 1 Yes, 0 No',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_part_number` (`part_number`),
  KEY `idx_products_manufacturer` (`manufacturer_id`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_featured` (`is_featured`),
  CONSTRAINT `fk_products_manufacturer` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品主表 / Products';

-- ============================================================
-- 4. Product Features / 产品特性
-- ============================================================
DROP TABLE IF EXISTS `product_features`;
CREATE TABLE `product_features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '产品 ID / Product ID',
  `feature_zh` VARCHAR(500) NOT NULL COMMENT '中文特性 / Chinese Feature',
  `feature_en` VARCHAR(500) NOT NULL COMMENT '英文特性 / English Feature',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  PRIMARY KEY (`id`),
  KEY `idx_product_features_product` (`product_id`),
  CONSTRAINT `fk_product_features_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品特性表 / Product Features';

-- ============================================================
-- 5. Applications / 应用领域
-- ============================================================
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `name_zh` VARCHAR(150) NOT NULL COMMENT '中文应用名称 / Chinese Application Name',
  `name_en` VARCHAR(150) NOT NULL COMMENT '英文应用名称 / English Application Name',
  `description_zh` TEXT COMMENT '中文应用描述 / Chinese Application Description',
  `description_en` TEXT COMMENT '英文应用描述 / English Application Description',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用 / Status: 1 Active, 0 Disabled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用领域表 / Applications';

-- ============================================================
-- 6. Product Applications / 产品与应用关联
-- ============================================================
DROP TABLE IF EXISTS `product_applications`;
CREATE TABLE `product_applications` (
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '产品 ID / Product ID',
  `application_id` BIGINT UNSIGNED NOT NULL COMMENT '应用领域 ID / Application ID',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  PRIMARY KEY (`product_id`,`application_id`),
  CONSTRAINT `fk_product_applications_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_applications_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品应用关联表 / Product Applications';

-- ============================================================
-- 7. Tags / 标签
-- ============================================================
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `name_zh` VARCHAR(100) NOT NULL COMMENT '中文标签 / Chinese Tag',
  `name_en` VARCHAR(100) NOT NULL COMMENT '英文标签 / English Tag',
  `slug` VARCHAR(120) NOT NULL COMMENT '标签标识 / Tag Slug',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表 / Tags';

-- ============================================================
-- 8. Product Tags / 产品标签关联
-- ============================================================
DROP TABLE IF EXISTS `product_tags`;
CREATE TABLE `product_tags` (
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '产品 ID / Product ID',
  `tag_id` BIGINT UNSIGNED NOT NULL COMMENT '标签 ID / Tag ID',
  PRIMARY KEY (`product_id`,`tag_id`),
  CONSTRAINT `fk_product_tags_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品标签关联表 / Product Tags';

-- ============================================================
-- 9. Technical Topics / 技术主题
-- ============================================================
DROP TABLE IF EXISTS `technical_topics`;
CREATE TABLE `technical_topics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属分类 ID / Category ID',
  `slug` VARCHAR(120) NOT NULL COMMENT '技术主题标识 / Topic Slug',
  `title_zh` VARCHAR(255) NOT NULL COMMENT '中文标题 / Chinese Title',
  `title_en` VARCHAR(255) NOT NULL COMMENT '英文标题 / English Title',
  `description_zh` TEXT COMMENT '中文描述 / Chinese Description',
  `description_en` TEXT COMMENT '英文描述 / English Description',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用 / Status: 1 Active, 0 Disabled',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_technical_topics_slug` (`slug`),
  KEY `idx_technical_topics_category` (`category_id`),
  CONSTRAINT `fk_technical_topics_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技术主题表 / Technical Topics';

-- ============================================================
-- 10. Technical Topic Tags / 技术主题标签
-- ============================================================
DROP TABLE IF EXISTS `technical_topic_tags`;
CREATE TABLE `technical_topic_tags` (
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '技术主题 ID / Technical Topic ID',
  `tag_id` BIGINT UNSIGNED NOT NULL COMMENT '标签 ID / Tag ID',
  PRIMARY KEY (`topic_id`,`tag_id`),
  CONSTRAINT `fk_topic_tags_topic` FOREIGN KEY (`topic_id`) REFERENCES `technical_topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_topic_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技术主题标签关联表 / Technical Topic Tags';

-- ============================================================
-- 11. Technical Topic Products / 技术主题与产品关联
-- ============================================================
DROP TABLE IF EXISTS `technical_topic_products`;
CREATE TABLE `technical_topic_products` (
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '技术主题 ID / Technical Topic ID',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '产品 ID / Product ID',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序 / Sort Order',
  PRIMARY KEY (`topic_id`,`product_id`),
  CONSTRAINT `fk_topic_products_topic` FOREIGN KEY (`topic_id`) REFERENCES `technical_topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_topic_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技术主题产品关联表 / Technical Topic Products';

-- ============================================================
-- 12. Product Datasheets / 产品数据手册
-- ============================================================
DROP TABLE IF EXISTS `product_datasheets`;
CREATE TABLE `product_datasheets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '产品 ID / Product ID',
  `title_zh` VARCHAR(255) DEFAULT NULL COMMENT '中文文件标题 / Chinese File Title',
  `title_en` VARCHAR(255) DEFAULT NULL COMMENT '英文文件标题 / English File Title',
  `file_name` VARCHAR(255) NOT NULL COMMENT '文件名称 / File Name',
  `file_url` VARCHAR(1000) NOT NULL COMMENT '文件地址 / File URL',
  `file_size` BIGINT UNSIGNED DEFAULT NULL COMMENT '文件大小（字节） / File Size (Bytes)',
  `version` VARCHAR(50) DEFAULT NULL COMMENT '文档版本 / Document Version',
  `is_public` TINYINT NOT NULL DEFAULT 1 COMMENT '是否公开：1是 0否 / Public: 1 Yes, 0 No',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  KEY `idx_product_datasheets_product` (`product_id`),
  CONSTRAINT `fk_product_datasheets_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品数据手册表 / Product Datasheets';

-- ============================================================
-- 13. Contact Messages / 联系留言
-- ============================================================
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `name` VARCHAR(150) NOT NULL COMMENT '联系人姓名 / Contact Name',
  `company` VARCHAR(255) DEFAULT NULL COMMENT '公司名称 / Company Name',
  `business_email` VARCHAR(255) NOT NULL COMMENT '商务邮箱 / Business Email',
  `phone_whatsapp` VARCHAR(100) DEFAULT NULL COMMENT '电话或 WhatsApp / Phone or WhatsApp',
  `subject` VARCHAR(255) DEFAULT NULL COMMENT '留言主题 / Subject',
  `message` TEXT NOT NULL COMMENT '留言内容 / Message',
  `status` ENUM('New','Processing','Replied','Closed') NOT NULL DEFAULT 'New' COMMENT '处理状态 / Processing Status',
  `admin_note` TEXT COMMENT '管理员备注 / Admin Note',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  KEY `idx_contact_messages_status` (`status`),
  KEY `idx_contact_messages_email` (`business_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系我们留言表 / Contact Messages';

-- ============================================================
-- 14. Quote Requests / 询价单
-- ============================================================
DROP TABLE IF EXISTS `quote_requests`;
CREATE TABLE `quote_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `quote_no` VARCHAR(50) NOT NULL COMMENT '询价单号 / Quote Request Number',
  `company` VARCHAR(255) DEFAULT NULL COMMENT '公司名称 / Company Name',
  `contact_name` VARCHAR(150) NOT NULL COMMENT '联系人 / Contact Name',
  `business_email` VARCHAR(255) NOT NULL COMMENT '商务邮箱 / Business Email',
  `phone` VARCHAR(100) DEFAULT NULL COMMENT '电话 / Phone',
  `requirements` TEXT COMMENT '其他需求 / Additional Requirements',
  `status` ENUM('New','Processing','Quoted','Completed','Cancelled') NOT NULL DEFAULT 'New' COMMENT '询价状态 / Quote Status',
  `admin_note` TEXT COMMENT '管理员备注 / Admin Note',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quote_requests_quote_no` (`quote_no`),
  KEY `idx_quote_requests_status` (`status`),
  KEY `idx_quote_requests_email` (`business_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价主表 / Quote Requests';

-- ============================================================
-- 15. Quote Request Items / 询价产品明细
-- ============================================================
DROP TABLE IF EXISTS `quote_request_items`;
CREATE TABLE `quote_request_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `quote_request_id` BIGINT UNSIGNED NOT NULL COMMENT '询价单 ID / Quote Request ID',
  `product_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '产品 ID / Product ID',
  `part_number` VARCHAR(150) NOT NULL COMMENT '询价型号 / Requested Part Number',
  `manufacturer` VARCHAR(150) DEFAULT NULL COMMENT '制造商名称 / Manufacturer Name',
  `quantity` DECIMAL(18,3) DEFAULT NULL COMMENT '需求数量 / Requested Quantity',
  `unit` VARCHAR(30) NOT NULL DEFAULT 'pcs' COMMENT '数量单位 / Quantity Unit',
  `target_price` DECIMAL(18,6) DEFAULT NULL COMMENT '目标价格 / Target Price',
  `delivery_date` DATE DEFAULT NULL COMMENT '期望交期 / Required Delivery Date',
  `technical_requirements` TEXT COMMENT '技术要求 / Technical Requirements',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  PRIMARY KEY (`id`),
  KEY `idx_quote_items_request` (`quote_request_id`),
  KEY `idx_quote_items_product` (`product_id`),
  CONSTRAINT `fk_quote_items_request` FOREIGN KEY (`quote_request_id`) REFERENCES `quote_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价产品明细表 / Quote Request Items';

-- ============================================================
-- 16. Admin Users / 后台管理员
-- ============================================================
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `username` VARCHAR(100) NOT NULL COMMENT '登录用户名 / Login Username',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希 / Password Hash',
  `display_name` VARCHAR(150) DEFAULT NULL COMMENT '显示名称 / Display Name',
  `email` VARCHAR(255) DEFAULT NULL COMMENT '管理员邮箱 / Admin Email',
  `role` ENUM('Super Admin','Admin','Editor') NOT NULL DEFAULT 'Editor' COMMENT '管理员角色 / Admin Role',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用 / Status: 1 Active, 0 Disabled',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间 / Last Login Time',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_users_username` (`username`),
  UNIQUE KEY `uk_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台管理员表 / Admin Users';

-- ============================================================
-- 17. Site Settings / 网站配置
-- ============================================================
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID / Primary Key ID',
  `setting_key` VARCHAR(150) NOT NULL COMMENT '配置键 / Setting Key',
  `value_zh` TEXT COMMENT '中文配置值 / Chinese Value',
  `value_en` TEXT COMMENT '英文配置值 / English Value',
  `value_type` ENUM('text','number','boolean','json','url') NOT NULL DEFAULT 'text' COMMENT '值类型 / Value Type',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '配置说明 / Setting Description',
  `is_public` TINYINT NOT NULL DEFAULT 1 COMMENT '是否允许前端读取：1是 0否 / Public: 1 Yes, 0 No',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间 / Created At',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 / Updated At',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网站配置表 / Site Settings';

-- ============================================================
-- Initial Categories / 初始化产品分类
-- ============================================================
INSERT INTO `categories`
  (`parent_id`,`name_zh`,`name_en`,`slug`,`description_zh`,`description_en`,`sort_order`)
VALUES
  (NULL,'MCU 与微控制器','MCU & Microcontrollers','mcu',
   '微控制器及嵌入式处理器产品。','Microcontrollers and embedded processors.',1),
  (NULL,'模拟 IC','Analog IC','analog-ic',
   '运算放大器及其他模拟集成电路。','Operational amplifiers and other analog ICs.',2),
  (NULL,'电源管理','Power Management','power-management',
   'DC-DC、稳压器及电源管理器件。','DC-DC converters, regulators and power management devices.',3),
  (NULL,'通信 IC','Communication IC','communication-ic',
   'CAN、接口及工业通信器件。','CAN, interface and industrial communication devices.',4),
  (NULL,'DSP / DSC','DSP / DSC','dsp-dsc',
   '数字信号处理器及数字信号控制器。','Digital signal processors and digital signal controllers.',5),
  (NULL,'工业控制','Industrial Control','industrial-control',
   '工业自动化、电机控制及相关器件。','Industrial automation, motor control and related devices.',6);

-- ============================================================
-- Initial Applications / 初始化应用领域
-- ============================================================
INSERT INTO `applications`
  (`name_zh`,`name_en`,`description_zh`,`description_en`,`sort_order`)
VALUES
  ('工业设备','Industrial Equipment','工业控制和自动化设备。','Industrial control and automation equipment.',1),
  ('嵌入式系统','Embedded Systems','嵌入式控制器及电子设备。','Embedded controllers and electronic devices.',2),
  ('通信系统','Communication','通信接口及网络设备。','Communication interfaces and networking equipment.',3),
  ('电源电子','Power Electronics','电源管理及电子控制应用。','Power management and electronic control applications.',4),
  ('电机控制','Motor Control','电机驱动及实时控制系统。','Motor drive and real-time control systems.',5),
  ('工业自动化','Industrial Automation','工业自动化与智能控制系统。','Industrial automation and intelligent control systems.',6);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Verification
-- ============================================================
SELECT
  TABLE_NAME AS `表名 / Table`,
  TABLE_COMMENT AS `说明 / Comment`
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'db_electronic'
ORDER BY TABLE_NAME;
