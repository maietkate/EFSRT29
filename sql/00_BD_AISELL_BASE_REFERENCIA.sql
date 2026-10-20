-- ==========================================================
-- SCRIPT DE BASE DE DATOS PROFESIONAL: BD_AISELL
-- ==========================================================
CREATE DATABASE BD_AISELL;
GO

USE BD_AISELL;
GO

-- 1. Tabla de Usuarios y Roles (RBAC)
CREATE TABLE tb_usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL, -- 'Administrador', 'Vendedor', 'Almacenero'
    estado BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE()
);
GO

-- 2. Tabla de Clientes
CREATE TABLE tb_cliente (
    id_cliente INT IDENTITY(1,1) PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    ruc_dni VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    email VARCHAR(100)
);
GO

-- 3. Tabla de Categorías de Productos
CREATE TABLE tb_categoria (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);
GO

-- 4. Tabla de Productos y Stock Crítico
CREATE TABLE tb_producto (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    id_categoria INT FOREIGN KEY REFERENCES tb_categoria(id_categoria),
    stock INT NOT NULL CHECK (stock >= 0),
    stock_minimo INT DEFAULT 10,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url VARCHAR(255)
);
GO

-- 5. Tabla de Ventas (Cabecera)
CREATE TABLE tb_venta (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    codigo_venta VARCHAR(20) UNIQUE NOT NULL,
    fecha_venta DATETIME DEFAULT GETDATE(),
    id_cliente INT FOREIGN KEY REFERENCES tb_cliente(id_cliente),
    id_usuario INT FOREIGN KEY REFERENCES tb_usuario(id_usuario),
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado_venta VARCHAR(50) DEFAULT 'Completado'
);
GO

-- 6. Tabla de Detalle de Venta
CREATE TABLE tb_detalle_venta (
    id_detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT FOREIGN KEY REFERENCES tb_venta(id_venta) ON DELETE CASCADE,
    id_producto INT FOREIGN KEY REFERENCES tb_producto(id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);
GO

-- 7. Tabla de Envíos y Trazabilidad Logística
CREATE TABLE tb_envio (
    id_envio INT IDENTITY(1,1) PRIMARY KEY,
    codigo_envio VARCHAR(20) UNIQUE NOT NULL,
    id_venta INT FOREIGN KEY REFERENCES tb_venta(id_venta),
    estado_envio VARCHAR(50) DEFAULT 'Pendiente',
    direccion_destino VARCHAR(255) NOT NULL,
    fecha_programada DATE DEFAULT GETDATE(),
    fecha_estimada DATETIME,
    repartidor VARCHAR(100)
);
GO

-- 8. Tabla de Movimientos de Almacén (Kardex)
CREATE TABLE tb_kardex (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_producto INT FOREIGN KEY REFERENCES tb_producto(id_producto),
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_actual INT NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    id_usuario INT FOREIGN KEY REFERENCES tb_usuario(id_usuario)
);
GO

-- ==========================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ==========================================================

CREATE PROCEDURE sp_registrar_venta_completa
    @codigo_venta VARCHAR(20),
    @id_cliente INT,
    @id_usuario INT,
    @subtotal DECIMAL(10,2),
    @igv DECIMAL(10,2),
    @total DECIMAL(10,2),
    @id_producto INT,
    @cantidad INT,
    @precio_unitario DECIMAL(10,2),
    @direccion_envio VARCHAR(255),
    @codigo_envio VARCHAR(20),
    @repartidor VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        DECLARE @stock_actual INT;
        SELECT @stock_actual = stock FROM tb_producto WHERE id_producto = @id_producto;
        
        IF @stock_actual < @cantidad
        BEGIN
            RAISERROR('Stock insuficiente para procesar la venta en Aisell.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO tb_venta (codigo_venta, id_cliente, id_usuario, subtotal, igv, total)
        VALUES (@codigo_venta, @id_cliente, @id_usuario, @subtotal, @igv, @total);
        
        DECLARE @id_venta_creada INT = SCOPE_IDENTITY();
        
        INSERT INTO tb_detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (@id_venta_creada, @id_producto, @cantidad, @precio_unitario, (@cantidad * @precio_unitario));
        
        UPDATE tb_producto 
        SET stock = stock - @cantidad 
        WHERE id_producto = @id_producto;

        INSERT INTO tb_kardex (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_actual, motivo, id_usuario)
        VALUES (@id_producto, 'SALIDA', @cantidad, @stock_actual, (@stock_actual - @cantidad), 'Venta Aisell: ' + @codigo_venta, @id_usuario);
        
        INSERT INTO tb_envio (codigo_envio, id_venta, estado_envio, direccion_destino, repartidor, fecha_estimada)
        VALUES (@codigo_envio, @id_venta_creada, 'Pendiente', @direccion_envio, @repartidor, DATEADD(hour, 4, GETDATE()));
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_obtener_metricas_dashboard
AS
BEGIN
    SELECT 
        (SELECT ISNULL(SUM(total), 0) FROM tb_venta WHERE CAST(fecha_venta AS DATE) = CAST(GETDATE() AS DATE)) AS ventas_hoy,
        (SELECT COUNT(*) FROM tb_producto WHERE stock <= stock_minimo) AS productos_bajo_stock,
        (SELECT COUNT(*) FROM tb_envio WHERE estado_envio = 'En ruta') AS pedidos_en_ruta;
END;
GO

-- ==========================================================
-- DATOS INICIALES (SEED DATA)
-- ==========================================================

INSERT INTO tb_usuario (nombre, email, password_hash, rol) VALUES 
('Carlos Mendoza', 'admin@aisell.pe', '$2a$10$X1...hashdemo...', 'Administrador'),
('Ana Torres', 'vendedor@aisell.pe', '$2a$10$X2...hashdemo...', 'Vendedor');
GO

INSERT INTO tb_categoria (nombre_categoria, descripcion) VALUES 
('Tecnología', 'Equipos y accesorios tecnológicos'),
('Oficina', 'Artículos y útiles de oficina'),
('Accesorios', 'Complementos y suministros');
GO

INSERT INTO tb_producto (codigo, nombre, id_categoria, stock, stock_minimo, precio, imagen_url) VALUES 
('PRD-001', 'Audífonos Nova', 1, 18, 5, 129.90, 'audifonos.jpg'),
('PRD-002', 'Agenda Ejecutiva', 2, 24, 8, 45.50, 'agenda.jpg'),
('PRD-003', 'Mug Térmico', 3, 8, 10, 58.90, 'mug.jpg'),
('PRD-004', 'Kit Home Office', 2, 12, 4, 189.00, 'kit.jpg');
GO

INSERT INTO tb_cliente (razon_social, ruc_dni, telefono, direccion, email) VALUES 
('Distribuidora San Martín S.A.C.', '20601234567', '987654321', 'Av. Arequipa 1240, Lince', 'contacto@sanmartin.pe');
GO