-- US-MED-02..05: dominio del medico (perfil, colegiatura, centros y especialidades)

CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    habilitada BOOLEAN NOT NULL DEFAULT TRUE
);

-- Medico: relacion 1:1 con usuarios (un usuario con ROLE_MEDICO tiene exactamente un perfil medico)
CREATE TABLE medicos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
    colegiatura VARCHAR(20) NOT NULL UNIQUE,
    estado_colegiatura VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
    biografia VARCHAR(2000),
    anios_experiencia INTEGER,
    foto_url VARCHAR(255),
    CONSTRAINT fk_medico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT chk_anios_experiencia CHECK (anios_experiencia IS NULL OR anios_experiencia BETWEEN 0 AND 70)
);

-- CentroAtencion: relacion 1:N (un medico tiene muchos consultorios)
CREATE TABLE centros_atencion (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    CONSTRAINT fk_centro_medico FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Especialidades acreditadas: relacion N:M medico <-> especialidad
CREATE TABLE medico_especialidad (
    medico_id INTEGER NOT NULL,
    especialidad_id INTEGER NOT NULL,
    PRIMARY KEY (medico_id, especialidad_id),
    CONSTRAINT fk_me_medico FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    CONSTRAINT fk_me_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades(id)
);

CREATE INDEX idx_centros_medico ON centros_atencion(medico_id);

-- Catalogo inicial para poder probar la asignacion de especialidades
INSERT INTO especialidades (nombre) VALUES
    ('Medicina General'), ('Cardiología'), ('Pediatría'), ('Dermatología'), ('Ginecología');
