package com.inventory.warehouse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "warehouses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String location;
    
    @Column(name = "org_id", nullable = false)
    private Long orgId;
    
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(name = "warehouse_type")
    @Enumerated(EnumType.STRING)
    private WarehouseType warehouseType;
    
    @Column(name = "storage_capacity")
    private Double storageCapacity;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "warehouse_attributes", columnDefinition = "JSON")
    private Map<String, Object> warehouseAttributes;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum WarehouseType {
        COLD_STORAGE, DRY_STORAGE, RAW_MATERIAL, FINISHED_GOODS, TRANSIT, RETAIL_OUTLET
    }
}
