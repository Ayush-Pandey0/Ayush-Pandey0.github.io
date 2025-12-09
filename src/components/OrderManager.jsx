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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order Manager</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <button onClick={fetchOrders} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Processing</p>
            <p className="text-2xl font-bold">{stats.processing}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Delivered</p>
            <p className="text-2xl font-bold">{stats.delivered}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Revenue</p>
            <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Payments</option>
            {paymentStatusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Orders ({filteredOrders.length})</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{order.items.length} item(s)</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{formatStatus(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.transactionId ? (
                        <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded text-yellow-800">{order.transactionId}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">₹{(order.total || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(order.orderDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, order._id, e.target.value)}
                          disabled={updating}
                          className={`text-xs px-2 py-1 rounded-lg border cursor-pointer ${getStatusColor(order.status)} disabled:opacity-50`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{formatStatus(status)}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => openOrderDetail(order)} 
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal - Inline to prevent re-renders */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-gray-600">{selectedOrder.id}</p>
              </div>
              <button onClick={closeOrderDetail} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-gray-700">Order Progress</h3>
                <OrderTimeline 
                  status={selectedOrder.status} 
                  tracking={selectedOrder.tracking}
                  orderDate={selectedOrder.orderDate}
                />
              </div>

              {/* Status Controls */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Order Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, selectedOrder._id, e.target.value)}
                    disabled={updating}
                    className={`w-full px-3 py-2 rounded-lg font-medium border ${getStatusColor(selectedOrder.status)}`}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Status</label>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(selectedOrder.id, selectedOrder._id, e.target.value)}
                    disabled={updating}
                    className={`w-full px-3 py-2 rounded-lg font-medium border ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}
                  >
                    {paymentStatusOptions.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tracking */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Update Tracking Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={localTracking.currentLocation}
                    onChange={(e) => setLocalTracking(p => ({ ...p, currentLocation: e.target.value }))}
                    placeholder="Current Location"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={localTracking.carrier}
                    onChange={(e) => setLocalTracking(p => ({ ...p, carrier: e.target.value }))}
                    placeholder="Carrier"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={localTracking.estimatedDelivery}
                    onChange={(e) => setLocalTracking(p => ({ ...p, estimatedDelivery: e.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <button
                  onClick={() => handleUpdateTracking(selectedOrder.id, selectedOrder._id, localTracking)}
                  disabled={updating}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Update Tracking
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.customer.name}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.customer.email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.customer.phone}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800">💳 Payment Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><span className="text-gray-500">Payment Method:</span> <span className="font-medium">{selectedOrder.paymentMethod || 'N/A'}</span></p>
                  <p><span className="text-gray-500">Payment Status:</span> <span className={`font-medium px-2 py-1 rounded ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></p>
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Transaction ID:</span>{' '}
                    {selectedOrder.transactionId ? (
                      <span className="font-mono font-medium bg-yellow-100 px-2 py-1 rounded text-yellow-800">{selectedOrder.transactionId}</span>
                    ) : (
                      <span className="text-red-500 italic">Not provided</span>
                    )}
                  </div>
                </div>
                {selectedOrder.paymentStatus === 'pending' && selectedOrder.transactionId && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                    <p className="text-yellow-800 text-sm font-medium">⚠️ Verify this transaction ID manually before confirming payment</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(item.price || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Shipping Address
                </h3>
                {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.city ? (
                  <p className="text-sm">
                    <span className="font-medium">{selectedOrder.shippingAddress?.fullname || selectedOrder.customer.name}</span><br />
                    {selectedOrder.shippingAddress?.street || 'N/A'}<br />
                    {selectedOrder.shippingAddress?.city}{selectedOrder.shippingAddress?.city && selectedOrder.shippingAddress?.state ? ', ' : ''}{selectedOrder.shippingAddress?.state}{selectedOrder.shippingAddress?.pincode ? ` - ${selectedOrder.shippingAddress?.pincode}` : ''}
                    {selectedOrder.shippingAddress?.phone && (
                      <><br /><span className="text-gray-500">📞 {selectedOrder.shippingAddress.phone}</span></>
                    )}
                  </p>
                ) : selectedOrder.customer.registeredAddress?.street ? (
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Using registered address:</p>
                    <p className="text-sm">
                      <span className="font-medium">{selectedOrder.customer.name}</span><br />
                      {selectedOrder.customer.registeredAddress.street}<br />
                      {selectedOrder.customer.registeredAddress.city}{selectedOrder.customer.registeredAddress.city && selectedOrder.customer.registeredAddress.state ? ', ' : ''}{selectedOrder.customer.registeredAddress.state}{selectedOrder.customer.registeredAddress.pincode ? ` - ${selectedOrder.customer.registeredAddress.pincode}` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No address provided</p>
                )}
              </div>

              {/* Total */}
              <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between">
                <div>
                  <p className="text-gray-400">Order Date</p>
                  <p>{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Total</p>
                  <p className="text-2xl font-bold">₹{(selectedOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

