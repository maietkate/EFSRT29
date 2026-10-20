# AISELL – Instalación y pruebas del prototipo EFSRT

## Requisitos

Windows, Java JDK 21, Node.js 22, SQL Server Express con conexión TCP en `localhost:1433`, SSMS, acceso a Maven Central la primera vez y Git.

## Base de datos

1. Haz una copia de seguridad de `BD_AISELL` antes de actualizar.
2. Si la base aún no existe, revisa y ejecuta `sql/00_BD_AISELL_BASE_REFERENCIA.sql` en SSMS. El script base es el original del proyecto y puede contener operaciones no aptas para ejecutarse sobre una base existente; **no lo vuelvas a ejecutar si ya tienes datos**.
3. En la base existente, ejecuta únicamente `sql/01_ACTUALIZAR_BD_AISELL.sql` desde SSMS. Es un script de actualización que agrega campos e índices sin borrar ventas.
4. Verifica que no haya errores y que existan `tb_venta`, `tb_envio`, `tb_incidencia`, `tb_usuario`, `tb_producto` y `tb_detalle_venta`.

## Backend (PowerShell)

```powershell
cd backend
$env:AISELL_DB_PASSWORD = 'TU_CLAVE_LOCAL'
$env:AISELL_DEMO_USERS = 'true'
$env:AISELL_JWT_SECRET = 'CAMBIA_ESTA_CLAVE_LARGA_DE_AL_MENOS_32_CARACTERES'
.\mvnw.cmd spring-boot:run
```

Para los primeros ensayos, las cuentas demo son `admin@aisell.pe` / `admin123`, `vendedor@aisell.pe` / `vendedor123` y `repartidor@aisell.pe` / `repartidor123`. Las cuentas se crean solo si `AISELL_DEMO_USERS=true`; en producción, desactiva esa variable, utiliza contraseñas distintas y configura HTTPS. Los hashes de las contraseñas se almacenan en SQL Server con PBKDF2-HMAC-SHA256, no en el frontend.

El script de actualización debe ejecutarse antes de iniciar el backend. No hay credenciales de la base de datos incluidas en este ZIP. Si tu SQL Server usa otro host, puerto o usuario, configura `AISELL_DB_URL` y `AISELL_DB_USER` en las variables de entorno.

## Frontend (segunda terminal)

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Abre http://localhost:5173. Para comprobar que la compilación funciona: `npm.cmd run build`. En backend: `.\mvnw.cmd compile`.

## Prueba integral más importante

1. Inicia sesión como Vendedor.
2. En Ventas (POS), agrega una unidad de un producto con stock disponible.
3. Selecciona **Delivery** e ingresa nombre, celular peruano de nueve cifras y dirección.
4. Pulsa **Procesar venta** una sola vez. Debe indicar el código de venta y que el pedido quedó pendiente.
5. Cierra sesión e inicia sesión como Repartidor.
6. Abre **Pedidos pendientes** y pulsa actualizar. El pedido recién creado debe aparecer.
7. Acepta el pedido y entra en **Mis entregas**. Debe pasar a **En ruta**.
8. Confirma la entrega. Debe pasar a **Entregado**.
9. Inicia sesión como Administrador. Comprueba el pedido en **Envíos**, la venta en **Reportes**, el movimiento en **Kardex** y el stock actual en **Inventario**.
10. Reinicia backend y refresca navegador; los datos deben persistir en SQL Server.

## Pruebas adicionales

- Venta por recojo: reduce el stock sin crear un envío.
- Stock insuficiente: la venta debe fallar sin descuentos parciales.
- Repetir la misma solicitud: no debe duplicar la venta ni el envío.
- Dos repartidores intentando aceptar el mismo pedido: solo uno puede hacerlo.
- Un repartidor diferente no puede confirmar una entrega ajena.
- Un vendedor no debe poder modificar el inventario desde la API.
- Genera reportes CSV de ventas e inventario y revisa las columnas y cantidades.
- Crea una incidencia como Vendedor o Repartidor, resuélvela como Administrador y verifica que persista al reiniciar.
- Desactiva el backend y comprueba que el frontend muestre errores de conexión sin inventar valores.

## Limitaciones del prototipo

Este paquete necesita pruebas en tu SQL Server real. No procesa pagos bancarios, no emite comprobantes SUNAT, no certifica disponibilidad 99.5% y no cuenta con un servidor productivo HTTPS. El chatbot integrado consulta datos reales pero **no es IBM Watson Assistant**; para cumplir una integración externa con Watson se necesitan credenciales y un recurso activo de IBM Cloud. Las antiguas ventas y envíos guardados solamente en `localStorage` no se migran automáticamente. Algunas ventas iniciales de la base son de prueba. El script SQL solo agrega esquema; no modifica esos registros.
