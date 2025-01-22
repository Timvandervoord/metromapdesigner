// Copyright (C) 2024 Tim van der Voord (tim@vandervoord.nl)
//
// This file may be distributed under the terms of the GNU GPLv3 license.

import * as config from '../config.js';

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
   * Retrieves shared canvas content using a unique code.
   * 
   * @param {string} code - The unique code for the shared canvas.
   * @returns {Promise<string>} - A promise resolving to the sanitized SVG content.
   * @throws Will throw an error if the request fails.
   */
  async retrieveSharedCanvas(code) {
    try {
      let response = await fetch(config.applicationConfig.retrievalLink + encodeURIComponent(code));
      
      if (!response.ok) {
        throw new Error(`Error retrieving metro map: ${response.statusText}`);
      }

      let svgContent = await response.text();
      return this.sanitizeMapContent(svgContent);
    } catch (error) {
      console.error(error);
      throw new Error("Error retrieving the metro map");
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
        throw new Error(`Error fetching canvas from URL: ${response.statusText}`);
      }

      let svgContent = await response.text();
      return this.sanitizeMapContent(svgContent);
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching canvas from URL");
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
    return this.sanitizeMapContent(metrokaartContent);
  }

  /**
   * Converts the map content to a PNG image.
   * 
   * @param {Object} map - The map object containing the canvas content.
   * @returns {Promise<string>} - A promise resolving to the PNG data URL.
   */
  getPng(map) {
    return new Promise((resolve, reject) => {
      const svgData = this.getSVG(map);
      const img = new Image();
      const svg = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svg);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.imageSmoothingQuality = "high";
        context.textRendering = "geometricPrecision";

        canvas.width = img.width * 2;
        canvas.height = img.height * 2;

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngDataUrl);
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      img.src = url;
    });
  }

  /**
   * Downloads the metro map as a JSON file.
   *
   * @param {Object} map - The metromap object.
   * @param {string} [filename="metromap.json"] - The desired filename for the downloaded JSON file.
   */
  getJSON(map, filename = "metromap") {
    try {
      // Generate the JSON data from the map
      const jsonData = map.toJSON();

      // Convert JSON object to a string
      const jsonString = JSON.stringify(jsonData, null, 2); // Pretty-print with 2 spaces

      // Create a Blob with JSON content
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename + ".json";

      // Programmatically click the link to trigger the download
      link.click();

      // Clean up by revoking the object URL
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading the JSON file:", error);
      throw new Error("Could not generate the JSON file for download.");
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
    const hasMetrolines = Array.isArray(map.metrolines) && map.metrolines.length > 0;
    if (!hasStations && !hasMetrolines) {
      return true; // Empty map is valid
    }

    // Validate metrolines if stations are present
    const metrolineIDs = new Set();
    if (hasStations && !hasMetrolines) {
      errors.push("The map must have at least one metroline if stations are present.");
    } else {
      map.metrolines.forEach((metroline, index) => {
        if (!metroline.metrolineID) errors.push(`Metroline at index ${index} must have an 'id'.`);
        if (!metroline.name) errors.push(`Metroline at index ${index} must have a 'name'.`);
        if (!metroline.targetGroup) errors.push(`Metroline at index ${index} must have a 'target group'.`);
        if (!metroline.color || typeof metroline.color.R !== "number" || typeof metroline.color.G !== "number" || typeof metroline.color.B !== "number") {
          errors.push(`Metroline at index ${index} must have a valid 'color' (R, G, B).`);
        }
        if (!Array.isArray(metroline.segments) || metroline.segments.length === 0) {
          errors.push(`Metroline at index ${index} must have at least one 'segment'.`);
        } else {
          metroline.segments.forEach((segment, segIndex) => {
            if (!segment.Start || typeof segment.Start.X !== "number" || typeof segment.Start.Y !== "number") {
              errors.push(`Segment at index ${segIndex} of metroline at index ${index} must have valid 'start' coordinates.`);
            }
            if (!segment.End || typeof segment.End.X !== "number" || typeof segment.End.Y !== "number") {
              errors.push(`Segment at index ${segIndex} of metroline at index ${index} must have valid 'end' coordinates.`);
            }
          });
        }
        if (metroline.metrolineID) metrolineIDs.add(metroline.metrolineID);
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
        if (!Array.isArray(station.metrolines) || station.metrolines.length === 0) {
          errors.push(`Station at index ${index} must have at least one associated 'metroline'.`);
        } else {
          station.metrolines.forEach((id) => {
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

  /**
   * Sanitizes SVG content to allow only specific tags and attributes.
   * 
   * @param {string} content - The raw SVG content.
   * @returns {string} - The sanitized SVG content.
   */
  sanitizeMapContent(content) {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: config.applicationConfig.METROMAP_DESIGNER_MAP_TAGS,
      ALLOWED_ATTR: config.applicationConfig.METROMAP_DESIGNER_MAP_ATTRIBUTES
    });
  }

}