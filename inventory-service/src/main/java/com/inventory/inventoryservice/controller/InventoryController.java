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
    public ResponseEntity<List<com.inventory.inventoryservice.dto.StockResponseDto>> getAllStocks(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<com.inventory.inventoryservice.dto.StockResponseDto> stocks = (orgId != null)
                ? inventoryService.getStocksByOrgWithDetails(orgId)
                : inventoryService.getAllStocksWithDetails();
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/stocks/{id}")
    public ResponseEntity<com.inventory.inventoryservice.dto.StockResponseDto> getStockById(@PathVariable Long id) {
        return inventoryService.getStockByIdWithDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stocks/product/{productId}")
    public ResponseEntity<List<com.inventory.inventoryservice.dto.StockResponseDto>> getStocksByProduct(
            @PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStocksByProductWithDetails(productId));
    }

    @GetMapping("/stocks/product/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<com.inventory.inventoryservice.dto.StockResponseDto> getStockByProductAndWarehouse(
            @PathVariable Long productId,
            @PathVariable Long warehouseId) {
        return inventoryService.getStockByProductAndWarehouseWithDetails(productId, warehouseId)
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
    public ResponseEntity<List<InventoryTransaction>> getAllTransactions(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<InventoryTransaction> txns = (orgId != null)
                ? inventoryService.getTransactionsByOrg(orgId)
                : inventoryService.getAllTransactions();
        return ResponseEntity.ok(txns);
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
