
package com.aisell.backend.service;

import com.aisell.backend.dto.DetalleVentaRequest;
import com.aisell.backend.dto.VentaRequest;
import com.aisell.backend.model.DetalleVenta;
import com.aisell.backend.model.Venta;
import com.aisell.backend.model.Envio;
import com.aisell.backend.repository.DetalleVentaRepository;
import com.aisell.backend.repository.VentaRepository;
import com.aisell.backend.repository.EnvioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class RecuperacionVentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final EnvioRepository envioRepository;

    public RecuperacionVentaService(
            VentaRepository ventaRepository,
            DetalleVentaRepository detalleVentaRepository,
            EnvioRepository envioRepository) {

        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.envioRepository = envioRepository;
    }

    @Transactional(
            readOnly = true,
            propagation = Propagation.REQUIRES_NEW
    )
    public Optional<Venta> buscarPorSolicitud(String idSolicitud) {
        return ventaRepository.findByIdSolicitud(idSolicitud);
    }

    @Transactional(
            readOnly = true,
            propagation = Propagation.REQUIRES_NEW
    )
    public Optional<Venta> recuperarVenta(VentaRequest request) {

        Optional<Venta> resultado =
                ventaRepository.findByIdSolicitud(request.getIdSolicitud());

        if (resultado.isEmpty()) {
            return Optional.empty();
        }

        Venta venta = resultado.get();

        boolean mismoCliente = Objects.equals(
                venta.getIdCliente(),
                request.getIdCliente()
        );

        boolean mismoUsuario = Objects.equals(
                venta.getIdUsuario(),
                request.getIdUsuario()
        );

        List<DetalleVenta> detallesGuardados =
                detalleVentaRepository.findByIdVenta(venta.getIdVenta());

        Map<Integer, Integer> cantidades = new HashMap<>();

        for (DetalleVenta detalle : detallesGuardados) {
            cantidades.put(
                    detalle.getIdProducto(),
                    detalle.getCantidad()
            );
        }

        boolean mismosProductos =
                cantidades.size() == request.getDetalles().size();

        if (mismosProductos) {
            for (DetalleVentaRequest detalle : request.getDetalles()) {

                Integer cantidadGuardada =
                        cantidades.get(detalle.getIdProducto());

                if (!Objects.equals(cantidadGuardada, detalle.getCantidad())) {
                    mismosProductos = false;
                    break;
                }
            }
        }

        Envio envio = envioRepository.findByIdVenta(venta.getIdVenta()).orElse(null);
        boolean delivery = "delivery".equalsIgnoreCase(request.getModalidad());
        boolean mismaModalidad = delivery == (envio != null);
        boolean mismosDatos = !delivery || (envio != null
                && request.getCliente() != null && request.getTelefono() != null && request.getDireccion() != null
                && Objects.equals(envio.getClienteNombre(), request.getCliente().trim())
                && Objects.equals(envio.getTelefono(), request.getTelefono().trim())
                && Objects.equals(envio.getDireccionDestino(), request.getDireccion().trim()));
        if (!mismoCliente || !mismoUsuario || !mismosProductos || !mismaModalidad || !mismosDatos) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El identificador pertenece a una venta con datos diferentes."
            );
        }

        return Optional.of(venta);
    }
}
