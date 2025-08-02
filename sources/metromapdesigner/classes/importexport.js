import * as config from '../config.js';
import { sanitizeMapContent } from '../common.js';

/**
 * Class for handling the import and export functionalities of a metromap design.
 */
export default class MetromapImportExport {

  /**
   * Generates a shareable link for the metromap.
   * 
   * @param {Object} map - The map object containing the canvas content.
   * @returns {Promise<string>} - A promise resolving to the shareable URL.
   * @throws Will throw an error if the request fails.
   */
  async getShareLink(map) {
    try {
      let metrokaartContent = map.getCanvasContent(true);
      let blob = new Blob([metrokaartContent], { type: "image/svg+xml" });
      let file = new File([blob], "metrokaart.svg");
      let formData = new FormData();
      formData.append("svgFile", file);

      let response = await fetch(config.applicationConfig.uploadLink, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error saving the metro map: ${response.statusText}`);
      }

      let uniqueCode = await response.text();
      return config.applicationConfig.downloadBaseLink + uniqueCode;
    } catch (error) {
      console.error(error);
      throw new Error("Error saving the metro map");
    }
  }

  /**
   * Retrieves content using a unique code.
   *
   * Depending on the specified type, it retrieves either:
   * - The shared canvas content as sanitized SVG (when type is 'svg').
   * - The JSON data (when type is 'json').
   *
   * @param {string} code - The unique code for the shared content.
   * @param {string} [type='svg'] - The type of content to retrieve ('svg' or 'json').
   * @returns {Promise<Object|string>} - A promise resolving to either the parsed JSON data or the sanitized SVG content.
   * @throws Will throw an error if the request fails.
   */
  async retrieveContent(code, type = 'svg') {
    try {
      const response = await fetch(config.applicationConfig.retrievalLink + encodeURIComponent(code));
      
      if (!response.ok) {
        throw new Error(`Error retrieving content: ${response.statusText}`);
      }
      
      if (type === 'json') {
        const jsonData = await response.json();
        return jsonData;
      } else {
        const svgContent = await response.text();
        return sanitizeMapContent(svgContent);
      }
    } catch (error) {
      console.error(error);
      if (type === 'json') {
        throw new Error("Error retrieving JSON data");
      } else {
        throw new Error("Error retrieving the metro map");
      }
    }
  }

  /**
   * Fetches canvas content from a given URL.
   * 
   * @param {string} url - The URL of the canvas.
   * @returns {Promise<string>} - A promise resolving to the sanitized SVG content.
   * @throws Will throw an error if the request fails.
   */
  async getCanvasFromUrl(url) {
    try {
      let response = await fetch(url);
      if (!response.ok) {
        // Create specific error based on status code
        const errorMessage = this.getErrorMessageForStatus(response.status, response.statusText, url);
        const error = new Error(errorMessage);
        error.name = 'NetworkError';
        error.status = response.status;
        error.url = url;
        throw error;
      }

      let svgContent = await response.text();
      try {
        return sanitizeMapContent(svgContent);
      } catch (sanitizeError) {
        const error = new Error(`Invalid SVG content from URL: ${url}. ${sanitizeError.message}`);
        error.name = 'SanitizationError';
        error.url = url;
        error.cause = sanitizeError;
        throw error;
      }
    } catch (error) {
      // Re-throw with additional context if it's a network/fetch error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error(`Network error loading map from: ${url}. Check internet connection or file path.`);
        networkError.name = 'NetworkError';
        networkError.url = url;
        networkError.cause = error;
        throw networkError;
      }
      
      // Re-throw our custom errors as-is
      if (error.name === 'NetworkError' || error.name === 'SanitizationError') {
        throw error;
      }
      
      // Unknown error - wrap with context
      const unknownError = new Error(`Unexpected error loading map from: ${url}. ${error.message}`);
      unknownError.name = 'UnknownError';
      unknownError.url = url;
      unknownError.cause = error;
      throw unknownError;
    }
  }

  /**
   * Gets a user-friendly error message based on HTTP status code.
   * @private
   */
  getErrorMessageForStatus(status, statusText, url) {
    switch (status) {
      case 404:
        return `Map file not found: ${url}. Please check the file path.`;
      case 403:
        return `Access denied to map file: ${url}. Check file permissions.`;
      case 500:
      case 502:
      case 503:
        return `Server error loading map from: ${url}. Try again later.`;
      case 0:
        return `Network error: Cannot reach ${url}. Check internet connection.`;
      default:
        return `HTTP ${status} error loading map from: ${url}. ${statusText}`;
    }
  }

  /**
   * Extracts and sanitizes the SVG content of the map.
   * 
   * @param {Object} map - The map object containing the canvas content.
   * @returns {string} - The sanitized SVG content.
   */
  getSVG(map) {
    let metrokaartContent = map.getCanvasContent(true);
    return sanitizeMapContent(metrokaartContent);
  }

  /**
   * Converts the map content to a PNG image.
   * 
   * @param {Object} map - The map object containing the canvas content.
   * @returns {Promise<string>} - A promise resolving to the PNG data URL.
   */
  getPng(map) {
    return new Promise((resolve, reject) => {
      let svg = null;
      let url = null;
      let canvas = null;
      let img = null;
      
      try {
        const svgData = this.getSVG(map);
        if (!svgData) {
          throw new Error("No SVG data available for PNG conversion");
        }
        
        img = new Image();
        svg = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        url = URL.createObjectURL(svg);

        // Set up cleanup timeout as fallback
        const cleanupTimeout = setTimeout(() => {
          if (url) {
            URL.revokeObjectURL(url);
          }
          reject(new Error("PNG conversion timeout"));
        }, 30000); // 30 second timeout

        img.onload = () => {
          try {
            clearTimeout(cleanupTimeout);
            canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            
            if (!context) {
              throw new Error("Could not get canvas 2D context");
            }
            
            context.imageSmoothingQuality = "high";
            context.textRendering = "geometricPrecision";

            canvas.width = img.width * 2;
            canvas.height = img.height * 2;

            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngDataUrl = canvas.toDataURL("image/png");
            
            // Clean up resources
            URL.revokeObjectURL(url);
            canvas = null;
            img = null;
            
            resolve(pngDataUrl);
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };

        img.onerror = (error) => {
          clearTimeout(cleanupTimeout);
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load SVG image for PNG conversion: " + error));
        };

        img.src = url;
      } catch (error) {
        if (url) {
          URL.revokeObjectURL(url);
        }
        reject(error);
      }
    });
  }

  /**
   * Downloads the metro map as a JSON file with proper resource cleanup.
   *
   * @param {Object} map - The metromap object.
   * @param {string} [filename="metromap.json"] - The desired filename for the downloaded JSON file.
   */
  getJSON(map, filename = "metromap") {
    let blob = null;
    let url = null;
    let link = null;
    
    try {
      // Generate the JSON data from the map
      const jsonData = map.toJSON();
      if (!jsonData) {
        throw new Error("No JSON data available from map");
      }

      // Convert JSON object to a string
      const jsonString = JSON.stringify(jsonData, null, 2); // Pretty-print with 2 spaces
      if (!jsonString || jsonString === '{}') {
        throw new Error("Generated JSON data is empty");
      }

      // Create a Blob with JSON content
      blob = new Blob([jsonString], { type: "application/json" });
      url = URL.createObjectURL(blob);

      // Create a download link
      link = document.createElement("a");
      link.href = url;
      link.download = filename + ".json";
      link.style.display = 'none'; // Hide the link
      document.body.appendChild(link);

      // Programmatically click the link to trigger the download
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
      console.error("Error downloading the JSON file:", error);
      throw new Error("Could not generate the JSON file for download: " + error.message);
    }
  }

  /**
   * Retrieves JSON data using a unique code and imports it to the provided map.
   *
   * @param {Object} map - The metromap object to be updated.
   * @param {string} code - The unique code for the JSON data.
   * @returns {Promise<boolean>} - A promise resolving to true if the import succeeds.
   * @throws Will throw an error if the retrieval or import fails.
   */
   async retrieveAndImportJSON(map, code) {
      try {
        // Retrieve the JSON data using the unified retrieveContent function
        const jsonData = await this.retrieveContent(code, 'json');
        // Convert the JSON object into a string as expected by importJSON
        const jsonString = JSON.stringify(jsonData);
        // Import the JSON string into the map
        return this.importJSON(map, jsonString);
      } catch (error) {
        throw new Error("Error retrieving and importing JSON data");
      }
  }

  /**
   * Retrieves SVG data using a unique code and loads it into the provided map.
   *
   * @param {Object} map - The metromap object which should have a loadMap method.
   * @param {string} code - The unique code for the SVG data.
   * @returns {Promise<boolean>} - A promise resolving to true if the load succeeds.
   * @throws Will throw an error if the retrieval or loading fails.
   */
  async retrieveAndLoadSVG(code) {
    try {
      // Retrieve the sanitized SVG content using the unified retrieveContent function
      const svgContent = await this.retrieveContent(code, 'svg');
      // Load the SVG content into the map using its loadMap method
      return svgContent;
    } catch (error) {
      console.error(error);
      throw new Error("Error retrieving and loading SVG data");
    }
  }

  /**
   * Imports a JSON string, validates it, and updates the provided map object.
   * 
   * @param {Object} map - The metromap object to be updated.
   * @param {string} jsonString - The JSON string representing the metro map.
   * @returns {boolean} - True if the import succeeds.
   * @throws Will throw an error if the JSON string is invalid, the validation fails, or the map cannot be updated.
   */
  importJSON(map, jsonString) {
    try {
      // Parse the JSON string into an object
      const jsonData = JSON.parse(jsonString);

      // Validate the parsed JSON data
      this.validateJSON(jsonData);

      // Pass the validated JSON data to the map's import method
      if (typeof map.fromJSON !== "function") {
        throw new Error("The map object does not support importing from JSON.");
      }

      map.fromJSON(jsonData); // Update the map with the imported data
      return true; // Indicate success
    } catch (error) {
      console.error("Error importing JSON:", error);
      throw new Error(`Failed to import JSON. Validation or parsing error: ${error.message}`);
    }
  }

  /**
   * Validates the structure and content of a metro map JSON.
   *
   * @param {Object} map - The metro map JSON object.
   * @throws Will throw an error if validation fails, with details about all issues.
   * @returns {boolean} - Returns true if the map is valid.
   */
  validateJSON(map) {
    const errors = [];
    const validOrientations = [0, 45, 90, 135, 180, 225, 270, 315]; // Allowed orientations

    // Validate general map structure
    if (!map.title || typeof map.title !== "string") {
      errors.push("The map must have a 'title'.");
    }
    if (!map.dimensions || typeof map.dimensions.width !== "number" || typeof map.dimensions.height !== "number") {
      errors.push("The map must have valid 'dimensions' with 'width' and 'height'.");
    }

    // If the map has no stations and no metrolines, it's considered an empty map and valid
    const hasStations = Array.isArray(map.stations) && map.stations.length > 0;
    const hasMetrolines = Array.isArray(map.metroLines) && map.metroLines.length > 0;
    if (!hasStations && !hasMetrolines) {
      return true; // Empty map is valid
    }

    // Validate metrolines if stations are present
    const metrolineIDs = new Set();
    if (hasStations && !hasMetrolines) {
      errors.push("The map must have at least one metroline if stations are present.");
    } else {
      map.metroLines.forEach((metroline, index) => {
        if (!metroline.metroLineId) errors.push(`Metroline at index ${index} must have an 'id'.`);
        if (!metroline.name) errors.push(`Metroline at index ${index} must have a 'name'.`);
        if (!metroline.targetGroup) errors.push(`Metroline at index ${index} must have a 'target group'.`);
        if (!metroline.color || typeof metroline.color.r !== "number" || typeof metroline.color.g !== "number" || typeof metroline.color.b !== "number") {
          errors.push(`Metroline at index ${index} must have a valid 'color' (R, G, B).`);
        }
        if (!Array.isArray(metroline.segments) || metroline.segments.length === 0) {
          errors.push(`Metroline at index ${index} must have at least one 'segment'.`);
        } else {
          metroline.segments.forEach((segment, segIndex) => {
            if (!segment.start || typeof segment.start.x !== "number" || typeof segment.start.y !== "number") {
              errors.push(`Segment at index ${segIndex} of metroline at index ${index} must have valid 'start' coordinates.`);
            }
            if (!segment.end || typeof segment.end.x !== "number" || typeof segment.end.y !== "number") {
              errors.push(`Segment at index ${segIndex} of metroline at index ${index} must have valid 'end' coordinates.`);
            }
          });
        }
        if (metroline.metroLineId) metrolineIDs.add(metroline.metroLineId);
      });
    }

    // Validate stations
    if (hasStations) {
      map.stations.forEach((station, index) => {
        if (!station.name) errors.push(`Station at index ${index} must have a 'name'.`);
        if (!station.type) errors.push(`Station at index ${index} must have a 'type'.`);
        if (!station.position || typeof station.position.x !== "number" || typeof station.position.y !== "number") {
          errors.push(`Station at index ${index} must have valid 'position' coordinates.`);
        }
        if (typeof station.orientation !== "number" || !validOrientations.includes(station.orientation)) {
          errors.push(`Station at index ${index} must have a valid 'orientation' (one of ${validOrientations.join(", ")}).`);
        }
        if (!station.shape) errors.push(`Station at index ${index} must have a 'shape'.`);
        if (station.shape === "connection" && (typeof station.width !== "number" || station.width <= 0)) {
          errors.push(`Station at index ${index} with 'connection' shape must have a valid 'width'.`);
        }
        if (!Array.isArray(station.metroLines) || station.metroLines.length === 0) {
          errors.push(`Station at index ${index} must have at least one associated 'metroline'.`);
        } else {
          station.metroLines.forEach((id) => {
            if (!metrolineIDs.has(id)) {
              errors.push(`Station at index ${index} references non-existent metroline ID '${id}'.`);
            }
          });
        }
      });
    }

    // Final validation results
    if (errors.length > 0) {
      throw new Error(`Validation failed with the following issues:\n- ${errors.join("\n- ")}`);
    }
    return true;
  }


}