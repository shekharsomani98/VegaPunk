import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { message, details, errorCode } = location.state || {
    message: 'An unexpected error occurred',
    details: 'Please try again later',
    errorCode: 500
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center border border-gray-100">
        <div className="bg-red-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-red-500 text-transparent bg-clip-text">Error {errorCode}</h1>
        <p className="text-gray-800 mb-2 font-medium text-lg">{message}</p>
        <p className="text-gray-600 mb-8 text-sm">{details}</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-md flex items-center justify-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-colors shadow-sm border border-gray-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 