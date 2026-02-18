# JSON Columns for Industry-Specific Attributes

This document explains how MySQL JSON columns are used to store dynamic, industry-specific attributes in the UIMS system.

---

## Overview

The system uses **MySQL 8.0+ JSON columns** to store flexible, industry-specific attributes without requiring schema changes for each industry type. This approach provides:

✅ **Flexibility** - Each industry can have unique attributes  
✅ **Type Safety** - MySQL validates JSON structure  
✅ **Query Support** - Can query inside JSON columns  
✅ **No Schema Changes** - Add new attributes without migrations  

---

## Entities with JSON Columns

### 1. **Product** (`product-service`)

**JSON Column:** `industry_specific_attributes`

Stores attributes that vary by industry:

#### Pharmacy Products
```json
{
  "activeIngredient": "Ibuprofen",
  "strength": "400mg",
  "dosageForm": "Tablet",
  "prescriptionRequired": false,
  "controlledSubstance": false,
  "ndc": "12345-678-90",
  "rxcui": "197805",
  "route": "Oral",
  "ageRestriction": false
}
```

#### Retail Products
```json
{
  "size": "M",
  "color": "Blue",
  "material": "Cotton",
  "season": "All Season",
  "sku": "RETAIL-12345",
  "barcode": "1234567890123",
  "warranty": "1 year",
  "weight": "0.5kg",
  "dimensions": "30x20x5cm"
}
```

#### Manufacturing Products
```json
{
  "partNumber": "MFG-COMP-001",
  "specifications": "Grade A Steel",
  "bomReference": "BOM-12345",
  "leadTime": "7 days",
  "moq": 100,
  "hazardous": false,
  "certifications": ["ISO 9001", "CE"],
  "supplier": "SteelCo Inc",
  "tolerance": "±0.1mm"
}
```

---

### 2. **BatchInfo** (`product-service`)

**JSON Column:** `batch_attributes`

Stores batch-specific tracking information:

#### Pharmacy Batches
```json
{
  "lotNumber": "LOT-2026-001",
  "sterile": true,
  "coldChainRequired": true,
  "storageTemp": "2-8°C",
  "inspectionDate": "2026-02-01",
  "qualityGrade": "A",
  "regulatoryApproval": "FDA-2026-001"
}
```

#### Manufacturing Batches
```json
{
  "heatTreatment": "Annealed",
  "surfaceFinish": "Polished",
  "testCertificate": "TC-2026-001",
  "inspectionStatus": "Passed",
  "defectRate": "0.01%"
}
```

---

### 3. **Warehouse** (`warehouse-service`)

**JSON Column:** `warehouse_attributes`

Stores warehouse-specific configurations:

#### Cold Storage Warehouse
```json
{
  "temperatureRange": "-20°C to 5°C",
  "humidityControl": true,
  "hvacSystem": "Carrier 5000",
  "temperatureMonitoring": "24/7",
  "backupPower": true,
  "certifications": ["GDP", "HACCP"]
}
```

#### Hazmat Warehouse
```json
{
  "hazmatCertified": true,
  "fireSuppressionSystem": "FM-200",
  "ventilationRate": "20 ACH",
  "spillContainment": true,
  "securityLevel": "High",
  "permits": ["EPA-12345", "OSHA-6789"]
}
```

---

### 4. **ProductAttributePharmacy** (`product-service`)

**JSON Column:** `pharmacy_attributes`

Legacy table converted to use JSON for pharmacy-specific data:

```json
{
  "dea_schedule": "Schedule II",
  "therapeuticClass": "Analgesic",
  "pregnancy_category": "C",
  "generic_available": true,
  "formulary_status": "Preferred",
  "prior_authorization_required": false
}
```

---

## Implementation Details

### JPA Entity Mapping

```java
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;

@Entity
public class Product {
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "industry_specific_attributes", columnDefinition = "JSON")
    private Map<String, Object> industrySpecificAttributes;
    
    // Getters and setters
}
```

### MySQL Column Definition

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    industry_type VARCHAR(50),
    industry_specific_attributes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Usage Examples

### Creating a Product with JSON Attributes

**REST API Request:**
```http
POST /api/products/templates/create?orgId=1
Content-Type: application/json

{
  "name": "Aspirin 500mg",
  "category": "OTC_DRUGS",
  "basePrice": 12.99,
  "industryType": "PHARMACY",
  "industrySpecificAttributes": {
    "activeIngredient": "Acetylsalicylic Acid",
    "strength": "500mg",
    "dosageForm": "Tablet",
    "prescriptionRequired": false,
    "ndc": "12345-678-90"
  }
}
```

**Java Code (Factory Pattern):**
```java
@Override
public Product createProduct(ProductTemplate template) {
    Product product = new Product();
    product.setName(template.getName());
    product.setIndustryType("PHARMACY");
    
    // Set JSON attributes
    Map<String, Object> attributes = new HashMap<>();
    attributes.put("activeIngredient", "Aspirin");
    attributes.put("strength", "500mg");
    attributes.put("dosageForm", "Tablet");
    product.setIndustrySpecificAttributes(attributes);
    
    return product;
}
```

### Querying Products by JSON Attribute

**MySQL Query:**
```sql
-- Find all prescription-required products
SELECT * FROM products 
WHERE JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired') = true;

-- Find products with specific strength
SELECT * FROM products
WHERE JSON_EXTRACT(industry_specific_attributes, '$.strength') = '500mg';

-- Find products in size Medium
SELECT * FROM products
WHERE JSON_EXTRACT(industry_specific_attributes, '$.size') = 'M';
```

**Spring Data JPA (Native Query):**
```java
@Query(value = "SELECT * FROM products WHERE " +
       "JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired') = true",
       nativeQuery = true)
List<Product> findPrescriptionProducts();
```

### Updating JSON Attributes

**REST API:**
```http
PUT /api/products/1
Content-Type: application/json

{
  "id": 1,
  "name": "Aspirin 500mg",
  "industrySpecificAttributes": {
    "activeIngredient": "Acetylsalicylic Acid",
    "strength": "500mg",
    "dosageForm": "Tablet",
    "prescriptionRequired": false,
    "ndc": "12345-678-90",
    "newAttribute": "New Value"  // Add new attribute
  }
}
```

**Java Code:**
```java
Product product = productRepository.findById(1L).orElseThrow();
Map<String, Object> attrs = product.getIndustrySpecificAttributes();
if (attrs == null) {
    attrs = new HashMap<>();
}
attrs.put("newAttribute", "New Value");
product.setIndustrySpecificAttributes(attrs);
productRepository.save(product);
```

---

## JSON Schema Validation (Optional)

MySQL 8.0 supports JSON schema validation:

```sql
ALTER TABLE products 
ADD CONSTRAINT check_pharmacy_json 
CHECK (
    industry_type != 'PHARMACY' OR 
    JSON_SCHEMA_VALID('{
        "type": "object",
        "properties": {
            "activeIngredient": {"type": "string"},
            "strength": {"type": "string"},
            "dosageForm": {"type": "string"},
            "prescriptionRequired": {"type": "boolean"}
        },
        "required": ["activeIngredient", "strength"]
    }', industry_specific_attributes)
);
```

---

## Performance Considerations

### Indexing JSON Columns

MySQL supports generated columns and indexes on JSON paths:

```sql
-- Create generated column
ALTER TABLE products 
ADD COLUMN prescription_required BOOLEAN 
GENERATED ALWAYS AS (
    JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired')
) STORED;

-- Create index on generated column
CREATE INDEX idx_prescription ON products(prescription_required);
```

### Best Practices

1. **Keep JSON Shallow** - Avoid deep nesting (max 2-3 levels)
2. **Use Generated Columns** - For frequently queried JSON paths
3. **Index Strategically** - Only index JSON attributes used in WHERE clauses
4. **Limit JSON Size** - Keep individual JSON documents under 64KB
5. **Use Consistent Keys** - Standardize attribute naming across industry types

---

## Migration Strategy

### Adding JSON Columns to Existing Tables

```sql
-- Add JSON column (nullable initially)
ALTER TABLE products 
ADD COLUMN industry_specific_attributes JSON NULL;

-- Migrate existing data (example for pharmacy attributes)
UPDATE products p
INNER JOIN product_attributes_pharmacy pap ON p.id = pap.product_id
SET p.industry_specific_attributes = JSON_OBJECT(
    'activeIngredient', pap.active_ingredient,
    'strength', pap.strength,
    'dosageForm', pap.dosage_form
)
WHERE p.industry_type = 'PHARMACY';

-- Make column NOT NULL after migration (optional)
ALTER TABLE products 
MODIFY COLUMN industry_specific_attributes JSON NOT NULL;
```

---

## Testing JSON Columns

### Unit Test Example

```java
@Test
public void testProductJsonAttributes() {
    Product product = new Product();
    product.setName("Test Product");
    
    Map<String, Object> attrs = new HashMap<>();
    attrs.put("strength", "500mg");
    attrs.put("dosageForm", "Tablet");
    product.setIndustrySpecificAttributes(attrs);
    
    Product saved = productRepository.save(product);
    Product retrieved = productRepository.findById(saved.getId()).orElseThrow();
    
    assertEquals("500mg", retrieved.getIndustrySpecificAttributes().get("strength"));
    assertEquals("Tablet", retrieved.getIndustrySpecificAttributes().get("dosageForm"));
}
```

### Integration Test with cURL

```bash
# Create product with JSON attributes
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 10.00,
    "industryType": "PHARMACY",
    "industrySpecificAttributes": {
      "strength": "500mg",
      "dosageForm": "Tablet"
    }
  }'

# Verify JSON is stored correctly
curl http://localhost:8080/api/products/1
```

Expected response:
```json
{
  "id": 1,
  "name": "Test Product",
  "price": 10.00,
  "industryType": "PHARMACY",
  "industrySpecificAttributes": {
    "strength": "500mg",
    "dosageForm": "Tablet"
  }
}
```

---

## Common JSON Attributes by Industry

### Pharmacy
- `activeIngredient`, `strength`, `dosageForm`, `route`
- `prescriptionRequired`, `controlledSubstance`, `dea_schedule`
- `ndc`, `rxcui`, `generic_available`
- `storage_conditions`, `cold_chain_required`

### Retail
- `size`, `color`, `material`, `pattern`
- `season`, `gender`, `age_group`
- `warranty`, `return_policy`
- `barcode`, `weight`, `dimensions`

### Manufacturing
- `partNumber`, `specifications`, `tolerance`
- `material_grade`, `surface_finish`
- `lead_time`, `moq`, `supplier`
- `certifications`, `test_certificates`
- `hazardous`, `msds_reference`

### Healthcare (Medical Devices)
- `device_class`, `fda_clearance`
- `sterilization_method`, `shelf_life`
- `reusable`, `latex_free`
- `biocompatible`, `mri_safe`

---

## Troubleshooting

### Common Issues

**Issue:** JSON column shows as String in Java  
**Solution:** Ensure `@JdbcTypeCode(SqlTypes.JSON)` annotation is present

**Issue:** JSON not persisting to database  
**Solution:** Check MySQL version (requires 8.0+) and table engine (InnoDB)

**Issue:** Cannot query JSON attributes  
**Solution:** Use MySQL's `JSON_EXTRACT()` function in native queries

**Issue:** Jackson deserialization error  
**Solution:** Ensure `jackson-databind` dependency is included in pom.xml

---

## Future Enhancements

1. **JSON Schema Validation** - Enforce structure per industry type
2. **Audit Trail** - Track changes to JSON attributes
3. **Search Integration** - Index JSON attributes in Elasticsearch
4. **UI Builder** - Dynamic forms based on industry_type
5. **Versioning** - Track schema versions for JSON documents

---

**Last Updated:** February 14, 2026  
**MySQL Version:** 8.0+  
**Hibernate Version:** 6.x (Spring Boot 3.2.0)
