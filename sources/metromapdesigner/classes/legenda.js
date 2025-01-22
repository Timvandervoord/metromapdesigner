// Copyright (C) 2024 Tim van der Voord (tim@vandervoord.nl)
//
// This file may be distributed under the terms of the GNU GPLv3 license.

import * as helpers from '../common.js';
import * as config from '../config.js';

/**
 * Class representing the legend of a metro map.
 * Handles adding, removing, resizing, and repositioning legend items dynamically.
 */
export default class metromapLegenda {
    metromap; // Reference to the map object
    legenda; // Reference to the SVG group element containing the legend
    legendaColom1 = []; // Legend items in the first column
    legendaColom2 = []; // Legend items in the second column
    legendaItems = []; // All legend items

    /**
     * Constructor for MetromapLegenda.
     * @param {Object} map - Reference to the metro map object.
     * @param {Object} legendaGroup - Reference to the legend group element.
     */
    constructor(map, legendaGroup) {
        // Reference to the map where working on
        this.metromap = map; // store reference to map
        this.legenda = legendaGroup; // reference to the legendagroup

        // Get all legenda items in all coloms
        this.updateLegenda();
    }

    /**
     * Updates legend item arrays from the SVG structure.
     */
    updateLegenda() {
        this.legendaColom1 = this.legenda.querySelectorAll("#legendaGroupCol1 .legendaGroup");
        this.legendaColom2 = this.legenda.querySelectorAll("#legendaGroupCol2 .legendaGroup");
        this.legendaItems = [...this.legendaColom1, ...this.legendaColom2];
    }

    /**
     * Checks if a metro line color already exists in the legend.
     * @param {string} lineColor - The RGB color of the metro line.
     * @returns {boolean} True if the line color exists, false otherwise.
     * @throws {Error} If the color is not in RGB format.
     */
    contains(lineColor) {
        if (!helpers.isRgb(lineColor)) {
            throw new Error("Color not in RGB format.");
        }
    
        const metrolineID = `metroline${lineColor.replace(/[^a-zA-Z0-9]/g, "")}`;
        
        // Use Array.prototype.some to check if any item matches the metrolineID
        return this.legendaItems.some((item) => item.getAttribute("metrolineid") === metrolineID);
    }

    /**
     * Adds a new metro line to the legend.
     * @param {string} lineColor - The color of the metro line in RGB format.
     * @param {string} nameText - The name of the metro line (default: 'Metrolijn').
     * @param {string} targetGroupText - The target group of the metro line (default: 'Doelgroep').
     * @returns {void|null} Returns null if the line already exists.
     */
    add(lineColor, nameText = 'Metrolijn', targetGroupText = 'Doelgroep') {
        if (!helpers.isRgb(lineColor)) {
            throw new Error("Invalid color format. Expected RGB.");
        }

        if (this.contains(lineColor)) {
            return null; // Line already exists
        }

        // Determine target column
        const columnId = this.legendaColom1.length < config.legendaConfig.numberOfItemsPerColom
            ? "#legendaGroupCol1"
            : "#legendaGroupCol2";
        const legendaColom = this.legenda.querySelector(columnId);
        if (!legendaColom) {
            throw new Error(`Missing legend column: ${columnId}`);
        }

        // Calculate x, y position for the new item
        const { xValue, yValue } = this.calculateNextPosition(legendaColom);

        // Adjust legend position if necessary
        this.adjustLegendPosition(yValue);

        // Create new legend item
        const metrolineID = `metroline${lineColor.replace(/[^a-zA-Z0-9]/g, "")}`;
        const legendaGroup = this.createLegendGroup(metrolineID, xValue, yValue, lineColor, nameText, targetGroupText);

        // Add the new legend group to the column
        legendaColom.appendChild(legendaGroup);

        // Update legend and resize/reposition items
        this.updateLegenda();
        this.resize();
    }

    /**
     * Calculates the next x, y position for a new legend item.
     * @param {Element} legendaColom - The column where the item will be added.
     * @returns {Object} An object containing xValue and yValue.
     */
    calculateNextPosition(legendaColom) {
        const legendaGroupItems = legendaColom.querySelectorAll(".legendaGroup");
        let xValue = config.legendaConfig.linePaddingX;
        let yValue = config.legendaConfig.colomLinePaddingTop;

        if (legendaGroupItems.length > 0) {
            legendaGroupItems.forEach((item) => {
                const metrolineBox = item.querySelector(".metroLineBox");
                if (!metrolineBox) {
                    throw new Error("Invalid legend structure. Missing 'metroLineBox'.");
                }

                const rectY = Number(metrolineBox.getAttribute("y") || 0);
                const rectX = Number(metrolineBox.getAttribute("x") || 0);
                yValue = Math.max(yValue, rectY + config.legendaConfig.linePaddingY);
                xValue = Math.max(xValue, rectX);
            });
        }

        return { xValue, yValue };
    }

    /**
     * Adjusts the legend position if it overflows the canvas.
     * @param {number} yValue - The y-coordinate of the new legend item.
     */
    adjustLegendPosition(yValue) {
        const transformString = this.legenda.getAttribute("transform") || "";
        const match = /translate\(\s*(-?\d+(\.\d+)?)[ ,]+(-?\d+(\.\d+)?)\s*\)/.exec(transformString);

        if (match) {
            let [, translateX, , translateY] = match.map(Number);
            const canvasHeight = this.metromap.getCanvasSize().height - config.legendaConfig.boxHeight;

            if (translateY + yValue > canvasHeight) {
                translateY -= config.legendaConfig.boxHeight;
                helpers.updateTranslate(this.legenda, translateX, translateY);
            }
        }
    }

    /**
     * Creates a legend group element with all required child elements.
     * @param {string} metrolineID - The ID for the metro line.
     * @param {number} xValue - The x-coordinate of the legend item.
     * @param {number} yValue - The y-coordinate of the legend item.
     * @param {string} lineColor - The color of the metro line.
     * @param {string} nameText - The name of the metro line.
     * @param {string} targetGroupText - The target group text for the metro line.
     * @returns {Element} The created legend group element.
     */
    createLegendGroup(metrolineID, xValue, yValue, lineColor, nameText, targetGroupText) {
        const legendaGroup = helpers.createSvgElement("g", {
            class: "legendaGroup",
            position: "relative",
            metrolineid: metrolineID,
        });

        const legendaBox = helpers.createSvgElement("rect", {
            x: xValue - config.legendaConfig.boxPaddingX,
            y: yValue - config.legendaConfig.boxPaddingY,
            width: config.legendaConfig.boxWidth || 200, // Use configurable width
            height: config.legendaConfig.boxHeight,
            class: "metroLineBox",
            fill: "none",
        });

        const legendaLine = helpers.createSvgElement("polyline", {
            "stroke-linecap": "round",
            "stroke-width": config.metrolineConfig.thickness,
            fill: "none",
            stroke: lineColor,
            class: "legendaPolyline",
        });
        legendaLine.setAttribute("points", `${xValue},${yValue} ${xValue},${yValue}`);

        const lineTitle = this.createTextElement(
            "metroLineName",
            xValue,
            yValue + config.legendaConfig.textOffset,
            config.legendaConfig.legendaFontColor,
            nameText
        );

        const targetGroup = this.createTextElement(
            "metroLineTargetGroup",
            xValue,
            yValue + config.legendaConfig.textOffset,
            "black",
            targetGroupText
        );

        legendaGroup.appendChild(legendaBox);
        legendaGroup.appendChild(legendaLine);
        legendaGroup.appendChild(lineTitle);
        legendaGroup.appendChild(targetGroup);

        return legendaGroup;
    }

    /**
     * Creates a text element for the legend.
     * @param {string} elementClass - The CSS class for the text element.
     * @param {number} x - The x-coordinate of the text.
     * @param {number} y - The y-coordinate of the text.
     * @param {string} fill - The fill color for the text.
     * @param {string} content - The text content.
     * @returns {Element} The created text element.
     */
    createTextElement(elementClass, x, y, fill, content = "") {
        const attributes = {
            x,
            y,
            "font-family": config.legendaConfig.legendaFont,
            "font-weight": config.legendaConfig.legendaFontWeight,
            "font-size": `${config.legendaConfig.legendaFontSize}px`,
            class: elementClass,
            fill,
        };
        const textElement = helpers.createSvgElement("text", attributes);
        textElement.textContent = content;
        return textElement;
    }

    /**
     * Removes a metro line from the legend.
     * @param {string} metroLineID - The ID of the metro line to remove.
     * @returns {boolean} True if the line was found and removed, false otherwise.
     */
    remove(metroLineID) {
        const legendaItems = this.legenda.querySelectorAll(".legendaGroup");

        for (const item of legendaItems) {
            if (item.getAttribute("metrolineid") === metroLineID) {
                item.parentNode.removeChild(item);
                this.updateLegenda();
                this.repositionItems();
                this.resize();
                return true;
            }
        }

        return false;
    }

    /**
     * Adjusts the dimensions of all legend items based on their content, ensuring 
     * consistent alignment and sizing of elements such as rectangles, polylines, 
     * and text within the legend.
     */
    resize() {
        // Exit early if there are no legend items to process
        if (this.legendaItems.length < 1) return;

        // Calculate the maximum dimensions required for the legend items
        const { maxLengthLine, maxWidthBox } = this.calculateMaxDimensions();

        // Update the size and positioning of each legend item
        this.legendaItems.forEach((item) => {
            // Retrieve necessary SVG elements for each legend item
            const metrolineBox = item.querySelector(".metroLineBox"); // Rectangle element
            const polyline = item.querySelector(".legendaPolyline"); // Connecting line (polyline) element
            const metrolineTargetGroup = item.querySelector(".metroLineTargetGroup"); // Text element for the target group

            // Ensure all required elements are present
            if (!metrolineBox || !polyline || !metrolineTargetGroup) {
                console.error("Error: Invalid SVG elements in legenda item.", { item });
                return; // Skip further processing for this item
            }

            // Update the last point of the polyline to extend to the maximum line length
            const points = polyline.getAttribute("points").split(" ");
            if (points.length >= 2) {
                const lastPoint = points[points.length - 1].split(","); // Split the last point into x and y coordinates
                lastPoint[0] = maxLengthLine; // Update the x-coordinate to the maximum line length
                points[points.length - 1] = lastPoint.join(","); // Recombine the updated point
                polyline.setAttribute("points", points.join(" ")); // Set the updated points on the polyline
            }

            // Update the position of the target group text
            metrolineTargetGroup.setAttribute("x", maxLengthLine + config.metrolineConfig.thickness);

            // Update the width of the metroline box
            metrolineBox.setAttribute("width", maxWidthBox);
        });

        // Adjust the positioning of the second column of legend items
        this.adjustSecondColumn(maxWidthBox);
    }

    /**
     * Calculates the maximum dimensions required for the legend items based on the 
     * widths of the text elements (metroLineName and metroLineTargetGroup) and padding.
     * The dimensions are used to adjust the layout and alignment of legend items.
     * 
     * @returns {Object} An object containing:
     *  - maxLengthLine: The maximum width required for the polyline connecting the items.
     *  - maxWidthBox: The maximum width required for the bounding box of a legend item.
     */
    calculateMaxDimensions() {
        // Initialize variables to store the maximum dimensions
        let maxLengthLine = 0; // Maximum line length (polyline width)
        let maxWidthBox = 0;   // Maximum box width (bounding box)

        // Iterate over each legend item to determine its dimensions
        this.legendaItems.forEach((item) => {
            // Retrieve necessary SVG elements for the current legend item
            const metrolineBox = item.querySelector(".metroLineBox"); // Rectangle element
            const polyline = item.querySelector(".legendaPolyline"); // Connecting line (polyline) element
            const metrolineName = item.querySelector(".metroLineName"); // Main text element
            const metrolineTargetGroup = item.querySelector(".metroLineTargetGroup"); // Secondary text element

            // Ensure all required elements are present
            if (!metrolineBox || !polyline || !metrolineName || !metrolineTargetGroup) {
                console.error("Error: Invalid SVG elements in legenda item.", { item });
                return; // Skip further processing for this item
            }

            // Calculate the width required for the name text, including padding
            const nameWidth = metrolineName.getBBox().width + config.legendaConfig.linePaddingX;

            // Calculate the width required for the target group text
            const targetGroupWidth = metrolineTargetGroup.getBBox().width;

            // Calculate the additional padding to be applied to the box width
            const padding = config.metrolineConfig.thickness * 2;

            // Update the maximum dimensions based on the current item's dimensions
            maxLengthLine = Math.max(maxLengthLine, nameWidth); // Update the maximum line length
            maxWidthBox = Math.max(maxWidthBox, maxLengthLine + targetGroupWidth + padding); // Update the maximum box width
        });

        // Return the calculated maximum dimensions
        return { maxLengthLine, maxWidthBox };
    }

    /**
     * Adjusts the position of the second column of legend items based on the width 
     * of the items in the first column, ensuring proper spacing and alignment.
     * @param {number} maxWidthBox - The maximum width of the legend items in the first column.
     */
    adjustSecondColumn(maxWidthBox) {
        // Retrieve the group of legend items in the second column
        const legendaGroupCol2 = this.legenda.querySelector("#legendaGroupCol2");

        // If the second column group exists, reposition it based on the maximum box width
        if (legendaGroupCol2) {
            const offset = maxWidthBox + config.metrolineConfig.thickness; // Calculate the horizontal offset
            legendaGroupCol2.setAttribute("transform", `translate(${offset}, 0)`); // Apply the transformation
        }
    }
        
    /**
     * Repositions all legend items in two separate columns (legendaColom1 and legendaColom2) 
     * by adjusting the positions of associated SVG elements (rectangles, text, and polylines).
     * The repositioning ensures proper alignment and spacing between the items.
     */
    repositionItems() {
        // Padding constants derived from the configuration
        const rectanglePaddingY = config.metrolineConfig.thickness * 0.625; // Padding for the rectangle's Y position
        const textPaddingY = config.metrolineConfig.thickness * 0.25; // Padding for the text's Y position
        const linePadding = config.metrolineConfig.thickness * 1.5; // Vertical spacing between items

        /**
         * Helper function to reposition legend items within a given column.
         * @param {Array} items - Array of legend items to reposition.
         * @param {number} startY - Initial Y coordinate to start positioning items.
         */
        const repositionLegendaItemHelper = (items, startY) => {
            let y = startY; // Current Y position for the first item

            items.forEach((item) => {
                // Retrieve elements associated with the legend item
                const rect = item.querySelector(".metroLineBox"); // Rectangle element
                const text = item.querySelector(".metroLineName"); // Main text element
                const text2 = item.querySelector(".metroLineTargetGroup"); // Secondary text element
                const polyline = item.querySelector(".legendaPolyline"); // Polyline element

                // Adjust the rectangle's Y position
                if (rect) {
                    const newY = y - rectanglePaddingY;
                    rect.setAttribute("y", newY);
                }

                // Adjust the text elements' Y positions
                const textOffset = y + textPaddingY;
                if (text) text.setAttribute("y", textOffset);
                if (text2) text2.setAttribute("y", textOffset);

                // Modify the polyline points to align with the current Y position
                if (polyline) {
                    const points = polyline.getAttribute("points");
                    if (points) {
                        const modifiedPoints = points
                            .split(" ")
                            .map((pair) => {
                                const [x, _] = pair.split(",");
                                return `${x},${y}`;
                            })
                            .join(" ");
                        polyline.setAttribute("points", modifiedPoints);
                    }
                }

                // Increment Y position for the next item
                y += linePadding;
            });
        };

        // Reposition legend items in both columns, if present
        if (this.legendaColom1.length > 0) repositionLegendaItemHelper(this.legendaColom1, 20);
        if (this.legendaColom2.length > 0) repositionLegendaItemHelper(this.legendaColom2, 20);
    }

    /**
     * Generates a JSON array containing the minimal information required to recreate the legend.
     * @returns {Array<Object>} A JSON array where each object represents a legend item.
     */
    toJSON() {
        return this.legendaItems.map(item => {
            return {
                metrolineID: item.getAttribute("metrolineid"),
                color: item.querySelector(".legendaPolyline")?.getAttribute("stroke"),
                name: item.querySelector(".metroLineName")?.textContent,
                targetGroup: item.querySelector(".metroLineTargetGroup")?.textContent,
            };
        });
    }

    /**
     * Retrieves a legend item as a JSON object based on the provided metroline ID.
     * @param {Object} metroline - The ID of the metro line to find in the legend.
     * @returns {Object|null} A JSON object representing the legend item, or null if not found.
     */
    toJSONLegendByMetroline(metroline) {
        const metrolineID = metroline.getId();
        const item = Array.from(this.legendaItems).find(
            legendaItem => legendaItem.getAttribute("metrolineid") === metrolineID
        );

        if (!item) return null;

        return {
            metrolineID: item.getAttribute("metrolineid"),
            color: item.querySelector(".legendaPolyline")?.getAttribute("stroke"),
            name: item.querySelector(".metroLineName")?.textContent,
            targetGroup: item.querySelector(".metroLineTargetGroup")?.textContent
        };
    }
}
