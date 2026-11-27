package pe.edu.uni.backend.service;

import com.twelvemonkeys.imageio.plugins.webp.WebPImageReaderSpi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.uni.backend.exception.ValidacionException;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;

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
    private final SupabaseFotoStorage supabase;

    public AlmacenamientoFotoService(@Value("${app.uploads.dir:uploads}") String directorioBase,
                                     SupabaseFotoStorage supabase) {
        this.directorio = Paths.get(directorioBase).toAbsolutePath().normalize().resolve("fotos");
        this.supabase = supabase;
    }

    public String guardar(Integer medicoId, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ValidacionException("Debes adjuntar una fotografia");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new ValidacionException("La fotografia supera el tamano maximo permitido (1 MB)");
        }
        String tipo = archivo.getContentType();
        String extension = tipo == null ? null : EXTENSION_POR_TIPO.get(tipo);
        if (extension == null) {
            throw new ValidacionException("Formato no permitido: usa JPG, PNG o WebP");
        }
        String nombre = "medico-" + medicoId + "-" + UUID.randomUUID() + "." + extension;
        try {
            byte[] datos = archivo.getBytes();
            if (!formatoValido(extension, datos)) {
                throw new ValidacionException("El archivo no corresponde al formato de imagen indicado");
            }
            if (supabase.habilitado()) {
                return supabase.guardar(nombre, tipo, datos);
            }
            Files.createDirectories(directorio);
            Files.write(directorio.resolve(nombre), datos, java.nio.file.StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar la fotografia", e);
        }
        return "/uploads/fotos/" + nombre;
    }

    /** Borra la foto anterior si existe; un fallo aqui no debe impedir la actualizacion. */
    public void eliminar(String fotoUrl) {
        if (fotoUrl == null) {
            return;
        }
        try {
            if (supabase.eliminar(fotoUrl) || !fotoUrl.startsWith("/uploads/fotos/")) {
                return;
            }
        } catch (IllegalStateException ignored) {
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

    public void limpiarTrasGuardar(String anterior, String nueva) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    eliminar(anterior);
                } else if (status == STATUS_ROLLED_BACK) {
                    eliminar(nueva);
                }
            }
        });
    }

    private static boolean formatoValido(String extension, byte[] datos) {
        try (var entrada = new MemoryCacheImageInputStream(new ByteArrayInputStream(datos))) {
            ImageReader lector = lector(extension, entrada);
            if (lector == null) {
                return false;
            }
            try {
                lector.setInput(entrada);
                String esperado = extension.equals("jpg") ? "jpeg" : extension;
                return lector.getFormatName().equalsIgnoreCase(esperado)
                        && (long) lector.getWidth(0) * lector.getHeight(0) <= 25_000_000
                        && lector.read(0) != null;
            } finally {
                lector.dispose();
            }
        } catch (IOException | RuntimeException e) {
            return false;
        }
    }

    private static ImageReader lector(String extension, MemoryCacheImageInputStream entrada) throws IOException {
        if (extension.equals("webp")) {
            var webp = new WebPImageReaderSpi();
            return webp.canDecodeInput(entrada) ? webp.createReaderInstance() : null;
        }
        var lectores = ImageIO.getImageReaders(entrada);
        return lectores.hasNext() ? lectores.next() : null;
    }
}
