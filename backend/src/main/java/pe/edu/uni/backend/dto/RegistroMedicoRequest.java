package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cuerpo de POST /auth/register: solo crea medicos; el rol lo decide el servidor. */
public record RegistroMedicoRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es valido")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        String username,

        @NotBlank(message = "La contrasena es obligatoria")
        @Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
        String password,

        @NotBlank(message = "La colegiatura es obligatoria")
        @Pattern(regexp = "^[A-Za-z0-9-]{4,20}$", message = "La colegiatura debe tener entre 4 y 20 caracteres alfanumericos")
        String colegiatura
) {}
