# Enhanced Services Overview

## System Architecture

The Inventory Management System has been enhanced with three new enterprise-grade services:

1. **Identity Service** - OAuth2/JWT Authentication with RBAC
2. **Catalog Service** - Dynamic industry-specific product schemas
3. **Reporting Service** - Analytics and audit trails

---

## 1. Identity Service (Port 8088)

### Purpose
Centralized authentication and authorization service with JWT token management and Role-Based Access Control.

### Key Features
- ✅ JWT token generation and validation
- ✅ OAuth2-compatible refresh token flow
- ✅ 9 predefined roles with granular permissions
- ✅ Multi-tenancy support (Organization and Branch level)
- ✅ User registration and management
- ✅ Password encryption with BCrypt
- ✅ Spring Security integration
- ✅ Automatic role and permission seeding

### Technology Stack
- Spring Boot 3.2.0
- Spring Security
- JWT (jjwt 0.11.5)
- MySQL 8.0+ (identity_db)
- Spring Cloud Eureka Client

### API Endpoints
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - User login (returns JWT)
POST   /api/auth/refresh     - Refresh access token
POST   /api/auth/logout      - Logout user
GET    /api/auth/me          - Get current user
GET    /api/users            - Get all users (ADMIN)
GET    /api/users/{id}       - Get user by ID
PUT    /api/users/{id}/status - Update user status
DELETE /api/users/{id}       - Delete user (SUPER_ADMIN)
```

### Roles
1. `ROLE_SUPER_ADMIN` - Full system access
2. `ROLE_ORG_ADMIN` - Organization administrator
3. `ROLE_MANAGER` - Branch/Department manager
4. `ROLE_WAREHOUSE_STAFF` - Warehouse operations
5. `ROLE_SALES_STAFF` - Sales and orders
6. `ROLE_PROCUREMENT` - Supplier management
7. `ROLE_ACCOUNTANT` - Financial reports
8. `ROLE_AUDITOR` - Read-only audit access
9. `ROLE_USER` - Basic user

### Database Tables
- `users` - User accounts
- `roles` - System roles
- `permissions` - Granular permissions (resource:action)
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission mappings
- `refresh_tokens` - Refresh token storage

---

## 2. Catalog Service (Port 8089)

### Purpose
Product catalog management with dynamic JSON schema validation for industry-specific attributes.

### Key Features
- ✅ JSON Schema validation for product attributes
- ✅ Dynamic field definitions per industry type
- ✅ Industry schema management
- ✅ Default values and UI configuration
- ✅ Schema versioning
- ✅ Full-text product search
- ✅ Featured products support
- ✅ Multi-organization support

### Technology Stack
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL 8.0+ with JSON columns (catalog_db)
- JSON Schema Validator (networknt)
- Spring Cloud OpenFeign
- Spring Cloud Eureka Client

### Entities

#### IndustrySchema
```java
{
  "industryType": "PHARMACY",
  "schemaName": "Pharmaceutical Products Schema",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "activeIngredient": {"type": "string"},
      "strength": {"type": "string"},
      "dosageForm": {"type": "string"},
      "prescriptionRequired": {"type": "boolean"}
    },
    "required": ["activeIngredient", "strength"]
  },
  "defaultValues": {},
  "uiConfig": {},
  "isActive": true,
  "version": 1
}
```

#### CatalogProduct
```java
{
  "sku": "PHARM-001",
  "name": "Ibuprofen 400mg",
  "description": "Pain reliever",
  "price": 12.99,
  "category": "OTC_DRUGS",
  "brand": "Generic",
  "orgId": 1,
  "industryType": "PHARMACY",
  "attributes": {
    "activeIngredient": "Ibuprofen",
    "strength": "400mg",
    "dosageForm": "Tablet",
    "prescriptionRequired": false
  },
  "images": {},
  "tags": {},
  "isFeatured": false
}
```

### API Endpoints
```
# Schema Management
POST   /api/schemas                      - Create schema
GET    /api/schemas                      - Get all schemas
GET    /api/schemas/active               - Get active schemas
GET    /api/schemas/industry/{type}      - Get schema by industry
PUT    /api/schemas/{id}                 - Update schema
DELETE /api/schemas/{id}                 - Delete schema
POST   /api/schemas/validate             - Validate attributes

# Product Catalog
POST   /api/catalog/products             - Create product
GET    /api/catalog/products             - Get all products
GET    /api/catalog/products/{id}        - Get product by ID
GET    /api/catalog/products/sku/{sku}   - Get product by SKU
GET    /api/catalog/products/organization/{orgId} - Get by org
GET    /api/catalog/products/industry/{type}      - Get by industry
GET    /api/catalog/products/search?keyword=      - Search products
GET    /api/catalog/products/featured             - Get featured
PUT    /api/catalog/products/{id}                 - Update product
DELETE /api/catalog/products/{id}                 - Delete product
```

### Schema Validation Example
```javascript
// Define schema
{
  "type": "object",
  "properties": {
    "size": {"type": "string", "enum": ["S", "M", "L", "XL"]},
    "color": {"type": "string"},
    "material": {"type": "string"}
  },
  "required": ["size", "color"]
}

// Validate product attributes
{
  "size": "M",
  "color": "Blue",
  "material": "Cotton"
}
// ✅ Valid

{
  "size": "XXL",  // Not in enum
  "color": "Blue"
}
// ❌ Invalid: size must be S, M, L, or XL
```

---

## 3. Reporting Service (Port 8090)

### Purpose
Analytics, audit trails, and business intelligence reporting.

### Key Features
- ✅ Comprehensive audit logging
- ✅ Inventory analytics and metrics
- ✅ Sales analytics and summaries
- ✅ Dashboard metrics aggregation
- ✅ Entity change history tracking
- ✅ Low stock alerts
- ✅ Date range reporting
- ✅ Multi-tenant analytics

### Technology Stack
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL 8.0+ with JSON columns (reporting_db)
- Spring Cloud OpenFeign
- Spring Cloud Eureka Client

### Entities

#### AuditLog
```java
{
  "userId": 1,
  "username": "john_doe",
  "orgId": 1,
  "branchId": 1,
  "action": "UPDATE",
  "entity": "Product",
  "entityId": 123,
  "description": "Updated product price",
  "oldValue": {"price": 10.99},
  "newValue": {"price": 12.99},
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "severity": "INFO",
  "timestamp": "2026-02-14T10:30:00"
}
```

#### InventoryAnalytics
```java
{
  "orgId": 1,
  "branchId": 1,
  "productId": 123,
  "productSku": "PHARM-001",
  "productName": "Ibuprofen 400mg",
  "category": "OTC_DRUGS",
  "stockQuantity": 500,
  "stockValue": 6495.00,
  "reorderLevel": 100,
  "isLowStock": false,
  "lastMovementDate": "2026-02-14",
  "turnoverRate": 12.5,
  "snapshotDate": "2026-02-14"
}
```

#### SalesAnalytics
```java
{
  "orgId": 1,
  "branchId": 1,
  "orderId": 456,
  "totalAmount": 299.99,
  "totalItems": 5,
  "orderStatus": "COMPLETED",
  "customerId": 789,
  "saleDate": "2026-02-14",
  "monthYear": "2026-02"
}
```

### API Endpoints

#### Audit Logs
```
POST   /api/audit                        - Create audit log
GET    /api/audit/user/{userId}          - Get logs by user
GET    /api/audit/organization/{orgId}   - Get logs by org
GET    /api/audit/entity/{entity}        - Get logs by entity type
GET    /api/audit/entity/{entity}/{id}   - Get entity history
GET    /api/audit/organization/{orgId}/range?start=&end= - Date range
GET    /api/audit/critical                               - Critical logs
```

#### Analytics
```
GET    /api/analytics/inventory/{orgId}               - Inventory analytics
GET    /api/analytics/inventory/{orgId}/summary       - Inventory summary
GET    /api/analytics/inventory/{orgId}/low-stock     - Low stock products
GET    /api/analytics/sales/{orgId}                   - Sales analytics
GET    /api/analytics/sales/{orgId}/summary?startDate=&endDate= - Sales summary
GET    /api/analytics/sales/{orgId}/monthly?monthYear= - Monthly sales
GET    /api/analytics/dashboard/{orgId}               - Dashboard metrics
```

### Dashboard Metrics Example
```json
{
  "inventory": {
    "totalStockValue": 125000.00,
    "lowStockCount": 12,
    "totalProducts": 245,
    "snapshotDate": "2026-02-14"
  },
  "salesThisMonth": {
    "totalSales": 45000.00,
    "totalOrders": 120,
    "averageOrderValue": 375.00,
    "startDate": "2026-02-01",
    "endDate": "2026-02-14"
  },
  "lowStockAlerts": 12
}
```

---

## API Gateway Enhancements

### JWT Authentication Filter

The API Gateway now includes JWT validation for all protected routes:

```java
// Validates JWT tokens
// Extracts user information
// Adds headers to downstream requests:
- X-User-Id
- X-Username
- X-Email
- X-Org-Id
- X-Branch-Id
```

### Route Configuration

| Route Pattern | Service | Authentication |
|--------------|---------|----------------|
| `/api/auth/**` | identity-service | Public |
| `/api/users/**` | identity-service | JWT Required |
| `/api/products/**` | product-service | JWT Required |
| `/api/inventory/**` | inventory-service | JWT Required |
| `/api/orders/**` | order-service | JWT Required |
| `/api/warehouses/**` | warehouse-service | JWT Required |
| `/api/suppliers/**` | supplier-service | JWT Required |
| `/api/organizations/**` | user-service | JWT Required |
| `/api/branches/**` | user-service | JWT Required |
| `/api/notifications/**` | notification-service | JWT Required |
| `/api/catalog/**` | catalog-service | JWT Required |
| `/api/schemas/**` | catalog-service | JWT Required |
| `/api/analytics/**` | reporting-service | JWT Required |
| `/api/audit/**` | reporting-service | JWT Required |

---

## Docker Compose Configuration

### Updated docker-compose.yml

Three new services added:

```yaml
identity-service:
  container_name: identity-service
  ports: 8088:8088
  environment:
    SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/identity_db
    JWT_SECRET: 5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437

catalog-service:
  container_name: catalog-service
  ports: 8089:8089
  environment:
    SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/catalog_db

reporting-service:
  container_name: reporting-service
  ports: 8090:8090
  environment:
    SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/reporting_db
```

### Total Services: 12

1. MySQL (3306)
2. Service Discovery (8761)
3. API Gateway (8080)
4. Product Service (8081)
5. Inventory Service (8082)
6. Order Service (8083)
7. Warehouse Service (8084)
8. Supplier Service (8085)
9. User Service (8086)
10. Notification Service (8087)
11. **Identity Service (8088)** ← NEW
12. **Catalog Service (8089)** ← NEW
13. **Reporting Service (8090)** ← NEW
14. Frontend (5173)

---

## Database Schema Updates

### New Databases Created

1. `identity_db` - Users, roles, permissions, refresh tokens
2. `catalog_db` - Industry schemas, catalog products
3. `reporting_db` - Audit logs, inventory analytics, sales analytics

All three databases use MySQL 8.0+ JSON column support for flexible data storage.

---

## Integration Flow

### 1. Authentication Flow
```
User → API Gateway → Identity Service (login)
                   ← JWT Token + Refresh Token
User → API Gateway → Identity Service (refresh)
                   ← New JWT Token
```

### 2. Authorized Request Flow
```
User → API Gateway (JWT validation)
     → Extract user context
     → Add X-User-Id, X-Org-Id headers
     → Forward to Product Service
     → Return response
```

### 3. Catalog with Schema Validation
```
User → API Gateway → Catalog Service
     → Get industry schema
     → Validate product attributes against schema
     → Save product
     → Return validated product
```

### 4. Audit Trail Flow
```
User → API Gateway → Any Service
     → Service makes changes
     → Service calls Reporting Service
     → Create audit log entry
     → Return success
```

---

## Testing the Enhanced Services

### 1. Test Identity Service

```bash
# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "roles": ["ROLE_ORG_ADMIN"]
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 2. Test Catalog Service

```bash
TOKEN="your-jwt-token"

# Create industry schema
curl -X POST http://localhost:8080/api/schemas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "industryType": "PHARMACY",
    "schemaName": "Pharmaceutical Products",
    "jsonSchema": {
      "type": "object",
      "properties": {
        "activeIngredient": {"type": "string"},
        "strength": {"type": "string"}
      }
    }
  }'

# Create product with validation
curl -X POST http://localhost:8080/api/catalog/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHARM-001",
    "name": "Aspirin 500mg",
    "price": 12.99,
    "industryType": "PHARMACY",
    "attributes": {
      "activeIngredient": "Aspirin",
      "strength": "500mg"
    }
  }'
```

### 3. Test Reporting Service

```bash
# Get dashboard metrics
curl -X GET "http://localhost:8080/api/analytics/dashboard/1" \
  -H "Authorization: Bearer $TOKEN"

# Get audit logs
curl -X GET "http://localhost:8080/api/audit/organization/1" \
  -H "Authorization: Bearer $TOKEN"

# Get inventory summary
curl -X GET "http://localhost:8080/api/analytics/inventory/1/summary" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Key Benefits

### Identity Service
✅ Centralized authentication  
✅ Fine-grained authorization  
✅ Token refresh mechanism  
✅ Multi-tenant security  
✅ Audit-ready user tracking  

### Catalog Service
✅ Flexible product schemas  
✅ Industry-specific validation  
✅ No code changes for new fields  
✅ Type-safe attribute storage  
✅ Schema versioning  

### Reporting Service
✅ Complete audit trail  
✅ Real-time analytics  
✅ Dashboard-ready metrics  
✅ Historical data tracking  
✅ Compliance support  

---

## Documentation Files

1. [AUTHENTICATION-GUIDE.md](AUTHENTICATION-GUIDE.md) - Complete authentication guide
2. [JSON-COLUMNS-GUIDE.md](JSON-COLUMNS-GUIDE.md) - JSON schema usage guide
3. [DATABASE-MIGRATIONS-JSON.sql](DATABASE-MIGRATIONS-JSON.sql) - Database migrations
4. [DESIGN-PATTERNS.md](DESIGN-PATTERNS.md) - Design patterns documentation
5. [TESTING-DESIGN-PATTERNS.md](TESTING-DESIGN-PATTERNS.md) - Testing guide

---

## Next Steps

1. ✅ Build all services: `mvn clean package`
2. ✅ Start Docker containers: `docker-compose up -d`
3. ✅ Access services via API Gateway (port 8080)
4. ✅ Test authentication flow
5. ✅ Create industry schemas
6. ✅ Monitor audit logs and analytics

---

**System Status**: ✅ Production Ready  
**Services**: 12 Microservices + Frontend  
**Last Updated**: February 14, 2026  
**Version**: 2.0
