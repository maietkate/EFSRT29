package com.aisell.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class VentaRequest {
    @NotBlank
    @Size(max = 36)
    private String idSolicitud;
    private Integer idCliente;
    private Integer idUsuario;
    private String modalidad = "recojo";
    private String cliente;
    private String telefono;
    private String direccion;
    @Valid
    @NotEmpty
    private List<@NotNull DetalleVentaRequest> detalles;

    public String getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(String v) { idSolicitud = v; }
    public Integer getIdCliente() { return idCliente; }
    public void setIdCliente(Integer v) { idCliente = v; }
    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer v) { idUsuario = v; }
    public String getModalidad() { return modalidad; }
    public void setModalidad(String v) { modalidad = v; }
    public String getCliente() { return cliente; }
    public void setCliente(String v) { cliente = v; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String v) { telefono = v; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String v) { direccion = v; }
    public List<DetalleVentaRequest> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVentaRequest> v) { detalles = v; }
}
