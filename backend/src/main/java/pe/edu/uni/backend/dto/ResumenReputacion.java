package pe.edu.uni.backend.dto;

public record ResumenReputacion(Integer medicoId, Double promedio, long total) {
    public static ResumenReputacion vacio(Integer medicoId) {
        return new ResumenReputacion(medicoId, null, 0);
    }
}
