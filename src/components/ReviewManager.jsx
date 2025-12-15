import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Reply, Trash2, Check, X, Search, Filter, User, Package, Clock, ThumbsUp, ThumbsDown, Flag, ChevronDown, Send, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

export default function ReviewManager() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Try to fetch real reviews from the server
      const token = sessionStorage.getItem('token');
      const response = await api.get('/reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.length > 0) {
        // Map server reviews to the expected format
        const serverReviews = response.data.map((review, index) => ({
          id: review._id || index + 1,
          productId: review.product?._id || review.productId,
          productName: review.product?.name || review.productName || 'Product',
          productImage: review.productImage || review.product?.images?.[0] || '/logo.png',
          userId: review.user?._id || review.userId,
          userName: review.user?.fullname || review.userName || 'Anonymous',
          userEmail: review.user?.email || review.userEmail || '',
          rating: review.rating || 5,
          title: review.title || '',
          comment: review.comment || review.text || '',
          date: review.createdAt || new Date().toISOString(),
          status: review.status || 'approved',
          helpful: review.helpful || 0,
          reply: review.reply || null
        }));
        setReviews(serverReviews);
      } else {
        // No reviews yet - show empty state
        setReviews([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setLoading(false);
    }
  };

  const handleApprove = async (review) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/reviews/${review.productId}/${review.id}/status`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(reviews.map(r =>
        r.id === review.id ? { ...r, status: 'approved' } : r
      ));
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (review) => {
    try {
      const token = sessionStorage.getItem('token');
      await api.put(`/admin/reviews/${review.productId}/${review.id}/status`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(reviews.map(r =>
        r.id === review.id ? { ...r, status: 'rejected' } : r
      ));
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  const handleDelete = async (review) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        const token = sessionStorage.getItem('token');
        await api.delete(`/admin/reviews/${review.productId}/${review.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(reviews.filter(r => r.id !== review.id));
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedReview) return;

    try {
      const token = sessionStorage.getItem('token');
      await api.post(`/admin/reviews/${selectedReview.productId}/${selectedReview.id}/reply`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviews(reviews.map(r =>
        r.id === selectedReview.id
          ? {
            ...r,
            reply: {
              text: replyText,
              date: new Date().toISOString().split('T')[0],
              by: 'Admin'
            }
          }
          : r
      ));

      setReplyText('');
      setShowReplyModal(false);
      setSelectedReview(null);
      alert('Reply sent! User will be notified.');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.reply?.text || '');
    setShowReplyModal(true);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      flagged: 'bg-orange-100 text-orange-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;

    return matchesSearch && matchesRating && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    pending: reviews.filter(r => r.status === 'pending').length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Product Reviews</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-sm text-gray-500">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews by product, user, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Product Image - Clickable */}
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      onClick={() => navigate(`/product/${review.productId}`)}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                      title="View product"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.title}</h3>
                          <p
                            onClick={() => navigate(`/product/${review.productId}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline flex items-center gap-1"
                            title="View product"
                          >
                            {review.productName}
                            <ExternalLink className="w-3 h-3" />
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(review.status)}`}>
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </span>
                      </div>

                      {/* Rating and User */}
                      <div className="flex items-center gap-4 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">by {review.userName}</span>
                        <span className="text-sm text-gray-400">{review.date}</span>
                      </div>

                      {/* Comment */}
                      <p className="text-gray-600 mb-4">{review.comment}</p>

                      {/* Reply */}
                      {review.reply && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Admin Reply</span>
                            <span className="text-xs text-blue-400">• {review.reply.date}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{review.reply.text}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(review)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(review)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openReplyModal(review)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                        >
                          <Reply className="w-4 h-4" />
                          {review.reply ? 'Edit Reply' : 'Reply'}
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                        <div className="flex items-center gap-2 ml-auto text-gray-400 text-sm">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{review.helpful} found helpful</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Reply to Review</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Responding to {selectedReview.userName}'s review on {selectedReview.productName}
                </p>
              </div>

              <div className="p-6">
                {/* Original Review */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm text-gray-500">• {selectedReview.date}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{selectedReview.comment}</p>
                </div>

                {/* Reply Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Write your reply to the customer..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send Reply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

