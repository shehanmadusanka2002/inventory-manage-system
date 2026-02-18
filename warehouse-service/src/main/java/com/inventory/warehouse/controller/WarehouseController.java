package com.inventory.warehouse.controller;

import com.inventory.warehouse.model.Warehouse;
import com.inventory.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseRepository warehouseRepository;
    
    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getWarehouseById(@PathVariable Long id) {
        return warehouseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Warehouse>> getWarehousesByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(warehouseRepository.findByOrgId(orgId));
    }
    
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Warehouse>> getWarehousesByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(warehouseRepository.findByBranchId(branchId));
    }
    
    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseRepository.save(warehouse));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Warehouse> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) {
        return warehouseRepository.findById(id)
                .map(existing -> {
                    existing.setName(warehouse.getName());
                    existing.setLocation(warehouse.getLocation());
                    existing.setBranchId(warehouse.getBranchId());
                    existing.setWarehouseType(warehouse.getWarehouseType());
                    existing.setStorageCapacity(warehouse.getStorageCapacity());
                    existing.setIsActive(warehouse.getIsActive());
                    return ResponseEntity.ok(warehouseRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable Long id) {
        return warehouseRepository.findById(id)
                .map(warehouse -> {
                    warehouse.setIsActive(false);
                    warehouseRepository.save(warehouse);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
