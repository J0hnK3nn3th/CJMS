import React, { useState } from 'react';
import LoginPage from './LoginPage';
import OrganizerPage from './OrganizerPage';
import JudgeCodeModal from './JudgeCodeModal';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleBackToHome = () => {
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

