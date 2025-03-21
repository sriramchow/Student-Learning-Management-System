




import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaBook, 
  FaComments, 
  FaChartLine, 
  FaSignOutAlt, 
  FaBell, 
  FaCog, 
  FaUserShield,
  FaSearch,
  FaEllipsisV,
  FaUserPlus,
  FaStar,
  FaExclamationTriangle,
  FaTrash,
  FaEdit,
  FaPlus,
  FaUserCheck,
  FaUserTimes,
  FaEllipsisH
} from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc, query, limit, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalFeedback: 0,
    averageRating: 0
  });
  const [userActionMenu, setUserActionMenu] = useState(null);
  
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10));
        const usersSnapshot = await getDocs(usersQuery);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || 'Unknown',
          isActive: doc.data().isActive !== false // Default to true if not specified
        }));
        setUsers(usersList);
        
        // Fetch feedback
        const feedbackQuery = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(10));
        const feedbackSnapshot = await getDocs(feedbackQuery);
        const feedbackList = feedbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || 'Unknown'
        }));
        setFeedback(feedbackList);
        
        // Calculate statistics
        const totalUsers = usersSnapshot.size;
        
        // Calculate average rating from feedback
        let totalRating = 0;
        feedbackList.forEach(item => {
          totalRating += item.rating || 0;
        });
        const avgRating = feedbackList.length > 0 ? 
          (totalRating / feedbackList.length).toFixed(1) : 0;
        
        setStats({
          totalUsers,
          newUsersToday: 2, // Mock data
          totalCourses: 15, // Mock data
          activeCourses: 8, // Mock data
          totalFeedback: feedbackSnapshot.size,
          averageRating: avgRating
        });
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [db]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserActionMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isActive: !currentStatus
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? {...user, isActive: !currentStatus} : user
        )
      );
      
      toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      setUserActionMenu(null);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };
  
  // Handle user action menu
  const handleUserActionClick = (e, userId) => {
    e.stopPropagation(); // Prevent the outside click handler
    setUserActionMenu(prevState => prevState === userId ? null : userId);
  };
  
  // Render different content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <DashboardContent stats={stats} users={users} feedback={feedback} loading={loading} />;
      case 'users':
        return <UsersContent 
                users={users} 
                loading={loading} 
                userActionMenu={userActionMenu}
                handleUserActionClick={handleUserActionClick}
                toggleUserStatus={toggleUserStatus}
               />;
      case 'courses':
        return <CoursesContent loading={loading} />;
      case 'feedback':
        return <FeedbackContent feedback={feedback} loading={loading} />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent stats={stats} users={users} feedback={feedback} loading={loading} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0A1045] flex">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Sidebar */}
      <div className="w-64 bg-[#050A30] text-white min-h-screen">
        <div className="p-4 border-b border-blue-800">
          <h1 className="text-2xl font-bold">Questor Admin</h1>
          <div className="flex items-center mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
              <FaUserShield />
            </div>
            <div className="ml-3">
              <p className="font-medium">Admin</p>
              <p className="text-sm text-blue-300">admin@questor.com</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaChartLine className="mr-3" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'users' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaUsers className="mr-3" />
                Users
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('courses')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'courses' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaBook className="mr-3" />
                Courses
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'feedback' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaComments className="mr-3" />
                Feedback
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'settings' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaCog className="mr-3" />
                Settings
              </button>
            </li>
          </ul>
          
          {/* User Management Section in Sidebar */}
          <div className="mt-8 pt-6 border-t border-blue-800">
            <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-4 px-4">User Management</h3>
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-2 text-blue-300 text-sm">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="px-4 py-2 text-blue-300 text-sm">No users found</div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="px-4 py-2 hover:bg-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                        <span className="text-sm truncate" style={{maxWidth: "120px"}} title={user.email}>
                          {user.name || user.email || 'Unknown User'}
                        </span>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => handleUserActionClick(e, user.id)}
                          className="text-blue-300 hover:text-white p-1"
                        >
                          <FaEllipsisH />
                        </button>
                        
                        {/* User Action Menu */}
                        {userActionMenu === user.id && (
                          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-blue-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserStatus(user.id, user.isActive);
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white"
                                role="menuitem"
                              >
                                {user.isActive ? (
                                  <>
                                    <FaUserTimes className="inline mr-2" />
                                    Disable User
                                  </>
                                ) : (
                                  <>
                                    <FaUserCheck className="inline mr-2" />
                                    Enable User
                                  </>
                                )}
                              </button>
                              <button
                                className="w-full text-left block px-4 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white"
                                role="menuitem"
                              >
                                <FaEdit className="inline mr-2" />
                                Edit User
                              </button>
                              <button
                                className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-50 hover:text-red-300"
                                role="menuitem"
                              >
                                <FaTrash className="inline mr-2" />
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-blue-800">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg flex items-center text-red-400 hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 transition duration-300"
            >
              <FaSignOutAlt className="mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-[#050A30] bg-opacity-90 shadow-md px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'courses' && 'Course Management'}
            {activeTab === 'feedback' && 'User Feedback'}
            {activeTab === 'settings' && 'Admin Settings'}
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaBell className="text-blue-300 text-xl cursor-pointer hover:text-white transition duration-300" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Dashboard content component
const DashboardContent = ({ stats, users, feedback, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading dashboard data...</div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Users Card */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow-lg p-6 border border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Total Users</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalUsers}</h3>
              <p className="text-green-400 text-sm mt-2">
                +{stats.newUsersToday} new today
              </p>
            </div>
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-full">
              <FaUsers className="text-blue-300 text-2xl" />
            </div>
          </div>
        </div>
        
        {/* Courses Card */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl shadow-lg p-6 border border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">Total Courses</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalCourses}</h3>
              <p className="text-purple-300 text-sm mt-2">
                {stats.activeCourses} active courses
              </p>
            </div>
            <div className="bg-purple-700 bg-opacity-50 p-4 rounded-full">
              <FaBook className="text-purple-300 text-2xl" />
            </div>
          </div>
        </div>
        
        {/* Feedback Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl shadow-lg p-6 border border-indigo-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-300 text-sm">Feedback Received</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalFeedback}</h3>
              <p className="text-yellow-400 text-sm mt-2 flex items-center">
                <FaStar className="mr-1" /> {stats.averageRating} average rating
              </p>
            </div>
            <div className="bg-indigo-700 bg-opacity-50 p-4 rounded-full">
              <FaComments className="text-indigo-300 text-2xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Users</h3>
          <button className="text-blue-400 hover:text-blue-300 transition duration-300 text-sm flex items-center">
            View All <span className="ml-1">→</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-blue-300 border-b border-blue-800">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((user, index) => (
                <tr key={user.id} className="border-b border-blue-800 text-blue-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{user.name || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{user.email || 'No email'}</td>
                  <td className="py-3 pr-4">{user.createdAt}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      user.isActive !== false ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Feedback */}
      <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Feedback</h3>
          <button className="text-blue-400 hover:text-blue-300 transition duration-300 text-sm flex items-center">
            View All <span className="ml-1">→</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {feedback.slice(0, 3).map((item) => (
            <div key={item.id} className="bg-blue-800 bg-opacity-30 rounded-lg p-4 border border-blue-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                    {item.isAnonymous ? 'A' : (item.userName ? item.userName.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {item.isAnonymous ? 'Anonymous User' : (item.userName || 'Unknown User')}
                    </p>
                    <p className="text-xs text-blue-300">{item.createdAt}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i}
                      className={`text-sm ${i < item.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-blue-100">{item.feedback}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users content component
const UsersContent = ({ users, loading, userActionMenu, handleUserActionClick, toggleUserStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading users data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300">
          <FaUserPlus className="mr-2" /> Add User
        </button>
      </div>
      
      <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg border border-blue-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-blue-300 border-b border-blue-800 bg-blue-900 bg-opacity-50">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-blue-800 text-blue-100 hover:bg-blue-800 hover:bg-opacity-30 transition duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{user.name || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.email || 'No email'}</td>
                  <td className="px-6 py-4">{user.phone || 'Not provided'}</td>
                  <td className="px-6 py-4">{user.createdAt}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      user.isActive !== false
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2 relative">
                      <button 
                        onClick={(e) => handleUserActionClick(e, user.id)}
                        className="text-blue-400 hover:text-blue-300 transition duration-300"
                      >
                        <FaEllipsisV />
                      </button>
                      
                      {/* Action Menu (Dropdown) */}
                      {userActionMenu === user.id && (
                        <div className="absolute right-0 z-10 mt-6 w-48 rounded-md shadow-lg bg-blue-800 ring-1 ring-black ring-opacity-5">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserStatus(user.id, user.isActive);
                              }}
                              className="w-full text-left block px-4 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white"
                              role="menuitem"
                            >
                              {user.isActive !== false ? (
                                <>
                                  <FaUserTimes className="inline mr-2" />
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <FaUserCheck className="inline mr-2" />
                                  Enable User
                                </>
                              )}
                            </button>
                            <button
                              className="w-full text-left block px-4 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white"
                              role="menuitem"
                            >
                              <FaEdit className="inline mr-2" />
                              Edit User
                            </button>
                            <button
                              className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-50 hover:text-red-300"
                              role="menuitem"
                            >
                              <FaTrash className="inline mr-2" />
                              Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Courses content component
const CoursesContent = ({ loading }) => {
  // Mock courses data
  const courses = [
    { id: 1, title: 'Introduction to Web Development', instructor: 'John Smith', students: 156, rating: 4.8, status: 'Active' },
    { id: 2, title: 'Advanced JavaScript Patterns', instructor: 'Maria Garcia', students: 98, rating: 4.6, status: 'Active' },
    { id: 3, title: 'Data Science Fundamentals', instructor: 'David Kim', students: 215, rating: 4.9,status: 'Active' },
    { id: 4, title: 'Machine Learning Basics', instructor: 'Lisa Johnson', students: 127, rating: 4.7, status: 'Draft' },
    { id: 5, title: 'Mobile App Development', instructor: 'Ahmed Hassan', students: 89, rating: 4.5, status: 'Active' },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading courses data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300">
          <FaPlus className="mr-2" /> Add Course
        </button>
      </div>
      
      <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg border border-blue-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-blue-300 border-b border-blue-800 bg-blue-900 bg-opacity-50">
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Instructor</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-blue-800 text-blue-100 hover:bg-blue-800 hover:bg-opacity-30 transition duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-700 flex items-center justify-center mr-3 text-sm">
                        <FaBook />
                      </div>
                      <span>{course.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{course.instructor}</td>
                  <td className="px-6 py-4">{course.students}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {course.rating}
                      <FaStar className="ml-1 text-yellow-400 text-sm" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      course.status === 'Active' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 transition duration-300">
                        <FaEdit />
                      </button>
                      <button className="text-red-400 hover:text-red-300 transition duration-300">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Feedback content component
const FeedbackContent = ({ feedback, loading }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(item => item.type === filter);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading feedback data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              filter === 'all' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-900 bg-opacity-30 text-blue-300 hover:bg-blue-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              filter === 'general' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-900 bg-opacity-30 text-blue-300 hover:bg-blue-800'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setFilter('bug')}
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              filter === 'bug' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-900 bg-opacity-30 text-blue-300 hover:bg-blue-800'
            }`}
          >
            Bugs
          </button>
          <button
            onClick={() => setFilter('suggestion')}
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              filter === 'suggestion' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-900 bg-opacity-30 text-blue-300 hover:bg-blue-800'
            }`}
          >
            Suggestions
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center text-blue-300 border border-blue-800">
            No feedback found for the selected filter.
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3 text-sm">
                    {item.isAnonymous ? 'A' : (item.userName ? item.userName.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {item.isAnonymous ? 'Anonymous User' : (item.userName || (item.userEmail || 'Unknown User'))}
                    </p>
                    <p className="text-xs text-blue-300">{item.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i}
                        className={`text-sm ${i < item.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className={`ml-2 inline-block px-2 py-1 rounded-full text-xs ${
                    item.type === 'bug' 
                      ? 'bg-red-900 text-red-300' 
                      : item.type === 'suggestion'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-blue-900 text-blue-300'
                  }`}>
                    {item.type}
                  </span>
                </div>
              </div>
              <p className="text-blue-100 bg-blue-800 bg-opacity-30 p-4 rounded-lg border border-blue-700 mb-4">
                {item.feedback}
              </p>
              <div className="flex justify-between items-center">
                <div>
                  {!item.isAnonymous && item.userEmail && (
                    <a 
                      href={`mailto:${item.userEmail}`}
                      className="text-blue-400 hover:text-blue-300 transition duration-300 text-sm"
                    >
                      Reply via email
                    </a>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="text-red-400 hover:text-red-300 transition duration-300">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Settings content component
const SettingsContent = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800">
          <h3 className="text-xl font-semibold text-white mb-6">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-blue-300 mb-1">Site Name</label>
              <input
                type="text"
                defaultValue="Questor Learning Platform"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Admin Email</label>
              <input
                type="email"
                defaultValue="admin@questor.com"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Support Email</label>
              <input
                type="email"
                defaultValue="support@questor.com"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Time Zone</label>
              <select
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="EST" selected>Eastern Standard Time (EST)</option>
                <option value="CST">Central Standard Time (CST)</option>
                <option value="PST">Pacific Standard Time (PST)</option>
              </select>
            </div>
            
            <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300">
              Save Changes
            </button>
          </div>
        </div>
        
        {/* Security Settings */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800">
          <h3 className="text-xl font-semibold text-white mb-6">Security Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-blue-300 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-blue-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                />
                <span className="text-blue-200">Enable two-factor authentication</span>
              </label>
            </div>
            
            <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300">
              Update Password
            </button>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800">
          <h3 className="text-xl font-semibold text-white mb-6">Notification Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                  defaultChecked
                />
                <span className="text-blue-200">New user registrations</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                  defaultChecked
                />
                <span className="text-blue-200">New feedback submissions</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                  defaultChecked
                />
                <span className="text-blue-200">Course enrollments</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                />
                <span className="text-blue-200">System alerts</span>
              </label>
            </div>
            
            <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300">
              Save Settings
            </button>
          </div>
        </div>
        
        {/* Maintenance Settings */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl shadow-lg p-6 border border-blue-800">
          <h3 className="text-xl font-semibold text-white mb-6">Maintenance Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-800 bg-opacity-30 border border-blue-700">
              <div>
                <h4 className="text-white font-medium">Maintenance Mode</h4>
                <p className="text-sm text-blue-300">
                  Enable to take the site offline for maintenance
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-800 bg-opacity-30 border border-blue-700">
              <div>
                <h4 className="text-white font-medium">System Backup</h4>
                <p className="text-sm text-blue-300">
                  Last backup: 2 days ago
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition duration-300">
                Run Backup
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-900 bg-opacity-30 border border-red-800">
              <div>
                <h4 className="text-white font-medium flex items-center">
                  <FaExclamationTriangle className="text-red-400 mr-2" /> Danger Zone
                </h4>
                <p className="text-sm text-red-300">
                  Purge all temporary files and cache
                </p>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition duration-300">
                Purge Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;