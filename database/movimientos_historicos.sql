-- ============================================================
-- DIS - Movimientos históricos de los últimos 30 días.
-- Genera entradas y salidas realistas repartidas por fechas
-- para que los filtros por fecha, el dashboard y los reportes
-- muestren información variada.
--
-- Se puede ejecutar varias veces: solo genera movimientos si
-- todavía no hay historial fuera de "Inventario inicial".
-- ============================================================

USE dromatic_inventory;

-- Solo generar si aún no existen movimientos históricos.
SET @yahay := (SELECT COUNT(*) FROM movements WHERE reason <> 'Inventario inicial');

-- ============================================================
-- 1) TABLA DE PLAN: qué queremos cargar (fecha, tipo, producto, cant., motivo, ref, usuario)
-- ============================================================
DROP TEMPORARY TABLE IF EXISTS plan_movs;
CREATE TEMPORARY TABLE plan_movs (
  offset_dias INT, tipo VARCHAR(10), codigo VARCHAR(50), cantidad INT,
  motivo VARCHAR(255), referencia VARCHAR(50), usuario VARCHAR(50)
);

-- ── Semana 1 (hace 29-23 días) ───────────────────────────
INSERT INTO plan_movs VALUES
(-29,'ENTRADA','CAP-006',60,'Compra a proveedor','REM-0801','admin'),
(-29,'ENTRADA','CAP-008',80,'Compra a proveedor','REM-0801','admin'),
(-28,'SALIDA', 'CAP-006',15,'Despacho / Venta','FAC-1201','operador1'),
(-28,'SALIDA', 'CAP-008',20,'Despacho / Venta','FAC-1201','operador1'),
(-28,'SALIDA', 'CAP-023', 8,'Despacho / Venta','FAC-1201','operador1'),
(-27,'ENTRADA','TOC-006',80,'Compra a proveedor','REM-0802','operador1'),
(-27,'SALIDA', 'ASH-010',18,'Despacho / Venta','FAC-1202','operador1'),
(-26,'ENTRADA','069',    20,'Compra a proveedor','REM-0803','admin'),
(-26,'ENTRADA','4242',   15,'Compra a proveedor','REM-0803','admin'),
(-26,'SALIDA', 'CAP-018',30,'Producción','ORD-0501','operador1'),
(-25,'SALIDA', '2131',   14,'Despacho / Venta','FAC-1203','operador1'),
(-25,'SALIDA', '4131',   10,'Despacho / Venta','FAC-1203','operador1'),
(-25,'SALIDA', 'MAQ-010',12,'Despacho / Venta','FAC-1203','operador1'),
(-24,'ENTRADA','ASP-003',35,'Compra a proveedor','REM-0804','admin'),
(-24,'ENTRADA','ASP-004',35,'Compra a proveedor','REM-0804','admin'),
(-24,'SALIDA', 'TOC-006',22,'Despacho / Venta','FAC-1204','operador1'),
(-23,'SALIDA', '7854',    8,'Producción','ORD-0502','operador1'),
(-23,'SALIDA', '4223',    6,'Producción','ORD-0502','operador1');

-- ── Semana 2 (hace 22-16 días) ───────────────────────────
INSERT INTO plan_movs VALUES
(-22,'ENTRADA','CAP-009',40,'Compra a proveedor','REM-0805','admin'),
(-22,'ENTRADA','CAP-010',50,'Compra a proveedor','REM-0805','admin'),
(-21,'SALIDA', 'CAP-009',18,'Despacho / Venta','FAC-1205','operador1'),
(-21,'SALIDA', 'CAP-010',20,'Despacho / Venta','FAC-1205','operador1'),
(-20,'ENTRADA','LC-150', 40,'Compra a proveedor','REM-0806','operador1'),
(-20,'ENTRADA','AO-20V', 30,'Compra a proveedor','REM-0806','operador1'),
(-20,'SALIDA', 'LC-150', 22,'Despacho / Venta','FAC-1206','operador1'),
(-19,'SALIDA', 'CAP-012',18,'Despacho / Venta','FAC-1207','operador1'),
(-19,'SALIDA', 'CAP-013',15,'Despacho / Venta','FAC-1207','operador1'),
(-18,'ENTRADA','TOC-003',60,'Compra a proveedor','REM-0807','admin'),
(-18,'SALIDA', 'TOC-003',25,'Despacho / Venta','FAC-1208','operador1'),
(-17,'SALIDA', 'ASH-002',15,'Despacho / Venta','FAC-1209','operador1'),
(-17,'SALIDA', 'ASH-008',12,'Despacho / Venta','FAC-1209','operador1'),
(-16,'ENTRADA','MAQ-013',40,'Compra a proveedor','REM-0808','operador1'),
(-16,'ENTRADA','MAQ-012',35,'Compra a proveedor','REM-0808','operador1'),
(-16,'SALIDA', 'MAQ-013',18,'Despacho / Venta','FAC-1210','operador1');

-- ── Semana 3 (hace 15-9 días) ────────────────────────────
INSERT INTO plan_movs VALUES
(-15,'ENTRADA','CAP-011',30,'Compra a proveedor','REM-0809','admin'),
(-15,'SALIDA', 'CAP-011',12,'Despacho / Venta','FAC-1211','operador1'),
(-14,'ENTRADA','ASP-006',40,'Compra a proveedor','REM-0810','operador1'),
(-14,'SALIDA', 'ASP-006',18,'Despacho / Venta','FAC-1212','operador1'),
(-14,'SALIDA', 'ASP-005',12,'Despacho / Venta','FAC-1212','operador1'),
(-13,'SALIDA', 'CAP-020',22,'Despacho / Venta','FAC-1213','operador1'),
(-13,'SALIDA', 'CAP-018',25,'Despacho / Venta','FAC-1213','operador1'),
(-12,'ENTRADA','ASH-010',60,'Compra a proveedor','REM-0811','admin'),
(-12,'SALIDA', 'ASH-010',30,'Despacho / Venta','FAC-1214','operador1'),
(-11,'SALIDA', 'TOC-013',15,'Despacho / Venta','FAC-1215','operador1'),
(-11,'SALIDA', 'TOC-012',14,'Despacho / Venta','FAC-1215','operador1'),
(-10,'ENTRADA','ASH-004',20,'Compra a proveedor','REM-0812','operador1'),
(-10,'SALIDA', 'ASH-004', 6,'Despacho / Venta','FAC-1216','operador1'),
( -9,'SALIDA', 'SP-1L',   8,'Producción','ORD-0503','operador1'),
( -9,'SALIDA', 'RP-1L',   8,'Producción','ORD-0503','operador1');

-- ── Semana 4 (hace 8-2 días) ─────────────────────────────
INSERT INTO plan_movs VALUES
( -8,'ENTRADA','CAP-006',40,'Compra a proveedor','REM-0813','admin'),
( -8,'ENTRADA','CAP-008',30,'Compra a proveedor','REM-0813','admin'),
( -7,'SALIDA', 'CAP-006',18,'Despacho / Venta','FAC-1217','operador1'),
( -7,'SALIDA', 'CAP-008',20,'Despacho / Venta','FAC-1217','operador1'),
( -7,'SALIDA', 'TOC-004',18,'Despacho / Venta','FAC-1217','operador1'),
( -6,'ENTRADA','MAQ-020',50,'Compra a proveedor','REM-0814','operador1'),
( -6,'SALIDA', 'MAQ-020',22,'Despacho / Venta','FAC-1218','operador1'),
( -5,'SALIDA', 'CAP-023',18,'Producción','ORD-0504','operador1'),
( -5,'SALIDA', 'CAP-024',14,'Producción','ORD-0504','operador1'),
( -4,'ENTRADA','ASH-002',35,'Compra a proveedor','REM-0815','admin'),
( -4,'SALIDA', 'ASH-002',18,'Despacho / Venta','FAC-1219','operador1'),
( -3,'SALIDA', 'ASH-008',15,'Despacho / Venta','FAC-1220','operador1'),
( -3,'SALIDA', 'TOC-006',25,'Despacho / Venta','FAC-1220','operador1'),
( -2,'ENTRADA','PER-001',20,'Compra a proveedor','REM-0816','operador1'),
( -2,'ENTRADA','PER-002',20,'Compra a proveedor','REM-0816','operador1'),
( -2,'SALIDA', 'PER-001', 8,'Despacho / Venta','FAC-1221','operador1'),
( -2,'SALIDA', 'PER-002', 7,'Despacho / Venta','FAC-1221','operador1');

-- ── Ayer y hoy ──────────────────────────────────────────
INSERT INTO plan_movs VALUES
( -1,'ENTRADA','CAP-006',30,'Compra a proveedor','REM-0817','admin'),
( -1,'SALIDA', 'CAP-006',12,'Despacho / Venta','FAC-1222','operador1'),
( -1,'SALIDA', 'CAP-009',15,'Despacho / Venta','FAC-1222','operador1'),
( -1,'SALIDA', 'MAQ-013',10,'Despacho / Venta','FAC-1223','operador1'),
(  0,'SALIDA', 'CAP-018',10,'Despacho / Venta','FAC-1224','operador1'),
(  0,'SALIDA', 'CAP-020', 8,'Despacho / Venta','FAC-1224','operador1'),
(  0,'ENTRADA','TOC-006',40,'Compra a proveedor','REM-0818','admin');

-- ============================================================
-- 2) INSERTAR MOVIMIENTOS + AJUSTAR STOCK
--    Solo si @yahay = 0 (no había historial más allá del inicial)
-- ============================================================
INSERT INTO movements (product_id, user_id, type, quantity, movement_date, reason, reference, created_at)
SELECT
  p.id,
  u.id,
  pm.tipo,
  pm.cantidad,
  DATE_ADD(CURDATE(), INTERVAL pm.offset_dias DAY),
  pm.motivo,
  pm.referencia,
  TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL pm.offset_dias DAY),
            MAKETIME(8 + (pm.cantidad MOD 9), (pm.cantidad * 7) MOD 60, 0))
FROM plan_movs pm
JOIN products p ON p.code = pm.codigo
JOIN users u   ON u.username = pm.usuario
WHERE @yahay = 0;

-- Ajustar el stock actual de cada producto según los movimientos generados.
UPDATE products p
JOIN (
  SELECT p2.id,
         SUM(CASE WHEN pm.tipo='ENTRADA' THEN pm.cantidad ELSE -pm.cantidad END) AS delta
    FROM plan_movs pm
    JOIN products p2 ON p2.code = pm.codigo
   GROUP BY p2.id
) d ON d.id = p.id
SET p.quantity = GREATEST(0, p.quantity + d.delta)
WHERE @yahay = 0;

DROP TEMPORARY TABLE plan_movs;

-- ============================================================
-- 3) Resumen
-- ============================================================
SELECT
  IF(@yahay = 0, 'Movimientos históricos generados.', 'Ya existían movimientos históricos: no se insertó nada.') AS resultado,
  (SELECT COUNT(*) FROM movements) AS movimientos_totales,
  (SELECT MIN(movement_date) FROM movements) AS desde,
  (SELECT MAX(movement_date) FROM movements) AS hasta;
