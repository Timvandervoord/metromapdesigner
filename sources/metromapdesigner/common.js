import * as config from './config.js';

//############################################################################################
// ## COMMON HELPER FUNCTIONS
const svgNS = "http://www.w3.org/2000/svg";

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
 * Offsets the current translation of an SVG element by specified values.
 *
 * @param {SVGElement} element - The SVG element to offset.
 * @param {number} [offSetX=0] - The x offset.
 * @param {number} [offSetY=0] - The y offset.
 */
export function setTranslateOffset(element, offSetX = 0, offSetY = 0) {
    if (element instanceof SVGElement) {
      // Get current x and y
      let translate = getTranslate(element);
      setTranslate(element, translate[0] + offSetX, translate[1] + offSetY);
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
export function getMousePos(evt, map) {
    let x, y;
    let svgElement = map.getCanvas();
    if (!svgElement) return { x: 0, y: 0 }; // Default to origin if no SVG element is found
  
    // Is this a touch interface or normal mouse interface?
    var isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  
    // Check the type of event
    if (evt.type.startsWith("mouse") || evt.type.startsWith("click")) {
      mouseRecentlyUsed = true;
      setTimeout(() => {
        mouseRecentlyUsed = false;
      }, 2000); // reset after 2 seconds of inactivity
    } else if (mouseRecentlyUsed) {
      return; // ignore touch events if a mouse event has recently occurred
    }
  
    if (!isTouchDevice || mouseRecentlyUsed) {
      x = evt.clientX;
      y = evt.clientY;
    } else {
      evt.preventDefault(); // prevent default behavior like scrolling
      var touch = evt.touches[0];
      x = typeof touch !== "undefined" ? touch.clientX : map.mousePosition.x; // on touch interfaces, clientX or Y are not set on touchEnd event, use last known
      y = typeof touch !== "undefined" ? touch.clientY : map.mousePosition.y;
    }
  
    var point = svgElement.createSVGPoint();
    point.x = x;
    point.y = y;
  
    var transform = point.matrixTransform(svgElement.getScreenCTM().inverse());
  
    return {
      x: transform.x,
      y: transform.y,
    };
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
   * Parses an RGB string like "rgb(227, 32, 23)" into an object with R, G, and B properties.
   * @param {string} rgbString - The RGB string to parse.
   * @returns {Object} An object with R, G, and B properties.
   */
  export function parseRGBStringSC(rgbString) {
    const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
        throw new Error(`Invalid RGB string: ${rgbString}`);
    }
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
    };
  }

  /**
   * Converts a color from hex to RGB format if necessary.
   *
   * @param {string} color - The color string (hex or RGB).
   * @returns {string} The color in RGB format.
   */
  export function convertToRgb(color) {
    // Function to check RGB format, allowing optional spaces
    const isRGBFormat = (s) =>
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(s) &&
      s.match(/(\d{1,3})/g).every((n) => n >= 0 && n <= 255);

    // Function to check HEX color (3 or 6 digits)
    const isHexColor = (s) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);

    // Already RGB, just return normalized string
    if (isRGBFormat(color)) {
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
   * Extract RGB from string
   * @param {string} input 
   * @returns 
  export function extractRGBValue(input) {
    // Remove the prefix 'metrolinergb' and extract the numeric values
    const rgbValues = input.replace('metrolinergb', '');

    // Split the string into three components: red, green, and blue
    const red = parseInt(rgbValues.substring(0, 3), 10); // First 3 digits
    const green = parseInt(rgbValues.substring(3, 6), 10); // Next 3 digits
    const blue = parseInt(rgbValues.substring(6, 9), 10); // Last 3 digits

    // Return the RGB value as a string or object
    return `rgb(${red}, ${green}, ${blue})`;
  }
  */
  
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
    const validIds = ["academyName", "titleText1", "titleText2", "legenda", "legendaStations", "logo", "stationGroup", "metroLineName", "metroLineTargetGroup"];

    // Traverse up the DOM tree
    while (element instanceof SVGElement) {
        const elClass = element.getAttribute("class");
        const elTag = element.tagName.toLowerCase();
        const elId = element.id;

        // Check for station group
        if (elClass === "stationGroup") return element;

        // Check for metrolines (polylines that are not legenda polylines)
        if (elTag === "polyline" && elClass !== "legendaPolyline") return element;

        // Check for known IDs
        if (validIds.includes(elId)) return element;

        // Move up one level in the DOM
        element = element.parentNode;
    }

    // Return null if no editable element is found
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
    const validIds = ["academyName", "titleText1", "titleText2"];
    const validClasses = ["metroLineName", "metroLineTargetGroup", "legendaStationItemSymbol", "legendaStationItemName", "legendaText", "legendaLineText"];

    // Traverse up the DOM tree
    while (element instanceof SVGElement) {
        const elClass = element.getAttribute("class");
        const elId = element.id;

        // Check for known IDs
        if (validIds.includes(elId)) return element;

        // Check for known classes
        if (elClass && validClasses.some((validClass) => elClass.split(" ").includes(validClass))) {
            return element;
        }

        // Move up one level in the DOM
        element = element.parentNode;
    }

    // Return null if no editable element is found
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
 * Checks if a line segment intersects with a polygon.
 *
 * @param {Object} start - The starting point of the line segment.
 * @param {number} start.x - The x-coordinate of the start point.
 * @param {number} start.y - The y-coordinate of the start point.
 * @param {Object} end - The ending point of the line segment.
 * @param {number} end.x - The x-coordinate of the end point.
 * @param {number} end.y - The y-coordinate of the end point.
 * @param {Array<Object>} vertices - The vertices of the polygon, each with `x` and `y` properties.
 * @returns {boolean} - Returns `true` if the line segment intersects the polygon, otherwise `false`.
 */
export function lineIntersectsPolygon(start, end, vertices) {
  for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      if (lineIntersectsLine(start, end, v1, v2)) {
          return true;
      }
  }
  return false;
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


