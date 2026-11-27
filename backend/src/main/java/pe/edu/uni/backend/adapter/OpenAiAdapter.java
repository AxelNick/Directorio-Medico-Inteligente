package pe.edu.uni.backend.adapter;

import pe.edu.uni.backend.dto.EspecialidadRefResponse;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class OpenAiAdapter implements TriageProvider {
    private final HttpClient http;
    private final JsonMapper json;
    private final URI endpoint;
    private final String apiKey;
    private final String modelo;
    private final Duration timeout;

    public OpenAiAdapter(HttpClient http, JsonMapper json, URI endpoint, String apiKey, String modelo, Duration timeout) {
        this.http = http;
        this.json = json;
        this.endpoint = endpoint;
        this.apiKey = apiKey;
        this.modelo = modelo;
        this.timeout = timeout;
    }

    @Override
    public Optional<Integer> sugerir(String mensaje, List<EspecialidadRefResponse> catalogo) {
        try {
            var instrucciones = """
                    Clasifica la consulta para orientar a una especialidad del catálogo.
                    Responde exclusivamente un objeto JSON con especialidadId entero del catálogo o null.
                    No emitas diagnósticos, prescripciones, tratamientos ni texto libre.
                    Catálogo:
                    """ + json.writeValueAsString(catalogo);
            var cuerpo = Map.of(
                    "model", modelo,
                    "max_completion_tokens", 120,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", instrucciones),
                            Map.of("role", "user", "content", mensaje)));
            var solicitud = HttpRequest.newBuilder(endpoint).timeout(timeout)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(cuerpo))).build();
            var respuesta = http.send(solicitud, HttpResponse.BodyHandlers.ofString());
            if (respuesta.statusCode() != 200) {
                throw new ProveedorTriageException("http_" + respuesta.statusCode());
            }
            var contenido = json.readTree(respuesta.body()).path("choices").path(0).path("message").path("content");
            if (!contenido.isString()) {
                throw new ProveedorTriageException("salida_invalida");
            }
            var id = json.readTree(contenido.asString()).path("especialidadId");
            if (!id.isNull() && (!id.isIntegralNumber() || !id.canConvertToInt())) {
                throw new ProveedorTriageException("salida_invalida");
            }
            return id.isNull() ? Optional.empty() : Optional.of(id.asInt());
        } catch (JacksonException e) {
            throw new ProveedorTriageException("salida_invalida");
        } catch (HttpTimeoutException e) {
            throw new ProveedorTriageException("timeout");
        } catch (IOException e) {
            throw new ProveedorTriageException("conexion");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ProveedorTriageException("interrumpido");
        }
    }
}
