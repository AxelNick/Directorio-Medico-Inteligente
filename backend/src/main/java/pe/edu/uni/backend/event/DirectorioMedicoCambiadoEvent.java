package pe.edu.uni.backend.event;

/** Un id nulo señala un cambio de catálogo que afecta a todas las fichas. */
public record DirectorioMedicoCambiadoEvent(Integer medicoId) {}
