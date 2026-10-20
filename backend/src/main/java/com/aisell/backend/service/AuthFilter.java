package com.aisell.backend.service;

import com.aisell.backend.model.Usuario;
import com.aisell.backend.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    private final UsuarioRepository usuarios;

    public AuthFilter(TokenService tokens, UsuarioRepository usuarios) {
        this.tokens = tokens;
        this.usuarios = usuarios;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String ruta = request.getRequestURI();
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        response.setHeader("Vary", "Origin");
        if ("OPTIONS".equals(request.getMethod())) {
            response.setStatus(200);
            return;
        }
        if (!ruta.startsWith("/api/") || "/api/auth/login".equals(ruta)) {
            chain.doFilter(request, response);
            return;
        }
        String cabecera = request.getHeader("Authorization");
        if (cabecera == null || !cabecera.startsWith("Bearer ")) {
            response.sendError(401, "Inicia sesión para continuar.");
            return;
        }
        Integer id = tokens.leerId(cabecera.substring(7));
        Usuario usuario = id == null ? null : usuarios.findById(id).orElse(null);
        if (usuario == null || !Boolean.TRUE.equals(usuario.getEstado()) || tokens.verificar(cabecera.substring(7), usuario.getRol()) == null) {
            response.sendError(401, "Sesión expirada o inválida.");
            return;
        }
        String rol = usuario.getRol();
        String metodo = request.getMethod();
        boolean admin = "ADMIN".equals(rol);
        boolean vendedor = "VENDEDOR".equals(rol);
        boolean repartidor = "REPARTIDOR".equals(rol);
        boolean permitido;
        if (ruta.startsWith("/api/auth/")) {
            permitido = true;
        } else if (ruta.startsWith("/api/envios/")) {
            permitido = "GET".equals(metodo) || (("PUT".equals(metodo)) && repartidor);
        } else if (ruta.equals("/api/envios")) {
            permitido = "GET".equals(metodo);
        } else if (ruta.startsWith("/api/incidencias")) {
            permitido = "GET".equals(metodo) ? admin : "POST".equals(metodo) ? vendedor || repartidor || admin : "PUT".equals(metodo) && admin;
        } else if (ruta.startsWith("/api/ventas")) {
            permitido = admin || vendedor;
        } else if (ruta.startsWith("/api/productos")) {
            permitido = "GET".equals(metodo) || admin;
        } else if (ruta.startsWith("/api/categorias")) {
            permitido = "GET".equals(metodo) || admin;
        } else if (ruta.startsWith("/api/inventario")) {
            permitido = admin || (vendedor && "GET".equals(metodo));
        } else {
            permitido = false;
        }
        if (!permitido) {
            response.sendError(403, "No tienes permiso para esta operación.");
            return;
        }
        request.setAttribute("aisellId", usuario.getIdUsuario());
        request.setAttribute("aisellNombre", usuario.getNombre());
        request.setAttribute("aisellRol", rol);
        chain.doFilter(request, response);
    }
}
