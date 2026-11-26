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
import pe.edu.uni.backend.dto.ActualizarEstadoResenaRequest;
import pe.edu.uni.backend.dto.AdminResenaResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.service.ModeracionResenasService;

/**
 * Controlador REST de moderacion administrativa de resenas (Sprint 5 - US-ADM-06).
 * Todas las rutas requieren ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin/resenas")
@Tag(name = "Moderación de Reseñas", description = "Endpoints administrativos para revisar y moderar reseñas (ROLE_ADMIN)")
@SecurityRequirement(name = "bearerAuth")
public class AdminResenasController {

    private final ModeracionResenasService moderacionResenasService;

    public AdminResenasController(ModeracionResenasService moderacionResenasService) {
        this.moderacionResenasService = moderacionResenasService;
    }

    @GetMapping
    @Operation(summary = "Listar reseñas para moderación", description = "Filtra por estado de visibilidad (PENDIENTE_REVISION, VISIBLE, OCULTA) de forma paginada")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado paginado de reseñas"),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public PaginaResponse<AdminResenaResponse> listarResenas(
            @RequestParam(required = false) EstadoVisibilidadResena estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return moderacionResenasService.listarResenas(estado, page, size);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cambiar visibilidad de una reseña", description = "Cambia el estado a VISIBLE u OCULTA y registra auditoría")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de visibilidad actualizado"),
            @ApiResponse(responseCode = "400", description = "Estado de visibilidad no permitido"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
            @ApiResponse(responseCode = "404", description = "Reseña no encontrada"),
            @ApiResponse(responseCode = "409", description = "La reseña ya posee ese estado")
    })
    public AdminResenaResponse actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoResenaRequest request,
            Authentication auth) {
        return moderacionResenasService.actualizarEstado(id, request.estado(), auth.getName());
    }
}
