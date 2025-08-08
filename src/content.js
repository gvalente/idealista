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
    } else if (url.includes('/alquiler-viviendas/') || url.includes('/venta-viviendas/')) {
      return 'search';
    }
    
    return 'unknown';
  }

  // Extract listing data from search page elements
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

      return {
        id: listingId,
        url: listingUrl,
        element: element
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
      const match = url.match(/\/inmueble\/(\d+)\//);
      
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
        listingUrl: listingData.url
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with service worker:', chrome.runtime.lastError);
          callback({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
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
    
    // Check if container already exists
    let container = document.getElementById(containerId);
    if (container) {
      return container;
    }

    // Create new container
    container = document.createElement('div');
    container.id = containerId;
    container.className = EXTENSION_ID + '-container';
    
    // Add styles to prevent conflicts
    container.style.cssText = 'all: initial; font-family: system-ui, -apple-system, sans-serif;';
    
    return container;
  }

  // Inject container into the appropriate location
  function injectContainer(container, targetElement, pageType) {
    try {
      if (pageType === 'search') {
        // For search results, inject into the listing item
        const priceElement = targetElement.querySelector('.item-price');
        if (priceElement) {
          priceElement.parentNode.insertBefore(container, priceElement.nextSibling);
        } else {
          // Fallback: append to the item
          targetElement.appendChild(container);
        }
      } else if (pageType === 'listing') {
        // For listing page, inject near the price information
        const priceElement = document.querySelector('.info-data-price') || 
                             document.querySelector('[data-testid="price"]') ||
                             document.querySelector('.price');
        
        if (priceElement) {
          priceElement.parentNode.insertBefore(container, priceElement.nextSibling);
        } else {
          // Fallback: inject into main content area
          const mainContent = document.querySelector('.detail-info') || 
                             document.querySelector('.main-info') ||
                             document.body;
          mainContent.appendChild(container);
        }
      }
    } catch (error) {
      console.error('Error injecting container:', error);
      // Fallback: append to target element
      targetElement.appendChild(container);
    }
  }

  // React render component function (bridge to React)
  function renderComponent(container, listingData, scoreData, isLoading) {
    window.renderTrustShield(container, { listingData, scoreData, isLoading });
  }

  // Show detailed breakdown (placeholder for future modal/popup)
  function showDetailedBreakdown(scoreData) {
    console.log('Detailed breakdown:', scoreData);
    // This would open a modal or expanded view in a full implementation
  }

  // Process a single listing
  function processListing(listingData) {
    const listingKey = listingData.id + ':' + listingData.url;
    
    // Skip if already processed
    if (processedListings.has(listingKey)) {
      return;
    }
    
    processedListings.add(listingKey);
    
    try {
      // Create and inject container
      const container = createRootContainer(listingData.element, listingData.id);
      injectContainer(container, listingData.element, pageType);
      
      // Render loading state
      renderComponent(container, listingData, null, true);
      
      // Request score from service worker
      requestListingScore(listingData, function(response) {
        // Render final state
        renderComponent(container, listingData, response, false);
      });
    } catch (error) {
      console.error('Error processing listing:', error);
    }
  }

  // Find and process all listings on search page
  function processSearchPageListings() {
    const listingElements = document.querySelectorAll('article.item[data-element-id]');
    
    for (let i = 0; i < listingElements.length; i++) {
      const element = listingElements[i];
      const listingData = extractListingData(element);
      
      if (listingData) {
        processListing(listingData);
      }
    }
  }

  // Process individual listing page
  function processListingPage() {
    const listingData = extractCurrentListingData();
    
    if (listingData) {
      processListing(listingData);
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
      // Detect page type
      pageType = detectPageType();
      
      if (pageType === 'unknown') {
        console.log('Idealista Trust Shield: Unknown page type, skipping initialization');
        return;
      }
      
      console.log('Idealista Trust Shield: Initializing on', pageType, 'page');
      
      // Process existing content
      if (pageType === 'search') {
        processSearchPageListings();
        observePageChanges();
      } else if (pageType === 'listing') {
        processListingPage();
      }
      
      console.log('Idealista Trust Shield: Initialization complete');
    } catch (error) {
      console.error('Idealista Trust Shield: Initialization failed:', error);
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

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM is already ready
    initialize();
  }

})();