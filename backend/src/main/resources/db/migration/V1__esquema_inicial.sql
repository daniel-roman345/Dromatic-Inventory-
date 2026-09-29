-- =====================================================================
-- DIS v2 · V1 · Esquema inicial
-- ---------------------------------------------------------------------
-- Inventario multi-módulo de Laboratorios Dromatic:
--   módulos (potes, tapas, etiquetas, materias primas...) → artículos →
--   rótulos de identificación (lotes) → existencias por ubicación.
-- Las ubicaciones se dibujan en mapas: área → sección (pasillo/muro/zona)
--   → estantería (letra) → piso (número).  Ej.: Bodega 1 · Pasillo 4 · C2
--
-- Cantidades personalizables: contenedor (canasta, rollo, caja, bulto...),
-- unidades por contenedor, unidad de medida y peso se escriben libremente.
-- La tabla "suggestions" y el historial solo sugieren, nunca obligan.
--
-- Motor objetivo: MySQL 8 (compatible con MariaDB 10.4+ de XAMPP).
-- Flyway ejecuta este archivo una sola vez; los cambios futuros van en
-- nuevos archivos V2, V3, ... nunca editando uno ya aplicado.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- SEGURIDAD
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  code        VARCHAR(30)  NOT NULL,
  name        VARCHAR(60)  NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_roles_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id                    BIGINT       NOT NULL AUTO_INCREMENT,
  username              VARCHAR(50)  NOT NULL,
  full_name             VARCHAR(120) NOT NULL,
  job_title             VARCHAR(80)  NULL,
  email                 VARCHAR(120) NULL,
  phone                 VARCHAR(20)  NULL COMMENT 'WhatsApp en formato internacional sin +, ej. 573001234567',
  password              VARCHAR(255) NOT NULL COMMENT 'Hash BCrypt',
  role_id               BIGINT       NOT NULL,
  active                BOOLEAN      NOT NULL DEFAULT TRUE,
  must_change_password  BOOLEAN      NOT NULL DEFAULT FALSE,
  receives_stock_alerts BOOLEAN      NOT NULL DEFAULT FALSE,
  failed_attempts       INT          NOT NULL DEFAULT 0,
  locked_until          DATETIME     NULL,
  last_login_at         DATETIME     NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_users_username UNIQUE (username),
  CONSTRAINT uk_users_email UNIQUE (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- MÓDULOS DE INVENTARIO (potes, tapas, etiquetas, materias primas, bobinas, cajas de sachets...)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE inventory_modules (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  code               VARCHAR(30)  NOT NULL,
  name               VARCHAR(60)  NOT NULL,
  description        VARCHAR(255) NULL,
  default_unit       VARCHAR(30)  NOT NULL COMMENT 'Unidad propuesta para artículos nuevos (cada artículo puede usar otra)',
  default_material   VARCHAR(60)  NULL COMMENT 'Tipo de material propuesto en el rótulo',
  tracks_weight      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'TRUE si el formulario muestra el peso de entrada (bobinas); en los demás es opcional',
  location_hint      VARCHAR(120) NULL COMMENT 'Ubicación sugerida cuando el módulo no tiene mapa',
  color              VARCHAR(20)  NOT NULL,
  icon               VARCHAR(40)  NOT NULL,
  sort_order         INT          NOT NULL DEFAULT 0,
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT uk_inventory_modules_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Qué roles pueden modificar cada módulo (el administrador siempre puede).
CREATE TABLE module_editor_roles (
  module_id BIGINT NOT NULL,
  role_id   BIGINT NOT NULL,
  PRIMARY KEY (module_id, role_id),
  CONSTRAINT fk_mer_module FOREIGN KEY (module_id) REFERENCES inventory_modules (id),
  CONSTRAINT fk_mer_role   FOREIGN KEY (role_id)   REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sugerencias para autocompletar (contenedores, unidades, motivos, tipos de
-- material...). Son ayudas: el usuario siempre puede escribir otro valor.
-- El sistema también sugiere lo que ya se ha escrito antes en el historial.
CREATE TABLE suggestions (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  kind        VARCHAR(20)  NOT NULL COMMENT 'CONTENEDOR | UNIDAD | TIPO_MATERIAL | TIPO_<efecto> | MOTIVO_<efecto> (efecto: ENTRADA, SALIDA, TRASLADO, AJUSTE)',
  module_id   BIGINT       NULL COMMENT 'NULL = aplica a todos los módulos',
  value       VARCHAR(80)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT uk_suggestions UNIQUE (kind, module_id, value),
  CONSTRAINT fk_suggestions_module FOREIGN KEY (module_id) REFERENCES inventory_modules (id),
  INDEX idx_suggestions_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- MAPAS: área → sección → estantería (letra) → piso (número)
-- Las coordenadas son celdas de una cuadrícula; el frontend las dibuja.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE map_areas (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  code        VARCHAR(10)  NOT NULL,
  name        VARCHAR(60)  NOT NULL,
  description VARCHAR(255) NULL,
  grid_width  INT          NOT NULL,
  grid_height INT          NOT NULL,
  level_label VARCHAR(20)  NOT NULL DEFAULT 'Piso' COMMENT 'Cómo se le dice a cada nivel: Piso (bodega), Fila (cuarto de etiquetas)',
  levels_from_top BOOLEAN  NOT NULL DEFAULT FALSE COMMENT 'TRUE si el nivel 1 es el de arriba (se cuenta de arriba hacia abajo)',
  sort_order  INT          NOT NULL DEFAULT 0,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT uk_map_areas_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE map_sections (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  area_id       BIGINT       NOT NULL,
  code          VARCHAR(20)  NOT NULL,
  name          VARCHAR(60)  NOT NULL,
  kind          VARCHAR(20)  NOT NULL COMMENT 'PASILLO | MURO | ZONA',
  module_id     BIGINT       NULL COMMENT 'Módulo que se guarda principalmente aquí',
  map_x         INT          NOT NULL,
  map_y         INT          NOT NULL,
  orientation   CHAR(1)      NOT NULL DEFAULT 'H' COMMENT 'H = estanterías en fila, V = en columna',
  reversed      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Sentido: H de derecha a izquierda, V de abajo hacia arriba (para muros que rodean la bodega)',
  double_sided  BOOLEAN      NOT NULL DEFAULT FALSE,
  notes         VARCHAR(255) NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT uk_map_sections_code UNIQUE (area_id, code),
  CONSTRAINT fk_map_sections_area   FOREIGN KEY (area_id)   REFERENCES map_areas (id),
  CONSTRAINT fk_map_sections_module FOREIGN KEY (module_id) REFERENCES inventory_modules (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE racks (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  section_id BIGINT       NOT NULL,
  code       VARCHAR(10)  NOT NULL COMMENT 'Letra de la estantería: A, B, C... (F para las filas del cuarto de etiquetas)',
  levels     INT          NOT NULL COMMENT 'Cantidad de pisos o filas: 1, 2, 3...',
  length     INT          NOT NULL DEFAULT 1 COMMENT 'Largo en celdas del mapa (una estantería larga sin divisiones ocupa varias)',
  position   INT          NOT NULL DEFAULT 0 COMMENT 'Orden dentro de la sección',
  notes      VARCHAR(255) NULL,
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT uk_racks_code UNIQUE (section_id, code),
  CONSTRAINT fk_racks_section FOREIGN KEY (section_id) REFERENCES map_sections (id),
  CONSTRAINT ck_racks_levels CHECK (levels BETWEEN 1 AND 20),
  CONSTRAINT ck_racks_length CHECK (length BETWEEN 1 AND 40)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Elementos de referencia del mapa (puertas, oficina, escaleras, pasillos).
CREATE TABLE map_landmarks (
  id       BIGINT       NOT NULL AUTO_INCREMENT,
  area_id  BIGINT       NOT NULL,
  kind     VARCHAR(20)  NOT NULL COMMENT 'PUERTA | OFICINA | ESCALERA | PASILLO | PARED (da forma al cuarto) | MAQUINA | MALACATE | OBSTACULO | TEXTO',
  label    VARCHAR(60)  NOT NULL,
  map_x    INT          NOT NULL,
  map_y    INT          NOT NULL,
  width    INT          NOT NULL DEFAULT 1,
  height   INT          NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_map_landmarks_area FOREIGN KEY (area_id) REFERENCES map_areas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- CATÁLOGO DE ARTÍCULOS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE items (
  id                          BIGINT        NOT NULL AUTO_INCREMENT,
  module_id                   BIGINT        NOT NULL,
  code                        VARCHAR(50)   NULL COMMENT 'Código interno o SKU (opcional, único por módulo)',
  name                        VARCHAR(150)  NOT NULL,
  presentation                VARCHAR(60)   NULL COMMENT 'Ej.: x250 ml, delantera, trasera',
  description                 VARCHAR(500)  NULL,
  unit_name                   VARCHAR(30)   NOT NULL COMMENT 'Unidad en que se cuenta: unidades, kg, bobinas, metros...',
  minimum_stock               DECIMAL(14,3) NOT NULL DEFAULT 0 COMMENT 'En la unidad del artículo. 0 = sin alerta',
  last_container_name         VARCHAR(40)   NULL COMMENT 'Contenedor de la última entrada (se propone en la siguiente)',
  last_units_per_container    DECIMAL(14,3) NULL COMMENT 'Unidades por contenedor de la última entrada',
  status                      VARCHAR(10)   NOT NULL DEFAULT 'ACTIVO' COMMENT 'ACTIVO | INACTIVO',
  created_by                  BIGINT        NULL,
  created_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_items_module_code UNIQUE (module_id, code),
  CONSTRAINT fk_items_module    FOREIGN KEY (module_id) REFERENCES inventory_modules (id),
  CONSTRAINT fk_items_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT ck_items_min_stock CHECK (minimum_stock >= 0),
  CONSTRAINT ck_items_status CHECK (status IN ('ACTIVO', 'INACTIVO')),
  INDEX idx_items_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imagen delantera y trasera del artículo (etiquetas, potes, tapas...).
CREATE TABLE item_images (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  item_id      BIGINT       NOT NULL,
  side         VARCHAR(10)  NOT NULL COMMENT 'FRONT | BACK',
  content_type VARCHAR(50)  NOT NULL,
  data         MEDIUMBLOB   NOT NULL,
  size_bytes   INT          NOT NULL,
  source       VARCHAR(20)  NOT NULL DEFAULT 'SUBIDA' COMMENT 'SUBIDA | VIDEO (recorte provisional)',
  updated_by   BIGINT       NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_item_images_side UNIQUE (item_id, side),
  CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_images_user FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- RÓTULOS DE IDENTIFICACIÓN (LOTES)
-- Cada campo corresponde al rótulo físico de Laboratorios Dromatic.
-- Obligatorios: artículo, fecha, tipo y usuario que registra.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE lots (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  item_id            BIGINT       NOT NULL,
  label_date         DATE         NOT NULL COMMENT 'FECHA del rótulo',
  material_type      VARCHAR(60)  NOT NULL COMMENT 'TIPO DE MATERIAL escrito en el rótulo: Material de empaque, Materia prima...',
  lot_number         VARCHAR(50)  NULL,
  declared_quantity  VARCHAR(40)  NULL COMMENT 'CANTIDAD tal como está escrita en el rótulo',
  supplier           VARCHAR(120) NULL,
  reception_date     DATE         NULL,
  analysis_date      DATE         NULL,
  reanalysis_date    DATE         NULL,
  expiry_date        DATE         NULL,
  analysis_number    VARCHAR(40)  NULL,
  reanalysis_number  VARCHAR(40)  NULL,
  quality_status     VARCHAR(12)  NULL COMMENT 'CUARENTENA | APROBADO | RECHAZADO',
  responsible        VARCHAR(80)  NULL COMMENT 'RESPONSABLE escrito en el rótulo',
  qc_signature       VARCHAR(80)  NULL COMMENT 'FIRMA CONTROL DE CALIDAD',
  nfpa_health        TINYINT      NULL,
  nfpa_flammability  TINYINT      NULL,
  nfpa_reactivity    TINYINT      NULL,
  nfpa_special       VARCHAR(10)  NULL,
  notes              VARCHAR(500) NULL,
  verified           BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'FALSE = cargado desde los videos, pendiente de verificar',
  created_by         BIGINT       NOT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by         BIGINT       NULL,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_lots_item       FOREIGN KEY (item_id)    REFERENCES items (id),
  CONSTRAINT fk_lots_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_lots_updated_by FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT ck_lots_quality CHECK (quality_status IS NULL OR quality_status IN ('CUARENTENA', 'APROBADO', 'RECHAZADO')),
  CONSTRAINT ck_lots_nfpa CHECK ((nfpa_health IS NULL OR nfpa_health BETWEEN 0 AND 4)
                             AND (nfpa_flammability IS NULL OR nfpa_flammability BETWEEN 0 AND 4)
                             AND (nfpa_reactivity IS NULL OR nfpa_reactivity BETWEEN 0 AND 4)),
  INDEX idx_lots_item (item_id),
  INDEX idx_lots_lot_number (lot_number),
  INDEX idx_lots_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existencia de un rótulo en una ubicación. Un rótulo puede quedar
-- repartido en varias ubicaciones después de un traslado parcial.
CREATE TABLE stock (
  id                BIGINT        NOT NULL AUTO_INCREMENT,
  lot_id            BIGINT        NOT NULL,
  rack_id           BIGINT        NULL COMMENT 'NULL cuando el módulo no tiene mapa (materias primas)',
  level             INT           NULL,
  location_note     VARCHAR(120)  NULL COMMENT 'Ubicación escrita cuando no hay mapa',
  quantity          DECIMAL(14,3) NOT NULL COMMENT 'En la unidad del artículo',
  weight_kg         DECIMAL(14,3) NULL COMMENT 'Peso total en kg, si se registró',
  container_name    VARCHAR(40)   NULL COMMENT 'Contenedor con que se guardó (canasta, rollo, caja...)',
  units_per_container DECIMAL(14,3) NULL COMMENT 'Para mostrar el aproximado de contenedores',
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_stock_lot       FOREIGN KEY (lot_id)  REFERENCES lots (id),
  CONSTRAINT fk_stock_rack      FOREIGN KEY (rack_id) REFERENCES racks (id),
  CONSTRAINT ck_stock_quantity CHECK (quantity >= 0),
  CONSTRAINT ck_stock_weight CHECK (weight_kg IS NULL OR weight_kg >= 0),
  INDEX idx_stock_location (rack_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- MOVIMIENTOS (historial y auditoría) — nunca se borran, se anulan.
-- ─────────────────────────────────────────────────────────────────────
-- El nombre del movimiento es libre ("Préstamo", "Devolución"...); el efecto
-- sobre el inventario solo puede ser uno de cuatro: suma, resta, cambia de
-- lugar o corrige el conteo.
CREATE TABLE movements (
  id                  BIGINT        NOT NULL AUTO_INCREMENT,
  effect              VARCHAR(10)   NOT NULL COMMENT 'ENTRADA (suma) | SALIDA (resta) | TRASLADO (cambia de lugar) | AJUSTE (corrige el conteo)',
  movement_type       VARCHAR(60)   NOT NULL COMMENT 'Tipo de movimiento escrito por el usuario',
  item_id             BIGINT        NOT NULL,
  lot_id              BIGINT        NOT NULL,
  quantity            DECIMAL(14,3) NOT NULL COMMENT 'Cantidad movida (nunca negativa)',
  stock_delta         DECIMAL(14,3) NOT NULL COMMENT 'Efecto en el stock total: + entra, - sale, 0 traslado',
  unit_name           VARCHAR(30)   NOT NULL COMMENT 'Unidad del artículo cuando se registró',
  containers          DECIMAL(14,3) NULL COMMENT 'Cómo se contó: 15 cajas...',
  container_name      VARCHAR(40)   NULL COMMENT '...de qué contenedor...',
  units_per_container DECIMAL(14,3) NULL COMMENT '...con cuántas unidades cada una',
  weight_kg           DECIMAL(14,3) NULL COMMENT 'Peso movido en kg, si se registró',
  from_rack_id        BIGINT        NULL,
  from_level          INT           NULL,
  from_note           VARCHAR(120)  NULL,
  to_rack_id          BIGINT        NULL,
  to_level            INT           NULL,
  to_note             VARCHAR(120)  NULL,
  reason              VARCHAR(120)  NULL COMMENT 'Motivo escrito o elegido de las sugerencias',
  note                VARCHAR(500)  NULL,
  reference           VARCHAR(60)   NULL COMMENT 'Remisión, factura u orden de producción',
  movement_date       DATE          NOT NULL,
  created_by          BIGINT        NOT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided              BOOLEAN       NOT NULL DEFAULT FALSE,
  voided_at           DATETIME      NULL,
  voided_by           BIGINT        NULL,
  void_reason         VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_movements_item      FOREIGN KEY (item_id)  REFERENCES items (id),
  CONSTRAINT fk_movements_lot       FOREIGN KEY (lot_id)   REFERENCES lots (id),
  CONSTRAINT fk_movements_from_rack FOREIGN KEY (from_rack_id) REFERENCES racks (id),
  CONSTRAINT fk_movements_to_rack   FOREIGN KEY (to_rack_id)   REFERENCES racks (id),
  CONSTRAINT fk_movements_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_movements_voided_by  FOREIGN KEY (voided_by)  REFERENCES users (id),
  CONSTRAINT ck_movements_effect CHECK (effect IN ('ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE')),
  -- 0 solo en ajustes que corrigen únicamente el peso (bobinas)
  CONSTRAINT ck_movements_quantity CHECK (quantity >= 0),
  INDEX idx_movements_date (movement_date),
  INDEX idx_movements_item (item_id),
  INDEX idx_movements_lot (lot_id),
  INDEX idx_movements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- ALERTAS DE STOCK BAJO
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE stock_alerts (
  id              BIGINT        NOT NULL AUTO_INCREMENT,
  item_id         BIGINT        NOT NULL,
  status          VARCHAR(10)   NOT NULL DEFAULT 'ABIERTA' COMMENT 'ABIERTA | CERRADA',
  quantity        DECIMAL(14,3) NOT NULL COMMENT 'Stock cuando se generó la alerta',
  minimum_stock   DECIMAL(14,3) NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at       DATETIME      NULL,
  closed_reason   VARCHAR(120)  NULL,
  email_status    VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE' COMMENT 'PENDIENTE | ENVIADO | ERROR | SIN_CONFIGURAR | SIN_DESTINATARIOS',
  email_sent_at   DATETIME      NULL,
  email_error     VARCHAR(255)  NULL,
  ack_by          BIGINT        NULL COMMENT 'Quien marcó que ya se está gestionando (ej. pedido hecho)',
  ack_at          DATETIME      NULL,
  ack_note        VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_stock_alerts_item FOREIGN KEY (item_id) REFERENCES items (id),
  CONSTRAINT fk_stock_alerts_ack_by FOREIGN KEY (ack_by) REFERENCES users (id),
  CONSTRAINT ck_stock_alerts_status CHECK (status IN ('ABIERTA', 'CERRADA')),
  INDEX idx_stock_alerts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
