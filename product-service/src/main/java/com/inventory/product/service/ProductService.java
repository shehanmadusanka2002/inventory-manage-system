package com.inventory.product.service;

import com.inventory.product.model.Product;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    public List<Product> getProductsByOrgAndIndustry(Long orgId, String industryType) {
        return productRepository.findByOrgIdAndIndustryType(orgId, industryType);
    }
    
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }
    
    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }
    
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }
    
    public List<Product> getActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }
    
    public List<Product> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }
    
    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        product.setSku(productDetails.getSku());
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setCostPrice(productDetails.getCostPrice());
        product.setCategory(productDetails.getCategory());
        product.setBrand(productDetails.getBrand());
        product.setUnit(productDetails.getUnit());
        product.setReorderLevel(productDetails.getReorderLevel());
        product.setIsActive(productDetails.getIsActive());
        
        return productRepository.save(product);
    }
    
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setIsActive(false);
        productRepository.save(product);
    }
}
