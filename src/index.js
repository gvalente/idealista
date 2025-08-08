// React Bridge - Entry point for Trust Shield UI components
import React from 'react';
import { createRoot } from 'react-dom/client';

// Simple test component for now
function TrustShield(props) {
  const { listingData, scoreData, isLoading } = props;
  
  if (isLoading) {
    return React.createElement('div', { 
      style: { padding: '8px', background: '#f0f0f0', borderRadius: '4px' } 
    }, 'Analyzing...');
  }
  
  if (scoreData && scoreData.success) {
    const score = scoreData.data.score;
    const riskLevel = scoreData.data.riskLevel;
    return React.createElement('div', { 
      style: { padding: '8px', background: '#e8f5e8', borderRadius: '4px' } 
    }, `Trust Score: ${score} (${riskLevel})`);
  }
  
  return React.createElement('div', { 
    style: { padding: '8px', background: '#ffe8e8', borderRadius: '4px' } 
  }, 'Analysis Error');
}

// Global function to render Trust Shield component
window.renderTrustShield = function(rootElement, props) {
  try {
    // Create React root and render component
    const root = createRoot(rootElement);
    root.render(React.createElement(TrustShield, props));
  } catch (error) {
    console.error('Error rendering Trust Shield component:', error);
  }
};