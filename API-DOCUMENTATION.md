# API Documentation - Inventory Management System

## Base URL
All API requests go through the API Gateway:
```
http://localhost:8080
```

---

## Product Service

### Get All Products
```http
GET /api/products
```

### Get Product by ID
```http
GET /api/products/{id}
```

### Get Product by SKU
```http
GET /api/products/sku/{sku}
```

### Search Products
```http
GET /api/products/search?name={name}
```

### Get Products by Category
```http
GET /api/products/category/{category}
```

### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "sku": "PROD001",
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "costPrice": 50.00,
  "category": "Electronics",
  "brand": "Brand Name",
  "unit": "pcs",
  "reorderLevel": 10,
  "isActive": true
}
```

### Update Product
```http
PUT /api/products/{id}
Content-Type: application/json

{
  "sku": "PROD001",
  "name": "Updated Product Name",
  "price": 109.99,
  ...
}
```

### Delete Product
```http
DELETE /api/products/{id}
```

---

## Inventory Service

### Get All Stocks
```http
GET /api/inventory/stocks
```

### Get Stock by Product
```http
GET /api/inventory/stocks/product/{productId}
```

### Get Stock by Product and Warehouse
```http
GET /api/inventory/stocks/product/{productId}/warehouse/{warehouseId}
```

### Update Stock
```http
PUT /api/inventory/stocks/{id}
Content-Type: application/json

{
  "quantity": 100,
  "availableQuantity": 80,
  "reservedQuantity": 20
}
```

### Get All Transactions
```http
GET /api/inventory/transactions
```

### Create Transaction
```http
POST /api/inventory/transactions
Content-Type: application/json

{
  "productId": 1,
  "warehouseId": 1,
  "type": "IN",
  "quantity": 50,
  "referenceId": "PO-001",
  "notes": "Purchase order receipt"
}
```

**Transaction Types:** `IN`, `OUT`, `ADJUSTMENT`, `TRANSFER`, `RETURN`

---

## Order Service

### Purchase Orders

#### Get All Purchase Orders
```http
GET /api/orders/purchase
```

#### Create Purchase Order
```http
POST /api/orders/purchase
Content-Type: application/json

{
  "supplierId": 1,
  "buyerId": 1,
  "status": "PENDING",
  "totalAmount": 5000.00,
  "orgId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 100,
      "unitPrice": 50.00
    }
  ]
}
```

### Sales Orders

#### Get All Sales Orders
```http
GET /api/orders/sales
```

#### Create Sales Order
```http
POST /api/orders/sales
Content-Type: application/json

{
  "customerName": "John Doe",
  "status": "PENDING",
  "totalAmount": 2500.00,
  "orgId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 25,
      "unitPrice": 100.00
    }
  ]
}
```

---

## Warehouse Service

### Get All Warehouses
```http
GET /api/warehouses
```

### Get Warehouse by ID
```http
GET /api/warehouses/{id}
```

### Create Warehouse
```http
POST /api/warehouses
Content-Type: application/json

{
  "name": "Main Warehouse",
  "location": "123 Storage St, City",
  "orgId": 1
}
```

### Update Warehouse
```http
PUT /api/warehouses/{id}
Content-Type: application/json

{
  "name": "Updated Warehouse Name",
  "location": "New Location"
}
```

### Delete Warehouse
```http
DELETE /api/warehouses/{id}
```

---

## Supplier Service

### Get All Suppliers
```http
GET /api/suppliers
```

### Get Supplier by ID
```http
GET /api/suppliers/{id}
```

### Create Supplier
```http
POST /api/suppliers
Content-Type: application/json

{
  "name": "Supplier Company",
  "ownerInfo": "Owner Name",
  "contactInfo": "email@example.com, +1234567890",
  "orgId": 1
}
```

### Update Supplier
```http
PUT /api/suppliers/{id}
Content-Type: application/json

{
  "name": "Updated Supplier Name",
  "contactInfo": "newemail@example.com"
}
```

### Delete Supplier
```http
DELETE /api/suppliers/{id}
```

---

---

## 🏭 FACTORY PATTERN - Product Templates

### Get Available Industries
```http
GET /api/products/templates/industries
```
**Response:**
```json
{
  "industries": ["PHARMACY", "RETAIL", "MANUFACTURING"]
}
```

### Get Templates by Industry
```http
GET /api/products/templates/industry/PHARMACY
```
**Response:**
```json
{
  "industryType": "PHARMACY",
  "count": 3,
  "templates": [
    {
      "name": "Prescription Medication Template",
      "category": "PRESCRIPTION_DRUGS",
      "industryType": "PHARMACY",
      "basePrice": 25.00,
      "industrySpecificAttributes": {
        "prescriptionRequired": true,
        "dosageForm": "Tablet",
        "controlledSubstance": false
      },
      "requiredFields": ["activeIngredient", "strength", "dosageForm"]
    }
  ]
}
```

### Create Product from Template
```http
POST /api/products/templates/create?orgId=1
Content-Type: application/json

{
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
}
```
**Response:** Returns created Product with auto-generated SKU (e.g., `PHARM-A1B2C3D4`)

### Validate Product for Industry
```http
POST /api/products/templates/validate?industryType=PHARMACY
Content-Type: application/json

{
  "sku": "PHARM-12345678",
  "name": "Test Product",
  "price": 10.00
}
```

---

## User Service

### Get All Users
```http
GET /api/users
```

### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123",
  "displayName": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "orgId": 1
}
```

### Get User by ID
```http
GET /api/users/{id}
```

---

## Notification Service

### Get All Notifications
```http
GET /api/notifications
```

### Get Unread Notifications
```http
GET /api/notifications/unread
```

### Create Notification
```http
POST /api/notifications
Content-Type: application/json

{
  "orgId": 1,
  "type": "LOW_STOCK",
  "message": "Product XYZ is running low on stock",
  "readStatus": false
}
```

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```

---

## Response Formats

### Success Response
```json
{
  "id": 1,
  "name": "Product Name",
  ...
}
```

### Error Response
```json
{
  "timestamp": "2024-01-01T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/products"
}
```

---

## HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing with cURL

### Example: Create a Product
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD001",
    "name": "Test Product",
    "price": 99.99,
    "isActive": true
  }'
```

### Example: Get All Products
```bash
curl http://localhost:8080/api/products
```

### Example: Update Product
```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD001",
    "name": "Updated Product",
    "price": 109.99
  }'
```

---

## Postman Collection

Import this into Postman for easy testing:

1. Open Postman
2. Import > Raw Text
3. Paste the API endpoints above
4. Set base URL to `http://localhost:8080`
