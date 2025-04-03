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
      // Save selected prerequisites to state
      navigate('/settings', {
        state: {
          ...location.state,
          selectedPrerequisites: Object.keys(selectedTiles).length > 0 
            ? selectedTiles 
            : prerequisites
        }
      });
    } catch (err) {
      // Error handling
      console.log(err)
    }
  };

  // Navigation buttons component to reuse at top and bottom
  const NavigationButtons = () => (
    <div className="flex justify-between items-center mt-4 mb-4">
      <button
        onClick={handleBack}
        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>
      
      <div className="text-gray-600">
        Selected topics: {Object.keys(selectedTiles).length} / {Object.keys(prerequisites).length}
      </div>
      
      <button
        onClick={handleNext}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
      >
        Next
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>
    </div>
  );

  if (!location.state?.prerequisites) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Required Prerequisites</h1>
        <p className="text-gray-600 mb-6">
          Select the topics you want to include in your presentation. 
          {Object.keys(selectedTiles).length === 0 && (
            <span className="text-blue-600"> All topics will be included by default</span>
          )}
        </p>

        {/* Top navigation buttons */}
        <NavigationButtons />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(prerequisites).map(([title, items]) => (
            <div
              key={title}
              onClick={() => toggleSelection(title)}
              className={`relative p-6 rounded-lg shadow-sm cursor-pointer transition-all
                ${selectedTiles[title] 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'bg-white border-2 border-gray-200 hover:border-blue-300'}`}
            >
              {selectedTiles[title] && (
                <CheckCircleIcon className="w-6 h-6 text-blue-600 absolute top-2 right-2" />
              )}
              <h3 className="text-lg font-semibold mb-3">{title}</h3>
              <ul className="list-disc list-inside space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="text-gray-600 text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setSelectedTiles({})}
              className="px-4 py-2 text-red-600 hover:text-red-700"
            >
              Clear Selection
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
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