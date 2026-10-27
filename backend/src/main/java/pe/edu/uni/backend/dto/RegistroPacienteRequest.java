package pe.edu.uni.backend.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Alta publica: el servidor asigna el rol, nunca el cliente. */
public record RegistroPacienteRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es valido")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        String username,

        @NotBlank(message = "La contrasena es obligatoria")
        @Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
        String password
) {
    public RegistroPacienteRequest {
        if (username != null) username = username.trim();
    }

    @JsonAnySetter
    public void rechazarCampoAdicional(String nombre, Object valor) {
        throw new IllegalArgumentException("Campo no permitido: " + nombre);
    }
}
