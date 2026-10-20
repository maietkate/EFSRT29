
package com.aisell.backend.controller;

import com.aisell.backend.dto.ProductoRequest;
import com.aisell.backend.model.Producto;
import com.aisell.backend.repository.CategoriaRepository;
import com.aisell.backend.repository.ProductoRepository;

import jakarta.validation.Valid;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoController(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @GetMapping
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrarProducto(
            @Valid @RequestBody ProductoRequest request) {

        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();

        if (productoRepository.existsByCodigo(codigo)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El código ya está registrado."));
        }

        if (!categoriaRepository.existsById(request.getIdCategoria())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La categoría no existe."));
        }

        Producto producto = new Producto();

        producto.setCodigo(codigo);
        producto.setNombre(nombre);
        producto.setIdCategoria(request.getIdCategoria());
        producto.setStock(request.getStock());
        producto.setStockMinimo(request.getStockMinimo());
        producto.setPrecio(request.getPrecio());
        producto.setImagenUrl(request.getImagenUrl());

        try {
            Producto guardado = productoRepository.saveAndFlush(producto);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(guardado);

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "No se pudo registrar el producto. Verifica el código y los datos."
                    ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarProducto(
            @PathVariable Integer id,
            @Valid @RequestBody ProductoRequest request) {

        Optional<Producto> encontrado = productoRepository.findById(id);

        if (encontrado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "El producto no existe."));
        }

        if (!categoriaRepository.existsById(request.getIdCategoria())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La categoría no existe."));
        }

        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();

        Producto producto = encontrado.get();

        if (!producto.getCodigo().equals(codigo)
                && productoRepository.existsByCodigo(codigo)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El código ya está registrado."));
        }

        producto.setCodigo(codigo);
        producto.setNombre(nombre);
        producto.setIdCategoria(request.getIdCategoria());
        producto.setStockMinimo(request.getStockMinimo());
        producto.setPrecio(request.getPrecio());
        producto.setImagenUrl(request.getImagenUrl());

        try {
            Producto actualizado = productoRepository.saveAndFlush(producto);

            return ResponseEntity.ok(actualizado);

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "No se pudo actualizar el producto. Verifica los datos."
                    ));
        }
    }
}
