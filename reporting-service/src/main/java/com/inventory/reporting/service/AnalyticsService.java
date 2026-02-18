package com.inventory.reporting.service;

import com.inventory.reporting.model.InventoryAnalytics;
import com.inventory.reporting.model.SalesAnalytics;
import com.inventory.reporting.repository.InventoryAnalyticsRepository;
import com.inventory.reporting.repository.SalesAnalyticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    
    @Autowired
    private InventoryAnalyticsRepository inventoryRepo;
    
    @Autowired
    private SalesAnalyticsRepository salesRepo;
    
    // Inventory Analytics
    public List<InventoryAnalytics> getInventoryAnalytics(Long orgId) {
        return inventoryRepo.findByOrgId(orgId);
    }
    
    public List<InventoryAnalytics> getLowStockProducts(Long orgId) {
        LocalDate today = LocalDate.now();
        return inventoryRepo.findByOrgIdAndDate(orgId, today).stream()
                .filter(InventoryAnalytics::getIsLowStock)
                .toList();
    }
    
    public Map<String, Object> getInventorySummary(Long orgId) {
        LocalDate today = LocalDate.now();
        Map<String, Object> summary = new HashMap<>();
        
        Double totalValue = inventoryRepo.getTotalStockValue(orgId, today);
        Long lowStockCount = inventoryRepo.getLowStockCount(orgId, today);
        List<InventoryAnalytics> allProducts = inventoryRepo.findByOrgIdAndDate(orgId, today);
        
        summary.put("totalStockValue", totalValue != null ? totalValue : 0.0);
        summary.put("lowStockCount", lowStockCount != null ? lowStockCount : 0L);
        summary.put("totalProducts", allProducts.size());
        summary.put("snapshotDate", today);
        
        return summary;
    }
    
    // Sales Analytics
    public List<SalesAnalytics> getSalesAnalytics(Long orgId) {
        return salesRepo.findByOrgId(orgId);
    }
    
    public Map<String, Object> getSalesSummary(Long orgId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> summary = new HashMap<>();
        
        BigDecimal totalSales = salesRepo.getTotalSalesByDateRange(orgId, startDate, endDate);
        Long totalOrders = salesRepo.getTotalOrdersByDateRange(orgId, startDate, endDate);
        
        summary.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        summary.put("totalOrders", totalOrders != null ? totalOrders : 0L);
        summary.put("averageOrderValue", 
                totalOrders > 0 && totalSales != null ? 
                        totalSales.divide(BigDecimal.valueOf(totalOrders), 2, BigDecimal.ROUND_HALF_UP) : 
                        BigDecimal.ZERO);
        summary.put("startDate", startDate);
        summary.put("endDate", endDate);
        
        return summary;
    }
    
    public Map<String, Object> getMonthlySales(Long orgId, String monthYear) {
        Map<String, Object> summary = new HashMap<>();
        
        BigDecimal totalSales = salesRepo.getTotalSalesByMonth(orgId, monthYear);
        List<SalesAnalytics> sales = salesRepo.findByMonthYear(monthYear);
        
        summary.put("month", monthYear);
        summary.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        summary.put("orderCount", sales.size());
        
        return summary;
    }
    
    public Map<String, Object> getDashboardMetrics(Long orgId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("inventory", getInventorySummary(orgId));
        metrics.put("salesThisMonth", getSalesSummary(orgId, monthStart, today));
        metrics.put("lowStockAlerts", getLowStockProducts(orgId).size());
        
        return metrics;
    }
}
