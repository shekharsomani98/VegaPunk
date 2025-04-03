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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Presentation</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Analyze from arXiv URL</h2>
            <input
              type="url"
              value={arxivUrl}
              onChange={(e) => {
                setArxivUrl(e.target.value);
                setError('');
              }}
              placeholder="https://arxiv.org/abs/2406.15758"
              className="w-full p-2 border rounded-md"
              disabled={!!pdfFile || isLoading}
            />
            
            {/* Recent URLs */}
            {recentUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Recent papers:</p>
                <div className="flex flex-wrap gap-2">
                  {recentUrls.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setArxivUrl(url)}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      {url.split('/').pop()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-gray-500">OR</div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Upload PDF</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${isDragActive ? 'border-blue-500 bg-blue-50' : isLoading ? 'border-gray-300 opacity-50' : 'border-gray-300'}`}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            >
              <input {...getInputProps()} disabled={isLoading} />
              <p className="text-gray-600">
                {isDragActive ? 'Drop PDF here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PDF only (max 50 MB)
              </p>
              {pdfFile && (
                <p className="mt-2 text-blue-600 text-sm">
                  Selected: {pdfFile.name}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-6 bg-white rounded-lg shadow-sm text-center">
              <div className="flex justify-center items-center mb-4">
                <div className="loader">
                  <div className="paper-plane"></div>
                </div>
              </div>
              <p className="font-medium text-lg text-gray-800 mb-1">Analyzing Paper</p>
              <p className="text-gray-600">This may take a minute...</p>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue
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
          background-color: #4285F4;
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
          background-color: #4285F4;
          border-radius: 0 0 4px 0;
          transform: rotate(-45deg);
        }
        .paper-plane:after {
          content: '';
          position: absolute;
          width: 40px;
          height: 10px;
          background-color: #4285F4;
          top: -4px;
          left: -40px;
          border-radius: 10px 0 10px 0;
          transform: rotate(45deg);
        }
        
        @keyframes fly {
          0% { transform: translate(0, 0) rotate(45deg); }
          20% { transform: translate(80px, -10px) rotate(35deg); }
          40% { transform: translate(160px, 0) rotate(45deg); }
          60% { transform: translate(240px, 10px) rotate(55deg); }
          80% { transform: translate(320px, 0) rotate(45deg); }
          100% { transform: translate(0, 0) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadPage;