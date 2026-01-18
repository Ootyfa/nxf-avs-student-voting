
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import ProfilePage from './pages/Profile';
import FilmsPage from './pages/Films';
import LeaderboardPage from './pages/Leaderboard';
import OnboardingPage from './pages/Onboarding';

// Wrapper component to check onboarding status dynamically
const ProtectedHome: React.FC = () => {
  const hasOnboarded = localStorage.getItem('hasOnboarded');
  
  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <HomePage />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<ProtectedHome />} />
          <Route path="films" element={<FilmsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
