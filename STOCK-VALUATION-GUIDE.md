# Stock Valuation System Guide

## Overview

The Stock Valuation System implements three industry-standard inventory valuation methods:
- **FIFO** (First-In-First-Out)
- **LIFO** (Last-In-First-Out)
- **Weighted Average Cost**

This system maintains a comprehensive **Stock Ledger** that tracks every inventory transaction as the single source of truth for cost calculation and valuation reporting.

---

## Architecture

### Core Components

1. **InventoryTransaction** - Records all inventory movements with cost data
2. **StockLedger** - Maintains running balance with all three valuation methods
3. **Valuation Strategies** - Strategy pattern implementation for flexible calculations
4. **Controllers** - REST APIs for valuation queries and ledger reports

### Design Patterns Used

- ✅ **Strategy Pattern** - ValuationStrategy interface with FIFO, LIFO, and WeightedAverage implementations
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **Service Layer Pattern** - Business logic separation
- ✅ **DTO Pattern** - Data transfer objects for API responses

---

## Database Schema

### inventory_transactions Table

```sql
CREATE TABLE inventory_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT,
    type ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN'),
    quantity INT NOT NULL,
    
    -- NEW FIELDS FOR VALUATION
    unit_price DECIMAL(19,4),           -- Cost per unit
    total_value DECIMAL(19,2),          -- quantity × unit_price
    transaction_date DATETIME NOT NULL,  -- For FIFO/LIFO ordering
    
    reference_id VARCHAR(100),
    to_address VARCHAR(255),
    movement_status VARCHAR(50),
    expected_status TEXT,
    org_id BIGINT,
    reason_code VARCHAR(50),
    notes TEXT,
    created_by BIGINT,
    created_at DATETIME
);
```

### stock_ledger Table

```sql
CREATE TABLE stock_ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    transaction_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    transaction_date DATETIME NOT NULL,
    
    -- Quantity tracking
    quantity_in INT DEFAULT 0,
    quantity_out INT DEFAULT 0,
    quantity_balance INT NOT NULL,
    
    -- Cost tracking
    unit_cost DECIMAL(19,4) NOT NULL,
    total_cost DECIMAL(19,2) NOT NULL,
    running_balance DECIMAL(19,2) NOT NULL,
    
    -- Valuation methods (calculated)
    weighted_avg_cost DECIMAL(19,4),
    fifo_value DECIMAL(19,2),
    lifo_value DECIMAL(19,2),
    
    reference_id VARCHAR(100),
    notes TEXT,
    created_at DATETIME,
    created_by BIGINT,
    
    INDEX idx_product_warehouse (product_id, warehouse_id),
    INDEX idx_transaction_date (transaction_date)
);
```

---

## Valuation Methods Explained

### 1. FIFO (First-In-First-Out)

**Concept**: The oldest inventory (first purchased) is sold/used first.

**Example**:
```
Purchases:
- Jan 1:  100 units @ $10.00 = $1,000
- Jan 15: 150 units @ $12.00 = $1,800
- Feb 1:  200 units @ $11.50 = $2,300

Sale: 120 units

FIFO COGS calculation:
- 100 units @ $10.00 = $1,000
-  20 units @ $12.00 = $240
Total COGS: $1,240

Remaining inventory:
- 130 units @ $12.00 = $1,560
- 200 units @ $11.50 = $2,300
Ending Value: $3,860
```

**Best for**:
- ✅ Perishable goods (pharmaceuticals, food)
- ✅ Rising price environments (shows lower COGS, higher profits)
- ✅ GAAP compliance

### 2. LIFO (Last-In-First-Out)

**Concept**: The newest inventory (most recently purchased) is sold/used first.

**Example** (using same data):
```
Sale: 120 units

LIFO COGS calculation:
- 120 units @ $11.50 = $1,380

Remaining inventory:
- 100 units @ $10.00 = $1,000
- 150 units @ $12.00 = $1,800
-  80 units @ $11.50 = $920
Ending Value: $3,720
```

**Best for**:
- ✅ Inflation hedging (matches current costs with revenue)
- ✅ Tax advantages (higher COGS = lower taxes)
- ⚠️ Not allowed under IFRS

### 3. Weighted Average Cost

**Concept**: All inventory is valued at the average cost of all purchases.

**Example** (using same data):
```
Total cost: $1,000 + $1,800 + $2,300 = $5,100
Total units: 100 + 150 + 200 = 450
Average cost: $5,100 ÷ 450 = $11.33 per unit

After sale of 120 units:
Remaining: 330 units @ $11.33 = $3,739

COGS: 120 units @ $11.33 = $1,360
```

**Best for**:
- ✅ Homogeneous products (commodities, bulk items)
- ✅ Simplicity and ease of calculation
- ✅ Smooths out price fluctuations

---

## API Endpoints

### Valuation Endpoints

#### Get Stock Valuation
```
GET /api/inventory/valuation/stock/{productId}/warehouse/{warehouseId}
```

**Response**:
```json
{
  "productId": 1,
  "warehouseId": 1,
  "currentQuantity": 330,
  "fifoValue": 3860.00,
  "lifoValue": 3720.00,
  "weightedAvgValue": 3739.00,
  "weightedAvgCost": 11.33,
  "valuationDifference": 140.00
}
```

#### Compare Valuation Methods
```
GET /api/inventory/valuation/compare/{productId}/warehouse/{warehouseId}
```

**Response**:
```json
{
  "productId": 1,
  "warehouseId": 1,
  "currentQuantity": 330,
  "fifoValue": 3860.00,
  "lifoValue": 3720.00,
  "weightedAvgValue": 3739.00,
  "maxDifference": 140.00,
  "recommendedMethod": "FIFO",
  "reasoning": "Rising prices - FIFO shows lower COGS and higher profits",
  "methodDetails": [
    {
      "method": "FIFO",
      "value": 3860.00,
      "unitCost": 11.70,
      "description": "First-In-First-Out: Oldest stock priced first"
    },
    {
      "method": "LIFO",
      "value": 3720.00,
      "unitCost": 11.27,
      "description": "Last-In-First-Out: Newest stock priced first"
    },
    {
      "method": "WEIGHTED_AVERAGE",
      "value": 3739.00,
      "unitCost": 11.33,
      "description": "Weighted Average: Average cost of all purchases"
    }
  ]
}
```

#### Calculate COGS
```
POST /api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=50&strategy=FIFO
```

**Response**:
```json
{
  "productId": 1,
  "warehouseId": 1,
  "quantitySold": 50,
  "strategy": "FIFO",
  "cogsAmount": 565.00,
  "averageCostPerUnit": 11.30,
  "calculation": "FIFO: 50 units × $11.30 avg = $565.00"
}
```

### Stock Ledger Endpoints

#### Get Stock Ledger
```
GET /api/inventory/ledger/product/{productId}/warehouse/{warehouseId}
```

**Response**:
```json
[
  {
    "id": 1,
    "productId": 1,
    "warehouseId": 1,
    "transactionType": "IN",
    "transactionDate": "2026-01-01T10:00:00",
    "quantityIn": 100,
    "quantityOut": 0,
    "quantityBalance": 100,
    "unitCost": 10.00,
    "totalCost": 1000.00,
    "runningBalance": 1000.00,
    "weightedAvgCost": 10.00,
    "referenceId": "PO-001",
    "notes": "Initial purchase"
  },
  {
    "id": 2,
    "productId": 1,
    "warehouseId": 1,
    "transactionType": "IN",
    "transactionDate": "2026-01-15T10:00:00",
    "quantityIn": 150,
    "quantityOut": 0,
    "quantityBalance": 250,
    "unitCost": 12.00,
    "totalCost": 1800.00,
    "runningBalance": 2800.00,
    "weightedAvgCost": 11.20,
    "referenceId": "PO-002",
    "notes": "Second purchase"
  }
]
```

#### Get Latest Ledger Entry
```
GET /api/inventory/ledger/product/{productId}/warehouse/{warehouseId}/latest
```

#### Get Current Valuation
```
GET /api/inventory/ledger/product/{productId}/warehouse/{warehouseId}/valuation
```

#### Rebuild Ledger
```
POST /api/inventory/ledger/rebuild/product/{productId}/warehouse/{warehouseId}
```

Use this endpoint to recalculate the stock ledger from all transactions if corrections are needed.

---

## Usage Examples

### Creating a Transaction with Cost

```java
InventoryTransaction transaction = new InventoryTransaction();
transaction.setProductId(1L);
transaction.setWarehouseId(1L);
transaction.setOrgId(1L);
transaction.setType(InventoryTransaction.TransactionType.IN);
transaction.setQuantity(100);
transaction.setUnitPrice(new BigDecimal("10.50"));
transaction.setTransactionDate(LocalDateTime.now());
transaction.setReferenceId("PO-12345");
transaction.setNotes("Purchase from Supplier XYZ");

// Save transaction - ledger entry created automatically
inventoryService.createTransaction(transaction);
```

### Getting Stock Valuation

```java
// Get comprehensive valuation
StockLedgerService.StockValuationSummary summary = 
    stockLedgerService.getCurrentStockValuation(productId, warehouseId);

System.out.println("FIFO Value: $" + summary.fifoValue);
System.out.println("LIFO Value: $" + summary.lifoValue);
System.out.println("Weighted Avg: $" + summary.weightedAvgValue);
System.out.println("Avg Cost/Unit: $" + summary.weightedAvgCost);
```

### Calculating COGS for a Sale

```java
// Calculate COGS using FIFO
BigDecimal cogs = valuationContext.calculateCOGS(
    "FIFO", 
    transactions, 
    120  // quantity sold
);

// Calculate using LIFO
BigDecimal cogLifo = valuationContext.calculateCOGS(
    "LIFO", 
    transactions, 
    120
);
```

---

## Frontend Integration

### React Component Example

```typescript
import { useState, useEffect } from 'react';

function StockValuation({ productId, warehouseId }) {
  const [valuation, setValuation] = useState(null);

  useEffect(() => {
    fetch(`/api/inventory/valuation/stock/${productId}/warehouse/${warehouseId}`)
      .then(res => res.json())
      .then(data => setValuation(data));
  }, [productId, warehouseId]);

  if (!valuation) return <div>Loading...</div>;

  return (
    <div className="valuation-card">
      <h3>Stock Valuation</h3>
      <div className="metrics">
        <div className="metric">
          <label>Current Quantity</label>
          <span>{valuation.currentQuantity}</span>
        </div>
        <div className="metric">
          <label>FIFO Value</label>
          <span>${valuation.fifoValue.toFixed(2)}</span>
        </div>
        <div className="metric">
          <label>LIFO Value</label>
          <span>${valuation.lifoValue.toFixed(2)}</span>
        </div>
        <div className="metric">
          <label>Weighted Average</label>
          <span>${valuation.weightedAvgValue.toFixed(2)}</span>
        </div>
        <div className="metric">
          <label>Valuation Difference</label>
          <span>${valuation.valuationDifference.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
```

### Ledger Table Component

```typescript
function StockLedgerTable({ productId, warehouseId }) {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    fetch(`/api/inventory/ledger/product/${productId}/warehouse/${warehouseId}`)
      .then(res => res.json())
      .then(data => setLedger(data));
  }, [productId, warehouseId]);

  return (
    <table className="ledger-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>In</th>
          <th>Out</th>
          <th>Balance</th>
          <th>Unit Cost</th>
          <th>Running Balance</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        {ledger.map(entry => (
          <tr key={entry.id}>
            <td>{new Date(entry.transactionDate).toLocaleString()}</td>
            <td>{entry.transactionType}</td>
            <td>{entry.quantityIn || '-'}</td>
            <td>{entry.quantityOut || '-'}</td>
            <td>{entry.quantityBalance}</td>
            <td>${entry.unitCost.toFixed(2)}</td>
            <td>${entry.runningBalance.toFixed(2)}</td>
            <td>{entry.referenceId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Business Reports

### Inventory Valuation Report

Shows current stock value using all three methods:

```sql
SELECT 
    p.sku,
    p.name,
    w.name as warehouse,
    sl.quantity_balance,
    sl.fifo_value,
    sl.lifo_value,
    sl.weighted_avg_cost * sl.quantity_balance as weighted_avg_value,
    (sl.fifo_value - sl.lifo_value) as valuation_difference
FROM stock_ledger sl
INNER JOIN products p ON sl.product_id = p.id
INNER JOIN warehouses w ON sl.warehouse_id = w.id
WHERE sl.transaction_date = (
    SELECT MAX(transaction_date) 
    FROM stock_ledger 
    WHERE product_id = sl.product_id 
    AND warehouse_id = sl.warehouse_id
)
ORDER BY valuation_difference DESC;
```

### Cost of Goods Sold Report

```sql
SELECT 
    DATE(transaction_date) as date,
    SUM(quantity) as units_sold,
    SUM(total_value) as fifo_cogs,
    AVG(unit_price) as avg_unit_cost
FROM inventory_transactions
WHERE type = 'OUT'
    AND transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(transaction_date)
ORDER BY date DESC;
```

---

## Best Practices

### 1. Always Include Unit Price

```java
// ✅ CORRECT
transaction.setUnitPrice(new BigDecimal("10.50"));
transaction.setQuantity(100);

// ❌ WRONG - will cause valuation errors
transaction.setQuantity(100);  // No unit price!
```

### 2. Use Transaction Date

```java
// ✅ CORRECT - specify transaction date
transaction.setTransactionDate(purchaseDate);

// ⚠️ OK - defaults to current time
// (but use explicit dates for historical imports)
```

### 3. Rebuild Ledger After Corrections

```java
// After fixing transaction data
stockLedgerService.rebuildLedger(productId, warehouseId);
```

### 4. Choose Appropriate Method

| Scenario | Recommended Method |
|----------|-------------------|
| Rising prices | FIFO (lower COGS, higher profit) |
| Falling prices | LIFO (matches current costs) |
| Stable prices | Weighted Average (simplest) |
| Perishable goods | FIFO (physical flow matching) |
| Tax optimization | LIFO (higher COGS, lower taxes) |

---

## Performance Considerations

### Indexes

The following indexes are crucial for performance:

```sql
-- Transaction queries
CREATE INDEX idx_product_warehouse_date 
ON inventory_transactions(product_id, warehouse_id, transaction_date);

-- Ledger queries
CREATE INDEX idx_product_warehouse 
ON stock_ledger(product_id, warehouse_id);

CREATE INDEX idx_transaction_date 
ON stock_ledger(transaction_date);
```

### Caching Strategy

Consider caching:
- ✅ Latest ledger entry per product-warehouse
- ✅ Weighted average costs
- ⚠️ Invalidate on new transactions

---

## Troubleshooting

### Issue: Valuation differences are too large

**Cause**: Significant price volatility or incorrect data

**Solution**: 
1. Check for data entry errors in `unit_price`
2. Consider using Weighted Average for stability
3. Review transaction dates for correct ordering

### Issue: Ledger out of sync with stock

**Cause**: Transaction created without triggering ledger update

**Solution**:
```bash
POST /api/inventory/ledger/rebuild/product/{productId}/warehouse/{warehouseId}
```

### Issue: FIFO/LIFO calculations seem wrong

**Cause**: Transactions not ordered by date

**Solution**: Verify `transaction_date` is set correctly on all transactions

---

## Migration Guide

### Step 1: Update Database

```bash
mysql -u root -p inventory_db < DATABASE-VALUATION-MIGRATION.sql
```

### Step 2: Backfill Existing Transactions

```java
// For existing transactions without cost data
List<InventoryTransaction> oldTransactions = 
    transactionRepository.findAllWithoutUnitPrice();

for (InventoryTransaction txn : oldTransactions) {
    // Estimate or import actual costs
    BigDecimal estimatedCost = getHistoricalCost(txn.getProductId(), txn.getTransactionDate());
    txn.setUnitPrice(estimatedCost);
    txn.setTotalValue(estimatedCost.multiply(BigDecimal.valueOf(txn.getQuantity())));
    transactionRepository.save(txn);
}
```

### Step 3: Build Initial Ledger

```java
// For each product-warehouse combination
List<ProductWarehouse> combinations = getUniqueProductWarehouseCombinations();

for (ProductWarehouse pw : combinations) {
    stockLedgerService.rebuildLedger(pw.getProductId(), pw.getWarehouseId());
}
```

---

## System Status

✅ **Implementation Complete**
- InventoryTransaction enhanced with cost fields
- StockLedger entity created
- FIFO, LIFO, Weighted Average strategies implemented
- REST APIs for valuation and ledger queries
- Automatic ledger updates on transactions
- Comprehensive reporting capabilities

🎯 **Production Ready**
- Transactional consistency
- Performance indexes
- Error handling
- Audit trail support

---

**Last Updated**: February 14, 2026  
**Version**: 1.0
