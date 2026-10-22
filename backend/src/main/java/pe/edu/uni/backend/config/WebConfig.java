package pe.edu.uni.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.edu.uni.backend.service.AlmacenamientoFotoService;

/** Expone las fotografias guardadas en disco bajo /uploads/fotos/**. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AlmacenamientoFotoService almacenamiento;

    public WebConfig(AlmacenamientoFotoService almacenamiento) {
        this.almacenamiento = almacenamiento;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/fotos/**")
                .addResourceLocations(almacenamiento.getDirectorio().toUri().toString());
    }
}
