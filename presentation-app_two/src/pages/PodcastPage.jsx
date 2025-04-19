import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PodcastPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [podcast, setPodcast] = useState(null);
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState('Fun');
  const [length, setLength] = useState('Medium (3-5 min)');
  const [language, setLanguage] = useState('English');
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  // If podcast was requested in settings and not directly from the "Skip to Podcast" button,
  // generate it automatically
  useEffect(() => {
    // Only auto-generate when coming from success page with create_podcast=true
    // Not when coming directly via the "Skip to Podcast" button (podcastOnly flag)
    const autoPodcast = location.state?.settings?.create_podcast;
    const isDirectPodcastRequest = location.state?.podcastOnly;
    
    if (autoPodcast && !isDirectPodcastRequest) {
      // Wait a moment to allow the UI to render first
      const timer = setTimeout(() => {
        handleGenerate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setAudioError(false);

      // Determine the document URL from location state
      let documentUrl = '';
      if (location.state?.paperUrl) {
        documentUrl = location.state.paperUrl;
      } else if (location.state?.document_url) {
        documentUrl = location.state.document_url;
      }

      if (!documentUrl) {
        throw new Error('No document URL found. Please go back and upload a paper first.');
      }

      console.log('Using document URL:', documentUrl);

      // Create request payload using the new format
      const payload = {
        document_url: documentUrl,
        prompt_modifiers: {
          tone: tone.toLowerCase(),
          length: length,
          language: language
        }
      };

      // Add question if provided
      if (question.trim()) {
        payload.prompt_modifiers.question = question.trim();
      }

      console.log('Sending payload:', payload);

      // Use the new API endpoint
      const response = await axios.post('http://localhost:8000/generate-podcast/', payload, {
        timeout: 600000, // 10 minute timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Podcast response:', response.data);
      
      // Ensure podcast_url is properly formatted
      let podcastUrl = response.data.podcast_url;
      // If it doesn't start with a slash, add one
      if (podcastUrl && !podcastUrl.startsWith('/')) {
        podcastUrl = '/' + podcastUrl;
      }
      
      setPodcast({
        podcast_url: podcastUrl,
        transcript: response.data.dialogue ? formatTranscript(response.data.dialogue) : 'No transcript available',
        dialogue: response.data.dialogue
      });
      setIsComplete(true);
    } catch (error) {
      console.error('Error generating podcast:', error);
      setError(error.response?.data?.detail || error.message || 'An error occurred while generating the podcast');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle audio errors
  const handleAudioError = () => {
    console.error('Audio failed to load');
    setAudioError(true);
  };

  // Retry audio loading
  const handleRetryAudio = () => {
    setAudioError(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  // Format transcript from dialogue JSON
  const formatTranscript = (dialogue) => {
    if (!dialogue || !dialogue.dialogue || !Array.isArray(dialogue.dialogue)) {
      return 'No transcript available';
    }

    let transcript = '';
    dialogue.dialogue.forEach(item => {
      if (item.speaker === 'Jane') {
        transcript += `**Host**: ${item.text}\n\n`;
      } else {
        transcript += `**${dialogue.name_of_guest || 'Guest'}**: ${item.text}\n\n`;
      }
    });
    return transcript;
  };

  const handleBack = () => {
    // Navigate back to success page if we came from there
    if (location.state && !location.state.podcastOnly) {
      navigate('/success', { state: location.state });
    } else {
      // Otherwise go to home
      navigate('/');
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">Generating Podcast</h2>
          <p className="text-gray-600 text-center">
            This may take a few minutes. We're crafting a professional podcast based on your paper...
          </p>
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="animate-pulse h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete && podcast) {
    const audioSrc = podcast.podcast_url.includes('http') 
      ? podcast.podcast_url 
      : `http://localhost:8000/podcast/${podcast.podcast_url.split('/').pop()}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Your Podcast is Ready</h1>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {location.state && !location.state.podcastOnly ? 'Back to Presentation' : 'Home'}
              </button>
            </div>
            <p className="mt-2 opacity-80">Listen, share, and enjoy your AI-generated podcast discussion</p>
          </div>

          <div className="p-8">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Listen to Your Podcast</h2>
                </div>
                
                {audioError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-red-800">Unable to load audio</h3>
                        <p className="mt-1 text-red-700">The podcast file may still be processing or there might be an issue with the audio format.</p>
                        <div className="mt-4">
                          <button
                            onClick={handleRetryAudio}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry Loading
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span className="font-medium">AI-Generated Podcast</span>
                        </div>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {tone} Tone
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <audio
                      ref={audioRef}
                      className="w-full"
                      controls
                      src={audioSrc}
                      onError={handleAudioError}
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mt-3 bg-white/50 p-3 rounded-lg">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Audio URL: <code className="ml-1 font-mono text-xs bg-gray-100 p-1 rounded">{audioSrc}</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Transcript
                </h2>
              </div>
              <div className="p-6">
                <div className="prose prose-indigo prose-lg max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: podcast.transcript.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>') }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {location.state && !location.state.podcastOnly ? 'Return to Presentation' : 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Create Podcast from Paper</h1>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {location.state && !location.state.podcastOnly ? 'Back to Presentation' : 'Home'}
            </button>
          </div>
          <p className="mt-2 opacity-80">Transform your research paper into an engaging audio discussion</p>
        </div>

        <div className="p-8">
          {(location.state?.paperUrl || location.state?.document_url) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-sm uppercase tracking-wide font-semibold text-blue-800 mb-1">Paper Source</h3>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-700 truncate">
                  {location.state.paperUrl || location.state.document_url}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Podcast Configuration
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Question (optional)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g., How does this paper relate to AI safety?"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="fun">Fun</option>
                    <option value="formal">Formal</option>
                    <option value="educational">Educational</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="Short (1-2 min)">Short (1-2 min)</option>
                    <option value="Medium (3-5 min)">Medium (3-5 min)</option>
                    <option value="Long (10-15 min)">Long (10-15 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleGenerate}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-medium rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-colors shadow-lg flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Generate Podcast
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">How It Works</h3>
                <p className="text-gray-600">
                  We'll transform your paper into an engaging conversation between a host and expert guest. Our AI analyzes the content and generates a natural-sounding dialogue that explains key concepts in an accessible way.
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center text-gray-600 text-sm">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Summarizes complex research in conversational format
                  </li>
                  <li className="flex items-center text-gray-600 text-sm">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Uses realistic voices for a professional podcast experience
                  </li>
                  <li className="flex items-center text-gray-600 text-sm">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Customizable tone, length, and focus areas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodcastPage; 