
package com.aisell.backend.service;

import com.aisell.backend.dto.DetalleVentaRequest;
import com.aisell.backend.dto.VentaRequest;
import com.aisell.backend.model.DetalleVenta;
import com.aisell.backend.model.Envio;
import com.aisell.backend.model.Kardex;
import com.aisell.backend.model.Producto;
import com.aisell.backend.model.Venta;
import com.aisell.backend.repository.DetalleVentaRepository;
import com.aisell.backend.repository.EnvioRepository;
import com.aisell.backend.repository.KardexRepository;
import com.aisell.backend.repository.ProductoRepository;
import com.aisell.backend.repository.VentaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final KardexRepository kardexRepository;
    private final CalculoVentaService calculoVentaService;
    private final EnvioRepository envioRepository;

    public VentaService(
            VentaRepository ventaRepository,
            DetalleVentaRepository detalleVentaRepository,
            ProductoRepository productoRepository,
            KardexRepository kardexRepository,
            CalculoVentaService calculoVentaService,
            EnvioRepository envioRepository) {

        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.kardexRepository = kardexRepository;
        this.calculoVentaService = calculoVentaService;
        this.envioRepository = envioRepository;
    }

    @Transactional
    public Venta registrarVenta(VentaRequest request) {

        if (request == null ||
                request.getIdSolicitud() == null ||
                request.getIdSolicitud().isBlank() ||
                request.getIdSolicitud().length() > 36) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El identificador de solicitud es obligatorio y debe tener como maximo 36 caracteres."
            );
        }

        if (request.getDetalles() == null ||
                request.getDetalles().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La venta debe contener al menos un producto."
            );
        }

        boolean delivery = "delivery".equalsIgnoreCase(request.getModalidad());
        if (!delivery && request.getModalidad() != null && !"recojo".equalsIgnoreCase(request.getModalidad())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Modalidad no válida.");
        }
        if (delivery && (request.getCliente() == null || request.getCliente().isBlank()
                || request.getCliente().length() > 100 || request.getTelefono() == null
                || !request.getTelefono().matches("9[0-9]{8}") || request.getDireccion() == null
                || request.getDireccion().isBlank() || request.getDireccion().length() > 255)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre, teléfono y dirección válidos son obligatorios para delivery.");
        }

        Set<Integer> idsRepetidos = new HashSet<>();

        for (DetalleVentaRequest detalle : request.getDetalles()) {

            if (detalle == null ||
                    detalle.getIdProducto() == null ||
                    detalle.getCantidad() == null ||
                    detalle.getCantidad() <= 0) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Los productos y cantidades deben ser validos."
                );
            }

            if (!idsRepetidos.add(detalle.getIdProducto())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "No se puede repetir un producto en la misma venta."
                );
            }
        }

        Venta ventaExistente = ventaRepository
                .findByIdSolicitud(request.getIdSolicitud())
                .orElse(null);

        if (ventaExistente != null) {

            boolean mismoCliente = Objects.equals(
                    ventaExistente.getIdCliente(),
                    request.getIdCliente()
            );

            boolean mismoUsuario = Objects.equals(
                    ventaExistente.getIdUsuario(),
                    request.getIdUsuario()
            );

            List<DetalleVenta> detallesExistentes =
                    detalleVentaRepository.findByIdVenta(
                            ventaExistente.getIdVenta()
                    );

            Map<Integer, Integer> cantidadesExistentes = new HashMap<>();

            for (DetalleVenta detalle : detallesExistentes) {
                cantidadesExistentes.put(
                        detalle.getIdProducto(),
                        detalle.getCantidad()
                );
            }

            boolean mismosProductos =
                    cantidadesExistentes.size() == request.getDetalles().size();

            if (mismosProductos) {
                for (DetalleVentaRequest detalle : request.getDetalles()) {

                    Integer cantidadAnterior =
                            cantidadesExistentes.get(detalle.getIdProducto());

                    if (!Objects.equals(cantidadAnterior, detalle.getCantidad())) {
                        mismosProductos = false;
                        break;
                    }
                }
            }

            Envio envioExistente = envioRepository.findByIdVenta(ventaExistente.getIdVenta()).orElse(null);
            boolean mismaModalidad = delivery == (envioExistente != null);
            boolean mismosDatosEntrega = !delivery || (envioExistente != null
                    && Objects.equals(envioExistente.getClienteNombre(), request.getCliente().trim())
                    && Objects.equals(envioExistente.getTelefono(), request.getTelefono().trim())
                    && Objects.equals(envioExistente.getDireccionDestino(), request.getDireccion().trim()));
            if (!mismoCliente || !mismoUsuario || !mismosProductos || !mismaModalidad || !mismosDatosEntrega) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "El identificador de solicitud ya pertenece a una venta diferente."
                );
            }

            return ventaExistente;
        }

        List<DetalleVentaRequest> detallesOrdenados =
                new ArrayList<>(request.getDetalles());

        detallesOrdenados.sort(
                Comparator.comparing(DetalleVentaRequest::getIdProducto)
        );

        List<Producto> productos = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (DetalleVentaRequest detalle : detallesOrdenados) {

            Producto producto = productoRepository
                    .buscarProductoParaActualizar(detalle.getIdProducto())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Uno de los productos no existe."
                    ));

            if (producto.getPrecio() == null ||
                    producto.getPrecio().signum() <= 0) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El producto tiene un precio invalido: "
                                + producto.getNombre()
                );
            }

            if (producto.getStock() == null ||
                    producto.getStock() < detalle.getCantidad()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock insuficiente para: "
                                + producto.getNombre()
                );
            }

            BigDecimal totalProducto =
                    calculoVentaService.calcularTotalProducto(
                            producto.getPrecio(),
                            detalle.getCantidad()
                    );

            total = total.add(totalProducto);
            productos.add(producto);
        }

        BigDecimal maximo = new BigDecimal("99999999.99");

        if (total.compareTo(maximo) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El importe de la venta supera el limite permitido."
            );
        }

        total = total.setScale(2, RoundingMode.HALF_UP);

        BigDecimal subtotal =
                calculoVentaService.calcularSubtotal(total);

        BigDecimal igv =
                calculoVentaService.calcularIgv(total);

        Venta venta = new Venta();

        String codigo = "V-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 12)
                .toUpperCase();

        venta.setCodigoVenta(codigo);
        venta.setIdSolicitud(request.getIdSolicitud());
        venta.setIdCliente(request.getIdCliente());
        venta.setIdUsuario(request.getIdUsuario());
        venta.setSubtotal(subtotal);
        venta.setIgv(igv);
        venta.setTotal(total);
        venta.setEstadoVenta("Completado");

        Venta ventaGuardada = ventaRepository.saveAndFlush(venta);

        for (int i = 0; i < detallesOrdenados.size(); i++) {

            DetalleVentaRequest solicitado = detallesOrdenados.get(i);
            Producto producto = productos.get(i);

            int cantidad = solicitado.getCantidad();
            int stockAnterior = producto.getStock();
            int stockNuevo = stockAnterior - cantidad;

            BigDecimal importe =
                    calculoVentaService.calcularTotalProducto(
                            producto.getPrecio(),
                            cantidad
                    );

            DetalleVenta detalleVenta = new DetalleVenta();
            detalleVenta.setIdVenta(ventaGuardada.getIdVenta());
            detalleVenta.setIdProducto(producto.getIdProducto());
            detalleVenta.setCantidad(cantidad);
            detalleVenta.setPrecioUnitario(producto.getPrecio());
            detalleVenta.setSubtotal(importe);

            detalleVentaRepository.save(detalleVenta);

            producto.setStock(stockNuevo);
            productoRepository.save(producto);

            Kardex movimiento = new Kardex();

            movimiento.setIdProducto(producto.getIdProducto());
            movimiento.setTipoMovimiento("SALIDA");
            movimiento.setCantidad(cantidad);
            movimiento.setStockAnterior(stockAnterior);
            movimiento.setStockActual(stockNuevo);
            movimiento.setMotivo(
                    "Venta " + ventaGuardada.getCodigoVenta()
            );

            kardexRepository.save(movimiento);
        }

        if (delivery) {
            Envio envio = new Envio();
            envio.setCodigoEnvio("PED-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
            envio.setIdVenta(ventaGuardada.getIdVenta());
            envio.setEstadoEnvio("Pendiente");
            envio.setClienteNombre(request.getCliente().trim());
            envio.setTelefono(request.getTelefono().trim());
            envio.setDireccionDestino(request.getDireccion().trim());
            StringBuilder resumen = new StringBuilder();
            for (int i = 0; i < detallesOrdenados.size(); i++) {
                if (i > 0) resumen.append(", ");
                resumen.append(productos.get(i).getNombre()).append(" x ").append(detallesOrdenados.get(i).getCantidad());
            }
            envio.setProductos(resumen.substring(0, Math.min(resumen.length(), 1000)));
            envioRepository.saveAndFlush(envio);
        }

        detalleVentaRepository.flush();
        productoRepository.flush();
        kardexRepository.flush();

        return ventaGuardada;
    }
}
