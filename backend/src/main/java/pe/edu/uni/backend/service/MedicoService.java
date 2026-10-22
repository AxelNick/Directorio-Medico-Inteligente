package pe.edu.uni.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.uni.backend.dto.ActualizarPerfilRequest;
import pe.edu.uni.backend.dto.CentroAtencionRequest;
import pe.edu.uni.backend.dto.CentroAtencionResponse;
import pe.edu.uni.backend.dto.PerfilMedicoResponse;
import pe.edu.uni.backend.dto.RegistroMedicoRequest;
import pe.edu.uni.backend.dto.RegistroMedicoResponse;
import pe.edu.uni.backend.entity.CentroAtencion;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.CentroAtencionRepository;
import pe.edu.uni.backend.repository.EspecialidadRepository;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Capa de negocio del dominio del medico (US-MED-02..05).
 * Recibe DTOs del controlador, aplica las reglas y delega la persistencia a los repositorios.
 * Es la unica capa que conoce las entidades JPA y las reglas de propiedad.
 */
@Service
@Transactional
public class MedicoService {

    public static final String ROL_MEDICO = "ROLE_MEDICO";

    private final MedicoRepository medicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CentroAtencionRepository centroRepository;
    private final EspecialidadRepository especialidadRepository;
    private final PasswordEncoder passwordEncoder;
    private final AlmacenamientoFotoService almacenamientoFoto;

    public MedicoService(MedicoRepository medicoRepository,
                         UsuarioRepository usuarioRepository,
                         RolRepository rolRepository,
                         CentroAtencionRepository centroRepository,
                         EspecialidadRepository especialidadRepository,
                         PasswordEncoder passwordEncoder,
                         AlmacenamientoFotoService almacenamientoFoto) {
        this.medicoRepository = medicoRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.centroRepository = centroRepository;
        this.especialidadRepository = especialidadRepository;
        this.passwordEncoder = passwordEncoder;
        this.almacenamientoFoto = almacenamientoFoto;
    }

    // ---------- US-MED-03: registro con colegiatura PENDIENTE_VERIFICACION ----------

    /**
     * Crea el usuario de seguridad y su perfil medico en una sola transaccion.
     * La colegiatura siempre nace en PENDIENTE_VERIFICACION; solo la moderacion (US-ADM-02) la cambia.
     */
    public RegistroMedicoResponse registrar(RegistroMedicoRequest request) {
        String username = request.username().trim().toLowerCase();
        String colegiatura = normalizarColegiatura(request.colegiatura());

        if (usuarioRepository.existsByUsername(username)) {
            throw new ConflictoException("Ya existe una cuenta con ese correo");
        }
        if (medicoRepository.existsByColegiatura(colegiatura)) {
            throw new ConflictoException("La colegiatura ya esta registrada");
        }
        Rol rolMedico = rolRepository.findByNombre(ROL_MEDICO)
                .orElseThrow(() -> new IllegalStateException("No existe el rol " + ROL_MEDICO));

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setRol(rolMedico);
        usuario.setHabilitado(true);

        Medico medico = new Medico();
        medico.setUsuario(usuario);
        medico.setColegiatura(colegiatura);
        medico.setEstadoColegiatura(EstadoColegiatura.PENDIENTE_VERIFICACION);

        usuarioRepository.save(usuario);
        Medico guardado = medicoRepository.save(medico);
        return new RegistroMedicoResponse(guardado.getId(), usuario.getUsername(), guardado.getEstadoColegiatura());
    }

    // ---------- US-MED-02 / US-MED-05: carta de presentacion y especialidades ----------

    @Transactional(readOnly = true)
    public PerfilMedicoResponse obtenerPerfil(String username) {
        return PerfilMedicoResponse.desde(medicoDe(username));
    }

    public PerfilMedicoResponse actualizarPerfil(String username, ActualizarPerfilRequest request) {
        Medico medico = medicoDe(username);

        medico.setBiografia(request.biografia() == null ? null : request.biografia().trim());
        medico.setAniosExperiencia(request.aniosExperiencia());
        aplicarColegiatura(medico, request.colegiatura());
        medico.setEspecialidades(resolverEspecialidades(medico, request.especialidadIds()));

        return PerfilMedicoResponse.desde(medicoRepository.save(medico));
    }

    public PerfilMedicoResponse actualizarFoto(String username, MultipartFile foto) {
        Medico medico = medicoDe(username);
        String anterior = medico.getFotoUrl();
        medico.setFotoUrl(almacenamientoFoto.guardar(medico.getId(), foto));
        Medico guardado = medicoRepository.save(medico);
        almacenamientoFoto.eliminar(anterior);
        return PerfilMedicoResponse.desde(guardado);
    }

    /** Un cambio de numero de colegiatura obliga a una nueva verificacion. */
    private void aplicarColegiatura(Medico medico, String nueva) {
        String colegiatura = normalizarColegiatura(nueva);
        if (colegiatura.equals(medico.getColegiatura())) {
            return;
        }
        if (medicoRepository.existsByColegiaturaAndIdNot(colegiatura, medico.getId())) {
            throw new ConflictoException("La colegiatura ya esta registrada por otro medico");
        }
        medico.setColegiatura(colegiatura);
        medico.setEstadoColegiatura(EstadoColegiatura.PENDIENTE_VERIFICACION);
    }

    /**
     * Solo se pueden asignar especialidades activas del catalogo oficial.
     * Una especialidad deshabilitada que el medico ya tenia se conserva (deshabilitar no borra asignaciones).
     */
    private Set<Especialidad> resolverEspecialidades(Medico medico, List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        Set<Integer> solicitados = new LinkedHashSet<>(ids);
        Map<Integer, Especialidad> encontradas = especialidadRepository.findAllById(solicitados).stream()
                .collect(Collectors.toMap(Especialidad::getId, Function.identity()));
        Set<Integer> actuales = medico.getEspecialidades().stream()
                .map(Especialidad::getId)
                .collect(Collectors.toSet());

        Set<Especialidad> resultado = new HashSet<>();
        for (Integer id : solicitados) {
            Especialidad especialidad = encontradas.get(id);
            if (especialidad == null) {
                throw new ValidacionException("La especialidad " + id + " no existe");
            }
            if (!Boolean.TRUE.equals(especialidad.getHabilitada()) && !actuales.contains(id)) {
                throw new ValidacionException("La especialidad '" + especialidad.getNombre() + "' no esta habilitada");
            }
            resultado.add(especialidad);
        }
        return resultado;
    }

    // ---------- US-MED-04: consultorios (CRUD con aislamiento por propietario) ----------

    @Transactional(readOnly = true)
    public List<CentroAtencionResponse> listarCentros(String username) {
        Medico medico = medicoDe(username);
        return centroRepository.findByMedicoIdOrderByIdAsc(medico.getId()).stream()
                .map(CentroAtencionResponse::desde)
                .toList();
    }

    public CentroAtencionResponse crearCentro(String username, CentroAtencionRequest request) {
        Medico medico = medicoDe(username);
        CentroAtencion centro = new CentroAtencion();
        centro.setMedico(medico);
        copiar(request, centro);
        return CentroAtencionResponse.desde(centroRepository.save(centro));
    }

    public CentroAtencionResponse actualizarCentro(String username, Integer centroId, CentroAtencionRequest request) {
        CentroAtencion centro = centroDe(username, centroId);
        copiar(request, centro);
        return CentroAtencionResponse.desde(centroRepository.save(centro));
    }

    public void eliminarCentro(String username, Integer centroId) {
        centroRepository.delete(centroDe(username, centroId));
    }

    private void copiar(CentroAtencionRequest request, CentroAtencion centro) {
        centro.setNombre(request.nombre().trim());
        centro.setDireccion(request.direccion().trim());
        centro.setCiudad(request.ciudad().trim());
    }

    // ---------- helpers ----------

    /** El medico siempre se toma de la sesion; nunca de un id enviado por el cliente. */
    private Medico medicoDe(String username) {
        return medicoRepository.findByUsuarioUsername(username)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un perfil medico para la sesion actual"));
    }

    /** Un centro ajeno responde 404, igual que uno inexistente, para no revelar ids de otros medicos. */
    private CentroAtencion centroDe(String username, Integer centroId) {
        Medico medico = medicoDe(username);
        return centroRepository.findByIdAndMedicoId(centroId, medico.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("El centro de atencion no existe"));
    }

    private static String normalizarColegiatura(String colegiatura) {
        return colegiatura.trim().toUpperCase();
    }
}
