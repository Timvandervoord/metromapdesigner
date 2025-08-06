import metromap from './classes/metromap.js';
import MetromapImportExport from './classes/importexport.js';
import stateManager from './classes/stateManager.js';
import * as helpers from './common.js';
import * as config from './config.js';
import { enableInlineTextEditing as enableTextEditing } from './common.js';

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
    currentSvgElement; // Reference to current SVG element for event cleanup

    // Working data
    currentMetrolineColor     = "rgb(240, 137, 0)";
    currentStationShape       = "normal";
    currentMetrolineDrawing   = null;
    selectedTool              = "metrolineTool";
    mousePosition             = {};
    
    // Loading state management
    isLoadingMap              = false;
    loadingOperations         = new Set(); // Track concurrent operations

    // Keep track of what item we are dragging or drawing around the canvas
    draggingStation = false;
    draggingElement = false;
    draggingMetroline = false;
    drawingLine = false;
    scalingImage = null;
    movingImage = null;
    currentSelectedImage = null;
    resizeHandles = null;
    currentResizeHandle = null;
    initialMousePosition = null;
    imageTransform = null;
    imageCenter = null;

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
          this.currentSvgElement = null;
    }

    /**
     * Destructor method to clean up resources and prevent memory leaks.
     *
     * @description
     * This method should be called when the MetroMapDesigner instance is no longer needed.
     * It removes all event listeners and clears references to prevent memory leaks.
     */
    destroy() {
        // Remove event listeners
        this.removeMapEventListeners();
        
        // Clear references
        this.map = null;
        this.stateManager = null;
        this.importExport = null;
        this.container = null;
        this.defaultMap = null;
        
        // Clear hooks
        if (this.hooks) {
            Object.keys(this.hooks).forEach(key => {
                this.hooks[key] = [];
            });
        }
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
      // Remove existing event listeners first to prevent memory leaks
      this.removeMapEventListeners();

      // Set SVG element reference
      const svgelement = this.container.querySelector("svg");
      if (!svgelement) {
        throw new Error("SVG element not found in the container.");
      }

      // Store reference for cleanup
      this.currentSvgElement = svgelement;

      // Attach mouse and touch event listeners
      svgelement.addEventListener("mousedown", this.mouseDownCanvas);
      svgelement.addEventListener("touchstart", this.mouseDownCanvas);
      // Fixed: Remove duplicate touchstart listener that was causing double events
      svgelement.addEventListener("mousemove", this.mouseMoveCanvas);
      svgelement.addEventListener("touchmove", this.mouseMoveCanvas);
      svgelement.addEventListener("mouseup", this.mouseUpCanvas);
      svgelement.addEventListener("touchend", this.mouseUpCanvas);
      svgelement.addEventListener("mouseleave", this.mouseUpCanvas);
      svgelement.addEventListener("touchcancel", this.mouseUpCanvas); // Fixed: lowercase 'c'
      svgelement.addEventListener("click", this.mouseClickCanvas);
    }

    /**
     * Removes event listeners from the current SVG element to prevent memory leaks.
     *
     * @description
     * This function should be called before replacing the SVG content to ensure
     * that event listeners attached to the old SVG element are properly cleaned up.
     */
    removeMapEventListeners() {
      if (!this.currentSvgElement) {
        return; // No SVG element to clean up
      }

      // Remove all event listeners that were added in setMapEventListeners
      this.currentSvgElement.removeEventListener("mousedown", this.mouseDownCanvas);
      this.currentSvgElement.removeEventListener("touchstart", this.mouseDownCanvas);
      this.currentSvgElement.removeEventListener("mousemove", this.mouseMoveCanvas);
      this.currentSvgElement.removeEventListener("touchmove", this.mouseMoveCanvas);
      this.currentSvgElement.removeEventListener("mouseup", this.mouseUpCanvas);
      this.currentSvgElement.removeEventListener("touchend", this.mouseUpCanvas);
      this.currentSvgElement.removeEventListener("mouseleave", this.mouseUpCanvas);
      this.currentSvgElement.removeEventListener("touchcancel", this.mouseUpCanvas);
      this.currentSvgElement.removeEventListener("click", this.mouseClickCanvas);

      // Clear the reference
      this.currentSvgElement = null;
    }

    // Hooks and state management

    /**
     * Hook functions to notify state changes. Hooks are stored by event name.
     * @type {Object}
     */
    hooks = {
          draggingStation: [],
          draggingLine: [],
          mapLoaded: [],
          loadingStateChanged: []
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
        // Undo state is trusted - no sanitization needed
        this.loadMap(prevState, true);
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
      if (this.map) {
        this.map.unselectAllStations();
      }

      // Clean up resize handles when switching away from moveTool
      if (name !== "moveTool") {
        this.removeResizeHandles();
      }

      // Update the selected tool
      this.selectedTool = name;

      // Change the cursor style with fallbacks for better browser compatibility
      this.setCursor(cursor);
    }

    /**
     * Sets the cursor style with multiple fallback options for better browser compatibility.
     *
     * @param {string} cursorName - The name of the cursor (e.g., "eraser", "pen", "move").
     */
    setCursor(cursorName) {
      // Define cursor mappings with fallbacks
      const cursorMap = {
        eraser: ['url("images/tools/eraser.png") 8 8', 'url("images/tools/eraser.cur")', 'crosshair'],
        pen: ['url("images/tools/pen.cur")', 'crosshair'],
        move: ['url("images/tools/move.cur")', 'move'],
        arrow: ['url("images/tools/arrow.cur")', 'pointer'],
        text: ['url("images/tools/text.cur")', 'text']
      };

      // Get cursor options with fallbacks
      const cursorOptions = cursorMap[cursorName] || ['crosshair'];
      
      // Set cursor with all fallback options
      const cursorValue = cursorOptions.join(', ');
      this.container.style.cursor = cursorValue;
    }

    /**
     * Removes the style attribute from the loaded SVG element to prevent cursor conflicts.
     * This ensures tool cursors work correctly without interfering with SVG content styling.
     */
    cleanSvgCursorStyles() {
      const svgElement = this.container.querySelector("svg");
      if (!svgElement) return;

      // Remove the style attribute from the SVG element
      if (svgElement.hasAttribute('style')) {
        svgElement.removeAttribute('style');
      }
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
      // Default map is trusted - no sanitization needed
      this.loadMap(this.defaultMap, true);
    }

    /**
     * @function gridToggle
     * @description
     * Toggles the visibility of the grid on the map canvas.
     */
    gridToggle()
    {
      if (!this.map) {
        console.warn('gridToggle: No map available');
        return;
      }
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
          if (!this.map) {
            console.warn('getCanvasName: No map available');
            return 'Untitled Map';
          }
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
      
      if (!this.map) {
        console.warn('canvasChangeSize: No map available');
        return;
      }
      
      this.map.gridRemove();

      // Set new width and height
      this.map.setDimensions(width, height);
    }

    /**
     * Adds an image to the metro map.
     * 
     * This method validates the provided image data and creates a new image element
     * in the imageLayer. If the provided data is invalid, it logs an error.
     * 
     * @param {string} data - The image data (URL or base64 string) to add as an image.
     */
    metroMapAddImage(data) {
      if (!data || typeof data !== "string") {
          console.error("Invalid data provided for image.");
          return;
      }

      // Create a new Image object to validate the image data
      const img = new Image();

      // Handle successful image load
      img.onload = () => {
          try {
              // Save the current map state before changes
              this.stateManager.saveState(this.map);

              // Find the imageLayer
              const imagesLayer = this.container.querySelector("#imageLayer");
              if (!imagesLayer) {
                  console.error("ImageLayer not found in the SVG.");
                  return;
              }

              // Create new image element
              const newLogo = document.createElementNS("http://www.w3.org/2000/svg", "image");
              newLogo.setAttribute("id", "imgLogo");
              newLogo.setAttribute("href", data);
              newLogo.setAttribute("transform", "translate(1100, 60)");
              newLogo.setAttribute("height", "80px");
              
              // Add the new logo to the imageLayer
              imagesLayer.appendChild(newLogo);

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
     * Migrates old logo layer to new imageLayer structure.
     * 
     * This method checks for the old <g id="logo"> structure and converts it to the new
     * <g id="imageLayer"> structure to maintain backward compatibility with old metro maps.
     */
    migrateLogoLayerToImages() {

        if (!this.container) {
            return;
        }

        const svg = this.container.querySelector("svg");
        if (!svg) {
            return;
        }

        const overlay = svg.querySelector("#overlay");
        if (!overlay) {
            return;
        }

        // Check if old logo layer exists
        const oldLogoLayer = overlay.querySelector("#logo");
        if (!oldLogoLayer) {
            return; // No migration needed
        }

        // Rename the logo layer to imageLayer
        oldLogoLayer.setAttribute("id", "imageLayer");
        
        // Convert any image children from x/y to transform
        const imageChildren = oldLogoLayer.querySelectorAll('image');
        imageChildren.forEach(child => {
            const x = child.getAttribute('x');
            const y = child.getAttribute('y');
            
            if (x !== null && y !== null) {
                child.setAttribute('transform', `translate(${x}, ${y})`);
                child.removeAttribute('x');
                child.removeAttribute('y');
            }
        });

        console.log("Migrated old logo layer to new imageLayer structure");
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

      if (!this.map) {
        console.warn('moveEveryThingAlongGrid: No map available');
        return;
      }

      // Save the current state of the map for undo/redo functionality
      if (this.stateManager) {
        this.stateManager.saveState(this.map);
      }

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
   * Uses the utility function from common.js for simplified and maintainable code.
   *
   * @param {SVGTextElement|SVGTSpanElement} textElement - The <text> or <tspan> element to edit.
   * @param {Function} onSave - Callback function to call after saving changes.
   */
  enableInlineTextEditing(textElement, onSave) {
    enableTextEditing(textElement, {
      onSave,
      stateManager: this.stateManager,
      map: this.map
    });
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

      // Helper function to check if element is an image
      const isImage = (el) =>
        el instanceof SVGElement && el.tagName.toLowerCase() === "image";

      // Update mouse position
      if (!this.map) {
        console.warn('mouseDownCanvas: No map available');
        return;
      }
      
      this.mousePosition = helpers.getMousePos(e, this.map);

      // Perform metroline drawing
      if(this.selectedTool === "metrolineTool") {
          if (this.stateManager) {
            this.stateManager.saveState(this.map);
          }
          this.map.startDrawMetroline(this.mousePosition, this.currentMetrolineColor);
          this.drawingLine = true;
          return;
      }

      // Check if clicked on a resize handle first
      const resizePosition = this.getResizeHandlePosition(e.target);
      if (resizePosition && this.selectedTool === "moveTool") {
        // Find the currently selected image for resize handle
        const currentImage = this.findCurrentSelectedImage();
        if (currentImage) {
          // Start resizing from handle
          this.scalingImage = currentImage;
          this.currentResizeHandle = resizePosition;
          this.initialMousePosition = { ...this.mousePosition };
          
          // Get current transform values
          const transform = currentImage.getAttribute('transform') || '';
          const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          
          this.imageTransform = {
            translateX: translateMatch ? parseFloat(translateMatch[1]) : 0,
            translateY: translateMatch ? parseFloat(translateMatch[2]) : 0,
            scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1
          };
          
          return; // Exit early, we're handling resize
        }
      }

      // If no element is selected, exit early
      let selectedElement = helpers.determineEditableElement(e.target);
      if(!selectedElement) {
        // Remove resize handles when clicking on empty space
        this.removeResizeHandles();
        return;
      }

      // What to do?
      switch (this.selectedTool) {
        case "eraserTool":
          if (isStationGroup(selectedElement)) {
              // Save state before changes
              if (this.stateManager) {
                this.stateManager.saveState(this.map);
              }
              // Remove station by groupElement
              this.map.removeStationByGroupElement(selectedElement);
              break;
          }
          if (isMetroline(selectedElement)) {
              // Save state before changes
              if (this.stateManager) {
                this.stateManager.saveState(this.map);
              }
              this.map.removeLineSegment(selectedElement);
              break;
          }
          if (isImage(selectedElement)) {
              // Save state before changes
              if (this.stateManager) {
                this.stateManager.saveState(this.map);
              }
              // Remove image element
              selectedElement.remove();
              break;
          }
          break;

        case "moveTool":
        case "stationEditTool":
        case "textEditTool":

          // Save current state before changes
          if (this.stateManager) {
            this.stateManager.saveState(this.map);
          }

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

          if (this.selectedTool === "moveTool" && isImage(selectedElement)) {
            // Start moving the image
            this.movingImage = selectedElement;
            this.initialMousePosition = { ...this.mousePosition };
            
            // Get current transform values
            const transform = selectedElement.getAttribute('transform') || '';
            const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            const scaleMatch = transform.match(/scale\(([^)]+)\)/);
            
            this.imageTransform = {
              translateX: translateMatch ? parseFloat(translateMatch[1]) : 0,
              translateY: translateMatch ? parseFloat(translateMatch[2]) : 0,
              scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1
            };
            
            // Create resize handles for the selected image (removes old ones automatically)
            this.createResizeHandles(selectedElement);
            
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
                  this.enableInlineTextEditing(selectedElement);
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
      if (!this.map) {
        return; // Silently return if no map available during movement
      }
      
      this.mousePosition = helpers.getMousePos(e, this.map);

      // What to do?
      if (this.draggingElement) this.map.moveCanvasElement(this.mousePosition);
      if (this.draggingStation) this.map.moveStation(this.mousePosition);
      if (this.draggingMetroline) this.map.moveMetroline(this.mousePosition);
      if (this.drawingLine) this.map.drawMetroline(this.mousePosition);
      if (this.scalingImage && this.currentResizeHandle) this.resizeImageWithHandle(this.mousePosition);
      if (this.movingImage) this.moveImage(this.mousePosition);
    }

    /**
     * Scales an image based on mouse movement from the center point.
     * Calculates scale factor based on vertical mouse movement and updates the image transform.
     * 
     * @param {Object} mousePosition - Current mouse position {x, y}
     */
    scaleImage(mousePosition) {
      if (!this.scalingImage || !this.initialMousePosition || !this.imageTransform || !this.imageCenter) {
        return;
      }

      // Calculate distance moved (use Y movement for scaling, like in Illustrator)
      const deltaY = mousePosition.y - this.initialMousePosition.y;
      
      // Scale factor based on movement (make it sensitive but not too fast)
      const scaleFactor = 1 + (deltaY / 200); // 200px movement = 2x scale
      
      // Ensure minimum scale of 0.1 and maximum of 5
      const newScale = Math.max(0.1, Math.min(5, this.imageTransform.scale * scaleFactor));
      
      // Get image original dimensions
      const bbox = this.scalingImage.getBBox();
      const originalWidth = bbox.width;
      const originalHeight = bbox.height;
      
      // Calculate new position to keep image centered on the same point
      const scaleDiff = newScale - this.imageTransform.scale;
      const offsetX = -(originalWidth * scaleDiff) / 2;
      const offsetY = -(originalHeight * scaleDiff) / 2;
      
      const newTranslateX = this.imageTransform.translateX + offsetX;
      const newTranslateY = this.imageTransform.translateY + offsetY;
      
      // Update transform attribute
      let transform = `translate(${newTranslateX}, ${newTranslateY})`;
      if (newScale !== 1) {
        transform += ` scale(${newScale})`;
      }
      
      this.scalingImage.setAttribute('transform', transform);
    }

    /**
     * Creates resize handles for an image element
     * @param {SVGImageElement} imageElement - The image element to create handles for
     */
    createResizeHandles(imageElement) {
      this.removeResizeHandles();
      
      if (!this.map?.svgMap) return;
      
      this.currentSelectedImage = imageElement;
      const bbox = this.getImageBounds(imageElement);
      
      // Create container group for handles
      this.resizeHandles = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.resizeHandles.setAttribute("class", "resize-handles");
      
      const handleSize = 8;
      const offset = handleSize / 2;
      
      // Handle configurations: [position, cursor, x, y]
      const handleConfigs = [
        ["nw", "nw-resize", bbox.x - offset, bbox.y - offset],
        ["ne", "ne-resize", bbox.x + bbox.width - offset, bbox.y - offset],
        ["se", "se-resize", bbox.x + bbox.width - offset, bbox.y + bbox.height - offset],
        ["sw", "sw-resize", bbox.x - offset, bbox.y + bbox.height - offset]
      ];
      
      handleConfigs.forEach(([position, cursor, x, y]) => {
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        Object.assign(handle, {
          setAttribute: handle.setAttribute.bind(handle)
        });
        
        const attributes = {
          x, y, 
          width: handleSize,
          height: handleSize,
          fill: "#4a9eff",
          stroke: "#ffffff",
          "stroke-width": "1",
          cursor,
          "data-resize-position": position,
          class: "resize-handle"
        };
        
        Object.entries(attributes).forEach(([key, value]) => 
          handle.setAttribute(key, value)
        );
        
        this.resizeHandles.appendChild(handle);
      });
      
      this.map.svgMap.appendChild(this.resizeHandles);
    }
    
    /**
     * Removes existing resize handles
     */
    removeResizeHandles() {
      if (this.resizeHandles) {
        this.resizeHandles.remove();
        this.resizeHandles = null;
      }
      this.currentSelectedImage = null;
    }
    
    /**
     * Gets the actual bounds of an image including transforms
     * @param {SVGImageElement} imageElement - The image element
     * @returns {Object} Bounding box with x, y, width, height
     */
    getImageBounds(imageElement) {
      const transform = imageElement.getAttribute('transform') || '';
      const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      
      const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
      const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      const bbox = imageElement.getBBox();
      
      return {
        x: translateX,
        y: translateY,
        width: bbox.width * scale,
        height: bbox.height * scale
      };
    }
    
    /**
     * Checks if a click target is a resize handle
     * @param {SVGElement} target - The clicked element
     * @returns {string|null} The resize position or null
     */
    getResizeHandlePosition(target) {
      if (target && target.classList && target.classList.contains('resize-handle')) {
        return target.getAttribute('data-resize-position');
      }
      return null;
    }
    
    /**
     * Resizes an image based on handle position and mouse movement
     * @param {Object} mousePosition - Current mouse position
     */
    resizeImageWithHandle(mousePosition) {
      if (!this.scalingImage || !this.currentResizeHandle || !this.initialMousePosition || !this.imageTransform) {
        return;
      }
      
      const delta = {
        x: mousePosition.x - this.initialMousePosition.x,
        y: mousePosition.y - this.initialMousePosition.y
      };
      
      const bbox = this.scalingImage.getBBox();
      const currentSize = {
        width: bbox.width * this.imageTransform.scale,
        height: bbox.height * this.imageTransform.scale
      };
      
      // Handle configuration: [xMultiplier, yMultiplier, anchorX, anchorY]
      const handleConfig = {
        se: [1, 1, 0, 0],         // grow right+down, anchor top-left
        sw: [-1, 1, 1, 0],        // grow left+down, anchor top-right  
        ne: [1, -1, 0, 1],        // grow right+up, anchor bottom-left
        nw: [-1, -1, 1, 1]        // grow left+up, anchor bottom-right
      };
      
      const [xMult, yMult, anchorXRatio, anchorYRatio] = handleConfig[this.currentResizeHandle] || [1, 1, 0, 0];
      
      // Calculate scale factors for both dimensions
      const scaleX = (currentSize.width + delta.x * xMult) / currentSize.width;
      const scaleY = (currentSize.height + delta.y * yMult) / currentSize.height;
      
      // Use minimum scale to maintain aspect ratio
      const scaleFactor = Math.min(scaleX, scaleY);
      const newScale = Math.max(0.1, Math.min(5, this.imageTransform.scale * scaleFactor));
      
      // Calculate anchor point and new position
      const newSize = {
        width: bbox.width * newScale,
        height: bbox.height * newScale
      };
      
      const anchor = {
        x: this.imageTransform.translateX + currentSize.width * anchorXRatio,
        y: this.imageTransform.translateY + currentSize.height * anchorYRatio
      };
      
      const newTranslate = {
        x: anchor.x - newSize.width * anchorXRatio,
        y: anchor.y - newSize.height * anchorYRatio
      };
      
      // Apply transform
      const transform = `translate(${newTranslate.x}, ${newTranslate.y})${newScale !== 1 ? ` scale(${newScale})` : ''}`;
      this.scalingImage.setAttribute('transform', transform);
      
      this.updateResizeHandles();
    }
    
    /**
     * Updates resize handle positions for the current image
     */
    updateResizeHandles() {
      const targetImage = this.scalingImage || this.movingImage || this.currentSelectedImage;
      if (!this.resizeHandles || !targetImage) return;
      
      const bbox = this.getImageBounds(targetImage);
      const offset = 4; // handleSize / 2
      
      // Position mappings for handles in order: nw, ne, se, sw
      const positions = [
        [bbox.x - offset, bbox.y - offset],
        [bbox.x + bbox.width - offset, bbox.y - offset],
        [bbox.x + bbox.width - offset, bbox.y + bbox.height - offset],
        [bbox.x - offset, bbox.y + bbox.height - offset]
      ];
      
      this.resizeHandles.querySelectorAll('.resize-handle').forEach((handle, i) => {
        if (positions[i]) {
          handle.setAttribute('x', positions[i][0]);
          handle.setAttribute('y', positions[i][1]);
        }
      });
    }
    
    /**
     * Finds the currently selected image (the one with resize handles)
     * @returns {SVGImageElement|null} The currently selected image or null
     */
    findCurrentSelectedImage() {
      // Find image that currently has resize handles
      // We can track this by storing it when we create handles
      return this.currentSelectedImage || null;
    }

    /**
     * Moves an image based on mouse movement
     * @param {Object} mousePosition - Current mouse position
     */
    moveImage(mousePosition) {
      if (!this.movingImage || !this.initialMousePosition || !this.imageTransform) {
        return;
      }
      
      const deltaX = mousePosition.x - this.initialMousePosition.x;
      const deltaY = mousePosition.y - this.initialMousePosition.y;
      
      const newTranslateX = this.imageTransform.translateX + deltaX;
      const newTranslateY = this.imageTransform.translateY + deltaY;
      
      let transform = `translate(${newTranslateX}, ${newTranslateY})`;
      if (this.imageTransform.scale !== 1) {
        transform += ` scale(${this.imageTransform.scale})`;
      }
      
      this.movingImage.setAttribute('transform', transform);
      
      // Update resize handles position
      this.updateResizeHandles();
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
      if (this.map) {
        this.mousePosition = helpers.getMousePos(e, this.map);
      }
      
      if (this.draggingElement && this.map) {
        this.map.endMoveCanvasElement();
        this.draggingElement = false;
      }
      if (this.draggingMetroline && this.map) {
        this.map.endMoveMetroline(this.mousePosition);
        this.draggingMetroline = false;
      }
      if (this.draggingStation && this.map) {
        this.map.endMoveStation(this.mousePosition);
        this.draggingStation = false;
      }
      if (this.scalingImage) {
        // End image scaling
        this.scalingImage = null;
        this.currentResizeHandle = null;
        this.initialMousePosition = null;
        this.imageTransform = null;
        this.imageCenter = null;
      }
      if (this.movingImage) {
        // End image moving
        this.movingImage = null;
        this.initialMousePosition = null;
        this.imageTransform = null;
      }
      if (this.drawingLine && this.map) {
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

        if (!this.map) {
          console.warn('addStationHandler: No map available');
          return;
        }

        // Save state
        if (this.stateManager) {
          this.stateManager.saveState(this.map);
        }
        
        // Create station config
        const stationConfig = {
          shape : this.currentStationShape,
          x : mouseposition.x,
          y : mouseposition.y
        }

        // Pass to map try to add station
        this.map.addNewStation(stationConfig);

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

      if (!this.map) {
        console.warn('changeSelectedStationProperty: No map available');
        return false;
      }

      const station = this.map.getSelectedStation();
      if(!station) {
        throw new Error('changeStationProperty called without a station selected');
      }

      if (this.stateManager) {
        this.stateManager.saveState(this.map);
      }

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
     * Content from untrusted sources is automatically sanitized to prevent XSS attacks.
     *
     * @param {string} [svgcontent=null] - The SVG content to load.
     * @param {boolean} [trusted=false] - Whether the content is from a trusted source (skips sanitization).
     * @throws {Error} Throws an error if the provided content is not valid SVG.
     */
    loadMap(svgcontent = null, trusted = false) {
        if(!svgcontent) svgcontent = this.defaultMap;

        // Check if content is SVG
        if (svgcontent.trim().substring(0, 4).toLowerCase() !== "<svg") {
        alert("Invalid content. Only SVG images are accepted.");
        return;
        }
    
        // Clean up existing event listeners before replacing content
        this.removeMapEventListeners();
        
        // Sanitize untrusted content to prevent XSS attacks
        let finalSvgContent = svgcontent;
        if (!trusted) {
            try {
                finalSvgContent = helpers.sanitizeMapContent(svgcontent);
            } catch (error) {
                console.error('Failed to sanitize SVG content:', error);
                alert('Invalid or unsafe SVG content. Cannot load map.');
                return;
            }
        }
        
        // Load svgcontent in SVG container
        this.container.innerHTML = finalSvgContent;
        
        // Migrate old logo layer to new imageLayer if present
        this.migrateLogoLayerToImages();
        
        // Clean up any cursor styles from the loaded SVG that might interfere
        this.cleanSvgCursorStyles();
        
        this.map = new metromap(this, this.container.querySelector("svg"));
        this.setMapEventListeners();

        // Restore cursor for current tool (loadMap replaces container content, losing cursor style)
        if (this.selectedTool) {
            const { cursor = "pen" } = config.applicationConfig.toolSettings[this.selectedTool] || {};
            this.setCursor(cursor);
        }

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
     * Fetches and loads an SVG map from the specified URL with proper error handling and recovery.
     *
     * @param {string} url - The URL to fetch the SVG content from.
     * @param {boolean} [isDefault=false] - Whether this is loading the default map (enables fallback).
     * @throws {Error} Throws an error if the SVG content cannot be retrieved and no fallback is available.
     */
    async loadMapFromUrl(url, isDefault = false) {
      // Prevent concurrent map loading operations
      const operationId = `loadMapFromUrl_${url}_${Date.now()}`;
      
      if (this.isLoadingMap) {
        console.warn(`Map loading in progress, skipping concurrent request for: ${url}`);
        throw new Error('Map loading already in progress. Please wait for current operation to complete.');
      }
      
      this.isLoadingMap = true;
      this.loadingOperations.add(operationId);
      
      try {
        // Emit loading state to UI
        this.runHooks('loadingStateChanged', { loading: true, operation: 'loadMap', url });
        
        const svgContent = await this.importExport.getCanvasFromUrl(url);
        this.loadMap(svgContent, true); // URL content is already sanitized
        
        // Emit success state
        this.runHooks('loadingStateChanged', { loading: false, operation: 'loadMap', success: true, url });
      } catch (error) {
        // For default map loading, try fallback recovery
        if (isDefault && url !== 'sources/defaultCanvas.svg') {
          console.warn(`Failed to load default map from ${url}, trying fallback:`, error.message);
          try {
            await this.loadMapFromUrl('sources/defaultCanvas.svg', true);
            return; // Success with fallback
          } catch (fallbackError) {
            console.error('Fallback default map also failed:', fallbackError.message);
          }
        }
        
        // Create user-friendly error message based on error type
        let userMessage;
        switch (error.name) {
          case 'NetworkError':
            if (error.status === 404) {
              userMessage = `Map file not found. Please check the file path: ${url}`;
            } else if (error.status === 403) {
              userMessage = `Access denied to map file. Check permissions for: ${url}`;
            } else if (error.status >= 500) {
              userMessage = `Server error loading map. Please try again later.`;
            } else {
              userMessage = `Network error: ${error.message}`;
            }
            break;
          case 'SanitizationError':
            userMessage = `Invalid map file format. The file contains unsafe or malformed content.`;
            break;
          default:
            userMessage = `Unable to load map: ${error.message}`;
        }
        
        // Emit error state
        this.runHooks('loadingStateChanged', { loading: false, operation: 'loadMap', success: false, error: userMessage, url });
        
        // Create new error with user-friendly message but preserve original error
        const userError = new Error(userMessage);
        userError.name = 'MapLoadError';
        userError.cause = error;
        userError.url = url;
        
        throw userError;
      } finally {
        // Always cleanup loading state
        this.isLoadingMap = false;
        this.loadingOperations.delete(operationId);
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
    async loadMapWithSvgCode(code) {
      // Clear map first
      this.clearMap();
      const svgContent = await this.importExport.retrieveAndLoadSVG(code);
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
      else throw new Error("Error saving the metro map");
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