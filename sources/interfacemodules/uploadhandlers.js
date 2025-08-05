import * as ui from './uifunctions.js';

/**
 * Generic file upload handler with validation
 * @param {Event} e - File input change event
 * @param {Function} callback - Callback to process file content
 * @param {Object} options - Upload options (maxSize, allowedTypes, allowedExtensions)
 */
function handleFileUpload(e, callback, options = {}) {
  try {
    const fileInput = e.target;
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      throw new Error("No file selected.");
    }
    
    const file = fileInput.files[0];
    
    // File size validation (default 10MB limit)
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
    }
    
    // File type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      const allowedExtensions = options.allowedExtensions || ['svg', 'json'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
      }
    }
    
    // File name validation
    if (file.name.length > 255) {
      throw new Error("File name too long (max 255 characters).");
    }
    
    const reader = new FileReader();
    
    reader.onerror = () => {
      ui.showAlert("Failed to read file.", "danger");
    };
    
    reader.onload = (event) => {
      try {
        callback(event.target.result);
      } catch (callbackError) {
        ui.showAlert(`Error processing file: ${callbackError.message}`, "danger");
      }
    };

    reader.readAsText(file);
    fileInput.value = ""; // Reset input for re-upload
  } catch (error) {
    ui.showAlert(`Error uploading file: ${error.message}`, "danger");
  }
}

/**
 * Handles SVG map file uploads
 * @param {Event} e - File input change event
 * @param {Object} metromapApplication - Metro map application instance
 * @param {Function} generateColorButtons - Function to regenerate color buttons
 * @param {Function} addStationEditorHooks - Function to add station editor event hooks
 */
export function uploadMap(e, metromapApplication, generateColorButtons, addStationEditorHooks) {
  handleFileUpload(e, (result) => {
    if (!result || result.trim().length === 0) {
      throw new Error("File appears to be empty.");
    }
    metromapApplication.loadMap(result);
    generateColorButtons(metromapApplication);
    addStationEditorHooks();
  }, {
    allowedTypes: ['image/svg+xml', 'text/xml', 'application/xml'],
    allowedExtensions: ['svg', 'xml'],
    maxSize: 5 * 1024 * 1024 // 5MB for SVG files
  });
}

/**
 * Handles JSON file uploads
 * @param {Event} e - File input change event
 * @param {Object} metromapApplication - Metro map application instance
 * @param {Function} generateColorButtons - Function to regenerate color buttons
 * @param {Function} addStationEditorHooks - Function to add station editor event hooks
 */
export function uploadJSON(e, metromapApplication, generateColorButtons, addStationEditorHooks) {
  handleFileUpload(e, (result) => {
    if (!result || result.trim().length === 0) {
      throw new Error("File appears to be empty.");
    }
    
    // Validate JSON format
    try {
      JSON.parse(result);
    } catch (jsonError) {
      throw new Error("Invalid JSON format: " + jsonError.message);
    }
    
    metromapApplication.loadJSON(result);
    generateColorButtons(metromapApplication);
    addStationEditorHooks();
  }, {
    allowedTypes: ['application/json', 'text/json'],
    allowedExtensions: ['json'],
    maxSize: 2 * 1024 * 1024 // 2MB for JSON files
  });
}

/**
 * Handles logo/image file uploads
 * @param {Event} e - File input change event
 * @param {Object} metromapApplication - Metro map application instance
 */
export function uploadLogo(e, metromapApplication) {
  try {
    // Access the file input element directly from the event target
    const fileInput = e.target;

    // Check if a file is selected
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      throw new Error("No file selected.");
    }

    const file = fileInput.files[0];
    
    // File type validation - only allow image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    
    if (!allowedTypes.includes(file.type)) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
      }
    }

    // File size validation (max 5MB for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      // Replace the logo on the map with the uploaded image
      metromapApplication.metroMapAddImage(event.target.result);
    };

    reader.readAsDataURL(file);

    // Reset the file input value to allow re-uploading the same file
    fileInput.value = "";
  } catch (error) {
    // Display an error message if something goes wrong
    ui.showAlert("Error uploading logo: " + error.message, "danger");
  }
}

/**
 * Sets up upload event listeners
 * @param {Object} metromapApplication - Metro map application instance
 * @param {Function} generateColorButtons - Function to regenerate color buttons
 * @param {Function} addStationEditorHooks - Function to add station editor event hooks
 */
export function setupUploadListeners(metromapApplication, generateColorButtons, addStationEditorHooks) {
  // For upload JSON
  const uploadJSONField = document.getElementById("uploadJSON");
  if (uploadJSONField) {
    uploadJSONField.addEventListener("change", (e) => uploadJSON(e, metromapApplication, generateColorButtons, addStationEditorHooks));
  }
  
  const mapJSONButton = document.getElementById("uploadJSONButton");
  if (mapJSONButton) {
    mapJSONButton.addEventListener("click", () => {
      uploadJSONField?.click();
    });
  }

  // For upload map
  const uploadMapElement = document.getElementById("uploadMap");
  if (uploadMapElement) {
    uploadMapElement.addEventListener("change", (e) => uploadMap(e, metromapApplication, generateColorButtons, addStationEditorHooks));
  }

  const mapUploadButton = document.getElementById("mapUploadButton");
  if (mapUploadButton) {
    mapUploadButton.addEventListener("click", () => {
      uploadMapElement?.click();
    });
  }

  const mapUploadButtonNav = document.getElementById("mapUploadButtonNav");
  if (mapUploadButtonNav) {
    mapUploadButtonNav.addEventListener("click", () => {
      uploadMapElement?.click();
    });
  }

  const mapUploadButtonSub = document.getElementById("mapUploadButtonSub");
  if (mapUploadButtonSub) {
    mapUploadButtonSub.addEventListener("click", () => {
      uploadMapElement?.click();
    });
  }

  // For upload button logo
  const logoUploadElement = document.getElementById("logoUpload");
  if (logoUploadElement) {
    logoUploadElement.addEventListener("change", (e) => uploadLogo(e, metromapApplication));
  }

  const logoUploadButton = document.getElementById("logoUploadButton");
  if (logoUploadButton) {
    logoUploadButton.addEventListener("click", () => {
      logoUploadElement?.click();
    });
  }
}