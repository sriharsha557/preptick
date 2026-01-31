import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import SamplePaperPage from './pages/SamplePaperPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import GenerateTestPage from './pages/GenerateTestPage';
import TakeTestPage from './pages/TakeTestPage';
import TestResultsPage from './pages/TestResultsPage';
import TestHistoryPage from './pages/TestHistoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/sample-paper" element={<SamplePaperPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/generate-test" element={<GenerateTestPage />} />
        <Route path="/test/:testId" element={<TakeTestPage />} />
        <Route path="/test/:testId/results" element={<TestResultsPage />} />
        <Route path="/history" element={<TestHistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
