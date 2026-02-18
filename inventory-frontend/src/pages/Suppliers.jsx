import { useEffect, useState } from 'react';
import { supplierService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [contactDetails, setContactDetails] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    orgId: user?.orgId || 1
  });

  useEffect(() => {
    if (user?.orgId) {
      fetchSuppliers();
    }
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const orgId = user?.orgId || 1;
      const response = await supplierService.getByOrganization(orgId);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const supplierData = { ...formData };
      if (contactDetails.length > 0) {
        const contactObj = {};
        contactDetails.forEach(detail => {
          if (detail.key && detail.value) {
            contactObj[detail.key] = detail.value;
          }
        });
        supplierData.contactInfo = contactObj;
      }
      await supplierService.create(supplierData);
      setShowModal(false);
      fetchSuppliers();
      resetForm();
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierService.delete(id);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const addContactDetail = () => {
    setContactDetails([...contactDetails, { key: '', value: '' }]);
  };

  const removeContactDetail = (index) => {
    setContactDetails(contactDetails.filter((_, i) => i !== index));
  };

  const updateContactDetail = (index, field, value) => {
    const updatedDetails = [...contactDetails];
    updatedDetails[index][field] = value;
    setContactDetails(updatedDetails);
  };

  const resetForm = () => {
    setFormData({ name: '', orgId: user?.orgId || 1 });
    setContactDetails([]);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Suppliers</h1>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add New Supplier
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.id}</td>
                  <td>{supplier.name}</td>
                  <td>
                    {supplier.contactInfo && Object.keys(supplier.contactInfo).length > 0 ? (
                      <div style={{ fontSize: '12px', maxWidth: '250px' }}>
                        {Object.entries(supplier.contactInfo).map(([key, value]) => (
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
                    {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(supplier.id)}>
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
              <h2>Add New Supplier</h2>
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
                <label>Contact Information</label>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addContactDetail}
                    style={{ fontSize: '14px', padding: '5px 10px' }}
                  >
                    + Add Contact Detail
                  </button>
                </div>
                {contactDetails.map((detail, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Field (e.g., email, phone)"
                      value={detail.key}
                      onChange={(e) => updateContactDetail(index, 'key', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={detail.value}
                      onChange={(e) => updateContactDetail(index, 'value', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeContactDetail(index)}
                      style={{ fontSize: '14px', padding: '5px 10px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Create Supplier</button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
