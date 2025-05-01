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
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'pdf'
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

  // Reset form when switching tabs
  useEffect(() => {
    setError('');
    if (activeTab === 'url') {
      setPdfFile(null);
    } else {
      setArxivUrl('');
    }
  }, [activeTab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type === 'application/pdf') {
          setPdfFile(file);
          setActiveTab('pdf');
        } else {
          setError('Please upload a PDF file.');
        }
      }
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
      
      if (activeTab === 'url' && arxivUrl) {
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
      else if (activeTab === 'pdf' && pdfFile) {
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
        throw new Error(`Please provide ${activeTab === 'url' ? 'an arXiv URL' : 'a PDF file'}`);
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8 text-white relative overflow-hidden">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="particles-container">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-indigo-800 to-blue-700 rounded-2xl shadow-2xl p-8 mb-10 border border-indigo-600/20 backdrop-blur-sm relative overflow-hidden">
          <div className="glow-effect absolute -inset-1 rounded-3xl blur-lg opacity-20 bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse-slow"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Create Presentation</h1>
            <p className="text-lg text-blue-100/80">Upload a research paper to get started</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900/80 rounded-xl p-1 backdrop-blur-sm border border-gray-800 shadow-xl">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center ${
                  activeTab === 'url' 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                arXiv URL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center ${
                  activeTab === 'pdf' 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Upload
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {activeTab === 'url' && (
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 p-8 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.01] hover:border-indigo-900/30">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/10">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Analyze from arXiv URL</h2>
                  <p className="text-gray-400 text-sm">Enter a link to an arXiv paper</p>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="w-full pl-12 pr-4 py-4 border border-gray-700 bg-gray-900/80 rounded-lg shadow-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 text-lg transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <p className="mt-3 text-sm text-gray-400 flex items-center pl-1">
                <svg className="h-4 w-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Enter a valid arXiv URL (e.g., https://arxiv.org/abs/2406.15758)
              </p>
              
              {/* Recent URLs */}
              {recentUrls.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent papers:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentUrls.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setArxivUrl(url)}
                        className="text-xs bg-gradient-to-r from-gray-800 to-gray-900 text-indigo-300 px-3 py-2 rounded-full hover:from-indigo-900/30 hover:to-blue-900/30 transition-all duration-300 border border-gray-700 shadow-md flex items-center hover:scale-105 hover:shadow-indigo-500/20 hover:shadow-lg"
                      >
                        <svg className="h-3 w-3 mr-1.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {url.split('/').pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 p-8 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.01] hover:border-indigo-900/30">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/10">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Upload PDF</h2>
                  <p className="text-gray-400 text-sm">Drop a PDF file or browse your files</p>
                </div>
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group relative
                  ${isDragActive 
                    ? 'border-indigo-500 bg-indigo-900/30 scale-[1.02]' 
                    : isLoading 
                      ? 'border-gray-700 opacity-50' 
                      : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/20'}`}
                style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-0 group-hover:opacity-15 transition duration-500"></div>
                <input {...getInputProps()} disabled={isLoading} />
                
                <div className="flex flex-col items-center relative">
                  <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/10 group-hover:shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <p className="text-gray-200 font-medium text-lg mb-2 group-hover:text-white transition-colors">
                    {isDragActive ? 'Drop your PDF here' : 'Click to browse or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    PDF only (max 50 MB)
                  </p>
                </div>
                
                {pdfFile && (
                  <div className="mt-6 bg-indigo-900/30 rounded-lg p-4 inline-flex items-center border border-indigo-700/30 shadow-lg">
                    <svg className="h-6 w-6 text-indigo-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-indigo-300 font-medium">{pdfFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-900/30 text-red-300 rounded-xl border border-red-800 flex items-start animate-fade-in shadow-lg">
              <svg className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-10 bg-gradient-to-b from-gray-900/90 to-gray-950/90 rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-sm text-center">
              <div className="flex justify-center items-center mb-8">
                <div className="modern-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-orbit">
                    <div className="spinner-dot"></div>
                  </div>
                </div>
              </div>
              <p className="font-bold text-2xl text-gray-200 mb-3">Analyzing Paper</p>
              <p className="text-gray-400 mb-6">This may take a minute while we extract the key concepts</p>
              <div className="relative overflow-hidden h-3 bg-gray-800 rounded-full">
                <div className="animate-progress-bar bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 h-full rounded-full"></div>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-5 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-lg font-medium rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 hover:shadow-xl flex items-center justify-center group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
              disabled={(activeTab === 'url' && !arxivUrl) || (activeTab === 'pdf' && !pdfFile) || isLoading}
            >
              <div className="absolute inset-0 transform hover:scale-105 transition duration-300 ease-in-out bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-lg"></div>
              <span className="relative z-10 flex items-center">
                <span>Continue</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
        </form>
      </div>

      {/* Add this CSS for animations and effects */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          75% { transform: translateY(10px) rotate(-2deg); }
        }
        
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
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
        
        .modern-spinner {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .spinner-ring {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #6366F1;
          border-bottom-color: #3B82F6;
          animation: spin 2s linear infinite;
        }
        
        .spinner-ring:before {
          content: '';
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-left-color: #8B5CF6;
          border-right-color: #60A5FA;
          animation: spin 3s linear infinite;
        }
        
        .spinner-orbit {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          animation: orbit 4s linear infinite;
        }
        
        .spinner-dot {
          position: absolute;
          top: 0;
          left: 50%;
          width: 12px;
          height: 12px;
          margin-left: -6px;
          background: linear-gradient(to right, #4F46E5, #3B82F6);
          border-radius: 50%;
          box-shadow: 0 0 10px 2px rgba(99, 102, 241, 0.6);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-progress-bar {
          animation: progress-bar 2s linear infinite;
          background-size: 200% 100%;
        }
        
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.3;
          filter: blur(8px);
        }
        
        .particle-1 {
          top: 10%;
          left: 10%;
          width: 60px;
          height: 60px;
          background: #4F46E5;
          animation: float 15s ease-in-out infinite;
        }
        
        .particle-2 {
          top: 60%;
          left: 80%;
          width: 100px;
          height: 100px;
          background: #3B82F6;
          animation: float 18s ease-in-out infinite reverse;
        }
        
        .particle-3 {
          top: 80%;
          left: 20%;
          width: 80px;
          height: 80px;
          background: #6366F1;
          animation: float 20s ease-in-out infinite;
        }
        
        .particle-4 {
          top: 30%;
          left: 90%;
          width: 40px;
          height: 40px;
          background: #818CF8;
          animation: float 12s ease-in-out infinite reverse;
        }
        
        .particle-5 {
          top: 90%;
          left: 60%;
          width: 70px;
          height: 70px;
          background: #4F46E5;
          animation: float 16s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UploadPage;