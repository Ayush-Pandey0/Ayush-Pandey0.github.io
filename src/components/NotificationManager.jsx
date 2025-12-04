import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertTriangle, Package, ShoppingCart, Users, MessageSquare, Settings, X, CheckCheck, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch recent orders, users, and messages
        const [ordersRes, usersRes, messagesRes] = await Promise.all([
          fetch(`${API}/api/admin/orders?limit=5`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API}/api/admin/users?limit=5`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API}/api/contact`, { headers }).catch(() => ({ ok: false }))
        ]);

        const notifs = [];
        let id = 1;

        // Process orders
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          (orders.orders || orders || []).slice(0, 3).forEach(order => {
            const timeAgo = getTimeAgo(order.createdAt);
            notifs.push({
              id: id++,
              type: 'order',
              title: order.status === 'pending' ? 'New Order Received' : `Order ${order.status}`,
              message: `Order #${order._id?.slice(-8).toUpperCase() || 'N/A'} - ₹${order.totalAmount?.toLocaleString() || 0}`,
              time: timeAgo,
              read: order.status !== 'pending',
              priority: order.status === 'pending' ? 'high' : 'low'
            });
          });
        }

        // Process new users (registered in last 7 days)
        if (usersRes.ok) {
          const users = await usersRes.json();
          (users.users || users || []).slice(0, 3).forEach(user => {
            if (user.role !== 'admin') {
              const timeAgo = getTimeAgo(user.createdAt);
              notifs.push({
                id: id++,
                type: 'user',
                title: 'New User Registration',
                message: `${user.fullname || user.email} has registered`,
                time: timeAgo,
                read: true,
                priority: 'medium'
              });
            }
          });
        }

        // Process contact messages
        if (messagesRes.ok) {
          const messages = await messagesRes.json();
          (messages || []).slice(0, 2).forEach(msg => {
            const timeAgo = getTimeAgo(msg.createdAt);
            notifs.push({
              id: id++,
              type: 'message',
              title: 'New Contact Message',
              message: `${msg.name}: ${msg.subject || msg.message?.slice(0, 30) + '...'}`,
              time: timeAgo,
              read: msg.read || false,
              priority: 'medium'
            });
          });
        }

        // If no notifications, show empty state
        if (notifs.length === 0) {
          notifs.push({
            id: 1,
            type: 'system',
            title: 'All Caught Up!',
            message: 'No new notifications at this time',
            time: 'Just now',
            read: true,
            priority: 'low'
          });
        }

        setNotifications(notifs);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([{
          id: 1,
          type: 'system',
          title: 'Welcome!',
          message: 'Your notification center is ready',
          time: 'Just now',
          read: true,
          priority: 'low'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orders: true,
    stock: true,
    users: true,
    reviews: true,
    messages: true,
    system: true,
    email: true,
    push: false
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'order', label: 'Orders' },
    { id: 'stock', label: 'Stock' },
    { id: 'user', label: 'Users' },
    { id: 'review', label: 'Reviews' },
    { id: 'message', label: 'Messages' }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'stock': return Package;
      case 'user': return Users;
      case 'review': return MessageSquare;
      case 'message': return MessageSquare;
      default: return Bell;
    }
  };

  const getTypeColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-600';
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'stock': return 'bg-orange-100 text-orange-600';
      case 'user': return 'bg-green-100 text-green-600';
      case 'review': return 'bg-purple-100 text-purple-600';
      case 'message': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <CheckCheck className="w-5 h-5" />
            Mark all read
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`border-b last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type, notification.priority)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                            {notification.priority === 'high' && (
                              <span className="ml-2 inline-flex items-center text-red-500">
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                          <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Mark as read"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={clearAll}
            className="text-gray-500 hover:text-red-600 text-sm font-medium"
          >
            Clear all notifications
          </button>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'orders', label: 'Order notifications', icon: ShoppingCart },
                      { key: 'stock', label: 'Stock alerts', icon: Package },
                      { key: 'users', label: 'New user registrations', icon: Users },
                      { key: 'reviews', label: 'Product reviews', icon: MessageSquare },
                      { key: 'messages', label: 'Contact messages', icon: MessageSquare },
                      { key: 'system', label: 'System updates', icon: Settings }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">{item.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key]}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked
                          })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Methods</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Email notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.email}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: e.target.checked
                        })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Push notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.push}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          push: e.target.checked
                        })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

