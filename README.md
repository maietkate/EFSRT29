# AISELL – Proyecto EFSRT

Sistema web de ventas, inventario, Kardex, delivery, envíos, reportes, roles y centro de incidencias para una MYPE. Frontend React + Vite + TypeScript; backend Java 21 + Spring Boot; SQL Server.

## Empieza aquí

Lee **`docs/INSTALACION_Y_PRUEBAS.md`**. El orden correcto es: respaldo de la base de datos, ejecución de `sql/01_ACTUALIZAR_BD_AISELL.sql` en SSMS, configuración de las variables del backend, inicio de Spring Boot, inicio de Vite y pruebas por rol.

## Flujo principal

1. El Vendedor registra una venta por recojo o Delivery.
2. Si es Delivery, Spring Boot guarda una venta y crea su envío dentro de la misma transacción SQL.
3. El Repartidor consulta los pedidos pendientes, acepta uno y confirma la entrega.
4. El Administrador ve pedidos y estados en Envíos, estadísticas en Dashboard, ventas detalladas en Reportes, stock en Inventario y movimientos en Kardex.
5. Vendedor y Repartidor registran incidencias para el Administrador.

## Configuración y seguridad

No se incluyen contraseñas privadas. El backend utiliza `AISELL_DB_PASSWORD`, autenticación JWT firmada y hashes de contraseña PBKDF2-HMAC-SHA256. `AISELL_DEMO_USERS=true` habilita perfiles de prueba para el entorno académico, y debe desactivarse fuera de pruebas. Se recomienda HTTPS, rotación de contraseñas y endurecimiento de seguridad antes de exponer el proyecto a internet.

## Evidencia de pruebas

Lee `docs/ESTADO_DE_VALIDACION.md`. El frontend fue comprobado mediante TypeScript. También se probaron de forma aislada la generación y verificación de contraseñas y JWT con Java 21. **No se pudo comprobar aquí una compilación Maven completa ni una ejecución real contra SQL Server**: requieren las dependencias de Maven y la instancia SQL de tu equipo.

La guía incluye la prueba de extremo a extremo del flujo Delivery → Repartidor → Administrador. El chatbot es un asistente local conectado a datos, **no una integración certificada con IBM Watson Assistant**. No se deben presentar resultados sin verificación como funcionalidades aprobadas.
