package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.Usuario;

/** DTO administrativo de cuentas de usuario (US-ADM-05). Nunca expone contrasena ni hash. */
public record AdminUsuarioResponse(
        Integer id,
        String username,
        String rol,
        Boolean habilitado
) {
    public static AdminUsuarioResponse desde(Usuario usuario) {
        return new AdminUsuarioResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getRol().getNombre(),
                usuario.getHabilitado()
        );
    }
}
