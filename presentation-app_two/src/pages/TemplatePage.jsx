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
          templateName: selectedTemplate === 'custom' ? 'template.pptx' : `${selectedTemplate}.pptx`
        } 
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Choose Template</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Presentation Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <label 
                  key={template.id}
                  className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition
                    ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
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
                  <div className="h-40 w-full bg-gray-100 mb-3 flex items-center justify-center overflow-hidden rounded">
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
                  <span className="font-medium">{template.name}</span>
                </label>
              ))}
              
              <div 
                className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition
                  ${selectedTemplate === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
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
                  className="h-40 w-full bg-gray-100 mb-3 flex items-center justify-center rounded border-2 border-dashed border-gray-300"
                >
                  <input {...getInputProps()} />
                  {customTemplate ? (
                    <div className="text-center p-2">
                      <div className="text-blue-600 mb-1">Template uploaded!</div>
                      <div className="text-sm text-gray-500 truncate max-w-full">
                        {customTemplate.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-600">Upload custom template</p>
                      <p className="text-xs text-gray-500 mt-1">PPTX only</p>
                    </div>
                  )}
                </div>
                <span className="font-medium">Custom Template</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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