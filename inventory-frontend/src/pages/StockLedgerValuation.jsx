import React, { useState } from 'react';
import {
    BookOpen,
    Info,
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    FileText,
    Calculator
} from 'lucide-react';
import './StockLedgerValuation.css';

const StockLedgerValuation = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [filters, setFilters] = useState({
        viewBy: 'Product',
        product: '',
        method: 'FIFO'
    });

    const mockProducts = [
        { id: 1, name: 'Aspirin 500mg', sku: 'ASP-001' },
        { id: 2, name: 'Panadol Extra', sku: 'PAN-102' },
        { id: 3, name: 'Amoxicillin 250mg', sku: 'AMX-442' },
        { id: 4, name: 'Vitamin C 1000mg', sku: 'VIT-993' }
    ];

    const methodDescriptions = {
        FIFO: 'First-In, First-Out: Assumes that the oldest inventory items are sold first. This results in current costs being matched with revenue on the balance sheet.',
        LIFO: 'Last-In, First-Out: Assumes that the most recently acquired items are sold first. This can be beneficial for tax purposes during periods of inflation.',
        'Weighted Average': 'Weight Average Cost: Calculates a mean cost for all inventory items based on the total cost of units purchased divided by the total number of units.'
    };

    const mockLedgerData = [
        { date: '2026-02-10', type: 'IN', qty: 100, unitCost: 10.00, totalValue: 1000.00, balance: 100 },
        { date: '2026-02-12', type: 'OUT', qty: 30, unitCost: 10.00, totalValue: 300.00, balance: 70 },
        { date: '2026-02-15', type: 'IN', qty: 50, unitCost: 12.00, totalValue: 600.00, balance: 120 },
        { date: '2026-02-18', type: 'OUT', qty: 40, unitCost: 10.83, totalValue: 433.20, balance: 80 },
        { date: '2026-02-21', type: 'IN', qty: 200, unitCost: 11.50, totalValue: 2300.00, balance: 280 }
    ];

    const handleLoad = () => {
        if (!filters.product) {
            alert('Please select a product first');
            return;
        }
        setIsLoaded(true);
    };

    return (
        <div className="stock-ledger-valuation">
            {/* Header Section */}
            <header className="ledger-header">
                <h1>Stock Ledger & Valuation</h1>
                <p>Track stock movements and financial valuations</p>
            </header>

            {/* Filter Card */}
            <section className="white-card">
                <div className="filter-grid">
                    <div className="filter-item">
                        <label>View By</label>
                        <select
                            value={filters.viewBy}
                            onChange={(e) => setFilters({ ...filters, viewBy: e.target.value })}
                        >
                            <option>Product</option>
                            <option>Warehouse</option>
                            <option>Category</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Product</label>
                        <select
                            value={filters.product}
                            onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                        >
                            <option value="">Select a product...</option>
                            {mockProducts.map(p => (
                                <option key={p.id} value={p.name}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Valuation Method</label>
                        <select
                            value={filters.method}
                            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                        >
                            <option value="FIFO">FIFO (First-In, First-Out)</option>
                            <option value="LIFO">LIFO (Last-In, First-Out)</option>
                            <option value="Weighted Average">Weighted Average</option>
                        </select>
                    </div>

                    <button className="btn-load" onClick={handleLoad}>
                        Load Ledger
                    </button>
                </div>

                {/* Dynamic Alert */}
                <div className="method-alert">
                    <Info size={18} />
                    <span>{methodDescriptions[filters.method]}</span>
                </div>
            </section>

            {/* Main Content (Table or Empty State) */}
            <section className="white-card">
                {!isLoaded ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>No Ledger Data</h3>
                        <p>Select a product and click Load Ledger to visualize movement history.</p>
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
                                {mockLedgerData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(row.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={row.type === 'IN' ? 'type-in' : 'type-out'}>
                                                {row.type === 'IN' ? <ArrowUpCircle size={14} style={{ marginRight: 4 }} /> : <ArrowDownCircle size={14} style={{ marginRight: 4 }} />}
                                                {row.type}
                                            </span>
                                        </td>
                                        <td>{row.qty} units</td>
                                        <td>${row.unitCost.toFixed(2)}</td>
                                        <td>${row.totalValue.toFixed(2)}</td>
                                        <td style={{ fontWeight: 600 }}>{row.balance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Bottom Summary Section */}
            <section className="white-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>Valuation Methods Overview</h2>
                <div className="summary-container">
                    <div className="summary-method">
                        <h4>FIFO (First In, First Out)</h4>
                        <p>
                            Under FIFO, the system assumes that the first items placed in inventory are the first ones sold.
                            In a rising price environment, this results in a lower cost of goods sold and a higher value
                            for the remaining inventory on the balance sheet.
                        </p>
                    </div>
                    <div className="summary-method">
                        <h4>LIFO (Last In, First Out)</h4>
                        <p>
                            LIFO assumes that the items most recently added to inventory are the first ones to be sold.
                            This method can match current costs against current revenues more effectively and often
                            provides tax advantages when prices are increasing.
                        </p>
                    </div>
                    <div className="summary-method">
                        <h4>Weighted Average</h4>
                        <p>
                            The weighted average method uses the average cost of all units available for sale during
                            the period to determine the cost of goods sold and the ending inventory. It smooths out
                            price fluctuations and is simple to maintain.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StockLedgerValuation;
