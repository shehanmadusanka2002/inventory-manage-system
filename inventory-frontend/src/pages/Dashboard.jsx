import { useEffect, useState, useMemo } from 'react';
import { FaBox, FaWarehouse, FaShoppingCart, FaChartLine, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ArrowLeftRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { analyticsService, productService, warehouseService, orderService, inventoryService } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockItems: 0,
    totalOrders: 0,
    warehouses: 0,
    lowStockAlerts: 0,
    totalStockValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.orgId;

      if (!orgId) {
        setError('Organization ID not found. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch data from multiple services in parallel
      const [
        dashboardData,
        products,
        warehouses,
        purchaseOrders,
        salesOrders,
        stocks,
        transactions
      ] = await Promise.allSettled([
        analyticsService.getDashboard(orgId),
        productService.getAll(),
        warehouseService.getByOrganization(orgId),
        orderService.getPurchaseOrders(),
        orderService.getSalesOrders(),
        inventoryService.getAllStocks(),
        inventoryService.getAllTransactions()
      ]);

      // Extract dashboard metrics from analytics service
      const dashboardMetrics = dashboardData.status === 'fulfilled' ? dashboardData.value.data : {};
      const inventory = dashboardMetrics.inventory || {};
      const salesThisMonth = dashboardMetrics.salesThisMonth || {};

      // Count products
      const totalProducts = products.status === 'fulfilled' ? products.value.data.length : 0;

      // Count warehouses
      const totalWarehouses = warehouses.status === 'fulfilled' ? warehouses.value.data.length : 0;

      // Count orders
      const totalPurchaseOrders = purchaseOrders.status === 'fulfilled' ? purchaseOrders.value.data.length : 0;
      const totalSalesOrders = salesOrders.status === 'fulfilled' ? salesOrders.value.data.length : 0;
      const totalOrders = totalPurchaseOrders + totalSalesOrders;

      // Count pending orders (status = PENDING or PROCESSING)
      let pendingOrdersCount = 0;
      if (purchaseOrders.status === 'fulfilled') {
        pendingOrdersCount += purchaseOrders.value.data.filter(
          order => order.status === 'PENDING' || order.status === 'PROCESSING'
        ).length;
      }
      if (salesOrders.status === 'fulfilled') {
        pendingOrdersCount += salesOrders.value.data.filter(
          order => order.status === 'PENDING' || order.status === 'PROCESSING'
        ).length;
      }

      // Count total stock items
      const totalStockItems = stocks.status === 'fulfilled'
        ? stocks.value.data.reduce((sum, stock) => sum + (stock.quantity || 0), 0)
        : 0;

      // Build productId → name map
      const pMap = {};
      if (products.status === 'fulfilled') {
        products.value.data.forEach(p => { pMap[p.id] = p.name || p.productName || `Product #${p.id}`; });
      }
      setProductMap(pMap);

      // Get recent transactions — sort newest first, take top 8
      const recentTransactions = transactions.status === 'fulfilled'
        ? [...transactions.value.data]
          .sort((a, b) => new Date(b.createdAt || b.transactionDate) - new Date(a.createdAt || a.transactionDate))
          .slice(0, 8)
        : [];

      // Calculate low stock alerts directly from stock data
      // A stock is "low" if: quantity <= reorderLevel (when set), OR quantity <= 10 (default threshold)
      let lowStockCount = 0;
      if (stocks.status === 'fulfilled') {
        lowStockCount = stocks.value.data.filter((stock) => {
          const qty = stock.quantity ?? 0;
          const reorder = stock.reorderLevel ?? stock.reorder_level ?? 10;
          return qty > 0 && qty <= reorder;
        }).length;
      }

      // Calculate total stock value from stocks (quantity * unitPrice if available)
      let totalStockValue = 0;
      if (stocks.status === 'fulfilled') {
        totalStockValue = stocks.value.data.reduce((sum, stock) => {
          const qty = stock.quantity ?? 0;
          const price = stock.unitPrice ?? stock.unit_price ?? 0;
          return sum + qty * price;
        }, 0);
      }

      setStats({
        totalProducts: inventory.totalProducts || totalProducts,
        totalStockItems: totalStockItems,
        totalOrders: salesThisMonth.totalOrders || totalOrders,
        warehouses: totalWarehouses,
        lowStockAlerts: lowStockCount,
        totalStockValue: inventory.totalStockValue || totalStockValue,
        pendingOrders: pendingOrdersCount
      });

      setRecentActivity(recentTransactions);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format: "Feb 18, 09:45 PM"
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Lucide icon + color per transaction type
  const getTypeMeta = (type) => {
    switch (type) {
      case 'IN': return { Icon: ArrowDownCircle, color: '#16a34a', bg: '#dcfce7', label: 'Stock In' };
      case 'OUT': return { Icon: ArrowUpCircle, color: '#dc2626', bg: '#fee2e2', label: 'Stock Out' };
      case 'TRANSFER': return { Icon: ArrowLeftRight, color: '#7c3aed', bg: '#ede9fe', label: 'Transfer' };
      case 'ADJUSTMENT': return { Icon: SlidersHorizontal, color: '#d97706', bg: '#fef3c7', label: 'Adjustment' };
      case 'RETURN': return { Icon: RotateCcw, color: '#0284c7', bg: '#e0f2fe', label: 'Return' };
      default: return { Icon: RefreshCw, color: '#6b7280', bg: '#f3f4f6', label: type || '—' };
    }
  };

  // Signed quantity: +10 for IN/ADJUSTMENT/RETURN, -10 for OUT/TRANSFER
  const formatQty = (type, qty) => {
    if (!qty && qty !== 0) return '—';
    const isPositive = ['IN', 'ADJUSTMENT', 'RETURN'].includes(type);
    return (isPositive ? '+' : '-') + Math.abs(qty);
  };

  // Smart notes from referenceId + type
  const buildNotes = (txn) => {
    const ref = txn.referenceId;
    const raw = txn.notes;
    if (raw && raw.trim()) return raw;
    if (!ref) return '—';
    if (ref.startsWith('SO-')) return `Sales order fulfillment — #${ref}`;
    if (ref.startsWith('PO-')) return `Purchase received — #${ref}`;
    return `Ref: ${ref}`;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome to Inventory Management System</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to Inventory Management System</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
          <div className="stat-icon" style={{ color: '#2563eb' }}>
            <FaBox />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Stock Items</h3>
            <p>{stats.totalStockItems.toLocaleString()}</p>
          </div>
          <div className="stat-icon" style={{ color: '#10b981' }}>
            <FaWarehouse />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
            {stats.pendingOrders > 0 && (
              <small style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                {stats.pendingOrders} pending
              </small>
            )}
          </div>
          <div className="stat-icon" style={{ color: '#f59e0b' }}>
            <FaShoppingCart />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Warehouses</h3>
            <p>{stats.warehouses}</p>
          </div>
          <div className="stat-icon" style={{ color: '#8b5cf6' }}>
            <FaChartLine />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Low Stock Alerts</h3>
            <p>{stats.lowStockAlerts}</p>
          </div>
          <div className="stat-icon" style={{ color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Stock Value</h3>
            <p style={{ fontSize: '1.5rem' }}>{formatCurrency(stats.totalStockValue)}</p>
          </div>
          <div className="stat-icon" style={{ color: '#059669' }}>
            <FaDollarSign />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Recent Activity</h2>
          <button
            onClick={fetchStats}
            className="btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9ca3af' }}>
            <RefreshCw size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No recent transactions to display.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  {['Type', 'Product', 'Qty', 'Date', 'Notes'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', fontSize: '11px', fontWeight: 700,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((txn, idx) => {
                  const { Icon, color, bg, label } = getTypeMeta(txn.type);
                  const productName = productMap[txn.productId] || txn.productName || `Product #${txn.productId}`;
                  const qty = formatQty(txn.type, txn.quantity);
                  const isPositive = qty.startsWith('+');
                  const dateStr = formatDate(txn.createdAt || txn.transactionDate);
                  const notes = buildNotes(txn);

                  return (
                    <tr key={txn.id ?? idx} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {/* Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: bg, color, fontWeight: 700, fontSize: '11.5px',
                          padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap'
                        }}>
                          <Icon size={13} strokeWidth={2.5} />
                          {label}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                        {productName}
                      </td>

                      {/* Qty */}
                      <td style={{
                        padding: '12px 14px', fontWeight: 700,
                        color: isPositive ? '#16a34a' : '#dc2626',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {qty}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      {/* Notes */}
                      <td style={{
                        padding: '12px 14px', color: '#94a3b8',
                        fontSize: '12.5px', maxWidth: '260px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }} title={notes}>
                        {notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
