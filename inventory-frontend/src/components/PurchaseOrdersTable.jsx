import { useState, useMemo } from 'react';
import './PurchaseOrdersTable.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_META = {
    PENDING: { label: 'Pending', icon: '🕐', cls: 'pot-badge-PENDING' },
    APPROVED: { label: 'Approved', icon: '✅', cls: 'pot-badge-APPROVED' },
    RECEIVED: { label: 'Received', icon: '📦', cls: 'pot-badge-RECEIVED' },
    CANCELLED: { label: 'Cancelled', icon: '❌', cls: 'pot-badge-CANCELLED' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value ?? 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

/** Returns the first 2 uppercase letters of a name for the avatar. */
const initials = (name = '') =>
    name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * PurchaseOrdersTable
 *
 * Props:
 *  orders       {Array}     List of purchase order objects from the backend.
 *  suppliers    {Array}     [{ id, name }] — used to resolve supplierId → name.
 *  onView       {Function}  (order) => void
 *  onApprove    {Function}  (orderId) => void
 *  onReceive    {Function}  (orderId) => void
 *  onCancel     {Function}  (orderId) => void
 *  loading      {Boolean}   Show skeleton while fetching.
 */
function PurchaseOrdersTable({
    orders = [],
    suppliers = [],
    products = [],
    warehouses = [],
    onView,
    onApprove,
    onReceive,
    onCancel,
    loading = false,
}) {
    const [search, setSearch] = useState('');

    // Build a quick id→name lookup for suppliers
    const supplierMap = useMemo(() => {
        const map = {};
        suppliers.forEach((s) => { map[s.id] = s.name; });
        return map;
    }, [suppliers]);

    // Build a quick id→name lookup for products
    const productMap = useMemo(() => {
        const map = {};
        products.forEach((p) => { map[String(p.id)] = p.name; });
        return map;
    }, [products]);

    // Build a quick id→name lookup for warehouses
    const warehouseMap = useMemo(() => {
        const map = {};
        warehouses.forEach((w) => {
            map[w.id] = w.name || w.warehouseName || `Warehouse #${w.id}`;
        });
        return map;
    }, [warehouses]);

    /** Resolve a list of order items to product name strings */
    const itemNames = (items = []) =>
        items.length === 0
            ? '—'
            : items.map((it) => productMap[String(it.productId)] || `#${it.productId}`).join(', ');

    // Filter rows by search (order id, supplier name, status)
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter((o) => {
            const supplierName = (supplierMap[o.supplierId] || `Supplier #${o.supplierId}`).toLowerCase();
            return (
                String(o.id).includes(q) ||
                supplierName.includes(q) ||
                (o.status || '').toLowerCase().includes(q)
            );
        });
    }, [orders, search, supplierMap]);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="pot-wrap">

            {/* Toolbar */}
            <div className="pot-toolbar">
                <div className="pot-search-wrap">
                    <span className="pot-search-icon">🔍</span>
                    <input
                        type="text"
                        className="pot-search"
                        placeholder="Search orders…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search purchase orders"
                    />
                </div>
                <span className="pot-count">
                    {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="pot-table-wrap">
                {loading ? (
                    <div className="pot-empty">
                        <div className="pot-empty-icon">⏳</div>
                        <p>Loading orders…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="pot-empty">
                        <div className="pot-empty-icon">📋</div>
                        <p>{search ? 'No orders match your search.' : 'No purchase orders yet.'}</p>
                    </div>
                ) : (
                    <table className="pot-table" aria-label="Purchase orders">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Supplier</th>
                                <th>Products</th>
                                <th>Warehouse</th>
                                <th>Date</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, idx) => {
                                const supplierName =
                                    supplierMap[order.supplierId] || `Supplier #${order.supplierId}`;
                                const statusMeta = STATUS_META[order.status] || {
                                    label: order.status,
                                    icon: '❓',
                                    cls: '',
                                };
                                const isPending = order.status === 'PENDING';
                                const isApproved = order.status === 'APPROVED';
                                const isDone = order.status === 'RECEIVED' || order.status === 'CANCELLED';

                                return (
                                    <tr key={order.id ?? idx}>

                                        {/* Order ID */}
                                        <td>
                                            <span className="pot-order-id">
                                                #PO-{String(order.id).padStart(3, '0')}
                                            </span>
                                        </td>

                                        {/* Supplier */}
                                        <td>
                                            <div className="pot-supplier">
                                                <div className="pot-supplier-avatar" aria-hidden="true">
                                                    {initials(supplierName)}
                                                </div>
                                                <span className="pot-supplier-name">{supplierName}</span>
                                            </div>
                                        </td>

                                        {/* Products */}
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
                                                {(order.items || []).length === 0 ? (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                ) : (
                                                    (order.items || []).map((it, i) => (
                                                        <span key={i} style={{
                                                            display: 'inline-block',
                                                            background: '#ede9fe',
                                                            color: '#5b21b6',
                                                            fontSize: '11.5px',
                                                            fontWeight: 600,
                                                            padding: '2px 8px',
                                                            borderRadius: '20px',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {productMap[String(it.productId)] || `#${it.productId}`}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>

                                        {/* Warehouse */}
                                        <td>
                                            {order.warehouseId ? (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: '#eff6ff',
                                                    color: '#1d4ed8',
                                                    fontSize: '11.5px',
                                                    fontWeight: 600,
                                                    padding: '3px 9px',
                                                    borderRadius: '20px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    🏭 {warehouseMap[order.warehouseId] || `Warehouse #${order.warehouseId}`}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td>
                                            <span className="pot-date">{formatDate(order.createdAt)}</span>
                                        </td>

                                        {/* Total Amount */}
                                        <td>
                                            <span className="pot-amount">
                                                {formatCurrency(order.totalAmount)}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td>
                                            <span className={`pot-badge ${statusMeta.cls}`}>
                                                {statusMeta.icon} {statusMeta.label}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="pot-actions">

                                                {/* View — always available */}
                                                <button
                                                    className="pot-btn pot-btn-view"
                                                    onClick={() => onView?.(order)}
                                                    title="View order details"
                                                >
                                                    👁 View
                                                </button>

                                                {/* Approve — only for PENDING */}
                                                {isPending && (
                                                    <button
                                                        className="pot-btn pot-btn-approve"
                                                        onClick={() => onApprove?.(order.id)}
                                                        title="Approve this order"
                                                    >
                                                        ✔ Approve
                                                    </button>
                                                )}

                                                {/* Receive — only for APPROVED */}
                                                {isApproved && (
                                                    <button
                                                        className="pot-btn pot-btn-receive"
                                                        onClick={() => onReceive?.(order.id)}
                                                        title="Mark as received"
                                                    >
                                                        📦 Receive
                                                    </button>
                                                )}

                                                {/* Cancel — for PENDING or APPROVED */}
                                                {!isDone && (
                                                    <button
                                                        className="pot-btn pot-btn-cancel"
                                                        onClick={() => onCancel?.(order.id)}
                                                        title="Cancel this order"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            {!loading && filtered.length > 0 && (
                <div className="pot-footer">
                    Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

export default PurchaseOrdersTable;
