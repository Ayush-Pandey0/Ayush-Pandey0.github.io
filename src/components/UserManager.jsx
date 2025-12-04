import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, UserCheck, Mail, Phone, Calendar, DollarSign, Download, Send, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSubject, setNotificationSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchTotalRevenue();
  }, []);

  const fetchTotalRevenue = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await api.get('/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.orders) {
        const revenue = response.data.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        setTotalRevenue(revenue);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.users) {
        const transformedUsers = response.data.users.map(user => ({
          id: user._id,
          name: user.fullname || user.username || 'Unknown User',
          email: user.email,
          phone: user.phone || 'Not provided',
          role: user.role || 'customer',
          status: user.isActive !== false ? 'active' : 'inactive',
          registeredAt: user.createdAt || new Date().toISOString(),
          lastActive: user.lastLogin || user.createdAt || new Date().toISOString(),
          totalOrders: user.orderCount || 0,
          totalSpent: user.totalSpent || 0,
          avatar: user.avatar || null,
          avatarLetter: (user.fullname || user.username || 'U').charAt(0).toUpperCase(),
          address: user.address || { street: '', city: '', state: '', pincode: '' },
          preferences: {
            newsletter: user.preferences?.newsletter || false,
            sms: user.preferences?.sms || false,
            promotions: user.preferences?.promotions || false
          }
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleStatusToggle = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/users/${userId}`, { isActive: newStatus === 'active' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success('User status updated!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/users/${userId}`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated!');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Registered', 'Orders', 'Total Spent'].join(','),
      ...filteredUsers.map(u => [
        `"${u.name}"`, u.email, u.phone, u.role, u.status,
        formatDate(u.registeredAt), u.totalOrders, u.totalSpent
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported successfully!');
  };

  const handleSendNotification = async () => {
    if (!notificationSubject.trim() || !notificationMessage.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      await api.post('/admin/notifications/send', {
        subject: notificationSubject,
        message: notificationMessage,
        recipients: filteredUsers.map(u => u.id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Notification sent to ${filteredUsers.length} users!`);
      setShowNotificationModal(false);
      setNotificationSubject('');
      setNotificationMessage('');
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const UserDetailModal = ({ user, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            {user.avatar ? (
              <img 
                src={user.avatar.startsWith('/') ? `http://localhost:8080${user.avatar}` : user.avatar} 
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
              <span className="text-white font-bold text-xl">{user.avatarLetter}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-gray-900">Contact Information</h4>
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span>Joined: {formatDate(user.registeredAt)}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{user.totalOrders}</p>
              <p className="text-xs text-gray-600">Orders</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">₹{user.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Spent</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm font-bold text-purple-600">{formatDate(user.lastActive)}</p>
              <p className="text-xs text-gray-600">Last Active</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
            <p className="text-sm text-gray-600">
              {user.address?.street || 'Street not provided'}<br />
              {user.address?.city || 'City'}, {user.address?.state || 'State'}<br />
              PIN: {user.address?.pincode || 'N/A'}
            </p>
          </div>

          {/* Preferences */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Preferences</h4>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${user.preferences?.newsletter ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                Newsletter: {user.preferences?.newsletter ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${user.preferences?.sms ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                SMS: {user.preferences?.sms ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${user.preferences?.promotions ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                Promotions: {user.preferences?.promotions ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Manager</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchUsers} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button onClick={handleExportUsers} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button onClick={() => setShowNotificationModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Active Users</p>
            <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Customers</p>
            <p className="text-2xl font-bold">{users.filter(u => u.role === 'customer').length}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <UserCheck className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Users ({filteredUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">{user.avatarLetter}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">ID: {user.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{user.email}</div>
                    <div className="text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getRoleColor(user.role)}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(user.id)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.totalOrders}</td>
                  <td className="px-4 py-3 text-sm">₹{user.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(user.lastActive)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setSelectedUser(user)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Send Notification</h2>
                <button onClick={() => setShowNotificationModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  This will send a notification to {filteredUsers.length} user(s)
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    value={notificationSubject}
                    onChange={e => setNotificationSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notification subject..."
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={notificationMessage}
                    onChange={e => setNotificationMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Write your message..."
                  />
                </div>
                <button
                  onClick={handleSendNotification}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

