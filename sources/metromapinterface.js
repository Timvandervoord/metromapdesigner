// Copyright (C) 2024 Tim van der Voord (tim@vandervoord.nl)
//
// This file may be distributed under the terms of the GNU GPLv3 license.

import metromapdesigner from './metromapdesigner/metromapdesigner.js';
import * as helpers from './metromapdesigner/common.js';
import * as config from './metromapdesigner/config.js';

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
    metromapdesignapplication = new metromapdesigner(document.getElementById("canvas-container"));
    
    // Load the default map from a predefined URL
    await metromapdesignapplication.loadMapFromUrl("sources/defaultCanvas.svg");

    // Attach hooks to respond to state changes
    addHooks();

    // Initialize interface components
    initInterface();

    // Set the default metroline tool with the first color from the palette
    useMetrolineTool(helpers.convertToRgb(metromapdesignapplication.getAllMetrolineColors()[0]));

    // Resize the canvas to the default dimensions
    metromapdesignapplication.canvasChangeSize(config.applicationConfig.canvasSizes[0].width, config.applicationConfig.canvasSizes[0].height);

    // Parse the URL for a 'code' parameter to load a shared map
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("mc");

    // If a 'code' parameter exists, attempt to load the shared map
    if (code) {
      try {
        metromapdesignapplication.loadMapWithShareCode(code);
      } catch (e) {
        console.warn(e);
        showAlert(`Fout bij het ophalen van de metrokaart: ${e}`, "danger");
      }
    }
  } catch (e) {
    // Log and display an error message if initialization fails
    console.warn(e);
    showAlert(`Fout bij het laden van de metrokaart designer: ${e}`, "danger");
  }
}

// ####################################################
// INTERFACE VARIABLES
//

let stationEditor = document.getElementById("stationEditor");
let metrolineButtons = document.getElementById("metroline-buttons");

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

function dragInterfaceItem(event) {
  if (dragState.active) {
    const { x, y } = getMousePosInterface(event);
    const { element, offsetX, offsetY } = dragState;

    element.style.left = `${x - offsetX}px`;
    element.style.top = `${y - offsetY}px`;
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

// Change the name
export function changeStationName(newValue) {
  metromapdesignapplication.changeSelectedStationProperty("name", newValue.value);
}

// Change station size
export function changeStationSize(selectedSize) {
  metromapdesignapplication.changeSelectedStationProperty("width", selectedSize.value);
}

// Change the date
export function changeStationDate(newValue) {
  metromapdesignapplication.changeSelectedStationProperty("date", newValue.value);
}

// Change the description
export function changeStationDescription(newValue) {
  metromapdesignapplication.changeSelectedStationProperty("description", newValue.value);
}

// Change the link
export function changeStationLink(newValue) {
  metromapdesignapplication.changeSelectedStationProperty("link", newValue.value);
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
  const canvas = document.querySelector("#canvas");
  if (canvas) {
      canvas.style.transformOrigin = "0 0"; // Set the origin to the top-left corner
      canvas.style.transform = `scale(${zoomScale})`; // Apply the correct scaling
  } else {
      console.error("Canvas element not found");
  }
}

// ####################################################
// METROLINE COLOR BUTTONS
//

// Generate all color buttons
function generateColorButtons() {
  clearMetroButtons();
  metromapdesignapplication.getAllMetrolineColors().forEach(createColorButton);
}
// Add color button when color is
export function addColorButton() {
  const color = helpers.convertToRgb(document.getElementById("colorPicker").value);
  if(metromapdesignapplication.addMetrolineColor(color)) {
    createColorButton(color);
    useMetrolineTool(color);
  } else console.log('Attempt to add color failed, already exists?');
}

// Create color button
function createColorButton(color) {
  // Get all color buttons
  const colorButtons = metrolineButtons.querySelectorAll(".metro-button");

  // Convert color if needed
  let rgbColor = helpers.convertToRgb(color);

  // Check if a button with the chosen color already exists
  const colorButtonExists = Array.from(colorButtons).some((button) => button.style.backgroundColor === rgbColor);

  if (!colorButtonExists) {
    const newButton = document.createElement("button");
    newButton.className = "metro-button";
    newButton.style.backgroundColor = rgbColor;
    newButton.addEventListener("click", function () {
      useMetrolineTool(rgbColor);
    });
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

// Metroline color button handler
function useMetrolineTool(color) {
  metromapdesignapplication.setMetrolineColor(color);
  metromapdesignapplication.setTool("metrolineTool");
  // Make selected color active
  const colorButtons = metrolineButtons.querySelectorAll(".metro-button");
  colorButtons.forEach((button) => {
    if (button.style.backgroundColor === color) {
      button.classList.add("colorSelected");
    } else {
      button.classList.remove("colorSelected");
    }
  });
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

// Will make selected tool active in the interface
function highLightTool(id) {
  const buttons = document.querySelectorAll(".selectAble");
  buttons.forEach((button) => {
    if (button.id && button.id === id) {
      button.classList.add("toolSelected");
    } else {
      button.classList.remove("toolSelected");
    }
  });
}

// Grid toggle
export function gridToggle() {
  metromapdesignapplication.gridToggle();
}

// Save url on clipboard
export function saveUrlClipboard() {
  let urlValue = $("#uniqueLinkInput").val();
  navigator.clipboard.writeText(urlValue);
}

// Share the metromap
export function metroMapShare() {
  try {
    link = metromapdesignapplication.getShareLink();
    if(link) {
        // Replace the href and the text content of the link
        $("#uniqueLinkInput").attr("value", link);

        // Show the modal
        $("#shareMetroMapModal").modal("show");
    }
  } catch (error) {
    showAlert("fout bij het opslaan van de metrokaart" + error, "danger");
  }
}

// Download the image as PNG
export async function metroMapDownloadPNG() {
  try {
    // Call the function to get the PNG data
    const pngDataUrl = await metromapdesignapplication.getCanvasContentPng();

    // Create a download link and click it to trigger the download
    var downloadLink = document.createElement("a");
    downloadLink.href = pngDataUrl;
    downloadLink.download = metromapdesignapplication.getCanvasName() + ".png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (error) {
    showAlert("fout bij het downloaden van de metrokaart" + error, "danger");
  }
}

// Download the image as SVG
export function metroMapDownloadSVG() {
  // Get content
  const svgData = metromapdesignapplication.getMapContentSVG();

  // Get canvas name, limit to 200 characters
  const canvasName = metromapdesignapplication.getCanvasName();
  if (canvasName.length > 200) {
    canvasName = canvasName.substring(0, 200);
  }

  // Create download link
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = canvasName + ".svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function metroMapDownloadJSON() {
  metromapdesignapplication.importExport.getJSON(metromapdesignapplication.map, metromapdesignapplication.getCanvasName());
}

function handleFileUpload(e, callback) {
  try {
    const fileInput = e.target;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (event) => callback(event.target.result);

      reader.readAsText(file);
      fileInput.value = ""; // Reset input for re-upload
    } else {
      throw new Error("No file selected.");
    }
  } catch (error) {
    showAlert(`Error uploading file: ${error.message}`, "danger");
  }
}

function uploadMap(e) {
  handleFileUpload(e, (result) => {
    metromapdesignapplication.loadMap(result);
    generateColorButtons();
    addHooks();
  });
}

function uploadJSON(e) {
  handleFileUpload(e, (result) => {
    metromapdesignapplication.loadJSON(result);
    generateColorButtons();
    addHooks();
  });
}

// Replace logo with uploaded image
function uploadLogo(e) {
  try {
    // Access the file input element directly from the event target
    const fileInput = e.target;

    // Check if a file is selected
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        // Replace the logo on the map with the uploaded image
        metromapdesignapplication.metroMapReplaceLogo(event.target.result);
      };

      reader.readAsDataURL(file);

      // Reset the file input value to allow re-uploading the same file
      fileInput.value = "";
    } else {
      throw new Error("No file selected.");
    }
  } catch (error) {
    // Display an error message if something goes wrong
    showAlert("fout bij het uploaden van het logo: " + error.message, "danger");
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
  const sizeMap = {
    big: config.applicationConfig.canvasSizes[1] || { width: 1920, height: 1440 },
    huge: config.applicationConfig.canvasSizes[2] || { width: 2560, height: 1920 },
    default: config.applicationConfig.canvasSizes[0] || { width: 1280, height: 960 },
  };

  const newSize = sizeMap[selectedSize];
  if (!newSize) {
    throw new Error(`Invalid canvas size: '${selectedSize}'. Valid options are "big", "huge", or "default".`);
  }

  metromapdesignapplication.canvasChangeSize(newSize.width, newSize.height);
}

// Add hooks to the map
function addHooks() {
    metromapdesignapplication.map.addHook('selectStation', stationEditorShow);
    metromapdesignapplication.map.addHook('unSelectStation', stationEditorShow);
    metromapdesignapplication.map.addHook('movingStation', hideStationEditor);
    metromapdesignapplication.map.addHook('movedStation', showStationEditor);
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
      function (err, t) {
        if (err) {
          showAlert("Fout bij het laden van talen: " + err, "danger");
          return;
        }

        // Set default language
        updatePageContentWithi18n(i18next.getResourceBundle(config.applicationConfig.defaultLanguage, "translation"));

        // Set handler for changing language
        const languageSelector = document.getElementById(config.applicationConfig.languageSelector);
        if (languageSelector) {
          languageSelector.addEventListener("change", function () {
            const lang = this.value;
            i18next.changeLanguage(lang, function (err, t) {
              if (err) {
                showAlert("Fout bij het switchen van taal: " + err, "danger");
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
  document.title = `${config.applicationConfig.appName} | ${config.applicationConfig.appVersion}`;

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

// Show alert
function showAlert(message, type) {
  const wrapper = document.createElement("div");
  const alertPlaceholder = document.getElementById("liveAlertPlaceholder");
  console.error(message);
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    "</div>",
  ].join("");

  alertPlaceholder.append(wrapper);
}