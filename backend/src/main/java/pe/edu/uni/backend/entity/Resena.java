package pe.edu.uni.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.OffsetDateTime;

/**
 * Resena y calificacion de un paciente hacia un medico (Sprint 5).
 * Regla de integridad: una unica resena por par (paciente_id, medico_id) y puntuacion de 1 a 5.
 */
@Entity
@Table(
        name = "resenas",
        indexes = @Index(name = "ix_resenas_medico_visibilidad", columnList = "medico_id, estado_visibilidad"),
        uniqueConstraints = @UniqueConstraint(
                name = "uk_resena_paciente_medico",
                columnNames = {"paciente_id", "medico_id"}
        )
)
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Usuario paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer puntuacion;

    @Column(length = 500)
    private String comentario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_visibilidad", nullable = false, length = 30)
    private EstadoVisibilidadResena estadoVisibilidad = EstadoVisibilidadResena.PENDIENTE_REVISION;

    @Column(name = "fecha_creacion", nullable = false)
    private OffsetDateTime fechaCreacion = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getPaciente() { return paciente; }
    public void setPaciente(Usuario paciente) { this.paciente = paciente; }
    public Medico getMedico() { return medico; }
    public void setMedico(Medico medico) { this.medico = medico; }
    public Integer getPuntuacion() { return puntuacion; }
    public void setPuntuacion(Integer puntuacion) { this.puntuacion = puntuacion; }
    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public EstadoVisibilidadResena getEstadoVisibilidad() { return estadoVisibilidad; }
    public void setEstadoVisibilidad(EstadoVisibilidadResena estadoVisibilidad) { this.estadoVisibilidad = estadoVisibilidad; }
    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(OffsetDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
