import React, { useState, useEffect } from 'react';
import api from '../config/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Calendar, Shield, Camera, Edit3, Save, X, Package, Heart, Clock, Star, ShoppingBag, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://atlas-arrow-backend.onrender.com';

export default function Profile({ setIsAuthenticated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [newAvatar, setNewAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, reviews: 0 });
  const navigate = useNavigate();

  useEffect(() => { 
    fetchProfile(); 
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const ordersRes = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        orders: ordersRes.data?.length || 0,
        wishlist: 0,
        reviews: 0
      });
    } catch (err) {
      console.log('Stats fetch error:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      
      if (token && token.startsWith('google_') && storedUser) {
        const googleUser = JSON.parse(storedUser);
        setProfile({
          fullname: googleUser.fullname || googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar || googleUser.picture,
          phone: googleUser.phone || '',
          provider: 'google',
          createdAt: new Date().toISOString(),
          address: googleUser.address || {}
        });
        setLoading(false);
        return;
      }
      
      if (!token) {
        setError('Please log in to view your profile.');
        setLoading(false);
        return;
      }

      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setProfile({
            fullname: userData.fullname || userData.name || 'User',
            email: userData.email || '',
            avatar: userData.avatar || userData.picture || '',
            phone: userData.phone || '',
            createdAt: userData.createdAt || new Date().toISOString(),
            address: userData.address || {}
          });
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
        }
      }
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Could not load profile. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getAvatarUrl = () => {
    if (previewAvatar) return previewAvatar;
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith('http')) return profile.avatar;
    if (profile.avatar.startsWith('/uploads')) return `${API_BASE}${profile.avatar}`;
    return `${API_BASE}/uploads/avatars/${profile.avatar}`;
  };

  const handleUpdate = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to update profile');
        return;
      }

      const updatePayload = { ...updatedProfile };
      
      if (updatedProfile.address) {
        updatePayload.address = {
          street: updatedProfile.address.street || profile.address?.street || '',
          city: updatedProfile.address.city || profile.address?.city || '',
          state: updatedProfile.address.state || profile.address?.state || '',
          pincode: updatedProfile.address.pincode || profile.address?.pincode || '',
          country: updatedProfile.address.country || profile.address?.country || 'India'
        };
      }

      if (Object.keys(updatePayload).length > 0) {
        await api.put('/profile', updatePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (newAvatar) {
        const formData = new FormData();
        formData.append('avatar', newAvatar);
        await api.post('/profile/avatar', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success('Profile updated successfully!');
      setEditing(false);
      setUpdatedProfile({});
      setNewAvatar(null);
      setPreviewAvatar(null);
      fetchProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Could not update profile');
    }
  };

  const formatAddress = () => {
    if (!profile?.address) return null;
    const { street, city, state, pincode, country } = profile.address;
    const parts = [street, city, state, pincode, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Gradient Header */}
                <div className="h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white"></div>
                </div>
                
                {/* Avatar Section */}
                <div className="relative px-6 pb-6 -mt-12">
                  <div className="relative inline-block">
                    <div className="w-28 h-28 rounded-2xl bg-white p-1 shadow-xl">
                      {getAvatarUrl() ? (
                        <img 
                          src={getAvatarUrl()} 
                          alt="Profile" 
                          className="w-full h-full rounded-xl object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullname || 'User')}&background=3b82f6&color=fff&size=200`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {profile.fullname?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    {editing && (
                      <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-lg border-2 border-white">
                        <Camera className="w-4 h-4 text-white" />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Name & Email */}
                  <div className="mt-4">
                    <h1 className="text-xl font-bold text-gray-900">{profile.fullname}</h1>
                    <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        profile.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {profile.role === 'admin' ? '👑 Admin' : '👤 Customer'}
                      </span>
                      {profile.provider === 'google' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Google
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="mt-6">
                    {!editing ? (
                      <button 
                        onClick={() => setEditing(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleUpdate}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button 
                          onClick={() => { setEditing(false); setUpdatedProfile({}); setNewAvatar(null); setPreviewAvatar(null); }}
                          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition" onClick={() => navigate('/orders')}>
                      <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>
                    <div className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition">
                      <p className="text-2xl font-bold text-gray-900">{stats.wishlist}</p>
                      <p className="text-xs text-gray-500">Wishlist</p>
                    </div>
                    <div className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition">
                      <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-lg mt-6 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Quick Links</h3>
                </div>
                <div>
                  {[
                    { icon: ShoppingBag, label: 'My Orders', path: '/orders', color: 'text-blue-600 bg-blue-100' },
                    { icon: Bell, label: 'Notifications', path: '/notifications', color: 'text-orange-600 bg-orange-100' },
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Personal Information
                  </h2>
                </div>

                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={updatedProfile.fullname ?? profile.fullname ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, fullname: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={updatedProfile.email ?? profile.email ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={updatedProfile.phone ?? profile.phone ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="Enter your phone"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: User, label: 'Full Name', value: profile.fullname, color: 'bg-blue-100 text-blue-600' },
                      { icon: Mail, label: 'Email Address', value: profile.email, color: 'bg-green-100 text-green-600' },
                      { icon: Phone, label: 'Phone Number', value: profile.phone || 'Not provided', color: 'bg-purple-100 text-purple-600' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className="font-semibold text-gray-900">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Address Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" /> Address Details
                  </h2>
                </div>

                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={updatedProfile.address?.street ?? profile.address?.street ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, address: { ...(updatedProfile.address || profile.address || {}), street: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="House No., Street, Area"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={updatedProfile.address?.city ?? profile.address?.city ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, address: { ...(updatedProfile.address || profile.address || {}), city: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={updatedProfile.address?.state ?? profile.address?.state ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, address: { ...(updatedProfile.address || profile.address || {}), state: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={updatedProfile.address?.pincode ?? profile.address?.pincode ?? ''}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, address: { ...(updatedProfile.address || profile.address || {}), pincode: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="Pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={updatedProfile.address?.country ?? profile.address?.country ?? 'India'}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, address: { ...(updatedProfile.address || profile.address || {}), country: e.target.value } })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                      <p className="font-medium text-gray-900">
                        {formatAddress() || (
                          <span className="text-gray-400 italic">No address provided. Click Edit Profile to add your address.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" /> Account Security
                  </h2>
                </div>
                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                      <Shield className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">Password Protected</p>
                      <p className="text-sm text-gray-500">Your account is secured with a password</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/change-password')}
                    className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-md hover:shadow-lg"
                  >
                    Change Password
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

