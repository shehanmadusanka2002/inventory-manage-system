# Testing Guide - Design Patterns

This guide provides step-by-step instructions for testing the three design patterns implemented in UIMS.

---

## Prerequisites

1. **Start all services:**
   ```powershell
   .\build-all.ps1
   .\start-all.ps1
   ```

2. **Verify services are running:**
   - Service Discovery: http://localhost:8761
   - API Gateway: http://localhost:8080
   - All microservices registered

---

## 🎲 Test 1: Strategy Pattern - Stock Valuation

### Setup Test Data

1. **Create a product:**
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "name": "Test Product",
    "price": 25.00,
    "category": "Electronics",
    "orgId": 1
  }'
```

2. **Create a warehouse:**
```bash
curl -X POST http://localhost:8080/api/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Warehouse",
    "location": "New York",
    "orgId": 1,
    "branchId": 1
  }'
```

3. **Add inventory transactions (3 batches at different prices):**

Batch 1 (oldest) - 50 units @ $20 each:
```bash
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "quantity": 50,
    "type": "IN",
    "unitPrice": 20.00,
    "orgId": 1
  }'
```

Batch 2 - 100 units @ $25 each:
```bash
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "quantity": 100,
    "type": "IN",
    "unitPrice": 25.00,
    "orgId": 1
  }'
```

Batch 3 (newest) - 50 units @ $30 each:
```bash
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "quantity": 50,
    "type": "IN",
    "unitPrice": 30.00,
    "orgId": 1
  }'
```

**Total Stock:** 200 units  
**Total Cost:** (50×$20) + (100×$25) + (50×$30) = $1,000 + $2,500 + $1,500 = **$5,000**

### Test Valuation Methods

**Compare all valuation methods:**
```bash
curl http://localhost:8080/api/inventory/valuation/stock/1/warehouse/1
```

**Expected Result:**
```json
{
  "productId": 1,
  "warehouseId": 1,
  "currentQuantity": 200,
  "valuations": {
    "FIFO": 5000.00,
    "LIFO": 5000.00,
    "WEIGHTED_AVERAGE": 5000.00
  }
}
```

### Test COGS Calculation

**Sell 75 units using FIFO:**
```bash
curl -X POST "http://localhost:8080/api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=75&strategy=FIFO"
```

**Expected FIFO COGS:**  
- 50 units from Batch 1 @ $20 = $1,000
- 25 units from Batch 2 @ $25 = $625
- **Total COGS: $1,625** (Average: $21.67/unit)

**Sell 75 units using LIFO:**
```bash
curl -X POST "http://localhost:8080/api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=75&strategy=LIFO"
```

**Expected LIFO COGS:**  
- 50 units from Batch 3 @ $30 = $1,500
- 25 units from Batch 2 @ $25 = $625
- **Total COGS: $2,125** (Average: $28.33/unit)

**Weighted Average:**
```bash
curl -X POST "http://localhost:8080/api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=75&strategy=WEIGHTED_AVERAGE"
```

**Expected Weighted Average COGS:**  
- Average cost: $5,000 / 200 units = $25/unit
- 75 units @ $25 = **$1,875**

✅ **Success Criteria:** Three different COGS values prove Strategy Pattern is working!

---

## 🏭 Test 2: Factory Pattern - Product Templates

### Test 1: Get Available Industries
```bash
curl http://localhost:8080/api/products/templates/industries
```

**Expected:**
```json
{
  "industries": ["PHARMACY", "RETAIL", "MANUFACTURING"]
}
```

### Test 2: Get Pharmacy Templates
```bash
curl http://localhost:8080/api/products/templates/industry/PHARMACY
```

**Expected:** 3 templates:
- Prescription Medication
- OTC Medication
- Medical Supplies

### Test 3: Create Pharmacy Product
```bash
curl -X POST "http://localhost:8080/api/products/templates/create?orgId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin 500mg",
    "category": "OTC_DRUGS",
    "description": "Pain reliever",
    "basePrice": 12.99,
    "industryType": "PHARMACY",
    "industrySpecificAttributes": {
      "brand": "Generic",
      "prescriptionRequired": false,
      "dosageForm": "Tablet",
      "strength": "500mg"
    }
  }'
```

**Expected:**
```json
{
  "id": 2,
  "sku": "PHARM-A1B2C3D4",  // Auto-generated with PHARM prefix
  "name": "Aspirin 500mg",
  "category": "OTC_DRUGS",
  "price": 12.99,
  "brand": "Generic",
  "orgId": 1
}
```

✅ **Success Criteria:** SKU starts with `PHARM-`

### Test 4: Create Retail Product
```bash
curl -X POST "http://localhost:8080/api/products/templates/create?orgId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blue Cotton T-Shirt",
    "category": "CLOTHING",
    "description": "Comfortable t-shirt",
    "basePrice": 29.99,
    "industryType": "RETAIL",
    "industrySpecificAttributes": {
      "brand": "MyBrand",
      "size": "M",
      "color": "Blue",
      "material": "Cotton"
    }
  }'
```

✅ **Success Criteria:** SKU starts with `RETAIL-`

### Test 5: Create Manufacturing Product
```bash
curl -X POST "http://localhost:8080/api/products/templates/create?orgId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Steel Component XYZ",
    "category": "COMPONENTS",
    "description": "Industrial steel part",
    "basePrice": 45.00,
    "industryType": "MANUFACTURING",
    "industrySpecificAttributes": {
      "manufacturer": "SteelCo",
      "partNumber": "COMP-001",
      "leadTime": "7 days"
    }
  }'
```

✅ **Success Criteria:** SKU starts with `MFG-`

### Test 6: Validate Product
```bash
curl -X POST "http://localhost:8080/api/products/templates/validate?industryType=PHARMACY" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHARM-12345678",
    "name": "Test Product",
    "price": 10.00
  }'
```

**Expected:**
```json
{
  "valid": true,
  "industryType": "PHARMACY",
  "productSku": "PHARM-12345678"
}
```

✅ **Success Criteria:** Validation passes for matching SKU prefix

---

## 👁️ Test 3: Observer Pattern - Stock Alerts

### Setup: Set Reorder Level

Update stock to set reorder level:
```bash
curl -X PUT http://localhost:8080/api/inventory/stocks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "productId": 1,
    "warehouseId": 1,
    "branchId": 1,
    "quantity": 100,
    "availableQuantity": 100,
    "reservedQuantity": 0,
    "orgId": 1,
    "reorderLevel": 20
  }'
```

### Test 1: Verify Observers
```bash
curl http://localhost:8080/api/notifications/events/observers
```

**Expected:**
```json
{
  "observers": [
    {"type": "DATABASE_NOTIFICATION", "active": true},
    {"type": "EMAIL_NOTIFICATION", "active": true},
    {"type": "SMS_NOTIFICATION", "active": true}
  ],
  "totalCount": 3,
  "activeCount": 3
}
```

### Test 2: Simulate LOW_STOCK Event
```bash
curl -X POST "http://localhost:8080/api/notifications/events/simulate?eventType=LOW_STOCK&productId=1&productName=Aspirin 500mg&warehouseId=1&warehouseName=Main Warehouse&orgId=1"
```

**Check console logs:**
- ✅ DatabaseObserver: "Notification saved to database"
- ✅ EmailObserver: "EMAIL SENT - Subject: [WARNING] Stock Alert"
- ❌ SMSObserver: Skipped (not CRITICAL)

**Verify notification in database:**
```bash
curl http://localhost:8080/api/notifications
```

Should show a new notification with type "LOW_STOCK".

### Test 3: Simulate OUT_OF_STOCK Event (CRITICAL)
```bash
curl -X POST "http://localhost:8080/api/notifications/events/simulate?eventType=OUT_OF_STOCK&productId=1&productName=Aspirin 500mg&warehouseId=1&warehouseName=Main Warehouse&orgId=1"
```

**Check console logs:**
- ✅ DatabaseObserver: "Notification saved to database"
- ✅ EmailObserver: "EMAIL SENT - Subject: [CRITICAL] Stock Alert"
- ✅ SMSObserver: "SMS SENT - Message: CRITICAL ALERT"

### Test 4: Automatic Alert (Real Transaction)

Create OUT transaction to reduce stock below reorder level:
```bash
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "quantity": 85,
    "type": "OUT",
    "unitPrice": 25.00,
    "orgId": 1
  }'
```

**After this transaction:**
- Stock: 100 - 85 = **15 units** (below reorder level of 20)
- ✅ **Automatic LOW_STOCK alert triggered!**

**Verify:**
```bash
curl http://localhost:8080/api/notifications
```

Should show a new LOW_STOCK notification created automatically.

### Test 5: Automatic OUT_OF_STOCK Alert

Reduce stock to zero:
```bash
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "quantity": 15,
    "type": "OUT",
    "unitPrice": 25.00,
    "orgId": 1
  }'
```

**After this transaction:**
- Stock: 15 - 15 = **0 units**
- ✅ **Automatic OUT_OF_STOCK (CRITICAL) alert triggered!**
- ✅ All 3 observers notified (Database, Email, SMS)

---

## Integration Test: All Patterns Together

### Scenario: Pharmacy Creates Product, Receives Stock, Gets Alert

**Step 1: Create pharmacy product using Factory Pattern**
```bash
curl -X POST "http://localhost:8080/api/products/templates/create?orgId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ibuprofen 400mg",
    "category": "OTC_DRUGS",
    "basePrice": 8.99,
    "industryType": "PHARMACY"
  }'
```
Result: Product ID 10, SKU: PHARM-XXXXXXXX

**Step 2: Receive 3 batches at different prices**
```bash
# Batch 1: 30 units @ $8.00
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{"productId": 10, "warehouseId": 1, "quantity": 30, "type": "IN", "unitPrice": 8.00, "orgId": 1}'

# Batch 2: 50 units @ $8.50
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{"productId": 10, "warehouseId": 1, "quantity": 50, "type": "IN", "unitPrice": 8.50, "orgId": 1}'

# Batch 3: 20 units @ $9.00
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{"productId": 10, "warehouseId": 1, "quantity": 20, "type": "IN", "unitPrice": 9.00, "orgId": 1}'
```

**Step 3: Calculate inventory value using Strategy Pattern**
```bash
curl http://localhost:8080/api/inventory/valuation/stock/10/warehouse/1
```

Expected valuations:
- FIFO: (30×8.00) + (50×8.50) + (20×9.00) = $845.00
- LIFO: Same (all inventory still there)
- Weighted Average: Same

**Step 4: Set reorder level**
```bash
curl -X PUT http://localhost:8080/api/inventory/stocks/[stockId] \
  -H "Content-Type: application/json" \
  -d '{"reorderLevel": 30, ...}'
```

**Step 5: Sell product and trigger alert (Observer Pattern)**
```bash
# Sell 75 units
curl -X POST http://localhost:8080/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -d '{"productId": 10, "warehouseId": 1, "quantity": 75, "type": "OUT", "unitPrice": 8.99, "orgId": 1}'
```

**Results:**
- ✅ Stock: 100 - 75 = 25 (below reorder level of 30)
- ✅ **LOW_STOCK alert automatically triggered**
- ✅ Email sent (WARNING severity)
- ✅ Notification saved to database

**Step 6: Calculate COGS using Strategy Pattern**
```bash
curl -X POST "http://localhost:8080/api/inventory/valuation/cogs?productId=10&warehouseId=1&quantity=75&strategy=FIFO"
```

Expected FIFO COGS:
- 30 from Batch 1 @ $8.00 = $240
- 45 from Batch 2 @ $8.50 = $382.50
- Total: **$622.50** (avg: $8.30/unit)

---

## Troubleshooting

### Issue: "Connection refused" errors
**Solution:** Make sure notification-service (port 8087) is running.

### Issue: No alerts triggered
**Solution:** Check that reorderLevel is set on the Stock record.

### Issue: Valuation returns zero
**Solution:** Ensure transactions have unitPrice set and type is "IN".

### Issue: Factory validation fails
**Solution:** Check that SKU prefix matches industry type (PHARM-, RETAIL-, MFG-).

---

## Success Checklist

✅ Strategy Pattern:
- [ ] Can compare FIFO, LIFO, Weighted Average
- [ ] COGS calculations differ by strategy
- [ ] Can switch strategies at runtime

✅ Factory Pattern:
- [ ] Can get templates by industry
- [ ] Products have correct SKU prefix
- [ ] Validation works per industry

✅ Observer Pattern:
- [ ] 3 observers active (Database, Email, SMS)
- [ ] LOW_STOCK triggers Database + Email
- [ ] OUT_OF_STOCK triggers all 3 observers
- [ ] Automatic alerts on inventory transactions

---

**Last Updated:** February 14, 2026
