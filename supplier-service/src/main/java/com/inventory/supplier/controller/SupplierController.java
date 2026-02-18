package com.inventory.supplier.controller;

import com.inventory.supplier.model.Supplier;
import com.inventory.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierRepository supplierRepository;
    
    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Supplier>> getSuppliersByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(supplierRepository.findByOrgId(orgId));
    }
    
    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        return supplierRepository.findById(id)
                .map(existing -> {
                    existing.setName(supplier.getName());
                    existing.setContactInfo(supplier.getContactInfo());
                    return ResponseEntity.ok(supplierRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        supplierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
