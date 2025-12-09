import { useState, useEffect } from 'react';
import { Package, Truck, Clock, CheckCircle, XCircle, Search, Eye, AlertCircle, MapPin, RefreshCw, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';
import OrderTimeline from './OrderTimeline';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [localTracking, setLocalTracking] = useState({
    currentLocation: '',
    carrier: 'Atlas Express',
    estimatedDelivery: ''
  });

  const statusOptions = ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  const paymentStatusOptions = ['pending', 'completed', 'failed'];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await api.get(`/admin/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const mappedOrders = response.data.orders.map(order => ({
        id: order.orderNumber,
        _id: order._id,
        customer: {
          name: order.user?.fullname || order.shippingAddress?.fullname || 'Customer',
          email: order.user?.email || 'N/A',
          phone: order.user?.phone || order.shippingAddress?.phone || 'N/A',
          registeredAddress: order.user?.address || null
        },
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: '📦'
        })),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId || '',
        total: order.total,
        shippingAddress: order.shippingAddress || order.user?.address || {},
        orderDate: order.createdAt,
        tracking: order.tracking || {}
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const handleStatusChange = async (orderId, dbId, newStatus) => {
    setUpdating(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/orders/${dbId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      toast.success(`Order ${orderId} status updated to ${formatStatus(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (orderId, dbId, newPaymentStatus) => {
    setUpdating(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/orders/${dbId}`, { paymentStatus: newPaymentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
      }
      
      toast.success(`Payment status updated for order ${orderId}`);
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async (orderId, dbId, trackingData) => {
    setUpdating(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/orders/${dbId}`, { tracking: trackingData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, tracking: { ...order.tracking, ...trackingData } } : order
      ));
      
      toast.success('Tracking information updated');
    } catch (error) {
      toast.error('Failed to update tracking');
    } finally {
      setUpdating(false);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setLocalTracking({
      currentLocation: order.tracking?.currentLocation || '',
      carrier: order.tracking?.carrier || 'Atlas Express',
      estimatedDelivery: order.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toISOString().split('T')[0] : ''
    });
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  const formatStatus = (status) => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const getStatusColor = (status) => {
    const colors = {
      processing: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = { completed: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', failed: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      processing: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      out_for_delivery: <Truck className="w-4 h-4" />,
      delivered: <Package className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all customer orders</p>
        </div>
        <button 
          onClick={fetchOrders} 
          disabled={loading} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Processing</p>
              <p className="text-3xl font-bold mt-1">{stats.processing}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Delivered</p>
              <p className="text-3xl font-bold mt-1">{stats.delivered}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Revenue</p>
              <p className="text-2xl md:text-3xl font-bold mt-1">₹{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 min-w-[140px]"
            >
              <option value="all">All Status</option>
              {statusOptions.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)} 
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 min-w-[140px]"
            >
              <option value="all">All Payments</option>
              {paymentStatusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Orders</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{filteredOrders.length} orders</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Transaction ID</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order, index) => (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {order.id.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0">
                          {order.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{order.customer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{order.customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                        📦 {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="hidden sm:inline">{formatStatus(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      {order.transactionId ? (
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-700 font-medium">
                          {order.transactionId.slice(0, 12)}{order.transactionId.length > 12 ? '...' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-900">₹{(order.total || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{formatDate(order.orderDate)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, order._id, e.target.value)}
                          disabled={updating}
                          className={`text-xs px-2 py-1.5 rounded-lg border-2 cursor-pointer font-medium transition-all ${getStatusColor(order.status)} hover:shadow-md disabled:opacity-50`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{formatStatus(status)}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => openOrderDetail(order)} 
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-all hover:shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeOrderDetail()}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="text-white">
                    <h2 className="text-xl font-bold">Order Details</h2>
                    <p className="text-blue-100 text-sm font-mono mt-1">{selectedOrder.id}</p>
                  </div>
                  <button 
                    onClick={closeOrderDetail} 
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-5">
                {/* Order Timeline */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-lg"><Truck className="w-4 h-4 text-blue-600" /></span>
                    Order Progress
                  </h3>
                  <OrderTimeline 
                    status={selectedOrder.status} 
                    tracking={selectedOrder.tracking}
                    orderDate={selectedOrder.orderDate}
                  />
                </div>

                {/* Status Controls */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, selectedOrder._id, e.target.value)}
                      disabled={updating}
                      className={`w-full px-4 py-3 rounded-xl font-semibold border-2 transition-all ${getStatusColor(selectedOrder.status)} disabled:opacity-50`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{formatStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Status</label>
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(selectedOrder.id, selectedOrder._id, e.target.value)}
                      disabled={updating}
                      className={`w-full px-4 py-3 rounded-xl font-semibold border-2 transition-all ${getPaymentStatusColor(selectedOrder.paymentStatus)} disabled:opacity-50`}
                    >
                      {paymentStatusOptions.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tracking */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Update Tracking Information
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={localTracking.currentLocation}
                      onChange={(e) => setLocalTracking(p => ({ ...p, currentLocation: e.target.value }))}
                      placeholder="Current Location"
                      className="px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      value={localTracking.carrier}
                      onChange={(e) => setLocalTracking(p => ({ ...p, carrier: e.target.value }))}
                      placeholder="Carrier"
                      className="px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="date"
                      value={localTracking.estimatedDelivery}
                      onChange={(e) => setLocalTracking(p => ({ ...p, estimatedDelivery: e.target.value }))}
                      className="px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateTracking(selectedOrder.id, selectedOrder._id, localTracking)}
                    disabled={updating}
                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Update Tracking
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-gray-100 p-1.5 rounded-lg">👤</span>
                    Customer Information
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Email</p>
                      <p className="font-medium text-gray-900 truncate">{selectedOrder.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    💳 Payment Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Status</p>
                      <span className={`inline-block font-semibold px-3 py-1 rounded-full text-sm ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction ID</p>
                      {selectedOrder.transactionId ? (
                        <span className="font-mono font-semibold bg-amber-100 px-3 py-1.5 rounded-lg text-amber-800 border border-amber-200">
                          {selectedOrder.transactionId}
                        </span>
                      ) : (
                        <span className="text-red-500 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                  {selectedOrder.paymentStatus === 'pending' && selectedOrder.transactionId && (
                    <div className="mt-4 p-3 bg-amber-100 rounded-xl border border-amber-300">
                      <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Verify this transaction ID manually before confirming payment
                      </p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-gray-100 p-1.5 rounded-lg">📦</span>
                    Order Items
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-gray-900">₹{(item.price || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-lg"><MapPin className="w-4 h-4 text-blue-600" /></span>
                    Shipping Address
                  </h3>
                  {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.city ? (
                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-gray-900">{selectedOrder.shippingAddress?.fullname || selectedOrder.customer.name}</p>
                      <p className="text-gray-600">{selectedOrder.shippingAddress?.street || 'N/A'}</p>
                      <p className="text-gray-600">
                        {selectedOrder.shippingAddress?.city}{selectedOrder.shippingAddress?.city && selectedOrder.shippingAddress?.state ? ', ' : ''}{selectedOrder.shippingAddress?.state}{selectedOrder.shippingAddress?.pincode ? ` - ${selectedOrder.shippingAddress?.pincode}` : ''}
                      </p>
                      {selectedOrder.shippingAddress?.phone && (
                        <p className="text-gray-500 flex items-center gap-1 mt-2">📞 {selectedOrder.shippingAddress.phone}</p>
                      )}
                    </div>
                  ) : selectedOrder.customer.registeredAddress?.street ? (
                    <div>
                      <p className="text-xs text-blue-600 mb-2 font-medium">Using registered address:</p>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold text-gray-900">{selectedOrder.customer.name}</p>
                        <p className="text-gray-600">{selectedOrder.customer.registeredAddress.street}</p>
                        <p className="text-gray-600">
                          {selectedOrder.customer.registeredAddress.city}{selectedOrder.customer.registeredAddress.city && selectedOrder.customer.registeredAddress.state ? ', ' : ''}{selectedOrder.customer.registeredAddress.state}{selectedOrder.customer.registeredAddress.pincode ? ` - ${selectedOrder.customer.registeredAddress.pincode}` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No address provided</p>
                  )}
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Order Date</p>
                    <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Total Amount</p>
                    <p className="text-3xl font-bold">₹{(selectedOrder.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

