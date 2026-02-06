import * as helpers from '../metromapdesigner/common.js?v=1.0.4';
import * as config from '../metromapdesigner/config.js?v=1.0.4';
import * as ui from './uifunctions.js?v=1.0.4';

// Track resources that need cleanup
const resourceCleanup = {
  urls: new Set(),
  links: new Set(),
  timeouts: new Set()
};

// Add beforeunload cleanup
window.addEventListener('beforeunload', () => {
  cleanupAllResources();
});

/**
 * Cleans up all tracked resources immediately.
 * @private
 */
function cleanupAllResources() {
  // Clear all timeouts
  resourceCleanup.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
  resourceCleanup.timeouts.clear();
  
  // Remove all links
  resourceCleanup.links.forEach(link => {
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  });
  resourceCleanup.links.clear();
  
  // Revoke all URLs
  resourceCleanup.urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore errors - URL might already be revoked
    }
  });
  resourceCleanup.urls.clear();
}

// ####################################################
// EXPORT AND SHARING FUNCTIONS
//

/**
 * Share the metromap by generating a share link
 */
export async function metroMapShare(metromapdesignapplication) {
  try {
    // Check if application instance is available
    if (!metromapdesignapplication) {
      throw new Error('Application not initialized yet. Please wait for the app to load.');
    }
    
    // Show loading indicator while generating share link
    ui.showAlert("Generating share link...", "primary");
    
    const link = await metromapdesignapplication.getShareLink();
    if(link) {
        // Set the value in the input field using vanilla JavaScript
        const uniqueLinkInput = document.getElementById("uniqueLinkInput");
        if (uniqueLinkInput) {
          uniqueLinkInput.value = link;
        }

        // Show the modal using Bootstrap's JavaScript API
        const shareModal = document.getElementById("shareMetroMapModal");
        if (shareModal) {
          const modal = new bootstrap.Modal(shareModal);
          modal.show();
        }
        
        // Show success message
        ui.showAlert("Share link generated successfully!", "success");
    } else {
      ui.showAlert("Failed to generate share link", "warning");
    }
  } catch (error) {
    console.error("Error creating share link:", error);
    ui.showAlert("Error saving metro map: " + error.message, "danger");
  }
}

/**
 * Download the metromap as PNG with proper resource cleanup
 */
export async function metroMapDownloadPNG(metromapdesignapplication) {
  let downloadLink = null;
  try {
    // Check if application instance is available
    if (!metromapdesignapplication) {
      throw new Error('Application not initialized yet. Please wait for the app to load.');
    }

    // Deselect all stations to prevent selection box from being exported
    if (metromapdesignapplication.map) {
      metromapdesignapplication.map.unselectAllStations();
    }

    // Call the function to get the PNG data
    const pngDataUrl = await metromapdesignapplication.getCanvasContentPng();

    // Create a download link and click it to trigger the download
    downloadLink = document.createElement("a");
    downloadLink.href = pngDataUrl;
    downloadLink.download = metromapdesignapplication.getCanvasName() + ".png";
    downloadLink.style.display = 'none'; // Hide the link
    document.body.appendChild(downloadLink);
    
    // Track link for cleanup
    resourceCleanup.links.add(downloadLink);
    
    downloadLink.click();
    
    // Clean up with delay to ensure download starts
    const timeoutId = setTimeout(() => {
      if (downloadLink && downloadLink.parentNode) {
        document.body.removeChild(downloadLink);
        resourceCleanup.links.delete(downloadLink);
      }
      resourceCleanup.timeouts.delete(timeoutId);
      // PNG data URLs are typically data: URLs, not blob URLs, so no need to revoke
    }, 100);
    
    resourceCleanup.timeouts.add(timeoutId);
  } catch (error) {
    // Clean up on error
    if (downloadLink && downloadLink.parentNode) {
      document.body.removeChild(downloadLink);
      resourceCleanup.links.delete(downloadLink);
    }
    ui.showAlert("Error downloading metro map: " + error, "danger");
  }
}

/**
 * Download the metromap as SVG with proper resource cleanup timing
 */
export function metroMapDownloadSVG(metromapdesignapplication) {
  let blob = null;
  let url = null;
  let link = null;
  
  try {
    // Check if application instance is available
    if (!metromapdesignapplication) {
      throw new Error('Application not initialized yet. Please wait for the app to load.');
    }
    
    // Get content
    const svgData = metromapdesignapplication.getMapContentSVG();
    if (!svgData) {
      throw new Error("No SVG content available for download");
    }

    // Get canvas name, limit to 200 characters
    let canvasName = metromapdesignapplication.getCanvasName();
    if (canvasName.length > 200) {
      canvasName = canvasName.substring(0, 200);
    }

    // Create download link with proper cleanup timing
    blob = new Blob([svgData], { type: "image/svg+xml" });
    url = URL.createObjectURL(blob);
    link = document.createElement("a");
    link.href = url;
    link.download = canvasName + ".svg";
    link.style.display = 'none'; // Hide the link
    document.body.appendChild(link);
    
    // Track resources for cleanup
    resourceCleanup.links.add(link);
    resourceCleanup.urls.add(url);
    
    link.click();
    
    // Clean up with proper timing to ensure download starts
    const timeoutId = setTimeout(() => {
      if (link && link.parentNode) {
        document.body.removeChild(link);
        resourceCleanup.links.delete(link);
      }
      if (url) {
        URL.revokeObjectURL(url);
        resourceCleanup.urls.delete(url);
      }
      resourceCleanup.timeouts.delete(timeoutId);
    }, 100);
    
    resourceCleanup.timeouts.add(timeoutId);
  } catch (error) {
    // Clean up resources on error
    if (link && link.parentNode) {
      document.body.removeChild(link);
      resourceCleanup.links.delete(link);
    }
    if (url) {
      URL.revokeObjectURL(url);
      resourceCleanup.urls.delete(url);
    }
    ui.showAlert("Error downloading SVG: " + error.message, "danger");
  }
}

/**
 * Download the metromap as JSON
 */
export function metroMapDownloadJSON(metromapdesignapplication) {
  // Check if application instance is available
  if (!metromapdesignapplication) {
    ui.showAlert('Application not initialized yet. Please wait for the app to load.', 'warning');
    return;
  }
  
  metromapdesignapplication.importExport.getJSON(metromapdesignapplication.map, metromapdesignapplication.getCanvasName());
}

