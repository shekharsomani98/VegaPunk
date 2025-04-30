import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { XMarkIcon, PhotoIcon, PaperAirplaneIcon, ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { useLocation } from 'react-router-dom';

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

const BACKEND_URL = 'http://127.0.0.1:8004';

const ImageWidget = ({ paperUrl = null }) => {
  const location = useLocation();
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [hasPaperContext, setHasPaperContext] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Refs
  const imagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get document URL from location state or prop
  useEffect(() => {
    if (location.state?.paperUrl) {
      setDocumentUrl(location.state.paperUrl);
    } else if (paperUrl) {
      setDocumentUrl(paperUrl);
    }
  }, [location.state, paperUrl]);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/init_session`);
        setSessionId(response.data.session_id);
      } catch (err) {
        console.error('Failed to initialize image session:', err);
        setError('Failed to initialize session. Please try again later.');
      }
    };
    
    initializeSession();
  }, []);

  // When we have both session ID and document URL, add paper context
  useEffect(() => {
    const addPaperContext = async () => {
      if (sessionId && documentUrl && !hasPaperContext) {
        try {
          setIsLoadingContext(true);
          await axios.post(`${BACKEND_URL}/add_paper_context`, {
            document_url: documentUrl,
            session_id: sessionId
          });
          setHasPaperContext(true);
          console.log("Paper context added successfully");
        } catch (err) {
          console.error('Failed to add paper context:', err);
        } finally {
          setIsLoadingContext(false);
        }
      }
    };
    
    addPaperContext();
  }, [sessionId, documentUrl, hasPaperContext]);

  // Scroll to bottom when new images arrive
  useEffect(() => {
    if (imagesEndRef.current && isOpen && !isMinimized) {
      imagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [images, isOpen, isMinimized]);

  // Focus input field when widget is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Method to generate image
  const generateImage = async () => {
    if (!prompt.trim() || isLoading) return;
    
    // If no document URL is available, show an error
    if (!documentUrl) {
      setError('No paper context available. Please upload or select a paper first.');
      return;
    }
    
    const userPrompt = prompt.trim();
    setPrompt('');
    setIsLoading(true);
    setError(null);
    
    // Save the prompt
    setImages(prev => [...prev, { 
      type: 'prompt', 
      content: userPrompt,
      timestamp: new Date().toISOString()
    }]);
    
    try {
      const requestData = {
        prompt: userPrompt,
        mode: selectedMode,
        session_id: sessionId
      };
      
      // Include document_url if we haven't added context yet
      if (documentUrl && !hasPaperContext) {
        requestData.document_url = documentUrl;
      }
      
      const response = await axios.post(`${BACKEND_URL}/generate-image`, requestData);
      
      const imageUrl = `${BACKEND_URL}${response.data.image_url}`;
      const mode = response.data.mode;
      
      // If we sent a document_url, we now have context
      if (requestData.document_url) {
        setHasPaperContext(true);
      }
      
      // Add image to list
      setImages(prev => [...prev, { 
        type: 'image', 
        content: imageUrl,
        mode: mode,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Sorry, there was an error generating your image: ' + 
               (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  // Toggle widget open/closed
  const toggleWidget = () => {
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

  // Close widget completely
  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  // Select visualization mode
  const handleModeSelect = (mode) => {
    setSelectedMode(mode === selectedMode ? null : mode);
  };

  return (
    <>
      {/* Overlay when widget is open */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
          onClick={closeWidget}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}
      
      <div className="fixed bottom-4 left-4 z-50">
        {/* Custom scrollbar styles */}
        <style>{scrollbarStyles}</style>
        
        {/* Widget button (always visible) */}
        <button
          onClick={toggleWidget}
          className={`${isMinimized ? 'w-16 h-16' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isMinimized 
              ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 pulse-animation' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          style={isMinimized ? { boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' } : {}}
        >
          <PhotoIcon className={`${isMinimized ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
        </button>

        {/* Widget window */}
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Widget header with animated gradient background */}
            <div 
              className="p-5 flex justify-between items-center shadow-md"
              style={{
                background: 'linear-gradient(-45deg, #047857, #0d9488, #0f766e, #065f46)',
                backgroundSize: '400% 400%',
                animation: 'gradient-animation 15s ease infinite'
              }}
            >
              <h3 className="text-white font-semibold text-xl flex items-center">
                <PhotoIcon className="w-6 h-6 mr-2 text-green-200" />
                Image Generator
              </h3>
              <div className="flex space-x-2">
                {/* Paper context indicator */}
                {documentUrl && (
                  <div className="flex items-center mr-2">
                    <DocumentTextIcon className={`w-5 h-5 ${hasPaperContext ? 'text-green-300' : 'text-gray-400'}`} />
                    {isLoadingContext && (
                      <ArrowPathIcon className="w-4 h-4 ml-1 text-gray-300 animate-spin" />
                    )}
                  </div>
                )}
                <button
                  onClick={toggleWidget}
                  className="text-gray-200 hover:text-white transition-colors p-1.5 rounded hover:bg-teal-600/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
                <button
                  onClick={closeWidget}
                  className="text-gray-200 hover:text-white transition-colors p-1.5 rounded hover:bg-teal-600/30"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode selection bar */}
            <div className="flex bg-gray-800 p-2 space-x-2 border-b border-gray-700">
              <button
                onClick={() => handleModeSelect('html')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedMode === 'html'
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Layout/UI
              </button>
              <button
                onClick={() => handleModeSelect('graph')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedMode === 'graph'
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Diagram/Graph
              </button>
              <button
                onClick={() => handleModeSelect('plot')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedMode === 'plot'
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Chart/Plot
              </button>
              <button
                onClick={() => handleModeSelect(null)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedMode === null
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Auto-detect
              </button>
            </div>

            {/* Context status bar */}
            {documentUrl && (
              <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center">
                <div className={`px-2 py-1 rounded-full text-xs ${hasPaperContext ? 'bg-green-900/40 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                  {hasPaperContext ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                      Using paper context
                    </>
                  ) : isLoadingContext ? (
                    <>
                      <ArrowPathIcon className="w-3 h-3 animate-spin inline mr-1.5" />
                      Loading paper context...
                    </>
                  ) : (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-500 mr-1.5"></span>
                      No paper context
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Images container */}
            <div className="h-[500px] overflow-y-auto p-5 bg-gray-950 bg-opacity-95 custom-scrollbar">
              {images.length === 0 && (
                <div className="text-center p-8 text-gray-400">
                  <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  
                  {!documentUrl ? (
                    <>
                      <p className="text-lg mb-2">No paper selected</p>
                      <p className="text-sm">
                        To use the image generator, please upload or select a paper first.
                      </p>
                      <div className="mt-6 text-sm text-amber-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>
                        Images will be generated based on your paper's content
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">No images yet</p>
                      <p className="text-sm">
                        Enter a prompt below to generate an image. Examples:
                      </p>
                      <ul className="text-gray-500 mt-3 text-sm space-y-2">
                        <li>"Create a flowchart showing the key concepts from this paper"</li>
                        <li>"Visualize the research findings as a bar chart"</li>
                        <li>"Generate a diagram of the methodology described in the paper"</li>
                      </ul>
                      
                      {!hasPaperContext && isLoadingContext && (
                        <div className="mt-6 text-sm text-amber-400">
                          <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" />
                          Loading paper content for context...
                        </div>
                      )}
                      
                      {hasPaperContext && (
                        <div className="mt-6 text-sm text-green-400">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                          Paper context loaded - your images will be based on paper content
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {images.map((item, index) => (
                <div
                  key={index}
                  className={`mb-6 message-animation ${
                    item.type === 'prompt' ? 'ml-auto text-right' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {item.type === 'prompt' ? (
                    <>
                      <div className="inline-block rounded-lg px-5 py-4 max-w-[85%] shadow-md bg-gradient-to-r from-green-600 to-teal-700 text-white">
                        <p className="text-base whitespace-pre-wrap leading-relaxed">{item.content}</p>
                      </div>
                      <div className="text-sm text-gray-500 mt-2 text-right px-2">
                        You
                      </div>
                    </>
                  ) : (
                    <div className="mb-6">
                      <div className="bg-gray-800 p-2 rounded-lg shadow-md">
                        <div className="flex justify-between items-center px-2 py-1 mb-2 text-xs text-gray-400">
                          <span className="bg-gray-700 rounded px-2 py-1 capitalize">
                            {item.mode} visualization
                          </span>
                          <span>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <img 
                          src={item.content} 
                          alt="Generated visualization" 
                          className="w-full rounded border border-gray-700 shadow-inner" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-5">
                  <div className="bg-gray-800 text-teal-400 rounded-lg px-5 py-4 shadow-md">
                    <div className="flex items-center space-x-3">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span className="text-base">Generating image{hasPaperContext ? ' using paper context' : ''}...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-900/30 text-red-300 p-4 rounded-lg mb-5 text-base border border-red-800/50 shadow-md">
                  {error}
                </div>
              )}
              
              <div ref={imagesEndRef} />
            </div>

            {/* Input area */}
            <div className="bg-gray-800 p-5 border-t border-gray-700">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !documentUrl
                      ? "Please upload or select a paper first..."
                      : `Describe the image you want to generate${selectedMode ? ` (${selectedMode} mode)` : ''}`
                  }
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-5 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400 shadow-inner"
                  disabled={isLoading || !documentUrl}
                />
                <button
                  onClick={generateImage}
                  disabled={isLoading || !prompt.trim()}
                  className={`ml-4 p-4 rounded-full shadow-md transition-colors ${
                    isLoading || !prompt.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
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

export default ImageWidget; 