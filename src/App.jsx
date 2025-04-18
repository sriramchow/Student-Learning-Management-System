import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/UserProfile';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ProgressPage from './pages/ProgressPage';
import CertificatesPage from './pages/CertificatesPage';
import WishlistPage from './pages/WishlistPage';
import ContactusPage from './pages/ContactusPage';
import FeedbackPage from './pages/FeedbackPage';
import DiscussionsPage from './pages/DiscussionsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/markdownStyles.css'; // Import markdown styles for the chatbot

// Import QuestorBot components
import QuestorBot from './components/QuestorBot';
import ChatButton from './components/ChatButton';

// Protected Route Component for regular users - redirects admins to admin dashboard
const UserRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          // Not logged in, redirect to login
          setLoading(false);
          return;
        }
        
        // Check if user is an admin
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().isAdmin === true) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
        
        setUser(currentUser);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Auth initialization error:", error);
      setLoading(false);
    }
  }, [auth, db]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    // Admin trying to access user route, redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Admin Route Component - redirects regular users to home page
const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const checkAdminStatus = async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has admin privileges
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().isAdmin === true) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    };

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        checkAdminStatus(currentUser);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Auth initialization error:", error);
      setLoading(false);
    }
  }, [auth, db]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Not an admin, redirect to user home
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Route - redirects to appropriate dashboard if already logged in
const AuthRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const checkUserStatus = async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is an admin
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().isAdmin === true) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      } finally {
        setLoading(false);
      }
    };

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        checkUserStatus(currentUser);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Auth initialization error:", error);
      setLoading(false);
    }
  }, [auth, db]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Redirect based on user role
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
};

const App = () => {
  // State for QuestorBot
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsUserLoggedIn(!!user);
      
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().isAdmin === true) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    
    return () => unsubscribe();
  }, [auth, db]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div>
      {/* Global Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/:tab" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        {/* User Routes */}
        <Route 
          path="/home" 
          element={
            <UserRoute>
              <LandingPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/userprofile" 
          element={
            <UserRoute>
              <ProfilePage />
            </UserRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <UserRoute>
              <CoursesPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/course/:courseId" 
          element={
            <UserRoute>
              <CourseDetailPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/progress" 
          element={
            <UserRoute>
              <ProgressPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/certificates" 
          element={
            <UserRoute>
              <CertificatesPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <UserRoute>
              <WishlistPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/discussions" 
          element={
            <UserRoute>
              <DiscussionsPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <UserRoute>
              <NotificationsPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <UserRoute>
              <FeedbackPage />
            </UserRoute>
          } 
        />
        <Route 
          path="/contact" 
          element={
            <UserRoute>
              <ContactusPage />
            </UserRoute>
          } 
        />

        {/* Fallback route for unknown paths */}
        <Route 
          path="*" 
          element={
            isUserLoggedIn ? 
              (isAdmin ? 
                <Navigate to="/admin/dashboard" replace /> : 
                <Navigate to="/home" replace />) : 
              <Navigate to="/" replace />
          } 
        />
      </Routes>

      {/* QuestorBot Integration - visible only for regular users, not on admin pages */}
      {isUserLoggedIn && !isAdmin && !isChatOpen && <ChatButton onClick={toggleChat} />}
      {isUserLoggedIn && !isAdmin && <QuestorBot isOpen={isChatOpen} onClose={toggleChat} />}
    </div>
  );
};

export default App;