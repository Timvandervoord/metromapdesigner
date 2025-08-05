import MetroMapDesigner from './metromapdesigner/MetroMapDesigner.js';
import * as helpers from './metromapdesigner/common.js';
import * as config from './metromapdesigner/config.js';

// UI functions
import * as ui from './interfacemodules/uifunctions.js';
export * from './interfacemodules/uifunctions.js';

// Station editor functions
import * as stationEditor from './interfacemodules/stationeditor.js';
export * from './interfacemodules/stationeditor.js';

// Toolbar functions
import * as toolbar from './interfacemodules/toolbar.js';
export * from './interfacemodules/toolbar.js';

// Export functions
import * as exportFunctions from './interfacemodules/exportfunctions.js';
export * from './interfacemodules/exportfunctions.js';

// Upload handlers
import * as uploadHandlers from './interfacemodules/uploadhandlers.js';
export * from './interfacemodules/uploadhandlers.js';


// ####################################################
// INTERFACE VARIABLES
//

// MetromapDesigner instance
let metromapdesignapplication = null;


// ####################################################
// INIT THE APP
//

/**
 * Initializes the user interface for the MetroMap design application.
 *
 * This function sets up event listeners, initializes internationalization (i18n) for 
 * language support, configures toolbars, uploads, and tooltips, and prepares the interface 
 * for user interactions.
 *
 * @function
 *
 * @example
 * // Call this function to set up the interface after loading the app
 * initInterface();
 */
function initInterface() {
  // Initialize the color buttons
  toolbar.generateColorButtons(metromapdesignapplication);

  // Initialize zoom display
  ui.updateZoomDisplay();

  // Translate the interface with error handling for individual language files
  const loadLanguage = async (lang) => {
    try {
      const response = await fetch(`locales/${lang}.json`);
      if (!response.ok) {
        console.warn(`Failed to load ${lang}.json: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn(`Error loading ${lang}.json:`, error);
      return null;
    }
  };

  Promise.all([
    loadLanguage("en"),
    loadLanguage("nl"),
    loadLanguage("de"),
    loadLanguage("es"),
    loadLanguage("fr"),
  ]).then(([en, nl, de, es, fr]) => {
    // Filter out failed loads and ensure we have at least one language
    const resources = {};
    if (en) resources.en = { translation: en };
    if (nl) resources.nl = { translation: nl };
    if (de) resources.de = { translation: de };
    if (es) resources.es = { translation: es };
    if (fr) resources.fr = { translation: fr };
    
    // Fallback to English if no languages loaded
    if (Object.keys(resources).length === 0) {
      ui.showAlert("Failed to load language files. Using fallback.", "warning");
      resources.en = { translation: {} };
    }
    i18next.init(
      {
        lng: "nl", // use 'en' | 'nl' as needed or determine it in some other way
        resources,
      },
      function (err) {
        if (err) {
          ui.showAlert("Error loading languages: " + err, "danger");
          return;
        }

        // Set default language
        ui.updatePageContentWithi18n(i18next.getResourceBundle(config.applicationConfig.defaultLanguage, "translation"));

        // Set handler for changing language
        const languageSelector = document.getElementById(config.applicationConfig.languageSelector);
        if (languageSelector) {
          languageSelector.addEventListener("change", function () {
            const lang = this.value;
            i18next.changeLanguage(lang, function (err) {
              if (err) {
                ui.showAlert("Error switching language: " + err, "danger");
                return;
              }

              // Update the language content based on the newly selected language
              const newLangContent = i18next.getResourceBundle(lang, "translation");
              ui.updatePageContentWithi18n(newLangContent);
            });
          });
        }
      }
    );
  });
  
  // Set app data in the document
  document.getElementById("appVersion").textContent = config.applicationConfig.appVersion;
  document.getElementById("appName").textContent = config.applicationConfig.appName;
  document.title = `${config.applicationConfig.appName} | SMART MAKERS ACADEMY | ${config.applicationConfig.appVersion}`;

  // Setup upload handlers
  uploadHandlers.setupUploadListeners(metromapdesignapplication, toolbar.generateColorButtons, stationEditor.addStationEditorHooks);

  // Initialize tooltips
  const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipElements.forEach((tooltipElement) => {
    new bootstrap.Tooltip(tooltipElement);
  });

}

/**
 * Initializes and starts the MetroMap design application interface.
 *
 * This function sets up the MetroMap designer by:
 * - Loading the default SVG map.
 * - Adding event hooks for state changes.
 * - Initializing the user interface components.
 * - Setting up the metroline tool with the default color.
 * - Handling the canvas size and any share code passed via URL parameters.
 *
 * @async
 * @function
 * @throws {Error} Displays an alert if initialization fails or if map retrieval errors occur.
 *
 * @example
 * // Call this function to load and initialize the interface
 * loadInterface();
 */
export async function loadInterface() {
    // Initialize the MetroMap designer with the SVG container
    metromapdesignapplication = new MetroMapDesigner(document.getElementById("canvas-container"));
    
    // Make globally available
    window.metromapApp = metromapdesignapplication;
    
    // Make export functions globally available for HTML onclick handlers
    window.exportFunctions = exportFunctions;
    window.toolbar = toolbar;
    window.ui = ui;
    window.stationEditor = stationEditor;
    window.uploadHandlers = uploadHandlers;
    
    // Load the default map from a predefined URL
    try {
      await metromapdesignapplication.loadMapFromUrl("sources/defaultCanvas.svg", true);
    } catch (defaultMapError) {
      console.error('Failed to load default map:', defaultMapError.message);
      ui.showAlert('Critical error: Unable to initialize map. Please refresh the page.', 'danger');
      throw new Error('Failed to load default map');
    }

    // Attach hooks to respond to state changes
    stationEditor.addStationEditorHooks();

    // Initialize interface components
    initInterface();

    // Add cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
      if (metromapdesignapplication) {
        metromapdesignapplication.destroy();
        metromapdesignapplication = null;
      }
    });

    // Set the default metroline tool with the first color from the palette
    toolbar.useMetrolineTool(helpers.convertToRgb(metromapdesignapplication.getAllMetrolineColors()[0]), metromapdesignapplication);

    // Resize the canvas to the default dimensions
    metromapdesignapplication.canvasChangeSize(config.applicationConfig.canvasSizes[0].width, config.applicationConfig.canvasSizes[0].height);

    // Parse the URL for shared map codes
    loadSharedMapFromUrl();
}

/**
 * Loads a shared map from URL parameters if present.
 * 
 * Checks for 'mc' (SVG code) and 'json' (JSON code) URL parameters
 * and attempts to load the corresponding shared map.
 * 
 * @private
 */
function loadSharedMapFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const svgCode = urlParams.get("mc");
  const jsonCode = urlParams.get("json");

  // Helper function to handle map loading with error handling
  const loadMapCode = (code, loadFunction, mapType) => {
    if (code) {
      try {
        loadFunction(code);
      } catch (e) {
        console.warn(e);
        ui.showAlert(`Error retrieving ${mapType} metro map: ${e}`, "danger");
      }
    }
  };

  loadMapCode(svgCode, metromapdesignapplication.loadMapWithSvgCode.bind(metromapdesignapplication), "SVG");
  loadMapCode(jsonCode, metromapdesignapplication.loadMapWithJsonCode.bind(metromapdesignapplication), "JSON");
}

/**
 * Moves all elements on the metro map in the specified direction.
 * 
 * @param {string} direction - The direction to move ('left', 'right', 'up', 'down')
 * 
 * @example
 * // Move all elements to the left
 * moveMetroMap('left');
 */
export function moveMetroMap(direction) {
  metromapdesignapplication.moveEveryThingAlongGrid(direction);
}

/**
 * Clears the entire metro map and resets the interface.
 * 
 * This function removes all metro lines, stations, and other elements from the map,
 * clears the toolbar buttons, regenerates color buttons, and re-attaches event hooks.
 * 
 * @example
 * // Clear the current map
 * clearMetroMap();
 */
export function clearMetroMap() {
  metromapdesignapplication.clearMap();
  toolbar.clearMetroButtons();
  toolbar.generateColorButtons(metromapdesignapplication);
  stationEditor.addStationEditorHooks();
}

/**
 * Undoes the last action performed on the metro map.
 * 
 * This function reverts the map to its previous state, clears toolbar buttons,
 * regenerates color buttons, and re-attaches event hooks.
 * 
 * @example
 * // Undo the last action
 * undoAction();
 */
export function undoAction() {
  metromapdesignapplication.undo();
  toolbar.clearMetroButtons();
  toolbar.generateColorButtons(metromapdesignapplication);
  stationEditor.addStationEditorHooks();
}

/**
 * Changes the size of the canvas based on the selected size.
 *
 * This function uses the predefined canvas sizes from the application configuration (`config.applicationConfig.canvasSizes`)
 * to dynamically adjust the dimensions of the canvas. If the selected size is not found, it defaults to the
 * first size in the configuration or a fallback value.
 *
 * @param {string} selectedSize - The size identifier (e.g., "big", "huge", or "default").
 * @throws {Error} Throws an error if `selectedSize` is not provided or is invalid.
 *
 * @example
 * // Change the canvas to a big size
 * changeCanvasSize("big");
 *
 * // Change the canvas to default size
 * changeCanvasSize("default");
 */
export function changeCanvasSize(selectedSize) {
  // Input validation
  if (!selectedSize || typeof selectedSize !== 'string') {
    console.error('Invalid canvas size parameter:', selectedSize);
    ui.showAlert('Invalid canvas size selection', 'warning');
    return;
  }
  
  const sizeMap = {
    big: config.applicationConfig.canvasSizes[1] || { width: 1920, height: 1440 },
    huge: config.applicationConfig.canvasSizes[2] || { width: 2560, height: 1920 },
    default: config.applicationConfig.canvasSizes[0] || { width: 1280, height: 960 },
  };

  const newSize = sizeMap[selectedSize.toLowerCase()];
  if (!newSize) {
    console.error(`Invalid canvas size: '${selectedSize}'. Valid options are "big", "huge", or "default".`);
    ui.showAlert(`Invalid canvas size: '${selectedSize}'. Please select a valid size.`, 'warning');
    return;
  }
  
  // Validate dimensions
  if (newSize.width < 100 || newSize.width > 10000 || newSize.height < 100 || newSize.height > 10000) {
    console.error('Canvas dimensions out of valid range:', newSize);
    ui.showAlert('Canvas dimensions are out of valid range (100-10000px)', 'warning');
    return;
  }

  try {
    metromapdesignapplication.canvasChangeSize(newSize.width, newSize.height);
  } catch (error) {
    console.error('Failed to change canvas size:', error);
    ui.showAlert('Failed to change canvas size: ' + error.message, 'danger');
  }
}


