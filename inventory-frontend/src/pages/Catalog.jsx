import React, { useState, useEffect, useCallback } from 'react';
import { catalogService, categoryService, brandService } from '../services/api';
import { FaBox, FaEdit, FaTrash, FaPlus, FaSearch, FaStar } from 'react-icons/fa';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ProductRegistrationModal from '../components/ProductRegistrationModal';

const Catalog = () => {
  // State Management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch products, categories, and brands in parallel
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        catalogService.getAll(),
        categoryService.getAll(),
        brandService.getAll()
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      setError('Failed to load catalog information. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product from catalog?')) return;

    try {
      await catalogService.deleteProduct(id);
      // Optimistic UI update: remove item from state immediately
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
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

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="#4f46e5" />
          <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Loading Catalog Management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '450px', backgroundColor: '#1f2937', padding: '2.5rem', borderRadius: '0.75rem', border: '1px solid #374151' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>Data Fetching Failed</h3>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', margin: '0 auto', fontWeight: 500 }}
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
            placeholder="Search catalog by name, SKU or category..."
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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Industry</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  {searchTerm ? 'No results found for your search.' : 'The catalog is currently empty.'}
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

      {/* Product Registration Modal */}
      <ProductRegistrationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchData}
        categories={categories}
        brands={brands}
        editingProduct={editingProduct}
        onSave={async (data, id) => {
          if (id) {
            await catalogService.updateProduct(id, data);
          } else {
            await catalogService.createProduct(data);
          }
        }}
      />
    </div>
  );
};

export default Catalog;
