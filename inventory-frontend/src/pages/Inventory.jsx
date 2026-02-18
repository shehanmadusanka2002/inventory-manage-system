import { useEffect, useState, useCallback } from 'react';
import { inventoryService } from '../services/api';
import StockTransactionForm from '../components/StockTransactionForm';
import './Inventory.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META = {
  IN: { label: 'Stock In', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '📥' },
  OUT: { label: 'Stock Out', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '📤' },
  TRANSFER: { label: 'Transfer', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🔄' },
  ADJUSTMENT: { label: 'Adjustment', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '⚖️' },
  RETURN: { label: 'Return', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: '↩️' },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { label: type, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📦' };
  return (
    <span className="inv-type-badge" style={{ color: meta.color, background: meta.bg }}>
      {meta.icon} {meta.label}
    </span>
  );
}

function StockLevelBar({ quantity, reorderLevel }) {
  if (!reorderLevel || reorderLevel === 0) return <span className="inv-qty">{quantity ?? 0}</span>;
  const pct = Math.min(100, Math.round((quantity / (reorderLevel * 3)) * 100));
  const color = quantity <= 0 ? '#ef4444' : quantity <= reorderLevel ? '#f59e0b' : '#22c55e';
  return (
    <div className="inv-stock-bar-wrap">
      <span className="inv-qty" style={{ color }}>{quantity ?? 0}</span>
      <div className="inv-stock-bar">
        <div className="inv-stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks');
  const [showForm, setShowForm] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stocksRes, txRes] = await Promise.all([
        inventoryService.getAllStocks(),
        inventoryService.getAllTransactions(),
      ]);
      setStocks(stocksRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────
  const totalItems = stocks.length;
  const totalQty = stocks.reduce((s, x) => s + (x.quantity || 0), 0);
  const lowStockCount = stocks.filter(x => x.reorderLevel && x.quantity <= x.reorderLevel).length;
  const outOfStockCount = stocks.filter(x => (x.quantity || 0) <= 0).length;

  // ── Filtered transactions ──────────────────────────────────
  const filteredTx = transactions.filter(tx => {
    const matchType = txFilter === 'ALL' || tx.type === txFilter;
    const matchSearch = !searchTerm ||
      String(tx.productId).includes(searchTerm) ||
      String(tx.warehouseId).includes(searchTerm) ||
      (tx.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  // ── Filtered stocks ────────────────────────────────────────
  const filteredStocks = stocks.filter(s =>
    !searchTerm ||
    String(s.productId).includes(searchTerm) ||
    String(s.warehouseId).includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="inv-loading">
        <div className="inv-loading-spinner" />
        <p>Loading inventory data…</p>
      </div>
    );
  }

  return (
    <div className="inv-page">

      {/* ── Header ── */}
      <div className="inv-header">
        <div className="inv-header-left">
          <div className="inv-header-icon">📦</div>
          <div>
            <h1>Inventory Management</h1>
            <p>Track stock levels, movements, and transactions across all warehouses</p>
          </div>
        </div>
        <button
          id="inv-new-transaction-btn"
          className="inv-btn-primary"
          onClick={() => setShowForm(true)}
        >
          <span>＋</span> New Transaction
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>📦</div>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Total SKUs</span>
            <span className="inv-stat-value">{totalItems}</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>🔢</div>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Total Units</span>
            <span className="inv-stat-value">{totalQty.toLocaleString()}</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⚠️</div>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Low Stock</span>
            <span className="inv-stat-value" style={{ color: lowStockCount > 0 ? '#fbbf24' : undefined }}>
              {lowStockCount}
            </span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>❌</div>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Out of Stock</span>
            <span className="inv-stat-value" style={{ color: outOfStockCount > 0 ? '#f87171' : undefined }}>
              {outOfStockCount}
            </span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>📋</div>
          <div className="inv-stat-body">
            <span className="inv-stat-label">Transactions</span>
            <span className="inv-stat-value">{transactions.length}</span>
          </div>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="inv-card">

        {/* ── Toolbar ── */}
        <div className="inv-toolbar">
          {/* Tabs */}
          <div className="inv-tabs">
            <button
              id="inv-tab-stocks"
              className={`inv-tab ${activeTab === 'stocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('stocks')}
            >
              🏷️ Stock Levels
              <span className="inv-tab-count">{stocks.length}</span>
            </button>
            <button
              id="inv-tab-transactions"
              className={`inv-tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              📋 Transactions
              <span className="inv-tab-count">{transactions.length}</span>
            </button>
          </div>

          {/* Search + Filter */}
          <div className="inv-toolbar-right">
            <div className="inv-search-wrap">
              <span className="inv-search-icon">🔍</span>
              <input
                type="text"
                className="inv-search"
                placeholder="Search by product or warehouse ID…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'transactions' && (
              <select
                className="inv-filter-select"
                value={txFilter}
                onChange={e => setTxFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="IN">📥 Stock In</option>
                <option value="OUT">📤 Stock Out</option>
                <option value="TRANSFER">🔄 Transfer</option>
                <option value="ADJUSTMENT">⚖️ Adjustment</option>
                <option value="RETURN">↩️ Return</option>
              </select>
            )}
            <button className="inv-btn-refresh" onClick={fetchData} title="Refresh data">
              🔄
            </button>
          </div>
        </div>

        {/* ── Stock Levels Table ── */}
        {activeTab === 'stocks' && (
          <div className="inv-table-wrap">
            {filteredStocks.length === 0 ? (
              <div className="inv-empty">
                <span className="inv-empty-icon">📭</span>
                <p>No stock records found</p>
                <button className="inv-btn-primary" onClick={() => setShowForm(true)}>
                  ＋ Add First Transaction
                </button>
              </div>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product ID</th>
                    <th>Warehouse ID</th>
                    <th>Quantity</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock, idx) => {
                    const isLow = stock.reorderLevel && stock.quantity <= stock.reorderLevel && stock.quantity > 0;
                    const isOut = (stock.quantity || 0) <= 0;
                    const status = isOut ? 'out' : isLow ? 'low' : 'ok';
                    const statusMeta = {
                      ok: { label: 'In Stock', color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
                      low: { label: 'Low Stock', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
                      out: { label: 'Out of Stock', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
                    }[status];

                    return (
                      <tr key={stock.id} className={`inv-row inv-row-${status}`}>
                        <td className="inv-idx">{idx + 1}</td>
                        <td><span className="inv-id-badge">#{stock.productId}</span></td>
                        <td><span className="inv-id-badge inv-wh-badge">🏢 {stock.warehouseId}</span></td>
                        <td>
                          <StockLevelBar quantity={stock.quantity} reorderLevel={stock.reorderLevel} />
                        </td>
                        <td className="inv-qty">{stock.availableQuantity ?? 0}</td>
                        <td className="inv-qty inv-reserved">{stock.reservedQuantity ?? 0}</td>
                        <td className="inv-qty">{stock.reorderLevel ?? '—'}</td>
                        <td>
                          <span className="inv-status-badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="inv-date">{formatDate(stock.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Transactions Table ── */}
        {activeTab === 'transactions' && (
          <div className="inv-table-wrap">
            {filteredTx.length === 0 ? (
              <div className="inv-empty">
                <span className="inv-empty-icon">📋</span>
                <p>No transactions found</p>
                <button className="inv-btn-primary" onClick={() => setShowForm(true)}>
                  ＋ Record Transaction
                </button>
              </div>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Product ID</th>
                    <th>Warehouse</th>
                    <th>Quantity</th>
                    <th>Reference</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx, idx) => (
                    <tr key={tx.id} className="inv-row">
                      <td className="inv-idx">{idx + 1}</td>
                      <td><span className="inv-id-badge">#{tx.id}</span></td>
                      <td><TypeBadge type={tx.type} /></td>
                      <td><span className="inv-id-badge">#{tx.productId}</span></td>
                      <td><span className="inv-id-badge inv-wh-badge">🏢 {tx.warehouseId}</span></td>
                      <td>
                        <span className="inv-qty" style={{
                          color: tx.type === 'IN' || tx.type === 'RETURN' ? '#4ade80'
                            : tx.type === 'OUT' || tx.type === 'TRANSFER' ? '#f87171'
                              : '#94a3b8'
                        }}>
                          {tx.type === 'OUT' || tx.type === 'TRANSFER' ? '−' : '+'}{tx.quantity}
                        </span>
                      </td>
                      <td className="inv-ref">{tx.referenceId || '—'}</td>
                      <td className="inv-date">{formatDate(tx.createdAt || tx.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Table Footer ── */}
        <div className="inv-table-footer">
          Showing {activeTab === 'stocks' ? filteredStocks.length : filteredTx.length} of{' '}
          {activeTab === 'stocks' ? stocks.length : transactions.length} records
        </div>
      </div>

      {/* ── Stock Transaction Form Modal ── */}
      {showForm && (
        <StockTransactionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchData(); // Refresh data after successful transaction
          }}
        />
      )}
    </div>
  );
}

export default Inventory;
