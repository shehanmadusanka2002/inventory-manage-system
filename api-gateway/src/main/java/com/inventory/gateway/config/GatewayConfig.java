package com.inventory.gateway.config;

import com.inventory.gateway.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Identity Service - Public routes
                .route("identity-service-public", r -> r
                        .path("/api/auth/**")
                        .uri("lb://identity-service"))
                
                // Identity Service - Protected routes
                .route("identity-service", r -> r
                        .path("/api/users/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://identity-service"))
                
                // Product Service
                .route("product-service", r -> r
                        .path("/api/products/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://product-service"))
                
                // Inventory Service
                .route("inventory-service", r -> r
                        .path("/api/inventory/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://inventory-service"))
                
                // Order Service
                .route("order-service", r -> r
                        .path("/api/orders/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://order-service"))
                
                // Warehouse Service
                .route("warehouse-service", r -> r
                        .path("/api/warehouses/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://warehouse-service"))
                
                // Supplier Service
                .route("supplier-service", r -> r
                        .path("/api/suppliers/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://supplier-service"))
                
                // User Service (Organizations and Branches)
                .route("user-service", r -> r
                        .path("/api/organizations/**", "/api/branches/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://user-service"))
                
                // Notification Service
                .route("notification-service", r -> r
                        .path("/api/notifications/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://notification-service"))
                
                // Catalog Service
                .route("catalog-service", r -> r
                        .path("/api/catalog/**", "/api/schemas/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://catalog-service"))
                
                // Reporting Service
                .route("reporting-service", r -> r
                        .path("/api/analytics/**", "/api/audit/**")
                        .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                        .uri("lb://reporting-service"))
                
                .build();
    }
}
