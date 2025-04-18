import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaEye,
  FaTimes,
  FaSave,
  FaUsers,
  FaUserGraduate,
  FaBook,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaPaperPlane,
  FaCalendarAlt,
  FaGlobe,
  FaUserCheck
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

const NotificationsContent = () => {
  // State for notifications list
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // State for notification form
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetUserType: 'all',
    expiresAt: '',
    link: '',
    requiresAction: false
  });
  
  const db = getFirestore();
  
  // Fetch notifications from Firestore
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(notificationsQuery);
      
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate().toLocaleDateString() 
          : 'Unknown',
        expiresAt: doc.data().expiresAt?.toDate?.() 
          ? doc.data().expiresAt.toDate().toLocaleDateString() 
          : ''
      }));
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };
  
  // Add or update notification
  const saveNotification = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error("Notification title is required");
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error("Notification message is required");
      return;
    }
    
    try {
      const notificationData = {
        ...formData,
        updatedAt: serverTimestamp(),
        // Convert expiration date string to timestamp if provided
        expiresAt: formData.expiresAt 
          ? new Date(formData.expiresAt) 
          : null
      };
      
      if (editingNotification) {
        // Update existing notification
        const notificationRef = doc(db, "notifications", editingNotification);
        await updateDoc(notificationRef, notificationData);
        toast.success("Notification updated successfully");
      } else {
        // Create new notification
        notificationData.createdAt = serverTimestamp();
        notificationData.readBy = [];
        notificationData.sentCount = 0;
        await addDoc(collection(db, "notifications"), notificationData);
        toast.success("Notification created successfully");
      }
      
      // Reset form and fetch updated list
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("Failed to save notification");
    }
  };
  
  // Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast.success("Notification deleted successfully");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };
  
  // Edit notification - populate form with notification data
  const editNotification = (notification) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      targetUserType: notification.targetUserType,
      expiresAt: notification.expiresAt 
        ? new Date(notification.expiresAt).toISOString().split('T')[0] 
        : '',
      link: notification.link || '',
      requiresAction: notification.requiresAction || false
    });
    
    setEditingNotification(notification.id);
    setShowForm(true);
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      targetUserType: 'all',
      expiresAt: '',
      link: '',
      requiresAction: false
    });
    
    setEditingNotification(null);
    setShowForm(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Filter and sort notifications
  const getFilteredNotifications = () => {
    return notifications
      .filter(notification => {
        // Search by title or message
        const matchesSearch = 
          (notification.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (notification.message?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        // Filter by type
        const matchesType = 
          filterType === 'all' || 
          notification.type === filterType;
        
        return matchesSearch && matchesType;
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
        } else if (sortBy === 'priority') {
          // Convert priority to numeric value for sorting
          const priorityValue = { high: 3, normal: 2, low: 1 };
          aValue = priorityValue[a.priority] || 0;
          bValue = priorityValue[b.priority] || 0;
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
  
  // Get icon for notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-400" />;
      case 'warning':
        return <FaExclamationCircle className="text-yellow-400" />;
      case 'error':
        return <FaTimes className="text-red-400" />;
      case 'course':
        return <FaBook className="text-purple-400" />;
      case 'user':
        return <FaUserCheck className="text-blue-400" />;
      default:
        return <FaInfoCircle className="text-blue-400" />;
    }
  };
  
  // Get color for notification type
  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-900 text-green-300';
      case 'warning':
        return 'bg-yellow-900 text-yellow-300';
      case 'error':
        return 'bg-red-900 text-red-300';
      case 'course':
        return 'bg-purple-900 text-purple-300';
      case 'user':
        return 'bg-cyan-900 text-cyan-300';
      default:
        return 'bg-blue-900 text-blue-300';
    }
  };
  
  // Get icon for target user type
  const getTargetUserIcon = (targetUserType) => {
    switch (targetUserType) {
      case 'students':
        return <FaUserGraduate className="text-blue-400" />;
      case 'new_users':
        return <FaUsers className="text-green-400" />;
      case 'premium':
        return <FaUsers className="text-yellow-400" />;
      default:
        return <FaGlobe className="text-blue-400" />;
    }
  };
  
  // Get color for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900 text-red-300';
      case 'low':
        return 'bg-green-900 text-green-300';
      default:
        return 'bg-blue-900 text-blue-300';
    }
  };
  
  // Calculate stats
  const calculateStats = () => {
    const totalNotifications = notifications.length;
    const activeNotifications = notifications.filter(n => {
      if (!n.expiresAt) return true;
      const expDate = new Date(n.expiresAt);
      return expDate > new Date();
    }).length;
    
    const typeStats = {};
    notifications.forEach(n => {
      typeStats[n.type] = (typeStats[n.type] || 0) + 1;
    });
    
    return {
      totalNotifications,
      activeNotifications,
      typeStats
    };
  };
  
  const stats = calculateStats();
  const filteredNotifications = getFilteredNotifications();
  
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading notifications data...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Form for creating/editing notifications */}
      {showForm && (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </h3>
            <button
              onClick={resetForm}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={saveNotification}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div>
                  <label className="block text-blue-300 mb-2">Notification Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter notification title"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-blue-300 mb-2">Notification Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter notification message"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-blue-300 mb-2">Notification Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="course">Course Update</option>
                  <option value="user">User Update</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-300 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-300 mb-2">Target Users</label>
                <select
                  name="targetUserType"
                  value={formData.targetUserType}
                  onChange={handleInputChange}
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="new_users">New Users</option>
                  <option value="premium">Premium Users</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-300 mb-2">Expiration Date (Optional)</label>
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-blue-300 mb-2">Link (Optional)</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresAction"
                  name="requiresAction"
                  checked={formData.requiresAction}
                  onChange={handleInputChange}
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                />
                <label htmlFor="requiresAction" className="text-blue-300">
                  Requires user acknowledgment
                </label>
              </div>
              
              <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-blue-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-blue-900 text-blue-300 rounded-lg hover:bg-blue-800 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition duration-300 flex items-center"
                >
                  <FaSave className="mr-2" /> 
                  {editingNotification ? 'Update Notification' : 'Create Notification'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-blue-700 p-2 rounded-full mr-3">
              <FaBell className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total Notifications</p>
              <p className="text-white text-2xl font-semibold">{stats.totalNotifications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex items-center">
            <div className="bg-green-700 p-2 rounded-full mr-3">
              <FaCheckCircle className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Active Notifications</p>
              <p className="text-white text-2xl font-semibold">{stats.activeNotifications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingNotification(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300"
            >
              <FaPlus className="mr-2" /> New Notification
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search notifications..."
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
            <option value="info">Information</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="course">Course Updates</option>
            <option value="user">User Updates</option>
          </select>
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
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
            <option value="priority-desc">Highest Priority</option>
            <option value="priority-asc">Lowest Priority</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
          <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
      </div>
      
      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
          <FaBell className="text-4xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No Notifications Found</h3>
          <p className="text-blue-300">
            {notifications.length === 0
              ? "There are no notifications in the system yet."
              : "No notifications match your search or filter criteria."}
          </p>
          {notifications.length === 0 && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingNotification(null);
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto transition duration-300"
            >
              <FaPlus className="mr-2" /> Create Your First Notification
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                  {/* Notification Title and Type */}
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">{notification.title}</h3>
                      <div className="flex items-center text-xs text-blue-300 mt-1">
                        <span className="mr-3">Created: {notification.createdAt}</span>
                        {notification.expiresAt && (
                          <span className="flex items-center">
                            <FaCalendarAlt className="mr-1" /> Expires: {notification.expiresAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Priority and Target */}
                  <div className="flex mt-2 md:mt-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs mr-2 ${getPriorityColor(notification.priority)}`}>
                      {notification.priority} priority
                    </span>
                    
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
                      {getTargetUserIcon(notification.targetUserType)}
                      <span className="ml-1">
                        {notification.targetUserType === 'all' 
                          ? 'All Users' 
                          : notification.targetUserType === 'students'
                            ? 'Students Only'
                            : notification.targetUserType === 'new_users'
                              ? 'New Users'
                              : 'Premium Users'
                        }
                      </span>
                    </span>
                  </div>
                </div>
                
                {/* Notification Content */}
                <div className="bg-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-700 mb-4">
                  <p className="text-blue-100">{notification.message}</p>
                  
                  {notification.link && (
                    <a 
                      href={notification.link}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      {notification.link}
                    </a>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-blue-300">
                    {notification.requiresAction && (
                      <span className="flex items-center">
                        <FaExclamationCircle className="mr-1 text-yellow-400" /> 
                        Requires acknowledgment
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editNotification(notification)}
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="flex items-center text-red-400 hover:text-red-300 transition-colors"
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

export default NotificationsContent;