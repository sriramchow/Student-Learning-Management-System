import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaBook, 
  FaComments, 
  FaEnvelope, 
  FaChartBar, 
  FaUserPlus, 
  FaStar,
  FaCalendarAlt,
  FaEye,
  FaClock,
  FaExternalLinkAlt,
  FaBell
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const DashboardContent = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalFeedback: 0,
    totalContacts: 0,
    feedbackByType: [],
    userRegistrations: [],
    courseEnrollments: []
  });
  const [recentUsers, setRecentUsers] = useState([]);
  
  const db = getFirestore();
  
  useEffect(() => {
    fetchDashboardData();
    
    // Set up a 5-minute refresh interval for dashboard data
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get total users and recent users
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Filter out admin users
      const filteredUsers = usersList.filter(user => !user.isAdmin && user.email !== 'admin@questor.com');
      
      // Get recent users (within the last 6 hours)
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
      
      const recentUsersList = filteredUsers
        .filter(user => user.createdAt >= sixHoursAgo)
        .slice(0, 3) // Get up to 3 recent users
        .map(user => ({
          id: user.id,
          name: user.name || 'Unnamed User',
          email: user.email || 'No Email',
          createdAt: user.createdAt,
          timeAgo: formatTimeAgo(user.createdAt)
        }));
      
      setRecentUsers(recentUsersList);
      
      // Get total courses
      const coursesQuery = query(collection(db, "courses"));
      const coursesSnapshot = await getDocs(coursesQuery);
      
      // Get total feedback and feedback by type
      const feedbackQuery = query(collection(db, "feedback"));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      
      // Process feedback by type for chart
      const feedbackByType = {};
      feedbackSnapshot.docs.forEach(doc => {
        const type = doc.data().type || 'general';
        feedbackByType[type] = (feedbackByType[type] || 0) + 1;
      });
      
      const feedbackTypeData = Object.keys(feedbackByType).map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: feedbackByType[type]
      }));
      
      // Get total contact messages
      const contactsQuery = query(collection(db, "contactMessages"));
      const contactsSnapshot = await getDocs(contactsQuery);
      
      // Generate user registration data for the past 7 days
      const userRegData = generateDailyData(filteredUsers, 7);
      
      // Generate mock course enrollment data (since we don't track enrollments yet)
      const mockEnrollmentData = generateMockEnrollmentData(7);
      
      setStats({
        totalUsers: filteredUsers.length,
        totalCourses: coursesSnapshot.size,
        totalFeedback: feedbackSnapshot.size,
        totalContacts: contactsSnapshot.size,
        feedbackByType: feedbackTypeData,
        userRegistrations: userRegData,
        courseEnrollments: mockEnrollmentData
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to generate daily data for the past n days
  const generateDailyData = (users, days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // Count users registered on this day
      const count = users.filter(user => {
        const createdAt = user.createdAt;
        return createdAt >= date && createdAt < nextDate;
      }).length;
      
      data.push({
        name: formatDate(date),
        value: count
      });
    }
    
    return data;
  };
  
  // Helper function to generate mock enrollment data
  const generateMockEnrollmentData = (days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate a somewhat random but increasing trend
      const baseValue = 5 + Math.floor(i * 1.5);
      const randomFactor = Math.floor(Math.random() * 5);
      
      data.push({
        name: formatDate(date),
        value: baseValue + randomFactor
      });
    }
    
    return data;
  };
  
  // Format date to DD/MM
  const formatDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Colors for the pie chart
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading dashboard data...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow-lg p-6 border border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Total Users</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalUsers}</h3>
              <p className="text-green-400 text-sm mt-2">
                {recentUsers.length > 0 ? `+${recentUsers.length} new recently` : 'No new users recently'}
              </p>
            </div>
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-full">
              <FaUsers className="text-blue-300 text-2xl" />
            </div>
          </div>
        </div>
        
        {/* Total Courses Card */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl shadow-lg p-6 border border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">Total Courses</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalCourses}</h3>
              <p className="text-purple-300 text-sm mt-2">
                Educational content
              </p>
            </div>
            <div className="bg-purple-700 bg-opacity-50 p-4 rounded-full">
              <FaBook className="text-purple-300 text-2xl" />
            </div>
          </div>
        </div>
        
        {/* Total Feedback Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl shadow-lg p-6 border border-indigo-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-300 text-sm">Feedback Received</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalFeedback}</h3>
              <p className="text-yellow-400 text-sm mt-2 flex items-center">
                <FaStar className="mr-1" /> User suggestions & reports
              </p>
            </div>
            <div className="bg-indigo-700 bg-opacity-50 p-4 rounded-full">
              <FaComments className="text-indigo-300 text-2xl" />
            </div>
          </div>
        </div>
        
        {/* Total Contact Messages Card */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl shadow-lg p-6 border border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">Contact Messages</p>
              <h3 className="text-white text-3xl font-bold">{stats.totalContacts}</h3>
              <p className="text-green-300 text-sm mt-2">
                User inquiries
              </p>
            </div>
            <div className="bg-green-700 bg-opacity-50 p-4 rounded-full">
              <FaEnvelope className="text-green-300 text-2xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations Chart */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 p-4">
          <h3 className="text-white font-medium mb-4">User Registrations (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.userRegistrations}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="value" name="New Users" fill="#3b82f6" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        
        
        {/* Feedback by Type Chart */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 p-4">
          <h3 className="text-white font-medium mb-4">Feedback by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.feedbackByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.feedbackByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Users */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 p-4">
          <h3 className="text-white font-medium mb-4">Recent User Signups</h3>
          
          {recentUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-blue-800 bg-opacity-30 rounded-lg p-8 h-80">
              <FaUsers className="text-4xl text-blue-500 mb-4" />
              <p className="text-blue-300 text-center">No new users in the last 6 hours</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map(user => (
                <div 
                  key={user.id} 
                  className="bg-blue-800 bg-opacity-30 rounded-lg p-4 border border-blue-700 flex items-start"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center mr-4 text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <p className="text-blue-300 text-sm">{user.email}</p>
                      </div>
                      <div className="flex items-center text-xs text-blue-400">
                        <FaClock className="mr-1" />
                        {user.timeAgo}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex">
                      <div className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full inline-flex items-center">
                        <FaUserPlus className="mr-1" /> New User
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center">
                <button
                  onClick={() => fetchDashboardData()}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors inline-flex items-center"
                >
                  <FaEye className="mr-1" /> View all users
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default DashboardContent;