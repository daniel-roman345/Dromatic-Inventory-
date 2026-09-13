-- ============================================================
-- DIS - DATOS DE DEMOSTRACIÓN (OPCIONAL)
-- Ejecutar DESPUÉS de database.sql, solo para pruebas o sustentación:
--   mysql -u root -p < database/datos_prueba.sql
-- Contraseña de los usuarios de prueba: Password123
-- ============================================================

USE dromatic_inventory;

INSERT IGNORE INTO users (username, email, password, role_id, active)
SELECT 'operador1', NULL, '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', r.id, TRUE
FROM roles r WHERE r.name = 'OPERADOR';

INSERT IGNORE INTO users (username, email, password, role_id, active)
SELECT 'consulta1', NULL, '$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q', r.id, TRUE
FROM roles r WHERE r.name = 'CONSULTA';

INSERT INTO locations (zone, aisle, shelf, level)
SELECT * FROM (SELECT 'Zona A', 'Pasillo A', 'Estante 03', 'Nivel 2') AS t
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE zone = 'Zona A' AND aisle = 'Pasillo A' AND shelf = 'Estante 03' AND level = 'Nivel 2');

INSERT INTO locations (zone, aisle, shelf, level)
SELECT * FROM (SELECT 'Zona B', 'Pasillo B', 'Estante 01', 'Nivel 1') AS t
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE zone = 'Zona B' AND aisle = 'Pasillo B' AND shelf = 'Estante 01' AND level = 'Nivel 1');

-- Productos con su stock inicial registrado también como movimiento de entrada
INSERT IGNORE INTO products (code, name, description, quantity, minimum_stock, location_id, entry_date, status)
SELECT p.code, p.name, p.description, p.quantity, p.minimum_stock, l.id, CURDATE(), 'ACTIVO'
FROM (
  SELECT 'SH-001' AS code, 'Shampoo Repair 250ml' AS name, 'Shampoo reparador capilar' AS description, 120 AS quantity, 20 AS minimum_stock, 'Zona A' AS zone
  UNION ALL SELECT 'AC-002', 'Acondicionador Hidratante', 'Acondicionador para cabello seco', 85, 15, 'Zona A'
  UNION ALL SELECT 'MA-003', 'Mascarilla Nutritiva', 'Mascarilla capilar nutritiva 300g', 60, 10, 'Zona B'
  UNION ALL SELECT 'SE-004', 'Serum Capilar', 'Serum reparador puntas abiertas', 8, 10, 'Zona B'
) p
JOIN locations l ON l.zone = p.zone;

INSERT INTO movements (product_id, user_id, type, quantity, movement_date, reason)
SELECT pr.id, u.id, 'ENTRADA', pr.quantity, pr.entry_date, 'Inventario inicial'
FROM products pr
JOIN users u ON u.username = 'admin'
WHERE pr.code IN ('SH-001', 'AC-002', 'MA-003', 'SE-004')
  AND NOT EXISTS (SELECT 1 FROM movements m WHERE m.product_id = pr.id);
