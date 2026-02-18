# 🚀 How to Start All Backend Services

There are **3 methods** to start all backend microservices. Choose based on your preference:

---

## Method 1: Automated PowerShell Script ⚡ (RECOMMENDED)

This script starts all 12 microservices automatically with proper delays.

### Prerequisites
- MySQL running on port 3306
- Maven installed
- Java 17+ installed

### Steps

1. **Start MySQL Database** (if not already running):
   ```powershell
   # Option A: Using Docker
   docker run -d -p 3306:3306 --name inventory-mysql -e MYSQL_ROOT_PASSWORD=root123 -e MYSQL_DATABASE=inventory_db mysql:8.0
   
   # Option B: Using local MySQL (make sure it's running)
   # MySQL should be accessible at localhost:3306
   ```

2. **Run the start-all script**:
   ```powershell
   cd "c:\Users\Shehan\Desktop\inventory manage system"
   .\start-all.ps1
   ```

3. **Wait for all services to start** (~2-3 minutes total)
   - Each service opens in a new PowerShell window
   - Watch the windows for "Started [ServiceName]Application" messages

4. **Verify all services are running**:
   - Open Eureka Dashboard: http://localhost:8761
   - You should see all 11 services registered (excluding service-discovery itself)

### Service Startup Order (Automated)
```
1. Service Discovery (8761)    - 30 seconds wait
2. API Gateway (8080)           - 20 seconds wait
3. Product Service (8081)       - 10 seconds wait
4. Inventory Service (8082)     - 10 seconds wait
5. Order Service (8083)         - 10 seconds wait
6. Warehouse Service (8084)     - 10 seconds wait
7. Supplier Service (8085)      - 10 seconds wait
8. User Service (8086)          - 10 seconds wait
9. Notification Service (8087)  - 10 seconds wait
10. Identity Service (8088)     - 10 seconds wait
11. Catalog Service (8089)      - 10 seconds wait
12. Reporting Service (8090)    - 10 seconds wait
```

### Service URLs After Startup
```
Eureka Dashboard:     http://localhost:8761
API Gateway:          http://localhost:8080
Product Service:      http://localhost:8081
Inventory Service:    http://localhost:8082
Order Service:        http://localhost:8083
Warehouse Service:    http://localhost:8084
Supplier Service:     http://localhost:8085
User Service:         http://localhost:8086
Notification Service: http://localhost:8087
Identity Service:     http://localhost:8088
Catalog Service:      http://localhost:8089
Reporting Service:    http://localhost:8090
```

---

## Method 2: Docker Compose 🐳 (ONE COMMAND)

Start everything with Docker (including MySQL).

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed

### Steps

1. **Start all services with Docker Compose**:
   ```powershell
   cd "c:\Users\Shehan\Desktop\inventory manage system"
   docker-compose up -d
   ```

2. **Wait for services to be healthy** (~3-5 minutes):
   ```powershell
   # Check container status
   docker-compose ps
   
   # Watch logs (optional)
   docker-compose logs -f
   ```

3. **Verify**:
   - Eureka Dashboard: http://localhost:8761
   - API Gateway: http://localhost:8080

### Useful Docker Commands
```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# View logs for specific service
docker-compose logs -f product-service

# Restart specific service
docker-compose restart product-service

# View all running containers
docker ps
```

---

## Method 3: Manual Startup 🔧 (FULL CONTROL)

Start each service manually in separate terminal windows.

### Prerequisites
- MySQL running on port 3306
- Maven installed
- Java 17+ installed

### Steps

**Important:** Start services in this exact order!

#### 1. Service Discovery (MUST START FIRST)
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\service-discovery"
mvn spring-boot:run
```
Wait until you see: `Started ServiceDiscoveryApplication`
Then open Eureka at http://localhost:8761

#### 2. API Gateway (SECOND)
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\api-gateway"
mvn spring-boot:run
```
Wait until registered with Eureka.

#### 3. Business Services (Can start in parallel)

Open a new terminal for each:

**Product Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\product-service"
mvn spring-boot:run
```

**Inventory Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\inventory-service"
mvn spring-boot:run
```

**Order Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\order-service"
mvn spring-boot:run
```

**Warehouse Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\warehouse-service"
mvn spring-boot:run
```

**Supplier Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\supplier-service"
mvn spring-boot:run
```

**User Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\user-service"
mvn spring-boot:run
```

**Notification Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\notification-service"
mvn spring-boot:run
```

**Identity Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\identity-service"
mvn spring-boot:run
```

**Catalog Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\catalog-service"
mvn spring-boot:run
```

**Reporting Service:**
```powershell
cd "c:\Users\Shehan\Desktop\inventory manage system\reporting-service"
mvn spring-boot:run
```

---

## Verification Checklist ✅

After starting all services, verify:

### 1. Check Eureka Dashboard
- Visit http://localhost:8761
- Should see 11 registered instances:
  ```
  ✅ API-GATEWAY
  ✅ PRODUCT-SERVICE
  ✅ INVENTORY-SERVICE
  ✅ ORDER-SERVICE
  ✅ WAREHOUSE-SERVICE
  ✅ SUPPLIER-SERVICE
  ✅ USER-SERVICE
  ✅ NOTIFICATION-SERVICE
  ✅ IDENTITY-SERVICE
  ✅ CATALOG-SERVICE
  ✅ REPORTING-SERVICE
  ```

### 2. Test API Gateway
```powershell
# Health check
curl http://localhost:8080/actuator/health

# Test product service through gateway
curl http://localhost:8080/api/products
```

### 3. Check Individual Service Health
```powershell
curl http://localhost:8081/actuator/health  # Product Service
curl http://localhost:8082/actuator/health  # Inventory Service
curl http://localhost:8083/actuator/health  # Order Service
curl http://localhost:8084/actuator/health  # Warehouse Service
curl http://localhost:8085/actuator/health  # Supplier Service
curl http://localhost:8086/actuator/health  # User Service
curl http://localhost:8087/actuator/health  # Notification Service
curl http://localhost:8088/actuator/health  # Identity Service
curl http://localhost:8089/actuator/health  # Catalog Service
curl http://localhost:8090/actuator/health  # Reporting Service
```

---

## Troubleshooting 🔧

### Issue: Service won't start

**Check MySQL:**
```powershell
# Verify MySQL is running
mysql -u root -p
# Or check with Docker
docker ps | findstr mysql
```

**Check Port Conflicts:**
```powershell
# Check if ports are already in use
netstat -ano | findstr :8080  # API Gateway
netstat -ano | findstr :8761  # Eureka
# etc...
```

**Clean Maven Build:**
```powershell
cd service-name
mvn clean install
mvn spring-boot:run
```

### Issue: Service not registering with Eureka

1. Make sure Service Discovery started first
2. Wait 30 seconds after starting Service Discovery
3. Check service's application.properties for correct Eureka URL:
   ```properties
   eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
   ```

### Issue: "Port already in use"

**Find and kill process using port:**
```powershell
# Find process using port (e.g., 8080)
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Out of Memory

**Increase Maven memory:**
```powershell
$env:MAVEN_OPTS="-Xmx1024m"
mvn spring-boot:run
```

---

## Quick Reference Commands

### Stop All Services (PowerShell Script Method)
```powershell
# Find all Maven processes
Get-Process -Name "java" | Where-Object {$_.CommandLine -like "*spring-boot*"} | Stop-Process -Force

# Or close all PowerShell windows manually
```

### Stop All Services (Docker Method)
```powershell
docker-compose down
```

### Restart Single Service (PowerShell)
```powershell
# Stop the service (close its terminal window)
# Then start it again
cd service-name
mvn spring-boot:run
```

### Restart Single Service (Docker)
```powershell
docker-compose restart service-name
```

### View Logs
```powershell
# PowerShell method: Check the terminal window
# Docker method:
docker-compose logs -f service-name
```

---

## Performance Tips ⚡

### Reduce Startup Time

1. **Build all services first** (one time):
   ```powershell
   .\build-all.ps1
   ```

2. **Use JAR files instead of mvn spring-boot:run**:
   ```powershell
   # After building
   cd service-name\target
   java -jar service-name-1.0.0.jar
   ```

3. **Skip tests during build**:
   ```powershell
   mvn clean install -DskipTests
   ```

### Parallel Startup (Advanced)

After Service Discovery and API Gateway are running, you can start all business services simultaneously in separate terminals.

---

## Recommended Startup Sequence 🎯

**For Development:**
1. Use **Method 1 (PowerShell Script)** - easiest and most reliable
2. Let it run completely (~3 minutes)
3. Verify in Eureka Dashboard
4. Start frontend with `.\start-frontend.ps1`

**For Production:**
1. Use **Method 2 (Docker Compose)** - isolated and consistent
2. Configure environment variables in docker-compose.yml
3. Use docker-compose logs to monitor

**For Debugging:**
1. Use **Method 3 (Manual)** - full terminal visibility
2. Start only the services you need to debug
3. Easier to see detailed logs and errors

---

## Next Steps After Starting

Once all services are running:

1. **Start the Frontend:**
   ```powershell
   .\start-frontend.ps1
   # Or manually:
   cd inventory-frontend
   npm run dev
   ```

2. **Initialize the Database:**
   - Run the init-db.sql script if not already done
   - Create sample data using the API endpoints

3. **Test the System:**
   - Open frontend: http://localhost:5173
   - Login (after implementing identity-service authentication)
   - Test CRUD operations on each module

---

**Created:** February 14, 2026  
**Last Updated:** February 14, 2026
