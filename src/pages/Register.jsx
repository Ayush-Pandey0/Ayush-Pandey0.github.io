import { useState } from 'react';
import { User, Mail, Lock, Phone, ShoppingBag, PartyPopper, Eye, EyeOff, Check, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/api';
import { useGoogleLogin } from '@react-oauth/google';

// Validation rules
const validators = {
  fullname: {
    validate: (value) => {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 3) return 'Name must be at least 3 characters';
      if (value.trim().length > 50) return 'Name must be less than 50 characters';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
      return '';
    }
  },
  email: {
    validate: (value) => {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address';
      return '';
    }
  },
  phone: {
    validate: (value) => {
      if (!value.trim()) return 'Phone number is required';
      const cleaned = value.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{10,12}$/.test(cleaned)) return 'Enter a valid 10-digit phone number';
      return '';
    }
  },
  password: {
    validate: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Must contain uppercase letter';
      if (!/[a-z]/.test(value)) return 'Must contain lowercase letter';
      if (!/[0-9]/.test(value)) return 'Must contain a number';
      return '';
    }
  },
  confirmPassword: {
    validate: (value, formData) => {
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) return 'Passwords do not match';
      return '';
    }
  },
  street: { validate: (value) => value && value.trim().length < 5 ? 'Enter a valid street address' : '' },
  city: { validate: () => '' },
  state: { validate: () => '' },
  pincode: { validate: (value) => value && !/^\d{6}$/.test(value.trim()) ? 'Enter a valid 6-digit PIN code' : '' }
};

// Password requirements component
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { met: password.length >= 8, text: '8+ chars' },
    { met: /[A-Z]/.test(password), text: 'Uppercase' },
    { met: /[a-z]/.test(password), text: 'Lowercase' },
    { met: /[0-9]/.test(password), text: 'Number' },
  ];

  return (
    <div className="flex gap-2 mt-1 flex-wrap">
      {requirements.map((req, idx) => (
        <span key={idx} className={`text-xs flex items-center ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
          {req.met ? <Check className="w-3 h-3 mr-0.5" /> : <X className="w-3 h-3 mr-0.5" />}
          {req.text}
        </span>
      ))}
    </div>
  );
};

export default function Register({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '', email: '', phone: '', password: '', confirmPassword: '',
    street: '', city: '', state: '', pincode: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validators[name]?.validate(value, formData);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validators[name]?.validate(formData[name], formData);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    const requiredFields = ['fullname', 'email', 'phone', 'password', 'confirmPassword'];
    const allFields = [...requiredFields, 'street', 'city', 'state', 'pincode'];
    
    allFields.forEach(field => {
      const error = validators[field]?.validate(formData[field], formData);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    setTouched(Object.fromEntries(requiredFields.map(f => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        fullname: formData.fullname.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: 'India'
        }
      });

      setUserName(response.data.user?.fullname || formData.fullname);
      setSuccess(true);
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign Up
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const response = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token
        });

        if (response.data.token) {
          sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
          setUserName(response.data.user.fullname);
          setSuccess(true);
          toast.success('Welcome to Atlas & Arrow!');
          setTimeout(() => {
            setIsAuthenticated(true);
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Google sign-up failed');
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error('Google sign-up was cancelled or failed.');
      setGoogleLoading(false);
    }
  });

  const handleGoogleSignUp = () => {
    setGoogleLoading(true);
    googleLogin();
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Created! 🎉</h1>
          <p className="text-gray-600 mb-2">Welcome, {userName}!</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
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
          <p className="text-xl text-white/80 text-center max-w-md">Create an account to start shopping</p>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-4 py-6 sm:px-8 lg:px-12">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full mb-2">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600">
              Atlas & Arrow
            </h1>
          </div>
          
          <div className="w-full max-w-xl mx-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create your account</h2>
              <p className="text-gray-500 text-sm">Fill in the details below to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name, Email, Phone - Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name - Full width */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <User className="w-3 h-3 mr-1 text-blue-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => handleChange('fullname', e.target.value)}
                    onBlur={() => handleBlur('fullname')}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
                      touched.fullname && errors.fullname ? 'border-red-400' : 
                      touched.fullname && !errors.fullname && formData.fullname ? 'border-green-400' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {touched.fullname && errors.fullname && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.fullname}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <Mail className="w-3 h-3 mr-1 text-blue-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
                      touched.email && errors.email ? 'border-red-400' : 
                      touched.email && !errors.email && formData.email ? 'border-green-400' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-blue-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
                      touched.phone && errors.phone ? 'border-red-400' : 
                      touched.phone && !errors.phone && formData.phone ? 'border-green-400' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Password Fields - Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-blue-600" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg transition ${
                        touched.password && errors.password ? 'border-red-400' : 
                        touched.password && !errors.password && formData.password ? 'border-green-400' : 'border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.password && <PasswordRequirements password={formData.password} />}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-blue-600" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg transition ${
                        touched.confirmPassword && errors.confirmPassword ? 'border-red-400' : 
                        touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword ? 'border-green-400' : 'border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-blue-600" />
                  Shipping Address (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Street - Full width */}
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="Street Address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="State"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      placeholder="PIN Code"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-xs text-gray-500">or sign up with</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign-Up Button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting to Google...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="text-center mt-4 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

