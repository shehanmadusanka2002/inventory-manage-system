import { useEffect, useState } from 'react';
import { warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';

const primaryButtonStyle = {
  padding: '10px 24px', borderRadius: '9px', border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
  color: '#fff', fontWeight: 700, fontSize: '13.5px',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  boxShadow: '0 2px 8px rgba(99,102,241,0.30)',
  transition: 'opacity 0.18s',
};

function Warehouses() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [viewWarehouse, setViewWarehouse] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    orgId: user?.orgId || 1,
    branchId: '',
    warehouseType: 'DRY_STORAGE',
    storageCapacity: '',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (user?.orgId) {
      fetchWarehouses();
    }
  }, [user]);

  const fetchWarehouses = async () => {
    try {
      const orgId = user?.orgId || 1;
      const [warehouseRes, branchRes] = await Promise.all([
        warehouseService.getByOrganization(orgId),
        warehouseService.getBranches(orgId)
      ]);
      setWarehouses(warehouseRes.data);
      setBranches(branchRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        // Serialize to JSON string for the backend 'attributes' field
        warehouseData.attributes = JSON.stringify(attributesObj);
      }


      // Ensure branchId is null if empty string
      const payload = { ...warehouseData };
      if (!payload.branchId) payload.branchId = null;

      if (isEditing) {
        await warehouseService.update(editId, payload);
      } else {
        await warehouseService.create(payload);
      }

      setShowModal(false);
      fetchWarehouses();
      resetForm();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const handleEdit = (warehouse) => {
    let attrs = [];
    try {
      const parsed = typeof warehouse.attributes === 'string'
        ? JSON.parse(warehouse.attributes)
        : (warehouse.warehouseAttributes || {});
      attrs = Object.entries(parsed).map(([key, value]) => ({ key, value }));
    } catch (e) { }

    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      orgId: warehouse.orgId,
      branchId: warehouse.branchId || '',
      warehouseType: warehouse.warehouseType,
      storageCapacity: warehouse.storageCapacity || '',
      isActive: warehouse.isActive
    });
    setAttributes(attrs);
    setIsEditing(true);
    setEditId(warehouse.id);
    setShowModal(true);
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
      branchId: '',
      warehouseType: 'DRY_STORAGE',
      storageCapacity: '',
      isActive: true
    });
    setIsEditing(false);
    setEditId(null);
    setAttributes([]);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses</h1>
      </div>

      <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={openNewModal} style={primaryButtonStyle}>
          <Plus size={16} /> Add New Warehouse
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Type</th>
                <th>Branch</th>
                <th style={{ minWidth: '140px' }}>Capacity</th>
                <th>Attributes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => {
                // Parse attributes
                let attrs = {};
                try {
                  attrs = typeof warehouse.attributes === 'string'
                    ? JSON.parse(warehouse.attributes)
                    : (warehouse.warehouseAttributes || {});
                } catch (e) { /* ignore */ }

                const capacity = warehouse.storageCapacity || 1; // prevent div by zero
                const usage = warehouse.currentUsage || 0;
                const percent = Math.min(Math.round((usage / capacity) * 100), 100);

                return (
                  <tr key={warehouse.id}>
                    <td>{warehouse.name}</td>
                    <td>{warehouse.location}</td>
                    <td>{warehouse.warehouseType?.replace(/_/g, ' ')}</td>
                    <td>
                      {warehouse.branchId ? (
                        <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                          {warehouse.branchName || `Branch #${warehouse.branchId}`}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          Main (No Branch)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                          <span>{usage} used</span>
                          <span>{warehouse.storageCapacity ? `${warehouse.storageCapacity} max` : '∞'}</span>
                        </div>
                        {warehouse.storageCapacity ? (
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: percent > 90 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#22c55e',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>No limit set</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {Object.keys(attrs).length > 0 ? (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {Object.entries(attrs).slice(0, 3).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {String(value)}
                            </div>
                          ))}
                          {Object.keys(attrs).length > 3 && <div>...</div>}
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setViewWarehouse(warehouse)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(warehouse)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Warehouse' : 'Add New Warehouse'}</h2>
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
                <label>Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">None / Default (Main Warehouse)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.locationName} ({b.branchCode})
                    </option>
                  ))}
                </select>
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
                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Warehouse' : 'Create Warehouse'}</button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Warehouse Modal */}
      {viewWarehouse && (
        <div className="modal" onClick={() => setViewWarehouse(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111827' }}>Warehouse Details</h2>
              <button
                onClick={() => setViewWarehouse(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Name</label>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{viewWarehouse.name}</div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Location</label>
                <div style={{ fontSize: '16px', color: '#374151' }}>{viewWarehouse.location}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Type</label>
                  <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{viewWarehouse.warehouseType?.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Status</label>
                  <span className={`badge ${viewWarehouse.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {viewWarehouse.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Capacity</label>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {viewWarehouse.storageCapacity ? `${viewWarehouse.storageCapacity} units` : 'Unlimited'}
                </div>
              </div>

              {viewWarehouse.attributes && Object.keys(JSON.parse(viewWarehouse.attributes || '{}')).length > 0 && (
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Attributes</label>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {Object.entries(JSON.parse(viewWarehouse.attributes)).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>{k}:</span>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setViewWarehouse(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;
