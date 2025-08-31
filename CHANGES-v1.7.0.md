# Idealista Trust Shield v1.7.0 - Stable Release Changes

## Overview
This version simplifies the extension by removing complex accordion functionality and focusing on core trust scoring features. It also adds rental-only filtering to prevent the extension from running on sale property pages.

## Changes Implemented

### 1. Fixed Trust Badge Z-Index Issue
- **Problem**: Trust badge appeared above full-screen gallery (z-index: 100)
- **Solution**: Changed z-index from 100 to 10 so it appears below gallery
- **File**: `src/content.js` - Line ~598
- **Change**: `z-index: 10 !important;`

### 2. Fixed Badge Scaling and Dimensions
- **Problem**: Badge container was 64px tall but inner pill was only 36px, causing visual mismatch
- **Solution**: Updated responsive sizing to ensure inner pill scales properly to fill container
- **File**: `src/content.js` - Lines ~610-680
- **Changes**:
  - Added `iconSize` variable for responsive icon sizing
  - Added inner pill styling updates to match container dimensions
  - Inner pill now uses `calc(100% - 16px)` for width/height
  - Icon sizes scale with breakpoints (28px desktop, 22px tablet, 18px mobile)

### 3. Added Rental-Only Filtering
- **Problem**: Extension was running on both rental and sale property pages
- **Solution**: Added URL check to filter out sale properties
- **Files**: 
  - `src/content.js` - Lines ~30, ~40, ~2280
  - `extension/manifest.json` - Removed sale-related URLs
- **Changes**:
  - Modified `detectPageType()` to exclude sale pages
  - Added `isRentalPage()` function to check for rental URLs
  - Added rental check in initialization to skip sale pages
  - Removed sale URLs from manifest.json content script matches
  - Only `/alquiler-viviendas/` and `/point/alquiler-viviendas/` URLs are processed

### 4. Removed Accordion Functionality
- **Problem**: Complex accordion behavior was causing UI issues and maintenance overhead
- **Solution**: Simplified to static rows showing only title and summary
- **File**: `src/content.js` - Lines ~1370-1510
- **Changes**:
  - Removed `expandedItem` tracking variable
  - Replaced accordion items with simple row items
  - Removed click handlers, hover effects, and keyboard navigation
  - Removed expanded content sections
  - Removed `createChevronIcon()` function
  - Removed `getExplanationText()` function
  - Removed all accordion-related CSS and animations
  - Simplified to show only status icon, title, and summary text

### 5. Version Updates
- **Files Updated**:
  - `extension/manifest.json`: 1.6.2 → 1.7.0
  - `package.json`: 1.0.2 → 1.7.0
  - `extension/service-worker.js`: Updated console logs to v1.7.0
  - `src/content.js`: Updated console logs to v1.7.0

## Technical Details

### Badge Scaling Implementation
The responsive badge sizing now properly scales both the container and inner pill:
```javascript
// Container gets responsive dimensions
container.style.cssText = `
  height: ${height} !important;
  min-width: ${minWidth} !important;
  padding: ${padding} !important;
  // ... other styles
`;

// Inner pill scales to fill container
const innerPill = container.querySelector('.trust-shield-root');
if (innerPill) {
  innerPill.style.cssText = `
    min-width: calc(100% - 16px) !important;
    height: calc(100% - 16px) !important;
    // ... other styles
  `;
}
```

### Rental Filtering Logic
```javascript
function isRentalPage() {
  const url = window.location.href;
  return url.includes('/alquiler-viviendas/') || url.includes('/point/alquiler-viviendas/');
}

// In initialization
if (pageType === 'search' && !isRentalPage()) {
  console.log('Sale page detected, skipping trust shield injection');
  return;
}
```

## Benefits of These Changes

1. **Better UX**: Trust badge no longer blocks full-screen gallery view
2. **Visual Consistency**: Badge pill now properly fills its container at all breakpoints
3. **Focused Functionality**: Extension only runs on rental properties where it's most useful
4. **Simplified Maintenance**: Removed complex accordion logic and related bugs
5. **Cleaner UI**: Analysis breakdown shows essential information without unnecessary complexity

## Build Instructions

Due to a Parcel build issue (memory corruption), manual building may be required:

1. Ensure all source files are saved
2. Try `npm run build` or `npx parcel build src/content.js --dist-dir extension/dist`
3. If build fails, the source changes are complete and ready for manual compilation

## Testing Checklist

- [ ] Trust badge appears below full-screen gallery (z-index: 10)
- [ ] Badge scales properly at all breakpoints (desktop/tablet/mobile)
- [ ] Extension only runs on rental property pages
- [ ] Extension skips sale property pages
- [ ] Analysis dialog shows simple rows without accordion behavior
- [ ] No console errors related to removed accordion functions
