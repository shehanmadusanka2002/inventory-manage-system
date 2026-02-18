package com.inventory.product.repository;

import com.inventory.product.model.PharmacyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyProductRepository extends JpaRepository<PharmacyProduct, Long> {
    
    Optional<PharmacyProduct> findByProductId(Long productId);
    
    List<PharmacyProduct> findByBatchNumber(String batchNumber);
    
    List<PharmacyProduct> findByOrgId(Long orgId);
    
    // Expiry Management
    List<PharmacyProduct> findByExpiryDateBefore(LocalDate date);
    
    List<PharmacyProduct> findByExpiryDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT p FROM PharmacyProduct p WHERE p.expiryDate <= :date AND p.isExpired = false")
    List<PharmacyProduct> findExpiringProducts(@Param("date") LocalDate date);
    
    @Query("SELECT p FROM PharmacyProduct p WHERE p.daysUntilExpiry <= :days AND p.daysUntilExpiry > 0")
    List<PharmacyProduct> findProductsExpiringWithinDays(@Param("days") Integer days);
    
    List<PharmacyProduct> findByIsExpiredTrue();
    
    // Prescription Management
    List<PharmacyProduct> findByIsPrescriptionRequired(Boolean required);
    
    List<PharmacyProduct> findByPrescriptionType(String type);
    
    List<PharmacyProduct> findByControlledSubstanceSchedule(String schedule);
    
    // Drug Information
    List<PharmacyProduct> findByActiveIngredient(String ingredient);
    
    List<PharmacyProduct> findByDrugClass(String drugClass);
    
    // Recall Management
    List<PharmacyProduct> findByIsRecalledTrue();
    
    List<PharmacyProduct> findByOrgIdAndIsRecalledTrue(Long orgId);
    
    // Storage Conditions
    List<PharmacyProduct> findByRequiresRefrigerationTrue();
}
