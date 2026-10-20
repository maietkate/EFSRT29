package com.aisell.backend.repository;

import com.aisell.backend.model.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IncidenciaRepository extends JpaRepository<Incidencia, Integer> {
    Optional<Incidencia> findByCodigoTicket(String codigoTicket);
}
