# Design Patterns Implementation Guide

This document describes the three design patterns implemented in the Universal Inventory Management System (UIMS).

---

## 1. 🎲 Strategy Pattern - Stock Valuation Methods

### Overview
The Strategy Pattern allows runtime selection of different inventory valuation algorithms (FIFO, LIFO, Weighted Average) without changing the core business logic.

### Location
`inventory-service/src/main/java/com/inventory/inventoryservice/strategy/`

### Components

#### Interface
- **ValuationStrategy** - Defines the contract for all valuation strategies

#### Concrete Strategies
- **FIFOValuationStrategy** (First-In-First-Out) - Oldest inventory sold first
- **LIFOValuationStrategy** (Last-In-First-Out) - Newest inventory sold first
- **WeightedAverageValuationStrategy** - Average cost across all batches

#### Context
- **ValuationContext** - Manages strategy selection and execution

### Usage Example

```java
// Inject the context
@Autowired
private ValuationContext valuationContext;

// Calculate stock value using FIFO
BigDecimal value = valuationContext.calculateStockValue(
    "FIFO", 
    transactions, 
    currentQuantity
);

// Calculate COGS using Weighted Average
BigDecimal cogs = valuationContext.calculateCOGS(
    "WEIGHTED_AVERAGE",
    transactions,
    quantitySold
);

// Switch strategy at runtime
valuationContext.setStrategy("LIFO");
```

### REST Endpoints

**Get Stock Valuation (All Methods)**
```http
GET /api/inventory/valuation/stock/{productId}/warehouse/{warehouseId}
```

**Get Stock Valuation (Specific Strategy)**
```http
GET /api/inventory/valuation/stock/{productId}/warehouse/{warehouseId}?strategy=FIFO
```

**Calculate Cost of Goods Sold**
```http
POST /api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=10&strategy=FIFO
```

**Get Available Strategies**
```http
GET /api/inventory/valuation/strategies
```

### Benefits
- ✅ Easy to add new valuation methods
- ✅ Switch algorithms at runtime per organization
- ✅ Complies with different accounting standards (GAAP, IFRS)
- ✅ Compare multiple valuation methods simultaneously

---

## 2. 🏭 Factory Pattern - Industry-Specific Product Templates

### Overview
The Factory Pattern creates industry-specific products with predefined templates and validation rules. Each industry (Pharmacy, Retail, Manufacturing) has its own factory.

### Location
`product-service/src/main/java/com/inventory/product/factory/`

### Components

#### Interface
- **ProductFactory** - Defines factory contract

#### Concrete Factories
- **PharmacyProductFactory** - Creates pharmaceutical products (prescriptions, OTC, medical supplies)
- **RetailProductFactory** - Creates retail products (apparel, electronics, home & garden)
- **ManufacturingProductFactory** - Creates manufacturing products (raw materials, components, finished goods)

#### Provider
- **ProductFactoryProvider** - Registry/provider for all factories

### Usage Example

```java
// Inject the provider
@Autowired
private ProductFactoryProvider factoryProvider;

// Get factory for specific industry
ProductFactory factory = factoryProvider.getFactory("PHARMACY");

// Get available templates
List<ProductTemplate> templates = factory.getAvailableTemplates();

// Create product from template
ProductTemplate template = templates.get(0);
template.setName("Aspirin 500mg");
Product product = factory.createProduct(template);

// Validate product
boolean isValid = factory.validateProduct(product);
```

### Product Templates

#### Pharmacy Templates
1. **Prescription Medication** - SKU: `PHARM-*`, requires dosage, strength, active ingredient
2. **OTC Medication** - SKU: `PHARM-*`, no prescription required
3. **Medical Supplies** - SKU: `PHARM-*`, sterile/disposable flags

#### Retail Templates
1. **Apparel** - SKU: `RETAIL-*`, size, color, material, season
2. **Electronics** - SKU: `RETAIL-*`, warranty, power rating
3. **Home & Garden** - SKU: `RETAIL-*`, general merchandise

#### Manufacturing Templates
1. **Raw Material** - SKU: `MFG-*`, unit, grade, hazardous flag
2. **Component** - SKU: `MFG-*`, part number, lead time, MOQ
3. **Finished Goods** - SKU: `MFG-*`, BOM reference, quality grade

### REST Endpoints

**Get Available Industries**
```http
GET /api/products/templates/industries
```

**Get Templates by Industry**
```http
GET /api/products/templates/industry/PHARMACY
```

**Create Product from Template**
```http
POST /api/products/templates/create?orgId=1
Content-Type: application/json

{
  "name": "Aspirin 500mg",
  "industryType": "PHARMACY",
  "category": "OTC_DRUGS",
  "basePrice": 12.99,
  "industrySpecificAttributes": {
    "dosageForm": "Tablet",
    "strength": "500mg"
  }
}
```

**Validate Product**
```http
POST /api/products/templates/validate?industryType=PHARMACY
```

### Benefits
- ✅ Industry-specific SKU prefixes (PHARM-, RETAIL-, MFG-)
- ✅ Predefined templates accelerate product creation
- ✅ Automatic validation based on industry rules
- ✅ Easy to add new industries (Healthcare, Construction, Food & Beverage, etc.)

---

## 3. 👁️ Observer Pattern - Automated Stock Alerts

### Overview
The Observer Pattern implements automated notifications when stock levels change. Multiple observers (Database, Email, SMS) are notified simultaneously when stock events occur.

### Location
`notification-service/src/main/java/com/inventory/notification/observer/`

### Components

#### Subject/Publisher
- **StockEventPublisher** - Manages observers and publishes events

#### Observer Interface
- **StockObserver** - Contract for all observers

#### Concrete Observers
- **DatabaseNotificationObserver** - Saves notifications to database (all events)
- **EmailNotificationObserver** - Sends emails (WARNING + CRITICAL)
- **SMSNotificationObserver** - Sends SMS (CRITICAL only)

#### Event Model
- **StockEvent** - Data transfer object for stock events

### Event Types
- `LOW_STOCK` - Stock below reorder level (WARNING)
- `OUT_OF_STOCK` - Zero quantity (CRITICAL)
- `OVERSTOCKED` - Stock above maximum level (INFO)
- `REORDER_POINT` - Reached reorder threshold (WARNING)
- `STOCK_IN` - Inventory received (INFO)
- `STOCK_OUT` - Inventory shipped (INFO)

### Usage Example

```java
// Inject the publisher
@Autowired
private StockEventPublisher eventPublisher;

// Create and publish event
StockEvent event = StockEvent.createLowStockEvent(
    productId, "Aspirin 500mg",
    warehouseId, "Main Warehouse",
    5, // current quantity
    20, // reorder level
    orgId
);

eventPublisher.notifyObservers(event);

// Register custom observer
eventPublisher.registerObserver(new CustomObserver());

// Unregister observer
eventPublisher.unregisterObserver(observer);
```

### Automatic Integration
Stock events are **automatically triggered** by the InventoryService when:
- Stock quantity reaches zero → `OUT_OF_STOCK` event
- Stock quantity ≤ reorder level → `LOW_STOCK` event

```java
// In InventoryService.processTransaction()
if (stock.getQuantity() == 0) {
    // Automatically publishes OUT_OF_STOCK event
}
else if (stock.getQuantity() <= stock.getReorderLevel()) {
    // Automatically publishes LOW_STOCK event
}
```

### Observer Behavior

| Observer | Info Events | Warning Events | Critical Events |
|----------|-------------|----------------|-----------------|
| Database | ✅ Saves     | ✅ Saves        | ✅ Saves         |
| Email    | ❌ Skips     | ✅ Sends Email  | ✅ Sends Email   |
| SMS      | ❌ Skips     | ❌ Skips        | ✅ Sends SMS     |

### REST Endpoints

**Publish Stock Event Manually**
```http
POST /api/notifications/events/publish
Content-Type: application/json

{
  "productId": 1,
  "productName": "Aspirin 500mg",
  "warehouseId": 1,
  "warehouseName": "Main Warehouse",
  "orgId": 1,
  "currentQuantity": 5,
  "reorderLevel": 20,
  "eventType": "LOW_STOCK",
  "severity": "WARNING",
  "message": "Low stock alert"
}
```

**Get Registered Observers**
```http
GET /api/notifications/events/observers
```

**Simulate Event for Testing**
```http
POST /api/notifications/events/simulate?eventType=OUT_OF_STOCK&productId=1&productName=Test&warehouseId=1&warehouseName=Main&orgId=1
```

### Benefits
- ✅ Loose coupling - observers can be added/removed without changing core logic
- ✅ Real-time notifications across multiple channels
- ✅ Severity-based routing (SMS only for critical alerts)
- ✅ Easy to add new observers (Slack, Microsoft Teams, Push Notifications, etc.)
- ✅ Automatic triggering on stock changes

---

## Integration Summary

### How They Work Together

1. **Factory Pattern** creates products with industry-specific attributes
2. **Strategy Pattern** calculates stock values using configurable algorithms
3. **Observer Pattern** monitors stock changes and sends alerts

### Example Workflow

```
1. User creates Pharmacy product using Factory Pattern
   → PharmacyProductFactory.createProduct()
   → Product created with SKU: PHARM-A1B2C3D4

2. Inventory transaction reduces stock
   → InventoryService.processTransaction()
   
3. Stock value calculated using Strategy Pattern
   → ValuationContext.calculateStockValue("FIFO")
   → Returns: $1,250.00

4. Stock level triggers Observer Pattern
   → Stock ≤ Reorder Level
   → StockEventPublisher.notifyObservers()
   → DatabaseObserver: Saves notification
   → EmailObserver: Sends warning email
   → SMSObserver: Skips (not critical)
```

---

## Testing the Patterns

### Test Strategy Pattern
```bash
# Get valuation comparison
curl http://localhost:8080/api/inventory/valuation/stock/1/warehouse/1

# Calculate COGS with FIFO
curl -X POST "http://localhost:8080/api/inventory/valuation/cogs?productId=1&warehouseId=1&quantity=10&strategy=FIFO"
```

### Test Factory Pattern
```bash
# Get pharmacy templates
curl http://localhost:8080/api/products/templates/industry/PHARMACY

# Create product from template
curl -X POST http://localhost:8080/api/products/templates/create?orgId=1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Aspirin","industryType":"PHARMACY","category":"OTC_DRUGS","basePrice":12.99}'
```

### Test Observer Pattern
```bash
# Simulate low stock event
curl -X POST "http://localhost:8080/api/notifications/events/simulate?eventType=LOW_STOCK&productId=1&productName=Aspirin&warehouseId=1&warehouseName=Main&orgId=1"

# Check observers
curl http://localhost:8080/api/notifications/events/observers

# Check notifications created
curl http://localhost:8080/api/notifications
```

---

## Adding New Implementations

### Add New Valuation Strategy
```java
@Component
public class SpecificIdentificationStrategy implements ValuationStrategy {
    @Override
    public BigDecimal calculateStockValue(List<InventoryTransaction> transactions, Integer quantity) {
        // Your logic here
    }
    
    @Override
    public String getStrategyName() {
        return "SPECIFIC_IDENTIFICATION";
    }
}
```

### Add New Product Factory
```java
@Component
public class HealthcareProductFactory implements ProductFactory {
    @Override
    public Product createProduct(ProductTemplate template) {
        // Healthcare-specific logic
        product.setSku("HEALTH-" + UUID.randomUUID());
        return product;
    }
    
    @Override
    public String getIndustryType() {
        return "HEALTHCARE";
    }
}
```

### Add New Observer
```java
@Component
public class SlackNotificationObserver implements StockObserver {
    @Override
    public void onStockChanged(StockEvent event) {
        // Send Slack message
    }
    
    @Override
    public String getObserverType() {
        return "SLACK_NOTIFICATION";
    }
}
```

---

## Performance Considerations

- **Strategy Pattern**: Calculations are on-demand, no caching implemented
- **Factory Pattern**: Templates loaded at startup, minimal overhead
- **Observer Pattern**: Async notification recommended for production (use @Async)

## Security Notes

- All endpoints protected by API Gateway
- Observer notifications should respect organization boundaries
- Email/SMS observers require proper credential management

---

**Last Updated:** February 14, 2026  
**Version:** 1.0
