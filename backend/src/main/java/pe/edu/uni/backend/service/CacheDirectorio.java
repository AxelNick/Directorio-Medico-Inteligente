package pe.edu.uni.backend.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import pe.edu.uni.backend.dto.FichaMedicoPublicoResponse;
import pe.edu.uni.backend.event.DirectorioMedicoCambiadoEvent;
import pe.edu.uni.backend.event.ResenaEstadoCambiadoEvent;

import java.util.LinkedHashMap;
import java.util.function.Supplier;

@Component
public class CacheDirectorio {
    private static final int MAX_FICHAS = 256;
    private final LinkedHashMap<Integer, FichaMedicoPublicoResponse> fichas = new LinkedHashMap<>(16, 0.75f, true);

    public synchronized FichaMedicoPublicoResponse obtener(int id, Supplier<FichaMedicoPublicoResponse> cargar) {
        var ficha = fichas.get(id);
        if (ficha == null) {
            ficha = cargar.get();
            fichas.put(id, ficha);
            if (fichas.size() > MAX_FICHAS) {
                fichas.pollFirstEntry();
            }
        }
        return ficha;
    }

    @TransactionalEventListener
    public synchronized void cambiarPerfil(DirectorioMedicoCambiadoEvent evento) {
        if (evento.medicoId() == null) {
            fichas.clear();
        } else {
            fichas.remove(evento.medicoId());
        }
    }

    @TransactionalEventListener
    @Order(1)
    public synchronized void cambiarResena(ResenaEstadoCambiadoEvent evento) {
        fichas.remove(evento.medicoId());
    }
}
