import * as helpers from '../metromapdesigner/common.js';
import * as config from '../metromapdesigner/config.js';
import * as ui from './uifunctions.js';

// Cache for DOM elements to avoid repeated lookups
let metrolineButtons = null;

/**
 * Gets the metroline buttons container with null safety.
 * 
 * @private
 * @returns {HTMLElement|null} The metroline buttons container or null
 */
function getMetrolineButtons() {
  if (!metrolineButtons) {
    metrolineButtons = document.getElementById("metroline-buttons");
    if (!metrolineButtons) {
      console.warn('Metroline buttons container not found in DOM');
    }
  }
  return metrolineButtons;
}

// ####################################################
// TOOL FUNCTIONS
//

/**
 * Will make selected tool active in the interface with performance optimization
 */
export function highLightTool(id) {
  // Remove previous selection first
  const previousSelected = document.querySelector(".selectAble.toolSelected");
  if (previousSelected) {
    previousSelected.classList.remove("toolSelected");
  }
  
  // Add to new selection if id provided
  if (id && id !== "none") {
    const targetButton = document.getElementById(id);
    if (targetButton) {
      targetButton.classList.add("toolSelected");
    }
  }
}

/**
 * Select a tool to use
 */
export function useTool(id, metromapdesignapplication) {
  metromapdesignapplication.setTool(id);
  highLightTool(id);
}

/**
 * Toggle grid display
 */
export function gridToggle(metromapdesignapplication) {
  metromapdesignapplication.gridToggle();
}

/**
 * Activates the metroline tool with the specified color.
 * 
 * Sets the metroline color, activates the metroline tool, and updates the UI
 * to highlight the selected color button with performance optimization.
 * 
 * @param {string} color - The color to set for the metroline tool (RGB format)
 * @param {Object} metromapdesignapplication - The metro map application instance
 * @example
 * // Activate metroline tool with red color
 * useMetrolineTool('rgb(255, 0, 0)', app);
 */
export function useMetrolineTool(color, metromapdesignapplication) {
  metromapdesignapplication.setMetrolineColor(color);
  metromapdesignapplication.setTool("metrolineTool");
  
  // More efficient selection update - remove from all first, then add to specific
  const container = getMetrolineButtons();
  if (!container) return;
  
  const previousSelected = container.querySelector(".metro-button.colorSelected");
  if (previousSelected) {
    previousSelected.classList.remove("colorSelected");
  }
  
  // Use data attribute for more efficient selection
  const targetButton = container.querySelector(`button[data-color="${color}"]`) ||
                      container.querySelector(`button[style*="${color}"]`);
  if (targetButton) {
    targetButton.classList.add("colorSelected");
  }
  
  highLightTool("none");
}


// ####################################################
// METROLINE COLOR BUTTONS
//

/**
 * Generates color buttons for all available metroline colors.
 * 
 * Creates or updates color buttons based on the current metroline colors in the application.
 * Removes buttons for colors that no longer exist and adds new buttons as needed.
 * Uses performance optimization to minimize DOM operations.
 * 
 * @param {Object} metromapdesignapplication - The metro map application instance
 * @example
 * // Regenerate all color buttons
 * generateColorButtons(app);
 */
export function generateColorButtons(metromapdesignapplication) {
  const container = getMetrolineButtons();
  if (!container) return;
  
  const existingColors = new Set();
  const colorButtons = container.querySelectorAll(".metro-button");
  
  // Track existing colors to avoid unnecessary DOM operations
  colorButtons.forEach(button => {
    existingColors.add(button.style.backgroundColor);
  });
  
  const currentColors = metromapdesignapplication.getAllMetrolineColors();
  const currentColorsRgb = currentColors.map(color => helpers.convertToRgb(color));
  
  // Remove buttons that are no longer needed
  colorButtons.forEach(button => {
    if (!currentColorsRgb.includes(button.style.backgroundColor)) {
      button.remove();
    }
  });
  
  // Add new buttons only if they don't exist
  currentColors.forEach(color => {
    const rgbColor = helpers.convertToRgb(color);
    if (!existingColors.has(rgbColor)) {
      createColorButton(color);
    }
  });
}
/**
 * Adds a new color button from the color picker selection.
 * 
 * Takes the color from the color picker input, validates it, adds it to the
 * application's color palette, and creates a new color button. Shows appropriate
 * alerts for validation errors or duplicate colors.
 * 
 * @param {Object} metromapdesignapplication - The metro map application instance
 * @example
 * // Add color from color picker
 * addColorButton(app);
 */
export function addColorButton(metromapdesignapplication) {
  const colorPicker = document.getElementById("colorPicker");
  if (!colorPicker || !colorPicker.value) {
    ui.showAlert('Please select a color first', 'warning');
    return;
  }
  
  try {
    const color = helpers.convertToRgb(colorPicker.value);
    
    // Validate color format
    if (!helpers.isRgb(color)) {
      ui.showAlert('Invalid color format selected', 'warning');
      return;
    }
    
    if(metromapdesignapplication.addMetrolineColor(color)) {
      createColorButton(color);
      useMetrolineTool(color, metromapdesignapplication);
    } else {
      ui.showAlert('Color already exists in the palette', 'info');
    }
  } catch (error) {
    console.error('Error adding color:', error);
    ui.showAlert('Failed to add color: ' + error.message, 'danger');
  }
}

/**
 * Creates a new color button element with the specified color.
 * 
 * Creates a button element with the given color as background, adds event listeners,
 * and appends it to the metroline buttons container. Uses performance optimization
 * to avoid creating duplicate buttons.
 * 
 * @private
 * @param {string} color - The color for the button (RGB format)
 * @example
 * // Create a red color button
 * createColorButton('rgb(255, 0, 0)');
 */
function createColorButton(color) {
  const rgbColor = helpers.convertToRgb(color);
  
  const container = getMetrolineButtons();
  if (!container) return;
  
  // Use more efficient querySelector instead of querySelectorAll when possible
  const existingButton = container.querySelector(`button[style*="${rgbColor}"]`);
  
  if (!existingButton) {
    // Use DocumentFragment for better performance when adding multiple elements
    const newButton = document.createElement("button");
    newButton.className = "metro-button";
    newButton.style.backgroundColor = rgbColor;
    newButton.setAttribute('data-color', rgbColor); // Add data attribute for easier selection
    
    // Use event delegation pattern for better performance
    newButton.addEventListener("click", () => useMetrolineTool(rgbColor, window.metromapApp), { passive: true });
    container.appendChild(newButton);
  }
}

/**
 * Clears all metro-buttons from the metroline buttons container.
 */
export function clearMetroButtons() {
  const container = getMetrolineButtons();
  if (!container) return;
  
  const colorButtons = container.querySelectorAll(".metro-button");
  colorButtons.forEach((button) => button.remove());
}