package pe.edu.uni.backend.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.CrearResenaRequest;
import pe.edu.uni.backend.dto.PaginaResenasResponse;
import pe.edu.uni.backend.dto.ResenaPublicaResponse;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Resena;
import pe.edu.uni.backend.event.ResenaEstadoCambiadoEvent;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.ResenaRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

@Service
public class ResenaService {
    private final ResenaRepository resenas;
    private final UsuarioRepository usuarios;
    private final MedicoRepository medicos;
    private final DirectorioService directorio;
    private final ReputacionService reputacion;
    private final ApplicationEventPublisher eventos;

    public ResenaService(ResenaRepository resenas, UsuarioRepository usuarios, MedicoRepository medicos,
            DirectorioService directorio, ReputacionService reputacion, ApplicationEventPublisher eventos) {
        this.resenas = resenas;
        this.usuarios = usuarios;
        this.medicos = medicos;
        this.directorio = directorio;
        this.reputacion = reputacion;
        this.eventos = eventos;
    }

    @Transactional
    public ResenaPublicaResponse crear(int medicoId, String username, CrearResenaRequest datos) {
        var medico = directorio.buscarPublicable(medicoId);
        var paciente = usuarios.findByUsername(username)
                .orElseThrow(() -> new RecursoNoEncontradoException("La cuenta del paciente no existe"));
        var resena = new Resena();
        resena.setMedico(medico);
        resena.setPaciente(paciente);
        resena.setPuntuacion(datos.puntuacion());
        resena.setComentario(datos.comentario() == null ? null : datos.comentario().strip());
        var guardada = resenas.saveAndFlush(resena);
        eventos.publishEvent(new ResenaEstadoCambiadoEvent(medicoId, guardada.getId(), null,
                guardada.getEstadoVisibilidad()));
        return ResenaPublicaResponse.desde(guardada);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PaginaResenasResponse listarPublicas(int medicoId, int page, int size) {
        directorio.buscarPublicable(medicoId);
        return visibles(medicoId, page, size);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PaginaResenasResponse reputacionPropia(String username, int page, int size) {
        var medico = medicos.findByUsuarioUsername(username)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un perfil para esta sesión"));
        return visibles(medico.getId(), page, size);
    }

    private PaginaResenasResponse visibles(int medicoId, int page, int size) {
        var pageable = DirectorioService.pagina(page, size, Sort.by(Sort.Direction.DESC, "fechaCreacion", "id"));
        var items = resenas.findByMedicoIdAndEstadoVisibilidad(medicoId, EstadoVisibilidadResena.VISIBLE, pageable)
                .map(ResenaPublicaResponse::desde);
        var resumen = reputacion.consultar(medicoId);
        return new PaginaResenasResponse(items.getContent(), page, size, resumen.total(), resumen.promedio());
    }
}
