import React from 'react';

const GlassCard = ({ children, className = '', interactive = false, onClick, style = {} }) => {
  const panelClass = `glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`;
  
  return (
    <div className={panelClass} onClick={onClick} style={style}>
      {children}
    </div>
  );
};

export default GlassCard;
