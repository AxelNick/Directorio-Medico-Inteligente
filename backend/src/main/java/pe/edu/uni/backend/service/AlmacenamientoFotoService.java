package pe.edu.uni.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.uni.backend.exception.ValidacionException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Guarda la fotografia de perfil en disco y devuelve una URL publica (/uploads/fotos/...).
 * Aislado del dominio para poder cambiar a almacenamiento en nube sin tocar MedicoService.
 */
@Service
public class AlmacenamientoFotoService {

    public static final long TAMANO_MAXIMO_BYTES = 1024 * 1024; // 1 MB

    private static final Map<String, String> EXTENSION_POR_TIPO = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    private final Path directorio;

    public AlmacenamientoFotoService(@Value("${app.uploads.dir:uploads}") String directorioBase) {
        this.directorio = Paths.get(directorioBase).toAbsolutePath().normalize().resolve("fotos");
    }

    public String guardar(Integer medicoId, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ValidacionException("Debes adjuntar una fotografia");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new ValidacionException("La fotografia supera el tamano maximo permitido (1 MB)");
        }
        String extension = EXTENSION_POR_TIPO.get(archivo.getContentType());
        if (extension == null) {
            throw new ValidacionException("Formato no permitido: usa JPG, PNG o WebP");
        }
        String nombre = "medico-" + medicoId + "-" + UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(directorio);
            Files.copy(archivo.getInputStream(), directorio.resolve(nombre), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar la fotografia", e);
        }
        return "/uploads/fotos/" + nombre;
    }

    /** Borra la foto anterior si existe; un fallo aqui no debe impedir la actualizacion. */
    public void eliminar(String fotoUrl) {
        if (fotoUrl == null || !fotoUrl.startsWith("/uploads/fotos/")) {
            return;
        }
        Path archivo = directorio.resolve(fotoUrl.substring("/uploads/fotos/".length())).normalize();
        if (!archivo.startsWith(directorio)) {
            return;
        }
        try {
            Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // La foto huerfana no afecta al perfil; se puede limpiar despues.
        }
    }

    public Path getDirectorio() { return directorio; }
}
