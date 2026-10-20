
package com.aisell.backend.repository;

import com.aisell.backend.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Integer> {

    Optional<Venta> findByCodigoVenta(String codigoVenta);

    boolean existsByCodigoVenta(String codigoVenta);

    Optional<Venta> findByIdSolicitud(String idSolicitud);

}
