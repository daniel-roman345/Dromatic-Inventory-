# Dromatic Inventory System (DIS) — Sprints 2, 3 y 4

Continuación del Sprint 1 (HU-01 a HU-05, épicas ILD-6 a ILD-10 en Jira).
Todas las historias corresponden a funcionalidades **reales** implementadas
en el sistema (backend Spring Boot + frontend React).

Épicas ya existentes en Jira:
- **Seguridad y Acceso** (color púrpura)
- **Gestión de Inventario** (color púrpura)
- **Reportes y Control** (color púrpura)

---

## Sprint 2 — Movimientos y trazabilidad
Duración sugerida: 2 semanas
Puntos totales: **22**

| ID | Historia de usuario | Épica | Detalles / criterios de aceptación | Puntos |
|----|---------------------|-------|------------------------------------|--------|
| HU-06 | Como operador de inventario, quiero registrar entradas de mercancía con varios productos en un solo registro para agilizar la recepción de proveedores. | Gestión de Inventario | Buscar productos por código o nombre (compatible con lector de código de barras), agregar cantidades a una lista, indicar motivo (Compra a proveedor, Producción, Devolución de cliente, Ajuste de inventario), guardar todo en una sola transacción y aumentar el stock. | 5 |
| HU-07 | Como operador de inventario, quiero registrar salidas de mercancía con varios productos en un solo registro para agilizar los despachos. | Gestión de Inventario | Igual que HU-06 pero disminuye el stock. Motivos: Despacho/Venta, Producción, Devolución a proveedor, Producto dañado o vencido, Ajuste de inventario. Nunca permite stock negativo (bloquea el guardado si la cantidad solicitada supera el disponible). | 5 |
| HU-08 | Como administrador, quiero anular movimientos registrados por error para corregir el stock sin perder la trazabilidad. | Gestión de Inventario | El administrador escribe el motivo de la anulación, el stock se revierte automáticamente (una entrada resta, una salida suma) y el movimiento queda marcado como ANULADO con la fecha, la hora y el nombre del administrador. El movimiento nunca se borra del historial. | 4 |
| HU-09 | Como operador de inventario, quiero consultar el historial de movimientos con filtros por producto, fecha y tipo para auditar el inventario. | Gestión de Inventario | Filtros combinables por producto, rango de fechas (Desde/Hasta), y tipo (Entrada/Salida). Muestra fecha, hora, producto, cantidad, motivo, documento, usuario y estado (Vigente/Anulado). | 4 |
| HU-10 | Como administrador, quiero un panel de inicio (dashboard) con el resumen del día para monitorear la bodega de un vistazo. | Reportes y Control | Muestra productos activos, unidades totales en bodega, entradas y salidas del día y del mes, cantidad de productos con stock bajo y los últimos 8 movimientos. Los datos vienen en tiempo real de la base de datos. | 4 |

---

## Sprint 3 — Organización de la bodega y alertas
Duración sugerida: 2 semanas
Puntos totales: **21**

| ID | Historia de usuario | Épica | Detalles / criterios de aceptación | Puntos |
|----|---------------------|-------|------------------------------------|--------|
| HU-11 | Como operador de inventario, quiero registrar las ubicaciones físicas de la bodega (zona, pasillo, estante, nivel) para saber dónde está cada producto. | Gestión de Inventario | Formulario con los 4 campos obligatorios. Muestra la lista ordenada. Se puede editar o eliminar una ubicación, pero no se puede eliminar si tiene productos asignados. | 4 |
| HU-12 | Como operador de inventario, quiero asignar una ubicación al registrar un producto para localizarlo rápidamente en la bodega. | Gestión de Inventario | El formulario de producto tiene una lista desplegable con las ubicaciones existentes (Zona / Pasillo / Estante / Nivel). El campo es obligatorio y no se puede crear un producto sin ubicación. | 3 |
| HU-13 | Como usuario de consulta, quiero ver una alerta de los productos con stock bajo para reportarlos oportunamente. | Gestión de Inventario | Muestra los productos activos cuya cantidad es igual o menor al stock mínimo, indicando cuántas unidades faltan y cuáles están agotados. Accesible desde el menú "Alertas de stock" y desde el dashboard. | 4 |
| HU-14 | Como administrador, quiero editar y desactivar productos para mantener el catálogo actualizado. | Gestión de Inventario | Solo el administrador puede editar el nombre, descripción, stock mínimo, ubicación, fecha de ingreso y estado (Activo/Inactivo). La cantidad NO se cambia al editar: solo se modifica con entradas y salidas. Un producto inactivo no acepta movimientos. | 4 |
| HU-15 | Como administrador, quiero impedir la eliminación de un producto con historial para no perder trazabilidad. | Gestión de Inventario | Si el producto tiene movimientos registrados, el sistema NO permite eliminarlo y sugiere marcarlo como Inactivo. Solo se pueden eliminar productos sin historial. | 3 |
| HU-16 | Como operador de inventario, quiero que el sistema valide códigos duplicados al registrar un producto para evitar duplicados. | Gestión de Inventario | El código se guarda en mayúsculas y debe ser único. Si ya existe, muestra el mensaje "Ya existe un producto con el código XXX". Solo se aceptan letras, números, punto, guion y guion bajo (sin espacios). | 3 |

---

## Sprint 4 — Reportes, usuarios y seguridad avanzada
Duración sugerida: 2 semanas
Puntos totales: **23**

| ID | Historia de usuario | Épica | Detalles / criterios de aceptación | Puntos |
|----|---------------------|-------|------------------------------------|--------|
| HU-17 | Como administrador, quiero generar un reporte PDF del inventario general para archivar y compartir con la administración. | Reportes y Control | Descarga un PDF con todos los productos: código, nombre, cantidad, stock mínimo, ubicación y estado. Incluye totales (número de productos, unidades y con stock bajo), fecha de generación y usuario que lo generó. | 4 |
| HU-18 | Como administrador, quiero generar un reporte PDF de productos con stock bajo para planear las compras. | Reportes y Control | PDF con los productos activos cuya cantidad es igual o menor al stock mínimo, resaltando los agotados. Incluye el usuario que generó el reporte y la fecha. | 3 |
| HU-19 | Como administrador, quiero generar un reporte PDF de movimientos con filtros por fecha, producto y tipo para auditar el inventario. | Reportes y Control | Filtros combinables (Desde, Hasta, Tipo, Producto). El PDF muestra fecha, tipo, código, producto, cantidad, motivo, documento, usuario y estado (Vigente / Anulado por...). Incluye totales de unidades que entraron, salieron y movimientos anulados. | 5 |
| HU-20 | Como administrador, quiero gestionar los usuarios del sistema (crear, editar, activar y desactivar) para controlar quién accede. | Seguridad y Acceso | Crear usuario con contraseña de al menos 8 caracteres, asignar rol (ADMINISTRADOR, OPERADOR, CONSULTA), cambiar contraseña, activar y desactivar. Un administrador no puede desactivar su propia cuenta ni cambiar su propio rol. | 4 |
| HU-21 | Como administrador, quiero desbloquear cuentas bloqueadas por intentos fallidos para restaurar el acceso del personal. | Seguridad y Acceso | La pantalla de usuarios muestra las cuentas bloqueadas con la hora hasta la que están bloqueadas. Un botón "Desbloquear" pone en cero los intentos fallidos y libera la cuenta al momento. | 3 |
| HU-22 | Como usuario del sistema, quiero que mi sesión expire automáticamente después de 8 horas para proteger la información si dejo la sesión abierta. | Seguridad y Acceso | El sistema usa JWT con expiración de 8 horas. Al vencer, cierra la sesión y redirige al login. También cierra la sesión cuando el administrador desactiva mi usuario aunque el token siga vigente. | 4 |

---

## Notas de estimación (escala Fibonacci simplificada)

- **1** — trivial, menos de una hora.
- **2** — pequeño, medio día.
- **3** — mediano, un día.
- **4** — mediano-grande, uno o dos días con validaciones.
- **5** — grande, dos o tres días con integración backend y frontend.

Todas las historias tienen su correspondiente controlador REST, servicio con
reglas de negocio, repositorio JPA y vista React.
