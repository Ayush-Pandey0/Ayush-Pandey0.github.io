import { useState, useEffect } from 'react';
import { MapPin, Phone, User, Home, ChevronRight, Tag, X, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { motion } from 'framer-motion';

// Available coupons
const COUPONS = {
  'FIRST10': {
    type: 'percentage',
    discount: 10,
    minOrder: 0,
    description: '10% off on first order',
    firstOrderOnly: true,
    oneTimeUse: true
  },
  'SAVE500': {
    type: 'fixed',
    discount: 500,
    minOrder: 7000,
    description: '₹500 off on orders above ₹7000',
    firstOrderOnly: false,
    oneTimeUse: true
  },
  'WELCOME20': {
    type: 'percentage',
    discount: 20,
    minOrder: 5000,
    description: '20% off on orders above ₹5000',
    firstOrderOnly: true,
    oneTimeUse: true
  }
};

// Get used coupons from localStorage
const getUsedCoupons = () => {
  try {
    return JSON.parse(localStorage.getItem('usedCoupons') || '[]');
  } catch {
    return [];
  }
};

// Save used coupon to localStorage
const markCouponAsUsed = (code) => {
  const usedCoupons = getUsedCoupons();
  if (!usedCoupons.includes(code)) {
    usedCoupons.push(code);
    localStorage.setItem('usedCoupons', JSON.stringify(usedCoupons));
  }
};

export default function Checkout({ setIsAuthenticated }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isFirstOrder, setIsFirstOrder] = useState(true);
  const [usedCoupons, setUsedCoupons] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    fullname: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    fetchUserProfile();
    checkOrderHistory();
    setUsedCoupons(getUsedCoupons());
  }, []);

  // Check if user has previous orders (for first-order coupons)
  const checkOrderHistory = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.length > 0) {
        setIsFirstOrder(false);
      }
    } catch (error) {
      console.error('Error checking order history:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to checkout');
        navigate('/login');
        return;
      }
      const response = await api.get('/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const cartData = response.data;
      if (!cartData.items) {
        cartData.items = [];
      }
      setCart(cartData);
    } catch (error) {
      console.error('Cart fetch error:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data) {
        const user = response.data;
        setShippingAddress({
          fullname: user.fullname || '',
          phone: user.phone || '',
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || '',
          country: user.address?.country || 'India'
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const calculateGST = () => {
    return Math.round(calculateTotal() * 0.18);
  };

  const calculateShipping = () => {
    return calculateTotal() > 10000 ? 0 : 100;
  };

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateTotal();
    if (appliedCoupon.type === 'percentage') {
      return Math.round(subtotal * (appliedCoupon.discount / 100));
    }
    return appliedCoupon.discount;
  };

  const calculateFinalTotal = () => {
    return calculateTotal() + calculateGST() + calculateShipping() - calculateCouponDiscount();
  };

  const applyCoupon = () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const coupon = COUPONS[code];
    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    // Check if coupon was already used
    if (coupon.oneTimeUse && usedCoupons.includes(code)) {
      setCouponError('You have already used this coupon');
      return;
    }

    if (coupon.firstOrderOnly && !isFirstOrder) {
      setCouponError('This coupon is only valid for first orders');
      return;
    }

    const subtotal = calculateTotal();
    if (subtotal < coupon.minOrder) {
      setCouponError(`Minimum order amount is ₹${coupon.minOrder.toLocaleString()}`);
      return;
    }

    setAppliedCoupon({ ...coupon, code });
    toast.success(`Coupon applied! You save ₹${coupon.type === 'percentage' ? Math.round(subtotal * (coupon.discount / 100)).toLocaleString() : coupon.discount.toLocaleString()}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  const handleProceedToPayment = () => {
    if (!shippingAddress.fullname || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
      toast.error('Please fill all required shipping details');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    // Mark coupon as used if applied
    if (appliedCoupon?.code && appliedCoupon.oneTimeUse) {
      markCouponAsUsed(appliedCoupon.code);
    }

    const orderData = {
      items: cart.items.map(item => ({
        product: {
          _id: item.product._id || item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images
        },
        quantity: item.quantity
      })),
      shippingAddress: shippingAddress,
      subtotal: calculateTotal(),
      tax: calculateGST(),
      shipping: calculateShipping(),
      couponCode: appliedCoupon?.code || null,
      couponDiscount: calculateCouponDiscount(),
      total: calculateFinalTotal()
    };

    navigate('/payment', { state: { orderData } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to checkout</p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">Shipping Address</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullname}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullname: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-1" />
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House/Flat No., Building Name, Street"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                    <input
                      type="text"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="400001"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="India"
                  />
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.product.images && item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">₹{(item.product.price * item.quantity).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">₹{item.product.price.toLocaleString()} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg sticky top-24"
            >
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              {/* Coupon Code Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Have a coupon?</span>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
                        <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <X className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 text-xs mt-2">{couponError}</p>
                    )}
                    <div className="mt-3 text-xs text-gray-500">
                      <p>Try: <span className="font-semibold">FIRST10</span> or <span className="font-semibold">SAVE500</span></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold">₹{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span className="font-semibold">₹{calculateGST().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">
                    {calculateShipping() === 0 ? 'FREE' : `₹${calculateShipping()}`}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-semibold">-₹{calculateCouponDiscount().toLocaleString()}</span>
                  </div>
                )}
                {calculateTotal() < 10000 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800">
                      Add ₹{(10000 - calculateTotal()).toLocaleString()} more for FREE shipping!
                    </p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{calculateFinalTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

