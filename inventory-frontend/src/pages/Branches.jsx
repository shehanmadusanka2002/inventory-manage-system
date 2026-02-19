import React, { useState, useEffect } from 'react';
import { branchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaBuilding, FaEdit, FaTrash, FaPlus, FaSearch, FaMapMarkerAlt, FaClock, FaEye, FaGlobe } from 'react-icons/fa';

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
  width: '100%', maxWidth: '600px',
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

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewBranch, setViewBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    locationName: '',
    branchCode: '',
    address: '',
    timezone: '',
    orgId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      alert('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!editingBranch && user?.orgId) {
        submitData.orgId = user.orgId; // Auto-populate orgId
      }

      if (editingBranch) {
        await branchService.update(editingBranch.id, submitData);
      } else {
        await branchService.create(submitData);
      }
      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Failed to save branch');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      locationName: branch.locationName || '',
      branchCode: branch.branchCode || '',
      address: branch.address || '',
      timezone: branch.timezone || '',
      orgId: branch.orgId || '',
      isActive: branch.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchService.delete(id);
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Failed to delete branch');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      locationName: '',
      branchCode: '',
      address: '',
      timezone: '',
      orgId: '',
      isActive: true,
    });
    setEditingBranch(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '0px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>Branches</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage organizational branches and locations</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '300px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: '36px' }}
          />
        </div>

        <button onClick={openAddModal} style={primaryButtonStyle}>
          <FaPlus style={{ fontSize: '12px' }} /> Add Branch
        </button>
      </div>

      {/* Styled Table Container */}
      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading branches...</div>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timezone</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '50%' }}>
                          <FaBuilding size={24} color="#94a3b8" />
                        </div>
                        <span style={{ fontWeight: 500 }}>No branches found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch, index) => (
                    <tr key={branch.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '6px', borderRadius: '6px', color: '#4f46e5' }}>
                            <FaBuilding size={12} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{branch.locationName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 600, color: '#475569',
                          background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {branch.branchCode || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaMapMarkerAlt color="#94a3b8" size={12} />
                          {branch.address || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No address</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaGlobe color="#94a3b8" size={12} />
                          {branch.timezone || 'UTC'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          backgroundColor: branch.isActive !== false ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: branch.isActive !== false ? '#16a34a' : '#64748b',
                          border: `1px solid ${branch.isActive !== false ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                          {branch.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setViewBranch(branch)} style={{ ...secondaryButtonStyle, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaEye size={12} /> View
                          </button>
                          <button onClick={() => handleEdit(branch)} style={{ ...secondaryButtonStyle, padding: '6px 10px', color: '#4f46e5', borderColor: 'rgba(79, 70, 229, 0.2)', background: 'rgba(79, 70, 229, 0.04)' }}>
                            <FaEdit size={12} />
                          </button>
                          <button onClick={() => handleDelete(branch.id)} style={{ ...secondaryButtonStyle, padding: '6px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.04)' }}>
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={modalStyle}>
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {editingBranch ? 'Update branch details' : 'Register a new branch location'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Branch Name *</label>
                    <input
                      type="text"
                      name="locationName"
                      value={formData.locationName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Main HQ"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Branch Code *</label>
                    <input
                      type="text"
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. BR-001"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full street address..."
                    rows="3"
                    style={{ ...fieldStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      style={fieldStyle}
                    >
                      <option value="">Select Timezone</option>
                      <option value="Asia/Colombo">Asia/Colombo</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Singapore">Asia/Singapore</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#334155' }}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <span>Active Branch</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowModal(false)} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button type="submit" style={primaryButtonStyle}>
                  {editingBranch ? 'Update Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Branch Modal - Modernized */}
      {viewBranch && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setViewBranch(null)}>
          <div style={{ ...modalStyle, maxWidth: '480px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <FaBuilding size={20} color="#4f46e5" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{viewBranch.locationName}</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{viewBranch.branchCode}</span>
                </div>
              </div>
              <button onClick={() => setViewBranch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Status</label>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  backgroundColor: viewBranch.isActive !== false ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  color: viewBranch.isActive !== false ? '#16a34a' : '#64748b'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                  {viewBranch.isActive !== false ? 'Active & Operational' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ ...labelStyle, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMapMarkerAlt /> Address
                  </label>
                  <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    {viewBranch.address || 'No address provided'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ ...labelStyle, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaClock /> Timezone
                    </label>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                      {viewBranch.timezone || 'UTC'}
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ ...labelStyle, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaGlobe /> Region
                    </label>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                      Global
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewBranch(null)} style={secondaryButtonStyle}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
