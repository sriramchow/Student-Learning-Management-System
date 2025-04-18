import React from 'react';
import { FaComments } from 'react-icons/fa';

const ChatButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 bg-blue-700 hover:bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-30"
      aria-label="Open Chat"
    >
      <FaComments className="text-2xl" />
    </button>
  );
};

export default ChatButton;