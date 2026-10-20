
package com.aisell.backend.controller;

import com.aisell.backend.dto.VentaRequest;
import com.aisell.backend.model.Venta;

import com.aisell.backend.model.DetalleVenta;
import com.aisell.backend.repository.DetalleVentaRepository;

import com.aisell.backend.repository.VentaRepository;
import com.aisell.backend.service.VentaService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.aisell.backend.service.RecuperacionVentaService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "http://localhost:5173")
public class VentaController {

    private final VentaService ventaService;
    private final VentaRepository ventaRepository;
    private final RecuperacionVentaService recuperacionVentaService;
    
    private final DetalleVentaRepository detalleVentaRepository;


    

public VentaController(
        VentaService ventaService,
        VentaRepository ventaRepository,
        RecuperacionVentaService recuperacionVentaService,
        DetalleVentaRepository detalleVentaRepository) {

    this.ventaService = ventaService;
    this.ventaRepository = ventaRepository;
    this.recuperacionVentaService = recuperacionVentaService;
    this.detalleVentaRepository = detalleVentaRepository;
}


    @GetMapping
    public List<Venta> listarVentas() {
        return ventaRepository.findAll();
    }

    
@GetMapping("/{idVenta}/detalles")
public List<DetalleVenta> listarDetallesVenta(
        @PathVariable Integer idVenta) {

    if (!ventaRepository.existsById(idVenta)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "La venta solicitada no existe."
        );
    }

    return detalleVentaRepository.findByIdVenta(idVenta);
}


    @GetMapping("/solicitud/{idSolicitud}")
    public ResponseEntity<Venta> buscarPorSolicitud(
            @PathVariable String idSolicitud) {

        return ventaRepository.findByIdSolicitud(idSolicitud)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    
@PostMapping
public ResponseEntity<Venta> registrarVenta(
        @Valid @RequestBody VentaRequest request, HttpServletRequest peticion) {

    request.setIdUsuario((Integer) peticion.getAttribute("aisellId"));
    try {
        Venta venta = ventaService.registrarVenta(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(venta);

    } catch (DataIntegrityViolationException error) {

        Venta ventaRecuperada = recuperacionVentaService
                .recuperarVenta(request)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "La solicitud no pudo recuperarse. Comprueba el estado de la venta."
                ));

        return ResponseEntity.ok(ventaRecuperada);
    }
}

}
