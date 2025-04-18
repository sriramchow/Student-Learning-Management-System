import React from 'react';
import { FaCog, FaTools, FaHardHat } from 'react-icons/fa';

const SettingsContent = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="bg-blue-900 bg-opacity-20 rounded-xl border border-blue-800 p-8 text-center max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-700 bg-opacity-50 p-6 rounded-full">
            <FaTools className="text-5xl text-blue-300" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">
          Settings Coming Soon
        </h2>
        
        <p className="text-blue-200 mb-6">
          We're working hard to build out the advanced settings panel for Questor Admin.
          This feature will allow you to customize your experience, manage system preferences,
          and control various aspects of the platform.
        </p>
        
        <div className="flex items-center justify-center text-yellow-300 bg-yellow-900 bg-opacity-30 p-3 rounded-lg">
          <FaHardHat className="mr-2" />
          <span>Under Construction</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;