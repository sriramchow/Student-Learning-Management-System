import React, { useState, useEffect } from 'react';
import { 
  FaBook, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaSearch, 
  FaSave, 
  FaVideo, 
  FaList,
  FaChevronDown,
  FaChevronRight,
  FaYoutube,
  FaTimes
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';

const CoursesContent = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  
  // For new course creation/editing
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    sections: []
  });
  
  const db = getFirestore();
  
  // Fetch courses from database
  useEffect(() => {
    fetchCourses();
  }, []);
  
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(coursesQuery);
      
      const coursesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || 'Unknown'
      }));
      
      setCourses(coursesList);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };
  
  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Add a new section to the course being created/edited
  const addSection = () => {
    setCourseData(prevData => ({
      ...prevData,
      sections: [
        ...prevData.sections, 
        { 
          title: `Section ${prevData.sections.length + 1}`, 
          videos: [] 
        }
      ]
    }));
  };
  
  // Remove a section
  const removeSection = (sectionIndex) => {
    setCourseData(prevData => ({
      ...prevData,
      sections: prevData.sections.filter((_, index) => index !== sectionIndex)
    }));
  };
  
  // Update section title
  const updateSectionTitle = (sectionIndex, newTitle) => {
    setCourseData(prevData => {
      const updatedSections = [...prevData.sections];
      updatedSections[sectionIndex].title = newTitle;
      return {
        ...prevData,
        sections: updatedSections
      };
    });
  };
  
  // Add a video to a section
  const addVideo = (sectionIndex) => {
    setCourseData(prevData => {
      const updatedSections = [...prevData.sections];
      updatedSections[sectionIndex].videos.push({
        name: '',
        link: ''
      });
      return {
        ...prevData,
        sections: updatedSections
      };
    });
  };
  
  // Remove a video from a section
  const removeVideo = (sectionIndex, videoIndex) => {
    setCourseData(prevData => {
      const updatedSections = [...prevData.sections];
      updatedSections[sectionIndex].videos = updatedSections[sectionIndex].videos.filter((_, idx) => idx !== videoIndex);
      return {
        ...prevData,
        sections: updatedSections
      };
    });
  };
  
  // Update video details
  const updateVideo = (sectionIndex, videoIndex, field, value) => {
    setCourseData(prevData => {
      const updatedSections = [...prevData.sections];
      updatedSections[sectionIndex].videos[videoIndex][field] = value;
      return {
        ...prevData,
        sections: updatedSections
      };
    });
  };
  
  // Reset form
  const resetForm = () => {
    setCourseData({
      title: '',
      description: '',
      sections: []
    });
    setEditingCourse(null);
  };
  
  // Open form to create a new course
  const handleAddCourse = () => {
    resetForm();
    setShowCourseForm(true);
  };
  
  // Open form to edit an existing course
  const handleEditCourse = (course) => {
    setCourseData({
      title: course.title,
      description: course.description,
      sections: course.sections || []
    });
    setEditingCourse(course.id);
    setShowCourseForm(true);
  };
  
  // Delete a course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };
  
  // Save course (create new or update existing)
  const saveCourse = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!courseData.title.trim()) {
      toast.error("Course title is required");
      return;
    }
    
    // Check if sections and videos have titles/links
    let isValid = true;
    courseData.sections.forEach((section, sIndex) => {
      if (!section.title.trim()) {
        toast.error(`Section ${sIndex + 1} must have a title`);
        isValid = false;
      }
      
      section.videos.forEach((video, vIndex) => {
        if (!video.name.trim()) {
          toast.error(`Video ${vIndex + 1} in Section ${sIndex + 1} must have a name`);
          isValid = false;
        }
        if (!video.link.trim()) {
          toast.error(`Video ${vIndex + 1} in Section ${sIndex + 1} must have a YouTube link`);
          isValid = false;
        }
      });
    });
    
    if (!isValid) return;
    
    try {
      const courseDataToSave = {
        ...courseData,
        updatedAt: serverTimestamp()
      };
      
      if (editingCourse) {
        // Update existing course
        await updateDoc(doc(db, "courses", editingCourse), courseDataToSave);
        toast.success("Course updated successfully");
      } else {
        // Create new course
        courseDataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, "courses"), courseDataToSave);
        toast.success("Course created successfully");
      }
      
      // Reset and close form
      resetForm();
      setShowCourseForm(false);
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    }
  };
  
  // Toggle expand/collapse course details
  const toggleExpandCourse = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading courses...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
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
        
        <button
          onClick={handleAddCourse}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-300"
        >
          <FaPlus className="mr-2" /> Add New Course
        </button>
      </div>
      
      {/* Course Form */}
      {showCourseForm && (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-6 border border-blue-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h3>
            <button
              onClick={() => {
                setShowCourseForm(false);
                resetForm();
              }}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={saveCourse}>
            <div className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-blue-300 mb-2">Course Title</label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  placeholder="Enter course title"
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Course Description */}
              <div>
                <label className="block text-blue-300 mb-2">Course Description</label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                  placeholder="Enter course description"
                  rows="4"
                  className="w-full bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Sections */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-blue-300">Course Sections</label>
                  <button
                    type="button"
                    onClick={addSection}
                    className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center transition duration-300"
                  >
                    <FaPlus className="mr-1" /> Add Section
                  </button>
                </div>
                
                {courseData.sections.length === 0 ? (
                  <div className="bg-blue-900 bg-opacity-40 rounded-lg p-4 text-center text-blue-300">
                    No sections added yet. Click "Add Section" to create course content.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseData.sections.map((section, sectionIndex) => (
                      <div 
                        key={sectionIndex} 
                        className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-800"
                      >
                        <div className="flex justify-between items-center mb-4">
                          {/* Section Title */}
                          <div className="flex-1 mr-4">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                              placeholder="Section Title"
                              className="w-full bg-blue-800 bg-opacity-50 border border-blue-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* Section Actions */}
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => addVideo(sectionIndex)}
                              className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center transition duration-300"
                            >
                              <FaVideo className="mr-1" /> Add Video
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSection(sectionIndex)}
                              className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center transition duration-300"
                            >
                              <FaTrash className="mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                        
                        {/* Videos */}
                        <div className="space-y-3 pl-4 border-l-2 border-blue-700">
                          {section.videos.length === 0 ? (
                            <div className="text-sm text-blue-300 py-2">
                              No videos in this section. Click "Add Video" to add content.
                            </div>
                          ) : (
                            section.videos.map((video, videoIndex) => (
                              <div 
                                key={videoIndex} 
                                className="bg-blue-800 bg-opacity-40 rounded-lg p-3 border border-blue-700"
                              >
                                <div className="flex flex-col space-y-3">
                                  {/* Video Name */}
                                  <div className="flex space-x-2">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={video.name}
                                        onChange={(e) => updateVideo(sectionIndex, videoIndex, 'name', e.target.value)}
                                        placeholder="Video Title"
                                        className="w-full bg-blue-900 bg-opacity-60 border border-blue-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeVideo(sectionIndex, videoIndex)}
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                  
                                  {/* Video Link */}
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1">
                                      <div className="flex">
                                        <div className="bg-blue-700 rounded-l px-2 py-1 flex items-center">
                                          <FaYoutube className="text-red-500" />
                                        </div>
                                        <input
                                          type="text"
                                          value={video.link}
                                          onChange={(e) => updateVideo(sectionIndex, videoIndex, 'link', e.target.value)}
                                          placeholder="YouTube Link (embed or normal URL)"
                                          className="flex-1 bg-blue-900 bg-opacity-60 border border-blue-600 rounded-r px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-blue-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-blue-900 text-blue-300 rounded-lg hover:bg-blue-800 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition duration-300 flex items-center"
                >
                  <FaSave className="mr-2" /> 
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Display Courses */}
      {filteredCourses.length === 0 ? (
        <div className="bg-blue-900 bg-opacity-20 rounded-xl p-8 text-center border border-blue-800">
          <FaBook className="text-4xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">No Courses Found</h3>
          <p className="text-blue-300">
            {courses.length === 0
              ? "You haven't created any courses yet. Click the 'Add New Course' button to get started."
              : "No courses match your search criteria. Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map(course => (
            <div 
              key={course.id} 
              className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 overflow-hidden"
            >
              {/* Course Header */}
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpandCourse(course.id)}
              >
                <div className="flex items-center">
                  <div className="bg-blue-700 p-2 rounded-lg mr-3">
                    <FaBook className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{course.title}</h3>
                    <p className="text-blue-300 text-sm">
                      {course.sections?.length || 0} section{course.sections?.length !== 1 ? 's' : ''} • 
                      Created: {course.createdAt}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCourse(course);
                    }}
                    className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(course.id);
                    }}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                  >
                    <FaTrash />
                  </button>
                  {/* Expand/Collapse */}
                  {expandedCourse === course.id ? (
                    <FaChevronDown className="text-blue-300" />
                  ) : (
                    <FaChevronRight className="text-blue-300" />
                  )}
                </div>
              </div>
              
              {/* Course Details (expanded view) */}
              {expandedCourse === course.id && (
                <div className="px-4 pb-4 border-t border-blue-800 pt-4">
                  {/* Description */}
                  {course.description && (
                    <div className="mb-4">
                      <h4 className="text-blue-300 text-sm mb-1">Description:</h4>
                      <p className="text-white bg-blue-800 bg-opacity-30 p-3 rounded-lg">{course.description}</p>
                    </div>
                  )}
                  
                  {/* Sections & Videos */}
                  <div className="space-y-4">
                    <h4 className="text-blue-300 font-medium flex items-center">
                      <FaList className="mr-2" /> Course Content
                    </h4>
                    
                    {!course.sections || course.sections.length === 0 ? (
                      <p className="text-blue-400 italic">No sections in this course</p>
                    ) : (
                      <div className="space-y-3">
                        {course.sections.map((section, sIndex) => (
                          <div key={sIndex} className="bg-blue-800 bg-opacity-30 rounded-lg p-3 border border-blue-700">
                            <h5 className="text-white font-medium mb-2">{section.title}</h5>
                            
                            {!section.videos || section.videos.length === 0 ? (
                              <p className="text-blue-400 text-sm italic pl-4">No videos in this section</p>
                            ) : (
                              <div className="space-y-2 pl-4">
                                {section.videos.map((video, vIndex) => (
                                  <div key={vIndex} className="border-l-2 border-blue-700 pl-3">
                                    <h6 className="text-white text-sm">{video.name}</h6>
                                    <div className="mt-2 aspect-video max-w-2xl">
                                      <iframe
                                        className="w-full h-full rounded-lg border border-blue-600"
                                        src={getYoutubeEmbedLink(video.link)}
                                        title={video.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesContent;