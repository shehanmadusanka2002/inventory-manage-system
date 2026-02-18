import React, { useState, useEffect } from 'react';
import { analyticsService, auditService } from '../services/api';
import { FaChartLine, FaBoxes, FaShoppingCart, FaExclamationTriangle, FaHistory, FaUser, FaCalendar } from 'react-icons/fa';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState(1);
  const [dashboardData, setDashboardData] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, inventory, sales, audit

  useEffect(() => {
    if (organizationId) {
      fetchAnalytics();
    }
  }, [organizationId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard') {
        const response = await analyticsService.getDashboard(organizationId);
        setDashboardData(response.data);
      } else if (activeTab === 'inventory') {
        const [summaryRes, lowStockRes] = await Promise.all([
          analyticsService.getInventorySummary(organizationId),
          analyticsService.getLowStock(organizationId, 10)
        ]);
        setInventorySummary(summaryRes.data);
        setLowStock(lowStockRes.data);
      } else if (activeTab === 'sales') {
        const response = await analyticsService.getSalesSummary(organizationId);
        setSalesSummary(response.data);
      } else if (activeTab === 'audit') {
        const response = await auditService.getByOrganization(organizationId);
        setAuditLogs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Don't show alert for missing data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchAnalytics();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { id: 'inventory', label: 'Inventory', icon: <FaBoxes /> },
    { id: 'sales', label: 'Sales', icon: <FaShoppingCart /> },
    { id: 'audit', label: 'Audit Logs', icon: <FaHistory /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Business intelligence and audit trails
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ color: '#d1d5db', fontSize: '0.875rem' }}>Organization:</label>
          <input
            type="number"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: 'white',
              width: '100px',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #374151' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === tab.id ? '#1f2937' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                  <div className="stat-title">Total Products</div>
                  <div className="stat-value">{dashboardData?.totalProducts || 0}</div>
                  <div className="stat-subtitle">In catalog</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="stat-title">Total Orders</div>
                  <div className="stat-value">{dashboardData?.totalOrders || 0}</div>
                  <div className="stat-subtitle">All time</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="stat-title">Low Stock Items</div>
                  <div className="stat-value">{dashboardData?.lowStockCount || 0}</div>
                  <div className="stat-subtitle">Needs attention</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                  <div className="stat-title">Total Value</div>
                  <div className="stat-value">
                    ${dashboardData?.totalValue ? parseFloat(dashboardData.totalValue).toFixed(2) : '0.00'}
                  </div>
                  <div className="stat-subtitle">Inventory value</div>
                </div>
              </div>

              <div style={{
                padding: '2rem',
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                textAlign: 'center',
              }}>
                <FaChartLine style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }} />
                <h3 style={{ color: '#d1d5db', margin: '0 0 0.5rem 0' }}>Dashboard Overview</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  {dashboardData ? 'Dashboard data loaded successfully' : 'No dashboard data available for this organization'}
                </p>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-title">Total Items</div>
                  <div className="stat-value">{inventorySummary?.totalItems || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Quantity</div>
                  <div className="stat-value">{inventorySummary?.totalQuantity || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Value</div>
                  <div className="stat-value">
                    ${inventorySummary?.totalValue ? parseFloat(inventorySummary.totalValue).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem' }}>
                <FaExclamationTriangle style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
                Low Stock Items
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Min Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                          No low stock items
                        </td>
                      </tr>
                    ) : (
                      lowStock.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName || item.productId}</td>
                          <td>{item.currentStock || 0}</td>
                          <td>{item.minStock || 10}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: '#f59e0b' }}>
                              Low Stock
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-title">Total Sales</div>
                  <div className="stat-value">{salesSummary?.totalSales || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Revenue</div>
                  <div className="stat-value">
                    ${salesSummary?.totalRevenue ? parseFloat(salesSummary.totalRevenue).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Avg Order Value</div>
                  <div className="stat-value">
                    ${salesSummary?.avgOrderValue ? parseFloat(salesSummary.avgOrderValue).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '2rem',
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                textAlign: 'center',
              }}>
                <FaShoppingCart style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }} />
                <h3 style={{ color: '#d1d5db', margin: '0 0 0.5rem 0' }}>Sales Analytics</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  {salesSummary ? 'Sales data loaded successfully' : 'No sales data available for this organization'}
                </p>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                        No audit logs available
                      </td>
                    </tr>
                  ) : (
                    auditLogs.slice(0, 50).map((log, index) => (
                      <tr key={index}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaCalendar style={{ color: '#9ca3af', fontSize: '0.875rem' }} />
                            <span style={{ fontSize: '0.875rem' }}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaUser style={{ color: '#3b82f6', fontSize: '0.875rem' }} />
                            <span>{log.userId || log.username || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            backgroundColor: log.action === 'CREATE' ? '#10b981' :
                                           log.action === 'UPDATE' ? '#3b82f6' :
                                           log.action === 'DELETE' ? '#ef4444' : '#6b7280'
                          }}>
                            {log.action || 'UNKNOWN'}
                          </span>
                        </td>
                        <td>{log.entity || '-'}</td>
                        <td style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          {log.details || log.description || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
