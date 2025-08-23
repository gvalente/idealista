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

  // Dynamic search page state tracking  
  let currentUrl = window.location.href;
  let lastKnownListings = new Map(); // listingId -> element reference
  let activeContainers = new Map(); // containerId -> React root
  let searchResultsContainer = null;
  let urlChangeObserver = null;

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

      // Description snippet - enhanced extraction
      let fullDescription = null;
      const descSelectors = [
        '.item-description',
        '.item-description.description', 
        '.item-description .ellipsis',
        '.item-detail-text',
        '.item-info .description'
      ];
      
      for (const selector of descSelectors) {
        const descEl = element.querySelector(selector);
        if (descEl && descEl.textContent && descEl.textContent.trim()) {
          fullDescription = descEl.textContent.trim();
          break;
        }
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

      const listingId = match[1];

      // Extract detailed listing data from the listing page (same as search page)
      // This ensures consistent scoring between search and listing pages
      
      // Price from main price display
      let price = null;
      const priceSelectors = [
        '.info-data-price .txt-bold',
        '.info-data-price',
        '.price .txt-bold',
        '.main-info__price'
      ];
      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^\d]/g, '');
          if (priceText) {
            price = parseFloat(priceText);
            break;
          }
        }
      }

      // Size from listing details
      let size = null;
      const sizeSelectors = [
        '.info-features li',
        '.details-property li',
        '.main-info__features li'
      ];
      for (const selector of sizeSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('m²') || text.includes('m2')) {
            size = parseFloat(text.replace(/[^\d]/g, '')) || null;
            if (size > 0) break;
          }
        }
        if (size > 0) break;
      }

      // Neighborhood from title area
      let neighborhood = null;
      const neighborhoodSelectors = [
        '.main-info__title-minor',
        '.main-info__title-block .main-info__title-minor',
        '.address'
      ];
      for (const selector of neighborhoodSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          neighborhood = el.textContent.trim();
          if (neighborhood) break;
        }
      }

      // Photo count from gallery
      let photoCount = null;
      const photoSelectors = [
        '.multimedia-shortcuts-button[data-button-type="pics"]',
        '.photos span:last-child',
        '.multimedia-counter span:last-child'
      ];
      for (const selector of photoSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent || el.getAttribute('title') || '';
          photoCount = parseInt(text.replace(/[^\d]/g, ''), 10) || null;
          if (photoCount > 0) break;
        }
      }
      
      // Fallback: count actual images
      if (!photoCount) {
        const images = document.querySelectorAll('.gallery img, .multimedia img, .detail-media img');
        if (images.length > 0) {
          photoCount = images.length;
        }
      }

      // Floor plan check
      const hasFloorPlan = !!(
        document.querySelector('.multimedia-shortcuts-button[data-button-type="plan"]') ||
        document.querySelector('.multimedia-shortcuts-button[data-button-type="PLAN"]') ||
        document.querySelector('.icon-plan') ||
        document.querySelector('.floor-plan')
      );

      // Description from listing details
      let fullDescription = '';
      const descSelectors = [
        'div.comment p',
        'div.comment',
        '.description',
        '.property-description',
        '.listing-description'
      ];
      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          fullDescription = el.textContent.trim();
          if (fullDescription) break;
        }
      }

      // Last updated (if available) - consistent with search page behavior
      let lastUpdated = null;
      const updateSelectors = [
        '.date-update-text',
        '.mod-date', 
        '.last-updated',
        '.item-reduced-price',
        '.item-update',
        'time',
        '[class*="update"]'
      ];
      for (const selector of updateSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const updateText = (el.textContent || '').trim();
          if (updateText) {
            lastUpdated = updateText;
            break;
          }
        }
      }

      console.log(`[TrustShield v1.5.1] Extracted listing page data for ${listingId}:`, {
        price, size, neighborhood, photoCount, hasFloorPlan, 
        descriptionLength: fullDescription.length, lastUpdated
      });

      return {
        id: listingId,
        url: url,
        element: document.body,
        // Include all the same data points as search page extraction
        price: price,
        size: size,
        neighborhood: neighborhood,
        photoCount: photoCount,
        hasFloorPlan: hasFloorPlan,
        fullDescription: fullDescription,
        lastUpdated: lastUpdated
      };
    } catch (error) {
      console.error('[TrustShield v1.5.1] Error extracting current listing data:', error);
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
        
        console.log('[TrustShield v1.5.1] 📨 RECEIVED RESPONSE FROM SERVICE WORKER:', {
          success: response?.success,
          score: response?.data?.score,
          breakdown: response?.data?.breakdown?.length,
          listingId: listingData.id,
          dataSource: response?.data?._debug?.dataSource
        });
        
        callback(response);
      });
    } catch (error) {
      console.error('Error sending message to service worker:', error);
      callback({ success: false, error: error.message });
    }
  }

  // Enhanced root container management with tracking
  function createRootContainer(targetElement, listingId) {
    try {
      if (!targetElement || !listingId) {
        console.error('[TrustShield v1.5.1] Invalid parameters for createRootContainer:', { targetElement, listingId });
        return null;
      }
      
    const containerId = ROOT_CONTAINER_ID + '-' + listingId;
    
      // Check if we already have an active container for this listing
      if (activeContainers.has(containerId)) {
        const existing = activeContainers.get(containerId);
        if (existing && existing.container) {
          return existing.container;
        }
      }
      
      // Clean up any existing container
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        cleanupContainer(containerId);
    }

    // Create new container
      const container = document.createElement('div');
      if (!container) {
        console.error('[TrustShield v1.5.1] Failed to create DOM element');
        return null;
      }
      
    container.id = containerId;
    container.className = EXTENSION_ID + '-container';
      container.setAttribute('data-listing-id', listingId);
      
      // Add styles to prevent conflicts and ensure proper display
      container.style.cssText = 'all: initial; font-family: system-ui, -apple-system, sans-serif; display: block;';
      
      // Track the container
      activeContainers.set(containerId, {
        container: container,
        listingId: listingId,
        element: targetElement,
        created: Date.now()
      });
    
    return container;
    } catch (error) {
      console.error('[TrustShield v1.5.1] Error creating root container:', error);
      return null;
    }
  }

  // Clean up container and its tracking
  function cleanupContainer(containerId) {
    try {
      const containerInfo = activeContainers.get(containerId);
      if (containerInfo) {
        // Remove from DOM if still present
        if (containerInfo.container && containerInfo.container.parentNode) {
          containerInfo.container.parentNode.removeChild(containerInfo.container);
        }
        
        // Remove from tracking
        activeContainers.delete(containerId);
        
        console.log(`[TrustShield v1.5.1] Cleaned up container for listing ${containerInfo.listingId}`);
      }
      
      // Also check DOM directly
      const domContainer = document.getElementById(containerId);
      if (domContainer && domContainer.parentNode) {
        domContainer.parentNode.removeChild(domContainer);
      }
    } catch (error) {
      console.warn(`[TrustShield v1.5.1] Error cleaning up container ${containerId}:`, error);
    }
  }

  // Create responsive header layout for listing pages
  function injectIntoListingHeader(headerTitle, container) {
    try {
      // Check if we already modified this header
      if (headerTitle.classList.contains('trustshield-header-modified')) {
        console.log('[TrustShield v1.5.1] Header already modified, finding existing wrapper');
        const existingWrapper = headerTitle.querySelector('.trustshield-header-wrapper');
        if (existingWrapper) {
          const shieldWrapper = existingWrapper.querySelector('.trustshield-header-shield');
          if (shieldWrapper && !shieldWrapper.hasChildNodes()) {
            shieldWrapper.appendChild(container);
            return;
          }
        }
      }

      // Create responsive flex container optimized for badge
      const flexWrapper = document.createElement('div');
      flexWrapper.className = 'trustshield-header-wrapper';
      flexWrapper.style.cssText = [
        'display: flex !important',
        'align-items: flex-start !important',
        'justify-content: space-between !important',
        'gap: 20px !important',
        'width: 100% !important',
        'flex-wrap: wrap !important',
        'position: relative !important'
      ].join(' ');

      // Create title wrapper (preserve existing content)
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'trustshield-header-title';
      titleWrapper.style.cssText = [
        'flex: 1 !important',
        'min-width: 0 !important',
        'order: 2 !important'  // Will be 2 on mobile (below shield)
      ].join(' ');

      // Create shield wrapper
      const shieldWrapper = document.createElement('div');
      shieldWrapper.className = 'trustshield-header-shield';
      shieldWrapper.style.cssText = [
        'flex-shrink: 0 !important',
        'order: 1 !important'  // Will be 1 on mobile (above title)
      ].join(' ');

      // Move all existing header content to title wrapper
      while (headerTitle.firstChild) {
        titleWrapper.appendChild(headerTitle.firstChild);
      }

      // Add Trust Shield to shield wrapper
      shieldWrapper.appendChild(container);

      // Assemble the layout
      flexWrapper.appendChild(titleWrapper);
      flexWrapper.appendChild(shieldWrapper);
      headerTitle.appendChild(flexWrapper);

      // Add responsive styles via a style element
      const styleId = 'trustshield-header-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Desktop: Trust Shield badge on the right, inline with title */
          @media (min-width: 768px) {
            .trustshield-header-wrapper {
              flex-wrap: nowrap !important;
              align-items: center !important; /* Center align for inline layout */
            }
            .trustshield-header-title {
              order: 1 !important;
            }
            .trustshield-header-shield {
              order: 2 !important;
              margin-left: auto !important; /* Push to the right */
            }
            /* Scale badge to 48px height on desktop */
            .trustshield-header-shield > div {
              height: 48px !important;
              min-width: 88px !important;
              padding: 12px 20px !important;
              border-radius: 24px !important;
              font-size: 20px !important;
              font-weight: 600 !important;
            }
            .trustshield-header-shield svg {
              width: 22px !important;
              height: 22px !important;
            }
          }
          
          /* Tablet: Medium size */
          @media (min-width: 480px) and (max-width: 767px) {
            .trustshield-header-wrapper {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
            }
            .trustshield-header-title {
              order: 2 !important;
            }
            .trustshield-header-shield {
              order: 1 !important;
              align-self: flex-start !important;
            }
            /* Medium badge size for tablet */
            .trustshield-header-shield > div {
              height: 42px !important;
              min-width: 80px !important;
              padding: 10px 18px !important;
              border-radius: 21px !important;
              font-size: 18px !important;
            }
            .trustshield-header-shield svg {
              width: 20px !important;
              height: 20px !important;
            }
          }
          
          /* Mobile: Trust Shield badge above title */
          @media (max-width: 479px) {
            .trustshield-header-wrapper {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
            }
            .trustshield-header-title {
              order: 2 !important;
            }
            .trustshield-header-shield {
              order: 1 !important;
              align-self: flex-start !important;
            }
            /* Smaller badge size for mobile */
            .trustshield-header-shield > div {
              height: 36px !important;
              min-width: 72px !important;
              padding: 8px 16px !important;
              border-radius: 18px !important;
              font-size: 16px !important;
            }
            .trustshield-header-shield svg {
              width: 18px !important;
              height: 18px !important;
            }
          }
          
          /* Badge-specific optimizations */
          .trustshield-header-shield {
            display: flex !important;
            align-items: center !important;
            flex-shrink: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Mark header as modified
      headerTitle.classList.add('trustshield-header-modified');
      
      console.log('[TrustShield v1.5.1] ✅ Successfully injected Trust Shield into listing header');
      
    } catch (error) {
      console.error('[TrustShield v1.5.1] Error injecting into header:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  // Inject container into the appropriate location per v0 spec
  function injectContainer(container, listingData, pageType, componentVariant) {
    try {
      if (!container) {
        console.error('[TrustShield v1.5.1] Container is null/undefined, cannot inject');
        return;
      }
      
      if (!listingData || !listingData.element) {
        console.error('[TrustShield v1.5.1] Invalid listing data or element, cannot inject container');
        return;
      }
      
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
      } else if (pageType === 'listing' && componentVariant === 'badge') {
        // For listing pages, inject badge into header area next to main title
        const headerTitle = document.querySelector('.main-info__title');
        console.log('[TrustShield v1.5.1] Looking for .main-info__title:', headerTitle);
        if (headerTitle) {
          console.log('[TrustShield v1.5.1] Found header title, injecting into header layout');
          // Create responsive header layout with badge styling
          injectIntoListingHeader(headerTitle, container);
          return;
        } else {
          console.warn('[TrustShield v1.5.1] Could not find .main-info__title for header injection, using fallback');
          console.log('[TrustShield v1.5.1] Available title selectors:', 
            document.querySelectorAll('h1, .title, [class*="title"], [class*="header"]'));
        }
      }

      // Fallback: append to main element
      if (listingData.element && listingData.element.appendChild) {
        listingData.element.appendChild(container);
        } else {
        console.error('[TrustShield v1.5.1] Cannot append container - element has no appendChild method');
      }
    } catch (error) {
      console.error('[TrustShield v1.5.1] Error injecting container:', error);
      // Try fallback injection
      try {
        if (listingData && listingData.element && listingData.element.appendChild && container) {
          listingData.element.appendChild(container);
        }
      } catch (fallbackError) {
        console.error('[TrustShield v1.5.1] Fallback injection also failed:', fallbackError);
      }
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
    closeBtn.style.top = isMobile ? '16px' : '20px';
    closeBtn.style.right = isMobile ? '16px' : '20px';
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

    // Get risk level first (needed for colors)
    const riskLevel = scoreData.riskLevel || 'low';

    // Get colors based on risk level to match the collapsed pill
    function getDialogColors(riskLevel) {
      switch (riskLevel) {
        case 'low': // High trust (85-100)
          return {
            background: '#7c9885', // sage green
            color: '#7c9885'
          };
        case 'medium': // Medium trust (65-84)
          return {
            background: '#d4a574', // ochre
            color: '#d4a574'
          };
        case 'high': // Low trust (0-64)
          return {
            background: '#c17b6b', // terracotta
            color: '#c17b6b'
          };
        default:
          return {
            background: '#7c9885',
            color: '#7c9885'
          };
      }
    }

    const dialogColors = getDialogColors(riskLevel);

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
    shieldContainer.style.background = dialogColors.background;
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
    scoreDisplay.style.color = dialogColors.color; // Match the shield color
    scoreDisplay.style.margin = '4px 0 0 0';

    titleSection.appendChild(title);
    titleSection.appendChild(scoreDisplay);
    headerContainer.appendChild(shieldContainer);
    headerContainer.appendChild(titleSection);



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
      // Determine status from breakdown data - only show warnings/fails for actual negative impacts
      let status = 'pass';
      if (item.breakdown) {
        if (item.breakdown.points < -20) {
          status = 'fail';  // Major negative impact
        } else if (item.breakdown.points < -5) {
          status = 'caution';  // Minor negative impact
        }
        // Otherwise keep 'pass' - even if points are slightly negative but not significant
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
      
      // Vertical layout with title and status summary stacked
      const textSection = document.createElement('div');
      textSection.style.display = 'flex';
      textSection.style.flexDirection = 'column';
      textSection.style.gap = '2px';
      
      const itemTitle = document.createElement('div');
      itemTitle.textContent = item.title;
      itemTitle.style.fontWeight = '500';
      itemTitle.style.color = '#4a4a4a';
      itemTitle.style.fontSize = '15px';
      itemTitle.style.lineHeight = '1.2';

      const itemSummary = document.createElement('div');
      itemSummary.textContent = item.breakdown?.details || item.summary;
      itemSummary.style.color = '#6b7280';
      itemSummary.style.fontSize = '13px';
      itemSummary.style.lineHeight = '1.3';

      textSection.appendChild(itemTitle);
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

      const expandedInner = document.createElement('div');
      expandedInner.style.padding = '16px 0';
      expandedInner.style.paddingLeft = '32px'; // Align with text content (20px icon + 12px gap)
      expandedInner.style.fontSize = '13px';
      expandedInner.style.color = '#4a4a4a';
      expandedInner.style.lineHeight = '1.5';

      // Create expanded content based on breakdown type (pass full scoreData for accurate info)
      const explanationText = getExplanationText(item.breakdown?.type, item.breakdown, scoreData);
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

      // Hover effects (subtle background overlay)
      itemHeader.onmouseenter = function() {
        itemHeader.style.background = 'rgba(0, 0, 0, 0.03)';
      };
      itemHeader.onmouseleave = function() {
        itemHeader.style.background = 'transparent';
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
    function getExplanationText(type, breakdown, scoreData) {
      const points = breakdown?.points || 0;
      const listingData = scoreData?.listingData || {};
      
      switch (type) {
        case 'scam_keywords':
          return points < 0 
            ? `We detected suspicious phrases commonly used in scam listings. These keywords suggest potential fraud: "${breakdown?.details}". Be very cautious with this listing.`
            : 'No suspicious language patterns detected. The listing description uses professional and trustworthy language.';
        
        case 'price_anomaly':
          const pricePerSqm = listingData.price && listingData.size ? (listingData.price / listingData.size).toFixed(0) : null;
          const neighborhood = listingData.neighborhood || 'this area';
          return points < 0
            ? `The price per square meter${pricePerSqm ? ` (€${pricePerSqm}/m²)` : ''} appears to be significantly below market average for ${neighborhood}, which could indicate a scam or hidden costs.`
            : `The price${pricePerSqm ? ` of €${pricePerSqm}/m²` : ''} appears to be within normal market range for ${neighborhood} and this property type.`;
        
        case 'photo_count':
          const photoCount = listingData.photoCount || 0;
          return photoCount < 5
            ? `Only ${photoCount} photos provided. Quality listings typically include 15+ photos showing different rooms and angles.`
            : `${photoCount} photos provided, showing ${photoCount >= 15 ? 'excellent' : photoCount >= 10 ? 'good' : 'adequate'} visual coverage of the property.`;
        
        case 'freshness':
          const lastUpdated = listingData.lastUpdated;
          let daysSinceUpdate = null;
          if (lastUpdated) {
            try {
              const updateDate = new Date(lastUpdated);
              const now = new Date();
              daysSinceUpdate = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24));
            } catch (e) {
              // Ignore date parsing errors
            }
          }
          
          return points < 0
            ? `This listing hasn't been updated recently${daysSinceUpdate ? ` (${daysSinceUpdate} days ago)` : ''}, which may indicate it's no longer available or the advertiser isn't actively managing it.`
            : `The listing was recently updated${daysSinceUpdate !== null ? ` (${daysSinceUpdate} days ago)` : ''}, suggesting the advertiser is actively managing it.`;
        
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

  // Process a listing with immediate loading state, then smooth transition to final score
  function processListingWithLoadingState(listingData, componentVariant = 'badge', fadeInDelay = 0) {
    // Validate input parameters
    if (!listingData) {
      console.error('[TrustShield v1.5.1] processListingWithLoadingState called with null/undefined listingData');
      return;
    }
    
    if (!listingData.id || typeof listingData.id !== 'string') {
      console.error('[TrustShield v1.5.1] processListingWithLoadingState called with invalid listing ID:', listingData.id, typeof listingData.id);
      return;
    }
    
    if (!listingData.element) {
      console.error('[TrustShield v1.5.1] processListingWithLoadingState called with missing element:', listingData);
      return;
    }
    
    const listingKey = listingData.id + ':' + listingData.url + ':' + componentVariant;
    
    // Check if we already have a Trust Shield for this listing
    const existingContainer = document.getElementById(`idealista-trust-shield-${listingData.id}-${componentVariant}`);
    if (existingContainer && existingContainer.parentNode) {
      console.log(`[TrustShield v1.5.1] ⚠️ Trust Shield already exists for ${listingData.id}, skipping duplicate`);
      return;
    } else if (existingContainer && !existingContainer.parentNode) {
      console.log(`[TrustShield v1.5.1] 🔧 Found orphaned container for ${listingData.id}, cleaning up and recreating`);
      existingContainer.remove();
    }
    
    try {
      // Create and inject container immediately
      const container = createRootContainer(listingData.element, listingData.id + '-' + componentVariant);
      
      if (!container) {
        console.error('[TrustShield v1.5.1] Failed to create container for listing:', listingData.id);
        return;
      }
      
      injectContainer(container, listingData, pageType, componentVariant);
      
      // Add initial fade-in styles
      container.style.opacity = '0';
      container.style.transform = 'scale(0.9)';
      container.style.transition = 'opacity 300ms ease, transform 300ms ease';
      
      // Show loading state immediately (no cascading delay)
      renderComponent(container, listingData, null, true, componentVariant);
      
      // Trigger fade-in animation
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
      });
      
      // Start score calculation in background
      calculateScoreWithTransition(container, listingData, componentVariant);
      
    } catch (error) {
      console.error('[TrustShield v1.5.1] Error in processListingWithLoadingState:', error);
      // Fallback to regular processing
      processListing(listingData, componentVariant);
    }
  }
  
  // Helper function to calculate score and smoothly transition from loading state
  function calculateScoreWithTransition(container, listingData, componentVariant) {
    chrome.runtime.sendMessage({
      action: 'getListingScore',
      listingId: listingData.id,
      listingUrl: listingData.url,
      initialData: {
        price: listingData.price,
        size: listingData.size,
        neighborhood: listingData.neighborhood,
        photoCount: listingData.photoCount,
        hasFloorPlan: listingData.hasFloorPlan,
        fullDescription: listingData.fullDescription,
        lastUpdated: listingData.lastUpdated
      }
    }, function(response) {
      if (response && response.success) {
        console.log('[TrustShield v1.5.1] 📨 Score calculated, transitioning from loading state:', {
          score: response.data?.score,
          listingId: listingData.id
        });
        
        // Smooth transition from loading to final score
        renderComponent(container, listingData, response, false, componentVariant);
      } else {
        console.error('[TrustShield v1.5.1] Score calculation failed for listing:', listingData.id, response?.error);
        // Keep the loading state or show error state
      }
    });
  }

  // Process a single listing with appropriate component variant
  function processListing(listingData, componentVariant = 'collapsed') {
    // Validate input parameters
    if (!listingData) {
      console.error('[TrustShield v1.5.1] processListing called with null/undefined listingData');
      return;
    }
    
    if (!listingData.id || typeof listingData.id !== 'string') {
      console.error('[TrustShield v1.5.1] processListing called with invalid listing ID:', listingData.id, typeof listingData.id);
      return;
    }
    
    if (!listingData.element) {
      console.error('[TrustShield v1.5.1] processListing called with missing element:', listingData);
      return;
    }
    
    const listingKey = listingData.id + ':' + listingData.url + ':' + componentVariant;
    
    // Skip if already processed
    if (processedListings.has(listingKey)) {
      return;
    }
    
    processedListings.add(listingKey);
    
    try {
      // Performance: Use requestIdleCallback for non-critical UI updates when available
      const scheduleWork = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
      
      // Create and inject container with variant-specific handling
      const container = createRootContainer(listingData.element, listingData.id + '-' + componentVariant);
      
      if (!container) {
        console.error('[TrustShield v1.5.1] Failed to create container for listing:', listingData.id);
        return;
      }
      
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

  // Enhanced dynamic search page processing with DOM diffing approach
  function processSearchPageListings() {
    const listingElements = document.querySelectorAll('article.item[data-element-id]');
    const currentListings = new Map();
    
    console.log(`[TrustShield v1.5.1] 🔍 Processing ${listingElements.length} listings on search page`);
    
    // Build current listings map
    for (let i = 0; i < listingElements.length; i++) {
      const element = listingElements[i];
      const listingId = element.getAttribute('data-element-id');
      if (listingId) {
        currentListings.set(listingId, element);
      }
    }
    
    // Detect changes using morphdom-inspired diffing approach
    const changes = detectListingChanges(lastKnownListings, currentListings);
    
    // Handle removed listings
    if (changes.removed.length > 0) {
      console.log(`[TrustShield v1.5.1] 🗑️ Removing Trust Shields for ${changes.removed.length} listings:`, changes.removed);
      changes.removed.forEach(listingId => {
        cleanupListingTrustShield(listingId);
      });
    }
    
    // Handle new listings with immediate loading state + smooth transitions
    if (changes.added.length > 0) {
      console.log(`[TrustShield v1.5.1] ➕ Adding Trust Shields for ${changes.added.length} new listings with loading states:`, changes.added);
      changes.added.forEach((listingId, index) => {
        const element = currentListings.get(listingId);
        if (element) {
          // Extract listing data for immediate loading state
          const listingData = extractListingData(element);
          const listingKey = listingData?.id + ':' + listingData?.url + ':badge';
          
          if (listingData && !processedListings.has(listingKey)) {
            processedListings.add(listingKey);
            
            // Immediately show loading state (no cascading delay)
            processListingWithLoadingState(listingData, 'badge', 0);
          }
        }
      });
    }
    
    // Special case: If we have very few persistent listings and many new ones, 
    // it might be a complete page refresh (like after filters)
    if (changes.persistent.length < 3 && changes.added.length > 5) {
      console.log(`[TrustShield v1.5.1] 🔄 Detected potential page refresh (${changes.persistent.length} persistent, ${changes.added.length} new) - forcing full reprocess`);
      // Force process all listings to ensure Trust Shields appear
      currentListings.forEach((element, listingId) => {
        // Check if this listing already has a Trust Shield
        const existingContainer = document.getElementById(ROOT_CONTAINER_ID + '-' + listingId + '-badge');
        if (!existingContainer) {
          console.log(`[TrustShield v1.5.1] 🔧 Force processing listing ${listingId}`);
          processNewListing(element, listingId);
        }
      });
    }
    
    // Handle persistent listings (no change needed but update tracking)
    if (changes.persistent.length > 0) {
      console.log(`[TrustShield v1.5.1] ✅ ${changes.persistent.length} listings remain unchanged`);
    }
    
    // Update our known state
    lastKnownListings = new Map(currentListings);
    
    console.log(`[TrustShield v1.5.1] 📊 Search page state: ${changes.persistent.length} persistent, ${changes.added.length} added, ${changes.removed.length} removed`);
  }
  
  // Morphdom-inspired change detection
  function detectListingChanges(oldListings, newListings) {
    const changes = {
      added: [],
      removed: [],
      persistent: []
    };
    
    // Find removed listings
    for (const [listingId] of oldListings) {
      if (!newListings.has(listingId)) {
        changes.removed.push(listingId);
      }
    }
    
    // Find added and persistent listings
    for (const [listingId] of newListings) {
      if (oldListings.has(listingId)) {
        changes.persistent.push(listingId);
      } else {
        changes.added.push(listingId);
      }
    }
    
    return changes;
  }
  
  // Clean up Trust Shield for a specific listing
  function cleanupListingTrustShield(listingId) {
    try {
      // Clean up badge containers
      const badgeContainerId = ROOT_CONTAINER_ID + '-' + listingId + '-badge';
      cleanupContainer(badgeContainerId);
      
      // Clean up any other variant containers
      const collapsedContainerId = ROOT_CONTAINER_ID + '-' + listingId + '-collapsed';
      cleanupContainer(collapsedContainerId);
      
      // Remove from processed listings
      const badgeKey = listingId + ':' + currentUrl + ':badge';
      const collapsedKey = listingId + ':' + currentUrl + ':collapsed';
      processedListings.delete(badgeKey);
      processedListings.delete(collapsedKey);
      
      console.log(`[TrustShield v1.5.1] 🧹 Cleaned up Trust Shield for listing ${listingId}`);
    } catch (error) {
      console.warn(`[TrustShield v1.5.1] Error cleaning up listing ${listingId}:`, error);
    }
  }
  
  // Process a new listing that appeared
  function processNewListing(element, listingId) {
    try {
      const listingData = extractListingData(element);
      
      if (listingData) {
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

        // Use requestIdleCallback for non-blocking processing
        const scheduleWork = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
        scheduleWork(() => {
          processListing(listingData, 'badge');
        });
      }
    } catch (error) {
      console.warn(`[TrustShield v1.5.1] Error processing new listing ${listingId}:`, error);
    }
  }

  // Process individual listing page with collapsed component (v0 spec)
  function processListingPage() {
    const listingData = extractCurrentListingData();
    
    if (listingData) {
      // Use badge variant for listing pages to match search page design
      processListing(listingData, 'badge');
    }
  }

  // Enhanced dynamic content monitoring system
  function observePageChanges() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    // Cache the search results container reference
    searchResultsContainer = document.querySelector('.items-container.items-list, section.items-container, main.listing-items');
    
    if (pageType === 'search' && searchResultsContainer) {
      console.log(`[TrustShield v1.5.1] 👀 Monitoring search results container for changes`);
      
      // Enhanced MutationObserver with targeted observation
    mutationObserver = new MutationObserver(function(mutations) {
      let shouldReprocess = false;
        let significantChanges = false;
      
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        
        if (mutation.type === 'childList') {
            // Check if changes occurred within the search results container
            const targetIsSearchContainer = mutation.target === searchResultsContainer ||
                                          searchResultsContainer.contains(mutation.target);
            
            if (targetIsSearchContainer) {
              // Check for listing additions/removals
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches('article.item[data-element-id]')) {
                shouldReprocess = true;
                significantChanges = true;
                break;
              }
              
              if (node.querySelector && node.querySelector('article.item[data-element-id]')) {
                shouldReprocess = true;
                significantChanges = true;
                break;
              }
              
              // Check for search results container replacement (indicates filter changes)
              if (node.classList && (
                node.classList.contains('items-container') ||
                node.classList.contains('search-list') ||
                node.classList.contains('listing-items') ||
                node.id === 'searchResults'
              )) {
                console.log(`[TrustShield v1.5.1] 🔄 Search container updated via mutation, forcing reprocess`);
                shouldReprocess = true;
                significantChanges = true;
                
                // Force refresh in case this is a filter change
                setTimeout(() => {
                  processedListings.clear();
                  processSearchPageListings();
                }, 300);
                break;
              }
            }
          }
              
              // Check for listing removals
              for (let j = 0; j < mutation.removedNodes.length; j++) {
                const node = mutation.removedNodes[j];
                
                if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.matches && node.matches('article.item[data-element-id]')) {
                    shouldReprocess = true;
                    significantChanges = true;
                    break;
                  }
                  
                  if (node.querySelector && node.querySelector('article.item[data-element-id]')) {
                    shouldReprocess = true;
                    significantChanges = true;
                    break;
                  }
              }
            }
          }
        }
        
        if (shouldReprocess) {
          break;
        }
      }
      
      if (shouldReprocess && pageType === 'search') {
          if (significantChanges) {
            console.log(`[TrustShield v1.5.1] 🔄 Significant DOM changes detected, reprocessing search results`);
          }
          
          // Enhanced debouncing with requestIdleCallback for better performance
          const scheduleReprocess = window.requestIdleCallback || ((fn) => setTimeout(fn, 100));
          scheduleReprocess(function() {
          processSearchPageListings();
          });
        }
      });

      // Observe with targeted scope for better performance
      mutationObserver.observe(searchResultsContainer, {
        childList: true,
        subtree: true,
        attributes: false, // We don't need attribute changes
        characterData: false // We don't need text changes
      });
    } else {
      // Fallback to document.body observation for other page types
      mutationObserver = new MutationObserver(function(mutations) {
        // Original logic for non-search pages
        let shouldReprocess = false;
        
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          
          if (mutation.type === 'childList') {
            for (let j = 0; j < mutation.addedNodes.length; j++) {
              const node = mutation.addedNodes[j];
              
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches && node.matches('article.item[data-element-id]')) {
                  shouldReprocess = true;
                  break;
                }
                
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
          const scheduleReprocess = window.requestIdleCallback || ((fn) => setTimeout(fn, 100));
          scheduleReprocess(function() {
            processSearchPageListings();
          });
        }
      });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    }
  }
  
  // URL change monitoring for filter updates
  function setupUrlMonitoring() {
    // Monitor URL changes (for SPA-style navigation and filter updates)
    urlChangeObserver = new MutationObserver(() => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        console.log(`[TrustShield v1.5.1] 🔗 URL changed from ${currentUrl} to ${newUrl}`);
        handleUrlChange(currentUrl, newUrl);
        currentUrl = newUrl;
      }
    });
    
    // Monitor document title changes (often indicates page/filter changes)
    urlChangeObserver.observe(document.querySelector('title'), {
      childList: true,
      subtree: true
    });
    
    // Also listen for popstate events
    window.addEventListener('popstate', function(event) {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        console.log(`[TrustShield v1.5.1] 🔙 Browser navigation from ${currentUrl} to ${newUrl}`);
        handleUrlChange(currentUrl, newUrl);
        currentUrl = newUrl;
      }
    });
    
    // Monitor for pushState/replaceState changes (common in SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        console.log(`[TrustShield v1.5.1] ⏭️ pushState navigation from ${currentUrl} to ${newUrl}`);
        handleUrlChange(currentUrl, newUrl);
        currentUrl = newUrl;
      }
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        console.log(`[TrustShield v1.5.1] 🔄 replaceState navigation from ${currentUrl} to ${newUrl}`);
        handleUrlChange(currentUrl, newUrl);
        currentUrl = newUrl;
      }
    };
  }
  
  // Handle URL changes (filters, search parameters, etc.)
  function handleUrlChange(oldUrl, newUrl) {
    try {
      const oldPageType = detectPageType();
      const newPageType = detectPageType();
      
      // If we're staying on the same page type but URL changed, it's likely a filter change
      if (oldPageType === 'search' && newPageType === 'search') {
        console.log(`[TrustShield v1.5.1] 🔍 Filter/search change detected, refreshing listings`);
        
        // Clear processed listings for this URL context immediately
        clearProcessedListingsForUrl(oldUrl);
        
        // Clear the last known listings to force a fresh comparison
        lastKnownListings.clear();
        
        // Give the page a moment to update the DOM, then force reprocessing
        const scheduleRefresh = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
        scheduleRefresh(() => {
          console.log(`[TrustShield v1.5.1] 🔄 Processing search page after filter change`);
          
          // First check if our dynamic monitoring already handled it
          const currentListingCount = document.querySelectorAll('article.item[data-element-id]').length;
          const processedCount = processedListings.size;
          
          console.log(`[TrustShield v1.5.1] 📊 Current listings: ${currentListingCount}, Processed: ${processedCount}`);
          
          // Only do full reprocessing if the dynamic monitoring missed some
          if (processedCount < currentListingCount * 0.8) { // If less than 80% processed
            console.log(`[TrustShield v1.5.1] 🔄 Dynamic monitoring missed some listings, doing full reprocess`);
            processSearchPageListings();
          } else {
            console.log(`[TrustShield v1.5.1] ✅ Dynamic monitoring handled most listings, skipping duplicate processing`);
          }
          
          // Final verification check (only if needed)
          setTimeout(() => {
            const listingElements = document.querySelectorAll('article.item[data-element-id]');
            const missingShields = [];
            
            for (const element of listingElements) {
              const listingId = element.getAttribute('data-element-id');
              if (listingId) {
                // Check multiple ways to find existing shields
                const shieldContainer = element.querySelector('[id*="idealista-trust-shield"]') ||
                                       element.querySelector('[class*="idealista-trust-shield"]') ||
                                       document.getElementById(`idealista-trust-shield-${listingId}-badge`);
                
                if (!shieldContainer) {
                  missingShields.push(element);
                } else {
                  // Verify the shield is actually attached and visible
                  if (!shieldContainer.parentNode || !document.body.contains(shieldContainer)) {
                    console.log(`[TrustShield v1.5.1] 🔧 Found detached shield for ${listingId}, treating as missing`);
                    missingShields.push(element);
                  }
                }
              }
            }
            
            if (missingShields.length > 0) {
              console.log(`[TrustShield v1.5.1] 🔍 Final verification: ${missingShields.length} missing shields, adding them`);
              
              missingShields.forEach((element, index) => {
                const listingData = extractListingData(element);
                if (listingData) {
                  const listingKey = listingData.id + ':' + listingData.url + ':badge';
                  console.log(`[TrustShield v1.5.1] 🔧 Processing missing shield for listing ${listingData.id}, processed key: ${listingKey}`);
                  
                  if (!processedListings.has(listingKey)) {
                    processedListings.add(listingKey);
                    
                    try {
                      // Use fallback to regular processListing if loading state fails
                      processListingWithLoadingState(listingData, 'badge', 0);
                      console.log(`[TrustShield v1.5.1] ✅ Successfully initiated shield for ${listingData.id}`);
                    } catch (error) {
                      console.error(`[TrustShield v1.5.1] ❌ Loading state failed for ${listingData.id}, trying regular processing:`, error);
                      try {
                        processListing(listingData, 'badge');
                        console.log(`[TrustShield v1.5.1] ✅ Fallback processing succeeded for ${listingData.id}`);
                      } catch (fallbackError) {
                        console.error(`[TrustShield v1.5.1] ❌ Both methods failed for ${listingData.id}:`, fallbackError);
                      }
                    }
                  } else {
                    console.log(`[TrustShield v1.5.1] ⚠️ Listing ${listingData.id} already in processed set but DOM shield missing`);
                    
                    // Force reprocessing if processed but DOM element missing
                    try {
                      processListingWithLoadingState(listingData, 'badge', 0);
                      console.log(`[TrustShield v1.5.1] ✅ Force reprocessed ${listingData.id}`);
                    } catch (error) {
                      console.error(`[TrustShield v1.5.1] ❌ Force reprocessing failed for ${listingData.id}:`, error);
                    }
                  }
                } else {
                  console.error(`[TrustShield v1.5.1] ❌ Failed to extract listing data for element:`, element);
                }
              });
              
              // Verify results after a short delay
              setTimeout(() => {
                const stillMissing = missingShields.filter(element => {
                  const listingId = element.getAttribute('data-element-id');
                  const shieldContainer = element.querySelector('[id*="idealista-trust-shield"]') ||
                                         document.getElementById(`idealista-trust-shield-${listingId}-badge`);
                  return listingId && (!shieldContainer || !document.body.contains(shieldContainer));
                });
                
                if (stillMissing.length > 0) {
                  const stillMissingIds = stillMissing.map(el => el.getAttribute('data-element-id'));
                  console.warn(`[TrustShield v1.5.1] ⚠️ ${stillMissing.length} shields still missing after processing:`, stillMissingIds);
                  
                  // Last resort: try one more time with regular processing
                  stillMissing.forEach(element => {
                    const listingData = extractListingData(element);
                    if (listingData) {
                      console.log(`[TrustShield v1.5.1] 🆘 Last resort processing for ${listingData.id}`);
                      try {
                        processListing(listingData, 'badge');
                      } catch (error) {
                        console.error(`[TrustShield v1.5.1] ❌ Last resort failed for ${listingData.id}:`, error);
                      }
                    }
                  });
                } else {
                  console.log(`[TrustShield v1.5.1] ✅ All missing shields successfully added`);
                }
              }, 800);
            } else {
              console.log(`[TrustShield v1.5.1] ✅ All listings have Trust Shields`);
            }
          }, 1000); // Reduced from 1500ms to 1000ms
        });
      } else if (oldPageType !== newPageType) {
        // Page type changed, reinitialize completely
        console.log(`[TrustShield v1.5.1] 📄 Page type changed from ${oldPageType} to ${newPageType}, reinitializing`);
        handleNavigation();
      }
    } catch (error) {
      console.warn(`[TrustShield v1.5.1] Error handling URL change:`, error);
    }
  }
  
  // Clear processed listings for a specific URL
  function clearProcessedListingsForUrl(url) {
    const keysToRemove = [];
    for (const key of processedListings) {
      if (key.includes(url)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => processedListings.delete(key));
    console.log(`[TrustShield v1.5.1] 🧹 Cleared ${keysToRemove.length} processed listings for URL change`);
  }

  // Initialize the extension
  function initialize() {
    try {
      console.log('Idealista Trust Shield content v1.5.1: initialize start - CSP-compliant data handling');
      // Detect page type
      pageType = detectPageType();
      
      if (pageType === 'unknown') {
        console.log('Idealista Trust Shield: Unknown page type, skipping initialization');
        return;
      }
      
              console.log('Idealista Trust Shield: Initializing on', pageType, 'page (v1.3.5)');
      
      // Process existing content
      if (pageType === 'search' || pageType === 'favorites') {
        processSearchPageListings();
        observePageChanges();
        setupUrlMonitoring(); // Monitor for filter/search changes
      } else if (pageType === 'listing') {
        processListingPage();
      }
      

      
      console.log('Idealista Trust Shield: Initialization complete (v1.3.5)');
    } catch (error) {
      console.error('Idealista Trust Shield: Initialization failed (v1.3.5):', error);
    }
  }

  // Handle page navigation (for SPA-like behavior) with comprehensive cleanup
  function handleNavigation() {
    const newPageType = detectPageType();
    
    if (newPageType !== pageType) {
      console.log(`[TrustShield v1.5.1] 🧭 Navigation: ${pageType} → ${newPageType}`);
      
      // Comprehensive cleanup
      processedListings.clear();
      lastKnownListings.clear();
      
      // Cleanup all active containers
      for (const [containerId, containerInfo] of activeContainers) {
        cleanupContainer(containerId);
      }
      activeContainers.clear();
      
      // Disconnect observers
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      
      if (urlChangeObserver) {
        urlChangeObserver.disconnect();
        urlChangeObserver = null;
      }
      
      // Clear container references
      searchResultsContainer = null;
      
      // Update state and reinitialize
      pageType = newPageType;
      currentUrl = window.location.href;
      initialize();
    }
  }

  // Listen for navigation changes
  window.addEventListener('popstate', handleNavigation);
  
  // Also watch for URL changes (for pushState navigation)
  // Note: currentUrl is already declared at the top
  setInterval(function() {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      handleNavigation();
    }
  }, 1000);



  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM is already ready
    initialize();
  }

})();