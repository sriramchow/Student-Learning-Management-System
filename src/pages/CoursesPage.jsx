import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FaSearch, 
  FaBookmark,
  FaRegBookmark,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBook,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [userWishlist, setUserWishlist] = useState([]);
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
  
  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Get all courses
        const coursesQuery = query(collection(db, "courses"));
        const snapshot = await getDocs(coursesQuery);
        
        const coursesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(0)
        }));
        
        setCourses(coursesList);
        sortCourses(coursesList, sortOption);
        
        // Get user data if authenticated
        if (auth.currentUser) {
          // Fetch user's wishlist
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserWishlist(userData.wishlist || []);
            setUserProgress(userData.courseProgress || {});
          }
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [db, auth.currentUser, sortOption]);
  
  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      sortCourses(courses, sortOption);
    } else {
      const filtered = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      sortCourses(filtered, sortOption);
    }
  }, [searchTerm, courses, sortOption]);
  
  // Sort courses based on selected option
  const sortCourses = (coursesToSort, option) => {
    let sorted = [...coursesToSort];
    
    switch (option) {
      case 'newest':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'a-z':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    
    setFilteredCourses(sorted);
  };
  
  // Toggle course in wishlist
  const toggleWishlist = async (courseId) => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to add courses to wishlist");
      return;
    }
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      if (userWishlist.includes(courseId)) {
        // Remove from wishlist
        await updateDoc(userRef, {
          wishlist: arrayRemove(courseId)
        });
        
        // Update local state
        setUserWishlist(prev => prev.filter(id => id !== courseId));
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        await updateDoc(userRef, {
          wishlist: arrayUnion(courseId)
        });
        
        // Update local state
        setUserWishlist(prev => [...prev, courseId]);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };
  
  // Calculate course progress percentage
  const calculateProgress = (courseId) => {
    if (!userProgress[courseId]) return 0;
    
    const courseProgress = userProgress[courseId];
    const course = courses.find(c => c.id === courseId);
    
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
          <h1 className="text-3xl font-bold">Explore Courses</h1>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4 mb-8">
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300"
            >
              <FaFilter className="mr-2" /> 
              {sortOption === 'newest' && 'Newest First'}
              {sortOption === 'oldest' && 'Oldest First'}
              {sortOption === 'a-z' && 'A to Z'}
              {sortOption === 'z-a' && 'Z to A'}
              {showSortOptions ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
            </button>
            
            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-blue-800 border border-blue-700 rounded-lg shadow-lg z-10">
                <ul className="py-1">
                  <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer flex items-center transition-colors" onClick={() => { setSortOption('newest'); setShowSortOptions(false); }}>
                    <FaSortAmountDown className="mr-2" /> Newest First
                  </li>
                  <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer flex items-center transition-colors" onClick={() => { setSortOption('oldest'); setShowSortOptions(false); }}>
                    <FaSortAmountUp className="mr-2" /> Oldest First
                  </li>
                  <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer flex items-center transition-colors" onClick={() => { setSortOption('a-z'); setShowSortOptions(false); }}>
                    <FaSortAmountDown className="mr-2" /> A to Z
                  </li>
                  <li className="px-4 py-2 hover:bg-blue-700 cursor-pointer flex items-center transition-colors" onClick={() => { setSortOption('z-a'); setShowSortOptions(false); }}>
                    <FaSortAmountUp className="mr-2" /> Z to A
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Course Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <FaBook className="text-4xl text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl text-white font-medium mb-2">No Courses Found</h3>
            <p className="text-blue-300">
              {courses.length === 0
                ? "There are no courses available yet."
                : "No courses match your search criteria. Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              // Calculate progress
              const progress = calculateProgress(course.id);
              const isWishlisted = userWishlist.includes(course.id);
              
              return (
                <div key={course.id} className="bg-blue-900 bg-opacity-20 rounded-xl overflow-hidden border border-blue-800 shadow-lg transition-transform duration-300 hover:transform hover:scale-105">
                  {/* Course Header with Image */}
                  <div className="relative h-48 bg-blue-800 bg-opacity-50">
                    <img 
                      src={course.imageUrl || `https://media.istockphoto.com/id/1460853312/photo/abstract-connected-dots-and-lines-concept-of-ai-technology-motion-of-digital-data-flow.jpg?s=612x612&w=0&k=20&c=bR6oXBoagK2Yagty_At67Dx_wiYRuKJY3hM_ZHCuIxo=`} 
                      alt={course.title} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/api/placeholder/400/320";
                      }}
                    />
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(course.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-blue-900 bg-opacity-70 rounded-full flex items-center justify-center transition-colors hover:bg-blue-700"
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isWishlisted ? (
                        <FaBookmark className="text-yellow-400" />
                      ) : (
                        <FaRegBookmark className="text-white" />
                      )}
                    </button>
                    
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
                      <span>{course.createdAt.toLocaleDateString()}</span>
                    </div>
                    
                    {/* Course Action */}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => viewCourse(course.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors w-full"
                      >
                        {progress > 0 ? 'Continue Learning' : 'Start Course'}
                      </button>
                    </div>
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

export default CoursesPage;