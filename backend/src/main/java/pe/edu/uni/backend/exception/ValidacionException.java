package pe.edu.uni.backend.exception;

import org.springframework.http.HttpStatus;

/** 400: regla de negocio incumplida que Bean Validation no puede expresar. */
public class ValidacionException extends ApiException {
    public ValidacionException(String mensaje) {
        super(HttpStatus.BAD_REQUEST, mensaje);
    }
}
