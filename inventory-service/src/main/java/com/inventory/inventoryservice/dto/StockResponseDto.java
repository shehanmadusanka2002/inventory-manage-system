package com.inventory.inventoryservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockResponseDto {
    private Long id;
    private Long productId;
    private Long warehouseId;
    private Long branchId;
    private Integer quantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Long orgId;
    private Integer reorderLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
