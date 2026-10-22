package pe.edu.uni.backend.entity;

/** Ciclo de vida de la colegiatura: nace pendiente y la moderacion (US-ADM-02) la verifica o rechaza. */
public enum EstadoColegiatura {
    PENDIENTE_VERIFICACION,
    VERIFICADA,
    RECHAZADA
}
