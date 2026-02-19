import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, pharmacyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaBox, FaExclamationTriangle, FaBan, FaPills, FaSnowflake } from 'react-icons/fa';
import { Edit, Trash2, Box, Activity, AlertTriangle, FileText, Anchor } from 'lucide-react';
import './Products.css';

function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expiringDays, setExpiringDays] = useState(30);

  const isPharmacy = user?.industryType === 'PHARMACY';

  useEffect(() => {
    fetchProducts();
    if (isPharmacy) {
      fetchPharmacyProducts();
    }
  }, [activeTab, expiringDays]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacyProducts = async () => {
    if (!isPharmacy) return;

    try {
      let response;
      const orgId = user?.orgId || 1;
      switch (activeTab) {
        case 'expiring':
          response = await pharmacyService.getExpiring(expiringDays);
          break;
        case 'expired':
          response = await pharmacyService.getExpired();
          break;
        case 'prescription':
          response = await pharmacyService.getPrescription(true);
          break;
        case 'controlled':
          response = await pharmacyService.getControlled('II');
          break;
        case 'refrigerated':
          response = await pharmacyService.getRefrigerated();
          break;
        case 'recalled':
          response = await pharmacyService.getRecalled();
          break;
        default:
          response = await pharmacyService.getByOrganization(orgId);
      }
      setPharmacyProducts(response.data);
    } catch (error) {
      console.error('Error fetching pharmacy products:', error);
      setPharmacyProducts([]);
    }
  };

  const handleUpdateExpiry = async () => {
    try {
      await pharmacyService.updateExpiryStatuses();
      fetchPharmacyProducts();
      alert('Expiry statuses updated successfully');
    } catch (error) {
      console.error('Error updating expiry statuses:', error);
    }
  };

  const handleRecall = async (id) => {
    const reason = prompt('Enter recall reason:');
    if (reason) {
      try {
        await pharmacyService.recall(id, reason);
        fetchPharmacyProducts();
        alert('Product recalled successfully');
      } catch (error) {
        console.error('Error recalling product:', error);
      }
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="products-container">
      <div className="page-header">
        <div>
          <h1><FaBox className="text-gray-400 mr-2" /> Products {isPharmacy && '& Pharmacy Management'}</h1>
          {isPharmacy && <p>Batch tracking, expiry dates, and prescription management</p>}
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleUpdateExpiry}>
            Update Statuses
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/products/register')}>
            + Register Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isPharmacy && (
        <div className="stats-grid">
          <div className="stat-card" onClick={() => setActiveTab('expiring')}>
            <div className="stat-header">
              <FaExclamationTriangle /> <span>Expiring Soon</span>
            </div>
            <div className="stat-value text-yellow-600">
              {pharmacyProducts.filter(p => p.daysUntilExpiry <= 30 && !p.isExpired).length}
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('expired')}>
            <div className="stat-header">
              <FaBan /> <span>Expired</span>
            </div>
            <div className="stat-value text-red-600">
              {pharmacyProducts.filter(p => p.isExpired).length}
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('prescription')}>
            <div className="stat-header">
              <FaPills /> <span>Prescription</span>
            </div>
            <div className="stat-value text-blue-600">
              {pharmacyProducts.filter(p => p.isPrescriptionRequired).length}
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('refrigerated')}>
            <div className="stat-header">
              <FaSnowflake /> <span>Refrigerated</span>
            </div>
            <div className="stat-value text-cyan-600">
              {pharmacyProducts.filter(p => p.requiresRefrigeration).length}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {isPharmacy && (
        <div className="tabs-container">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' },
            { id: 'prescription', label: 'Prescription Only' },
            { id: 'controlled', label: 'Controlled' },
            { id: 'recalled', label: 'Recalled' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-pill ${activeTab === tab.id ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter Controls (Expiring) */}
      {activeTab === 'expiring' && (
        <div className="filter-options">
          <label className="text-sm font-medium text-gray-700">Show items expiring within:</label>
          <select
            className="filter-select"
            value={expiringDays}
            onChange={(e) => setExpiringDays(e.target.value)}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <table className="modern-table">
          <thead>
            {isPharmacy && activeTab !== 'all' ? (
              <tr>
                <th>Product</th>
                <th>Batch#</th>
                <th>Ingredient</th>
                <th>Strength</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Attributes</th>
                <th>Actions</th>
              </tr>
            ) : (
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                {isPharmacy && <th>Generic</th>}
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock Config</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {(isPharmacy && activeTab !== 'all' ? pharmacyProducts : products).length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  No products found matching relevant criteria.
                </td>
              </tr>
            ) : (
              (isPharmacy && activeTab !== 'all' ? pharmacyProducts : products).map((product) => {
                // Determine render logic based on listing type
                if (isPharmacy && activeTab !== 'all') {
                  // Pharmacy Row
                  return (
                    <tr key={product.id}>
                      <td className="font-medium text-gray-900">{getProductName(product.productId)}</td>
                      <td className="text-gray-500">{product.batchNumber}</td>
                      <td>{product.activeIngredient}</td>
                      <td>{product.strength}</td>
                      <td>
                        <div className="flex flex-col">
                          <span>{product.expiryDate}</span>
                          <span className="text-xs text-gray-500">{product.daysUntilExpiry} days left</span>
                        </div>
                      </td>
                      <td>
                        {product.isRecalled ? (
                          <span className="badge-soft badge-red">RECALLED</span>
                        ) : product.isExpired ? (
                          <span className="badge-soft badge-red">EXPIRED</span>
                        ) : product.daysUntilExpiry <= 30 ? (
                          <span className="badge-soft badge-yellow">Expiring Soon</span>
                        ) : (
                          <span className="badge-soft badge-green">Good</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {product.isPrescriptionRequired && (
                            <span className="badge-soft badge-blue">{product.prescriptionType}</span>
                          )}
                          {product.requiresRefrigeration && (
                            <span className="badge-soft badge-cyan">Cold Chain</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-icon-btn action-delete"
                          title="Recall Product"
                          onClick={() => handleRecall(product.id)}
                          disabled={product.isRecalled}
                        >
                          <AlertTriangle size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                } else {
                  // Standard Row
                  const genericName = product.industrySpecificAttributes?.genericName || '-';
                  const isPrescription = product.industrySpecificAttributes?.isPrescriptionRequired || false;
                  const unit = product.unit || 'UNIT';

                  return (
                    <tr key={product.id}>
                      <td className="text-gray-500 text-xs font-mono">{product.sku}</td>
                      <td className="font-medium text-gray-900">{product.name}</td>
                      {isPharmacy && <td className="text-gray-500 italic">{genericName}</td>}
                      <td><span className="badge-soft badge-gray">{product.category || '-'}</span></td>
                      <td>{product.brand || '-'}</td>
                      <td className="font-bold text-gray-700">${product.price?.toFixed(2)}</td>
                      <td>
                        <div className="flex flex-col text-xs text-gray-500">
                          <span>Unit: {unit}</span>
                          <span className={product.reorderLevel <= 10 ? 'text-red-600 font-bold' : ''}>
                            Reorder: {product.reorderLevel || 'Not Set'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {product.isActive ? (
                            <span className="badge-soft badge-green">Active</span>
                          ) : (
                            <span className="badge-soft badge-red">Inactive</span>
                          )}
                          {isPrescription && <span className="badge-soft badge-red">Rx</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="action-icon-btn action-edit" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-icon-btn action-delete"
                            title="Delete"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Products;
