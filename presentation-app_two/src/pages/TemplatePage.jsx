import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';

const TemplatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [customTemplate, setCustomTemplate] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const templates = [
    { id: 'aura', name: 'Aura', previewSrc: '/templates/aura-preview.png' },
    { id: 'basic', name: 'Basic', previewSrc: '/templates/basic-preview.png' },
    { id: 'modern', name: 'Modern', previewSrc: '/templates/modern-preview.png' },
    { id: 'citation', name: 'Citation', previewSrc: '/templates/citation-preview.png' }
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setCustomTemplate(acceptedFiles[0]);
      setSelectedTemplate('custom');
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setIsLoading(true);
      
      if (selectedTemplate === 'custom' && !customTemplate) {
        throw new Error('Please upload a custom template file');
      }
      
      // If template is custom, we need to upload it
      if (selectedTemplate === 'custom' && customTemplate) {
        const formData = new FormData();
        formData.append('file', customTemplate);
        
        const response = await fetch('http://localhost:8000/upload-template', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error(await response.text());
      }
      
      // Navigate to generating page with all the data + template selection
      navigate('/generating', { 
        state: {
          ...location.state,
          templateName: selectedTemplate === 'custom' 
            ? 'template.pptx' 
            : selectedTemplate === 'citation'
              ? 'Citation.pptx'
              : `${selectedTemplate}.pptx`
        } 
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Choose Template</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 p-6 rounded-lg shadow-lg border border-gray-800">
            <h2 className="text-lg font-medium mb-4 text-gray-200">Presentation Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <label 
                  key={template.id}
                  className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition
                    ${selectedTemplate === template.id ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-600 bg-gray-900/50'}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={() => setSelectedTemplate(template.id)}
                    className="sr-only" // Hide actual radio button
                  />
                  <div className="h-40 w-full bg-gray-800 mb-3 flex items-center justify-center overflow-hidden rounded">
                    <img 
                      src={template.previewSrc} 
                      alt={`${template.name} template preview`}
                      className="object-cover h-full w-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x200?text=Preview+Not+Available";
                      }}
                    />
                  </div>
                  <span className="font-medium text-gray-200">{template.name}</span>
                </label>
              ))}
              
              <div 
                className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition
                  ${selectedTemplate === 'custom' ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-600 bg-gray-900/50'}`}
              >
                <input
                  type="radio"
                  name="template"
                  value="custom"
                  checked={selectedTemplate === 'custom'}
                  onChange={() => setSelectedTemplate('custom')}
                  className="sr-only"
                />
                <div 
                  {...getRootProps()}
                  className="h-40 w-full bg-gray-800 mb-3 flex items-center justify-center rounded border-2 border-dashed border-gray-700"
                >
                  <input {...getInputProps()} />
                  {customTemplate ? (
                    <div className="text-center p-2">
                      <div className="text-indigo-400 mb-1">Template uploaded!</div>
                      <div className="text-sm text-gray-400 truncate max-w-full">
                        {customTemplate.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-400">Upload custom template</p>
                      <p className="text-xs text-gray-500 mt-1">PPTX only</p>
                    </div>
                  )}
                </div>
                <span className="font-medium text-gray-200">Custom Template</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 text-red-400 rounded-md border border-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-700"
            >
              {isLoading ? 'Processing...' : 'Generate Presentation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplatePage; 