// Idealista Trust Shield - Content Script
// Main script that runs on Idealista pages to inject Trust Shield UI

import './index.js';

(function() {
  'use strict';

  // Configuration
  const EXTENSION_ID = 'idealista-trust-shield';
  const ROOT_CONTAINER_ID = EXTENSION_ID + '-root';
  
  // State management
  let pageType = null;
  let processedListings = new Set();
  let mutationObserver = null;

  // Page type detection
  function detectPageType() {
    const url = window.location.href;
    
    if (url.includes('/inmueble/')) {
      return 'listing';
    } else if (url.includes('/alquiler-viviendas/') || url.includes('/venta-viviendas/') || url.includes('/point/alquiler-viviendas/') || url.includes('/point/venta-viviendas/')) {
      return 'search';
    } else if (url.includes('/usuario/favoritos/') || url.includes('/user/favorites/')) {
      return 'favorites';
    }
    
    return 'unknown';
  }

  // Extract listing data from search page elements using UI-FUNCTIONAL-SPEC selectors
  function extractListingData(element) {
    try {
      const listingId = element.getAttribute('data-element-id');
      if (!listingId) {
        return null;
      }

      // Find the link to get the full URL
      const linkElement = element.querySelector('a.item-link');
      if (!linkElement) {
        return null;
      }

      let listingUrl = linkElement.href;
      
      // Ensure URL is absolute
      if (listingUrl.startsWith('/')) {
        listingUrl = window.location.origin + listingUrl;
      }

      // Find the image container for badge injection (target main multimedia container)
      const imageContainer = element.querySelector('.item-multimedia') ||
                             element.querySelector('picture') ||
                             element.querySelector('.item-multimedia-pictures');

      // Extract basic data visible on search page for initial scoring
      const priceElement = element.querySelector('.item-price');
      const price = priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9]/g, '')) : null;
      
      // Size
      const detailElements = element.querySelectorAll('.item-detail');
      let size = null;
      for (const detail of detailElements) {
        const text = detail.textContent || '';
        if (text.includes('m²') || text.includes('m2')) {
          size = parseFloat(text.replace(/[^0-9]/g, '')) || null;
          break;
        }
      }

      // Neighborhood from title
      let neighborhood = null;
      const titleText = (linkElement.textContent || '').replace(/\s+/g, ' ').trim();
      const neighborhoodMatch = titleText.match(/,\s*([^,]+),\s*Barcelona\s*$/i);
      if (neighborhoodMatch && neighborhoodMatch[1]) {
        neighborhood = neighborhoodMatch[1].trim();
      } else {
        const nEl = element.querySelector('.item-location, .item-subtitle, .item-link-subtitle, .item-info-container .item-location');
        if (nEl) {
          const txt = (nEl.textContent || '').trim();
          if (txt) neighborhood = txt;
        }
      }

      // Photo counter (1/18 → 18)
      let photoCount = null;
      const photoTextEl = element.querySelector('.item-multimedia-pictures__counter, .item-multimedia__counter, .multimedia-counter, [class*="counter"]');
      if (photoTextEl) {
        const raw = (photoTextEl.textContent || '').trim();
        const slashMatch = raw.match(/(\d+)\s*\/\s*(\d+)/);
        if (slashMatch) {
          photoCount = parseInt(slashMatch[2], 10);
        } else {
          const digits = raw.replace(/[^0-9]/g, '');
          const num = parseInt(digits, 10);
          if (!Number.isNaN(num)) photoCount = num;
        }
      }

      // Floor plan hint on cards (best-effort)
      let hasFloorPlan = null;
      const planEl = element.querySelector('[data-button-type="plan"], .icon-plan, .icono-plano, .floor-plan');
      if (planEl) hasFloorPlan = true;

      // Description snippet
      let fullDescription = null;
      const descEl = element.querySelector('.item-description, .item-description.description, .item-description .ellipsis');
      if (descEl) {
        fullDescription = (descEl.textContent || '').trim() || null;
      }

      // Last updated
      let lastUpdated = null;
      const updatedEl = element.querySelector('.item-reduced-price, .item-update, time, [class*="update"]');
      if (updatedEl) lastUpdated = (updatedEl.textContent || '').trim() || null;

      // Advertiser info on card (if exposed in DOM)
      let advertiserName = null;
      let contactEmail = null;
      const advEl = element.querySelector('[data-advertiser-name], [data-agency-name], .card-advertiser .name');
      if (advEl) {
        advertiserName = advEl.getAttribute('data-advertiser-name') || advEl.getAttribute('data-agency-name') || (advEl.textContent || '').trim() || null;
      }
      const mailEl = element.querySelector('a[href^="mailto:"]');
      if (mailEl) {
        const href = mailEl.getAttribute('href');
        const m = href && href.match(/mailto:([^?\s]+)/i);
        if (m && m[1]) contactEmail = m[1];
      }

      // Determine advertiserType best-effort from card
      let advertiserType = null;
      if (advertiserName) advertiserType = 'agency';

      return {
        id: listingId,
        url: listingUrl,
        element: element,
        imageContainer: imageContainer,
        price: price,
        size: size,
        neighborhood,
        photoCount,
        hasFloorPlan,
        fullDescription,
        lastUpdated,
        advertiserName,
        advertiserType,
        contactEmail
      };
    } catch (error) {
      console.error('Error extracting listing data:', error);
      return null;
    }
  }

  // Extract listing data from individual listing page
  function extractCurrentListingData() {
    try {
      const url = window.location.href;
      const match = url.match(/\/inmueble\/(\d+)(?:[\/\?#]|$)/);
      
      if (!match) {
        return null;
      }

      return {
        id: match[1],
        url: url,
        element: document.body
      };
    } catch (error) {
      console.error('Error extracting current listing data:', error);
      return null;
    }
  }

  // Send message to service worker to get listing score
  function requestListingScore(listingData, callback) {
    try {
      chrome.runtime.sendMessage({
        action: 'getListingScore',
        listingId: listingData.id,
        listingUrl: listingData.url,
        initialData: {
          price: listingData.price ?? null,
          size: listingData.size ?? null,
          neighborhood: listingData.neighborhood ?? null,
          photoCount: listingData.photoCount ?? null,
          hasFloorPlan: listingData.hasFloorPlan ?? null,
          fullDescription: listingData.fullDescription ?? null,
          lastUpdated: listingData.lastUpdated ?? null,
          advertiserName: listingData.advertiserName ?? null,
          advertiserType: listingData.advertiserType ?? null,
          contactEmail: listingData.contactEmail ?? null
        }
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with service worker:', chrome.runtime.lastError);
          callback({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        console.log('[TrustShield v1.2.3] 📨 RECEIVED RESPONSE FROM SERVICE WORKER:', {
          success: response?.success,
          score: response?.data?.score,
          breakdown: response?.data?.breakdown?.length,
          listingId: listingData.id
        });
        
        callback(response);
      });
    } catch (error) {
      console.error('Error sending message to service worker:', error);
      callback({ success: false, error: error.message });
    }
  }

  // Create root container for React component
  function createRootContainer(targetElement, listingId) {
    const containerId = ROOT_CONTAINER_ID + '-' + listingId;
    
    // Always create a new container to avoid React createRoot issues
    const existingContainer = document.getElementById(containerId);
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create new container
    const container = document.createElement('div');
    container.id = containerId;
    container.className = EXTENSION_ID + '-container';
    
    // Add styles to prevent conflicts and ensure proper display
    container.style.cssText = 'all: initial; font-family: system-ui, -apple-system, sans-serif; display: block;';
    
    return container;
  }

  // Inject container into the appropriate location per v0 spec
  function injectContainer(container, listingData, pageType, componentVariant) {
    try {
      if (pageType === 'search' && componentVariant === 'badge') {
        // For search results, inject badge into image container (v0 spec: top-right of image)
        if (listingData.imageContainer) {
          const wrapper = document.createElement('div');
          wrapper.style.cssText = [
            'position: absolute !important',
            'top: 8px !important',
            'right: 8px !important',
            'z-index: 999 !important',
            'pointer-events: auto',
            'padding: 8px !important',
            'margin: -8px !important',
            'overflow: visible !important'
          ].join(';');

          if (getComputedStyle(listingData.imageContainer).position === 'static') {
            listingData.imageContainer.style.position = 'relative';
          }
          // Ensure the image container doesn't clip the badge overflow
          listingData.imageContainer.style.overflow = 'visible';
          wrapper.appendChild(container);
          listingData.imageContainer.appendChild(wrapper);
          return;
        }
      }

      listingData.element.appendChild(container);
    } catch (error) {
      console.error('Error injecting container:', error);
      listingData.element.appendChild(container);
    }
  }

  // React render component function (bridge to React)
  function renderComponent(container, listingData, scoreData, isLoading, componentVariant = 'collapsed') {
    const isMobile = window.innerWidth < 768;
    
    window.renderTrustShield(container, { 
      variant: componentVariant,
      listingData, 
      scoreData, 
      isLoading,
      isMobile: isMobile,
      onClick: function(payload) {
        try {
          const scorePayload = payload && payload.data ? payload.data : payload;
          if (payload && payload.debug) {
            console.log('[TrustShield v1.2.3] DEBUG click payload:', {
              id: listingData.id,
              url: listingData.url,
              score: scorePayload?.score,
              breakdown: scorePayload?.breakdown,
              listingData: scorePayload?.listingData
            });
          }
          openTrustShieldDialog(scorePayload);
        } catch (e) {
          console.error('Error opening breakdown:', e);
        }
      }
    });
  }

  // Show detailed breakdown (modal)
  function showDetailedBreakdown(scoreResponse) {
    try {
      if (!scoreResponse || !scoreResponse.success || !scoreResponse.data) {
        console.warn('Trust Shield: No score data to display');
        return;
      }
      openTrustShieldDialog(scoreResponse.data);
    } catch (e) {
      console.error('Failed to open breakdown dialog:', e);
    }
  }

  // Creates a Shadow DOM–scoped modal with the full score breakdown - matching v0 design exactly
  function openTrustShieldDialog(scoreData) {
    // Tear down any existing dialog
    const existingHost = document.getElementById('idealista-trust-shield-dialog-host');
    if (existingHost && existingHost.parentNode) {
      existingHost.parentNode.removeChild(existingHost);
    }

    const host = document.createElement('div');
    host.id = 'idealista-trust-shield-dialog-host';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Check if mobile
    const isMobile = window.innerWidth < 768;

    // Prevent background scroll
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Root overlay
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.3)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.zIndex = '2147483647';
    
    if (isMobile) {
      // Mobile: bottom sheet layout
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'flex-end';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '0';
    } else {
      // Desktop: centered modal
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';
    }

    // Dialog card - responsive per v0 design
    const card = document.createElement('div');
    
    if (isMobile) {
      // Mobile: bottom sheet (80% of viewport height)
      card.style.width = '100%';
      card.style.maxWidth = '100vw';
      card.style.height = '80vh';
      card.style.maxHeight = '80vh';
      card.style.borderRadius = '24px 24px 0 0';
      card.style.transform = 'translateY(0)';
      card.style.animation = 'slideUp 300ms ease-out';
    } else {
      // Desktop: centered modal
      card.style.width = 'min(480px, 95vw)';
      card.style.maxHeight = '90vh';
      card.style.borderRadius = '24px';
    }
    
    card.style.overflow = 'auto';
    card.style.background = '#faf8f3'; // cream background from v0
    card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)';
    card.style.padding = isMobile ? '20px' : '24px';
    card.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    
    // Add mobile swipe-to-dismiss functionality
    if (isMobile) {
      let startY = 0;
      let currentY = 0;
      let isDragging = false;
      
      const handleTouchStart = function(e) {
        startY = e.touches[0].clientY;
        isDragging = true;
        card.style.transition = 'none';
      };
      
      const handleTouchMove = function(e) {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        if (deltaY > 0) { // Only allow dragging down
          card.style.transform = `translateY(${deltaY}px)`;
        }
      };
      
      const handleTouchEnd = function() {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = 'transform 300ms ease-out';
        
        const deltaY = currentY - startY;
        if (deltaY > 100) { // Threshold for dismissal
          card.style.transform = 'translateY(100%)';
          setTimeout(teardown, 300);
        } else {
          card.style.transform = 'translateY(0)';
        }
      };
      
      card.addEventListener('touchstart', handleTouchStart, { passive: false });
      card.addEventListener('touchmove', handleTouchMove, { passive: false });
      card.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      // Add drag handle for mobile
      const dragHandle = document.createElement('div');
      dragHandle.style.width = '36px';
      dragHandle.style.height = '4px';
      dragHandle.style.background = 'rgba(74, 74, 74, 0.3)';
      dragHandle.style.borderRadius = '2px';
      dragHandle.style.margin = '0 auto 16px auto';
      dragHandle.style.cursor = 'grab';
    }

    // Close button (top right)
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '16px';
    closeBtn.style.right = '16px';
    closeBtn.style.width = '32px';
    closeBtn.style.height = '32px';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.border = '1px solid rgba(74, 74, 74, 0.1)';
    closeBtn.style.background = '#ffffff';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.color = '#4a4a4a';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.onmouseenter = function () { 
      closeBtn.style.background = '#f9fafb'; 
      closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseleave = function () { 
      closeBtn.style.background = '#ffffff'; 
      closeBtn.style.transform = 'scale(1)';
    };

    // Shield icon and title
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.gap = '12px';
    headerContainer.style.marginBottom = '16px';

    const shieldContainer = document.createElement('div');
    shieldContainer.style.display = 'flex';
    shieldContainer.style.alignItems = 'center';
    shieldContainer.style.justifyContent = 'center';
    shieldContainer.style.width = '48px';
    shieldContainer.style.height = '48px';
    shieldContainer.style.borderRadius = '12px';
    shieldContainer.style.background = '#7c9885'; // sage color
    shieldContainer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" 
              stroke="white" stroke-width="1.5" fill="none"/>
      </svg>
    `;

    const titleSection = document.createElement('div');
    
    const title = document.createElement('h2');
    title.textContent = 'Idealista Trust Shield';
    title.style.margin = '0';
    title.style.fontSize = '20px';
    title.style.fontWeight = '600';
    title.style.color = '#4a4a4a';
    title.style.lineHeight = '1.2';

    const scoreDisplay = document.createElement('div');
    scoreDisplay.textContent = `${scoreData.score}/100`;
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.style.fontWeight = '700';
    scoreDisplay.style.color = '#7c9885'; // sage color
    scoreDisplay.style.margin = '4px 0 0 0';

    titleSection.appendChild(title);
    titleSection.appendChild(scoreDisplay);
    headerContainer.appendChild(shieldContainer);
    headerContainer.appendChild(titleSection);

    // Description paragraph
    const description = document.createElement('p');
    const riskLevel = scoreData.riskLevel || 'low';
    if (riskLevel === 'low') {
      description.textContent = 'This listing looks very promising and appears to be from a serious seller. It includes plenty of detail and has no major red flags detected.';
    } else if (riskLevel === 'medium') {
      description.textContent = 'This listing has some areas of concern but may still be legitimate. Exercise caution and verify details before proceeding.';
    } else {
      description.textContent = 'This listing has multiple red flags and should be approached with extreme caution. Consider looking for alternative options.';
    }
    description.style.color = '#4a4a4a';
    description.style.lineHeight = '1.6';
    description.style.margin = '0 0 24px 0';
    description.style.fontSize = '14px';

    // Analysis Breakdown section
    const analysisTitle = document.createElement('h3');
    analysisTitle.textContent = 'Analysis Breakdown';
    analysisTitle.style.margin = '0 0 16px 0';
    analysisTitle.style.fontSize = '16px';
    analysisTitle.style.fontWeight = '600';
    analysisTitle.style.color = '#4a4a4a';

    // Analysis items
    const analysisContainer = document.createElement('div');
    analysisContainer.style.display = 'flex';
    analysisContainer.style.flexDirection = 'column';
    analysisContainer.style.gap = '12px';

    // Helper to create status icons matching v0 design (no background circles)
    function createStatusIcon(status) {
      const icon = document.createElement('div');
      icon.style.width = '20px';
      icon.style.height = '20px';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.style.fontSize = '16px';
      icon.style.fontWeight = '600';
      
      if (status === 'pass') {
        icon.style.color = '#7c9885'; // sage green from v0
        icon.innerHTML = '✓';
      } else if (status === 'caution') {
        icon.style.color = '#d4a574'; // ochre from v0  
        icon.innerHTML = '⚠';
      } else {
        icon.style.color = '#c17b6b'; // terracotta from v0
        icon.innerHTML = '✗';
      }
      
      return icon;
    }

    // Helper to create chevron icon matching v0 design
    function createChevronIcon() {
      const chevron = document.createElement('div');
      chevron.style.transition = 'transform 200ms ease';
      chevron.style.color = '#9ca3af';
      chevron.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      return chevron;
    }

    // Phase 1 Analysis Items - only include implemented scoring factors
    const analysisItems = [
      {
        title: 'Scam Keywords',
        status: 'pass',
        summary: 'Clean language',
        breakdown: scoreData.breakdown?.find(b => b.type === 'scam_keywords')
      },
      {
        title: 'Price Check',
        status: 'pass',
        summary: 'Fair market price',
        breakdown: scoreData.breakdown?.find(b => b.type === 'price_anomaly')
      },
      {
        title: 'Listing Quality',
        status: 'pass',
        summary: 'Excellent presentation',
        breakdown: scoreData.breakdown?.find(b => b.type === 'photo_count')
      },
      {
        title: 'Freshness',
        status: 'pass',
        summary: 'Recently updated',
        breakdown: scoreData.breakdown?.find(b => b.type === 'freshness')
      }
    ];

    let expandedItem = null; // Track which accordion item is expanded

    analysisItems.forEach(function(item, index) {
      // Determine status from breakdown data
      let status = 'pass';
      if (item.breakdown) {
        if (item.breakdown.points < 0) {
          status = Math.abs(item.breakdown.points) > 20 ? 'fail' : 'caution';
        }
      }

      const accordionItem = document.createElement('div');
      accordionItem.style.background = 'transparent';
      accordionItem.style.borderBottom = '1px solid rgba(0, 0, 0, 0.08)';
      accordionItem.style.overflow = 'hidden';
      accordionItem.style.transition = 'all 300ms ease';

      // Header (always visible) - minimal horizontal row style
      const itemHeader = document.createElement('div');
      itemHeader.style.display = 'flex';
      itemHeader.style.alignItems = 'center';
      itemHeader.style.justifyContent = 'space-between';
      itemHeader.style.padding = '16px 0';
      itemHeader.style.cursor = 'pointer';
      itemHeader.style.transition = 'background 150ms ease';
      itemHeader.style.userSelect = 'none';

      const leftSection = document.createElement('div');
      leftSection.style.display = 'flex';
      leftSection.style.alignItems = 'center';
      leftSection.style.gap = '12px';

      const statusIcon = createStatusIcon(status);
      
      // Single line with title and status summary (like v0 design)
      const textSection = document.createElement('div');
      textSection.style.display = 'flex';
      textSection.style.alignItems = 'center';
      textSection.style.gap = '8px';
      
      const itemTitle = document.createElement('div');
      itemTitle.textContent = item.title;
      itemTitle.style.fontWeight = '500';
      itemTitle.style.color = '#4a4a4a';
      itemTitle.style.fontSize = '15px';

      const bullet = document.createElement('div');
      bullet.textContent = '•';
      bullet.style.color = '#d1d5db';
      bullet.style.fontSize = '12px';

      const itemSummary = document.createElement('div');
      itemSummary.textContent = item.breakdown?.details || item.summary;
      itemSummary.style.color = '#9ca3af';
      itemSummary.style.fontSize = '14px';

      textSection.appendChild(itemTitle);
      textSection.appendChild(bullet);
      textSection.appendChild(itemSummary);
      leftSection.appendChild(statusIcon);
      leftSection.appendChild(textSection);

      const chevron = createChevronIcon();
      chevron.style.transform = 'rotate(0deg)';

      itemHeader.appendChild(leftSection);
      itemHeader.appendChild(chevron);

      // Expanded content (hidden by default)
      const expandedContent = document.createElement('div');
      expandedContent.style.maxHeight = '0';
      expandedContent.style.overflow = 'hidden';
      expandedContent.style.transition = 'max-height 300ms ease-in-out';
      expandedContent.style.borderTop = '1px solid rgba(74, 74, 74, 0.1)';

      const expandedInner = document.createElement('div');
      expandedInner.style.padding = '16px';
      expandedInner.style.fontSize = '13px';
      expandedInner.style.color = '#4a4a4a';
      expandedInner.style.lineHeight = '1.5';

      // Create expanded content based on breakdown type
      const explanationText = getExplanationText(item.breakdown?.type, item.breakdown);
      expandedInner.textContent = explanationText;

      expandedContent.appendChild(expandedInner);

      // Click handler for accordion
      const toggleAccordion = function() {
        const isCurrentlyExpanded = expandedItem === index;
        
        // Close any currently expanded item
        if (expandedItem !== null && expandedItem !== index) {
          const otherAccordion = analysisContainer.children[expandedItem];
          const otherContent = otherAccordion.querySelector('.expanded-content');
          const otherChevron = otherAccordion.querySelector('.chevron');
          otherContent.style.maxHeight = '0';
          otherChevron.style.transform = 'rotate(0deg)';
        }

        if (isCurrentlyExpanded) {
          // Close this item
          expandedContent.style.maxHeight = '0';
          chevron.style.transform = 'rotate(0deg)';
          expandedItem = null;
        } else {
          // Open this item
          expandedContent.style.maxHeight = expandedContent.scrollHeight + 'px';
          chevron.style.transform = 'rotate(-180deg)'; // Rotate up when expanded
          expandedItem = index;
        }
      };

      // Add classes for querySelector access
      expandedContent.className = 'expanded-content';
      chevron.className = 'chevron';

      itemHeader.addEventListener('click', toggleAccordion);

      // Minimal hover effects (just opacity change)
      itemHeader.onmouseenter = function() {
        itemHeader.style.opacity = '0.7';
      };
      itemHeader.onmouseleave = function() {
        itemHeader.style.opacity = '1';
      };

      // Keyboard navigation
      itemHeader.setAttribute('tabindex', '0');
      itemHeader.setAttribute('role', 'button');
      itemHeader.setAttribute('aria-expanded', 'false');
      itemHeader.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
          itemHeader.setAttribute('aria-expanded', expandedItem === index ? 'true' : 'false');
        }
      };

      accordionItem.appendChild(itemHeader);
      accordionItem.appendChild(expandedContent);
      analysisContainer.appendChild(accordionItem);
    });

    // Helper function to generate explanation text based on analysis type
    function getExplanationText(type, breakdown) {
      const points = breakdown?.points || 0;
      
      switch (type) {
        case 'scam_keywords':
          return points < 0 
            ? `We detected suspicious phrases commonly used in scam listings. These keywords suggest potential fraud: "${breakdown?.details}". Be very cautious with this listing.`
            : 'No suspicious language patterns detected. The listing description uses professional and trustworthy language.';
        
        case 'price_anomaly':
          return points < 0
            ? `The price per square meter is significantly below market average, which could indicate a scam or hidden costs. The average for this area is around €20-25/m².`
            : 'The price appears to be within normal market range for this area and property type.';
        
        case 'photo_count':
          const photoCount = breakdown?.listingData?.photoCount || 0;
          return photoCount < 5
            ? `Only ${photoCount} photos provided. Quality listings typically include 15+ photos showing different rooms and angles.`
            : `${photoCount} photos provided, showing good visual coverage of the property.`;
        
        case 'freshness':
          return points < 0
            ? 'This listing hasn\'t been updated recently, which may indicate it\'s no longer available or the advertiser isn\'t actively managing it.'
            : 'The listing was recently updated, suggesting the advertiser is actively managing it.';
        
        case 'duplicate':
          return points < 0
            ? 'We found similar listings with identical photos or descriptions, which could indicate a scam or over-advertising.'
            : 'This appears to be a unique listing without suspicious duplicates elsewhere.';
        
        case 'generic_email':
          return points < 0
            ? 'The contact email uses a generic domain (Gmail, Hotmail, etc.) rather than a professional domain, which is less common for legitimate agencies.'
            : 'The advertiser uses professional contact information.';
        
        default:
          return breakdown?.details || 'Analysis completed successfully.';
      }
    }

    // Add CSS animations to shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;

    // Compose dialog
    const cardRelative = document.createElement('div');
    cardRelative.style.position = 'relative';
    
    // Add drag handle for mobile
    if (isMobile && card.querySelector('.drag-handle')) {
      cardRelative.appendChild(card.querySelector('.drag-handle'));
    }
    
    cardRelative.appendChild(closeBtn);
    cardRelative.appendChild(headerContainer);
    cardRelative.appendChild(description);
    cardRelative.appendChild(analysisTitle);
    cardRelative.appendChild(analysisContainer);

    card.appendChild(cardRelative);
    overlay.appendChild(card);
    shadow.appendChild(style);
    shadow.appendChild(overlay);

    // Close helpers
    function teardown() {
      try {
        document.documentElement.style.overflow = previousOverflow || '';
        if (host && host.parentNode) {
          host.parentNode.removeChild(host);
        }
        window.removeEventListener('keydown', onKey);
      } catch (error) {
        console.error('[TrustShield v1.2.3] Error in teardown:', error);
      }
    }
    function onKey(ev) { if (ev.key === 'Escape') teardown(); }
    closeBtn.addEventListener('click', teardown);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) teardown(); });
    window.addEventListener('keydown', onKey);
  }

  // Process a single listing with appropriate component variant
  function processListing(listingData, componentVariant = 'collapsed') {
    const listingKey = listingData.id + ':' + listingData.url + ':' + componentVariant;
    
    // Skip if already processed
    if (processedListings.has(listingKey)) {
      return;
    }
    
    processedListings.add(listingKey);
    
    try {
      // Debug: Log container info (removed for cleaner logs)
      // console.log(`Processing listing ${listingData.id} with variant ${componentVariant}`);
      
      // Create and inject container with variant-specific handling
      const container = createRootContainer(listingData.element, listingData.id + '-' + componentVariant);
      injectContainer(container, listingData, pageType, componentVariant);
      
      // Render loading state with staggered delay for search results
      const delay = componentVariant === 'badge' ? Math.random() * 200 : 0;
      renderComponent(container, listingData, null, true, componentVariant);
      
      // Request score from service worker
      requestListingScore(listingData, function(response) {
        // Render final state
        renderComponent(container, listingData, response, false, componentVariant);
      });
    } catch (error) {
      console.error('Error processing listing:', error);
    }
  }

  // Find and process all listings on search page with badges (v0 spec)
  function processSearchPageListings() {
    const listingElements = document.querySelectorAll('article.item[data-element-id]');
    
    for (let i = 0; i < listingElements.length; i++) {
      const element = listingElements[i];
      const listingData = extractListingData(element);
      
      if (listingData) {
        // Use badge variant for search results per v0 spec
        // Bootstrap missing fields from card DOM if possible
        try {
          // photo counter on card
          const counter = element.querySelector('.item-multimedia-pictures__counter span:last-child');
          if (counter && !listingData.photoCount) {
            const c = parseInt(counter.textContent.replace(/[^\d]/g, ''), 10);
            if (!isNaN(c)) listingData.photoCount = c;
          }
          // floor plan icon on card
          const hasPlan = !!element.querySelector('.icon-plan, .multimedia-shortcuts .icon-plan');
          if (hasPlan) listingData.hasFloorPlan = true;
        } catch (_) {}

        processListing(listingData, 'badge');
      }
    }
  }

  // Process individual listing page with collapsed component (v0 spec)
  function processListingPage() {
    const listingData = extractCurrentListingData();
    
    if (listingData) {
      // Use collapsed variant for listing pages per v0 spec
      processListing(listingData, 'collapsed');
    }
  }

  // Handle dynamic content loading with MutationObserver
  function observePageChanges() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver(function(mutations) {
      let shouldReprocess = false;
      
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        
        if (mutation.type === 'childList') {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new listing was added
              if (node.matches && node.matches('article.item[data-element-id]')) {
                shouldReprocess = true;
                break;
              }
              
              // Check if new listings were added inside this node
              if (node.querySelector && node.querySelector('article.item[data-element-id]')) {
                shouldReprocess = true;
                break;
              }
            }
          }
        }
        
        if (shouldReprocess) {
          break;
        }
      }
      
      if (shouldReprocess && pageType === 'search') {
        // Debounce reprocessing to avoid excessive calls
        setTimeout(function() {
          processSearchPageListings();
        }, 100);
      }
    });

    // Start observing
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize the extension
  function initialize() {
    try {
      console.log('Idealista Trust Shield content v1.2.3: initialize start');
      // Detect page type
      pageType = detectPageType();
      
      if (pageType === 'unknown') {
        console.log('Idealista Trust Shield: Unknown page type, skipping initialization');
        return;
      }
      
              console.log('Idealista Trust Shield: Initializing on', pageType, 'page (v1.2.3)');
      
      // Process existing content
      if (pageType === 'search' || pageType === 'favorites') {
        processSearchPageListings();
        observePageChanges();
      } else if (pageType === 'listing') {
        processListingPage();
      }
      
      // Always inject a Shadow DOM debug badge at the top of the page
      try {
        injectDebugBadge();
      } catch (e) {
        console.warn('Idealista Trust Shield: Failed to inject debug badge:', e);
      }
      
      console.log('Idealista Trust Shield: Initialization complete (v1.2.3)');
    } catch (error) {
      console.error('Idealista Trust Shield: Initialization failed (v1.2.3):', error);
    }
  }

  // Handle page navigation (for SPA-like behavior)
  function handleNavigation() {
    const newPageType = detectPageType();
    
    if (newPageType !== pageType) {
      // Page type changed, reinitialize
      processedListings.clear();
      
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      
      pageType = newPageType;
      initialize();
    }
  }

  // Listen for navigation changes
  window.addEventListener('popstate', handleNavigation);
  
  // Also watch for URL changes (for pushState navigation)
  let currentUrl = window.location.href;
  setInterval(function() {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      handleNavigation();
    }
  }, 1000);

  // Debug Shadow DOM badge placed at the very top of the page to isolate styles and clicks
  function injectDebugBadge() {
    if (document.getElementById('idealista-trust-shield-debug-host')) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'idealista-trust-shield-debug-host';
    document.body.insertBefore(host, document.body.firstChild);

    const shadow = host.attachShadow({ mode: 'open' });

    // Outer container ensures the badge is always visible and non-blocking
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.width = '100%';
    container.style.zIndex = '2147483647';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '8px 0';
    container.style.pointerEvents = 'none';

    // Inner wrapper re-enables pointer events for the chip only
    const inner = document.createElement('div');
    inner.style.pointerEvents = 'auto';
    container.appendChild(inner);
    shadow.appendChild(container);

    const listingData = pageType === 'listing' ? extractCurrentListingData() : null;
    if (!listingData) {
      const neutral = document.createElement('div');
      neutral.textContent = 'Trust Shield active';
      neutral.style.padding = '6px 10px';
      neutral.style.background = '#eef2ff';
      neutral.style.color = '#3730a3';
      neutral.style.borderRadius = '9999px';
      neutral.style.fontSize = '12px';
      neutral.style.fontWeight = '600';
      neutral.style.border = '1px solid rgba(55,48,163,0.2)';
      neutral.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
      inner.appendChild(neutral);
      return;
    }

    const mount = document.createElement('div');
    inner.appendChild(mount);

    window.renderTrustShield(mount, { listingData, scoreData: null, isLoading: true, onClick: showDetailedBreakdown });
    requestListingScore(listingData, function(response) {
      window.renderTrustShield(mount, { listingData, scoreData: response, isLoading: false, onClick: showDetailedBreakdown });
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM is already ready
    initialize();
  }

})();