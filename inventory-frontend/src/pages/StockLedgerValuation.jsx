import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Info,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle,
    TrendingUp,
    Star
} from 'lucide-react';
import { ledgerService, valuationService, productService, warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './StockLedgerValuation.css';

const StockLedgerValuation = () => {
    const { user } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [method, setMethod] = useState('FIFO');

    const [ledgerData, setLedgerData] = useState([]);
    const [valuationData, setValuationData] = useState(null);

    // Fetch products and warehouses scoped to the user's organization
    useEffect(() => {
        const fetchInitialData = async () => {
            // Don't fetch until we have a user/orgId context
            if (!user?.orgId) return;

            try {
                const orgId = user.orgId;
                const [productsRes, warehousesRes] = await Promise.all([
                    productService.getByOrganization(orgId),
                    warehouseService.getByOrganization(orgId)
                ]);

                setProducts(productsRes.data || []);
                setWarehouses(warehousesRes.data || []);

                // Auto-select first warehouse if available
                if (warehousesRes.data && warehousesRes.data.length > 0) {
                    setSelectedWarehouseId(warehousesRes.data[0].id.toString());
                }
            } catch (err) {
                console.error("Failed to fetch organization data:", err);
                setError("Failed to load organization-specific data. Please check your connection.");
            }
        };

        fetchInitialData();
    }, [user?.orgId]);

    const methodDescriptions = {
        FIFO: 'First-In, First-Out: Assumes that the oldest inventory items are sold first. This results in current costs being matched with revenue on the balance sheet.',
        LIFO: 'Last-In, First-Out: Assumes that the most recently acquired items are sold first. This can be beneficial for tax purposes during periods of inflation.',
        'WEIGHTED_AVERAGE': 'Weighted Average Cost: Calculates a mean cost for all inventory items based on the total cost of units purchased divided by the total number of units.'
    };

    const handleLoad = async () => {
        if (!selectedProductId || !selectedWarehouseId) {
            alert('Please select both a product and a warehouse first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [ledgerRes, valuationRes] = await Promise.all([
                ledgerService.getByProductAndWarehouse(selectedProductId, selectedWarehouseId),
                valuationService.compareMethods(selectedProductId, selectedWarehouseId)
            ]);

            setLedgerData(ledgerRes.data || []);
            setValuationData(valuationRes.data);
            setIsLoaded(true);
        } catch (err) {
            console.error("Data fetch error:", err);
            setError("Failed to fetch stock data for this selection. Ensure both services are healthy.");
        } finally {
            setIsLoading(false);
        }
    };

    const isRecommended = (m) => valuationData?.recommendedMethod === m;

    return (
        <div className="stock-ledger-valuation">
            {/* Header Section */}
            <header className="ledger-header">
                <h1>Stock Ledger & Valuation</h1>
                <p>Track stock movements and financial valuations for your organization</p>
            </header>

            {/* Filter Card */}
            <section className="white-card">
                <div className="filter-grid">
                    <div className="filter-item">
                        <label>Warehouse</label>
                        <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        >
                            <option value="">Select a warehouse...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Product</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Display Strategy</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="FIFO">FIFO</option>
                            <option value="LIFO">LIFO</option>
                            <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                        </select>
                    </div>

                    <button className="btn-load" onClick={handleLoad} disabled={isLoading || !selectedProductId || !selectedWarehouseId}>
                        {isLoading ? 'Loading...' : 'Load Ledger'}
                    </button>
                </div>

                {/* Dynamic Alert */}
                <div className="method-alert">
                    <Info size={18} />
                    <span>{methodDescriptions[method] || methodDescriptions['FIFO']}</span>
                </div>
            </section>

            {error && (
                <div className="method-alert" style={{ background: '#fef2f2', color: '#991b1b', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Content (Table or Empty State) */}
            <section className="white-card">
                {!isLoaded ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>Analyze Stock History</h3>
                        <p>Please select a specific warehouse and product from your catalog to begin valuation.</p>
                    </div>
                ) : (
                    <div className="ledger-table-wrapper">
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Transaction</th>
                                    <th>Quantity</th>
                                    <th>Unit Cost</th>
                                    <th>Total Value</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.length > 0 ? ledgerData.map((row, idx) => {
                                    const isOut = row.quantityOut > 0;
                                    return (
                                        <tr key={idx}>
                                            <td>{new Date(row.transactionDate).toLocaleDateString()}</td>
                                            <td>
                                                <span className={!isOut ? 'type-in' : 'type-out'}>
                                                    {!isOut ? <ArrowUpCircle size={14} style={{ marginRight: 4 }} /> : <ArrowDownCircle size={14} style={{ marginRight: 4 }} />}
                                                    {row.transactionType}
                                                </span>
                                            </td>
                                            <td>{!isOut ? row.quantityIn : row.quantityOut} units</td>
                                            <td>${parseFloat(row.unitCost || 0).toFixed(2)}</td>
                                            <td>${parseFloat(row.totalCost || 0).toFixed(2)}</td>
                                            <td style={{ fontWeight: 600 }}>{row.runningBalance || row.quantityBalance}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No movements found for this selection.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Valuation Summary Section */}
            <section className="white-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp className="text-indigo-600" size={24} />
                    Financial Valuation Summary
                </h2>

                <div className="summary-container">
                    <div className="summary-method">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4>FIFO (First In, First Out)</h4>
                            {isRecommended('FIFO') && <span className="recommended-badge"><Star size={12} /> Recommended</span>}
                        </div>
                        <p>
                            Current Value: <strong style={{ color: '#111827' }}>${(valuationData?.fifoValue || 0).toLocaleString()}</strong>
                        </p>
                        <p className="method-desc">
                            Values inventory using oldest costs. Best used when aiming for higher asset values during inflation.
                        </p>
                    </div>

                    <div className="summary-method">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4>LIFO (Last In, First Out)</h4>
                            {isRecommended('LIFO') && <span className="recommended-badge"><Star size={12} /> Recommended</span>}
                        </div>
                        <p>
                            Current Value: <strong style={{ color: '#111827' }}>${(valuationData?.lifoValue || 0).toLocaleString()}</strong>
                        </p>
                        <p className="method-desc">
                            Values inventory using newest costs. Frequently used to reduce taxable income by matching recent high costs with revenue.
                        </p>
                    </div>

                    <div className="summary-method">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4>Weighted Average</h4>
                            {isRecommended('WEIGHTED_AVERAGE') && <span className="recommended-badge"><Star size={12} /> Recommended</span>}
                        </div>
                        <p>
                            Current Value: <strong style={{ color: '#111827' }}>${(valuationData?.weightedAvgValue || 0).toLocaleString()}</strong>
                        </p>
                        <p className="method-desc">
                            Values inventory using the mean cost of all units. Provides the smoothest valuation for stable financial reporting.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StockLedgerValuation;
