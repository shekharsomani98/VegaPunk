import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const SelectionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTiles, setSelectedTiles] = useState({});
  const [prerequisites, setPrerequisites] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.prerequisites) {
      setPrerequisites(location.state.prerequisites);
      // Start with empty selection
      setSelectedTiles({});
    }
  }, [location.state]);

  const toggleSelection = (key) => {
    setSelectedTiles(prev => {
      const newSelection = { ...prev };
      if (newSelection[key]) {
        delete newSelection[key];
      } else {
        newSelection[key] = true;
      }
      return newSelection;
    });
  };
  
  const handleBack = () => {
    navigate('/upload');
  };

  const handleNext = async () => {
    try {
      // Create an object with only selected topics marked as true
      const selected = {};
      Object.keys(selectedTiles).forEach(key => {
        selected[key] = true;
      });
      
      console.log("Selected topics before navigation:", selected);
      
      // Save selected prerequisites to state
      navigate('/settings', {
        state: {
          ...location.state,
          selectedPrerequisites: Object.keys(selectedTiles).length > 0 
            ? selected  // Use our cleaner object with explicit boolean values
            : prerequisites  // Default to all if none selected
        }
      });
    } catch (err) {
      // Error handling
      console.log(err);
    }
  };

  // Navigation buttons component to reuse at top and bottom
  const NavigationButtons = () => (
    <div className="flex justify-between items-center mt-4 mb-4">
      <button
        onClick={handleBack}
        className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>
      
      <div className="text-gray-400">
        Selected topics: {Object.keys(selectedTiles).length} / {Object.keys(prerequisites).length}
      </div>
      
      <button
        onClick={handleNext}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors flex items-center"
      >
        Next
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>
    </div>
  );

  if (!location.state?.prerequisites) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8 flex items-center justify-center text-white">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Data Available</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-md hover:from-indigo-700 hover:to-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Select Required Prerequisites</h1>
        <p className="text-gray-400 mb-6">
          Select the topics you want to include in your presentation. 
          {Object.keys(selectedTiles).length === 0 && (
            <span className="text-indigo-400"> All topics will be included by default</span>
          )}
        </p>

        {/* Top navigation buttons */}
        <NavigationButtons />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(prerequisites).map(([title, items]) => (
            <div
              key={title}
              onClick={() => toggleSelection(title)}
              className={`relative p-6 rounded-lg shadow-md cursor-pointer transition-all
                ${selectedTiles[title] 
                  ? 'bg-indigo-900/30 border-2 border-indigo-500' 
                  : 'bg-gray-900/80 border-2 border-gray-800 hover:border-indigo-600'}`}
            >
              {selectedTiles[title] && (
                <CheckCircleIcon className="w-6 h-6 text-indigo-400 absolute top-2 right-2" />
              )}
              <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
              <ul className="list-disc list-inside space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="text-gray-400 text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setSelectedTiles({})}
              className="px-4 py-2 text-red-400 hover:text-red-300"
            >
              Clear Selection
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 text-red-400 rounded-md mb-4 border border-red-800">
              {error}
            </div>
          )}
          
          {/* Bottom navigation buttons */}
          <NavigationButtons />
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;