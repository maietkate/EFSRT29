package com.aisell.backend.controller;

import com.aisell.backend.model.Usuario;
import com.aisell.backend.repository.UsuarioRepository;
import com.aisell.backend.service.PasswordService;
import com.aisell.backend.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    private final UsuarioRepository usuarios;
    private final PasswordService passwords;
    private final TokenService tokens;

    public AuthController(UsuarioRepository usuarios, PasswordService passwords, TokenService tokens) {
        this.usuarios = usuarios;
        this.passwords = passwords;
        this.tokens = tokens;
    }

    public record Credenciales(String email, String clave) {}
    public record Perfil(String nombre, String email) {}
    public record UsuarioPublico(Integer id, String nombre, String email, String rol) {}
    public record Sesion(String token, UsuarioPublico usuario) {}

    private UsuarioPublico publico(Usuario usuario) {
        return new UsuarioPublico(usuario.getIdUsuario(), usuario.getNombre(), usuario.getEmail(), usuario.getRol());
    }

    @PostMapping("/login")
    public Sesion login(@RequestBody Credenciales credenciales) {
        if (credenciales.email() == null || credenciales.clave() == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
        Usuario usuario = usuarios.findByEmailIgnoreCase(credenciales.email().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas."));
        if (!Boolean.TRUE.equals(usuario.getEstado()) || !passwords.verificar(credenciales.clave(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
        }
        return new Sesion(tokens.crear(usuario), publico(usuario));
    }

    @GetMapping("/me")
    public UsuarioPublico me(HttpServletRequest request) {
        return publico(usuarios.findById((Integer) request.getAttribute("aisellId")).orElseThrow());
    }

    @PutMapping("/perfil")
    public UsuarioPublico actualizar(@RequestBody Perfil perfil, HttpServletRequest request) {
        Usuario usuario = usuarios.findById((Integer) request.getAttribute("aisellId")).orElseThrow();
        if (perfil.nombre() == null || perfil.nombre().trim().length() < 3 || perfil.nombre().length() > 100
                || perfil.email() == null || !perfil.email().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || perfil.email().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre o correo inválido.");
        }
        if (usuarios.findByEmailIgnoreCase(perfil.email().trim()).filter(u -> !u.getIdUsuario().equals(usuario.getIdUsuario())).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado.");
        }
        usuario.setNombre(perfil.nombre().trim());
        usuario.setEmail(perfil.email().trim().toLowerCase());
        return publico(usuarios.saveAndFlush(usuario));
    }
}
