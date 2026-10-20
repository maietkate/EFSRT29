package com.aisell.backend.service;

import com.aisell.backend.model.Envio;
import com.aisell.backend.repository.EnvioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnvioService {
    private final EnvioRepository repository;

    public EnvioService(EnvioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Envio> listar() {
        return repository.findAll();
    }

    @Transactional
    public Envio aceptar(Integer id, Integer repartidorId, String repartidorNombre) {
        if (repartidorId == null || repartidorNombre == null || repartidorNombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos del repartidor incompletos.");
        }
        Envio envio = repository.bloquear(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado."));
        if (!"Pendiente".equals(envio.getEstadoEnvio())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pedido ya fue aceptado o entregado.");
        }
        envio.setEstadoEnvio("En ruta");
        envio.setRepartidorId(repartidorId);
        envio.setRepartidor(repartidorNombre.trim());
        envio.setFechaAceptacion(LocalDateTime.now());
        return repository.saveAndFlush(envio);
    }

    @Transactional
    public Envio entregar(Integer id, Integer repartidorId) {
        Envio envio = repository.bloquear(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado."));
        if (!"En ruta".equals(envio.getEstadoEnvio()) || !java.util.Objects.equals(envio.getRepartidorId(), repartidorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este pedido no está asignado al repartidor.");
        }
        envio.setEstadoEnvio("Entregado");
        envio.setFechaEntrega(LocalDateTime.now());
        return repository.saveAndFlush(envio);
    }
}
