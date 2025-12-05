import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, Award, TrendingUp, Star, LogOut, Calendar, MapPin, Briefcase, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function Dashboard({ setIsAuthenticated }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ customers: 0, productsSold: 0, cities: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = sessionStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadData = async () => {
    try {
      // Featured products
      const productsRes = await api.get('/products?featured=true');
      setFeaturedProducts(productsRes.data.slice(0, 4));

      // Reviews
      const reviewsRes = await api.get('/reviews');
      setReviews(reviewsRes.data.slice(0, 3));

      // Stats
      const usersRes = await api.get('/admin/users');
      const ordersRes = await api.get('/orders');
      const allProductsRes = await api.get('/products');

      // Customers
      const customers = usersRes.data?.users?.length || 0;
      // Products Sold
      const productsSold = ordersRes.data?.length || 0;
      // Cities Served
      const cities = new Set((ordersRes.data || []).map(o => o.shippingAddress?.city).filter(Boolean)).size;
      // Customer Rating
      const ratings = (allProductsRes.data || []).map(p => p.rating).filter(r => typeof r === 'number');
      const rating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      setStats({ customers, productsSold, cities, rating });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      const res = await api.post('/apply', { opportunity_id: opportunityId }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(res.data.message || 'Application submitted!');
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('Failed to apply');
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
    navigate('/login');
  };

  const stats = [
    { label: 'Total Hours', value: '48', icon: Clock, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: '12', icon: Award, color: 'from-green-500 to-green-600' },
    { label: 'Active', value: '3', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { label: 'Impact Score', value: '92', icon: Star, color: 'from-pink-500 to-pink-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600">
                Atlas & Arrow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.fullname}</span>
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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Happy Customers</p>
                <h3 className="text-3xl font-bold mt-1">{stats.customers.toLocaleString()}</h3>
              </div>
              <Award className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Products Sold</p>
                <h3 className="text-3xl font-bold mt-1">{stats.productsSold.toLocaleString()}</h3>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cities Served</p>
                <h3 className="text-3xl font-bold mt-1">{stats.cities.toLocaleString()}</h3>
              </div>
              <MapPin className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Customer Rating</p>
                <h3 className="text-3xl font-bold mt-1">{stats.rating}</h3>
              </div>
              <Star className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Featured Products Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">⭐ HANDPICKED FOR YOU</h2>
            <button onClick={() => navigate('/products')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">View All Products</button>
          </div>
          <p className="text-gray-600 mb-6">Discover our best-selling business technology products trusted by thousands of customers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.length === 0 ? (
              <div className="col-span-4 text-center text-gray-500 py-8">No featured products yet.</div>
            ) : (
              featuredProducts.map(product => (
                <motion.div key={product._id} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-6 shadow-md cursor-pointer" onClick={() => navigate(`/products/${product._id}`)}>
                  <img src={product.images?.[0]} alt={product.name} className="w-full h-32 object-contain mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold">{product.rating || 'N/A'}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <p className="text-gray-600 mb-6">Trusted by {stats.customers.toLocaleString()}+ businesses</p>
          {reviews.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No reviews yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, idx) => (
                <motion.div key={review._id || idx} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-green-50 border border-green-100 rounded-xl p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-lg">{review.rating || 'N/A'}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment || review.title || 'No comment'}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="font-bold text-blue-600">{review.userName || review.user?.fullname || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">{review.productName || ''}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

