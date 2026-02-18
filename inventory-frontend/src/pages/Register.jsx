import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEnvelope, FaBoxes, FaIndustry, FaPhone } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    industryType: 'GENERAL',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    taxId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.industryType || !formData.companyName) {
      setError('Please fill in all required fields (Email, Password, Company Name, Industry Type)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#1f2937',
        borderRadius: '1rem',
        padding: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '1px solid #374151',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            marginBottom: '1rem',
          }}>
            <FaBoxes style={{ fontSize: '2.5rem', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
            Create Account
          </h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Choose your industry type and start managing inventory
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#7f1d1d',
            border: '1px solid #991b1b',
            color: '#fecaca',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Fields Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '0.5rem',
              }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '0.5rem',
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Email *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
              }}>
                <FaEnvelope />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
              }}>
                <FaPhone />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Your phone number"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Divider - Company Information */}
          <div style={{ 
            margin: '1.5rem 0', 
            padding: '0.75rem 0',
            borderTop: '1px solid #374151',
            borderBottom: '1px solid #374151',
          }}>
            <h3 style={{ 
              color: '#10b981', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Company Information
            </h3>
          </div>

          {/* Company Name Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Your company name"
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          {/* Company Contact Fields Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '0.5rem',
              }}>
                Company Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="company@domain.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '0.5rem',
              }}>
                Company Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Company phone"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Tax ID Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Tax ID / Registration Number
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="Company tax ID or registration number"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          {/* Industry Type Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Industry Type *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                pointerEvents: 'none',
              }}>
                <FaIndustry />
              </div>
              <select
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              >
                <option value="GENERAL">General</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="RETAIL">Retail</option>
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="FOOD_BEVERAGE">Food & Beverage</option>
                <option value="LOGISTICS">Logistics</option>
              </select>
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
              }}>
                <FaLock />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#d1d5db',
              marginBottom: '0.5rem',
            }}>
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
              }}>
                <FaLock />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: loading ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#10b981';
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#9ca3af',
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#10b981',
              textDecoration: 'none',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
