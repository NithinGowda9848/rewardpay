import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = (index) => {
    if (type === 'card') {
      return (
        <div key={index} className="skeleton-card glass-panel">
          <div className="skeleton-circle pulse"></div>
          <div className="skeleton-content">
            <div className="skeleton-title pulse"></div>
            <div className="skeleton-line pulse"></div>
            <div className="skeleton-line short pulse"></div>
          </div>
        </div>
      );
    }

    if (type === 'list') {
      return (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-list-icon pulse"></div>
          <div className="skeleton-list-body">
            <div className="skeleton-list-title pulse"></div>
            <div className="skeleton-list-text pulse"></div>
          </div>
          <div className="skeleton-list-end pulse"></div>
        </div>
      );
    }

    if (type === 'chart') {
      return (
        <div key={index} className="skeleton-chart glass-panel">
          <div className="skeleton-title pulse" style={{ width: '40%' }}></div>
          <div className="skeleton-chart-bars">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="skeleton-chart-bar pulse"
                style={{ height: `${20 + Math.random() * 60}%` }}
              ></div>
            ))}
          </div>
        </div>
      );
    }

    // Default basic line skeleton
    return (
      <div key={index} className="skeleton-line-only pulse"></div>
    );
  };

  return (
    <div className={`skeleton-container skeleton-type-${type}`}>
      {[...Array(count)].map((_, index) => renderSkeleton(index))}
    </div>
  );
};

export default LoadingSkeleton;
