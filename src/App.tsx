import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Availability from './pages/Availability';
import Hangouts from './pages/Hangouts';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

function App() {
  const { session, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
        
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="availability" element={<Availability />} />
          <Route path="hangouts" element={<Hangouts />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;