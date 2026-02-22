import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  Package,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { analyticsService, pharmacyService, auditService } from '../services/api';
import './Analytics.css';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      revenue: 0,
      orders: 0,
      lowStock: 0,
      expiringSoon: 0
    },
    salesTrend: [],
    categories: [],
    inventoryItems: [],
    salesOrders: [],
    auditLogs: []
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'inventory', label: 'Inventory Reports', icon: <Package size={18} /> },
    { id: 'sales', label: 'Sales Reports', icon: <TrendingUp size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileText size={18} /> },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const orgId = user.orgId;

        if (!orgId) return;

        // Fetch Dashboard Metrics & Pharmacy Stats
        const [dashboardRes, pharmacyRes, salesRes, inventoryRes, auditRes] = await Promise.all([
          analyticsService.getDashboard(orgId),
          pharmacyService.getStats(orgId),
          analyticsService.getSalesAnalytics(orgId),
          analyticsService.getInventoryAnalytics(orgId),
          auditService.getByOrganization(orgId)
        ]);

        const dashboard = dashboardRes.data || {};
        const pharmacy = pharmacyRes.data || {};
        const salesRaw = salesRes.data || [];
        const inventoryRaw = inventoryRes.data || [];
        const auditRaw = auditRes.data || [];

        // Process Sales Trend (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const trendData = last7Days.map(date => {
          const dayTotal = salesRaw
            .filter(s => {
              const sDate = s.saleDate ||
                (s.createdAt ? s.createdAt.substring(0, 10) : null) ||
                (s.created_at ? s.created_at.substring(0, 10) : null);
              return sDate === date;
            })
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          return { name: dayName, sales: dayTotal, fullDate: date };
        });

        // Process Categories (Top 5 by Stock Value)
        const categoryMap = {};
        inventoryRaw.forEach(item => {
          const cat = item.category || 'Other';
          categoryMap[cat] = (categoryMap[cat] || 0) + (item.stockValue || 0);
        });

        const catData = Object.entries(categoryMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map((c, i) => ({
            ...c,
            color: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i]
          }));

        setData({
          kpis: {
            revenue: dashboard.salesThisMonth?.totalSales || 0,
            orders: dashboard.salesThisMonth?.totalOrders || 0,
            lowStock: dashboard.lowStockAlerts || 0,
            expiringSoon: pharmacy.expiringSoon || 0
          },
          salesTrend: trendData,
          categories: catData.length > 0 ? catData : [
            { name: 'No Data', value: 0, color: '#e5e7eb' }
          ],
          inventoryItems: inventoryRaw,
          salesOrders: salesRaw,
          auditLogs: auditRaw
        });

      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const renderDashboard = () => (
    <>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon icon-revenue">
            <DollarSign size={24} />
          </div>
          <div className="kpi-info">
            <h3>Monthly Revenue</h3>
            <p>${parseFloat(data.kpis.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon icon-orders">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-info">
            <h3>Total Orders</h3>
            <p>{data.kpis.orders}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon icon-low-stock">
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-info">
            <h3>Low Stock Alerts</h3>
            <p>{data.kpis.lowStock}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon icon-expiry">
            <Clock size={24} />
          </div>
          <div className="kpi-info">
            <h3>Expiring Soon</h3>
            <p>{data.kpis.expiringSoon}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>7-Day Sales Trend</h4>
          <div style={{ width: '100%', height: 300 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                Loading trend data...
              </div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={data.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h4>Top Categories by Value</h4>
          <div style={{ width: '100%', height: 300 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                Loading category data...
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderInventoryReports = () => (
    <div className="reports-container">
      <div className="inventory-stats-row">
        <div className="inventory-stat-card">
          <span className="stat-label">Total Unique Products</span>
          <span className="stat-value">{data.inventoryItems.length}</span>
        </div>
        <div className="inventory-stat-card">
          <span className="stat-label">Total Inventory Value</span>
          <span className="stat-value">
            ${data.inventoryItems.reduce((sum, item) => sum + (item.stockValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="inventory-stat-card">
          <span className="stat-label">Low Stock Items</span>
          <span className="stat-value" style={{ color: data.kpis.lowStock > 0 ? '#ef4444' : 'inherit' }}>
            {data.kpis.lowStock}
          </span>
        </div>
      </div>

      <div className="report-table-card">
        <div className="table-header">
          <h3>Inventory Breakdown</h3>
          <p>Real-time analytics across all warehouses</p>
        </div>
        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Valuation</th>
                <th>Last Movement</th>
              </tr>
            </thead>
            <tbody>
              {data.inventoryItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">{item.productName || item.name || `Product ${item.productId}`}</span>
                      <span className="product-sku">{item.productSku || item.sku || `SKU-${item.productId}`}</span>
                    </div>
                  </td>
                  <td>{item.category || 'General'}</td>
                  <td>{item.stockQuantity !== undefined ? item.stockQuantity : item.quantity}</td>
                  <td>
                    <span className={`status-badge ${(item.isLowStock || (item.quantity <= item.reorderLevel)) ? 'status-low' : 'status-ok'}`}>
                      {(item.isLowStock || (item.quantity <= item.reorderLevel)) ? 'Low Stock' : 'Healthy'}
                    </span>
                  </td>
                  <td>${(item.stockValue !== undefined ? item.stockValue : (item.quantity * (item.unitPrice || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{item.lastMovementDate || item.updatedAt ? new Date(item.lastMovementDate || item.updatedAt).toLocaleDateString() : 'No data'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSalesReports = () => (
    <div className="reports-container">
      <div className="inventory-stats-row">
        <div className="inventory-stat-card">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{data.salesOrders.length}</span>
        </div>
        <div className="inventory-stat-card">
          <span className="stat-label">Total Volume</span>
          <span className="stat-value">${data.salesOrders.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="inventory-stat-card">
          <span className="stat-label">Avg Order Value</span>
          <span className="stat-value">
            ${(data.salesOrders.length > 0
              ? data.salesOrders.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / data.salesOrders.length
              : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="report-table-card">
        <div className="table-header">
          <h3>Sales History</h3>
          <p>Detailed breakdown of recent sales transactions</p>
        </div>
        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Customer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.salesOrders.map((order) => (
                <tr key={order.id}>
                  <td><span className="order-id">#{order.orderId || order.id}</span></td>
                  <td>
                    <span className={`status-badge status-${(order.orderStatus || order.status || 'pending').toLowerCase()}`}>
                      {order.orderStatus || order.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="order-items-cell">
                      <div className="item-count">
                        {(() => {
                          const count = order.totalItems !== undefined
                            ? order.totalItems
                            : (order.items && Array.isArray(order.items))
                              ? order.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
                              : 0;
                          return `${count} ${count === 1 ? 'item' : 'items'}`;
                        })()}
                      </div>
                      {order.items && Array.isArray(order.items) && (
                        <div className="product-names-list">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="product-tag">
                              {item.product_name || item.productName || `Product #${item.productId}`}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="product-tag-more">+{order.items.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="amount-cell">${(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{order.customerName || order.customer_name || (order.customerId ? `Customer #${order.customerId}` : 'Walk-in')}</td>
                  <td>{new Date(order.saleDate || order.createdAt || order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.salesOrders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No sales data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="reports-container">
      <div className="report-table-card">
        <div className="table-header">
          <h3>Activity Feed</h3>
          <p>Recent administrative and system actions</p>
        </div>
        <div className="audit-list">
          {data.auditLogs.map((log) => (
            <div key={log.id} className="audit-item">
              <div className="audit-timestamp">
                {new Date(log.timestamp || log.createdAt).toLocaleString()}
              </div>
              <div className="audit-content">
                <span className="audit-user">{log.username || `User #${log.userId}`}</span>
                <span className="audit-action">{log.action}</span>
                <span className="audit-entity">{log.entity} #{log.entityId}</span>
              </div>
              {log.description && <div className="audit-details">{log.description}</div>}
            </div>
          ))}
          {data.auditLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No activity logs found</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (label) => (
    <div className="placeholder-card">
      <div className="placeholder-icon">
        <FileText size={48} />
      </div>
      <h3>{label}</h3>
      <p>This module is currently being optimized for your business. Check back soon for detailed insights.</p>
    </div>
  );

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics & Reports</h1>
        <p className="analytics-subtitle">Business intelligence and system metrics</p>
      </div>

      <nav className="analytics-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </nav>

      <div className="analytics-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventoryReports()}
        {activeTab === 'sales' && renderSalesReports()}
        {activeTab === 'audit' && renderAuditLogs()}
      </div>
    </div>
  );
};

export default Analytics;
