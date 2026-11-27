package pe.edu.uni.backend.factory;

import pe.edu.uni.backend.adapter.TriageProvider;
import pe.edu.uni.backend.dto.EspecialidadRefResponse;

import java.text.Normalizer;
import java.util.Locale;

public class MockTriageCreator extends TriageProviderCreator {
    @Override
    public TriageProvider createProvider() {
        return (mensaje, catalogo) -> {
            String consulta = normalizar(mensaje);
            return catalogo.stream().filter(especialidad -> consulta.contains(normalizar(especialidad.nombre())))
                    .findFirst().map(EspecialidadRefResponse::id);
        };
    }

    private static String normalizar(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
