package pe.edu.uni.backend.exception;

import org.springframework.http.HttpStatus;

/** 409: duplicado de usuario, colegiatura o especialidad. */
public class ConflictoException extends ApiException {
    public ConflictoException(String mensaje) {
        super(HttpStatus.CONFLICT, mensaje);
    }
}
