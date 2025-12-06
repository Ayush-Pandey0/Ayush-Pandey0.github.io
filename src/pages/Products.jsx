import { useState, useEffect, useMemo } from 'react';
import { Search, Star, ShoppingCart, Filter, Grid, List, Heart, Zap, Package, Cpu, MapPin, Printer, Watch, Cable, Box } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

// Category icons and colors - consistent indigo theme
const categoryConfig = {
  'Biometric Devices': { icon: Cpu, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'GPS Devices': { icon: MapPin, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Printers': { icon: Printer, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Smartwatches': { icon: Watch, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Cables & Accessories': { icon: Cable, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Printer Supplies': { icon: Box, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'Business Equipment': { icon: Package, color: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
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
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-blue-100 mb-6">Browse our complete collection of business technology solutions</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Easy Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>Premium Quality</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{products.length}</span> products
            {filters.category && <span> in <span className="font-semibold text-blue-600">{filters.category}</span></span>}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Products Grouped by Category */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : filters.category ? (
          // Show flat grid when a specific category is selected
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
        ) : (
          // Show grouped by category when no category filter
          <div className="space-y-12">
            {groupedProducts.map(([categoryName, categoryProducts]) => {
              const config = categoryConfig[categoryName] || { 
                icon: Package, 
                color: 'from-gray-500 to-gray-600', 
                bg: 'bg-gray-50', 
                text: 'text-gray-600' 
              };
              const CategoryIcon = config.icon;
              
              return (
                <motion.section 
                  key={categoryName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className={`bg-gradient-to-r ${config.color} p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <CategoryIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                          <p className="text-white/80 text-sm">{categoryProducts.length} products available</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFilters({ ...filters, category: categoryName })}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm text-sm font-medium"
                      >
                        View All →
                      </button>
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

// Extracted ProductCard component
function ProductCard({ product, index, wishlist, toggleWishlist, navigate, config }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition border border-gray-100"
    >
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative group">
        <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{product.discount}% OFF</span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Low Stock</span>
          )}
          {index < 2 && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Best Seller</span>
          )}
        </div>
        {/* Quick actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => toggleWishlist(e, product._id)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <Heart className={`w-4 h-4 ${wishlist.includes(product._id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${config?.text || 'text-blue-600'} ${config?.bg || 'bg-blue-50'} px-2 py-1 rounded`}>
            {product.category}
          </span>
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="ml-1 text-xs font-semibold">{product.rating}</span>
            <span className="ml-1 text-xs text-gray-400">({Math.floor(Math.random() * 100) + 10})</span>
          </div>
        </div>
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="ml-1 text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
        <button
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
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

