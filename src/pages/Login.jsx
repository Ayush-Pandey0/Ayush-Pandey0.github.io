import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      // Allow 'admin' for admin login
      if (value === 'admin') return '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address (e.g., name@example.com)';
      return '';
    },
    hint: 'Enter your registered email address'
  },
  password: {
    validate: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 1) return 'Please enter your password';
      return '';
    },
    hint: 'Enter your password'
  }
};

const WavyBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-blue-50 to-sky-100">
      {/* Animated waves */}
      <div className="absolute inset-0">
        <svg
          className="absolute bottom-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(56, 189, 248, 0.3)"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,160L48,154.7C96,149,192,139,288,149.3C384,160,480,192,576,197.3C672,203,768,181,864,154.7C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>

        <svg
          className="absolute bottom-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(14, 165, 233, 0.25)"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,202.7C672,224,768,256,864,261.3C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>

        <svg
          className="absolute bottom-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(2, 132, 199, 0.2)"
            fillOpacity="1"
            d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="14s"
              repeatCount="indefinite"
              values="
                M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,186.7C672,192,768,224,864,234.7C960,245,1056,235,1152,218.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>
      </div>
    </div>
  );
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

  // Validate single field
  const validateField = (name, value) => {
    const validator = validators[name];
    if (validator) {
      return validator.validate(value);
    }
    return '';
  };

  // Handle field change with real-time validation
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing, but validate immediately for admin case
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Special handling for admin username
    if (name === 'email' && value === 'admin') {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Handle blur - mark field as touched and validate
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Validate all fields
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
    
    // Validate all fields
    if (!validateAll()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    
    // Check for admin credentials first
    if (formData.email === ADMIN_CREDENTIALS.username && formData.password === ADMIN_CREDENTIALS.password) {
      // Admin login
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify({
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
        loginTime: new Date().toISOString()
      }));
      
      setUserName('Admin');
      setSuccess(true);
      
      // Show success animation then navigate to admin panel
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
      
      // Show success animation then navigate
      setTimeout(() => {
        setIsAuthenticated(true);
        navigate('/');
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      
      // Set specific field errors based on response
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

  // Google Sign-In using the native Google account picker
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        // Send access token to backend for verification and user creation
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
        console.error('Google sign-in error:', error);
        const errorMsg = error.response?.data?.message || 'Google sign-in failed. Please try again.';
        toast.error(errorMsg);
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      toast.error('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    }
  });

  // Wrapper function to trigger Google login
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    googleLogin();
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <WavyBackground />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 shadow-lg"
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-gray-800 mb-2"
          >
            Welcome back!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-600 mb-4"
          >
            {userName}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 text-gray-500"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Redirecting to home...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WavyBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-sky-600 rounded-full mb-4 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600 mb-2">
              Atlas & Arrow
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="email"
                  name="email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg transition duration-200 ${
                    touched.email && errors.email 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
                      : touched.email && !errors.email && formData.email
                        ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="you@example.com"
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
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </motion.p>
              )}
              {!errors.email && !formData.email && (
                <p className="mt-1 text-xs text-gray-400">{validators.email.hint}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full px-4 py-3 pr-20 border rounded-lg transition duration-200 ${
                    touched.password && errors.password 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="••••••••"
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
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex items-center my-6"
          >
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </motion.div>

          {/* Google Sign-In Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting to Google...
              </span>
            ) : (
              <>
                {/* Google Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-center mt-6 text-gray-600"
          >
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Create Account
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

// ===============================================

