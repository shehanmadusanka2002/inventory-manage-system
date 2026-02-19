import { useEffect, useState } from 'react';
import { supplierService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaPlus, FaMinus } from 'react-icons/fa';

// ── Modern UI Styles ──────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px',
};

const modalStyle = {
  background: '#fff', borderRadius: '16px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
  width: '100%', maxWidth: '500px',
  maxHeight: '90vh', overflowY: 'auto',
  fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
};

const fieldStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: '8px',
  fontSize: '13.5px', fontFamily: 'inherit',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.18s',
};

const labelStyle = {
  display: 'block', fontSize: '12px',
  fontWeight: 700, color: '#64748b',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const primaryButtonStyle = {
  padding: '10px 24px', borderRadius: '9px', border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
  color: '#fff', fontWeight: 700, fontSize: '13.5px',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  boxShadow: '0 2px 8px rgba(99,102,241,0.30)',
  transition: 'opacity 0.18s',
};

const secondaryButtonStyle = {
  padding: '10px 20px', borderRadius: '9px',
  border: '1.5px solid #e2e8f0', background: '#fff',
  color: '#64748b', fontWeight: 600, fontSize: '13.5px',
  cursor: 'pointer', fontFamily: 'inherit',
};

function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orgId: user?.orgId || 1
  });

  // Dynamic additional attributes (for JSONB flexibility)
  const [contactDetails, setContactDetails] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

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

  const handleEdit = (supplier) => {
    const { contactInfo = {}, name, orgId, id } = supplier;
    const { email, phone, ...others } = contactInfo || {};

    // Map other fields to array for dynamic editing
    const otherDetails = Object.entries(others).map(([key, value]) => ({ key, value }));

    setFormData({
      name: name,
      email: email || '',
      phone: phone || '',
      orgId: orgId || (user?.orgId || 1)
    });
    setContactDetails(otherDetails);

    setIsEditing(true);
    setEditId(id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Construct contactInfo from explicit fields + dynamic fields
      const contactInfoPayload = {
        email: formData.email,
        phone: formData.phone
      };

      // Merge dynamic details
      contactDetails.forEach(detail => {
        if (detail.key && detail.value) {
          contactInfoPayload[detail.key] = detail.value;
        }
      });

      const payload = {
        name: formData.name,
        orgId: formData.orgId,
        contactInfo: contactInfoPayload
      };

      if (isEditing) {
        await supplierService.update(editId, payload);
      } else {
        await supplierService.create(payload);
      }

      setShowModal(false);
      fetchSuppliers();
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      orgId: user?.orgId || 1
    });
    setContactDetails([]);
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Dynamic field handlers
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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>Suppliers</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage your supplier directory and contacts</p>
      </div>

      <div className="action-buttons" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={openAddModal}
          style={primaryButtonStyle}
        >
          <FaPlus style={{ fontSize: '12px' }} /> Add New Supplier
        </button>
      </div>

      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Info</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created At</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier, index) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{supplier.name}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {supplier.contactInfo && Object.entries(supplier.contactInfo).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>
                              {key}:
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                              {String(value)}
                            </span>
                          </div>
                        );
                      })}

                      {(!supplier.contactInfo || Object.keys(supplier.contactInfo).length === 0) && (
                        <span style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No contact info</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748b' }}>
                    {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleEdit(supplier)}
                        title="Edit"
                        style={{ color: '#4f46e5', background: 'rgba(79, 70, 229, 0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        title="Delete"
                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={modalStyle}>
            {/* Header */}
            <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {isEditing ? '✏️ Edit Supplier' : '✨ Add New Supplier'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {isEditing ? 'Update supplier details' : 'Register a new supplier'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '22px 28px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Name Field */}
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={fieldStyle}
                    placeholder="e.g. Acme Supplies Ltd."
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                      <FaEnvelope size={14} />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ ...fieldStyle, paddingLeft: '36px' }}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label style={labelStyle}>Phone</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                      <FaPhone size={14} />
                    </div>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ ...fieldStyle, paddingLeft: '36px' }}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                </div>

                {/* Additional Attributes Divider */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Additional Details</label>
                    <button
                      type="button"
                      onClick={addContactDetail}
                      style={{
                        fontSize: '12px', fontWeight: 700, color: '#4f46e5',
                        background: 'rgba(99,102,241,0.08)',
                        border: '1.5px solid rgba(99,102,241,0.2)',
                        borderRadius: '7px',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <FaPlus size={10} /> Add Field
                    </button>
                  </div>

                  {contactDetails.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                      No additional details added.
                    </p>
                  )}

                  {contactDetails.map((detail, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Label (e.g. Fax)"
                        value={detail.key}
                        onChange={(e) => updateContactDetail(index, 'key', e.target.value)}
                        style={{ ...fieldStyle, flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={detail.value}
                        onChange={(e) => updateContactDetail(index, 'value', e.target.value)}
                        style={{ ...fieldStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeContactDetail(index)}
                        style={{
                          background: '#fee2e2', color: '#dc2626', border: 'none',
                          borderRadius: '8px', width: '36px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <FaMinus size={12} />
                      </button>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={primaryButtonStyle}
                >
                  {isEditing ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
