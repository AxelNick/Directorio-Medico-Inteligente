-- US-ADM-04: Tabla de auditoria capturada automaticamente por Spring AOP
CREATE TABLE auditoria (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    campo VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    ocurrio_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_ocurrio_en ON auditoria(ocurrio_en DESC, id DESC);
