package pe.edu.uni.backend.service;

import org.springframework.context.ApplicationEventPublisher;
import pe.edu.uni.backend.event.DirectorioMedicoCambiadoEvent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.AdminMedicoResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.MedicoRepository;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Servicio administrativo para moderar perfiles medicos y estados de colegiatura (US-ADM-02).
 * Valida transiciones y registra auditoria explicita de actor, objetivo y estados anterior/nuevo.
 */
@Service
@Transactional
public class ModeracionMedicoService {

    private static final Map<EstadoPerfilMedico, Set<EstadoPerfilMedico>> TRANSICIONES_PERFIL = Map.of(
            EstadoPerfilMedico.PENDIENTE_REVISION, Set.of(EstadoPerfilMedico.APROBADO, EstadoPerfilMedico.DESHABILITADO),
            EstadoPerfilMedico.APROBADO, Set.of(EstadoPerfilMedico.SUSPENDIDO, EstadoPerfilMedico.DESHABILITADO, EstadoPerfilMedico.PENDIENTE_REVISION),
            EstadoPerfilMedico.SUSPENDIDO, Set.of(EstadoPerfilMedico.APROBADO, EstadoPerfilMedico.DESHABILITADO, EstadoPerfilMedico.PENDIENTE_REVISION),
            EstadoPerfilMedico.DESHABILITADO, Set.of(EstadoPerfilMedico.APROBADO, EstadoPerfilMedico.PENDIENTE_REVISION)
    );

    private final MedicoRepository medicoRepository;
    private final AuditoriaService auditoriaService;
    private final ApplicationEventPublisher eventos;

    public ModeracionMedicoService(MedicoRepository medicoRepository, AuditoriaService auditoriaService,
                                   ApplicationEventPublisher eventos) {
        this.medicoRepository = medicoRepository;
        this.auditoriaService = auditoriaService;
        this.eventos = eventos;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AdminMedicoResponse> listarMedicos(EstadoPerfilMedico estadoPerfil, int page, int size) {
        validarPaginacion(page, size);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("id")));
        Page<Medico> pagina = medicoRepository.buscarParaModeracion(estadoPerfil, pageable);
        List<AdminMedicoResponse> items = pagina.getContent().stream()
                .map(AdminMedicoResponse::desde)
                .toList();
        return new PaginaResponse<>(items, page, size, pagina.getTotalElements());
    }

    public AdminMedicoResponse actualizarEstadoPerfil(Integer medicoId, EstadoPerfilMedico nuevoEstado, String actor) {
        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El medico no existe"));

        EstadoPerfilMedico actual = medico.getEstadoPerfil();
        if (actual == nuevoEstado) {
            throw new ConflictoException("El perfil medico ya se encuentra en estado " + nuevoEstado);
        }
        Set<EstadoPerfilMedico> permitidos = TRANSICIONES_PERFIL.getOrDefault(actual, Set.of());
        if (!permitidos.contains(nuevoEstado)) {
            throw new ConflictoException("Transicion de estado de perfil no permitida: " + actual + " -> " + nuevoEstado);
        }

        medico.setEstadoPerfil(nuevoEstado);
        Medico guardado = medicoRepository.save(medico);
        auditoriaService.registrarEvento(
                actor,
                "MODERAR_PERFIL",
                "Medico #" + guardado.getId(),
                "estadoPerfil",
                actual.name(),
                nuevoEstado.name()
        );
        eventos.publishEvent(new DirectorioMedicoCambiadoEvent(guardado.getId()));
        return AdminMedicoResponse.desde(guardado);
    }

    public AdminMedicoResponse actualizarColegiatura(Integer medicoId, EstadoColegiatura nuevoEstado, String actor) {
        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El medico no existe"));

        EstadoColegiatura actual = medico.getEstadoColegiatura();
        if (actual == nuevoEstado) {
            throw new ConflictoException("La colegiatura ya se encuentra en estado " + nuevoEstado);
        }

        medico.setEstadoColegiatura(nuevoEstado);
        Medico guardado = medicoRepository.save(medico);
        auditoriaService.registrarEvento(
                actor,
                "MODERAR_COLEGIATURA",
                "Medico #" + guardado.getId(),
                "estadoColegiatura",
                actual.name(),
                nuevoEstado.name()
        );
        eventos.publishEvent(new DirectorioMedicoCambiadoEvent(guardado.getId()));
        return AdminMedicoResponse.desde(guardado);
    }

    private void validarPaginacion(int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new ValidacionException("Parametros de paginacion invalidos (page >= 0, 1 <= size <= 100)");
        }
    }
}
