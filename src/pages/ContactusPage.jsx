import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaSpinner, FaCheck } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContactusPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  
  // Firebase initialization
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  
  // Check if user is logged in and pre-fill form data if available
  useEffect(() => {
    if (auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        name: auth.currentUser.displayName || '',
        email: auth.currentUser.email || ''
      }));
    }
  }, [auth]);
  
  // Character counter for message text
  useEffect(() => {
    setCharacterCount(formData.message.length);
  }, [formData.message]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For message field, limit to 1000 characters
    if (name === 'message' && value.length > 1000) {
      return;
    }
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare contact data
      const contactData = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        createdAt: serverTimestamp(),
        status: 'new' // For tracking if it's been responded to
      };
      
      // Add user info if logged in
      if (auth.currentUser) {
        contactData.userId = auth.currentUser.uid;
        contactData.userLoggedIn = true;
      } else {
        contactData.userLoggedIn = false;
      }
      
      // Store in Firestore
      await addDoc(collection(db, "contactMessages"), contactData);
      
      // Show success message
      toast.success("Your message has been sent successfully!");
      setSubmitted(true);
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({
          name: auth.currentUser ? auth.currentUser.displayName || '' : '',
          email: auth.currentUser ? auth.currentUser.email || '' : '',
          subject: '',
          message: ''
        });
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050A30] to-[#0A1045]">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Have questions about Questor or need assistance? We're here to help! 
              Reach out to us using any of the methods below or fill out the contact form.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-blue-900 bg-opacity-30 rounded-xl p-8 border border-blue-800 shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Email Us</h3>
              <p className="text-blue-300 mb-4">Our team is ready to help with any questions</p>
              <a href="mailto:support@questor.edu" className="text-blue-400 hover:text-blue-300 transition-colors">
                support@questor.edu
              </a>
            </div>
            
            <div className="bg-blue-900 bg-opacity-30 rounded-xl p-8 border border-blue-800 shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
                <FaPhone className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Call Us</h3>
              <p className="text-blue-300 mb-4">Mon-Fri from 9am to 5pm (EST)</p>
              <a href="tel:+1-555-123-4567" className="text-blue-400 hover:text-blue-300 transition-colors">
                +1 (555) 123-4567
              </a>
            </div>
            
            <div className="bg-blue-900 bg-opacity-30 rounded-xl p-8 border border-blue-800 shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Visit Us</h3>
              <p className="text-blue-300 mb-4">Our headquarters are open for scheduled visits</p>
              <address className="text-blue-400 not-italic">
                123 Learning Street<br />
                Education City, ED 10001
              </address>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-900 bg-opacity-30 rounded-xl p-8 border border-blue-800 shadow-xl">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-green-700 bg-opacity-30 rounded-full p-4 mb-4">
                    <FaCheck className="text-green-400 text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-blue-200 text-center">
                    Thank you for reaching out to us. We'll get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-white mb-6">Send Us a Message</h2>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-blue-300 mb-2">Your Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-blue-300 mb-2">Your Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="subject" className="block text-blue-300 mb-2">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label htmlFor="message" className="block text-blue-300 mb-2">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                    
                    <div className="flex justify-end mb-6">
                      <span className={`text-sm ${
                        characterCount > 900 ? (characterCount > 980 ? 'text-red-400' : 'text-yellow-400') : 'text-blue-300'
                      }`}>
                        {characterCount}/1000
                      </span>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300 ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" /> 
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="mr-2" /> 
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-[#050A30] py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Find quick answers to common questions about Questor's services and platform.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="bg-blue-900 bg-opacity-30 rounded-xl p-6 border border-blue-800">
                <h3 className="text-xl font-semibold text-white mb-2">How do I reset my password?</h3>
                <p className="text-blue-300">
                  You can reset your password by clicking the "Forgot Password" link on the login page. 
                  We'll send you an email with instructions to create a new password.
                </p>
              </div>
              
              <div className="bg-blue-900 bg-opacity-30 rounded-xl p-6 border border-blue-800">
                <h3 className="text-xl font-semibold text-white mb-2">Are there any free courses available?</h3>
                <p className="text-blue-300">
                  Yes! We offer several free introductory courses to help you get started with various subjects. 
                  Check our course catalog and look for the "Free" label.
                </p>
              </div>
              
              <div className="bg-blue-900 bg-opacity-30 rounded-xl p-6 border border-blue-800">
                <h3 className="text-xl font-semibold text-white mb-2">How can I get a certificate for completed courses?</h3>
                <p className="text-blue-300">
                  Certificates are automatically generated once you complete all required modules and pass the final assessment. 
                  You can download your certificates from your profile page.
                </p>
              </div>
              
              <div className="bg-blue-900 bg-opacity-30 rounded-xl p-6 border border-blue-800">
                <h3 className="text-xl font-semibold text-white mb-2">What payment methods do you accept?</h3>
                <p className="text-blue-300">
                  We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. 
                  For corporate accounts, we also offer invoice-based payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactusPage;