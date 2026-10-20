package com.aisell.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_incidencia")
public class Incidencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ticket")
    private Integer idTicket;
    @Column(name = "codigo_ticket")
    private String codigoTicket;
    @Column(name = "usuario_id")
    private Integer usuarioId;
    @Column(name = "nombre")
    private String nombre;
    @Column(name = "rol")
    private String rol;
    @Column(name = "telefono")
    private String telefono;
    @Column(name = "motivo")
    private String motivo;
    @Column(name = "pedido_id")
    private String pedidoId;
    @Column(name = "descripcion")
    private String descripcion;
    @Column(name = "estado")
    private String estado;
    @Column(name = "fecha", insertable = false, updatable = false)
    private LocalDateTime fecha;

    public Integer getIdTicket() { return idTicket; }
    public String getCodigoTicket() { return codigoTicket; }
    public void setCodigoTicket(String v) { codigoTicket = v; }
    public Integer getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Integer v) { usuarioId = v; }
    public String getNombre() { return nombre; }
    public void setNombre(String v) { nombre = v; }
    public String getRol() { return rol; }
    public void setRol(String v) { rol = v; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String v) { telefono = v; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String v) { motivo = v; }
    public String getPedidoId() { return pedidoId; }
    public void setPedidoId(String v) { pedidoId = v; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String v) { descripcion = v; }
    public String getEstado() { return estado; }
    public void setEstado(String v) { estado = v; }
    public LocalDateTime getFecha() { return fecha; }
}
