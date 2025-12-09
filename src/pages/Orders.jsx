import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';
import OrderTimeline from '../components/OrderTimeline';
import toast from 'react-hot-toast';
import { Package, Clock, CheckCircle, Truck, XCircle, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';

const statusConfig = {
  processing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Processing' },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800', icon: Package, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
  'return requested': { color: 'bg-orange-100 text-orange-800', icon: RotateCcw, label: 'Return Requested' }
};

export default function Orders({ setIsAuthenticated }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view orders');
        return;
      }
      const res = await api.get('/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (e) {
      console.error('Orders fetch error:', e);
      toast.error('Could not load orders');
    } finally { setLoading(false); }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status?.toLowerCase()] || statusConfig.processing;
  };

  const canCancel = (status) => {
    const s = status?.toLowerCase();
    return s === 'processing' || s === 'confirmed';
  };

  const canReturn = (status) => {
    const s = status?.toLowerCase();
    return s === 'shipped' || s === 'delivered';
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/orders/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to request a return for this order?')) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/orders/${orderId}/return`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Return request submitted successfully');
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit return request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
              <Link to="/products" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                    {/* Order Header */}
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg">Order #{order.orderNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • 
                            Payment: {order.paymentMethod} • 
                            {order.paymentStatus === 'completed' ? (
                              <span className="text-green-600 font-medium"> Paid</span>
                            ) : (
                              <span className="text-yellow-600 font-medium"> {order.paymentStatus}</span>
                            )}
                          </div>
                          {order.couponCode && (
                            <div className="text-sm text-green-600 mt-1">
                              Coupon applied: {order.couponCode} (-₹{order.couponDiscount?.toLocaleString()})
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">₹{order.total?.toLocaleString()}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {order.shippingAddress?.city}, {order.shippingAddress?.state}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            {expandedOrder === order._id ? (
                              <ChevronUp className="w-6 h-6" />
                            ) : (
                              <ChevronDown className="w-6 h-6" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content with Timeline */}
                    {expandedOrder === order._id && (
                      <div className="border-t bg-gray-50">
                        {/* Order Timeline */}
                        <div className="p-6">
                          <h3 className="font-semibold text-gray-700 mb-2">Order Status</h3>
                          <OrderTimeline 
                            status={order.status} 
                            tracking={order.tracking}
                            orderDate={order.createdAt}
                          />
                        </div>

                        {/* Order Items */}
                        <div className="px-6 pb-4">
                          <h3 className="font-semibold text-gray-700 mb-3">Items Ordered</h3>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <p className="font-semibold text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                          <div className="px-6 pb-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
                            <div className="bg-white p-3 rounded-lg text-sm text-gray-600">
                              <p className="font-medium text-gray-800">{order.shippingAddress.fullname}</p>
                              <p>{order.shippingAddress.address}</p>
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                              <p>📞 {order.shippingAddress.phone}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'return requested' && (
                          <div className="px-6 pb-6 flex gap-3">
                            {canCancel(order.status) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                              >
                                <X className="w-4 h-4" />
                                Cancel Order
                              </button>
                            )}
                            {canReturn(order.status) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReturnOrder(order._id); }}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition font-medium"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Request Return
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

