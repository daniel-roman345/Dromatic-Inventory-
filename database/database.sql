-- ============================================================
-- DROMATIC INVENTORY SYSTEM (DIS) - Base de datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS dromatic_inventory
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dromatic_inventory;

-- ---------------------------------------------------
-- ROLES
-- ---------------------------------------------------
CREATE TABLE roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES
  ('ADMINISTRADOR'),
  ('OPERADOR'),
  ('CONSULTA');

-- ---------------------------------------------------
-- USERS
-- ---------------------------------------------------
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------
-- LOCATIONS
-- ---------------------------------------------------
CREATE TABLE locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  zone VARCHAR(30) NOT NULL,
  aisle VARCHAR(30) NOT NULL,
  shelf VARCHAR(30) NOT NULL,
  level VARCHAR(30) NOT NULL
);

-- ---------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------
CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  location_id BIGINT NOT NULL,
  entry_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT chk_quantity_nonneg CHECK (quantity >= 0),
  CONSTRAINT chk_min_stock_nonneg CHECK (minimum_stock >= 0)
);

-- ---------------------------------------------------
-- MOVEMENTS
-- ---------------------------------------------------
CREATE TABLE movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  type VARCHAR(10) NOT NULL, -- ENTRADA | SALIDA
  quantity INT NOT NULL,
  movement_date DATE NOT NULL,
  reason VARCHAR(255),
  observation VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_movement_qty_pos CHECK (quantity > 0)
);

-- ---------------------------------------------------
-- DATOS DE PRUEBA (claramente identificados)
-- Contraseña para todos: "Password123" (BCrypt)
-- ---------------------------------------------------
INSERT INTO locations (zone, aisle, shelf, level) VALUES
  ('Zona A', 'Pasillo A', 'Estante 03', 'Nivel 2'),
  ('Zona B', 'Pasillo B', 'Estante 01', 'Nivel 1');

-- Password de prueba para los 3: Password123
INSERT INTO users (username, email, password, role_id, active) VALUES
  ('admin', 'admin@dromatic.com', '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', 1, TRUE),
  ('operador1', 'operador@dromatic.com', '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', 2, TRUE),
  ('consulta1', 'consulta@dromatic.com', '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', 3, TRUE);

INSERT INTO products (code, name, description, quantity, minimum_stock, location_id, entry_date, status) VALUES
  ('SH-001', 'Shampoo Repair 250ml', 'Shampoo reparador capilar', 120, 20, 1, CURDATE(), 'ACTIVO'),
  ('AC-002', 'Acondicionador Hidratante', 'Acondicionador para cabello seco', 85, 15, 1, CURDATE(), 'ACTIVO'),
  ('MA-003', 'Mascarilla Nutritiva', 'Mascarilla capilar nutritiva 300g', 60, 10, 2, CURDATE(), 'ACTIVO'),
  ('SE-004', 'Serum Capilar', 'Serum reparador puntas abiertas', 8, 10, 2, CURDATE(), 'ACTIVO');
