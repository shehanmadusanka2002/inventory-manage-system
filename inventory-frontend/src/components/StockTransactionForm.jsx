import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    submitStockTransaction,
    fetchCurrentStock,
    resetTransactionState,
    clearCurrentStock,
} from '../store/stockSlice';
import { productService, warehouseService } from '../services/api';
import './StockTransactionForm.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRANSACTION_TYPES = [
    { value: 'IN', label: 'Stock In', icon: '📥', description: 'Receive goods' },
    { value: 'OUT', label: 'Stock Out', icon: '📤', description: 'Dispatch goods' },
    { value: 'TRANSFER', label: 'Transfer', icon: '🔄', description: 'Move between warehouses' },
    { value: 'ADJUSTMENT', label: 'Adjustment', icon: '⚖️', description: 'Correct discrepancy' },
];


// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
    productId: '',
    warehouseId: '',
    targetWarehouseId: '',
    transactionType: 'IN',
    quantity: '',
    referenceId: '',
};

const INITIAL_ERRORS = {
    productId: '',
    warehouseId: '',
    targetWarehouseId: '',
    quantity: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StockTransactionForm
 *
 * Props:
 *  - onClose    {Function}  Called when the modal should close.
 *  - onSuccess  {Function}  Called after a successful submission (optional).
 */
function StockTransactionForm({ onClose, onSuccess }) {
    const dispatch = useDispatch();

    // ── Redux state ──────────────────────────────────────────
    const { submitting, submitSuccess, submitError, currentStock, stockLoading } =
        useSelector((state) => state.stock);

    // ── Local state ──────────────────────────────────────────
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState(INITIAL_ERRORS);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState(null);

    // ── Fetch products & warehouses on mount ────────────────
    useEffect(() => {
        const loadData = async () => {
            setDataLoading(true);
            setDataError(null);
            try {
                const [productsRes, warehousesRes] = await Promise.all([
                    productService.getAll(),
                    warehouseService.getAll(),
                ]);
                // Normalise: support { id, name } or { id, productName } or { id, sku }
                const prods = (productsRes.data || []).map((p) => ({
                    id: p.id,
                    name: p.name || p.productName || p.sku || `Product #${p.id}`,
                }));
                const whs = (warehousesRes.data || []).map((w) => ({
                    id: w.id,
                    name: w.name || w.warehouseName || w.location || `Warehouse #${w.id}`,
                }));
                setProducts(prods);
                setWarehouses(whs);
            } catch (err) {
                console.error('Failed to load form data:', err);
                setDataError('Could not load products or warehouses. Please try again.');
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, []);

    // ── Derived values ───────────────────────────────────────
    const isOutOrTransfer = form.transactionType === 'OUT' || form.transactionType === 'TRANSFER';
    const isTransfer = form.transactionType === 'TRANSFER';
    const availableQty = currentStock?.availableQuantity ?? null;

    // ── Fetch current stock when product + warehouse change ──
    useEffect(() => {
        if (form.productId && form.warehouseId && isOutOrTransfer) {
            dispatch(fetchCurrentStock({
                productId: form.productId,
                warehouseId: form.warehouseId,
            }));
        } else {
            dispatch(clearCurrentStock());
        }
    }, [form.productId, form.warehouseId, form.transactionType, dispatch, isOutOrTransfer]);

    // ── Handle success ───────────────────────────────────────
    useEffect(() => {
        if (submitSuccess) {
            onSuccess?.();
            // Auto-close after 2 seconds
            const timer = setTimeout(() => {
                dispatch(resetTransactionState());
                onClose?.();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [submitSuccess, dispatch, onClose, onSuccess]);

    // ── Cleanup on unmount ───────────────────────────────────
    useEffect(() => {
        return () => {
            dispatch(resetTransactionState());
            dispatch(clearCurrentStock());
        };
    }, [dispatch]);

    // ── Handlers ─────────────────────────────────────────────
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            // Reset target warehouse when switching away from TRANSFER
            if (name === 'transactionType' && value !== 'TRANSFER') {
                next.targetWarehouseId = '';
            }
            return next;
        });
        // Clear field error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    const handleTypeSelect = useCallback((type) => {
        setForm((prev) => ({
            ...prev,
            transactionType: type,
            targetWarehouseId: type !== 'TRANSFER' ? '' : prev.targetWarehouseId,
        }));
        setErrors((prev) => ({ ...prev, targetWarehouseId: '' }));
    }, []);

    // ── Validation ───────────────────────────────────────────
    const validate = () => {
        const newErrors = { ...INITIAL_ERRORS };
        let valid = true;

        if (!form.productId) {
            newErrors.productId = 'Please select a product';
            valid = false;
        }

        if (!form.warehouseId) {
            newErrors.warehouseId = 'Please select a source warehouse';
            valid = false;
        }

        if (isTransfer) {
            if (!form.targetWarehouseId) {
                newErrors.targetWarehouseId = 'Please select a target warehouse';
                valid = false;
            } else if (form.targetWarehouseId === form.warehouseId) {
                newErrors.targetWarehouseId = 'Target warehouse must differ from source';
                valid = false;
            }
        }

        const qty = parseFloat(form.quantity);
        if (!form.quantity || isNaN(qty) || qty <= 0) {
            newErrors.quantity = 'Quantity must be a positive number';
            valid = false;
        } else if (isOutOrTransfer && availableQty !== null && qty > availableQty) {
            newErrors.quantity = `Insufficient stock — only ${availableQty} units available`;
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            productId: Number(form.productId),
            warehouseId: Number(form.warehouseId),
            type: form.transactionType,
            quantity: parseFloat(form.quantity),
            referenceId: form.referenceId.trim() || null,
            ...(isTransfer && { toWarehouseId: Number(form.targetWarehouseId) }),
        };

        dispatch(submitStockTransaction(payload));
    };

    // ── Stock badge helper ───────────────────────────────────
    const getStockBadge = () => {
        if (!isOutOrTransfer || !form.productId || !form.warehouseId) return null;
        if (stockLoading) {
            return (
                <div className="stf-stock-badge loading">
                    <div className="stf-spinner" /> Checking stock…
                </div>
            );
        }
        if (availableQty === null) return null;

        const qty = parseFloat(form.quantity) || 0;
        const status = availableQty === 0 ? 'danger' : qty > availableQty ? 'danger' : availableQty < 20 ? 'warning' : 'ok';
        const icons = { ok: '✅', warning: '⚠️', danger: '❌' };

        return (
            <div className={`stf-stock-badge ${status}`}>
                {icons[status]} Available: <strong>{availableQty} units</strong>
                {qty > 0 && ` · After: ${Math.max(0, availableQty - qty)} units`}
            </div>
        );
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="stf-overlay" role="dialog" aria-modal="true" aria-labelledby="stf-title">
            <div className="stf-container">

                {/* ── Data load error banner ── */}
                {dataError && (
                    <div className="stf-alert error" style={{ margin: '16px 28px 0', borderRadius: '10px' }}>
                        <span className="stf-alert-icon">⚠️</span>
                        {dataError}
                    </div>
                )}

                {/* ── Header ── */}
                <div className="stf-header">
                    <div className="stf-header-info">
                        <div className="stf-header-icon">📦</div>
                        <div>
                            <h2 id="stf-title">Stock Transaction</h2>
                            <p>Record inventory movement across warehouses</p>
                        </div>
                    </div>
                    <button
                        className="stf-close-btn"
                        onClick={onClose}
                        type="button"
                        aria-label="Close form"
                    >
                        ×
                    </button>
                </div>

                {/* ── Form ── */}
                <form className="stf-form" onSubmit={handleSubmit} noValidate>

                    {/* ── Success / Error Alerts ── */}
                    {submitSuccess && (
                        <div className="stf-alert success" role="status">
                            <span className="stf-alert-icon">✅</span>
                            Transaction submitted successfully! Closing…
                        </div>
                    )}
                    {submitError && (
                        <div className="stf-alert error" role="alert">
                            <span className="stf-alert-icon">❌</span>
                            {submitError}
                        </div>
                    )}

                    {/* ── Section 1: Transaction Type ── */}
                    <div className="stf-section">
                        <div className="stf-section-header">
                            <span className="section-icon">🔀</span>
                            <h3>Transaction Type</h3>
                        </div>
                        <div className="stf-section-body">
                            <div className="stf-type-grid" role="group" aria-label="Transaction type">
                                {TRANSACTION_TYPES.map(({ value, label, icon, description }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        id={`stf-type-${value}`}
                                        className={`stf-type-btn ${form.transactionType === value ? `active-${value}` : ''}`}
                                        onClick={() => handleTypeSelect(value)}
                                        aria-pressed={form.transactionType === value}
                                        title={description}
                                    >
                                        <span className="type-icon">{icon}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Product & Warehouse ── */}
                    <div className="stf-section">
                        <div className="stf-section-header">
                            <span className="section-icon">🏭</span>
                            <h3>Product &amp; Location</h3>
                        </div>
                        <div className="stf-section-body">

                            {/* Product */}
                            <div className="stf-row full">
                                <div className="stf-group">
                                    <label className="stf-label" htmlFor="stf-product">
                                        <span className="lbl-icon">📦</span>
                                        Product
                                        <span className="required-star">*</span>
                                    </label>
                                    <select
                                        id="stf-product"
                                        name="productId"
                                        className={`stf-select ${errors.productId ? 'has-error' : ''}`}
                                        value={form.productId}
                                        onChange={handleChange}
                                        disabled={submitting || submitSuccess || dataLoading}
                                    >
                                        {dataLoading
                                            ? <option value="">⏳ Loading products…</option>
                                            : <option value="">— Select a product —</option>
                                        }
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {errors.productId && (
                                        <span className="stf-error-msg" role="alert">{errors.productId}</span>
                                    )}
                                </div>
                            </div>

                            {/* Source Warehouse */}
                            <div className="stf-row" style={{ marginTop: '16px' }}>
                                <div className="stf-group">
                                    <label className="stf-label" htmlFor="stf-warehouse">
                                        <span className="lbl-icon">🏢</span>
                                        {isTransfer ? 'Source Warehouse' : 'Warehouse'}
                                        <span className="required-star">*</span>
                                    </label>
                                    <select
                                        id="stf-warehouse"
                                        name="warehouseId"
                                        className={`stf-select ${errors.warehouseId ? 'has-error' : ''}`}
                                        value={form.warehouseId}
                                        onChange={handleChange}
                                        disabled={submitting || submitSuccess || dataLoading}
                                    >
                                        {dataLoading
                                            ? <option value="">⏳ Loading warehouses…</option>
                                            : <option value="">— Select warehouse —</option>
                                        }
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {errors.warehouseId && (
                                        <span className="stf-error-msg" role="alert">{errors.warehouseId}</span>
                                    )}
                                </div>

                                {/* Target Warehouse (TRANSFER only) */}
                                {isTransfer && (
                                    <div className="stf-group">
                                        <label className="stf-label" htmlFor="stf-target-warehouse">
                                            <span className="lbl-icon">🏭</span>
                                            Target Warehouse
                                            <span className="required-star">*</span>
                                        </label>
                                        <select
                                            id="stf-target-warehouse"
                                            name="targetWarehouseId"
                                            className={`stf-select ${errors.targetWarehouseId ? 'has-error' : ''}`}
                                            value={form.targetWarehouseId}
                                            onChange={handleChange}
                                            disabled={submitting || submitSuccess || dataLoading}
                                        >
                                            {dataLoading
                                                ? <option value="">⏳ Loading warehouses…</option>
                                                : <option value="">— Select target —</option>
                                            }
                                            {warehouses
                                                .filter((w) => String(w.id) !== String(form.warehouseId))
                                                .map((w) => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                        </select>
                                        {errors.targetWarehouseId && (
                                            <span className="stf-error-msg" role="alert">{errors.targetWarehouseId}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Transfer arrow indicator */}
                            {isTransfer && form.warehouseId && form.targetWarehouseId && (
                                <div className="stf-transfer-arrow" aria-hidden="true">⬇️</div>
                            )}

                            {/* Live stock badge */}
                            {getStockBadge()}

                        </div>
                    </div>

                    {/* ── Section 3: Quantity & Reference ── */}
                    <div className="stf-section">
                        <div className="stf-section-header">
                            <span className="section-icon">🔢</span>
                            <h3>Quantity &amp; Reference</h3>
                        </div>
                        <div className="stf-section-body">
                            <div className="stf-row">

                                {/* Quantity */}
                                <div className="stf-group">
                                    <label className="stf-label" htmlFor="stf-quantity">
                                        <span className="lbl-icon">🔢</span>
                                        Quantity
                                        <span className="required-star">*</span>
                                    </label>
                                    <input
                                        id="stf-quantity"
                                        type="number"
                                        name="quantity"
                                        className={`stf-input ${errors.quantity ? 'has-error' : ''}`}
                                        value={form.quantity}
                                        onChange={handleChange}
                                        placeholder="e.g. 50"
                                        min="0.01"
                                        step="any"
                                        disabled={submitting || submitSuccess}
                                    />
                                    {errors.quantity && (
                                        <span className="stf-error-msg" role="alert">{errors.quantity}</span>
                                    )}
                                </div>

                                {/* Reference ID */}
                                <div className="stf-group">
                                    <label className="stf-label" htmlFor="stf-reference">
                                        <span className="lbl-icon">🔖</span>
                                        Reference ID
                                        <span className="optional-tag">(optional)</span>
                                    </label>
                                    <input
                                        id="stf-reference"
                                        type="text"
                                        name="referenceId"
                                        className="stf-input"
                                        value={form.referenceId}
                                        onChange={handleChange}
                                        placeholder="e.g. PO-2026-001"
                                        disabled={submitting || submitSuccess}
                                    />
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="stf-actions">
                        <button
                            type="button"
                            className="stf-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="stf-submit-btn"
                            className="stf-btn-submit"
                            disabled={submitting || submitSuccess}
                        >
                            {submitting ? (
                                <>
                                    <div className="stf-spinner" aria-hidden="true" />
                                    Processing…
                                </>
                            ) : submitSuccess ? (
                                <>✅ Done!</>
                            ) : (
                                <>
                                    📤 Submit Transaction
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default StockTransactionForm;
