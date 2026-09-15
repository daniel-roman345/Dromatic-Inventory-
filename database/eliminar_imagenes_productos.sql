-- ============================================================
-- DIS - Elimina la columna image_url de products (deshace la
-- migración anterior porque no se pudo obtener imágenes de
-- frente y reverso de los productos).
-- Se puede ejecutar varias veces sin errores.
-- ============================================================

USE dromatic_inventory;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'products'
                      AND column_name = 'image_url');
SET @sql := IF(@col_exists = 1,
               'ALTER TABLE products DROP COLUMN image_url',
               'SELECT ''Columna image_url ya no existía'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
