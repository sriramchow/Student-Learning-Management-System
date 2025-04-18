import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  arrayRemove
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FaBookmark, 
  FaPlay, 
  FaTrash,
  FaSearch,
  FaInfoCircle
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WishlistPage = () => {
  const [wishlistCourses, setWishlistCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProgress, setUserProgress] = useState({});
  
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();
  
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
  
  // Fetch wishlist courses
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        
        // Get user data
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          toast.error("User profile not found");
          return;
        }
        
        const userData = userSnap.data();
        const wishlist = userData.wishlist || [];
        const progress = userData.courseProgress || {};
        
        setUserProgress(progress);
        
        if (wishlist.length === 0) {
          setLoading(false);
          return;
        }
        
        // Fetch course details for each wishlist item
        const coursesData = [];
        
        for (const courseId of wishlist) {
          const courseRef = doc(db, "courses", courseId);
          const courseSnap = await getDoc(courseRef);
          
          if (courseSnap.exists()) {
            coursesData.push({
              id: courseSnap.id,
              ...courseSnap.data()
            });
          }
        }
        
        setWishlistCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWishlist();
  }, [db, auth.currentUser, navigate]);
  
  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(wishlistCourses);
    } else {
      const filtered = wishlistCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, wishlistCourses]);
  
  // Remove course from wishlist
  const removeFromWishlist = async (courseId) => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // Remove from wishlist in Firestore
      await updateDoc(userRef, {
        wishlist: arrayRemove(courseId)
      });
      
      // Update local state
      setWishlistCourses(prev => prev.filter(course => course.id !== courseId));
      setFilteredCourses(prev => prev.filter(course => course.id !== courseId));
      
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };
  
  // Calculate course progress
  const calculateProgress = (courseId) => {
    if (!userProgress[courseId]) return 0;
    
    const courseProgress = userProgress[courseId];
    const course = wishlistCourses.find(c => c.id === courseId);
    
    if (!course || !course.sections) return 0;
    
    // Count total videos
    let totalVideos = 0;
    let watchedVideos = 0;
    
    course.sections.forEach(section => {
      if (section.videos && section.videos.length > 0) {
        totalVideos += section.videos.length;
        
        // Count watched videos in this section
        section.videos.forEach(video => {
          const videoId = `${section.title}-${video.name}`;
          if (courseProgress[videoId] && courseProgress[videoId].completed) {
            watchedVideos++;
          }
        });
      }
    });
    
    return totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
  };
  
  // View course details
  const viewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 mt-16 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>
        
        {/* Search Box */}
        <div className="relative w-full md:w-64 mb-6">
          <input
            type="text"
            placeholder="Search wishlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
        </div>
        
        {/* Wishlist Courses */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {wishlistCourses.length === 0
                ? "Your Wishlist is Empty"
                : "No Matching Courses"}
            </h3>
            <p className="text-blue-300 mb-6">
              {wishlistCourses.length === 0
                ? "Add courses to your wishlist to save them for later."
                : "Try a different search term to find your saved courses."}
            </p>
            {wishlistCourses.length === 0 && (
              <button
                onClick={() => navigate('/courses')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Browse Courses
              </button>
            )}
            {wishlistCourses.length > 0 && searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Show All Wishlisted Courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              // Calculate progress
              const progress = calculateProgress(course.id);
              
              return (
                <div key={course.id} className="bg-blue-900 bg-opacity-20 rounded-xl overflow-hidden border border-blue-800 shadow-lg transition-transform duration-300 hover:transform hover:scale-105">
                  {/* Course Header with Image */}
                  <div className="relative h-48 bg-blue-800 bg-opacity-50">
                    <img 
                      src={course.imageUrl || `https://source.unsplash.com/random/800x600/?course,${course.title}`} 
                      alt={course.title} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/api/placeholder/400/320";
                      }}
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(course.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-900 bg-opacity-70 rounded-full flex items-center justify-center transition-colors hover:bg-red-700"
                      aria-label="Remove from wishlist"
                    >
                      <FaTrash className="text-white text-sm" />
                    </button>
                    
                    {/* Wishlist Icon */}
                    <div className="absolute top-2 left-2 bg-yellow-400 text-blue-900 px-2 py-1 rounded-lg text-xs font-medium flex items-center">
                      <FaBookmark className="mr-1" /> Wishlisted
                    </div>
                    
                    {/* Progress Indicator (if started) */}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="bg-blue-900 bg-opacity-70 px-3 py-1 text-xs">
                          <div className="relative w-full h-1 bg-blue-700 rounded-full">
                            <div 
                              className="absolute top-0 left-0 h-1 bg-green-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-white text-center mt-1">{progress}% Complete</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                    <p className="text-blue-200 mb-4">
                      {course.description && course.description.length > 120
                        ? `${course.description.substring(0, 120)}...`
                        : course.description || 'No description available'}
                    </p>
                    
                    {/* Course Meta Info */}
                    <div className="flex items-center justify-between text-sm text-blue-300 mb-4">
                      <span>{course.sections?.length || 0} sections</span>
                      <span>{course.createdAt?.toDate?.() ? course.createdAt.toDate().toLocaleDateString() : ''}</span>
                    </div>
                    
                    {/* Course Action */}
                    <button 
                      onClick={() => viewCourse(course.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors w-full flex items-center justify-center"
                    >
                      <FaPlay className="mr-2" />
                      {progress > 0 ? 'Continue Learning' : 'Start Course'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default WishlistPage;