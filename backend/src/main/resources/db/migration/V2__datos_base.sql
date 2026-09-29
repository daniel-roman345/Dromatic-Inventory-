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
-- MAPA · BODEGA 1 (potes en los pasillos, tapas en el muro)
-- ---------------------------------------------------------------------
-- Visto desde arriba con las escaleras de salida arriba a la izquierda,
-- como en el dibujo a mano. Construido con el dibujo y el video largo
-- del recorrido, y corregido por el encargado de la bodega:
--   · arriba a la izquierda solo están las escaleras que bajan a oficinas;
--   · el muro de tapas va de la A a la H por arriba y sigue por el muro
--     derecho: primero los motores que enfrían las máquinas y luego la I;
--   · son 9 pasillos de potes, todos con estanterías de 3 pisos y de
--     diferente largo (los largos se ajustan en el editor de mapas);
--   · la oficina, el malacate y la escalera al mezanine están al fondo,
--     junto a los pasillos 8 y 9.
-- Cuadrícula de 16 x 18 celdas; cada estantería ocupa una celda.
-- =====================================================================
INSERT INTO map_areas (code, name, description, grid_width, grid_height, level_label, levels_from_top, sort_order) VALUES
  ('B1', 'Bodega 1', 'Potes en los pasillos y tapas en el muro.', 16, 18, 'Piso', FALSE, 1);

INSERT INTO map_landmarks (area_id, kind, label, map_x, map_y, width, height)
SELECT id, 'ESCALERA', 'Escaleras',                    0, 0, 2, 1 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'PASILLO',  'Pasillo general',              0, 1, 1, 17 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'MAQUINA',  'Motores',                      13, 1, 1, 4 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'ESCALERA', 'Mezanine',                     11, 17, 2, 1 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'OFICINA',  'Oficina',                      14, 15, 2, 2 FROM map_areas WHERE code = 'B1' UNION ALL
SELECT id, 'MALACATE', 'Malacate',                     13, 17, 3, 1 FROM map_areas WHERE code = 'B1';

-- Secciones: (código, nombre, tipo, módulo, x, y, orientación, doble, notas, orden)
INSERT INTO map_sections (area_id, code, name, kind, module_id, map_x, map_y, orientation, double_sided, notes, sort_order)
SELECT a.id, s.code, s.name, s.kind, m.id, s.x, s.y, s.o, s.d, s.notes, s.ord
FROM map_areas a
JOIN (
  SELECT 'M'  AS code, 'Muro de tapas' AS name, 'MURO' AS kind, 'TAPAS' AS module, 2 AS x, 0 AS y, 'H' AS o, FALSE AS d,
         'Fila de estanterías pegada al muro, de la A a la H.' AS notes, 1 AS ord UNION ALL
  SELECT 'MD', 'Muro derecho',  'MURO',    'TAPAS', 13, 5,  'V', FALSE, 'Después de los motores que enfrían las máquinas.', 2 UNION ALL
  SELECT 'P1', 'Pasillo 1',     'PASILLO', 'POTES', 2, 2,  'H', FALSE, NULL, 3 UNION ALL
  SELECT 'P2', 'Pasillo 2',     'PASILLO', 'POTES', 2, 4,  'H', FALSE, NULL, 4 UNION ALL
  SELECT 'P3', 'Pasillo 3',     'PASILLO', 'POTES', 2, 6,  'H', FALSE, NULL, 5 UNION ALL
  SELECT 'P4', 'Pasillo 4',     'PASILLO', 'POTES', 2, 8,  'H', TRUE,  'Estantería doble.', 6 UNION ALL
  SELECT 'P5', 'Pasillo 5',     'PASILLO', 'POTES', 2, 10, 'H', FALSE, NULL, 7 UNION ALL
  SELECT 'P6', 'Pasillo 6',     'PASILLO', 'POTES', 2, 12, 'H', TRUE,  'Estantería doble.', 8 UNION ALL
  SELECT 'P7', 'Pasillo 7',     'PASILLO', 'POTES', 2, 14, 'H', FALSE, NULL, 9 UNION ALL
  SELECT 'P8', 'Pasillo 8',     'PASILLO', 'POTES', 8, 14, 'H', FALSE, 'Pasillo corto junto a la oficina.', 10 UNION ALL
  SELECT 'P9', 'Pasillo 9',     'PASILLO', 'POTES', 8, 16, 'H', FALSE, 'Pasillo corto junto a la oficina.', 11
) s
JOIN inventory_modules m ON m.code = s.module
WHERE a.code = 'B1';

-- Estanterías: todas de 3 pisos (la H del muro tiene 2). El largo de cada
-- pasillo es el del dibujo; el administrador agrega o quita en el editor.
INSERT INTO racks (section_id, code, levels, position)
SELECT sec.id, r.code, r.levels, r.pos
FROM map_sections sec
JOIN map_areas a ON a.id = sec.area_id AND a.code = 'B1'
JOIN (
  SELECT 'M' AS sec, 'A' AS code, 3 AS levels, 1 AS pos UNION ALL SELECT 'M','B',3,2 UNION ALL SELECT 'M','C',3,3 UNION ALL
  SELECT 'M','D',3,4 UNION ALL SELECT 'M','E',3,5 UNION ALL SELECT 'M','F',3,6 UNION ALL SELECT 'M','G',3,7 UNION ALL SELECT 'M','H',2,8 UNION ALL
  SELECT 'MD','I',3,1 UNION ALL
  SELECT 'P1','A',3,1 UNION ALL SELECT 'P1','B',3,2 UNION ALL SELECT 'P1','C',3,3 UNION ALL SELECT 'P1','D',3,4 UNION ALL
  SELECT 'P1','E',3,5 UNION ALL SELECT 'P1','F',3,6 UNION ALL SELECT 'P1','G',3,7 UNION ALL
  SELECT 'P2','A',3,1 UNION ALL SELECT 'P2','B',3,2 UNION ALL SELECT 'P2','C',3,3 UNION ALL SELECT 'P2','D',3,4 UNION ALL
  SELECT 'P2','E',3,5 UNION ALL SELECT 'P2','F',3,6 UNION ALL
  SELECT 'P3','A',3,1 UNION ALL SELECT 'P3','B',3,2 UNION ALL SELECT 'P3','C',3,3 UNION ALL SELECT 'P3','D',3,4 UNION ALL
  SELECT 'P3','E',3,5 UNION ALL SELECT 'P3','F',3,6 UNION ALL SELECT 'P3','G',3,7 UNION ALL
  SELECT 'P4','A',3,1 UNION ALL SELECT 'P4','B',3,2 UNION ALL SELECT 'P4','C',3,3 UNION ALL SELECT 'P4','D',3,4 UNION ALL
  SELECT 'P4','E',3,5 UNION ALL SELECT 'P4','F',3,6 UNION ALL SELECT 'P4','G',3,7 UNION ALL
  SELECT 'P5','A',3,1 UNION ALL SELECT 'P5','B',3,2 UNION ALL SELECT 'P5','C',3,3 UNION ALL SELECT 'P5','D',3,4 UNION ALL
  SELECT 'P5','E',3,5 UNION ALL SELECT 'P5','F',3,6 UNION ALL SELECT 'P5','G',3,7 UNION ALL
  SELECT 'P6','A',3,1 UNION ALL SELECT 'P6','B',3,2 UNION ALL SELECT 'P6','C',3,3 UNION ALL SELECT 'P6','D',3,4 UNION ALL
  SELECT 'P6','E',3,5 UNION ALL SELECT 'P6','F',3,6 UNION ALL SELECT 'P6','G',3,7 UNION ALL
  SELECT 'P7','A',3,1 UNION ALL SELECT 'P7','B',3,2 UNION ALL SELECT 'P7','C',3,3 UNION ALL SELECT 'P7','D',3,4 UNION ALL
  SELECT 'P8','A',3,1 UNION ALL SELECT 'P8','B',3,2 UNION ALL SELECT 'P8','C',3,3 UNION ALL
  SELECT 'P9','A',3,1 UNION ALL SELECT 'P9','B',3,2 UNION ALL SELECT 'P9','C',3,3
) r ON r.sec = sec.code;

-- =====================================================================
-- MAPA · CUARTO DE ETIQUETAS (2 zonas)
-- ---------------------------------------------------------------------
-- Desde la puerta, como en el video del recorrido. Las estanterías NO
-- están divididas: cada una es una fila larga de canastas, una al lado
-- de la otra. Por eso cada estantería tiene una sola "F" con 7 filas y
-- la fila 1 es la de arriba (así se leen los rótulos en los videos:
-- fila por fila, de arriba hacia abajo y de izquierda a derecha).
-- Ubicación: Estantería 2 · F3 = estantería 2, fila 3.
-- Al fondo de cada pasillo hay canastas arrumadas en el piso.
-- =====================================================================
INSERT INTO map_areas (code, name, description, grid_width, grid_height, level_label, levels_from_top, sort_order) VALUES
  ('CE', 'Cuarto de etiquetas', 'Etiquetas en canastas, en filas de arriba hacia abajo.', 6, 7, 'Fila', TRUE, 2);

INSERT INTO map_landmarks (area_id, kind, label, map_x, map_y, width, height)
SELECT id, 'PUERTA',  'Entrada', 1, 0, 1, 1 FROM map_areas WHERE code = 'CE' UNION ALL
SELECT id, 'PASILLO', 'Zona 1',  1, 1, 1, 5 FROM map_areas WHERE code = 'CE' UNION ALL
SELECT id, 'PASILLO', 'Zona 2',  4, 1, 1, 5 FROM map_areas WHERE code = 'CE';

INSERT INTO map_sections (area_id, code, name, kind, module_id, map_x, map_y, orientation, double_sided, notes, sort_order)
SELECT a.id, s.code, s.name, s.kind, m.id, s.x, s.y, 'V', FALSE, s.notes, s.ord
FROM map_areas a
JOIN (
  SELECT 'E1' AS code, 'Estantería 1' AS name, 'MURO' AS kind, 0 AS x, 1 AS y, 'Zona 1, a la izquierda entrando.' AS notes, 1 AS ord UNION ALL
  SELECT 'E2', 'Estantería 2', 'MURO', 2, 1, 'Zona 1, a la derecha entrando.', 2 UNION ALL
  SELECT 'A1', 'Arrume zona 1', 'ZONA', 1, 6, 'Canastas arrumadas en el piso al fondo de la zona 1.', 3 UNION ALL
  SELECT 'E3', 'Estantería 3', 'MURO', 3, 1, 'Zona 2, a la izquierda.', 4 UNION ALL
  SELECT 'E4', 'Estantería 4', 'MURO', 5, 1, 'Zona 2, a la derecha.', 5 UNION ALL
  SELECT 'A2', 'Arrume zona 2', 'ZONA', 4, 6, 'Canastas arrumadas en el piso al fondo de la zona 2.', 6
) s
JOIN inventory_modules m ON m.code = 'ETIQUETAS'
WHERE a.code = 'CE';

-- Cada estantería larga es una sola "F" de 7 filas y 5 celdas de largo;
-- cada arrume es una pila ("A") de canastas.
INSERT INTO racks (section_id, code, levels, length, position)
SELECT sec.id, r.code, r.levels, r.len, 1
FROM map_sections sec
JOIN map_areas a ON a.id = sec.area_id AND a.code = 'CE'
JOIN (
  SELECT 'E1' AS sec, 'F' AS code, 7 AS levels, 5 AS len UNION ALL
  SELECT 'E2', 'F', 7, 5 UNION ALL
  SELECT 'E3', 'F', 7, 5 UNION ALL
  SELECT 'E4', 'F', 7, 5 UNION ALL
  SELECT 'A1', 'A', 6, 1 UNION ALL
  SELECT 'A2', 'A', 6, 1
) r ON r.sec = sec.code;
