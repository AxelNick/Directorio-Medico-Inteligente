package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.Resena;

import java.time.OffsetDateTime;

public record ResenaPublicaResponse(Long id, Integer puntuacion, String comentario, OffsetDateTime fechaCreacion) {
    public static ResenaPublicaResponse desde(Resena resena) {
        return new ResenaPublicaResponse(resena.getId(), resena.getPuntuacion(),
                resena.getComentario(), resena.getFechaCreacion());
    }
}
