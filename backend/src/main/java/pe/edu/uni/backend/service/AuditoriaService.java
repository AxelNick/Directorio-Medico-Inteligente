package pe.edu.uni.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.AuditoriaEventoResponse;
import pe.edu.uni.backend.dto.AuditoriaPaginaResponse;
import pe.edu.uni.backend.entity.Auditoria;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.AuditoriaRepository;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * US-ADM-04: Servicio de consulta y registro de eventos de auditoria.
 */
@Service
@Transactional
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(readOnly = true)
    public AuditoriaPaginaResponse listar(int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new ValidacionException("Parametros de paginacion invalidos (page >= 0, 1 <= size <= 100)");
        }
        Sort orden = Sort.by(Sort.Order.desc("ocurrioEn"), Sort.Order.desc("id"));
        Page<Auditoria> pagina = auditoriaRepository.findAll(PageRequest.of(page, size, orden));
        List<AuditoriaEventoResponse> items = pagina.getContent().stream()
                .map(AuditoriaEventoResponse::desde)
                .toList();
        return new AuditoriaPaginaResponse(items, page, size, pagina.getTotalElements());
    }

    public Auditoria registrarEvento(String actor,
                                     String accion,
                                     String entidad,
                                     String campo,
                                     String valorAnterior,
                                     String valorNuevo) {
        Auditoria evento = new Auditoria();
        evento.setActor(actor != null && !actor.isBlank() ? actor : "sistema");
        evento.setAccion(accion);
        evento.setEntidad(entidad);
        evento.setCampo(campo);
        evento.setValorAnterior(valorAnterior);
        evento.setValorNuevo(valorNuevo);
        evento.setOcurrioEn(OffsetDateTime.now());
        return auditoriaRepository.save(evento);
    }
}
