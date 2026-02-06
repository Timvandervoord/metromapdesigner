import * as helpers from '../common.js?v=1.0.5';
import * as config from '../config.js?v=1.0.5';
import metromapLegenda from './legenda.js?v=1.0.5';
import metromapMetroline from './metroline.js?v=1.0.5';
import metromapStation from './station.js?v=1.0.5';
import { SpatialGrid } from '../common.js?v=1.0.5';

/**
 * @class metromap
 * @description Manages all interactions and manipulations related to the metro map, including stations, metrolines, grid, and layers. 
 *              Provides utilities for adding, removing, selecting, and updating metro map elements, as well as exporting the map state.
 */
export default class metromap {
    /**
     * @property {Object} metromapdesigner
     * @description Reference to the application managing the metro map.
     */
    metromapdesigner;

    /**
     * @property {SVGElement} svgMap
     * @description Reference to the SVG element containing the metro map.
     */
    svgMap;

    /**
     * @property {SVGGElement} metroLineLayer
     * @description SVG `<g>` element representing the layer containing all metrolines.
     */
    metroLineLayer;

    /**
     * @property {SVGGElement} stationLayer
     * @description SVG `<g>` element representing the layer containing all stations.
     */
    stationLayer;

    /**
     * @property {SVGGElement} overlayLayer
     * @description SVG `<g>` element representing the overlay layer.
     */
    overlayLayer;

    /**
     * @property {SVGGElement} legendaLayer
     * @description SVG `<g>` element representing the legend layer.
     */
    legendaLayer;

    /**
     * @property {SVGGElement} legendaStationsLayer
     * @description SVG `<g>` element representing the legend layer for station types.
     */
    legendaStationsLayer;

    /**
     * @property {SVGGElement|null} gridLayer
     * @description SVG `<g>` element representing the grid layer, or `null` if the grid is not drawn.
     */
    gridLayer;

    /**
     * @property {SVGTextElement} titleText
     * @description SVG `<text>` element displaying the title of the map.
     */
    titleText;

    /**
     * @property {SVGTextElement} subTitle
     * @description SVG `<text>` element displaying the subtitle off the map.
     */
    subTitle;

    /**
     * @property {Object[]} stations
     * @description Array of station objects on the map.
     */
    stations = [];

    /**
     * @property {Object[]} lines
     * @description Array of metroline objects on the map.
     */
    lines = [];

    /**
     * @property {Object} legenda
     * @description Reference to the `metromapLegenda` instance managing the legend.
     */
    legenda;

    /**
     * @property {SpatialGrid} spatialIndex
     * @description Spatial index for optimized metroline detection and intersection queries.
     */
    spatialIndex;

    /**
     * @property {Object|null} stationEdited
     * @description The station currently being edited, or `null` if no station is selected.
     */
    stationEdited = null;

    /**
     * @property {boolean} isDraggingStation
     * @description Indicates whether a station is currently being dragged.
     */
    isDraggingStation = false;

    /**
     * @property {Object} draggingOffset
     * @description Object storing the offset between the mouse position and the station's position during dragging.
     * @property {number} draggingOffset.offSetX - Horizontal offset.
     * @property {number} draggingOffset.offSetY - Vertical offset.
     */
    draggingOffset = { offSetX : 0, offSetY : 0} // To store difference mouseposition to X and Y of station

    /**
     * @property {SVGElement[]} elementsDragged
     * @description Array of elements currently being dragged.
     */
    elementsDragged = [];

    /**
     * @property {Object[]} draggingOffsets
     * @description Array of objects storing offsets for each dragged element.
     */
    draggingOffsets = [];

    /**
     * @property {Object|null} metrolineEdited
     * @description The metroline currently being edited, or `null` if no metroline is selected.
     */
    metrolineEdited = null;

    /**
     * @property {Object|null} metrolineEditedSegment
     * @description The segment of the metroline currently being edited, or `null` if no segment is being edited.
     */
    metrolineEditedSegment = null;

    /**
     * @property {string[]} metrolineColors
     * @description Array of colors used for metrolines on the map.
     */
    metrolineColors = [];

    /**
     * @property {string} externalUniqueID
     * @description External unique identifier for the metro map.
     */
    externalUniqueID;

    /**
     * @property {Object} hooks
     * @description Collection of event hooks for different state changes on the map.
     * @property {Function[]} hooks.newStation - Hooks for when a new station is added.
     * @property {Function[]} hooks.movingStation - Hooks for when a station is being moved.
     * @property {Function[]} hooks.movedStation - Hooks for when a station has been moved.
     * @property {Function[]} hooks.removeStation - Hooks for when a station is removed.
     * @property {Function[]} hooks.newLine - Hooks for when a new line is added.
     * @property {Function[]} hooks.movingLine - Hooks for when a line is being moved.
     * @property {Function[]} hooks.movedLine - Hooks for when a line has been moved.
     * @property {Function[]} hooks.removeLine - Hooks for when a line is removed.
     * @property {Function[]} hooks.selectStation - Hooks for when a station is selected.
     * @property {Function[]} hooks.unSelectStation - Hooks for when a station is deselected.
     * @property {Function[]} hooks.selectLine - Hooks for when a line is selected.
     */
    hooks = {
        newStation: [],
        movingStation: [],
        movedStation: [],
        removeStation: [],
        newLine: [],
        movingLine: [],
        movedLine: [],
        removeLine: [],
        selectStation: [],
        unSelectStation: [],
        selectLine: []
    };

    // INITIALIZATION AND HOOKS

    /**
     * @constructor
     * @param {Object} app - Reference to the application managing the metro map.
     * @param {SVGElement} map - Reference to the SVG element containing the map.
     * @throws {Error} Throws an error if required SVG layers are missing.
     */
    constructor(app, map) {
        // Reference to the SVG element containing the map where working on
        this.svgMap = map; // SVG HTML ELEMENT REFERENCE
        this.metromapdesigner = app;

        // For checking of layers
        const throwLayerError = (layerId) => {
            throw new Error(`Layer with ID "${layerId}" not found in the SVG map.`);
        };

         // Layers of the metromap file
        this.metroLineLayer = map.getElementById("metrolines") || throwLayerError("metrolines");
        this.stationLayer = map.getElementById("stations") || throwLayerError("stations");
        this.overlayLayer = map.getElementById("overlay") || throwLayerError("overlay");
        this.legendaLayer = map.getElementById("legenda") || throwLayerError("legenda");
        this.legendaStationsLayer = map.getElementById("legendaStations") || throwLayerError("legendaStations");
        this.gridLayer = map.getElementById("gridLayer");
        this.titleText = map.getElementById("titleText") || throwLayerError("titleText");
        this.subTitle = map.getElementById("academyName") || throwLayerError("academyName");

         // Draw the grid
         this.gridDraw();

         // Select all lines on map
         this.updateLines();

         // Recreate the color table
         this.metroMapRecreateColorTable();

         // Select all stations on map
         this.updateStations();

         // Remove any red strokes from previously selected stations
         this.unselectAllStations();

         // Create legenda object
         this.legenda = new metromapLegenda(this, this.legendaLayer);

         // Initialize spatial index for performance optimization
         const cellSize = config.gridConfig.size * 2; // Use 2x grid size for optimal performance
         this.spatialIndex = new SpatialGrid(cellSize, this.getWidth(), this.getHeight());
         this.buildSpatialIndex();

         // Remove legend items that have no corresponding lines on the map
         this.removeOrphanedLegendaItems();
    }

    /**
     * @method removeOrphanedLegendaItems
     * @description Removes legend items for metrolines that have no polylines.
     * @returns {number} The number of legend items removed.
     */
    removeOrphanedLegendaItems() {
        if (!this.legenda) return 0;

        let removedCount = 0;

        for (const line of this.lines) {
            // If the metroline has no polylines, remove its legend item
            if (line.polylines.length === 0) {
                const removed = this.legenda.remove(line.getId());
                if (removed) removedCount++;
            }
        }

        return removedCount;
    }

    // HOOKS 

    /**
     * @method addHook
     * @description Registers a callback function for a specific event.
     * @param {string} event - The event name.
     * @param {Function} callback - The callback function to register.
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
     * @method runHooks
     * @description Executes all registered hooks for a specific event.
     * @param {string} event - The event name.
     * @param {any} data - Data to pass to the hooks.
     */
    runHooks(event, data) {
          if (this.hooks[event]) {
              this.hooks[event].forEach((hook) => hook(data));
          }
    }


    // MAP CANVAS MANIPULATION

    /**
     * @method getCanvas
     * @description Retrieves the SVG element representing the map canvas.
     * @returns {SVGElement} The SVG element of the map.
     */
    getCanvas()
    {
        return this.svgMap;
    }

    /**
     * @method getCanvasSize
     * @description Retrieves the dimensions of the SVG map canvas.
     * @returns {Object} An object containing the height and width of the map.
     */
    getCanvasSize()
    {
        return { "height" : this.svgMap.clientHeight, "width" : this.svgMap.clientWidth }
    }

    /**
     * Retrieves the title or academy name from the map.
     *
     * @returns {string} - The title or academy name as a string, with newlines and extra whitespace removed.
     *
     * @description
     * This function extracts the textual content of the title element (`this.titleText`) and processes it to ensure
     * the returned string is clean and consistent. It performs the following operations:
     * - Retrieves the text content using `textContent` (or falls back to `innerText` for compatibility).
     * - Replaces all newlines and excessive whitespace with a single space.
     * - Trims leading and trailing whitespace.
     *
     * The processed string is then returned as the title or academy name.
     */
    getTitle() {
        // Extract all tspans inside the titleText
        const tspans = Array.from(this.titleText.querySelectorAll('tspan'));
        // Map tspans to their trimmed text content
        let name = tspans.map(tspan => tspan.textContent.trim()).join(' ');
        // Replace newlines and trim whitespace
        name = name.replace(/\s+/g, " ").trim();
        return name;
    }

    /**
     * Retrieves the title or academy name from the map.
     *
     * @returns {string} - The title or academy name as a string, with newlines and extra whitespace removed.
     *
     * @description
     * This function extracts the textual content of the title element (`this.titleText`) and processes it to ensure
     * the returned string is clean and consistent. It performs the following operations:
     * - Retrieves the text content using `textContent` (or falls back to `innerText` for compatibility).
     * - Replaces all newlines and excessive whitespace with a single space.
     * - Trims leading and trailing whitespace.
     *
     * The processed string is then returned as the title or academy name.
     */
    getSubTitle() {
        let name = this.subTitle.textContent || this.subTitle.innerText; // Get the text content
        // Replace newlines and trim whitespace
        name = name.replace(/\s+/g, " ").trim();
    
        return name;
    }

    /**
     * Updates the title of the map.
     *
     * @param {string} title - The new title for the map.
     * @throws {Error} Throws an error if the title is not a valid string.
     */
    setTitle(title) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new Error("Invalid title: Title must be a non-empty string.");
        }

        const maxLineLength = 40;
        const words = title.trim().split(/\s+/); // Split the title into words
        const lines = [];
        let currentLine = "";

        // Split the title into lines, ensuring no line exceeds the max length
        words.forEach((word) => {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxLineLength) {
                currentLine = testLine;
            } else {
                lines.push(currentLine); // Save the current line
                currentLine = word; // Start a new line
            }
        });

        if (currentLine) {
            lines.push(currentLine); // Add the last line
        }

        // Ensure a maximum of two lines
        if (lines.length > 2) {
            lines[1] += ` ...`; // Add ellipsis to the second line if the title is too long
            lines.splice(2); // Trim to two lines
        }

        // Update the titleText element with two <tspan> elements
        const titleTextElement = this.titleText;

        // Clear existing content
        titleTextElement.innerHTML = "";

        // Add each line as a <tspan>
        lines.forEach((line, index) => {
            const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan.setAttribute("y", `${index * 60}`); // Set y-offset for each line
            tspan.setAttribute("x", "0"); // Align text to the left
            tspan.setAttribute("id", `titleText${index + 1}`);
            tspan.textContent = line;
            titleTextElement.appendChild(tspan);
        });
    }

    /**
     * Updates the title of the map.
     *
     * @param {string} title - The new title for the map.
     * @throws {Error} Throws an error if the title is not a valid string.
     */
    setSubTitle(subTitle) {
        if (typeof subTitle !== "string") {
            throw new Error("Invalid title: Academy must be a string.");
        }

        // Update the text content of the title element
        this.subTitle.textContent = subTitle.trim();
    }

    /**
     * Retrieves the current height of the SVG map.
     *
     * @returns {number} - The height of the SVG map in pixels.
     *
     * @description
     * This function returns the `clientHeight` property of the SVG map, which represents
     * the rendered height of the SVG container.
     */
    getHeight() {
        return this.svgMap.clientHeight;
    }

    /**
     * Retrieves the current width of the SVG map.
     *
     * @returns {number} - The width of the SVG map in pixels.
     *
     * @description
     * This function returns the `clientWidth` property of the SVG map, which represents
     * the rendered width of the SVG container.
     */
    getWidth() {
        return this.svgMap.clientWidth;
    }

    /**
     * Prepares elements for dragging by calculating and storing their initial offset positions.
     *
     * @param {HTMLElement|HTMLElement[]} elements - The DOM element(s) to be dragged.
     * @param {Object} currentPosition - The current mouse or touch position.
     * @param {number} currentPosition.x - The x-coordinate of the current position.
     * @param {number} currentPosition.y - The y-coordinate of the current position.
     *
     * @description
     * This function sets up the necessary data for dragging canvas elements. It calculates the 
     * offset between the current mouse position and the top-left corner of each element to ensure 
     * smooth dragging. The element(s) are marked as active for dragging.
     */
    prepareMoveCanvasElement(elements, currentPosition) {

        if (!Array.isArray(elements)) {
            elements = [elements];
        }

        this.elementsDragged = elements;

        // Calculate and store the dragging offsets for all elements
        this.draggingOffsets = elements.map(element => {
            let translate = helpers.getTranslate(element);
            element.classList.add("dragging");
            return {
                element,
                offset: {
                    x: currentPosition.x - translate[0],
                    y: currentPosition.y - translate[1]
                }
            };
        });
    }

    /**
     * Moves the currently dragged element(s) to a new position based on the provided coordinates.
     *
     * @param {Object} newPosition - The new position of the mouse or touch event.
     * @param {number} newPosition.x - The x-coordinate of the new position.
     * @param {number} newPosition.y - The y-coordinate of the new position.
     * @throws {Error} - Throws an error if `newPosition` is not valid or missing.
     *
     * @description
     * This function updates the position of the currently dragged element(s) by adjusting their 
     * translations based on the new mouse or touch position. It subtracts the initial offset 
     * to ensure each element moves correctly relative to the mouse or touch.
     * Hooks for the `movingElement` event are triggered after the movement is applied.
     */
    moveCanvasElement(newPosition) {
        if (this.elementsDragged && this.draggingOffsets) {
            if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
                throw new Error("moveStation: Invalid new position information.");
            }

            this.draggingOffsets.forEach(({ element, offset }) => {
                // Calculate the new position for each element
                let newX = newPosition.x - offset.x;
                let newY = newPosition.y - offset.y;

                // Align position to the grid
                const alignedPosition = this.getGridAlignedPosition(newX, newY);

                // Update the element's translation
                helpers.updateTranslate(element, alignedPosition.x, alignedPosition.y);

                // Trigger hooks for the `movingElement` event
                this.runHooks('movingElement', element);
            });
        }
    }

    /**
     * Ends the dragging operation for the currently dragged element(s).
     *
     * @description
     * This function finalizes the dragging operation by resetting the drag state and triggering 
     * hooks for the `endMoveElement` event. The element(s) are no longer marked as active for dragging.
     */
    endMoveCanvasElement() {
        if (this.elementsDragged) {
            this.elementsDragged.forEach(element => {
                // Trigger hooks for the `endMoveElement` event
                this.runHooks('endMoveElement', element);

                // Reset the drag state for each element
                element.classList.remove("dragging");
            });
        }

        // Reset the drag state
        this.elementsDragged = null;
        this.draggingOffsets = null;
    }

    /**
     * @method moveStationsAndLinesByOffset
     * @description Moves all stations and metrolines on the map by the specified offset.
     * 
     * @param {number} offsetX - The horizontal offset by which to move stations and lines.
     * @param {number} offsetY - The vertical offset by which to move stations and lines.
     * 
     * @throws {Error} Throws an error if the provided offsets are not valid numbers.
     * 
     */
    moveStationsAndLinesByOffset(offsetX, offsetY)
    {
        if (typeof offsetX !== "number" || typeof offsetY !== "number") {
            throw new Error("Metroline metroLineContinueDragging: Invalid coordinates provided for dragging lines.");
        }

        // Move everything
        this.moveAllStationsByOffset(offsetX, offsetY);
        this.moveAllMetrolinesByOffset(offsetX, offsetY);
    }

    /**
     * @method metroMapRecreateColorTable
     * @description Parses the current metro map to update the list of metroline colors.
     */
    metroMapRecreateColorTable() {
        // Use DOM batching for better performance when updating legend
        helpers.batchDOMUpdate('colorTable', () => {
            this.metrolineColors = []; // Empty array

            // Use Set for better performance with unique colors
            const colorSet = new Set();
            this.lines.forEach((line) => {
                colorSet.add(line.getColor());
            });
            
            this.metrolineColors = Array.from(colorSet);
        }, 'medium');
    }

    /**
     * Updates the dimensions of the SVG map and repositions elements accordingly.
     *
     * @param {number} width - The new width of the SVG map in pixels.
     * @param {number} height - The new height of the SVG map in pixels.
     *
     * @description
     * This function adjusts the dimensions of the SVG map by setting its `width` and `height`
     * attributes. After resizing, it repositions key elements (such as the legenda and logo)
     * to maintain their relative positions on the map.
     */
    setDimensions(width, height) {
        // Get the current dimensions of the SVG map
        let oldWidth = this.getWidth();
        let oldHeight = this.getHeight();

        // Update the SVG map's dimensions
        this.svgMap.setAttribute("height", height);
        this.svgMap.setAttribute("width", width);

        // Update positions of default elements based on new dimensions
        this.updateDefaultElementPositions(oldWidth, oldHeight);

        // Redraw the grid
        this.gridDraw();

        // Rebuild spatial index with new dimensions
        if (this.spatialIndex) {
            this.spatialIndex.rebuild(this.lines, width, height);
        }
    }

    /**
     * Repositions key elements on the SVG map after resizing.
     *
     * @param {number} oldWidth - The previous width of the SVG map in pixels.
     * @param {number} oldHeight - The previous height of the SVG map in pixels.
     *
     * @description
     * This function adjusts the positions of key elements on the SVG map, such as the legenda,
     * station types legenda based on the difference between the old and new map dimensions.
     * It ensures that these elements remain in their intended locations relative to the resized map.
     */
    updateDefaultElementPositions(oldWidth, oldHeight) {
            // Get the new dimensions of the SVG map
            let newWidth = this.getWidth();
            let newHeight = this.getHeight();
    
            // Reposition the metroline legenda
            let legendaPoints = helpers.getTranslate(this.legendaLayer);
            let legendaOffsetY = oldHeight - Number(legendaPoints[1]);
            let newLegendaY = newHeight - legendaOffsetY;
            helpers.setTranslate(this.legendaLayer, legendaPoints[0], newLegendaY);
    
            // Reposition the station types legenda
            let legendaStationTypesPoints = helpers.getTranslate(this.legendaStationsLayer);
            let newLegendaStationsX = newWidth - (oldWidth - Number(legendaStationTypesPoints[0]));
            let newLegendaStationsY = newHeight - (oldHeight - Number(legendaStationTypesPoints[1]));
            helpers.setTranslate(this.legendaStationsLayer, newLegendaStationsX, newLegendaStationsY);
    }


    // GRID FUNCTIONS

    /**
     * @method getGridAlignedPosition
     * @description Aligns given coordinates to the nearest grid intersection.
     * @param {number} x - X-coordinate to align.
     * @param {number} y - Y-coordinate to align.
     * @returns {Object} An object with aligned x and y coordinates.
     */
    getGridAlignedPosition(x, y) {
        const alignedX = Math.round(x / config.gridConfig.size) * config.gridConfig.size;
        const alignedY = Math.round(y / config.gridConfig.size) * config.gridConfig.size;
        return { x: alignedX, y: alignedY };
    }

    /**
     * @method getHalfGridAlignedPosition
     * @description Aligns given coordinates to the nearest half-grid intersection.
     * @param {number} x - X-coordinate to align.
     * @param {number} y - Y-coordinate to align.
     * @returns {Object} An object with aligned x and y coordinates.
     */
    getHalfGridAlignedPosition(x, y) {
        const halfGridSize = config.gridConfig.size / 2;
        const alignedX = Math.round(x / halfGridSize) * halfGridSize;
        const alignedY = Math.round(y / halfGridSize) * halfGridSize;
        return { x: alignedX, y: alignedY };
    }

    /**
     * Toggles the visibility of the grid on the SVG map.
     * If the grid is currently displayed, it removes it. Otherwise, it draws the grid.
     */
    gridToggle() {
        this.gridDisplayed ? this.gridRemove() : this.gridDraw();
    }

    /**
     * Removes the grid layer from the SVG map.
     * Updates the `gridDisplayed` state to `false`.
     * 
     * @throws {Error} Throws an error if `gridLayer` is not properly initialized.
     */
    gridRemove() {
        if (this.gridLayer && this.gridDisplayed) {
            this.svgMap.removeChild(this.gridLayer);
            this.gridLayer = null;
            this.gridDisplayed = false;
        }
        // Silently return if grid is already removed - not an error condition
    }

    /**
     * Draws a grid on the SVG map based on the configured grid size, color, and thickness.
     * The grid consists of vertical and horizontal lines spaced at regular intervals.
     * Creates a separate `<g>` layer (`gridLayer`) for managing the grid.
     * 
     * @throws {Error} Throws an error if the SVG map dimensions are unavailable.
     */
    gridDraw() {
        // Create a new layer for the grid
        this.gridLayer = helpers.createSvgElement("g", { id: "gridLayer" });
        const gridSize = config.gridConfig.size;

        // Use DocumentFragment for batch DOM operations
        const fragment = document.createDocumentFragment();

        // Helper function to create an SVG line
        const drawLine = (x1, y1, x2, y2) => {
            return helpers.createSvgElement("line", { 
                x1: x1, 
                y1: y1,
                x2: x2,
                y2: y2,
                stroke: config.gridConfig.lineColor,
                "stroke-width": config.gridConfig.thickness
            });
        };

        // Batch create vertical lines
        const verticalLines = [];
        for (let x = 0; x <= this.svgMap.clientWidth; x += gridSize) {
            verticalLines.push(drawLine(x, 0, x, this.getHeight()));
        }

        // Batch create horizontal lines
        const horizontalLines = [];
        for (let y = 0; y <= this.svgMap.clientHeight; y += gridSize) {
            horizontalLines.push(drawLine(0, y, this.getWidth(), y));
        }

        // Add all lines to fragment in one batch
        [...verticalLines, ...horizontalLines].forEach(line => {
            fragment.appendChild(line);
        });

        // Single DOM append operation
        this.gridLayer.appendChild(fragment);

        // Insert the grid layer at the bottom of the SVG map's child nodes
        this.svgMap.insertBefore(this.gridLayer, this.svgMap.firstChild || null);
        this.gridDisplayed = true;
    }

    // STATIONS
    
    /**
     * @method addNewStation
     * @description Adds a new station to the metro map at the specified coordinates.
     * 
     * @param {Object} configuration - The configuration object for the new station.
     * @param {number} configuration.x - The x-coordinate for the station.
     * @param {number} configuration.y - The y-coordinate for the station.
     * @param {string} [configuration.shape] - The shape of the station (e.g., "connection").
     * 
     * @returns {Object} The created station object.
     * 
     * @throws {Error} Throws an error if the configuration is invalid or a metroline cannot be found/created.
     */
    addNewStation(configuration)
    {
        // Check if X and Y position are present
        if (!configuration || typeof configuration.x !== 'number' || typeof configuration.y !== 'number') {
            throw new Error("Invalid station configuration, should at least contain X and Y position.");
        }

        // The aligment should be along grid when a station is drawn before the first metroline, otherwise we allow halfgrid positioning
        let alignedPosition;
        if (this.lines.length === 0) {
            alignedPosition = this.getGridAlignedPosition(configuration.x, configuration.y);
        } else {
            alignedPosition = this.getHalfGridAlignedPosition(configuration.x, configuration.y);
        }
        configuration.x = alignedPosition.x;
        configuration.y = alignedPosition.y;

         // Get or create a metroline for the station
        const line = this.getOrCreateMetroline(configuration.x, configuration.y);

        if (!line) {
            throw new Error("addNewStation: Could not find or create a metroline. Operation cannot continue.");
        }

        // Check if we have a line
        if(!line) throw new Error("addNewStation: Could not find metroline or create one, can not continue");

        // Set metroline id in configuration
        configuration.metrolineid = line.getId();

        // Get the stationLineLayer we need to add it to
        const stationLineLayer = this.getStationLineLayer(line);

        // Unselect any current stations
        this.unselectAllStations();

        // Create a new station
        const station = new metromapStation(this, stationLineLayer, null, configuration);

        // Add it to the map
        this.stations.push(station);

        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            // Allow DOM to update, then process station
            requestAnimationFrame(() => {
                // update connection metroline ids
                if(station.getShape() === "connection") {
                     this.updateStationMetrolineIds(station, true);
                }
                // Run hooks for the 'newStation' event
                this.runHooks('newStation', station);
                this.selectStation(station);
            });
        });

        return station;
    }

    /**
     * @method selectStation
     * @description Selects a specific station and triggers related hooks.
     * @param {Object} station - The station to select.
     */
    selectStation(station) {

        // Select it
        this.stationEdited = station;
        station.select();

        // Run hooks for the 'save' event
        this.runHooks('selectStation', station);
    }

    /**
     * @method getSelectedStation
     * @description Retrieves the currently selected station, or returns `null` if no station is selected.
     * 
     * @returns {Object|null} The currently selected station object, or `null` if no station is selected.
     */
    getSelectedStation() {
        return this.stationEdited;
    }

    /**
     * @method unSelectStation
     * @description Deselects the currently selected station and triggers related hooks.
     */
    unSelectStation() {
        if (this.stationEdited) {
            this.stationEdited.unSelect();
            this.stationEdited = null;
        }
        this.isDraggingStation = false;

        // Run hooks for the 'save' event
        this.runHooks('unSelectStation');
    }

    /**
     * @method unselectAllStations
     * @description Deselects all stations on the map and triggers related hooks.
     */
    unselectAllStations() {
        this.stationEdited = null;
        this.isDraggingStation = false;
    
        // Unselect all stations
        this.stations.forEach(station => {
            station.unSelect();
        });

        // Run hooks for the 'save' event
        this.runHooks('unSelectStation');
    }

    /**
     * @method removeStationByGroupElement
     * @description Removes a station based on its SVG group element.
     * @param {SVGGElement} svgStationGroup - The group element representing the station.
     * @throws {Error} Throws an error if the station is not found.
     */
    removeStationByGroupElement(svgStationGroup) {
        // Find corresponding station
        const stationRemoving = this.findAndSelectStation(svgStationGroup);
        if(!stationRemoving) throw new Error('removeStationByGroupElement called but station not found? ' + svgStationGroup);

        // Remove it from the map
        this.removeStation(stationRemoving);
    }

    /**
     * @method updateStationMetrolineIds
     * @description Updates the `metrolineIds` property of the given station by detecting which metrolines pass through its position.
     * If no metroline is found, it assigns the first metroline in the `lines` array as a fallback.
     * 
     * @param {Object} station - The station whose `metrolineIds` need to be updated.
     */
    updateStationMetrolineIds(station, visualFeedback = false) {
        if (!station) {
            throw new Error("updateStationMetrolineIds: Station object is required.");
        }

        // Process based on station type
        if (station.getShape() !== "connection") {
            this.updateNormalStationMetrolineIds(station, visualFeedback);
        } else {
            this.updateConnectionStationMetrolineIds(station, visualFeedback);
        }
    }

    /**
     * @method updateNormalStationMetrolineIds
     * @description Handles metroline detection for normal, start, or end stations.
     * 
     * @param {Object} station - The station to update.
     */
    updateNormalStationMetrolineIds(station, visualFeedback = false) {
        const { x, y } = station.getPosition();
        const metroline = this.findMetrolineAt(x, y) || this.getFallbackMetroline();

        if (station.getMetrolineId() !== metroline.getId()) {
            const stationLineLayer = this.getStationLineLayer(metroline);
            station.moveToMetroline(metroline, stationLineLayer);
        }
    }

    /**
     * @method updateConnectionStationMetrolineIds
     * @description Handles metroline detection for connection stations, considering bounding box and rotation.
     * 
     * @param {Object} station - The connection station to update.
     */
    updateConnectionStationMetrolineIds(station, visualFeedback = false) {
        const adjustedBBox = this.getAdjustedBoundingBox(station);
        const rotation = this.getRotationForStation(station);
        const lines = this.detectMetrolinesOnBBox(adjustedBBox, rotation, 20, visualFeedback, false);

        if (lines.size === 0) {
            lines.add(this.getFallbackMetroline());
        }

        const firstLine = Array.from(lines)[0];
        const stationLineLayer = this.getStationLineLayer(firstLine);
        station.moveToMetroline(firstLine, stationLineLayer);

        Array.from(lines).forEach(metroline => {
            if (metroline !== firstLine) {
                station.addMetroline(metroline);
            }
        });
    }

    /**
     * @method getAdjustedBoundingBox
     * @description Computes the adjusted bounding box for a station, taking rotation and tolerance into account.
     * 
     * @param {Object} station - The station to calculate the bounding box for.
     * @returns {Object} The adjusted bounding box.
     */
    getAdjustedBoundingBox(station) {
        const connectionShape = station.refSvg.querySelector('.stationShapeConnection');
        const bbox = connectionShape.getBoundingClientRect();
        const svgCanvas = this.svgMap.getBoundingClientRect();
        const stationWidth = station.getWidth();
        const rotation = station.getOrientation();
        const metrolineThickness = config.metrolineConfig.thickness;
        const halfThickness = metrolineThickness / 2;
        const shapePadding = 4;
        const offSetStationWidth = stationWidth * halfThickness;

        // Helper function to calculate y adjustment based on rotation
        const getYAdjust = (rotation) => [315, 225, 45, 135].includes(rotation) ? -offSetStationWidth : 0;

        // Helper function to calculate adjusted dimensions
        const getAdjustedDimensions = (width, height, thickness, rotation) => {
            if (rotation === 90 || rotation === 270) {
                return {
                    width: thickness + shapePadding,
                    height: height + thickness
                };
            }
            return {
                width: width + offSetStationWidth,
                height: thickness + shapePadding
            };
        };

        // Helper function to calculate adjusted positions
        const getAdjustedPositions = (bbox, svgCanvas, yAdjust, rotation, halfThickness, widthOffset) => {
            if (rotation === 90 || rotation === 270) {
                return {
                    adjustedX: bbox.x - svgCanvas.x,
                    adjustedY: bbox.y - svgCanvas.y - yAdjust - halfThickness
                };
            }
            return {
                adjustedX: bbox.x - svgCanvas.x - (widthOffset / 2),
                adjustedY: bbox.y - svgCanvas.y - yAdjust
            };
        };

        // Calculate adjustments
        const yAdjust = getYAdjust(rotation);
        const { width: adjustedWidth, height: adjustedHeight } = getAdjustedDimensions(bbox.width, bbox.height, metrolineThickness, rotation);
        const { adjustedX, adjustedY } = getAdjustedPositions(bbox, svgCanvas, yAdjust, rotation, halfThickness, offSetStationWidth);

        // Return adjusted bounding box
        return {
            x: adjustedX,
            y: adjustedY,
            width: adjustedWidth,
            height: adjustedHeight
        };
    }

    /**
     * @method getRotationForStation
     * @description Determines the appropriate rotation for a station.
     * 
     * @param {Object} station - The station to evaluate.
     * @returns {number} The rotation angle.
     */
    getRotationForStation(station) {
        const rotation = station.getOrientation();
        return rotation === 90 || rotation === 270 ? 0 : rotation;
    }

    /**
     * @method getFallbackMetroline
     * @description Returns the fallback metroline if none is detected.
     * 
     * @returns {Object} The fallback metroline.
     * @throws {Error} If no metrolines exist.
     */
    getFallbackMetroline() {
        const fallbackMetroline = this.lines[0];
        if (!fallbackMetroline) {
            throw new Error("No metrolines exist in the map.");
        }
        return fallbackMetroline;
    }
    
    /**
     * @method updateAllStationMetrolineIds
     * @description Iterates through all stations and updates their `metrolineIds` by detecting which metrolines pass through their positions.
     */
    updateAllStationMetrolineIds() {
        if (!this.stations || this.stations.length === 0) {
            return;
        }

        // Batch station updates for better performance
        helpers.batchDOMUpdate('allStationUpdates', () => {
            // Process stations in chunks to avoid blocking UI
            const chunkSize = 10;
            for (let i = 0; i < this.stations.length; i += chunkSize) {
                const chunk = this.stations.slice(i, i + chunkSize);
                chunk.forEach((station) => {
                    this.updateStationMetrolineIds(station);
                });
            }
        }, 'low');
    }

    /**
     * @method updateStations
     * @description Parses all stations in the station layer and updates the internal station array.
     */
    updateStations() {
        // Clear the existing stations array
        this.stations = [];

        // Get all station line groups within the station layer
        const stationLineLayers = this.stationLayer.querySelectorAll("g");

        // Check if any station line layers exist
        if (!stationLineLayers || stationLineLayers.length === 0) {
            return; // Exit early if no layers are found
        }

        // Iterate through each station line group
        stationLineLayers.forEach(stationLineGroup => {
            // Get all station groups within the current station line group
            const mapStations = stationLineGroup.querySelectorAll(".stationGroup");

            // Add each station to the stations array
            mapStations.forEach(station => {
                this.stations.push(new metromapStation(this, stationLineGroup, station));
            });
        });
    }

    /**
     * @method removeStation
     * @description Removes a given station from the canvas and updates the internal station list.
     * 
     * @param {Object} stationRemoved - The station object to be removed.
     * 
     * @throws {Error} Throws an error if no valid station object is provided.
     */
    removeStation(stationRemoved) {
        if(!stationRemoved) throw new Error('removeStation called without valid station');

        // Run hooks for the 'save' event
        this.runHooks('removeStation', stationRemoved);

        // Remove it from canvas
        stationRemoved.unSelect();
        stationRemoved.remove();

        // Remove it from the stations array
        this.stations = this.stations.filter(station => station !== stationRemoved);
    }

    /**
     * @method getStationLineLayer
     * @description Retrieves the station line layer corresponding to a specific metroline. If the layer does not exist, it creates a new one.
     * 
     * @param {Object} metroline - The metroline object for which to retrieve or create the station line layer.
     * @returns {SVGGElement} The station line layer (`<g>` element) associated with the metroline.
     * 
     * @throws {Error} Throws an error if the provided metroline object is invalid.
     */
    getStationLineLayer(metroline) {
        if (!metroline) {
            throw new Error("getLineStationLayer: Invalid metroline object supplied");
        }

        // Get the id
        const metrolineid = metroline.getId();

        // Search for the stationLinelayer
        let stationLineLayer = this.stationLayer.querySelector("."+metrolineid);

        if(!stationLineLayer) {
            // not found create it
            stationLineLayer = this.addLineStationLayer(metrolineid);
        }

        // Return the stationLineLayer
        return stationLineLayer;
    }

    /**
     * @method addLineStationLayer
     * @description Creates a new station line layer (`<g>` element) for a specific metroline ID.
     * 
     * @param {string} metrolineid - The ID of the metroline for which to create the station line layer.
     * @returns {SVGGElement} The newly created station line layer.
     * 
     * @example
     * const newLayer = metroMapInstance.addLineStationLayer("metroline1");
     */
    addLineStationLayer(metrolineid) {
        // It does not exist, create a new group
        const stationLineLayer = helpers.createSvgElement("g", {
            class: metrolineid,
            metrolineid: metrolineid
        });
        this.stationLayer.appendChild(stationLineLayer);

        return stationLineLayer;
    }


    /**
     * @method moveStationsOnLineGroupByOffset
     * @description Moves all stations within a specific station line layer by a given offset.
     * 
     * @param {SVGGElement} stationLineLayer - The station line layer to move.
     * @param {number} offsetX - The horizontal offset by which to move the stations.
     * @param {number} offsetY - The vertical offset by which to move the stations.
     * 
     * @throws {Error} Throws an error if the `stationLineLayer` parameter is invalid.
     * 
     */
    moveStationsOnLineGroupByOffset(stationLineLayer, offsetX, offsetY) {
        if(!stationLineLayer) throw new Error('moveStationsOnLineLayerByOffset called without stationlinelayer reference');

        // Iterate over stations, check if there on the linelayer and move if so
        this.stations.forEach(station => {
            if(station.getStationLineLayer() === stationLineLayer) {
                station.moveByOffset(offsetX, offsetY);
            }
         });
    }

    /**
     * @method moveAllStationsByOffset
     * @description Moves all stations on the map by a specified offset.
     * 
     * @param {number} offsetX - The horizontal offset by which to move the stations.
     * @param {number} offsetY - The vertical offset by which to move the stations.
     * 
     * @example
     * metroMapInstance.moveAllStationsByOffset(30, -15);
     */
    moveAllStationsByOffset(offsetX, offsetY) {
        // Iterate over stations, check if there on the linelayer and move if so
        this.stations.forEach(station => {
                station.moveByOffset(offsetX, offsetY);
         });
    }

    //#######################################################################################
    // ### Move station over the canvas

    /**
     * Initializes the dragging process for a station.
     * Calculates the offset between the current mouse position and the station's position.
     * 
     * @param {Object} currentPosition - The current mouse position.
     * @param {number} currentPosition.x - The X-coordinate of the mouse position.
     * @param {number} currentPosition.y - The Y-coordinate of the mouse position.
     * @throws {Error} Throws an error if `currentPosition` is invalid or no station is selected.
     */
    prepareStationMove(currentPosition) {
        if (!currentPosition || typeof currentPosition.x !== 'number' || typeof currentPosition.y !== 'number') {
            throw new Error("prepareStationMove: Invalid position information.");
        }

        if (!this.stationEdited) {
            throw new Error("prepareStationMove: No station selected for moving.");
        }

        this.isDraggingStation = true;

        // Calculate and store the initial offset
        this.draggingOffset = {
            x: currentPosition.x - this.stationEdited.x,
            y: currentPosition.y - this.stationEdited.y
        };
    }


    /**
     * Updates the station's position as the user drags it.
     * Adjusts the new position using the initial offset and aligns it to the grid.
     * 
     * @param {Object} newPosition - The new mouse position.
     * @param {number} newPosition.x - The X-coordinate of the new mouse position.
     * @param {number} newPosition.y - The Y-coordinate of the new mouse position.
     * @throws {Error} Throws an error if `newPosition` is invalid.
     */
    moveStation(newPosition) {
        if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
            throw new Error("moveStation: Invalid new position information.");
        }

        if (this.isDraggingStation && this.stationEdited) {
            // Adjust new position using the stored offset
            const adjustedPosition = {
                x: newPosition.x - this.draggingOffset.x,
                y: newPosition.y - this.draggingOffset.y
            };

            // Align position to the grid
            const alignedPosition = this.getHalfGridAlignedPosition(adjustedPosition.x, adjustedPosition.y);

            // Update the station's position
            this.stationEdited.setPosition(alignedPosition.x, alignedPosition.y);

            // Run hooks for any ongoing "movingStation" event
            this.runHooks('movingStation', this.stationEdited);

            // Reattach the station to surrounding metrolines, throttle (for performance) every half a second
            this.throttledUpdateStationMetrolineIds(this.stationEdited);
        }
    }

    // Throttle function to limit how often `updateStationMetrolineIds` is called
    throttledUpdateStationMetrolineIds = helpers.throttle((station) => {
        this.updateStationMetrolineIds(station, true);
    }, 500); // 500ms interval

    /**
     * Finalizes the station movement when the mouse button is released.
     * Stops the dragging process, resets offsets, and updates related metroline IDs.
     * 
     * @throws {Error} Throws an error if `endMoveStation` is called without dragging a station.
     */
    endMoveStation() {
        if (this.isDraggingStation) {
            // Stop dragging state
            this.isDraggingStation = false;

            // Reset offsets
            this.draggingOffset = { x: 0, y: 0 };

            // Update station's metroline IDs based on the final position
            this.updateStationMetrolineIds(this.stationEdited);

            // DeHighlight all lines
            this.lines.forEach(line => line.highlight(false));

            // Trigger hooks for the "movedStation" event
            this.runHooks('movedStation', this.stationEdited);
        }
    }


    //  METROLINES


    /**
     * @method updateLines
     * @description Parses all metrolines in the metroline layer and updates the internal line array.
     */
    updateLines() {
        this.lines = [];

        // Select all lines
        const mapLines = this.metroLineLayer.querySelectorAll("g");
        mapLines.forEach(line => {
           this.lines.push(new metromapMetroline(this, line));
        });

        // Rebuild spatial index after updating lines
        this.updateSpatialIndex('rebuild');
    }

    /**
     * @method getMetrolineWithId
     * @description Retrieves a metroline with the specified ID.
     * 
     * @param {string} id - The ID of the metroline to retrieve.
     * @returns {Object|null} The metroline object with the specified ID, or `null` if no matching metroline is found.
     * 
     * @throws {Error} Throws an error if the provided ID is invalid.
     */
    getMetrolineWithId(id) {
        if (!id || typeof id !== 'string') {
            throw new Error("Invalid ID provided. It must be a non-empty string.");
        }
    
        // Search for the metroline with the given ID in the lines array
        const metroline = this.lines.find(line => line.getId() === id);
    
        // Return the metroline if found, otherwise return null
        return metroline || null;
    }

    
    /**
     * @method getMetrolineWithColor
     * @description Retrieves a metroline with the specified color.
     * 
     * @param {string} color - The color of the metroline to retrieve (in RGB format).
     * @returns {Object|null} The metroline object with the specified color, or `null` if no matching metroline is found.
     * 
     * @throws {Error} Throws an error if the provided color is not in valid RGB format.
     */
    getMetrolineWithColor(color) {
        if (!helpers.isRgb(color)) throw new Error("getMetrolineWithColor: Color not in RGB format"); // must be RGB
    
        // Search for the metroline with the given ID in the lines array
        const metroline = this.lines.find(line => line.getColor() === color);
    
        // Return the metroline if found, otherwise return null
        return metroline || null;
    }

    /**
     * @method addLineLayer
     * @description Creates a new metroline layer with the specified color.
     * @param {string} color - The color of the new metroline.
     * @returns {Object} The created metroline object.
     */
    addLineLayer(color) {
        const metrolineId = "metroline" + color.replace(/[^a-zA-Z0-9]/g, "");
        let existingMetroline = this.getMetrolineWithId(metrolineId);
        if (existingMetroline) return existingMetroline;

        // It does not exist, create a new group
        const metrolineGroup = helpers.createSvgElement("g", {
            id: metrolineId,
            metrolineid: metrolineId
        });
        this.metroLineLayer.appendChild(metrolineGroup);

        // Create new metromapMetroline and add to array
        const newMetroline = new metromapMetroline(this, metrolineGroup);
        newMetroline.setMetrolineColor(color);
        this.lines.push(newMetroline);

        // Update spatial index
        this.updateSpatialIndex('add', newMetroline);

        return newMetroline;
    }

    /**
     * @method drawLineOnCanvas
     * @description Draws a line on the canvas between two points.
     * @param {Object} startLine - The starting coordinates of the line.
     * @param {Object} endLine - The ending coordinates of the line.
     * @param {string} color - The color of the line.
     */
    drawLineOnCanvas(startLine, endLine, color) {
        this.startDrawMetroline(startLine, color);
        this.endDrawMetroline(endLine);
    }

    /**
     * @method startDrawMetroline
     * @description Initiates the drawing of a new metroline on the map, starting at the specified position and using the provided color.
     * 
     * @param {Object} mousePosition - The starting position of the metroline.
     * @param {number} mousePosition.x - The x-coordinate of the starting position.
     * @param {number} mousePosition.y - The y-coordinate of the starting position.
     * @param {string} color - The color of the new metroline.
     * 
     * @throws {Error} Throws an error if the mouse position or color is invalid.
     */
    startDrawMetroline(mousePosition, color) {
        // Validate inputs
        if (!mousePosition || typeof mousePosition.x !== 'number' || typeof mousePosition.y !== 'number') {
            throw new Error("Invalid mousePosition: must contain valid x and y properties.");
        }

        if (!color || typeof color !== 'string') {
            throw new Error("Invalid color: must be a non-empty string.");
        }

        // Save start position on grid
        const alignedPosition = this.getGridAlignedPosition(mousePosition.x, mousePosition.y);
      
        // Does the metroline group already exist or do we need to create a new one?
        const metrolineId = "metroline" + color.replace(/[^a-zA-Z0-9]/g, "");
        let metroline = this.getMetrolineWithId(metrolineId);
        if(!metroline) {
            // Create a new
            metroline = this.addLineLayer(color);
        }

        // Add line to map with current position as begin and endpoint
        const lineSegment = metroline.draw(alignedPosition.x, alignedPosition.y, alignedPosition.x, alignedPosition.y);
      
        // Add to legenda
        this.legenda.add(color);

        // Save metroline edited for updating new positions
        this.selectMetroline(metroline);
        this.metrolineEditedSegment = lineSegment;
      }

    /**
     * @method drawMetroline
     * @description Updates the preview of the currently edited metroline by adjusting its endpoint.
     * 
     * @param {Object} mousePosition - The new position of the metroline endpoint.
     * @param {number} mousePosition.x - The x-coordinate of the new endpoint position.
     * @param {number} mousePosition.y - The y-coordinate of the new endpoint position.
     * 
     * @throws {Error} Throws an error if the mouse position is invalid.
     * 
     * @example
     * metroMapInstance.drawMetroline({ x: 150, y: 250 });
     */
    drawMetroline(mousePosition) {
        // Validate inputs
        if (!mousePosition || typeof mousePosition.x !== 'number' || typeof mousePosition.y !== 'number') {
            throw new Error("Invalid mousePosition: must contain valid x and y properties.");
        }

        // Is a metroline being edited?
        if(this.metrolineEdited && this.metrolineEditedSegment) {
            // Align x and y values
            const alignedPosition = this.getGridAlignedPosition(mousePosition.x, mousePosition.y);

            // Update endpoints
            this.metrolineEdited.drawNewEndPosition(this.metrolineEditedSegment, alignedPosition.x, alignedPosition.y);
        }
    }
    
    /**
     * @method endDrawMetroline
     * @description Completes the drawing of the current metroline, finalizing its position and updating related data.
     * 
     * @param {Object} mousePosition - The final position of the metroline endpoint.
     * @param {number} mousePosition.x - The x-coordinate of the final position.
     * @param {number} mousePosition.y - The y-coordinate of the final position.
     */
    endDrawMetroline(mousePosition) {
        // Update last position
        this.drawMetroline(mousePosition);

        // Run hooks for the 'newLine' event
        this.runHooks('newLine', this.metrolineEdited);

        // Update spatial index with the modified metroline
        this.updateSpatialIndex('rebuild');

        // Reset working variables
        this.metrolineEdited = null;
        this.metrolineEditedSegment = null;
        this.updateAllStationMetrolineIds(); // Update all metroline ids of stations
    }

    /**
     * @method selectMetroline
     * @description Selects a specific metroline for editing and triggers related hooks.
     * 
     * @param {Object} line - The metroline to select.
     * 
     * @example
     * metroMapInstance.selectMetroline(selectedLine);
     */
    selectMetroline(line) {
        this.metrolineEdited = line;

        // Run hooks for the 'selectLine' event
        this.runHooks('selectLine', this.metrolineEdited);
    }

    /**
     * @method unSelectMetroline
     * @description Deselects the currently selected metroline and triggers related hooks.
     * 
     * @example
     * metroMapInstance.unSelectMetroline();
     */
    unSelectMetroline() {
        // Run hooks for the 'selectLine' event
        this.runHooks('unSelectLine', this.metrolineEdited);

        // Reset it
        this.metrolineEdited = null;
    }

    /**
     * Removes a specific polyline segment from a metroline and performs cleanup if necessary.
     * 
     * This function validates the input, removes the given polyline segment from its associated metroline,
     * and ensures proper cleanup of the metroline and related elements if it becomes empty. If the last metroline
     * is removed and there are no stations left, the entire line and its associated elements are deleted.
     * 
     * @param {SVGPolylineElement} polylineSegment - The polyline segment to be removed.
     * 
     * @throws {Error} If the provided `polylineSegment` is not a valid `SVGPolylineElement`.
     */
    removeLineSegment(polylineSegment) {
        // Validate input
        if (!(polylineSegment instanceof SVGPolylineElement)) {
            throw new Error(
                `Invalid polyline segment provided for removal. Expected SVGPolylineElement, got: ${polylineSegment}`
            );
        }

        // Get the line object associated with this segment
        const metrolineId = polylineSegment.getAttribute('metrolineid');
        const line = this.getMetrolineWithId(metrolineId);

        if (!line) {
            throw new Error(`No metroline found with ID: ${metrolineId}`);
        }

        // Remove the segment from the line
        line.removeSegment(polylineSegment);

        // If there are no segments left, handle cleanup
        if (line.getNumberOfLines() < 1) {
            this.removeMetroline(line);
        } else {
            // Update spatial index after removing segment
            this.updateSpatialIndex('rebuild');
        }
    }

    /**
     * Removes an empty metroline and performs additional cleanup if necessary.
     * 
     * This function ensures that the last metroline is not removed if there are still stations on the canvas.
     * If it is not the last metroline or there are multiple lines, the metroline is removed.
     * 
     * @param {Object} line - The metroline to be removed.
     */
    removeMetroline(line) {
        const isLastLine = this.lines.length === 1;
        const hasStations = this.stations.length >= 1;

        // If it is the last line and there are stations, do not remove it
        if (isLastLine && hasStations) {
            return;
        }

        // Run hooks before removal
        this.runHooks('removeLine', line);

        // Update spatial index before removal
        this.updateSpatialIndex('remove', line);

        // Remove the metroline from legenda and DOM
        this.legenda.remove(line.getId());
        const groupElement = line.getGroupElement();
        this.metroLineLayer.removeChild(groupElement);

        // Remove the line from the list of lines
        this.lines = this.lines.filter(metroline => metroline !== line);

        // Update all station metroline IDs to reflect changes
        this.updateAllStationMetrolineIds();
    }

    /**
     * @method prepareMoveMetroline
     * @description Prepares the selected metroline for movement by calculating offsets and initializing the dragging state.
     * 
     * @param {Object} currentposition - The current mouse position.
     * @param {number} currentposition.x - The x-coordinate of the current position.
     * @param {number} currentposition.y - The y-coordinate of the current position.
     * 
     * @throws {Error} Throws an error if no metroline is selected or required elements are not found.
     * 
     */
    prepareMoveMetroline(currentposition) {
        // Check if a line is selected
        if(!this.metrolineEdited) throw new Error('Metromap: preparing to move a metroline, but no line is selected?');

        // Get the metroline group
        const metrolineGroup = this.metrolineEdited.getGroupElement();
        const stationGroup = this.getStationLineLayer(this.metrolineEdited);
        if(!metrolineGroup || !stationGroup) throw new Error('Metromap: preparing to move a metroline, metroline group not found?');

        // Use element mover for moving the metroline group
        const moveGroups = [ metrolineGroup, stationGroup];
        this.prepareMoveCanvasElement(moveGroups, currentposition);
    }
    
    /**
     * @method moveMetroline
     * @description Moves the selected metroline based on the provided new position, snapping to the grid.
     * 
     * @param {Object} newPosition - The new mouse position.
     * @param {number} newPosition.x - The x-coordinate of the new position.
     * @param {number} newPosition.y - The y-coordinate of the new position.
     * 
     */
    moveMetroline(newPosition) {
        this.moveCanvasElement(newPosition);
    }
    
    /**
     * @method endMoveMetroline
     * @description Finalizes the movement of a metroline by applying transformations and resetting the dragging state.
     * 
     */
    endMoveMetroline() {
        // Validate elementsDragged array before accessing
        if (!this.elementsDragged || this.elementsDragged.length < 2) {
            console.error('endMoveMetroline: elementsDragged array is invalid or has insufficient elements');
            this.endMoveCanvasElement();
            return;
        }

        // Apply transformation to the polyline segments
        const offSetLine = helpers.getTranslate(this.elementsDragged[0]);
        if (!offSetLine || offSetLine.length < 2) {
            console.error('endMoveMetroline: Invalid offset values');
            this.endMoveCanvasElement();
            return;
        }
        this.metrolineEdited.moveAllLinesByOffset(offSetLine[0], offSetLine[1]);

        // Apply transformations on stations
        const stationLineGroup = this.getStationLineLayer(this.metrolineEdited);
        this.moveStationsOnLineGroupByOffset(stationLineGroup, offSetLine[0], offSetLine[1]);

        // Remove transform attributes of LineLayer and StationLineLayer
        this.elementsDragged[0].removeAttribute('transform');
        this.elementsDragged[1].removeAttribute('transform');

        // Stop dragging the metrolinegroup
        this.endMoveCanvasElement();

        // Unselect the line
        this.unSelectMetroline();

        // Update all metroline ids
        this.updateAllStationMetrolineIds();

        // Update spatial index after moving metroline
        this.updateSpatialIndex('rebuild');
    }

    /**
     * @method moveAllMetrolinesByOffset
     * @description Moves all metrolines on the map by a specified offset.
     * 
     * @param {number} offsetX - The horizontal offset by which to move the metrolines.
     * @param {number} offsetY - The vertical offset by which to move the metrolines.
     */
    moveAllMetrolinesByOffset(offsetX, offsetY) {
        // Iterate over stations, check if there on the linelayer and move if so
        this.lines.forEach(line => {
                line.moveAllLinesByOffset(offsetX, offsetY);
         });

        // Update spatial index after moving all metrolines
        this.updateSpatialIndex('rebuild');
    }

    /**
     * Retrieves an existing metroline at the specified position or creates a new one if none exists.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {metromapMetroline} - The metroline object.
     */
    getOrCreateMetroline(x, y) {
        // Find an existing metroline at the given position
        let line = this.findMetrolineAt(x, y);

        if (line) {
            return line; // Return the found line
        }

        // If no line exists, create one
        if (this.lines.length === 0) {
            const startLine = { x: x, y: y };
            const endLine = { x: x + 30, y: y };

            // Draw a new line on the canvas
            this.drawLineOnCanvas(startLine, endLine, this.metromapdesigner.currentMetrolineColor);

            // Return the newly created line
            return this.lines[0];
        }

        // If there are existing lines, use the first one as default
        return this.lines[0];
    }

    // SEARCH AND DETECTION FUNCTIONS

    /**
     * @method buildSpatialIndex
     * @description Builds the spatial index from all current metrolines for optimized detection.
     */
    buildSpatialIndex() {
        if (this.spatialIndex) {
            this.spatialIndex.clear();
            this.lines.forEach(metroline => {
                this.spatialIndex.addMetroline(metroline);
            });
        }
    }

    /**
     * @method updateSpatialIndex
     * @description Updates the spatial index when metrolines are added or removed.
     * 
     * @param {string} operation - The operation type: 'add', 'remove', or 'rebuild'
     * @param {Object} metroline - The metroline object (for add/remove operations)
     */
    updateSpatialIndex(operation, metroline = null) {
        if (!this.spatialIndex) return;

        switch (operation) {
            case 'add':
                if (metroline) {
                    this.spatialIndex.addMetroline(metroline);
                }
                break;
            case 'remove':
                if (metroline) {
                    this.spatialIndex.removeMetroline(metroline);
                }
                break;
            case 'rebuild':
                this.buildSpatialIndex();
                break;
            default:
                console.warn(`Unknown spatial index operation: ${operation}`);
        }
    }

    /**
     * @method getSpatialIndexStats
     * @description Gets performance statistics for the spatial index.
     * 
     * @returns {Object} Performance metrics and statistics
     */
    getSpatialIndexStats() {
        return this.spatialIndex ? this.spatialIndex.getStats() : null;
    }

    /**
     * @method findAndSelectStation
     * @description Finds a station based on its SVG `<g>` element and selects it. Returns the station object if found.
     * 
     * @param {SVGGElement} svgStationGroup - The SVG `<g>` element representing the station to find.
     * @returns {Object|null} The station object if found and selected, or `null` if no matching station is found.
     */
    findAndSelectStation(svgStationGroup) {
        // Find the station that has been selected
        let stationSelected = null;
        for (const station of this.stations) {
          // Check this is the station we selected
          if (station.refSvg === svgStationGroup) {
              stationSelected = station;
              break;
          }
        }

        // Check if it is found
        if(stationSelected) {
            this.unselectAllStations();
            this.selectStation(stationSelected);
            return stationSelected;
        } else {
            return null;
        }
    }

    /**
     * Finds a metroline at a specific (x, y) position on the map.
     *
     * @param {number} x - The x-coordinate to check.
     * @param {number} y - The y-coordinate to check.
     * @returns {metromapMetroline|null} - The metroline object if found, or `null` if no metroline is at the given position.
     *
     * @description
     * This function iterates through all metrolines and checks whether the point `(x, y)`
     * lies on any of their segments using the `isPointOnLine` method. If a match is found,
     * the corresponding metroline is returned immediately. If no match is found, it returns `null`.
     */
    findMetrolineAt(x, y) {
        // Return null immediately if there are no lines
        if (!this.lines || this.lines.length === 0) {
            return null;
        }

        // Iterate over each metroline
        for (const line of this.lines) {
            // Check if the point is on this line
            if (line.isPointOnLine(x, y)) {
                return line; // Return the matching metroline
            }
        }

        // Return null if no metroline matches
        return null;
    }

    /**
     * Detects metrolines that overlap with a rotated rectangle shape, with visual debug feedback.
     *
     * @param {Object} rectBBox - The bounding box of the rectangle.
     * @param {number} rectBBox.x - The x-coordinate of the top-left corner of the rectangle.
     * @param {number} rectBBox.y - The y-coordinate of the top-left corner of the rectangle.
     * @param {number} rectBBox.width - The width of the rectangle.
     * @param {number} rectBBox.height - The height of the rectangle.
     * @param {number} rotation - The rotation angle of the rectangle in degrees.
     * @param {number} step - The distance in pixels between points sampled along the rectangle edges.
     * @param {boolean} debug - Whether to enable visual debug feedback.
     * @returns {Set<metromapMetroline>} - A set of metrolines that overlap with the rotated rectangle.
     */
    detectMetrolinesOnBBox(rectBBox, rotation = 0, step = 10, visualFeedback = false, debug = false) {
        const startTime = performance.now();
        const intersectingMetrolines = new Set();

        // Compute rectangle vertices after rotation
        const rectCenter = {
            x: rectBBox.x + rectBBox.width / 2,
            y: rectBBox.y + rectBBox.height / 2
        };
        const rectVertices = helpers.getRotatedRectangleVertices(
            rectBBox.x,
            rectBBox.y,
            rectBBox.width,
            rectBBox.height,
            rotation,
            rectCenter
        );

        // Generate points along the rectangle edges for intersection testing
        const rectSamplePoints = helpers.samplePointsOnPolygonEdges(rectVertices, step);

        // Draw rectangle sample points if debug mode is enabled
        if (debug) {
            this.clearDebugLayer();
            this.createDebugLayer();
            rectSamplePoints.forEach(point => this.drawDebugPoint(point));
        }
        
        // Unselect all lines if visual feedback is enabled
        if(visualFeedback) {
            this.lines.forEach(line => line.highlight(false));
        }

        // Use spatial indexing for dramatically improved performance
        if (this.spatialIndex) {
            // Query spatial index for candidate segments (O(1) average case)
            const candidateSegments = this.spatialIndex.query({
                x: rectBBox.x,
                y: rectBBox.y,
                width: rectBBox.width,
                height: rectBBox.height
            });

            if (debug) {
                console.log(`Spatial index optimization: Testing ${candidateSegments.length} segments instead of ${this.getTotalSegmentCount()}`);
            }

            // Test only spatially relevant segments
            candidateSegments.forEach(({ segment, metroline }) => {
                // Early exit if metroline already found
                if (intersectingMetrolines.has(metroline)) return;

                // Test if segment intersects with the rotated rectangle
                if (this.segmentIntersectsPolygon(segment, rectVertices)) {
                    intersectingMetrolines.add(metroline);
                    if (visualFeedback) metroline.highlight(true);
                }
            });

        } else {
            // Fallback to original brute force method if spatial index unavailable
            console.warn('Spatial index not available, using brute force method');
            
            for (const line of this.lines) {
                if (intersectingMetrolines.has(line)) continue; // Skip if already found
                
                for (const polyline of line.polylines) {
                    const points = Array.from(polyline.points);

                    for (let i = 0; i < points.length - 1; i++) {
                        const segment = {
                            start: { x: points[i].x, y: points[i].y },
                            end: { x: points[i + 1].x, y: points[i + 1].y }
                        };

                        if (this.segmentIntersectsPolygon(segment, rectVertices)) {
                            intersectingMetrolines.add(line);
                            if (visualFeedback) line.highlight(true);
                            break; // Move to next polyline
                        }
                    }
                    if (intersectingMetrolines.has(line)) break; // Move to next line
                }
            }
        }

        if (debug) {
            const elapsedTime = performance.now() - startTime;
            console.log(`detectMetrolinesOnBBox completed in ${elapsedTime.toFixed(2)}ms, found ${intersectingMetrolines.size} intersecting metrolines`);
        }

        return intersectingMetrolines;
    }

    /**
     * @method segmentIntersectsPolygon
     * @description Tests if a line segment intersects with a polygon (rotated rectangle).
     * 
     * @param {Object} segment - Line segment with start and end points
     * @param {Array<Object>} polygonVertices - Array of polygon vertices
     * @returns {boolean} True if segment intersects polygon
     */
    segmentIntersectsPolygon(segment, polygonVertices) {
        const { start, end } = segment;

        // Check if either endpoint is inside the polygon
        if (helpers.pointInPolygon(start, polygonVertices) || 
            helpers.pointInPolygon(end, polygonVertices)) {
            return true;
        }

        // Check if the segment intersects any edge of the polygon
        for (let i = 0; i < polygonVertices.length; i++) {
            const edgeStart = polygonVertices[i];
            const edgeEnd = polygonVertices[(i + 1) % polygonVertices.length];

            if (helpers.lineIntersectsLine(start, end, edgeStart, edgeEnd)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @method getTotalSegmentCount
     * @description Gets the total number of line segments across all metrolines.
     * Used for performance debugging and statistics.
     * 
     * @returns {number} Total segment count
     */
    getTotalSegmentCount() {
        let totalSegments = 0;
        this.lines.forEach(line => {
            if (line.polylines) {
                line.polylines.forEach(polyline => {
                    const points = Array.from(polyline.points);
                    totalSegments += Math.max(0, points.length - 1);
                });
            }
        });
        return totalSegments;
    }

    /**
     * Creates a debug layer for visualizing sampled points.
     */
    createDebugLayer() {
        if (!this.debugLayer) {
        this.debugLayer = helpers.createSvgElement("g", { id: "debugLayer" });
        this.svgMap.appendChild(this.debugLayer); // Add it to the overlay layer
        }
    }

    /**
     * Clears all elements in the debug layer.
     */
    clearDebugLayer() {
        if (this.debugLayer) {
            while (this.debugLayer.firstChild) {
                this.debugLayer.removeChild(this.debugLayer.firstChild);
            }
        }
    }

    /**
     * Draws a debug point at the specified position.
     *
     * @param {Object} point - The position of the point.
     * @param {number} point.x - The x-coordinate of the point.
     * @param {number} point.y - The y-coordinate of the point.
     */
    drawDebugPoint(point) {
        const debugPoint = helpers.createSvgElement("circle", {
            cx: point.x,
            cy: point.y,
            r: 2, // Radius of the debug point
            fill: "red", // Color of the point
            "stroke-width": 0
        });
        this.debugLayer.appendChild(debugPoint);
    }

    // IMPORT / EXPORT FUNCTIONS

    /**
     * Exports the content of the metro map's canvas as an SVG string.
     *
     * @param {boolean} [updateStations=false] - Whether to update the metroline IDs of all stations before exporting.
     * 
     * @returns {string} - The SVG content of the metro map as a string.
     * 
     * @description
     * This function generates and returns the current content of the metro map canvas in SVG format. 
     * It performs the following steps:
     * 1. If `updateStations` is `true`, updates the metroline IDs of all stations to ensure consistency.
     * 2. Deselects all selected stations to prepare the canvas for export.
     * 3. Temporarily removes the grid layer from the canvas to exclude it from the exported SVG.
     * 4. Removes any `transform` attributes from the SVG to ensure the exported content has the correct layout.
     * 5. Captures the SVG content as a string.
     * 6. Re-applies the grid layer to restore the canvas to its original state.
     *
     * **Usage Scenario:**
     * Use this function to export the current state of the metro map for saving, sharing, or processing in other tools.
     */
    getCanvasContent(updateStations = false) {
        // Update all metroline IDs of stations if required
        if (updateStations) {
            this.updateAllStationMetrolineIds();
        }

        // Deselect all stations
        //this.unselectAllStations();

        // Temporarily remove the grid layer
        this.gridRemove();

        // Remove transform attribute and capture SVG content
        this.svgMap.removeAttribute("transform");
        const svgData = this.svgMap.outerHTML;

        // Re-draw the grid layer
        this.gridDraw();

        // Return the SVG content
        return svgData;
    }
  
    /**
     * Generates a JSON representation of the entire metro map, including stations, metrolines, and their corresponding legend information.
     * @returns {Object} A JSON object representing the metro map.
     */
    toJSON() {
        // Map legend items by metrolineID for quick lookup
        const legendItems = this.legenda.toJSON().reduce((map, legendItem) => {
            map[legendItem.metroLineId] = legendItem;
            return map;
        }, {});

        // Merge metroline data with legend info directly
        const metrolinesWithLegend = this.lines.map(line => {
            const metrolineData = line.toJSON();
            const legendData = legendItems[metrolineData.metroLineId] || {};
            return {
                ...legendData,
                ...metrolineData, // Embed legend info directly into the metroline object
            };
        });

        return {
            title: this.getTitle(),
            subTitle: this.getSubTitle(),
            dimensions: {
                width: this.getWidth(),
                height: this.getHeight(),
            },
            externalUniqueId: this.externalUniqueID || null,
            metroLines: metrolinesWithLegend,
            stations: this.stations.map(station => station.toJSON()),
        };
    }

    /**
     * Populates the metro map with data from a JSON object.
     *
     * @param {Object} jsonData - The JSON object containing metro map data.
     * @throws Will throw an error if required properties are missing or invalid.
     */
    fromJSON(jsonData) {
        try {
            // Validate required properties
            if (!jsonData || typeof jsonData !== "object") {
                throw new Error("Invalid JSON data provided for map import.");
            }

            // Set the map title
            if (jsonData.title) this.setTitle(jsonData.title);
            this.externalUniqueID = jsonData.externalUniqueID || ""; 
            this.svgMap.setAttribute("externalUniqueId", this.externalUniqueID);

            // Set the map academy
            this.setSubTitle(jsonData.subTitle || "");

            // Set the map dimensions
            if (jsonData.dimensions?.width && jsonData.dimensions?.height) {
                this.setDimensions(jsonData.dimensions.width, jsonData.dimensions.height);
            }

            // Import metrolines
            if (Array.isArray(jsonData.metroLines)) {
                jsonData.metroLines.forEach(metrolineData => {
                    const lineColor = `rgb(${metrolineData.color.r},${metrolineData.color.g},${metrolineData.color.b})`;

                    // Create and populate the metroline
                    const newMetroline = this.addLineLayer(lineColor);
                    newMetroline.fromJSON(metrolineData);

                    // Add the metroline to the legend
                    this.legenda.add(
                        lineColor,
                        metrolineData.name || "Metrolijn",
                        metrolineData.targetGroup || "Doelgroep"
                    );
                });
            }

            // Import stations
            if (Array.isArray(jsonData.stations)) {
                jsonData.stations.forEach(stationData => {
                    if (!Array.isArray(stationData.metroLines) || stationData.metroLines.length === 0) {
                        throw new Error(`Station "${stationData.name || 'unknown'}" has no associated metrolines.`);
                    }
                    const metroline = this.getMetrolineWithId(stationData.metroLines[0]);
                    const stationLineLayer = this.getStationLineLayer(metroline);
                    stationData.x = stationData.position.x;
                    stationData.y = stationData.position.y;
                    stationData.metrolineid = stationData.metroLines[0]; 

                    const newStation = new metromapStation(this, stationLineLayer, null, stationData);
                    this.stations.push(newStation);
                });
            }

            // Recreate color table
            this.metroMapRecreateColorTable();

            // Update metroline ids with RAF for better performance
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.updateAllStationMetrolineIds();
                });
            });

        } catch (error) {
            console.error("Error importing metro map from JSON:", error);
            throw new Error(`Failed to import JSON data: ${error.message}`);
        }
    }
}
