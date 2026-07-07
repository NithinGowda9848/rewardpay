import React from 'react';
import { FaCheck } from 'react-icons/fa';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, title = 'Success!', message = 'Operation completed successfully.', buttonText = 'Continue' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="success-icon-container">
          <div className="success-icon-glow"></div>
          <div className="success-icon">
            <FaCheck />
          </div>
        </div>
        
        <h3>{title}</h3>
        <p>{message}</p>
        
        <button onClick={onClose} className="btn-primary modal-close-btn">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
