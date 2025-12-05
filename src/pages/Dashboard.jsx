import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, Award, TrendingUp, Star, LogOut, Calendar, MapPin, Briefcase, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function Dashboard({ setIsAuthenticated }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = sessionStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/opportunities');
      setOpportunities(res.data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      const res = await api.post('/apply', { opportunity_id: opportunityId }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(res.data.message || 'Application submitted!');
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('Failed to apply');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.loading('Logging out...', { id: 'logout' });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    sessionStorage.clear();
    setIsAuthenticated(false);
    setIsLoggingOut(false);
    
    toast.success('Logged out successfully!', { id: 'logout' });
    navigate('/login');
  };

  const stats = [
    { label: 'Total Hours', value: '48', icon: Clock, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: '12', icon: Award, color: 'from-green-500 to-green-600' },
    { label: 'Active', value: '3', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { label: 'Impact Score', value: '92', icon: Star, color: 'from-pink-500 to-pink-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-600">
                Atlas & Arrow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.fullname}</span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-xl shadow-lg p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
                <stat.icon className="w-12 h-12 opacity-80" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <motion.div
                key={opp.id}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-white to-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-md"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{opp.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opp.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <Briefcase className="w-4 h-4 mr-2 text-indigo-600" />
                    {opp.required_skills}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                    {opp.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                    {new Date(opp.date_start).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleApply(opp.id)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition"
                >
                  Apply Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

