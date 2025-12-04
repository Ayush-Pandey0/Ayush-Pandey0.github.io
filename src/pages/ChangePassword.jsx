import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../config/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft, Shield, CheckCircle } from 'lucide-react';

export default function ChangePassword({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      toast.error('Password does not meet requirements');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.put('/profile/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      toast.success('Password changed successfully!');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Changed!</h2>
            <p className="text-gray-500 mb-6">Your password has been updated successfully.</p>
            <p className="text-sm text-gray-400">Redirecting to profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Change Password</h1>
                <p className="text-green-100 text-sm">Update your account security</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Password Requirements:</p>
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'One uppercase letter' },
                    { key: 'lowercase', label: 'One lowercase letter' },
                    { key: 'number', label: 'One number' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordChecks[key] ? 'bg-green-100' : 'bg-gray-200'}`}>
                        {passwordChecks[key] && <CheckCircle className="w-3 h-3 text-green-600" />}
                      </div>
                      <span className={`text-xs ${passwordChecks[key] ? 'text-green-600' : 'text-gray-500'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition ${
                    formData.confirmPassword && formData.confirmPassword !== formData.newPassword 
                      ? 'border-red-300 bg-red-50' 
                      : formData.confirmPassword && formData.confirmPassword === formData.newPassword
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.newPassword && (
                <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !Object.values(passwordChecks).every(Boolean) || formData.newPassword !== formData.confirmPassword}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
