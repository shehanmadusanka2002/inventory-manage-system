package com.inventory.inventoryservice.service;

import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.model.Stock;
import com.inventory.inventoryservice.repository.InventoryTransactionRepository;
import com.inventory.inventoryservice.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final StockRepository stockRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    /**
     * Process stock movement for a given product and warehouse.
     * Note: Added orgId parameter to support Stock creation as per entity
     * constraints.
     *
     * @param productId   The ID of the product
     * @param warehouseId The ID of the warehouse
     * @param type        The type of transaction (IN, OUT, ADJUSTMENT, TRANSFER)
     * @param quantity    The quantity to process
     * @param referenceId Reference ID (e.g., Order ID)
     * @param orgId       Organization ID (required for creating new stock records)
     */
    @Transactional
    public void processStockMovement(Long productId, Long warehouseId, InventoryTransaction.TransactionType type,
            BigDecimal quantity, String referenceId, Long orgId) {

        log.info("Processing stock movement: type={}, productId={}, warehouseId={}, quantity={}, referenceId={}",
                type, productId, warehouseId, quantity, referenceId);

        // 1. Validate inputs
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        // 2. Handle Stock Update based on Transaction Type
        Stock stock = stockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElse(null);

        // Integer representation of quantity for the current Stock entity definition
        int quantityInt = quantity.intValue();

        switch (type) {
            case IN:
                if (stock == null) {
                    // Create new stock record if it doesn't exist
                    if (orgId == null) {
                        throw new IllegalArgumentException("Organization ID is required to create new stock");
                    }
                    stock = new Stock();
                    stock.setProductId(productId);
                    stock.setWarehouseId(warehouseId);
                    stock.setOrgId(orgId);
                    stock.setQuantity(0);
                    stock.setAvailableQuantity(0);
                    stock.setReservedQuantity(0);
                    // Assuming branchId matches warehouseId or similar logic as per existing
                    // InventoryService
                    stock.setBranchId(warehouseId);
                }

                stock.setQuantity(stock.getQuantity() + quantityInt);
                stock.setAvailableQuantity(stock.getAvailableQuantity() + quantityInt);
                stockRepository.save(stock);
                break;

            case OUT:
                if (stock == null) {
                    throw new RuntimeException("Insufficient stock: Stock record not found for Product " + productId
                            + " in Warehouse " + warehouseId);
                }

                if (stock.getAvailableQuantity() < quantityInt) {
                    throw new RuntimeException("Insufficient stock: Available " + stock.getAvailableQuantity()
                            + ", Requested " + quantityInt);
                }

                stock.setQuantity(stock.getQuantity() - quantityInt);
                stock.setAvailableQuantity(stock.getAvailableQuantity() - quantityInt);
                stockRepository.save(stock);
                break;

            case ADJUSTMENT:
                // Implicit logic: Positive adjustment adds, negative subtracts?
                // Or user might pass negative quantity?
                // The prompt says "For IN... For OUT...". It doesn't specify ADJUSTMENT.
                // Standard behavior: ADJUSTMENT usually sets the stock to a specific value or
                // adds/subs.
                // Without specific requirements, I will log a warning or treat as strictly
                // recording transaction.
                // However, to be useful, I'll update stock if it exists.
                if (stock != null) {
                    // Assuming this is an additive adjustment for now, user can clarify.
                    // Or maybe we shouldn't touch stock if logic isn't defined.
                    // "Core Logic: ... For IN... For OUT".
                    // I will stick to only updating stock for IN/OUT as explicitly requested.
                    // But for proper system function, I'll leave a comment.
                    log.warn(
                            "Stock update logic for transaction type {} is not explicitly defined in requirements. Only recording transaction.",
                            type);
                }
                break;

            case TRANSFER:
                // Similar to ADJUSTMENT, typically involves OUT from one and IN to another.
                // This method seems to handle one side of the movement.
                log.warn(
                        "Stock update logic for transaction type {} is not explicitly defined in requirements. Only recording transaction.",
                        type);
                break;

            default:
                log.warn("Unhandled transaction type: {}", type);
        }

        // 3. Audit Trail - Create Inventory Transaction
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProductId(productId);
        transaction.setWarehouseId(warehouseId);
        transaction.setType(type);
        transaction.setQuantity(quantityInt);
        transaction.setReferenceId(referenceId);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setOrgId(orgId != null ? orgId : (stock != null ? stock.getOrgId() : null));

        // Setting other required/useful fields (assuming default or null is okay)
        // Note: InventoryTransaction entity has @PrePersist for createdAt

        inventoryTransactionRepository.save(transaction);

        log.info("Stock movement processed successfully. Transaction ID: {}", transaction.getId());
    }
}
