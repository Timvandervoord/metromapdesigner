import * as helpers from '../metromapdesigner/common.js';
import * as config from '../metromapdesigner/config.js';
import * as ui from './uifunctions.js';

let stationEditor = document.getElementById("stationEditor");

/**
 * Helper function to get application instance with null check.
 * 
 * @private
 * @returns {Object|null} The metro map application instance or null if not initialized
 */
function getApp() {
  const app = window.metromapApp;
  if (!app) {
    console.warn('Application not initialized yet');
    return null;
  }
  return app;
}

// ####################################################
// SHOW AND HIDE STATION EDITOR
//

/**
 * Shows or hides the station editor based on station selection.
 * 
 * If a station is provided and the current tool is not the move tool,
 * the editor is populated with station data and shown. Otherwise, the editor is hidden.
 * 
 * @param {Object|null} station - The station object to edit, or null to hide editor
 * @example
 * // Show editor for a station
 * stationEditorShow(selectedStation);
 * 
 * // Hide editor
 * stationEditorShow(null);
 */
export function stationEditorShow(station = null) {
  const app = getApp();
  if (!app) return;
  
  // If station is given, show editor and display it, otherwise hide the editor
  if (station && app.getTool() !== "moveTool") {
    document.getElementById("stationEditorName").value = station.getName();
    document.getElementById("stationEditorDate").value = station.getDate();
    document.getElementById("editStationType").value = station.getType();
    document.getElementById("stationEditorLink").value = station.getLink();
    document.getElementById("stationEditorOrientation").value = station.getOrientation();
    document.getElementById("editStationShapeType").value = station.getShape();
    document.getElementById("stationEditorBeschrijving").value = station.getDescription();

    // Enable connection attribute fields for these type of stations
    document.getElementById("editStationSize").value = station.getWidth();
    if (station.getShape() === "connection") {
      document.getElementById("editStationSize").removeAttribute("disabled");
      document.getElementById("editStationSize").classList.remove("text-white-50");
      document.getElementById("editStationSize").classList.add("text-white");
    } else {
      document.getElementById("editStationSize").disabled = true;
      document.getElementById("editStationSize").classList.remove("text-white");
      document.getElementById("editStationSize").classList.add("text-white-50");
    }

    // Show station editor in place
    showStationEditor()
  } else {
    hideStationEditor();
  }
}

/**
 * Hides the station editor by applying the hidden CSS class.
 * 
 * @example
 * // Hide the station editor
 * hideStationEditor();
 */
export function hideStationEditor() {
  stationEditor.classList.toggle("stationEditorHidden", true);
  stationEditor.classList.toggle("stationEditorShow", false);
}

/**
 * Shows the station editor if the current tool is not the move tool.
 * 
 * @example
 * // Show the station editor
 * showStationEditor();
 */
export function showStationEditor() {
  const app = getApp();
  if (app && app.getTool() !== "moveTool") {
    stationEditor.classList.toggle("stationEditorHidden", false);
    stationEditor.classList.toggle("stationEditorShow", true);
  }
}

// ####################################################
// STATION EDITOR FUNCTIONS
//


/**
 * Changes the name of the selected station with input validation.
 * 
 * Validates the input length (max 100 characters) and updates the station name.
 * Shows a warning if the name is truncated.
 * 
 * @param {HTMLInputElement} newValue - The input element containing the new station name
 * @example
 * // Change station name from input field
 * changeStationName(document.getElementById('stationName'));
 */
export function changeStationName(newValue) {
  const app = getApp();
  if (!app) return;
  
  const value = newValue.value?.trim();
  if (value && value.length <= 100) { // Reasonable limit for station names
    app.changeSelectedStationProperty("name", value);
  } else if (value && value.length > 100) {
    newValue.value = value.substring(0, 100);
    app.changeSelectedStationProperty("name", newValue.value);
    ui.showAlert("Station name truncated to 100 characters", "warning");
  }
}

/**
 * Changes the size of the selected station with input validation.
 * 
 * Validates that the size is between 2 and 7, which are the allowed station sizes.
 * 
 * @param {HTMLSelectElement} selectedSize - The select element containing the new station size
 * @example
 * // Change station size from select dropdown
 * changeStationSize(document.getElementById('stationSize'));
 */
export function changeStationSize(selectedSize) {
  const app = getApp();
  if (!app) return;
  
  const size = parseInt(selectedSize.value, 10);
  if (size >= 2 && size <= 7) {
    app.changeSelectedStationProperty("width", size);
  } else {
    console.warn(`Invalid station size: ${selectedSize.value}. Must be between 2 and 7.`);
  }
}

/**
 * Changes the date of the selected station with input validation.
 * 
 * The date field can contain text and is limited to 100 characters.
 * Shows a warning if the date is truncated.
 * 
 * @param {HTMLInputElement} newValue - The input element containing the new station date
 * @example
 * // Change station date from input field
 * changeStationDate(document.getElementById('stationDate'));
 */
export function changeStationDate(newValue) {
  const app = getApp();
  if (!app) return;
  
  const value = newValue.value?.trim();
  if (!value || value.length <= 100) {
    app.changeSelectedStationProperty("date", value || "");
  } else {
    newValue.value = value.substring(0, 100);
    app.changeSelectedStationProperty("date", newValue.value);
    ui.showAlert("Date field truncated to 100 characters", "warning");
  }
}

/**
 * Changes the description of the selected station with input validation.
 * 
 * Validates the input length (max 500 characters) and updates the station description.
 * Shows a warning if the description is truncated.
 * 
 * @param {HTMLTextAreaElement} newValue - The textarea element containing the new station description
 * @example
 * // Change station description from textarea
 * changeStationDescription(document.getElementById('stationDescription'));
 */
export function changeStationDescription(newValue) {
  const app = getApp();
  if (!app) return;
  
  const value = newValue.value?.trim();
  if (!value || value.length <= 500) { // Reasonable limit for descriptions
    app.changeSelectedStationProperty("description", value || "");
  } else {
    newValue.value = value.substring(0, 500);
    app.changeSelectedStationProperty("description", newValue.value);
    ui.showAlert("Description truncated to 500 characters", "warning");
  }
}

/**
 * Changes the link of the selected station with URL validation.
 * 
 * Validates URL format and length (max 200 characters). Automatically prepends
 * 'https://' if no protocol is specified. Shows warnings for invalid or truncated URLs.
 * 
 * @param {HTMLInputElement} newValue - The input element containing the new station link
 * @example
 * // Change station link from input field
 * changeStationLink(document.getElementById('stationLink'));
 */
export function changeStationLink(newValue) {
  const app = getApp();
  if (!app) return;
  
  const value = newValue.value?.trim();
  if (!value) {
    app.changeSelectedStationProperty("link", "");
    return;
  }
  
  // Basic URL validation
  try {
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
      if (value.length <= 200) {
        app.changeSelectedStationProperty("link", value);
      } else {
        newValue.value = value.substring(0, 200);
        app.changeSelectedStationProperty("link", newValue.value);
        ui.showAlert("Link truncated to 200 characters", "warning");
      }
    } else {
      // Auto-prepend https:// for convenience
      const fullUrl = `https://${value}`;
      if (fullUrl.length <= 200) {
        newValue.value = fullUrl;
        app.changeSelectedStationProperty("link", fullUrl);
      } else {
        ui.showAlert("Link too long (max 200 characters)", "warning");
      }
    }
  } catch (error) {
    console.warn('Invalid URL format:', value);
    app.changeSelectedStationProperty("link", value); // Allow it but warn
  }
}

/**
 * Changes the type of the selected station.
 * 
 * @param {HTMLSelectElement} selectedType - The select element containing the new station type
 * @example
 * // Change station type from select dropdown
 * changeStationType(document.getElementById('stationType'));
 */
export function changeStationType(selectedType) {
  const app = getApp();
  if (!app) return;
  
  app.changeSelectedStationProperty("type", selectedType.value);
}

/**
 * Changes the shape of the selected station and updates UI accordingly.
 * 
 * When the shape is set to 'connection', enables the station size control.
 * For other shapes, disables the size control.
 * 
 * @param {HTMLSelectElement} newValue - The select element containing the new station shape
 * @example
 * // Change station shape from select dropdown
 * changeStationShape(document.getElementById('stationShape'));
 */
export function changeStationShape(newValue) {
  const app = getApp();
  if (!app) return;
  
  app.changeSelectedStationProperty("shape", newValue.value);
  if(newValue.value === "connection") {
    document.getElementById("editStationSize").removeAttribute("disabled");
    document.getElementById("editStationSize").classList.remove("text-white-50");
    document.getElementById("editStationSize").classList.add("text-white");
  } else {
    document.getElementById("editStationSize").disabled = true;
    document.getElementById("editStationSize").classList.remove("text-white");
    document.getElementById("editStationSize").classList.add("text-white-50");
  }
}

/**
 * Attaches event hooks to the metro map for handling user interactions.
 * 
 * This function sets up event listeners for station selection, deselection,
 * and movement events to control the station editor visibility.
 * 
 * @example
 * // Setup station editor hooks
 * addStationEditorHooks();
 */
export function addStationEditorHooks() {
  const app = getApp();
  if (app && app.map) {
    app.map.addHook('selectStation', stationEditorShow);
    app.map.addHook('unSelectStation', stationEditorShow);
    app.map.addHook('movingStation', hideStationEditor);
    app.map.addHook('movedStation', showStationEditor);
  }
}