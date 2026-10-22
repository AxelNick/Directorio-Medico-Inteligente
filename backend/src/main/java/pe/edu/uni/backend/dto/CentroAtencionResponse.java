package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.CentroAtencion;

public record CentroAtencionResponse(Integer id, String nombre, String direccion, String ciudad) {
    public static CentroAtencionResponse desde(CentroAtencion c) {
        return new CentroAtencionResponse(c.getId(), c.getNombre(), c.getDireccion(), c.getCiudad());
    }
}
