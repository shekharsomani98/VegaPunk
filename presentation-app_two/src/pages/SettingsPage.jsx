import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Function to generate random slide count within range
const getRandomSlideCount = (option) => {
  switch (option) {
    case 'short':
      return Math.floor(Math.random() * (8 - 3 + 1)) + 3; // 3-8 slides
    case 'informative':
      return Math.floor(Math.random() * (12 - 8 + 1)) + 8; // 8-12 slides
    case 'detailed':
      return Math.floor(Math.random() * (18 - 12 + 1)) + 12; // 12-18 slides
    default:
      return 10;
  }
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState({
    length: 'informative',
    customSlides: 10,
    addImages: true,
    enableGallery: false,
    studentLevel: '2', // Default to Masters Student
    createPodcast: false // New option for podcast creation
  });
  
  // Add animation states
  const [activeSection, setActiveSection] = useState(null);

  // Update slide count when length option changes
  useEffect(() => {
    if (settings.length !== 'custom') {
      const randomCount = getRandomSlideCount(settings.length);
      setSettings(prev => ({...prev, randomSlideCount: randomCount}));
    }
  }, [settings.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine final slide count
    const finalSlideCount = settings.length === 'custom' 
      ? settings.customSlides 
      : settings.randomSlideCount || getRandomSlideCount(settings.length);
    
    // Prepare final payload
    const payload = {
      ...location.state,
      studentLevel: settings.studentLevel,
      settings: {
        num_slides: finalSlideCount,
        add_images: settings.addImages,
        generate_gallery: settings.enableGallery,
        create_podcast: settings.createPodcast
      }
    };

    // Navigate to template selection
    navigate('/template', { state: payload });
  };

  // Handle direct navigation to podcast page
  const handlePodcastOnly = () => {
    navigate('/podcast', { 
      state: {
        ...location.state,
        podcastOnly: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-4 md:p-6 text-gray-200 relative overflow-hidden flex items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particles-container">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-indigo-800 to-blue-700 rounded-2xl shadow-2xl p-4 sm:p-6 text-white mb-4 border border-indigo-600/20 relative overflow-hidden">
          <div className="glow-effect absolute -inset-1 rounded-3xl blur-lg opacity-20 bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse-slow"></div>
          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Presentation Settings</h1>
            <p className="text-sm md:text-base text-blue-100/80">Customize how your presentation will be generated</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className={`bg-gradient-to-b from-gray-900/90 to-gray-950/90 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm transition-all duration-300 h-full ${activeSection === 'audience' ? 'transform scale-[1.01] border-indigo-900/30' : 'hover:border-indigo-900/20 hover:shadow-indigo-500/5'}`}
            onMouseEnter={() => setActiveSection('audience')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/10 group-hover:shadow-indigo-500/20">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Audience Level</h2>
                  <p className="text-xs text-gray-400">Choose who you're presenting to</p>
                </div>
              </div>

              <div className="relative group mt-2">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
            <select
              value={settings.studentLevel}
              onChange={(e) => setSettings({...settings, studentLevel: e.target.value})}
                    className="w-full p-3 border border-gray-700 rounded-xl shadow-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-900/80 text-white placeholder-gray-500 transition-all duration-200"
            >
              <option value="1">PhD Researcher</option>
              <option value="2">Masters Student</option>
              <option value="3">Undergraduate Student</option>
            </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400 flex items-center pl-1">
                <svg className="h-3 w-3 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Adjust the complexity of your presentation content
              </p>
            </div>
          </div>
          
          <div 
            className={`bg-gradient-to-b from-gray-900/90 to-gray-950/90 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm transition-all duration-300 h-full ${activeSection === 'advanced' ? 'transform scale-[1.01] border-indigo-900/30' : 'hover:border-indigo-900/20 hover:shadow-indigo-500/5'}`}
            onMouseEnter={() => setActiveSection('advanced')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/10">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
                  <p className="text-xs text-gray-400">Additional features for your presentation</p>
                </div>
              </div>

              <div className="space-y-1 mt-1">
                <label className="flex items-start p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300 cursor-pointer border border-transparent">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.addImages}
                      onChange={(e) => setSettings({...settings, addImages: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 ${settings.addImages ? 'bg-indigo-600 border-indigo-400' : 'border-gray-600 bg-gray-800'} flex items-center justify-center transition-colors duration-200`}>
                      {settings.addImages && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className={`absolute -inset-2 rounded-md blur-sm transition-opacity duration-300 ${settings.addImages ? 'opacity-30 bg-indigo-600' : 'opacity-0'}`}></div>
                  </div>
                  <div className="ml-3">
                    <span className="font-medium text-gray-200 block text-sm">Add relevant images from paper</span>
                    <span className="text-xs text-gray-400">Include figures and charts from the paper</span>
                  </div>
                </label>
                
                <label className="flex items-start p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300 cursor-pointer border border-transparent">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.enableGallery}
                      onChange={(e) => setSettings({...settings, enableGallery: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 ${settings.enableGallery ? 'bg-indigo-600 border-indigo-400' : 'border-gray-600 bg-gray-800'} flex items-center justify-center transition-colors duration-200`}>
                      {settings.enableGallery && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className={`absolute -inset-2 rounded-md blur-sm transition-opacity duration-300 ${settings.enableGallery ? 'opacity-30 bg-indigo-600' : 'opacity-0'}`}></div>
                  </div>
                  <div className="ml-3">
                    <span className="font-medium text-gray-200 block text-sm">Enable paper gallery</span>
                    <span className="text-xs text-gray-400">Extract all images from the paper</span>
                  </div>
                </label>
                
                <label className="flex items-start p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300 cursor-pointer border border-transparent">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.createPodcast}
                      onChange={(e) => setSettings({...settings, createPodcast: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 ${settings.createPodcast ? 'bg-indigo-600 border-indigo-400' : 'border-gray-600 bg-gray-800'} flex items-center justify-center transition-colors duration-200`}>
                      {settings.createPodcast && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className={`absolute -inset-2 rounded-md blur-sm transition-opacity duration-300 ${settings.createPodcast ? 'opacity-30 bg-indigo-600' : 'opacity-0'}`}></div>
                  </div>
                  <div className="ml-3">
                    <span className="font-medium text-gray-200 block text-sm">Generate podcast from paper</span>
                    <span className="text-xs text-gray-400">Create an AI-narrated discussion</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div 
            className={`bg-gradient-to-b from-gray-900/90 to-gray-950/90 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm transition-all duration-300 md:col-span-2 ${activeSection === 'length' ? 'transform scale-[1.01] border-indigo-900/30' : 'hover:border-indigo-900/20 hover:shadow-indigo-500/5'}`}
            onMouseEnter={() => setActiveSection('length')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/10">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Presentation Length</h2>
                  <p className="text-xs text-gray-400">Choose how detailed your presentation should be</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {['short', 'informative', 'detailed', 'custom'].map((option) => (
                <label 
                  key={option}
                    className={`flex items-start p-2 sm:p-3 border rounded-xl cursor-pointer transition-all duration-300
                      ${settings.length === option 
                        ? 'border-indigo-500/50 bg-gradient-to-r from-indigo-900/40 to-blue-900/40 shadow-lg shadow-indigo-500/10' 
                        : 'border-gray-700 hover:border-indigo-600/30 hover:bg-indigo-900/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full mr-2 flex-shrink-0 border-2 flex items-center justify-center ${settings.length === option ? 'border-indigo-400 bg-indigo-900/50' : 'border-gray-600'}`}>
                      {settings.length === option && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse-slow"></div>
                      )}
                    </div>
                  <input
                    type="radio"
                    name="length"
                    value={option}
                    checked={settings.length === option}
                    onChange={(e) => setSettings({...settings, length: e.target.value})}
                      className="sr-only"
                  />
                  <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium text-sm text-gray-200">{option}</span>
                      {option !== 'custom' && settings.length === option && settings.randomSlideCount && (
                          <span className="text-xs font-medium px-1.5 py-0.5 bg-indigo-900/60 text-indigo-200 rounded-full border border-indigo-700/30 shadow-inner ml-1">
                            {settings.randomSlideCount}
                          </span>
                      )}
                    </div>
                      {option === 'short' && <p className="text-xs text-gray-400 mt-1">3-8 slides</p>}
                      {option === 'informative' && <p className="text-xs text-gray-400 mt-1">8-12 slides</p>}
                      {option === 'detailed' && <p className="text-xs text-gray-400 mt-1">12-18 slides</p>}
                    {option === 'custom' && (
                        <div className="mt-1 flex items-center">
                      <input
                        type="number"
                        value={settings.customSlides}
                        onChange={(e) => setSettings({...settings, customSlides: parseInt(e.target.value)})}
                            className="p-1 border border-gray-600 rounded-md w-12 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white text-center text-xs"
                        min="1"
                        max="30"
                      />
                          <span className="ml-1 text-xs text-gray-400">slides</span>
                        </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            </div>
          </div>

          <div className="flex gap-4 md:col-span-2 mt-4">
            <button
              type="button"
              onClick={handlePodcastOnly}
              className="flex-1 relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200 animate-tilt"></div>
              <div className="relative bg-gray-900 rounded-xl h-full flex items-center justify-center p-3 leading-none font-medium text-white transition-all duration-200 group-hover:bg-gray-800">
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                </span>
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-sm">Skip to Podcast</span>
              </div>
            </button>
            
            <button type="submit" className="flex-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200 animate-tilt"></div>
              <div className="relative bg-gray-900 rounded-xl h-full flex items-center justify-center p-3 leading-none font-medium text-white transition-all duration-200 group-hover:bg-gray-800">
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                </span>
                <span className="text-sm">Next</span>
                <svg className="w-5 h-5 ml-2 text-blue-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        </form>
      </div>
      
      {/* Add CSS for animations and effects */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.3; }
        }
        
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(0.5deg); }
          75% { transform: rotate(-0.5deg); }
        }
        
        .animate-tilt {
          animation: tilt 10s infinite linear;
        }
        
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.3;
          filter: blur(8px);
        }
        
        .particle-1 {
          top: 10%;
          left: 10%;
          width: 60px;
          height: 60px;
          background: #4F46E5;
          animation: float 15s ease-in-out infinite;
        }
        
        .particle-2 {
          top: 60%;
          left: 80%;
          width: 100px;
          height: 100px;
          background: #3B82F6;
          animation: float 18s ease-in-out infinite reverse;
        }
        
        .particle-3 {
          top: 80%;
          left: 20%;
          width: 80px;
          height: 80px;
          background: #6366F1;
          animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          75% { transform: translateY(20px) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;