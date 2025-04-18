import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-[#030722] to-[#050A30] text-white">
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Questor</h1>
            <p className="text-blue-200 mb-6">
              Empowering minds through innovative education. Join us on the journey to knowledge and expertise.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-blue-700 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition duration-300">
                <FaFacebookF />
              </a>
              <a href="#" className="bg-blue-700 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition duration-300">
                <FaTwitter />
              </a>
              <a href="#" className="bg-blue-700 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition duration-300">
                <FaInstagram />
              </a>
              <a href="#" className="bg-blue-700 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition duration-300">
                <FaLinkedinIn />
              </a>
              <a href="#" className="bg-blue-700 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition duration-300">
                <FaYoutube />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Courses
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Instructors
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Events
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition duration-300 flex items-center">
                  <FaArrowRight className="mr-2 text-xs" />
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <FaMapMarkerAlt className="text-blue-400 mt-1 mr-3" />
                <span className="text-blue-200">
                  123 Education Street, Knowledge City, 90210, United States
                </span>
              </li>
              <li className="flex items-center">
                <FaPhoneAlt className="text-blue-400 mr-3" />
                <a href="tel:+11234567890" className="text-blue-200 hover:text-white transition duration-300">
                  +1 (123) 456-7890
                </a>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="text-blue-400 mr-3" />
                <a href="mailto:info@questor.edu" className="text-blue-200 hover:text-white transition duration-300">
                  info@questor.edu
                </a>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
              <h4 className="font-bold mb-2">Support Hours</h4>
              <p className="text-blue-200 text-sm">
                Monday - Friday: 8:00 AM - 8:00 PM<br />
                Saturday: 9:00 AM - 5:00 PM<br />
                Sunday: Closed
              </p>
            </div>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-6">Newsletter</h3>
            <p className="text-blue-200 mb-4">
              Subscribe to our newsletter to receive updates on new courses, events, and educational tips.
            </p>
            <form className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 rounded-lg bg-blue-900 bg-opacity-30 border border-blue-800 focus:outline-none focus:border-blue-600 text-white placeholder-blue-300"
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition duration-300"
              >
                Subscribe Now
              </button>
            </form>
            <p className="text-xs text-blue-300 mt-3">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-blue-900">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-300 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Questor. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center space-x-4 text-sm">
              <a href="#" className="text-blue-300 hover:text-white transition duration-300">Terms of Service</a>
              <a href="#" className="text-blue-300 hover:text-white transition duration-300">Privacy Policy</a>
              <a href="#" className="text-blue-300 hover:text-white transition duration-300">Cookie Policy</a>
              <a href="#" className="text-blue-300 hover:text-white transition duration-300">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;