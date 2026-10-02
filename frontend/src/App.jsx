import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [currentView, setCurrentView] = useState('login');

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-900 antialiased">
      {currentView === 'login' ? (
        <Login onNavigateToRegister={() => setCurrentView('register')} />
      ) : (
        <Register onNavigateToLogin={() => setCurrentView('login')} />
      )}
    </div>
  );
}
