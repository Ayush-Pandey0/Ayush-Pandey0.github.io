import { useState, useEffect } from 'react';
import { Settings, Save, Store, User, Bell, Lock, Palette, Globe, Mail, CreditCard, Truck, Shield, Check, X, Upload, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function SettingsManager() {
  const [activeTab, setActiveTab] = useState('store');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Atlas Arrow',
    tagline: 'Biometric, GPS & Technology Solutions',
    email: 'contact@atlasarrow.com',
    phone: '+91 98765 43210',
    address: 'Golghar, Gorakhpur, Uttar Pradesh 273001',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en'
  });

  const [adminSettings, setAdminSettings] = useState({
    name: 'Admin',
    email: 'admin@atlasarrow.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    stockAlerts: true,
    userRegistrations: true,
    productReviews: true,
    contactMessages: true,
    dailyReport: true,
    weeklyReport: false
  });

  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_test_xxxxx',
    razorpayKeySecret: '**********',
    codEnabled: true,
    bankTransferEnabled: true,
    bankName: 'State Bank of India',
    accountNumber: '********1234',
    ifscCode: 'SBIN0001234'
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 5000,
    standardShipping: 100,
    expressShipping: 250,
    localDelivery: true,
    nationalDelivery: true,
    internationalDelivery: false
  });

  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'admin', label: 'Admin Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  // Handle password change
  const handlePasswordChange = async () => {
    if (!adminSettings.currentPassword || !adminSettings.newPassword || !adminSettings.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (adminSettings.newPassword !== adminSettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (adminSettings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.put('/profile/password', {
        currentPassword: adminSettings.currentPassword,
        newPassword: adminSettings.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!');
      setAdminSettings({ ...adminSettings, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Save notification settings to backend
      await api.put('/admin/settings', {
        storeSettings,
        notificationSettings,
        paymentSettings,
        shippingSettings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Also save to localStorage for persistence
      localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
      localStorage.setItem('shippingSettings', JSON.stringify(shippingSettings));
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      // Save to localStorage even if API fails
      localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
      localStorage.setItem('shippingSettings', JSON.stringify(shippingSettings));
      toast.success('Settings saved locally!');
    } finally {
      setSaving(false);
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedStore = localStorage.getItem('storeSettings');
    const savedNotif = localStorage.getItem('notificationSettings');
    const savedPayment = localStorage.getItem('paymentSettings');
    const savedShipping = localStorage.getItem('shippingSettings');
    
    if (savedStore) setStoreSettings(JSON.parse(savedStore));
    if (savedNotif) setNotificationSettings(JSON.parse(savedNotif));
    if (savedPayment) setPaymentSettings(JSON.parse(savedPayment));
    if (savedShipping) setShippingSettings(JSON.parse(savedShipping));
  }, []);

  const renderStoreSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            value={storeSettings.storeName}
            onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
          <input
            type="text"
            value={storeSettings.tagline}
            onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={storeSettings.email}
            onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={storeSettings.phone}
            onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={storeSettings.address}
            onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={storeSettings.currency}
            onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={storeSettings.timezone}
            onChange={(e) => setStoreSettings({ ...storeSettings, timezone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            AA
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
            <Upload className="w-5 h-5" />
            Upload New Logo
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdminSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-6 pb-6 border-b">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          A
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Administrator</h3>
          <p className="text-gray-500">admin@atlasarrow.com</p>
          <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
            Change Photo
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={adminSettings.name}
            onChange={(e) => setAdminSettings({ ...adminSettings, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={adminSettings.email}
            onChange={(e) => setAdminSettings({ ...adminSettings, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminSettings.currentPassword}
                onChange={(e) => setAdminSettings({ ...adminSettings, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={adminSettings.newPassword}
              onChange={(e) => setAdminSettings({ ...adminSettings, newPassword: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={adminSettings.confirmPassword}
              onChange={(e) => setAdminSettings({ ...adminSettings, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={saving || !adminSettings.currentPassword || !adminSettings.newPassword}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
        <div className="space-y-4">
          {[
            { key: 'orderNotifications', label: 'New order notifications', description: 'Receive an email when a new order is placed' },
            { key: 'stockAlerts', label: 'Low stock alerts', description: 'Get notified when products are running low' },
            { key: 'userRegistrations', label: 'New user registrations', description: 'Email when a new customer registers' },
            { key: 'productReviews', label: 'Product reviews', description: 'Notifications for new product reviews' },
            { key: 'contactMessages', label: 'Contact form messages', description: 'Receive contact form submissions' }
          ].map((item) => (
            <label key={item.key} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings[item.key]}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  [item.key]: e.target.checked
                })}
                className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-4">Report Notifications</h4>
        <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.dailyReport}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                dailyReport: e.target.checked
              })}
              className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Daily sales report</p>
              <p className="text-sm text-gray-500">Receive a summary of daily sales at 9:00 AM</p>
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.weeklyReport}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                weeklyReport: e.target.checked
              })}
              className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Weekly analytics report</p>
              <p className="text-sm text-gray-500">Get a detailed weekly report every Monday</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> Payment gateway credentials are sensitive. Make sure to keep them secure.
        </p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Razorpay</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentSettings.razorpayEnabled}
              onChange={(e) => setPaymentSettings({
                ...paymentSettings,
                razorpayEnabled: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Enable Razorpay</p>
              <p className="text-sm text-gray-500">Accept credit/debit cards, UPI, and more</p>
            </div>
          </label>
          {paymentSettings.razorpayEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key ID</label>
                <input
                  type="text"
                  value={paymentSettings.razorpayKeyId}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayKeyId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Secret</label>
                <input
                  type="password"
                  value={paymentSettings.razorpayKeySecret}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayKeySecret: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Other Payment Methods</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentSettings.codEnabled}
              onChange={(e) => setPaymentSettings({
                ...paymentSettings,
                codEnabled: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Cash on Delivery (COD)</p>
              <p className="text-sm text-gray-500">Allow customers to pay on delivery</p>
            </div>
          </label>
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentSettings.bankTransferEnabled}
              onChange={(e) => setPaymentSettings({
                ...paymentSettings,
                bankTransferEnabled: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Bank Transfer</p>
              <p className="text-sm text-gray-500">Accept direct bank transfers</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Shipping Rates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Above (₹)</label>
            <input
              type="number"
              value={shippingSettings.freeShippingThreshold}
              onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping (₹)</label>
            <input
              type="number"
              value={shippingSettings.standardShipping}
              onChange={(e) => setShippingSettings({ ...shippingSettings, standardShipping: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Express Shipping (₹)</label>
            <input
              type="number"
              value={shippingSettings.expressShipping}
              onChange={(e) => setShippingSettings({ ...shippingSettings, expressShipping: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Delivery Zones</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={shippingSettings.localDelivery}
              onChange={(e) => setShippingSettings({
                ...shippingSettings,
                localDelivery: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Local Delivery</p>
              <p className="text-sm text-gray-500">Delivery within Gorakhpur (1-2 days)</p>
            </div>
          </label>
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={shippingSettings.nationalDelivery}
              onChange={(e) => setShippingSettings({
                ...shippingSettings,
                nationalDelivery: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">National Delivery</p>
              <p className="text-sm text-gray-500">Delivery anywhere in India (3-7 days)</p>
            </div>
          </label>
          <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={shippingSettings.internationalDelivery}
              onChange={(e) => setShippingSettings({
                ...shippingSettings,
                internationalDelivery: e.target.checked
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">International Delivery</p>
              <p className="text-sm text-gray-500">Worldwide shipping available</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800">Your account is secure</p>
          <p className="text-sm text-green-700">All security features are enabled</p>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Security Options</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Login Notifications</p>
              <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Configure
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">Manage devices where you're logged in</p>
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              View All
            </button>
          </div>
        </div>
      </div>
      <div className="pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-4">Recent Login Activity</h4>
        <div className="space-y-3">
          {[
            { device: 'Chrome on Windows', location: 'Gorakhpur, India', time: 'Current session' },
            { device: 'Firefox on Android', location: 'Gorakhpur, India', time: '2 hours ago' },
            { device: 'Safari on iPhone', location: 'Lucknow, India', time: '1 day ago' }
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{session.device}</p>
                <p className="text-sm text-gray-500">{session.location}</p>
              </div>
              <span className={`text-sm ${index === 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {session.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'store': return renderStoreSettings();
      case 'admin': return renderAdminSettings();
      case 'notifications': return renderNotificationSettings();
      case 'payments': return renderPaymentSettings();
      case 'shipping': return renderShippingSettings();
      case 'security': return renderSecuritySettings();
      default: return renderStoreSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white rounded-xl shadow-sm border p-6"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}

