package pe.edu.uni.backend.dto;

import java.util.List;

public record PaginaResenasResponse(List<ResenaPublicaResponse> items, int page, int size, long total, Double promedio) {}
