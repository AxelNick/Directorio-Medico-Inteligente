package pe.edu.uni.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Resena;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.ResenaRepository;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("local")
class IntegracionSeguridadYSwaggerTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private MedicoRepository medicoRepository;
    @Autowired private ResenaRepository resenaRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void corsPermitePatchDesdeOrigenAutorizado() throws Exception {
        mockMvc.perform(options("/api/v1/admin/medicos/1/estado-perfil")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk());
    }

    @Test
    void rutasAdminResponden401SinTokenY403ConRolIncorrecto() throws Exception {
        mockMvc.perform(get("/api/v1/admin/medicos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("No autenticado"));

        Usuario paciente = crearUsuarioSiNoExiste("qa.paciente@uni.edu.pe", "ROLE_PACIENTE");
        String tokenPaciente = jwtUtils.generarToken(paciente.getUsername(), "ROLE_PACIENTE");

        mockMvc.perform(get("/api/v1/admin/medicos")
                        .header("Authorization", "Bearer " + tokenPaciente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void bloquearUsuarioInvalidaJwtEmitidoPreviamente() throws Exception {
        Usuario usuario = crearUsuarioSiNoExiste("qa.bloqueable@uni.edu.pe", "ROLE_PACIENTE");
        String tokenUsuario = jwtUtils.generarToken(usuario.getUsername(), "ROLE_PACIENTE");
        String tokenAdmin = jwtUtils.generarToken("admin@uni.edu.pe", "ROLE_ADMIN");

        // Antes del bloqueo el token es valido
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + tokenUsuario))
                .andExpect(status().isOk());

        // Admin bloquea la cuenta
        mockMvc.perform(patch("/api/v1/admin/usuarios/" + usuario.getId() + "/estado")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"habilitado\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.habilitado").value(false));

        // El mismo JWT emitido previamente deja de autorizar nuevas solicitudes
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + tokenUsuario))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void moderacionDeMedicoYResenaEndToEndYSwaggerPublico() throws Exception {
        Usuario medUser = crearUsuarioSiNoExiste("qa.medico.mod@uni.edu.pe", "ROLE_MEDICO");
        Medico medico = medicoRepository.findByUsuarioUsername(medUser.getUsername())
                .orElseGet(() -> {
                    Medico m = new Medico();
                    m.setUsuario(medUser);
                    m.setNombres("Carlos");
                    m.setApellidos("Perez");
                    m.setColegiatura("CMP-88991");
                    m.setEstadoColegiatura(EstadoColegiatura.PENDIENTE_VERIFICACION);
                    m.setEstadoPerfil(EstadoPerfilMedico.PENDIENTE_REVISION);
                    return medicoRepository.save(m);
                });

        Usuario pacUser = crearUsuarioSiNoExiste("qa.paciente.res@uni.edu.pe", "ROLE_PACIENTE");
        Resena resena = new Resena();
        resena.setMedico(medico);
        resena.setPaciente(pacUser);
        resena.setPuntuacion(4);
        resena.setComentario("Buen trato");
        resena.setEstadoVisibilidad(EstadoVisibilidadResena.PENDIENTE_REVISION);
        resena = resenaRepository.save(resena);

        String tokenAdmin = jwtUtils.generarToken("admin@uni.edu.pe", "ROLE_ADMIN");

        mockMvc.perform(patch("/api/v1/admin/medicos/" + medico.getId() + "/estado-perfil")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estadoPerfil\":\"APROBADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoPerfil").value("APROBADO"));

        mockMvc.perform(patch("/api/v1/admin/resenas/" + resena.getId())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"VISIBLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("VISIBLE"));

        // Documentacion OpenAPI / Swagger UI publica y rutas admin protegidas
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type").value("http"))
                .andExpect(jsonPath("$.paths['/api/v1/admin/medicos']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/resenas']").exists());

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(result -> org.assertj.core.api.Assertions.assertThat(
                        result.getResponse().getContentAsString()).contains("swagger-ui"));

        // Cobertura AOP de edicion y eliminacion de centros (D-03)
        String tokenMed = jwtUtils.generarToken(medUser.getUsername(), "ROLE_MEDICO");
        String creadoJson = mockMvc.perform(post("/medicos/me/centros")
                        .header("Authorization", "Bearer " + tokenMed)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Consultorio A\",\"direccion\":\"Av. 1\",\"ciudad\":\"Lima\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int centroId = Integer.parseInt(creadoJson.replaceAll(".*\"id\":(\\d+).*", "$1"));

        mockMvc.perform(put("/medicos/me/centros/" + centroId)
                        .header("Authorization", "Bearer " + tokenMed)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Consultorio B\",\"direccion\":\"Av. 2\",\"ciudad\":\"Lima\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/medicos/me/centros/" + centroId)
                        .header("Authorization", "Bearer " + tokenMed))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/admin/auditoria?page=0&size=20")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(result -> org.assertj.core.api.Assertions.assertThat(
                        result.getResponse().getContentAsString())
                        .contains("MODERAR_PERFIL")
                        .contains("MODERAR_RESENA")
                        .contains("ELIMINAR")
                        .contains(containsString("Consultorio B").toString().isEmpty() ? "Consultorio B" : "Consultorio B"));
    }

    private Usuario crearUsuarioSiNoExiste(String username, String rolNombre) {
        return usuarioRepository.findByUsername(username).orElseGet(() -> {
            Rol rol = rolRepository.findByNombre(rolNombre).orElseThrow();
            Usuario u = new Usuario();
            u.setUsername(username);
            u.setPassword(passwordEncoder.encode("Secreta123"));
            u.setRol(rol);
            u.setHabilitado(true);
            return usuarioRepository.save(u);
        });
    }
}
