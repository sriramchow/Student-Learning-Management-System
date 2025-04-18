import React from 'react';
import { FaLaptopCode, FaUserGraduate, FaCertificate, FaUsers, FaChalkboardTeacher, FaMobileAlt } from 'react-icons/fa';

const Services = () => {
  const serviceItems = [
    {
      icon: <FaLaptopCode className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Interactive Learning",
      description: "Engage with our interactive platform featuring quizzes, coding challenges, and hands-on projects that reinforce your learning."
    },
    {
      icon: <FaUserGraduate className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Expert Instructors",
      description: "Learn from industry professionals and academic experts who bring real-world experience to every course."
    },
    {
      icon: <FaCertificate className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Certified Courses",
      description: "Earn recognized certificates upon completion to enhance your resume and showcase your skills to employers."
    },
    {
      icon: <FaUsers className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Community Support",
      description: "Join our vibrant community of learners where you can collaborate, share insights, and grow together."
    },
    {
      icon: <FaChalkboardTeacher className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Personalized Learning",
      description: "Our adaptive learning system tailors content to your progress, ensuring an optimal learning experience."
    },
    {
      icon: <FaMobileAlt className="w-10 h-10 text-blue-400 mb-4" />,
      title: "Learn Anywhere",
      description: "Access your courses anytime, anywhere with our mobile-friendly platform and downloadable resources."
    }
  ];

  return (
    <div className="py-20 bg-[#070D3D]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How Questor Works</h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Our comprehensive platform offers everything you need to succeed in your educational journey
          </p>
        </div>
        
        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {serviceItems.map((service, index) => (
            <div 
              key={index} 
              className="bg-blue-900 bg-opacity-20 backdrop-blur-sm border border-blue-800 rounded-xl p-8 hover:bg-blue-800 hover:bg-opacity-30 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="text-center">
                {service.icon}
                <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-blue-200">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-blue-900 bg-opacity-20 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">150+</div>
            <div className="text-blue-300">Expert Instructors</div>
          </div>
          <div className="bg-blue-900 bg-opacity-20 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">500+</div>
            <div className="text-blue-300">Courses Available</div>
          </div>
          <div className="bg-blue-900 bg-opacity-20 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">25K+</div>
            <div className="text-blue-300">Active Students</div>
          </div>
          <div className="bg-blue-900 bg-opacity-20 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">98%</div>
            <div className="text-blue-300">Satisfaction Rate</div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="mt-20 text-center">
          <a 
            href="#" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transform transition duration-300 hover:-translate-y-1"
          >
            Explore All Services
          </a>
        </div>
      </div>
    </div>
  );
};

export default Services;