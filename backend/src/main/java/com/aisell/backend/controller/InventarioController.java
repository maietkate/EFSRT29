
package com.aisell.backend.controller;

import com.aisell.backend.dto.MovimientoStockRequest;
import com.aisell.backend.model.Kardex;
import com.aisell.backend.repository.KardexRepository;
import com.aisell.backend.service.InventarioService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "http://localhost:5173")
public class InventarioController {

    private final InventarioService inventarioService;
    private final KardexRepository kardexRepository;

    public InventarioController(
            InventarioService inventarioService,
            KardexRepository kardexRepository) {
        this.inventarioService = inventarioService;
        this.kardexRepository = kardexRepository;
    }

    @GetMapping("/kardex")
    public List<Kardex> listarMovimientos() {
        return kardexRepository.findAll();
    }

    @GetMapping("/kardex/producto/{idProducto}")
    public List<Kardex> movimientosPorProducto(
            @PathVariable Integer idProducto) {

        return kardexRepository
                .findByIdProductoOrderByFechaMovimientoDesc(idProducto);
    }

    @PostMapping("/movimientos")
    public ResponseEntity<Kardex> registrarMovimiento(
            @Valid @RequestBody MovimientoStockRequest request) {

        Kardex movimiento = inventarioService.registrarMovimiento(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(movimiento);
    }
}
