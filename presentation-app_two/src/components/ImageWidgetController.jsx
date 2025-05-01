import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ImageWidget from './ImageWidget';

const ImageWidgetController = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [paperUrl, setPaperUrl] = useState(null);

  // Pages where image widget should be shown (after template selection)
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

  return <ImageWidget paperUrl={paperUrl} />;
};

export default ImageWidgetController; 