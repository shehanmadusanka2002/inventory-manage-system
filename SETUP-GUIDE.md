# Inventory Management System - Setup Guide

## Prerequisites Installation

### 1. Install Java 17
- Download from: https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.exe
- Set JAVA_HOME environment variable
- Add Java to PATH

### 2. Install Maven
- Download from: https://maven.apache.org/download.cgi
- Extract to C:\Program Files\Maven
- Add to PATH: C:\Program Files\Maven\bin

### 3. Install MySQL 8.0
- Download from: https://dev.mysql.com/downloads/mysql/
- Set root password as: root123
- Start MySQL service

### 4. Install Node.js 18+
- Download from: https://nodejs.org/
- Install using default settings

## Database Setup

Open MySQL Workbench or command line and run:

```sql
CREATE DATABASE product_db;
CREATE DATABASE inventory_db;
CREATE DATABASE order_db;
CREATE DATABASE warehouse_db;
CREATE DATABASE supplier_db;
CREATE DATABASE user_db;
CREATE DATABASE notification_db;
```

## Building the Project

### Option 1: Build All Services
```powershell
.\build-all.ps1
```

### Option 2: Build Individually
```powershell
cd service-discovery
mvn clean package -DskipTests
cd ..

cd api-gateway
mvn clean package -DskipTests
cd ..

# Repeat for other services...
```

## Running the Application

### Option 1: Start All Services (Recommended)
```powershell
.\start-all.ps1
```

This will start all services in order:
1. Service Discovery (Eureka) - Port 8761
2. API Gateway - Port 8080
3. All microservices (Ports 8081-8087)

Wait 2-3 minutes for all services to start.

### Option 2: Start with Docker
```powershell
docker-compose up -d
```

### Start Frontend
```powershell
.\start-frontend.ps1
```

Or manually:
```powershell
cd inventory-frontend
npm install
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761

## Service Ports

- Service Discovery: 8761
- API Gateway: 8080
- Product Service: 8081
- Inventory Service: 8082
- Order Service: 8083
- Warehouse Service: 8084
- Supplier Service: 8085
- User Service: 8086
- Notification Service: 8087

## API Endpoints

All services are accessed through the API Gateway (port 8080):

- Products: http://localhost:8080/api/products
- Inventory: http://localhost:8080/api/inventory
- Orders: http://localhost:8080/api/orders
- Warehouses: http://localhost:8080/api/warehouses
- Suppliers: http://localhost:8080/api/suppliers
- Users: http://localhost:8080/api/users
- Notifications: http://localhost:8080/api/notifications

## Troubleshooting

### Service won't start
- Check if the port is already in use
- Verify MySQL is running
- Check JAVA_HOME is set correctly

### Can't connect to database
- Verify MySQL is running on port 3306
- Check database credentials in application.properties
- Ensure all databases are created

### Eureka registration issues
- Wait 30 seconds after starting Service Discovery
- Check service-discovery is running on port 8761

### Frontend can't connect to backend
- Verify API Gateway is running on port 8080
- Check .env file in inventory-frontend folder

## Development Tips

### Hot Reload
- Frontend: Vite automatically reloads changes
- Backend: Use Spring Boot DevTools or restart service

### View Logs
Each service runs in its own terminal window. Check the terminal for logs and errors.

### Testing APIs
Use Postman or curl to test endpoints:
```bash
curl http://localhost:8080/api/products
```

## Stopping Services

### Stop All Services
- Close all PowerShell windows running services
- Or: Find and kill all Java processes

### With Docker
```powershell
docker-compose down
```

## Production Deployment

### Build for Production
```powershell
# Backend
.\build-all.ps1

# Frontend
cd inventory-frontend
npm run build
```

### Deploy with Docker
```powershell
docker-compose up -d
```

## Support

For issues or questions:
1. Check the logs in terminal windows
2. Verify all prerequisites are installed
3. Ensure all databases are created
4. Check firewall settings for ports 8080-8087, 8761, 3306, 5173
