import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold">VegaPunk Presentation AI</h1>
          <p className="mt-2 opacity-80">Transform research papers into stunning presentations and podcasts</p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-12 w-12 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No presentations found
            </h3>
            <p className="mt-2 text-gray-600">
              Get started by creating a new presentation from a research paper
            </p>
            <div className="mt-8">
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-medium rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Presentation
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <h4 className="font-medium text-gray-800">Presentations</h4>
                    <p className="text-sm text-gray-600">Generate beautiful slides</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <div className="flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <h4 className="font-medium text-gray-800">Podcasts</h4>
                    <p className="text-sm text-gray-600">Create audio discussions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;