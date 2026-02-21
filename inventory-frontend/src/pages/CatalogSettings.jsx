import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Plus, Loader2, AlertCircle, RefreshCw, X, Tag, AlignLeft, Printer, Activity } from 'lucide-react';
import { categoryService, brandService } from '../services/api';
import './CatalogSettings.css';

const CatalogSettings = () => {
    const [activeTab, setActiveTab] = useState('categories');

    // State Management
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [brandForm, setBrandForm] = useState({ name: '', manufacturer: '' });

    // Data Fetching
    const fetchCategories = useCallback(async () => {
        try {
            setError(null);
            const response = await categoryService.getAll();
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories. Please try again.');
        }
    }, []);

    const fetchBrands = useCallback(async () => {
        try {
            setError(null);
            const response = await brandService.getAll();
            setBrands(response.data);
        } catch (err) {
            console.error('Error fetching brands:', err);
            setError('Failed to load brands. Please try again.');
        }
    }, []);

    const initFetch = useCallback(async () => {
        setIsLoading(true);
        if (activeTab === 'categories') {
            await fetchCategories();
        } else {
            await fetchBrands();
        }
        setIsLoading(false);
    }, [activeTab, fetchCategories, fetchBrands]);

    useEffect(() => {
        initFetch();
    }, [initFetch]);

    // Mutation Placeholders & Optimistic UI
    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoryService.delete(id);
            // Optimistic/Immediate UI update
            setCategories(prev => prev.filter(cat => cat.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete category.');
        }
    };

    const handleDeleteBrand = async (id) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) return;

        try {
            await brandService.delete(id);
            // Optimistic/Immediate UI update
            setBrands(prev => prev.filter(brand => brand.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete brand.');
        }
    };

    const handleOpenAddModal = () => {
        if (activeTab === 'categories') {
            setCategoryForm({ name: '', description: '' });
            setIsCategoryModalOpen(true);
        } else {
            setBrandForm({ name: '', manufacturer: '' });
            setIsBrandModalOpen(true);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await categoryService.create(categoryForm);
            await fetchCategories();
            setIsCategoryModalOpen(false);
            setCategoryForm({ name: '', description: '' });
        } catch (err) {
            console.error('Error saving category:', err);
            alert('Failed to save category. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBrand = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await brandService.create(brandForm);
            await fetchBrands();
            setIsBrandModalOpen(false);
            setBrandForm({ name: '', manufacturer: '' });
        } catch (err) {
            console.error('Error saving brand:', err);
            alert('Failed to save brand. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPlaceholder = (item) => {
        alert(`Edit functionality placeholder for: ${item.name}`);
    };

    // UI Render Helpers
    if (isLoading) {
        return (
            <div className="cs-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading settings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cs-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Oops! Something went wrong</h3>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
                    <button
                        onClick={initFetch}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#4f46e5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', margin: '0 auto' }}
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const renderCategoriesTable = () => (
        <table className="cs-table">
            <thead>
                <tr>
                    <th style={{ width: '25%' }}>Category Name</th>
                    <th style={{ width: '40%' }}>Description</th>
                    <th style={{ width: '20%' }}>Product Count</th>
                    <th style={{ width: '15%' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {categories.length === 0 ? (
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No categories found.</td>
                    </tr>
                ) : (
                    categories.map((category) => (
                        <tr key={category.id}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{category.name}</td>
                            <td style={{ color: '#6b7280' }}>{category.description}</td>
                            <td>
                                <span style={{
                                    backgroundColor: '#eff6ff',
                                    color: '#4f46e5',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    {category.count || 0} items
                                </span>
                            </td>
                            <td>
                                <div className="cs-actions">
                                    <button className="cs-action-btn edit" title="Edit" onClick={() => handleEditPlaceholder(category)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="cs-action-btn delete" title="Delete" onClick={() => handleDeleteCategory(category.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );

    const renderBrandsTable = () => (
        <table className="cs-table">
            <thead>
                <tr>
                    <th style={{ width: '40%' }}>Brand Name</th>
                    <th style={{ width: '45%' }}>Manufacturer</th>
                    <th style={{ width: '15%' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {brands.length === 0 ? (
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No brands found.</td>
                    </tr>
                ) : (
                    brands.map((brand) => (
                        <tr key={brand.id}>
                            <td style={{ fontWeight: 500, color: '#111827' }}>{brand.name}</td>
                            <td style={{ color: '#6b7280' }}>{brand.manufacturer}</td>
                            <td>
                                <div className="cs-actions">
                                    <button className="cs-action-btn edit" title="Edit" onClick={() => handleEditPlaceholder(brand)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="cs-action-btn delete" title="Delete" onClick={() => handleDeleteBrand(brand.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );

    return (
        <div className="cs-wrapper">
            <div className="cs-container">
                <div className="cs-tabs">
                    <button
                        className={`cs-tab ${activeTab === 'categories' ? 'cs-tab-active' : 'cs-tab-inactive'}`}
                        onClick={() => setActiveTab('categories')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>Categories</span>
                        {!isLoading && activeTab === 'categories' && (
                            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '10px', padding: '2px 6px', borderRadius: '999px' }}>
                                {categories.length}
                            </span>
                        )}
                    </button>
                    <button
                        className={`cs-tab ${activeTab === 'brands' ? 'cs-tab-active' : 'cs-tab-inactive'}`}
                        onClick={() => setActiveTab('brands')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>Brands</span>
                        {!isLoading && activeTab === 'brands' && (
                            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '10px', padding: '2px 6px', borderRadius: '999px' }}>
                                {brands.length}
                            </span>
                        )}
                    </button>
                </div>

                <div>
                    <div className="cs-header">
                        <h2 className="cs-title">
                            {activeTab === 'categories' ? 'Manage Categories' : 'Manage Brands'}
                        </h2>
                        <button className="cs-add-btn" onClick={handleOpenAddModal}>
                            <Plus size={16} />
                            Add New
                        </button>
                    </div>

                    <div className="cs-card">
                        <div className="cs-table-container">
                            {activeTab === 'categories' ? renderCategoriesTable() : renderBrandsTable()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="cs-modal-overlay">
                    <div className="cs-modal-container">
                        <div className="cs-modal-header">
                            <div className="cs-modal-title-wrapper">
                                <div className="cs-modal-icon-bg">
                                    <Plus size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="cs-modal-title">Add New Category</h3>
                                    <p className="cs-modal-subtitle">Organize your products with descriptive categories.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="cs-modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory}>
                            <div className="cs-modal-body">
                                <div className="cs-form-group">
                                    <label className="cs-form-label">
                                        <Tag size={14} />
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="cs-form-input"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        placeholder="e.g., Antibiotics, Surgical masks..."
                                    />
                                    <span className="cs-form-hint">Use a unique name for this category.</span>
                                </div>
                                <div className="cs-form-group">
                                    <label className="cs-form-label">
                                        <AlignLeft size={14} />
                                        Description
                                    </label>
                                    <textarea
                                        className="cs-form-input"
                                        rows="3"
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        placeholder="Briefly describe what this category includes..."
                                    />
                                </div>
                            </div>
                            <div className="cs-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    disabled={isSaving}
                                    className="cs-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="cs-btn-primary"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Create Category
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Brand Modal */}
            {isBrandModalOpen && (
                <div className="cs-modal-overlay">
                    <div className="cs-modal-container">
                        <div className="cs-modal-header">
                            <div className="cs-modal-title-wrapper">
                                <div className="cs-modal-icon-bg">
                                    <Activity size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="cs-modal-title">Add New Brand</h3>
                                    <p className="cs-modal-subtitle">Register a pharmaceutical or medical manufacturer.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsBrandModalOpen(false)} className="cs-modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveBrand}>
                            <div className="cs-modal-body">
                                <div className="cs-form-group">
                                    <label className="cs-form-label">
                                        <Tag size={14} />
                                        Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="cs-form-input"
                                        value={brandForm.name}
                                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                                        placeholder="e.g., Pfizer, Moderna, Merck..."
                                    />
                                </div>
                                <div className="cs-form-group">
                                    <label className="cs-form-label">
                                        <Printer size={14} />
                                        Manufacturer
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="cs-form-input"
                                        value={brandForm.manufacturer}
                                        onChange={(e) => setBrandForm({ ...brandForm, manufacturer: e.target.value })}
                                        placeholder="Full legal name of the manufacturer..."
                                    />
                                </div>
                            </div>
                            <div className="cs-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setIsBrandModalOpen(false)}
                                    disabled={isSaving}
                                    className="cs-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="cs-btn-primary"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Create Brand
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CatalogSettings;
