package pe.edu.uni.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.uni.backend.dto.ActualizarColegiaturaRequest;
import pe.edu.uni.backend.dto.ActualizarEstadoPerfilRequest;
import pe.edu.uni.backend.dto.ActualizarEstadoUsuarioRequest;
import pe.edu.uni.backend.dto.AdminMedicoResponse;
import pe.edu.uni.backend.dto.AdminUsuarioResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.service.CuentaAdminService;
import pe.edu.uni.backend.service.ModeracionMedicoService;

/**
 * Controlador REST de moderacion administrativa de medicos y cuentas de usuario (Sprint 3).
 * Separado de {@link AdminController} (auditoria y catalogo). Todas las rutas requieren ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Moderación Administrativa", description = "Gestión administrativa de perfiles médicos, colegiaturas y cuentas de usuario (ROLE_ADMIN)")
@SecurityRequirement(name = "bearerAuth")
public class AdminModeracionController {

    private final ModeracionMedicoService moderacionMedicoService;
    private final CuentaAdminService cuentaAdminService;

    public AdminModeracionController(ModeracionMedicoService moderacionMedicoService,
                                     CuentaAdminService cuentaAdminService) {
        this.moderacionMedicoService = moderacionMedicoService;
        this.cuentaAdminService = cuentaAdminService;
    }

    @GetMapping("/medicos")
    @Operation(summary = "Listar médicos para moderación", description = "Permite filtrar por estadoPerfil de forma paginada")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado paginado de médicos"),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public PaginaResponse<AdminMedicoResponse> listarMedicos(
            @RequestParam(required = false) EstadoPerfilMedico estadoPerfil,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return moderacionMedicoService.listarMedicos(estadoPerfil, page, size);
    }

    @PatchMapping("/medicos/{id}/estado-perfil")
    @Operation(summary = "Actualizar estado de publicación del perfil médico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de perfil actualizado"),
            @ApiResponse(responseCode = "400", description = "Solicitud inválida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado"),
            @ApiResponse(responseCode = "409", description = "Transición repetida o no permitida")
    })
    public AdminMedicoResponse actualizarEstadoPerfil(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarEstadoPerfilRequest request,
            Authentication auth) {
        return moderacionMedicoService.actualizarEstadoPerfil(id, request.estadoPerfil(), auth.getName());
    }

    @PatchMapping("/medicos/{id}/colegiatura")
    @Operation(summary = "Verificar o rechazar colegiatura médica")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Colegiatura actualizada"),
            @ApiResponse(responseCode = "400", description = "Solicitud inválida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado"),
            @ApiResponse(responseCode = "409", description = "La colegiatura ya posee ese estado")
    })
    public AdminMedicoResponse actualizarColegiatura(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarColegiaturaRequest request,
            Authentication auth) {
        return moderacionMedicoService.actualizarColegiatura(id, request.estadoColegiatura(), auth.getName());
    }

    @GetMapping("/usuarios")
    @Operation(summary = "Listar cuentas de usuario", description = "Devuelve usuarios paginados sin exponer contraseñas ni hashes")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado paginado de usuarios"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public PaginaResponse<AdminUsuarioResponse> listarUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return cuentaAdminService.listarUsuarios(page, size);
    }

    @PatchMapping("/usuarios/{id}/estado")
    @Operation(summary = "Habilitar o bloquear una cuenta de usuario", description = "Impide el auto-bloqueo y evita dejar el sistema sin administradores activos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de cuenta actualizado"),
            @ApiResponse(responseCode = "400", description = "Solicitud inválida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
            @ApiResponse(responseCode = "409", description = "Auto-bloqueo, último administrador o estado repetido")
    })
    public AdminUsuarioResponse actualizarEstadoUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarEstadoUsuarioRequest request,
            Authentication auth) {
        return cuentaAdminService.actualizarEstado(id, Boolean.TRUE.equals(request.habilitado()), auth.getName());
    }
}
