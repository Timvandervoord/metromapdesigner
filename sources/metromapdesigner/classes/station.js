import * as helpers from '../common.js';
import * as config from '../config.js';

/**
 * Represents a station on a metro map. 
 * 
 * This class is responsible for creating, managing, and updating stations in an SVG-based metro map. 
 * Each station can represent different types (e.g., start, end, connection) and is associated with 
 * one or more metrolines. The station's properties and its visual representation in the SVG 
 * are synchronized through this class.
 */
export default class metromapStation {
    // Reference to metromap
    metromap;

    // reference to the svg representation
    refSvg;

    // reference to different layers of the button
    stationShapeGroupLayer;
    stationTypeGroupLayer;
    stationNameGroupLayer;
    stationButtonLayer;

    // Reference to station line layer group this station is a part of
    stationLineLayer;

    // Metrolines this station associates to
    metrolines = [];

    // External uniqueID
    externalUniqueID;

    /**
     * Creates a new Station instance.
     * 
     * @param {Array} metrolines - List of metroline objects associated with the station.
     * @param {Object} [refSvg=null] - Reference to the existing SVG `<g>` element for the station. If not provided, a new element is created.
     * @param {Object} [configuration={}] - Custom configuration for the station. Overrides default values from `stationDefaultConfig`.
     * @param {string} configuration.name - Name of the station.
     * @param {string} configuration.type - Type of the station (e.g., "w", "x", "e", "o").
     * @param {string} configuration.date - Date associated with the station (any format).
     * @param {string} configuration.description - Description of the station.
     * @param {string} configuration.link - URL link associated with the station.
     * @param {number} configuration.orientation - Station's orientation in degrees (0–315).
     * @param {string} configuration.shape - Shape type of the station (e.g., "normal", "start", "end", "connection").
     * @param {number} configuration.size - Size of the station's shape.
     * @param {number} configuration.width - Width of the station's connection lines.
     * @param {number} configuration.x - X-coordinate of the station's position.
     * @param {number} configuration.y - Y-coordinate of the station's position.
     */
    constructor(map, stationLineLayer, refSvg = null, configuration = {}) {

        // Set map reference
        this.metromap = map;

        // Set stationLineLayer reference
        this.stationLineLayer = stationLineLayer;
    
        // Set the refSvg, default to a new object if not provided
        if(refSvg && refSvg.getAttribute("class") == "stationGroup") {
            this.setReference(refSvg);
        } else {
            // Merge the default configuration with the provided configuration
            const stationValues = { ...config.stationDefaultConfig, ...configuration };
        
            // Apply configuration
            this.name = stationValues.name;
            this.type = stationValues.type;
            this.date = stationValues.date;
            this.description = stationValues.description;
            this.link = stationValues.link;
            this.orientation = stationValues.orientation;
            this.shape = stationValues.shape;
            this.size = stationValues.size;
            this.width = stationValues.width;
            this.metrolineid = stationValues.metrolineid;
            this.x = stationValues.x;
            this.y = stationValues.y;
            this.externalUniqueID = stationValues.externalUniqueId || null;

            // Create new station
            this.new();
        }
    }

    /**
     * Sets the reference to an existing SVG element representing the station.
     * 
     * This method binds the station instance to an existing SVG element, initializes 
     * its layer references, and synchronizes its properties with the SVG representation.
     * 
     * @param {Object} refSvg - SVG `<g>` element representing the station.
     * @throws {Error} If `refSvg` is invalid or missing.
     */
    setReference(refSvg) {
        // Add code to get data out of svg data
        this.refSvg = refSvg;
        // Get all layers
        this.setLayerReferences();
        // Update all information from SVG
        this.readSVG();
        // Reload metrolines array
        this.parseMetrolines();
    }

    /**
     * Reads and synchronizes the station's properties from its SVG representation.
     * 
     * This method extracts data such as position, orientation, name, type, and description 
     * from the referenced SVG element and updates the corresponding properties of the station.
     * 
     * @throws {Error} If `refSvg` is not set or invalid.
     */
    readSVG() {
        if (!this.refSvg) {
            throw new Error("readSVG: No refSvg set. Ensure you pass a valid SVG reference.");
        }

        // Get attribute information
        this.orientation = Number(this.refSvg.getAttribute("stationorientation"));
        this.shape = this.refSvg.getAttribute("stationshapetype");
        this.size = Number(this.refSvg.getAttribute("stationshapesize"));
        this.width = Number(this.refSvg.getAttribute("stationshapelinewidth"));
        this.description = this.refSvg.querySelector("title.stationDescription").textContent;
        this.type = this.refSvg.querySelector("text.stationType").textContent;
        this.date = this.stationNameGroupLayer.querySelector("tspan.stationDate").textContent;
        this.link = this.refSvg.querySelector("a.stationLink").getAttribute("xlink:href");
        this.externalUniqueID = this.refSvg.getAttribute("externalUniqueID", this.externalUniqueID || "");

        // Get X and Y values
        const transform = this.refSvg.getAttribute("transform");
        const { translate, rotate } = helpers.parseTransform(transform);
        const translateValues = translate.match(/\(([^)]+)\)/)[1].split(",").map(Number); // Extract x and y
        this.x = translateValues[0];
        this.y = translateValues[1];

        // Get name value
        let stationNameTspans = this.stationNameGroupLayer.querySelectorAll("tspan.stationNameRule");

        // Reconstruct the stationname by deconstructing the Tspan elements
        this.name = "";
        stationNameTspans.forEach((stationNamePart) => {
            this.name = this.name + " " + stationNamePart.textContent;
        });
        this.name = this.name.trim(); // remove spaces
    }

    /**
     * Initializes references to the station's SVG layers.
     * 
     * This method identifies and validates essential SVG layers, such as the shape, 
     * type, name, and button groups, ensuring the station's structure is complete.
     * 
     * @throws {Error} If any required SVG layer is missing.
     */
    setLayerReferences() {
        if (!this.refSvg) {
            throw new Error("setLayerReferences: No refSvg set. Ensure you pass a valid SVG reference.");
        }

        // Query layers
        this.stationShapeGroupLayer = this.refSvg.querySelector("g.stationShapeGroup");
        this.stationTypeGroupLayer = this.refSvg.querySelector("g.stationTypeGroup");
        this.stationNameGroupLayer = this.refSvg.querySelector("g.stationNameGroup");
        this.stationButtonLayer = this.refSvg.querySelector("g.stationButtonGroup");

        // Validate all layers
        const validateLayer = (layer, layerName) => {
            if (!layer) {
                throw new Error(`setLayerReferences: ${layerName} layer is missing in the station SVG code.`);
            }
        };
        validateLayer(this.stationShapeGroupLayer, "Shape Group Layer");
        validateLayer(this.stationTypeGroupLayer, "Station type Layer");
        validateLayer(this.stationNameGroupLayer, "Station name Layer");
        validateLayer(this.stationButtonLayer, "Station button Layer");
    }

    /**
     * Updates the station's SVG representation to reflect its current properties.
     * 
     * Properties like name, type, orientation, shape, size, and link are applied 
     * to the station's SVG element. This ensures the visual representation matches 
     * the station's logical state.
     * 
     * @throws {Error} If `refSvg` is not set or no metrolines are associated with the station.
     */
    updateSVG() {
        // Checks
        if (!this.refSvg) {
            throw new Error("UpdateSVG: No refSvg set. Ensure you pass a valid SVG reference.");
        }
        if (this.metrolines.length === 0)  {
            throw new Error("UpdateSVG: No metrolines are set");
        }

        // Update attribute information
        this.refSvg.setAttribute("stationshapeorientation", this.orientation || 0);
        this.refSvg.setAttribute("stationshapetype", this.shape || "");
        this.refSvg.setAttribute("externalUniqueID", this.externalUniqueID || "");

        // Update metroline and color of shape
        this.refSvg.setAttribute("metrolineid", this.metrolines.map((metroline) => metroline.getId()).join(","));
        this.setStationShape(this.stationShapeGroupLayer, this.shape, this.metrolines[0].getColor());

        // Update width and size of station
        this.refSvg.setAttribute("stationshapesize", this.size || 0);
        if(this.refSvg.getAttribute("stationlinewidth") !== this.width) {
            this.refSvg.setAttribute("stationlinewidth", this.width || 0);
            if(this.shape === "connection") {
                let shapeRef = this.stationShapeGroupLayer.querySelector("rect");
                shapeRef.setAttribute("width", this.size);
            }
        }

        // Update description
        const descriptionElement = this.refSvg.querySelector("title.stationDescription");
        if (descriptionElement) {
            descriptionElement.textContent = this.description || "";
        }

        // Update type
        const typeElement = this.refSvg.querySelector("text.stationType");
        if (typeElement) {
            typeElement.textContent = this.type || "";
        }

        // Update link
        const linkElement = this.refSvg.querySelector("a.stationLink");
        if (linkElement) {
            linkElement.setAttribute("xlink:href", this.link || "");
        }

        // Update transform for X and Y values
        const currentTransform = this.refSvg.getAttribute("transform") || "";
        const { rotate } = helpers.parseTransform(currentTransform);
        const newTranslate = `translate(${this.x || 0}, ${this.y || 0})`;
        this.refSvg.setAttribute("transform", `${newTranslate} ${rotate}`);

        // Update date
        const dateElement = this.stationNameGroupLayer.querySelector("tspan.stationDate");
        if (dateElement) {
            dateElement.textContent = this.date || "";
        }

        // Update name
        const naamElement = this.stationNameGroupLayer.querySelector("text.stationName");
        this.constructStationNameText(naamElement, this.name, dateElement);
    }
        
    /**
     * Gets the name of the station.
     * @returns {string} The station's name.
     */
    getName() {
        return this.name;
    }

    /**
     * Sets the name of the station.
     * @param {string} value - The new name of the station.
     */
    setName(value) {
        this.name = value;
        this.updateSVG();
        this.render(); // rerender the station
    }

    /**
     * Gets the type of the station.
     * @returns {string} The station's type.
     */
    getType() {
        return this.type;
    }

    /**
     * Returns the stationlayer the station belongs to
     * @returns {object} SVG stationlayer
     */
    getStationLineLayer() {
        return this.stationLineLayer;
    }

    /**
     * Sets the type of the station.
     * @param {string} value - The new type of the station.
     */
    setType(value) {
        this.type = value;
        this.updateSVG();
    }

    /**
     * Gets the date associated with the station.
     * @returns {string} The station's date.
     */
    getDate() {
        return this.date;
    }

    /**
     * Sets the date associated with the station.
     * @param {string} value - The new date of the station.
     */
    setDate(value) {
        this.date = value;
        this.updateSVG();
    }

    /**
     * Gets the description of the station.
     * @returns {string} The station's description.
     */
    getDescription() {
        return this.description;
    }

    /**
     * Sets the description of the station.
     * @param {string} value - The new description of the station.
     */
    setDescription(value) {
        this.description = value;
        this.updateSVG();
    }

    /**
     * Gets the link associated with the station.
     * @returns {string} The station's link.
     */
    getLink() {
        return this.link;
    }

    /**
     * Sets the link associated with the station.
     * @param {string} value - The new link of the station.
     */
    setLink(value) {
        this.link = value;
        this.updateSVG();
    }

    /**
     * Gets the metroline ID associated with the station.
     * @returns {array} Metrolines this station belongs to
     */
    getMetrolines() {
        return this.metrolines;
    }

    /**
     * Returns the metrolineid string for this station
     * @returns {string} Metrolineids
     */
    getMetrolineId() {
        return this.metrolineid;
    }

    /**
     * Adds a metroline object to the metrolines array.
     * @param {Object} metroline - The metroline object to add.
     * @throws {Error} If metroline is not a valid object.
     */
    addMetroline(metroline) {
        if (!metroline || typeof metroline !== "object") {
            throw new Error("addMetroline: Invalid metroline object.");
        }

        this.metrolines.push(metroline);
        this.updateMetrolineIds();
    }

    /**
     * Removes a metroline object from the metrolines array.
     * @param {Object} metroline - The metroline object to remove.
     * @throws {Error} If metroline is not found in the array.
     */
    removeMetroline(metroline) {
        const index = this.metrolines.indexOf(metroline);
        if (index === -1) return; // do nothing

        this.metrolines.splice(index, 1);
        this.updateMetrolineIds();
    }

    /**
     * Moves a station to a new metroline and station layer.
     * @param {Object} newMetroline - The new metroline object to associate with the station.
     * @param {Object} newStationLayer - The new station layer (`<g>` element) to move the station to.
     * @throws {Error} If the station is of type "connection" or if required parameters are missing.
     */
    moveToMetroline(newMetroline, newStationLayer) {
        if (!newMetroline || !newStationLayer) {
            throw new Error("moveMetroline: Both newMetroline and newStationLayer are required.");
        }

        // Compare the current metroline ID with the new metroline ID
        const newMetrolineId = newMetroline.getId();
        if (this.metrolineid === newMetrolineId) {
            return; // Exit if the IDs are the same
        }

        // Update the metroline ID property and reset the metrolines array
        this.metrolineid = newMetrolineId;
        this.metrolines = [];
        this.addMetroline(newMetroline);

        // Remove the station from its current station layer
        this.stationLineLayer.removeChild(this.refSvg);

        // Move the station to the new station layer
        this.stationLineLayer = newStationLayer;
        this.stationLineLayer.appendChild(this.refSvg);

        // Update the SVG for visual changes
        this.updateSVG();

    }

    /**
     * Gets the orientation of the station.
     * @returns {number} The station's orientation (degrees).
     */
    getOrientation() {
        return Number(this.orientation);
    }

    /**
     * Sets the orientation of the station.
     * @param {number} value - The new orientation (degrees).
     */
    setOrientation(value) {
        this.orientation = value;
        this.setStationRotation(value);
        this.render(); // rerender the station
    }

    /**
     * Gets the shape of the station.
     * @returns {string} The station's shape.
     */
    getShape() {
        return this.shape;
    }

    /**
     * Sets the shape of the station.
     * @param {string} value - The new shape of the station.
     */
    setShape(value) {
        this.shape = value;
        this.updateSVG();
        this.render(); // rerender the station
    }

    /**
     * Gets the size of the station's shape.
     * @returns {number} The size of the station.
     */
    getSize() {
        return this.size;
    }

    /**
     * Gets the width of the station's connection lines.
     * @returns {number} The width of the connection lines.
     */
    getWidth() {
        return this.width;
    }

    /**
     * Sets the width of the station's connection lines.
     * @param {number} value - The new width of the connection lines.
     */
    setWidth(value) {
        this.width = value;
        // Calculate new size
        let shapeSize = this.width * config.metrolineConfig.thickness + 10 * this.width;
        this.size = shapeSize;
        // Update information
        this.updateSVG();
        this.render(); // rerender the station
    }

    /**
     * Gets the width of the station's connection lines.
     * @returns {array} with x and y values
     */
    getPosition() {
        return { x : this.x,  y: this.y }; 
    }

    /**
     * Sets the width of the station's connection lines.
     * @param {number} value - The new width of the connection lines.
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateSVG();
    }

    /**
     * Moves the station by a given offset.
     * @param {number} offsetX - The offset to move the station along the X-axis.
     * @param {number} offsetY - The offset to move the station along the Y-axis.
     */
    moveByOffset(offsetX, offsetY) {
        const newX = this.x + offsetX;
        const newY = this.y + offsetY;
        this.setPosition(newX, newY);
    }

    /**
     * Make this the selected station
     */
    select() {
        // Make stroke of shape element red
        let shapeElement = this.refSvg.querySelector(".stationButton");
        shapeElement.setAttribute("style", "stroke: red");
    }

    /**
     * Make this the selected station
     */
    unSelect() {
        // Make stroke of shape element red
        let shapeElement = this.refSvg.querySelector(".stationButton");
        shapeElement.setAttribute("style", "stroke: transparent");
    }

    /**
     * Updates the metrolineid attribute of the station's SVG representation
     * based on the current metrolines array.
     * 
     * This function performs the opposite of parseMetrolines by serializing
     * the metroline objects in the `metrolines` array to a comma-separated
     * string of their IDs and updating the `metrolineid` attribute of the
     * station's SVG element.
     */
    updateMetrolineIds() {
        if (!this.refSvg) {
            throw new Error("updateMetrolineIds: No refSvg set. Ensure you pass a valid SVG reference.");
        }

        // Generate a comma-separated list of metroline IDs from the metrolines array
        const metrolineIds = this.metrolines.map(metroline => metroline.getId()).join(",");

        // Update the metrolineid property
        this.metrolineid = metrolineIds;

        // Update the metrolineid attribute on the SVG element
        this.refSvg.setAttribute("metrolineid", metrolineIds);
    }

    /**
     * Resets the metrolines array
     */
    parseMetrolines() {
        this.metrolines = [];
    
        // Get the metroline IDs from the attribute, default to an empty string if missing
        const metrolineids = (this.refSvg.getAttribute('metrolineid') || "").split(",").map(id => id.trim());
    
        metrolineids.forEach(id => {
            const metroline = this.metromap.getMetrolineWithId(id);
            if (metroline) {
                this.metrolines.push(metroline);
            } else {
                console.warn(`Metroline ID ${id} not found.`);
            }
        });
    }

    /**
     * Creates a new SVG representation for the station.
     * 
     * This method generates a fresh SVG structure for the station, including groups 
     * for its shape, type, name, and clickable areas. The new structure is attached 
     * to the `refSvg` property.
     */
    new() {
        // Get the primary metroline object
        const metroline = this.metromap.getMetrolineWithId(this.metrolineid);
        if(!metroline) throw new Error("New station: metroline with id not found: " + this.metrolineid);

        // ## STAGE 1 - Create station grouping element
        const stationGroup = helpers.createSvgElement("g", {
            class: "stationGroup",
            position: "relative",
            stationorientation: this.orientation,
            stationshapetype: this.shape,
            stationshapesize: this.size,
            metrolineid: this.metrolineid,
            transform: "translate(" + this.x + "," + this.y + ")",
        });

        // ## STAGE 2 - creation clickable rectangle on top and create description
        const stationLinkGroup = helpers.createSvgElement("g", {
            class: "stationButtonGroup",
        });
        const rectangle = helpers.createSvgElement("rect", {
            x: 0,
            y: 0,
            width: 10, // doesnt matter, will be rendered later
            height: 10,
            fill: "transparent",
            stroke: "transparent",
            class: "stationButton",
            style: "opacity: 0",
        }); // Will be resized and positioned in a later stage

        // Create a title element to display the description of the station
        const description = helpers.createSvgElement("title", {
            class: "stationDescription",
        });
        description.textContent = this.description;

        // Create link element to encapsulate to make the rectangle clickable
        const link = helpers.createSvgElement("a", {
            class: "stationLink",
        });
        link.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", this.link);

        // Construct the button element
        link.appendChild(description);
        link.appendChild(rectangle);
        stationLinkGroup.appendChild(link);

        // ## STAGE 3 - determine and create station shape
        const stationShapeGroup = helpers.createSvgElement("g", {
            class: "stationShapeGroup",
        });
        const shapeColor = metroline.getColor() || config.stationVisualConfig.stationConnectionColor;
        this.setStationShape(stationShapeGroup, this.shape, shapeColor);

        // Save shapesize in svg
        stationGroup.setAttribute("stationshapesize", this.size);
        stationGroup.setAttribute("stationshapeorientation", this.orientation);
        stationGroup.setAttribute("stationshapelinewidth", this.width);

        // ## STAGE 4 - create station type description element
        const stationTypeGroup = helpers.createSvgElement("g", {
            transform: "translate(0,0)",
            class: "stationTypeGroup",
        });
        const stationTypeRect = helpers.createSvgElement("rect", {
            width: config.stationVisualConfig.stationTypeBoxWidth,
            height: config.stationVisualConfig.stationTypeBoxHeight,
            rx: config.stationVisualConfig.stationTypeRounding,
            ry: config.stationVisualConfig.stationTypeRounding,
            fill: config.stationVisualConfig.stationTypeRectColor,
        });
        const stationTypeLetter = helpers.createSvgElement("text", {
            x: config.stationVisualConfig.stationTypeTextOffset.x,
            y: config.stationVisualConfig.stationTypeTextOffset.y,
            "text-anchor": "middle",
            "font-size": config.stationVisualConfig.stationFontSize + "px",
            "font-weight": config.stationVisualConfig.stationTypeFontWeight,
            "font-family": config.stationVisualConfig.stationFont,
            class: "stationType",
            fill: config.stationVisualConfig.stationTypeFontColor,
        });
        stationTypeLetter.textContent = this.type;
        stationTypeGroup.appendChild(stationTypeRect);
        stationTypeGroup.appendChild(stationTypeLetter);

        // ## STAGE 5 - create the station title text element
        const stationNaamGroup = helpers.createSvgElement("g", {
            class: "stationNameGroup",
        });
        const stationNaam = helpers.createSvgElement("text", {
            "text-anchor": "start",
            "alignment-baseline": "left",
            "font-size": config.stationVisualConfig.stationFontSize + "px",
            "font-weight": config.stationVisualConfig.stationNameFontWeight,
            "font-family": config.stationVisualConfig.stationFont,
            class: "stationName",
            x: 0,
            y: 0, 
            fill: config.stationVisualConfig.stationNameFontColor,
        });
        const stationTspanDate = helpers.createSvgElement("tspan", {
            "font-size": config.stationVisualConfig.stationDateFontSize + "px",
            "font-weight": config.stationVisualConfig.stationDateFontWeight,
            "font-family": config.stationVisualConfig.stationFont,
            dy: config.stationVisualConfig.stationNameLineHeight + "px",
            class: "stationDate",
            x: 0,
            y: 0,
            fill: config.stationVisualConfig.stationNameFontColor,
        });
        stationTspanDate.textContent = this.date;

        // Construct text element
        this.constructStationNameText(stationNaam, this.name, stationTspanDate);
        stationNaamGroup.appendChild(stationNaam);

        // ## STAGE 6 - construct the svg code

        // Apply elements
        stationGroup.appendChild(stationShapeGroup);
        stationGroup.appendChild(stationTypeGroup);
        stationGroup.appendChild(stationNaamGroup);
        stationGroup.appendChild(stationLinkGroup);

        // Set references 
        this.stationShapeGroupLayer = stationShapeGroup;
        this.stationTypeGroupLayer = stationTypeGroup;
        this.stationNameGroupLayer = stationNaamGroup;
        this.stationButtonLayer = stationLinkGroup;
        this.refSvg = stationGroup;

        // Add it to canvas
        this.stationLineLayer.appendChild(this.refSvg);

        // Update metrolines array
        this.parseMetrolines();

        // Render its orientation and sizes
        this.render();
    }

    remove() {
        // Remove it from canvas
        this.stationLineLayer.removeChild(this.refSvg);
        this.refSvg = null;
    }

    /**
     * Updates the shape of the station in the SVG.
     * 
     * Depending on the shape type (e.g., "start", "end", "connection", "normal"), 
     * this method updates the SVG representation accordingly.
     * 
     * @param {SVGElement} stationShapeGroup - The SVG group where the shape is rendered.
     * @param {string} shapeType - Type of the shape (e.g., "normal", "start", "end").
     * @param {string} shapeColor - Color of the station shape.
     */
    setStationShape(stationShapeGroup, shapeType = "normal", shapeColor) {
        let shapeSize = 0;
    
        // Remove any current shapes if they exist
        while (stationShapeGroup.firstChild) {
        stationShapeGroup.removeChild(stationShapeGroup.firstChild);
        }
    
        // Select the shapetype
        switch (shapeType) {
        case "start":
            // Outside circle
            let firstStartCircle = helpers.createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: config.stationVisualConfig.stationStartEndRadius,
            fill: config.stationVisualConfig.stationStartEndInsideColor,
            stroke: shapeColor,
            "stroke-width": config.stationVisualConfig.stationStartEndStrokeWidth,
            class: "stationShapeStart",
            });
            // Inside circle
            let secondStartCircle = helpers.createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: Number(config.stationVisualConfig.stationStartEndRadius / 3),
            fill: config.stationVisualConfig.stationStartEndInsideColor,
            stroke: shapeColor,
            "stroke-width": config.stationVisualConfig.stationStartEndStrokeWidth,
            class: "stationShapeStart",
            });
            stationShapeGroup.appendChild(firstStartCircle);
            stationShapeGroup.appendChild(secondStartCircle);
            shapeSize = config.stationVisualConfig.stationStartEndRadius * 2 + 5;
            break;
    
        case "end":
            // Outside circle
            let firstEndCircle = helpers.createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: config.stationVisualConfig.stationStartEndRadius,
            fill: config.stationVisualConfig.stationStartEndInsideColor,
            stroke: shapeColor,
            "stroke-width": config.stationVisualConfig.stationStartEndStrokeWidth,
            class: "stationShapeStart",
            });
            // Inside circle
            let secondEndCircle = helpers.createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: Number(config.stationVisualConfig.stationStartEndRadius / 3),
            fill: shapeColor,
            stroke: shapeColor,
            "stroke-width": config.stationVisualConfig.stationStartEndStrokeWidth,
            class: "stationShapeStart",
            });
            stationShapeGroup.appendChild(firstEndCircle);
            stationShapeGroup.appendChild(secondEndCircle);
            shapeSize = config.stationVisualConfig.stationStartEndRadius * 2 + 5;
            break;
    
        case "connection":
            const lineWidth = this.width || 2;
            shapeSize = lineWidth * config.metrolineConfig.thickness + 10 * lineWidth;
            let xOffset = config.metrolineConfig.thickness;
            let yOffset = Number(config.metrolineConfig.thickness / 2) + 3;
            let connectShape = helpers.createSvgElement("rect", {
            rx: 14,
            ry: 14,
            y: -yOffset,
            x: -xOffset,
            width: shapeSize,
            height: config.metrolineConfig.thickness + 4,
            stroke: config.stationVisualConfig.stationConnectionColor,
            "stroke-width": config.stationVisualConfig.stationStartEndStrokeWidth,
            fill: config.stationVisualConfig.stationConnectionColorInside,
            class: "stationShapeConnection",
            });
            stationShapeGroup.appendChild(connectShape);
            break;
    
        default:
            // normal shape
            let shape = helpers.createSvgElement("circle", {
            cx: 0,
            cy: 0,
            r: config.stationVisualConfig.stationNormalRadius,
            stroke: shapeColor,
            "stroke-width": config.stationVisualConfig.stationNormalStrokeWidth,
            fill: config.stationVisualConfig.stationNormalInsideColor,
            class: "stationShapeNormal",
            });
            shapeSize = config.stationVisualConfig.stationNormalRadius * 2;
            stationShapeGroup.appendChild(shape);
            break;
        }
    
        // Set the new shapesize
        this.size = shapeSize;
    }

    /**
     * Constructs the name element for the station in the SVG.
     * 
     * This method wraps the station name and date into separate `<tspan>` elements 
     * for proper formatting and alignment within the SVG text.
     * 
     * @param {SVGElement} stationTextElement - The `<text>` element where the name is displayed.
     * @param {string} text - The station's name.
     * @param {SVGElement} dateTspan - The `<tspan>` element for the station's date.
     * @returns {SVGElement} The updated text element containing the name and date.
     */
    constructStationNameText(stationTextElement, text, dateTspan) {
        if (!(stationTextElement instanceof SVGElement)) {
            throw new Error("constructStationNameText: Invalid station text element.");
        }    
      
        // Remove all current tspan elements from station naam
        stationTextElement.innerHTML = "";

        // Get new array of tspan elements
        let x = Number(stationTextElement.getAttribute("x"));
        let y = Number(stationTextElement.getAttribute("y"));
        let stationNameElements = this.wrapStationNameText(text, x, y);
        let dy = 0; // determine largest DY for the date tspan
        stationNameElements.forEach((naamElement) => {
          if (naamElement instanceof SVGElement) {
            stationTextElement.appendChild(naamElement);
            let newDy = parseInt(naamElement.getAttribute("dy"));
            if (newDy > dy) {
              dy = newDy;
            }
          }
        });
        dy = dy + config.stationVisualConfig.stationNameLineHeight;
        dateTspan.setAttribute("dy", `${dy}px`); // place date below the stationtext
        stationTextElement.appendChild(dateTspan); // Re-add the date tspan to end
      
        return stationTextElement;
      }

    /**
     * Wraps the station name into multiple lines for SVG rendering.
     * 
     * This method splits the station name into words and creates separate `<tspan>` 
     * elements for each line, ensuring the text adheres to the maximum character length per line.
     * 
     * @param {string} text - The full name of the station.
     * @param {number} [x=0] - X-coordinate for the text placement.
     * @param {number} [y=0] - Y-coordinate for the text placement.
     * @returns {Array<SVGElement>} An array of `<tspan>` elements representing the wrapped text.
     */
    wrapStationNameText(text, x = 0, y = 0) {
        if (!text || typeof text !== "string") {
            throw new Error("wrapStationNameText: Invalid input text.");
        }
    
        // Split the text into words for wrapping
        const words = text.split(/\s+/);
        const tspans = [];
        let currentLine = "";
        let numRule = 0;
    
        // Process each word and wrap text into lines
        words.forEach((word, index) => {
            const testLine = `${currentLine} ${word}`.trim();
    
            // Check if the current line exceeds the maximum allowed character length
            if (testLine.length > config.stationVisualConfig.stationMaxNameCharLength && index > 0) {
                // Create a <tspan> element for the current line
                tspans.push(helpers.createTspanElement(currentLine, x, y, numRule));
                currentLine = word; // Start a new line with the current word
                numRule++;
            } else {
                currentLine = testLine;
            }
        });
    
        // Add the last line if any
        if (currentLine) {
            tspans.push(helpers.createTspanElement(currentLine, x, y, numRule));
        }
    
        // Adjust the `dy` attribute for vertical spacing
        let dy = -(tspans.length * config.stationVisualConfig.stationNameLineHeight) * 0.25;
        tspans.forEach((tspan) => {
            tspan.setAttribute("dy", `${dy}px`);
            dy += config.stationVisualConfig.stationNameLineHeight;
        });
    
        return tspans;
    }

    /**
     * Renders the station on the SVG canvas.
     * 
     * This method ensures the station's orientation, position, and button interaction 
     * areas are properly adjusted and displayed after all configurations are applied.
     * 
     * @param {SVGElement} canvas - The SVG canvas where the station is rendered.
     */
    render() {
        // Set station orientation after the fonts are loaded and after the next frame is rendered
        document.fonts.ready.then(() => {
            requestAnimationFrame(() => {
                this.setStationRotation(this.orientation);
                this.adjustStationButton();
            });
        });
    }

    /**
     * Sets the rotation of the station's SVG representation.
     * 
     * This method rotates the station to the specified angle and adjusts the 
     * alignment of associated text and shapes to maintain proper orientation.
     * 
     * @param {number} angle - The angle (in degrees) to rotate the station.
     */
    setStationRotation(angle = 0) {
        // Helper function to determine the offset for text
        const getOffsetText = (shape, size, offsetConfig = {}, inverse) => {
            // Use defaults if offsetConfig is undefined or missing properties
            const normalOffset = offsetConfig.normal || 60; // Default base offset
            const connectionOffset = offsetConfig.connection || 80; // Default connection offset
            const startEndOffset = offsetConfig.startEnd || 60; // Default start/end offset
    
            switch (shape) {
                case "start":
                case "end":
                    // Just add the offset to the radius of the shape
                    return config.stationVisualConfig.stationStartEndRadius + startEndOffset;
                case "connection":
                    // When inversed just the offset is enough, when not inversed take the size in consideration and substract 2 times the connections shape offset (= 2x metroline thickness)
                    return inverse ? + connectionOffset : size - (config.metrolineConfig.thickness * 2) + connectionOffset;
                default: // For normal shape just take the radius and add the offset
                    return config.stationVisualConfig.stationNormalRadius + normalOffset;
            }
        };

        // Helper function to determine the offset for typebox
        const getOffsetType = (shape, size, offsetConfig = {}, inverse) => {
            // Use defaults if offsetConfig is undefined or missing properties
            const normalOffset = offsetConfig.normal || 20; // Default base offset
            const connectionOffset = offsetConfig.connection || 40; // Default connection offset
            const startEndOffset = offsetConfig.startEnd || 20; // Default start/end offset
    
            switch (shape) {
                case "start":
                case "end":
                    // When inversed use radius of the shape, width of the typebox (since 0,0 coordinate is left lower corner) and add the offset, not inversed use radius of shape and add offset
                    return inverse ? config.stationVisualConfig.stationStartEndRadius + config.stationVisualConfig.stationTypeBoxWidth + startEndOffset : config.stationVisualConfig.stationStartEndRadius + startEndOffset;
                case "connection":
                    // The connection station is not a circle but a rectangle that is offset on the X coordate by metroline thickness, for inverse just add the offset, for not inversed we need to take the size minus 2 times the connections shape offset (= 2x metroline thickness)
                    return inverse ? connectionOffset + config.metrolineConfig.thickness : size - (config.metrolineConfig.thickness * 2) + connectionOffset;
                default:
                    // When inversed use radius of the shape, width of the typebox (since 0,0 coordinate is left lower corner) and add the offset, not inversed use radius of shape and add offset
                    return inverse ? config.stationVisualConfig.stationNormalRadius + config.stationVisualConfig.stationTypeBoxWidth + normalOffset : config.stationVisualConfig.stationNormalRadius + normalOffset;
            }
        };
    
        // Helper function to adjust text position
        const adjustTextPosition = (textElement, xOffset, inverse) => {
            const alignment = inverse ? "start" : "end";
            textElement.setAttribute("text-anchor", alignment);
            textElement.setAttribute("x", xOffset);
    
            // Update all tspans
            textElement.querySelectorAll("tspan").forEach((tspan) => {
                tspan.setAttribute("x", xOffset);
            });
        };
    
        // Centralized angle mapping
        const angleMap = {
            45: { finalAngle: 45, inverse: false },
            315: { finalAngle: 315, inverse: false },
            0: { finalAngle: 0, inverse: false },
            270: { finalAngle: 270, inverse: false },
            90: { finalAngle: 270, inverse: true },
            135: { finalAngle: 315, inverse: true },
            180: { finalAngle: 0, inverse: true },
            225: { finalAngle: 45, inverse: true },
        };
        const { finalAngle, inverse } = angleMap[angle] || { finalAngle: 0, inverse: false };
    
        // Offsets based on configuration and shape
        const textOffsetConfig = config.stationVisualConfig.stationTextOffsetConfig || {};
        const typeOffsetConfig = config.stationVisualConfig.stationTypeOffsetConfig || {};
    
        const textOffset = getOffsetText(this.shape, this.size, textOffsetConfig, inverse);
        const typeOffset = getOffsetType(this.shape, this.size, typeOffsetConfig, inverse);
        const yOffset = config.stationVisualConfig.stationTypeOffsetConfig?.yOffset || 10;
    
        // Adjust positioning based on inversion
        const stationNameText = this.stationNameGroupLayer.querySelector("text.stationName");
        if (!inverse) {
            adjustTextPosition(stationNameText, textOffset, true);
            this.stationTypeGroupLayer.setAttribute("transform", `translate(${typeOffset}, -${yOffset})`);
            this.stationButtonLayer.setAttribute("transform", "rotate(0)");
        } else {
            adjustTextPosition(stationNameText, -textOffset, false);
            this.stationTypeGroupLayer.setAttribute("transform", `translate(-${typeOffset}, -${yOffset})`);
            this.stationButtonLayer.setAttribute("transform", "rotate(180)");
        }
    
        // Apply rotation to the station group
        const transform = this.refSvg.getAttribute("transform");
        const { translate } = helpers.parseTransform(transform);
        this.refSvg.setAttribute("transform", `${translate} rotate(${finalAngle})`);
    
        // Save requested orientation
        this.orientation = angle;
        this.refSvg.setAttribute("stationorientation", angle);
    }

    /**
     * Adjusts the size and position of the station's clickable button area.
     * 
     * This method calculates the bounding box of the station's visual elements 
     * and resizes the button rectangle to encapsulate the entire station.
     */
    adjustStationButton() {
        // Helper function to calculate button dimensions
        const calculateButtonDimensions = (bbox, angle, shape, size) => {
            let buttonWidth = bbox.width + config.stationVisualConfig.stationButtonMarginWidth;
            let buttonHeight = bbox.height + config.stationVisualConfig.stationButtonMarginHeight;

            if (shape === "connection" && (angle === 90 || angle === 135 || angle === 180 || angle === 225)) {
                buttonWidth += size; // Adjust width for connections at certain angles
            }

            return { buttonWidth, buttonHeight };
        };

        // Helper function to determine button position offsets
        const calculateButtonOffsets = (angle, shape, size, height) => {
            let buttonX = Number(config.stationVisualConfig.stationButtonOffsetX);
            let buttonY = -(height / 2); // Depends on the height of the button

            if (shape === "connection" && (angle === 90 || angle === 135 || angle === 180 || angle === 225)) {
                buttonX += size;
            }

            return { buttonX, buttonY };
        };

        // Store the current angle
        const angle = Number(this.orientation) || 0;

        // Temporarily set the station rotation to 0 for accurate measurements
        this.setStationRotation(0);

        // Get the button and temporarily hide it
        const stationLinkElement = this.stationButtonLayer.querySelector("a.stationLink");
        const button = stationLinkElement.querySelector("rect.stationButton");
        button.style.display = "none"; // Hide instead of removing for efficiency

        // Wait for the next frame to ensure proper SVG rendering
        requestAnimationFrame(() => {
            // Get the bounding box of the station
            const bbox = this.refSvg.getBBox();

            // Calculate button dimensions and offsets
            const { buttonWidth, buttonHeight } = calculateButtonDimensions(bbox, angle, this.shape, this.size);
            const { buttonX, buttonY } = calculateButtonOffsets(angle, this.shape, this.size, buttonHeight);

            // Apply calculated dimensions and positions to the button
            button.setAttribute("width", buttonWidth);
            button.setAttribute("height", buttonHeight);
            button.setAttribute("x", -buttonX);
            button.setAttribute("y", buttonY);
            button.style.display = ""; // Restore visibility

            // Restore the original station rotation
            this.setStationRotation(angle);
        });
    }

    /**
     * Generates a JSON object with the minimal information required to recreate the station.
     * @returns {Object} A JSON object containing the station's essential data.
     */
    toJSON() {
        return {
            name: this.name,
            date: this.date,
            type: this.type,
            position: { x: this.x, y: this.y },
            orientation: this.orientation,
            shape: this.shape,
            width: this.width,
            description: this.description,
            link: this.link,
            metrolines: this.metrolines.map(metroline => metroline.getId()),
            externalUniqueId: this.externalUniqueID || null,
        };
    }
}