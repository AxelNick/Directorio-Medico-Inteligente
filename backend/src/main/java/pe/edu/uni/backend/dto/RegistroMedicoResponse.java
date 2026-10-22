package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.EstadoColegiatura;

public record RegistroMedicoResponse(Integer id, String username, EstadoColegiatura estadoColegiatura) {}
