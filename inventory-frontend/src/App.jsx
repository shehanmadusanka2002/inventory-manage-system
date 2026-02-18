import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import UnifiedProductRegistration from './pages/UnifiedProductRegistration';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Warehouses from './pages/Warehouses';
import Suppliers from './pages/Suppliers';
import Retail from './pages/Retail';
import Manufacturing from './pages/Manufacturing';
import IndustryConfig from './pages/IndustryConfig';
import Branches from './pages/Branches';
import Notifications from './pages/Notifications';
import Catalog from './pages/Catalog';
import Analytics from './pages/Analytics';
import StockLedger from './pages/StockLedger';
import { FaBox, FaWarehouse, FaShoppingCart, FaTruck, FaChartBar, FaBuilding, FaPills, FaTshirt, FaIndustry, FaUser, FaBell, FaBook, FaChartLine, FaFileAlt, FaSignOutAlt } from 'react-icons/fa';

function AppContent() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Redirect to login after logout
  };

  // Get industry-specific menu items
  const getIndustryMenuItems = () => {
    if (!user?.industryType) return [];
    
    const industryType = user.industryType.toUpperCase();
    
    switch (industryType) {
      case 'RETAIL':
        return [
          { path: '/retail', icon: <FaTshirt />, label: 'Retail Features' }
        ];
      default:
        return [];
    }
  };

  const industryMenuItems = getIndustryMenuItems();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app">
              <nav className="sidebar">
                <div className="logo">
                  <h2>Inventory System</h2>
                </div>
        <ul className="nav-links">
          <li>
            <Link to="/">
              <FaChartBar /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/products">
              <FaBox /> Products
            </Link>
          </li>
          <li>
            <Link to="/inventory">
              <FaWarehouse /> Inventory
            </Link>
          </li>
          <li>
            <Link to="/orders">
              <FaShoppingCart /> Orders
            </Link>
          </li>
          <li>
            <Link to="/warehouses">
              <FaWarehouse /> Warehouses
            </Link>
          </li>
          <li>
            <Link to="/suppliers">
              <FaTruck /> Suppliers
            </Link>
          </li>
          
          {/* Industry-specific features - Show only user's industry */}
          {industryMenuItems.length > 0 && (
            <>
              <li style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0 1rem' }}>Industry Features</span>
              </li>
              {industryMenuItems.map((item, index) => (
                <li key={index}>
                  <Link to={item.path}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
            </>
          )}
          
          <li style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0 1rem' }}>System Management</span>
          </li>
          <li>
            <Link to="/branches">
              <FaBuilding /> Branches
            </Link>
          </li>
          <li>
            <Link to="/notifications">
              <FaBell /> Notifications
            </Link>
          </li>
          <li>
            <Link to="/catalog">
              <FaBox /> Catalog
            </Link>
          </li>
          <li>
            <Link to="/analytics">
              <FaChartLine /> Analytics
            </Link>
          </li>
          <li>
            <Link to="/stock-ledger">
              <FaBook /> Stock Ledger
            </Link>
          </li>
          
          {/* Logout Button */}
          <li style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 15px',
                color: 'white',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#ef4444'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FaSignOutAlt /> Logout
            </button>
          </li>
                </ul>
              </nav>
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/register" element={<UnifiedProductRegistration />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/warehouses" element={<Warehouses />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/retail" element={<Retail />} />
                  <Route path="/manufacturing" element={<Manufacturing />} />
                  <Route path="/industry-config" element={<IndustryConfig />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/stock-ledger" element={<StockLedger />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
