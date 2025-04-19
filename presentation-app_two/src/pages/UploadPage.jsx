import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// Cache for URL analysis results
const analysisCache = {};

const UploadPage = () => {
  const [arxivUrl, setArxivUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState([]);
  const navigate = useNavigate();

  // Load recent URLs from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('recentArxivUrls');
    if (stored) {
      try {
        setRecentUrls(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored URLs', e);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setPdfFile(acceptedFiles[0]);
      setArxivUrl(''); // Clear URL if file is selected
    },
    accept: {'application/pdf': ['.pdf']},
    maxFiles: 1,
    multiple: false
  });

  const isValidArxivUrl = url => /^https?:\/\/arxiv\.org\/(abs|pdf)\/\d{4}\.\d+(v\d+)?(\.pdf)?$/.test(url);

  const addToRecentUrls = (url) => {
    // Add to recent URLs and save to localStorage (max 5)
    const updatedUrls = [url, ...recentUrls.filter(item => item !== url)].slice(0, 5);
    setRecentUrls(updatedUrls);
    localStorage.setItem('recentArxivUrls', JSON.stringify(updatedUrls));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      
      if (arxivUrl) {
        if (!isValidArxivUrl(arxivUrl)) {
          throw new Error('Invalid arXiv URL format');
        }

        // Check if we have cached results for this URL
        if (analysisCache[arxivUrl]) {
          console.log('Using cached analysis for URL:', arxivUrl);
          addToRecentUrls(arxivUrl);
          
          navigate('/select', { 
            state: { 
              sourceType: 'url',
              sourceIdentifier: arxivUrl,
              paperUrl: arxivUrl,
              prerequisites: analysisCache[arxivUrl]
            } 
          });
          return;
        }

        // Create form data for URL analysis
        const formData = new FormData();
        formData.append('url', arxivUrl);
        formData.append('student_level', '2'); // Default to masters student

        // Call analyze URL endpoint to get prerequisites
        const response = await axios.post('http://localhost:8000/analyze/url', formData);
        
        if (!response.data || !response.data.prerequisites) {
          throw new Error('Failed to analyze paper. Please try again.');
        }

        // Cache the analysis results
        analysisCache[arxivUrl] = response.data.prerequisites;
        addToRecentUrls(arxivUrl);
        
        // Navigate with the prerequisite data and source info
        navigate('/select', { 
          state: { 
            sourceType: 'url',
            sourceIdentifier: arxivUrl,
            paperUrl: arxivUrl,
            prerequisites: response.data.prerequisites
          } 
        });
      }
      else if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('student_level', '2'); // Default to masters student

        const response = await axios.post('http://localhost:8000/analyze/pdf', formData);

        if (!response.data || !response.data.prerequisites) {
          throw new Error('Failed to analyze PDF. Please try again.');
        }
        
        navigate('/select', { 
          state: { 
            sourceType: 'pdf',
            sourceIdentifier: 'uploaded-pdf',
            paperUrl: "uploaded-pdf",
            prerequisites: response.data.prerequisites
          } 
        });
      }
      else {
        throw new Error('Please provide either URL or PDF');
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold">Create Presentation</h1>
          <p className="mt-2 opacity-80">Upload a research paper to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Analyze from arXiv URL</h2>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <input
                type="url"
                value={arxivUrl}
                onChange={(e) => {
                  setArxivUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://arxiv.org/abs/2406.15758"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!!pdfFile || isLoading}
              />
            </div>
            
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Enter a valid arXiv URL (e.g., https://arxiv.org/abs/2406.15758)
            </p>
            
            {/* Recent URLs */}
            {recentUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Recent papers:</p>
                <div className="flex flex-wrap gap-2">
                  {recentUrls.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setArxivUrl(url)}
                      className="text-xs bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 px-3 py-1.5 rounded-full hover:from-indigo-100 hover:to-blue-100 transition-colors border border-indigo-100 shadow-sm flex items-center"
                    >
                      <svg className="h-3 w-3 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {url.split('/').pop()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="w-16 h-px bg-gray-300"></div>
            <div className="mx-4 text-gray-500 font-medium">OR</div>
            <div className="w-16 h-px bg-gray-300"></div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Upload PDF</h2>
            </div>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : isLoading 
                    ? 'border-gray-300 opacity-50' 
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            >
              <input {...getInputProps()} disabled={isLoading} />
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <p className="text-gray-700 font-medium">
                  {isDragActive ? 'Drop your PDF here' : 'Click to browse or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PDF only (max 50 MB)
                </p>
              </div>
              
              {pdfFile && (
                <div className="mt-4 bg-indigo-50 rounded-lg p-3 inline-flex items-center">
                  <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-indigo-700 font-medium">{pdfFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 bg-white rounded-xl shadow-md border border-gray-100 text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="loader">
                  <div className="paper-plane"></div>
                </div>
              </div>
              <p className="font-bold text-xl text-gray-800 mb-2">Analyzing Paper</p>
              <p className="text-gray-600">This may take a minute while we extract the key concepts</p>
              <div className="mt-5 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="animate-pulse-width bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full"></div>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-medium rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-md flex items-center justify-center"
              disabled={(!arxivUrl && !pdfFile) || isLoading}
            >
              <span>Continue</span>
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {/* Add this CSS for the funky loader animation */}
      <style jsx>{`
        .loader {
          position: relative;
          width: 120px;
          height: 90px;
        }
        .paper-plane {
          position: absolute;
          top: 0;
          left: 0;
          width: 50px;
          height: 50px;
          background-color: #6366F1;
          border-radius: 0 10px 0 50px;
          transform: rotate(45deg);
          animation: fly 2.4s cubic-bezier(.99,.01,.25,1) infinite;
        }
        .paper-plane:before {
          content: '';
          position: absolute;
          top: 17px;
          left: -11px;
          width: 20px;
          height: 20px;
          background-color: #6366F1;
          transform: skew(-20deg, -20deg);
        }
        .paper-plane:after {
          content: '';
          position: absolute;
          left: -28px;
          width: 30px;
          height: 30px;
          background-color: #6366F1;
          border-radius: 4px 0 10px 0;
          transform: skew(-30deg, -30deg);
        }
        
        @keyframes fly {
          0% { transform: rotate(45deg) translateX(-120px) translateY(-120px); }
          30% { transform: rotate(45deg) translateX(50px) translateY(50px); }
          50% { transform: rotate(45deg) translateX(50px) translateY(50px); background-color: #4F46E5; }
          66% { transform: rotate(45deg) translateX(0px) translateY(0px); }
          100% { transform: rotate(45deg) translateX(120px) translateY(120px); }
        }
        
        @keyframes pulse-width {
          0%, 100% { width: 30%; }
          50% { width: 70%; }
        }
        
        .animate-pulse-width {
          animation: pulse-width 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UploadPage;