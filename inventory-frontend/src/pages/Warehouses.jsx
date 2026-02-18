import { useEffect, useState } from 'react';
import { warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Warehouses() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    orgId: user?.orgId || 1,
    branchId: null,
    warehouseType: 'DRY_STORAGE',
    storageCapacity: '',
    isActive: true
  });

  useEffect(() => {
    if (user?.orgId) {
      fetchWarehouses();
    }
  }, [user]);

  const fetchWarehouses = async () => {
    try {
      const orgId = user?.orgId || 1;
      const response = await warehouseService.getByOrganization(orgId);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const warehouseData = { ...formData };
      if (attributes.length > 0) {
        const attributesObj = {};
        attributes.forEach(attr => {
          if (attr.key && attr.value) {
            attributesObj[attr.key] = attr.value;
          }
        });
        warehouseData.warehouseAttributes = attributesObj;
      }
      await warehouseService.create(warehouseData);
      setShowModal(false);
      fetchWarehouses();
      resetForm();
    } catch (error) {
      console.error('Error creating warehouse:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await warehouseService.delete(id);
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
      }
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index, field, value) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index][field] = value;
    setAttributes(updatedAttributes);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      location: '', 
      orgId: user?.orgId || 1,
      branchId: null,
      warehouseType: 'DRY_STORAGE',
      storageCapacity: '',
      isActive: true
    });
    setAttributes([]);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses</h1>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add New Warehouse
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Branch ID</th>
                <th>Attributes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td>{warehouse.id}</td>
                  <td>{warehouse.name}</td>
                  <td>{warehouse.location}</td>
                  <td>{warehouse.warehouseType?.replace(/_/g, ' ')}</td>
                  <td>{warehouse.storageCapacity || '-'}</td>
                  <td>{warehouse.branchId || '-'}</td>
                  <td>
                    {warehouse.warehouseAttributes && Object.keys(warehouse.warehouseAttributes).length > 0 ? (
                      <div style={{ fontSize: '12px', maxWidth: '200px' }}>
                        {Object.entries(warehouse.warehouseAttributes).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '4px' }}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${warehouse.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(warehouse.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Warehouse</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Warehouse Type</label>
                <select
                  value={formData.warehouseType}
                  onChange={(e) => setFormData({ ...formData, warehouseType: e.target.value })}
                  required
                >
                  <option value="DRY_STORAGE">Dry Storage</option>
                  <option value="COLD_STORAGE">Cold Storage</option>
                  <option value="RAW_MATERIAL">Raw Material</option>
                  <option value="FINISHED_GOODS">Finished Goods</option>
                  <option value="TRANSIT">Transit</option>
                  <option value="RETAIL_OUTLET">Retail Outlet</option>
                </select>
              </div>
              <div className="form-group">
                <label>Storage Capacity</label>
                <input
                  type="number"
                  value={formData.storageCapacity}
                  onChange={(e) => setFormData({ ...formData, storageCapacity: e.target.value })}
                  placeholder="Capacity in units"
                />
              </div>
              <div className="form-group">
                <label>Branch ID (Optional)</label>
                <input
                  type="number"
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave empty if not assigned to branch"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  {' '}Active
                </label>
              </div>
              <div className="form-group">
                <label>Additional Attributes (Optional)</label>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addAttribute}
                    style={{ fontSize: '14px', padding: '5px 10px' }}
                  >
                    + Add Attribute
                  </button>
                </div>
                {attributes.map((attr, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Key (e.g., temperature)"
                      value={attr.key}
                      onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., -20°C)"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeAttribute(index)}
                      style={{ fontSize: '14px', padding: '5px 10px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Create Warehouse</button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;
