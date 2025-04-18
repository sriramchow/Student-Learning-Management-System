import React, { useState, useEffect } from 'react';
import { FaComments, FaStar, FaPaperPlane, FaSpinner, FaCheck } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  
  // Firebase initialization
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    if (!auth.currentUser && !isAnonymous) {
      navigate('/');
    }
  }, [auth, navigate, isAnonymous]);
  
  // Character counter for feedback text
  useEffect(() => {
    setCharacterCount(feedbackText.length);
  }, [feedbackText]);
  
  // Handle rating hover
  const handleMouseOver = (hoveredRating) => {
    setHoverRating(hoveredRating);
  };
  
  // Handle rating mouse leave
  const handleMouseLeave = () => {
    setHoverRating(0);
  };
  
  // Handle rating click
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };
  
  // Handle feedback type change
  const handleFeedbackTypeChange = (e) => {
    setFeedbackType(e.target.value);
  };
  
  // Handle feedback text change
  const handleFeedbackTextChange = (e) => {
    // Limit to 500 characters
    if (e.target.value.length <= 500) {
      setFeedbackText(e.target.value);
    }
    
    // Keep the focus on the input after state update
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };
  
  // Handle anonymous toggle
  const handleAnonymousToggle = () => {
    setIsAnonymous(!isAnonymous);
  };
  
  // Submit feedback to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    if (feedbackText.trim() === '') {
      toast.error("Please enter your feedback");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare feedback data
      const feedbackData = {
        rating,
        type: feedbackType,
        feedback: feedbackText,
        isAnonymous,
        createdAt: serverTimestamp(),
      };
      
      // Add user info if not anonymous
      if (!isAnonymous && auth.currentUser) {
        feedbackData.userId = auth.currentUser.uid;
        feedbackData.userEmail = auth.currentUser.email;
        feedbackData.userName = auth.currentUser.displayName || '';
      }
      
      // Store in Firestore
      await addDoc(collection(db, "feedback"), feedbackData);
      
      // Show success message
      toast.success("Thank you for your feedback!");
      setSubmitted(true);
      
      // Reset form after delay
      setTimeout(() => {
        setRating(0);
        setFeedbackType('general');
        setFeedbackText('');
        setIsAnonymous(false);
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render star rating component
  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`text-2xl md:text-3xl cursor-pointer transition-colors duration-200 ${
            (hoverRating || rating) >= i
              ? 'text-yellow-400'
              : 'text-gray-400'
          }`}
          onMouseOver={() => handleMouseOver(i)}
          onClick={() => handleRatingClick(i)}
        />
      );
    }
    return (
      <div 
        className="flex space-x-2"
        onMouseLeave={handleMouseLeave}
      >
        {stars}
      </div>
    );
  };
  
  // Feedback types
  const feedbackTypes = [
    { value: 'general', label: 'General Feedback' },
    { value: 'ui', label: 'User Interface' },
    { value: 'courses', label: 'Course Content' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'suggestion', label: 'Feature Suggestion' }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050A30] to-[#0A1045]">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">We Value Your Feedback</h1>
            <p className="text-blue-200 text-lg">
              Help us improve Questor by sharing your thoughts and experiences.
            </p>
          </div>
          
          {/* Feedback Form */}
          <div className="bg-blue-900 bg-opacity-30 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-blue-800 shadow-xl">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-700 bg-opacity-30 rounded-full p-4 mb-4">
                  <FaCheck className="text-green-400 text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Feedback Submitted!</h3>
                <p className="text-blue-200 text-center">
                  Thank you for taking the time to help us improve Questor.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Rating Section */}
                <div className="mb-8">
                  <label className="block text-xl font-semibold text-white mb-4">
                    How would you rate your experience?
                  </label>
                  <div className="flex justify-center">
                    {renderStarRating()}
                  </div>
                </div>
                
                {/* Feedback Type */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-white mb-3">
                    What type of feedback are you providing?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {feedbackTypes.map((type) => (
                      <label 
                        key={type.value}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          feedbackType === type.value
                            ? 'bg-blue-700 text-white'
                            : 'bg-blue-900 bg-opacity-50 text-blue-200 hover:bg-blue-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="feedbackType"
                          value={type.value}
                          checked={feedbackType === type.value}
                          onChange={handleFeedbackTypeChange}
                          className="hidden"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Feedback Text */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-white mb-3">
                    Tell us more about your experience
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={handleFeedbackTextChange}
                    placeholder="Share your thoughts, suggestions, or report an issue..."
                    rows="5"
                    className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-sm ${
                      characterCount > 450 ? (characterCount > 490 ? 'text-red-400' : 'text-yellow-400') : 'text-blue-300'
                    }`}>
                      {characterCount}/500
                    </span>
                  </div>
                </div>
                
                {/* Anonymous Option */}
                <div className="mb-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={handleAnonymousToggle}
                      className="rounded bg-blue-900 border-blue-700 text-blue-500 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    <span className="text-blue-200">Submit feedback anonymously</span>
                  </label>
                  <p className="text-blue-300 text-sm mt-1">
                    {isAnonymous 
                      ? "Your feedback will be submitted without your user information."
                      : "Your name and email will be associated with this feedback."}
                  </p>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || feedbackText.trim() === '' || rating === 0}
                    className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition duration-300 ${
                      isSubmitting || feedbackText.trim() === '' || rating === 0
                        ? 'opacity-70 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="mt-8 text-center text-blue-300">
            <p>
              For urgent matters, please contact our support team directly at <a href="mailto:support@questor.com" className="text-blue-400 hover:text-blue-300 underline">support@questor.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;