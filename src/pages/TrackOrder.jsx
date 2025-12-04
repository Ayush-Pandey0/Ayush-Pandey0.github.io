import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Truck, Clock, Calendar, MapPin, Package2, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function TrackOrder({ isAuthenticated, setIsAuthenticated }) {
  const [trackingId, setTrackingId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentOrders();
    }
  }, [isAuthenticated]);

  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Map orders to display format
      const orders = response.data.map(order => ({
        id: order.orderNumber,
        _id: order._id,
        status: order.status,
        estimatedDelivery: order.tracking?.estimatedDelivery || new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
        total: order.total,
        items: order.items
      }));
      
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      // Don't show error toast - just silently fail
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    
    try {
      // Try to fetch order by order number
      const response = await api.get(`/orders/track/${trackingId.trim()}`);
      const order = response.data;
      
      // Build tracking data from order
      const trackingInfo = {
        orderId: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.tracking?.estimatedDelivery || new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
        currentLocation: order.tracking?.currentLocation || 'Atlas Arrow Warehouse',
        customer: order.shippingAddress?.fullname || 'Customer',
        shippingAddress: `${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`,
        timeline: order.tracking?.timeline?.length > 0 ? order.tracking.timeline.map(t => ({
          status: t.status,
          date: new Date(t.date).toLocaleDateString(),
          time: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: t.location,
          completed: t.completed,
          description: t.description
        })) : getDefaultTimeline(order),
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingMethod: 'Standard Delivery',
        carrier: order.tracking?.carrier || 'Atlas Express',
        trackingNumber: order.tracking?.trackingNumber || order.orderNumber,
        total: order.total
      };
      
      setTrackingData(trackingInfo);
    } catch (error) {
      console.error('Error tracking order:', error);
      if (error.response?.status === 404) {
        toast.error('Order not found. Please check your order ID.');
      } else {
        toast.error('Failed to track order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate default timeline based on order status
  const getDefaultTimeline = (order) => {
    const createdDate = new Date(order.createdAt);
    const statuses = ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statuses.indexOf(order.status);
    
    const timeline = [
      {
        status: 'Order Placed',
        date: createdDate.toLocaleDateString(),
        time: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: 'Atlas Arrow Warehouse',
        completed: true,
        description: 'Your order has been placed and payment confirmed'
      },
      {
        status: 'Processing',
        date: createdDate.toLocaleDateString(),
        time: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: 'Atlas Arrow Warehouse',
        completed: currentStatusIndex >= 0,
        description: 'Order is being prepared for shipment'
      },
      {
        status: 'Shipped',
        date: currentStatusIndex >= 2 ? new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString() : 'Pending',
        time: currentStatusIndex >= 2 ? '09:00 AM' : 'Expected',
        location: 'Distribution Center',
        completed: currentStatusIndex >= 2,
        description: 'Package has been shipped and is on the way'
      },
      {
        status: 'Out for Delivery',
        date: currentStatusIndex >= 3 ? new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'Pending',
        time: currentStatusIndex >= 3 ? '08:00 AM' : 'Expected',
        location: 'Local Delivery Hub',
        completed: currentStatusIndex >= 3,
        description: 'Package is out for delivery'
      },
      {
        status: 'Delivered',
        date: currentStatusIndex >= 4 ? new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'Pending',
        time: currentStatusIndex >= 4 ? '02:30 PM' : 'Expected',
        location: 'Your Address',
        completed: currentStatusIndex >= 4,
        description: 'Package delivered to your address'
      }
    ];
    
    return timeline;
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase().replace('_', ' ')) {
      case 'delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'shipped': case 'out for delivery': return <Truck className="w-6 h-6 text-blue-500" />;
      case 'processing': case 'confirmed': return <Package2 className="w-6 h-6 text-yellow-500" />;
      case 'order placed': return <Clock className="w-6 h-6 text-gray-500" />;
      case 'cancelled': return <AlertCircle className="w-6 h-6 text-red-500" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase().replace('_', ' ')) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': case 'out for delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': case 'confirmed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Package2 className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Enter your order ID to get real-time updates on your shipment status and delivery progress
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tracking Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 -mt-16 relative z-10"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your order ID (e.g., AA12345)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              />
            </div>
            <motion.button
              onClick={handleTrack}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-8 py-3 rounded-lg font-semibold transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Tracking...
                </div>
              ) : (
                'Track Order'
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Orders */}
        {isAuthenticated && !trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Recent Orders</h2>
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading your orders...</span>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => {
                      setTrackingId(order.id);
                      handleTrack();
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <span className="font-semibold text-gray-900">{order.id}</span>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} item(s) • ₹{order.total?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Est: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders found</p>
                <p className="text-sm text-gray-400">Your orders will appear here once you make a purchase</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Tracking Results */}
        <AnimatePresence>
          {trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Order #{trackingData.orderId}</h2>
                    <p className="text-gray-600">Tracking Number: {trackingData.trackingNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${getStatusColor(trackingData.status)}`}>
                      {getStatusIcon(trackingData.status)}
                      <span className="ml-2">{formatStatus(trackingData.status)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Est. Delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-2" />
                      <div>
                        <p className="font-medium">{trackingData.customer}</p>
                        <p className="text-gray-600">{trackingData.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Details</h3>
                    <div className="space-y-1">
                      <p className="text-gray-600">Method: {trackingData.shippingMethod}</p>
                      <p className="text-gray-600">Carrier: {trackingData.carrier}</p>
                      <p className="text-gray-600">Current Location: {trackingData.currentLocation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tracking Timeline</h3>
                <div className="space-y-6">
                  {trackingData.timeline.map((event, index) => (
                    <div key={index} className="relative flex items-start">
                      {/* Timeline line */}
                      {index < trackingData.timeline.length - 1 && (
                        <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                          event.completed ? 'bg-green-300' : 'bg-gray-300'
                        }`}></div>
                      )}
                      
                      {/* Timeline dot */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        event.completed 
                          ? 'bg-green-100 border-4 border-green-500' 
                          : 'bg-gray-100 border-4 border-gray-300'
                      }`}>
                        {event.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Timeline content */}
                      <div className="ml-6 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${
                            event.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {event.status}
                          </h4>
                          <div className="text-sm text-gray-500">
                            {event.date} {event.time !== 'Expected' && `• ${event.time}`}
                          </div>
                        </div>
                        <p className={`text-sm mb-1 ${
                          event.completed ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {event.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Items in this Order</h3>
                <div className="space-y-3">
                  {trackingData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                          <Package2 className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link 
                    to="/contact" 
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-center"
                  >
                    Contact Support
                  </Link>
                  <a 
                    href={`mailto:support@atlasarrow.com?subject=Issue with Order ${trackingData?.orderNumber || trackingId}&body=Order ID: ${trackingData?.orderNumber || trackingId}%0D%0A%0D%0APlease describe your issue:`}
                    className="w-full border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition text-center"
                  >
                    Report Issue
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!trackingData && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-16"
          >
            <Package2 className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Your Package</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter your order ID above to get detailed tracking information and estimated delivery time.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
