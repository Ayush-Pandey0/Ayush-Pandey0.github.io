import { useState, useEffect } from 'react';
import { Bell, Check, X, Package, Gift, Shield, Box, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function Notifications({ isAuthenticated, setIsAuthenticated }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await api.put('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.delete(`/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const clearAll = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await api.delete('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'order': 
        return { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' };
      case 'promotion': 
        return { icon: Gift, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-500' };
      case 'security': 
        return { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-500' };
      case 'product': 
        return { icon: Box, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500' };
      case 'admin': 
        return { icon: Mail, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-500' };
      case 'system': 
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-400' };
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'order', label: 'Orders' },
    { id: 'admin', label: 'Messages' },
    { id: 'system', label: 'System' }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-blue-100">
                {loading ? 'Loading...' : 
                  unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'
                }
              </p>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    filter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                      filter === f.id ? 'bg-white/20' : 'bg-red-500 text-white'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm flex items-center"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-xl shadow-sm"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              {filter === 'all' 
                ? 'When you receive notifications, they\'ll appear here.'
                : `You don't have any ${filter} notifications.`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const style = getNotificationStyle(notification.type);
                const IconComponent = style.icon;
                
                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`bg-white rounded-xl shadow-sm border-l-4 ${style.borderColor} ${
                      !notification.read ? 'ring-1 ring-blue-100' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-2.5 rounded-full ${style.bgColor} flex-shrink-0`}>
                          <IconComponent className={`w-5 h-5 ${style.color}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

