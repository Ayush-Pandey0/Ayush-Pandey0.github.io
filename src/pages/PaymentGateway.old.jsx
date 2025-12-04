import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, Lock, CheckCircle, X, QrCode, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../config/api';

export default function PaymentGateway({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    upiId: '',
    bankName: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Redirect if no order data
  useEffect(() => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      toast.error('No order data found. Please go through checkout.');
      navigate('/cart');
    }
  }, [orderData, navigate]);

  const handlePayment = async () => {
    if (!orderData) {
      toast.error('No order data. Please go through checkout.');
      navigate('/cart');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiry || !cardDetails.cvv) {
        toast.error('Please fill all card details');
        return;
      }
      if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Invalid card number');
        return;
      }
      if (cardDetails.cvv.length < 3) {
        toast.error('Invalid CVV');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!cardDetails.upiId || !cardDetails.upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g., name@upi)');
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!cardDetails.bankName) {
        toast.error('Please select a bank');
        return;
      }
    }
    // QR payment doesn't need additional validation - user confirms after scanning

    setProcessing(true);
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Simulate payment processing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order with all details including coupon
      const orderPayload = {
        items: orderData.items || [],
        shippingAddress: orderData.shippingAddress || {},
        paymentMethod: paymentMethod.toUpperCase(),
        couponCode: orderData.couponCode || null,
        couponDiscount: orderData.couponDiscount || 0,
        notes: `Payment via ${paymentMethod}${orderData.couponCode ? ` | Coupon: ${orderData.couponCode}` : ''}`
      };

      console.log('Creating order with payload:', orderPayload);

      const response = await api.post('/orders', orderPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Order created:', response.data);
      setCreatedOrder(response.data.order);
      setProcessing(false);
      setShowSuccess(true);
      
      // Redirect to orders page after 2.5 seconds
      setTimeout(() => {
        toast.success('Payment successful! Order placed.');
        navigate('/orders');
      }, 2500);
    } catch (error) {
      setProcessing(false);
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your order has been placed successfully</p>
            {createdOrder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="font-bold text-lg text-blue-600">{createdOrder.orderNumber}</p>
                <p className="text-sm text-gray-500 mt-3 mb-1">Amount Paid</p>
                <p className="font-bold text-xl text-green-600">₹{createdOrder.total?.toLocaleString() || orderData?.total?.toLocaleString()}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">Redirecting to orders...</p>
            <button
              onClick={() => navigate('/orders')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              View Orders
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show loading/error if no order data
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Redirecting to cart...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Payment Gateway</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold">Card</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('qr')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'qr' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold">QR Code</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'upi' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold">UPI</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'netbanking' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold">NetBanking</div>
                </button>
              </div>
            </div>

            {/* QR Code Payment */}
            {paymentMethod === 'qr' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4">Scan QR Code to Pay</h2>
                <div className="flex flex-col items-center">
                  {/* QR Code Placeholder - In production, this would be dynamically generated */}
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <svg
                      className="w-48 h-48"
                      viewBox="0 0 200 200"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* QR Code Pattern */}
                      <rect x="0" y="0" width="200" height="200" fill="white"/>
                      {/* Position Detection Patterns */}
                      <rect x="10" y="10" width="50" height="50" fill="black"/>
                      <rect x="17" y="17" width="36" height="36" fill="white"/>
                      <rect x="24" y="24" width="22" height="22" fill="black"/>
                      
                      <rect x="140" y="10" width="50" height="50" fill="black"/>
                      <rect x="147" y="17" width="36" height="36" fill="white"/>
                      <rect x="154" y="24" width="22" height="22" fill="black"/>
                      
                      <rect x="10" y="140" width="50" height="50" fill="black"/>
                      <rect x="17" y="147" width="36" height="36" fill="white"/>
                      <rect x="24" y="154" width="22" height="22" fill="black"/>
                      
                      {/* Data Pattern */}
                      <rect x="70" y="10" width="8" height="8" fill="black"/>
                      <rect x="86" y="10" width="8" height="8" fill="black"/>
                      <rect x="102" y="10" width="8" height="8" fill="black"/>
                      <rect x="118" y="10" width="8" height="8" fill="black"/>
                      
                      <rect x="70" y="26" width="8" height="8" fill="black"/>
                      <rect x="94" y="26" width="8" height="8" fill="black"/>
                      <rect x="118" y="26" width="8" height="8" fill="black"/>
                      
                      <rect x="78" y="42" width="8" height="8" fill="black"/>
                      <rect x="102" y="42" width="8" height="8" fill="black"/>
                      
                      <rect x="10" y="70" width="8" height="8" fill="black"/>
                      <rect x="26" y="70" width="8" height="8" fill="black"/>
                      <rect x="50" y="70" width="8" height="8" fill="black"/>
                      <rect x="70" y="70" width="8" height="8" fill="black"/>
                      <rect x="94" y="70" width="8" height="8" fill="black"/>
                      <rect x="110" y="70" width="8" height="8" fill="black"/>
                      <rect x="130" y="70" width="8" height="8" fill="black"/>
                      <rect x="150" y="70" width="8" height="8" fill="black"/>
                      <rect x="170" y="70" width="8" height="8" fill="black"/>
                      
                      <rect x="10" y="86" width="8" height="8" fill="black"/>
                      <rect x="42" y="86" width="8" height="8" fill="black"/>
                      <rect x="78" y="86" width="8" height="8" fill="black"/>
                      <rect x="102" y="86" width="8" height="8" fill="black"/>
                      <rect x="126" y="86" width="8" height="8" fill="black"/>
                      <rect x="158" y="86" width="8" height="8" fill="black"/>
                      <rect x="182" y="86" width="8" height="8" fill="black"/>
                      
                      <rect x="26" y="102" width="8" height="8" fill="black"/>
                      <rect x="50" y="102" width="8" height="8" fill="black"/>
                      <rect x="70" y="102" width="8" height="8" fill="black"/>
                      <rect x="86" y="102" width="8" height="8" fill="black"/>
                      <rect x="118" y="102" width="8" height="8" fill="black"/>
                      <rect x="142" y="102" width="8" height="8" fill="black"/>
                      <rect x="166" y="102" width="8" height="8" fill="black"/>
                      
                      <rect x="10" y="118" width="8" height="8" fill="black"/>
                      <rect x="34" y="118" width="8" height="8" fill="black"/>
                      <rect x="58" y="118" width="8" height="8" fill="black"/>
                      <rect x="94" y="118" width="8" height="8" fill="black"/>
                      <rect x="126" y="118" width="8" height="8" fill="black"/>
                      <rect x="150" y="118" width="8" height="8" fill="black"/>
                      <rect x="182" y="118" width="8" height="8" fill="black"/>
                      
                      <rect x="70" y="142" width="8" height="8" fill="black"/>
                      <rect x="86" y="142" width="8" height="8" fill="black"/>
                      <rect x="110" y="142" width="8" height="8" fill="black"/>
                      <rect x="142" y="142" width="8" height="8" fill="black"/>
                      <rect x="166" y="142" width="8" height="8" fill="black"/>
                      
                      <rect x="70" y="158" width="8" height="8" fill="black"/>
                      <rect x="102" y="158" width="8" height="8" fill="black"/>
                      <rect x="126" y="158" width="8" height="8" fill="black"/>
                      <rect x="158" y="158" width="8" height="8" fill="black"/>
                      <rect x="182" y="158" width="8" height="8" fill="black"/>
                      
                      <rect x="78" y="174" width="8" height="8" fill="black"/>
                      <rect x="94" y="174" width="8" height="8" fill="black"/>
                      <rect x="118" y="174" width="8" height="8" fill="black"/>
                      <rect x="142" y="174" width="8" height="8" fill="black"/>
                      <rect x="174" y="174" width="8" height="8" fill="black"/>
                    </svg>
                  </div>
                  <div className="text-center mb-4">
                    <p className="font-semibold text-lg text-gray-800 mb-1">Amount: ₹{orderData.total?.toLocaleString() || '0'}</p>
                    <p className="text-sm text-gray-500">Scan with any UPI app to pay</p>
                  </div>
                  <div className="flex items-center space-x-4 mb-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-600">Paytm • PhonePe • GPay • BHIM</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-center">
                    <p className="text-yellow-800">After scanning and completing payment, click "Confirm Payment" below</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4">Card Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength="5"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength="3"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4">UPI Payment</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    placeholder="yourname@paytm / yourname@phonepe"
                    value={cardDetails.upiId}
                    onChange={(e) => setCardDetails({ ...cardDetails, upiId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)</p>
                </div>
              </motion.div>
            )}

            {/* NetBanking Payment Form */}
            {paymentMethod === 'netbanking' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4">Net Banking</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                  <select
                    value={cardDetails.bankName}
                    onChange={(e) => setCardDetails({ ...cardDetails, bankName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select your bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="Axis">Axis Bank</option>
                    <option value="Kotak">Kotak Mahindra Bank</option>
                    <option value="PNB">Punjab National Bank</option>
                    <option value="BOI">Bank of India</option>
                    <option value="BOB">Bank of Baroda</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Security Badge */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
              <Lock className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">Secure Payment</div>
                <div className="text-sm text-blue-700">Your payment information is encrypted and secure</div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{orderData?.subtotal?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span className="font-semibold">₹{orderData?.tax?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">
                    {orderData?.shipping === 0 ? 'FREE' : `₹${orderData?.shipping?.toLocaleString() || '0'}`}
                  </span>
                </div>
                {orderData?.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({orderData.couponCode})</span>
                    <span className="font-semibold">-₹{orderData.couponDiscount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{orderData?.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Back to Checkout link */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mb-3 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Checkout</span>
              </button>
              
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay ₹{orderData?.total?.toLocaleString() || '0'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

