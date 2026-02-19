package com.inventory.inventoryservice.service;

import com.inventory.inventoryservice.model.Stock;
import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.repository.StockRepository;
import com.inventory.inventoryservice.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class InventoryService {

    private final StockRepository stockRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final StockLedgerService stockLedgerService;
    private final RestTemplate restTemplate;
    private final com.inventory.inventoryservice.event.StockEventPublisher stockEventPublisher;

    private static final String NOTIFICATION_SERVICE_URL = "http://notification-service/api/notifications/events/publish";
    private static final String PRODUCT_SERVICE_URL = "http://product-service/api/products/";

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getAllStocksWithDetails() {
        return stockRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getStocksByOrgWithDetails(Long orgId) {
        return stockRepository.findByOrgId(orgId).stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    public List<Stock> getStocksByOrg(Long orgId) {
        return stockRepository.findByOrgId(orgId);
    }

    // Restored Entity-returning methods
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    public Optional<Stock> getStockByProductAndWarehouse(Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId);
    }

    public List<Stock> getStocksByProduct(Long productId) {
        return stockRepository.findByProductId(productId);
    }

    // New DTO-returning methods
    public Optional<com.inventory.inventoryservice.dto.StockResponseDto> getStockByIdWithDetails(Long id) {
        return stockRepository.findById(id).map(this::mapToDto);
    }

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getStocksByProductWithDetails(Long productId) {
        return stockRepository.findByProductId(productId).stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public Optional<com.inventory.inventoryservice.dto.StockResponseDto> getStockByProductAndWarehouseWithDetails(
            Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId).map(this::mapToDto);
    }

    private com.inventory.inventoryservice.dto.StockResponseDto mapToDto(Stock stock) {
        com.inventory.inventoryservice.dto.StockResponseDto dto = new com.inventory.inventoryservice.dto.StockResponseDto();
        dto.setId(stock.getId());
        dto.setProductId(stock.getProductId());
        dto.setWarehouseId(stock.getWarehouseId());
        dto.setBranchId(stock.getBranchId());
        dto.setQuantity(stock.getQuantity());
        dto.setAvailableQuantity(stock.getAvailableQuantity());
        dto.setReservedQuantity(stock.getReservedQuantity());
        dto.setOrgId(stock.getOrgId());
        dto.setCreatedAt(stock.getCreatedAt());
        dto.setUpdatedAt(stock.getUpdatedAt());

        // Fetch reorder level from product service if not set in stock
        // Even if set in stock, user requested explicitly fetching from product, but
        // optimization suggests fallback.
        // User request: "explicitly fetch the reorder level from the associated
        // product: dto.setReorderLevel(stock.getProduct().getReorderLevel());"
        // I will fetch from Product Service.
        try {
            com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                    PRODUCT_SERVICE_URL + stock.getProductId(), com.inventory.inventoryservice.dto.ProductDto.class);
            if (product != null && product.getReorderLevel() != null) {
                dto.setReorderLevel(product.getReorderLevel());
            } else {
                dto.setReorderLevel(stock.getReorderLevel());
            }
        } catch (Exception e) {
            log.error("Failed to fetch product details for stock {}: {}", stock.getId(), e.getMessage());
            dto.setReorderLevel(stock.getReorderLevel());
        }

        return dto;
    }

    public Stock updateStock(Stock stock) {
        return stockRepository.save(stock);
    }

    public Stock createStock(Stock stock) {
        log.info("Creating new stock: productId={}, warehouseId={}, quantity={}",
                stock.getProductId(), stock.getWarehouseId(), stock.getQuantity());
        return stockRepository.save(stock);
    }

    public InventoryTransaction createTransaction(InventoryTransaction transaction) {
        log.info("Creating inventory transaction: type={}, productId={}, quantity={}",
                transaction.getType(), transaction.getProductId(), transaction.getQuantity());

        // Save transaction first
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);

        // Update stock based on transaction type
        Stock stock = stockRepository.findByProductIdAndWarehouseId(
                transaction.getProductId(),
                transaction.getWarehouseId()).orElseGet(() -> {
                    Stock newStock = new Stock();
                    newStock.setProductId(transaction.getProductId());
                    newStock.setWarehouseId(transaction.getWarehouseId());
                    newStock.setBranchId(transaction.getWarehouseId()); // Set from warehouse
                    newStock.setQuantity(0);
                    newStock.setAvailableQuantity(0);
                    newStock.setReservedQuantity(0);
                    newStock.setOrgId(transaction.getOrgId());
                    return newStock;
                });

        switch (transaction.getType()) {
            case IN:
                stock.setQuantity(stock.getQuantity() + transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() + transaction.getQuantity());
                break;
            case OUT:
                stock.setQuantity(stock.getQuantity() - transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() - transaction.getQuantity());
                break;
            case ADJUSTMENT:
                stock.setQuantity(transaction.getQuantity());
                stock.setAvailableQuantity(transaction.getQuantity());
                break;
            case TRANSFER:
                stock.setQuantity(stock.getQuantity() - transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() - transaction.getQuantity());
                break;
            case RETURN:
                stock.setQuantity(stock.getQuantity() + transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() + transaction.getQuantity());
                break;
        }

        stockRepository.save(stock);

        // Record in stock ledger for valuation tracking
        try {
            stockLedgerService.recordTransaction(savedTransaction);
            log.info("Transaction recorded in stock ledger successfully");
        } catch (Exception e) {
            log.error("Failed to record transaction in stock ledger: {}", e.getMessage(), e);
            // Don't fail the main transaction, just log the error
        }

        // Check stock levels and trigger alerts using Observer Pattern
        checkStockLevelsAndNotify(stock, transaction);

        return savedTransaction;
    }

    /**
     * Check stock levels and publish events to Observer Pattern
     */
    private void checkStockLevelsAndNotify(Stock stock, InventoryTransaction transaction) {
        try {
            // 1. Determine Reorder Level (Product Global > Stock Local Override)
            Integer reorderLevel = stock.getReorderLevel();

            // Try fetch global from product service
            try {
                com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                        PRODUCT_SERVICE_URL + stock.getProductId(),
                        com.inventory.inventoryservice.dto.ProductDto.class);
                if (product != null && product.getReorderLevel() != null) {
                    reorderLevel = product.getReorderLevel();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch product reorder level for alert check: {}", e.getMessage());
            }

            // 2. Check Low Stock
            if (reorderLevel != null && stock.getQuantity() <= reorderLevel) {
                com.inventory.inventoryservice.event.StockEvent event = com.inventory.inventoryservice.event.StockEvent
                        .createLowStockEvent(
                                stock.getProductId(),
                                stock.getWarehouseId(),
                                stock.getQuantity(),
                                reorderLevel,
                                stock.getOrgId());
                stockEventPublisher.notifyObservers(event);
                log.info("Triggered Low Stock Alert for Product {} at Warehouse {}", stock.getProductId(),
                        stock.getWarehouseId());
            }

            // 3. Check Out of Stock (Explicit)
            if (stock.getQuantity() <= 0) {
                com.inventory.inventoryservice.event.StockEvent event = com.inventory.inventoryservice.event.StockEvent
                        .builder()
                        .type(com.inventory.inventoryservice.event.StockEvent.EventType.LOW_STOCK) // Or OUT_OF_STOCK if
                                                                                                   // enum exists
                        .productId(stock.getProductId())
                        .warehouseId(stock.getWarehouseId())
                        .remainingQuantity(stock.getQuantity())
                        .thresholdLevel(0)
                        .orgId(stock.getOrgId())
                        .message("Out of Stock: Product " + stock.getProductId())
                        .timestamp(java.time.LocalDateTime.now())
                        .build();
                stockEventPublisher.notifyObservers(event);
            }

        } catch (Exception e) {
            log.error("Failed to process stock alerts: {}", e.getMessage());
        }
    }

    public List<InventoryTransaction> getTransactionsByProduct(Long productId) {
        return transactionRepository.findByProductId(productId);
    }

    public List<InventoryTransaction> getTransactionsByOrg(Long orgId) {
        return transactionRepository.findByOrgId(orgId);
    }

    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
