package pe.edu.uni.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

/**
 * Traduce excepciones a la forma de error acordada con frontend: { "mensaje": "..." }.
 * Mantiene a los controladores libres de try/catch (separacion de responsabilidades).
 */
@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> negocio(ApiException ex) {
        return cuerpo(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getDefaultMessage())
                .orElse("Solicitud invalida");
        return cuerpo(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return cuerpo(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es valido");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> archivoGrande(MaxUploadSizeExceededException ex) {
        return cuerpo(HttpStatus.BAD_REQUEST, "La fotografia supera el tamano maximo permitido (1 MB)");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridad(DataIntegrityViolationException ex) {
        return cuerpo(HttpStatus.CONFLICT, "El registro entra en conflicto con datos existentes");
    }

    private ResponseEntity<Map<String, String>> cuerpo(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(Map.of("mensaje", mensaje));
    }
}
