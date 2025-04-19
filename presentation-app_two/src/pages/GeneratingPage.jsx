import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GalleryRender from '../components/GalleryRender';
import { ArrowPathIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const GeneratingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [galleryStatus, setGalleryStatus] = useState(null);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const apiInProgress = useRef(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const [showGallery, setShowGallery] = useState(false);

  // Set up a timer to track elapsed time
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [progress]);

  // Single API call function with configurable timeout
  const callAPI = async (endpoint, formData, errorMessage, extendedTimeout = false, required = true) => {
    try {
      // Use extended 10-minute timeout for execution-agent-parsing and generate-presentation
      const timeout = extendedTimeout ? 600000 : 600000; // 10 mins vs 2 mins
      
      // Log FormData contents for debugging
      if (formData instanceof FormData) {
        console.log(`📤 ${endpoint} request FormData contents:`);
        for (let [key, value] of formData.entries()) {
          console.log(`   ${key}: ${value}`);
        }
      }
      
      const response = await axios.post(`http://localhost:8000/${endpoint}`, formData, {
        timeout: timeout
      });
      console.log(`✅ ${endpoint} success:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`❌ ${errorMessage}:`, error);
      
      // More detailed error logging
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      
      // If endpoint is not required, just log the error and continue
      if (!required) {
        console.warn(`Optional endpoint ${endpoint} failed, continuing anyway`);
        return null;
      }
      
      throw new Error(`${errorMessage}: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Process gallery in parallel
  const processGallery = async (documentUrl) => {
    try {
      setGalleryStatus('processing');
      // Call the gallery API
      await axios.post('http://127.0.0.1:8001/process/url', {
        document_url: documentUrl
      });
      
      // Wait for the data to be ready
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
            setGalleryStatus('success');
            setGalleryLoaded(true);
          }
        } catch (err) {
          // Keep polling if 404 (not ready yet)
          if (err.response && err.response.status !== 404) {
            throw err;
          }
        }
      }
      
      if (!isReady) {
        throw new Error('Timed out waiting for gallery data');
      }
    } catch (error) {
      console.error('Gallery processing error:', error);
      setGalleryStatus('error');
    }
  };

  const generatePresentation = async () => {
    if (apiInProgress.current) return;
    apiInProgress.current = true;
    
    try {
      // Map student level to expected format
      const studentLevelMap = {
        "1": "phd researcher",
        "2": "masters student", 
        "3": "undergraduate student"
      };
      
      const studentLevelText = studentLevelMap[location.state.studentLevel] || "masters student";
      const numSlides = location.state.settings.num_slides;
      const templateName = location.state.templateName;
      const documentUrl = location.state.sourceType === 'url' 
        ? location.state.sourceIdentifier 
        : "https://arxiv.org/pdf/1706.03762"; // Default if uploaded PDF
      
      // Use paperUrl from location state if available
      const paperUrl = location.state.paperUrl || documentUrl;
      
      console.log('Starting presentation generation process with:');
      console.log('- Student level:', studentLevelText);
      console.log('- Num slides:', numSlides);
      console.log('- Template:', templateName);
      console.log('- Document URL:', documentUrl);
      console.log('- Paper URL:', paperUrl);
      console.log('- Generate Gallery:', location.state.settings.generate_gallery);
      
      // Start gallery generation in parallel if enabled
      if (location.state.settings.generate_gallery) {
        processGallery(paperUrl);
      }
      
      // Fix - use the actual selected template
      const safeTemplateName = templateName;
      console.log('🔍 Using template:', safeTemplateName);

      // 1. First analyze the document to generate prerequisites
      setStatus('Analyzing prerequisites...');
      setProgress(10);
      const prereqFormData = new FormData();
      prereqFormData.append("url", documentUrl);
      prereqFormData.append("student_level", location.state.studentLevel);
      await callAPI('analyze/url', prereqFormData, 'Prerequisites analysis failed');
      
      // 2. Extract template layout (standard timeout)
      setStatus('Processing template...');
      setProgress(20);
      const templateFormData = new FormData();
      templateFormData.append("template_name", safeTemplateName);
      await callAPI('extract-template-layout', templateFormData, 'Template layout extraction failed');
      
      // 3. Convert placeholders (standard timeout)
      setProgress(30);
      const placeholdersFormData = new FormData();
      placeholdersFormData.append("layout_extracted_path", "data/metadata/layout_details.json");
      await callAPI('convert-placeholders', placeholdersFormData, 'Placeholder conversion failed');
      
      // 4. OCR on URL for figures (standard timeout)
      setStatus('Extracting figures from paper...');
      setProgress(40);
      const ocrFormData = new FormData();
      ocrFormData.append("document_url", documentUrl);
      
      const ocrResult = await callAPI('ocr-figure-url', ocrFormData, 'OCR extraction failed');
      
      // 5. Save figures from OCR (standard timeout)
      setProgress(50);
      const figuresResult = await callAPI('save-figures', ocrResult.ocr_response, 'Figure saving failed');
      
      // 6. Generate slide data (EXTENDED 10-min timeout)
      setStatus('Creating slide content...');
      setProgress(60);
      const slideFormData = new FormData();
      slideFormData.append("student_level", studentLevelText);
      slideFormData.append("document_url", documentUrl);
      slideFormData.append("num_slides", numSlides);
      
      // Add selected topics if available
      if (location.state.selectedPrerequisites) {
        // Get keys of selected topics (only ones that are true)
        const selectedTopics = Object.keys(location.state.selectedPrerequisites).filter(
          key => location.state.selectedPrerequisites[key] === true
        );
        
        console.log('Selected topics:', selectedTopics);
        console.log('Full selectedPrerequisites:', location.state.selectedPrerequisites);
        
        // Append each selected topic as an array item
        if (selectedTopics.length > 0) {
          selectedTopics.forEach(topic => {
            slideFormData.append("selected_topics", topic);
          });
          console.log('Added selected topics to FormData');
        } else {
          console.log('No topics were selected (empty array)');
        }
      } else {
        console.log('No selectedPrerequisites found in location.state');
      }
      
      await callAPI('slide-data-gen', slideFormData, 'Slide data generation failed', true);
      
      // 7. Process slides data (standard timeout)
      setStatus('Processing slides...');
      setProgress(70);
      await callAPI('process-slides-data', new FormData(), 'Slide processing failed');

      // 8. Enhance slides data (standard timeout)
      setStatus('Enhancing slides...');
      setProgress(80);
      await callAPI('enhace-slides-agent', new FormData(), 'Slide enhancement failed');
      
      // 8. Execute agent parsing (EXTENDED 10-min timeout)
      setStatus('Designing your presentation...');
      setProgress(90);
      const agentFormData = new FormData();
      agentFormData.append("template_name", safeTemplateName);
      console.log('🔍 Execution agent using template:', safeTemplateName);
      
      try {
        await callAPI(
          'execution-agent-parsing', 
          agentFormData, 
          'Layout parsing failed', 
          true // Use extended timeout
        );
      } catch (error) {
        console.error('❌ Execution agent parsing failed:', error);
        console.warn('Continuing despite layout parsing failure - will use fallback method');
        // Don't rethrow, continue with presentation generation
      }
      
      // 9. Generate the final presentation (EXTENDED 10-min timeout)
      setStatus('Building your presentation...');
      setProgress(95);
      const pptFormData = new FormData();
      pptFormData.append("template_name", safeTemplateName);
      pptFormData.append("execution_json_filename", "execution_agent.json");
      pptFormData.append("output_ppt_filename", "generated_presentation.pptx");
      pptFormData.append("processed_layout_filename", "processed_layout.json");
      console.log('🔍 Generating presentation with template:', safeTemplateName);
      
      await callAPI(
        'generate-presentation', 
        pptFormData, 
        'Presentation generation failed',
        true // Use extended timeout
      );
      
      setProgress(100);
      setStatus('Presentation ready!');
      
      // Navigate to success page
      navigate('/success', { 
        state: { 
          fileName: 'generated_presentation.pptx',
          galleryEnabled: location.state.settings.generate_gallery,
          paperUrl: paperUrl,
          galleryLoaded: galleryLoaded,
          ocrProcessed: true
        } 
      });

      } catch (error) {
      setError(error.message);
      console.error("Generation error:", error);
    } finally {
      apiInProgress.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setTimeElapsed(0);
    generatePresentation();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate('/');
  };

  useEffect(() => {
    generatePresentation();
  }, []);

  // Error view with updated design
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center border border-gray-100">
          <div className="bg-red-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-500 text-transparent bg-clip-text">Generation Failed</h1>
          <p className="text-gray-800 mb-6">{error}</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleRetry} 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-md flex items-center justify-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>
            
            <button 
              onClick={handleCancel}
              className="w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors shadow-sm border border-gray-200 flex items-center justify-center"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main generating view with updated design
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">Creating Your Presentation</h1>
          <p className="opacity-90">This may take a few minutes. Please don't close this page.</p>
        </div>
        
        {/* Main content area */}
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
          {/* Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{status}</h2>
            <p className="text-gray-500">Time elapsed: {formatTime(timeElapsed)}</p>
          </div>
          
          {/* Progress bar */}
          <div className="mb-10">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-500 ease-out animate-pulse"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progress: {progress}%</span>
              <span>{progress === 100 ? 'Complete!' : 'Processing...'}</span>
            </div>
          </div>
          
          {/* Loading animation */}
          <div className="flex justify-center mb-8">
            <div className="loading-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          
          {/* Gallery preview if available */}
          {galleryStatus && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Gallery Generation: {galleryStatus === 'processing' ? 'In Progress' : galleryStatus === 'success' ? 'Complete' : 'Failed'}
              </h3>
              
              {galleryLoaded && (
                <button
                  onClick={() => setShowGallery(!showGallery)}
                  className="text-sm bg-gradient-to-r from-indigo-500 to-blue-400 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-blue-500 transition-colors"
                >
                  {showGallery ? 'Hide Gallery' : 'Preview Gallery'}
                </button>
              )}
              
              {showGallery && galleryLoaded && (
                <div className="mt-4 border border-gray-200 rounded-lg p-2 bg-white">
                  <GalleryRender />
                </div>
              )}
            </div>
          )}
          
          {/* Cancel button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel and return to home
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS for loading spinner */}
      <style jsx>{`
        .loading-spinner {
          display: inline-block;
          position: relative;
          width: 80px;
          height: 80px;
        }
        .loading-spinner div {
          position: absolute;
          top: 33px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: linear-gradient(to right, #6366f1, #3b82f6);
          animation-timing-function: cubic-bezier(0, 1, 1, 0);
        }
        .loading-spinner div:nth-child(1) {
          left: 8px;
          animation: loading-spinner1 0.6s infinite;
        }
        .loading-spinner div:nth-child(2) {
          left: 8px;
          animation: loading-spinner2 0.6s infinite;
        }
        .loading-spinner div:nth-child(3) {
          left: 32px;
          animation: loading-spinner2 0.6s infinite;
        }
        .loading-spinner div:nth-child(4) {
          left: 56px;
          animation: loading-spinner3 0.6s infinite;
        }
        @keyframes loading-spinner1 {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes loading-spinner3 {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(0);
          }
        }
        @keyframes loading-spinner2 {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(24px, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default GeneratingPage;