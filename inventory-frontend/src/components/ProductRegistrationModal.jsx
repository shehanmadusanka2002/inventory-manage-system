import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, X, AlertCircle } from 'lucide-react';
import './ProductRegistrationModal.css';

const ProductRegistrationModal = ({ isOpen, onClose, onSuccess, categories, brands, editingProduct, onSave }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [skuLoading, setSkuLoading] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        category: '',
        brand: '',
        industryType: 'GENERAL',
        price: '',
        featured: false,
        active: true,
    });

    // 1. useEffect to fetch next SKU on mount/open
    useEffect(() => {
        if (isOpen && !editingProduct) {
            fetchNextSku();
        }
    }, [isOpen, editingProduct]);

    // Sync form data if editing
    useEffect(() => {
        if (editingProduct) {
            setFormData({
                sku: editingProduct.sku || '',
                name: editingProduct.name || '',
                description: editingProduct.description || '',
                category: editingProduct.category || '',
                brand: editingProduct.brand || '',
                industryType: editingProduct.industryType || 'GENERAL',
                price: editingProduct.price || '',
                featured: editingProduct.featured || false,
                active: editingProduct.active !== false,
            });
        } else {
            resetForm();
        }
    }, [editingProduct, isOpen]);

    const fetchNextSku = async () => {
        try {
            setSkuLoading(true);
            const orgId = user?.orgId || 1;
            const response = await productService.getNextSku(orgId);
            // 2. Set the returned SKU to state
            setFormData(prev => ({ ...prev, sku: response.data }));
        } catch (error) {
            // 4. Fallback to empty string on error
            console.error('Error fetching next SKU:', error);
            // Fallback: don't clear it if user already typed something, 
            // but if it's new, empty is the safest manual entry start.
        } finally {
            setSkuLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            sku: '',
            name: '',
            description: '',
            category: '',
            brand: '',
            industryType: 'GENERAL',
            price: '',
            featured: false,
            active: true,
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (onSave) {
                await onSave(formData, editingProduct?.id);
            } else {
                if (editingProduct) {
                    await productService.update(editingProduct.id, formData);
                } else {
                    await productService.create(formData);
                }
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product. Please check your data.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="prm-overlay" onClick={onClose}>
            <div className="prm-content" onClick={(e) => e.stopPropagation()}>
                <div className="prm-header">
                    <h2>{editingProduct ? 'Edit Catalog Product' : 'Register New Product'}</h2>
                    <button className="prm-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="prm-form">
                    <div className="prm-grid">
                        {/* SKU Field - Pre-filled but Editable */}
                        <div className="prm-group">
                            <label>SKU <span className="prm-required">*</span></label>
                            <div className="prm-input-wrapper">
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    placeholder="e.g. PRD-0001"
                                    required
                                    className={skuLoading ? 'loading' : ''}
                                />
                                {skuLoading && <Loader2 className="prm-spinner animate-spin" size={16} />}
                            </div>
                            <p className="prm-hint">Auto-generated SKU can be overwritten by scanner</p>
                        </div>

                        <div className="prm-group">
                            <label>Product Name <span className="prm-required">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="prm-group prm-full">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                            />
                        </div>

                        <div className="prm-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleInputChange}>
                                <option value="">Select Category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="prm-group">
                            <label>Brand</label>
                            <select name="brand" value={formData.brand} onChange={handleInputChange}>
                                <option value="">Select Brand</option>
                                {brands?.map(brand => (
                                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="prm-group">
                            <label>Industry Type</label>
                            <select name="industryType" value={formData.industryType} onChange={handleInputChange}>
                                <option value="GENERAL">General</option>
                                <option value="PHARMACY">Pharmacy</option>
                                <option value="RETAIL">Retail</option>
                                <option value="MANUFACTURING">Manufacturing</option>
                            </select>
                        </div>

                        <div className="prm-group">
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

                        <div className="prm-group prm-full prm-checkboxes">
                            <label className="prm-check-label">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleInputChange}
                                />
                                Featured Product
                            </label>
                            <label className="prm-check-label">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                />
                                Active in Catalog
                            </label>
                        </div>
                    </div>

                    <div className="prm-footer">
                        <button type="button" className="prm-btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="prm-btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                editingProduct ? 'Update Product' : 'Register Product'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRegistrationModal;
