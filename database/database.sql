-- ============================================================
-- DROMATIC INVENTORY SYSTEM (DIS) - Estructura de la base de datos
-- Compatible con MySQL 8 (y MariaDB 10.4+ de XAMPP)
--
-- Uso:  mysql -u root -p < database/database.sql
-- El script se puede ejecutar varias veces: no borra datos existentes.
-- Los datos de demostración están aparte en database/datos_prueba.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS dromatic_inventory
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dromatic_inventory;

-- ---------------------------------------------------
-- ROLES
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (name) VALUES
  ('ADMINISTRADOR'),
  ('OPERADOR'),
  ('CONSULTA');

-- ---------------------------------------------------
-- USUARIOS
-- El login usa solo usuario y contraseña (hash BCrypt).
-- failed_attempts / locked_until: bloqueo tras 5 intentos fallidos.
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  email           VARCHAR(100) NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role_id         BIGINT       NOT NULL,
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  failed_attempts INT          NOT NULL DEFAULT 0,
  locked_until    DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- UBICACIONES DENTRO DE LA BODEGA
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone  VARCHAR(30) NOT NULL,
  aisle VARCHAR(30) NOT NULL,
  shelf VARCHAR(30) NOT NULL,
  level VARCHAR(30) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- PRODUCTOS
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(50)  NOT NULL UNIQUE,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(500) NULL,
  quantity      INT          NOT NULL DEFAULT 0,
  minimum_stock INT          NOT NULL DEFAULT 0,
  location_id   BIGINT       NOT NULL,
  entry_date    DATE         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT chk_products_quantity  CHECK (quantity >= 0),
  CONSTRAINT chk_products_min_stock CHECK (minimum_stock >= 0),
  CONSTRAINT chk_products_status    CHECK (status IN ('ACTIVO', 'INACTIVO')),
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- MOVIMIENTOS (ENTRADAS Y SALIDAS) - historial / auditoría
-- Un movimiento nunca se borra: si hubo un error se ANULA
-- (voided = TRUE) y el stock se revierte.
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS movements (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id    BIGINT       NOT NULL,
  user_id       BIGINT       NOT NULL,
  type          VARCHAR(10)  NOT NULL,
  quantity      INT          NOT NULL,
  movement_date DATE         NOT NULL,
  reason        VARCHAR(255) NULL,
  reference     VARCHAR(50)  NULL,
  observation   VARCHAR(500) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided        BOOLEAN      NOT NULL DEFAULT FALSE,
  voided_at     DATETIME     NULL,
  voided_by     BIGINT       NULL,
  void_reason   VARCHAR(255) NULL,
  CONSTRAINT fk_movements_product   FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_movements_user      FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_movements_voided_by FOREIGN KEY (voided_by)  REFERENCES users(id),
  CONSTRAINT chk_movements_quantity CHECK (quantity > 0),
  CONSTRAINT chk_movements_type     CHECK (type IN ('ENTRADA', 'SALIDA')),
  INDEX idx_movements_date (movement_date),
  INDEX idx_movements_created (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- USUARIO ADMINISTRADOR INICIAL
-- Usuario: admin   Contraseña: Password123
-- ¡Cámbiela desde "Usuarios" después del primer ingreso!
-- ---------------------------------------------------
INSERT IGNORE INTO users (username, email, password, role_id, active)
SELECT 'admin', NULL, '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', r.id, TRUE
FROM roles r WHERE r.name = 'ADMINISTRADOR';
