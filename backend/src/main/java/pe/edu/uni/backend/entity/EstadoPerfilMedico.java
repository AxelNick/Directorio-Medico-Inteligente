package pe.edu.uni.backend.entity;

/**
 * Estado de publicacion del perfil medico en el directorio publico (Sprint 3).
 * Separado de {@link EstadoColegiatura}: tener CMP verificado no implica publicacion automatica.
 */
public enum EstadoPerfilMedico {
    PENDIENTE_REVISION,
    APROBADO,
    SUSPENDIDO,
    DESHABILITADO
}
