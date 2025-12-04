import { useState, useEffect } from 'react';
import { Search, Heart, Trash2, Share, Filter, Eye, Plus, Star, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Wishlist({ isAuthenticated, setIsAuthenticated }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, navigate]);

  const fetchWishlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await api.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const items = (response.data || []).map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images?.[0] || '',
        category: product.category,
        rating: product.rating || 0,
        inStock: product.stock > 0,
        stock: product.stock,
        dateAdded: product.createdAt || new Date().toISOString()
      }));
      
      setWishlistItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
      setWishlistItems([]);
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.delete(`/wishlist/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearWishlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await api.delete('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  const addToCart = async (item) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add to cart');
        navigate('/login');
        return;
      }
      await api.post('/cart/add', { productId: item.id, quantity: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${item.name} added to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const addAllToCart = async () => {
    const inStockItems = filteredItems.filter(item => item.inStock);
    if (inStockItems.length === 0) {
      toast.error('No items in stock to add');
      return;
    }
    
    let successCount = 0;
    for (const item of inStockItems) {
      try {
        const token = sessionStorage.getItem('token');
        await api.post('/cart/add', { productId: item.id, quantity: 1 }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to add ${item.name} to cart`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} items added to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const shareWishlist = () => {
    const wishlistText = wishlistItems.map(item => `${item.name} - ₹${item.price}`).join('\n');
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist - Atlas & Arrow',
        text: `Check out my wishlist:\n${wishlistText}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`My Wishlist:\n${wishlistText}`);
      toast.success('Wishlist copied to clipboard!');
    }
  };

  const shareItem = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out this product: ${item.name}`,
        url: window.location.origin + `/products/${item.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/products/${item.id}`);
      toast.success('Product link copied to clipboard!');
    }
  };

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(wishlistItems.map(item => item.category))];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Heart className="w-16 h-16 mx-auto mb-4 fill-current" />
            <h1 className="text-4xl font-bold mb-4">My Wishlist</h1>
            <p className="text-pink-100">
              {loading ? 'Loading...' : `${filteredItems.length} items saved for later`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search wishlist items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Wishlist Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {searchTerm || filterCategory !== 'all' ? 'No items found' : 'Your wishlist is empty'}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter settings'
                : 'Start adding products you love to keep them saved for later'
              }
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition"
            >
              Browse Products
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                    {item.originalPrice && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                        {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
                      </div>
                    )}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-sm text-pink-600 font-semibold bg-pink-50 px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(item.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">({item.rating})</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{item.price.toLocaleString()}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        Added {new Date(item.dateAdded).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.inStock}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                          item.inStock
                            ? 'bg-pink-600 text-white hover:bg-pink-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => navigate(`/products/${item.id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => shareItem(item)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Actions */}
        {filteredItems.length > 0 && (
          <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={addAllToCart}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add All to Cart
              </button>
              <button 
                onClick={shareWishlist}
                className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Share className="w-4 h-4" />
                Share Wishlist
              </button>
              <button 
                onClick={clearWishlist}
                className="border border-red-300 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Wishlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
