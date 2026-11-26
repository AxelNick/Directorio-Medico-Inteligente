package pe.edu.uni.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

/**
 * Traduce excepciones a la forma de error acordada con frontend: { "mensaje": "..." }.
 * Mantiene a los controladores libres de try/catch (separacion de responsabilidades).
 */
@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalExcepciones.class);

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

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> tipoInvalido(MethodArgumentTypeMismatchException ex) {
        return cuerpo(HttpStatus.BAD_REQUEST, "Parametro invalido: " + ex.getName());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> parametroFaltante(MissingServletRequestParameterException ex) {
        return cuerpo(HttpStatus.BAD_REQUEST, "Falta el parametro requerido: " + ex.getParameterName());
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

    /** Ruta sin controlador: es un 404 del cliente, no un fallo interno del servidor. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> rutaInexistente(NoResourceFoundException ex) {
        return cuerpo(HttpStatus.NOT_FOUND, "El recurso solicitado no existe");
    }

    /** La ruta existe, pero no admite el metodo HTTP usado. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> metodoNoPermitido(HttpRequestMethodNotSupportedException ex) {
        return cuerpo(HttpStatus.METHOD_NOT_ALLOWED, "Metodo HTTP no permitido para este recurso");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> inesperado(Exception ex) {
        log.error("Error inesperado en API REST: {}", ex.getClass().getSimpleName());
        return cuerpo(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrio un error interno en el servidor");
    }

    private ResponseEntity<Map<String, String>> cuerpo(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(Map.of("mensaje", mensaje));
    }
}
