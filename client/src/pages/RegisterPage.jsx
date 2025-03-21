import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();
  const auth = getAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Update profile with full name
      await updateProfile(userCredential.user, {
        displayName: formData.fullName
      });
      
      // Success message
      toast.success("Account created successfully!");
      
      // Navigate to login after delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      setLoading(false);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ ...errors, email: 'Email is already in use' });
        toast.error("Email is already in use");
      } else if (error.code === 'auth/weak-password') {
        setErrors({ ...errors, password: 'Password is too weak' });
        toast.error("Password is too weak");
      } else {
        toast.error("Registration failed. Please try again.");
        console.error("Registration error:", error);
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
          <Link to="/">
            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition duration-300">
              Login
            </button>
          </Link>
        </div>
      </div>
      
      <div className="container mt-20 mx-auto px-4">
        <div className="flex flex-col md:flex-row rounded-xl max-w-7xl mx-auto">
          
          {/* Left Section - Information */}
          <div className="md:w-1/3 mt-4 p-8 md:p-12">
            <h1 className="text-5xl font-bold text-white mb-6">Join Questor Today</h1>
            <p className="text-blue-200 mb-4 text-4xl">
              Begin Your Learning Adventure
            </p>
            
            <div className="mt-24">
              <p className="text-blue-300 text-sm">Already a member?</p>
              <Link to="/" className="text-white underline hover:text-blue-200 transition duration-300">
                Sign in to your account
              </Link>
            </div>
          </div>
          
          {/* Gap between sections */}
          <div className="md:w-4"></div>
          
          {/* Middle Section - Image */}
          <div className="md:w-1/3 flex items-center justify-center p-8 mb-20 md:p-12">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Using a placeholder instead of external URL */}
              <div className="w-full h-80 bg-blue-800 bg-opacity-30 rounded-xl flex items-center justify-center">
                <span className="text-blue-200 text-lg">Register Illustration</span>
              </div>
              <div className="absolute bottom-0 w-full text-center pb-4">
                <p className="text-blue-200 text-lg font-light italic">
                  "Learning is a journey, not a destination"
                </p>
              </div>
            </div>
          </div>
          
          {/* Gap between sections */}
          <div className="md:w-4"></div>
          
          {/* Right Section - Registration Form */}
          <div className="md:w-1/3 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Create Your Account</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={`w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border ${errors.fullName ? 'border-red-500' : 'border-blue-800'} focus:outline-none focus:border-blue-500 text-white placeholder-blue-300`}
                  required
                />
                {errors.fullName && <p className="mt-1 text-red-400 text-xs">{errors.fullName}</p>}
              </div>
              
              <div className="mb-6">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your Email"
                  className={`w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border ${errors.email ? 'border-red-500' : 'border-blue-800'} focus:outline-none focus:border-blue-500 text-white placeholder-blue-300`}
                  required
                />
                {errors.email && <p className="mt-1 text-red-400 text-xs">{errors.email}</p>}
              </div>
              
              <div className="mb-6">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border ${errors.password ? 'border-red-500' : 'border-blue-800'} focus:outline-none focus:border-blue-500 text-white placeholder-blue-300`}
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
                {errors.password && <p className="mt-1 text-red-400 text-xs">{errors.password}</p>}
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className={`w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border ${errors.confirmPassword ? 'border-red-500' : 'border-blue-800'} focus:outline-none focus:border-blue-500 text-white placeholder-blue-300`}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-red-400 text-xs">{errors.confirmPassword}</p>}
              </div>
              
              <div className="mb-6">
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 mt-1 text-blue-600 bg-blue-900 border-blue-800 rounded"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-blue-200">
                    I agree to the <a href="#" className="text-white underline">Terms of Service</a> and <a href="#" className="text-white underline">Privacy Policy</a>
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 text-white font-medium rounded-lg py-3 px-4 transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-blue-200 text-xs">
                By creating an account, you acknowledge that you have read and understood our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;