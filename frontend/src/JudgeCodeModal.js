import React, { useState } from 'react';
import { authService } from './services/api';

const JudgeCodeModal = ({ isOpen, onClose, onSubmit }) => {
  const [judgeCode, setJudgeCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judgeCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Judge code submitted:', judgeCode);
      const response = await authService.judgeLogin(judgeCode);
      console.log('Judge login successful:', response);
      
      // Pass the judge data to the parent component
      onSubmit(response.judge);
      setJudgeCode('');
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error('Judge login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Invalid judge code. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setJudgeCode('');
    setError('');
    onClose();
  };
  
  const handleInputChange = (e) => {
    setJudgeCode(e.target.value);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enter Judge Code</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            Please enter the judge code provided by the event organizer to access the judging system.
          </p>
          
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="judgeCode">Judge Code</label>
              <input
                type="text"
                id="judgeCode"
                value={judgeCode}
                onChange={handleInputChange}
                placeholder="Enter judge code"
                required
                autoFocus
              />
            </div>
            
            {error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '0.9rem',
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                {error}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-cancel-btn" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="modal-submit-btn"
                disabled={isLoading || !judgeCode.trim()}
              >
                {isLoading ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JudgeCodeModal;
