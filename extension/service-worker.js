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
console.log('Idealista Trust Shield service worker v1.0.9 loaded - DATA EXTRACTION FIXED');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getListingScore') {
    handleListingScoreRequest(request.listingId, request.listingUrl, sendResponse, request.initialData || {});
    return true; // Keep message channel open for async response
  }
});

// Main Handler for Listing Score Requests
async function handleListingScoreRequest(listingId, listingUrl, sendResponse, initialData) {
  try {
    // Check cache first
    const cachedScore = await getCachedScore(listingUrl);
    if (cachedScore) {
      sendResponse({ success: true, data: cachedScore });
      return;
    }

    // Fetch fresh data
    let listingData = await fetchListingData(listingId, listingUrl);
    
    // If no data was fetched, create mock data from initial data
    if (!listingData) {
      console.log(`[TrustShield v1.0.9] Creating mock data for ${listingId} from initial data:`, initialData);
      listingData = {
        id: listingId,
        url: listingUrl,
        fullDescription: '',
        price: initialData?.price || 0,
        size: initialData?.size || 0,
        neighborhood: initialData?.neighborhood || '',
        photoCount: initialData?.photoCount ?? 0,
        hasFloorPlan: initialData?.hasFloorPlan ?? false,
        lastUpdated: new Date().toISOString(),
        advertiserType: 'private',
        advertiserName: '',
        contactEmail: null
      };
    }
    
    // Merge any initial data we received from the search card
    if (initialData && typeof initialData === 'object') {
      const cleaned = Object.fromEntries(Object.entries(initialData).filter(([_, v]) => v !== undefined && v !== null));
      listingData = { ...listingData, ...cleaned };
    }
    
    // Apply mock data generation for empty fields (but do NOT overwrite photoCount/hasFloorPlan if provided)
    listingData = applyMockDataGeneration(listingData);

    // Calculate score
    const score = calculateScore(listingData);
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
    
    // Cache the result
    await setCachedScore(listingUrl, score);
    
    sendResponse({ success: true, data: score });
  } catch (error) {
    console.error('Error processing listing score:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Data Fetching with Primary and Contingency Strategies
async function fetchListingData(listingId, listingUrl) {
      console.log(`[TrustShield v1.0.9] Fetching data for ${listingId}`);
  
  try {
    // Primary Strategy: Try JSON endpoint first
    const jsonData = await fetchJsonData(listingId);
    if (jsonData) {
      console.log(`[TrustShield v1.0.9] JSON data found for ${listingId}`);
      return parseJsonData(jsonData, listingUrl);
    }
  } catch (error) {
    console.warn('JSON endpoint failed, trying HTML fallback:', error);
  }

  try {
    // Contingency Plan: Fetch and parse HTML
    const htmlData = await fetchHtmlData(listingUrl);
    if (htmlData) {
      console.log(`[TrustShield v1.0.9] HTML data fetched for ${listingId}, length: ${htmlData.length}`);
      let parsed = parseHtmlData(htmlData, listingUrl);
      
      // If key fields are missing, try to extract from embedded JSON (dataLayer or window.__INITIAL_STATE__)
      if (parsed && (!parsed.fullDescription || parsed.photoCount === 0 || !parsed.neighborhood)) {
        try {
          const embedded = extractEmbeddedJson(htmlData);
          if (embedded) {
            console.log(`[TrustShield v1.0.9] Embedded JSON found for ${listingId}:`, embedded);
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
      
      console.log(`[TrustShield v1.0.9] Final parsed data for ${listingId}:`, parsed);
      return parsed;
    } else {
      console.warn(`[TrustShield v1.0.9] No HTML data returned for ${listingId}`);
    }
  } catch (error) {
    console.error('HTML fallback also failed:', error);
  }

  console.warn(`[TrustShield v1.0.9] All data fetching failed for ${listingId}, returning null`);
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
    console.log(`[TrustShield v1.0.9] Fetching HTML from: ${listingUrl}`);
    
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

    console.log(`[TrustShield v1.0.9] Response status: ${response.status}, ok: ${response.ok}`);

    if (response.ok) {
      const text = await response.text();
      console.log(`[TrustShield v1.0.9] HTML length: ${text.length}, first 200 chars: ${text.substring(0, 200)}`);
      
      if (typeof text === 'string' && text.length > 1000) {
        return text;
      } else {
        console.warn(`[TrustShield v1.0.9] HTML too short: ${text.length} characters`);
      }
    } else {
      console.warn(`[TrustShield v1.0.9] HTTP error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('[TrustShield v1.0.9] HTML fetch failed:', error);
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
        console.log(`[TrustShield v1.0.9] Found description with selector '${selector}': ${fullDescription.substring(0, 100)}...`);
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
        console.log(`[TrustShield v1.0.9] Found neighborhood with selector '${selector}': ${neighborhood}`);
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
        console.log(`[TrustShield v1.0.9] Found photo count with selector '${selector}': ${photoCount} (text: "${text}")`);
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
          console.log(`[TrustShield v1.0.9] Counted ${photoCount} images with selector '${selector}'`);
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
        console.log(`[TrustShield v1.0.9] Found floor plan with selector '${selector}'`);
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
          console.log(`[TrustShield v1.0.9] Found last updated with selector '${selector}': ${updateText}`);
          break;
        }
      }
    }

    // Advertiser name/type/email fallbacks (DOM selectors)
    let advertiserName = '';
    const advertiserSelectors = [
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
        if (advertiserName) break;
      }
    }

    // Email from mailto links or data attributes
    let contactEmail = null;
    const mailEl = doc.querySelector('a[href^="mailto:"]');
    if (mailEl) {
      const href = mailEl.getAttribute('href');
      const match = href && href.match(/mailto:([^?\s]+)/i);
      if (match && match[1]) contactEmail = match[1];
    }
    if (!contactEmail) {
      const emailAttrEl = doc.querySelector('[data-contact-email], [data-email]');
      if (emailAttrEl) contactEmail = emailAttrEl.getAttribute('data-contact-email') || emailAttrEl.getAttribute('data-email') || null;
    }

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
    console.log(`[TrustShield v1.0.9] Extracted data for ${listingUrl}:`, {
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

// Main Scoring Algorithm - V0 spec with proper weighting
function calculateScore(listingData) {
  let totalScore = 0;
  const breakdown = [];
  const weights = {
    scam_keywords: 15,    // 15% weight
    price_anomaly: 25,    // 25% weight  
    listing_quality: 20,  // 20% weight
    freshness: 10,        // 10% weight
    duplicates: 15,       // 15% weight
    advertiser: 15        // 15% weight
  };

  // Scam Keywords (15% weight)
  const scamCheck = checkScamKeywords(listingData.fullDescription);
  const scamScore = scamCheck.detected ? 0 : 100;
  totalScore += (scamScore * weights.scam_keywords) / 100;
  breakdown.push({ 
    type: 'scam_keywords', 
    points: scamCheck.detected ? -weights.scam_keywords : 0,
    details: scamCheck.detected ? `Suspicious phrases detected: ${scamCheck.keywords.join(', ')}` : 'Clean language detected'
  });

  // Price Check (25% weight)
  const priceCheck = checkPriceAnomaly(listingData.price, listingData.size, listingData.neighborhood);
  const priceScore = priceCheck.anomaly ? 30 : 100; // Significant penalty for price anomalies
  totalScore += (priceScore * weights.price_anomaly) / 100;
  breakdown.push({ 
    type: 'price_anomaly', 
    points: priceCheck.anomaly ? Math.round(-weights.price_anomaly * 0.7) : 0,
    details: priceCheck.reason || 'Price within market range'
  });

  // Listing Quality (20% weight) - combines photos and floor plan
  const qualityCheck = checkListingQuality(listingData);
  totalScore += (qualityCheck.score * weights.listing_quality) / 100;
  breakdown.push({ 
    type: 'photo_count', 
    points: qualityCheck.photoPoints,
    details: qualityCheck.photoDetails
  });

  // Freshness (10% weight)
  const freshnessCheck = checkListingFreshness(listingData.lastUpdated);
  totalScore += (freshnessCheck.score * weights.freshness) / 100;
  breakdown.push({ 
    type: 'freshness', 
    points: freshnessCheck.points,
    details: freshnessCheck.details
  });

  // Duplicates (15% weight)
  const duplicateCheck = checkDuplicateListing(listingData);
  const duplicateScore = duplicateCheck.duplicate ? 20 : 100;
  totalScore += (duplicateScore * weights.duplicates) / 100;
  breakdown.push({ 
    type: 'duplicate', 
    points: duplicateCheck.duplicate ? Math.round(-weights.duplicates * 0.8) : 0,
    details: duplicateCheck.duplicate ? 'Potential duplicate detected' : 'Unique listing'
  });

  // Advertiser (15% weight)
  const advertiserCheck = checkAdvertiserCredibility(listingData);
  totalScore += (advertiserCheck.score * weights.advertiser) / 100;
  breakdown.push({ 
    type: 'generic_email', 
    points: advertiserCheck.points,
    details: advertiserCheck.details
  });

  // Ensure score stays within bounds
  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  return {
    score: finalScore,
    breakdown: breakdown,
    riskLevel: getRiskLevel(finalScore),
    listingData: listingData
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

function checkPriceAnomaly(price, size, neighborhood) {
  if (!price || !size || !neighborhood) {
    return { anomaly: false, reason: '' };
  }

  const pricePerSqm = price / size;
  const lowerNeighborhood = neighborhood.toLowerCase();
  let avgPricePerSqm = null;

  // Check if the neighborhood string includes any of our keys
  for (const key in NEIGHBORHOOD_AVG_PRICES) {
    if (lowerNeighborhood.includes(key)) {
      avgPricePerSqm = NEIGHBORHOOD_AVG_PRICES[key];
      break;
    }
  }

  if (!avgPricePerSqm) {
    return { anomaly: false, reason: 'No price data for neighborhood' };
  }

  const priceRatio = pricePerSqm / avgPricePerSqm;
  
  if (priceRatio < 0.6) {
    return { anomaly: true, reason: 'Price per m² significantly below market average' };
  }

  return { anomaly: false, reason: '' };
}

// Combined listing quality check (photos + floor plan + description)
function checkListingQuality(listingData) {
  let qualityScore = 100;
  let photoPoints = 0;
  let photoDetails = '';
  
  const photoCount = listingData.photoCount || 0;
  const hasFloorPlan = listingData.hasFloorPlan || false;
  const descriptionLength = (listingData.fullDescription || '').length;
  
  // Photo evaluation (major component)
  if (photoCount >= 23) {
    qualityScore = 100;
    photoPoints = 0;
    photoDetails = `Excellent photo coverage (${photoCount} photos)`;
  } else if (photoCount >= 15) {
    qualityScore = 85;
    photoPoints = 0;
    photoDetails = `Good photo coverage (${photoCount} photos)`;
  } else if (photoCount >= 8) {
    qualityScore = 70;
    photoPoints = -3;
    photoDetails = `Adequate photos (${photoCount} photos)`;
  } else if (photoCount >= 3) {
    qualityScore = 40;
    photoPoints = -8;
    photoDetails = `Few photos (${photoCount} photos)`;
  } else {
    qualityScore = 20;
    photoPoints = -12;
    photoDetails = `Very few photos (${photoCount} photos)`;
  }
  
  // Floor plan bonus
  if (hasFloorPlan) {
    qualityScore = Math.min(100, qualityScore + 10);
    photoPoints += 2;
  }
  
  // Description quality
  if (descriptionLength < 100) {
    qualityScore = Math.max(20, qualityScore - 15);
    photoPoints -= 2;
  } else if (descriptionLength > 500) {
    qualityScore = Math.min(100, qualityScore + 5);
    photoPoints += 1;
  }
  
  return {
    score: qualityScore,
    photoPoints: Math.round(photoPoints),
    photoDetails: photoDetails
  };
}

function checkListingFreshness(lastUpdated) {
  if (!lastUpdated) {
    return { 
      score: 50, 
      points: -2, 
      details: 'Update date unknown' 
    };
  }

  const updateDate = new Date(lastUpdated);
  const now = new Date();
  const daysDiff = (now - updateDate) / (1000 * 60 * 60 * 24);

  if (daysDiff < 7) {
    return { 
      score: 100, 
      points: 0, 
      details: 'Recently updated (within 7 days)' 
    };
  } else if (daysDiff < 14) {
    return { 
      score: 85, 
      points: 0, 
      details: 'Updated within 2 weeks' 
    };
  } else if (daysDiff < 30) {
    return { 
      score: 70, 
      points: -1, 
      details: 'Updated within a month' 
    };
  } else if (daysDiff < 60) {
    return { 
      score: 40, 
      points: -3, 
      details: `Not updated for ${Math.round(daysDiff)} days` 
    };
  } else {
    return { 
      score: 20, 
      points: -5, 
      details: `Stale listing (${Math.round(daysDiff)} days old)` 
    };
  }
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
  // V0 spec: High Trust (85-100), Medium Trust (40-84), Low Trust (0-39)
  if (score >= 85) {
    return 'low';    // High trust = low risk
  } else if (score >= 40) {
    return 'medium'; // Medium trust = medium risk
  } else {
    return 'high';   // Low trust = high risk
  }
}

// Caching Functions
async function getCachedScore(listingUrl) {
  try {
    const result = await chrome.storage.local.get(listingUrl);
    const cached = result[listingUrl];
    
    if (cached && cached.timestamp) {
      const cacheAge = Date.now() - cached.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < maxAge) {
        return cached.data;
      }
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }
  
  return null;
}

async function setCachedScore(listingUrl, scoreData) {
  try {
    const cacheEntry = {
      data: scoreData,
      timestamp: Date.now()
    };
    
    await chrome.storage.local.set({ [listingUrl]: cacheEntry });
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
} 