import { ShoppingBag, ShoppingCart, User, LogOut, Package, Menu, X, Heart, Bell, Info, Phone, Truck, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    }
  }, [isAuthenticated]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isAuthenticated) {
        fetchCartCount();
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isAuthenticated]);

  // quick health check to see whether backend is reachable from the browser
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/health');
        // you can remove or replace with a visual indicator later
        console.debug('API health:', res.data);
      } catch (err) {
        console.warn('API health check failed:', err && err.message ? err.message : err);
      }
    })();
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await api.get('/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartCount(response.data.items ? response.data.items.length : 0);
    } catch (error) {
      // Silently fail - user might not be logged in or cart might be empty
      setCartCount(0);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token expired or invalid - clear it
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Show logging out message with animation
    toast.loading('Logging out...', { id: 'logout' });
    
    // Wait for smooth transition
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    sessionStorage.clear();
    setIsAuthenticated(false);
    setIsLoggingOut(false);
    
    toast.success('Logged out successfully!', { id: 'logout' });
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600">
                Atlas & Arrow
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Products
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Contact
            </Link>
            <Link to="/track" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Track Order
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="text-gray-700 hover:text-pink-600 transition" title="Wishlist">
                  <Heart className="w-6 h-6" />
                </Link>
                <Link to="/cart" className="relative text-gray-700 hover:text-blue-600 transition">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/notifications" className="text-gray-700 hover:text-purple-600 transition" title="Notifications">
                  <Bell className="w-6 h-6" />
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-blue-600 transition">
                  <Package className="w-6 h-6" />
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition">
                  <User className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Home</Link>
            <Link to="/products" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Products</Link>
            <Link to="/contact" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Contact</Link>
            <Link to="/track" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Track Order</Link>
            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="block text-gray-700 hover:text-pink-600" onClick={() => setMobileMenu(false)}>Wishlist</Link>
                <Link to="/cart" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Cart ({cartCount})</Link>
                <Link to="/notifications" className="block text-gray-700 hover:text-purple-600" onClick={() => setMobileMenu(false)}>Notifications</Link>
                <Link to="/orders" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Orders</Link>
                <Link to="/profile" className="block text-gray-700 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Profile</Link>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="w-full text-left text-red-600 flex items-center disabled:opacity-70"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    'Logout'
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-blue-600" onClick={() => setMobileMenu(false)}>Login</Link>
                <Link to="/register" className="block text-blue-600" onClick={() => setMobileMenu(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

