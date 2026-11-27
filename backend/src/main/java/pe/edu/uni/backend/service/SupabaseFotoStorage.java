package pe.edu.uni.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
class SupabaseFotoStorage {
    private final String base;
    private final String bucket;
    private final String key;
    private final HttpClient cliente = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();

    SupabaseFotoStorage(@Value("${app.uploads.supabase-url:}") String base,
            @Value("${app.uploads.supabase-bucket:fotos-medicos}") String bucket,
            @Value("${app.uploads.supabase-key:}") String key) {
        this.base = base.replaceFirst("/+$", "");
        this.bucket = bucket;
        this.key = key;
        if (habilitado() && (!URI.create(this.base).getScheme().equals("https")
                || !bucket.matches("[a-zA-Z0-9_-]+") || key.isBlank())) {
            throw new IllegalArgumentException("Configuración de Supabase Storage incompleta");
        }
    }

    boolean habilitado() {
        return !base.isBlank();
    }

    String guardar(String nombre, String tipo, byte[] datos) {
        enviar(solicitud(base + "/storage/v1/object/" + bucket + "/" + nombre)
                .header("Content-Type", tipo).POST(HttpRequest.BodyPublishers.ofByteArray(datos)).build());
        return prefijoPublico() + nombre;
    }

    boolean eliminar(String url) {
        if (!habilitado() || !url.startsWith(prefijoPublico())) {
            return false;
        }
        String nombre = url.substring(prefijoPublico().length());
        if (nombre.matches("medico-[0-9]+-[0-9a-f-]+\\.(jpg|png|webp)")) {
            enviar(solicitud(base + "/storage/v1/object/" + bucket)
                    .header("Content-Type", "application/json")
                    .method("DELETE", HttpRequest.BodyPublishers.ofString("{\"prefixes\":[\"" + nombre + "\"]}"))
                    .build());
        }
        return true;
    }

    private String prefijoPublico() {
        return base + "/storage/v1/object/public/" + bucket + "/";
    }

    private HttpRequest.Builder solicitud(String url) {
        var solicitud = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(8)).header("apikey", key);
        return key.startsWith("eyJ") ? solicitud.header("Authorization", "Bearer " + key) : solicitud;
    }

    private void enviar(HttpRequest solicitud) {
        try {
            int status = cliente.send(solicitud, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (status < 200 || status >= 300) {
                throw new IllegalStateException("El almacenamiento de fotos devolvió HTTP " + status);
            }
        } catch (IOException e) {
            throw new IllegalStateException("El almacenamiento de fotos no está disponible");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La operación de almacenamiento se interrumpió");
        }
    }
}
