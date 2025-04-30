import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWidget from './ChatWidget';

const ChatWidgetController = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [paperUrl, setPaperUrl] = useState(null);

  // Pages where chat should be shown (after settings)
  const allowedPaths = ['/template', '/generating', '/success', '/podcast'];

  useEffect(() => {
    // Check if current path is in allowed paths
    const shouldBeVisible = allowedPaths.some(path => location.pathname.startsWith(path));
    setIsVisible(shouldBeVisible);

    // Get paper URL from location state if available
    if (location.state?.paperUrl) {
      setPaperUrl(location.state.paperUrl);
    }
  }, [location]);

  if (!isVisible) return null;

  return <ChatWidget paperUrl={paperUrl} />;
};

export default ChatWidgetController; 