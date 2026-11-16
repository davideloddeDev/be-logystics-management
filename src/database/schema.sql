-- Schema DDL per Logystics Management - Backend principale Node.js + MySQL
-- Codifica: utf8mb4 / InnoDB

CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `business_name` VARCHAR(255) NOT NULL,
  `vat_number` VARCHAR(50) NOT NULL,
  `address` VARCHAR(255) NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_companies_vat` (`vat_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `type` ENUM('furgone', 'mezzo leggero', 'camion', 'moto') NOT NULL DEFAULT 'furgone',
  `status` ENUM('attivo', 'in manutenzione', 'fuori servizio') NOT NULL DEFAULT 'attivo',
  `mileage` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_maintenance_date` DATE NULL,
  `insurance_company` VARCHAR(100) NULL,
  `insurance_policy_number` VARCHAR(100) NULL,
  `insurance_expiry_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vehicles_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_company_plate` (`company_id`, `plate`),
  INDEX `idx_vehicles_status` (`company_id`, `status`),
  INDEX `idx_vehicles_insurance` (`company_id`, `insurance_expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `collaborators` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role` ENUM('autista', 'magazziniere', 'responsabile logistica', 'amministrazione') NOT NULL DEFAULT 'autista',
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(150) NOT NULL,
  `status` ENUM('attivo', 'malattia', 'cessato') NOT NULL DEFAULT 'attivo',
  `hiring_date` DATE NULL,
  `license_expiry_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_collaborators_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_collaborators_role` (`company_id`, `role`),
  INDEX `idx_collaborators_status` (`company_id`, `status`),
  INDEX `idx_collaborators_email` (`company_id`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deliveries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `customer` VARCHAR(150) NOT NULL,
  `delivery_address` VARCHAR(255) NOT NULL,
  `vehicle_id` VARCHAR(36) NULL,
  `driver_id` VARCHAR(36) NULL,
  `status` ENUM('in attesa', 'in transito', 'consegnata', 'annullata') NOT NULL DEFAULT 'in attesa',
  `delivery_datetime` DATETIME NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_deliveries_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_deliveries_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deliveries_driver` FOREIGN KEY (`driver_id`) REFERENCES `collaborators` (`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_company_delivery_code` (`company_id`, `code`),
  INDEX `idx_deliveries_status` (`company_id`, `status`),
  INDEX `idx_deliveries_datetime` (`company_id`, `delivery_datetime`),
  INDEX `idx_deliveries_driver` (`company_id`, `driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_status_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `delivery_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `previous_status` ENUM('in attesa', 'in transito', 'consegnata', 'annullata') NULL,
  `new_status` ENUM('in attesa', 'in transito', 'consegnata', 'annullata') NOT NULL,
  `changed_by_user_id` VARCHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dsh_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dsh_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_dsh_delivery` (`delivery_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `type` ENUM('stipendio', 'mezzo', 'attrezzatura', 'entrata') NOT NULL,
  `reference` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('da pagare', 'pagato') NOT NULL DEFAULT 'da pagare',
  `payment_method` ENUM('bonifico', 'carta', 'contanti', 'assegno') NULL,
  `due_date` DATE NOT NULL,
  `paid_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_payments_status` (`company_id`, `status`),
  INDEX `idx_payments_type` (`company_id`, `type`),
  INDEX `idx_payments_date` (`company_id`, `due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company_settings` (
  `company_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
  `sms_notifications` BOOLEAN NOT NULL DEFAULT FALSE,
  `notification_events` JSON NULL,
  `maintenance_mode` BOOLEAN NOT NULL DEFAULT FALSE,
  `two_factor_required` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_settings_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `driver_mobile_access` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `collaborator_id` VARCHAR(36) NOT NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mobile_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mobile_collaborator` FOREIGN KEY (`collaborator_id`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_company_collaborator_mobile` (`company_id`, `collaborator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telemetry_latest` (
  `vehicle_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `address` VARCHAR(255) NULL,
  `speed` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `engine_status` ENUM('acceso', 'spento') NOT NULL DEFAULT 'spento',
  `available_load_kg` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  `total_load_kg` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  `tare_kg` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  `compartment_temperature` DECIMAL(4, 1) NULL,
  `estimated_autonomy_km` INT UNSIGNED NOT NULL DEFAULT 0,
  `device_timestamp` DATETIME NOT NULL,
  `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_telemetry_latest_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_telemetry_latest_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_telemetry_latest_company` (`company_id`, `received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telemetry_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `address` VARCHAR(255) NULL,
  `speed` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `engine_status` ENUM('acceso', 'spento') NOT NULL DEFAULT 'spento',
  `compartment_temperature` DECIMAL(4, 1) NULL,
  `device_timestamp` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_telemetry_history_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_telemetry_history_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_telemetry_history_query` (`company_id`, `vehicle_id`, `device_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(100) NOT NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_logs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_logs_company_date` (`company_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
