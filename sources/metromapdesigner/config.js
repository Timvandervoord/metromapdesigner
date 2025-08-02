// Copyright (C) 2024 Tim van der Voord (tim@vandervoord.nl)
//
// This file may be distributed under the terms of the GNU GPLv3 license.

// Default application configuration
export let applicationConfig = {
    metrolineColors : [
        "rgb(227, 32, 23)",
        "rgb(0, 120, 42)",
        "rgb(0, 152, 212)",
        "rgb(0, 54, 136)",
        "rgb(243, 169, 187)",
        "rgb(255, 211, 0)",
        "rgb(160, 165, 169)",
        "rgb(105, 80, 161)",
        "rgb(155, 0, 86)",
        "rgb(0, 164, 167)",
        "rgb(164, 90, 42)",
        "rgb(239, 123, 16)",
      ],
    toolSettings : {
        stationTool: { shape: "normal", cursor: "arrow" },
        textEditTool: { cursor: "text" },
        transferStationTool: { shape: "connection", cursor: "arrow" },
        normalStationTool: { shape: "normal", cursor: "arrow" },
        startStationTool: { shape: "start", cursor: "arrow" },
        endStationTool: { shape: "end", cursor: "arrow" },
        connectionStationTool: { shape: "connection", cursor: "arrow" },
        eraserTool: { cursor: "eraser" },
        stationEditTool: { cursor: "move" },
        moveTool: { cursor: "move" },
      },
      maxStateStackSize : 30,
      toleranceMetrolineDetection : 10,
      appName: "MetroMap design studio",
      appVersion: "release 2025.8.2",
      defaultLanguage: "nl",
      languageSelector: "languageSelector",
      canvasSizes: [
        { width: 1440, height: 960 },
        { width: 1920, height: 1440 },
        { width: 2560, height: 1920 },
      ],
      METROMAP_DESIGNER_MAP_TAGS : [
        "svg", "animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter",
        "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "metadata",
        "path", "pattern", "polygon", "polyline", "rect", "stop", "symbol", "text", "textpath",
        "tspan", "style", "use", "view", "a", "title"
      ],
      METROMAP_DESIGNER_MAP_ATTRIBUTES : [
        "alignment-baseline", "cx", "cy", "class", "d", "dx", "dy", "fill", "font-family", "font-size",
        "font-weight", "fx", "fy", "gradientTransform", "gradientUnits", "height", "href", "id",
        "marker-end", "marker-mid", "marker-start", "offset", "opacity", "pathLength",
        "patternContentUnits", "patternUnits", "points", "preserveAspectRatio", "r", "rx", "ry",
        "rotate", "spreadMethod", "stop-color", "stop-opacity", "stroke", "stroke-dasharray",
        "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width",
        "style", "text-anchor", "transform", "version", "viewBox", "width", "x", "x1", "x2", "xmlns",
        "y", "y1", "y2", "xlink:href", "xmlns:xlink", "stationshapesize", "stationshapeorientation",
        "stationshapetype", "metrolineid", "stationorientation", "position", "dominant-baseline",
        "version", "encoding", "metromapversion", "stationshapeorientation", "stationshapelinewidth"
      ],
      uploadLink: "https://yourlink/uploadMetroMap",
      downloadBaseLink: "https://yourlink/?mc=",
      retrievalLink: "https://yourlink/retrieveMetroMap?code=",
}

export const gridConfig = {
  size: 10,
  thickness: 1,
  lineColor: "lightgrey",
  displayed: true,
  lineChangeDirectionMargin: 25
};

export const metrolineConfig = {
  thickness: 20,
  defaultColor: "rgb(227, 32, 23)"
};

export const legendaConfig = {
  legendaFontSize         : 14,
  legendaFontWeight       : 600,
  legendaFontColor        : "white",
  legendaFont             : "Poppins",
  numberOfItemsPerColom   : 5,

  // Padding values
  boxPaddingX : metrolineConfig.thickness * 0.75,
  boxPaddingY : metrolineConfig.thickness * 0.625,
  boxHeight : metrolineConfig.thickness * 1.25,
  linePaddingY : metrolineConfig.thickness * 2,
  linePaddingX : 10,
  colomLinePaddingTop : 20,
  textOffset : metrolineConfig.thickness * 0.25
};

// Default station configuration
export let stationDefaultConfig = {
        name : "Stationsnaam",
        type : "w",
        date : "Maandag 1 januari 2000 | 00:00",
        description : "beschrijving",
        link : "",
        metrolineid : "metrolinergb2401370",
        orientation : 315,
        shape : "normal",
        size : 20,
        width : 2,
        x : 0,
        y : 0
}
// Default station visual configuration
export let stationVisualConfig = {

    // Font settings
    stationFont: "Poppins",
    stationFontSize: 14,
    stationDateFontSize: 12,
    stationNameFontWeight: "600",
    stationDateFontWeight: "300",
    stationTypeFontWeight: "600",
    stationTypeFontColor: "rgb(255, 255, 255)",
    stationNameFontColor: "rgb(0, 0, 0)",

    // Station name splitting over multiple lines
    stationMaxNameCharLength: 30, // Maximum characther length of a station before newline
    stationNameLineHeight: 14,  // Distance between station name lines

    // Radius and stroke settings normal, end and start stations
    stationNormalRadius: 10,  // Radius for normal station
    stationStartEndRadius: 20, // Radius for start and endstations
    stationStartEndStrokeWidth: 8, // Stroke size start and endstations
    stationNormalStrokeWidth: 8, // Stroke size normal stations

    // Colors
    stationNormalInsideColor:"rgb(255, 255, 255)",
    stationConnectionColorInside: "rgb(255, 255, 255)",
    stationTypeRectColor: "rgb(0, 0, 0)",
    stationStartEndInsideColor: "rgb(255, 255, 255)",
    stationConnectionColor: "rgb(0, 0, 0)",

    // Margins and offsets for the linkbutton
    stationButtonMarginHeight: 5,
    stationButtonMarginWidth: 65,
    stationButtonOffsetX: metrolineConfig.thickness,

    // Type rectangle settings
    stationTypeTextOffset: { x: 10, y: 14 },
    stationTypeBoxWidth: 20,
    stationTypeBoxHeight: 20,
    stationTypeRounding: 5,

    // Offsets for text and type 
    stationTextOffsetConfig: {
        normal: 60,          // Base offset for normal shapes (default alignment)
        connection: 80,      // Offset for "start" and "end" shapes inversed
        startEnd: 60,      // Offset for "start" and "end" shapes inversed
    },
    stationTypeOffsetConfig: {
        normal: 20,           // Base offset for normal shapes (type position)
        connection: 40,      // Offset for "start" and "end" shapes inversed
        startEnd: 20,      // Offset for "start" and "end" shapes inversed
        yOffset: metrolineConfig.thickness / 2    // by default half the metroline thickness
    },
};