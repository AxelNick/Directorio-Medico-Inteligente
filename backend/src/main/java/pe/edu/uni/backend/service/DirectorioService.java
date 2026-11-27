package pe.edu.uni.backend.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.*;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.DirectorioSpecifications;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.ResenaRepository;

import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DirectorioService {
    private final MedicoRepository medicos;
    private final ResenaRepository resenas;
    private final ReputacionService reputacionService;

    public DirectorioService(MedicoRepository medicos, ResenaRepository resenas, ReputacionService reputacionService) {
        this.medicos = medicos;
        this.resenas = resenas;
        this.reputacionService = reputacionService;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PaginaResponse<MedicoPublicoResponse> buscar(String nombre, Integer especialidadId, String ciudad,
            String colegiatura, Double calificacionMinima, int page, int size, String sort) {
        Specification<Medico> filtro = DirectorioSpecifications.publicable();
        if (nombre != null && !nombre.isBlank()) {
            if (nombre.length() > 200) {
                throw new ValidacionException("El nombre de búsqueda admite hasta 200 caracteres");
            }
            filtro = filtro.and(DirectorioSpecifications.nombre(nombre));
        }
        if (especialidadId != null) {
            filtro = filtro.and(DirectorioSpecifications.especialidad(especialidadId));
        }
        if (ciudad != null && !ciudad.isBlank()) {
            filtro = filtro.and(DirectorioSpecifications.ciudad(ciudad));
        }
        if (colegiatura != null && !colegiatura.isBlank()) {
            filtro = filtro.and(DirectorioSpecifications.colegiatura(colegiatura));
        }
        if (calificacionMinima != null) {
            if (!Double.isFinite(calificacionMinima) || calificacionMinima < 1 || calificacionMinima > 5) {
                throw new ValidacionException("La calificación mínima debe estar entre 1 y 5");
            }
            filtro = filtro.and(DirectorioSpecifications.calificacionMinima(calificacionMinima));
        }

        var pagina = medicos.findAll(filtro, pagina(page, size, orden(sort)));
        var ids = pagina.map(Medico::getId).getContent();
        if (ids.isEmpty()) {
            return new PaginaResponse<>(java.util.List.of(), page, size, pagina.getTotalElements());
        }
        var reputacion = resenas.resumir(ids, EstadoVisibilidadResena.VISIBLE).stream()
                .collect(Collectors.toMap(ResumenReputacion::medicoId, Function.identity()));
        var items = pagina.stream().map(medico -> MedicoPublicoResponse.desde(medico,
                reputacion.getOrDefault(medico.getId(), ResumenReputacion.vacio(medico.getId())))).toList();
        return new PaginaResponse<>(items, page, size, pagina.getTotalElements());
    }

    public FichaMedicoPublicoResponse ficha(Integer medicoId) {
        var medico = buscarPublicable(medicoId);
        return FichaMedicoPublicoResponse.desde(medico, reputacionService.resumenParaFicha(medicoId));
    }

    Medico buscarPublicable(Integer medicoId) {
        return medicos.findOne(DirectorioSpecifications.publicable()
                        .and((medico, query, cb) -> cb.equal(medico.get("id"), medicoId)))
                .orElseThrow(() -> new RecursoNoEncontradoException("El médico no está disponible"));
    }

    static PageRequest pagina(int page, int size, Sort orden) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new ValidacionException("Parámetros de paginación inválidos");
        }
        return PageRequest.of(page, size, orden);
    }

    private static Sort orden(String valor) {
        if (valor == null || valor.isBlank()) {
            return Sort.by("apellidos", "nombres", "id");
        }
        var partes = valor.split(",", -1);
        if (partes.length > 2 || !java.util.Set.of("apellidos", "nombres", "colegiatura", "id").contains(partes[0])
                || (partes.length == 2 && !java.util.Set.of("asc", "desc").contains(partes[1]))) {
            throw new ValidacionException("Orden del directorio inválido");
        }
        var direccion = partes.length == 2 ? Sort.Direction.fromString(partes[1]) : Sort.Direction.ASC;
        var orden = Sort.by(direccion, partes[0]);
        return partes[0].equals("id") ? orden : orden.and(Sort.by("id"));
    }
}
