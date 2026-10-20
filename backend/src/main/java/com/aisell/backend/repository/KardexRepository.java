
package com.aisell.backend.repository;

import com.aisell.backend.model.Kardex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KardexRepository extends JpaRepository<Kardex, Integer> {

    List<Kardex> findByIdProductoOrderByFechaMovimientoDesc(Integer idProducto);

}
