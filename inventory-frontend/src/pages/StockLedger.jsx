import React, { useState, useEffect } from 'react';
import { ledgerService, productService, warehouseService } from '../services/api';
import { FaBook, FaBox, FaWarehouse, FaChartLine, FaCalculator } from 'react-icons/fa';

const StockLedger = () => {
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [valuationStrategy, setValuationStrategy] = useState('FIFO');
  const [viewType, setViewType] = useState('product'); // product or warehouse

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        productService.getAll(),
        warehouseService.getAll()
      ]);
      setProducts(productsRes.data || []);
      setWarehouses(warehousesRes.data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchLedger = async () => {
    if (!selectedProduct && !selectedWarehouse) {
      alert('Please select a product or warehouse');
      return;
    }

    try {
      setLoading(true);
      setLedgerData([]);
      setValuation(null);

      if (viewType === 'product' && selectedProduct) {
        const [ledgerRes, valuationRes] = await Promise.all([
          ledgerService.getByProduct(selectedProduct),
          ledgerService.getProductValuation(selectedProduct, valuationStrategy)
        ]);
        setLedgerData(ledgerRes.data || []);
        setValuation(valuationRes.data);
      } else if (viewType === 'warehouse' && selectedWarehouse) {
        const [ledgerRes, valuationRes] = await Promise.all([
          ledgerService.getByWarehouse(selectedWarehouse),
          ledgerService.getWarehouseValuation(selectedWarehouse, valuationStrategy)
        ]);
        setLedgerData(ledgerRes.data || []);
        setValuation(valuationRes.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      alert('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Stock Ledger & Valuation</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Track stock movements and valuations (FIFO, LIFO, Weighted Average)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        border: '1px solid #374151',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* View Type */}
          <div className="form-group">
            <label>View By</label>
            <select value={viewType} onChange={(e) => setViewType(e.target.value)}>
              <option value="product">Product</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </div>

          {/* Product Selection */}
          {viewType === 'product' && (
            <div className="form-group">
              <label>
                <FaBox style={{ marginRight: '0.5rem' }} />
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Warehouse Selection */}
          {viewType === 'warehouse' && (
            <div className="form-group">
              <label>
                <FaWarehouse style={{ marginRight: '0.5rem' }} />
                Warehouse
              </label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="">Select a warehouse...</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Valuation Strategy */}
          <div className="form-group">
            <label>
              <FaCalculator style={{ marginRight: '0.5rem' }} />
              Valuation Method
            </label>
            <select
              value={valuationStrategy}
              onChange={(e) => setValuationStrategy(e.target.value)}
            >
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="LIFO">LIFO (Last In, First Out)</option>
              <option value="WEIGHTED_AVERAGE">Weighted Average</option>
            </select>
          </div>

          {/* Load Button */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={fetchLedger}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <FaChartLine /> {loading ? 'Loading...' : 'Load Ledger'}
            </button>
          </div>
        </div>

        {/* Strategy Info */}
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#111827',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#9ca3af',
        }}>
          <strong style={{ color: '#d1d5db' }}>{valuationStrategy}:</strong>{' '}
          {valuationStrategy === 'FIFO' && 'Oldest stock is issued first, reflecting current market prices in ending inventory.'}
          {valuationStrategy === 'LIFO' && 'Newest stock is issued first, matching recent costs with revenue.'}
          {valuationStrategy === 'WEIGHTED_AVERAGE' && 'Average cost of all units is calculated and applied uniformly.'}
        </div>
      </div>

      {/* Valuation Summary */}
      {valuation && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-title">Total Quantity</div>
            <div className="stat-value">{valuation.totalQuantity || 0}</div>
            <div className="stat-subtitle">Units in stock</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-title">Total Value</div>
            <div className="stat-value">
              ${valuation.totalValue ? parseFloat(valuation.totalValue).toFixed(2) : '0.00'}
            </div>
            <div className="stat-subtitle">Stock valuation</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-title">Avg Unit Cost</div>
            <div className="stat-value">
              ${valuation.averageCost ? parseFloat(valuation.averageCost).toFixed(2) : '0.00'}
            </div>
            <div className="stat-subtitle">Per unit</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="stat-title">Strategy</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{valuationStrategy}</div>
            <div className="stat-subtitle">Costing method</div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading ledger data...
        </div>
      ) : ledgerData.length === 0 ? (
        <div style={{
          padding: '3rem',
          backgroundColor: '#1f2937',
          borderRadius: '0.5rem',
          border: '1px solid #374151',
          textAlign: 'center',
        }}>
          <FaBook style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }} />
          <h3 style={{ color: '#d1d5db', margin: '0 0 0.5rem 0' }}>No Ledger Data</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Select a product or warehouse and click "Load Ledger" to view stock movements
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Type</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.date ? new Date(entry.date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: entry.type === 'IN' ? '#10b981' :
                                     entry.type === 'OUT' ? '#ef4444' : '#6b7280'
                    }}>
                      {entry.type || entry.transactionType || '-'}
                    </span>
                  </td>
                  <td>{entry.productName || entry.productId || '-'}</td>
                  <td>{entry.warehouseName || entry.warehouseId || '-'}</td>
                  <td style={{ fontWeight: '600' }}>
                    {entry.type === 'OUT' && '-'}
                    {entry.quantity || 0}
                  </td>
                  <td>${entry.unitCost ? parseFloat(entry.unitCost).toFixed(2) : '0.00'}</td>
                  <td>${entry.totalCost ? parseFloat(entry.totalCost).toFixed(2) : '0.00'}</td>
                  <td style={{ fontWeight: '600' }}>{entry.balance || entry.runningBalance || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Valuation Explanation */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        border: '1px solid #374151',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Stock Valuation Methods</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #374151' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>FIFO (First In, First Out)</div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Assumes the oldest inventory items are sold first. Results in lower cost of goods sold during inflation and higher ending inventory values.
            </div>
          </div>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #374151' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>LIFO (Last In, First Out)</div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Assumes the newest inventory items are sold first. Results in higher cost of goods sold during inflation and lower ending inventory values.
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Weighted Average</div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Calculates a weighted average cost per unit for all inventory. Provides a middle ground between FIFO and LIFO methods.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLedger;
