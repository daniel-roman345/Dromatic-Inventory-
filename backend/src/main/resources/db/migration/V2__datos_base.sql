-- =====================================================================
-- DIS v2 · V2 · Datos base
-- ---------------------------------------------------------------------
-- Roles, módulos de inventario, permisos por módulo, sugerencias para
-- autocompletar y la distribución inicial de los mapas.
--
-- Unidades, contenedores y motivos son solo SUGERENCIAS: en cada entrada
-- se puede escribir cualquier otro valor (las cantidades varían mucho).
--
-- Los mapas se construyeron con el dibujo a mano de la bodega 1 y los
-- videos de recorrido (septiembre 2026). Lo marcado "Por confirmar" se
-- corrige desde el sistema (Administración → Mapas) sin programar.
-- Los usuarios NO se crean aquí: los crea el sistema al iniciar por
-- primera vez con contraseñas aleatorias (ver InitialUsersBootstrap).
-- =====================================================================

-- ─── Roles ───────────────────────────────────────────────────────────
INSERT INTO roles (code, name, description) VALUES
  ('ADMIN',      'Administrador del sistema', 'Gestiona usuarios, mapas y configuración. Puede modificar todos los módulos.'),
  ('JEFE',       'Jefatura',                  'Ve todos los módulos, mapas, alertas y reportes. No modifica información.'),
  ('BODEGA',     'Bodega',                    'Registra y mueve potes, tapas, etiquetas, bobinas y cajas de sachets. Solo consulta materias primas.'),
  ('PRODUCCION', 'Producción',                'Registra y mueve materias primas y graneles (kg). Solo consulta los demás módulos.'),
  ('CONSULTA',   'Consulta',                  'Solo visualiza. Pensado para computadores de consulta general.');

-- ─── Módulos de inventario ───────────────────────────────────────────
INSERT INTO inventory_modules (code, name, description, default_unit, default_material, tracks_weight, location_hint, color, icon, sort_order) VALUES
  ('POTES',           'Potes',            'Envases (potes y frascos) guardados en canastas en los pasillos de la bodega 1.', 'unidades', 'Material de empaque', FALSE, NULL,                   'teal',   'bottle',   1),
  ('TAPAS',           'Tapas',            'Tapas de envases guardadas en las estanterías del muro de la bodega 1.',          'unidades', 'Material de empaque', FALSE, NULL,                   'amber',  'circle',   2),
  ('ETIQUETAS',       'Etiquetas',        'Etiquetas delanteras y traseras en rollos, en el cuarto de etiquetas.',           'unidades', 'Material de empaque', FALSE, NULL,                   'purple', 'tag',      3),
  ('MATERIAS_PRIMAS', 'Materias primas',  'Materias primas y graneles de producción.',                                      'kg',       'Materia prima',       FALSE, 'Área de producción',   'coral',  'flask',    4),
  ('BOBINAS',         'Bobinas',          'Bobinas de material de empaque; se registra la cantidad de bobinas y su peso.',   'bobinas',  'Material de empaque', TRUE,  'Abajo de la bodega 1', 'blue',   'cylinder', 5),
  ('CAJAS_SACHETS',   'Cajas de sachets', 'Cajas con sachets; cada caja trae una cantidad de unidades que varía.',           'unidades', 'Material de empaque', FALSE, NULL,                   'pink',   'box',      6);

-- ─── Quién modifica cada módulo (el administrador siempre puede) ────
INSERT INTO module_editor_roles (module_id, role_id)
SELECT m.id, r.id FROM inventory_modules m JOIN roles r
  ON (m.code IN ('POTES', 'TAPAS', 'ETIQUETAS', 'BOBINAS', 'CAJAS_SACHETS') AND r.code = 'BODEGA')
  OR (m.code = 'MATERIAS_PRIMAS' AND r.code = 'PRODUCCION');

-- ─── Sugerencias para autocompletar (nunca obligan) ──────────────────
-- Contenedores y unidades generales; el administrador puede agregar más
-- y el sistema también propone lo que ya se ha usado en el historial.
INSERT INTO suggestions (kind, module_id, value, sort_order) VALUES
  ('CONTENEDOR', NULL, 'canasta', 1),
  ('CONTENEDOR', NULL, 'caja',    2),
  ('CONTENEDOR', NULL, 'rollo',   3),
  ('CONTENEDOR', NULL, 'bolsa',   4),
  ('CONTENEDOR', NULL, 'paquete', 5),
  ('CONTENEDOR', NULL, 'bulto',   6),
  ('CONTENEDOR', NULL, 'granel',  7),
  ('CONTENEDOR', NULL, 'tambor',  8),
  ('CONTENEDOR', NULL, 'estiba',  9),
  ('UNIDAD', NULL, 'unidades',   1),
  ('UNIDAD', NULL, 'kg',         2),
  ('UNIDAD', NULL, 'g',          3),
  ('UNIDAD', NULL, 'litros',     4),
  ('UNIDAD', NULL, 'bobinas',    5),
  ('UNIDAD', NULL, 'rollos',     6),
  ('UNIDAD', NULL, 'metros',     7),
  -- Tipos de material del rótulo de identificación
  ('TIPO_MATERIAL', NULL, 'Material de empaque', 1),
  ('TIPO_MATERIAL', NULL, 'Materia prima',       2),
  ('TIPO_MATERIAL', NULL, 'Producto a granel',   3),
  ('TIPO_MATERIAL', NULL, 'Producto en proceso', 4),
  ('TIPO_MATERIAL', NULL, 'Producto intermedio', 5),
  ('TIPO_MATERIAL', NULL, 'Producto terminado',  6),
  -- Tipos de movimiento frecuentes, agrupados por su efecto en el inventario.
  -- Si el usuario escribe uno nuevo, el sistema le pregunta si suma, resta,
  -- cambia de lugar o corrige el conteo.
  ('TIPO_ENTRADA',  NULL, 'Entrada',                   1),
  ('TIPO_ENTRADA',  NULL, 'Compra',                    2),
  ('TIPO_ENTRADA',  NULL, 'Devolución',                3),
  ('TIPO_ENTRADA',  NULL, 'Préstamo recibido',         4),
  ('TIPO_SALIDA',   NULL, 'Salida',                    1),
  ('TIPO_SALIDA',   NULL, 'Despacho',                  2),
  ('TIPO_SALIDA',   NULL, 'Consumo',                   3),
  ('TIPO_SALIDA',   NULL, 'Préstamo',                  4),
  ('TIPO_SALIDA',   NULL, 'Baja',                      5),
  ('TIPO_TRASLADO', NULL, 'Traslado',                  1),
  ('TIPO_TRASLADO', NULL, 'Reubicación',               2),
  ('TIPO_AJUSTE',   NULL, 'Ajuste de inventario',      1),
  ('TIPO_AJUSTE',   NULL, 'Conteo físico',             2),
  -- Motivos frecuentes; siempre se puede escribir otro
  ('MOTIVO_ENTRADA', NULL, 'Compra a proveedor',          1),
  ('MOTIVO_ENTRADA', NULL, 'Devolución de producción',    2),
  ('MOTIVO_ENTRADA', NULL, 'Sobrante de producción',      3),
  ('MOTIVO_ENTRADA', NULL, 'Traslado desde otra área',    4),
  ('MOTIVO_ENTRADA', NULL, 'Inventario inicial',          5),
  ('MOTIVO_SALIDA',  NULL, 'Envío a producción',          1),
  ('MOTIVO_SALIDA',  NULL, 'Envío a línea de envase',     2),
  ('MOTIVO_SALIDA',  NULL, 'Devolución a proveedor',      3),
  ('MOTIVO_SALIDA',  NULL, 'Dañado o vencido',            4),
  ('MOTIVO_SALIDA',  NULL, 'Muestra para control de calidad', 5),
  ('MOTIVO_TRASLADO', NULL, 'Reorganización de bodega',   1),
  ('MOTIVO_TRASLADO', NULL, 'Cambio de estantería',       2),
  ('MOTIVO_AJUSTE',  NULL, 'Conteo físico',               1),
  ('MOTIVO_AJUSTE',  NULL, 'Corrección de un error',      2);

-- =====================================================================
-- MAPA · BODEGA 1 (potes en los pasillos, tapas en los muros)
-- Cuadrícula de 14 x 19 celdas. Cada estantería ocupa una celda.
-- =====================================================================
INSERT INTO map_areas (code, name, description, grid_width, grid_height, sort_order) VALUES
  ('B1', 'Bodega 1', 'Bodega de potes (pasillos) y tapas (estanterías de los muros).', 14, 19, 1);

INSERT INTO map_landmarks (area_id, kind, label, map_x, map_y, width, height)
SELECT id, 'ESCALERA',  'Escaleras abajo y oficinas', 0, 0, 2, 1 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'PASILLO',   'Pasillo general',            0, 1, 1, 17 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'OBSTACULO', 'Por confirmar',              8, 4, 1, 1 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'ESCALERA',  'Mezanine (escalera de caracol)', 5, 17, 3, 2 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'OFICINA',   'Oficina (escritorio)',       12, 17, 2, 2 FROM map_areas WHERE code = 'B1';

-- Secciones de la bodega 1: (código, nombre, tipo, módulo, x, y, orientación, doble, notas, orden)
INSERT INTO map_sections (area_id, code, name, kind, module_id, map_x, map_y, orientation, double_sided, notes, sort_order)
SELECT a.id, s.code, s.name, s.kind, m.id, s.x, s.y, s.o, s.d, s.notes, s.ord
FROM map_areas a
JOIN (
  SELECT 'MS'  AS code, 'Muro superior'                AS name, 'MURO'    AS kind, 'TAPAS' AS module, 2 AS x, 0 AS y,  'H' AS o, FALSE AS d, 'Estanterías de tapas junto a las escaleras.' AS notes, 1 AS ord UNION ALL
  SELECT 'P1',  'Pasillo 1',                   'PASILLO', 'POTES', 2, 2,  'H', FALSE, NULL, 2 UNION ALL
  SELECT 'P2',  'Pasillo 2',                   'PASILLO', 'POTES', 2, 4,  'H', FALSE, 'En el dibujo aparece un bloque oscuro al final (por confirmar).', 3 UNION ALL
  SELECT 'P3',  'Pasillo 3',                   'PASILLO', 'POTES', 2, 6,  'H', FALSE, 'Igual al pasillo 2: misma cantidad de estanterías y pisos. Por confirmar.', 4 UNION ALL
  SELECT 'P4',  'Pasillo 4',                   'PASILLO', 'POTES', 2, 8,  'H', TRUE,  'Igual a los pasillos 2 y 3, con estantería doble.', 5 UNION ALL
  SELECT 'P5',  'Pasillo 5',                   'PASILLO', 'POTES', 2, 10, 'H', FALSE, 'Igual, aparte de la estantería doble.', 6 UNION ALL
  SELECT 'P6',  'Pasillo 6',                   'PASILLO', 'POTES', 2, 12, 'H', TRUE,  'Estantería doble entre los pasillos 6 y 7.', 7 UNION ALL
  SELECT 'P6B', 'Pasillo 6 · fila hasta E',    'PASILLO', 'POTES', 2, 13, 'H', FALSE, 'Al lado del pasillo 6, otra fila que llega hasta la E3.', 8 UNION ALL
  SELECT 'P7',  'Pasillo 7',                   'PASILLO', 'POTES', 2, 15, 'H', TRUE,  NULL, 9 UNION ALL
  SELECT 'P7D', 'Pasillo 7 · a la derecha',    'PASILLO', 'POTES', 7, 15, 'H', FALSE, 'Estanterías a la derecha del pasillo 7.', 10 UNION ALL
  SELECT 'MD',  'Muro derecho',                'MURO',    'TAPAS', 11, 2, 'V', FALSE, 'Estantería I del muro derecho.', 11 UNION ALL
  SELECT 'OF',  'Junto a la oficina',          'ZONA',    'POTES', 10, 17, 'H', FALSE, 'Estantes pequeños al lado de la oficina. Cantidad y pisos por confirmar.', 12
) s
JOIN inventory_modules m ON m.code = s.module
WHERE a.code = 'B1';

-- Estanterías: (sección, letras, pisos). Helper: una fila por estantería.
INSERT INTO racks (section_id, code, levels, position)
SELECT sec.id, r.code, r.levels, r.pos
FROM map_sections sec
JOIN map_areas a ON a.id = sec.area_id AND a.code = 'B1'
JOIN (
  -- Muro superior (tapas): A a G con 3 pisos, H con 2 pisos
  SELECT 'MS' AS sec, 'A' AS code, 3 AS levels, 1 AS pos UNION ALL SELECT 'MS','B',3,2 UNION ALL SELECT 'MS','C',3,3 UNION ALL
  SELECT 'MS','D',3,4 UNION ALL SELECT 'MS','E',3,5 UNION ALL SELECT 'MS','F',3,6 UNION ALL SELECT 'MS','G',3,7 UNION ALL SELECT 'MS','H',2,8 UNION ALL
  -- Pasillo 1: A a G, 3 pisos
  SELECT 'P1','A',3,1 UNION ALL SELECT 'P1','B',3,2 UNION ALL SELECT 'P1','C',3,3 UNION ALL SELECT 'P1','D',3,4 UNION ALL
  SELECT 'P1','E',3,5 UNION ALL SELECT 'P1','F',3,6 UNION ALL SELECT 'P1','G',3,7 UNION ALL
  -- Pasillo 2: A a F, 3 pisos
  SELECT 'P2','A',3,1 UNION ALL SELECT 'P2','B',3,2 UNION ALL SELECT 'P2','C',3,3 UNION ALL SELECT 'P2','D',3,4 UNION ALL
  SELECT 'P2','E',3,5 UNION ALL SELECT 'P2','F',3,6 UNION ALL
  -- Pasillos 3, 4 y 5: A a G, 3 pisos
  SELECT 'P3','A',3,1 UNION ALL SELECT 'P3','B',3,2 UNION ALL SELECT 'P3','C',3,3 UNION ALL SELECT 'P3','D',3,4 UNION ALL
  SELECT 'P3','E',3,5 UNION ALL SELECT 'P3','F',3,6 UNION ALL SELECT 'P3','G',3,7 UNION ALL
  SELECT 'P4','A',3,1 UNION ALL SELECT 'P4','B',3,2 UNION ALL SELECT 'P4','C',3,3 UNION ALL SELECT 'P4','D',3,4 UNION ALL
  SELECT 'P4','E',3,5 UNION ALL SELECT 'P4','F',3,6 UNION ALL SELECT 'P4','G',3,7 UNION ALL
  SELECT 'P5','A',3,1 UNION ALL SELECT 'P5','B',3,2 UNION ALL SELECT 'P5','C',3,3 UNION ALL SELECT 'P5','D',3,4 UNION ALL
  SELECT 'P5','E',3,5 UNION ALL SELECT 'P5','F',3,6 UNION ALL SELECT 'P5','G',3,7 UNION ALL
  -- Pasillo 6: A a G, y la fila de al lado que llega hasta la E
  SELECT 'P6','A',3,1 UNION ALL SELECT 'P6','B',3,2 UNION ALL SELECT 'P6','C',3,3 UNION ALL SELECT 'P6','D',3,4 UNION ALL
  SELECT 'P6','E',3,5 UNION ALL SELECT 'P6','F',3,6 UNION ALL SELECT 'P6','G',3,7 UNION ALL
  SELECT 'P6B','A',3,1 UNION ALL SELECT 'P6B','B',3,2 UNION ALL SELECT 'P6B','C',3,3 UNION ALL SELECT 'P6B','D',3,4 UNION ALL
  SELECT 'P6B','E',3,5 UNION ALL
  -- Pasillo 7 (según el dibujo: A y B de 2 pisos, C de 2, D de 3) y a su derecha A a C de 3 pisos
  SELECT 'P7','A',2,1 UNION ALL SELECT 'P7','B',2,2 UNION ALL SELECT 'P7','C',2,3 UNION ALL SELECT 'P7','D',3,4 UNION ALL
  SELECT 'P7D','A',3,1 UNION ALL SELECT 'P7D','B',3,2 UNION ALL SELECT 'P7D','C',3,3 UNION ALL
  -- Muro derecho: estantería I de 3 pisos
  SELECT 'MD','I',3,1 UNION ALL
  -- Estantes pequeños junto a la oficina (por confirmar)
  SELECT 'OF','J',3,1 UNION ALL SELECT 'OF','K',3,2
) r ON r.sec = sec.code;

-- =====================================================================
-- MAPA · CUARTO DE ETIQUETAS (2 zonas)
-- Construido con el video de recorrido. Cuadrícula de 7 x 8 celdas.
-- =====================================================================
INSERT INTO map_areas (code, name, description, grid_width, grid_height, sort_order) VALUES
  ('CE', 'Cuarto de etiquetas', 'Cuarto de etiquetas con dos zonas de estanterías.', 7, 8, 2);

INSERT INTO map_landmarks (area_id, kind, label, map_x, map_y, width, height)
SELECT id, 'PUERTA',  'Entrada',          0, 1, 1, 1 FROM map_areas WHERE code = 'CE' UNION ALL
SELECT id, 'PASILLO', 'Pasillo zona 1',   1, 1, 4, 1 FROM map_areas WHERE code = 'CE' UNION ALL
SELECT id, 'TEXTO',   'Zona 2',           0, 5, 1, 1 FROM map_areas WHERE code = 'CE' UNION ALL
SELECT id, 'PASILLO', 'Pasillo zona 2',   1, 6, 4, 1 FROM map_areas WHERE code = 'CE';

INSERT INTO map_sections (area_id, code, name, kind, module_id, map_x, map_y, orientation, double_sided, notes, sort_order)
SELECT a.id, s.code, s.name, s.kind, m.id, s.x, s.y, s.o, FALSE, s.notes, s.ord
FROM map_areas a
JOIN (
  SELECT 'Z1I' AS code, 'Zona 1 · estantería izquierda' AS name, 'MURO' AS kind, 1 AS x, 0 AS y, 'H' AS o, 'Estantería amarilla a la izquierda al entrar. Módulos y pisos por confirmar.' AS notes, 1 AS ord UNION ALL
  SELECT 'Z1D', 'Zona 1 · estantería derecha', 'MURO', 1, 2, 'H', 'Estantería amarilla a la derecha al entrar. Módulos y pisos por confirmar.', 2 UNION ALL
  SELECT 'Z1P', 'Zona 1 · arrume en piso',     'ZONA', 5, 0, 'V', 'Canastas y cajas apiladas en el piso al fondo del cuarto.', 3 UNION ALL
  SELECT 'Z2',  'Zona 2 · estantería',         'MURO', 1, 5, 'H', 'Segunda zona del cuarto. Módulos y pisos por confirmar.', 4
) s
JOIN inventory_modules m ON m.code = 'ETIQUETAS'
WHERE a.code = 'CE';

INSERT INTO racks (section_id, code, levels, position)
SELECT sec.id, r.code, r.levels, r.pos
FROM map_sections sec
JOIN map_areas a ON a.id = sec.area_id AND a.code = 'CE'
JOIN (
  SELECT 'Z1I' AS sec, 'A' AS code, 6 AS levels, 1 AS pos UNION ALL SELECT 'Z1I','B',6,2 UNION ALL SELECT 'Z1I','C',6,3 UNION ALL SELECT 'Z1I','D',6,4 UNION ALL
  SELECT 'Z1D','A',6,1 UNION ALL SELECT 'Z1D','B',6,2 UNION ALL SELECT 'Z1D','C',6,3 UNION ALL SELECT 'Z1D','D',6,4 UNION ALL
  SELECT 'Z1P','A',1,1 UNION ALL SELECT 'Z1P','B',1,2 UNION ALL
  SELECT 'Z2','A',6,1 UNION ALL SELECT 'Z2','B',6,2 UNION ALL SELECT 'Z2','C',6,3 UNION ALL SELECT 'Z2','D',6,4
) r ON r.sec = sec.code;
