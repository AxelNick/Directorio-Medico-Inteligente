package pe.edu.uni.backend.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import pe.edu.uni.backend.dto.ResumenReputacion;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.event.ResenaEstadoCambiadoEvent;
import pe.edu.uni.backend.repository.ResenaRepository;

import java.util.LinkedHashMap;
import java.util.List;

@Service
public class ReputacionService {
    private static final int MAX_RESUMENES = 256;
    private final ResenaRepository resenas;
    private final LinkedHashMap<Integer, ResumenReputacion> resumenes = new LinkedHashMap<>(16, 0.75f, true);

    public ReputacionService(ResenaRepository resenas) {
        this.resenas = resenas;
    }

    public synchronized ResumenReputacion resumenParaFicha(Integer medicoId) {
        var resumen = resumenes.computeIfAbsent(medicoId, this::consultar);
        if (resumenes.size() > MAX_RESUMENES) {
            resumenes.pollFirstEntry();
        }
        return resumen;
    }

    public ResumenReputacion consultar(Integer medicoId) {
        return resenas.resumir(List.of(medicoId), EstadoVisibilidadResena.VISIBLE).stream()
                .findFirst().orElseGet(() -> ResumenReputacion.vacio(medicoId));
    }

    @Order(0)
    @TransactionalEventListener
    public synchronized void actualizar(ResenaEstadoCambiadoEvent evento) {
        resumenes.remove(evento.medicoId());
    }
}
