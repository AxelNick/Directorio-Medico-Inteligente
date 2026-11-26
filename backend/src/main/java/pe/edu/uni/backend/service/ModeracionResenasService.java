package pe.edu.uni.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.AdminResenaResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Resena;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.ResenaRepository;

import java.util.List;

/**
 * Servicio administrativo para listar y moderar visibilidad de resenas (US-ADM-06).
 * Registra auditoria de actor, objetivo y estados anterior/nuevo.
 */
@Service
@Transactional
public class ModeracionResenasService {

    private final ResenaRepository resenaRepository;
    private final AuditoriaService auditoriaService;

    public ModeracionResenasService(ResenaRepository resenaRepository, AuditoriaService auditoriaService) {
        this.resenaRepository = resenaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AdminResenaResponse> listarResenas(EstadoVisibilidadResena estado, int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new ValidacionException("Parametros de paginacion invalidos (page >= 0, 1 <= size <= 100)");
        }
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("fechaCreacion"), Sort.Order.desc("id")));
        Page<Resena> pagina = estado != null
                ? resenaRepository.findByEstadoVisibilidad(estado, pageable)
                : resenaRepository.findAllBy(pageable);
        List<AdminResenaResponse> items = pagina.getContent().stream()
                .map(AdminResenaResponse::desde)
                .toList();
        return new PaginaResponse<>(items, page, size, pagina.getTotalElements());
    }

    public AdminResenaResponse actualizarEstado(Long resenaId, EstadoVisibilidadResena nuevoEstado, String actor) {
        if (nuevoEstado != EstadoVisibilidadResena.VISIBLE && nuevoEstado != EstadoVisibilidadResena.OCULTA) {
            throw new ValidacionException("Solo se permite moderar una resena a estado VISIBLE u OCULTA");
        }
        Resena resena = resenaRepository.findById(resenaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("La resena no existe"));

        EstadoVisibilidadResena actual = resena.getEstadoVisibilidad();
        if (actual == nuevoEstado) {
            throw new ConflictoException("La resena ya se encuentra en estado " + nuevoEstado);
        }

        resena.setEstadoVisibilidad(nuevoEstado);
        Resena guardada = resenaRepository.save(resena);
        auditoriaService.registrarEvento(
                actor,
                "MODERAR_RESENA",
                "Resena #" + guardada.getId(),
                "estadoVisibilidad",
                actual.name(),
                nuevoEstado.name()
        );
        return AdminResenaResponse.desde(guardada);
    }
}
