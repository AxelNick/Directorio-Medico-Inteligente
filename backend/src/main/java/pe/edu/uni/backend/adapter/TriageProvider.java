package pe.edu.uni.backend.adapter;

import pe.edu.uni.backend.dto.EspecialidadRefResponse;

import java.util.List;
import java.util.Optional;

@FunctionalInterface
public interface TriageProvider {
    Optional<Integer> sugerir(String mensaje, List<EspecialidadRefResponse> catalogo);
}
