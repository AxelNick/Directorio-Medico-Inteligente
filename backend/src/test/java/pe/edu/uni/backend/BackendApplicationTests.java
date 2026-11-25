package pe.edu.uni.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Perfil local (H2 en memoria): la prueba no depende de un PostgreSQL levantado.
@SpringBootTest
@ActiveProfiles("local")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
