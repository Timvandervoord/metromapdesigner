import metromap from './classes/metromap.js';
import MetromapImportExport from './classes/importexport.js';
import stateManager from './classes/stateManager.js';
import * as helpers from './common.js';
import * as config from './config.js';

/**
 * @class
 * @description
 * The `metromapdesigner` class provides tools for creating and managing metro maps using an SVG-based interface.
 * It supports state management, event handling, metroline and station customization, and import/export operations.
 *
 * The class facilitates intuitive interactions with the map by supporting various tools such as drawing, erasing,
 * and editing elements. It also offers hooks for responding to specific application events like state changes
 * or map loading.
 *
 * @example
 * // Create a new instance of metromapdesigner
 * const container = document.getElementById('map-container');
 * const designer = new metromapdesigner(container);
 *
 * // Load a default map
 * designer.loadMap('<svg>...</svg>');
 *
 * @property {Object} map - Reference to the current map being worked on.
 * @property {HTMLElement} container - Reference to the container element containing the metromap SVG.
 * @property {string} currentMetrolineColor - The default color for new metro lines.
 * @property {string} currentStationShape - The default shape for new stations ("normal", "connection", "end", or "start").
 * @property {string} selectedTool - The currently selected tool (e.g., "metrolineTool", "eraserTool").
 * @property {Object} mousePosition - The current mouse position on the canvas.
 * @property {boolean} draggingStation - Indicates whether a station is being dragged.
 * @property {boolean} draggingElement - Indicates whether a canvas element is being dragged.
 * @property {boolean} draggingMetroline - Indicates whether a metroline is being dragged.
 * @property {boolean} drawingLine - Indicates whether a metroline is being drawn.
 * @property {Object} hooks - A collection of event hooks to notify state changes (`draggingStation`, `draggingLine`, `mapLoaded`).
 * @property {metromapImportExport} importExport - Instance for importing and exporting metro maps.
 * @property {stateManager} stateManager - Instance for managing state changes (undo/redo functionality).
 */
export default class MetroMapDesigner {

    // References to objects and classes
    map; // Reference to the current map we're workin on
    container; // Reference to the container element containing the metromap SVG
    defaultMap; // Contains svg code of a default map for clearing of the map
    importExport; // Reference to importExport instance
    stateManager; // Refernece to the statemanager

    // Working data
    currentMetrolineColor     = "rgb(240, 137, 0)";
    currentStationShape       = "normal";
    currentMetrolineDrawing   = null;
    selectedTool              = "metrolineTool";
    mousePosition             = {};

    // Keep track of what item we are dragging or drawing around the canvas
    draggingStation = false;
    draggingElement = false;
    draggingMetroline = false;
    drawingLine = false;

    // CONSTRUCTOR AND INITIALIZATION

    /**
     * @constructor
     * @description
     * Initializes a new instance of the `metromapdesigner` class. Sets up the container element,
     * import/export utility, and state manager for managing map design operations.
     *
     * @param {HTMLElement} containerElement - The DOM element that will serve as the container for the metromap SVG.
     */
    constructor(containerElement) {
          this.container = containerElement;
          this.importExport = new MetromapImportExport();
          this.stateManager = new stateManager(config.applicationConfig.maxStateStackSize, true);
          this.currentMetrolineColor = config.metrolineConfig.defaultColor;
    }

    /**
     * Sets up event listeners for user interactions with the map's SVG element.
     *
     * @description
     * This function attaches event listeners to the SVG element within the map container to handle
     * various user interactions such as mouse and touch events. The events are delegated to handler 
     * methods like `mouseDownCanvas`, `mouseMoveCanvas`, `mouseUpCanvas`, and `mouseClickCanvas`.
     * These handlers manage actions such as drawing, selecting, or manipulating elements on the map.
     */
    setMapEventListeners() {
      // Set SVG element reference
      const svgelement = this.container.querySelector("svg");
      if (!svgelement) {
        throw new Error("SVG element not found in the container.");
      }

      // Attach mouse and touch event listeners
      svgelement.addEventListener("mousedown", this.mouseDownCanvas);
      svgelement.addEventListener("touchstart", this.mouseDownCanvas);
      svgelement.addEventListener("touchstart", this.mouseClickCanvas); // Duplicate touchstart for mouseClickCanvas
      svgelement.addEventListener("mousemove", this.mouseMoveCanvas);
      svgelement.addEventListener("touchmove", this.mouseMoveCanvas);
      svgelement.addEventListener("mouseup", this.mouseUpCanvas);
      svgelement.addEventListener("touchend", this.mouseUpCanvas);
      svgelement.addEventListener("mouseleave", this.mouseUpCanvas);
      svgelement.addEventListener("touchCancel", this.mouseUpCanvas);
      svgelement.addEventListener("click", this.mouseClickCanvas);
    }

    // Hooks and state management

    /**
     * Hook functions to notify state changes. Hooks are stored by event name.
     * @type {Object}
     */
    hooks = {
          draggingStation: [],
          draggingLine: [],
          mapLoaded: []
    };

    /**
     * @function addHook
     * @description
     * Adds a hook for a specific event to notify state changes.
     *
     * @param {string} event - The event name to register the hook for.
     * @param {Function} callback - The callback function to execute when the event is triggered.
     * @throws {Error} Throws an error if the event name is invalid.
     */
    addHook(event, callback) {
      if (this.hooks[event]) {
          this.hooks[event].push(callback);
      } else {
          throw new Error(`Invalid event name: ${event}`);
      }
    }

    /**
     * @function runHooks
     * @description
     * Executes all registered hooks for a specific event.
     *
     * @param {string} event - The event name to trigger hooks for.
     * @param {any} data - The data to pass to the hooks.
     */
    runHooks(event, data) {
        if (this.hooks[event]) {
            this.hooks[event].forEach((hook) => hook(data));
        }
    }

    /**
     * @function undo
     * @description
     * Reverts the map to its previous state using the `stateManager`. If a previous state exists, it is loaded and replaces the current map state.
     */
    undo() {
      const prevState = this.stateManager.revertState(this.map);
      if (prevState) {
        this.loadMap(prevState);
      }
    }

    // TOOL MANAGEMENT

    /**
     * @function addMetrolineColor
     * @description
     * Adds a new color to the metroline colors array if it doesn't already exist.
     *
     * @param {string} color - The color to add in "rgb(255, 0, 0)" format.
     * @returns {boolean} Returns `true` if the color was added, `false` if it already exists.
     */
    addMetrolineColor(color) {
      const colors = config.applicationConfig.metrolineColors;

      if (colors.includes(color)) {
        return false;
      }

      colors.push(color);
      return true;
    }

    /**
     * @function getAllMetrolineColors
     * @description
     * Retrieves all available metroline colors from the application configuration.
     *
     * @returns {Array<string>} An array of metroline color strings.
     */
    getAllMetrolineColors() {
      return config.applicationConfig.metrolineColors;
    }

    /**
     * @function setMetrolineColor
     * @description
     * Sets the current color for the metroline being drawn.
     *
     * @param {string} newColor - The new metroline color in "rgb(0-255, 0-255, 0-255)" format.
     * @throws {Error} Throws an error if the color is not in RGB format.
     */
    setMetrolineColor(newColor = "rgb(0, 0, 0)") {
      if (!helpers.isRgb(newColor)) {
        throw new Error("Color not in RGB format");
      }
      this.currentMetrolineColor = newColor;
    }

    /**
     * @function getDefaultStationShape
     * @description
     * Retrieves the default shape for new stations.
     *
     * @returns {string} The current default station shape.
     */
    getDefaultStationShape() {
      return this.currentStationShape;
    }

    /**
     * @function setDefaultStationShape
     * @description
     * Sets the default shape for new stations.
     *
     * @param {string} shape - The shape to set ("normal", "connection", "end", or "start").
     * @throws {Error} Throws an error if the provided shape is invalid.
     */
    setDefaultStationShape(shape) {
      if (shape === "normal" || shape === "connection" || shape === "end" || shape === "start") {
        this.currentStationShape = shape;
      } else {
        throw new Error("setDefaultStationShape: Invalid station shape");
      }
    }

    /**
     * Sets the current tool for the application.
     *
     * @param {string} name - The name of the tool to set.
     *
     * @description
     * This function updates the current tool used in the application based on the provided tool name. 
     * It retrieves the tool's settings (such as shape and cursor) from the application's configuration and applies them.
     */
    setTool(name) {
      // Retrieve tool settings from configuration
      const { shape, cursor = "pen" } = config.applicationConfig.toolSettings[name] || {};

      // Update the default station shape if applicable
      if (shape) this.setDefaultStationShape(shape);

      // Deselect all stations on the map
      this.map.unselectAllStations();

      // Update the selected tool
      this.selectedTool = name;

      // Change the cursor style
      this.container.style.cursor = `url('images/tools/${cursor}.cur'), auto`;
    }

    /**
     * Gets the currently selected tool.
     *
     * @returns {string} - The name of the currently selected tool.
     *
     * @description
     * This function returns the name of the tool currently in use by the application.
     */
    getTool() {
      return this.selectedTool;
    }

    // GRID AND MAP MANIPULATION


    /**
     * @function clearMap
     * @description
     * Clears the map by resetting it to the default map.
     */
    clearMap() {
      this.loadMap(this.defaultMap);
    }

    /**
     * @function gridToggle
     * @description
     * Toggles the visibility of the grid on the map canvas.
     */
    gridToggle()
    {
      this.map.gridToggle();
    }

    /**
     * @function getCanvasName
     * @description
     * Retrieves the title of the current map canvas.
     *
     * @returns {string} The title of the map.
     */
    getCanvasName() {
          return this.map.getTitle();
    }

    /**
     * @function canvasChangeSize
     * @description
     * Changes the size of the map canvas.
     *
     * @param {number} width - The new width of the canvas.
     * @param {number} height - The new height of the canvas.
     * @throws {Error} Throws an error if the width or height is invalid.
     */
    canvasChangeSize(width, height) {
      
      if (typeof width !== "number" || typeof height !== "number")
        throw new Error("Invalid height and width supplied for GLOBAL_METROMAP_DESIGNER_WORKING_DATA.canvas");
      this.map.gridRemove();

      // Set new width and height
      this.map.setDimensions(width, height);
    }

    /**
     * Replaces the logo on the metro map with a new image.
     * 
     * This method validates the provided image data and updates the SVG elements
     * to display the new logo. If the provided data is invalid, it logs an error.
     * 
     * @param {string} data - The image data (URL or base64 string) to set as the logo.
     */
    metroMapReplaceLogo(data) {
      if (!data || typeof data !== "string") {
          console.error("Invalid data provided for logo replacement.");
          return;
      }

      // Create a new Image object to validate the image data
      const img = new Image();

      // Handle successful image load
      img.onload = () => {
          try {
              // Save the current map state before changes
              this.stateManager.saveState(this.map);

              // Find the logo elements
              const imgLogo = this.container.querySelector("#imgLogo");
              const svgLogo = this.container.querySelector("#svgLogo");

              if (!imgLogo || !svgLogo) {
                  console.error("Logo elements not found in the SVG.");
                  return;
              }

              // Update the image logo and hide the SVG logo
              imgLogo.setAttribute("href", data);
              imgLogo.style.visibility = "visible";
              svgLogo.style.visibility = "hidden";

          } catch (error) {
              console.error("Error updating the metro map logo:", error);
          }
      };

      // Handle image loading error
      img.onerror = () => {
          console.error("Invalid image data. Unable to update the logo.");
      };

      // Start loading the image data
      img.src = data;
    }

    /**
     * Moves all elements on the map (stations and lines) along the grid by a specified direction and amount.
     * 
     * This function saves the current state of the map before making changes and moves all elements 
     * by an offset based on the grid size and the specified amount. The direction determines the axis and direction 
     * of the movement.
     * 
     * @param {string} direction - The direction to move elements on the grid. Must be one of: "up", "down", "left", "right".
     * @param {number} [amount=1] - The number of grid units to move. Defaults to 1 if not specified.
     * 
     * @throws {Error} If no direction is provided or if the direction is invalid.
     */
    moveEveryThingAlongGrid(direction, amount = 1) {
      if (!direction) {
          throw new Error('moveEveryThingAlongGrid called without a given direction');
      }

      // Save the current state of the map for undo/redo functionality
      this.stateManager.saveState(this.map);

      // Get the size of one grid unit
      const gridSize = config.gridConfig.size;
      const moveAmount = gridSize * amount;

      // Compute offsets based on the direction
      const offsets = {
          up: [0, -moveAmount],
          down: [0, moveAmount],
          left: [-moveAmount, 0],
          right: [moveAmount, 0],
      };

      const offset = offsets[direction];
      if (!offset) {
          throw new Error(`moveEveryThingAlongGrid called with an invalid direction: ${direction}`);
      }

      // Move stations and lines by the calculated offset
      this.map.moveStationsAndLinesByOffset(...offset);
    }

  /**
   * Enables inline text editing for an SVG <text> or <tspan> element.
   * 
   * This version uses the SVG coordinate system to correctly determine the element's
   * screen position, even when the SVG is transformed.
   *
   * @param {SVGTextElement|SVGTSpanElement} textElement - The <text> or <tspan> element to edit.
   * @param {HTMLElement} container - The container of the SVG element.
   * @param {Function} onSave - Callback function to call after saving changes.
   */
  enableInlineTextEditing(textElement, container, onSave) {
    // Determine the bounding box of the element in its own coordinate system
    const bbox = textElement.getBBox();

    // Get the owning SVG element (which holds the proper coordinate system)
    const svg = textElement.ownerSVGElement;
    if (!svg) {
      console.error("No owner SVG element found.");
      return;
    }

    // Create an SVGPoint at the top-left of the text element's bounding box
    const point = svg.createSVGPoint();
    point.x = bbox.x;
    point.y = bbox.y;
    
    // Transform the point from the text element's coordinate space to screen coordinates.
    // getScreenCTM() returns the matrix that maps the element's coordinates to screen coordinates.
    const screenPoint = point.matrixTransform(textElement.getScreenCTM());

    // Include the window scroll offsets to get absolute page coordinates.
    const x = screenPoint.x + window.scrollX;
    const y = screenPoint.y + window.scrollY;

    // If the element is a <tspan>, fall back to its parent <text> for style attributes.
    const parentText = textElement.tagName.toLowerCase() === "tspan" ? textElement.parentNode : textElement;

    // Create an input element for inline editing.
    const input = document.createElement("input");
    input.type = "text";
    input.value = textElement.textContent;

    // Position and style the input element
    input.style.position = "absolute";
    input.style.left = `${x}px`;
    // Adjust y by subtracting bbox.height to roughly align with the text baseline.
    input.style.top = `${y}px`;
    // Provide extra width for better usability.
    input.style.width = `${bbox.width + 100}px`;
    input.style.fontSize = `${parentText.getAttribute("font-size") || 16}px`;
    input.style.fontFamily = `${parentText.getAttribute("font-family") || "Arial"}`;
    input.style.border = "1px solid #ccc";
    input.style.padding = "2px";
    input.style.background = "#fff";
    input.style.zIndex = "1000";
    input.style.boxSizing = "border-box";

    // Append the input element to the document.
    document.body.appendChild(input);

    // Stop propagation to prevent unwanted blur events.
    input.addEventListener("mousedown", (event) => event.stopPropagation());
    input.addEventListener("click", (event) => event.stopPropagation());

    let isRemoved = false;

    const saveChanges = () => {
      if (isRemoved) return;
      isRemoved = true;
      // Assuming stateManager and map are defined in the context of this class
      this.stateManager.saveState(this.map);
      textElement.textContent = input.value; // Update the SVG text content
      onSave?.();
      input.remove();
      this.map.legenda.updateLegenda();
      this.map.legenda.resize();
    };

    // Focus the input after adding it to the DOM and bind event listeners.
    setTimeout(() => {
      input.focus();
      input.addEventListener("blur", saveChanges);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") saveChanges();
      });
    }, 0);
  }

    // MOUSE EVENT HANDLERS

    /**
     * @function mouseDownCanvas
     * @description
     * Handles the `mousedown` or `touchstart` event on the map canvas. 
     * Depending on the selected tool, it performs actions such as starting a metroline drawing, 
     * preparing elements for dragging, or removing elements.
     *
     * @param {MouseEvent | TouchEvent} e - The event object representing the mouse or touch interaction.
     *
     * @throws {Error} Throws an error if an invalid direction or metroline is detected.
     */
    mouseDownCanvas = (e) => {
      // Helper function to check if element is a polyline with a metrolineid attribute
      const isMetroline = (el) =>
        el instanceof SVGElement &&
        el.tagName.toLowerCase() === "polyline" &&
        el.hasAttribute("metrolineid");

      // Helper function to check if element is a station
      const isStationGroup = (el) =>
        el instanceof SVGElement && el.getAttribute("class") === "stationGroup";

      // Update mouse position
      this.mousePosition = helpers.getMousePos(e, this.map);

      // Perform metroline drawing
      if(this.selectedTool === "metrolineTool") {
          this.stateManager.saveState(this.map);
          this.map.startDrawMetroline(this.mousePosition, this.currentMetrolineColor);
          this.drawingLine = true;
          return;
      }

      // If no element is selected, exit early
      let selectedElement = helpers.determineEditableElement(e.target);
      if(!selectedElement) return;

      // What to do?
      switch (this.selectedTool) {
        case "eraserTool":
          if (isStationGroup(selectedElement)) {
              // Save state before changes
              this.stateManager.saveState(this.map);
              // Remove station by groupElement
              this.map.removeStationByGroupElement(selectedElement);
              break;
          }
          if (isMetroline(selectedElement)) {
              // Save state before changes
              this.stateManager.saveState(this.map);
              this.map.removeLineSegment(selectedElement);
          }
          break;

        case "moveTool":
        case "stationEditTool":
        case "textEditTool":

          // Save current state before changes
          this.stateManager.saveState(this.map);

          if (isStationGroup(selectedElement)) {
            // Find and select station
            const station = this.map.findAndSelectStation(selectedElement);
            if(station) {
               // Station found, continue
               this.map.prepareStationMove(this.mousePosition);
               this.draggingStation = true;
            }
            break;
          }

          if (this.selectedTool === "moveTool" && isMetroline(selectedElement)) {
            // Start moving a metroline

            // Find the line we are moving
            const line = this.map.getMetrolineWithId(selectedElement.getAttribute('metrolineid'));

            // Check if we found a line
            if(!line) throw new Error('Moving metroline: but corresponding line not found? '+ selectedElement);

            // Select it and prepare to move it
            this.map.selectMetroline(line);
            this.map.prepareMoveMetroline(this.mousePosition);
            this.draggingMetroline = true;
            break;
          }

          // If neither station nor polyline, move a canvas element
          this.map.prepareMoveCanvasElement(selectedElement, this.mousePosition);
          this.draggingElement = true;
          break;

        default:
          // No action needed for other tools
          break;
      }
    };

    /**
     * @function mouseClickCanvas
     * @description
     * Handles the `click` or `touchstart` event on the map canvas. 
     * Depending on the selected tool, it performs actions such as enabling inline text editing 
     * or adding new stations to the map.
     *
     * @param {MouseEvent | TouchEvent} e - The event object representing the mouse or touch interaction.
     */
    mouseClickCanvas = (e) => {
      // Prevent link clicking
      if (e.target.tagName === "a" || e.target.closest("a")) {
            // Prevent the default link action
            e.preventDefault();
      }
    
      // Update mouse position
      this.mousePosition = helpers.getMousePos(e, this.map);
      switch (this.selectedTool) {
            case "textEditTool":
              // If no element is selected, exit early
              let selectedElement = helpers.determineEditableTextElement(e.target);
              if (!selectedElement) return;
          
              // Inline text editing for non-station text and tspan elements
              if (
                  (selectedElement.tagName.toLowerCase() === "text" || selectedElement.tagName.toLowerCase() === "tspan") &&
                  !helpers.elementIsPartOfGroup(selectedElement, "stationGroup")
              ) {
                  // Save state before changes
                  this.stateManager.saveState(this.map);
          
                  // Enable inline text editing
                  this.enableInlineTextEditing(selectedElement, this.container);
              }
              break;
            case "stationTool":
            case "transferStationTool":
            case "normalStationTool":
            case "startStationTool":
            case "endStationTool":
            case "connectionStationTool":
              this.addStationHandler(this.mousePosition);
              break;
            default:
              break;
      }
    }

    /**
     * @function mouseMoveCanvas
     * @description
     * Handles the `mousemove` or `touchmove` event on the map canvas. Updates the position of elements being dragged or drawn.
     *
     * @param {MouseEvent | TouchEvent} e - The event object representing the mouse or touch interaction.
     */
    mouseMoveCanvas = (e) => {
      // Update mouse position
      this.mousePosition = helpers.getMousePos(e, this.map);

      // What to do?
      if (this.draggingElement) this.map.moveCanvasElement(this.mousePosition);
      if (this.draggingStation) this.map.moveStation(this.mousePosition);
      if (this.draggingMetroline) this.map.moveMetroline(this.mousePosition);
      if (this.drawingLine) this.map.drawMetroline(this.mousePosition);
    }

    /**
     * @function mouseUpCanvas
     * @description
     * Handles the `mouseup`, `mouseleave`, `touchend`, or `touchleave` event on the map canvas. 
     * Finalizes dragging or drawing operations.
     *
     * @param {MouseEvent | TouchEvent} e - The event object representing the mouse or touch interaction.
     */
    mouseUpCanvas = (e) => {
      // Update mouse position
      this.mousePosition = helpers.getMousePos(e, this.map);
      if (this.draggingElement) {
        this.map.endMoveCanvasElement();
        this.draggingElement = false;
      }
      if (this.draggingMetroline) {
        this.map.endMoveMetroline(this.mousePosition);
        this.draggingMetroline = false;
      }
      if (this.draggingStation) {
        this.map.endMoveStation(this.mousePosition);
        this.draggingStation = false;
      }
      if (this.drawingLine) {

        this.map.endDrawMetroline(this.mousePosition);
        this.drawingLine = false;

      }
    }

    // STATION AND METROLINE MANAGEMENT

    /**
     * @function addStationHandler
     * @description
     * Adds a new station to the map at the specified position.
     *
     * @param {Object} mouseposition - The x and y coordinates for the new station.
     * @throws {Error} Throws an error if the mouse position is invalid.
     */
    addStationHandler(mouseposition) {
        // Validate inputs
        if (!mouseposition || typeof mouseposition.x !== 'number' || typeof mouseposition.y !== 'number') {
          throw new Error("Invalid mousePosition: must contain valid x and y properties.");
        }

        // Save state
        this.stateManager.saveState(this.map);
        
        // Create station config
        const stationConfig = {
          shape : this.currentStationShape,
          x : mouseposition.x,
          y : mouseposition.y
        }

        // Pass to map try to add station
        const station = this.map.addNewStation(stationConfig);

    }

    /**
     * @function changeSelectedStationProperty
     * @description
     * Updates a property of the currently selected station.
     *
     * @param {string} property - The property to update (e.g., "name", "shape", "type").
     * @param {any} data - The new value for the property.
     * @returns {boolean} Returns `true` if the property was updated successfully, `false` otherwise.
     */
    changeSelectedStationProperty(property, data) {
      if(!property) {
        throw new Error('changeStationProperty called without a property specification');
      }

      const station = this.map.getSelectedStation();
      if(!station) {
        throw new Error('changeStationProperty called without a station selected');
      }

      this.stateManager.saveState(this.map);

      // What are we changing?
      switch(property) {
          case "name":
            station.setName(data);
            break;
          case "shape":
            station.setShape(data);
            this.map.updateStationMetrolineIds(station);
            break;
          case "rotation":
            station.setOrientation(data);
            if(station.getShape() === "connection") this.map.updateStationMetrolineIds(station);
            break;
          case "date":
            station.setDate(data);
            break;
          case "type":
            station.setType(data);
            break;
          case "width":
            station.setWidth(data);
            this.map.updateStationMetrolineIds(station);
            break;
          case "description":
            station.setDescription(data);
            break;
          case "link":
            station.setLink(data);
            break;
          default:
            // Nothing changed
            return false;
      }

      // Done
      return true;
    }

    // IMPORT EXPORT FUNCTIONS

    /**
     * @function loadMap
     * @description
     * Loads the provided SVG content into the map container. If no content is provided, the default map is loaded.
     *
     * @param {string} [svgcontent=null] - The SVG content to load.
     * @throws {Error} Throws an error if the provided content is not valid SVG.
     */
    loadMap(svgcontent = null) {
        if(!svgcontent) svgcontent = this.defaultMap;

        // Check if content is SVG
        if (svgcontent.trim().substring(0, 4).toLowerCase() !== "<svg") {
        alert("Invalid content. Only SVG images are accepted.");
        return;
        }
    
        // Load svgcontent in SVG container
        this.container.innerHTML = svgcontent;
        this.map = new metromap(this, this.container.querySelector("svg"));
        this.setMapEventListeners();

        // If there is no defaultmap set this as default map
        if(!this.defaultMap) this.defaultMap = svgcontent;

        // Run hooks for the 'save' event
        this.runHooks('mapLoaded', this.map);
    }

    /**
     * Clears the map and loads a new map from a JSON string.
     *
     * @param {string} jsonString - The JSON string representing the metro map.
     * @throws Will throw an error if the JSON string is invalid or loading fails.
     */
    loadJSON(jsonString) {
      try {
          // Clear the current map by resetting it to the default state
          this.clearMap();

          // Load the new map from the provided JSON string using the importExport class
          this.importExport.importJSON(this.map, jsonString);

      } catch (error) {
          console.error("Error loading map from JSON:", error);
          throw new Error(`Failed to load map from JSON: ${error.message}`);
      }
    }

    /**
     * @function loadMapFromUrl
     * @description
     * Fetches and loads an SVG map from the specified URL.
     *
     * @param {string} url - The URL to fetch the SVG content from.
     * @throws {Error} Throws an error if the SVG content cannot be retrieved.
     */
    async loadMapFromUrl(url) {
      try {
        const svgContent = await this.importExport.getCanvasFromUrl(url);
        this.loadMap(svgContent);
      } catch (error) {
        throw new Error("Error fetching the metro map from the given URL: " + error);
      }
    }

    /**
     * @function loadMapWithShareCode
     * @description
     * Loads a map from a shared code.
     *
     * @param {string} code - The share code for the map.
     * @throws {Error} Throws an error if the share code is invalid or expired.
     */
    loadMapWithSvgCode(code) {
      // Clear map first
      this.clearMap();
      const svgContent = this.importExport.retrieveAndLoadSVG(code);
      this.loadMap(svgContent);
    }

    /**
     * @function loadMapWithShareCode
     * @description
     * Loads a map from a shared code.
     *
     * @param {string} code - The share code for the map.
     * @throws {Error} Throws an error if the share code is invalid or expired.
     */
    loadMapWithJsonCode(code) {
      // Clear map first
      this.clearMap();
      this.importExport.retrieveAndImportJSON(this.map, code);
    }

    /**
     * @function getShareLink
     * @description
     * Generates a shareable link for the current map.
     *
     * @returns {string} The shareable link.
     * @throws {Error} Throws an error if the map cannot be saved.
     */
    getShareLink() {
      let code = this.importExport.getShareLink(this.map);
      if(code) return code;
      else throw new Error("Fout bij opslaan van de metrokaart", "danger");
    }

    /**
     * @function getMapContentSVG
     * @description
     * Exports the current map content as an SVG string.
     *
     * @returns {string} The SVG representation of the map.
     */
    getMapContentSVG() {
      return this.importExport.getSVG(this.map);
    }

    /**
     * @function getCanvasContentPng
     * @description
     * Exports the current map content as a PNG image.
     *
     * @returns {Blob} A PNG image of the map.
     */
    getCanvasContentPng() {
      return this.importExport.getPng(this.map);
    }

}