package com.aisell.backend.repository;

import com.aisell.backend.model.Envio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface EnvioRepository extends JpaRepository<Envio, Integer> {
    Optional<Envio> findByIdVenta(Integer idVenta);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Envio e WHERE e.idEnvio = :id")
    Optional<Envio> bloquear(@Param("id") Integer id);
}
