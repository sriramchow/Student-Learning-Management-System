import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    
    // Keep the focus on the input after state update
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    
    // Keep the focus on the input after state update
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user document from Firestore to check if user is active/disabled
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Check if user is disabled (isActive is false)
        if (userData.isActive === false) {
          // Sign out the user if they're disabled
          await auth.signOut();
          toast.error("Your account has been disabled. Please contact support.");
          setLoading(false);
          return;
        }
      }
      
      // Check if the user is an admin
      if (email === 'admin@questor.com') {
        // Check admin role in Firestore
        if (userSnap.exists() && userSnap.data().isAdmin) {
          // Admin login success
          toast.success("Admin login successful!");
          
          // Delayed navigation to admin dashboard
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 1500);
        } else {
          // User is not an admin in Firestore
          toast.success("Login successful!");
          
          // Delayed navigation to regular home
          setTimeout(() => {
            navigate('/home');
          }, 1500);
        }
      } else {
        // Regular user login success
        toast.success("Login successful!");
        
        // Delayed navigation to give toast time to display
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      }
      
    } catch (error) {
      setLoading(false);
      
      // Error handling
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Invalid email or password");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many failed login attempts. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again.");
        console.error("Login error:", error);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-[#050A30] relative pt-24">
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Floating Navbar */}
      <div className="absolute top-8 left-0 right-0 mx-auto max-w-7xl">
        <div className="bg-blue-900 bg-opacity-30 rounded-xl shadow-lg px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Questor</h1>
          <Link to="/register">
            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition duration-300">
              Register
            </button>
          </Link>
        </div>
      </div>
      
      <div className="container mt-20 mx-auto px-4">
        <div className="flex flex-col md:flex-row rounded-xl max-w-7xl mx-auto">
          
          {/* Left Section - Information */}
          <div className="md:w-1/3 mt-4 p-8 md:p-12">
            <h1 className="text-5xl font-bold text-white mb-6">Welcome to Questor</h1>
            <p className="text-blue-200 mb-4 text-3xl">
              Start Your Journey to Expertise
            </p>
            
            <div className="mt-20">
              <p className="text-blue-300 text-sm">New to Questor?</p>
              <Link to="/register" className="text-white underline hover:text-blue-200 transition duration-300">
                Discover how we can help you learn
              </Link>
            </div>
          </div>
          
          {/* Gap between sections */}
          <div className="md:w-4"></div>
          
          {/* Middle Section - Image */}
          <div className="md:w-1/3 flex items-center justify-center p-8 mb-2 md:p-12">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Using a placeholder image instead of external URL */}
              <div className="w-full h-80 bg-blue-800 bg-opacity-30 rounded-xl flex items-center justify-center">
                <span className="text-blue-200 text-lg">Learning Illustration</span>
              </div>
              <div className="absolute bottom-0 w-full text-center pb-4">
                <p className="text-blue-200 text-lg font-light italic">
                  "Education is the passport to the future"
                </p>
              </div>
            </div>
          </div>
          
          {/* Gap between sections */}
          <div className="md:w-4"></div>
          
          {/* Right Section - Login Form */}
          <div className="md:w-1/3 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Questor Login</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-blue-200 text-sm font-medium mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border border-blue-800 focus:outline-none focus:border-blue-500 text-white placeholder-blue-300"
                  required
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-blue-200 text-sm font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border border-blue-800 focus:outline-none focus:border-blue-500 text-white placeholder-blue-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 bg-blue-900 border-blue-800 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-blue-200">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-blue-300 hover:text-white">
                    Forgot password?
                  </a>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 text-white font-medium rounded-lg py-3 px-4 transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-blue-200">
                Don't have an account?{" "}
                <Link to="/register" className="text-white hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;