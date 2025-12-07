import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Smartphone, Lock, CheckCircle, X, QrCode, ArrowLeft, Copy, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../config/api';
import { QRCodeSVG } from 'qrcode.react';

// UPI Payment Configuration - Update with your UPI ID
const UPI_CONFIG = {
  payeeVPA: 'atlasarrow@paytm', // Your PayTM/UPI ID - CHANGE THIS
  payeeName: 'Atlas Arrow',
};

export default function PaymentGateway({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    transactionId: '',
    bankName: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      toast.error('No order data found. Please go through checkout.');
      navigate('/cart');
    }
  }, [orderData, navigate]);

  // Razorpay Payment Handler
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Create Razorpay order
      const orderResponse = await api.post('/payment/create-order', {
        amount: orderData.total,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: { 
          customer_name: orderData.shippingAddress?.fullname,
          customer_phone: orderData.shippingAddress?.phone
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { order_id, key_id, amount } = orderResponse.data;

      // Get user info
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');

      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        name: 'Atlas & Arrow',
        description: 'Order Payment',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyResponse.data.success) {
              // Create order in database
              const orderPayload = {
                items: orderData.items.map(item => ({
                  product: item.product._id || item.product,
                  quantity: item.quantity
                })),
                shippingAddress: orderData.shippingAddress || {},
                paymentMethod: 'RAZORPAY',
                transactionId: response.razorpay_payment_id,
                paymentStatus: 'completed',
                couponCode: orderData.couponCode || null,
                couponDiscount: orderData.couponDiscount || 0,
                notes: `Razorpay Payment | Order ID: ${response.razorpay_order_id}`
              };

              const createOrderResponse = await api.post('/orders', orderPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });

              setCreatedOrder(createOrderResponse.data.order);
              setShowSuccess(true);
              toast.success('Payment successful!');
              
              setTimeout(() => {
                navigate('/orders');
              }, 3000);
            }
          } catch (error) {
            toast.error('Payment verification failed');
            setProcessing(false);
          }
        },
        prefill: {
          name: orderData.shippingAddress?.fullname || user.fullname || '',
          email: user.email || '',
          contact: orderData.shippingAddress?.phone || user.phone || ''
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(false);
      
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      toast.error('No order data found. Please go through checkout.');
      navigate('/cart');
    }
  }, [orderData, navigate]);

  // Generate UPI Payment URL for QR Code
  const generateUPIUrl = () => {
    const amount = orderData?.total || 0;
    const note = `Atlas Arrow Order`;
    return `upi://pay?pa=${UPI_CONFIG.payeeVPA}&pn=${encodeURIComponent(UPI_CONFIG.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(UPI_CONFIG.payeeVPA);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUPIPayment = async () => {
    if (!transactionId || transactionId.length < 6) {
      toast.error('Please enter a valid UPI Transaction ID');
      return;
    }

    setProcessing(true);
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      const orderPayload = {
        items: orderData.items.map(item => ({
          product: item.product._id || item.product,
          quantity: item.quantity
        })),
        shippingAddress: orderData.shippingAddress || {},
        paymentMethod: 'UPI_QR',
        transactionId: transactionId,
        couponCode: orderData.couponCode || null,
        couponDiscount: orderData.couponDiscount || 0,
        notes: `UPI Payment | Transaction ID: ${transactionId}`
      };

      const response = await api.post('/orders', orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCreatedOrder(response.data.order);
      setCardDetails(prev => ({ ...prev, transactionId: transactionId }));
      setProcessing(false);
      setShowQRModal(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        toast.success('Order placed! Payment verification pending.');
        navigate('/orders');
      }, 3000);
    } catch (error) {
      setProcessing(false);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  const handleCardPayment = async () => {
    if (!transactionId || transactionId.length < 6) {
      toast.error('Please enter a valid Transaction ID');
      return;
    }

    setProcessing(true);
    
    try {
      const token = sessionStorage.getItem('token');

      const orderPayload = {
        items: orderData.items.map(item => ({
          product: item.product._id || item.product,
          quantity: item.quantity
        })),
        shippingAddress: orderData.shippingAddress || {},
        paymentMethod: 'CARD',
        transactionId: transactionId,
        couponCode: orderData.couponCode || null,
        couponDiscount: orderData.couponDiscount || 0,
        notes: `Card/Bank Payment | Transaction ID: ${transactionId}`
      };

      const response = await api.post('/orders', orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCreatedOrder(response.data.order);
      setCardDetails(prev => ({ ...prev, transactionId: transactionId }));
      setProcessing(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        toast.success('Order placed! Payment verification pending.');
        navigate('/orders');
      }, 3000);
    } catch (error) {
      setProcessing(false);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
    return v;
  };

  // Success Screen
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
              transition={{ delay: 0.2 }}
              className={`w-24 h-24 ${paymentMethod === 'upi_qr' ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              {paymentMethod === 'upi_qr' ? (
                <Clock className="w-16 h-16 text-orange-500" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-600" />
              )}
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {paymentMethod === 'upi_qr' ? 'Order Placed!' : 'Payment Successful!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {paymentMethod === 'upi_qr' 
                ? 'Payment verification pending. We\'ll confirm shortly.'
                : 'Your order has been placed successfully'}
            </p>
            {createdOrder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-bold text-lg text-blue-600">{createdOrder.orderNumber}</p>
                <p className="text-sm text-gray-500 mt-2">Amount</p>
                <p className="font-bold text-xl text-green-600">₹{createdOrder.total?.toLocaleString()}</p>
                {(transactionId || cardDetails.transactionId) && (
                  <>
                    <p className="text-sm text-gray-500 mt-2">Transaction ID</p>
                    <p className="font-medium">{transactionId || cardDetails.transactionId}</p>
                  </>
                )}
              </div>
            )}
            <button
              onClick={() => navigate('/orders')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold"
            >
              View Orders
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!orderData?.items?.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
      
      {/* QR Code Modal - Inline to prevent re-renders */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-t-2xl">
              <h3 className="text-lg font-bold">Scan to Pay</h3>
              <button onClick={() => setShowQRModal(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-lg">
                  <QRCodeSVG 
                    value={generateUPIUrl()}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* UPI ID */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-blue-600">{UPI_CONFIG.payeeVPA}</code>
                  <button 
                    onClick={copyUPIId}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {copied ? 'Copied!' : <><Copy className="w-4 h-4 inline mr-1" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Amount to Pay</p>
                <p className="text-3xl font-bold text-green-600">₹{orderData.total?.toLocaleString()}</p>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-yellow-800 font-medium mb-2">How to Pay:</p>
                <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM)</li>
                  <li>Scan the QR code above</li>
                  <li>Complete the payment</li>
                  <li>Enter the Transaction ID below</li>
                </ol>
              </div>

              {/* Transaction ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI Transaction ID / Reference Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 401422121258"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 12-digit transaction ID from your UPI app
                </p>
              </div>

              <button
                onClick={handleUPIPayment}
                disabled={processing || !transactionId}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Checkout
        </button>

        <h1 className="text-3xl font-bold mb-8">Payment</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 border-2 rounded-xl transition relative ${
                    paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Recommended
                  </div>
                  <Zap className={`w-10 h-10 mx-auto mb-2 ${paymentMethod === 'razorpay' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm">Razorpay</div>
                  <div className="text-xs text-gray-500">Cards, UPI, Wallets</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('upi_qr')}
                  className={`p-4 border-2 rounded-xl transition ${
                    paymentMethod === 'upi_qr' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <QrCode className={`w-10 h-10 mx-auto mb-2 ${paymentMethod === 'upi_qr' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm">UPI QR Code</div>
                  <div className="text-xs text-gray-500">Scan & Pay</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-xl transition ${
                    paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <CreditCard className={`w-10 h-10 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm">Manual</div>
                  <div className="text-xs text-gray-500">Bank Transfer</div>
                </button>
              </div>
            </div>

            {/* Razorpay Payment */}
            {paymentMethod === 'razorpay' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Pay with Razorpay
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                  <div className="mb-4">
                    <p className="text-gray-600 mb-2">Total Amount</p>
                    <p className="text-4xl font-bold text-green-600">₹{orderData.total?.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">💳 Credit Card</span>
                    <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">💳 Debit Card</span>
                    <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">📱 UPI</span>
                    <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">💰 Net Banking</span>
                    <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">👛 Wallets</span>
                  </div>
                  
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={processing}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2 text-lg"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Pay ₹{orderData.total?.toLocaleString()}
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    Secured by Razorpay
                  </div>
                </div>

                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-green-800">
                    <strong>✅ Instant Verification:</strong> Your payment will be verified automatically and order will be confirmed immediately.
                  </p>
                </div>
              </motion.div>
            )}

            {/* UPI QR Payment */}
            {paymentMethod === 'upi_qr' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-blue-600" />
                  Pay with UPI QR Code
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Scan QR code with any UPI app like BHIM, Paytm, Google Pay, PhonePe
                  </p>
                  
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <QrCode className="w-6 h-6" />
                    Show QR Code & Pay
                  </button>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> After payment, enter the UPI Reference ID. We'll verify your payment manually.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Card Payment */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Card Payment
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-2">Pay using any payment gateway or bank transfer</p>
                    <p className="text-3xl font-bold text-green-600">₹{orderData.total?.toLocaleString()}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3 text-gray-800">💳 Payment Instructions:</h3>
                    <ol className="text-gray-600 space-y-2 list-decimal list-inside text-sm">
                      <li>Pay using any card payment gateway (Razorpay, PayU, etc.)</li>
                      <li>Or use bank transfer / NEFT / IMPS</li>
                      <li>After payment, enter the Transaction ID below</li>
                      <li>We'll verify and confirm your order</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Bank Details:</strong><br/>
                      Account Name: Atlas Arrow<br/>
                      UPI: {UPI_CONFIG.payeeVPA}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID / Reference Number *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                        maxLength={30}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Enter the transaction/reference ID from your payment
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCardPayment}
                      disabled={processing || !transactionId || transactionId.length < 6}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-800">
                    <strong>Note:</strong> After payment, enter the Transaction ID. We'll verify your payment manually and confirm your order.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover"/>
                      ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(item.product?.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{orderData.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span>₹{orderData.tax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{orderData.shipping === 0 ? 'FREE' : `₹${orderData.shipping}`}</span>
                </div>
                {orderData.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{orderData.couponDiscount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">₹{orderData.total?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>

              {/* Privacy Policy Notice */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed">
                <p>
                  Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                  <a href="/privacy-policy" className="text-blue-600 hover:underline">privacy policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

