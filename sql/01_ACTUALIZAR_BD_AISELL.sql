IF DB_ID(N'BD_AISELL') IS NULL THROW 50001, 'La base BD_AISELL no existe. Ejecuta primero el script de creación.', 1;
GO
USE BD_AISELL;
GO
IF COL_LENGTH('dbo.tb_venta', 'id_solicitud') IS NULL
    ALTER TABLE dbo.tb_venta ADD id_solicitud VARCHAR(36) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_tb_venta_id_solicitud' AND object_id = OBJECT_ID('dbo.tb_venta'))
    CREATE UNIQUE INDEX UX_tb_venta_id_solicitud ON dbo.tb_venta(id_solicitud) WHERE id_solicitud IS NOT NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'cliente_nombre') IS NULL
    ALTER TABLE dbo.tb_envio ADD cliente_nombre NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'telefono') IS NULL
    ALTER TABLE dbo.tb_envio ADD telefono VARCHAR(20) NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'productos') IS NULL
    ALTER TABLE dbo.tb_envio ADD productos NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'repartidor_id') IS NULL
    ALTER TABLE dbo.tb_envio ADD repartidor_id INT NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'fecha_aceptacion') IS NULL
    ALTER TABLE dbo.tb_envio ADD fecha_aceptacion DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.tb_envio', 'fecha_entrega') IS NULL
    ALTER TABLE dbo.tb_envio ADD fecha_entrega DATETIME2 NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_tb_envio_id_venta' AND object_id = OBJECT_ID('dbo.tb_envio'))
    CREATE UNIQUE INDEX UX_tb_envio_id_venta ON dbo.tb_envio(id_venta) WHERE id_venta IS NOT NULL;
GO
IF OBJECT_ID(N'dbo.tb_incidencia', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tb_incidencia (
        id_ticket INT IDENTITY(1,1) PRIMARY KEY,
        codigo_ticket VARCHAR(20) NOT NULL UNIQUE,
        usuario_id INT NOT NULL REFERENCES dbo.tb_usuario(id_usuario),
        nombre NVARCHAR(100) NOT NULL,
        rol VARCHAR(20) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        motivo NVARCHAR(100) NOT NULL,
        pedido_id VARCHAR(40) NULL,
        descripcion NVARCHAR(1000) NOT NULL,
        estado NVARCHAR(30) NOT NULL DEFAULT N'Pendiente',
        fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END;
GO
SELECT 'Actualización aplicada sin eliminar ventas ni inventario.' AS resultado;
GO
