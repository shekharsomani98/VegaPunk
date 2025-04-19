import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-200">
            VegaPunk
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform research papers into beautiful presentations with AI
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-indigo-300">Get Started</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-indigo-900 rounded-full p-2 mr-4 mt-1">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-1">Upload Your Paper</h3>
                    <p className="text-gray-400">Simply upload any research paper in PDF format</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-900 rounded-full p-2 mr-4 mt-1">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-1">Customize Settings</h3>
                    <p className="text-gray-400">Choose audience level, presentation length, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-900 rounded-full p-2 mr-4 mt-1">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-1">Generate & Download</h3>
                    <p className="text-gray-400">Get your presentation in minutes, ready to use</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-900 rounded-full p-2 mr-4 mt-1">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-1">Create a Podcast</h3>
                    <p className="text-gray-400">Generate an AI podcast discussing your paper</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/upload')}
                className="mt-8 w-full py-4 bg-gradient-to-r from-indigo-700 to-blue-600 hover:from-indigo-800 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center text-lg font-medium"
              >
                Start Creating
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <img 
              src="/templates/aura-preview.png" 
              alt="Presentation Example" 
              className="rounded-xl shadow-2xl border-2 border-indigo-800 transform md:rotate-2 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
        
        {/* Features section */}
        <div className="mt-24 mb-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-indigo-300">Why Choose VegaPunk?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-700 transition-colors duration-300">
              <div className="bg-indigo-900 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Lightning Fast</h3>
              <p className="text-gray-400">Generate complete presentations in minutes, not hours</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-700 transition-colors duration-300">
              <div className="bg-indigo-900 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Smart Summarization</h3>
              <p className="text-gray-400">Intelligent extraction of key points from complex papers</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-700 transition-colors duration-300">
              <div className="bg-indigo-900 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Fully Customizable</h3>
              <p className="text-gray-400">Tailor presentations to your specific needs and audience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;