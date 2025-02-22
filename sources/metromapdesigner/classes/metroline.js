import * as helpers from '../common.js';
import * as config from '../config.js';

/**
 * This class manages metrolines on a metromap.
 */
export default class metromapMetroline {
    // Reference to metromap
    metromap;

    metrolineGroup; // Reference to the SVG layer for this metroline
    polylines = []; // Array of all associated polyline elements

    // Properties
    metrolineColor; // Color of the metroline (in rgb format)
    metrolineID; // Unique identifier for this metroline
    externalUniqueID; // External unique identifier for this metroline

    // Drawing working variables
    drawingMetroline; // Reference to polyline to indicate if a metroline is being drawn (null if none is drawn)
    metrolineStartX = 0; // Starting X coordinate for drawing
    metrolineStartY = 0; // Starting Y coordinate for drawing

    /**
     * Initializes a new metroline instance.
     * @param {Object} map - Reference to the parent metromap object.
     * @param {SVGElement} metrolineGroup - The SVG layer containing this metroline.
     */
    constructor(map, metrolineGroup) {
        if(!metrolineGroup) throw new Error('Metroline class: invalid instantiation of metroline object');

        this.metromap = map;

        // Reference to the map where working on
        this.metrolineGroup = metrolineGroup;

        // Get all polylines from this metrolineGroup
        this.updatePolylinesArray();

        // Get id
        this.metrolineID = this.metrolineGroup.getAttribute('id');

        // Determine color
        if(this.polylines.length > 0) {
            this.metrolineColor = this.polylines[0].getAttribute("stroke") || config.metrolineConfig.defaultColor;
        } else {
            this.metrolineColor = config.metrolineConfig.defaultColor;
        }
    }

    /**
     * Determines whether a given point `(x, y)` lies on or near any polyline segment
     * within the metroline, based on a specified tolerance.
     *
     * @param {number} x - The x-coordinate of the point to check.
     * @param {number} y - The y-coordinate of the point to check.
     * @returns {boolean} - Returns `true` if the point lies on or near any polyline segment, otherwise `false`.
     *
     * @description
     * This method checks if a given point `(x, y)` is on or near any of the line segments
     * that make up the polylines of this metroline. It uses a helper function 
     * `helpers.isPointOnLineSegment` to determine proximity to each segment.
     *
     * **Algorithm**:
     * 1. Retrieve the tolerance from the configuration (default is 10).
     * 2. Iterate over all polylines in the metroline.
     * 3. For each polyline:
     *    - Skip invalid polylines with less than two points.
     *    - Check each consecutive pair of points (segments) in the polyline.
     *    - If the point is on a segment (within tolerance), return `true`.
     * 4. If no match is found after all segments are checked, return `false`.
     *
     * **Edge Cases**:
     * - Handles incomplete or invalid polylines by skipping them.
     * - Accounts for floating-point imprecision using the tolerance.
     */
    isPointOnLine(x, y) {
        // Retrieve tolerance from configuration or use default
        const tolerance = config.applicationConfig.toleranceMetrolineDetection || 10;

        // Return false if there are no polylines
        if (!this.polylines || this.polylines.length === 0) {
            return false;
        }

        // Iterate over each polyline
        for (const polyline of this.polylines) {
            const points = polyline.points; // SVGPointList for the polyline

            // Skip invalid or incomplete polylines
            if (!points || points.numberOfItems < 2) {
                continue;
            }

            // Check each segment of the polyline
            for (let i = 0; i < points.numberOfItems - 1; i++) {
                const start = points.getItem(i); // Start point of the segment
                const end = points.getItem(i + 1); // End point of the segment

                // Check if the point lies on this segment within the tolerance
                if (helpers.isPointOnLineSegment(start.x, start.y, end.x, end.y, x, y, tolerance)) {
                    return true; // Point found on or near the segment
                }
            }
        }

        // No matching segment found
        return false;
    }

    /**
     * Draws a metroline on the canvas with optional intermediate segments.
     * 
     * @param {number} startX - Starting X coordinate.
     * @param {number} startY - Starting Y coordinate.
     * @param {number} endX - Ending X coordinate.
     * @param {number} endY - Ending Y coordinate.
     * @param {Array<{X: number, Y: number}>} [segments=[]] - Optional intermediate points.
     * @returns {SVGElement} The newly created polyline element.
     */
    draw(startX, startY, endX, endY, segments = []) {
        if (typeof startX !== "number" || typeof startY !== "number" ||
            typeof endX !== "number" || typeof endY !== "number") {
            throw new Error("Invalid coordinates provided for drawing.");
        }

        // Build the points string
        const points = [
            `${startX},${startY}`,
            ...segments.map(seg => `${seg.X},${seg.Y}`),
            `${endX},${endY}`
        ].join(" ");

        // Create and add metroline element to the metroline group
        const newLineElement = helpers.createSvgElement("polyline", {
            "stroke-linecap": "round",
            "stroke-width": config.metrolineConfig.thickness,
            metrolineid: this.metrolineID,
            fill: "none",
            stroke: this.metrolineColor,
            class: `metroline${this.metrolineID}`,
            points
        });

        this.metrolineGroup.insertBefore(newLineElement, this.metrolineGroup.firstChild);
        this.polylines.push(newLineElement);
        return newLineElement;
    }
    
    /**
     * Updates the end position of a metroline with snapping to horizontal/vertical/diagonal directions.
     * @param {SVGElement} lineElement - The polyline element to update.
     * @param {number} endX - New ending X coordinate.
     * @param {number} endY - New ending Y coordinate.
     */
    drawNewEndPosition(lineElement, endX, endY) {
        if(!lineElement) throw new Error('Metroline updateEndPosition: invalid polyline element');

        // Get the current points attribute and extract the start coordinates
        const currentPoints = lineElement.getAttribute("points").trim();
        const [startX, startY] = currentPoints.split(" ")[0].split(",").map(Number);

        // Calculate difference start and end position of the line
        let dx = Math.abs(endX - startX);
        let dy = Math.abs(endY - startY);
    
        // A margin of 25 pixels is used to determine when to switch the direction of the line.
        // If the difference in x is less than the margin, it is set to 0. If the difference in
        // y is less than the margin, it is set to 0.
        const directionMargin = config.gridConfig.lineChangeDirectionMargin || 25;
        dx = dx < directionMargin ? 0 : dx;
        dy = dy < directionMargin ? 0 : dy;
    
        // Horizontal/diagonal drawing
        // If dx is larger than Dy we're drawing horizontal. Calculate value of y by a multitude
        // of DX, restricts to diagonal drawing. If dy is larger than dx we're drawing vertical.
        // then calcuate value of is as a multitude of dy, restricts to diagnal drawing.
        if (dx > dy - directionMargin) {
            endY = startY + Math.sign(endY - startY) * Math.abs(dx);
        } else if (dy > dx - directionMargin) {
            endX = startX + Math.sign(endX - startX) * Math.abs(dy);
        }
    
        // update the points
        lineElement.setAttribute("points", `${startX},${startY} ${endX},${endY}`);
    }

    /**
     * Adjusts the end position of a metroline.
     * @param {SVGElement} lineElement - The polyline element to update.
     * @param {number} endX - New ending X coordinate.
     * @param {number} endY - New ending Y coordinate.
     */
    adjustEndPosition(lineElement, endX, endY) {
        if(!lineElement) throw new Error('Metroline updateEndPosition: invalid polyline element');
        if (typeof endX !== "number" || typeof endY !== "number") {
            throw new Error("Metroline adjustEndPositionByAmount: Invalid coordinates provided for drawing.");
        }

        // Get the current points attribute and extract the start coordinates
        const currentPoints = lineElement.getAttribute("points").trim();
        const [startX, startY] = currentPoints.split(" ")[0].split(",").map(Number);
    
        // update the points
        lineElement.setAttribute("points", `${startX},${startY} ${endX},${endY}`);
    }

    /**
     * Adjusts the end position of a metroline by a given offset.
     * @param {SVGElement} lineElement - The polyline element to update.
     * @param {number} xOffset - Offset for X coordinate.
     * @param {number} yOffset - Offset for Y coordinate.
     */
    adjustEndPositionByAmount(lineElement, xOffset, yOffset) {
        if (!lineElement) {
            throw new Error("Metroline adjustEndPositionByAmount: invalid polyline element");
        }
        if (typeof xOffset !== "number" || typeof yOffset !== "number") {
            throw new Error("Metroline adjustEndPositionByAmount: Invalid coordinates provided for updating offset.");
        }

        // Get the current points attribute
        const points = lineElement.getAttribute("points").trim().split(" ");

        // Parse start and end coordinates
        const [startX, startY] = points[0].split(",").map(Number);
        const [endX, endY] = points[1].split(",").map(Number);

        // Calculate new end coordinates
        const newEndX = endX + xOffset;
        const newEndY = endY + yOffset;

        // Update the points attribute
        lineElement.setAttribute("points", `${startX},${startY} ${newEndX},${newEndY}`);
    }
    
    /**
     * Moves all polylines in the metroline by a given offset. metroLineMoveAllLinesByOffset
     * @param {number} xOffset - Offset for X coordinates.
     * @param {number} yOffset - Offset for Y coordinates.
     */
    moveAllLinesByOffset(xOffset, yOffset) {
        if (typeof xOffset !== "number" || typeof yOffset !== "number") {
            throw new Error("Metroline adjustEndPositionByAmount: Invalid coordinates provided for updating offset.");
        }

        // Update all polylines
        this.polylines.forEach(polyline => {
            if (polyline instanceof SVGElement && polyline.tagName === "polyline") {
                // Adjust all points of the polyline
                const points = polyline.getAttribute("points");
                if (points) {
                    const updatedPoints = points
                        .trim()
                        .split(/\s+/) // Split into individual points
                        .map(point => {
                            const [x, y] = point.split(",").map(Number); // Parse x and y
                            return `${x + xOffset},${y + yOffset}`; // Apply the offset
                        })
                        .join(" "); // Join the points back into a string

                    polyline.setAttribute("points", updatedPoints); // Set the updated points
                }
            } else {
                throw new Error("Element is not a valid polyline:", polyline);
            }
        });
    }
    
    /**
     * Starts dragging the metroline by reducing its opacity.
    */
    highlight(onOff = false) {
        if(onOff) {
            this.setMetrolineOpacity("0.5");
        } else {
            this.setMetrolineOpacity("1");
        }
    }

    
    /**
     * Continues dragging the metroline, snapping movements to the grid.
     * @param {number} newX - New X coordinate.
     * @param {number} newY - New Y coordinate.
     */
    metroLineContinueDragging(newX, newY) {    
        if (typeof newX !== "number" || typeof newY !== "number") {
            throw new Error("Metroline metroLineContinueDragging: Invalid coordinates provided for dragging lines.");
        }

        // Only move in gridsize increments
        let xGridMove = Math.trunc(Math.abs(newX) / config.gridConfig.size);
        let yGridMove = Math.trunc(Math.abs(newY) / config.gridConfig.size);

        if (xGridMove > 0 || yGridMove > 0) {
            // Calculate offset position
            newX = xGridMove > 0 ? (newX < 0 ? -(xGridMove * config.gridConfig.size) : xGridMove * config.gridConfig.size) : 0;
            newY = yGridMove > 0 ? (newY < 0 ? -(yGridMove * config.gridConfig.size) : yGridMove * config.gridConfig.size) : 0;

            // Apply offsets
            this.moveAllLinesByOffset(newX, newY);

        }
    }
    
    /**
     * Gets the current color of the metroline.
     * @returns {string} The metroline color in rgb format.
     */
    getColor() {
        return this.metrolineColor;
    }

    /**
     * Gets the unique ID of the metroline.
     * @returns {string} The metroline ID.
     */
    getId() {
        return this.metrolineID;
    }

    /**
     * Gets the unique ID of the metroline.
     * @returns {string} The metroline ID.
     */
    getGroupElement() {
        return this.metrolineGroup;
    }

    /**
     * Return all polylines
     * @returns {array} Of all polylines in this metroline
     */
    getLines() {
        this.updatePolylinesArray();
        return this.polylines;
    }

    /**
     * Removes a specific polyline from the metroline.
     * @param {SVGElement} polyline - The polyline element to remove.
     * @returns {boolean} True if the polyline was successfully removed, false otherwise.
     */
    removeSegment(polyline) {
        if (!polyline || !(polyline instanceof SVGElement) || polyline.tagName !== "polyline") {
            throw new Error("adjustEndPositionByAmount: Provided element is not a valid polyline.", polyline);
        }

        // Make sure it is updated
        this.updatePolylinesArray();

        // Find it
        const index = this.polylines.indexOf(polyline);

        if (index !== -1) {
            // Remove the polyline from the array
            this.polylines.splice(index, 1);

            // Remove the polyline from the DOM
            if (polyline.parentNode) {
                polyline.parentNode.removeChild(polyline);
            }
            return true;
        }

        // Polyline not found in the array
        console.warn("removeLine: Polyline not found in the array.");
        return false;
    }

    /**
     * Return amount of polylines
     * @returns {number} Of all polylines in this metroline
     */
    getNumberOfLines() {
        return this.polylines.length;
    }

    /**
     * Update polylines
     */
    updatePolylinesArray()
    {
        this.polylines = Array.from(this.metrolineGroup.querySelectorAll("polyline"));
    }
    
    /**
     * Sets the opacity of all polylines in the metroline.
     * @param {number} opacity - The new opacity value (0 to 1).
     */
    setMetrolineOpacity(opacity = "1") {
        // Update all polylines
        this.polylines.forEach(polyline => {
            if (polyline instanceof SVGElement && polyline.tagName === "polyline") {
                polyline.setAttribute("stroke-opacity", opacity);
            } else {
                throw new Error("Element is not a valid polyline:", polyline);
            }
        });
    }

    /**
     * Sets the color of all polylines in the metroline.
     * @param {string} newColor - The new color in rgb format.
     */
    setMetrolineColor(newColor = "rgb(0, 0, 0)") {
        if (!helpers.isRgb(newColor)) throw new Error("Color not in RGB format"); // must be RGB

        // Update all polylines
        this.polylines.forEach(polyline => {
            if (polyline instanceof SVGElement && polyline.tagName === "polyline") {
                polyline.setAttribute("stroke", newColor);
            } else {
                throw new Error("Element is not a valid polyline:", polyline);
            }
        });

        // Save the new color
        this.metrolineColor = newColor;
    }

    /**
     * Generates a JSON object with minimal information required to regenerate the metroline.
     * @returns {Object} A JSON object containing the metroline ID, color, and lines with their respective start, end, and intermediate points.
     */
    toJSON() {
        const lines = this.polylines
            .map(polyline => {
                const pointsArray = Array.from(polyline.points).filter(
                    point => point && typeof point.x === 'number' && typeof point.y === 'number'
                );

                if (pointsArray.length < 2) return null;

                const startPoint = pointsArray[0];
                const endPoint = pointsArray[pointsArray.length - 1];
                const intermediatePoints = pointsArray.slice(1, pointsArray.length - 1).map(point => ({
                    x: point.x,
                    y: point.y
                }));

                return {
                    start: {
                        x: startPoint.x,
                        y: startPoint.y
                    },
                    end: {
                        x: endPoint.x,
                        y: endPoint.y
                    },
                    Segments: intermediatePoints
                };
            })
            .filter(line => line !== null);

        const color = helpers.parseRGBStringSC(this.metrolineColor);

        return {
            metroLineId: this.metrolineID,
            externalUniqueId: this.externalUniqueID || null,
            color: color,
            segments: lines
        };
    }

    /**
     * Populates the metroline object from a JSON representation.
     *
     * @param {Object} jsonData - The JSON object containing the metroline data.
     * @throws {Error} Throws an error if the JSON data is invalid.
     */
    fromJSON(jsonData) {
        if (!jsonData || typeof jsonData !== "object") {
            throw new Error("Invalid JSON data for metroline.");
        }

        // Validate required properties
        const { metroLineId, color, segments, externalUniqueId } = jsonData;
        if (!metroLineId || !color || !Array.isArray(segments)) {
            throw new Error("Invalid metroline JSON structure. Missing required properties.");
        }

        // Set the metroline ID and color
        this.metrolineID = metroLineId;
        this.metrolineColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.externalUniqueID = externalUniqueId || "";
        this.metrolineGroup.setAttribute("externalUniqueID", this.externalUniqueID);

        // Recreate polylines from the segments
        segments.forEach(segment => {
            const { start, end, segments } = segment;
            if (!start || !end || typeof start.x !== "number" || typeof start.y !== "number" ||
                typeof end.x !== "number" || typeof end.y !== "number") {
                throw new Error("Invalid segment data in JSON.");
            }

            // Use the draw method to create the polyline
            this.draw(start.x, start.y, end.x, end.y, segments);
        });
    }
}
