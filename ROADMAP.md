# Meme Mirror - Continuous Improvement Roadmap

This roadmap tracks prioritized improvements for the Meme Mirror project. Items are ordered by impact: bugs/broken flows first, then reliability/performance, then usability/polish, then small useful features.

## Priority 1: Bugs and Broken User Flows

### 1. ~~Remove duplicate PDF files from project root~~ ✅ COMPLETED
- **Issue**: Two PDF files (`Meme-Mirror-PTM-Visitor-Poster-A3.pdf` and `Meme-Mirror-Setup-and-Operator-Guide.pdf`) exist in the project root as untracked files, while the authoritative copies are in `output/pdf/`
- **Impact**: Confusion about which files are canonical; clutter in project root
- **Effort**: Low (5 minutes)
- **Action**: Delete the two PDF files from the root directory
- **Completed**: Removed duplicate PDFs from project root

### 2. ~~Add error handling for reference pack export~~ ✅ COMPLETED
- **Issue**: Synchronous failures while preparing a reference pack download were not shown to the operator
- **Impact**: Operators may be unable to create a backup without knowing why
- **Effort**: Low (15 minutes)
- **Action**: Catch errors while serializing references and preparing the download, and show the error message
- **Completed**: Added try-catch around download preparation. Export uses in-memory references and does not write to localStorage, so full localStorage does not prevent export. This handler cannot detect later download failures reported by the browser.

## Priority 2: Reliability and Performance

### 3. ~~Add graceful degradation for WebP support~~ ✅ COMPLETED
- **Issue**: Older browsers may not support WebP image format for reference photos
- **Impact**: Reference photo upload could fail on older browsers
- **Effort**: Low (20 minutes)
- **Action**: Detect WebP support and fall back to JPEG if needed
- **Completed**: Added WebP detection with JPEG fallback for older browsers

### 4. ~~Improve camera error recovery after permission denial~~ ✅ COMPLETED
- **Issue**: After camera permission is denied, user must manually enable in Chrome settings and retry - no clear guidance
- **Impact**: Friction for operators setting up the game
- **Effort**: Low (15 minutes)
- **Action**: Add specific guidance for opening Chrome's site settings
- **Completed**: Added the site's Chrome settings URL with explicit instructions to copy it into the address bar, allow Camera, then return and retry

### 5. Add memory pressure detection for replay buffer
- **Issue**: On low-memory devices, the 38 MiB replay buffer could cause issues
- **Impact**: Potential crashes or slowdowns on constrained devices
- **Effort**: Medium (30 minutes)
- **Action**: Detect available memory and reduce replay buffer size if needed

## Priority 3: Usability and Visual Polish

### 6. ~~Add keyboard navigation support for meme library~~ ✅ COMPLETED
- **Issue**: Meme library chooser lacks keyboard navigation (Tab/Arrow keys)
- **Impact**: Poor accessibility for keyboard-only users
- **Effort**: Low (20 minutes)
- **Action**: Add proper focus management and keyboard selection in meme library dialog
- **Completed**: Added arrow key navigation and Home/End support for meme tiles

### 7. ~~Improve aria-live region announcements for screen readers~~ ✅ COMPLETED
- **Issue**: Some state changes (round completion, score updates) may not be announced clearly to screen readers
- **Impact**: Poor accessibility for visually impaired users
- **Effort**: Low (25 minutes)
- **Action**: Add specific aria-live announcements for key game state transitions
- **Completed**: Added aria-live announcer for round completion, player handover, and family completion. Announcements wait until modal dialogs close and update once per game transition.

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

### Bug Fixes and Cleanup
- **Remove duplicate PDF files from project root** (commit 4314167)
  - Deleted duplicate PDF files that were cluttering the project root
  - Authoritative copies remain in output/pdf/

- **Add error handling for reference pack export** (commit a1907fe)
  - Wrapped reference serialization and download preparation in try-catch
  - Displays synchronous export errors; export does not write to localStorage and works when storage is full
  - Browser-reported failures after download preparation are outside this handler

### Reliability and Performance
- **Add WebP support detection with JPEG fallback for reference photos** (commit 0bcc081)
  - Detects WebP browser support at runtime
  - Uses WebP encoding when supported for better compression
  - Falls back to JPEG for older browsers
  - Increased reference pack size limit to 2.5 MB

- **Improve camera permission error message with settings guidance** (commit 7149696, clarified after review)
  - Added Chrome's site settings URL with instructions to copy and paste it into the address bar
  - Uses window.location.origin for the correct site's settings
  - Better guidance for permission denial recovery

### Usability and Accessibility
- **Add keyboard navigation support for meme library chooser** (commit 54ebbea)
  - Added arrow key navigation (left/right/up/down) between meme tiles
  - Support for Home/End keys to jump to first/last tile
  - Improves accessibility for keyboard-only users
  - Focus management allows full selection without mouse

- **Add aria-live announcements for screen reader accessibility** (commit 8fd8d93)
  - Added screen-reader-only announcer element in game console
  - Announces round completion with score after the replay dialog closes
  - Defers announcements while modal dialogs are open and avoids repeats from live tracking updates
  - Announces player handover between child and parent turns
  - Announces family completion and score availability
  - Added .sr-only CSS utility class for screen-reader-only content
