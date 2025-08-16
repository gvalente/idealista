// React Bridge - Entry point for Trust Shield UI components
import React from 'react';
import { createRoot } from 'react-dom/client';

// Hand-drawn shield SVG component with dashed stroke effect per v0 spec
function HandDrawnShield({ className, size = 16, color = 'currentColor', variant = 'outline' }) {
  const strokeDasharray = variant === 'dashed' ? '2,2' : 'none';
  
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className: className,
    style: { 
      flexShrink: 0,
      boxShadow: 'none !important',
      filter: 'none !important'
    }
  }, React.createElement('path', {
    d: 'M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z',
    stroke: color,
    strokeWidth: 1.5,
    strokeDasharray: strokeDasharray,
    fill: variant === 'filled' ? color : 'none',
    fillOpacity: variant === 'filled' ? 0.1 : 0
  }));
}

// TrustBadgeProduction - Small badge for search results (v0 spec)
function TrustBadgeProduction(props) {
  const { scoreData, isLoading, onClick, delay = 0 } = props;
  const [showFinal, setShowFinal] = React.useState(!isLoading);
  
  React.useEffect(() => {
    if (isLoading) {
      setShowFinal(false);
    } else {
      const timer = setTimeout(() => setShowFinal(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isLoading, delay]);

  const normalized = scoreData && scoreData.data ? scoreData.data : scoreData;
  const score = normalized?.score ?? 0;
  const riskLevel = normalized?.riskLevel ?? 'medium';
  
  // V0 color mapping for badges
  const getColors = (risk, loading) => {
    if (loading) {
      return {
        background: '#f3f4f6',
        color: '#9ca3af',
        border: 'none'
      };
    }
    
    switch (risk) {
      case 'low': // High trust (85-100)
        return {
          background: '#7c9885',
          color: 'white',
          border: 'none'
        };
      case 'medium': // Medium trust (40-84)
        return {
          background: '#d4a574',
          color: 'white',
          border: 'none'
        };
      case 'high': // Low trust (0-39)
        return {
          background: '#c17b6b',
          color: 'white',
          border: 'none'
        };
      default:
        return {
          background: '#f3f4f6',
          color: '#6b7280',
          border: 'none'
        };
    }
  };

  const colors = getColors(riskLevel, !showFinal);
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '66px',  // 75% of 88px
    height: '36px',    // 75% of 48px  
    padding: '6px 12px', // 75% of 8px 16px
    background: colors.background,
    color: colors.color,
    border: colors.border,
    borderRadius: '18px', // 75% of 24px
    fontSize: '16px',     // 75% of 22px
    fontWeight: '600',
    cursor: showFinal ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'all 300ms ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)', // Stronger shadow for larger element

    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    animation: !showFinal ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
    margin: '0' // Remove margin to let wrapper handle positioning
  };

  const handleClick = (e) => {
    // Prevent event bubbling to avoid navigation
    e.preventDefault();
    e.stopPropagation();
    // Note: stopImmediatePropagation removed to fix error
    
    if (showFinal && typeof onClick === 'function') {
      onClick({ data: normalized ?? scoreData, debug: e.altKey || e.shiftKey });
    }
  };

  const handleMouseEnter = (e) => {
    if (showFinal) {
      e.target.style.transform = 'scale(1.05)';
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'; // Stronger shadow for larger element
    }
  };

  const handleMouseLeave = (e) => {
    if (showFinal) {
      e.target.style.transform = 'scale(1)';
      e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    }
  };

  return React.createElement('div', {
    style: containerStyle,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  }, 
  React.createElement(HandDrawnShield, { 
    size: 18, // 75% of 24px 
    color: colors.color,
    variant: 'outline'
  }),
  showFinal ? String(score) : '...'
  );
}

// TrustShieldCollapsedProduction - Larger collapsed view for listing pages (v0 spec)
function TrustShieldCollapsedProduction(props) {
  const { scoreData, isLoading, onClick, cachedScore, isMobile = false } = props;
  const [displayScore, setDisplayScore] = React.useState(cachedScore || null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  React.useEffect(() => {
    if (cachedScore && !displayScore) {
      setDisplayScore(cachedScore);
    }
  }, [cachedScore, displayScore]);

  React.useEffect(() => {
    if (!isLoading && scoreData?.success) {
      const newScoreData = scoreData.data;
      const newScore = newScoreData.score;
      
      console.log('[TrustShield v1.2.3] 🎯 UI UPDATE - Received new score data:', {
        newScore,
        currentDisplayScore: displayScore?.score,
        willUpdate: !displayScore || displayScore.score !== newScore,
        scoreData: newScoreData
      });
      
      if (displayScore && displayScore.score !== newScore) {
        // Show update animation when cached differs from fresh
        setIsUpdating(true);
        setTimeout(() => {
          setDisplayScore(newScoreData);
          setIsUpdating(false);
        }, 150);
      } else {
        // Always update if no display score or first time
        setDisplayScore(newScoreData);
      }
    }
  }, [isLoading, scoreData, displayScore]);

  const normalized = displayScore && displayScore.data ? displayScore.data : displayScore;
  const score = normalized?.score ?? 0;
  const riskLevel = normalized?.riskLevel ?? 'medium';
  const shieldSize = isMobile ? 32 : 40;
  
  const getColors = (risk) => {
    switch (risk) {
      case 'low':
        return {
          background: '#f0f4f1',
          color: '#7c9885',
          border: '1px solid #c1d4c6',
          shieldBg: '#7c9885'
        };
      case 'medium':
        return {
          background: '#faf6f0',
          color: '#d4a574',
          border: '1px solid #e8d5b7',
          shieldBg: '#d4a574'
        };
      case 'high':
        return {
          background: '#f9f3f1',
          color: '#c17b6b',
          border: '1px solid #e0c4bb',
          shieldBg: '#c17b6b'
        };
      default:
        return {
          background: '#f3f4f6',
          color: '#6b7280',
          border: '1px solid #d1d5db',
          shieldBg: '#6b7280'
        };
    }
  };

  const colors = getColors(riskLevel);
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: isMobile ? '12px' : '16px',
    background: colors.background,
    border: colors.border,
    borderRadius: '16px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 300ms ease',
    marginTop: '12px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    transform: isUpdating ? 'scale(1.02)' : 'scale(1)',
    animation: isLoading ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
  };

  const shieldContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: shieldSize,
    height: shieldSize,
    background: colors.shieldBg,
    borderRadius: '10px',
    flexShrink: 0
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  };

  const labelStyle = {
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '500',
    color: '#4a4a4a',
    lineHeight: '1.2'
  };

  const scoreStyle = {
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: '700',
    color: colors.color,
    lineHeight: '1'
  };

  const arrowStyle = {
    fontSize: '16px',
    color: '#9ca3af',
    transform: 'translateX(0)',
    transition: 'transform 200ms ease'
  };

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick(scoreData);
    }
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    const arrow = e.currentTarget.querySelector('.arrow');
    if (arrow) arrow.style.transform = 'translateX(2px)';
  };

  const handleMouseLeave = (e) => {
    if (!isUpdating) {
      e.currentTarget.style.transform = 'scale(1)';
    }
    e.currentTarget.style.boxShadow = 'none';
    const arrow = e.currentTarget.querySelector('.arrow');
    if (arrow) arrow.style.transform = 'translateX(0)';
  };

  return React.createElement('div', {
    style: containerStyle,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  }, 
  React.createElement('div', { style: shieldContainerStyle },
    React.createElement(HandDrawnShield, { 
      size: Math.round(shieldSize * 0.6), 
      color: 'white',
      variant: 'outline'
    })
  ),
  React.createElement('div', { style: contentStyle },
    React.createElement('div', { style: labelStyle }, 'Trust & Quality Score'),
    React.createElement('div', { style: scoreStyle }, 
      isLoading ? 'Analyzing...' : score
    )
  ),
  React.createElement('div', { 
    style: arrowStyle, 
    className: 'arrow'
  }, '→')
  );
}

// Main Trust Shield component router
function TrustShield(props) {
  const { variant = 'default', ...otherProps } = props;
  
  switch (variant) {
    case 'badge':
      return React.createElement(TrustBadgeProduction, otherProps);
    case 'collapsed':
      return React.createElement(TrustShieldCollapsedProduction, otherProps);
    default:
      // Legacy default component for backward compatibility
      return React.createElement(TrustShieldCollapsedProduction, otherProps);
  }
}

// Enhanced CSS for Shadow DOM isolation
const shadowStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@400;500&display=swap');
  
  * {
    box-sizing: border-box;
  }
  
  .trust-shield-root {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Prevent child elements from inheriting shadows */
  .trust-shield-root svg,
  .trust-shield-root path,
  .trust-shield-root * {
    box-shadow: none !important;
    filter: none !important;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  

  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// Global function to render Trust Shield component with Shadow DOM isolation
window.renderTrustShield = function(rootElement, props) {
  try {
    // Create or get shadow root
    let shadowRoot;
    if (!rootElement.shadowRoot) {
      shadowRoot = rootElement.attachShadow({ mode: 'open' });
      
      // Add styles to shadow DOM
      const styleSheet = document.createElement('style');
      styleSheet.textContent = shadowStyles;
      shadowRoot.appendChild(styleSheet);
      
      // Create container for React
      const reactContainer = document.createElement('div');
      reactContainer.className = 'trust-shield-root';
      shadowRoot.appendChild(reactContainer);
      
      // Create React root
      rootElement._trustShieldRoot = createRoot(reactContainer);
    } else {
      shadowRoot = rootElement.shadowRoot;
    }
    
    // Render component using existing root
    rootElement._trustShieldRoot.render(React.createElement(TrustShield, props));
  } catch (error) {
    console.error('Failed to render Trust Shield:', error);
  }
};