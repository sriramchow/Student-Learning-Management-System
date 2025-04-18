import React from 'react';
import { FaArrowRight, FaPlay } from 'react-icons/fa';

const Hero = () => {
  return (
    <div className="relative pt-20 bg-gradient-to-b from-[#050A30] to-[#0A1045]">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-10"></div>
      
      <div className="container mx-auto px-4 pt-10 pb-20">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left content */}
          <div className="md:w-1/2 md:pr-12 text-center md:text-left mb-12 md:mb-0">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-800 bg-opacity-30 text-blue-200 text-sm font-medium mb-6">
              Transform Your Learning Experience
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Unlock Your <span className="text-blue-400">Potential</span> with Expert-Led Courses
            </h1>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl">
              Discover a new way of learning with interactive lessons, personalized coaching, and a community of passionate learners.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform transition duration-300 hover:-translate-y-1 flex items-center justify-center">
                Explore Courses
                <FaArrowRight className="ml-2" />
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-blue-400 text-blue-400 hover:text-white hover:bg-blue-500 font-bold rounded-lg transition duration-300 flex items-center justify-center">
                <FaPlay className="mr-2" />
                Watch Demo
              </button>
            </div>
            
          </div>
          
          {/* Right image */}
          <div className="md:w-1/2 relative">
            <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl border border-blue-900">
              <img 
                src="https://cdni.iconscout.com/illustration/premium/thumb/students-attending-online-classes-illustration-download-in-svg-png-gif-file-formats--male-teacher-young-happy-clock-class-time-learning-pack-school-education-illustrations-2294225.png" 
                alt="Students learning online" 
                className="w-full h-auto"
              />
              
              {/* Stats Overlay */}
              <div className="absolute -bottom-6 -right-6 bg-blue-800 bg-opacity-90 backdrop-blur-sm p-6 rounded-lg border border-blue-700 shadow-xl">
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="text-3xl font-bold text-white">95%</div>
                    <div className="text-sm text-blue-200">Completion rate</div>
                  </div>
                  <div className="h-12 w-px bg-blue-700"></div>
                  <div className="ml-4">
                    <div className="text-3xl font-bold text-white">4.9</div>
                    <div className="text-sm text-blue-200">Student rating</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-40 h-40 bg-blue-600 rounded-lg rotate-12 opacity-10"></div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-indigo-700 rounded-full opacity-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;