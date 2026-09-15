# Dromatic Inventory System (DIS)

Sistema web de gestión **interna** del inventario de la bodega principal / área de productos capilares de **Laboratorio DròMatic**. Proyecto formativo del programa ADSO (Análisis y Desarrollo de Software) del SENA.

No es una tienda virtual ni un sistema de ventas: controla existencias, entradas, salidas y trazabilidad.

---

## 1. Problema

El inventario se llevaba de forma manual, lo que generaba errores humanos, pérdida de información, dificultad para controlar entradas y salidas, desconocimiento del stock disponible y riesgo de agotamiento de productos.

## 2. Objetivo

Digitalizar y organizar el proceso de inventario para consultar y controlar productos, registrar movimientos con trazabilidad (quién, qué, cuánto y cuándo), detectar productos con stock bajo y generar reportes útiles para la administración.

## 3. Funcionalidades

| Módulo | Qué hace |
|--------|----------|
| **Inicio de sesión** | Usuario y contraseña (sin correo). Contraseñas con hash BCrypt, sesión con JWT (8 horas). **Bloqueo temporal tras 5 intentos fallidos** (15 min por defecto; el administrador puede desbloquear). |
| **Dashboard** | Productos activos, unidades en bodega, entradas y salidas del día y del mes, productos con stock bajo y últimos movimientos. Todo proviene de la base de datos. |
| **Inventario** | Búsqueda por **código o nombre** mientras se escribe, filtro por estado y por stock bajo, detalle del producto con su historial. |
| **Registro de productos** | Código único (no permite duplicados), nombre, descripción, cantidad inicial, stock mínimo, ubicación en la bodega y fecha de ingreso. Valida datos y no permite cantidades negativas. Muestra confirmación al registrar. La cantidad inicial queda en el historial como “Inventario inicial”. |
| **Entradas y salidas** | Un solo registro puede incluir **varios productos** (como una remisión). Se busca el producto por código o nombre (compatible con lector de código de barras), se escribe la cantidad y se agrega a la lista. Motivo desde una lista fija, número de documento y observación opcionales. Las entradas suman stock; las salidas restan y **nunca permiten stock negativo**. Todo el registro se guarda en una sola transacción. |
| **Anulación de movimientos** | Si hubo un error, el administrador **anula** el movimiento indicando el motivo: el stock se revierte y el movimiento queda marcado como ANULADO (con quién y cuándo). Nunca se borra. |
| **Historial** | Todos los movimientos con fecha, hora, tipo, producto, cantidad, motivo, documento, usuario responsable y estado. Filtros por producto, rango de fechas y tipo. |
| **Alertas de stock** | Lista de productos activos con cantidad **igual o menor al stock mínimo**, indicando cuántas unidades faltan y cuáles están agotados. |
| **Reportes PDF** (iText7) | Inventario general, productos con stock bajo y movimientos filtrados por fechas, tipo y producto. Incluyen totales, usuario que generó el reporte y numeración de páginas. |
| **Usuarios** | Crear usuarios, asignar rol, cambiar contraseña, activar/desactivar y desbloquear cuentas. |
| **Ubicaciones** | Zonas, pasillos, estantes y niveles de la bodega. |

## 4. Roles y permisos

| Acción | Administrador | Operador de inventario | Usuario de consulta |
|--------|:---:|:---:|:---:|
| Consultar inventario y alertas de stock | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ❌ |
| Registrar productos | ✅ | ✅ | ❌ |
| Editar / eliminar productos | ✅ | ❌ | ❌ |
| Registrar entradas y salidas | ✅ | ✅ | ❌ |
| Consultar historial de movimientos | ✅ | ✅ | ❌ |
| Anular movimientos | ✅ | ❌ | ❌ |
| Gestionar ubicaciones | ✅ | ✅ | ❌ |
| Generar reportes PDF | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

Los permisos se validan en el **backend** (Spring Security) y además el frontend oculta las opciones que el rol no puede usar.

Un producto que ya tiene movimientos no se puede eliminar (para no perder la trazabilidad); en su lugar se marca como **INACTIVO**.

## 5. Tecnologías

- **Backend:** Java 17, Spring Boot 3.3.4 (Web, Data JPA, Security, Validation), JWT con `io.jsonwebtoken` 0.12.6, iText7 7.2.5, Lombok, Maven.
- **Frontend:** React 18.3, Vite 5.4, React Router 6.26, Axios 1.7.
- **Base de datos:** MySQL 8 (también funciona con MariaDB 10.4+ de XAMPP).
- **Control de versiones:** Git y GitHub.

## 6. Arquitectura

```
React (SPA, Vite) ──HTTP/JSON + JWT──▶ API REST Spring Boot ──JPA/Hibernate──▶ MySQL
                                       controller → service → repository
```

- `controller`: endpoints REST.
- `service`: reglas de negocio (stock, bloqueo, anulaciones, reportes).
- `repository`: acceso a datos con Spring Data JPA.
- `model`: entidades JPA. `dto`: datos de entrada/salida con validaciones.
- `security` / `config`: JWT, filtro de autenticación, permisos por rol y CORS.
- `exception`: manejo centralizado de errores con mensajes claros en español.

## 7. Estructura del proyecto

```
Dromatic-Inventory-/
├── backend/
│   ├── .env.example
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/dromatic/inventory/
│       │   ├── config/  controller/  dto/  exception/
│       │   ├── model/   repository/  security/  service/
│       ├── main/resources/application.properties
│       └── test/java/...            # pruebas unitarias
├── frontend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── components/  context/  pages/  routes/
│       ├── services/    styles/   utils/
├── database/
│   ├── database.sql                 # estructura + roles + administrador inicial
│   └── datos_prueba.sql             # datos de demostración (opcional)
├── docs/                            # requerimientos, HU, BPMN, secuencia, actividades, prototipos
├── evidencias/                      # backlog, sprint, landing page
└── README.md
```

## 8. Requisitos

- Java 17 o superior
- Maven 3.9+
- Node.js 18+
- MySQL 8 (o MariaDB 10.4+ de XAMPP)
- Git

## 9. Configuración de la base de datos

1. Cree la estructura (se puede ejecutar varias veces sin borrar datos):

   ```bash
   mysql -u root -p < database/database.sql
   ```

   Crea la base `dromatic_inventory`, las tablas, los 3 roles y el usuario administrador inicial.

2. (Opcional, para pruebas o sustentación) cargue datos de demostración:

   ```bash
   mysql -u root -p < database/datos_prueba.sql
   mysql -u root -p < database/catalogo_dromatic.sql
   mysql -u root -p < database/catalogo_dromatic_real.sql
   mysql -u root -p < database/movimientos_historicos.sql
   ```

   - `datos_prueba.sql`: 2 ubicaciones básicas, 4 productos capilares y 2 usuarios de prueba (`operador1`, `consulta1`).
   - `catalogo_dromatic.sql` + `catalogo_dromatic_real.sql`: catálogo completo de Dromatic con las 6 categorías (capilares con códigos SKU oficiales, aseo personal, aseo hogar, tocador, maquillaje y perfumería), en total unos 110 productos y sus ubicaciones organizadas por zona.
   - `movimientos_historicos.sql`: entradas y salidas repartidas a lo largo de los últimos 30 días para que el dashboard, el historial y los reportes por fecha muestren información variada.

**Usuarios**:

| Usuario | Rol | Contraseña inicial | Origen |
|---------|-----|--------------------|--------|
| `admin` | ADMINISTRADOR | Definida durante la instalación local (ver `backend/.credenciales.txt`) | database.sql |
| `operador1` | OPERADOR | `Password123` (solo para demostración) | datos_prueba.sql |
| `consulta1` | CONSULTA | `Password123` (solo para demostración) | datos_prueba.sql |

> `admin` es la cuenta real de trabajo. **Cámbiele la contraseña desde "Usuarios" al primer ingreso.** Las cuentas `operador1` y `consulta1` son solo para demostración y no deberían usarse en producción.

## 10. Configuración y ejecución del backend

```bash
cd backend
cp .env.example .env        # en Windows: copy .env.example .env
```

Edite `backend/.env` con su usuario y contraseña de MySQL y un `JWT_SECRET` propio de al menos 32 caracteres. Spring Boot lee este archivo automáticamente (también acepta variables de entorno). El archivo `.env` está en `.gitignore` y **no se sube** al repositorio.

```bash
mvn spring-boot:run
```

La API queda en `http://localhost:8080/api`.

Pruebas unitarias:

```bash
mvn test
```

## 11. Configuración y ejecución del frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8080/api
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. La ruta `/` es la página de presentación y `/login` el acceso al sistema.

Compilación para producción: `npm run build` (genera `frontend/dist`).

### Arranque con un doble clic (Windows)

En la raíz del proyecto hay dos scripts para Windows que evitan tener que abrir XAMPP y las terminales a mano:

- **`iniciar.bat`**: enciende MySQL de XAMPP, abre una ventana con el backend, otra con el frontend, espera a que Vite esté listo y abre el navegador en `http://localhost:5173`.
- **`apagar.bat`**: cierra el frontend, el backend y apaga MySQL de forma ordenada (nunca a la fuerza).

**Úsalos así**: doble clic en `iniciar.bat` para arrancar; cuando termines de trabajar, doble clic en `apagar.bat` antes de apagar el computador.

### Orden para iniciar cada vez

1. **MySQL:** XAMPP Control Panel → *Start* en MySQL.
2. **Backend:** terminal en la carpeta `backend` → `mvn spring-boot:run` (esperar el mensaje `Started DromaticInventoryApplication`).
3. **Frontend:** otra terminal en la carpeta `frontend` → `npm run dev`.
4. Abrir `http://localhost:5173`.

Para apagar: `Ctrl + C` en cada terminal y *Stop* en MySQL desde XAMPP **antes de apagar el computador** (cerrar MySQL de golpe puede dañar sus tablas).

### Problemas comunes

| Mensaje | Causa | Solución |
|---------|-------|----------|
| `NoPluginFoundForPrefixException` al ejecutar Maven | El comando se ejecutó fuera de la carpeta `backend` (no hay `pom.xml`) o quedó mal escrito | `cd backend` y luego `mvn spring-boot:run` |
| “No hay conexión con el servidor” en la pantalla | El backend no está encendido o todavía está arrancando | Iniciar el backend y esperar `Started DromaticInventoryApplication` |
| `Communications link failure` / `Access denied` al iniciar el backend | MySQL apagado o usuario/contraseña incorrectos | Iniciar MySQL en XAMPP y revisar `DB_USERNAME` / `DB_PASSWORD` en `backend/.env` |
| `Port 8080 was already in use` | Ya hay otro backend abierto | Cerrar la otra terminal del backend |
| `Port 5173 is already in use` | El frontend ya está abierto en otra terminal | Usar esa ventana o cerrarla antes de volver a iniciar |
| `Table ... doesn't exist` / error de validación de esquema | No se ejecutó `database/database.sql` | Importar `database/database.sql` |

## 12. Endpoints principales

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| GET | `/api/products?search=&status=` | Consultar / buscar por código o nombre | Todos |
| GET | `/api/products/low-stock` | Alertas de stock bajo | Todos |
| GET | `/api/products/{id}` | Detalle de producto | Todos |
| POST | `/api/products` | Registrar producto | Admin, Operador |
| PUT / DELETE | `/api/products/{id}` | Editar / eliminar producto | Admin |
| GET | `/api/movements?productId=&startDate=&endDate=&type=` | Historial | Admin, Operador |
| GET | `/api/movements/reasons` | Motivos permitidos | Admin, Operador |
| POST | `/api/movements/entry` | Registrar entrada (varios productos) | Admin, Operador |
| POST | `/api/movements/exit` | Registrar salida (varios productos) | Admin, Operador |
| POST | `/api/movements/{id}/void` | Anular movimiento | Admin |
| GET | `/api/dashboard` | Resumen | Admin, Operador |
| GET | `/api/reports/inventory` | PDF inventario | Admin |
| GET | `/api/reports/low-stock` | PDF stock bajo | Admin |
| GET | `/api/reports/movements?startDate=&endDate=&type=&productId=` | PDF movimientos | Admin |
| GET/POST/PUT | `/api/users`, `/api/users/{id}`, `/{id}/active`, `/{id}/unlock` | Gestión de usuarios | Admin |
| GET | `/api/locations` | Listar ubicaciones | Todos |
| POST/PUT/DELETE | `/api/locations`, `/api/locations/{id}` | Gestionar ubicaciones | Admin, Operador |

Ejemplo de registro de salida:

```json
POST /api/movements/exit
{
  "movementDate": "2026-09-12",
  "reason": "Despacho / Venta",
  "reference": "REM-0045",
  "observation": "Pedido cliente",
  "items": [
    { "productId": 1, "quantity": 12 },
    { "productId": 3, "quantity": 4 }
  ]
}
```

## 13. Seguridad

- Contraseñas almacenadas con **BCrypt**; nunca se devuelven en las respuestas.
- Autenticación **JWT** sin estado; si el usuario es desactivado pierde el acceso aunque su token siga vigente.
- Bloqueo temporal de la cuenta tras **5 intentos fallidos**.
- Autorización por rol en cada endpoint; respuestas `401` (sin sesión) y `403` (sin permiso).
- CORS limitado al origen del frontend (`CORS_ALLOWED_ORIGINS`).
- Validación de datos en backend y frontend; los errores internos no se exponen al usuario.
- Secretos y credenciales solo en `.env` / variables de entorno (no incluidos en el repositorio).
- Actualización de stock con bloqueo de fila y transacciones para evitar inconsistencias con varios usuarios.

## 14. Pruebas

- **Unitarias (JUnit 5 + Mockito):** `AuthServiceTest` (credenciales, bloqueo tras 5 intentos, usuario desactivado, hash) y `MovementServiceTest` (entradas, salidas, stock negativo, motivos, fechas, anulación).
- **Integración de la API:** se verificaron login, bloqueo y desbloqueo, permisos de los tres roles, validaciones, códigos duplicados, entradas y salidas con varios productos, transaccionalidad, anulación, historial con filtros, dashboard, generación de los tres PDF y CORS.

## 15. Documentación del proyecto

En `docs/` se encuentran los requerimientos funcionales y no funcionales, historias de usuario, backlog, diagramas BPMN, de secuencia y de actividades, y los prototipos iniciales de la página de presentación. En `evidencias/` están las capturas del backlog y del Sprint 1 en Jira y de la landing page.

---

**Autor:** Daniel Roman — Tecnología en Análisis y Desarrollo de Software (ADSO), SENA.
