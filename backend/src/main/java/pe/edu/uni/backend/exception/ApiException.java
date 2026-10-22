package pe.edu.uni.backend.exception;

import org.springframework.http.HttpStatus;

/** Excepcion de negocio con el codigo HTTP que debe devolver la API. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
