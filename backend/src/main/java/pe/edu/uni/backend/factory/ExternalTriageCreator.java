package pe.edu.uni.backend.factory;

import pe.edu.uni.backend.adapter.OpenAiAdapter;
import pe.edu.uni.backend.adapter.TriageProvider;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;

public class ExternalTriageCreator extends TriageProviderCreator {
    private final JsonMapper json;
    private final String apiKey;
    private final String modelo;

    public ExternalTriageCreator(JsonMapper json, String apiKey, String modelo) {
        this.json = json;
        this.apiKey = apiKey;
        this.modelo = modelo;
    }

    @Override
    public TriageProvider createProvider() {
        if (apiKey.isBlank() || modelo.isBlank()) {
            throw new IllegalArgumentException("Indica la clave y el modelo para el proveedor OpenAI");
        }
        return new OpenAiAdapter(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(),
                json, URI.create("https://api.openai.com/v1/chat/completions"), apiKey, modelo, Duration.ofSeconds(5));
    }
}
