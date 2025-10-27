import React, { useState } from 'react';

const JudgeCodeModal = ({ isOpen, onClose, onSubmit }) => {
  const [judgeCode, setJudgeCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!judgeCode.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Judge code submitted:', judgeCode);
      onSubmit(judgeCode);
      setJudgeCode('');
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    setJudgeCode('');
    onClose();
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
                onChange={(e) => setJudgeCode(e.target.value)}
                placeholder="Enter judge code"
                required
                autoFocus
              />
            </div>
            
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
