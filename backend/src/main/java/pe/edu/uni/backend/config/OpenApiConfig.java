package pe.edu.uni.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracion OpenAPI / Swagger UI (Sprint 5 - US-DOC-01).
 * Define el esquema HTTP Bearer JWT para probar operaciones protegidas desde Swagger UI.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Directorio Médico Inteligente API",
                version = "v1",
                description = "Directorio público, triage, reseñas, autenticación JWT, autogestión, catálogo, moderación y auditoría."
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {
}
