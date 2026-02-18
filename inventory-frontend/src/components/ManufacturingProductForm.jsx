import { useState } from 'react';
import { Box, Package, DollarSign, Warehouse, User, Hash } from 'lucide-react';
import './ManufacturingProductForm.css';

function ManufacturingProductForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    // Card 1: Item Details
    partNumber: '',
    itemName: '',
    itemType: 'RAW_MATERIAL',
    uom: 'PCS',
    standardCost: '',
    minimumStockLevel: '',
    supplier: '',
    salesPrice: '',
    
    // Card 2: Initial Stock (Optional)
    warehouse: '',
    binLocation: '',
    lotNumber: '',
    quantity: ''
  });

  const [errors, setErrors] = useState({});

  const itemTypes = [
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
    { value: 'SUB_ASSEMBLY', label: 'Sub-Assembly' },
    { value: 'FINISHED_GOOD', label: 'Finished Good' }
  ];

  const uomOptions = [
    'PCS', 'KG', 'LBS', 'M', 'FT', 'L', 'GAL', 'BOX', 'ROLL', 'SHEET'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part Number is required';
    }
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item Name is required';
    }
    if (!formData.standardCost || parseFloat(formData.standardCost) <= 0) {
      newErrors.standardCost = 'Valid Standard Cost is required';
    }
    if (!formData.minimumStockLevel || parseInt(formData.minimumStockLevel) < 0) {
      newErrors.minimumStockLevel = 'Valid Minimum Stock Level is required';
    }
    
    // Conditional validations
    if (formData.itemType === 'RAW_MATERIAL' && !formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required for Raw Materials';
    }
    if (formData.itemType === 'FINISHED_GOOD' && (!formData.salesPrice || parseFloat(formData.salesPrice) <= 0)) {
      newErrors.salesPrice = 'Valid Sales Price is required for Finished Goods';
    }
    
    // Initial stock validation (if any field is filled, validate all)
    const stockFields = [formData.warehouse, formData.quantity];
    const hasStockData = stockFields.some(field => field && field.toString().trim());
    
    if (hasStockData) {
      if (!formData.warehouse) {
        newErrors.warehouse = 'Warehouse is required when adding initial stock';
      }
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        newErrors.quantity = 'Valid Quantity is required when adding initial stock';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="mfg-form-overlay">
      <div className="mfg-form-container">
        <div className="mfg-form-header">
          <h2>
            <Package className="header-icon" />
            Create Manufacturing Item
          </h2>
          <button className="close-btn" onClick={onCancel} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mfg-form">
          {/* Card 1: Item Details */}
          <div className="mfg-card">
            <div className="card-header">
              <Box size={20} />
              <h3>Item Details</h3>
            </div>
            
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="partNumber">
                    <Hash size={16} />
                    Part Number (SKU) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="partNumber"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                    placeholder="e.g., MFG-001"
                    className={errors.partNumber ? 'error' : ''}
                  />
                  {errors.partNumber && <span className="error-message">{errors.partNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="itemName">
                    <Package size={16} />
                    Item Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="e.g., Steel Sheet 2mm"
                    className={errors.itemName ? 'error' : ''}
                  />
                  {errors.itemName && <span className="error-message">{errors.itemName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="itemType">
                    <Box size={16} />
                    Item Type <span className="required">*</span>
                  </label>
                  <select
                    id="itemType"
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleChange}
                  >
                    {itemTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="uom">
                    Unit of Measure <span className="required">*</span>
                  </label>
                  <select
                    id="uom"
                    name="uom"
                    value={formData.uom}
                    onChange={handleChange}
                  >
                    {uomOptions.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="standardCost">
                    <DollarSign size={16} />
                    Standard Cost <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="standardCost"
                    name="standardCost"
                    value={formData.standardCost}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={errors.standardCost ? 'error' : ''}
                  />
                  {errors.standardCost && <span className="error-message">{errors.standardCost}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="minimumStockLevel">
                    Minimum Stock Level <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="minimumStockLevel"
                    name="minimumStockLevel"
                    value={formData.minimumStockLevel}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={errors.minimumStockLevel ? 'error' : ''}
                  />
                  {errors.minimumStockLevel && <span className="error-message">{errors.minimumStockLevel}</span>}
                </div>
              </div>

              {/* Dynamic Fields */}
              {formData.itemType === 'RAW_MATERIAL' && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="supplier">
                      <User size={16} />
                      Supplier <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                      className={errors.supplier ? 'error' : ''}
                    />
                    {errors.supplier && <span className="error-message">{errors.supplier}</span>}
                  </div>
                </div>
              )}

              {formData.itemType === 'FINISHED_GOOD' && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="salesPrice">
                      <DollarSign size={16} />
                      Sales Price <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="salesPrice"
                      name="salesPrice"
                      value={formData.salesPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={errors.salesPrice ? 'error' : ''}
                    />
                    {errors.salesPrice && <span className="error-message">{errors.salesPrice}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Initial Stock */}
          <div className="mfg-card">
            <div className="card-header">
              <Warehouse size={20} />
              <h3>Initial Stock <span className="optional">(Optional)</span></h3>
            </div>
            
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="warehouse">
                    <Warehouse size={16} />
                    Warehouse
                  </label>
                  <select
                    id="warehouse"
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleChange}
                    className={errors.warehouse ? 'error' : ''}
                  >
                    <option value="">Select Warehouse</option>
                    <option value="MAIN_WH">Main Warehouse</option>
                    <option value="PROD_WH">Production Warehouse</option>
                    <option value="FG_WH">Finished Goods Warehouse</option>
                    <option value="RAW_MAT_WH">Raw Materials Warehouse</option>
                  </select>
                  {errors.warehouse && <span className="error-message">{errors.warehouse}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="binLocation">
                    Bin/Rack Location
                  </label>
                  <input
                    type="text"
                    id="binLocation"
                    name="binLocation"
                    value={formData.binLocation}
                    onChange={handleChange}
                    placeholder="e.g., A-01-05"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lotNumber">
                    <Hash size={16} />
                    Lot Number
                  </label>
                  <input
                    type="text"
                    id="lotNumber"
                    name="lotNumber"
                    value={formData.lotNumber}
                    onChange={handleChange}
                    placeholder="e.g., LOT-2026-001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={errors.quantity ? 'error' : ''}
                  />
                  {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              <Package size={18} />
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManufacturingProductForm;
