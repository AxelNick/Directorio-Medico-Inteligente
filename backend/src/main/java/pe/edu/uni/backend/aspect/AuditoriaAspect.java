package pe.edu.uni.backend.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import pe.edu.uni.backend.dto.ActualizarEspecialidadRequest;
import pe.edu.uni.backend.dto.ActualizarPerfilRequest;
import pe.edu.uni.backend.dto.CentroAtencionResponse;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.repository.EspecialidadRepository;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.service.AuditoriaService;

import java.util.Objects;
import java.util.stream.Collectors;

/**
 * US-ADM-04: Capa Transversal AOP para captura automatica de logs de auditoria.
 *
 * Patron de Diseno GoF: PROXY (Estructural).
 * Spring AOP envuelve los beans de servicio (MedicoService, EspecialidadService) en un Proxy dinamico.
 * Este aspecto intercepta las operaciones de negocio sin contaminar el codigo de dominio
 * (Separacion de Responsabilidades / SRP). Nunca registra contrasenas, hashes ni tokens JWT.
 */
@Aspect
@Component
public class AuditoriaAspect {

    private final AuditoriaService auditoriaService;
    private final MedicoRepository medicoRepository;
    private final EspecialidadRepository especialidadRepository;

    public AuditoriaAspect(AuditoriaService auditoriaService,
                           MedicoRepository medicoRepository,
                           EspecialidadRepository especialidadRepository) {
        this.auditoriaService = auditoriaService;
        this.medicoRepository = medicoRepository;
        this.especialidadRepository = especialidadRepository;
    }

    /**
     * Intercepta la actualizacion del perfil medico para comparar valores anteriores y nuevos
     * y registrar los campos modificados solo si la transaccion culmina con exito.
     */
    @Around("execution(* pe.edu.uni.backend.service.MedicoService.actualizarPerfil(..)) && args(username, request)")
    public Object auditarActualizacionPerfil(ProceedingJoinPoint joinPoint,
                                             String username,
                                             ActualizarPerfilRequest request) throws Throwable {
        Medico previo = medicoRepository.findByUsuarioUsername(username).orElse(null);
        String bioAnterior = previo != null ? previo.getBiografia() : null;
        Integer expAnterior = previo != null ? previo.getAniosExperiencia() : null;
        String colAnterior = previo != null ? previo.getColegiatura() : null;
        String espAnterior = previo != null
                ? previo.getEspecialidades().stream()
                    .map(e -> String.valueOf(e.getId()))
                    .sorted()
                    .collect(Collectors.joining(","))
                : null;

        Object resultado = joinPoint.proceed();

        String actor = obtenerActorActual(username);
        String bioNueva = request.biografia() != null ? request.biografia().trim() : null;
        if (!Objects.equals(bioAnterior, bioNueva)) {
            auditoriaService.registrarEvento(actor, "ACTUALIZAR", "Perfil médico", "biografia", bioAnterior, bioNueva);
        }
        if (!Objects.equals(expAnterior, request.aniosExperiencia())) {
            auditoriaService.registrarEvento(actor, "ACTUALIZAR", "Perfil médico", "aniosExperiencia",
                    valorComoTexto(expAnterior), valorComoTexto(request.aniosExperiencia()));
        }
        String colNueva = request.colegiatura() != null ? request.colegiatura().trim().toUpperCase() : null;
        if (!Objects.equals(colAnterior, colNueva)) {
            auditoriaService.registrarEvento(actor, "ACTUALIZAR", "Perfil médico", "colegiatura", colAnterior, colNueva);
        }
        String espNueva = request.especialidadIds() != null
                ? request.especialidadIds().stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .sorted()
                    .collect(Collectors.joining(","))
                : "";
        if (!Objects.equals(espAnterior, espNueva)) {
            auditoriaService.registrarEvento(actor, "ACTUALIZAR", "Perfil médico", "especialidadIds", espAnterior, espNueva);
        }

        return resultado;
    }

    /**
     * Intercepta la creacion de nuevas especialidades en el catalogo administrativo.
     */
    @AfterReturning(
            pointcut = "execution(* pe.edu.uni.backend.service.EspecialidadService.crear(..))",
            returning = "creada"
    )
    public void auditarCreacionEspecialidad(Especialidad creada) {
        if (creada != null) {
            auditoriaService.registrarEvento(
                    obtenerActorActual("admin@uni.edu.pe"),
                    "CREAR",
                    "Especialidad",
                    "nombre",
                    null,
                    creada.getNombre()
            );
        }
    }

    /**
     * Intercepta la edicion o deshabilitacion (borrado logico) de una especialidad del catalogo.
     */
    @Around("execution(* pe.edu.uni.backend.service.EspecialidadService.actualizar(..)) && args(id, request)")
    public Object auditarActualizacionEspecialidad(ProceedingJoinPoint joinPoint,
                                                   Integer id,
                                                   ActualizarEspecialidadRequest request) throws Throwable {
        Especialidad previa = especialidadRepository.findById(id).orElse(null);
        String nombreAnterior = previa != null ? previa.getNombre() : null;
        Boolean habAnterior = previa != null ? previa.getHabilitada() : null;

        Object resultado = joinPoint.proceed();

        String actor = obtenerActorActual("admin@uni.edu.pe");
        String nombreNuevo = request.nombre() != null ? request.nombre().trim() : null;
        if (!Objects.equals(nombreAnterior, nombreNuevo)) {
            auditoriaService.registrarEvento(actor, "ACTUALIZAR", "Especialidad", "nombre", nombreAnterior, nombreNuevo);
        }
        if (!Objects.equals(habAnterior, request.habilitada())) {
            String accion = Boolean.FALSE.equals(request.habilitada()) ? "DESHABILITAR" : "HABILITAR";
            auditoriaService.registrarEvento(actor, accion, "Especialidad", "habilitada",
                    valorComoTexto(habAnterior), valorComoTexto(request.habilitada()));
        }

        return resultado;
    }

    /**
     * Intercepta el alta de consultorios fisicos del medico.
     */
    @AfterReturning(
            pointcut = "execution(* pe.edu.uni.backend.service.MedicoService.crearCentro(..))",
            returning = "creado"
    )
    public void auditarCreacionCentro(CentroAtencionResponse creado) {
        if (creado != null) {
            auditoriaService.registrarEvento(
                    obtenerActorActual("medico"),
                    "CREAR",
                    "CentroAtencion",
                    "nombre",
                    null,
                    creado.nombre()
            );
        }
    }

    private String obtenerActorActual(String respaldo) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return respaldo;
    }

    private String valorComoTexto(Object valor) {
        return valor != null ? String.valueOf(valor) : null;
    }
}
