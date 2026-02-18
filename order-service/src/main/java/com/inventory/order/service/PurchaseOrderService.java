package com.inventory.order.service;

import com.inventory.order.dto.PurchaseOrderRequestDto;
import com.inventory.order.model.PurchaseOrder;
import com.inventory.order.model.PurchaseOrder.OrderStatus;
import com.inventory.order.model.PurchaseOrderItem;
import com.inventory.order.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PurchaseOrderService {

    /**
     * Single-owner system: all orders are automatically attributed to user ID 1.
     * Replace with a SecurityContext lookup when multi-user auth is added.
     */
    private static final Long OWNER_USER_ID = 1L;

    private final PurchaseOrderRepository purchaseOrderRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Create a new Purchase Order from the frontend DTO.
     *
     * Business rules applied here (NOT in the controller):
     * - status → always PENDING on creation
     * - createdBy → always OWNER_USER_ID (single-owner system)
     * - createdAt → set to now via @PrePersist on the entity
     * - totalAmount → computed from line items if not provided by the client
     */
    public PurchaseOrder createOrder(PurchaseOrderRequestDto dto) {
        log.info("Creating purchase order for supplierId={}, orgId={}", dto.getSupplierId(), dto.getOrgId());

        PurchaseOrder order = new PurchaseOrder();

        // ── Business-rule fields (never from the client) ──────────────────────
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedBy(OWNER_USER_ID);
        order.setCreatedAt(LocalDateTime.now());

        // ── Client-supplied fields ────────────────────────────────────────────
        order.setSupplierId(dto.getSupplierId());
        order.setWarehouseId(dto.getWarehouseId());
        order.setOrgId(dto.getOrgId());

        // ── Build line items ──────────────────────────────────────────────────
        List<PurchaseOrderItem> items = new ArrayList<>();
        BigDecimal computedTotal = BigDecimal.ZERO;

        if (dto.getItems() != null) {
            for (PurchaseOrderRequestDto.OrderItemDto itemDto : dto.getItems()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setProductId(itemDto.getProductId());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitPrice(itemDto.getUnitPrice());
                item.setPurchaseOrder(order); // set back-reference for FK
                items.add(item);

                // Accumulate total: qty × unitPrice
                if (itemDto.getUnitPrice() != null && itemDto.getQuantity() != null) {
                    computedTotal = computedTotal.add(
                            itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
                }
            }
        }

        order.setItems(items);

        // Use client-provided total if given, otherwise use the computed value
        order.setTotalAmount(
                dto.getTotalAmount() != null ? dto.getTotalAmount() : computedTotal);

        PurchaseOrder saved = purchaseOrderRepository.save(order);
        log.info("Purchase order created successfully: id={}, total={}", saved.getId(), saved.getTotalAmount());
        return saved;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }

    public List<PurchaseOrder> getOrdersByOrg(Long orgId) {
        return purchaseOrderRepository.findByOrgId(orgId);
    }

    public List<PurchaseOrder> getOrdersBySupplier(Long supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }

    public Optional<PurchaseOrder> getOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }

    // ── Status transitions ────────────────────────────────────────────────────

    /**
     * Approve a PENDING order → APPROVED.
     * Throws if the order is not in PENDING state.
     */
    public PurchaseOrder approveOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING orders can be approved. Current status: " + order.getStatus());
        }
        order.setStatus(OrderStatus.APPROVED);
        log.info("Purchase order {} approved", id);
        return purchaseOrderRepository.save(order);
    }

    /**
     * Mark an APPROVED order as RECEIVED (goods delivered).
     */
    public PurchaseOrder receiveOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException(
                    "Only APPROVED orders can be received. Current status: " + order.getStatus());
        }
        order.setStatus(OrderStatus.RECEIVED);
        log.info("Purchase order {} marked as RECEIVED", id);
        return purchaseOrderRepository.save(order);
    }

    /**
     * Cancel a PENDING or APPROVED order.
     */
    public PurchaseOrder cancelOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() == OrderStatus.RECEIVED) {
            throw new IllegalStateException("Cannot cancel an already RECEIVED order.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        log.info("Purchase order {} cancelled", id);
        return purchaseOrderRepository.save(order);
    }
}
