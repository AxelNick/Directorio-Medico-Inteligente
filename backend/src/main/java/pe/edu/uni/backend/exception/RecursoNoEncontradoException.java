package pe.edu.uni.backend.exception;

import org.springframework.http.HttpStatus;

/** 404: recurso inexistente o que pertenece a otro usuario (no se revela cual de los dos). */
public class RecursoNoEncontradoException extends ApiException {
    public RecursoNoEncontradoException(String mensaje) {
        super(HttpStatus.NOT_FOUND, mensaje);
    }
}
