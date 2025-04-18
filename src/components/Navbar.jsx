import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { 
  FaHome, 
  FaBook, 
  FaHeart, 
  FaBell, 
  FaComments, 
  FaEllipsisH, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaChevronDown,
  FaCertificate,
  FaCommentDots,
  FaEnvelope,
  FaChartLine
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isOthersDropdownOpen, setIsOthersDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const profileRef = useRef(null);
  const othersRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (othersRef.current && !othersRef.current.contains(event.target)) {
        setIsOthersDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  // Mock function to fetch unread notifications - replace with actual implementation
  useEffect(() => {
    // This is a placeholder - you should replace this with actual logic to fetch notifications
    const fetchUnreadNotifications = () => {
      // Mock data - this should be replaced with actual API call
      setUnreadNotifications(2);
    };
    
    fetchUnreadNotifications();
    
    // Set up an interval to check for new notifications (every minute)
    const interval = setInterval(fetchUnreadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };
  
  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-[#050A30] fixed w-full top-0 left-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/home" className="flex-shrink-0 flex items-center">
              <div className="text-2xl font-bold text-white">Questor</div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-6">
              <Link
                to="/home"
                className={`${
                  isActive('/home')
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-blue-300 hover:text-white'
                } flex items-center px-2 py-1 transition-colors`}
              >
                <FaHome className="mr-1" /> Home
              </Link>
              
              <Link
                to="/courses"
                className={`${
                  isActive('/courses')
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-blue-300 hover:text-white'
                } flex items-center px-2 py-1 transition-colors`}
              >
                <FaBook className="mr-1" /> Courses
              </Link>
              
              <Link
                to="/wishlist"
                className={`${
                  isActive('/wishlist')
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-blue-300 hover:text-white'
                } flex items-center px-2 py-1 transition-colors`}
              >
                <FaHeart className="mr-1" /> Wishlist
              </Link>
              
              <Link
                to="/notifications"
                className={`${
                  isActive('/notifications')
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-blue-300 hover:text-white'
                } flex items-center px-2 py-1 transition-colors relative`}
              >
                <FaBell className="mr-1" /> Notifications
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
              
              <Link
                to="/discussions"
                className={`${
                  isActive('/discussions')
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-blue-300 hover:text-white'
                } flex items-center px-2 py-1 transition-colors`}
              >
                <FaComments className="mr-1" /> Discussions
              </Link>
              
              {/* Others Dropdown */}
              <div ref={othersRef} className="relative">
                <button
                  onClick={() => setIsOthersDropdownOpen(!isOthersDropdownOpen)}
                  className={`${
                    isActive('/certificates') || isActive('/feedback') || isActive('/contact') || isActive('/progress')
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-blue-300 hover:text-white'
                  } flex items-center px-2 py-1 transition-colors focus:outline-none`}
                >
                  <FaEllipsisH className="mr-1" /> Others
                  <FaChevronDown className={`ml-1 transition-transform ${isOthersDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOthersDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0A1045] rounded-lg shadow-lg py-2 z-50 border border-blue-800">
                    <Link
                      to="/certificates"
                      className="block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors flex items-center"
                    >
                      <FaCertificate className="mr-2" /> Certificates
                    </Link>
                    
                    <Link
                      to="/feedback"
                      className="block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors flex items-center"
                    >
                      <FaCommentDots className="mr-2" /> Feedback
                    </Link>
                    
                    <Link
                      to="/contact"
                      className="block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors flex items-center"
                    >
                      <FaEnvelope className="mr-2" /> Contact Us
                    </Link>
                    
                    <Link
                      to="/progress"
                      className="block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors flex items-center"
                    >
                      <FaChartLine className="mr-2" /> Progress
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* User profile section */}
          <div className="flex items-center">
            <div ref={profileRef} className="ml-4 relative flex items-center">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center text-blue-300 hover:text-white transition-colors focus:outline-none"
              >
                <FaUserCircle className="h-8 w-8" />
                <span className="ml-2 mr-1 hidden md:block">
                  {auth.currentUser?.displayName || 'User'}
                </span>
                <FaChevronDown className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-14 w-48 bg-[#0A1045] rounded-lg shadow-lg py-2 z-50 border border-blue-800">
                  <Link
                    to="/userprofile"
                    className="block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
                  >
                    My Profile
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors flex items-center"
                  >
                    <FaSignOutAlt className="mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-blue-300 hover:text-white hover:bg-blue-800 transition-colors focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A1045] border-t border-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/home"
              className={`${
                isActive('/home')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-300 hover:bg-blue-800 hover:text-white'
              } block rounded-md px-3 py-2 text-base font-medium flex items-center`}
            >
              <FaHome className="mr-2" /> Home
            </Link>
            
            <Link
              to="/courses"
              className={`${
                isActive('/courses')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-300 hover:bg-blue-800 hover:text-white'
              } block rounded-md px-3 py-2 text-base font-medium flex items-center`}
            >
              <FaBook className="mr-2" /> Courses
            </Link>
            
            <Link
              to="/wishlist"
              className={`${
                isActive('/wishlist')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-300 hover:bg-blue-800 hover:text-white'
              } block rounded-md px-3 py-2 text-base font-medium flex items-center`}
            >
              <FaHeart className="mr-2" /> Wishlist
            </Link>
            
            <Link
              to="/notifications"
              className={`${
                isActive('/notifications')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-300 hover:bg-blue-800 hover:text-white'
              } block rounded-md px-3 py-2 text-base font-medium flex items-center relative`}
            >
              <FaBell className="mr-2" /> Notifications
              {unreadNotifications > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            
            <Link
              to="/discussions"
              className={`${
                isActive('/discussions')
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-300 hover:bg-blue-800 hover:text-white'
              } block rounded-md px-3 py-2 text-base font-medium flex items-center`}
            >
              <FaComments className="mr-2" /> Discussions
            </Link>
            
            {/* Other Options */}
            <div className="border-t border-blue-800 pt-2 mt-2">
              <div className="px-3 py-2 text-sm font-medium text-blue-400">
                Other Options
              </div>
              
              <Link
                to="/certificates"
                className={`${
                  isActive('/certificates')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                } block rounded-md px-3 py-2 pl-6 text-base font-medium flex items-center`}
              >
                <FaCertificate className="mr-2" /> Certificates
              </Link>
              
              <Link
                to="/feedback"
                className={`${
                  isActive('/feedback')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                } block rounded-md px-3 py-2 pl-6 text-base font-medium flex items-center`}
              >
                <FaCommentDots className="mr-2" /> Feedback
              </Link>
              
              <Link
                to="/contact"
                className={`${
                  isActive('/contact')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                } block rounded-md px-3 py-2 pl-6 text-base font-medium flex items-center`}
              >
                <FaEnvelope className="mr-2" /> Contact Us
              </Link>
              
              <Link
                to="/progress"
                className={`${
                  isActive('/progress')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                } block rounded-md px-3 py-2 pl-6 text-base font-medium flex items-center`}
              >
                <FaChartLine className="mr-2" /> Progress
              </Link>
            </div>
            
            {/* Profile and Logout */}
            <div className="border-t border-blue-800 pt-2 mt-2">
              <Link
                to="/userprofile"
                className={`${
                  isActive('/userprofile')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                } block rounded-md px-3 py-2 text-base font-medium flex items-center`}
              >
                <FaUserCircle className="mr-2" /> My Profile
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left text-blue-300 hover:bg-blue-800 hover:text-white block rounded-md px-3 py-2 text-base font-medium flex items-center"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;