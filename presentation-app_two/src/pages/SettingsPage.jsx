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
    studentLevel: '2' // Default to Masters Student
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
        generate_gallery: settings.enableGallery
      }
    };

    // Navigate to template selection
    navigate('/template', { state: payload });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Presentation Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Audience Level</h2>
            <select
              value={settings.studentLevel}
              onChange={(e) => setSettings({...settings, studentLevel: e.target.value})}
              className="w-full p-3 border rounded-md bg-white"
            >
              <option value="1">PhD Researcher</option>
              <option value="2">Masters Student</option>
              <option value="3">Undergraduate Student</option>
            </select>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Presentation Length</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['short', 'informative', 'detailed', 'custom'].map((option) => (
                <label 
                  key={option}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                    ${settings.length === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <input
                    type="radio"
                    name="length"
                    value={option}
                    checked={settings.length === option}
                    onChange={(e) => setSettings({...settings, length: e.target.value})}
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="capitalize">{option}</span>
                      {option !== 'custom' && settings.length === option && settings.randomSlideCount && (
                        <span className="text-sm font-medium text-blue-600">{settings.randomSlideCount} slides</span>
                      )}
                    </div>
                    {option === 'short' && <p className="text-sm text-gray-500">3-8 slides</p>}
                    {option === 'informative' && <p className="text-sm text-gray-500">8-12 slides</p>}
                    {option === 'detailed' && <p className="text-sm text-gray-500">12-18 slides</p>}
                    {option === 'custom' && (
                      <input
                        type="number"
                        value={settings.customSlides}
                        onChange={(e) => setSettings({...settings, customSlides: parseInt(e.target.value)})}
                        className="mt-2 p-1 border rounded w-20"
                        min="1"
                        max="30"
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Advanced Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.addImages}
                  onChange={(e) => setSettings({...settings, addImages: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Add relevant images from paper</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enableGallery}
                  onChange={(e) => setSettings({...settings, enableGallery: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Enable paper gallery (extract and view all images and tables)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;