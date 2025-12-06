import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentGateway from './pages/PaymentGateway';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import TrackOrder from './pages/TrackOrder';
import AdminPanel from './pages/AdminPanel';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ChangePassword from './pages/ChangePassword';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Google OAuth Client ID - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = '204796115276-8ocer6h76jd26fa5t897ttvqdh9ffoip.apps.googleusercontent.com';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuth = () => {
    const token = sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
    setLoading(false);

    // Listen for storage changes (when logout happens)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Check auth when window gets focus (handles logout in other tabs/components)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', checkAuth);

    // Also check periodically in case sessionStorage is cleared
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkAuth);
      clearInterval(interval);
    };
  }, []);

  const PrivateRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
      );
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const content = (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/" /> : <Register setIsAuthenticated={setIsAuthenticated} />
          } 
        />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/products" element={<Products isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/products/:id" element={<ProductDetail isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/cart" element={
            <PrivateRoute>
              <Cart setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/checkout" element={
            <PrivateRoute>
              <Checkout setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/payment" element={
            <PrivateRoute>
              <PaymentGateway setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <Orders setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/change-password" element={
            <PrivateRoute>
              <ChangePassword setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/about" element={<About isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/contact" element={<Contact isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/wishlist" element={
            <PrivateRoute>
              <Wishlist isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Notifications isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboard isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          } />
          <Route path="/admin-panel" element={
            <AdminProtectedRoute>
              <AdminPanel />
            </AdminProtectedRoute>
          } />
          <Route path="/track" element={<TrackOrder isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard setIsAuthenticated={setIsAuthenticated} />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}

export default App;

