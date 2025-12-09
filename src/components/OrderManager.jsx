import { useState, useEffect } from 'react';
import { Package, Truck, Clock, CheckCircle, XCircle, Search, Eye, AlertCircle, MapPin, RefreshCw } from 'lucide-react';
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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Order Manager</h1>
          <p className="text-gray-500 text-sm">Track and manage orders</p>
        </div>
        <button 
          onClick={fetchOrders} 
          disabled={loading} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-500 rounded-xl p-3 text-white">
          <p className="text-blue-100 text-xs">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-amber-500 rounded-xl p-3 text-white">
          <p className="text-amber-100 text-xs">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="bg-green-500 rounded-xl p-3 text-white">
          <p className="text-green-100 text-xs">Delivered</p>
          <p className="text-2xl font-bold">{stats.delivered}</p>
        </div>
        <div className="bg-purple-500 rounded-xl p-3 text-white">
          <p className="text-purple-100 text-xs">Revenue</p>
          <p className="text-xl font-bold">₹{stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filters - Compact */}
      <div className="bg-white rounded-xl shadow-sm border p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
          </select>
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Payments</option>
            {paymentStatusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Orders</h2>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{filteredOrders.length}</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-500">Loading...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Payment</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{order.id.slice(-8)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900 text-sm">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.customer.email}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold">₹{(order.total || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs hidden lg:table-cell">{formatDate(order.orderDate)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, order._id, e.target.value)}
                          disabled={updating}
                          className={`text-xs px-1.5 py-1 rounded border cursor-pointer ${getStatusColor(order.status)} disabled:opacity-50`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{formatStatus(status)}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => openOrderDetail(order)} 
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeOrderDetail()}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-600 p-4 flex justify-between items-center z-10">
              <div className="text-white">
                <h2 className="text-lg font-bold">Order Details</h2>
                <p className="text-blue-100 text-xs font-mono">{selectedOrder.id}</p>
              </div>
              <button onClick={closeOrderDetail} className="text-white hover:bg-white/20 p-1.5 rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Update Order Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Update Order Status & Location
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg font-medium border ${getStatusColor(selectedOrder.status)}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{formatStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Location</label>
                    <input
                      type="text"
                      value={localTracking.currentLocation}
                      onChange={(e) => setLocalTracking(p => ({ ...p, currentLocation: e.target.value }))}
                      placeholder="e.g., Mumbai Warehouse"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Carrier</label>
                    <input
                      type="text"
                      value={localTracking.carrier}
                      onChange={(e) => setLocalTracking(p => ({ ...p, carrier: e.target.value }))}
                      placeholder="e.g., BlueDart, Delhivery"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery</label>
                    <input
                      type="date"
                      value={localTracking.estimatedDelivery}
                      onChange={(e) => setLocalTracking(p => ({ ...p, estimatedDelivery: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <button
                  onClick={async () => {
                    setUpdating(true);
                    try {
                      const token = sessionStorage.getItem('token');
                      await api.put(`/admin/orders/${selectedOrder._id}`, { 
                        status: selectedOrder.status,
                        tracking: localTracking 
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      setOrders(prev => prev.map(order => 
                        order.id === selectedOrder.id 
                          ? { ...order, status: selectedOrder.status, tracking: { ...order.tracking, ...localTracking } } 
                          : order
                      ));
                      
                      toast.success('Order updated successfully!');
                    } catch (error) {
                      toast.error('Failed to update order');
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Update Order
                    </>
                  )}
                </button>
              </div>

              {/* Tracking Journey */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Tracking Journey
                </h3>
                
                {/* Journey Visual */}
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border mb-3">
                  {/* Origin */}
                  <div className="text-center flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Origin</p>
                    <p className="text-xs text-gray-500">Atlas Warehouse</p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 bg-blue-300 flex-1"></div>
                    <div className="mx-1 text-blue-500">→</div>
                    <div className="h-0.5 bg-blue-300 flex-1"></div>
                  </div>
                  
                  {/* Current Location */}
                  <div className="text-center flex-1">
                    <div className={`w-10 h-10 ${selectedOrder.tracking?.currentLocation ? 'bg-blue-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-1 ${selectedOrder.tracking?.currentLocation ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                      <Truck className={`w-5 h-5 ${selectedOrder.tracking?.currentLocation ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Current</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {selectedOrder.tracking?.currentLocation || 'Not updated'}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 bg-gray-300 flex-1"></div>
                    <div className="mx-1 text-gray-400">→</div>
                    <div className="h-0.5 bg-gray-300 flex-1"></div>
                  </div>
                  
                  {/* Destination */}
                  <div className="text-center flex-1">
                    <div className={`w-10 h-10 ${selectedOrder.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-1`}>
                      <MapPin className={`w-5 h-5 ${selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Destination</p>
                    <p className="text-xs text-gray-500">{selectedOrder.shippingAddress?.city || 'Customer'}</p>
                  </div>
                </div>
                
                {/* Status Timeline */}
                <OrderTimeline 
                  status={selectedOrder.status} 
                  tracking={selectedOrder.tracking}
                  orderDate={selectedOrder.orderDate}
                  compact={true}
                />
                
                {/* Tracking Details */}
                {(selectedOrder.tracking?.carrier || selectedOrder.tracking?.estimatedDelivery) && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="flex flex-wrap gap-4">
                      {selectedOrder.tracking?.carrier && (
                        <span><span className="text-gray-500">Carrier:</span> <strong>{selectedOrder.tracking.carrier}</strong></span>
                      )}
                      {selectedOrder.tracking?.estimatedDelivery && (
                        <span><span className="text-gray-500">Expected:</span> <strong className="text-green-600">{formatDate(selectedOrder.tracking.estimatedDelivery)}</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-green-800">Payment Status</h3>
                    <p className="text-xs text-gray-500">Transaction: {selectedOrder.transactionId || 'N/A'}</p>
                  </div>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(selectedOrder.id, selectedOrder._id, e.target.value)}
                    disabled={updating}
                    className={`px-3 py-1.5 rounded-lg font-medium border text-sm ${getPaymentStatusColor(selectedOrder.paymentStatus)} disabled:opacity-50`}
                  >
                    {paymentStatusOptions.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & Items */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Customer</h3>
                  <p className="text-sm font-medium">{selectedOrder.customer.name}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer.email}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer.phone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Shipping Address</h3>
                  {selectedOrder.shippingAddress?.street ? (
                    <p className="text-xs text-gray-600">
                      {selectedOrder.shippingAddress?.fullname || selectedOrder.customer.name}<br/>
                      {selectedOrder.shippingAddress?.street}<br/>
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">No address</p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Items ({selectedOrder.items.length})</h3>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm border-b border-gray-200 last:border-0">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-medium">₹{(item.price || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-gray-300 font-bold">
                  <span>Total</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

