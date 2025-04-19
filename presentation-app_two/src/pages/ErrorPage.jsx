import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const errorMessage = location.state?.errorMessage || 'Something went wrong.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 flex items-center justify-center p-6 text-white">
      <div className="bg-gray-800 bg-opacity-70 rounded-2xl shadow-xl border border-gray-700 p-8 max-w-2xl w-full">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-900/30 p-6 rounded-full mb-6">
            <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-100">
            Error Occurred
          </h1>
          
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-8 w-full">
            <p className="text-red-300">{errorMessage}</p>
          </div>
          
          <p className="text-gray-300 mb-8">
            We apologize for the inconvenience. You can try again or go back to the home page.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-1/2 px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-200 transition-colors duration-300 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-indigo-700 to-blue-600 hover:from-indigo-800 hover:to-blue-700 rounded-lg text-white font-medium transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 