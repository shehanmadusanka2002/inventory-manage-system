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
    private final RestTemplate restTemplate = new RestTemplate();
    
    private static final String NOTIFICATION_SERVICE_URL = "http://localhost:8087/api/notifications/events/publish";
    
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }
    
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }
    
    public Optional<Stock> getStockByProductAndWarehouse(Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId);
    }
    
    public List<Stock> getStocksByProduct(Long productId) {
        return stockRepository.findByProductId(productId);
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
                transaction.getWarehouseId()
        ).orElseGet(() -> {
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
            Map<String, Object> event = new HashMap<>();
            event.put("productId", stock.getProductId());
            event.put("productName", "Product-" + stock.getProductId());
            event.put("warehouseId", stock.getWarehouseId());
            event.put("warehouseName", "Warehouse-" + stock.getWarehouseId());
            event.put("orgId", stock.getOrgId());
            event.put("branchId", stock.getBranchId());
            event.put("currentQuantity", stock.getQuantity());
            
            // Check for out of stock
            if (stock.getQuantity() <= 0) {
                event.put("eventType", "OUT_OF_STOCK");
                event.put("severity", "CRITICAL");
                event.put("message", String.format("Out of stock: Product %d at Warehouse %d", 
                    stock.getProductId(), stock.getWarehouseId()));
                publishStockEvent(event);
            } 
            // Check for low stock
            else if (stock.getReorderLevel() != null && stock.getQuantity() <= stock.getReorderLevel()) {
                event.put("eventType", "LOW_STOCK");
                event.put("severity", "WARNING");
                event.put("message", String.format("Low stock alert: Product %d. Current: %d, Reorder: %d", 
                    stock.getProductId(), stock.getQuantity(), stock.getReorderLevel()));
                publishStockEvent(event);
            }
        } catch (Exception e) {
            // Don't fail transaction if notification fails
            log.error("Failed to send stock notification: {}", e.getMessage());
        }
    }
    
    /**
     * Publish stock event to notification service
     */
    private void publishStockEvent(Map<String, Object> event) {
        try {
            restTemplate.postForEntity(NOTIFICATION_SERVICE_URL, event, Map.class);
        } catch (RestClientException e) {
            log.error("Failed to publish event to notification service: {}", e.getMessage());
        }
    }
    
    public List<InventoryTransaction> getTransactionsByProduct(Long productId) {
        return transactionRepository.findByProductId(productId);
    }
    
    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
