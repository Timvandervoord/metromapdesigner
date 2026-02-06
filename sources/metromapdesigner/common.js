import * as config from './config.js?v=1.0.4';

//############################################################################################
// ## COMMON HELPER FUNCTIONS
const svgNS = "http://www.w3.org/2000/svg";

// Reusable canvas for text measurement (avoids DOM manipulation)
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d');

/**
 * Enables inline text editing for an SVG text or tspan element using foreignObject.
 * Creates a transparent input field that matches the original text styling perfectly.
 *
 * @param {SVGTextElement|SVGTSpanElement} textElement - The text element to edit.
 * @param {Object} options - Configuration options.
 * @param {Function} [options.onSave] - Callback function called after saving changes.
 * @param {Object} [options.stateManager] - State manager for undo functionality.
 * @param {Object} [options.map] - Map object for legend updates.
 */
export function enableInlineTextEditing(textElement, options = {}) {
  const { onSave, stateManager, map } = options;
  
  // Prevent multiple inline editors for the same element
  if (textElement.dataset.editing === 'true') {
    return;
  }
  textElement.dataset.editing = 'true';

  // Get the owning SVG element
  const svg = textElement.ownerSVGElement;
  if (!svg) {
    console.error("No owner SVG element found.");
    textElement.dataset.editing = 'false';
    return;
  }

  // Get text bounding box and styling
  const bbox = textElement.getBBox();
  const parentText = textElement.tagName.toLowerCase() === "tspan" ? textElement.parentNode : textElement;
  
  // Helper function to parse transform values
  const parseTransform = (transform) => {
    if (!transform) return { x: 0, y: 0 };
    
    if (transform.includes('translate')) {
      const match = transform.match(/translate\(([^)]+)\)/);
      if (match) {
        const values = match[1].split(/[,\s]+/).map(Number);
        return { x: values[0] || 0, y: values[1] || 0 };
      }
    } else if (transform.includes('matrix')) {
      const match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        const values = match[1].split(' ').map(Number);
        return { x: values[4] || 0, y: values[5] || 0 };
      }
    }
    return { x: 0, y: 0 };
  };

  // Calculate position - simplified approach
  const isTspan = textElement.tagName.toLowerCase() === "tspan";
  let x = bbox.x;
  let y = bbox.y;
  
  // Add transforms from element hierarchy
  let element = isTspan ? textElement.parentNode : textElement;
  while (element && element !== svg) {
    const transform = parseTransform(element.getAttribute('transform'));
    x += transform.x;
    y += transform.y;
    element = element.parentNode;
  }
  
  // Add tspan relative positioning
  if (isTspan) {
    x += parseFloat(textElement.getAttribute('dx') || '0');
    y += parseFloat(textElement.getAttribute('dy') || '0');
  }
  
  // Apply positioning offset for pixel-perfect alignment
  x -= 3;
  y -= 4;
  
  const width = Math.max(bbox.width + 20, 80);
  const height = Math.max(bbox.height + 8, 20);
  
  // Hide the original text during editing
  const originalOpacity = textElement.style.opacity || '1';
  textElement.style.opacity = '0';

  // Create foreignObject for inline editing
  const foreignObject = document.createElementNS(svgNS, "foreignObject");
  foreignObject.setAttribute("x", x);
  foreignObject.setAttribute("y", y);
  foreignObject.setAttribute("width", width);
  foreignObject.setAttribute("height", height);

  // Create input element inside foreignObject with matching styling
  const input = document.createElement("input");
  input.type = "text";
  input.value = textElement.textContent;
  input.style.width = "100%";
  input.style.height = "100%";
  input.style.border = "none";
  input.style.padding = "0";
  input.style.margin = "0";
  input.style.textIndent = "3px"; // Fine-tuned for perfect alignment
  input.style.background = "transparent";
  input.style.fontSize = parentText.getAttribute("font-size") || parentText.style.fontSize || "16px";
  input.style.fontFamily = parentText.getAttribute("font-family") || parentText.style.fontFamily || "Arial";
  input.style.fontWeight = parentText.getAttribute("font-weight") || parentText.style.fontWeight || "normal";
  input.style.color = parentText.getAttribute("fill") || parentText.style.color || "#000";
  input.style.outline = "none";
  input.style.boxSizing = "border-box";
  input.style.zIndex = "1000";
  input.style.minWidth = `${width}px`;
  input.style.textAlign = parentText.getAttribute("text-anchor") === "middle" ? "center" : 
                          parentText.getAttribute("text-anchor") === "end" ? "right" : "left";

  // Auto-resize function to grow input with text (uses canvas for performance)
  const resizeInput = () => {
    measureCtx.font = `${input.style.fontWeight} ${input.style.fontSize} ${input.style.fontFamily}`;
    const textWidth = measureCtx.measureText(input.value || input.placeholder || '').width;
    const newWidth = Math.max(textWidth + 10, width);
    foreignObject.setAttribute('width', newWidth);
  };

  let isRemoved = false;

  const saveChanges = () => {
    if (isRemoved) return;
    isRemoved = true;
    
    try {
      if (stateManager && map) {
        stateManager.saveState(map);
      }
      textElement.textContent = input.value;
      onSave?.();
      if (map?.legenda) {
        map.legenda.updateLegenda();
        map.legenda.resize();
      }
    } catch (error) {
      console.error("Error saving text changes:", error);
    } finally {
      cleanup();
    }
  };

  const cleanup = () => {
    if (originalOpacity === '1' || originalOpacity === '') {
      textElement.style.opacity = '';
    } else {
      textElement.style.opacity = originalOpacity;
    }
    if (foreignObject.parentNode) {
      foreignObject.remove();
    }
    textElement.dataset.editing = 'false';
  };

  const cancelChanges = () => {
    if (isRemoved) return;
    isRemoved = true;
    cleanup();
  };

  // Event listeners
  input.addEventListener("mousedown", (event) => event.stopPropagation());
  input.addEventListener("click", (event) => event.stopPropagation());
  input.addEventListener("blur", saveChanges);
  input.addEventListener("input", resizeInput);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveChanges();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelChanges();
    }
    event.stopPropagation();
    setTimeout(resizeInput, 0);
  });

  try {
    foreignObject.appendChild(input);
    svg.appendChild(foreignObject);
    
    input.focus();
    input.select();
    resizeInput();
  } catch (error) {
    console.error("Error creating inline text editor:", error);
    textElement.style.opacity = originalOpacity;
    textElement.dataset.editing = 'false';
  }
}

/**
 * Creates an SVG element with specified attributes.
 *
 * @param {string} tag - The SVG tag name to create.
 * @param {Object} attributes - The attributes to set on the SVG element.
 * @returns {SVGElement} The created SVG element.
 */
export function createSvgElement(tag, attributes) {
    const element = document.createElementNS(svgNS, tag);
    for (const [attribute, value] of Object.entries(attributes)) {
      element.setAttribute(attribute, value);
    }
    return element;
  }
  
/**
 * Checks if an SVG element is part of a specific group.
 *
 * @param {SVGElement} element - The SVG element to check.
 * @param {string} groupName - The ID or class name of the group.
 * @returns {boolean} True if the element is part of the group, false otherwise.
 */
export function elementIsPartOfGroup(element, groupName) {
    while (element) {
      if (element.nodeName === "g" && (element.id === groupName || element.classList.contains(groupName))) {
        return true;
      }
      element = element.parentNode;
    }
    return false;
  }
  
/**
 * Retrieves the current translation values (x, y) of an SVG element.
 *
 * @param {SVGElement} element - The SVG element to retrieve the translation from.
 * @returns {Array<number>} An array with x and y translation values.
 */
export function getTranslate(element) {
  const transformString = element.getAttribute("transform");
  if (!transformString) return [0, 0];
  let match = /translate\(\s*(-?\d+(\.\d+)?)[ ,]+(-?\d+(\.\d+)?)\s*\)/.exec(transformString);
  return match ? [+match[1], +match[3]] : [0, 0];
}
  
/**
 * Sets the translation (x, y) of an SVG element.
 *
 * @param {SVGElement} element - The SVG element to translate.
 * @param {number} x - The x translation value.
 * @param {number} y - The y translation value.
 */
export function setTranslate(element, x, y) {
    if (element instanceof SVGElement) {
      // Get the current transform attribute
      let transform = element.getAttribute("transform");
      let newTransform = "";
  
      // Check if there's an existing transform attribute
      if (transform) {
        // Attempt to find an existing translate transformation
        let translateRegex = /translate\(\s*(-?\d+(\.\d+)?)\s*,?\s*(-?\d+(\.\d+)?)\s*\)/;
        let hasTranslate = translateRegex.test(transform);
  
        if (hasTranslate) {
          // If there is an existing translate, replace it
          newTransform = transform.replace(translateRegex, `translate(${x}, ${y})`);
        } else {
          // If there is no translate, add it to the existing transformations
          newTransform = `${transform} translate(${x}, ${y})`;
        }
      } else {
        // If there is no transform attribute, just set the translate
        newTransform = `translate(${x}, ${y})`;
      }
  
      // Set the updated transform attribute
      element.setAttribute("transform", newTransform);
    }
  }
  
/**
 * Updates only the translation component of an SVG element's transform attribute.
 *
 * @param {SVGElement} element - The SVG element to update.
 * @param {number} newTranslateX - The new x translation value.
 * @param {number} newTranslateY - The new y translation value.
 */
export function updateTranslate(element, newTranslateX, newTranslateY) {
    const transform = element.getAttribute("transform") || "";
    let translate = `translate(${newTranslateX},${newTranslateY})`;
    let otherTransforms = "";
  
    // Extract and preserve other transformations
    const transforms = transform.match(/(\w+\([^)]+\))/g);
    if (transforms) {
      transforms.forEach(function (t) {
        if (!t.startsWith("translate")) {
          otherTransforms += " " + t;
        }
      });
    }
  
    // Set the new transform attribute
    element.setAttribute("transform", translate + otherTransforms);
  }
  
/**
 * Parses the transformation attribute of an SVG element into components.
 *
 * @param {string} transformStr - The transform attribute string.
 * @returns {Object} An object containing translate and rotate components.
 */
export function parseTransform(transformStr) {
    let translate = "";
    let rotate = "";
    const matches = transformStr.match(/(\w+)\(([^)]+)\)/g);
  
    if (matches) {
      matches.forEach(function (match) {
        if (match.startsWith("translate")) {
          translate = match;
        } else if (match.startsWith("rotate")) {
          rotate = match;
        }
      });
    }
  
    return { translate, rotate };
  }

  /**
   * Retrieves the mouse position relative to an SVG element.
   *
   * @param {Event} evt - The event object.
   * @param {Object} map - The map object containing the SVG element.
   * @returns {Object} An object with x and y coordinates.
   */
  let mouseRecentlyUsed = false;
  let mouseTimeoutId = null;
  let lastKnownPosition = { x: 0, y: 0 }; // Store last known position to avoid circular dependency
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isValidCoord = (n) => typeof n === 'number' && !isNaN(n);

  export function getMousePos(evt, map) {
      let x, y;
      let svgElement = map.getCanvas();
      if (!svgElement) {
          console.warn('getMousePos: No SVG element found, returning last known position');
          return { ...lastKnownPosition }; // Return copy of last known position
      }
    
      // Check the type of event
      if (evt.type.startsWith("mouse") || evt.type.startsWith("click")) {
        mouseRecentlyUsed = true;
        clearTimeout(mouseTimeoutId);
        mouseTimeoutId = setTimeout(() => {
          mouseRecentlyUsed = false;
        }, 2000); // reset after 2 seconds of inactivity
      } else if (mouseRecentlyUsed) {
        // Return last known position instead of undefined
        return { ...lastKnownPosition };
      }
    
      if (!isTouchDevice || mouseRecentlyUsed) {
        x = evt.clientX || 0;
        y = evt.clientY || 0;
      } else {
        evt.preventDefault(); // prevent default behavior like scrolling
        var touch = evt.touches[0];
        // Use lastKnownPosition instead of map.mousePosition to avoid circular dependency
        x = typeof touch !== "undefined" ? touch.clientX : lastKnownPosition.x;
        y = typeof touch !== "undefined" ? touch.clientY : lastKnownPosition.y;
      }

      // Validate coordinates
      if (!isValidCoord(x) || !isValidCoord(y)) {
          console.warn('getMousePos: Invalid coordinates detected, using last known position');
          return { ...lastKnownPosition };
      }
    
      try {
          var point = svgElement.createSVGPoint();
          point.x = x;
          point.y = y;
        
          // Get screen CTM with null check
          var screenCTM = svgElement.getScreenCTM();
          if (!screenCTM) {
              console.warn('getMousePos: getScreenCTM returned null, using fallback calculation');
              // Fallback: try to get bounding rect and calculate relative position
              const rect = svgElement.getBoundingClientRect();
              const relativeX = x - rect.left;
              const relativeY = y - rect.top;
              
              // Store and return the position
              lastKnownPosition = { x: relativeX, y: relativeY };
              return { ...lastKnownPosition };
          }
        
          var transform = point.matrixTransform(screenCTM.inverse());
          
          // Validate transform result
          if (!isValidCoord(transform.x) || !isValidCoord(transform.y)) {
              console.warn('getMousePos: Transform resulted in invalid coordinates');
              return { ...lastKnownPosition };
          }
          
          // Store successful position for future fallbacks
          lastKnownPosition = { x: transform.x, y: transform.y };
        
          return {
            x: transform.x,
            y: transform.y,
          };
      } catch (error) {
          console.error('getMousePos: Error during coordinate transformation:', error);
          // Return last known good position
          return { ...lastKnownPosition };
      }
  }

  /**
   * Creates a <tspan> SVG element with the specified text and attributes.
   *
   * @param {string} text - The text content for the <tspan>.
   * @param {number} x - The x-coordinate for the <tspan>.
   * @param {number} y - The y-coordinate for the <tspan>.
   * @param {number} ruleNumber - The unique rule number for the <tspan>.
   * @returns {SVGElement} The created <tspan> element.
   */
  export function createTspanElement(text, x, y, ruleNumber) {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttribute("class", "stationNameRule");
    tspan.setAttribute("id", `stationNameRule${ruleNumber}`);
    tspan.setAttribute("font-size", `${config.stationVisualConfig.stationFontSize}px`);
    tspan.setAttribute("font-weight", config.stationVisualConfig.stationNameFontWeight);
    tspan.setAttribute("font-family", config.stationVisualConfig.stationFont);
    tspan.setAttribute("fill", config.stationVisualConfig.stationNameFontColor);
    tspan.setAttribute("x", x);
    tspan.setAttribute("y", y);
    tspan.textContent = text.trim();
    return tspan;
  }

  /**
   * Parses an RGB string like "rgb(227, 32, 23)" into an object with R, G, and B properties.
   * @param {string} rgbString - The RGB string to parse.
   * @returns {Object} An object with R, G, and B properties.
   */
  export function parseRGBString(rgbString) {
    const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
        throw new Error(`Invalid RGB string: ${rgbString}`);
    }
    return {
        R: parseInt(match[1], 10),
        G: parseInt(match[2], 10),
        B: parseInt(match[3], 10)
    };
  }

  /**
   * Converts a color from hex to RGB format if necessary.
   *
   * @param {string} color - The color string (hex or RGB).
   * @returns {string} The color in RGB format.
   */
  export function convertToRgb(color) {
    // Function to check HEX color (3 or 6 digits)
    const isHexColor = (s) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);

    // Already RGB, just return normalized string
    if (isRgb(color)) {
      return color.replace(/\s+/g, "");
    }

    // Convert hexadecimal to RGB
    if (isHexColor(color)) {
      let r, g, b;
      if (color.length === 4) {
        // 3 digit hex (#abc => #aabbcc)
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      }

      return `rgb(${r}, ${g}, ${b})`;
    }

    throw new Error("convertToRgb: Invalid color format. Expected RGB or Hexadecimal.");
  }

  /**
   * Checks if a color string is in RGB format.
   *
   * @param {string} color - The color string to check.
   * @returns {boolean} True if the color is in RGB format, false otherwise.
   */
  export function isRgb(color) {
    const regex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
    const matches = color.match(regex);

    return matches
      ? matches.slice(1).every((n) => Number(n) >= 0 && Number(n) <= 255)
      : false;
  }

  /**
   * Determines whether a given SVG element or its ancestors are editable within the application.
   * Traverses up the DOM tree to find the nearest editable element based on specific criteria.
   *
   * @param {SVGElement} element - The starting SVG element to check for editability.
   * @returns {SVGElement|null} - The nearest editable SVG element, or `null` if none is found.
   */
  export function determineEditableElement(element) {
    // Traverse up the DOM tree
    while (element instanceof SVGElement) {
        const elementClass = element.getAttribute("class");
        const tagName = element.tagName.toLowerCase();

        // Check for editable element types (uses cached Set for O(1) lookup)
        if (elementClass === "stationGroup" ||
            tagName === "image" ||
            (tagName === "polyline" && elementClass !== "legendaPolyline") ||
            config.applicationConfig.EDITABLE_ELEMENT_IDS.has(element.id)) {
            return element;
        }

        // Move up one level in the DOM
        element = element.parentNode;
    }

    return null;
  }

  /**
   * Determines whether a given SVG element or its ancestors are editable within the application.
   * Traverses up the DOM tree to find the nearest editable element based on specific criteria.
   *
   * @param {SVGElement} element - The starting SVG element to check for editability.
   * @returns {SVGElement|null} - The nearest editable SVG element, or `null` if none is found.
   */
  export function determineEditableTextElement(element) {
    // Traverse up the DOM tree
    while (element instanceof SVGElement) {
        // Check for known IDs (O(1) lookup)
        if (config.applicationConfig.EDITABLE_TEXT_IDS.has(element.id)) return element;

        // Check for known classes (O(n) where n = number of classes on element)
        const elClass = element.getAttribute("class");
        if (elClass) {
            const classes = elClass.split(" ");
            for (const cls of classes) {
                if (config.applicationConfig.EDITABLE_TEXT_CLASSES.has(cls)) return element;
            }
        }

        // Move up one level in the DOM
        element = element.parentNode;
    }

    return null;
  }

  /**
   * Throttles a function to ensure it runs at most once in the specified interval.
   * 
   * @param {Function} func - The function to throttle.
   * @param {number} limit - The time interval in milliseconds.
   * @returns {Function} - The throttled function.
   */
  export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
  }

  /**
   * DOM Update Batching System
   * Collects multiple DOM operations and executes them in batches for better performance
   */
  class DOMBatcher {
    constructor() {
        this.pendingUpdates = new Map();
        this.isScheduled = false;
        this.frameId = null;
    }

    /**
     * Adds a DOM update operation to the batch queue
     * @param {string} key - Unique identifier for the operation
     * @param {Function} operation - The DOM operation to execute
     * @param {string} priority - 'high', 'medium', 'low'
     */
    batch(key, operation, priority = 'medium') {
        this.pendingUpdates.set(key, {
            operation,
            priority,
            timestamp: performance.now()
        });

        if (!this.isScheduled) {
            this.scheduleBatch();
        }
    }

    scheduleBatch() {
        this.isScheduled = true;
        this.frameId = requestAnimationFrame(() => {
            this.executeBatch();
        });
    }

    executeBatch() {
        if (this.pendingUpdates.size === 0) {
            this.isScheduled = false;
            return;
        }

        // Sort by priority: high > medium > low
        const operations = Array.from(this.pendingUpdates.entries())
            .sort(([, a], [, b]) => {
                const priorities = { high: 3, medium: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
            });

        const startTime = performance.now();
        const maxBatchTime = 16; // ~60fps budget

        for (const [key, { operation }] of operations) {
            try {
                operation();
                this.pendingUpdates.delete(key);

                // Yield if taking too long
                if (performance.now() - startTime > maxBatchTime) {
                    break;
                }
            } catch (error) {
                console.error(`DOM batch operation failed for key: ${key}`, error);
                this.pendingUpdates.delete(key);
            }
        }

        this.isScheduled = false;
        if (this.pendingUpdates.size > 0) {
            this.scheduleBatch();
        }
    }

    flush() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
        this.isScheduled = false;
        this.executeBatch();
    }

    clear() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
        this.pendingUpdates.clear();
        this.isScheduled = false;
    }
  }

  // Global DOM batcher instance
  const domBatcher = new DOMBatcher();

  /**
   * Batches DOM operations for better performance
   * @param {string} key - Unique identifier for the operation
   * @param {Function} operation - The DOM operation to execute
   * @param {string} priority - 'high', 'medium', 'low'
   */
  export function batchDOMUpdate(key, operation, priority = 'medium') {
    domBatcher.batch(key, operation, priority);
  }

  /**
   * Checks if a point lies on or near a line segment within a specified tolerance.
   *
   * @param {number} x1 - The x-coordinate of the first endpoint of the line segment.
   * @param {number} y1 - The y-coordinate of the first endpoint of the line segment.
   * @param {number} x2 - The x-coordinate of the second endpoint of the line segment.
   * @param {number} y2 - The y-coordinate of the second endpoint of the line segment.
   * @param {number} px - The x-coordinate of the point to check.
   * @param {number} py - The y-coordinate of the point to check.
   * @param {number} tolerance - The maximum distance allowed for the point to be considered "on" the line segment.
   * @returns {boolean} - Returns `true` if the point is on or near the line segment, otherwise `false`.
   *
   * @description
   * This function determines if a point `(px, py)` lies on or near a line segment defined by two endpoints `(x1, y1)` and `(x2, y2)` within a specified `tolerance`.
   * 
   * The function uses vector projection to calculate the closest point on the infinite line passing through `(x1, y1)` and `(x2, y2)`, then checks if that point lies within
   * the bounds of the segment and whether its distance to `(px, py)` is within the `tolerance`.
   *
   * - Handles edge cases where the line segment is of zero length (`x1 === x2` and `y1 === y2`).
   * - Ensures robust floating-point comparison with the `tolerance`.
   */
  export function isPointOnLineSegment(x1, y1, x2, y2, px, py, tolerance) {
    const A = x1 - x2; // Horizontal difference of the line segment
    const B = y1 - y2; // Vertical difference of the line segment
    const C = px - x2; // Horizontal difference of the point to one endpoint
    const D = py - y2; // Vertical difference of the point to one endpoint

    // Calculate the projection parameter `param` using vector dot product
    const dot = C * A + D * B; // Dot product of the vectors
    const lenSq = A * A + B * B; // Squared length of the line segment
    let param = -1;

    // Avoid division by zero in case of zero-length line
    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    // Determine the closest point on the line segment
    let xx, yy;
    if (param < 0 || (x1 === x2 && y1 === y2)) {
        // Closest point is the second endpoint
        xx = x2;
        yy = y2;
    } else if (param > 1) {
        // Closest point is the first endpoint
        xx = x1;
        yy = y1;
    } else {
        // Closest point is within the segment
        xx = x2 + param * A;
        yy = y2 + param * B;
    }

    // Calculate the distance from the point to the closest point
    const dx = px - xx;
    const dy = py - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Return true if the distance is within the tolerance
    return distance < tolerance;
  }

  /**
 * Samples points along a line segment at a given interval.
 *
 * @param {Object} start - The starting point of the line segment.
 * @param {number} start.x - The x-coordinate of the start point.
 * @param {number} start.y - The y-coordinate of the start point.
 * @param {Object} end - The ending point of the line segment.
 * @param {number} end.x - The x-coordinate of the end point.
 * @param {number} end.y - The y-coordinate of the end point.
 * @param {number} step - The interval between sampled points.
 * @returns {Array<Object>} - An array of points along the line.
 */
export function samplePointsOnLine (start, end, step) {
  const points = [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / step);

  for (let i = 0; i <= steps; i++) {
      const t = i / steps; // Linear interpolation factor
      points.push({
          x: start.x + t * dx,
          y: start.y + t * dy
      });
  }

  return points;
}

/**
 * Determines if a point lies inside a polygon using the ray-casting algorithm.
 *
 * @param {Object} point - The point to check.
 * @param {number} point.x - The x-coordinate of the point.
 * @param {number} point.y - The y-coordinate of the point.
 * @param {Array<Object>} vertices - The vertices of the polygon, each with `x` and `y` properties.
 * @returns {boolean} - Returns `true` if the point is inside the polygon, otherwise `false`.
 */
export function pointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;

      const intersect =
          yi > point.y !== yj > point.y &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if two line segments intersect.
 *
 * @param {Object} p1 - The start point of the first line segment.
 * @param {number} p1.x - The x-coordinate of the first point.
 * @param {number} p1.y - The y-coordinate of the first point.
 * @param {Object} p2 - The end point of the first line segment.
 * @param {number} p2.x - The x-coordinate of the second point.
 * @param {number} p2.y - The y-coordinate of the second point.
 * @param {Object} q1 - The start point of the second line segment.
 * @param {number} q1.x - The x-coordinate of the first point of the second line.
 * @param {number} q1.y - The y-coordinate of the first point of the second line.
 * @param {Object} q2 - The end point of the second line segment.
 * @param {number} q2.x - The x-coordinate of the second point of the second line.
 * @param {number} q2.y - The y-coordinate of the second point of the second line.
 * @returns {boolean} - Returns `true` if the line segments intersect, otherwise `false`.
 */
export function lineIntersectsLine(p1, p2, q1, q2) {
  const det = (p2.x - p1.x) * (q2.y - q1.y) - (p2.y - p1.y) * (q2.x - q1.x);
  if (det === 0) return false; // Parallel lines

  const lambda = ((q2.y - q1.y) * (q2.x - p1.x) + (q1.x - q2.x) * (q2.y - p1.y)) / det;
  const gamma = ((p1.y - p2.y) * (q2.x - p1.x) + (p2.x - p1.x) * (q2.y - p1.y)) / det;

  return 0 <= lambda && lambda <= 1 && 0 <= gamma && gamma <= 1;
}

/**
 * Calculates the vertices of a rotated rectangle.
 *
 * @param {number} x - The x-coordinate of the top-left corner of the rectangle.
 * @param {number} y - The y-coordinate of the top-left corner of the rectangle.
 * @param {number} width - The width of the rectangle.
 * @param {number} height - The height of the rectangle.
 * @param {number} angle - The rotation angle in degrees.
 * @param {Object} center - The center point of rotation.
 * @param {number} center.x - The x-coordinate of the center of rotation.
 * @param {number} center.y - The y-coordinate of the center of rotation.
 * @returns {Array<Object>} - An array of the rotated rectangle's vertices, each with `x` and `y` properties.
 */
export function getRotatedRectangleVertices(x, y, width, height, angle, center) {
  const radians = (Math.PI / 180) * angle;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const corners = [
      { x, y }, // Top-left
      { x: x + width, y }, // Top-right
      { x: x + width, y: y + height }, // Bottom-right
      { x, y: y + height } // Bottom-left
  ];

  return corners.map(({ x: px, y: py }) => {
      const dx = px - center.x;
      const dy = py - center.y;
      return {
          x: center.x + dx * cos - dy * sin,
          y: center.y + dx * sin + dy * cos
      };
  });
}

/**
 * Samples points along the edges of a polygon.
 *
 * @param {Array<Object>} vertices - The vertices of the polygon, each with `x` and `y` properties.
 * @param {number} step - The interval between sampled points along the edges.
 * @returns {Array<Object>} - An array of points sampled along the edges of the polygon.
 */
export function samplePointsOnPolygonEdges(vertices, step) {
  const sampledPoints = [];

  for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length]; // Wrap around to the first vertex
      const pointsOnEdge = samplePointsOnLine(start, end, step);
      sampledPoints.push(...pointsOnEdge);
  }

  return sampledPoints;
}


/**
 * Removes polyline elements without valid coordinates (points) from SVG content.
 * A polyline is considered empty if it has no 'points' attribute or if the points attribute is empty/whitespace.
 *
 * @param {string} svgContent - The SVG content to clean.
 * @returns {string} - The SVG content with empty polylines removed.
 */
export function removeEmptyPolylines(svgContent) {
  if (typeof svgContent !== "string" || svgContent.length === 0) return svgContent;

  // Fast path: avoid parsing if there are no polylines at all
  if (!svgContent.includes("<polyline")) return svgContent;

  try {
    const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");

    // More defensive parse error detection across browsers
    if (doc.getElementsByTagName("parsererror").length) {
      console.warn("removeEmptyPolylines: SVG parsing error, returning original content");
      return svgContent;
    }

    const polylines = doc.getElementsByTagName("polyline"); // live HTMLCollection
    // Iterate backwards because this collection is live (removals affect indices)
    for (let i = polylines.length - 1; i >= 0; i--) {
      const el = polylines[i];
      const points = el.getAttribute("points");
      if (!points || !points.trim()) el.remove();
    }

    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch (error) {
    console.error("removeEmptyPolylines: Error processing SVG:", error);
    return svgContent;
  }
}

/**
 * Sanitizes SVG content to allow only specific tags and attributes safe for metro maps.
 * Prevents XSS attacks while preserving legitimate SVG functionality.
 * Also removes polylines without valid coordinates.
 *
 * @param {string} content - The raw SVG content to sanitize.
 * @returns {string} - The sanitized SVG content safe for innerHTML.
 * @throws {Error} - Throws an error if DOMPurify is not available or sanitization fails.
 */
export function sanitizeMapContent(content) {
    // Check if DOMPurify is available
    if (typeof DOMPurify === 'undefined') {
        console.error('DOMPurify is not available. SVG content cannot be sanitized.');
        throw new Error('Security library not available. Cannot load untrusted SVG content.');
    }

    try {
        const sanitized = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: config.applicationConfig.METROMAP_DESIGNER_MAP_TAGS,
            ALLOWED_ATTR: config.applicationConfig.METROMAP_DESIGNER_MAP_ATTRIBUTES
        });

        // Validate the sanitized result
        if (!sanitized || sanitized.trim().length === 0) {
            throw new Error('SVG content was completely removed during sanitization');
        }

        // Remove polylines without valid coordinates (sanity check)
        const cleaned = removeEmptyPolylines(sanitized);

        return cleaned;
    } catch (error) {
        console.error('Error sanitizing SVG content:', error);
        throw new Error(`Failed to sanitize SVG content: ${error.message}`);
    }
}

//############################################################################################
// ## SPATIAL INDEXING FOR PERFORMANCE OPTIMIZATION
//

/**
 * SpatialGrid class for efficient spatial indexing of metroline segments.
 * Optimizes metroline detection by organizing segments into a spatial grid structure.
 * 
 * Performance benefits:
 * - Reduces O(n) search to O(1) average case for spatial queries
 * - Dramatically improves performance for large metro maps with many lines
 * - Optimizes connection station detection and intersection testing
 */
export class SpatialGrid {
    /**
     * Creates a new SpatialGrid for metroline segment indexing.
     * 
     * @param {number} cellSize - Size of each grid cell in pixels (default: 50)
     * @param {number} mapWidth - Width of the map canvas (default: 2000)
     * @param {number} mapHeight - Height of the map canvas (default: 2000)
     */
    constructor(cellSize = 50, mapWidth = 2000, mapHeight = 2000) {
        this.cellSize = cellSize;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.grid = new Map(); // Key: "x,y", Value: Set of segments
        this.segmentToMetroline = new Map(); // Maps segments to their parent metroline
        
        // Performance metrics
        this.totalSegments = 0;
        this.lastQueryTime = 0;
    }

    /**
     * Converts world coordinates to grid cell coordinates.
     * 
     * @param {number} x - World x coordinate
     * @param {number} y - World y coordinate
     * @returns {Object} Grid cell coordinates {gridX, gridY}
     */
    worldToGrid(x, y) {
        return {
            gridX: Math.floor(x / this.cellSize),
            gridY: Math.floor(y / this.cellSize)
        };
    }

    /**
     * Generates a unique key for a grid cell.
     * 
     * @param {number} gridX - Grid x coordinate
     * @param {number} gridY - Grid y coordinate
     * @returns {string} Grid cell key
     */
    getCellKey(gridX, gridY) {
        return `${gridX},${gridY}`;
    }

    /**
     * Gets all grid cells that a line segment intersects.
     * Uses Bresenham-like algorithm for efficient line traversal.
     * 
     * @param {Object} segment - Line segment with start and end points
     * @returns {Array<string>} Array of cell keys the segment intersects
     */
    getSegmentCells(segment) {
        const { start, end } = segment;
        const startGrid = this.worldToGrid(start.x, start.y);
        const endGrid = this.worldToGrid(end.x, end.y);
        
        const cells = new Set();
        
        // Use Bresenham-like algorithm to find all cells the line passes through
        const dx = Math.abs(endGrid.gridX - startGrid.gridX);
        const dy = Math.abs(endGrid.gridY - startGrid.gridY);
        const sx = startGrid.gridX < endGrid.gridX ? 1 : -1;
        const sy = startGrid.gridY < endGrid.gridY ? 1 : -1;
        
        let err = dx - dy;
        let currentX = startGrid.gridX;
        let currentY = startGrid.gridY;
        
        while (true) {
            cells.add(this.getCellKey(currentX, currentY));
            
            if (currentX === endGrid.gridX && currentY === endGrid.gridY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                currentX += sx;
            }
            if (e2 < dx) {
                err += dx;
                currentY += sy;
            }
        }
        
        return Array.from(cells);
    }

    /**
     * Adds a metroline segment to the spatial index.
     * 
     * @param {Object} segment - Line segment with start, end points and metadata
     * @param {Object} metroline - The metroline object this segment belongs to
     */
    addSegment(segment, metroline) {
        const cells = this.getSegmentCells(segment);
        
        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey).add(segment);
        });
        
        this.segmentToMetroline.set(segment, metroline);
        this.totalSegments++;
    }

    /**
     * Removes a segment from the spatial index.
     * 
     * @param {Object} segment - The segment to remove
     */
    removeSegment(segment) {
        const cells = this.getSegmentCells(segment);
        
        cells.forEach(cellKey => {
            const cellSegments = this.grid.get(cellKey);
            if (cellSegments) {
                cellSegments.delete(segment);
                if (cellSegments.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        });
        
        this.segmentToMetroline.delete(segment);
        this.totalSegments--;
    }

    /**
     * Queries segments within a bounding box.
     * Returns only segments that are spatially close to the query area.
     * 
     * @param {Object} bounds - Bounding box {x, y, width, height}
     * @returns {Array<Object>} Array of candidate segments with their metrolines
     */
    query(bounds) {
        const startTime = performance.now();
        
        const { x, y, width, height } = bounds;
        const startGrid = this.worldToGrid(x, y);
        const endGrid = this.worldToGrid(x + width, y + height);
        
        const candidateSegments = new Set();
        const results = [];
        
        // Check all grid cells that intersect with the bounding box
        for (let gridX = startGrid.gridX; gridX <= endGrid.gridX; gridX++) {
            for (let gridY = startGrid.gridY; gridY <= endGrid.gridY; gridY++) {
                const cellKey = this.getCellKey(gridX, gridY);
                const cellSegments = this.grid.get(cellKey);
                
                if (cellSegments) {
                    cellSegments.forEach(segment => {
                        if (!candidateSegments.has(segment)) {
                            candidateSegments.add(segment);
                            const metroline = this.segmentToMetroline.get(segment);
                            if (metroline) {
                                results.push({ segment, metroline });
                            }
                        }
                    });
                }
            }
        }
        
        this.lastQueryTime = performance.now() - startTime;
        return results;
    }

    /**
     * Adds all segments from a metroline to the spatial index.
     * 
     * @param {Object} metroline - Metroline object with polylines property
     */
    addMetroline(metroline) {
        if (!metroline.polylines) return;
        
        metroline.polylines.forEach(polyline => {
            const points = Array.from(polyline.points);
            
            for (let i = 0; i < points.length - 1; i++) {
                const segment = {
                    start: { x: points[i].x, y: points[i].y },
                    end: { x: points[i + 1].x, y: points[i + 1].y },
                    polyline,
                    metrolineId: metroline.getId()
                };
                
                this.addSegment(segment, metroline);
            }
        });
    }

    /**
     * Removes all segments from a metroline from the spatial index.
     * 
     * @param {Object} metroline - Metroline object to remove
     */
    removeMetroline(metroline) {
        // Find and remove all segments belonging to this metroline
        const segmentsToRemove = [];
        this.segmentToMetroline.forEach((ml, segment) => {
            if (ml === metroline) {
                segmentsToRemove.push(segment);
            }
        });
        
        segmentsToRemove.forEach(segment => this.removeSegment(segment));
    }

    /**
     * Rebuilds the entire spatial index from scratch.
     * Call this when the map dimensions change or after major updates.
     * 
     * @param {Array<Object>} metrolines - Array of all metrolines to index
     */
    rebuild(metrolines, mapWidth = null, mapHeight = null) {
        // Clear existing index
        this.clear();
        
        // Update dimensions if provided
        if (mapWidth !== null) this.mapWidth = mapWidth;
        if (mapHeight !== null) this.mapHeight = mapHeight;
        
        // Re-add all metrolines
        metrolines.forEach(metroline => this.addMetroline(metroline));
    }

    /**
     * Clears the entire spatial index.
     */
    clear() {
        this.grid.clear();
        this.segmentToMetroline.clear();
        this.totalSegments = 0;
    }

    /**
     * Gets performance statistics for the spatial index.
     * 
     * @returns {Object} Performance metrics
     */
    getStats() {
        return {
            totalSegments: this.totalSegments,
            totalCells: this.grid.size,
            avgSegmentsPerCell: this.grid.size > 0 ? this.totalSegments / this.grid.size : 0,
            lastQueryTime: this.lastQueryTime,
            memoryUsage: this.grid.size * 50 // Rough estimate in bytes
        };
    }
}


