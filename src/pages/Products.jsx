import { useState, useEffect, useMemo } from 'react';
import { Search, Star, ShoppingCart, Filter, Grid, List, Heart, Zap, Package, Cpu, MapPin, Printer, Watch, Cable, Box, Truck, Shield } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

// Category icons and colors
const categoryConfig = {
  'Biometric Devices': { icon: Cpu, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'GPS Devices': { icon: MapPin, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Printers': { icon: Printer, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Smartwatches': { icon: Watch, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Cables & Accessories': { icon: Cable, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Printer Supplies': { icon: Box, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Business Equipment': { icon: Package, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
};

export default function Products({ isAuthenticated, setIsAuthenticated }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    sort: 'latest'
  });
  const navigate = useNavigate();

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(product => {
      const cat = product.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    // Sort categories by number of products (descending)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [products]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (isAuthenticated) {
      fetchWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await api.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist((response.data || []).map(p => p._id));
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();
    const token = sessionStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    
    try {
      const response = await api.post(`/wishlist/toggle/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.added) {
        setWishlist(prev => [...prev, productId]);
        toast.success('Added to wishlist!');
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Hero Banner - Matching Home Page Style */}
      <div className="bg-gray-900 text-white py-16 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Our <span style={{ color: '#00D8EC' }}>Products</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto"
          >
            Browse our complete collection of business technology solutions
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-8 justify-center"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(0,216,236,0.2)' }}>
                <Truck className="w-5 h-5" style={{ color: '#00D8EC' }} />
              </div>
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(0,216,236,0.2)' }}>
                <ShoppingCart className="w-5 h-5" style={{ color: '#00D8EC' }} />
              </div>
              <span>Easy Returns</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(0,216,236,0.2)' }}>
                <Shield className="w-5 h-5" style={{ color: '#00D8EC' }} />
              </div>
              <span>Premium Quality</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center justify-between"
        >
          <p className="text-gray-400">
            Showing <span className="font-semibold" style={{ color: '#00D8EC' }}>{products.length}</span> products
            {filters.category && <span> in <span className="font-semibold" style={{ color: '#00D8EC' }}>{filters.category}</span></span>}
          </p>
        </motion.div>

        {/* Filters - Dark Theme */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-xl mb-8 border border-gray-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </motion.div>

        {/* Products Grouped by Category */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#00D8EC' }}></div>
            <p className="text-gray-400 mt-4">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found</p>
          </div>
        ) : filters.category ? (
          // Show flat grid when a specific category is selected
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  index={index}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  navigate={navigate}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          // Show grouped by category when no category filter
          <div className="space-y-8">
            {groupedProducts.map(([categoryName, categoryProducts], catIndex) => {
              const config = categoryConfig[categoryName] || { 
                icon: Package, 
                color: 'from-cyan-500 to-blue-500', 
                bg: 'bg-cyan-50', 
                text: 'text-cyan-600' 
              };
              const CategoryIcon = config.icon;
              
              return (
                <motion.section 
                  key={categoryName}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                  className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
                >
                  {/* Category Header */}
                  <div className="p-6 border-b border-gray-700" style={{ background: 'linear-gradient(135deg, rgba(0,216,236,0.1) 0%, transparent 100%)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,216,236,0.2)' }}>
                          <CategoryIcon className="w-8 h-8" style={{ color: '#00D8EC' }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                          <p className="text-gray-400 text-sm">{categoryProducts.length} products available</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters({ ...filters, category: categoryName })}
                        className="px-5 py-2.5 rounded-xl font-medium transition text-sm"
                        style={{ backgroundColor: '#00D8EC', color: '#000' }}
                      >
                        View All →
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Products Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoryProducts.map((product, index) => (
                        <ProductCard 
                          key={product._id} 
                          product={product} 
                          index={index}
                          wishlist={wishlist}
                          toggleWishlist={toggleWishlist}
                          navigate={navigate}
                          config={config}
                        />
                      ))}
                    </div>
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted ProductCard component - Dark Theme
function ProductCard({ product, index, wishlist, toggleWishlist, navigate, config }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-gray-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-gray-700 hover:border-cyan-500/50 group"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
    >
      <div className="aspect-square bg-gray-800 flex items-center justify-center relative overflow-hidden">
        <img 
          src={product.images?.[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{product.discount}% OFF</span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Low Stock</span>
          )}
          {index < 2 && (
            <span className="text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#00D8EC', color: '#000' }}>Best Seller</span>
          )}
        </div>
        {/* Quick actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => toggleWishlist(e, product._id)}
            className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-800 transition"
          >
            <Heart className={`w-4 h-4 ${wishlist.includes(product._id) ? 'text-red-500 fill-current' : 'text-white'}`} />
          </button>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,216,236,0.2)', color: '#00D8EC' }}>
            {product.category}
          </span>
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="ml-1 text-xs font-semibold text-white">{product.rating}</span>
            <span className="ml-1 text-xs text-gray-500">({Math.floor(Math.random() * 100) + 10})</span>
          </div>
        </div>
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10 text-white group-hover:text-cyan-400 transition-colors">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold" style={{ color: '#00D8EC' }}>₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="ml-1 text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            const token = sessionStorage.getItem('token');
            if (!token) {
              toast.error('Please login to add to cart');
              navigate('/login');
              return;
            }
            api.post('/cart/add', { productId: product._id, quantity: 1 }, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
              toast.success(`${product.name} added to cart!`);
              window.dispatchEvent(new Event('cartUpdated'));
            }).catch((err) => {
              toast.error(err.response?.data?.message || 'Failed to add to cart');
            });
          }}
          className="w-full py-2.5 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
          style={{ backgroundColor: '#00D8EC', color: '#000' }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

