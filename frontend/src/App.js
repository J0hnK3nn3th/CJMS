import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import OrganizerPage from './OrganizerPage';
import JudgeCodeModal from './JudgeCodeModal';
import JudgePage from './JudgePage';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showJudge, setShowJudge] = useState(false);
  const [judgeData, setJudgeData] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      const savedJudgeData = localStorage.getItem('judgeData');
      
      if (authToken) {
        setShowOrganizer(true);
      } else if (savedJudgeData) {
        try {
          setJudgeData(JSON.parse(savedJudgeData));
          setShowJudge(true);
        } catch (e) {
          localStorage.removeItem('judgeData');
        }
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
    localStorage.removeItem('judgeData');
    setShowLogin(false);
    setShowOrganizer(false);
    setShowJudge(false);
    setJudgeData(null);
  };

  const handleLoginSuccess = (user) => {
    console.log('Login successful for user:', user);
    setShowLogin(false);
    setShowOrganizer(true);
  };

  const handleJudgeCodeClick = () => {
    setShowJudgeModal(true);
  };

  const handleJudgeCodeSubmit = (judge) => {
    console.log('Judge data received:', judge);
    // Store judge data and show judge page
    localStorage.setItem('judgeData', JSON.stringify(judge));
    setJudgeData(judge);
    setShowJudgeModal(false);
    setShowJudge(true);
  };
  
  const handleJudgeLogout = () => {
    localStorage.removeItem('judgeData');
    setJudgeData(null);
    setShowJudge(false);
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

  if (showJudge && judgeData) {
    return <JudgePage judgeData={judgeData} onLogout={handleJudgeLogout} />;
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

