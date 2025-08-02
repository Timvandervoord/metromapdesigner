import MetroMapDesigner from './metromapdesigner/MetroMapDesigner.js';
import * as helpers from './metromapdesigner/common.js';
import * as config from './metromapdesigner/config.js';

// ####################################################
// FALLBACK MAP CREATION
//

/**
 * Creates a minimal fallback SVG map when default map loading fails.
 * @returns {string} A basic SVG map that can be used as emergency fallback.
 */
function createFallbackMap() {
  return `<svg version="1.1" encoding="utf-8" id="canvas" width="1440" height="960" metromapversion="02.2024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="overlay">
  <g id="images">
    <image height="80px" transform="translate(1100, 60)" id="imgLogo" href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGFhZ18xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDI1MDAgNzg2LjciPgogIDwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyOS41LjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiAyLjEuMCBCdWlsZCAxNDEpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogI2NkNTI0MTsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zMDQuMiwzNS41TDM2LjgsNzU1LjFoMjA0LjVsMzUuNC0xMDIuMmgxNTcuM3YxMDIuMmgyMDAuNlYzNS41aC0zMzAuM1pNNDMwLDQ0NC41aC04Mi42bDgyLjYtMTczdjE3M1pNMTIyOC40LDI3LjZoLTMxOC42Yy0xMDYuMiwwLTE0MS42LDEzNy42LTE0MS42LDEzNy42bC03NC43LDQyOC43cy0yNy41LDE2MS4yLDExMC4xLDE2MS4yaDI5OC45bDMxLjUtMjEyLjRoLTE2MS4ycy03MC44LDE1LjctNTktNjIuOWMzLjktMTEuOCwzMS41LTE2OS4xLDMxLjUtMTY5LjEsMCwwLDcuOS01NS4xLDQzLjMtNTUuMWgyMDAuNmwzOS4zLTIyOC4xaDBaTTEzMjIuOCwzMS41bC0xNDkuNSw3MjMuNmgxOTYuNmw2Ni44LTMwNi43LDE1LjcsMzA2LjdoMTA2LjJsMTE4LTMwNi43LTU5LDMwNi43aDE3N0wxOTQwLjIsMjcuNmgtMjUxLjdsLTEyMS45LDMwMi44VjMxLjVoLTI0My44LDBaTTE4OTMsNzU1LjFMMjAzMC42LDI3LjZoNDA1LjFsLTMxLjUsMjA4LjVoLTIxMi40bC0xMS44LDcwLjhoMjA0LjVsLTMxLjUsMTU3LjMtMjA4LjQtMy45LTExLjgsNzAuOGgyMDguNGwtNDMuMywyMjQuMmgtNDA1LjEsMFpNMjQwMC4zLDc0My4zYy0yNy41LDAtNDMuMy0xOS43LTQzLjMtNDcuMnMxNS43LTQ3LjIsNDMuMy00Ny4yLDQ3LjIsMTkuNyw0Ny4yLDQ3LjItMTkuNyw0Ny4yLTQ3LjIsNDcuMlpNMjQwMC4zLDc1OS4xYzM1LjQsMCw2Mi45LTMxLjUsNjIuOS02Mi45cy0yNy41LTYyLjktNjIuOS02Mi45LTYyLjksMjcuNS02Mi45LDYyLjljMCwzMS41LDI3LjUsNjIuOSw2Mi45LDYyLjlaTTI0MTYsNzAwLjFjMTEuOCwwLDE5LjctMy45LDE5LjctMTkuN3MtMTEuOC0xOS43LTI3LjUtMTkuN2gtMzEuNXY2Ni44aDExLjh2LTI3LjVoMTEuOGwxNS43LDI3LjVoMTUuN2wtMTUuNy0yNy41aDBaTTIzODguNSw2OTIuMnYtMTkuN2gxNS43YzcuOSwwLDE1LjcsMCwxNS43LDcuOXMtMy45LDExLjgtMTEuOCwxMS44aC0xOS43czAsMCwwLDBaIi8+Cjwvc3ZnPg=="></image>
  </g>
  <g id="overlayText"> 
    <text id="titleText" class="titleText" transform="translate(40.0855, 80.3909)" font-family="Helvetica" font-weight="600" font-size="40px">
        <tspan id="titleText1" x="0" y="0">Metromap learning paths</tspan>
        <tspan id="titleText2" x="0" y="60">for life long development</tspan>
    </text>
    <text id="academyName" class="academyName" transform="translate(40.5656, 190.9541)" font-family="Helvetica" font-weight="600" font-size="30px" style="fill:rgb(160, 165, 169)">Region Amsterdam</text>
  </g>
  <g id="legendaStations">
  		<path style="fill:none;stroke:#000000;stroke-width:2;" d="M1340.7,911.9h-93.2c-26.8,0-48.7-21.3-48.7-47.6v-2.9
			c0-26.2,21.8-47.6,48.7-47.6h93.2c26.8,0,48.7,21.3,48.7,47.6v2.9C1389.4,890.6,1367.6,911.9,1340.7,911.9z"/>
		<text transform="matrix(1 0 0 1 1243.2458 806.1271)" style="font-family:'Helvetica'; font-weight:500; font-size:12px;" class="legendaText">Legend</text>
		<g class="legendaStationItem">
			<path d="M1251.9,839.4h-8.8c-1.7,0-3-1.4-3-3v-8.9c0-1.7,1.4-3,3-3h8.9c1.7,0,3,1.4,3,3v8.9C1255,838,1253.6,839.4,1251.9,839.4z"/>
			<text class="legendaStationItemSymbol" transform="matrix(1 0 0 1 1244.5715 834.3055)" style="fill:#FFFFFF; font-family:'Helvetica'; font-weight:500; font-size:10px;">w</text>
			<text class="legendaStationItemName" transform="matrix(1 0 0 1 1258.2955 834.3055)" style="font-family:'Helvetica'; font-weight:500; font-size:10px;">Workshop</text>
		</g>
		<g class="legendaStationItem">
			<path d="M1251.9,859.6h-8.8c-1.7,0-3-1.4-3-3v-8.9c0-1.7,1.4-3,3-3h8.9c1.7,0,3,1.4,3,3v8.9
				C1255,858.3,1253.6,859.6,1251.9,859.6z"/>
			<text class="legendaStationItemSymbol" transform="matrix(1 0 0 1 1243.2054 854.6025)" style="fill:#FFFFFF; font-family:'Helvetica'; font-weight:500; font-size:10px;">e</text>
			<text class="legendaStationItemName" transform="matrix(1 0 0 1 1258.2955 854.6025)" style="font-family:'Helvetica'; font-weight:500; font-size:10px;">E-learning</text>
		</g>
		<g class="legendaStationItem">
			<path d="M1251.9,879.9h-8.8c-1.7,0-3-1.4-3-3V868c0-1.7,1.4-3,3-3h8.9c1.7,0,3,1.4,3,3v8.9C1255,878.6,1253.6,879.9,1251.9,879.9
				z"/>
			<text class="legendaStationItemSymbol" transform="matrix(1 0 0 1 1244.3505 874.845)" style="fill:#FFFFFF; font-family:'Helvetica'; font-weight:500; font-size:10px;">m</text>
			<text class="legendaStationItemName" transform="matrix(1 0 0 1 1258.2955 874.8452)" style="font-family:'Helvetica'; font-weight:500; font-size:10px;">Masterclass</text>
		</g>
		<g class="legendaStationItem">
			<path d="M1251.9,900.4h-8.8c-1.7,0-3-1.4-3-3v-8.9c0-1.7,1.4-3,3-3h8.9c1.7,0,3,1.4,3,3v8.9
				C1255,899.1,1253.6,900.4,1251.9,900.4z"/>
			<text class="legendaStationItemSymbol" transform="matrix(1 0 0 1 1244.4554 895.3627)" style="fill:#FFFFFF; font-family:'Helvetica'; font-weight:500; font-size:10px;">*</text>
			<text class="legendaStationItemName" transform="matrix(1 0 0 1 1258.2955 895.3627)" style="font-family:'Helvetica'; font-weight:500; font-size:10px;">Other</text>
		</g>
	</g>
</g>
<g id="legenda" transform="translate(61.1258, 863.8569)">
  <text x="0" y="0" style="font-family:'Helvetica'; font-weight:500; font-size:12px;" class="legendaLineText">Metrolines on this map</text>
  <g id="legendaGroupCol1" transform="translate(0, 0)" position="relative"></g>
  <g id="legendaGroupCol2" transform="translate(300, 0)" position="relative"></g>
</g>
<g id="metrolines">
</g>
<g id="stations">
</g>
</svg>`;
}

// ####################################################
// START THE APP
//

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
  try {
    // Initialize the MetroMap designer with the SVG container
    metromapdesignapplication = new MetroMapDesigner(document.getElementById("canvas-container"));
    
    // Load the default map from a predefined URL with error recovery
    try {
      await metromapdesignapplication.loadMapFromUrl("sources/defaultCanvas.svg", true);
    } catch (defaultMapError) {
      console.error('Failed to load default map:', defaultMapError.message);
      
      // Try to create a minimal fallback map
      try {
        const fallbackSvg = createFallbackMap();
        metromapdesignapplication.loadMap(fallbackSvg, true);
        showAlert('Default map could not be loaded. Created minimal map to get started.', 'warning');
      } catch (fallbackError) {
        console.error('Even fallback map creation failed:', fallbackError.message);
        showAlert('Critical error: Unable to initialize map. Please refresh the page.', 'danger');
        throw new Error('Complete initialization failure');
      }
    }

    // Attach hooks to respond to state changes
    addHooks();

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
    useMetrolineTool(helpers.convertToRgb(metromapdesignapplication.getAllMetrolineColors()[0]));

    // Resize the canvas to the default dimensions
    metromapdesignapplication.canvasChangeSize(config.applicationConfig.canvasSizes[0].width, config.applicationConfig.canvasSizes[0].height);

    // Parse the URL for a 'code' parameter to load a shared map
    const urlParams = new URLSearchParams(window.location.search);
    const svgCode = urlParams.get("mc");
    const jsonCode = urlParams.get("json");

    // If a 'svgCode' parameter exists, attempt to load the shared map
    if (svgCode) {
      try {
        metromapdesignapplication.loadMapWithSvgCode(svgCode);
      } catch (e) {
        console.warn(e);
        showAlert(`Error retrieving metro map: ${e}`, "danger");
      }
    }

    // If a 'jsonCode' parameter exists, attempt to load the shared map
    if (jsonCode) {
      try {
        metromapdesignapplication.loadMapWithJsonCode(jsonCode);
      } catch (e) {
        console.warn(e);
        showAlert(`Error retrieving metro map: ${e}`, "danger");
      }
    }
  } catch (e) {
    // Log and display an error message if initialization fails
    console.warn(e);
    showAlert(`Error loading metro map designer: ${e}`, "danger");
  }
}

// ####################################################
// INTERFACE VARIABLES
//

// Cache frequently accessed DOM elements for better performance
let stationEditor = document.getElementById("stationEditor");
let metrolineButtons = document.getElementById("metroline-buttons");
let alertPlaceholder = null; // Will be cached on first use

// MetromapDesigner instance
let metromapdesignapplication = null;

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

// Throttle drag updates for better performance
const throttledDragUpdate = helpers.throttle((element, left, top) => {
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.bottom = 'auto';
}, 16); // ~60fps

function dragInterfaceItem(event) {
  if (dragState.active) {
    const { x, y } = getMousePosInterface(event);
    const { element, offsetX, offsetY } = dragState;

    const left = x - offsetX;
    const top = y - offsetY;
    
    // Use throttled updates for better performance
    throttledDragUpdate(element, left, top);
  }
}

function endDragInterfaceItem() {
  dragState = { active: false, element: null, offsetX: 0, offsetY: 0 };
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
// STATION EDITOR
//

// show editor
function stationEditorShow(station = null) {
  // If station is given, show editor and display it, otherwise hide the editor
  if (station && metromapdesignapplication.getTool() !== "moveTool") {
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

export function hideStationEditor() {
  stationEditor.classList.toggle("stationEditorHidden", true);
  stationEditor.classList.toggle("stationEditorShow", false);
}

export function showStationEditor() {
  if (metromapdesignapplication.getTool() !== "moveTool") {
    stationEditor.classList.toggle("stationEditorHidden", false);
    stationEditor.classList.toggle("stationEditorShow", true);
  }
}

// Move everything on the map in given direction
export function moveMetroMap(direction) {
  metromapdesignapplication.moveEveryThingAlongGrid(direction);
}

// Change the name with input validation
export function changeStationName(newValue) {
  const value = newValue.value?.trim();
  if (value && value.length <= 100) { // Reasonable limit for station names
    metromapdesignapplication.changeSelectedStationProperty("name", value);
  } else if (value && value.length > 100) {
    newValue.value = value.substring(0, 100);
    metromapdesignapplication.changeSelectedStationProperty("name", newValue.value);
    showAlert("Station name truncated to 100 characters", "warning");
  }
}

// Change station size with input validation
export function changeStationSize(selectedSize) {
  const size = parseInt(selectedSize.value, 10);
  if (size >= 2 && size <= 7) {
    metromapdesignapplication.changeSelectedStationProperty("width", size);
  } else {
    console.warn(`Invalid station size: ${selectedSize.value}. Must be between 2 and 7.`);
  }
}

// Change the date with input validation (can contain text, same limit as station name)
export function changeStationDate(newValue) {
  const value = newValue.value?.trim();
  if (!value || value.length <= 100) {
    metromapdesignapplication.changeSelectedStationProperty("date", value || "");
  } else {
    newValue.value = value.substring(0, 100);
    metromapdesignapplication.changeSelectedStationProperty("date", newValue.value);
    showAlert("Date field truncated to 100 characters", "warning");
  }
}

// Change the description with input validation
export function changeStationDescription(newValue) {
  const value = newValue.value?.trim();
  if (!value || value.length <= 500) { // Reasonable limit for descriptions
    metromapdesignapplication.changeSelectedStationProperty("description", value || "");
  } else {
    newValue.value = value.substring(0, 500);
    metromapdesignapplication.changeSelectedStationProperty("description", newValue.value);
    showAlert("Description truncated to 500 characters", "warning");
  }
}

// Change the link with input validation
export function changeStationLink(newValue) {
  const value = newValue.value?.trim();
  if (!value) {
    metromapdesignapplication.changeSelectedStationProperty("link", "");
    return;
  }
  
  // Basic URL validation
  try {
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
      if (value.length <= 200) {
        metromapdesignapplication.changeSelectedStationProperty("link", value);
      } else {
        newValue.value = value.substring(0, 200);
        metromapdesignapplication.changeSelectedStationProperty("link", newValue.value);
        showAlert("Link truncated to 200 characters", "warning");
      }
    } else {
      // Auto-prepend https:// for convenience
      const fullUrl = `https://${value}`;
      if (fullUrl.length <= 200) {
        newValue.value = fullUrl;
        metromapdesignapplication.changeSelectedStationProperty("link", fullUrl);
      } else {
        showAlert("Link too long (max 200 characters)", "warning");
      }
    }
  } catch (error) {
    console.warn('Invalid URL format:', value);
    metromapdesignapplication.changeSelectedStationProperty("link", value); // Allow it but warn
  }
}

// Change station type
export function changeStationType(selectedType) {
  metromapdesignapplication.changeSelectedStationProperty("type", selectedType.value);
}

export function changeStationShape(newValue) {
  metromapdesignapplication.changeSelectedStationProperty("shape", newValue.value);
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

// ####################################################
// ZOOMING FUNCTIONS
//

// Change station orientation
export function changeStationOrientation(selectedOrientation) {
  metromapdesignapplication.changeSelectedStationProperty("rotation", selectedOrientation.value);
}

// Initialize zoomScale
let zoomScale = 1; // Start at normal zoom (100%)
const ZOOM_MIN = 0.5; // 50%
const ZOOM_MAX = 3;   // 300%

export function metroMapZoomIn() {
  zoomScale = Math.min(ZOOM_MAX, zoomScale * 1.1);
  applyZoom();
}

export function metroMapZoomOut() {
  zoomScale = Math.max(ZOOM_MIN, zoomScale / 1.1);
  applyZoom();
}

// Apply zoom by setting CSS transform
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

// Update the zoom percentage display
function updateZoomDisplay() {
  const zoomDisplay = document.getElementById("zoomDisplay");
  if (zoomDisplay) {
      const percentage = Math.round(zoomScale * 100);
      zoomDisplay.textContent = `${percentage}%`;
  }
}

// Reset zoom to 100% when clicking on zoom display
export function resetZoom() {
  zoomScale = 1;
  applyZoom();
}


// ####################################################
// METROLINE COLOR BUTTONS
//

// Generate all color buttons with performance optimization
function generateColorButtons() {
  const existingColors = new Set();
  const colorButtons = metrolineButtons.querySelectorAll(".metro-button");
  
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
// Add color button when color is
export function addColorButton() {
  const colorPicker = document.getElementById("colorPicker");
  if (!colorPicker || !colorPicker.value) {
    showAlert('Please select a color first', 'warning');
    return;
  }
  
  try {
    const color = helpers.convertToRgb(colorPicker.value);
    
    // Validate color format
    if (!helpers.isRgb(color)) {
      showAlert('Invalid color format selected', 'warning');
      return;
    }
    
    if(metromapdesignapplication.addMetrolineColor(color)) {
      createColorButton(color);
      useMetrolineTool(color);
    } else {
      showAlert('Color already exists in the palette', 'info');
    }
  } catch (error) {
    console.error('Error adding color:', error);
    showAlert('Failed to add color: ' + error.message, 'danger');
  }
}

// Create color button with performance optimization
function createColorButton(color) {
  const rgbColor = helpers.convertToRgb(color);
  
  // Use more efficient querySelector instead of querySelectorAll when possible
  const existingButton = metrolineButtons.querySelector(`button[style*="${rgbColor}"]`);
  
  if (!existingButton) {
    // Use DocumentFragment for better performance when adding multiple elements
    const newButton = document.createElement("button");
    newButton.className = "metro-button";
    newButton.style.backgroundColor = rgbColor;
    newButton.setAttribute('data-color', rgbColor); // Add data attribute for easier selection
    
    // Use event delegation pattern for better performance
    newButton.addEventListener("click", () => useMetrolineTool(rgbColor), { passive: true });
    metrolineButtons.appendChild(newButton);
  }
}

/**
 * Clears all metro-buttons from the metroline buttons container.
 */
function clearMetroButtons() {
  const colorButtons = metrolineButtons.querySelectorAll(".metro-button");
  colorButtons.forEach((button) => button.remove());
}

// Metroline color button handler with performance optimization
function useMetrolineTool(color) {
  metromapdesignapplication.setMetrolineColor(color);
  metromapdesignapplication.setTool("metrolineTool");
  
  // More efficient selection update - remove from all first, then add to specific
  const previousSelected = metrolineButtons.querySelector(".metro-button.colorSelected");
  if (previousSelected) {
    previousSelected.classList.remove("colorSelected");
  }
  
  // Use data attribute for more efficient selection
  const targetButton = metrolineButtons.querySelector(`button[data-color="${color}"]`) ||
                      metrolineButtons.querySelector(`button[style*="${color}"]`);
  if (targetButton) {
    targetButton.classList.add("colorSelected");
  }
  
  highLightTool("none");
}

// ####################################################
// INTERFACE FUNCTIONS
//

export function clearMetroMap() {
  metromapdesignapplication.clearMap();
  clearMetroButtons();
  generateColorButtons();
  addHooks();
}

// Select a tool to use
export function useTool(id) {
  metromapdesignapplication.setTool(id); // select the tool in metroline tool
  highLightTool(id);
}

// Undo action
export function undoAction() {
  metromapdesignapplication.undo();
  clearMetroButtons();
  generateColorButtons();
  addHooks();
}

// Will make selected tool active in the interface with performance optimization
function highLightTool(id) {
  // Remove previous selection first
  const previousSelected = document.querySelector(".selectAble.toolSelected");
  if (previousSelected) {
    previousSelected.classList.remove("toolSelected");
  }
  
  // Add to new selection if id provided
  if (id && id !== "none") {
    const targetButton = document.getElementById(id);
    if (targetButton && targetButton.classList.contains("selectAble")) {
      targetButton.classList.add("toolSelected");
    }
  }
}

// Grid toggle
export function gridToggle() {
  metromapdesignapplication.gridToggle();
}

// Save url on clipboard
export function saveUrlClipboard() {
  try {
    const uniqueLinkInput = document.getElementById("uniqueLinkInput");
    if (!uniqueLinkInput) {
      showAlert("Could not find link input field", "warning");
      return;
    }
    
    const urlValue = uniqueLinkInput.value;
    if (!urlValue || urlValue.trim() === "") {
      showAlert("No link available to copy", "warning");
      return;
    }
    
    // Use modern clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlValue).then(() => {
        showAlert("Link copied to clipboard!", "success");
      }).catch((error) => {
        console.error("Failed to copy with clipboard API:", error);
        fallbackCopyToClipboard();
      });
    } else {
      fallbackCopyToClipboard();
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    showAlert("Failed to copy link to clipboard", "danger");
  }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard() {
  try {
    const uniqueLinkInput = document.getElementById("uniqueLinkInput");
    if (!uniqueLinkInput) {
      showAlert("Please manually copy the link", "warning");
      return;
    }
    
    uniqueLinkInput.select();
    uniqueLinkInput.setSelectionRange(0, 99999); // For mobile devices
    
    const successful = document.execCommand('copy');
    if (successful) {
      showAlert("Link copied to clipboard!", "success");
    } else {
      showAlert("Please manually copy the link", "warning");
    }
  } catch (error) {
    console.error("Fallback copy failed:", error);
    showAlert("Please manually copy the link", "warning");
  }
}

// Share the metromap
export async function metroMapShare() {
  try {
    // Show loading indicator while generating share link
    showAlert("Generating share link...", "primary");
    
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
        showAlert("Share link generated successfully!", "success");
    } else {
      showAlert("Failed to generate share link", "warning");
    }
  } catch (error) {
    console.error("Error creating share link:", error);
    showAlert("Error saving metro map: " + error.message, "danger");
  }
}

// Download the image as PNG with proper resource cleanup
export async function metroMapDownloadPNG() {
  let downloadLink = null;
  try {
    // Call the function to get the PNG data
    const pngDataUrl = await metromapdesignapplication.getCanvasContentPng();

    // Create a download link and click it to trigger the download
    downloadLink = document.createElement("a");
    downloadLink.href = pngDataUrl;
    downloadLink.download = metromapdesignapplication.getCanvasName() + ".png";
    downloadLink.style.display = 'none'; // Hide the link
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up with delay to ensure download starts
    setTimeout(() => {
      if (downloadLink && downloadLink.parentNode) {
        document.body.removeChild(downloadLink);
      }
      // PNG data URLs are typically data: URLs, not blob URLs, so no need to revoke
    }, 100);
  } catch (error) {
    // Clean up on error
    if (downloadLink && downloadLink.parentNode) {
      document.body.removeChild(downloadLink);
    }
    showAlert("Error downloading metro map: " + error, "danger");
  }
}

// Download the image as SVG with proper resource cleanup timing
export function metroMapDownloadSVG() {
  let blob = null;
  let url = null;
  let link = null;
  
  try {
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
    link.click();
    
    // Clean up with proper timing to ensure download starts
    setTimeout(() => {
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
    }, 100);
  } catch (error) {
    // Clean up resources on error
    if (link && link.parentNode) {
      document.body.removeChild(link);
    }
    if (url) {
      URL.revokeObjectURL(url);
    }
    showAlert("Error downloading SVG: " + error.message, "danger");
  }
}

export function metroMapDownloadJSON() {
  metromapdesignapplication.importExport.getJSON(metromapdesignapplication.map, metromapdesignapplication.getCanvasName());
}

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
      throw new Error("Failed to read file.");
    };
    
    reader.onload = (event) => {
      try {
        callback(event.target.result);
      } catch (callbackError) {
        showAlert(`Error processing file: ${callbackError.message}`, "danger");
      }
    };

    reader.readAsText(file);
    fileInput.value = ""; // Reset input for re-upload
  } catch (error) {
    showAlert(`Error uploading file: ${error.message}`, "danger");
  }
}

function uploadMap(e) {
  handleFileUpload(e, (result) => {
    if (!result || result.trim().length === 0) {
      throw new Error("File appears to be empty.");
    }
    metromapdesignapplication.loadMap(result);
    generateColorButtons();
    addHooks();
  }, {
    allowedTypes: ['image/svg+xml', 'text/xml', 'application/xml'],
    allowedExtensions: ['svg', 'xml'],
    maxSize: 5 * 1024 * 1024 // 5MB for SVG files
  });
}

function uploadJSON(e) {
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
    
    metromapdesignapplication.loadJSON(result);
    generateColorButtons();
    addHooks();
  }, {
    allowedTypes: ['application/json', 'text/json'],
    allowedExtensions: ['json'],
    maxSize: 2 * 1024 * 1024 // 2MB for JSON files
  });
}

// Replace logo with uploaded image
function uploadLogo(e) {
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
      metromapdesignapplication.metroMapAddImage(event.target.result);
    };

    reader.readAsDataURL(file);

    // Reset the file input value to allow re-uploading the same file
    fileInput.value = "";
  } catch (error) {
    // Display an error message if something goes wrong
    showAlert("Error uploading logo: " + error.message, "danger");
  }
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
    showAlert('Invalid canvas size selection', 'warning');
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
    showAlert(`Invalid canvas size: '${selectedSize}'. Please select a valid size.`, 'warning');
    return;
  }
  
  // Validate dimensions
  if (newSize.width < 100 || newSize.width > 10000 || newSize.height < 100 || newSize.height > 10000) {
    console.error('Canvas dimensions out of valid range:', newSize);
    showAlert('Canvas dimensions are out of valid range (100-10000px)', 'warning');
    return;
  }

  try {
    metromapdesignapplication.canvasChangeSize(newSize.width, newSize.height);
  } catch (error) {
    console.error('Failed to change canvas size:', error);
    showAlert('Failed to change canvas size: ' + error.message, 'danger');
  }
}

// Add hooks to the map
function addHooks() {
    if (metromapdesignapplication.map) {
      metromapdesignapplication.map.addHook('selectStation', stationEditorShow);
      metromapdesignapplication.map.addHook('unSelectStation', stationEditorShow);
      metromapdesignapplication.map.addHook('movingStation', hideStationEditor);
      metromapdesignapplication.map.addHook('movedStation', showStationEditor);
    }
    
    // Handle loading state changes
    metromapdesignapplication.addHook('loadingStateChanged', (data) => {
      handleLoadingStateChange(data);
    });
}

/**
 * Handles loading state changes and updates UI accordingly.
 * @param {Object} data - Loading state information
 */
function handleLoadingStateChange(data) {
  const { loading, operation, success, error, url } = data;
  
  if (loading) {
    // Show loading indicator
    showLoadingIndicator(`Loading ${operation}...`);
  } else {
    // Hide loading indicator
    hideLoadingIndicator();
    
    if (success) {
      console.log(`Successfully completed ${operation} for ${url}`);
    } else if (error) {
      showAlert(error, 'danger');
    }
  }
}

/**
 * Shows a loading indicator to the user.
 * @param {string} message - Loading message to display
 */
function showLoadingIndicator(message) {
  let loader = document.getElementById('loadingIndicator');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.className = 'position-fixed top-50 start-50 translate-middle bg-primary text-white p-3 rounded shadow';
    loader.style.zIndex = '9999';
    document.body.appendChild(loader);
  }
  loader.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      ${message}
    </div>
  `;
  loader.style.display = 'block';
}

/**
 * Hides the loading indicator.
 */
function hideLoadingIndicator() {
  const loader = document.getElementById('loadingIndicator');
  if (loader) {
    loader.style.display = 'none';
  }
}

/**
 * Updates the page content with translations using the provided i18n data.
 * 
 * This function translates elements with matching IDs, classes, and tooltips based on 
 * the provided i18n data. It also updates the app's current language table for future use.
 * 
 * @param {Object|null} i18nData - The translation data object where keys correspond 
 *                                 to element IDs or class names, and values are the 
 *                                 translated text. If `null`, the function will use 
 *                                 the current language table from `config.applicationConfig`.
 * @returns {boolean} - Returns `true` if translations were applied successfully, 
 *                      or `false` if the provided data is invalid.
 */
function updatePageContentWithi18n(i18nData = null) {
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
  generateColorButtons();

  // Initialize zoom display
  updateZoomDisplay();

  // Translate the interface
  Promise.all([
    fetch("locales/en.json").then((response) => response.json()),
    fetch("locales/nl.json").then((response) => response.json()),
    fetch("locales/de.json").then((response) => response.json()),
    fetch("locales/es.json").then((response) => response.json()),
    fetch("locales/fr.json").then((response) => response.json()),
  ]).then(([en, nl, de, es, fr]) => {
    i18next.init(
      {
        lng: "nl", // use 'en' | 'nl' as needed or determine it in some other way
        resources: {
          en: { translation: en },
          nl: { translation: nl },
          de: { translation: de },
          es: { translation: es },
          fr: { translation: fr },
        },
      },
      function (err) {
        if (err) {
          showAlert("Error loading languages: " + err, "danger");
          return;
        }

        // Set default language
        updatePageContentWithi18n(i18next.getResourceBundle(config.applicationConfig.defaultLanguage, "translation"));

        // Set handler for changing language
        const languageSelector = document.getElementById(config.applicationConfig.languageSelector);
        if (languageSelector) {
          languageSelector.addEventListener("change", function () {
            const lang = this.value;
            i18next.changeLanguage(lang, function (err) {
              if (err) {
                showAlert("Error switching language: " + err, "danger");
                return;
              }

              // Update the language content based on the newly selected language
              const newLangContent = i18next.getResourceBundle(lang, "translation");
              updatePageContentWithi18n(newLangContent);
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

  // For upload JSON
  const uploadJSONField = document.getElementById("uploadJSON");
  if (uploadJSONField) {
      uploadJSONField.addEventListener("change", uploadJSON);
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
    uploadMapElement.addEventListener("change", uploadMap);
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
    logoUploadElement.addEventListener("change", uploadLogo);
  }

  const logoUploadButton = document.getElementById("logoUploadButton");
  if (logoUploadButton) {
    logoUploadButton.addEventListener("click", () => {
      logoUploadElement?.click();
    });
  }

  // Initialize tooltips
  const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipElements.forEach((tooltipElement) => {
    new bootstrap.Tooltip(tooltipElement);
  });

  // Update the interface
  updatePageContentWithi18n();
}

// Show toast notification
function showAlert(message, type) {
  // Cache the alert placeholder for better performance
  if (!alertPlaceholder) {
    alertPlaceholder = document.getElementById("liveAlertPlaceholder");
  }
  
  // Log message (keep error level for all types for debugging purposes)
  console.error(message);
  
  // Map alert types to toast styles
  const toastTypeMap = {
    'danger': 'bg-danger text-white',
    'warning': 'bg-warning text-dark',
    'success': 'bg-success text-white',
    'primary': 'bg-primary text-white',
    'info': 'bg-info text-white'
  };
  
  const toastClass = toastTypeMap[type] || 'bg-light text-dark';
  
  // Create unique ID for this toast
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create toast element
  const toastElement = document.createElement("div");
  toastElement.className = `toast ${toastClass}`;
  toastElement.id = toastId;
  toastElement.setAttribute('role', 'alert');
  toastElement.setAttribute('aria-live', 'assertive');
  toastElement.setAttribute('aria-atomic', 'true');
  
  toastElement.innerHTML = `
    <div class="toast-header ${toastClass}">
      <strong class="me-auto">Notification</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
    </div>
  `;
  
  // Safely set the message content to prevent XSS
  const messageBody = toastElement.querySelector('.toast-body');
  if (messageBody) {
    messageBody.textContent = message;
  }
  
  // Append to placeholder
  alertPlaceholder.appendChild(toastElement);
  
  // Initialize and show Bootstrap toast
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 5000
  });
  
  // Clean up DOM after toast is hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  });
  
  toast.show();
}