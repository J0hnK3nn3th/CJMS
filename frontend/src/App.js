import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import OrganizerPage from './OrganizerPage';
import JudgeCodeModal from './JudgeCodeModal';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        setShowOrganizer(true);
      }
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleBackToHome = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setShowLogin(false);
    setShowOrganizer(false);
  };

  const handleLoginSuccess = (user) => {
    console.log('Login successful for user:', user);
    setShowLogin(false);
    setShowOrganizer(true);
  };

  const handleJudgeCodeClick = () => {
    setShowJudgeModal(true);
  };

  const handleJudgeCodeSubmit = (code) => {
    console.log('Judge code submitted:', code);
    // Here you would typically handle the judge code validation
    // and redirect to the judging interface
  };

  const handleCloseJudgeModal = () => {
    setShowJudgeModal(false);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="App">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (showOrganizer) {
    return <OrganizerPage onBack={handleBackToHome} />;
  }

  if (showLogin) {
    return <LoginPage onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>Welcome to Campus Judging Management System</h1>
        <button className="login-button" onClick={handleLoginClick}>Log In</button>
      </header>
      <main className="main-content">
        <button className="judge-code-button" onClick={handleJudgeCodeClick}>Judge Code</button>
      </main>
      
      <JudgeCodeModal
        isOpen={showJudgeModal}
        onClose={handleCloseJudgeModal}
        onSubmit={handleJudgeCodeSubmit}
      />
    </div>
  );
}

export default App;

