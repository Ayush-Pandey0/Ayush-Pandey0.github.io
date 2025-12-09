import { ShoppingCart, User, LogOut, Package, Menu, X, Heart, HelpCircle, MapPin, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      setCartCount(0);
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.loading('Logging out...', { id: 'logout' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    sessionStorage.clear();
    setIsAuthenticated(false);
    setIsLoggingOut(false);
    toast.success('Logged out successfully!', { id: 'logout' });
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Navigation categories
  const categories = [
    { name: 'Biometric Devices', path: '/products?category=Biometric Devices' },
    { name: 'GPS Devices', path: '/products?category=GPS Devices' },
    { name: 'Printers', path: '/products?category=Printers' },
    { name: 'Smartwatches', path: '/products?category=Smartwatches' },
    { name: 'Cables & Accessories', path: '/products?category=Cables & Accessories' },
    { name: 'Printer Supplies', path: '/products?category=Printer Supplies' },
    { name: 'Business Equipment', path: '/products?category=Business Equipment' },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left Section - Logo & Location */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                <span className="text-3xl md:text-4xl font-bold italic text-gray-900 tracking-wide">
                  Atlas & Arrow
                </span>
              </Link>

              {/* Location - Hidden on mobile */}
              <Link 
                to={isAuthenticated ? "/profile" : "/login"} 
                className="hidden lg:flex items-center gap-2 cursor-pointer group"
                title={isAuthenticated ? "Update your delivery location" : "Login to set location"}
              >
                <MapPin className="w-5 h-5 text-gray-500 group-hover:text-cyan-600 transition" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500">Deliver to</span>
                  <span className="text-[13px] font-medium text-gray-900 underline group-hover:text-cyan-600 transition">
                    {user.city || 'Select location'}
                  </span>
                </div>
              </Link>
            </div>

            {/* Center - Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for biometric, printers, GPS devices..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                />
              </div>
            </form>

            {/* Right Section - Nav Items */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Track Order - Hidden on mobile */}
              <Link 
                to="/track" 
                className="hidden lg:flex items-center gap-2 text-gray-700 hover:text-cyan-600 transition"
              >
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-medium">Track Order</span>
              </Link>

              {/* Help Center - Hidden on mobile */}
              <Link 
                to="/contact" 
                className="hidden lg:flex items-center gap-2 text-gray-700 hover:text-cyan-600 transition"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Help Center</span>
              </Link>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link to="/wishlist" className="text-gray-700 hover:text-cyan-600 transition" title="Wishlist">
                  <Heart className="w-6 h-6" />
                </Link>
              )}

              {/* User Account */}
              {isAuthenticated ? (
                <Link to="/profile" className="text-gray-700 hover:text-cyan-600 transition" title="Profile">
                  <User className="w-6 h-6" />
                </Link>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-cyan-600 transition" title="Login">
                  <User className="w-6 h-6" />
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative text-gray-700 hover:text-cyan-600 transition" title="Cart">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Logout Button - Desktop */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="hidden md:flex items-center px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-70"
                  title="Logout"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenu(!mobileMenu)} 
                className="md:hidden text-gray-700"
              >
                {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation - Desktop */}
        <div className="hidden md:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-8 py-3 overflow-x-auto scrollbar-hide">
              <Link 
                to="/" 
                className="text-sm font-medium text-gray-700 hover:text-cyan-600 whitespace-nowrap transition"
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className="text-sm font-medium text-gray-700 hover:text-cyan-600 whitespace-nowrap transition"
              >
                All Products
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.path}
                  className="text-sm font-medium text-gray-700 hover:text-cyan-600 whitespace-nowrap transition"
                >
                  {cat.name}
                </Link>
              ))}
              {isAuthenticated && (
                <Link 
                  to="/orders" 
                  className="text-sm font-medium text-gray-700 hover:text-cyan-600 whitespace-nowrap transition"
                >
                  My Orders
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search - Below navbar */}
      <div className="md:hidden bg-white px-4 py-3 border-b border-gray-200">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
            />
          </div>
        </form>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <Link 
              to="/" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileMenu(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileMenu(false)}
            >
              All Products
            </Link>
            <Link 
              to="/track" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileMenu(false)}
            >
              Track Order
            </Link>
            <Link 
              to="/contact" 
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileMenu(false)}
            >
              Help Center
            </Link>
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Categories */}
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Categories</p>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.path}
                className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition text-sm"
                onClick={() => setMobileMenu(false)}
              >
                {cat.name}
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {isAuthenticated ? (
              <>
                <Link 
                  to="/orders" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileMenu(false)}
                >
                  <Package className="w-5 h-5" />
                  My Orders
                </Link>
                <Link 
                  to="/wishlist" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileMenu(false)}
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileMenu(false)}
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenu(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-70"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      Logout
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-4 py-3 text-cyan-600 font-medium hover:bg-cyan-50 rounded-lg transition"
                  onClick={() => setMobileMenu(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-4 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition text-center"
                  onClick={() => setMobileMenu(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

