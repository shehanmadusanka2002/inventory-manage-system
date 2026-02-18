import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, pharmacyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaBox, FaExclamationTriangle, FaBan, FaPills, FaSnowflake } from 'react-icons/fa';

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
    <div>
      <div className="page-header">
        <h1><FaBox /> Products {isPharmacy && '& Pharmacy Management'}</h1>
        {isPharmacy && <p>Batch tracking, expiry dates, and prescription management</p>}
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => navigate('/products/register')}>
          Register Product with Stock
        </button>
        {isPharmacy && (
          <button className="btn btn-secondary" onClick={handleUpdateExpiry}>
            Update Expiry Statuses
          </button>
        )}
      </div>

      {/* Pharmacy Stats Cards */}
      {isPharmacy && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: '1rem 0' }}>
          <div className="stat-card" onClick={() => setActiveTab('expiring')} style={{ cursor: 'pointer' }}>
            <div className="stat-info">
              <h3><FaExclamationTriangle /> Expiring Soon</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {pharmacyProducts.filter(p => p.daysUntilExpiry <= 30 && !p.isExpired).length}
              </p>
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('expired')} style={{ cursor: 'pointer' }}>
            <div className="stat-info">
              <h3><FaBan /> Expired</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {pharmacyProducts.filter(p => p.isExpired).length}
              </p>
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('prescription')} style={{ cursor: 'pointer' }}>
            <div className="stat-info">
              <h3><FaPills /> Prescription</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {pharmacyProducts.filter(p => p.isPrescriptionRequired).length}
              </p>
            </div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('refrigerated')} style={{ cursor: 'pointer' }}>
            <div className="stat-info">
              <h3><FaSnowflake /> Refrigerated</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {pharmacyProducts.filter(p => p.requiresRefrigeration).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Tabs */}
      {isPharmacy && (
        <>
          <div className="tabs">
            <button 
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              All Products
            </button>
            <button 
              className={activeTab === 'expiring' ? 'active' : ''}
              onClick={() => setActiveTab('expiring')}
            >
              Expiring Soon
            </button>
            <button 
              className={activeTab === 'expired' ? 'active' : ''}
              onClick={() => setActiveTab('expired')}
            >
              Expired
            </button>
            <button 
              className={activeTab === 'prescription' ? 'active' : ''}
              onClick={() => setActiveTab('prescription')}
            >
              Prescription Only
            </button>
            <button 
              className={activeTab === 'controlled' ? 'active' : ''}
              onClick={() => setActiveTab('controlled')}
            >
              Controlled
            </button>
            <button 
              className={activeTab === 'recalled' ? 'active' : ''}
              onClick={() => setActiveTab('recalled')}
            >
              Recalled
            </button>
          </div>

          {activeTab === 'expiring' && (
            <div style={{ margin: '1rem 0' }}>
              <label>Show items expiring within: </label>
              <select value={expiringDays} onChange={(e) => setExpiringDays(e.target.value)}>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          )}
        </>
      )}

      <div className="card">
        <div className="table-container">
          {isPharmacy && activeTab !== 'all' ? (
            /* Pharmacy-specific table */
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Batch#</th>
                  <th>Ingredient</th>
                  <th>Strength</th>
                  <th>Expiry Date</th>
                  <th>Days Until Expiry</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                      No pharmacy products found
                    </td>
                  </tr>
                ) : (
                  pharmacyProducts.map((product) => (
                    <tr key={product.id} style={product.isExpired ? { backgroundColor: '#fee2e2' } : product.daysUntilExpiry <= 30 ? { backgroundColor: '#fef3c7' } : {}}>
                      <td>{getProductName(product.productId)}</td>
                      <td>{product.batchNumber}</td>
                      <td>{product.activeIngredient}</td>
                      <td>{product.strength}</td>
                      <td>{product.expiryDate}</td>
                      <td>
                        <span style={{ 
                          color: product.isExpired ? '#ef4444' : product.daysUntilExpiry <= 30 ? '#f59e0b' : '#10b981'
                        }}>
                          {product.daysUntilExpiry} days
                        </span>
                      </td>
                      <td>
                        {product.isPrescriptionRequired && (
                          <span className="badge" style={{ backgroundColor: '#3b82f6' }}>
                            {product.prescriptionType}
                          </span>
                        )}
                        {product.requiresRefrigeration && (
                          <span className="badge" style={{ backgroundColor: '#06b6d4', marginLeft: '0.5rem' }}>
                            <FaSnowflake /> Cold
                          </span>
                        )}
                      </td>
                      <td>
                        {product.isRecalled ? (
                          <span className="badge" style={{ backgroundColor: '#ef4444' }}>RECALLED</span>
                        ) : product.isExpired ? (
                          <span className="badge" style={{ backgroundColor: '#ef4444' }}>EXPIRED</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#10b981' }}>Active</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleRecall(product.id)}
                          disabled={product.isRecalled}
                        >
                          Recall
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Standard products table */
            <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                {isPharmacy && <th>Generic Name</th>}
                <th>Category</th>
                <th>Brand</th>
                <th>Unit</th>
                <th>Selling Price</th>
                {isPharmacy && <th>Prescription</th>}
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={isPharmacy ? "11" : "9"} style={{ textAlign: 'center', padding: '2rem' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const genericName = product.industrySpecificAttributes?.genericName || '-';
                  const isPrescription = product.industrySpecificAttributes?.isPrescriptionRequired || false;
                  
                  return (
                    <tr key={product.id}>
                      <td><strong>{product.sku}</strong></td>
                      <td>{product.name}</td>
                      {isPharmacy && <td style={{ color: '#6b7280' }}>{genericName}</td>}
                      <td>{product.category || '-'}</td>
                      <td>{product.brand || '-'}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#6b7280' }}>
                          {product.unit || 'UNIT'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#059669' }}>${product.price?.toFixed(2) || '0.00'}</td>
                      {isPharmacy && (
                        <td>
                          {isPrescription ? (
                            <span className="badge" style={{ backgroundColor: '#dc2626' }}>
                              <FaPills /> Required
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#10b981' }}>OTC</span>
                          )}
                        </td>
                      )}
                      <td>
                        <span style={{ 
                          color: product.reorderLevel <= 10 ? '#ef4444' : '#6b7280',
                          fontWeight: product.reorderLevel <= 10 ? 'bold' : 'normal'
                        }}>
                          {product.reorderLevel || 10}
                        </span>
                      </td>
                      <td>
                        {product.isActive ? (
                          <span className="badge" style={{ backgroundColor: '#10b981' }}>Active</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#ef4444' }}>Inactive</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
