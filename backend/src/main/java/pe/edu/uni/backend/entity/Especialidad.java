package pe.edu.uni.backend.entity;

import jakarta.persistence.*;

/**
 * Catalogo oficial de especialidades. La gestion CRUD (US-ADM-03) pertenece al modulo
 * administrativo; el dominio del medico solo la consume para la relacion N:M.
 */
@Entity
@Table(name = "especialidades")
public class Especialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(nullable = false)
    private Boolean habilitada = true;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Boolean getHabilitada() { return habilitada; }
    public void setHabilitada(Boolean habilitada) { this.habilitada = habilitada; }
}
