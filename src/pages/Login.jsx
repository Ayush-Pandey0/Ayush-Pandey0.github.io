import { useState } from 'react';
import { Mail, Lock, ShoppingBag, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/api';
import { useGoogleLogin } from '@react-oauth/google';
import { ADMIN_CREDENTIALS } from '../utils/adminAuth';

// Validation rules
const validators = {
  email: {
    validate: (value) => {
      if (!value.trim()) return 'Email is required';
      if (value === 'admin') return '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address';
      return '';
    }
  },
  password: {
    validate: (value) => {
      if (!value) return 'Password is required';
      return '';
    }
  }
};

export default function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  // Forgot Password States
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value) => {
    return validators[name]?.validate(value) || '';
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    
    // Check for admin credentials first
    if (formData.email === ADMIN_CREDENTIALS.username && formData.password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify({
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
        loginTime: new Date().toISOString()
      }));
      setUserName('Admin');
      setSuccess(true);
      setTimeout(() => {
        toast.success('Welcome to Admin Panel!');
        navigate('/admin-panel');
      }, 2000);
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUserName(user.fullname);
      setSuccess(true);
      setTimeout(() => {
        setIsAuthenticated(true);
        navigate('/');
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      const isGoogleUser = error.response?.data?.isGoogleUser;
      
      if (isGoogleUser) {
        // Show special message for Google users
        toast.error('This account uses Google Sign-In. Use "Continue with Google" or "Forgot Password" to set a password.');
        setErrors(prev => ({ ...prev, password: 'Account uses Google Sign-In' }));
      } else if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('user not found')) {
        setErrors(prev => ({ ...prev, email: 'No account found with this email' }));
      } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('invalid')) {
        setErrors(prev => ({ ...prev, password: 'Incorrect password' }));
      } else {
        toast.error(errorMsg);
      }
      setLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(response.data.message);
      setForgotStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email: forgotEmail, otp });
      setResetToken(response.data.resetToken);
      toast.success('OTP verified! Set your new password');
      setForgotStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        email: forgotEmail, 
        resetToken, 
        newPassword 
      });
      toast.success('Password reset successful! Please login');
      // Reset all states and go back to login
      setForgotPasswordMode(false);
      setForgotStep(1);
      setForgotEmail('');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordMode(false);
    setForgotStep(1);
    setForgotEmail('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Google Sign-In
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const response = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token
        });
        const { token, user } = response.data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        setUserName(user.fullname);
        setSuccess(true);
        setTimeout(() => {
          setIsAuthenticated(true);
          toast.success('Signed in with Google!');
          navigate('/');
        }, 2000);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Google sign-in failed');
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    }
  });

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    googleLogin();
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome back!</h1>
          <p className="text-gray-600 mb-2">{userName}</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Forgot Password Flow
  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={resetForgotPassword}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  forgotStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-1 ${forgotStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Enter Email */}
          {forgotStep === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
                <p className="text-gray-500 text-sm mt-2">Enter your email to receive an OTP</p>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50"
              >
                {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {forgotStep === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <KeyRound className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Enter OTP</h2>
                <p className="text-gray-500 text-sm mt-2">We sent a 6-digit code to your email</p>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50"
              >
                {forgotLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
              >
                Didn't receive? Go back and try again
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {forgotStep === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
                <p className="text-gray-500 text-sm mt-2">Create a strong password for your account</p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50"
              >
                {forgotLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding with Wave Animation (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-blue-600 via-blue-700 to-sky-600 relative overflow-hidden">
        {/* Animated Waves */}
        <div className="absolute inset-0">
          <svg className="absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z;M0,160L48,154.7C96,149,192,139,288,149.3C384,160,480,192,576,197.3C672,203,768,181,864,154.7C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L0,320Z;M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z"/>
            </path>
          </svg>
          <svg className="absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.15)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L0,320Z">
              <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L0,320Z;M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,202.7C672,224,768,256,864,261.3C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z;M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L0,320Z"/>
            </path>
          </svg>
          <svg className="absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.2)" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z">
              <animate attributeName="d" dur="14s" repeatCount="indefinite" values="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z;M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,186.7C672,192,768,224,864,234.7C960,245,1056,235,1152,218.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z;M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z"/>
            </path>
          </svg>
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Atlas & Arrow</h1>
          <p className="text-xl text-white/80 text-center max-w-md">Welcome back! Sign in to continue shopping</p>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full mb-3">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600">
              Atlas & Arrow
            </h1>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Sign in to your account</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                  <Mail className="w-4 h-4 mr-1.5 text-blue-600" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 text-sm border rounded-lg transition ${
                      touched.email && errors.email ? 'border-red-400' : 
                      touched.email && !errors.email && formData.email ? 'border-green-400' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {touched.email && (errors.email || formData.email) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {errors.email ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center">
                    <Lock className="w-4 h-4 mr-1.5 text-blue-600" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(true);
                      setForgotEmail(formData.email);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 text-sm border rounded-lg transition ${
                      touched.password && errors.password ? 'border-red-400' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or continue with</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting to Google...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="text-center mt-6 text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

