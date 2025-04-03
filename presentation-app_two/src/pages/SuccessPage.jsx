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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Presentation Generated!</h1>
        <p className="text-gray-600 mb-6">
          Your presentation has been successfully created and is ready to download.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={handleDownload}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Presentation
          </button>
          
          {galleryEnabled && (
            <div className="relative">
              <button 
                onClick={() => galleryStatus === 'ready' ? setShowGallery(true) : galleryStatus === 'error' ? handleRetryGallery() : null}
                className={getGalleryButtonStyle()}
                disabled={galleryStatus === 'processing' || galleryStatus === 'loading'}
              >
                {getGalleryButtonText()}
              </button>
              
              {showErrorTooltip && (
                <div className="absolute bottom-full left-0 mb-2 w-full p-2 bg-red-100 text-red-700 text-xs rounded shadow-lg">
                  {errorMsg || "There was an error processing the gallery. Click to retry."}
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Back to Home
          </button>
        </div>
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