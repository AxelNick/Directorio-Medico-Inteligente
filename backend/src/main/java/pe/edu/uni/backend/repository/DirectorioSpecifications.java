package pe.edu.uni.backend.repository;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;
import pe.edu.uni.backend.entity.*;

import java.text.Normalizer;
import java.util.Locale;

public final class DirectorioSpecifications {
    private DirectorioSpecifications() {}

    public static Specification<Medico> publicable() {
        return (medico, query, cb) -> cb.and(
                cb.equal(medico.get("estadoPerfil"), EstadoPerfilMedico.APROBADO),
                cb.equal(medico.get("estadoColegiatura"), EstadoColegiatura.VERIFICADA),
                cb.notEqual(cb.trim(medico.get("nombres")), ""),
                cb.notEqual(cb.trim(medico.get("apellidos")), ""));
    }

    public static Specification<Medico> nombre(String valor) {
        return (medico, query, cb) -> {
            var nombre = cb.concat(cb.concat(medico.<String>get("nombres"), " "), medico.get("apellidos"));
            var texto = sinTildes(cb, nombre);
            var palabras = normalizar(valor).split("\\s+");
            return cb.and(java.util.Arrays.stream(palabras)
                    .map(palabra -> cb.like(texto, contiene(palabra), '\\'))
                    .toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    public static Specification<Medico> colegiatura(String valor) {
        return (medico, query, cb) -> cb.like(cb.lower(medico.get("colegiatura")),
                contiene(valor.trim().toLowerCase(Locale.ROOT)), '\\');
    }

    public static Specification<Medico> especialidad(int id) {
        return (medico, query, cb) -> {
            var coincidencia = query.subquery(Integer.class);
            var especialidad = coincidencia.correlate(medico).join("especialidades");
            coincidencia.select(cb.literal(1)).where(
                    cb.equal(especialidad.get("id"), id), cb.isTrue(especialidad.get("habilitada")));
            return cb.exists(coincidencia);
        };
    }

    public static Specification<Medico> ciudad(String valor) {
        return (medico, query, cb) -> {
            var coincidencia = query.subquery(Integer.class);
            var centro = coincidencia.correlate(medico).join("centros");
            coincidencia.select(cb.literal(1)).where(
                    cb.equal(sinTildes(cb, centro.get("ciudad")), normalizar(valor)));
            return cb.exists(coincidencia);
        };
    }

    public static Specification<Medico> calificacionMinima(double valor) {
        return (medico, query, cb) -> {
            var promedio = query.subquery(Double.class);
            var resena = promedio.from(Resena.class);
            promedio.select(cb.avg(resena.get("puntuacion"))).where(
                    cb.equal(resena.get("medico"), medico),
                    cb.equal(resena.get("estadoVisibilidad"), EstadoVisibilidadResena.VISIBLE));
            return cb.ge(promedio, valor);
        };
    }

    private static String contiene(String valor) {
        return "%" + valor.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static String normalizar(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").trim().toLowerCase(Locale.ROOT);
    }

    private static Expression<String> sinTildes(CriteriaBuilder cb, Expression<String> campo) {
        return cb.function("translate", String.class, cb.lower(campo),
                cb.literal("áàäâãéèëêíìïîóòöôõúùüûñç"), cb.literal("aaaaaeeeeiiiiooooouuuunc"));
    }
}
