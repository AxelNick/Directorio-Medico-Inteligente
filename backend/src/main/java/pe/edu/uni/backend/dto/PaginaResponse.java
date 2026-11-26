package pe.edu.uni.backend.dto;

import java.util.List;

/** Respuesta paginada comun alineada con el cliente frontend (items, page, size, total). */
public record PaginaResponse<T>(
        List<T> items,
        int page,
        int size,
        long total
) {}
