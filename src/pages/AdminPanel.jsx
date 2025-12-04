import { useState, useEffect } from 'react';
import { BarChart3, Users, Package, DollarSign, TrendingUp, Eye, Edit, Trash2, Plus, Search, Filter, Settings, Bell, LogOut, Home, ShoppingCart, Calendar, MessageSquare, FileText, Activity, Mail, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';
import ProductManager from '../components/ProductManager';
import UserManager from '../components/UserManager';
import OrderManager from '../components/OrderManager';
import MessageManager from '../components/MessageManager';
import NotificationManager from '../components/NotificationManager';
import SettingsManager from '../components/SettingsManager';
import ReviewManager from '../components/ReviewManager';
import { logoutAdmin, getAdminUser } from '../utils/adminAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const adminUser = getAdminUser();

  // Check if admin is authenticated with valid token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const isAdminAuth = sessionStorage.getItem('adminAuthenticated');
    
    if (!token || !isAdminAuth) {
      toast.error('Please login to access admin panel');
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.loading('Logging out...', { id: 'logout' });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logoutAdmin();
    sessionStorage.clear(); // Clear all session data
    setIsLoggingOut(false);
    
    toast.success('Logged out successfully!', { id: 'logout' });
    navigate('/');
  };

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    newUsers: 0,
    monthlyGrowth: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch orders, users, products in parallel
      const [ordersRes, usersRes, productsRes, reviewsRes] = await Promise.all([
        api.get('/admin/orders?limit=100', { headers }).catch(() => ({ data: { orders: [] } })),
        api.get('/admin/users', { headers }).catch(() => ({ data: { users: [] } })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/reviews').catch(() => ({ data: [] }))
      ]);

      const orders = ordersRes.data?.orders || [];
      const users = usersRes.data?.users || [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.products || [];
      const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

      // Calculate stats
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
      const lowStockItems = products.filter(p => (p.stock || 0) < 10).length;
      
      // Get new users this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newUsers = users.filter(u => new Date(u.createdAt) >= startOfMonth).length;

      // Calculate monthly growth (compare with last month)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= lastMonth && d <= endOfLastMonth;
      });
      const thisMonthOrders = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
      const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : 0;

      setStats({
        totalOrders: orders.length,
        totalUsers: users.length,
        totalProducts: products.length,
        totalRevenue,
        pendingOrders,
        lowStockItems,
        newUsers,
        monthlyGrowth: parseFloat(monthlyGrowth)
      });

      // Set recent orders (latest 5)
      const mappedOrders = orders.slice(0, 5).map(order => ({
        id: order.orderNumber || order._id,
        customer: order.user?.fullname || order.shippingAddress?.fullname || 'Customer',
        email: order.user?.email || 'N/A',
        amount: order.total || 0,
        status: order.status || 'processing',
        date: order.createdAt,
        items: order.items?.length || 0
      }));
      setRecentOrders(mappedOrders);

      // Set recent reviews
      setRecentReviews(reviews.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  const [products, setProducts] = useState([]);

  const [users, setUsers] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <p className={`text-sm mt-2 flex items-center ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={ShoppingCart}
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              change={stats.totalOrders > 0 ? "+12.5%" : "0%"}
              color="bg-blue-600"
              subtitle={`${stats.pendingOrders} pending`}
            />
            <StatCard
              icon={Users}
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              change={stats.newUsers > 0 ? "+8.2%" : "0%"}
              color="bg-green-600"
              subtitle={`${stats.newUsers} new this month`}
            />
            <StatCard
              icon={Package}
              title="Products"
              value={stats.totalProducts}
              change="+3.1%"
              color="bg-purple-600"
              subtitle={`${stats.lowStockItems} low stock`}
            />
            <StatCard
              icon={DollarSign}
              title="Revenue"
              value={stats.totalRevenue >= 100000 ? `₹${(stats.totalRevenue / 100000).toFixed(1)}L` : `₹${stats.totalRevenue.toLocaleString()}`}
              change={stats.monthlyGrowth >= 0 ? `+${stats.monthlyGrowth}%` : `${stats.monthlyGrowth}%`}
              color="bg-orange-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setActiveTab('products')}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Orders
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Manage Users
              </button>
            </div>
          </div>

          {/* Recent Orders & Reviews Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  No orders yet
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-600">{order.id}</div>
                        <div className="text-sm text-gray-600">{order.customer}</div>
                        <div className="text-xs text-gray-400">{order.items} item(s)</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{order.amount.toLocaleString()}</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Reviews</h2>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>
              {recentReviews.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  No reviews yet
                </div>
              ) : (
                <div className="divide-y">
                  {recentReviews.slice(0, 5).map((review, idx) => (
                    <div key={review._id || idx} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.user?.fullname || review.userName || 'Anonymous'}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{review.comment || review.text}</p>
                          <p className="text-xs text-gray-400 mt-1">{review.productName || 'Product'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600">Total Revenue: <span className="font-bold text-2xl text-blue-600">₹{stats.totalRevenue.toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Export Orders
            </button>
            <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Filter
            </button>
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-blue-600">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.items} items</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600">Manage your product catalog and inventory</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
            <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Import
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Categories</option>
            <option>Biometric Devices</option>
            <option>GPS Trackers</option>
            <option>Printers</option>
            <option>Aadhaar Kits</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-lg">{product.image}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={product.stock === 0 ? 'text-red-600 font-medium' : product.stock < 20 ? 'text-yellow-600 font-medium' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                      {product.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage customer accounts and administrators</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
            <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Export
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Roles</option>
            <option>Customer</option>
            <option>Admin</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{user.spent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.role !== 'admin' && (
                      <button className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'orders': return <OrderManager />;
      case 'products': return <ProductManager />;
      case 'users': return <UserManager />;
      case 'reviews': return <ReviewManager />;
      case 'messages': return <MessageManager />;
      case 'notifications': return <NotificationManager />;
      case 'settings': return <SettingsManager />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AA</span>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3">
                <h2 className="text-lg font-bold">Atlas & Arrow</h2>
                <p className="text-gray-400 text-sm">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
              <p className="text-gray-600">Welcome back, {adminUser?.username || 'Admin'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-medium text-gray-900">{adminUser?.username || 'Admin'}</span>
              </div>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-gray-600 hover:text-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
                title="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
