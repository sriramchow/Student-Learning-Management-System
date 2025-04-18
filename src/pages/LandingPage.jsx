import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not authenticated, redirect to login
        navigate('/');
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);
  
  // Fetch featured courses
  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const coursesQuery = query(
          collection(db, "courses"), 
          orderBy("createdAt", "desc"), 
          limit(3)
        );
        
        const snapshot = await getDocs(coursesQuery);
        const coursesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          description: doc.data().description ? 
            (doc.data().description.length > 80 ? 
              doc.data().description.substring(0, 80) + '...' : 
              doc.data().description) : 
            'No description available'
        }));
        
        setFeaturedCourses(coursesList);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedCourses();
  }, [db]);
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 md:py-20  px-4 bg-gradient-to-b from-[#050A30] to-[#0A1045]">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl mt-24 lg:text-6xl font-bold mb-6 text-white">
            Expand Your Knowledge with <span className="text-blue-400">Questor</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-10">
            Access premium courses, track your progress, and connect with other learners. 
            Your journey to mastery starts here.
          </p>
          <button 
            onClick={() => navigate('/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-300"
          >
            Start Learning Now
          </button>
        </div>
      </section>
      
      {/* Featured Courses Section */}
      <section className="py-16 px-4 bg-[#0A1045]">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Featured Courses</h2>
          <p className="text-blue-300 text-center mb-10">Latest courses to boost your skills</p>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-blue-300 text-xl">Loading courses...</div>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center text-blue-300 py-10">
              <p>No courses available yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCourses.map(course => (
                  <div key={course.id} className="bg-blue-900 bg-opacity-20 rounded-xl overflow-hidden border border-blue-800 shadow-lg transition-transform duration-300 hover:transform hover:scale-105">
                    {/* Course Image */}
                    <div className="h-48 bg-blue-800 bg-opacity-50 flex items-center justify-center">
                      <img 
                        src={course.imageUrl || `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKWsT5ug-QSt54m05rfEs1ScK3o7HEN2xLqA&s`} 
                        alt={course.title} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/api/placeholder/400/320";
                        }}
                      />
                    </div>
                    
                    {/* Course Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                      <p className="text-blue-200 mb-4">{course.description}</p>
                      <div className="flex justify-center">
                        <button 
                          onClick={() => navigate('/courses')}
                          className="bg-blue-700 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                          View Course
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-10">
                <button 
                  onClick={() => navigate('/courses')}
                  className="bg-transparent border-2 border-blue-600 hover:bg-blue-600 text-blue-300 hover:text-white py-2 px-6 rounded-lg transition-colors"
                >
                  Explore More Courses
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Services Section */}
      <section className="py-16 px-4 bg-[#050A30]">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Our Services</h2>
          <p className="text-blue-300 text-center mb-10">Tools to enhance your learning experience</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feedback Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Feedback System</h3>
              <p className="text-blue-200 mb-4">
                Share your thoughts and help us improve. Your feedback matters to us!
              </p>
              <button 
                onClick={() => navigate('/feedback')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Submit Feedback →
              </button>
            </div>
            
            {/* Contact Us Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Contact Support</h3>
              <p className="text-blue-200 mb-4">
                Have questions or need help? Our support team is here for you.
              </p>
              <button 
                onClick={() => navigate('/contact')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Get in Touch →
              </button>
            </div>
            
           
            
            {/* Wishlist Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Course Wishlist</h3>
              <p className="text-blue-200 mb-4">
                Save courses you're interested in and revisit them later.
              </p>
              <button 
                onClick={() => navigate('/wishlist')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View Wishlist →
              </button>
            </div>
            
            {/* Progress Tracking Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Progress Tracking</h3>
              <p className="text-blue-200 mb-4">
                Track your learning journey with detailed progress analytics.
              </p>
              <button 
                onClick={() => navigate('/progress')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View Progress →
              </button>
            </div>
            
            {/* Notifications Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Notifications</h3>
              <p className="text-blue-200 mb-4">
                Stay updated with important announcements and course updates.
              </p>
              <button 
                onClick={() => navigate('/notifications')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View Notifications →
              </button>
            </div>
            
            {/* Discussion Forum Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discussion Forum</h3>
              <p className="text-blue-200 mb-4">
                Connect with other learners, ask questions, and share knowledge.
              </p>
              <button 
                onClick={() => navigate('/forum')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Join Discussions →
              </button>
            </div>
            
            {/* Certificate Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Course Certificates</h3>
              <p className="text-blue-200 mb-4">
                Earn certificates upon completing courses to showcase your skills.
              </p>
              <button 
                onClick={() => navigate('/certificates')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View Certificates →
              </button>
            </div>
            
            {/* Resources Card */}
            <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
              <div className="text-blue-400 text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Learning Resources</h3>
              <p className="text-blue-200 mb-4">
                Access additional learning materials, guides, and references.
              </p>
              <button 
                onClick={() => navigate('/resources')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Browse Resources →
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingPage;