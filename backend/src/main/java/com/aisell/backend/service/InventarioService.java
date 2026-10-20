
package com.aisell.backend.service;

import com.aisell.backend.dto.MovimientoStockRequest;
import com.aisell.backend.model.Kardex;
import com.aisell.backend.model.Producto;
import com.aisell.backend.repository.KardexRepository;
import com.aisell.backend.repository.ProductoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class InventarioService {

    private final ProductoRepository productoRepository;
    private final KardexRepository kardexRepository;

    public InventarioService(
            ProductoRepository productoRepository,
            KardexRepository kardexRepository) {
        this.productoRepository = productoRepository;
        this.kardexRepository = kardexRepository;
    }

    @Transactional
    public Kardex registrarMovimiento(MovimientoStockRequest request) {

        Producto producto = productoRepository
                .buscarProductoParaActualizar(request.getIdProducto())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El producto no existe."
                ));

        int stockAnterior = producto.getStock();
        int cantidad = request.getCantidad();
        String tipo = request.getTipoMovimiento();

        int stockNuevo;

        if ("ENTRADA".equals(tipo)) {

            try {
                stockNuevo = Math.addExact(stockAnterior, cantidad);
            } catch (ArithmeticException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La cantidad supera el stock permitido."
                );
            }

        } else if ("SALIDA".equals(tipo)) {

            if (cantidad > stockAnterior) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "No hay stock suficiente para realizar la salida."
                );
            }

            stockNuevo = stockAnterior - cantidad;

        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El tipo de movimiento no es válido."
            );
        }

        Kardex movimiento = new Kardex();

        movimiento.setIdProducto(producto.getIdProducto());
        movimiento.setTipoMovimiento(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockActual(stockNuevo);
        movimiento.setMotivo(request.getMotivo());

        producto.setStock(stockNuevo);

        productoRepository.save(producto);

        return kardexRepository.saveAndFlush(movimiento);
    }
}
