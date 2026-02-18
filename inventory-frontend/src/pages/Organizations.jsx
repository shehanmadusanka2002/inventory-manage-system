import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('organizations');

  const [orgFormData, setOrgFormData] = useState({
    name: '',
    industryType: 'RETAIL',
    subscriptionTier: 'STARTER',
    contactEmail: '',
    contactPhone: '',
    taxId: '',
    isActive: true
  });

  const [branchFormData, setBranchFormData] = useState({
    orgId: '',
    locationName: '',
    address: '',
    timezone: 'UTC',
    isActive: true
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchBranches(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/organizations`);
      setOrganizations(response.data);
      if (response.data.length > 0 && !selectedOrgId) {
        setSelectedOrgId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (orgId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/branches/organization/${orgId}`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/organizations`, orgFormData);
      setShowOrgModal(false);
      fetchOrganizations();
      resetOrgForm();
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      const branchData = { ...branchFormData, orgId: selectedOrgId };
      await axios.post(`${API_BASE_URL}/api/branches`, branchData);
      setShowBranchModal(false);
      fetchBranches(selectedOrgId);
      resetBranchForm();
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  const handleDeleteOrg = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this organization?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/organizations/${id}`);
        fetchOrganizations();
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  const handleDeleteBranch = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this branch?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/branches/${id}`);
        fetchBranches(selectedOrgId);
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  const resetOrgForm = () => {
    setOrgFormData({
      name: '',
      industryType: 'RETAIL',
      subscriptionTier: 'STARTER',
      contactEmail: '',
      contactPhone: '',
      taxId: '',
      isActive: true
    });
  };

  const resetBranchForm = () => {
    setBranchFormData({
      orgId: '',
      locationName: '',
      address: '',
      timezone: 'UTC',
      isActive: true
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Organizations & Branches</h1>
        <p>Multi-tenant organization management</p>
      </div>

      <div className="card">
        <div className="action-buttons">
          <button 
            className={`btn ${activeTab === 'organizations' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            Organizations
          </button>
          <button 
            className={`btn ${activeTab === 'branches' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            Branches
          </button>
        </div>

        {activeTab === 'organizations' && (
          <div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => setShowOrgModal(true)}>
                Add New Organization
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Tenant ID</th>
                    <th>Industry Type</th>
                    <th>Subscription</th>
                    <th>Contact Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} onClick={() => setSelectedOrgId(org.id)} style={{cursor: 'pointer'}}>
                      <td>{org.id}</td>
                      <td>{org.name}</td>
                      <td><code>{org.tenantId}</code></td>
                      <td><span className="badge">{org.industryType}</span></td>
                      <td>{org.subscriptionTier}</td>
                      <td>{org.contactEmail}</td>
                      <td>{org.isActive ? '✓ Active' : '✗ Inactive'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrg(org.id);
                        }}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div>
            <div className="action-buttons">
              <select 
                value={selectedOrgId || ''} 
                onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                className="form-select"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => setShowBranchModal(true)}>
                Add Branch
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location Name</th>
                    <th>Address</th>
                    <th>Timezone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.id}</td>
                      <td>{branch.locationName}</td>
                      <td>{branch.address}</td>
                      <td>{branch.timezone}</td>
                      <td>{branch.isActive ? '✓ Active' : '✗ Inactive'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBranch(branch.id)}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="modal" onClick={() => setShowOrgModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Organization</h2>
              <button className="close-btn" onClick={() => setShowOrgModal(false)}>×</button>
            </div>
            <form onSubmit={handleOrgSubmit}>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={orgFormData.name}
                  onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry Type *</label>
                <select
                  value={orgFormData.industryType}
                  onChange={(e) => setOrgFormData({ ...orgFormData, industryType: e.target.value })}
                  required
                >
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="RETAIL">Retail</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="ECOMMERCE">E-Commerce</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="CONSTRUCTION">Construction</option>
                  <option value="FOOD_BEVERAGE">Food & Beverage</option>
                  <option value="LOGISTICS">Logistics</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subscription Tier</label>
                <select
                  value={orgFormData.subscriptionTier}
                  onChange={(e) => setOrgFormData({ ...orgFormData, subscriptionTier: e.target.value })}
                >
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={orgFormData.contactEmail}
                  onChange={(e) => setOrgFormData({ ...orgFormData, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={orgFormData.contactPhone}
                  onChange={(e) => setOrgFormData({ ...orgFormData, contactPhone: e.target.value })}
                />
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Create Organization</button>
                <button type="button" className="btn" onClick={() => setShowOrgModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="modal" onClick={() => setShowBranchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Branch</h2>
              <button className="close-btn" onClick={() => setShowBranchModal(false)}>×</button>
            </div>
            <form onSubmit={handleBranchSubmit}>
              <div className="form-group">
                <label>Location Name *</label>
                <input
                  type="text"
                  value={branchFormData.locationName}
                  onChange={(e) => setBranchFormData({ ...branchFormData, locationName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={branchFormData.address}
                  onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={branchFormData.timezone}
                  onChange={(e) => setBranchFormData({ ...branchFormData, timezone: e.target.value })}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Colombo">Asia/Colombo</option>
                </select>
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Create Branch</button>
                <button type="button" className="btn" onClick={() => setShowBranchModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: #e0e7ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 500;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        .form-select {
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
}

export default Organizations;
