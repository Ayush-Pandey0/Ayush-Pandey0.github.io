import { useState } from 'react';
import { Mail, Lock, ShoppingBag, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('user not found')) {
        setErrors(prev => ({ ...prev, email: 'No account found with this email' }));
      } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('invalid')) {
        setErrors(prev => ({ ...prev, password: 'Incorrect password' }));
      } else {
        toast.error(errorMsg);
      }
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-sky-600 relative">
        <div className="absolute inset-0 bg-black/10"></div>
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
                <label className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-blue-600" />
                  Password
                </label>
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

