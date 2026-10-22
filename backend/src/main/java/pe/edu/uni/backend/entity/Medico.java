package pe.edu.uni.backend.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Perfil profesional del medico (US-MED-02..05).
 * Relaciones: 1:1 con Usuario, 1:N con CentroAtencion y N:M con Especialidad.
 */
@Entity
@Table(name = "medicos")
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 20)
    private String colegiatura;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_colegiatura", nullable = false, length = 30)
    private EstadoColegiatura estadoColegiatura = EstadoColegiatura.PENDIENTE_VERIFICACION;

    @Column(length = 2000)
    private String biografia;

    @Column(name = "anios_experiencia")
    private Integer aniosExperiencia;

    @Column(name = "foto_url")
    private String fotoUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "medico_especialidad",
            joinColumns = @JoinColumn(name = "medico_id"),
            inverseJoinColumns = @JoinColumn(name = "especialidad_id"))
    private Set<Especialidad> especialidades = new HashSet<>();

    @OneToMany(mappedBy = "medico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CentroAtencion> centros = new ArrayList<>();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getColegiatura() { return colegiatura; }
    public void setColegiatura(String colegiatura) { this.colegiatura = colegiatura; }
    public EstadoColegiatura getEstadoColegiatura() { return estadoColegiatura; }
    public void setEstadoColegiatura(EstadoColegiatura estadoColegiatura) { this.estadoColegiatura = estadoColegiatura; }
    public String getBiografia() { return biografia; }
    public void setBiografia(String biografia) { this.biografia = biografia; }
    public Integer getAniosExperiencia() { return aniosExperiencia; }
    public void setAniosExperiencia(Integer aniosExperiencia) { this.aniosExperiencia = aniosExperiencia; }
    public String getFotoUrl() { return fotoUrl; }
    public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }
    public Set<Especialidad> getEspecialidades() { return especialidades; }
    public void setEspecialidades(Set<Especialidad> especialidades) { this.especialidades = especialidades; }
    public List<CentroAtencion> getCentros() { return centros; }
    public void setCentros(List<CentroAtencion> centros) { this.centros = centros; }
}
