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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getListingScore') {
    handleListingScoreRequest(request.listingId, request.listingUrl, sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Main Handler for Listing Score Requests
async function handleListingScoreRequest(listingId, listingUrl, sendResponse) {
  try {
    // Check cache first
    const cachedScore = await getCachedScore(listingUrl);
    if (cachedScore) {
      sendResponse({ success: true, data: cachedScore });
      return;
    }

    // Fetch fresh data
    const listingData = await fetchListingData(listingId, listingUrl);
    if (!listingData) {
      sendResponse({ success: false, error: 'Failed to fetch listing data' });
      return;
    }

    // Calculate score
    const score = calculateScore(listingData);
    
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
  try {
    // Primary Strategy: Try JSON endpoint first
    const jsonData = await fetchJsonData(listingId);
    if (jsonData) {
      return parseJsonData(jsonData, listingUrl);
    }
  } catch (error) {
    console.warn('JSON endpoint failed, trying HTML fallback:', error);
  }

  try {
    // Contingency Plan: Fetch and parse HTML
    const htmlData = await fetchHtmlData(listingUrl);
    if (htmlData) {
      return parseHtmlData(htmlData, listingUrl);
    }
  } catch (error) {
    console.error('HTML fallback also failed:', error);
  }

  return null;
}

// Primary Strategy: Fetch JSON Data
async function fetchJsonData(listingId) {
  const url = `https://www.idealista.com/detail/${listingId}/datalayer`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('JSON fetch failed:', error);
  }

  return null;
}

// Contingency Plan: Fetch HTML Data
async function fetchHtmlData(listingUrl) {
  try {
    const response = await fetch(listingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn('HTML fetch failed:', error);
  }

  return null;
}

// Parse JSON Data into ListingData Object
function parseJsonData(jsonData, listingUrl) {
  try {
    const data = jsonData.data || jsonData;
    
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
      advertiserType: data.advertiserType || 'private',
      advertiserName: data.advertiserName || data.agency || '',
      contactEmail: data.contactEmail || data.email || null
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
    
    // Extract data using DOM selectors
    const priceElement = doc.querySelector('[data-testid="price"]') || 
                        doc.querySelector('.info-data-price') ||
                        doc.querySelector('.price');
    
    const descriptionElement = doc.querySelector('[data-testid="description"]') ||
                              doc.querySelector('.comment') ||
                              doc.querySelector('.description');
    
    const sizeElement = doc.querySelector('[data-testid="size"]') ||
                       doc.querySelector('.info-feature-size') ||
                       doc.querySelector('.size');
    
    const neighborhoodElement = doc.querySelector('[data-testid="neighborhood"]') ||
                               doc.querySelector('.main-info__title-minor') ||
                               doc.querySelector('.location');
    
    const photoElements = doc.querySelectorAll('[data-testid="photo"]') ||
                         doc.querySelectorAll('.gallery-container img') ||
                         doc.querySelectorAll('.photos img');
    
    const floorPlanElement = doc.querySelector('[data-testid="floor-plan"]') ||
                            doc.querySelector('.icon-plan') ||
                            doc.querySelector('.floor-plan');
    
    const advertiserElement = doc.querySelector('[data-testid="advertiser"]') ||
                             doc.querySelector('.professional-name') ||
                             doc.querySelector('.advertiser');
    
    return {
      id: extractIdFromUrl(listingUrl),
      url: listingUrl,
      fullDescription: descriptionElement ? descriptionElement.textContent.trim() : '',
      price: priceElement ? parseFloat(priceElement.textContent.replace(/[^\d]/g, '')) : 0,
      size: sizeElement ? parseFloat(sizeElement.textContent.replace(/[^\d]/g, '')) : 0,
      neighborhood: neighborhoodElement ? neighborhoodElement.textContent.trim() : '',
      photoCount: photoElements ? photoElements.length : 0,
      hasFloorPlan: Boolean(floorPlanElement),
      lastUpdated: new Date().toISOString(), // Default to current time
      advertiserType: advertiserElement ? 'agency' : 'private',
      advertiserName: advertiserElement ? advertiserElement.textContent.trim() : '',
      contactEmail: null // Not easily extractable from HTML
    };
  } catch (error) {
    console.error('Error parsing HTML data:', error);
    return null;
  }
}

// Extract ID from URL
function extractIdFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : '';
}

// Main Scoring Algorithm
function calculateScore(listingData) {
  let score = 100; // Base score
  const breakdown = [];

  // High Impact Checks
  const scamCheck = checkScamKeywords(listingData.fullDescription);
  if (scamCheck.detected) {
    score -= 40;
    breakdown.push({ type: 'scam_keywords', points: -40, details: scamCheck.keywords });
  }

  const priceCheck = checkPriceAnomaly(listingData.price, listingData.size, listingData.neighborhood);
  if (priceCheck.anomaly) {
    score -= 30;
    breakdown.push({ type: 'price_anomaly', points: -30, details: priceCheck.reason });
  }

  // Medium Impact Checks
  const floorPlanCheck = checkFloorPlan(listingData.hasFloorPlan);
  if (floorPlanCheck.bonus) {
    score += 10;
    breakdown.push({ type: 'floor_plan', points: 10, details: 'Has floor plan' });
  } else {
    score -= 10;
    breakdown.push({ type: 'floor_plan', points: -10, details: 'No floor plan' });
  }

  const photoCheck = checkPhotoCount(listingData.photoCount);
  if (photoCheck.bonus) {
    score += 10;
    breakdown.push({ type: 'photo_count', points: 10, details: 'Many photos (' + listingData.photoCount + ')' });
  } else if (photoCheck.penalty) {
    score -= 15;
    breakdown.push({ type: 'photo_count', points: -15, details: 'Few photos (' + listingData.photoCount + ')' });
  }

  const freshnessCheck = checkListingFreshness(listingData.lastUpdated);
  if (freshnessCheck.bonus) {
    score += 5;
    breakdown.push({ type: 'freshness', points: 5, details: 'Recently updated' });
  } else if (freshnessCheck.penalty) {
    score -= 10;
    breakdown.push({ type: 'freshness', points: -10, details: 'Old listing' });
  }

  // Low Impact Checks
  const duplicateCheck = checkDuplicateListing(listingData);
  if (duplicateCheck.duplicate) {
    score -= 15;
    breakdown.push({ type: 'duplicate', points: -15, details: 'Potential duplicate' });
  }

  const emailCheck = checkGenericEmail(listingData.contactEmail);
  if (emailCheck.generic) {
    score -= 5;
    breakdown.push({ type: 'generic_email', points: -5, details: 'Generic email domain' });
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    breakdown: breakdown,
    riskLevel: getRiskLevel(score),
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

function checkFloorPlan(hasFloorPlan) {
  return { bonus: hasFloorPlan };
}

function checkPhotoCount(photoCount) {
  if (photoCount > 20) {
    return { bonus: true, penalty: false };
  } else if (photoCount < 5) {
    return { bonus: false, penalty: true };
  }
  return { bonus: false, penalty: false };
}

function checkListingFreshness(lastUpdated) {
  if (!lastUpdated) {
    return { bonus: false, penalty: false };
  }

  const updateDate = new Date(lastUpdated);
  const now = new Date();
  const daysDiff = (now - updateDate) / (1000 * 60 * 60 * 24);

  if (daysDiff < 7) {
    return { bonus: true, penalty: false };
  } else if (daysDiff > 30) {
    return { bonus: false, penalty: true };
  }

  return { bonus: false, penalty: false };
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
  if (score >= 80) {
    return 'low';
  } else if (score >= 60) {
    return 'medium';
  } else {
    return 'high';
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