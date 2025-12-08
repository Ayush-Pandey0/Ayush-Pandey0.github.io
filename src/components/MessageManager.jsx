import { useState, useEffect } from 'react';
import { Mail, Phone, Building, Calendar, Eye, Trash2, CheckCircle, Clock, MessageSquare, RefreshCw, Search, Filter, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function MessageManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/messages');
      if (response.data.success) {
        setMessages(response.data.messages);
        setStats({
          total: response.data.total,
          unread: response.data.unread
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const response = await api.put(`/admin/messages/${id}`, { status });
      if (response.data.success) {
        setMessages(messages.map(m => m._id === id ? { ...m, status } : m));
        if (selectedMessage?._id === id) {
          setSelectedMessage({ ...selectedMessage, status });
        }
        toast.success(`Message marked as ${status}`);
        // Update stats
        const newMessages = messages.map(m => m._id === id ? { ...m, status } : m);
        setStats({
          total: newMessages.length,
          unread: newMessages.filter(m => m.status === 'new').length
        });
      }
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await api.delete(`/admin/messages/${id}`);
      if (response.data.success) {
        setMessages(messages.filter(m => m._id !== id));
        if (selectedMessage?._id === id) {
          setSelectedMessage(null);
        }
        toast.success('Message deleted');
        setStats(prev => ({
          total: prev.total - 1,
          unread: messages.find(m => m._id === id)?.status === 'new' ? prev.unread - 1 : prev.unread
        }));
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-800',
      replied: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800'
    };
    return styles[status] || styles.new;
  };

  const getInquiryLabel = (type) => {
    const labels = {
      general: 'General Inquiry',
      sales: 'Sales & Pricing',
      support: 'Technical Support',
      partnership: 'Partnership',
      bulk_order: 'Bulk Orders'
    };
    return labels[type] || 'General Inquiry';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unread</p>
              <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Replied</p>
              <p className="text-2xl font-bold text-green-600">
                {messages.filter(m => m.status === 'replied').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Closed</p>
              <p className="text-2xl font-bold text-purple-600">
                {messages.filter(m => m.status === 'closed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Messages ({filteredMessages.length})</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No messages found</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedMessage?._id === msg._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  } ${msg.status === 'new' ? 'bg-blue-50/50' : ''}`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'new') {
                      updateMessageStatus(msg._id, 'read');
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{msg.name}</h4>
                        <p className="text-sm text-gray-500">{msg.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(msg.status)}`}>
                      {msg.status}
                    </span>
                  </div>
                  <h5 className="font-medium text-gray-800 mb-1 truncate">{msg.subject}</h5>
                  <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(msg.createdAt)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {getInquiryLabel(msg.inquiryType)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Message Details</h3>
          </div>
          {selectedMessage ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedMessage.name}</h3>
                    <p className="text-gray-500">{selectedMessage.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMessage(selectedMessage._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {selectedMessage.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedMessage.phone}</span>
                  </div>
                )}
                {selectedMessage.company && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building className="w-4 h-4" />
                    <span>{selectedMessage.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedMessage.createdAt)}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Inquiry Type:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {getInquiryLabel(selectedMessage.inquiryType)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedMessage.subject}</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {['new', 'read', 'replied', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateMessageStatus(selectedMessage._id, status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        selectedMessage.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Reply via Email:</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply message here..."
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-3"
                />
                <button
                  onClick={async () => {
                    if (!replyText.trim()) {
                      toast.error('Please enter a reply message');
                      return;
                    }
                    setSendingReply(true);
                    try {
                      const token = sessionStorage.getItem('token');
                      const response = await api.post('/admin/messages/reply', {
                        messageId: selectedMessage._id,
                        to: selectedMessage.email,
                        name: selectedMessage.name,
                        subject: `Re: ${selectedMessage.subject}`,
                        replyText: replyText
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      if (response.data.success) {
                        toast.success('Reply sent successfully!');
                        setReplyText('');
                        updateMessageStatus(selectedMessage._id, 'replied');
                      }
                    } catch (error) {
                      console.error('Error sending reply:', error);
                      toast.error(error.response?.data?.message || 'Failed to send reply');
                    } finally {
                      setSendingReply(false);
                    }
                  }}
                  disabled={sendingReply || !replyText.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a message to view details</p>
              <p className="text-sm">Click on any message from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

