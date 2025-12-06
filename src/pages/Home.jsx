import { ShoppingBag, Truck, Shield, Headphones, Star, ChevronLeft, ChevronRight, TrendingUp, Sparkles, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../config/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function Home({ isAuthenticated, setIsAuthenticated }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProductsSold: 0,
    citiesServed: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedItems();
    fetchReviews();
    fetchStats();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      const response = await api.get('/products?featured=true');
      // Show 3 featured products, or if no featured products, show first 3 products
      let products = response.data;
      if (!products || products.length === 0) {
        const allProducts = await api.get('/products');
        products = allProducts.data;
      }
      setFeaturedProducts(products.slice(0, 3));
    } catch (error) {
      console.error('Failed to load products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews');
      // Get the 3 most recent approved reviews
      const approvedReviews = (response.data || [])
        .filter(r => r.status === 'approved' || !r.status)
        .slice(0, 3);
      setReviews(approvedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats');
      setStats({
        totalCustomers: response.data.totalCustomers || 0,
        totalProductsSold: response.data.totalProductsSold || 0,
        citiesServed: response.data.citiesServed || 0,
        avgRating: response.data.avgRating || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Keep default values
    }
  };

  const categories = [
    { name: 'Biometric Devices', icon: '🔐', count: '15+' },
    { name: 'GPS Trackers', icon: '📍', count: '10+' },
    { name: 'Printers', icon: '🖨️', count: '20+' },
    { name: 'Aadhaar Kits', icon: '🆔', count: '8+' },
    { name: 'Business Equipment', icon: '💼', count: '25+' },
    { name: 'Accessories', icon: '🔧', count: '30+' }
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹10,000' },
    { icon: Shield, title: 'Secure Payment', desc: 'Multiple payment options' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer service' },
    { icon: ShoppingBag, title: 'Easy Returns', desc: '7-day return policy' }
  ];

  // Promo offers
  const promoSlides = [
    { text: "🎉 Use code FIRST10 for 10% off your first order!", color: "text-yellow-300" },
    { text: "🚚 FREE Shipping on orders above ₹10,000!", color: "text-green-300" },
    { text: "💰 Use code SAVE500 - ₹500 off on orders above ₹7000!", color: "text-pink-300" },
    { text: "⚡ Flash Sale! Up to 40% off on Biometric Devices!", color: "text-cyan-300" },
  ];

  const [currentPromo, setCurrentPromo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Trending & New Products
  const slidingProducts = [
    { id: 1, name: 'Mantra MFS100', price: 2499, oldPrice: 2999, image: '🔐', tag: 'Bestseller', sales: '500+ sold' },
    { id: 2, name: 'Startek FM220U', price: 2299, oldPrice: 2799, image: '🔐', tag: 'Hot', sales: '350+ sold' },
    { id: 3, name: 'GPS Tracker Pro', price: 3999, oldPrice: null, image: '📍', tag: 'New', sales: 'Just arrived' },
    { id: 4, name: 'Morpho MSO 1300', price: 2799, oldPrice: 3299, image: '🔐', tag: 'Trending', sales: '420+ sold' },
    { id: 5, name: 'Aadhaar Kit Complete', price: 8999, oldPrice: 10999, image: '🆔', tag: 'Bundle', sales: '200+ sold' },
    { id: 6, name: 'Vehicle Tracker V2', price: 4499, oldPrice: null, image: '🚗', tag: 'New', sales: 'Just launched' },
    { id: 7, name: 'Thermal Printer TP80', price: 5999, oldPrice: 6999, image: '🖨️', tag: 'Bestseller', sales: '280+ sold' },
    { id: 8, name: 'Iris Scanner Elite', price: 12999, oldPrice: 14999, image: '👁️', tag: 'Premium', sales: '150+ sold' },
  ];

  useEffect(() => {
    // Change promo every 4 seconds (matching animation duration)
    const promoTimer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoSlides.length);
    }, 4000);
    
    return () => clearInterval(promoTimer);
  }, []);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(slidingProducts.length / 4));
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.ceil(slidingProducts.length / 4));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + Math.ceil(slidingProducts.length / 4)) % Math.ceil(slidingProducts.length / 4));

  return (
    <div className="min-h-screen bg-white">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Scrolling Promo Banner */}
      <div className="bg-gray-900 text-white py-3">
        <div className="max-w-3xl mx-auto px-4 overflow-hidden">
          <div className="relative w-full">
            <div 
              key={currentPromo}
              className="flex items-center justify-center whitespace-nowrap animate-scrollCenter"
            >
              <p className={`text-sm md:text-base font-medium ${promoSlides[currentPromo].color}`}>
                {promoSlides[currentPromo].text}
              </p>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes scrollCenter {
            0% { transform: translateX(-50%); opacity: 0; }
            10% { transform: translateX(0); opacity: 1; }
            90% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(50%); opacity: 0; }
          }
          .animate-scrollCenter {
            animation: scrollCenter 4s ease-in-out;
          }
          @keyframes typing {
            0% { 
              width: 0;
              border-right-color: #00D8EC;
            }
            50% { 
              width: 100%;
              border-right-color: #00D8EC;
            }
            50.1%, 100% {
              width: 100%;
              border-right-color: transparent;
            }
          }
          .animate-typing {
            width: 0;
            white-space: nowrap;
            animation: typing 4s steps(20) infinite;
          }
        `}</style>
      </div>

      {/* Hero Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Trusted Partner in
              <span className="block mt-2">
                <span className="inline-block overflow-hidden border-r-4 animate-typing" 
                      style={{color: '#00D8EC', borderColor: '#00D8EC'}}>
                  Business Technology
                </span>
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              Premium biometric devices, GPS trackers, printers, and Aadhaar kits
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/products')}
                className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Shop Now
              </button>
              <button
                onClick={() => navigate('/track')}
                className="px-8 py-3 border border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Track Order
              </button>
              <button
                onClick={() => navigate('/about')}
                className="px-8 py-3 border border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Slider Section */}
      <section className="border-b bg-gray-50 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-700" />
                <span className="font-semibold text-gray-900">Popular</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-700" />
                <span className="font-semibold text-gray-900">New</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevSlide} className="p-1.5 hover:bg-gray-200 rounded-full transition">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={nextSlide} className="p-1.5 hover:bg-gray-200 rounded-full transition">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {slidingProducts.slice(currentSlide * 4, currentSlide * 4 + 4).map((product) => (
              <div
                key={product.id}
                onClick={() => navigate('/products')}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 hover:shadow-md transition-all"
              >
                <div className="relative bg-gray-50 p-5">
                  <span className="text-4xl block text-center">{product.image}</span>
                  <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded ${
                    product.tag === 'Bestseller' ? 'bg-amber-100 text-amber-800' :
                    product.tag === 'New' ? 'bg-emerald-100 text-emerald-800' :
                    product.tag === 'Hot' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.tag}
                  </span>
                  {product.oldPrice && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                      -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{product.sales}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">₹{product.oldPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: Math.ceil(slidingProducts.length / 4) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'bg-gray-900 w-6' : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-b py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="p-3 bg-gray-900 rounded-xl">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black">{feature.title}</h3>
                  <p className="text-sm text-black">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">⭐ HANDPICKED FOR YOU</span>
            <h2 className="text-3xl font-bold mt-4 mb-3 text-black">Featured Products</h2>
            <p className="text-black max-w-2xl mx-auto">Discover our best-selling business technology products trusted by thousands of customers</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <div
                  key={product._id || product.id}
                  onClick={() => navigate(`/products/${product._id || product.id}`)}
                  className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-900 hover:shadow-xl transition-all group"
                >
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                    {index < 3 && (
                      <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {index === 0 ? '🔥 BESTSELLER' : index === 1 ? '⚡ POPULAR' : '✨ TRENDING'}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-black bg-gray-100 px-3 py-1.5 rounded-full">{product.category}</span>
                      <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="ml-1 text-sm font-bold text-black">{product.rating || 4.0}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-black">₹{product.price?.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="ml-2 text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <button className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">Customer Reviews</h2>
        <p className="text-gray-500 text-center mb-10">What our customers say about us</p>
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to review our products!</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 text-sm">"{review.comment || review.text || 'Great product!'}"</p>
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-700 font-semibold text-sm">{(review.userName || review.user?.fullname || 'A').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{review.userName || review.user?.fullname || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{review.productName || 'Verified Buyer'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">{stats.totalCustomers > 0 ? `${stats.totalCustomers.toLocaleString()}+` : '0'}</div>
              <div className="text-gray-400 text-sm">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">{stats.totalProductsSold > 0 ? `${stats.totalProductsSold.toLocaleString()}+` : '0'}</div>
              <div className="text-gray-400 text-sm">Products Sold</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">{stats.citiesServed > 0 ? `${stats.citiesServed}+` : '0'}</div>
              <div className="text-gray-400 text-sm">Cities Served</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">{stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : '0/5'}</div>
              <div className="text-gray-400 text-sm">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-gray-100 rounded-xl p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold mb-2 text-black">Stay Updated</h2>
          <p className="text-black mb-6">Subscribe for exclusive deals and new product launches</p>
          {subscribed ? (
            <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg max-w-md mx-auto">
              <p className="font-bold text-lg">✓ Thank you for subscribing!</p>
              <p className="text-sm mt-1">You'll receive exclusive deals and updates at {email}</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
              <button 
                onClick={() => {
                  if (email && email.includes('@')) {
                    setSubscribed(true);
                    toast.success('Successfully subscribed!');
                  } else {
                    toast.error('Please enter a valid email');
                  }
                }}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Subscribe
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="w-6 h-6" />
                <span className="text-lg font-bold">Atlas & Arrow</span>
              </div>
              <p className="text-gray-400 text-sm">Your trusted partner in business technology solutions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/products" className="hover:text-white transition">Products</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/track" className="hover:text-white transition">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/products?category=Biometric%20Devices" className="hover:text-white transition">Biometric Devices</Link></li>
                <li><Link to="/products?category=GPS%20Trackers" className="hover:text-white transition">GPS Trackers</Link></li>
                <li><Link to="/products?category=Printers" className="hover:text-white transition">Printers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:atlasarrow75@gmail.com" className="hover:text-white transition">atlasarrow75@gmail.com</a></li>
                <li><a href="tel:+919369914492" className="hover:text-white transition">+91 93699 144XX</a></li>
                <li>Mumbai, Maharashtra</li>
                <li><Link to="/contact" className="hover:text-white transition">Support Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Atlas & Arrow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

