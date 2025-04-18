import React, { useState, useRef, useEffect } from 'react';
import { FaStar, FaUsers, FaClock, FaChevronLeft, FaChevronRight, FaBookmark } from 'react-icons/fa';

const PopularCourses = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  
  const courses = [
    {
      id: 1,
      title: "Advanced Web Development Masterclass",
      instructor: "Dr. Sarah Johnson",
      rating: 4.9,
      students: 3845,
      duration: "24 hours",
      level: "Intermediate",
      price: "$89.99",
      image: "https://img.freepik.com/free-vector/website-development-banner_33099-1687.jpg"
    },
    {
      id: 2,
      title: "Machine Learning Fundamentals",
      instructor: "Prof. Michael Chen",
      rating: 4.8,
      students: 2974,
      duration: "32 hours",
      level: "Advanced",
      price: "$129.99",
      image: "https://media.istockphoto.com/id/1273072739/vector/machine-learning-banner-logo-for-technology-ai-big-data-algorithm-neural-network-deep.jpg?s=170667a&w=0&k=20&c=Ts1g-ZmfulPB5yyd-MjhbGnp8O1OlktclyFFZRiZKjg="
    },
    {
      id: 3,
      title: "Block Chain ",
      instructor: "Elizabeth Taylor",
      rating: 4.7,
      students: 1823,
      duration: "18 hours",
      level: "Beginner",
      price: "$69.99",
      image: "https://www.shutterstock.com/image-vector/block-chain-crypto-currency-blockchain-260nw-1080554171.jpg"
    },
    {
      id: 4,
      title: "Digital Marketing Excellence",
      instructor: "Alex Rodriguez",
      rating: 4.9,
      students: 4210,
      duration: "20 hours",
      level: "Intermediate",
      price: "$79.99",
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      title: "Data Science & Analytics",
      instructor: "Dr. Maya Patel",
      rating: 4.8,
      students: 3156,
      duration: "28 hours",
      level: "Advanced",
      price: "$99.99",
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      title: "Graphic Design Principles",
      instructor: "James Wilson",
      rating: 4.6,
      students: 2845,
      duration: "22 hours",
      level: "Beginner",
      price: "$59.99",
      image: "/api/placeholder/400/250"
    }
  ];

  const nextSlide = () => {
    if (carouselRef.current) {
      const maxIndex = Math.max(0, courses.length - getVisibleSlides());
      setCurrentIndex(prevIndex => Math.min(prevIndex + 1, maxIndex));
    }
  };

  const prevSlide = () => {
    if (carouselRef.current) {
      setCurrentIndex(prevIndex => Math.max(prevIndex - 1, 0));
    }
  };

  const getVisibleSlides = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
    }
    return 1;
  };

  useEffect(() => {
    const handleResize = () => {
      const maxIndex = Math.max(0, courses.length - getVisibleSlides());
      if (currentIndex > maxIndex) {
        setCurrentIndex(maxIndex);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, courses.length]);

  return (
    <div className="py-20 bg-[#050A30]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Popular Courses</h2>
            <p className="text-xl text-blue-200 max-w-2xl">
              Explore our top-rated courses and start your learning journey today
            </p>
          </div>
          <div className="hidden md:flex space-x-2">
            <button 
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`p-3 rounded-full ${currentIndex === 0 ? 'bg-blue-900 bg-opacity-20 text-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition duration-300`}
            >
              <FaChevronLeft />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentIndex >= courses.length - getVisibleSlides()}
              className={`p-3 rounded-full ${currentIndex >= courses.length - getVisibleSlides() ? 'bg-blue-900 bg-opacity-20 text-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition duration-300`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / getVisibleSlides())}%)` }}
          >
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="min-w-full md:min-w-[50%] lg:min-w-[33.333%] px-4"
              >
                <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                  <div className="relative">
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-blue-600 transition duration-300">
                        <FaBookmark />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900 to-transparent h-16"></div>
                  </div>
                  
                  <div className="p-6 flex-grow">
                    <div className="flex items-center mb-2">
                      <span className="px-3 py-1 bg-blue-700 bg-opacity-40 text-blue-300 text-xs rounded-full">
                        {course.level}
                      </span>
                      <div className="ml-auto flex items-center text-yellow-400">
                        <FaStar />
                        <span className="ml-1 text-white">{course.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                    <p className="text-blue-300 mb-4">by {course.instructor}</p>
                    
                    <div className="flex justify-between text-blue-200 text-sm mb-4">
                      <div className="flex items-center">
                        <FaUsers className="mr-1" />
                        {course.students.toLocaleString()} students
                      </div>
                      <div className="flex items-center">
                        <FaClock className="mr-1" />
                        {course.duration}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0 border-t border-blue-800 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-xl">{course.price}</span>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg mt-6 transition duration-300">
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile navigation buttons */}
        <div className="flex justify-center mt-8 md:hidden space-x-2">
          <button 
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className={`p-3 rounded-full ${currentIndex === 0 ? 'bg-blue-900 bg-opacity-20 text-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition duration-300`}
          >
            <FaChevronLeft />
          </button>
          <button 
            onClick={nextSlide}
            disabled={currentIndex >= courses.length - getVisibleSlides()}
            className={`p-3 rounded-full ${currentIndex >= courses.length - getVisibleSlides() ? 'bg-blue-900 bg-opacity-20 text-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition duration-300`}
          >
            <FaChevronRight />
          </button>
        </div>
        
        {/* View all courses button */}
        <div className="text-center mt-12">
          <a 
            href="#" 
            className="inline-block border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white font-bold px-8 py-3 rounded-lg transition duration-300"
          >
            View All Courses
          </a>
        </div>
      </div>
    </div>
  );
};

export default PopularCourses;