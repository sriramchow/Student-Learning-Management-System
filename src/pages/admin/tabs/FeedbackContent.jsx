import React, { useState, useEffect } from 'react';
import { 
  FaComments, 
  FaStar, 
  FaTrash, 
  FaReply, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaExclamationTriangle,
  FaCheck,
  FaInfoCircle,
  FaLightbulb,
  FaRegStar,
  FaEnvelope
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

const FeedbackContent = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  
  const db = getFirestore();
  
  useEffect(() => {
    fetchFeedback();
  }, []);
  
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const feedbackQuery = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(feedbackQuery);
      
      const feedbackList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate().toLocaleDateString() 
          : 'Unknown'
      }));
      
      setFeedback(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };
  
  const deleteFeedbackItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "feedback", id));
      setFeedback(prevFeedback => prevFeedback.filter(item => item.id !== id));
      toast.success("Feedback deleted successfully");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback");
    }
  };
  
  const getFilteredFeedback = () => {
    return feedback
      .filter(item => {
        // Search by feedback content or username
        const matchesSearch = 
          (item.feedback?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (item.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (item.userEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        // Filter by feedback type
        const matchesType = 
          filterType === 'all' || 
          (item.type === filterType);
        
        // Filter by rating
        const matchesRating = 
          filterRating === 'all' || 
          (filterRating === '5' && item.rating === 5) ||
          (filterRating === '4' && item.rating === 4) ||
          (filterRating === '3' && item.rating === 3) ||
          (filterRating === '2' && item.rating === 2) ||
          (filterRating === '1' && item.rating === 1);
        
        return matchesSearch && matchesType && matchesRating;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'createdAt') {
          // Parse dates for proper sorting
          aValue = a.createdAt && a.createdAt !== 'Unknown' 
            ? new Date(a.createdAt) 
            : new Date(0);
          bValue = b.createdAt && b.createdAt !== 'Unknown' 
            ? new Date(b.createdAt) 
            : new Date(0);
        } else if (sortBy === 'rating') {
          aValue = a.rating || 0;
          bValue = b.rating || 0;
        } else if (sortBy === 'type') {
          aValue = a.type || '';
          bValue = b.type || '';
        } else {
          aValue = (a[sortBy] || '').toString().toLowerCase();
          bValue = (b[sortBy] || '').toString().toLowerCase();
        }
        
        // Apply sort order
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug':
        return <FaExclamationTriangle className="text-red-400" />;
      case 'suggestion':
        return <FaLightbulb className="text-yellow-400" />;
      case 'ui':
        return <FaCheck className="text-purple-400" />;
      case 'courses':
        return <FaCheck className="text-green-400" />;
      default:
        return <FaInfoCircle className="text-blue-400" />;
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'bug':
        return 'bg-red-900 text-red-300';
      case 'suggestion':
        return 'bg-yellow-900 text-yellow-300';
      case 'ui':
        return 'bg-purple-900 text-purple-300';
      case 'courses':
        return 'bg-green-900 text-green-300';
      default:
        return 'bg-blue-900 text-blue-300';
    }
  };
  
  const toggleExpandFeedback = (id) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // If clicking the same field, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set as the sort field and default to descending for dates, ascending for others
      setSortBy(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };
  
  const filteredFeedback = getFilteredFeedback();
  
  // Calculate statistics
  const calculateStats = () => {
    const totalFeedbackCount = feedback.length;
    let totalRating = 0;
    const typeCounts = {
      general: 0,
      bug: 0,
      suggestion: 0,
      ui: 0,
      courses: 0
    };
    
    feedback.forEach(item => {
      totalRating += item.rating || 0;
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });
    
    const averageRating = totalFeedbackCount > 0 
      ? (totalRating / totalFeedbackCount).toFixed(1) 
      : '0.0';
    
    return {
      totalFeedbackCount,
      averageRating,
      typeCounts
    };
  };
  
  const stats = calculateStats();
  
  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < rating ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-500" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading feedback data...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-blue-700 p-2 rounded-full mr-3">
              <FaComments className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total Feedback</p>
              <p className="text-white text-2xl font-semibold">{stats.totalFeedbackCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-yellow-700 p-2 rounded-full mr-3">
              <FaStar className="text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-white text-2xl font-semibold mr-2">{stats.averageRating}</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i}
                      className={`text-xs ${i < Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800 lg:col-span-2">
          <p className="text-sm text-blue-300 mb-2">Feedback by Type</p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-blue-800 bg-opacity-40 px-3 py-1 rounded-full flex items-center">
              <span className="text-blue-300 mr-1">General:</span>
              <span className="text-white font-medium">{stats.typeCounts.general || 0}</span>
            </div>
            <div className="bg-red-900 bg-opacity-40 px-3 py-1 rounded-full flex items-center">
              <span className="text-red-300 mr-1">Bugs:</span>
              <span className="text-white font-medium">{stats.typeCounts.bug || 0}</span>
            </div>
            <div className="bg-yellow-900 bg-opacity-40 px-3 py-1 rounded-full flex items-center">
              <span className="text-yellow-300 mr-1">Suggestions:</span>
              <span className="text-white font-medium">{stats.typeCounts.suggestion || 0}</span>
            </div>
            <div className="bg-purple-900 bg-opacity-40 px-3 py-1 rounded-full flex items-center">
              <span className="text-purple-300 mr-1">UI:</span>
              <span className="text-white font-medium">{stats.typeCounts.ui || 0}</span>
            </div>
            <div className="bg-green-900 bg-opacity-40 px-3 py-1 rounded-full flex items-center">
              <span className="text-green-300 mr-1">Courses:</span>
              <span className="text-white font-medium">{stats.typeCounts.courses || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Filter by Type */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="bug">Bugs</option>
            <option value="suggestion">Suggestions</option>
            <option value="ui">UI Feedback</option>
            <option value="courses">Course Feedback</option>
          </select>
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Filter by Rating */}
        <div className="relative">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <FaStar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400" />
        </div>
        
        {/* Sort Options */}
        <div className="relative">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="appearance-none bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="rating-desc">Highest Rating</option>
            <option value="rating-asc">Lowest Rating</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
          </select>
          <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
      </div>
      
      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
          <FaComments className="text-4xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No Feedback Found</h3>
          <p className="text-blue-300">
            {feedback.length === 0
              ? "There is no feedback in the system yet."
              : "No feedback matches your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map(item => (
            <div 
              key={item.id} 
              className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                  {/* User Info and Type */}
                  <div className="flex items-start mb-2 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                      {item.isAnonymous 
                        ? 'A' 
                        : (item.userName ? item.userName.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {item.isAnonymous 
                          ? 'Anonymous User' 
                          : (item.userName || item.userEmail || 'Unknown User')}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{item.type || 'general'}</span>
                        </span>
                        <span className="text-blue-300 text-xs ml-3">{item.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center">
                    {renderStars(item.rating)}
                  </div>
                </div>
                
                {/* Feedback Content */}
                <div 
                  className="bg-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-700"
                  onClick={() => toggleExpandFeedback(item.id)}
                >
                  <p className={`text-blue-100 ${
                    expandedFeedback !== item.id && item.feedback.length > 200 
                      ? 'line-clamp-3' 
                      : ''
                  }`}>
                    {item.feedback}
                  </p>
                  
                  {item.feedback.length > 200 && expandedFeedback !== item.id && (
                    <button 
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandFeedback(item.id);
                      }}
                    >
                      Read more...
                    </button>
                  )}
                </div>
                
                {/* Actions */}
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    {!item.isAnonymous && item.userEmail && (
                      <a 
                        href={`mailto:${item.userEmail}?subject=Response to your feedback on Questor`}
                        className="flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        <FaEnvelope className="mr-1" /> Reply to user
                      </a>
                    )}
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => deleteFeedbackItem(item.id)}
                      className="flex items-center text-red-400 hover:text-red-300 transition-colors ml-4"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackContent;