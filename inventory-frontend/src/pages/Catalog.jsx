import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import { FaBox, FaEdit, FaTrash, FaPlus, FaSearch, FaStar, FaIndustry } from 'react-icons/fa';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    industryType: 'GENERAL',
    price: '',
    organizationId: '',
    attributes: {},
    featured: false,
    active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await catalogService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching catalog products:', error);
      alert('Failed to load catalog products');
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
      if (editingProduct) {
        await catalogService.update(editingProduct.id, formData);
        alert('Product updated successfully');
      } else {
        await catalogService.createProduct(formData);
        alert('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      industryType: product.industryType || 'GENERAL',
      price: product.price || '',
      organizationId: product.organizationId || '',
      attributes: product.attributes || {},
      featured: product.featured || false,
      active: product.active !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product from catalog?')) {
      try {
        await catalogService.delete(id);
        alert('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      industryType: 'GENERAL',
      price: '',
      organizationId: '',
      attributes: {},
      featured: false,
      active: true,
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIndustryColor = (type) => {
    switch (type) {
      case 'PHARMACY': return '#3b82f6';
      case 'RETAIL': return '#10b981';
      case 'MANUFACTURING': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Catalog Management</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Centralized product catalog for all organizations
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FaPlus /> Add to Catalog
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
            placeholder="Search catalog..."
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

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading catalog...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Industry</th>
                <th>Price</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No products found in catalog
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <code style={{
                        backgroundColor: '#111827',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                      }}>
                        {product.sku}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaBox style={{ color: '#3b82f6' }} />
                        <div>
                          <div style={{ fontWeight: '600' }}>{product.name}</div>
                          {product.featured && (
                            <FaStar style={{ color: '#fbbf24', fontSize: '0.75rem' }} title="Featured" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{product.category || '-'}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: getIndustryColor(product.industryType)
                      }}>
                        {product.industryType || 'GENERAL'}
                      </span>
                    </td>
                    <td>
                      {product.price ? `$${parseFloat(product.price).toFixed(2)}` : '-'}
                    </td>
                    <td>{product.organizationId || 'All'}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: product.active !== false ? '#10b981' : '#6b7280'
                      }}>
                        {product.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(product.id)}
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
              <h2>{editingProduct ? 'Edit Catalog Product' : 'Add to Catalog'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: 'white',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Industry Type</label>
                  <select name="industryType" value={formData.industryType} onChange={handleInputChange}>
                    <option value="GENERAL">General</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="RETAIL">Retail</option>
                    <option value="MANUFACTURING">Manufacturing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Organization ID</label>
                  <input
                    type="number"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    placeholder="Leave blank for all orgs"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                    />
                    <FaStar style={{ color: '#fbbf24' }} />
                    <span>Featured Product</span>
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
