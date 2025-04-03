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
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error {errorCode}</h1>
        <p className="text-gray-800 mb-2 font-medium">{message}</p>
        <p className="text-gray-600 mb-6 text-sm">{details}</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 