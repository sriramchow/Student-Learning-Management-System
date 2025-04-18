import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaSpinner, FaTimes, FaArrowLeft, FaInfoCircle, FaRegSmile, FaDownload } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { sendMessageToQuestorBot } from '../services/chatService';

const QuestorBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial greeting message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessage = {
        role: 'assistant',
        content: "Hello! I'm Questor Bot, your AI learning assistant. How can I help you with your educational journey today?"
      };
      
      setMessages([initialMessage]);
      
      // Create a new chat in history if none exists
      if (chatHistory.length === 0) {
        setChatHistory([{
          id: Date.now(),
          title: 'New Conversation',
          messages: [initialMessage]
        }]);
      }
    }
  }, [isOpen, messages.length, chatHistory.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus on input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Update chat history when messages change
  useEffect(() => {
    if (messages.length > 0 && chatHistory.length > 0) {
      const updatedHistory = [...chatHistory];
      updatedHistory[currentChatIndex] = {
        ...updatedHistory[currentChatIndex],
        messages: [...messages]
      };
      setChatHistory(updatedHistory);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Conversation',
      messages: []
    };
    
    setChatHistory([...chatHistory, newChat]);
    setCurrentChatIndex(chatHistory.length);
    setMessages([]);
    setErrorMessage('');
    
    // Add initial greeting
    const initialMessage = {
      role: 'assistant',
      content: "Hello! I'm Questor Bot, your AI learning assistant. How can I help you with your educational journey today?"
    };
    setMessages([initialMessage]);
  };

  const switchToChat = (index) => {
    setCurrentChatIndex(index);
    setMessages(chatHistory[index].messages);
    setErrorMessage('');
    setShowSidebar(false);
  };

  const updateChatTitle = (userMessage) => {
    // Only update title if it's the first user message
    if (chatHistory[currentChatIndex].messages.length <= 1) {
      const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
      const updatedHistory = [...chatHistory];
      updatedHistory[currentChatIndex] = {
        ...updatedHistory[currentChatIndex],
        title
      };
      setChatHistory(updatedHistory);
    }
  };

  const exportChatHistory = () => {
    const chat = chatHistory[currentChatIndex];
    const chatContent = chat.messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'Questor Bot'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questor-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input
    };
    
    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, userMessage]);
    updateChatTitle(userMessage);
    setInput('');
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Prepare messages for API in the required format
      const formattedMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call Anthropic API via our service
      const response = await sendMessageToQuestorBot(formattedMessages);
      
      // Add assistant response to chat
      if (response.content && response.content.length > 0) {
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: response.content[0].text 
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Set error message
      setErrorMessage('Failed to connect to the AI service. Please try again later.');
      
      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again later."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 w-96 h-[36rem] bg-[#0A1045] bg-opacity-95 rounded-xl shadow-2xl border border-blue-800 flex flex-col overflow-hidden z-50">
      {/* Chat Header */}
      <div className="bg-[#050A30] p-4 flex justify-between items-center border-b border-blue-800">
        <div className="flex items-center">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-blue-300 hover:text-white mr-3 transition-colors"
            aria-label="Toggle chat history"
          >
            <FaArrowLeft />
          </button>
          <div className="bg-blue-700 p-2 rounded-full mr-3">
            <FaRobot className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-white font-bold">Questor Bot</h3>
            <p className="text-blue-300 text-xs">AI Learning Assistant</p>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="text-blue-300 hover:text-white mr-3 transition-colors"
            aria-label="Information"
          >
            <FaInfoCircle />
          </button>
          <button 
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar for chat history */}
        <div 
          className={`absolute top-0 left-0 h-full w-3/4 bg-[#050A30] border-r border-blue-800 transform transition-transform duration-300 z-10 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-3 border-b border-blue-800">
            <button
              onClick={createNewChat}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              New Chat
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-3.5rem)]">
            {chatHistory.map((chat, index) => (
              <div 
                key={chat.id}
                onClick={() => switchToChat(index)}
                className={`p-3 border-b border-blue-800 cursor-pointer hover:bg-blue-900 ${
                  currentChatIndex === index ? 'bg-blue-800' : ''
                }`}
              >
                <p className="text-white text-sm truncate">{chat.title}</p>
                <p className="text-blue-300 text-xs">
                  {new Date(chat.id).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Info panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-3/4 bg-[#050A30] border-l border-blue-800 transform transition-transform duration-300 z-10 ${
            showInfoPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4">
            <h3 className="text-white font-bold mb-3">About Questor Bot</h3>
            <p className="text-blue-200 text-sm mb-4">
              Questor Bot is powered by Claude, an AI assistant created by Anthropic to be helpful, harmless, and honest.
            </p>
            
            <h4 className="text-white font-semibold mb-2">What can I ask?</h4>
            <ul className="text-blue-200 text-sm list-disc pl-5 mb-4 space-y-1">
              <li>Questions about academic subjects</li>
              <li>Help with coding and programming</li>
              <li>Study strategies and learning tips</li>
              <li>Explanations of complex concepts</li>
              <li>Research assistance and resources</li>
            </ul>
            
            <h4 className="text-white font-semibold mb-2">Actions</h4>
            <div className="space-y-2">
              <button 
                onClick={exportChatHistory}
                className="w-full flex items-center justify-center bg-blue-800 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors"
              >
                <FaDownload className="mr-2" /> Export Chat
              </button>
              <button 
                onClick={() => {
                  setShowInfoPanel(false);
                  createNewChat();
                }}
                className="w-full flex items-center justify-center bg-blue-800 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors"
              >
                <FaRegSmile className="mr-2" /> Start Fresh Chat
              </button>
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-900">
          {errorMessage && (
            <div className="bg-red-900 bg-opacity-30 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
              {errorMessage}
            </div>
          )}
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}
            >
              <div 
                className={`inline-block max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-700 text-white rounded-tr-none' 
                    : 'bg-blue-900 bg-opacity-50 text-blue-100 rounded-tl-none'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.role === 'assistant' ? (
                    <FaRobot className="text-blue-300 mr-2" />
                  ) : (
                    <FaUser className="text-blue-300 mr-2" />
                  )}
                  <span className="text-xs font-bold text-blue-300">
                    {message.role === 'user' ? 'You' : 'Questor Bot'}
                  </span>
                </div>
                <div className="text-sm markdown-content">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4">
              <div className="inline-block max-w-[85%] p-3 rounded-lg bg-blue-900 bg-opacity-50 text-blue-100 rounded-tl-none">
                <div className="flex items-center">
                  <FaRobot className="text-blue-300 mr-2" />
                  <span className="text-xs font-bold text-blue-300">Questor Bot</span>
                </div>
                <div className="flex items-center mt-2">
                  <FaSpinner className="animate-spin text-blue-300 mr-2" />
                  <span className="text-sm text-blue-300">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-blue-800 bg-[#050A30]">
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Questor Bot something..."
            className="flex-1 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`bg-blue-700 text-white p-2 rounded-r-lg ${
              isLoading || !input.trim() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-600'
            }`}
            disabled={isLoading || !input.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>
        <div className="mt-1 text-center">
          <p className="text-blue-400 text-xs">
            Powered by Anthropic's Claude AI
          </p>
        </div>
      </form>
    </div>
  );
};

export default QuestorBot;