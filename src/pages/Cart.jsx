import { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

export default function Cart({ setIsAuthenticated }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view cart');
        navigate('/login');
        return;
      }
      const response = await api.get('/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Ensure items array exists
      const cartData = response.data;
      if (!cartData.items) {
        cartData.items = [];
      }
      setCart(cartData);
    } catch (error) {
      console.error('Cart fetch error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/cart/update/${productId}`, { quantity: newQuantity }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchCart();
      toast.success('Cart updated');
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.delete(`/cart/remove/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Item removed from cart');
      fetchCart();
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={true} setIsAuthenticated={setIsAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <ShoppingCart className="w-24 h-24 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <button onClick={() => navigate('/products')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-lg font-semibold hover:shadow-lg transition">Continue Shopping</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, index) => (
                <motion.div key={item.product._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-white p-6 rounded-lg shadow flex gap-6">
                  <img src={item.product.images[0]} alt={item.product.name} className="w-32 h-32 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{item.product.category}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100"><Minus className="w-4 h-4" /></button>
                          <span className="px-4 py-1 border-x">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100"><Plus className="w-4 h-4" /></button>
                        </div>
                        <span className="font-bold text-xl text-blue-600">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                      <button onClick={() => removeItem(item.product._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">₹{calculateTotal().toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax (18% GST)</span><span className="font-semibold">₹{Math.round(calculateTotal() * 0.18).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-semibold text-green-600">{calculateTotal() > 10000 ? 'FREE' : '₹100'}</span></div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-blue-600">₹{(calculateTotal() + Math.round(calculateTotal() * 0.18) + (calculateTotal() > 10000 ? 0 : 100)).toLocaleString()}</span></div>
                </div>
                <button onClick={() => navigate('/checkout')} className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">Proceed to Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

