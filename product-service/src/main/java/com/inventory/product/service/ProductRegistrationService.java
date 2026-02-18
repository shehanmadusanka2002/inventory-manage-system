package com.inventory.product.service;

import com.inventory.product.dto.InitialBatchDTO;
import com.inventory.product.dto.ProductRegistrationRequest;
import com.inventory.product.dto.ProductRegistrationResponse;
import com.inventory.product.model.Product;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductRegistrationService {
    
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;
    
    @Transactional
    public ProductRegistrationResponse registerProductWithStock(ProductRegistrationRequest request) {
        // Step 1: Create and save Product entity
        Product product = new Product();
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getInitialBatch() != null ? request.getInitialBatch().getPurchasePrice() : null);
        product.setCategory(request.getCategory());
        product.setBrand(request.getBrand());
        product.setUnit(request.getUnit());
        product.setReorderLevel(request.getReorderLevel());
        product.setOrgId(request.getOrgId());
        product.setIndustryType(request.getIndustryType());
        product.setIsActive(true);
        
        // Handle industry-specific attributes (pharmacy: genericName, isPrescriptionRequired)
        if (request.getIndustrySpecificAttributes() != null) {
            product.setIndustrySpecificAttributes(request.getIndustrySpecificAttributes());
        } else if ("PHARMACY".equalsIgnoreCase(request.getIndustryType())) {
            // Auto-populate pharmacy attributes if provided at root level
            Map<String, Object> pharmAttrs = new HashMap<>();
            if (request.getGenericName() != null) {
                pharmAttrs.put("genericName", request.getGenericName());
            }
            if (request.getIsPrescriptionRequired() != null) {
                pharmAttrs.put("isPrescriptionRequired", request.getIsPrescriptionRequired());
            }
            if (!pharmAttrs.isEmpty()) {
                product.setIndustrySpecificAttributes(pharmAttrs);
            }
        }
        
        Product savedProduct = productRepository.save(product);
        
        // Step 2: Create initial stock/batch if provided
        Long stockId = null;
        if (request.getInitialBatch() != null && request.getInitialBatch().getQuantity() != null && request.getInitialBatch().getQuantity() > 0) {
            try {
                stockId = createInitialStock(savedProduct, request.getInitialBatch(), request.getOrgId());
            } catch (Exception e) {
                // This will cause the entire transaction to roll back
                throw new RuntimeException("Failed to create initial stock: " + e.getMessage(), e);
            }
        }
        
        return new ProductRegistrationResponse(
            savedProduct.getId(),
            savedProduct.getSku(),
            savedProduct.getName(),
            stockId,
            "Product registered successfully" + (stockId != null ? " with initial stock" : "")
        );
    }
    
    private Long createInitialStock(Product product, InitialBatchDTO batch, Long orgId) {
        // Call inventory-service to create stock
        Map<String, Object> stockRequest = new HashMap<>();
        stockRequest.put("productId", product.getId());
        stockRequest.put("warehouseId", batch.getWarehouseId());
        stockRequest.put("quantity", batch.getQuantity());
        stockRequest.put("availableQuantity", batch.getQuantity());
        stockRequest.put("reservedQuantity", 0);
        stockRequest.put("orgId", orgId);
        stockRequest.put("reorderLevel", product.getReorderLevel());
        
        try {
            Map response = restTemplate.postForObject(
                "http://inventory-service/api/inventory/stocks",
                stockRequest,
                Map.class
            );
            
            if (response != null && response.get("id") != null) {
                return Long.valueOf(response.get("id").toString());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create stock in inventory-service: " + e.getMessage(), e);
        }
        
        return null;
    }
}
