import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowDownTrayIcon, HomeIcon, PhotoIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

const VegaViewer = ({ isOpen, onClose, galleryData }) => {
  const [downloadNotification, setDownloadNotification] = useState(null);
  
  if (!isOpen) return null;
  
  const handleDownloadImage = (imageId, caption) => {
    const downloadUrl = `http://127.0.0.1:8001/figures/${imageId}`;
    const link = document.createElement('a');
    const filename = caption ? `${caption.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.jpg` : `figure_${imageId}`;
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    setDownloadNotification(`Downloaded ${filename}`);
    setTimeout(() => setDownloadNotification(null), 3000);
  };
  
  const handleExportTable = (table, index) => {
    // Create CSV content
    let csvContent = "";
    
    // Add headers
    csvContent += table.headers.map(h => `"${h}"`).join(",") + "\r\n";
    
    // Add rows
    table.rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\r\n";
    });
    
    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `table_${index + 1}_${table.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.csv`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    setDownloadNotification(`Exported ${filename}`);
    setTimeout(() => setDownloadNotification(null), 3000);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-4">
      <div className="bg-[#27292d] text-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-800 border-b border-gray-700">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-bold">VegaViewer</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-200 hover:text-white bg-gray-800/30 hover:bg-gray-800/70 rounded-full p-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-auto">
          <div className="p-6 space-y-12">
            {galleryData?.images?.map((image, index) => (
              <div key={`image-${index}`} className="bg-gray-100 text-black p-6 rounded-lg shadow-md relative">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Figure {index + 1}: {image.caption || 'Image'}</h3>
                <div className="bg-white p-4 rounded border relative overflow-hidden">
                  <img 
                    src={`http://127.0.0.1:8001/figures/${image.id}`} 
                    alt={image.caption || `Image ${index + 1}`}
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                  
                  {/* Download button */}
                  <button 
                    onClick={() => handleDownloadImage(image.id, image.caption || `Figure_${index + 1}`)}
                    className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg ring-0 ring-blue-300 hover:ring-2 transition-all"
                    title="Download image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
                {image.caption && (
                  <p className="mt-4 text-gray-700 italic">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
            
            {galleryData?.tables?.map((table, index) => (
              <div key={`table-${index}`} className="bg-gray-100 text-black p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Table {index + 1}: {table.title}</h3>
                  <button
                    onClick={() => handleExportTable(table, index)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center hover:bg-green-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto bg-white rounded border">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {table.headers.map((header, i) => (
                          <th key={i} className="px-4 py-3 text-left bg-green-500 text-white font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 text-gray-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {table.title}
                </p>
              </div>
            ))}
            
            {(!galleryData?.images?.length && !galleryData?.tables?.length) && (
              <div className="text-center py-10 text-gray-400">
                No content found in the paper
              </div>
            )}
          </div>
        </div>
        
        {/* Download notification toast */}
        {downloadNotification && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-up flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{downloadNotification}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  const [galleryData, setGalleryData] = useState(null);
  const [galleryStatus, setGalleryStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  
  const { fileName, galleryEnabled, paperUrl, ocrProcessed } = location.state || { 
    fileName: 'generated_presentation.pptx',
    galleryEnabled: false,
    paperUrl: null,
    ocrProcessed: false
  };
  
  // Function to clean up data after successful download
  const cleanupData = async () => {
    try {
      console.log("Cleaning up figures and formulas data...");
      await axios.post('http://localhost:8000/cleanup-data');
      console.log("Cleanup completed successfully");
    } catch (error) {
      console.error("Error cleaning up data:", error);
    }
  };
  
  const handleDownload = () => {
    window.location.href = `http://localhost:8000/download-presentation?filename=${fileName}`;
    
    // Mark as downloaded and clean up after a small delay to ensure download started
    if (!downloadCompleted) {
      setDownloadCompleted(true);
      setTimeout(() => {
        cleanupData();
      }, 2000);
    }
  };

  useEffect(() => {
    // If gallery is enabled, try to fetch the data
    if (galleryEnabled && paperUrl) {
      fetchGalleryData();
    }
  }, [galleryEnabled, paperUrl]);

  const fetchGalleryData = async () => {
    try {
      // Always try to fetch existing data first before trying to process
      let existingData = false;
      
      try {
        const response = await axios.get('http://127.0.0.1:8001/data', { timeout: 5000 });
        if (response.status === 200 && response.data) {
          console.log("Gallery data already exists, loading it...");
          setGalleryData(response.data);
          setGalleryStatus('ready');
          existingData = true;
          return;
        }
      } catch (err) {
        // If 404, the data doesn't exist yet - continue to creation
        if (err.response?.status !== 404) {
          console.error("Error fetching gallery data:", err);
          // If ECONNREFUSED or network error, the server is down
          if (err.code === 'ECONNREFUSED' || !err.response) {
            setGalleryStatus('error');
            setErrorMsg('Gallery server is unreachable. Please check that it is running.');
            return;
          }
        }
        console.log("Gallery data doesn't exist yet, will create it");
      }

      if (!existingData) {
        // If we reach here, we need to create the gallery
        setGalleryStatus('processing');
        
        // Check if the OCR was already processed by the presentation generation
        if (ocrProcessed) {
          console.log("OCR already processed during presentation generation, waiting for gallery data to become available");
          // Just wait a moment to ensure the OCR process has had time to finish
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log("OCR not processed yet, will trigger the processing now");
          
          // Use proper JSON format and headers to avoid OPTIONS error
          try {
            console.log("Processing URL to generate gallery data:", paperUrl);
            await axios.post('http://127.0.0.1:8001/process/url', 
              { document_url: paperUrl },
              { 
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                timeout: 15000 // 15 second timeout
              }
            );
          } catch (err) {
            console.error("Error starting gallery processing:", err);
            // If can't connect to server, mark as error
            if (err.code === 'ECONNREFUSED' || !err.response) {
              setGalleryStatus('error');
              setErrorMsg('Gallery server is unreachable. Please check that it is running.');
              return;
            }
          }
        }
        
        // Poll until the data is ready
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30;
        const maxDirectAttempts = 3; // Maximum attempts to process directly
        let directAttempts = 0;
        
        while (!isReady && attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const response = await axios.get('http://127.0.0.1:8001/data', { timeout: 5000 });
            if (response.status === 200 && response.data) {
              setGalleryData(response.data);
              setGalleryStatus('ready');
              isReady = true;
              console.log("Gallery data is ready after polling:", attempts);
            }
          } catch (err) {
            if (err.response?.status !== 404) {
              // If we can't connect to server anymore, break out
              if (err.code === 'ECONNREFUSED' || !err.response) {
                console.error("Server unreachable during polling:", err);
                setErrorMsg('Lost connection to gallery server during processing.');
                break;
              }
              throw err;
            }
            
            // If we've waited for a while (10 attempts) and still don't have data
            // try to process the URL directly again
            if (attempts % 10 === 0 && directAttempts < maxDirectAttempts) {
              directAttempts++;
              console.log(`Still waiting for data, trying direct processing attempt ${directAttempts}`);
              
              try {
                await axios.post('http://127.0.0.1:8001/process/url', 
                  { document_url: paperUrl },
                  { 
                    headers: { 
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    timeout: 15000
                  }
                );
              } catch (directErr) {
                console.warn("Direct processing attempt failed:", directErr);
                // Continue polling even if this fails
              }
            }
          }
        }
        
        if (!isReady) {
          setGalleryStatus('error');
          setErrorMsg('Timed out waiting for gallery data to be ready.');
        }
      }
    } catch (error) {
      console.error("Error processing gallery:", error);
      setGalleryStatus('error');
      setErrorMsg(`Gallery processing error: ${error.message}`);
    }
  };

  // Add retry functionality
  const handleRetryGallery = () => {
    setGalleryStatus('loading');
    setGalleryData(null);
    setErrorMsg('');
    fetchGalleryData();
  };

  const getGalleryButtonStyle = () => {
    if (galleryStatus === 'ready') {
      return "w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 flex items-center justify-center transition-colors";
    } else if (galleryStatus === 'error') {
      return "w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 flex items-center justify-center transition-colors cursor-pointer";
    } else {
      return "w-full bg-blue-500 text-white py-3 px-4 rounded-md flex items-center justify-center transition-colors cursor-not-allowed";
    }
  };

  const getGalleryButtonText = () => {
    if (galleryStatus === 'ready') {
      return (
        <>
          <PhotoIcon className="h-5 w-5 mr-2" />
          View Paper Gallery
        </>
      );
    } else if (galleryStatus === 'error') {
      return (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Gallery Processing
        </>
      );
    } else {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Gallery Processing...
        </>
      );
    }
  };

  // Show error tooltips on hover for more context
  const showErrorTooltip = galleryStatus === 'error' && errorMsg;

  // Handle retry with different template
  const handleStartOver = () => {
    navigate('/');
  };
  
  const handleCreatePodcast = () => {
    navigate('/podcast', { state: location.state });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto bg-gray-950 rounded-xl shadow-2xl p-8 border border-gray-800">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-900/30 rounded-full mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Your Presentation Is Ready!</h1>
          <p className="text-gray-400 mt-3 text-lg">
            You can download your presentation now or create additional materials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-8 shadow-xl border border-blue-800/30 hover:border-blue-700/50 transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Download Presentation</h2>
            <p className="text-gray-300 mb-6 min-h-[60px]">
              Your presentation has been successfully generated and is ready to download.
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 w-full transition-all duration-300"
            >
              <ArrowDownTrayIcon className="h-6 w-6 mr-2" /> Download PPTX
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-8 shadow-xl border border-purple-800/30 hover:border-purple-700/50 transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Create Podcast</h2>
            <p className="text-gray-300 mb-6 min-h-[60px]">
              Turn your paper into a podcast with a host and expert discussing the key points.
            </p>
            <button
              onClick={handleCreatePodcast}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 w-full transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Create Podcast
            </button>
          </div>
        </div>

        {/* Enhanced gallery container */}
        {galleryEnabled && (
          <div className="mb-10 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-xl p-8 shadow-xl border border-emerald-800/30 hover:border-emerald-700/50 transition-all duration-300">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Paper Gallery</h2>
            <p className="text-gray-300 mb-6">
              {galleryStatus === 'ready' 
                ? "View and explore the extracted images and tables from your paper."
                : galleryStatus === 'processing'
                ? "The gallery is still being generated. This could take a few minutes."
                : galleryStatus === 'error'
                ? errorMsg || "There was an error generating the gallery. You can try again."
                : "Loading gallery status..."}
            </p>
            <button
              onClick={() => galleryStatus === 'ready' ? setShowGallery(true) : handleRetryGallery()}
              disabled={galleryStatus === 'processing'}
              className={`flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium ${
                galleryStatus === 'ready'
                  ? 'text-white bg-emerald-600 hover:bg-emerald-500'
                  : galleryStatus === 'processing'
                  ? 'text-gray-400 bg-gray-700 cursor-not-allowed'
                  : 'text-white bg-amber-600 hover:bg-amber-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 w-full transition-all duration-300`}
            >
              {galleryStatus === 'ready' 
                ? (<><PhotoIcon className="h-6 w-6 mr-2" /> View Gallery</>) 
                : galleryStatus === 'processing'
                ? (<><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div> Processing...</>)
                : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg> Retry Gallery Generation</>)}
            </button>
          </div>
        )}

        <button 
          onClick={handleStartOver}
          className="w-full bg-gray-800 text-gray-300 py-4 px-6 rounded-lg hover:bg-gray-700 flex items-center justify-center transition-all duration-300 border border-gray-700 hover:border-gray-600"
        >
          <HomeIcon className="h-6 w-6 mr-2" />
          Back to Home
        </button>
      </div>
      
      {/* VegaViewer style gallery modal */}
      {showGallery && galleryData && (
        <VegaViewer
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          galleryData={galleryData}
        />
      )}
    </div>
  );
};

export default SuccessPage; 