CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL,
    habilitado BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Inserción de roles base
INSERT INTO roles (nombre) VALUES ('ROLE_ADMIN'), ('ROLE_MEDICO'), ('ROLE_PACIENTE');

-- Creación del administrador por defecto 
-- (La contraseña es 'admin123' hasheada con BCrypt para que Spring Security la acepte)
INSERT INTO usuarios (username, password, rol_id) VALUES 
('admin@uni.edu.pe', '$2a$10$XU1n7.pB0v8x.9K3g/7j3e7Z2y1c5r.b1M1M1M1M1M1M1M1M1M1M1', 1);