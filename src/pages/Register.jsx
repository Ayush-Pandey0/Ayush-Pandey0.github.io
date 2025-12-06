import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ShoppingBag, CheckCircle, PartyPopper, AlertCircle, Eye, EyeOff, Check, X, MapPin, Home, Building } from 'lucide-react';
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
    },
    hint: 'Enter your full name (3-50 characters, letters only)'
  },
  email: {
    validate: (value) => {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address (e.g., name@example.com)';
      return '';
    },
    hint: 'Enter a valid email address'
  },
  phone: {
    validate: (value) => {
      if (!value.trim()) return 'Phone number is required';
      const cleaned = value.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{10,12}$/.test(cleaned)) return 'Enter a valid 10-digit phone number';
      return '';
    },
    hint: 'Enter 10-digit phone number'
  },
  password: {
    validate: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (value.length > 50) return 'Password must be less than 50 characters';
      if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
      return '';
    },
    hint: 'Min 8 characters with uppercase, lowercase & number'
  },
  confirmPassword: {
    validate: (value, formData) => {
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) return 'Passwords do not match';
      return '';
    },
    hint: 'Re-enter your password'
  },
  street: {
    validate: (value) => {
      if (!value.trim()) return 'Street address is required';
      if (value.trim().length < 5) return 'Please enter a valid street address';
      return '';
    },
    hint: 'Enter your street address'
  },
  city: {
    validate: (value) => {
      if (!value.trim()) return 'City is required';
      return '';
    },
    hint: 'Enter your city'
  },
  state: {
    validate: (value) => {
      if (!value.trim()) return 'State is required';
      return '';
    },
    hint: 'Enter your state'
  },
  pincode: {
    validate: (value) => {
      if (!value.trim()) return 'PIN code is required';
      if (!/^\d{6}$/.test(value.trim())) return 'Enter a valid 6-digit PIN code';
      return '';
    },
    hint: 'Enter 6-digit PIN code'
  }
};

// Password strength checker
const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  if (strength <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
  if (strength <= 4) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
  return { level: 'strong', color: 'bg-green-500', text: 'Strong' };
};

// Password requirements component
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, idx) => (
        <div key={idx} className={`flex items-center text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
          {req.met ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
          {req.text}
        </div>
      ))}
    </div>
  );
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

export default function Register({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  // Validate single field
  const validateField = (name, value) => {
    const validator = validators[name];
    if (validator) {
      return validator.validate(value, formData);
    }
    return '';
  };

  // Handle field change with real-time validation
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    // Special case: re-validate confirmPassword when password changes
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validators.confirmPassword.validate(formData.confirmPassword, { ...formData, password: value });
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
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
    setTouched({ fullname: true, email: true, phone: true, password: true, confirmPassword: true, street: true, city: true, state: true, pincode: true });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAll()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, street, city, state, pincode, ...basicData } = formData;
      const dataToSend = {
        ...basicData,
        address: { street, city, state, pincode, country: 'India' }
      };
      const response = await api.post('/auth/register', dataToSend);
      const { token, user } = response.data;
      
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUserName(user.fullname);
      setSuccess(true);
      
      // Show success animation then navigate
      setTimeout(() => {
        setIsAuthenticated(true);
        navigate('/');
      }, 2500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
      
      // Set specific field error if it's about email
      if (errorMsg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMsg }));
      }
      setLoading(false);
    }
  };

  // Google Sign-Up using the native Google account picker
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
          toast.success('Signed up with Google!');
          navigate('/');
        }, 2500);
        
      } catch (error) {
        console.error('Google sign-up error:', error);
        const errorMsg = error.response?.data?.message || 'Google sign-up failed. Please try again.';
        toast.error(errorMsg);
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      toast.error('Google sign-up was cancelled or failed.');
      setGoogleLoading(false);
    }
  });

  // Wrapper function to trigger Google login
  const handleGoogleSignUp = () => {
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg"
          >
            <PartyPopper className="w-14 h-14 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-gray-800 mb-2"
          >
            Account Created! 🎉
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-600 mb-2"
          >
            Welcome, {userName}!
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-500 mb-6"
          >
            Your account has been successfully created
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-gray-500"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Taking you to the store...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const fields = [
    { name: 'fullname', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe', autocomplete: 'name' },
    { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'you@example.com', autocomplete: 'email' },
    { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '9876543210', autocomplete: 'tel' },
    { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: '••••••••', autocomplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: '••••••••', autocomplete: 'new-password' }
  ];

  const addressFields = [
    { name: 'street', label: 'Street Address', type: 'text', icon: Home, placeholder: '123 Main Street, Apartment 4B', autocomplete: 'street-address' },
    { name: 'city', label: 'City', type: 'text', icon: Building, placeholder: 'Mumbai', autocomplete: 'address-level2' },
    { name: 'state', label: 'State', type: 'text', icon: MapPin, placeholder: 'Maharashtra', autocomplete: 'address-level1' },
    { name: 'pincode', label: 'PIN Code', type: 'text', icon: MapPin, placeholder: '400001', autocomplete: 'postal-code' }
  ];

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
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
            <p className="text-gray-600">Create your account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field, index) => {
              const hasError = touched[field.name] && errors[field.name];
              const isValid = touched[field.name] && !errors[field.name] && formData[field.name];
              const isPasswordField = field.name === 'password' || field.name === 'confirmPassword';
              const showPasswordToggle = field.name === 'password' ? showPassword : showConfirmPassword;
              const setShowPasswordToggle = field.name === 'password' ? setShowPassword : setShowConfirmPassword;

              return (
                <motion.div
                  key={field.name}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 2) }}
                >
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <field.icon className="w-4 h-4 mr-2 text-blue-600" />
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={isPasswordField && showPasswordToggle ? 'text' : field.type}
                      id={field.name}
                      name={field.name}
                      autoComplete={field.autocomplete}
                      value={formData[field.name]}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      className={`w-full px-4 py-2.5 pr-10 border rounded-lg transition duration-200 ${
                        hasError 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
                          : isValid
                            ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder={field.placeholder}
                    />
                    {/* Show/Hide password toggle */}
                    {isPasswordField && (
                      <button
                        type="button"
                        onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordToggle ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    )}
                    {/* Validation icon */}
                    {!isPasswordField && (isValid || hasError) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isValid ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Error message */}
                  {hasError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors[field.name]}
                    </motion.p>
                  )}
                  
                  {/* Password strength indicator */}
                  {field.name === 'password' && formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%' }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.level === 'weak' ? 'text-red-600' : 
                          passwordStrength.level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <PasswordRequirements password={formData.password} />
                    </div>
                  )}
                  
                  {/* Hint text */}
                  {!hasError && !formData[field.name] && validators[field.name]?.hint && (
                    <p className="mt-1 text-xs text-gray-400">{validators[field.name].hint}</p>
                  )}
                </motion.div>
              );
            })}

            {/* Address Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Shipping Address (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addressFields.map((field, index) => {
                  const Icon = field.icon;
                  const hasError = errors[field.name] && touched[field.name];
                  const isValid = formData[field.name] && !errors[field.name] && touched[field.name];
                  
                  return (
                    <motion.div
                      key={field.name}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.65 + index * 0.05 }}
                      className={field.name === 'street' ? 'md:col-span-2' : ''}
                    >
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        {field.label}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Icon className={`h-5 w-5 transition-colors duration-200 ${
                            hasError ? 'text-red-400' : isValid ? 'text-green-500' : 'text-gray-400'
                          }`} />
                        </div>
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder={field.placeholder}
                          autoComplete={field.autocomplete}
                          className={`w-full pl-10 pr-4 py-2.5 bg-white border-2 rounded-lg transition-all duration-200 ${
                            hasError
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                              : isValid
                              ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                          } focus:ring-2 focus:outline-none`}
                        />
                        {isValid && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      {hasError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-red-500"
                        >
                          {errors[field.name]}
                        </motion.p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex items-center my-6"
          >
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or sign up with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </motion.div>

          {/* Google Sign-Up Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignUp}
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
            transition={{ delay: 0.95 }}
            className="text-center mt-6 text-gray-600"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Sign In
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

