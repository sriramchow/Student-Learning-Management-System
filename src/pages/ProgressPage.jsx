import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FaChartLine, 
  FaPlay, 
  FaCheck, 
  FaClock,
  FaCalendarAlt,
  FaCertificate,
  FaInfoCircle,
  FaTrophy
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProgressPage = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [certificates, setCertificates] = useState([]);
  
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
  
  // Fetch courses and user progress
  useEffect(() => {
    const fetchUserProgress = async () => {
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
        const userProgress = userData.courseProgress || {};
        const userCertificates = userData.certificates || [];
        
        setCertificates(userCertificates);
        setProgress(userProgress);
        
        // Get all courses user has progress in
        const courseIds = Object.keys(userProgress);
        
        if (courseIds.length === 0) {
          setLoading(false);
          return;
        }
        
        // Fetch course details for each course with progress
        const coursesData = [];
        let totalTime = 0;
        let completedCourses = 0;
        
        for (const courseId of courseIds) {
          const courseRef = doc(db, "courses", courseId);
          const courseSnap = await getDoc(courseRef);
          
          if (courseSnap.exists()) {
            const courseData = {
              id: courseSnap.id,
              ...courseSnap.data()
            };
            
            // Calculate course stats
            const stats = calculateCourseStats(courseData, userProgress[courseId]);
            courseData.stats = stats;
            
            // Add to total watch time
            totalTime += stats.totalWatchTime;
            
            // Check if course is completed
            if (stats.isCompleted) {
              completedCourses++;
            }
            
            coursesData.push(courseData);
          }
        }
        
        setCourses(coursesData);
        setTotalWatchTime(totalTime);
        setCompletedCoursesCount(completedCourses);
      } catch (error) {
        console.error("Error fetching user progress:", error);
        toast.error("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProgress();
  }, [db, auth.currentUser, navigate]);
  
  // Calculate statistics for a course
  const calculateCourseStats = (course, courseProgress) => {
    if (!course || !course.sections || !courseProgress) {
      return {
        totalVideos: 0,
        completedVideos: 0,
        progressPercentage: 0,
        lastWatched: null,
        totalWatchTime: 0,
        isCompleted: false
      };
    }
    
    let totalVideos = 0;
    let completedVideos = 0;
    let lastWatched = 0;
    let totalWatchTime = 0;
    
    // Count videos and calculate stats
    course.sections.forEach(section => {
      if (section.videos && section.videos.length > 0) {
        section.videos.forEach(video => {
          totalVideos++;
          
          const videoId = `${section.title}-${video.name}`;
          const videoProgress = courseProgress[videoId];
          
          if (videoProgress) {
            // Check if completed
            if (videoProgress.completed) {
              completedVideos++;
            }
            
            // Calculate watch time
            if (videoProgress.currentTime) {
              totalWatchTime += videoProgress.currentTime;
            }
            
            // Update last watched time
            if (videoProgress.lastWatched && videoProgress.lastWatched > lastWatched) {
              lastWatched = videoProgress.lastWatched;
            }
          }
        });
      }
    });
    
    const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const isCompleted = totalVideos > 0 && completedVideos === totalVideos;
    
    return {
      totalVideos,
      completedVideos,
      progressPercentage,
      lastWatched: lastWatched > 0 ? new Date(lastWatched) : null,
      totalWatchTime,
      isCompleted
    };
  };
  
  // Format time in hours and minutes
  const formatWatchTime = (seconds) => {
    if (!seconds) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} min`;
    }
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'Never';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filter courses based on timeframe
  const getFilteredCourses = () => {
    if (selectedTimeframe === 'all') {
      return courses;
    }
    
    const now = new Date();
    let cutoffDate;
    
    switch (selectedTimeframe) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return courses;
    }
    
    return courses.filter(course => {
      if (!course.stats.lastWatched) return false;
      return course.stats.lastWatched > cutoffDate;
    });
  };
  
  // Navigate to a course
  const viewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };
  
  // View certificates page
  const viewCertificates = () => {
    navigate('/certificates');
  };
  
  // Get filtered courses
  const filteredCourses = getFilteredCourses();
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 mt-20 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Learning Progress</h1>
          
          {certificates.length > 0 && (
            <button
              onClick={viewCertificates}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <FaCertificate className="mr-2" /> View Certificates
            </button>
          )}
        </div>
        
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Courses in Progress */}
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800">
            <div className="flex items-start">
              <div className="bg-blue-700 p-3 rounded-full mr-4">
                <FaPlay className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Courses In Progress</h3>
                <p className="text-3xl font-bold">
                  {courses.length - completedCoursesCount}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  {completedCoursesCount} courses completed
                </p>
              </div>
            </div>
          </div>
          
          {/* Total Watch Time */}
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800">
            <div className="flex items-start">
              <div className="bg-purple-700 p-3 rounded-full mr-4">
                <FaClock className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Total Watch Time</h3>
                <p className="text-3xl font-bold">
                  {formatWatchTime(totalWatchTime)}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  Across {courses.length} courses
                </p>
              </div>
            </div>
          </div>
          
          {/* Achievements */}
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800">
            <div className="flex items-start">
              <div className="bg-yellow-600 p-3 rounded-full mr-4">
                <FaTrophy className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Achievements</h3>
                <p className="text-3xl font-bold">
                  {certificates.length}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  Certificates earned
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time Filter */}
        <div className="flex mb-6">
          <div className="bg-blue-800 rounded-lg p-1 inline-flex">
            <button
              className={`px-4 py-2 rounded-md text-sm ${selectedTimeframe === 'all' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
              onClick={() => setSelectedTimeframe('all')}
            >
              All Time
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${selectedTimeframe === 'week' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
              onClick={() => setSelectedTimeframe('week')}
            >
              This Week
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${selectedTimeframe === 'month' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
              onClick={() => setSelectedTimeframe('month')}
            >
              This Month
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${selectedTimeframe === 'year' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}
              onClick={() => setSelectedTimeframe('year')}
            >
              This Year
            </button>
          </div>
        </div>
        
        {/* Course Progress List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Course Progress Yet</h3>
            <p className="text-blue-300 mb-6">
              You haven't started any courses yet. Explore our course catalog to begin your learning journey.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Activity in This Period</h3>
            <p className="text-blue-300 mb-4">
              You haven't watched any courses during the selected time period.
            </p>
            <button
              onClick={() => setSelectedTimeframe('all')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              View All Progress
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden cursor-pointer hover:bg-blue-800 hover:bg-opacity-30 transition-colors"
                onClick={() => viewCourse(course.id)}
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center">
                    {/* Course Title and Progress */}
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-medium mb-1">{course.title}</h3>
                      <div className="flex items-center text-sm text-blue-300">
                        <span className="mr-4">
                          {course.stats.completedVideos} of {course.stats.totalVideos} videos completed
                        </span>
                        
                        {course.stats.lastWatched && (
                          <span className="flex items-center">
                            <FaCalendarAlt className="mr-1" />
                            Last watched: {formatDate(course.stats.lastWatched)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Course Stats */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{course.stats.progressPercentage}%</div>
                        <div className="text-xs text-blue-300">Complete</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">{formatWatchTime(course.stats.totalWatchTime)}</div>
                        <div className="text-xs text-blue-300">Watch time</div>
                      </div>
                      
                      {course.stats.isCompleted ? (
                        <div className="flex items-center bg-green-800 bg-opacity-50 text-green-300 px-3 py-1 rounded-lg">
                          <FaCheck className="mr-1" /> Completed
                        </div>
                      ) : (
                        <div className="flex items-center bg-blue-800 bg-opacity-50 text-blue-300 px-3 py-1 rounded-lg">
                          <FaPlay className="mr-1" /> In Progress
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="relative w-full h-2 bg-blue-800 rounded-full">
                      <div 
                        className="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
                        style={{ width: `${course.stats.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ProgressPage;