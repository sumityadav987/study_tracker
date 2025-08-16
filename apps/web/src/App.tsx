import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthState } from './lib/firebase';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';

// Pages
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';
import { Study } from './pages/Study';
import { Summary } from './pages/Summary';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

function App() {
  const { user, loading } = useAuthState();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Setup />
        </ProtectedRoute>
      } />
      <Route path="/study" element={
        <ProtectedRoute>
          <Study />
        </ProtectedRoute>
      } />
      <Route path="/summary/:sessionId" element={
        <ProtectedRoute>
          <Summary />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;