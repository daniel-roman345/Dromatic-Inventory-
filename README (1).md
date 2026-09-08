# Dromatic Inventory System (DIS)

Sistema web de gestión **interna** de inventario para una bodega de productos capilares, cosméticos, perfumería y cuidado personal. No es una tienda virtual ni un sistema de ventas.

## 1. Descripción

DIS permite registrar, consultar, editar y eliminar productos; controlar entradas y salidas de stock; generar alertas de stock bajo; consultar la ubicación física de los productos dentro de la bodega; y generar reportes exportables en PDF. El acceso está protegido por roles (Administrador, Operador de inventario, Usuario de consulta).

## 2. Tecnologías

**Backend:** Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security, JWT, MySQL, Maven, iText7 (PDF).
**Frontend:** React 18, Vite, React Router, Axios.
**Base de datos:** MySQL 8.
**Control de versiones:** Git / GitHub.

## 3. Arquitectura

```
React (frontend) → API REST → Spring Boot (backend) → JPA/Hibernate → MySQL
```

## 4. Estructura del proyecto

```
Dromatic-Inventory-System/
├── backend/                # API REST Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/dromatic/inventory/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── model/
│       ├── dto/
│       ├── security/
│       ├── exception/
│       └── config/
├── frontend/                # SPA React (incluye la landing page)
│   └── src/
├── database/
│   └── database.sql
├── docs/
├── evidencias/
├── .gitignore
└── README.md
```

## 5. Requisitos

- Java 17+
- Maven 3.9+
- Node.js 18+
- MySQL 8+
- Git

## 6. Configuración de MySQL

1. Crea la base de datos ejecutando el script:

```powershell
mysql -u root -p < database\database.sql
```

Esto crea la base `dromatic_inventory`, las tablas, los 3 roles y datos de prueba **claramente identificados** (4 productos, 3 usuarios, 2 ubicaciones).

**Usuarios de prueba** (contraseña para los tres: `Password123`):

| Usuario     | Rol            |
|-------------|----------------|
| admin       | ADMINISTRADOR  |
| operador1   | OPERADOR       |
| consulta1   | CONSULTA       |

## 7. Configuración del backend

1. Copia el archivo de variables de entorno:

```powershell
cd backend
copy .env.example .env
```

2. Edita `.env` (o exporta las variables en tu sistema) con tus credenciales reales de MySQL y un `JWT_SECRET` propio. Spring Boot lee estas variables desde el entorno; si usas IntelliJ/VS Code, configúralas en la configuración de ejecución, o expórtalas antes de correr `mvn spring-boot:run`:

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="tu_password"
$env:JWT_SECRET="una_clave_larga_y_aleatoria"
```

## 8. Configuración del frontend

```powershell
cd frontend
copy .env.example .env
```

Verifica que `VITE_API_URL` apunte a tu backend (por defecto `http://localhost:8080/api`).

## 9. Ejecutar el backend

```powershell
cd backend
mvn spring-boot:run
```

El backend queda disponible en `http://localhost:8080`.

## 10. Ejecutar el frontend

```powershell
cd frontend
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`. La landing page es la ruta `/`; el botón "Acceder al sistema" lleva a `/login`.

## 11. Endpoints principales

| Método | Endpoint                        | Descripción                          | Rol requerido |
|--------|----------------------------------|---------------------------------------|----------------|
| POST   | /api/auth/login                 | Iniciar sesión                        | Público |
| GET    | /api/products                   | Listar / buscar / filtrar productos   | Todos los roles |
| POST   | /api/products                   | Registrar producto                    | ADMINISTRADOR |
| PUT    | /api/products/{id}               | Editar producto                       | ADMINISTRADOR |
| DELETE | /api/products/{id}               | Eliminar producto                     | ADMINISTRADOR |
| GET    | /api/movements                  | Consultar movimientos (con filtros)   | Todos los roles |
| POST   | /api/movements/entry             | Registrar entrada                     | ADMINISTRADOR, OPERADOR |
| POST   | /api/movements/exit              | Registrar salida                      | ADMINISTRADOR, OPERADOR |
| GET    | /api/dashboard                  | Resumen del dashboard                 | Todos los roles |
| GET    | /api/reports/inventory           | Reporte de inventario (PDF)           | ADMINISTRADOR |
| GET    | /api/reports/low-stock           | Reporte de stock bajo (PDF)           | ADMINISTRADOR |
| GET    | /api/reports/movements           | Reporte de movimientos (PDF)          | ADMINISTRADOR |
| GET/POST/PUT/DELETE | /api/users          | Gestión de usuarios                   | ADMINISTRADOR |
| GET/POST/PUT/DELETE | /api/locations      | Gestión de ubicaciones                | ADMINISTRADOR, OPERADOR (lectura: todos) |

## 12. Comandos de GitHub

Verifica primero tu rama actual:

```powershell
git branch
```

Luego sube los cambios (ajusta `main` si tu rama por defecto es otra):

```powershell
git status
git add .
git commit -m "feat: implement inventory management system"
git push origin main
```

## 13. Notas importantes

- Las contraseñas nunca se almacenan en texto plano: se usa BCrypt.
- El acceso a cada endpoint está protegido por rol mediante Spring Security + JWT.
- El frontend oculta del menú lateral las opciones que el rol activo no puede utilizar.
- Los datos que se muestran en el dashboard, inventario, movimientos y reportes provienen siempre de la base de datos real a través de la API — no hay datos simulados en el frontend.
