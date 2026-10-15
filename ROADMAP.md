# Meme Mirror - Continuous Improvement Roadmap

This roadmap tracks prioritized improvements for the Meme Mirror project. Items are ordered by impact: bugs/broken flows first, then reliability/performance, then usability/polish, then small useful features.

## Priority 1: Bugs and Broken User Flows

### 1. Remove duplicate PDF files from project root
- **Issue**: Two PDF files (`Meme-Mirror-PTM-Visitor-Poster-A3.pdf` and `Meme-Mirror-Setup-and-Operator-Guide.pdf`) exist in the project root as untracked files, while the authoritative copies are in `output/pdf/`
- **Impact**: Confusion about which files are canonical; clutter in project root
- **Effort**: Low (5 minutes)
- **Action**: Delete the two PDF files from the root directory

### 2. Add localStorage quota exceeded handling for reference pack export
- **Issue**: If localStorage is nearly full, reference pack export may fail silently or with unclear error
- **Impact**: Operators may lose custom references without clear warning
- **Effort**: Low (15 minutes)
- **Action**: Add proactive storage quota check before export, with clear warning message

## Priority 2: Reliability and Performance

### 3. Add graceful degradation for WebP support
- **Issue**: Older browsers may not support WebP image format for reference photos
- **Impact**: Reference photo upload could fail on older browsers
- **Effort**: Low (20 minutes)
- **Action**: Detect WebP support and fall back to JPEG if needed

### 4. Improve camera error recovery after permission denial
- **Issue**: After camera permission is denied, user must manually enable in Chrome settings and retry - no clear guidance
- **Impact**: Friction for operators setting up the game
- **Effort**: Low (15 minutes)
- **Action**: Add more specific guidance in error message with link to Chrome's site settings

### 5. Add memory pressure detection for replay buffer
- **Issue**: On low-memory devices, the 38 MiB replay buffer could cause issues
- **Impact**: Potential crashes or slowdowns on constrained devices
- **Effort**: Medium (30 minutes)
- **Action**: Detect available memory and reduce replay buffer size if needed

## Priority 3: Usability and Visual Polish

### 6. Add keyboard navigation support for meme library
- **Issue**: Meme library chooser lacks keyboard navigation (Tab/Arrow keys)
- **Impact**: Poor accessibility for keyboard-only users
- **Effort**: Low (20 minutes)
- **Action**: Add proper focus management and keyboard selection in meme library dialog

### 7. Improve aria-live region announcements for screen readers
- **Issue**: Some state changes (round completion, score updates) may not be announced clearly to screen readers
- **Impact**: Poor accessibility for visually impaired users
- **Effort**: Low (25 minutes)
- **Action**: Add specific aria-live announcements for key game state transitions

### 8. Add visual focus indicator consistency
- **Issue**: Focus indicators exist but could be more visible across all interactive elements
- **Impact**: Better keyboard navigation visibility
- **Effort**: Low (15 minutes)
- **Action**: Review and enhance focus-visible states for all buttons and interactive elements

## Priority 4: Small Useful Features

### 9. Add quick-start preset for exhibition mode
- **Issue**: Operators must manually enable camera and start for each family during exhibition
- **Impact**: Minor friction during repeated use
- **Effort**: Low (20 minutes)
- **Action**: Add a "Quick exhibition mode" checkbox that auto-enables camera on page load (requires manual camera permission first)

### 10. Add session statistics tracking (optional)
- **Issue**: No visibility into how many families have played during a session
- **Impact**: Operators cannot track exhibition participation
- **Effort**: Medium (30 minutes)
- **Action**: Add simple family counter in operator desk, cleared on reset

### 11. Add reference photo preview before analysis
- **Issue**: Operators upload a photo and only see if it's valid after analysis completes
- **Impact**: Wasted time if wrong photo is uploaded
- **Effort**: Low (15 minutes)
- **Action**: Show uploaded photo preview before "Analyse & save reference" button is clicked

---

## Completed Improvements

*This section will be updated as improvements are completed.*
