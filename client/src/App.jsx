// import React, { useEffect, useState } from 'react';
// import { Route, Routes, Navigate, useLocation } from "react-router-dom";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import LandingPage from './pages/LandingPage';
// import PayementPage from './pages/PayementPage';
// import ProfilePage from './pages/UserProfile';
// import CoursesPage from './pages/CoursesPage';
// import ChatwithAi from "./pages/ChatwithAi"
// import ContactusPage from './pages/ContactusPage';
// import { ToastContainer } from 'react-toastify';
// import firebaseApp from "../firebase"
// import 'react-toastify/dist/ReactToastify.css';
// import FeedbackPage from './pages/FeedbackPage';

// // Protected Route Component
// const ProtectedRoute = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const location = useLocation();
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, [auth]);

//   if (loading) {
//     // You could return a loading spinner here
//     return (
//       <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
//         <div className="text-white text-xl">Loading...</div>
//       </div>
//     );
//   }

//   if (!user) {
//     // Redirect to login if not authenticated
//     return <Navigate to="/" state={{ from: location }} replace />;
//   }

//   return children;
// };

// // Auth Route - redirects to home if already logged in
// const AuthRoute = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, [auth]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
//         <div className="text-white text-xl">Loading...</div>
//       </div>
//     );
//   }

//   if (user) {
//     // Redirect to home if already authenticated
//     return <Navigate to="/home" replace />;
//   }

//   return children;
// };

// const App = () => {
//   return (
//     <div>
//       {/* Global Toast Container */}
//       <ToastContainer position="top-right" autoClose={3000} />
      
//       <Routes>
//         {/* Public Routes */}
//         <Route 
//           path="/" 
//           element={
//             <AuthRoute>
//               <LoginPage />
//             </AuthRoute>
//           } 
//         />
//         <Route 
//           path="/register" 
//           element={
//             <AuthRoute>
//               <RegisterPage />
//             </AuthRoute>
//           } 
//         />

//         {/* Protected Routes */}
//         <Route 
//           path="/home" 
//           element={
//             <ProtectedRoute>
//               <LandingPage />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/payment" 
//           element={
//             <ProtectedRoute>
//               <PayementPage />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/userprofile" 
//           element={
//             <ProtectedRoute>
//               <ProfilePage />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/courses" 
//           element={
//             <ProtectedRoute>
//               <CoursesPage />
//             </ProtectedRoute>
//           } 
//         />
        
//         <Route 
//           path="/chatwithai" 
//           element={
//             <ProtectedRoute>
//               <ChatwithAi />
//             </ProtectedRoute>
//           } 
//         />

//         <Route 
//           path="/feedback" 
//           element={
//             <ProtectedRoute>
//               <FeedbackPage />
//             </ProtectedRoute>
//           } 
//         />
        

//         <Route 
//           path="/contact" 
//           element={
//             <ProtectedRoute>
//               <ContactusPage />
//             </ProtectedRoute>
//           } 
//         />

//         {/* Fallback route for unknown paths */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </div>
//   );
// };

// export default App;




import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import PayementPage from './pages/PayementPage';
import ProfilePage from './pages/UserProfile';
import CoursesPage from './pages/CoursesPage';
import ChatwithAi from "./pages/ChatwithAi";
import ContactusPage from './pages/ContactusPage';
import FeedbackPage from './pages/FeedbackPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



// Protected Route Component for regular users
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }, (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Auth initialization error:", error);
      setLoading(false);
    }
  }, [auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A30] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Component
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
        if (currentUser.email === 'admin@questor.com') {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().isAdmin) {
            setIsAdmin(true);
          }
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
      }, (error) => {
        console.error("Auth state change error:", error);
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
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Redirect to home if not an admin
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Route - redirects to home if already logged in
const AuthRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
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
        if (currentUser.email === 'admin@questor.com') {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().isAdmin) {
            setIsAdmin(true);
          }
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
      }, (error) => {
        console.error("Auth state change error:", error);
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

        {/* Protected Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <ProtectedRoute>
              <PayementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/userprofile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chatwithai" 
          element={
            <ProtectedRoute>
              <ChatwithAi />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/feedback" 
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contact" 
          element={
            <ProtectedRoute>
              <ContactusPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback route for unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;