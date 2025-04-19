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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-gray-950 p-10 rounded-2xl shadow-2xl border border-gray-800 text-white">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin opacity-30"></div>
              <div className="absolute inset-3 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
              Crafting Your Podcast
            </h2>
            <p className="text-gray-400 text-center max-w-md">
              We're transforming your research paper into an engaging podcast conversation. This may take a few minutes...
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-400">Analyzing paper content</span>
                </div>
                <span className="text-xs text-blue-400">In progress</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-width"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-500">Generating dialogue</span>
                </div>
                <span className="text-xs text-gray-600">Waiting</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full"></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-500">Creating audio</span>
                </div>
                <span className="text-xs text-gray-600">Waiting</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full"></div>
            </div>
          </div>
          
          <div className="mt-10 bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-start">
              <div className="hidden sm:block flex-shrink-0 bg-blue-500/20 rounded-lg p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="sm:ml-4">
                <p className="text-gray-400 text-sm">
                  We're using <span className="text-blue-400 font-medium">advanced AI</span> to create a natural conversational flow between a host and an expert, discussing the key insights from your paper. The generated audio will feature realistic voices and professional pacing.
                </p>
              </div>
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-gray-950 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-96 w-96" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Podcast is Ready</h1>
                <p className="opacity-90 text-lg">Listen, share, and enjoy your AI-generated podcast discussion</p>
              </div>
            <button
              onClick={handleBack}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center text-sm font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {location.state && !location.state.podcastOnly ? 'Back to Presentation' : 'Home'}
            </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-800/30 overflow-hidden mb-8 transform transition-all duration-300 hover:shadow-blue-900/10 hover:shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-400 mb-1">Listen to Your Podcast</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-900/30 rounded-full text-xs font-medium text-blue-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {tone} Tone
                      </span>
                      <span className="px-2 py-1 bg-purple-900/30 rounded-full text-xs font-medium text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {length}
                      </span>
                      <span className="px-2 py-1 bg-indigo-900/30 rounded-full text-xs font-medium text-indigo-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {language}
                      </span>
                    </div>
                  </div>
                </div>
                
                {audioError ? (
                  <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-6 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-900/30 p-2 rounded-lg">
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-red-400">Unable to load audio</h3>
                        <p className="mt-1 text-gray-400">The podcast file may still be processing or there might be an issue with the audio format.</p>
                        <div className="mt-4">
                          <button
                            onClick={handleRetryAudio}
                            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
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
                  <div className="bg-gray-900/50 rounded-xl overflow-hidden mb-4 border border-gray-800/80">
                    <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-gray-800/80">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-300">
                          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span className="font-medium">AI-Generated Podcast</span>
                        </div>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                            High Quality
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4">
            <audio
                        ref={audioRef}
                        className="w-full"
              controls
                        src={audioSrc}
                        onError={handleAudioError}
                        style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          borderRadius: '0.5rem',
                          height: '40px'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mt-3 bg-gray-900/30 p-3 rounded-lg border border-gray-800/50 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-500 mr-2">Audio URL:</span>
                  <code className="font-mono text-xs bg-gray-900/50 p-1 rounded text-gray-400 flex-1 overflow-x-auto">{audioSrc}</code>
                </div>
              </div>
          </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-8">
              <div className="border-b border-gray-800 bg-gradient-to-r from-blue-900/20 to-purple-900/20 px-6 py-4">
                <h2 className="text-xl font-bold text-blue-400 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Podcast Transcript
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                <div className="prose prose-invert prose-blue prose-lg max-w-none">
                  <div
                    className="text-gray-300 whitespace-pre-wrap text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: podcast.transcript.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400">$1</strong>') }}
                  />
                </div>
            </div>
          </div>

            <div className="flex justify-center mt-10">
            <button
              onClick={handleBack}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-900/30 flex items-center text-lg font-medium"
            >
                <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-gray-950 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-96 w-96" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Podcast from Paper</h1>
              <p className="opacity-90 text-lg">Transform your research paper into an engaging audio discussion</p>
            </div>
          <button
            onClick={handleBack}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center text-sm font-medium"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {location.state && !location.state.podcastOnly ? 'Back to Presentation' : 'Home'}
          </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {(location.state?.paperUrl || location.state?.document_url) && (
            <div className="mb-8 p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
              <h3 className="text-sm uppercase tracking-wide font-semibold text-blue-400 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Paper Source
              </h3>
              <div className="flex items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800/50">
                <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 truncate text-sm font-mono">
                  {location.state.paperUrl || location.state.document_url}
                </p>
              </div>
          </div>
        )}

        {error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-5 mb-8">
            <div className="flex">
                <div className="flex-shrink-0 bg-red-900/30 p-2 rounded-lg">
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
                <div className="ml-4">
                  <p className="text-red-400">{error}</p>
                </div>
            </div>
          </div>
        )}

          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-800/30 p-6 mb-8 transform transition-all duration-300 hover:shadow-blue-900/10 hover:shadow-lg">
            <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Podcast Configuration
            </h2>

        <div className="space-y-6">
          <div>
                <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              Specific Question (optional)
            </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., How does this paper relate to AI safety?"
                    className="bg-gray-900/70 border-gray-800 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 py-3 rounded-lg placeholder-gray-500"
            />
                </div>
          </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 transform transition-all duration-300 hover:border-blue-800/50">
                  <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-lg bg-gray-900 border-gray-800 text-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fun">Fun</option>
                    <option value="formal">Formal</option>
                    <option value="educational">Educational</option>
                    <option value="conversational">Conversational</option>
            </select>
          </div>

                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 transform transition-all duration-300 hover:border-blue-800/50">
                  <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
              Length
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
                    className="w-full rounded-lg bg-gray-900 border-gray-800 text-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Short (1-2 min)">Short (1-2 min)</option>
              <option value="Medium (3-5 min)">Medium (3-5 min)</option>
                    <option value="Long (10-15 min)">Long (10-15 min)</option>
            </select>
          </div>

                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 transform transition-all duration-300 hover:border-blue-800/50">
                  <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg bg-gray-900 border-gray-800 text-gray-300 focus:ring-blue-500 focus:border-blue-500"
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

              <div className="pt-6 flex justify-center">
            <button
              onClick={handleGenerate}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-900/30 flex items-center transform hover:-translate-y-1"
            >
                  <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
              Generate Podcast
            </button>
              </div>
          </div>
        </div>

          <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-900/30 rounded-full p-3">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2">How It Works</h3>
                <p className="text-gray-400">
                  We'll transform your paper into an engaging conversation between a host and expert guest. Our AI analyzes the content and generates a natural-sounding dialogue that explains key concepts in an accessible way.
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-center text-gray-400 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                      <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Summarizes complex research in conversational format
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                      <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Uses realistic voices for a professional podcast experience
                  </li>
                  <li className="flex items-center text-gray-400 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                      <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Customizable tone, length, and focus areas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add customized styling for scrollbar and audio player */}
      <style jsx>{`
        /* Custom scrollbar style */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }

        /* Animation for the loading progress bar */
        @keyframes pulse-width {
          0%, 100% { width: 25%; }
          50% { width: 75%; }
        }
        
        .animate-pulse-width {
          animation: pulse-width 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PodcastPage; 