package pe.edu.uni.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.edu.uni.backend.adapter.TriageProvider;
import pe.edu.uni.backend.factory.ExternalTriageCreator;
import pe.edu.uni.backend.factory.MockTriageCreator;
import pe.edu.uni.backend.factory.TriageProviderCreator;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class TriageConfig {
    @Bean
    TriageProviderCreator triageProviderCreator(JsonMapper json,
            @Value("${app.triage.provider:simulado}") String proveedor,
            @Value("${app.triage.openai-key:}") String apiKey,
            @Value("${app.triage.openai-model:}") String modelo) {
        return switch (proveedor) {
            case "simulado" -> new MockTriageCreator();
            case "openai" -> new ExternalTriageCreator(json, apiKey, modelo);
            default -> throw new IllegalArgumentException("Proveedor de triage desconocido");
        };
    }

    @Bean
    TriageProvider triageProvider(TriageProviderCreator creator) {
        return creator.createProvider();
    }
}
