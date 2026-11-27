package pe.edu.uni.backend.adapter;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.uni.backend.dto.EspecialidadRefResponse;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenAiAdapterTest {
    private final JsonMapper json = JsonMapper.builder().build();
    private final List<EspecialidadRefResponse> catalogo = List.of(new EspecialidadRefResponse(2, "Cardiología"));
    private HttpServer servidor;
    private URI endpoint;

    @BeforeEach
    void iniciarServidor() throws IOException {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        endpoint = URI.create("http://127.0.0.1:" + servidor.getAddress().getPort() + "/v1/chat/completions");
    }

    @AfterEach
    void detenerServidor() {
        servidor.stop(0);
    }

    @Test
    void traduceJsonConCatalogoYDevuelveSoloId() {
        var cuerpo = new AtomicReference<String>();
        var header = new AtomicReference<String>();
        servidor.createContext(endpoint.getPath(), solicitud -> {
            try (solicitud) {
                cuerpo.set(new String(solicitud.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                header.set(solicitud.getRequestHeaders().getFirst("Authorization"));
                String contenido = "{\"especialidadId\":2,\"texto\":\"Respuesta descartada\"}";
                byte[] datos = json.writeValueAsBytes(Map.of("choices", List.of(Map.of("message", Map.of("content", contenido)))));
                solicitud.sendResponseHeaders(200, datos.length);
                solicitud.getResponseBody().write(datos);
            }
        });
        servidor.start();

        assertThat(adapter(Duration.ofSeconds(2)).sugerir("Consulta ficticia", catalogo)).contains(2);
        assertThat(header.get()).isEqualTo("Bearer clave-ficticia");
        var enviado = json.readTree(cuerpo.get());
        assertThat(enviado.path("model").asString()).isEqualTo("modelo-ensayo");
        assertThat(enviado.path("messages").path(0).path("content").asString()).contains("Cardiología");
        assertThat(enviado.path("messages").path(1).path("content").asString()).isEqualTo("Consulta ficticia");
    }

    @Test
    void traduceEstadosYRespuestasInvalidas() {
        var status = new java.util.concurrent.atomic.AtomicInteger(429);
        servidor.createContext(endpoint.getPath(), solicitud -> {
            try (solicitud) {
                byte[] datos = "respuesta inválida".getBytes(StandardCharsets.UTF_8);
                solicitud.sendResponseHeaders(status.get(), datos.length);
                solicitud.getResponseBody().write(datos);
            }
        });
        servidor.start();
        var adaptador = adapter(Duration.ofSeconds(2));
        assertThatThrownBy(() -> adaptador.sugerir("Prueba", catalogo)).hasMessage("http_429");
        status.set(503);
        assertThatThrownBy(() -> adaptador.sugerir("Prueba", catalogo)).hasMessage("http_503");
        status.set(200);
        assertThatThrownBy(() -> adaptador.sugerir("Prueba", catalogo)).hasMessage("salida_invalida");
    }

    @Test
    void traduceTimeoutYDesconexion() {
        servidor.createContext(endpoint.getPath(), solicitud -> {
            try (solicitud) {
                Thread.sleep(400);
                solicitud.sendResponseHeaders(200, -1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        servidor.start();
        assertThatThrownBy(() -> adapter(Duration.ofMillis(80)).sugerir("Prueba", catalogo)).hasMessage("timeout");
        servidor.stop(0);
        assertThatThrownBy(() -> adapter(Duration.ofSeconds(2)).sugerir("Prueba", catalogo)).hasMessage("conexion");
    }

    private OpenAiAdapter adapter(Duration timeout) {
        return new OpenAiAdapter(HttpClient.newHttpClient(), json, endpoint, "clave-ficticia", "modelo-ensayo", timeout);
    }
}
