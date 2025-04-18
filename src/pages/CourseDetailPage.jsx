import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  setDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaBookmark, 
  FaRegBookmark, 
  FaChevronDown, 
  FaChevronRight,
  FaCheck,
  FaPlay,
  FaCertificate,
  FaLock
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [progress, setProgress] = useState({});
  const [completedVideos, setCompletedVideos] = useState([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  
  const videoRef = useRef(null);
  const videoTimer = useRef(null);
  
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
  
  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId || !auth.currentUser) return;
      
      try {
        setLoading(true);
        
        // Get course data
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        
        if (!courseSnap.exists()) {
          toast.error("Course not found");
          navigate('/courses');
          return;
        }
        
        const courseData = {
          id: courseSnap.id,
          ...courseSnap.data()
        };
        
        setCourse(courseData);
        
        // Calculate total videos
        let videosCount = 0;
        if (courseData.sections) {
          courseData.sections.forEach(section => {
            if (section.videos) {
              videosCount += section.videos.length;
            }
          });
        }
        setTotalVideos(videosCount);
        
        // Get user data (wishlist and progress)
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Check if course is in wishlist
          if (userData.wishlist && userData.wishlist.includes(courseId)) {
            setIsWishlisted(true);
          }
          
          // Get course progress
          if (userData.courseProgress && userData.courseProgress[courseId]) {
            setProgress(userData.courseProgress[courseId]);
            
            // Count completed videos
            const completedKeys = Object.keys(userData.courseProgress[courseId]).filter(
              key => userData.courseProgress[courseId][key].completed
            );
            setCompletedVideos(completedKeys);
            
            // Check if all videos are completed
            if (completedKeys.length === videosCount && videosCount > 0) {
              setCourseCompleted(true);
              
              // Check if certificate exists
              if (userData.certificates && userData.certificates.some(cert => cert.courseId === courseId)) {
                setCertificateGenerated(true);
              }
            }
          }
        }
        
        // If course has sections, expand the first one by default
        if (courseData.sections && courseData.sections.length > 0) {
          setExpandedSection(0);
          
          // If user has progress, select the last watched video
          if (Object.keys(progress).length > 0) {
            // Find most recently watched video
            let lastWatchedVideo = null;
            let lastWatchedTime = 0;
            
            Object.keys(progress).forEach(videoKey => {
              if (progress[videoKey].lastWatched && progress[videoKey].lastWatched > lastWatchedTime) {
                lastWatchedTime = progress[videoKey].lastWatched;
                lastWatchedVideo = videoKey;
              }
            });
            
            if (lastWatchedVideo) {
              // Find section and video
              for (let i = 0; i < courseData.sections.length; i++) {
                const section = courseData.sections[i];
                for (let j = 0; j < section.videos.length; j++) {
                  const video = section.videos[j];
                  const videoId = `${section.title}-${video.name}`;
                  
                  if (videoId === lastWatchedVideo) {
                    setExpandedSection(i);
                    setSelectedVideo({
                      sectionIndex: i,
                      videoIndex: j,
                      video: video
                    });
                    break;
                  }
                }
              }
            }
          }
          
          // If no video is selected yet, select the first one
          if (!selectedVideo && courseData.sections[0].videos && courseData.sections[0].videos.length > 0) {
            setSelectedVideo({
              sectionIndex: 0,
              videoIndex: 0,
              video: courseData.sections[0].videos[0]
            });
          }
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId, db, auth.currentUser, navigate]);
  
  // Toggle course in wishlist
  const toggleWishlist = async () => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to add courses to wishlist");
      return;
    }
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      if (isWishlisted) {
        // Remove from wishlist
        await updateDoc(userRef, {
          wishlist: arrayRemove(courseId)
        });
        
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        await updateDoc(userRef, {
          wishlist: arrayUnion(courseId)
        });
        
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };
  
  // Toggle section expansion
  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };
  
  // Select video for playback
  const selectVideo = (sectionIndex, videoIndex) => {
    if (!course.sections[sectionIndex].videos[videoIndex]) return;
    
    setSelectedVideo({
      sectionIndex,
      videoIndex,
      video: course.sections[sectionIndex].videos[videoIndex]
    });
    
    // Clear existing timer if any
    if (videoTimer.current) {
      clearInterval(videoTimer.current);
    }
  };
  
  // Extract YouTube video ID from various YouTube URL formats
  const getYoutubeEmbedLink = (url) => {
    if (!url) return '';
    
    // Try to extract the video ID
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Return original link if it's already an embed link or couldn't extract ID
    return url;
  };
  
  // Update video progress in Firebase
  const updateVideoProgress = async (videoId, data) => {
    if (!auth.currentUser || !courseId) return;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Build the update object with nested fields
        const updateData = {
          [`courseProgress.${courseId}.${videoId}`]: {
            ...data,
            lastUpdated: Date.now()
          }
        };
        
        await updateDoc(userRef, updateData);
        
        // Update local state
        setProgress(prev => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            ...data,
            lastUpdated: Date.now()
          }
        }));
        
        // If this video is newly completed, add to completed videos
        if (data.completed && !completedVideos.includes(videoId)) {
          setCompletedVideos(prev => [...prev, videoId]);
          
          // Check if course is now completed
          if (completedVideos.length + 1 === totalVideos) {
            setCourseCompleted(true);
            generateCertificate();
          }
        }
      }
    } catch (error) {
      console.error("Error updating video progress:", error);
      // Don't show toast on every update to avoid spamming
    }
  };
  
  // Handle video ended event
  const handleVideoEnded = () => {
    if (!selectedVideo) return;
    
    const videoId = `${course.sections[selectedVideo.sectionIndex].title}-${selectedVideo.video.name}`;
    
    // Mark as completed
    updateVideoProgress(videoId, {
      completed: true,
      progress: 100,
      lastWatched: Date.now()
    });
    
    // Move to next video if available
    moveToNextVideo();
  };
  
  // Handle video started playing
  const handleVideoPlaying = () => {
    if (!selectedVideo || !videoRef.current) return;
    
    const videoId = `${course.sections[selectedVideo.sectionIndex].title}-${selectedVideo.video.name}`;
    
    // Clear existing timer
    if (videoTimer.current) {
      clearInterval(videoTimer.current);
    }
    
    // Set up progress tracking timer (every 5 seconds)
    videoTimer.current = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.getCurrentTime();
        const duration = videoRef.current.getDuration();
        
        if (duration > 0) {
          const progressPercent = Math.round((currentTime / duration) * 100);
          
          // Update progress in Firebase
          updateVideoProgress(videoId, {
            progress: progressPercent,
            currentTime: currentTime,
            lastWatched: Date.now(),
            // Mark as completed if 95% watched
            completed: progressPercent >= 95
          });
        }
      }
    }, 5000);
  };
  
  // Move to next video in the course
  const moveToNextVideo = () => {
    if (!course || !selectedVideo) return;
    
    const { sectionIndex, videoIndex } = selectedVideo;
    const section = course.sections[sectionIndex];
    
    // Check if there's another video in this section
    if (section.videos.length > videoIndex + 1) {
      selectVideo(sectionIndex, videoIndex + 1);
      return;
    }
    
    // If not, check if there's another section
    if (course.sections.length > sectionIndex + 1) {
      const nextSection = course.sections[sectionIndex + 1];
      if (nextSection.videos && nextSection.videos.length > 0) {
        setExpandedSection(sectionIndex + 1);
        selectVideo(sectionIndex + 1, 0);
        return;
      }
    }
    
    // If no next video, show course completion message
    if (completedVideos.length === totalVideos) {
      toast.success("Congratulations! You've completed the course!");
    }
  };
  
  // Generate certificate
  const generateCertificate = async () => {
    if (!auth.currentUser || !course || certificateGenerated) return;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userName = userData.displayName || auth.currentUser.email;
        
        // Create certificate data
        const certificateData = {
          courseId: courseId,
          courseName: course.title,
          userName: userName,
          userId: auth.currentUser.uid,
          issueDate: new Date(),
          certificateId: `CERT-${courseId.substring(0, 6)}-${Date.now().toString(36)}`
        };
        
        // Add certificate to user's profile
        await updateDoc(userRef, {
          certificates: arrayUnion(certificateData)
        });
        
        // Create entry in certificates collection
        await setDoc(doc(db, "certificates", certificateData.certificateId), {
          ...certificateData,
          createdAt: serverTimestamp()
        });
        
        // Update course completion stats
        const courseRef = doc(db, "courses", courseId);
        await updateDoc(courseRef, {
          completionsCount: increment(1)
        });
        
        setCertificateGenerated(true);
        toast.success("Certificate generated! View it in your certificates page.");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    }
  };
  
  // View certificate
  const viewCertificate = () => {
    navigate('/certificates');
  };
  
  // Check if video is completed
  const isVideoCompleted = (sectionTitle, videoName) => {
    const videoId = `${sectionTitle}-${videoName}`;
    return completedVideos.includes(videoId);
  };
  
  // Calculate course progress percentage
  const calculateProgress = () => {
    return totalVideos > 0 ? Math.round((completedVideos.length / totalVideos) * 100) : 0;
  };
  
  if (loading) {
    return (
      <div className="bg-[#050A30] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="bg-[#050A30] min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
            <h3 className="text-xl text-white font-medium mb-2">Course Not Found</h3>
            <p className="text-blue-300 mb-4">The course you're looking for does not exist or has been removed.</p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="bg-[#050A30] min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button and Course Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <button
              onClick={() => navigate('/courses')}
              className="text-blue-300 hover:text-blue-200 transition-colors mr-4"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleWishlist}
              className="flex items-center text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors"
            >
              {isWishlisted ? (
                <>
                  <FaBookmark className="mr-2 text-yellow-400" /> Wishlisted
                </>
              ) : (
                <>
                  <FaRegBookmark className="mr-2" /> Add to Wishlist
                </>
              )}
            </button>
            
            {courseCompleted && (
              <button
                onClick={viewCertificate}
                className="flex items-center text-sm bg-green-700 hover:bg-green-600 px-3 py-1 rounded-lg transition-colors"
              >
                <FaCertificate className="mr-2" /> View Certificate
              </button>
            )}
          </div>
        </div>
        
        {/* Course Progress */}
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-4 border border-blue-800 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Course Progress</h3>
            <span className="text-blue-300 text-sm">
              {completedVideos.length} of {totalVideos} lessons completed
            </span>
          </div>
          
          <div className="relative w-full h-2 bg-blue-800 rounded-full">
            <div 
              className="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          
          {courseCompleted ? (
            <div className="mt-2 text-center text-green-400 text-sm">
              <FaCheck className="inline mr-1" /> Course Completed!
            </div>
          ) : (
            <div className="mt-2 text-center text-blue-300 text-sm">
              {calculateProgress()}% Complete
            </div>
          )}
        </div>
        
        {/* Course Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    ref={videoRef}
                    className="w-full h-full"
                    src={getYoutubeEmbedLink(selectedVideo.video.link)}
                    title={selectedVideo.video.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onEnded={handleVideoEnded}
                    onPlay={handleVideoPlaying}
                  ></iframe>
                </div>
                
                <div className="p-4">
                  <h3 className="text-xl font-medium mb-2">{selectedVideo.video.name}</h3>
                  <p className="text-blue-300 text-sm">
                    Section: {course.sections[selectedVideo.sectionIndex].title}
                  </p>
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => {
                        const videoId = `${course.sections[selectedVideo.sectionIndex].title}-${selectedVideo.video.name}`;
                        updateVideoProgress(videoId, {
                          completed: true,
                          progress: 100,
                          lastWatched: Date.now()
                        });
                      }}
                      className="text-sm bg-green-700 hover:bg-green-600 px-3 py-1 rounded-lg transition-colors flex items-center"
                    >
                      <FaCheck className="mr-1" /> Mark as Complete
                    </button>
                    
                    <button
                      onClick={moveToNextVideo}
                      className="text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors"
                    >
                      Next Lesson
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800 h-64 flex items-center justify-center">
                <div>
                  <h3 className="text-xl text-white font-medium mb-2">No Video Selected</h3>
                  <p className="text-blue-300">Select a lesson from the course content to start learning.</p>
                </div>
              </div>
            )}
            
            {/* Course Description */}
            {course.description && (
              <div className="bg-blue-900 bg-opacity-20 rounded-xl p-4 border border-blue-800 mt-6">
                <h3 className="font-medium mb-2">About This Course</h3>
                <p className="text-blue-200">{course.description}</p>
              </div>
            )}
          </div>
          
          {/* Course Content - Sections and Videos */}
          <div className="lg:col-span-1">
            <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden">
              <div className="p-4 border-b border-blue-800">
                <h3 className="font-medium">Course Content</h3>
                <p className="text-blue-300 text-sm">
                  {course.sections?.length || 0} sections • {totalVideos} lessons
                </p>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {course.sections && course.sections.length > 0 ? (
                  <div className="divide-y divide-blue-800">
                    {course.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="cursor-pointer">
                        {/* Section Header */}
                        <div 
                          className="p-4 flex justify-between items-center hover:bg-blue-800 hover:bg-opacity-30 transition-colors"
                          onClick={() => toggleSection(sectionIndex)}
                        >
                          <div className="flex items-center">
                            {expandedSection === sectionIndex ? (
                              <FaChevronDown className="text-blue-400 mr-2" />
                            ) : (
                              <FaChevronRight className="text-blue-400 mr-2" />
                            )}
                            <span>{section.title}</span>
                          </div>
                          
                          <span className="text-blue-300 text-sm">
                            {section.videos?.length || 0} lessons
                          </span>
                        </div>
                        
                        {/* Section Videos */}
                        {expandedSection === sectionIndex && section.videos && section.videos.length > 0 && (
                          <div className="pl-8 pr-4 pb-2 bg-blue-800 bg-opacity-20">
                            {section.videos.map((video, videoIndex) => {
                              const isCompleted = isVideoCompleted(section.title, video.name);
                              const isActive = selectedVideo && 
                                selectedVideo.sectionIndex === sectionIndex && 
                                selectedVideo.videoIndex === videoIndex;
                              
                              return (
                                <div 
                                  key={videoIndex}
                                  className={`p-2 rounded-lg my-2 cursor-pointer flex items-center ${
                                    isActive ? 'bg-blue-700' : isCompleted ? 'bg-blue-900 bg-opacity-70' : 'hover:bg-blue-900 hover:bg-opacity-50'
                                  } transition-colors`}
                                  onClick={() => selectVideo(sectionIndex, videoIndex)}
                                >
                                  {isCompleted ? (
                                    <FaCheck className="text-green-400 mr-2" />
                                  ) : isActive ? (
                                    <FaPlay className="text-white mr-2" />
                                  ) : (
                                    <FaPlay className="text-blue-400 mr-2" />
                                  )}
                                  
                                  <span className={`text-sm ${isCompleted ? 'text-green-300' : 'text-white'} flex-1`}>
                                    {video.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-blue-300">
                    No content available for this course.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CourseDetailPage;