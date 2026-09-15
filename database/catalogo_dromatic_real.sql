-- ============================================================
-- DIS - Catálogo REAL de Laboratorio DròMatic
--
-- Datos verificados en múltiples fuentes:
--   * Códigos oficiales de Dromatic (SKU internos del laboratorio)
--   * comprardromatic.com  (tienda oficial)
--   * impactodelabelleza.com y tecnoestilos.com (distribuidores oficiales)
--   * mercadolibre.com.co
--
-- Reemplaza los productos capilares y el gel desmaquillador con
-- sus códigos y presentaciones reales. Se puede ejecutar varias
-- veces sin duplicar.
-- ============================================================

USE dromatic_inventory;

-- ---------------------------------------------------
-- 0) LIMPIEZA: quita los CAP-* y el gel desmaquillador que
--    estaban con tamaños provisionales para reemplazarlos.
--    Los productos SH-001, AC-002, MA-003 y SE-004 (demo)
--    y las demás categorías se conservan.
-- ---------------------------------------------------
DELETE m FROM movements m
JOIN products p ON p.id = m.product_id
WHERE p.code LIKE 'CAP-%' OR p.code = 'MAQ-006';

DELETE FROM products
WHERE code LIKE 'CAP-%' OR code = 'MAQ-006';

-- ---------------------------------------------------
-- 1) UBICACIONES CAPILARES (idempotente; ya deben existir)
-- ---------------------------------------------------
INSERT INTO locations (zone, aisle, shelf, level)
SELECT * FROM (
  SELECT 'Zona A' z, 'Pasillo Capilares' a, 'Estante 01' s, 'Nivel 1' l UNION ALL
  SELECT 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1'
) t
WHERE NOT EXISTS (
  SELECT 1 FROM locations L
  WHERE L.zone = t.z AND L.aisle = t.a AND L.shelf = t.s AND L.level = t.l
);

-- ---------------------------------------------------
-- 2) PRODUCTOS CAPILARES REALES
-- Códigos = SKU oficiales del laboratorio.
-- Cada tamaño es un SKU independiente (así se maneja en bodega).
-- ---------------------------------------------------
INSERT IGNORE INTO products (code, name, description, quantity, minimum_stock, location_id, entry_date, status)
SELECT p.code, p.name, p.description, p.quantity, p.minimum_stock, l.id, CURDATE(), 'ACTIVO'
FROM (
  -- ACRILATO (SKU oficiales: 069, 4242, 082, 380)
  SELECT '069'  code, 'Acrilato Dromatic 100 ml' name,  'Materia prima capilar' description, 40  quantity, 10 minimum_stock, 'Zona A' zone, 'Pasillo Capilares' aisle, 'Estante 01' shelf, 'Nivel 1' level UNION ALL
  SELECT '4242', 'Acrilato Dromatic 200 ml',           'Materia prima capilar', 32,  8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '082',  'Acrilato Dromatic 400 ml',           'Materia prima capilar', 25,  8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '380',  'Acrilato Dromatic 1000 ml',          'Materia prima capilar', 18,  6,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- BÁLSAMO ZERO SAL (SKU oficiales: 4444, 4445, 4446, 4133)
  SELECT '4444', 'Bálsamo Zero Sal Dromatic 125 ml',   'Bálsamo acondicionador sin sal', 90, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '4445', 'Bálsamo Zero Sal Dromatic 250 ml',   'Bálsamo acondicionador sin sal', 70, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '4446', 'Bálsamo Zero Sal Dromatic 500 ml',   'Bálsamo acondicionador sin sal', 50, 12, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '4133', 'Bálsamo Zero Sal Dromatic 1000 ml',  'Bálsamo acondicionador sin sal', 28, 8,  'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL

  -- CARBÓMERO (SKU oficiales: 7854, 00031, 4562, 411, 0331)
  SELECT '7854',  'Carbómero Dromatic 60 ml',           'Materia prima capilar', 45, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '00031', 'Carbómero Dromatic 125 ml',          'Materia prima capilar', 38, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4562',  'Carbómero Dromatic 250 ml',          'Materia prima capilar', 30, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '411',   'Carbómero Dromatic 500 ml',          'Materia prima capilar', 22, 6,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '0331',  'Carbómero Dromatic 1000 ml',         'Materia prima capilar', 15, 5,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- GLICOL (SKU oficiales: 4223, 4224, 4225, 4241, 4181)
  SELECT '4223', 'Glicol Dromatic 60 ml',               'Materia prima capilar', 42, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4224', 'Glicol Dromatic 125 ml',              'Materia prima capilar', 36, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4225', 'Glicol Dromatic 250 ml',              'Materia prima capilar', 28, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4241', 'Glicol Dromatic 500 ml',              'Materia prima capilar', 20, 6,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4181', 'Glicol Dromatic 1000 ml',             'Materia prima capilar', 14, 5,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- KIT ALISADOR LAXIOS (SKU oficiales: 044, 2314)
  SELECT '044',  'Kit Alisador Laxios 250 ml',          'Kit alisador profesional', 22, 8, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '2314', 'Kit Alisador Laxios 1000 ml',         'Kit alisador profesional', 12, 5, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- POLÍMERO (SKU oficiales: 4175, 4178, 4179, 4240, 4180)
  SELECT '4175', 'Polímero Dromatic 60 ml',             'Materia prima capilar', 48, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4178', 'Polímero Dromatic 125 ml',            'Materia prima capilar', 40, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4179', 'Polímero Dromatic 250 ml',            'Materia prima capilar', 32, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4240', 'Polímero Dromatic 500 ml',            'Materia prima capilar', 24, 6,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT '4180', 'Polímero Dromatic 1000 ml',           'Materia prima capilar', 15, 5,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- SHAMPOO ZERO SAL (SKU oficiales: 2131, 4131, 9233, 408)
  SELECT '2131', 'Shampoo Zero Sal Dromatic 125 ml',    'Shampoo sin sal', 95, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '4131', 'Shampoo Zero Sal Dromatic 250 ml',    'Shampoo sin sal', 80, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '9233', 'Shampoo Zero Sal Dromatic 500 ml',    'Shampoo sin sal', 55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT '408',  'Shampoo Zero Sal Dromatic 1000 ml',   'Shampoo sin sal', 35, 10, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL

  -- BRILLANTINA (tamaños oficiales: 60, 125, 250 ml)
  SELECT 'BR-060',  'Brillantina Dromatic 60 ml',       'Brillantina para el cabello',  70, 15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'BR-125',  'Brillantina Dromatic 125 ml',      'Brillantina para el cabello',  55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'BR-250',  'Brillantina Dromatic 250 ml',      'Brillantina para el cabello',  40, 10, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL

  -- CERA MOLDEADORA (tamaños oficiales: 60, 125, 250, 500 ml)
  SELECT 'CM-060',  'Cera Moldeadora Dromatic 60 ml',   'Cera moldeadora capilar',      55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CM-125',  'Cera Moldeadora Dromatic 125 ml',  'Cera moldeadora capilar',      45, 12, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CM-250',  'Cera Moldeadora Dromatic 250 ml',  'Cera moldeadora capilar',      35, 10, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CM-500',  'Cera Moldeadora Dromatic 500 ml',  'Cera moldeadora capilar',      22, 8,  'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL

  -- LACA NORMAL (tamaño oficial confirmado: 150 ml)
  SELECT 'LC-150',  'Laca Normal Dromatic 150 ml',      'Laca fijadora normal',         100, 20, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL

  -- AGUA OXIGENADA (sachet oficial de 75 ml en 4 volúmenes)
  SELECT 'AO-10V', 'Agua Oxigenada Dromatic 10 Vol. 75 ml','Peróxido cremoso 10 volúmenes', 60, 15, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'AO-20V', 'Agua Oxigenada Dromatic 20 Vol. 75 ml','Peróxido cremoso 20 volúmenes', 55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'AO-30V', 'Agua Oxigenada Dromatic 30 Vol. 75 ml','Peróxido cremoso 30 volúmenes', 40, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'AO-40V', 'Agua Oxigenada Dromatic 40 Vol. 75 ml','Peróxido cremoso 40 volúmenes', 25, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- ACLARADOR PROGRESSIVE (tamaños oficiales: 100, 200, 400 ml)
  SELECT 'AC-100', 'Aclarador Progressive Dromatic 100 ml','Aclarador capilar progresivo', 50, 12, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'AC-200', 'Aclarador Progressive Dromatic 200 ml','Aclarador capilar progresivo', 32, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'AC-400', 'Aclarador Progressive Dromatic 400 ml','Aclarador capilar progresivo', 18, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- SHAMPOO PROFESIONAL / RINSE PROFESIONAL (1000 ml confirmado)
  SELECT 'SP-1L',  'Shampoo Profesional Dromatic 1000 ml','Shampoo profesional para salón', 60, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'RP-1L',  'Rinse Profesional Dromatic 1000 ml',  'Rinse profesional para salón',   55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL

  -- TÓNICO CAPILAR (180 ml confirmado por Tecnoestilos)
  SELECT 'TC-180', 'Tónico Capilar Dromatic 180 ml',    'Tónico para el cuero cabelludo', 50, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL

  -- CATÁLOGO CAPILAR SIN TAMAÑO PUBLICADO
  -- Estos productos aparecen en el catálogo oficial pero el laboratorio no
  -- publica presentaciones estándar; se dejan como referencia general.
  SELECT 'REP',    'Reparador Capilar Dromatic',       'Tratamiento reparador capilar',       70, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CEP',    'Cepillo para el cabello Dromatic', 'Cepillo capilar',                     120, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'SCC',    'Shampoo Control Caspa Dromatic',   'Shampoo anticaspa',                   85, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CPP',    'Crema para peinar Dromatic',       'Crema estilizante',                   90, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CDE',    'Crema desenredante Dromatic',      'Crema desenredante con queratina',    75, 15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'SL',     'Silicona líquida Dromatic',        'Silicona líquida capilar',            60, 15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'SC',     'Silicona en crema Dromatic',       'Silicona en crema',                   55, 15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'SE',     'Silicona espesa Dromatic',         'Silicona espesa',                     45, 12, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CEP-PA', 'Cera en pasta Dromatic',           'Cera en pasta',                       40, 10, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'GFE',    'Gel Fijación Extrema Dromatic',    'Gel de fijación extrema',             130, 25, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'SHA',    'Shampoo con Acondicionador Dromatic','Shampoo 2 en 1',                    80, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'BAC',    'Bálsamo Acondicionador Dromatic',  'Bálsamo acondicionador',              78, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'KAP',    'Kit Alisador Dromatic Profesional','Kit alisador profesional',            15, 8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'BAR',    'Desinfectante Barbicide Dromatic', 'Desinfectante para herramientas',     30, 10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- GEL DESMAQUILLADOR (SKU oficial 4448, categoría maquillaje)
  SELECT '4448',   'Gel Desmaquillador Dromatic 120 ml','Gel para desmaquillar', 65, 15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1'
) p
JOIN locations l
  ON l.zone = p.zone AND l.aisle = p.aisle AND l.shelf = p.shelf AND l.level = p.level;

-- ---------------------------------------------------
-- 3) MOVIMIENTOS DE INVENTARIO INICIAL para los productos nuevos
-- ---------------------------------------------------
INSERT INTO movements (product_id, user_id, type, quantity, movement_date, reason)
SELECT pr.id, u.id, 'ENTRADA', pr.quantity, pr.entry_date, 'Inventario inicial'
FROM products pr
JOIN users u ON u.username = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM movements m WHERE m.product_id = pr.id);
