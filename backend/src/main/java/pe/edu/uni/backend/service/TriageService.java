package pe.edu.uni.backend.service;

import org.springframework.stereotype.Service;
import pe.edu.uni.backend.adapter.ProveedorTriageException;
import pe.edu.uni.backend.adapter.TriageProvider;
import pe.edu.uni.backend.dto.EspecialidadRefResponse;
import pe.edu.uni.backend.dto.TriageResponse;
import pe.edu.uni.backend.repository.EspecialidadRepository;

@Service
public class TriageService {
    private final EmergencyDetectionService emergencias;
    private final TriageFallbackService fallback;
    private final TriageProvider proveedor;
    private final EspecialidadRepository especialidades;

    public TriageService(EmergencyDetectionService emergencias, TriageFallbackService fallback,
            TriageProvider proveedor, EspecialidadRepository especialidades) {
        this.emergencias = emergencias;
        this.fallback = fallback;
        this.proveedor = proveedor;
        this.especialidades = especialidades;
    }

    public TriageResponse orientar(String mensaje) {
        if (emergencias.detectarEmergencia(mensaje)) {
            return emergencias.construirRespuestaEmergencia();
        }
        var catalogo = especialidades.findByHabilitadaTrueOrderByNombreAsc().stream()
                .map(e -> new EspecialidadRefResponse(e.getId(), e.getNombre())).toList();
        if (catalogo.isEmpty()) {
            return fallback.construirFallback(null, "catalogo_vacio");
        }
        try {
            var id = proveedor.sugerir(mensaje, catalogo);
            var especialidad = id.flatMap(especialidades::findById)
                    .filter(e -> Boolean.TRUE.equals(e.getHabilitada()))
                    .filter(e -> catalogo.stream().anyMatch(ref -> ref.id().equals(e.getId())));
            return especialidad.map(e -> new TriageResponse(false, false,
                            new EspecialidadRefResponse(e.getId(), e.getNombre()),
                            "Puedes buscar profesionales de esta especialidad en el directorio. "
                                    + "La orientación es informativa y no sustituye una consulta médica."))
                    .orElseGet(() -> fallback.construirFallback(null, "sin_especialidad_valida"));
        } catch (ProveedorTriageException e) {
            return fallback.construirFallback(null, e.getMessage());
        }
    }
}
