import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/sample-paper" element={<SamplePaperPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/generate-test" element={
            <ProtectedRoute><GenerateTestPage /></ProtectedRoute>
          } />
          <Route path="/test/:testId" element={
            <ProtectedRoute><TakeTestPage /></ProtectedRoute>
          } />
          <Route path="/test/:testId/results" element={
            <ProtectedRoute><TestResultsPage /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><TestHistoryPage /></ProtectedRoute>
          } />

          {/* 404 catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
