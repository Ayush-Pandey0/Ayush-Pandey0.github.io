import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Package, Shield, Truck, ThumbsUp, User, MessageSquare, Camera, X, Image, Heart } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function ProductDetail({ isAuthenticated, setIsAuthenticated }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', images: [] });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Reviews will be fetched from API
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (isAuthenticated) {
      checkWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const checkWishlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await api.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const wishlistIds = (response.data || []).map(p => p._id);
      setInWishlist(wishlistIds.includes(id));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    
    try {
      const response = await api.post(`/wishlist/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInWishlist(response.data.added);
      toast.success(response.data.added ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/products/${id}/reviews`);
      if (response.data && Array.isArray(response.data)) {
        setReviews(response.data.map(review => ({
          id: review._id,
          user: review.userName || review.user?.fullname || 'Anonymous',
          rating: review.rating || 5,
          date: review.createdAt,
          comment: review.comment || review.text || '',
          helpful: review.helpful || 0,
          verified: review.verified || false,
          images: review.images || [],
          reply: review.reply || null
        })));
      } else if (response.data?.reviews && Array.isArray(response.data.reviews)) {
        // Handle old format { reviews: [...] }
        setReviews(response.data.reviews.map(review => ({
          id: review._id,
          user: review.userName || review.user?.fullname || 'Anonymous',
          rating: review.rating || 5,
          date: review.createdAt,
          comment: review.comment || review.text || '',
          helpful: review.helpful || 0,
          verified: review.verified || false,
          images: review.images || [],
          reply: review.reply || null
        })));
      }
    } catch (error) {
      // No reviews yet or endpoint not available
      setReviews([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Product fetch error:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login');
        return;
      }
      await api.post('/cart/add', { productId: product._id, quantity }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Added to cart!');
      // Dispatch event to update cart count in Navbar
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setSubmittingReview(true);
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await api.post(`/products/${id}/reviews`, {
        rating: newReview.rating,
        title: newReview.title || '',
        comment: newReview.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new review to the list
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const review = {
        id: response.data.review?._id || reviews.length + 1,
        user: user.fullname || 'You',
        rating: newReview.rating,
        date: new Date().toISOString().split('T')[0],
        comment: newReview.comment,
        helpful: 0,
        verified: true,
        images: previewImages
      };
      setReviews([review, ...reviews]);
      setNewReview({ rating: 5, comment: '', images: [] });
      setPreviewImages([]);
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previewImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleHelpful = (reviewId) => {
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    ));
    toast.success('Thanks for your feedback!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full" onClick={() => setSelectedImage(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selectedImage} alt="Review" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
            </div>

            {/* Details */}
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mb-4">{product.category}</span>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              {/* Only show rating if there are actual reviews */}
              {(product.numReviews > 0 || reviews.length > 0) && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => {
                      const actualRating = reviews.length > 0 
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                        : (product.rating || 0);
                      return (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(actualRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      );
                    })}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {(reviews.length > 0 
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
                      : product.rating?.toFixed(1) || '0.0'
                    )} ({product.numReviews || reviews.length || 0} reviews)
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && <span className="text-2xl text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>}
                  {product.discount > 0 && <span className="bg-red-500 text-white px-3 py-1 rounded font-semibold">{product.discount}% OFF</span>}
                </div>
                <p className="text-sm text-green-600 mt-2">✓ In Stock ({product.stock} available)</p>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-100">-</button>
                  <span className="px-6 py-2 border-x">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-2 hover:bg-gray-100">+</button>
                </div>

                <button onClick={handleAddToCart} disabled={adding} className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xs font-semibold">Free Shipping</div>
                  <div className="text-xs text-gray-500">Above ₹10,000</div>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xs font-semibold">{product.warranty}</div>
                  <div className="text-xs text-gray-500">Warranty</div>
                </div>
                <div className="text-center">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xs font-semibold">Easy Returns</div>
                  <div className="text-xs text-gray-500">7 Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-lg shadow-lg mt-8 p-8">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-gray-900" />
            <h2 className="text-2xl font-bold text-black">Customer Reviews</h2>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{reviews.length} Reviews</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-black">{averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-gray-600 mt-2">Based on {reviews.length} reviews</p>
                </div>

                {/* Rating Bars */}
                <div className="space-y-3">
                  {ratingCounts.map(({ star, count, percentage }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-black w-8">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write Review Form */}
              <div className="mt-6 bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-black mb-4">Write a Review</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1"
                      >
                        <Star className={`w-6 h-6 ${star <= newReview.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Your Comment</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                    rows={4}
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Add Photos (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    {previewImages.map((img, index) => (
                      <div key={index} className="relative w-16 h-16">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {previewImages.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-900 hover:text-gray-900 transition"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-xs mt-1">Add</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Max 5 images, 5MB each</p>
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-black">{review.user}</span>
                            {review.verified && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                ✓ Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    
                    {/* Admin Reply */}
                    {review.reply && review.reply.text && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 ml-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">A</span>
                          </div>
                          <span className="text-sm font-medium text-blue-700">Admin Reply</span>
                          {review.reply.date && (
                            <span className="text-xs text-blue-500">
                              • {new Date(review.reply.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm ml-8">{review.reply.text}</p>
                      </div>
                    )}
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.images.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(img)}
                            className="relative group"
                          >
                            <img 
                              src={img} 
                              alt={`Review by ${review.user} - ${index + 1}`} 
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-gray-400 transition"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition flex items-center justify-center">
                              <Image className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

