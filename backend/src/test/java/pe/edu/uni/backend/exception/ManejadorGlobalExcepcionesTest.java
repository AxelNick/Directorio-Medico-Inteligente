package pe.edu.uni.backend.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import pe.edu.uni.backend.security.JwtUtils;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Defecto D-06: una ruta inexistente debe responder 404 con { "mensaje" }, no 500. */
@SpringBootTest
@ActiveProfiles("local")
class ManejadorGlobalExcepcionesTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JwtUtils jwtUtils;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void rutaInexistenteResponde404ConMensaje() throws Exception {
        String tokenAdmin = jwtUtils.generarToken("admin@uni.edu.pe", "ROLE_ADMIN");

        mockMvc.perform(get("/api/v1/no-existe")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("El recurso solicitado no existe"));
    }

    @Test
    void rutaInexistenteSinTokenSigueRespondiendo401() throws Exception {
        mockMvc.perform(get("/api/v1/no-existe"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("No autenticado"));
    }

    @Test
    void metodoNoPermitidoResponde405ConMensaje() throws Exception {
        // /auth/login solo admite POST.
        mockMvc.perform(get("/auth/login"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.mensaje").value("Metodo HTTP no permitido para este recurso"));
    }
}
