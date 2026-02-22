import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, warehouseService, categoryService, brandService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './UnifiedProductRegistration.css';

function UnifiedProductRegistration({ categories: propsCategories, brands: propsBrands, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState(propsCategories || []);
  const [brands, setBrands] = useState(propsBrands || []);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    unit: 'UNIT',
    reorderLevel: '',
    orgId: user?.orgId || null,
    industryType: user?.industryType || 'GENERAL',
    genericName: '',
    isPrescriptionRequired: false,
    isRefrigerated: false,
    initialBatch: {
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      warehouseId: ''
    }
  });

  const [errors, setErrors] = useState({});

  const fetchDependencies = useCallback(async () => {
    try {
      const promises = [];
      if (user?.orgId) {
        promises.push(warehouseService.getByOrganization(user.orgId).then(res => setWarehouses(res.data)));
      }

      // If props aren't provided, fetch them locally (for standalone page support)
      if (!propsCategories) {
        promises.push(categoryService.getAll().then(res => setCategories(res.data)));
      }
      if (!propsBrands) {
        promises.push(brandService.getAll().then(res => setBrands(res.data)));
      }

      // Fetch Next SKU
      const orgId = user?.orgId || 1;
      promises.push(productService.getNextSku(orgId).then(res => {
        setFormData(prev => ({ ...prev, sku: res.data }));
      }));

      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  }, [user?.orgId, propsCategories, propsBrands]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Sync state if props change
  useEffect(() => {
    if (propsCategories) setCategories(propsCategories);
    if (propsBrands) setBrands(propsBrands);
  }, [propsCategories, propsBrands]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('batch_')) {
      const batchField = name.replace('batch_', '');
      setFormData(prev => ({
        ...prev,
        initialBatch: {
          ...prev.initialBatch,
          [batchField]: type === 'number' ? (value ? Number(value) : '') : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (!formData.initialBatch.warehouseId) newErrors.warehouseId = 'Warehouse is required';
    if (!formData.initialBatch.quantity || formData.initialBatch.quantity <= 0) newErrors.quantity = 'Valid initial quantity is required';
    if (!formData.initialBatch.purchasePrice || formData.initialBatch.purchasePrice <= 0) newErrors.purchasePrice = 'Valid purchase price is required';

    if (user?.industryType === 'PHARMACY' && !formData.genericName) {
      newErrors.genericName = 'Generic name is required for pharmacy';
    }
    if (user?.industryType === 'PHARMACY' && !formData.initialBatch.expiryDate) {
      newErrors['initialBatch.expiryDate'] = 'Expiry date is required for pharmacy products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData = {
        ...formData,
        price: Number(formData.price),
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 10,
        orgId: user.orgId,
        initialBatch: {
          ...formData.initialBatch,
          quantity: Number(formData.initialBatch.quantity),
          purchasePrice: Number(formData.initialBatch.purchasePrice),
          warehouseId: Number(formData.initialBatch.warehouseId)
        }
      };

      const response = await productService.registerWithStock(requestData);
      alert(`Product registered successfully!`);

      // Auto-fetch next SKU after registration if it's not closing
      if (!onRefresh) {
        try {
          const orgId = user?.orgId || 1;
          const res = await productService.getNextSku(orgId);
          setFormData(prev => ({ ...prev, sku: res.data }));
        } catch (e) {
          console.error('Error fetching next SKU:', e);
        }
      }

      if (onRefresh) {
        onRefresh(response.data);
      } else {
        navigate('/products');
      }
    } catch (error) {
      console.error('Error registering product:', error);
      alert(error.response?.data?.message || 'Failed to register product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onRefresh) {
      onRefresh(null); // Assuming this triggers closing the modal
    } else if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/products');
    }
  };

  const isPharmacy = user?.industryType === 'PHARMACY';
  const isManufacturing = user?.industryType === 'MANUFACTURING';

  return (
    <div className="upr-overlay">
      <div className="upr-container">
        <div className="upr-header">
          <h2>Register New Product</h2>
          <button className="upr-close-btn" onClick={handleCancel} type="button">×</button>
        </div>

        <div className="upr-content">
          <form onSubmit={handleSubmit}>
            <div className="upr-section">
              <h3 className="upr-section-title">Product Details</h3>
              <div className="upr-grid">

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="sku">SKU <span className="upr-required">*</span></label>
                  <input
                    type="text" id="sku" name="sku"
                    value={formData.sku} onChange={handleChange}
                    placeholder={isManufacturing ? "e.g., MFG-001" : isPharmacy ? "e.g., PHR-001" : "e.g., PRD-001"}
                    className="upr-input" style={errors.sku ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  />
                  {errors.sku && <span className="upr-error-text">{errors.sku}</span>}
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="name">Product Name <span className="upr-required">*</span></label>
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., Aspirin Tablets" : "e.g., Steel Sheet 2mm"}
                    className="upr-input" style={errors.name ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  />
                  {errors.name && <span className="upr-error-text">{errors.name}</span>}
                </div>

                {isPharmacy && (
                  <div className="upr-form-group upr-full-width">
                    <label className="upr-label" htmlFor="genericName">Generic Name <span className="upr-required">*</span></label>
                    <input
                      type="text" id="genericName" name="genericName"
                      value={formData.genericName} onChange={handleChange}
                      placeholder="e.g., Acetylsalicylic Acid"
                      className="upr-input" style={errors.genericName ? { borderColor: '#dc2626' } : {}}
                      disabled={loading}
                    />
                    {errors.genericName && <span className="upr-error-text">{errors.genericName}</span>}
                  </div>
                )}

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="category">Category <span className="upr-required">*</span></label>
                  <select
                    id="category" name="category"
                    value={formData.category} onChange={handleChange}
                    className="upr-select" style={errors.category ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <span className="upr-error-text">{errors.category}</span>}
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="brand">Brand</label>
                  <select
                    id="brand" name="brand"
                    value={formData.brand} onChange={handleChange}
                    className="upr-select"
                    disabled={loading}
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="price">Selling Price <span className="upr-required">*</span></label>
                  <input
                    type="number" id="price" name="price"
                    value={formData.price} onChange={handleChange}
                    placeholder="0.00" step="0.01" min="0"
                    className="upr-input" style={errors.price ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  />
                  {errors.price && <span className="upr-error-text">{errors.price}</span>}
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="unit">Unit</label>
                  <select
                    id="unit" name="unit"
                    value={formData.unit} onChange={handleChange}
                    className="upr-select" disabled={loading}
                  >
                    <option value="UNIT">Unit</option>
                    <option value="PCS">Pieces</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="KG">Kilogram</option>
                    <option value="LBS">Pounds</option>
                    <option value="LITER">Liter</option>
                    <option value="GAL">Gallon</option>
                  </select>
                </div>

                <div className="upr-form-group upr-full-width">
                  <label className="upr-label" htmlFor="reorderLevel">Reorder Level</label>
                  <input
                    type="number" id="reorderLevel" name="reorderLevel"
                    value={formData.reorderLevel} onChange={handleChange}
                    placeholder="10" min="0" className="upr-input" disabled={loading}
                  />
                </div>

                <div className="upr-form-group upr-full-width">
                  <label className="upr-label" htmlFor="description">Description</label>
                  <textarea
                    id="description" name="description"
                    value={formData.description} onChange={handleChange}
                    placeholder="Product description..." rows="3"
                    className="upr-textarea" disabled={loading}
                  />
                </div>
              </div>

              {isPharmacy && (
                <div className="upr-pharmacy-settings">
                  <div className="upr-checkbox-group">
                    <input
                      type="checkbox" id="isPrescriptionRequired" name="isPrescriptionRequired"
                      checked={formData.isPrescriptionRequired} onChange={handleChange}
                      className="upr-checkbox" disabled={loading}
                    />
                    <label htmlFor="isPrescriptionRequired" className="upr-checkbox-label">Prescription Required</label>
                  </div>
                  <div className="upr-checkbox-group">
                    <input
                      type="checkbox" id="isRefrigerated" name="isRefrigerated"
                      checked={formData.isRefrigerated} onChange={handleChange}
                      className="upr-checkbox" disabled={loading}
                    />
                    <label htmlFor="isRefrigerated" className="upr-checkbox-label">Refrigerated</label>
                  </div>
                </div>
              )}
            </div>

            <div className="upr-section">
              <h3 className="upr-section-title">Initial Stock & Batch Information</h3>
              <div className="upr-grid">

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="batch_warehouseId">Warehouse <span className="upr-required">*</span></label>
                  <select
                    id="batch_warehouseId" name="batch_warehouseId"
                    value={formData.initialBatch.warehouseId} onChange={handleChange}
                    className="upr-select" style={errors.warehouseId ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && <span className="upr-error-text">{errors.warehouseId}</span>}
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="batch_batchNumber">Batch Number</label>
                  <input
                    type="text" id="batch_batchNumber" name="batch_batchNumber"
                    value={formData.initialBatch.batchNumber} onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., BATCH-2024-001" : "Optional"}
                    className="upr-input" disabled={loading}
                  />
                </div>

                {isPharmacy && (
                  <div className="upr-form-group upr-full-width">
                    <label className="upr-label" htmlFor="batch_expiryDate">Expiry Date</label>
                    <input
                      type="date" id="batch_expiryDate" name="batch_expiryDate"
                      value={formData.initialBatch.expiryDate} onChange={handleChange}
                      className="upr-input" disabled={loading}
                    />
                  </div>
                )}

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="batch_quantity">Initial Quantity <span className="upr-required">*</span></label>
                  <input
                    type="number" id="batch_quantity" name="batch_quantity"
                    value={formData.initialBatch.quantity} onChange={handleChange}
                    placeholder="0" min="0" className="upr-input"
                    style={errors.quantity ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  />
                  {errors.quantity && <span className="upr-error-text">{errors.quantity}</span>}
                </div>

                <div className="upr-form-group">
                  <label className="upr-label" htmlFor="batch_purchasePrice">Purchase Price <span className="upr-required">*</span></label>
                  <input
                    type="number" id="batch_purchasePrice" name="batch_purchasePrice"
                    value={formData.initialBatch.purchasePrice} onChange={handleChange}
                    placeholder="0.00" step="0.01" min="0" className="upr-input"
                    style={errors.purchasePrice ? { borderColor: '#dc2626' } : {}}
                    disabled={loading}
                  />
                  {errors.purchasePrice && <span className="upr-error-text">{errors.purchasePrice}</span>}
                </div>
              </div>

              {formData.price && formData.initialBatch.purchasePrice && (
                <div className="upr-profit-alert">
                  <strong>Profit Margin:</strong>
                  <span>{((formData.price - formData.initialBatch.purchasePrice) / formData.price * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>

            <div className="upr-footer">
              <button type="button" className="upr-btn-cancel" onClick={handleCancel} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="upr-btn-submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Product & Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UnifiedProductRegistration;
