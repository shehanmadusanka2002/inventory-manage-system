# Authentication & Authorization Guide

## Overview

The Inventory Management System now includes comprehensive JWT-based authentication and Role-Based Access Control (RBAC) through the **Identity Service**.

---

## Architecture

### Identity Service (Port 8088)
- OAuth2/JWT token generation and validation
- User registration and authentication
- Role-Based Access Control (RBAC)
- Refresh token management
- Multi-tenancy support (Organization and Branch level)

### API Gateway (Port 8080)
- JWT token validation for all protected routes
- User context propagation via headers
- Public endpoint bypass for authentication routes

---

## Roles & Permissions

### Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `ROLE_SUPER_ADMIN` | System-wide administrator | Full access to all resources |
| `ROLE_ORG_ADMIN` | Organization administrator | Manage organization resources, users (except delete) |
| `ROLE_MANAGER` | Branch/Department manager | Read/Update products, inventory, orders, reports |
| `ROLE_WAREHOUSE_STAFF` | Warehouse operations | Manage inventory, read products, update orders |
| `ROLE_SALES_STAFF` | Sales and order management | Create/update orders, read products and inventory |
| `ROLE_PROCUREMENT` | Supplier and purchasing | Manage suppliers, create products, read inventory |
| `ROLE_ACCOUNTANT` | Financial and reporting | Read-only access to all data, full report access |
| `ROLE_AUDITOR` | Audit access | Read-only access to all resources |
| `ROLE_USER` | Basic user | Read-only products, inventory, orders |

### Permission Format

Permissions follow the pattern: `resource:action`

Examples:
- `product:create` - Create products
- `inventory:read` - View inventory
- `order:update` - Update orders
- `user:delete` - Delete users

---

## API Endpoints

### Authentication Endpoints (Public)

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "orgId": 1,
  "branchId": 1,
  "roles": ["ROLE_USER"]
}
```

**Response:**
```json
{
  "message": "User registered successfully!"
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "orgId": 1,
  "branchId": 1,
  "roles": ["ROLE_USER"]
}
```

#### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "orgId": 1,
  "branchId": 1,
  "roles": ["ROLE_USER"]
}
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "User logged out successfully!"
}
```

#### 5. Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

### User Management Endpoints (Protected)

#### 1. Get All Users (ADMIN/MANAGER only)
```http
GET /api/users
Authorization: Bearer {token}
```

#### 2. Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer {token}
```

#### 3. Get Users by Organization
```http
GET /api/users/organization/{orgId}
Authorization: Bearer {token}
```

#### 4. Update User Status (ADMIN only)
```http
PUT /api/users/{id}/status?isActive=true
Authorization: Bearer {token}
```

#### 5. Delete User (SUPER_ADMIN only)
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

---

## Using JWT Tokens

### Making Authenticated Requests

All protected endpoints require a JWT token in the Authorization header:

```http
GET /api/products
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiam9obl9kb2UiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJvcmdJZCI6MSwiYnJhbmNoSWQiOjEsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTcwNzkyMjgwMCwiZXhwIjoxNzA4MDA5MjAwfQ.xyz...
```

### Token Expiration

- **Access Token**: 24 hours
- **Refresh Token**: 7 days

When the access token expires, use the refresh token to obtain a new one without requiring the user to log in again.

---

## API Gateway Security

The API Gateway automatically:
1. Validates JWT tokens for all protected routes
2. Extracts user information from the token
3. Adds custom headers to downstream requests:
   - `X-User-Id`: User ID
   - `X-Username`: Username
   - `X-Email`: User email
   - `X-Org-Id`: Organization ID
   - `X-Branch-Id`: Branch ID

### Public Endpoints (No Authentication Required)

- `/api/auth/**` - All authentication endpoints
- `/api/public/**` - Public resources

### Protected Endpoints (Authentication Required)

All other endpoints require a valid JWT token.

---

## Frontend Integration

### Example: Login Flow

```javascript
// 1. Login
const login = async (username, password) => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify({
    userId: data.userId,
    username: data.username,
    roles: data.roles
  }));
  
  return data;
};

// 2. Make authenticated request
const getProducts = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8080/api/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken();
    return getProducts(); // Retry
  }
  
  return response.json();
};

// 3. Refresh token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:8080/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};

// 4. Logout
const logout = async () => {
  const token = localStorage.getItem('token');
  
  await fetch('http://localhost:8080/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
```

---

## Security Configuration

### JWT Secret

The JWT secret is configured in:
- **Identity Service**: `application.yml` → `jwt.secret`
- **API Gateway**: `application.properties` → `jwt.secret`

**⚠️ Important**: Use a strong, random secret in production. The current secret is for development only.

### Token Configuration

Customize token expiration in `identity-service/application.yml`:

```yaml
jwt:
  secret: "your-secret-key-here"
  expiration: 86400000        # 24 hours
  refresh-expiration: 604800000  # 7 days
```

---

## Role-Based Authorization

### Using @PreAuthorize in Controllers

```java
@GetMapping("/products")
@PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
public ResponseEntity<List<Product>> getAllProducts() {
    return ResponseEntity.ok(productService.getAllProducts());
}

@PostMapping("/products")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Product> createProduct(@RequestBody Product product) {
    return ResponseEntity.ok(productService.createProduct(product));
}

@DeleteMapping("/products/{id}")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    productService.deleteProduct(id);
    return ResponseEntity.noContent().build();
}
```

### Permission-Based Authorization

```java
@GetMapping("/inventory")
@PreAuthorize("hasAuthority('inventory:read')")
public ResponseEntity<List<Inventory>> getInventory() {
    return ResponseEntity.ok(inventoryService.getAll());
}

@PostMapping("/inventory")
@PreAuthorize("hasAuthority('inventory:create')")
public ResponseEntity<Inventory> createInventory(@RequestBody Inventory inventory) {
    return ResponseEntity.ok(inventoryService.create(inventory));
}
```

---

## Multi-Tenancy Support

Users are associated with:
- **Organization** (`orgId`) - Top-level tenant
- **Branch** (`branchId`) - Sub-tenant within organization

When making requests, the JWT token contains the user's `orgId` and `branchId`, which are automatically propagated to all downstream services via headers.

---

## Testing Authentication

### Using cURL

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "roles": ["ROLE_USER"]
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

#### Access Protected Endpoint
```bash
curl -X GET http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Token expired → Use refresh token
   - Invalid token → Re-login
   - Missing Authorization header

2. **403 Forbidden**
   - User doesn't have required role/permission
   - Check role assignments in database

3. **Token Validation Fails**
   - Ensure JWT secret matches between Identity Service and API Gateway
   - Check token expiration settings

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone_number VARCHAR(50),
  org_id BIGINT,
  branch_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### Roles Table
```sql
CREATE TABLE roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(500)
);
```

### Permissions Table
```sql
CREATE TABLE permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(500),
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL
);
```

### User-Roles Join Table
```sql
CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### Role-Permissions Join Table
```sql
CREATE TABLE role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);
```

---

## Production Considerations

1. **JWT Secret**: Use a strong, randomly generated secret (minimum 256 bits)
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiration**: Adjust based on security requirements
4. **Refresh Token Rotation**: Consider implementing refresh token rotation
5. **Rate Limiting**: Add rate limiting to authentication endpoints
6. **Account Lockout**: Implement account lockout after failed login attempts
7. **Password Policy**: Enforce strong password requirements
8. **Two-Factor Authentication**: Consider adding 2FA for sensitive roles

---

**Last Updated**: February 14, 2026  
**Version**: 1.0
