import { useState, useEffect } from 'react';
import { BarChart3, Users, Package, DollarSign, TrendingUp, Eye, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminDashboard({ isAuthenticated, setIsAuthenticated }) {
  const [stats, setStats] = useState({
    totalOrders: 1247,
    totalUsers: 5820,
    totalProducts: 156,
    totalRevenue: 2847500
  });
  
  const [recentOrders, setRecentOrders] = useState([
    { id: 'AA12345', customer: 'Rajesh Kumar', amount: 12500, status: 'shipped', date: '2024-12-01' },
    { id: 'AA12346', customer: 'Priya Sharma', amount: 8900, status: 'processing', date: '2024-12-01' },
    { id: 'AA12347', customer: 'Amit Patel', amount: 15600, status: 'delivered', date: '2024-11-30' },
    { id: 'AA12348', customer: 'Sneha Singh', amount: 6700, status: 'confirmed', date: '2024-11-30' },
    { id: 'AA12349', customer: 'Vikram Joshi', amount: 23400, status: 'shipped', date: '2024-11-29' }
  ]);

  const [products, setProducts] = useState([
    { id: '1', name: 'Mantra MFS100', category: 'Biometric', price: 2499, stock: 45, status: 'active' },
    { id: '2', name: 'GPS Tracker Pro', category: 'GPS Trackers', price: 3999, stock: 23, status: 'active' },
    { id: '3', name: 'Thermal Printer TP80', category: 'Printers', price: 5999, stock: 0, status: 'inactive' },
    { id: '4', name: 'Aadhaar Kit Complete', category: 'Aadhaar Kits', price: 8999, stock: 12, status: 'active' },
    { id: '5', name: 'Iris Scanner Elite', category: 'Biometric', price: 12999, stock: 8, status: 'active' }
  ]);

  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your Atlas Arrow business</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
              <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'orders', label: 'Orders' },
                { id: 'products', label: 'Products' },
                { id: 'users', label: 'Users' },
                { id: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Package}
                title="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                change="+12.5%"
                color="bg-blue-600"
              />
              <StatCard
                icon={Users}
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change="+8.2%"
                color="bg-green-600"
              />
              <StatCard
                icon={BarChart3}
                title="Products"
                value={stats.totalProducts}
                change="+3.1%"
                color="bg-purple-600"
              />
              <StatCard
                icon={DollarSign}
                title="Revenue"
                value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
                change="+15.8%"
                color="bg-orange-600"
              />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer}
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
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Product Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Products ({products.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                              <span className="text-lg">📦</span>
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
                          <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 mr-3">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
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
        )}

        {/* Other tabs content can be added similarly */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Management</h2>
            <p className="text-gray-600">Detailed order management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
            <p className="text-gray-600">User management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics & Reports</h2>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
