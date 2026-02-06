import * as helpers from '../metromapdesigner/common.js?v=1.0.5';
import * as config from '../metromapdesigner/config.js?v=1.0.5';

// ####################################################
// ALERT AND NOTIFICATION FUNCTIONS
//

/**
 * Shows a Bootstrap alert message with automatic dismissal.
 * @param {string} message - The message to display
 * @param {string} type - The alert type ('success', 'warning', 'danger', 'info')
 */
export function showAlert(message, type = 'info') {
  // Cache the placeholder element for better performance
  let alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  
  if (!alertPlaceholder) {
    console.error('Alert placeholder not found');
    return;
  }

  // Clear any existing alerts
  alertPlaceholder.innerHTML = '';

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute('role', 'alert');
  
  // Create message text node safely to prevent XSS
  const messageText = document.createTextNode(message);
  alertDiv.appendChild(messageText);
  
  // Create close button safely  
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'alert');
  closeButton.setAttribute('aria-label', 'Close');
  alertDiv.appendChild(closeButton);

  alertPlaceholder.appendChild(alertDiv);

  // Auto-dismiss after 5 seconds for non-critical alerts
  if (type !== 'danger') {
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150); // Wait for fade animation
      }
    }, 5000);
  }
}

// ####################################################
// CLIPBOARD FUNCTIONS
//

/**
 * Saves URL to clipboard with fallback support.
 * 
 * Copies the URL from the unique link input field to the clipboard using the modern
 * clipboard API with fallback to older methods for browser compatibility.
 * 
 * @example
 * // Copy URL to clipboard
 * saveUrlClipboard();
 */
export function saveUrlClipboard() {
  const uniqueLinkInput = document.getElementById("uniqueLinkInput");
  if (!uniqueLinkInput || !uniqueLinkInput.value) {
    showAlert('No URL to copy', 'warning');
    return;
  }

  const textToCopy = uniqueLinkInput.value;

  try {
    // Use modern clipboard API with fallback
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showAlert('URL copied to clipboard!', 'success'))
        .catch(() => fallbackCopyToClipboard(textToCopy));
    } else {
      fallbackCopyToClipboard(textToCopy);
    }
  } catch (error) {
    console.error('Clipboard operation failed:', error);
    showAlert('Failed to copy URL to clipboard', 'warning');
  }
}

/**
 * Fallback clipboard copy method for older browsers.
 * @param {string} text - Text to copy
 */
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showAlert('URL copied to clipboard!', 'success');
  } catch (error) {
    console.error('Fallback copy failed:', error);
    showAlert('Please manually copy the URL', 'info');
  }
}

// ####################################################
// INTERNATIONALIZATION FUNCTIONS
//

/**
 * Updates page content with internationalization data.
 * @param {Object} i18nData - Translation data object
 */
export function updatePageContentWithi18n(i18nData = null) {
  if (i18nData === null) {
    i18nData = config.applicationConfig.currentLangTable;
    if (typeof i18nData !== "object") {
      return false;
    } // no correct language data found
  } else {
    // Save for later use to update the interface with current language
    config.applicationConfig.currentLangTable = i18nData;
  }

  // Translate interface
  for (const [key, value] of Object.entries(i18nData)) {
    // Update elements by ID
    const elementById = document.getElementById(key);
    if (elementById) {
      elementById.textContent = value;
    }

    // Update elements by class
    const elementsByClass = document.querySelectorAll(`.${key}`);
    elementsByClass.forEach((element) => {
      element.textContent = value;
    });

  }

  // Translate tooltips
  const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipElements.forEach((tooltipElement) => {
    const i18nKey = tooltipElement.getAttribute("data-i18n-key");
    const elementID = tooltipElement.id;

    if (i18nKey && elementID) {
      // Translate using i18next
      const translatedTitle = i18next.t(i18nKey);

      // Set the translated title using Bootstrap tooltip API
      const tooltip = bootstrap.Tooltip.getInstance(`#${elementID}`);
      if (tooltip) {
        tooltip.setContent({ ".tooltip-inner": translatedTitle });
      }
    }
  });
 
}

// ####################################################
// DRAGGING FUNCTIONS
//

// For toolbars
const toolbarHandles = document.querySelectorAll(".toolbar-handle");
toolbarHandles.forEach((handle) => {
    handle.addEventListener("mousedown", startDragInterfaceItem);
    handle.addEventListener("touchstart", startDragInterfaceItem);
});

// Document-wide event listeners for dragging
document.addEventListener("mousemove", dragInterfaceItem);
document.addEventListener("touchmove", dragInterfaceItem);
document.addEventListener("mouseup", endDragInterfaceItem);
document.addEventListener("mouseleave", endDragInterfaceItem);
document.addEventListener("touchend", endDragInterfaceItem);
document.addEventListener("touchleave", endDragInterfaceItem);

// Dragging interface items
let dragState = { active: false, element: null, offsetX: 0, offsetY: 0 };
function startDragInterfaceItem(event) {
  if (event.target.classList.contains("dragable")) {
    const element = event.target.parentElement;
    const { x, y } = getMousePosInterface(event);

    dragState = {
      active: true,
      element,
      offsetX: x - element.offsetLeft,
      offsetY: y - element.offsetTop,
    };
  }
}

// Simple throttle for drag updates to prevent memory leaks
let lastDragUpdate = 0;
function dragInterfaceItem(event) {
  if (dragState.active) {
    const now = Date.now();
    // Throttle to ~60fps (16ms) to prevent excessive DOM updates
    if (now - lastDragUpdate < 16) return;
    lastDragUpdate = now;
    
    const { x, y } = getMousePosInterface(event);
    const { element, offsetX, offsetY } = dragState;

    const left = x - offsetX;
    const top = y - offsetY;
    
    // Direct DOM update without closure
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.bottom = 'auto';
  }
}

function endDragInterfaceItem() {
  // Clear drag state and reset timestamp to prevent memory leaks
  dragState = { active: false, element: null, offsetX: 0, offsetY: 0 };
  lastDragUpdate = 0;
}

/**
 * Retrieves the mouse position relative to the screen or viewport without considering an SVG canvas.
 *
 * @param {Event} evt - The event object.
 * @returns {Object} An object with x and y coordinates.
 */
function getMousePosInterface(evt) {
  if (evt.type.startsWith("touch")) {
    const touch = evt.touches?.[0] || evt.changedTouches?.[0];
    return { x: touch?.clientX || 0, y: touch?.clientY || 0 };
  }
  return { x: evt.clientX, y: evt.clientY };
}


// ####################################################
// ZOOMING FUNCTIONS
//

/**
 * Changes the orientation/rotation of the selected station.
 * 
 * @param {HTMLSelectElement} selectedOrientation - The select element containing the new orientation value
 * @example
 * // Change station orientation from select dropdown
 * changeStationOrientation(document.getElementById('stationOrientation'));
 */
export function changeStationOrientation(selectedOrientation) {
  const app = window.metromapApp;
  if (!app) {
    console.warn('Application not initialized yet');
    return;
  }
  app.changeSelectedStationProperty("rotation", selectedOrientation.value);
}

// Initialize zoomScale
let zoomScale = 1; // Start at normal zoom (100%)
const ZOOM_MIN = 0.5; // 50%
const ZOOM_MAX = 3;   // 300%

/**
 * Zooms in on the metro map by increasing the scale factor.
 * 
 * Increases the zoom scale by 10% up to the maximum zoom level (300%).
 * 
 * @example
 * // Zoom in on the map
 * metroMapZoomIn();
 */
export function metroMapZoomIn() {
  zoomScale = Math.min(ZOOM_MAX, zoomScale * 1.1);
  applyZoom();
}

/**
 * Zooms out on the metro map by decreasing the scale factor.
 * 
 * Decreases the zoom scale by 10% down to the minimum zoom level (50%).
 * 
 * @example
 * // Zoom out on the map
 * metroMapZoomOut();
 */
export function metroMapZoomOut() {
  zoomScale = Math.max(ZOOM_MIN, zoomScale / 1.1);
  applyZoom();
}

/**
 * Applies the current zoom scale to the canvas container using CSS transform.
 * 
 * Sets the transform origin to account for the canvas top margin and updates
 * the zoom display in the toolbar.
 * 
 * @private
 */
function applyZoom() {
  const canvasContainer = document.querySelector("#canvas-container");
  if (canvasContainer) {
      // Set transform origin to account for the 70px top margin of the canvas
      canvasContainer.style.transformOrigin = "0 70px";
      canvasContainer.style.transform = `scale(${zoomScale})`;
  } else {
      console.error("Canvas container not found");
  }
  
  // Update zoom display in bottom toolbar
  updateZoomDisplay();
}

/**
 * Updates the zoom percentage display in the toolbar.
 * 
 * Calculates the current zoom percentage and updates the display element.
 * 
 * @example
 * // Update zoom display after zoom change
 * updateZoomDisplay();
 */
export function updateZoomDisplay() {
  const zoomDisplay = document.getElementById("zoomDisplay");
  if (zoomDisplay) {
      const percentage = Math.round(zoomScale * 100);
      zoomDisplay.textContent = `${percentage}%`;
  }
}

/**
 * Resets the zoom scale to 100% (normal size).
 * 
 * Sets the zoom scale back to 1 and applies the change to the canvas.
 * 
 * @example
 * // Reset zoom to normal size
 * resetZoom();
 */
export function resetZoom() {
  zoomScale = 1;
  applyZoom();
}