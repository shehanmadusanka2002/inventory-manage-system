import React, { useState, useEffect } from 'react';
import { branchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaBuilding, FaEdit, FaTrash, FaPlus, FaSearch, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
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
      
      // Auto-populate orgId from authenticated user if creating new branch
      if (!editingBranch && user?.orgId) {
        submitData.orgId = user.orgId;
      }
      
      if (editingBranch) {
        await branchService.update(editingBranch.id, submitData);
        alert('Branch updated successfully');
      } else {
        await branchService.create(submitData);
        alert('Branch created successfully');
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
        alert('Branch deleted successfully');
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Branches</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Manage organizational branches and locations
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FaPlus /> Add Branch
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
          }} />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: 'white',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Branches Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading branches...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Code</th>
                <th>Location</th>
                <th>Timezone</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No branches found
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => (
                  <tr key={branch.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaBuilding style={{ color: '#3b82f6' }} />
                        <span style={{ fontWeight: '600' }}>{branch.locationName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#6b7280' }}>
                        {branch.branchCode || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <FaMapMarkerAlt style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }} />
                        <div style={{ fontSize: '0.875rem' }}>
                          {branch.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaClock style={{ color: '#9ca3af', fontSize: '0.875rem' }} />
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          {branch.timezone || 'UTC'}
                        </span>
                      </div>
                    </td>
                    <td>{branch.orgId || '-'}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: branch.isActive !== false ? '#10b981' : '#6b7280'
                      }}>
                        {branch.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => handleEdit(branch)} title="Edit">
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(branch.id)}
                          title="Delete"
                          style={{ color: '#ef4444' }}
                        >
                          <FaTrash />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Main Branch, Colombo Office"
                  />
                </div>
                <div className="form-group">
                  <label>Branch Code *</label>
                  <input
                    type="text"
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., NUG-001, COL-HQ"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Full address"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <input
                    type="text"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    placeholder="e.g., Asia/Colombo, UTC"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Active Branch</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBranch ? 'Update' : 'Create'} Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
