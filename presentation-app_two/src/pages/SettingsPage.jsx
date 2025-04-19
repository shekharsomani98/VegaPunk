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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold">Presentation Settings</h1>
          <p className="mt-2 opacity-80">Customize how your presentation is generated</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Audience Level</h2>
            </div>
            <select
              value={settings.studentLevel}
              onChange={(e) => setSettings({...settings, studentLevel: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="1">PhD Researcher</option>
              <option value="2">Masters Student</option>
              <option value="3">Undergraduate Student</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">This helps us adjust the complexity of your presentation content</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Presentation Length</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['short', 'informative', 'detailed', 'custom'].map((option) => (
                <label 
                  key={option}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                    ${settings.length === option 
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <input
                    type="radio"
                    name="length"
                    value={option}
                    checked={settings.length === option}
                    onChange={(e) => setSettings({...settings, length: e.target.value})}
                    className="mr-3 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{option}</span>
                      {option !== 'custom' && settings.length === option && settings.randomSlideCount && (
                        <span className="text-sm font-medium px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                          {settings.randomSlideCount} slides
                        </span>
                      )}
                    </div>
                    {option === 'short' && <p className="text-sm text-gray-500">3-8 slides, best for quick overviews</p>}
                    {option === 'informative' && <p className="text-sm text-gray-500">8-12 slides, balanced coverage</p>}
                    {option === 'detailed' && <p className="text-sm text-gray-500">12-18 slides, comprehensive analysis</p>}
                    {option === 'custom' && (
                      <div className="mt-2 flex items-center">
                        <input
                          type="number"
                          value={settings.customSlides}
                          onChange={(e) => setSettings({...settings, customSlides: parseInt(e.target.value)})}
                          className="p-2 border border-gray-300 rounded-md w-20 focus:ring-indigo-500 focus:border-indigo-500"
                          min="1"
                          max="30"
                        />
                        <span className="ml-2 text-sm text-gray-500">slides (max 30)</span>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Advanced Settings</h2>
            </div>
            <div className="space-y-4 ml-2">
              <label className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.addImages}
                  onChange={(e) => setSettings({...settings, addImages: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded mt-1"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-700 block">Add relevant images from paper</span>
                  <span className="text-sm text-gray-500">Include figures, charts and tables from the original paper</span>
                </div>
              </label>
              
              <label className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableGallery}
                  onChange={(e) => setSettings({...settings, enableGallery: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded mt-1"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-700 block">Enable paper gallery</span>
                  <span className="text-sm text-gray-500">Extract and view all images and tables from the paper</span>
                </div>
              </label>
              
              <label className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.createPodcast}
                  onChange={(e) => setSettings({...settings, createPodcast: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded mt-1"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-700 block">Generate podcast from paper</span>
                  <span className="text-sm text-gray-500">Create an AI-narrated discussion about your paper (available after presentation)</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={handlePodcastOnly}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors shadow-md flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Skip to Podcast
            </button>
            
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-md flex items-center"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;