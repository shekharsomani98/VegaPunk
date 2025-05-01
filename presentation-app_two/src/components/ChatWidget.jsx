import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { XMarkIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(55, 65, 81, 0.8);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 1);
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
    }
  }
  
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  
  @keyframes gradient-animation {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .message-animation {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

const ChatWidget = ({ paperUrl = null }) => {
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await axios.post('http://127.0.0.1:8003/init_session');
        setSessionId(response.data.session_id);
        
        // Add welcome message
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I can answer questions about your research paper. What would you like to know?'
          }
        ]);
      } catch (err) {
        console.error('Failed to initialize chat session:', err);
        setError('Failed to initialize chat. Please try again later.');
      }
    };
    
    initializeSession();
  }, []);

  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input field when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Method to send chat message to backend
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      let response;
      
      // If we have a paper URL, use the chat_by_url endpoint
      if (paperUrl) {
        response = await axios.post('http://127.0.0.1:8003/chat_by_url', null, {
          params: {
            question: userMessage,
            document_url: paperUrl,
            session_id: sessionId
          }
        });
      } else {
        // Otherwise use the regular chat endpoint
        response = await axios.post('http://127.0.0.1:8003/chat', null, {
          params: {
            question: userMessage,
            session_id: sessionId
          }
        });
      }
      
      // Ensure we're accessing the correct property based on our backend response
      const answer = response.data.answer;
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      
    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, there was an error processing your request: ' + (err.response?.data?.detail || err.message));
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
      // Focus input after animation completes
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    } else {
      setIsMinimized(true);
    }
  };

  // Close chat completely
  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <>
      {/* Overlay when chat is open */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
          onClick={closeChat}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}
      
      <div className="fixed bottom-4 right-4 z-50">
        {/* Custom scrollbar styles */}
        <style>{scrollbarStyles}</style>
        
        {/* Chat button (always visible) */}
        <button
          onClick={toggleChat}
          className={`${isMinimized ? 'w-16 h-16' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isMinimized 
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 pulse-animation' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          style={isMinimized ? { boxShadow: '0 0 15px rgba(79, 70, 229, 0.5)' } : {}}
        >
          <ChatBubbleLeftRightIcon className={`${isMinimized ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
        </button>

        {/* Chat window */}
        {isOpen && (
          <div
            className={`bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden transition-all duration-300 transform ${
              isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{
              width: '600px',
              maxWidth: '95vw',
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) ${isMinimized ? 'scale(0)' : 'scale(1)'}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              zIndex: 1000
            }}
          >
            {/* Chat header with animated gradient background */}
            <div 
              className="p-5 flex justify-between items-center shadow-md"
              style={{
                background: 'linear-gradient(-45deg, #4338ca, #3b82f6, #1e40af, #3730a3)',
                backgroundSize: '400% 400%',
                animation: 'gradient-animation 15s ease infinite'
              }}
            >
              <h3 className="text-white font-semibold text-xl flex items-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-blue-200" />
                Research Assistant
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={toggleChat}
                  className="text-gray-200 hover:text-white transition-colors p-1.5 rounded hover:bg-blue-600/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
                <button
                  onClick={closeChat}
                  className="text-gray-200 hover:text-white transition-colors p-1.5 rounded hover:bg-blue-600/30"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages container */}
            <div className="h-[500px] overflow-y-auto p-5 bg-gray-950 bg-opacity-95 custom-scrollbar">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-5 message-animation ${
                    msg.role === 'user' ? 'ml-auto text-right' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`inline-block rounded-lg px-5 py-4 max-w-[85%] shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <div className={`text-sm text-gray-500 mt-2 ${msg.role === 'user' ? 'text-right' : 'text-left'} px-2`}>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-5">
                  <div className="bg-gray-800 text-blue-400 rounded-lg px-5 py-4 shadow-md">
                    <div className="flex items-center space-x-3">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span className="text-base">Analyzing paper...</span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 text-red-300 p-4 rounded-lg mb-5 text-base border border-red-800/50 shadow-md">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="bg-gray-800 p-5 border-t border-gray-700">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your research paper..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-5 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 shadow-inner"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className={`ml-4 p-4 rounded-full shadow-md transition-colors ${
                    isLoading || !input.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  <PaperAirplaneIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWidget; 