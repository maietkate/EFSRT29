package com.aisell.backend.service;

import com.aisell.backend.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TokenService {
    private final byte[] secreto;
    private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

    public TokenService(@Value("${aisell.jwt.secret:}") String clave) {
        if (clave.isBlank()) {
            secreto = new byte[48];
            new SecureRandom().nextBytes(secreto);
        } else {
            if (clave.length() < 32) throw new IllegalArgumentException("AISELL_JWT_SECRET debe tener al menos 32 caracteres.");
            secreto = clave.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String crear(Usuario usuario) {
        String cabecera = b64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String contenido = b64("{\"sub\":\"" + usuario.getIdUsuario() + "\",\"rol\":\"" + usuario.getRol() + "\",\"exp\":" + Instant.now().plusSeconds(28800).getEpochSecond() + "}");
        String datos = cabecera + "." + contenido;
        return datos + "." + encoder.encodeToString(firmar(datos));
    }

    public Integer verificar(String token, String rol) {
        try {
            String[] partes = token.split("\\.");
            if (partes.length != 3) return null;
            byte[] recibida = Base64.getUrlDecoder().decode(partes[2]);
            if (!MessageDigest.isEqual(firmar(partes[0] + "." + partes[1]), recibida)) return null;
            String contenido = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
            Matcher id = Pattern.compile("\"sub\":\"([0-9]+)\"").matcher(contenido);
            Matcher expiracion = Pattern.compile("\"exp\":([0-9]+)").matcher(contenido);
            Matcher perfil = Pattern.compile("\"rol\":\"([A-Z]+)\"").matcher(contenido);
            if (!id.find() || !expiracion.find() || !perfil.find()) return null;
            if (Long.parseLong(expiracion.group(1)) < Instant.now().getEpochSecond()) return null;
            if (!perfil.group(1).equals(rol)) return null;
            return Integer.valueOf(id.group(1));
        } catch (Exception error) {
            return null;
        }
    }

    public Integer leerId(String token) {
        try {
            String[] partes = token.split("\\.");
            if (partes.length != 3 || !MessageDigest.isEqual(firmar(partes[0] + "." + partes[1]), Base64.getUrlDecoder().decode(partes[2]))) return null;
            String contenido = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
            Matcher id = Pattern.compile("\"sub\":\"([0-9]+)\"").matcher(contenido);
            Matcher exp = Pattern.compile("\"exp\":([0-9]+)").matcher(contenido);
            if (!id.find() || !exp.find() || Long.parseLong(exp.group(1)) < Instant.now().getEpochSecond()) return null;
            return Integer.valueOf(id.group(1));
        } catch (Exception error) {
            return null;
        }
    }

    private String b64(String s) { return encoder.encodeToString(s.getBytes(StandardCharsets.UTF_8)); }
    private byte[] firmar(String datos) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto, "HmacSHA256"));
            return mac.doFinal(datos.getBytes(StandardCharsets.UTF_8));
        } catch (Exception error) { throw new IllegalStateException(error); }
    }
}
