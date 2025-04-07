import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GalleryRender from '../components/GalleryRender';

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

  // Handle retry with different template
  const handleRetry = () => {
    navigate('/template', { 
      state: location.state
    });
  };

  // Force to restart or cancel if stuck
  const handleCancel = () => {
    navigate('/');
  };

  useEffect(() => {
    generatePresentation();
    
    // Cleanup function
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Only show cancel option for extended periods of inactivity
  const showCancelOption = timeElapsed > 300; // 5 minutes

  if (error) {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center mx-auto">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Generation Error</h2>
          <p className="text-gray-700 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Choose Different Template
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Return to Home
            </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center mx-auto">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">{status}</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
          <p className="text-gray-500 mt-2">
            {progress}% complete • Time elapsed: {formatTime(timeElapsed)}
          </p>
          {status === 'Designing your presentation...' || status === 'Building your presentation...' ? (
            <p className="text-yellow-600 text-sm mt-2">
              This step may take several minutes. Please be patient.
            </p>
          ) : null}
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-600">
            Template: <span className="font-medium">{location.state.templateName}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Slides: <span className="font-medium">{location.state.settings.num_slides}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Level: <span className="font-medium">
              {location.state.studentLevel === "1" ? "PhD Researcher" :
               location.state.studentLevel === "2" ? "Masters Student" : 
               "Undergraduate Student"}
            </span>
          </p>
        </div>
        
        {showCancelOption && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-amber-600 mb-3">
              This is taking longer than expected. The server might be processing a complex document.
            </p>
            <button
              onClick={handleCancel}
              className="w-full py-2 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Cancel and return to home
            </button>
          </div>
        )}
      </div>
      
      {/* Add the gallery component if gallery generation was enabled */}
      {location.state?.settings?.generate_gallery && (
        <div className="mt-6 w-full max-w-md mx-auto">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-2">Paper Gallery</h2>
            {galleryStatus === 'success' ? (
              <>
                <p className="text-green-600 mb-3">
                  Gallery successfully generated! You can view it on the success page.
                </p>
              </>
            ) : galleryStatus === 'error' ? (
              <p className="text-red-600 mb-3">
                There was an issue generating the gallery. You can try again later.
              </p>
            ) : (
              <p className="text-gray-600 mb-3">
                Extracting images and tables from your paper...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratingPage;