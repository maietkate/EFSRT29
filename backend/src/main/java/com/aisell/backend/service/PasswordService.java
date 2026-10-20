package com.aisell.backend.service;

import org.springframework.stereotype.Service;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class PasswordService {
    private static final int ITERACIONES = 210000;
    private final SecureRandom random = new SecureRandom();

    public String crear(String clave) {
        byte[] sal = new byte[16];
        random.nextBytes(sal);
        return "pbkdf2$" + ITERACIONES + "$" + Base64.getEncoder().encodeToString(sal) + "$" + Base64.getEncoder().encodeToString(derivar(clave, sal, ITERACIONES));
    }

    public boolean verificar(String clave, String almacenado) {
        try {
            String[] partes = almacenado.split("\\$");
            if (partes.length != 4 || !"pbkdf2".equals(partes[0])) return false;
            int iteraciones = Integer.parseInt(partes[1]);
            if (iteraciones < 100000 || iteraciones > 1000000) return false;
            return MessageDigest.isEqual(derivar(clave, Base64.getDecoder().decode(partes[2]), iteraciones), Base64.getDecoder().decode(partes[3]));
        } catch (Exception error) {
            return false;
        }
    }

    private byte[] derivar(String clave, byte[] sal, int iteraciones) {
        PBEKeySpec spec = new PBEKeySpec(clave.toCharArray(), sal, iteraciones, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (Exception error) {
            throw new IllegalStateException("No se pudo proteger la contraseña", error);
        } finally {
            spec.clearPassword();
        }
    }
}
