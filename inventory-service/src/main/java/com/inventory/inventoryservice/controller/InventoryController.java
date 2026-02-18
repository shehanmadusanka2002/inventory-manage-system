package com.inventory.inventoryservice.controller;

import com.inventory.inventoryservice.model.Stock;
import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryService inventoryService;
    
    @GetMapping("/stocks")
    public ResponseEntity<List<Stock>> getAllStocks() {
        return ResponseEntity.ok(inventoryService.getAllStocks());
    }
    
    @GetMapping("/stocks/{id}")
    public ResponseEntity<Stock> getStockById(@PathVariable Long id) {
        return inventoryService.getStockById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/stocks/product/{productId}")
    public ResponseEntity<List<Stock>> getStocksByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStocksByProduct(productId));
    }
    
    @GetMapping("/stocks/product/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<Stock> getStockByProductAndWarehouse(
            @PathVariable Long productId, 
            @PathVariable Long warehouseId) {
        return inventoryService.getStockByProductAndWarehouse(productId, warehouseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/stocks")
    public ResponseEntity<Stock> createStock(@RequestBody Stock stock) {
        Stock createdStock = inventoryService.createStock(stock);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStock);
    }
    
    @PutMapping("/stocks/{id}")
    public ResponseEntity<Stock> updateStock(@PathVariable Long id, @RequestBody Stock stock) {
        stock.setId(id);
        return ResponseEntity.ok(inventoryService.updateStock(stock));
    }
    
    @GetMapping("/transactions")
    public ResponseEntity<List<InventoryTransaction>> getAllTransactions() {
        return ResponseEntity.ok(inventoryService.getAllTransactions());
    }
    
    @PostMapping("/transactions")
    public ResponseEntity<InventoryTransaction> createTransaction(@RequestBody InventoryTransaction transaction) {
        InventoryTransaction createdTransaction = inventoryService.createTransaction(transaction);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTransaction);
    }
    
    @GetMapping("/transactions/product/{productId}")
    public ResponseEntity<List<InventoryTransaction>> getTransactionsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getTransactionsByProduct(productId));
    }
}
