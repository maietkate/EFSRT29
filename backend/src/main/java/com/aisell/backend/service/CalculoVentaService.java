
package com.aisell.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

@Service
public class CalculoVentaService {

    private static final BigDecimal FACTOR_IGV =
            new BigDecimal("1.18");

    public BigDecimal calcularSubtotal(BigDecimal total) {
        return total.divide(
                FACTOR_IGV,
                2,
                RoundingMode.HALF_UP
        );
    }

    public BigDecimal calcularIgv(BigDecimal total) {
        BigDecimal subtotal = calcularSubtotal(total);

        return total.subtract(subtotal);
    }

    public BigDecimal calcularTotalProducto(
            BigDecimal precio,
            int cantidad) {

        return precio.multiply(BigDecimal.valueOf(cantidad))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
