package com.aisell.backend.controller;

import com.aisell.backend.model.Incidencia;
import com.aisell.backend.repository.IncidenciaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import org.springframework.data.domain.Sort;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidencias")
@CrossOrigin(origins = "http://localhost:5173")
public class IncidenciaController {
    private final IncidenciaRepository repository;

    public IncidenciaController(IncidenciaRepository repository) {
        this.repository = repository;
    }

    public record NuevaIncidencia(String telefono, String motivo, String pedidoId, String descripcion) {}
    public record CambioEstado(String estado) {}
    public record TicketDto(String id, Integer usuarioId, String nombre, String rol, String telefono, String motivo,
                            String pedidoId, String descripcion, String estado, java.time.LocalDateTime fecha) {}

    private TicketDto dto(Incidencia t) {
        return new TicketDto(t.getCodigoTicket(), t.getUsuarioId(), t.getNombre(), t.getRol(),
                t.getTelefono(), t.getMotivo(), t.getPedidoId(), t.getDescripcion(), t.getEstado(), t.getFecha());
    }

    @GetMapping
    public List<TicketDto> listar() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "idTicket")).stream().map(this::dto).toList();
    }

    @PostMapping
    public TicketDto registrar(@RequestBody NuevaIncidencia nueva, HttpServletRequest request) {
        if (nueva.telefono() == null || !nueva.telefono().matches("9[0-9]{8}")
                || nueva.motivo() == null || nueva.motivo().isBlank() || nueva.motivo().length() > 100
                || nueva.descripcion() == null || nueva.descripcion().trim().length() < 10
                || nueva.descripcion().length() > 1000
                || (nueva.pedidoId() != null && nueva.pedidoId().length() > 40)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos de la incidencia correctamente.");
        }
        Incidencia t = new Incidencia();
        t.setCodigoTicket("TK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        t.setUsuarioId((Integer) request.getAttribute("aisellId"));
        t.setNombre((String) request.getAttribute("aisellNombre"));
        t.setRol((String) request.getAttribute("aisellRol"));
        t.setTelefono(nueva.telefono());
        t.setMotivo(nueva.motivo().trim());
        t.setPedidoId(nueva.pedidoId());
        t.setDescripcion(nueva.descripcion().trim());
        t.setEstado("Pendiente");
        return dto(repository.saveAndFlush(t));
    }

    @PutMapping("/{codigo}/estado")
    public TicketDto cambiarEstado(@PathVariable String codigo, @RequestBody CambioEstado cambio) {
        if (!List.of("Pendiente", "En revisión", "Resuelto").contains(cambio.estado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de incidencia inválido.");
        }
        Incidencia ticket = repository.findByCodigoTicket(codigo).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidencia no encontrada."));
        ticket.setEstado(cambio.estado());
        return dto(repository.saveAndFlush(ticket));
    }
}
