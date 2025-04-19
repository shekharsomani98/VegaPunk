import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SelectionPage from './pages/SelectionPage';
import SettingsPage from './pages/SettingsPage';
import TemplatePage from './pages/TemplatePage';
import GeneratingPage from './pages/GeneratingPage';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import PodcastPage from './pages/PodcastPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/select" element={<SelectionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/template" element={<TemplatePage />} />
          <Route path="/generating" element={<GeneratingPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;