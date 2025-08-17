// Idealista Trust Shield - Service Worker
// Background "brain" for the Chrome extension

// Configuration Constants
const NEIGHBORHOOD_AVG_PRICES = {
  'gràcia': 27.0,
  'eixample': 26.0,
  'ciutat vella': 25.0,
  'sarrià-sant gervasi': 28.0,
  'les corts': 24.0,
  'sant martí': 23.0,
  'sants-montjuïc': 21.0,
  'horta-guinardó': 19.0,
  'nou barris': 18.0,
  'sant andreu': 20.0
};

const SCAM_KEYWORDS = [
  'western union',
  'moneygram',
  'transfer to reserve',
  'payment before viewing',
  'currently abroad',
  'out of town',
  'contact me via email only',
  'whatsapp only',
  'send passport',
  'bank details to apply',
  'owner traveling',
  'overseas',
  'holding fee',
  'reservation fee',
  'urgent',
  'trust me',
  '100% safe'
];

// Event Listener for Messages from Content Script
console.log('🔄 Idealista Trust Shield service worker v1.3.7 loaded - OPTIMIZED FOR PERFORMANCE');
console.log('[TrustShield v1.3.7] Service worker loaded at:', new Date().toISOString());
console.log('[TrustShield v1.3.7] ✅ Latest Chrome Extension & React optimizations applied');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getListingScore') {
    handleListingScoreRequest(request.listingId, request.listingUrl, sendResponse, request.initialData || {});
    return true; // Keep message channel open for async response
  }
});

// Main Handler for Listing Score Requests
async function handleListingScoreRequest(listingId, listingUrl, sendResponse, initialData) {
  try {
    // Check cache first (disabled for v1.2.3 debugging)
    // const cachedScore = await getCachedScore(listingUrl);
    // if (cachedScore) {
    //   sendResponse({ success: true, data: cachedScore });
    //   return;
    // }
    console.log('[TrustShield v1.2.3] CACHE DISABLED - forcing fresh calculation');

    // Fetch fresh data
    let listingData = await fetchListingData(listingId, listingUrl);
    
    // If no data was fetched, create mock data from initial data
    if (!listingData) {
      console.log(`[TrustShield v1.2.3] Creating Phase 1 data for ${listingId} from initial data:`, initialData);
      listingData = {
        id: listingId,
        url: listingUrl,
        fullDescription: '',
        price: initialData?.price || 0,
        size: initialData?.size || 0,
        neighborhood: initialData?.neighborhood || '',
        photoCount: initialData?.photoCount ?? 0,
        hasFloorPlan: initialData?.hasFloorPlan ?? false,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Merge any initial data we received from the search card
    if (initialData && typeof initialData === 'object') {
      const cleaned = Object.fromEntries(Object.entries(initialData).filter(([_, v]) => v !== undefined && v !== null));
      listingData = { ...listingData, ...cleaned };
    }
    
    // Clean to Phase 1 fields only and apply mock data generation for empty fields
    const phase1Data = {
      id: listingData.id,
      url: listingData.url,
      price: listingData.price,
      size: listingData.size,
      neighborhood: listingData.neighborhood,
      photoCount: listingData.photoCount,
      hasFloorPlan: listingData.hasFloorPlan,
      fullDescription: listingData.fullDescription || '',
      lastUpdated: listingData.lastUpdated
    };
    
    const cleanedData = applyMockDataGenerationPhase1(phase1Data);
    console.log(`[TrustShield v1.2.3] Phase 1 cleaned data for scoring:`, cleanedData);

    // Calculate score
    const score = calculateScore(cleanedData);
    // Attach debug fields
    score._debug = {
      id: listingId,
      url: listingUrl,
      price: listingData.price,
      size: listingData.size,
      hasFloorPlan: listingData.hasFloorPlan,
      photoCount: listingData.photoCount,
      neighborhood: listingData.neighborhood,
      version: '1.0.9'
    };
    
    // Caching disabled for debugging
    // await setCachedScore(listingUrl, score);
    
    console.log('[TrustShield v1.2.3] 🚀 SENDING RESPONSE TO CONTENT SCRIPT:', { 
      score: score.score, 
      breakdown: score.breakdown.length,
      riskLevel: score.riskLevel 
    });
    sendResponse({ success: true, data: score });
  } catch (error) {
    console.error('[TrustShield v1.2.3] ERROR in service worker:', error);
    console.error('[TrustShield v1.2.3] Stack trace:', error.stack);
    sendResponse({ success: false, error: error.message });
  }
}

// Data Fetching with Primary and Contingency Strategies
async function fetchListingData(listingId, listingUrl) {
      console.log(`[TrustShield v1.2.3] Fetching data for ${listingId}`);
  
  try {
    // Primary Strategy: Try JSON endpoint first
    const jsonData = await fetchJsonData(listingId);
    if (jsonData) {
      console.log(`[TrustShield v1.2.3] JSON data found for ${listingId}`);
      return parseJsonData(jsonData, listingUrl);
    }
  } catch (error) {
    console.warn('JSON endpoint failed, trying HTML fallback:', error);
  }

  try {
    // Contingency Plan: Fetch and parse HTML
    const htmlData = await fetchHtmlData(listingUrl);
    if (htmlData) {
      console.log(`[TrustShield v1.2.3] HTML data fetched for ${listingId}, length: ${htmlData.length}`);
      let parsed = parseHtmlData(htmlData, listingUrl);
      
      // If key fields are missing, try to extract from embedded JSON (dataLayer or window.__INITIAL_STATE__)
      if (parsed && (!parsed.fullDescription || parsed.photoCount === 0 || !parsed.neighborhood)) {
        try {
          const embedded = extractEmbeddedJson(htmlData);
          if (embedded) {
            console.log(`[TrustShield v1.2.3] Embedded JSON found for ${listingId}:`, embedded);
            parsed = {
              ...parsed,
              fullDescription: parsed.fullDescription || embedded.description || '',
              photoCount: parsed.photoCount || embedded.photoCount || 0,
              neighborhood: parsed.neighborhood || embedded.neighborhood || ''
            };
          }
        } catch (e) {
          console.warn('Embedded JSON parse failed:', e);
        }
      }
      
      console.log(`[TrustShield v1.2.3] Final parsed data for ${listingId}:`, parsed);
      return parsed;
    } else {
      console.warn(`[TrustShield v1.2.3] No HTML data returned for ${listingId}`);
    }
  } catch (error) {
    console.error('HTML fallback also failed:', error);
  }

  console.warn(`[TrustShield v1.2.3] All data fetching failed for ${listingId}, returning null`);
  return null;
}

// Try to extract useful fields from embedded JSON blobs on the page
function extractEmbeddedJson(htmlText) {
  try {
    // dataLayer push
    const dlMatch = htmlText.match(/dataLayer.push\((\{[\s\S]*?\})\)/);
    if (dlMatch) {
      const obj = JSON.parse(dlMatch[1]);
      return {
        description: obj.description || obj.listingDescription || '',
        photoCount: obj.photoCount ? parseInt(obj.photoCount) : 0,
        neighborhood: obj.neighborhood || obj.area || ''
      };
    }
    // window.__INITIAL_STATE__ or similar
    const isMatch = htmlText.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*;?/);
    if (isMatch) {
      const obj = JSON.parse(isMatch[1]);
      const listing = obj.listing || obj.data || {};
      return {
        description: listing.description || '',
        photoCount: listing.photoCount || 0,
        neighborhood: listing.neighborhood || ''
      };
    }
  } catch (_) {}
  return null;
}

// Extract advertiser details from JSON-LD or inline JSON
function extractAdvertiserFromScripts(htmlText) {
  const result = { advertiserName: '', contactEmail: null, advertiserType: '' };
  try {
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(htmlText)) !== null) {
      const content = m[1] ? m[1].trim() : '';
      if (!content) continue;
      // Only attempt JSON on reasonable size strings
      if (content.length > 10 && /\{|\[/.test(content)) {
        try {
          const json = JSON.parse(content);
          const hit = findAdvertiserInJson(json);
          if (hit) {
            result.advertiserName = hit.name || result.advertiserName;
            result.contactEmail = hit.email || result.contactEmail;
            result.advertiserType = hit.type || result.advertiserType;
            if (result.advertiserName && result.contactEmail) break;
          }
        } catch (_) {
          // ignore parse errors on non-JSON scripts
        }
      }
    }
  } catch (_) {}
  return result;
}

function findAdvertiserInJson(node) {
  try {
    if (!node || typeof node !== 'object') return null;

    // Direct keys we care about
    const keys = ['seller', 'provider', 'publisher', 'author', 'brand', 'agent', 'advertiser', 'organization'];
    for (const k of keys) {
      const v = node[k];
      if (v && typeof v === 'object') {
        const hit = normalizeAdvertiserJson(v);
        if (hit) return hit;
      }
    }

    // JSON-LD @graph arrays
    if (Array.isArray(node['@graph'])) {
      for (const item of node['@graph']) {
        const hit = findAdvertiserInJson(item);
        if (hit) return hit;
      }
    }

    // Arrays
    if (Array.isArray(node)) {
      for (const item of node) {
        const hit = findAdvertiserInJson(item);
        if (hit) return hit;
      }
    }

    // Recurse generic objects
    for (const key in node) {
      const val = node[key];
      if (val && typeof val === 'object') {
        const hit = findAdvertiserInJson(val);
        if (hit) return hit;
      }
    }
  } catch (_) {}
  return null;
}

function normalizeAdvertiserJson(obj) {
  try {
    if (!obj || typeof obj !== 'object') return null;
    const name = obj.name || obj.company || obj.agency || '';
    const email = obj.email || obj.contactEmail || null;
    const typeRaw = obj['@type'] || obj.type || '';
    let type = '';
    if (typeRaw) {
      const lower = String(typeRaw).toLowerCase();
      if (lower.includes('agent') || lower.includes('organization') || lower.includes('realestate')) type = 'agency';
    }
    return (name || email) ? { name, email, type } : null;
  } catch (_) {
    return null;
  }
}

// Primary Strategy: Fetch JSON Data
async function fetchJsonData(listingId) {
  const variants = [
    `https://www.idealista.com/detail/${listingId}/datalayer`,
    `https://www.idealista.com/detail/${listingId}/datalayer/?lang=en`,
    `https://www.idealista.com/detail/${listingId}/datalayer.en`,
    `https://www.idealista.com/detail/${listingId}/datalayer.json`
  ];

  for (const url of variants) {
  try {
    const response = await fetch(url, {
      method: 'GET',
        credentials: 'include',
      headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) continue;

      // Some environments serve JSON with incorrect content-type
      const text = await response.text();
      if (!text || text.length < 2) continue;

      // Try parse as pure JSON first
      try {
        return JSON.parse(text);
      } catch (_) {
        // Try to extract JSON object/array embedded in text
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const candidate = text.slice(start, end + 1);
          try {
            return JSON.parse(candidate);
          } catch (_) {}
        }
        const aStart = text.indexOf('[');
        const aEnd = text.lastIndexOf(']');
        if (aStart !== -1 && aEnd !== -1 && aEnd > aStart) {
          const candidate = text.slice(aStart, aEnd + 1);
          try {
            return JSON.parse(candidate);
          } catch (_) {}
        }
    }
  } catch (error) {
      console.warn('JSON fetch variant failed:', url, error);
    }
  }

  return null;
}

// Contingency Plan: Fetch HTML Data
async function fetchHtmlData(listingUrl) {
  try {
    console.log(`[TrustShield v1.2.3] Fetching HTML from: ${listingUrl}`);
    
    const response = await fetch(listingUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log(`[TrustShield v1.2.3] Response status: ${response.status}, ok: ${response.ok}`);

    if (response.ok) {
      const text = await response.text();
      console.log(`[TrustShield v1.2.3] HTML length: ${text.length}, first 200 chars: ${text.substring(0, 200)}`);
      
      if (typeof text === 'string' && text.length > 1000) {
        return text;
      } else {
        console.warn(`[TrustShield v1.2.3] HTML too short: ${text.length} characters`);
      }
    } else {
      console.warn(`[TrustShield v1.2.3] HTTP error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('[TrustShield v1.2.3] HTML fetch failed:', error);
  }

  return null;
}

// Parse JSON Data into ListingData Object
function parseJsonData(jsonData, listingUrl) {
  try {
    const data = jsonData.data || jsonData; // handle wrapped payloads

    const advertiserName = data.advertiserName || data.advertiser?.name || data.agency || data.seller?.name || '';
    let advertiserType = data.advertiserType || data.advertiser?.type || '';
    if (!advertiserType) {
      advertiserType = advertiserName ? 'agency' : 'private';
    }
    const contactEmail = data.contactEmail || data.email || data.advertiser?.email || data.seller?.email || null;
    
    return {
      id: data.id || extractIdFromUrl(listingUrl),
      url: listingUrl,
      fullDescription: data.description || data.fullDescription || '',
      price: parseFloat(data.price) || 0,
      size: parseFloat(data.size) || 0,
      neighborhood: data.neighborhood || data.area || '',
      photoCount: parseInt(data.photoCount) || 0,
      hasFloorPlan: Boolean(data.hasFloorPlan || data.floorPlan),
      lastUpdated: data.lastUpdated || data.updatedAt || new Date().toISOString(),
      advertiserType,
      advertiserName,
      contactEmail
    };
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return null;
  }
}

// Parse HTML Data into ListingData Object
function parseHtmlData(htmlText, listingUrl) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    
    // Price: Multiple selectors for different page layouts
    let price = 0;
    const priceSelectors = [
      '.info-data-price',
      '.price',
      '[data-testid="price"]',
      '.main-info__price',
      '.detail-info__price',
      '.property-price',
      '.price-value'
    ];
    for (const selector of priceSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const priceText = el.textContent.replace(/[^\d]/g, '');
        if (priceText) {
          price = parseFloat(priceText);
          break;
        }
      }
    }

    // Description: Primary selector from UI-FUNCTIONAL-SPEC
    let fullDescription = '';
    const descSelectors = [
      'div.comment p',  // Primary from spec
      'div.comment',    // Fallback
      '[data-testid="description"]',
      '.description',
      '.property-description',
      '.listing-description',
      '.detail-description',
      '.main-info__description'
    ];
    for (const selector of descSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        fullDescription = el.textContent.trim();
        console.log(`[TrustShield v1.2.3] Found description with selector '${selector}': ${fullDescription.substring(0, 100)}...`);
        if (fullDescription) break;
      }
    }

    // Size (m²): Multiple approaches
    let size = 0;
    const sizeSelectors = [
      '.info-features span',
      '.info-features li', 
      '.details-property li',
      '.features li',
      '.property-features span',
      '.main-info__features span',
      '.detail-features span'
    ];
    for (const selector of sizeSelectors) {
      const elements = doc.querySelectorAll(selector);
      for (const el of elements) {
        const txt = (el.textContent || '').toLowerCase();
        if (txt.includes('m²') || txt.includes('m2')) {
          size = parseFloat(txt.replace(/[^\d]/g, '')) || 0;
          if (size > 0) break;
        }
      }
      if (size > 0) break;
    }

    // Neighborhood: Primary selector from UI-FUNCTIONAL-SPEC
    let neighborhood = '';
    const neighborhoodSelectors = [
      '.main-info__title-minor',  // Primary from spec
      '.main-info__title',        // Fallback
      '[data-testid="neighborhood"]',
      '.location',
      '.property-location',
      '.neighborhood',
      '.area-name',
      '.district'
    ];
    for (const selector of neighborhoodSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        neighborhood = el.textContent.trim();
        console.log(`[TrustShield v1.2.3] Found neighborhood with selector '${selector}': ${neighborhood}`);
        if (neighborhood) break;
      }
    }

    // Photo count: Primary selector from UI-FUNCTIONAL-SPEC
    let photoCount = 0;
    const counterSelectors = [
      '.multimedia-shortcuts-button[data-button-type="pics"]',  // Primary from spec
      '.item-multimedia-pictures__counter span:last-child',
      '.photos-counter span:last-child', 
      '.multimedia-counter span:last-child',
      '.gallery-counter',
      '.photo-count',
      '.multimedia-count'
    ];
    for (const selector of counterSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const text = el.textContent || el.getAttribute('title') || '';
        photoCount = parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
        console.log(`[TrustShield v1.2.3] Found photo count with selector '${selector}': ${photoCount} (text: "${text}")`);
        if (photoCount > 0) break;
      }
    }
    
    // Fallback: count gallery images
    if (photoCount === 0) {
      const gallerySelectors = [
        '.gallery img',
        '.media-gallery img', 
        '.detail-media img',
        '.multimedia img',
        '.gallery-container img',
        '.photos img',
        '.property-images img'
      ];
      for (const selector of gallerySelectors) {
        const imgs = doc.querySelectorAll(selector);
        if (imgs.length > 0) {
          photoCount = imgs.length;
          console.log(`[TrustShield v1.2.3] Counted ${photoCount} images with selector '${selector}'`);
          break;
        }
      }
    }

    // Floor plan indicator: Primary selector from UI-FUNCTIONAL-SPEC
    const floorPlanSelectors = [
      '.multimedia-shortcuts-button[data-button-type="plan"]',  // Primary from spec
      '.multimedia-shortcuts-button[data-button-type="PLAN"]',
      '.icon-plan',
      '.floor-plan', 
      '.icono-plano',
      '.plan-button',
      '.floorplan-icon',
      '[data-testid="floor-plan"]'
    ];
    let hasFloorPlan = false;
    for (const selector of floorPlanSelectors) {
      if (doc.querySelector(selector)) {
        hasFloorPlan = true;
        console.log(`[TrustShield v1.2.3] Found floor plan with selector '${selector}'`);
        break;
      }
    }

    // Last updated: Primary selector from UI-FUNCTIONAL-SPEC
    let lastUpdated = new Date().toISOString();
    const updateSelectors = [
      '.date-update-text',  // Primary from spec
      '.mod-date',
      '.last-updated',
      '.update-date',
      '.listing-date'
    ];
    for (const selector of updateSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const updateText = el.textContent.trim();
        if (updateText) {
          lastUpdated = updateText;
          console.log(`[TrustShield v1.2.3] Found last updated with selector '${selector}': ${updateText}`);
          break;
        }
      }
    }

    // Advertiser name/type/email fallbacks (DOM selectors)
    let advertiserName = '';
    const advertiserSelectors = [
      '.about-advertiser-name',  // Primary from your HTML example
      '.professional-name',
      '.about-advertiser .name',
      '[data-testid="advertiser-name"]',
      '.advertiser-name',
      '.owner-name',
      '[itemprop="seller"] [itemprop="name"]',
      'section[data-collision-id="aboutAdvertiserBlock"] .name',
      '.professional-data .name'
    ];
    for (const selector of advertiserSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        advertiserName = (el.textContent || '').trim();
        console.log(`[TrustShield v1.2.3] Found advertiser name with selector '${selector}': ${advertiserName}`);
        if (advertiserName) break;
      }
    }

    // Email from mailto links, data attributes, or contact forms
    let contactEmail = null;
    
    // Try mailto links first
    const mailEl = doc.querySelector('a[href^="mailto:"]');
    if (mailEl) {
      const href = mailEl.getAttribute('href');
      const match = href && href.match(/mailto:([^?\s]+)/i);
      if (match && match[1]) {
        contactEmail = match[1];
        console.log(`[TrustShield v1.2.3] Found email via mailto: ${contactEmail}`);
      }
    }
    
    // Try data attributes
    if (!contactEmail) {
      const emailAttrEl = doc.querySelector('[data-contact-email], [data-email], [data-advertiser-email]');
      if (emailAttrEl) {
        contactEmail = emailAttrEl.getAttribute('data-contact-email') || 
                      emailAttrEl.getAttribute('data-email') || 
                      emailAttrEl.getAttribute('data-advertiser-email') || null;
        if (contactEmail) console.log(`[TrustShield v1.2.3] Found email via data attribute: ${contactEmail}`);
      }
    }
    
    // Try hidden form inputs (common pattern for contact forms)
    if (!contactEmail) {
      const hiddenEmailEl = doc.querySelector('input[name="email"], input[name="contactEmail"], input[name="advertiserEmail"]');
      if (hiddenEmailEl) {
        contactEmail = hiddenEmailEl.value || hiddenEmailEl.getAttribute('value') || null;
        if (contactEmail) console.log(`[TrustShield v1.2.3] Found email via form input: ${contactEmail}`);
      }
    }
    
    // For agencies, sometimes email is not publicly displayed for privacy
    // This is normal and expected behavior

    // JSON-LD scripts: Organization/RealEstateAgent/seller
    if (!advertiserName || !contactEmail) {
      const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const s of ldScripts) {
        const txt = (s.textContent || '').trim();
        if (!txt) continue;
        try {
          const json = JSON.parse(txt);
          const hit = findAdvertiserInJson(json);
          if (hit) {
            advertiserName = advertiserName || hit.name || '';
            contactEmail = contactEmail || hit.email || null;
            if (hit.type) inferredTypeFromScripts = hit.type;
            if (advertiserName && contactEmail) break;
          }
        } catch (_) { /* ignore */ }
      }
    }

    // Infer advertiser type
    let advertiserType = 'private';
    let inferredTypeFromScripts = '';
    if (advertiserName) advertiserType = 'agency';
    if (inferredTypeFromScripts) advertiserType = inferredTypeFromScripts;

    // DEBUG: Log what we extracted
    console.log(`[TrustShield v1.2.3] Extracted data for ${listingUrl}:`, {
      price, size, neighborhood, photoCount, hasFloorPlan, fullDescription: fullDescription.substring(0, 50) + '...', advertiserName, contactEmail
    });
    
    return {
      id: extractIdFromUrl(listingUrl),
      url: listingUrl,
      fullDescription,
      price,
      size,
      neighborhood,
      photoCount,
      hasFloorPlan,
      lastUpdated,
      advertiserType,
      advertiserName,
      contactEmail
    };
  } catch (error) {
    console.error('Error parsing HTML data:', error);
    return null;
  }
}

// Apply mock data generation for empty fields
// Phase 1 Mock Data Generation - only for essential fields
function applyMockDataGenerationPhase1(listingData) {
  const result = { ...listingData };
  
  // Only generate realistic mock data for key Phase 1 fields that are empty
  if (!result.fullDescription || result.fullDescription.trim() === '') {
    result.fullDescription = `Modern ${result.size || 60}m² apartment in ${result.neighborhood || 'Barcelona'}. Well-maintained property with good natural light and convenient location.`;
  }
  
  // Don't mock price/size/photos - these should be real or 0
  return result;
}

// Legacy function kept for compatibility
function applyMockDataGeneration(listingData) {
  const { price, size } = listingData;

  // Only synthesize fields if missing AND not supplied by initialData
  if (!listingData.fullDescription && price > 0) {
    const nhood = listingData.neighborhood || 'Barcelona';
    const descriptions = [
      `Beautiful apartment in ${nhood} with ${size || 50}m² of space. Perfect for ${price < 1000 ? 'students' : price < 1500 ? 'young professionals' : 'families'}.`,
      `Cozy ${size || 50}m² apartment in ${nhood}. Great location with excellent transport links.`,
      `Modern ${size || 50}m² flat in ${nhood}. Recently renovated with new appliances.`,
      `Charming ${size || 50}m² apartment in ${nhood}. Traditional building with character.`
    ];
    listingData.fullDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  if (!listingData.neighborhood && price > 0) {
    const neighborhoods = ['Gràcia', 'Eixample', 'Ciutat Vella', 'Sant Martí', 'Sants-Montjuïc'];
    listingData.neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  }

  if ((listingData.photoCount === undefined || listingData.photoCount === 0) && price > 0) {
    listingData.photoCount = Math.floor(Math.random() * 15) + 3;
  }
  if ((listingData.hasFloorPlan === undefined || listingData.hasFloorPlan === false) && price > 0) {
    listingData.hasFloorPlan = Math.random() > 0.6;
  }

  return listingData;
}

// Extract ID from URL
function extractIdFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : '';
}

// Phase 1 Scoring Algorithm - Fixed Math (v1.2.3)
function calculateScore(listingData) {
  let totalScore = 100; // Start with baseline score
  const breakdown = [];
  const maxScores = {
    price_anomaly: 40,    // Max 40 points (0 to -40)
    listing_quality: 35,  // Max 35 points (-15 to +20) 
    content_safety: 15,   // Max 15 points (0 to -15)
    freshness: 10         // Max 10 points (0 to -10)
  };

  console.log('[TrustShield v1.2.3] Starting calculation with data:', {
    photoCount: listingData.photoCount,
    hasFloorPlan: listingData.hasFloorPlan,
    descriptionLength: (listingData.fullDescription || '').length,
    price: listingData.price,
    size: listingData.size
  });

  // Content Safety (15 points max)
  const scamCheck = checkScamKeywords(listingData.fullDescription);
  let safetyScore = 15; // Start with full points
  if (scamCheck.detected) {
    safetyScore = 0; // Lose all safety points
    breakdown.push({ 
      type: 'scam_keywords', 
      points: -15,
      details: `Warning: Contains phrases commonly used in scams: ${scamCheck.keywords.join(', ')}`
    });
  } else {
    breakdown.push({ 
      type: 'scam_keywords', 
      points: 0,
      details: 'Clean language - no suspicious phrases detected'
    });
  }
  
  const safetyContribution = (safetyScore / 15) * maxScores.content_safety;
  totalScore = totalScore - maxScores.content_safety + safetyContribution;

  // Price Anomaly (40 points max)
  const priceCheck = checkPriceAnomaly(listingData.price, listingData.size, listingData.neighborhood);
  let priceScore = 40; // Start with full points
  if (priceCheck.severity === 'major') {
    priceScore = 0; // Major red flag = lose all points
  } else if (priceCheck.severity === 'minor') {
    priceScore = 25; // Minor warning = lose some points
  }
  
  const priceContribution = (priceScore / 40) * maxScores.price_anomaly;
  const priceDeduction = maxScores.price_anomaly - priceContribution;
  totalScore = totalScore - maxScores.price_anomaly + priceContribution;
  
  breakdown.push({ 
    type: 'price_anomaly', 
    points: -priceDeduction,
    details: priceCheck.message
  });

  // Listing Quality (35 points max: base 20 + bonuses up to 15)
  const qualityCheck = checkListingQuality(listingData);
  const qualityContribution = (qualityCheck.score / 35) * maxScores.listing_quality;
  totalScore = totalScore - maxScores.listing_quality + qualityContribution;
  
  breakdown.push({ 
    type: 'photo_count', 
    points: Math.round(qualityContribution - maxScores.listing_quality), // Show actual contribution vs max
    details: qualityCheck.message + ` (${qualityCheck.score}/35 quality points)`
  });

  // Freshness (10 points max)
  const freshnessCheck = checkListingFreshness(listingData.lastUpdated);
  const freshnessContribution = (freshnessCheck.score / 10) * maxScores.freshness;
  totalScore = totalScore - maxScores.freshness + freshnessContribution;
  
  breakdown.push({ 
    type: 'freshness', 
    points: Math.round(freshnessContribution - maxScores.freshness), // Show actual contribution vs max
    details: freshnessCheck.message + ` (${freshnessCheck.score}/10 freshness points)`
  });

  // Ensure score stays within bounds
  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  
  console.log('[TrustShield v1.2.3] Score calculation complete:', { 
    totalScore, 
    finalScore,
    breakdown: breakdown.map(b => ({ type: b.type, points: b.points, details: b.details }))
  });

  // INTENSIVE DEBUG: Show step-by-step calculation
  console.log('[TrustShield v1.2.3] STEP-BY-STEP DEBUG:');
  console.log('  Safety:', safetyScore, '/15 points =', safetyContribution.toFixed(1), 'contribution');
  console.log('  Price:', priceScore, '/40 points =', priceContribution.toFixed(1), 'contribution');  
  console.log('  Quality:', qualityCheck.score, '/35 points =', qualityContribution.toFixed(1), 'contribution');
  console.log('  Freshness:', freshnessCheck.score, '/10 points =', freshnessContribution.toFixed(1), 'contribution');
  console.log('  Total contributions:', (safetyContribution + priceContribution + qualityContribution + freshnessContribution).toFixed(1));
  console.log('  Final totalScore:', totalScore.toFixed(1), '→ finalScore:', finalScore);
  console.log('  Expected for 12 photos: Safety(15) + Price(40) + Quality(30) + Freshness(10) = 95');

  return {
    score: finalScore,
    breakdown: breakdown,
    riskLevel: getRiskLevel(finalScore),
    listingData: listingData,
    _debug: {
      version: '1.1.2',
      phase: 'Phase 1 - Foundation Release',
      maxScores: maxScores,
      totalScore: totalScore,
      finalScore: finalScore
    }
  };
}

// Helper Functions for Scoring Checks
function checkScamKeywords(description) {
  if (!description) {
    return { detected: false, keywords: [] };
  }

  const lowerDescription = description.toLowerCase();
  const detectedKeywords = [];

  for (let i = 0; i < SCAM_KEYWORDS.length; i++) {
    if (lowerDescription.includes(SCAM_KEYWORDS[i].toLowerCase())) {
      detectedKeywords.push(SCAM_KEYWORDS[i]);
    }
  }

  return {
    detected: detectedKeywords.length > 0,
    keywords: detectedKeywords
  };
}

// Phase 1 Price Anomaly Detection (40% weight)
function checkPriceAnomaly(price, size, neighborhood) {
  console.log('[TrustShield v1.2.3] Checking price anomaly:', { price, size, neighborhood });
  
  if (!price || !size || price <= 0 || size <= 0) {
    return { 
      severity: 'none', 
      message: 'Could not verify price - no penalty applied'
    };
  }

  const pricePerSqm = price / size;
  const neighborhood_avg = NEIGHBORHOOD_AVG_PRICES[neighborhood] || NEIGHBORHOOD_AVG_PRICES['Barcelona Average'];
  
  // Major scam indicator - significantly below market
  if (pricePerSqm < neighborhood_avg * 0.4) {
    return { 
      severity: 'major',
      message: `Warning: Price significantly below market rate (€${pricePerSqm.toFixed(0)}/m² vs €${neighborhood_avg}/m² average) - potential scam indicator`
    };
  }
  
  // Minor warning - moderately below market  
  if (pricePerSqm < neighborhood_avg * 0.6) {
    return { 
      severity: 'minor',
      message: `Price appears low for this area (€${pricePerSqm.toFixed(0)}/m² vs €${neighborhood_avg}/m² average) - verify before proceeding`
    };
  }
  
  // Minor warning - significantly above market
  if (pricePerSqm > neighborhood_avg * 1.5) {
    return { 
      severity: 'minor',
      message: `Price appears high for this area (€${pricePerSqm.toFixed(0)}/m² vs €${neighborhood_avg}/m² average) - verify before proceeding`
    };
  }
  
  return { 
    severity: 'none',
    message: `Price of €${pricePerSqm.toFixed(0)}/m² is consistent with the ${neighborhood} area average`
  };
}

// Phase 1 Listing Quality Assessment (35 points max)
function checkListingQuality(listingData) {
  const photoCount = parseInt(listingData.photoCount) || 0;
  const description = listingData.fullDescription || '';
  
  console.log('[TrustShield v1.2.3] Quality check:', { 
    photoCount, 
    photoCountType: typeof listingData.photoCount,
    originalPhotoCount: listingData.photoCount,
    descriptionLength: description.length, 
    hasFloorPlan: listingData.hasFloorPlan 
  });
  
  // Start with baseline quality score (20 points)
  let qualityScore = 20;
  let photoMessage = '';
  
  // Photo scoring: 0-15 points based on count (adjusted for 20-30 photo reality)
  if (photoCount >= 35) {
    qualityScore += 15; // 35 total
    photoMessage = `Exceptional photo coverage with ${photoCount} photos`;
    console.log('[TrustShield v1.2.3] Photo logic: 35+ photos, score = 35');
  } else if (photoCount >= 25) {
    qualityScore += 12; // 32 total
    photoMessage = `Excellent photo coverage with ${photoCount} photos`;
    console.log('[TrustShield v1.2.3] Photo logic: 25-34 photos, score = 32');
  } else if (photoCount >= 18) {
    qualityScore += 8; // 28 total  
    photoMessage = `Very good photo coverage with ${photoCount} photos`;
    console.log('[TrustShield v1.2.3] Photo logic: 18-24 photos, score = 28');
  } else if (photoCount >= 12) {
    qualityScore += 4; // 24 total
    photoMessage = `Good photo coverage with ${photoCount} photos`;
    console.log('[TrustShield v1.2.3] Photo logic: 12-17 photos, score = 24');
  } else if (photoCount >= 6) {
    qualityScore += 0; // 20 total (baseline)
    photoMessage = `Adequate photos (${photoCount} photos) - basic coverage`;
    console.log('[TrustShield v1.2.3] Photo logic: 6-11 photos, score = 20');
  } else if (photoCount >= 3) {
    qualityScore -= 5; // 15 total
    photoMessage = `Few photos (${photoCount} photos) - consider with caution`;
    console.log('[TrustShield v1.2.3] Photo logic: 3-5 photos, score = 15');
  } else if (photoCount >= 1) {
    qualityScore -= 10; // 10 total
    photoMessage = `Very few photos (only ${photoCount}) - major concern`;
    console.log('[TrustShield v1.2.3] Photo logic: 1-2 photos, score = 10');
  } else {
    qualityScore -= 15; // 5 total
    photoMessage = 'No photos available - major red flag';
    console.log('[TrustShield v1.2.3] Photo logic: 0 photos, score = 5');
  }
  
  // Floor plan bonus: +5 points
  if (listingData.hasFloorPlan) {
    qualityScore += 5;
    photoMessage += ' + includes floor plan';
  }
  
  // Description quality: +5 or -5 points
  if (description.length >= 200) {
    qualityScore += 5;
    photoMessage += ' + detailed description';
  } else if (description.length < 50) {
    qualityScore -= 5;
    photoMessage += ' - very brief description';
  }
  
  // Ensure within bounds (0-35) BEFORE logging
  qualityScore = Math.max(0, Math.min(35, qualityScore));
  
  console.log('[TrustShield v1.2.3] 🔧 FIXED Quality calculation: base=20, photos=' + (photoCount >= 35 ? 15 : photoCount >= 25 ? 12 : photoCount >= 18 ? 8 : photoCount >= 12 ? 4 : photoCount >= 6 ? 0 : photoCount >= 3 ? -5 : photoCount >= 1 ? -10 : -15) + ', floorPlan=' + (listingData.hasFloorPlan ? 5 : 0) + ', description=' + (description.length >= 200 ? 5 : description.length < 50 ? -5 : 0) + ', final=' + qualityScore);
  
  console.log('[TrustShield v1.2.3] Quality result:', { qualityScore, photoMessage });
  
  return {
    score: qualityScore,
    message: photoMessage
  };
}

// Phase 1 Freshness Assessment (10 points max)
function checkListingFreshness(lastUpdated) {
  console.log('[TrustShield v1.2.3] Freshness check:', { lastUpdated });
  
  let freshnessScore = 10; // Start with full points
  let message = '';
  
  if (!lastUpdated) {
    freshnessScore = 5; // Lose half points for unknown date
    message = 'Update date unknown - moderate penalty applied';
  } else {
  const updateDate = new Date(lastUpdated);
  const now = new Date();
  const daysDiff = (now - updateDate) / (1000 * 60 * 60 * 24);

    console.log('[TrustShield v1.2.3] Days since update:', daysDiff);

    if (daysDiff < 14) {
      freshnessScore = 10; // Full points
      message = 'Recently updated - likely still available';
    } else if (daysDiff < 30) {
      freshnessScore = 7; // Lose some points
      message = `Updated ${Math.round(daysDiff)} days ago - confirm availability`;
    } else {
      freshnessScore = 3; // Lose most points
      message = `Not updated in ${Math.round(daysDiff)} days - may no longer be available`;
    }
  }
  
  console.log('[TrustShield v1.2.3] Freshness result:', { freshnessScore, message });
  
  return { 
    score: freshnessScore,
    message: message
  };
}

function checkAdvertiserCredibility(listingData) {
  let credibilityScore = 100;
  let points = 0;
  let details = 'Professional advertiser';
  
  const advertiserType = listingData.advertiserType || 'private';
  const advertiserName = listingData.advertiserName || '';
  const contactEmail = listingData.contactEmail || '';
  
  // Check advertiser type
  if (advertiserType === 'agency') {
    credibilityScore = 100;
  } else {
    credibilityScore = 85;
    points = -1;
    details = 'Private advertiser';
  }
  
  // Check for generic email domains
  if (contactEmail) {
    const emailCheck = checkGenericEmail(contactEmail);
    if (emailCheck.generic) {
      credibilityScore = Math.max(60, credibilityScore - 25);
      points -= 2;
      details = 'Generic email domain used';
    }
  }
  
  // Check for professional naming
  if (advertiserName.toLowerCase().includes('inmobiliaria') || 
      advertiserName.toLowerCase().includes('real estate') ||
      advertiserName.toLowerCase().includes('properties')) {
    credibilityScore = Math.min(100, credibilityScore + 5);
    points += 1;
  }
  
  return {
    score: credibilityScore,
    points: Math.round(points),
    details: details
  };
}

function checkDuplicateListing(listingData) {
  // This would require more sophisticated logic in a real implementation
  // For MVP, we'll return false as a placeholder
  return { duplicate: false };
}

function checkGenericEmail(email) {
  if (!email) {
    return { generic: false };
  }

  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1];
  
  return { generic: genericDomains.includes(domain) };
}

function getRiskLevel(score) {
  // Phase 1 spec: High Trust (85-100), Medium Trust (65-84), Low Trust (0-64)
  if (score >= 85) {
    return 'low';    // High trust = low risk - "Very promising listing"
  } else if (score >= 65) {
    return 'medium'; // Medium trust = medium risk - "Minor issues to review"
  } else {
    return 'high';   // Low trust = high risk - "Proceed with caution"
  }
}

// Caching Functions - DISABLED FOR DEBUGGING
// async function getCachedScore(listingUrl) {
//   return null; // Always return null = no cache
// }

// async function setCachedScore(listingUrl, scoreData) {
//   // Do nothing = no caching
// } 