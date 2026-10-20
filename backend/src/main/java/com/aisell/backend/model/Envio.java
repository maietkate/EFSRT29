package com.aisell.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_envio")
public class Envio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_envio")
    private Integer idEnvio;
    @Column(name = "codigo_envio")
    private String codigoEnvio;
    @Column(name = "id_venta")
    private Integer idVenta;
    @Column(name = "estado_envio")
    private String estadoEnvio;
    @Column(name = "direccion_destino")
    private String direccionDestino;
    @Column(name = "cliente_nombre")
    private String clienteNombre;
    @Column(name = "telefono")
    private String telefono;
    @Column(name = "productos")
    private String productos;
    @Column(name = "repartidor")
    private String repartidor;
    @Column(name = "repartidor_id")
    private Integer repartidorId;
    @Column(name = "fecha_aceptacion")
    private LocalDateTime fechaAceptacion;
    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    public Integer getIdEnvio() { return idEnvio; }
    public String getCodigoEnvio() { return codigoEnvio; }
    public void setCodigoEnvio(String v) { codigoEnvio = v; }
    public Integer getIdVenta() { return idVenta; }
    public void setIdVenta(Integer v) { idVenta = v; }
    public String getEstadoEnvio() { return estadoEnvio; }
    public void setEstadoEnvio(String v) { estadoEnvio = v; }
    public String getDireccionDestino() { return direccionDestino; }
    public void setDireccionDestino(String v) { direccionDestino = v; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String v) { clienteNombre = v; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String v) { telefono = v; }
    public String getProductos() { return productos; }
    public void setProductos(String v) { productos = v; }
    public String getRepartidor() { return repartidor; }
    public void setRepartidor(String v) { repartidor = v; }
    public Integer getRepartidorId() { return repartidorId; }
    public void setRepartidorId(Integer v) { repartidorId = v; }
    public LocalDateTime getFechaAceptacion() { return fechaAceptacion; }
    public void setFechaAceptacion(LocalDateTime v) { fechaAceptacion = v; }
    public LocalDateTime getFechaEntrega() { return fechaEntrega; }
    public void setFechaEntrega(LocalDateTime v) { fechaEntrega = v; }
}
