package pe.edu.uni.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtils {

    private static final int MIN_SECRET_BYTES = 32;

    private final Key key;
    private final int jwtExpirationMs = 86400000; // 24 horas

    public JwtUtils(@Value("${app.jwt.secret:}") String secret) {
        this(secret, false);
    }

    @Autowired
    public JwtUtils(@Value("${app.jwt.secret:}") String secret, Environment environment) {
        this(secret, environment != null && Arrays.asList(environment.getActiveProfiles()).contains("prod"));
    }

    JwtUtils(String secret, boolean requireConfiguredSecret) {
        if (secret == null || secret.isBlank()) {
            if (requireConfiguredSecret) {
                throw new IllegalStateException("JWT_SECRET es obligatorio cuando el perfil prod esta activo");
            }
            // En desarrollo sin configuracion se conserva la clave efimera local.
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            return;
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalArgumentException("app.jwt.secret debe tener al menos 32 bytes para HS256");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generarToken(String username, String rol) {
        return Jwts.builder()
                .setSubject(username)
                .claim("rol", rol)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    public String extraerUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extraerRol(String token) {
        Object rol = getClaims(token).get("rol");
        return rol != null ? rol.toString() : null;
    }

    public boolean validarToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}
