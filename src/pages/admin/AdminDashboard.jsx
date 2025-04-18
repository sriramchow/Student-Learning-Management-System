import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaBook, 
  FaComments, 
  FaChartLine, 
  FaSignOutAlt, 
  FaBell, 
  FaCog, 
  FaUserShield,
  FaEnvelope
} from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import DashboardContent from './tabs/DashboardContent';
import CoursesContent from './tabs/CoursesContent';
import ContactContent from './tabs/ContactContent';
import FeedbackContent from './tabs/FeedbackContent';
import NotificationsContent from './tabs/NotificationsContent';
import UsersContent from './tabs/UsersContent';
import SettingsContent from './tabs/SettingsContent';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  
  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        // Verify if the user has admin privileges
        if (!userSnap.exists() || !userSnap.data().isAdmin) {
          toast.error("Unauthorized access");
          navigate('/home');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Authentication error");
        navigate('/home');
      }
    };

    checkAdminStatus();
  }, [auth, db, navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UsersContent />;
      case 'courses':
        return <CoursesContent />;
      case 'feedback':
        return <FeedbackContent/>;
      case 'contacts':
        return <ContactContent/>;
      case 'notifications':
        return <NotificationsContent  />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent/>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1045] flex">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Sidebar */}
      <div className="w-64 bg-[#050A30] text-white min-h-screen flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-800">
          <h1 className="text-2xl font-bold">Questor Admin</h1>
          <div className="flex items-center mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
              <FaUserShield className="text-xl" />
            </div>
            <div className="ml-3">
              <p className="font-medium">Admin</p>
              <p className="text-sm text-blue-300">admin@questor.com</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleTabChange('dashboard')}
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
                onClick={() => handleTabChange('users')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'users' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaUsers className="mr-3" />
                User Management
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('courses')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'courses' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaBook className="mr-3" />
                Course Management
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('feedback')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'feedback' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaComments className="mr-3" />
                Feedback Management
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('contacts')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'contacts' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaEnvelope className="mr-3" />
                Contact Messages
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } transition duration-300`}
              >
                <FaBell className="mr-3" />
                Notifications
                
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('settings')}
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
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg flex items-center text-red-400 hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 transition duration-300"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#050A30] shadow-lg px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'courses' && 'Course Management'}
            {activeTab === 'feedback' && 'Feedback Management'}
            {activeTab === 'contacts' && 'Contact Messages'}
            {activeTab === 'notifications' && 'Notifications'}
            {activeTab === 'settings' && 'System Settings'}
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => handleTabChange('notifications')}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <FaBell className="text-xl" />
                
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A1045]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;