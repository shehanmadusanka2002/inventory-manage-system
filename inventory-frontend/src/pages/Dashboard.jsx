import { useEffect, useState } from 'react';
import { FaBox, FaWarehouse, FaShoppingCart, FaChartLine, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
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

      // Get recent transactions for activity feed
      const recentTransactions = transactions.status === 'fulfilled'
        ? transactions.value.data.slice(0, 5)
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'STOCK_IN': 'Stock In',
      'STOCK_OUT': 'Stock Out',
      'ADJUSTMENT': 'Adjustment',
      'TRANSFER': 'Transfer',
      'RETURN': 'Return'
    };
    return labels[type] || type;
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
          <p style={{ color: '#6b7280' }}>No recent activity to display.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Product</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Quantity</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={activity.id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        backgroundColor: activity.transactionType === 'STOCK_IN' ? '#dcfce7' : '#fee2e2',
                        color: activity.transactionType === 'STOCK_IN' ? '#166534' : '#991b1b'
                      }}>
                        {getTransactionTypeLabel(activity.transactionType)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{activity.productName || `Product #${activity.productId}`}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{activity.quantity}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{formatDate(activity.transactionDate)}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {activity.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
