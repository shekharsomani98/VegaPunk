import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Gallery Modal Component
const GalleryModal = ({ isOpen, onClose, galleryData }) => {
  const [activeTab, setActiveTab] = useState('images');
  
  if (!isOpen || !galleryData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-500 to-cyan-400">
          <h2 className="text-xl font-bold text-white">Paper Content Gallery</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'images' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('images')}
            >
              Images ({galleryData.images?.length || 0})
            </button>
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'tables' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('tables')}
            >
              Tables ({galleryData.tables?.length || 0})
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-6">
          {activeTab === 'images' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryData.images?.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <img 
                      src={`http://127.0.0.1:8001/figures/${image.id}`} 
                      alt={image.caption || `Image ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-3 border-t bg-gray-50">
                    <p className="text-sm text-gray-700">{image.caption || `Image ${index + 1}`}</p>
                    <a 
                      href={`http://127.0.0.1:8001/figures/${image.id}`}
                      download={image.id}
                      className="mt-2 inline-block text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Image
                    </a>
                  </div>
                </div>
              ))}
              {galleryData.images?.length === 0 && (
                <div className="col-span-2 text-center py-10 text-gray-500">No images found in the paper</div>
              )}
            </div>
          )}
          
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {galleryData.tables?.map((table, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
                    <h3 className="font-medium">{table.title}</h3>
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          {table.headers.map((header, i) => (
                            <th key={i} className="px-3 py-2 bg-gray-100 text-left text-sm font-medium text-gray-700">
                              {header}
                            </th>
                          ))}
                        </tr>
                        {table.subheaders?.length > 0 && (
                          <tr>
                            {table.subheaders.map((subheader, i) => (
                              <th key={i} className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-700">
                                {subheader}
                              </th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 text-sm text-gray-700">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {galleryData.tables?.length === 0 && (
                <div className="text-center py-10 text-gray-500">No tables found in the paper</div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const GalleryRender = ({ paperUrl, onClose, autoLoad = false }) => {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryData, setGalleryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingStep, setProcessingStep] = useState('');

  // Function to load gallery data if it already exists
  const loadGalleryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://127.0.0.1:8001/data');
      if (response.status === 200 && response.data) {
        setGalleryData(response.data);
        setShowGallery(true);
        return true;
      }
      return false;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return false;
      }
      setError('Error loading gallery data');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start the gallery generation process
  const startGalleryGeneration = async () => {
    if (!paperUrl) {
      setError('No paper URL provided');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Starting extraction process...');
    
    try {
      // Step 1: Request processing of the paper
      await axios.post('http://127.0.0.1:8001/process/url', {
        document_url: paperUrl
      });
      
      setProcessingStep('Extracting images and tables...');
      
      // Step 2: Poll until the data is ready
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max wait time
      
      while (!isReady && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds between polls
        
        try {
          const response = await axios.get('http://127.0.0.1:8001/data');
          if (response.status === 200 && response.data) {
            isReady = true;
            setGalleryData(response.data);
            setShowGallery(true);
          }
        } catch (err) {
          // Keep polling if 404 (not ready yet)
          if (err.response && err.response.status !== 404) {
            throw err;
          }
          setProcessingStep(`Processing paper... (${attempts}/${maxAttempts})`);
        }
      }
      
      if (!isReady) {
        throw new Error('Timed out waiting for gallery data');
      }
      
    } catch (err) {
      console.error('Error processing gallery:', err);
      setError('Failed to process the paper. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // When component loads, check if auto-load is enabled
  useEffect(() => {
    if (autoLoad && paperUrl) {
      console.log('Auto-loading gallery with paperUrl:', paperUrl);
      // Try to load existing data first
      loadGalleryData().then(dataExists => {
        if (!dataExists) {
          // If no data exists yet, start generation process
          startGalleryGeneration();
        }
      });
    }
  }, [autoLoad, paperUrl]);

  // If this is used as a standalone component (not auto-load), show UI
  if (!autoLoad) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">Paper Gallery</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {isProcessing ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-600">{processingStep}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-600">Loading gallery data...</p>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Extract and view images and tables from the paper</p>
            <button
              onClick={() => loadGalleryData().then(exists => { if (!exists) startGalleryGeneration(); })}
              disabled={!paperUrl || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Extract Content
            </button>
          </div>
        )}
        
        <GalleryModal 
          isOpen={showGallery}
          onClose={() => {
            setShowGallery(false);
            if (onClose) onClose();
          }}
          galleryData={galleryData}
        />
      </div>
    );
  }
  
  // If auto-load is enabled, just return the modal
  return (
    <GalleryModal 
      isOpen={showGallery}
      onClose={() => {
        setShowGallery(false);
        if (onClose) onClose();
      }}
      galleryData={galleryData}
    />
  );
};

export default GalleryRender;
