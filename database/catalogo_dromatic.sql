-- ============================================================
-- DIS - Catálogo real de Laboratorio DròMatic
-- Fuente: https://www.dromatic.com.co/web/catalogo-virtual
-- Se puede ejecutar varias veces: no duplica productos ni movimientos.
-- Los tamaños corresponden a las presentaciones comerciales típicas.
-- ============================================================

USE dromatic_inventory;

-- ---------------------------------------------------
-- 1) UBICACIONES POR CATEGORÍA
-- ---------------------------------------------------
INSERT INTO locations (zone, aisle, shelf, level)
SELECT * FROM (
  SELECT 'Zona A' z, 'Pasillo Capilares' a, 'Estante 01' s, 'Nivel 1' l UNION ALL
  SELECT 'Zona A',   'Pasillo Capilares',    'Estante 02',  'Nivel 1' UNION ALL
  SELECT 'Zona A',   'Pasillo Capilares',    'Estante 04',  'Nivel 1' UNION ALL
  SELECT 'Zona B',   'Pasillo Aseo Personal','Estante 01',  'Nivel 1' UNION ALL
  SELECT 'Zona C',   'Pasillo Aseo Hogar',   'Estante 01',  'Nivel 1' UNION ALL
  SELECT 'Zona C',   'Pasillo Aseo Hogar',   'Estante 02',  'Nivel 1' UNION ALL
  SELECT 'Zona D',   'Pasillo Tocador',      'Estante 01',  'Nivel 1' UNION ALL
  SELECT 'Zona D',   'Pasillo Tocador',      'Estante 02',  'Nivel 1' UNION ALL
  SELECT 'Zona E',   'Pasillo Maquillaje',   'Estante 01',  'Nivel 1' UNION ALL
  SELECT 'Zona E',   'Pasillo Maquillaje',   'Estante 02',  'Nivel 1' UNION ALL
  SELECT 'Zona F',   'Pasillo Perfumería',   'Estante 01',  'Nivel 1'
) t
WHERE NOT EXISTS (
  SELECT 1 FROM locations L
  WHERE L.zone = t.z AND L.aisle = t.a AND L.shelf = t.s AND L.level = t.l
);

-- ---------------------------------------------------
-- 2) PRODUCTOS DEL CATÁLOGO
-- ---------------------------------------------------
INSERT IGNORE INTO products (code, name, description, quantity, minimum_stock, location_id, entry_date, status)
SELECT p.code, p.name, p.description, p.quantity, p.minimum_stock, l.id, CURDATE(), 'ACTIVO'
FROM (
  -- CAPILARES (Zona A)
  SELECT 'CAP-001' code, 'Polímero 1000g' name, 'Materia prima capilar' description, 40  quantity, 10 minimum_stock, 'Zona A' zone, 'Pasillo Capilares' aisle, 'Estante 01' shelf, 'Nivel 1' level UNION ALL
  SELECT 'CAP-002', 'Glicol 1000ml',                    'Materia prima capilar',            35,  10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-003', 'Acrilato 500g',                    'Materia prima capilar',            30,  8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-004', 'Carbómero 500g',                   'Materia prima capilar',            25,  8,  'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-005', 'Kit Alisador Laxios 1000ml',       'Kit alisador profesional',         18,  10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-006', 'Reparador Capilar 250ml',          'Tratamiento reparador',            80,  15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-007', 'Tónico Capilar 120ml',             'Tónico para el cuero cabelludo',   65,  15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-008', 'Cepillo para el cabello',          'Cepillo capilar',                  120, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-009', 'Shampoo Control Caspa 400ml',      'Shampoo anticaspa',                95,  20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-010', 'Shampoo Zero Sal 400ml',           'Shampoo sin sal',                  110, 20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-011', 'Bálsamo Zero Sal 400ml',           'Bálsamo acondicionador sin sal',   90,  20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-012', 'Crema para peinar 300g',           'Crema estilizante',                85,  15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-013', 'Crema desenredante 300g',          'Crema desenredante',               75,  15, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-014', 'Silicona líquida 60ml',            'Silicona líquida capilar',         70,  15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-015', 'Silicona en crema 120ml',          'Silicona en crema',                60,  15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-016', 'Silicona espesa 60ml',             'Silicona espesa',                  55,  15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-017', 'Cera moldeadora 100g',             'Cera moldeadora',                  50,  10, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-018', 'Gel Fijación Extrema 250g',        'Gel de fijación extrema',          140, 20, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-019', 'Cera en pasta 100g',               'Cera en pasta',                    45,  10, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-020', 'Laca 400ml',                       'Laca fijadora',                    100, 20, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-021', 'Aclarador 500ml',                  'Aclarador capilar',                8,   10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-022', 'Agua oxigenada 900ml',             'Peróxido de hidrógeno',            42,  15, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-023', 'Shampoo Profesional 1000ml',       'Shampoo profesional para salón',   130, 25, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-024', 'Rinse Profesional 1000ml',         'Rinse profesional para salón',     115, 25, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-025', 'Shampoo con Acondicionador 400ml', 'Shampoo 2 en 1',                   90,  20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-026', 'Bálsamo Acondicionador 400ml',     'Bálsamo acondicionador',           88,  20, 'Zona A', 'Pasillo Capilares', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'CAP-027', 'Kit Alisador Dromatic Prof 1000ml','Kit alisador Dromatic profesional',15,  10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'CAP-028', 'Brillantina 250ml',                'Brillantina para el cabello',      60,  15, 'Zona A', 'Pasillo Capilares', 'Estante 04', 'Nivel 1' UNION ALL
  SELECT 'CAP-029', 'Desinfectante Barbicide 500ml',    'Desinfectante para herramientas',  35,  10, 'Zona A', 'Pasillo Capilares', 'Estante 01', 'Nivel 1' UNION ALL

  -- ASEO PERSONAL (Zona B)
  SELECT 'ASP-001', 'Desodorante para pies 100ml',      'Desodorante para pies',            70,  15, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASP-002', 'Desodorante en crema 60g',         'Desodorante en crema',             85,  15, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASP-003', 'Crema de manos Vitamina E 100ml',  'Crema de manos con vitamina E',    95,  20, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASP-004', 'Crema de manos Alta Humect. 100ml','Crema de manos alta humectación',  100, 20, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASP-005', 'Talco para pies 120g',             'Talco para pies',                  60,  15, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASP-006', 'Talco perfumado 200g',             'Talco perfumado',                  55,  15, 'Zona B', 'Pasillo Aseo Personal', 'Estante 01', 'Nivel 1' UNION ALL

  -- ASEO HOGAR (Zona C)
  SELECT 'ASH-001', 'Limpiador de vidrios 500ml',       'Limpiavidrios',                    75,  15, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-002', 'Ambientador 500ml',                'Ambientador líquido',              90,  15, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-003', 'Lustrador de muebles 400ml',       'Lustrador para muebles de madera', 45,  10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-004', 'Shampoo para carros 1000ml',       'Shampoo para automóviles',         30,  10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-005', 'Aceite lubricante 250ml',          'Aceite multiusos lubricante',      50,  10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-006', 'Shampoo para perros 500ml',        'Shampoo para mascotas',            40,  10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'ASH-007', 'Limpiador de hornos y estufas 500ml','Desengrasante de cocina',        6,   10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'ASH-008', 'Desinfectante para baños 1000ml',  'Desinfectante para baños',         65,  15, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'ASH-009', 'Detergente Wash Fine 3000ml',      'Detergente líquido Wash Fine',     28,  10, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'ASH-010', 'Detergente líquido 1000ml',        'Detergente líquido general',       120, 25, 'Zona C', 'Pasillo Aseo Hogar', 'Estante 02', 'Nivel 1' UNION ALL

  -- TOCADOR (Zona D)
  SELECT 'TOC-001', 'Aceite de Almendras 120ml',        'Aceite de almendras corporal',     70,  15, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-002', 'Repelente de insectos 120ml',      'Repelente corporal',               55,  15, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-003', 'Gel antibacterial 250ml',          'Gel antibacterial para manos',     150, 25, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-004', 'Jabón antibacterial 500ml',        'Jabón antibacterial líquido',      95,  20, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-005', 'Jabón para el cuerpo 500ml',       'Jabón líquido corporal',           110, 20, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-006', 'Jabón de tocador 100g',            'Jabón sólido de tocador',          180, 30, 'Zona D', 'Pasillo Tocador', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'TOC-007', 'Aceite bronceador 200ml',          'Aceite bronceador solar',          25,  10, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-008', 'Protector solar 120ml',            'Protector solar corporal',         80,  15, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-009', 'Gel reductor 250g',                'Gel reductor corporal',            40,  10, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-010', 'Crema depilatoria rostro 50g',     'Crema depilatoria facial',         35,  10, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-011', 'Crema depilatoria cuerpo 100g',    'Crema depilatoria corporal',       48,  10, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-012', 'Gel para después de afeitar 100ml','Gel after shave',                  60,  15, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'TOC-013', 'Gel de afeitar 200ml',             'Gel para afeitar',                 65,  15, 'Zona D', 'Pasillo Tocador', 'Estante 02', 'Nivel 1' UNION ALL

  -- MAQUILLAJE (Zona E)
  SELECT 'MAQ-001', 'Sacapuntas para maquillaje',       'Sacapuntas cosmético',             85,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-002', 'Mascarilla plástica de Pepino 100g','Mascarilla facial de pepino',     55,  10, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-003', 'Polvo compacto 15g',               'Polvo facial compacto',            72,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-004', 'Corrector facial 15ml',            'Corrector de imperfecciones',      60,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-005', 'Rubor 10g',                        'Rubor en polvo',                   50,  10, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-006', 'Gel desmaquillador 100ml',         'Gel para desmaquillar',            65,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-007', 'Delineador líquido 8ml',           'Delineador de ojos líquido',       58,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-008', 'Pestañina Kohler 10ml',            'Máscara para pestañas Kohler',     45,  10, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-009', 'Pestañina Dromatic 10ml',          'Máscara para pestañas Dromatic',   90,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-010', 'Lápiz delineador de ojos',         'Lápiz delineador',                 110, 20, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-011', 'Sombras 5g',                       'Sombras para ojos',                75,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-012', 'Crema de cacao 15g',               'Bálsamo labial de cacao',          120, 20, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-013', 'Protector labial 15g',             'Protector labial hidratante',      95,  20, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-014', 'Lápiz de labios',                  'Lápiz delineador de labios',       70,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL
  SELECT 'MAQ-015', 'Disolvente para esmaltes 100ml',   'Removedor de esmalte',             85,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-016', 'Secante para esmaltes 15ml',       'Secante rápido de esmalte',        40,  10, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-017', 'Endurecedor de uñas 15ml',         'Endurecedor de uñas',              48,  10, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-018', 'Removedor 100ml',                  'Removedor de esmalte',             62,  15, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-019', 'Removedor de cutícula 30ml',       'Removedor de cutícula',            9,   10, 'Zona E', 'Pasillo Maquillaje', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'MAQ-020', 'Labial de larga duración',         'Labial de larga duración',         130, 20, 'Zona E', 'Pasillo Maquillaje', 'Estante 02', 'Nivel 1' UNION ALL

  -- PERFUMERÍA (Zona F)
  SELECT 'PER-001', 'Perfume femenino 100ml',           'Perfumería femenina Dromatic',     55,  15, 'Zona F', 'Pasillo Perfumería', 'Estante 01', 'Nivel 1' UNION ALL
  SELECT 'PER-002', 'Perfume masculino 100ml',          'Perfumería masculina Dromatic',    50,  15, 'Zona F', 'Pasillo Perfumería', 'Estante 01', 'Nivel 1'
) p
JOIN locations l
  ON l.zone = p.zone AND l.aisle = p.aisle AND l.shelf = p.shelf AND l.level = p.level;

-- ---------------------------------------------------
-- 3) MOVIMIENTOS DE INVENTARIO INICIAL
-- (Se crean solo para los productos nuevos, para que aparezcan en el historial y el dashboard)
-- ---------------------------------------------------
INSERT INTO movements (product_id, user_id, type, quantity, movement_date, reason)
SELECT pr.id, u.id, 'ENTRADA', pr.quantity, pr.entry_date, 'Inventario inicial'
FROM products pr
JOIN users u ON u.username = 'admin'
WHERE (pr.code LIKE 'CAP-%' OR pr.code LIKE 'ASP-%' OR pr.code LIKE 'ASH-%'
    OR pr.code LIKE 'TOC-%' OR pr.code LIKE 'MAQ-%' OR pr.code LIKE 'PER-%')
  AND NOT EXISTS (SELECT 1 FROM movements m WHERE m.product_id = pr.id);
