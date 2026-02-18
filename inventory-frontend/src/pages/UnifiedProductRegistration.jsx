import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaBox, FaBoxes, FaDollarSign, FaWarehouse, FaHashtag } from 'react-icons/fa';
import '../components/ManufacturingProductForm.css';

function UnifiedProductRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  
  const [formData, setFormData] = useState({
    // Product Details
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
    
    // Pharmacy-specific fields
    genericName: '',
    isPrescriptionRequired: false,
    
    // Initial Stock/Batch
    initialBatch: {
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      warehouseId: ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      if (user?.orgId) {
        const response = await warehouseService.getByOrganization(user.orgId);
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

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
    
    // Product validation
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    // Initial stock validation
    if (!formData.initialBatch.warehouseId) {
      newErrors.warehouseId = 'Warehouse is required';
    }
    if (!formData.initialBatch.quantity || formData.initialBatch.quantity <= 0) {
      newErrors.quantity = 'Valid initial quantity is required';
    }
    if (!formData.initialBatch.purchasePrice || formData.initialBatch.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Valid purchase price is required';
    }
    
    // Pharmacy-specific validation
    if (user?.industryType === 'PHARMACY') {
      if (!formData.genericName) newErrors.genericName = 'Generic name is required for pharmacy';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      
      alert(`Product registered successfully!\nProduct ID: ${response.data.productId}\nStock ID: ${response.data.stockId}`);
      navigate('/products');
    } catch (error) {
      console.error('Error registering product:', error);
      alert(error.response?.data?.message || 'Failed to register product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/products');
    }
  };

  const isPharmacy = user?.industryType === 'PHARMACY';
  const isManufacturing = user?.industryType === 'MANUFACTURING';

  return (
    <div className="mfg-form-overlay" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="mfg-form-container" style={{ maxWidth: '900px', margin: '2rem auto' }}>
        <div className="mfg-form-header">
          <h2>
            <FaBoxes className="header-icon" />
            Register New Product
          </h2>
          <button className="close-btn" onClick={handleCancel} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mfg-form">
          {/* Card 1: Product Details */}
          <div className="mfg-card">
            <div className="card-header">
              <FaBox size={20} />
              <h3>Product Details</h3>
            </div>
            
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sku">
                    <FaHashtag size={14} />
                    SKU <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder={isManufacturing ? "e.g., MFG-001" : isPharmacy ? "e.g., PHR-001" : "e.g., PRD-001"}
                    className={errors.sku ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.sku && <span className="error-message">{errors.sku}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    <FaBoxes size={14} />
                    Product Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., Aspirin Tablets" : "e.g., Steel Sheet 2mm"}
                    className={errors.name ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
              </div>

              {isPharmacy && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="genericName">
                      Generic Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="genericName"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleChange}
                      placeholder="e.g., Acetylsalicylic Acid"
                      className={errors.genericName ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.genericName && <span className="error-message">{errors.genericName}</span>}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">
                    Category <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., Pain Relief" : "e.g., Electronics"}
                    className={errors.category ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.category && <span className="error-message">{errors.category}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="brand">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Bayer"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">
                    <FaDollarSign size={14} />
                    Selling Price <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={errors.price ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="unit">
                    Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={loading}
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
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="reorderLevel">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    id="reorderLevel"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Product description..."
                    rows="3"
                    disabled={loading}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {isPharmacy && (
                <div className="form-row">
                  <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isPrescriptionRequired"
                      name="isPrescriptionRequired"
                      checked={formData.isPrescriptionRequired}
                      onChange={handleChange}
                      disabled={loading}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <label htmlFor="isPrescriptionRequired" style={{ margin: 0, cursor: 'pointer' }}>
                      Prescription Required
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Initial Stock */}
          <div className="mfg-card">
            <div className="card-header">
              <FaWarehouse size={20} />
              <h3>Initial Stock & Batch Information</h3>
            </div>
            
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="batch_warehouseId">
                    <FaWarehouse size={14} />
                    Warehouse <span className="required">*</span>
                  </label>
                  <select
                    id="batch_warehouseId"
                    name="batch_warehouseId"
                    value={formData.initialBatch.warehouseId}
                    onChange={handleChange}
                    className={errors.warehouseId ? 'error' : ''}
                    disabled={loading}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && <span className="error-message">{errors.warehouseId}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="batch_batchNumber">
                    <FaHashtag size={14} />
                    Batch Number
                  </label>
                  <input
                    type="text"
                    id="batch_batchNumber"
                    name="batch_batchNumber"
                    value={formData.initialBatch.batchNumber}
                    onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., BATCH-2024-001" : "Optional"}
                    disabled={loading}
                  />
                </div>
              </div>

              {isPharmacy && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="batch_expiryDate">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      id="batch_expiryDate"
                      name="batch_expiryDate"
                      value={formData.initialBatch.expiryDate}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="batch_quantity">
                    Initial Quantity <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="batch_quantity"
                    name="batch_quantity"
                    value={formData.initialBatch.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={errors.quantity ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="batch_purchasePrice">
                    <FaDollarSign size={14} />
                    Purchase Price <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="batch_purchasePrice"
                    name="batch_purchasePrice"
                    value={formData.initialBatch.purchasePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={errors.purchasePrice ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.purchasePrice && <span className="error-message">{errors.purchasePrice}</span>}
                </div>
              </div>

              {formData.price && formData.initialBatch.purchasePrice && (
                <div style={{ 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #3b82f6', 
                  borderRadius: '0.375rem', 
                  padding: '1rem', 
                  marginTop: '1rem' 
                }}>
                  <strong style={{ color: '#1e40af' }}>Profit Margin:</strong>{' '}
                  <span style={{ color: '#1e40af', fontSize: '1.125rem', fontWeight: 'bold' }}>
                    {((formData.price - formData.initialBatch.purchasePrice) / formData.price * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              <FaBoxes size={16} />
              {loading ? 'Registering...' : 'Register Product & Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnifiedProductRegistration;
