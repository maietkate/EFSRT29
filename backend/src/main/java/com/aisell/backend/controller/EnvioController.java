package com.aisell.backend.controller;

import com.aisell.backend.model.Envio;
import com.aisell.backend.service.EnvioService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/envios")
@CrossOrigin(origins = "http://localhost:5173")
public class EnvioController {
    private final EnvioService service;

    public EnvioController(EnvioService service) {
        this.service = service;
    }

    @GetMapping
    public List<Envio> listar() {
        return service.listar();
    }

    @PutMapping("/{id}/aceptar")
    public Envio aceptar(@PathVariable Integer id, HttpServletRequest request) {
        return service.aceptar(id, (Integer) request.getAttribute("aisellId"), (String) request.getAttribute("aisellNombre"));
    }

    @PutMapping("/{id}/entregar")
    public Envio entregar(@PathVariable Integer id, HttpServletRequest request) {
        return service.entregar(id, (Integer) request.getAttribute("aisellId"));
    }
}
