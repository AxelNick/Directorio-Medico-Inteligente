package pe.edu.uni.backend.event;

import pe.edu.uni.backend.entity.EstadoVisibilidadResena;

public record ResenaEstadoCambiadoEvent(Integer medicoId, Long resenaId,
                                       EstadoVisibilidadResena anterior, EstadoVisibilidadResena nuevo) {}
