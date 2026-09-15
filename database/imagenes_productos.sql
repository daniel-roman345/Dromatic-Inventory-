-- ============================================================
-- DIS - Imágenes de los productos (visor 3D)
-- Fuente de las imágenes: https://www.dromatic.com.co/web/media/k2/
-- Se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================

USE dromatic_inventory;

-- ---------------------------------------------------
-- Nueva columna image_url en products (nullable).
-- Solo se crea si no existía.
-- ---------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'products'
                      AND column_name = 'image_url');
SET @sql := IF(@col_exists = 0,
               'ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER description',
               'SELECT ''Columna image_url ya existía'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------
-- Imágenes reales del catálogo Dromatic.
-- Los productos con la misma familia (varios tamaños) comparten imagen.
-- ---------------------------------------------------

-- Acrilato Dromatic (todos los tamaños)
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/787ae9ec9023a82f5aa7e4c1a64f73cb_L.jpg'
 WHERE code IN ('069', '4242', '082', '380');

-- Bálsamo Zero Sal
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/f4b6dca0e2911082f0eb6e1df1a0e11d_L.jpg'
 WHERE code IN ('4444', '4445', '4446', '4133');

-- Carbómero Dromatic
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/feb4274796d93ff716e9650163a77fb8_L.jpg'
 WHERE code IN ('7854', '00031', '4562', '411', '0331');

-- Glicol Dromatic
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/01f1a05053c6242fcfa23075e5b963c1_L.jpg'
 WHERE code IN ('4223', '4224', '4225', '4241', '4181');

-- Polímero Dromatic
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/fc34f61d23b74be53ee07d469bd32064_L.jpg'
 WHERE code IN ('4175', '4178', '4179', '4240', '4180');

-- Shampoo Zero Sal
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/c889234799e865bbe90cee71f6cd2e53_L.jpg'
 WHERE code IN ('2131', '4131', '9233', '408');

-- Kit Alisador Laxios
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/af2ef6a0e2c9c528b09655df79f3b312_L.jpg'
 WHERE code IN ('044', '2314');

-- Shampoo Profesional
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/9caa2793658f3cc387f216157300b1ce_L.jpg'
 WHERE code = 'SP-1L';

-- Rinse Profesional
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/ada9a09acea936d776a6f55c82778c43_L.jpg'
 WHERE code = 'RP-1L';

-- Laca Normal
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/e31ace2a15a7c70645ad83df9ecd43b0_L.jpg'
 WHERE code = 'LC-150';

-- Cera Moldeadora (todos los tamaños)
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/48ee1e8a0a8f50dce4f8cb9ab418e211_L.jpg'
 WHERE code IN ('CM-060', 'CM-125', 'CM-250', 'CM-500');

-- Aclarador Progressive
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/d61d44254608dd06ccdd2ff02982d14d_L.jpg'
 WHERE code IN ('AC-100', 'AC-200', 'AC-400');

-- Agua Oxigenada
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/184b7cb84d7b456c96a0bdfbbeaa5f14_L.jpg'
 WHERE code IN ('AO-10V', 'AO-20V', 'AO-30V', 'AO-40V');

-- Brillantina
UPDATE products
   SET image_url = 'https://www.dromatic.com.co/web/media/k2/items/cache/e0a70f72bdae9885bfc32d7cd19a26a1_L.jpg'
 WHERE code IN ('BR-060', 'BR-125', 'BR-250');

SELECT COUNT(*) AS productos_con_imagen FROM products WHERE image_url IS NOT NULL AND image_url <> '';
