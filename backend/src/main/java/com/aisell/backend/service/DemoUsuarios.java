package com.aisell.backend.service;

import com.aisell.backend.model.Usuario;
import com.aisell.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DemoUsuarios {
    private final UsuarioRepository usuarios;
    private final PasswordService passwords;
    @Value("${aisell.demo.enabled:false}")
    private boolean habilitado;
    @Value("${aisell.demo.admin.password:admin123}")
    private String admin;
    @Value("${aisell.demo.vendedor.password:vendedor123}")
    private String vendedor;
    @Value("${aisell.demo.repartidor.password:repartidor123}")
    private String repartidor;

    public DemoUsuarios(UsuarioRepository usuarios, PasswordService passwords) {
        this.usuarios = usuarios;
        this.passwords = passwords;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void iniciar() {
        if (!habilitado) return;
        
crear("Allison Ortiz", "admin@aisell.pe", "ADMIN", admin);
crear("Fred Anthoni", "vendedor@aisell.pe", "VENDEDOR", vendedor);
crear("Wilfredo Jesus", "repartidor@aisell.pe", "REPARTIDOR", repartidor);

    }

    private void crear(String nombre, String correo, String rol, String clave) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(correo).orElse(null);
        if (usuario != null) {
            if (usuario.getPasswordHash() == null || !usuario.getPasswordHash().startsWith("pbkdf2$")) {
                usuario.setPasswordHash(passwords.crear(clave));
                usuario.setRol(rol);
                usuario.setEstado(true);
                usuarios.save(usuario);
            }
            return;
        }
        usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(correo);
        usuario.setRol(rol);
        usuario.setEstado(true);
        usuario.setPasswordHash(passwords.crear(clave));
        usuarios.save(usuario);
    }
}
