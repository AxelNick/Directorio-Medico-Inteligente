package pe.edu.uni.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.edu.uni.backend.dto.CrearResenaRequest;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("local")
class OnCommitResenasTest {
    @Autowired private DirectorioService directorio;
    @Autowired private CacheDirectorio cache;
    @Autowired private ReputacionService reputacion;
    @Autowired private ResenaService resenas;
    @Autowired private ModeracionResenasService moderacion;
    @Autowired private MedicoRepository medicos;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private RolRepository roles;
    @Autowired private PlatformTransactionManager transacciones;

    @Test
    void observadoresActualizanAmbosCachesDespuesDelCommitYNoTrasRollback() {
        var medico = new Medico();
        medico.setUsuario(usuario("ROLE_MEDICO"));
        medico.setNombres("Ana");
        medico.setApellidos("Paz");
        medico.setColegiatura(UUID.randomUUID().toString().substring(0, 12));
        medico.setEstadoPerfil(EstadoPerfilMedico.APROBADO);
        medico.setEstadoColegiatura(EstadoColegiatura.VERIFICADA);
        int id = medicos.saveAndFlush(medico).getId();
        String paciente = usuario("ROLE_PACIENTE").getUsername();

        var inicial = cache.obtener(id, () -> directorio.ficha(id));
        var resumenInicial = reputacion.resumenParaFicha(id);
        assertThat(inicial.resumen().totalResenas()).isZero();
        long resenaId = resenas.crear(id, paciente, new CrearResenaRequest(5, null)).id();
        assertThat(cache.obtener(id, () -> directorio.ficha(id))).isNotSameAs(inicial);
        assertThat(reputacion.resumenParaFicha(id)).isNotSameAs(resumenInicial);

        moderacion.actualizarEstado(resenaId, EstadoVisibilidadResena.VISIBLE, "admin-ensayo");
        var publicada = cache.obtener(id, () -> directorio.ficha(id));
        var resumenPublicado = reputacion.resumenParaFicha(id);
        assertThat(publicada.resumen().promedioCalificacion()).isEqualTo(5);
        assertThat(resumenPublicado.total()).isOne();

        new TransactionTemplate(transacciones).executeWithoutResult(tx -> {
            moderacion.actualizarEstado(resenaId, EstadoVisibilidadResena.OCULTA, "admin-ensayo");
            tx.setRollbackOnly();
        });
        assertThat(cache.obtener(id, () -> directorio.ficha(id))).isSameAs(publicada);
        assertThat(reputacion.resumenParaFicha(id)).isSameAs(resumenPublicado);
        assertThat(resenas.listarPublicas(id, 0, 5).total()).isOne();

        moderacion.actualizarEstado(resenaId, EstadoVisibilidadResena.OCULTA, "admin-ensayo");
        assertThat(cache.obtener(id, () -> directorio.ficha(id)).resumen().promedioCalificacion()).isNull();
        assertThat(reputacion.resumenParaFicha(id).total()).isZero();
    }

    private Usuario usuario(String rol) {
        var usuario = new Usuario();
        usuario.setUsername(UUID.randomUUID() + "@ensayo.invalid");
        usuario.setPassword("hash-ficticio");
        usuario.setRol(roles.findByNombre(rol).orElseThrow());
        usuario.setHabilitado(true);
        return usuarios.saveAndFlush(usuario);
    }
}
