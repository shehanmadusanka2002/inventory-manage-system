import { useEffect, useState, useCallback } from 'react';
import apiClient, { orderService, supplierService, productService, warehouseService } from '../services/api';
import PurchaseOrdersTable from '../components/PurchaseOrdersTable';

// ── Initial form states ────────────────────────────────────────────────────────
const INIT_PO = {
  supplierId: '',
  warehouseId: '',
  notes: '',
  items: [{ productId: '', productName: '', quantity: '', unitPrice: '' }],
};

const INIT_SO = {
  customerName: '',
  warehouseId: '',
  notes: '',
  items: [{ productId: '', productName: '', quantity: '', unitPrice: '' }],
};

// ── Shared modal overlay style ─────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px',
};

const modalStyle = {
  background: '#fff', borderRadius: '16px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
  width: '100%', maxWidth: '620px',
  maxHeight: '90vh', overflowY: 'auto',
  fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
};

const fieldStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: '8px',
  fontSize: '13.5px', fontFamily: 'inherit',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.18s',
};

const labelStyle = {
  display: 'block', fontSize: '12px',
  fontWeight: 700, color: '#64748b',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

// ── Create Purchase Order Modal ────────────────────────────────────────────────
function CreatePurchaseOrderModal({ suppliers, onClose, onCreated }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);

  // Fetch products & warehouses when modal opens
  useEffect(() => {
    // Get orgId from logged-in user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    productService.getAll()
      .then(res => {
        const prods = (res.data || []).map(p => ({
          id: p.id,
          name: p.name || p.productName || p.sku || `Product #${p.id}`,
        }));
        setAvailableProducts(prods);
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setProductsLoading(false));

    const warehouseFetch = orgId
      ? warehouseService.getByOrganization(orgId)
      : warehouseService.getAll();
    warehouseFetch
      .then(res => setAvailableWarehouses(res.data || []))
      .catch(err => console.error('Failed to load warehouses:', err))
      .finally(() => setWarehousesLoading(false));
  }, []);

  const [form, setForm] = useState(INIT_PO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  // When a product is selected, store both id and name
  const handleProductSelect = (idx, productId) => {
    const product = availableProducts.find(p => String(p.id) === String(productId));
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        productId: product ? product.id : '',
        productName: product ? product.name : '',
      };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { productId: '', productName: '', quantity: '', unitPrice: '' }] }));

  const removeItem = (idx) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const computedTotal = form.items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) { setError('Please select a supplier.'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse.'); return; }
    if (form.items.some(it => !it.productId || !it.quantity || !it.unitPrice)) {
      setError('Please fill in all item fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const payload = {
        supplierId: Number(form.supplierId),
        warehouseId: Number(form.warehouseId),
        notes: form.notes.trim() || null,
        items: form.items.map(it => ({
          productId: Number(it.productId),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };
      await orderService.createPurchaseOrder(payload);
      onCreated('Purchase order created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>🛒 Create Purchase Order</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>Order will be created with status PENDING</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 28px 28px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
              ❌ {error}
            </div>
          )}

          {/* Supplier */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Supplier *</label>
            <select
              style={fieldStyle}
              value={form.supplierId}
              onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}
              required
            >
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Warehouse */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Warehouse *</label>
            <select
              style={{ ...fieldStyle, color: form.warehouseId ? '#1e293b' : '#94a3b8' }}
              value={form.warehouseId}
              onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}
              required
              disabled={warehousesLoading}
            >
              <option value="">
                {warehousesLoading ? '⏳ Loading warehouses…' : '— Select warehouse —'}
              </option>
              {availableWarehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name || w.warehouseName || `Warehouse #${w.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Order Items *</label>
              <button type="button" onClick={addItem} style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: '7px', padding: '4px 12px', cursor: 'pointer' }}>
                + Add Item
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              {['Product Name', 'Qty', 'Unit Price ($)'].map(h => (
                <div key={h} style={{ flex: h === 'Product Name' ? 2 : 1, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
              <div style={{ width: '28px' }} />
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>

                {/* Product Name Dropdown */}
                <select
                  style={{ ...fieldStyle, flex: 2, color: item.productId ? '#1e293b' : '#94a3b8' }}
                  value={item.productId}
                  onChange={e => handleProductSelect(idx, e.target.value)}
                  required
                  disabled={productsLoading}
                >
                  <option value="">
                    {productsLoading ? '⏳ Loading products…' : '— Select product —'}
                  </option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <input style={{ ...fieldStyle, flex: 1 }} type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                <input style={{ ...fieldStyle, flex: 1 }} type="number" placeholder="Price" min="0.01" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: form.items.length === 1 ? '#f1f5f9' : '#fee2e2', color: form.items.length === 1 ? '#cbd5e1' : '#dc2626', cursor: form.items.length === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  ×
                </button>
              </div>
            ))}

            {/* Computed total */}
            <div style={{ textAlign: 'right', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              Total: <span style={{ color: '#4f46e5' }}>${computedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(optional)</span></label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: '70px' }} placeholder="e.g. Urgent delivery required…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '10px 24px', borderRadius: '9px', border: 'none', background: submitting ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '13.5px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitting ? '⏳ Creating…' : '🛒 Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Sales Order Modal ───────────────────────────────────────────────────
function CreateSalesOrderModal({ onClose, onCreated }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [form, setForm] = useState(INIT_SO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch products & warehouses when modal opens
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    productService.getAll()
      .then(res => {
        const prods = (res.data || []).map(p => ({
          id: p.id,
          name: p.name || p.productName || p.sku || `Product #${p.id}`,
        }));
        setAvailableProducts(prods);
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setProductsLoading(false));

    const warehouseFetch = orgId
      ? warehouseService.getByOrganization(orgId)
      : warehouseService.getAll();
    warehouseFetch
      .then(res => setAvailableWarehouses(res.data || []))
      .catch(err => console.error('Failed to load warehouses:', err))
      .finally(() => setWarehousesLoading(false));
  }, []);

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  // When a product is selected, store both id and name
  const handleProductSelect = (idx, productId) => {
    const product = availableProducts.find(p => String(p.id) === String(productId));
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        productId: product ? product.id : '',
        productName: product ? product.name : '',
      };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { productId: '', productName: '', quantity: '', unitPrice: '' }] }));

  const removeItem = (idx) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const computedTotal = form.items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { setError('Please enter a customer name.'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse.'); return; }
    if (form.items.some(it => !it.productId || !it.quantity || !it.unitPrice)) {
      setError('Please select a product and fill in quantity and unit price for all items.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const payload = {
        customerName: form.customerName.trim(),
        warehouseId: Number(form.warehouseId),
        notes: form.notes.trim() || null,
        totalAmount: computedTotal,
        items: form.items.map(it => ({
          productId: Number(it.productId),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };
      await orderService.createSalesOrder(payload);
      onCreated('Sales order created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'Failed to create sales order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>💰 Create Sales Order</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>Record a new customer sale</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 28px 28px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
              ❌ {error}
            </div>
          )}

          {/* Customer Name */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Customer Name *</label>
            <input style={fieldStyle} type="text" placeholder="e.g. Acme Corp" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} required />
          </div>

          {/* Warehouse */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Warehouse *</label>
            <select
              style={{ ...fieldStyle, color: form.warehouseId ? '#1e293b' : '#94a3b8' }}
              value={form.warehouseId}
              onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}
              required
              disabled={warehousesLoading}
            >
              <option value="">
                {warehousesLoading ? '⏳ Loading warehouses…' : '— Select warehouse —'}
              </option>
              {availableWarehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name || w.warehouseName || `Warehouse #${w.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Order Items *</label>
              <button type="button" onClick={addItem} style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.08)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: '7px', padding: '4px 12px', cursor: 'pointer' }}>
                + Add Item
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              {['Product Name', 'Qty', 'Unit Price ($)'].map(h => (
                <div key={h} style={{ flex: h === 'Product Name' ? 2 : 1, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
              <div style={{ width: '28px' }} />
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>

                {/* Product Name Dropdown */}
                <select
                  style={{ ...fieldStyle, flex: 2, color: item.productId ? '#1e293b' : '#94a3b8' }}
                  value={item.productId}
                  onChange={e => handleProductSelect(idx, e.target.value)}
                  required
                  disabled={productsLoading}
                >
                  <option value="">
                    {productsLoading ? '⏳ Loading products…' : '— Select product —'}
                  </option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <input style={{ ...fieldStyle, flex: 1 }} type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                <input style={{ ...fieldStyle, flex: 1 }} type="number" placeholder="Price" min="0.01" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: form.items.length === 1 ? '#f1f5f9' : '#fee2e2', color: form.items.length === 1 ? '#cbd5e1' : '#dc2626', cursor: form.items.length === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  ×
                </button>
              </div>
            ))}

            <div style={{ textAlign: 'right', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              Total: <span style={{ color: '#059669' }}>${computedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(optional)</span></label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: '70px' }} placeholder="e.g. Rush delivery…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '10px 24px', borderRadius: '9px', border: 'none', background: submitting ? '#6ee7b7' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: '13.5px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitting ? '⏳ Creating…' : '💰 Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Orders Page ───────────────────────────────────────────────────────────
function Orders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchase');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreateSO, setShowCreateSO] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  // Helper: resolve productId → name
  const getProductName = (productId) => {
    const p = products.find(p => String(p.id) === String(productId));
    return p ? p.name : `Product #${productId}`;
  };

  // Helper: resolve warehouseId → name
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return null;
    const w = warehouses.find(w => String(w.id) === String(warehouseId));
    return w ? (w.name || w.warehouseName || `Warehouse #${warehouseId}`) : `Warehouse #${warehouseId}`;
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setActionError('');

    // Read the logged-in user's orgId from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    try {
      const [purchaseRes, salesRes, suppliersRes, productsRes, warehousesRes] = await Promise.allSettled([
        orderService.getPurchaseOrders(),
        orderService.getSalesOrders(),
        // Only load suppliers that belong to this organisation
        orgId
          ? supplierService.getByOrganization(orgId)
          : supplierService.getAll(),
        productService.getAll(),
        // Load warehouses for this organisation
        orgId
          ? warehouseService.getByOrganization(orgId)
          : warehouseService.getAll(),
      ]);
      if (purchaseRes.status === 'fulfilled') setPurchaseOrders(purchaseRes.value.data);
      if (salesRes.status === 'fulfilled') setSalesOrders(salesRes.value.data);
      if (warehousesRes.status === 'fulfilled') setWarehouses(warehousesRes.value.data || []);
      if (suppliersRes.status === 'fulfilled') {
        setSuppliers(
          (suppliersRes.value.data || []).map((s) => ({
            id: s.id,
            name: s.name || s.supplierName || s.companyName || `Supplier #${s.id}`,
          }))
        );
      }
      if (productsRes.status === 'fulfilled') {
        setProducts(
          (productsRes.value.data || []).map((p) => ({
            id: p.id,
            name: p.name || p.productName || p.sku || `Product #${p.id}`,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setActionError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3500);
  };

  // ── Action handlers ──────────────────────────────────────────────────────────
  const handleView = (order) => setViewOrder(order);

  const handleApprove = async (orderId) => {
    if (!window.confirm('Approve this purchase order?')) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/approve`);
      showSuccess(`Order #PO-${String(orderId).padStart(3, '0')} approved.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to approve order.'); }
  };

  const handleReceive = async (orderId) => {
    if (!window.confirm('Mark this order as RECEIVED?')) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/receive`);
      showSuccess(`Order #PO-${String(orderId).padStart(3, '0')} marked as received.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to mark order as received.'); }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this purchase order? This cannot be undone.')) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/cancel`);
      showSuccess(`Order #PO-${String(orderId).padStart(3, '0')} cancelled.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to cancel order.'); }
  };

  const handleComplete = async (orderId) => {
    if (!window.confirm('Mark this sales order as COMPLETED? Stock will be deducted automatically.')) return;
    try {
      await orderService.completeSalesOrder(orderId);
      showSuccess(`Sales Order #SO-${String(orderId).padStart(3, '0')} fulfilled — stock updated ✅`);
      fetchOrders();
    } catch (e) {
      setActionError(e.response?.data?.error || 'Failed to complete order. Check stock availability.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* View Order Modal */}
      {viewOrder && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setViewOrder(null)}>
          <div style={{ ...modalStyle, maxWidth: '480px' }}>
            {/* Header */}
            <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>🛒</span>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Purchase Order <span style={{ color: '#4f46e5' }}>#PO-{String(viewOrder.id).padStart(3, '0')}</span>
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                  Created {viewOrder.createdAt ? new Date(viewOrder.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <button onClick={() => setViewOrder(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1, marginTop: '-2px' }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 28px 28px' }}>
              {/* Status badge */}
              <div style={{ marginBottom: '20px' }}>
                {(() => {
                  const s = viewOrder.status;
                  const cfg = {
                    PENDING: { bg: '#fef9c3', color: '#854d0e', label: '⏳ Pending' },
                    APPROVED: { bg: '#dbeafe', color: '#1e40af', label: '✔ Approved' },
                    RECEIVED: { bg: '#dcfce7', color: '#166534', label: '📦 Received' },
                    CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: '✕ Cancelled' },
                  }[s] || { bg: '#f1f5f9', color: '#475569', label: s };
                  return (
                    <span style={{ display: 'inline-block', background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '12px', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.03em' }}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Detail rows */}
              {[
                { icon: '🏭', label: 'Supplier ID', value: `#${viewOrder.supplierId}` },
                { icon: '💰', label: 'Total Amount', value: `$${Number(viewOrder.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                { icon: '📋', label: 'Items', value: `${viewOrder.items?.length ?? 0} line item(s)` },
                { icon: '🏢', label: 'Org ID', value: viewOrder.orgId ?? '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', marginBottom: '8px', background: '#f8fafc', gap: '12px' }}>
                  <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>{value}</span>
                </div>
              ))}

              {/* Items breakdown if available */}
              {viewOrder.items?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Line Items</div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0', background: '#f1f5f9', padding: '8px 14px' }}>
                      {['Product', 'Qty', 'Price'].map(h => (
                        <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>
                    {viewOrder.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0', padding: '9px 14px', borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <span style={{ fontSize: '13px', color: '#334155' }}>{getProductName(item.productId)}</span>
                        <span style={{ fontSize: '13px', color: '#334155', paddingRight: '24px' }}>{item.quantity}</span>
                        <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600 }}>${Number(item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setViewOrder(null)}
                  style={{ padding: '10px 28px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modals */}
      {showCreatePO && (
        <CreatePurchaseOrderModal
          suppliers={suppliers}
          onClose={() => setShowCreatePO(false)}
          onCreated={(msg) => { showSuccess(msg); fetchOrders(); }}
        />
      )}
      {showCreateSO && (
        <CreateSalesOrderModal
          onClose={() => setShowCreateSO(false)}
          onCreated={(msg) => { showSuccess(msg); fetchOrders(); }}
        />
      )}

      <div className="page-header">
        <h1>Orders</h1>
        <p>Manage purchase and sales orders</p>
      </div>

      {/* Toasts */}
      {actionSuccess && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontWeight: 600, fontSize: '13.5px' }}>
          ✅ {actionSuccess}
        </div>
      )}
      {actionError && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontWeight: 600, fontSize: '13.5px' }}>
          ❌ {actionError}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', flexWrap: 'wrap' }}>

          {/* Tabs */}
          {[
            { key: 'purchase', label: '🛒 Purchase Orders', count: purchaseOrders.length },
            { key: 'sales', label: '💰 Sales Orders', count: salesOrders.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.18s',
              background: activeTab === key ? '#fff' : 'transparent',
              color: activeTab === key ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              {label}
              <span style={{
                background: activeTab === key ? 'rgba(99,102,241,0.12)' : '#e2e8f0',
                color: activeTab === key ? '#4f46e5' : '#64748b',
                fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px',
              }}>{count}</span>
            </button>
          ))}

          {/* ── Create buttons — shown only on the matching tab ── */}
          {activeTab === 'purchase' && (
            <button
              id="create-purchase-order-btn"
              onClick={() => setShowCreatePO(true)}
              style={{
                marginLeft: 'auto',
                padding: '8px 18px', borderRadius: '9px', border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.30)',
                transition: 'opacity 0.18s',
              }}
            >
              + Create Purchase Order
            </button>
          )}

          {activeTab === 'sales' && (
            <button
              id="create-sales-order-btn"
              onClick={() => setShowCreateSO(true)}
              style={{
                marginLeft: 'auto',
                padding: '8px 18px', borderRadius: '9px', border: 'none',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                boxShadow: '0 2px 8px rgba(16,185,129,0.30)',
                transition: 'opacity 0.18s',
              }}
            >
              + Create Sales Order
            </button>
          )}

          {/* Refresh */}
          <button onClick={fetchOrders} title="Refresh" style={{
            marginLeft: activeTab === 'purchase' || activeTab === 'sales' ? '8px' : 'auto',
            width: '36px', height: '36px',
            border: '1.5px solid #e2e8f0', borderRadius: '8px',
            background: '#fff', cursor: 'pointer', fontSize: '15px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔄</button>
        </div>

        {/* ── Purchase Orders tab ── */}
        {activeTab === 'purchase' && (
          <PurchaseOrdersTable
            orders={purchaseOrders}
            suppliers={suppliers}
            products={products}
            warehouses={warehouses}
            loading={loading}
            onView={handleView}
            onApprove={handleApprove}
            onReceive={handleReceive}
            onCancel={handleCancel}
          />
        )}

        {/* ── Sales Orders tab ── */}
        {activeTab === 'sales' && (
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳ Loading…</div>
            ) : salesOrders.length === 0 ? (
              <div style={{ padding: '56px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '44px', marginBottom: '12px' }}>💰</div>
                <p style={{ margin: 0, fontWeight: 500 }}>No sales orders yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Order ID', 'Customer', 'Products', 'Warehouse', 'Total Amount', 'Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map((order, idx) => {
                    const isPending = order.status === 'PENDING';
                    const soStatusCfg = {
                      PENDING: { bg: '#fef9c3', color: '#854d0e', icon: '⏳' },
                      CONFIRMED: { bg: '#dbeafe', color: '#1e40af', icon: '✔' },
                      DELIVERED: { bg: '#dcfce7', color: '#166534', icon: '🚚' },
                      CANCELLED: { bg: '#fee2e2', color: '#991b1b', icon: '✕' },
                      COMPLETED: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
                    }[order.status] || { bg: '#f1f5f9', color: '#475569', icon: '❓' };

                    return (
                      <tr key={order.id ?? idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Order ID */}
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: '#059669' }}>
                          #SO-{String(order.id).padStart(3, '0')}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '13px 16px' }}>{order.customerName || '—'}</td>

                        {/* Products */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                            {(order.items || []).length === 0 ? (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                            ) : (
                              (order.items || []).map((it, i) => (
                                <span key={i} style={{
                                  display: 'inline-block', background: '#f0fdf4', color: '#166534',
                                  fontSize: '11.5px', fontWeight: 600, padding: '2px 8px',
                                  borderRadius: '20px', whiteSpace: 'nowrap',
                                }}>
                                  {getProductName(it.productId)}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Warehouse */}
                        <td style={{ padding: '13px 16px' }}>
                          {order.warehouseId ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#eff6ff', color: '#1d4ed8',
                              fontSize: '11.5px', fontWeight: 600,
                              padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap',
                            }}>
                              🏭 {getWarehouseName(order.warehouseId)}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </td>

                        {/* Total */}
                        <td style={{ padding: '13px 16px', fontWeight: 700 }}>
                          ${Number(order.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '13px 16px', color: '#64748b' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-CA') : '—'}
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: soStatusCfg.bg, color: soStatusCfg.color,
                            fontWeight: 700, fontSize: '12px', padding: '4px 10px',
                            borderRadius: '20px', whiteSpace: 'nowrap',
                          }}>
                            {soStatusCfg.icon} {order.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 16px' }}>
                          {isPending && (
                            <button
                              onClick={() => handleComplete(order.id)}
                              style={{
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                color: '#fff', fontWeight: 700, fontSize: '12px',
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                boxShadow: '0 2px 6px rgba(16,185,129,0.30)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✅ Mark as Completed
                            </button>
                          )}
                          {!isPending && (
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
