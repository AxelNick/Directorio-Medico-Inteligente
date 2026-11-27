package pe.edu.uni.backend.controller;

import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SaludController {
    private final JdbcClient jdbc;

    public SaludController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/salud")
    public ResponseEntity<Map<String, String>> salud() {
        try {
            jdbc.sql("select 1").query(Integer.class).single();
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("estado", "disponible"));
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).cacheControl(CacheControl.noStore())
                    .body(Map.of("mensaje", "Base de datos no disponible"));
        }
    }
}
