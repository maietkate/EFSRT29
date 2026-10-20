package com.aisell.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;
    @Column(name = "nombre")
    private String nombre;
    @Column(name = "email")
    private String email;
    @Column(name = "password_hash")
    private String passwordHash;
    @Column(name = "rol")
    private String rol;
    @Column(name = "estado")
    private Boolean estado;

    public Integer getIdUsuario() { return idUsuario; }
    public String getNombre() { return nombre; }
    public void setNombre(String v) { nombre = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String v) { passwordHash = v; }
    public String getRol() { return rol; }
    public void setRol(String v) { rol = v; }
    public Boolean getEstado() { return estado; }
    public void setEstado(Boolean v) { estado = v; }
}
