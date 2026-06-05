"use strict";
(self["webpackChunkyezq_mcp_tools"] = self["webpackChunkyezq_mcp_tools"] || []).push([["style_index_js"],{

/***/ "./node_modules/css-loader/dist/runtime/api.js"
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js"
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
(module) {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js"
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js"
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js"
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js"
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ },

/***/ "./style/index.js"
/*!************************!*\
  !*** ./style/index.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.css */ "./style/base.css");
/* harmony import */ var _components_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components.css */ "./style/components.css");
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */





/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./style/base.css"
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./style/base.css ***!
  \**************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */
`, "",{"version":3,"sources":["webpack://./style/base.css"],"names":[],"mappings":"AAAA;;;EAGE","sourcesContent":["/*\n * Copyright (c) 2023-2025 Datalayer, Inc.\n * Distributed under the terms of the Modified BSD License.\n */\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./style/components.css"
/*!********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./style/components.css ***!
  \********************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

/* MCP Tools Panel Styles */

.jp-MCPToolsWidget {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

/* Ensure the widget container fills parent */
.jp-MCPToolsWidget > div {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.mcp-tools-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color1);
  font-family: var(--jp-ui-font-family);
  font-size: var(--jp-ui-font-size1);
}

/* Panel Header */
.mcp-panel-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--jp-border-color2);
  background: var(--jp-layout-color2);
  flex-shrink: 0;
}

.mcp-panel-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--jp-ui-font-color1);
}

.mcp-panel-stats strong {
  font-weight: 600;
  color: var(--jp-ui-font-color0);
}

.mcp-stats-separator {
  color: var(--jp-border-color2);
  font-weight: normal;
}

/* Tabs */
.mcp-panel-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
  border-bottom: 2px solid var(--jp-border-color2);
  background: var(--jp-layout-color1);
  flex-shrink: 0;
}

.mcp-tab {
  flex: 1;
  padding: 10px 16px;
  background: var(--jp-layout-color2);
  border: 1px solid var(--jp-border-color2);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-bottom: -2px;
  color: var(--jp-ui-font-color2);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--jp-ui-font-family);
  font-weight: 500;
  transition: all 0.2s;
}

.mcp-tab:hover {
  background: var(--jp-layout-color3);
  color: var(--jp-ui-font-color0);
  border-color: var(--jp-border-color1);
}

.mcp-tab-active {
  color: var(--jp-brand-color1);
  font-weight: 600;
  background: var(--jp-layout-color0);
  border-color: var(--jp-border-color2);
  border-bottom-color: var(--jp-layout-color0);
  box-shadow: 0 -2px 4px rgb(0 0 0 / 10%);
}

/* Panel content area - fills remaining space */
.mcp-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Contains scrollable children */
  min-height: 0; /* Important for flex children with overflow */
}

/* Search Box */
.mcp-search-box {
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--jp-border-color2);
  background: var(--jp-layout-color1);
  flex-shrink: 0; /* Don't shrink when space is tight */
}

.mcp-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--jp-border-color2);
  border-radius: 3px;
  background: var(--jp-input-background);
  color: var(--jp-ui-font-color0);
  font-size: 13px;
  font-family: var(--jp-ui-font-family);
}

.mcp-search-input:focus {
  outline: none;
  border-color: var(--jp-brand-color1);
  box-shadow: 0 0 0 1px var(--jp-brand-color1);
}

/* Filter Toggle */
.mcp-filter-toggle {
  margin-top: 8px;
}

.mcp-toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: var(--jp-ui-font-color1);
  user-select: none;
}

.mcp-toggle-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin: 0;
}

.mcp-toggle-text {
  line-height: 1.4;
}

/* Tools list - scrollable container */
.mcp-tools-list {
  flex: 1 1 0;
  overflow: hidden auto;
  padding: 12px;
  min-height: 0; /* Critical for flex children with overflow */
}

/* Tool Item */
.mcp-tool-item {
  margin-bottom: 10px;
  border: 1px solid var(--jp-border-color2);
  border-radius: 4px;
  background: var(--jp-layout-color2);
  transition: all 0.2s;
  flex-shrink: 0; /* Prevent items from shrinking */
}

.mcp-tool-item:hover {
  border-color: var(--jp-brand-color1);
  box-shadow: 0 2px 4px rgb(0 0 0 / 15%);
  transform: translateY(-1px);
}

.mcp-tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 14px;
  gap: 10px;
}

.mcp-tool-info {
  flex: 1;
  min-width: 0;
}

.mcp-tool-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--jp-ui-font-color0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mcp-tool-param-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: var(--jp-brand-color1);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  line-height: 1;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mcp-tool-id {
  font-size: 11px;
  color: var(--jp-ui-font-color2);
  font-family: var(--jp-code-font-family);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.mcp-tool-buttons {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.mcp-tool-button {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 60px;
  border: 1px solid var(--jp-border-color2);
  background: var(--jp-layout-color2);
  color: var(--jp-ui-font-color1);
  transition: all 0.2s;
}

.mcp-button-local:hover:not(:disabled) {
  background: var(--jp-layout-color3);
  border-color: var(--jp-border-color1);
  color: var(--jp-ui-font-color0);
}

.mcp-button-remote:hover:not(:disabled) {
  background: var(--jp-brand-color1);
  border-color: var(--jp-brand-color1);
  color: white;
}

.mcp-tool-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tool Form */
.mcp-tool-form {
  border-top: 1px solid var(--jp-border-color2);
  padding: 12px;
  background: var(--jp-layout-color1);
}

.mcp-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mcp-form-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--jp-ui-font-color1);
}

.mcp-form-close {
  background: transparent;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: var(--jp-ui-font-color2);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
}

.mcp-form-close:hover {
  color: var(--jp-ui-font-color0);
}

.mcp-form-description {
  font-size: 11px;
  color: var(--jp-ui-font-color2);
  margin-bottom: 8px;
  line-height: 1.4;
  font-style: italic;
}

.mcp-form-required {
  font-size: 11px;
  color: var(--jp-warn-color1);
  margin-bottom: 8px;
  font-weight: 600;
}

.mcp-form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--jp-border-color2);
  border-radius: 3px;
  background: var(--jp-input-background);
  color: var(--jp-ui-font-color0);
  font-size: 12px;
  font-family: var(--jp-code-font-family);
  resize: vertical;
  margin-bottom: 8px;
}

.mcp-form-input:focus {
  outline: none;
  border-color: var(--jp-brand-color1);
  box-shadow: 0 0 0 1px var(--jp-brand-color1);
}

.mcp-form-error {
  color: var(--jp-error-color1);
  font-size: 11px;
  margin-bottom: 8px;
}

.mcp-form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

.mcp-form-actions button {
  font-size: 11px;
  padding: 5px 12px;
}

/* Message list - scrollable */
.mcp-messages-list {
  flex: 1 1 auto;
  overflow: hidden auto;
  padding: 12px;
  min-height: 0; /* Critical for flex children with overflow */
  height: 100%; /* Ensure it takes available height */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Message Item */
.mcp-message-item {
  margin-bottom: 0;
  border: 1px solid var(--jp-border-color2);
  border-radius: 4px;
  background: var(--jp-layout-color2);
  overflow: hidden;
}

.mcp-message-sent {
  border-left: 3px solid var(--jp-success-color1);
}

.mcp-message-received {
  border-left: 3px solid var(--jp-info-color1);
}

.mcp-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.mcp-message-header:hover {
  background: var(--jp-layout-color1);
}

.mcp-message-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.mcp-message-direction {
  font-size: 14px;
  font-weight: 600;
  width: 22px;
  text-align: center;
}

.mcp-sent {
  color: var(--jp-success-color1);
}

.mcp-received {
  color: var(--jp-info-color1);
}

.mcp-message-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--jp-ui-font-color0);
  font-family: var(--jp-code-font-family);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcp-message-time {
  font-size: 11px;
  color: var(--jp-ui-font-color2);
  white-space: nowrap;
  line-height: 1.3;
}

.mcp-message-expand {
  font-size: 10px;
  color: var(--jp-ui-font-color2);
  margin-left: 8px;
}

.mcp-message-body {
  border-top: 1px solid var(--jp-border-color2);
  padding: 12px;
  background: var(--jp-layout-color1);
  max-height: 300px;
  overflow: auto;
}

.mcp-message-body pre {
  margin: 0;
  font-size: 11px;
  font-family: var(--jp-code-font-family);
  color: var(--jp-ui-font-color1);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* Empty State */
.mcp-empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: var(--jp-ui-font-color2);
  font-size: 13px;
  text-align: center;
}

/* Scrollbar Styles */
.mcp-tools-list::-webkit-scrollbar,
.mcp-messages-list::-webkit-scrollbar,
.mcp-message-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.mcp-tools-list::-webkit-scrollbar-track,
.mcp-messages-list::-webkit-scrollbar-track,
.mcp-message-body::-webkit-scrollbar-track {
  background: var(--jp-layout-color1);
}

.mcp-tools-list::-webkit-scrollbar-thumb,
.mcp-messages-list::-webkit-scrollbar-thumb,
.mcp-message-body::-webkit-scrollbar-thumb {
  background: var(--jp-border-color2);
  border-radius: 4px;
}

.mcp-tools-list::-webkit-scrollbar-thumb:hover,
.mcp-messages-list::-webkit-scrollbar-thumb:hover,
.mcp-message-body::-webkit-scrollbar-thumb:hover {
  background: var(--jp-border-color1);
}
`, "",{"version":3,"sources":["webpack://./style/components.css"],"names":[],"mappings":"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","sourcesContent":["/*\n * Copyright (c) 2023-2025 Datalayer, Inc.\n * Distributed under the terms of the Modified BSD License.\n */\n\n/* MCP Tools Panel Styles */\n\n.jp-MCPToolsWidget {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n  min-height: 0;\n  position: relative;\n}\n\n/* Ensure the widget container fills parent */\n.jp-MCPToolsWidget > div {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n}\n\n.mcp-tools-panel {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color1);\n  font-family: var(--jp-ui-font-family);\n  font-size: var(--jp-ui-font-size1);\n}\n\n/* Panel Header */\n.mcp-panel-header {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 10px 16px;\n  border-bottom: 1px solid var(--jp-border-color2);\n  background: var(--jp-layout-color2);\n  flex-shrink: 0;\n}\n\n.mcp-panel-stats {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 12px;\n  color: var(--jp-ui-font-color1);\n}\n\n.mcp-panel-stats strong {\n  font-weight: 600;\n  color: var(--jp-ui-font-color0);\n}\n\n.mcp-stats-separator {\n  color: var(--jp-border-color2);\n  font-weight: normal;\n}\n\n/* Tabs */\n.mcp-panel-tabs {\n  display: flex;\n  gap: 4px;\n  padding: 8px 12px 0;\n  border-bottom: 2px solid var(--jp-border-color2);\n  background: var(--jp-layout-color1);\n  flex-shrink: 0;\n}\n\n.mcp-tab {\n  flex: 1;\n  padding: 10px 16px;\n  background: var(--jp-layout-color2);\n  border: 1px solid var(--jp-border-color2);\n  border-bottom: none;\n  border-radius: 4px 4px 0 0;\n  margin-bottom: -2px;\n  color: var(--jp-ui-font-color2);\n  cursor: pointer;\n  font-size: 13px;\n  font-family: var(--jp-ui-font-family);\n  font-weight: 500;\n  transition: all 0.2s;\n}\n\n.mcp-tab:hover {\n  background: var(--jp-layout-color3);\n  color: var(--jp-ui-font-color0);\n  border-color: var(--jp-border-color1);\n}\n\n.mcp-tab-active {\n  color: var(--jp-brand-color1);\n  font-weight: 600;\n  background: var(--jp-layout-color0);\n  border-color: var(--jp-border-color2);\n  border-bottom-color: var(--jp-layout-color0);\n  box-shadow: 0 -2px 4px rgb(0 0 0 / 10%);\n}\n\n/* Panel content area - fills remaining space */\n.mcp-panel-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden; /* Contains scrollable children */\n  min-height: 0; /* Important for flex children with overflow */\n}\n\n/* Search Box */\n.mcp-search-box {\n  padding: 12px 12px 8px;\n  border-bottom: 1px solid var(--jp-border-color2);\n  background: var(--jp-layout-color1);\n  flex-shrink: 0; /* Don't shrink when space is tight */\n}\n\n.mcp-search-input {\n  width: 100%;\n  padding: 6px 10px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 3px;\n  background: var(--jp-input-background);\n  color: var(--jp-ui-font-color0);\n  font-size: 13px;\n  font-family: var(--jp-ui-font-family);\n}\n\n.mcp-search-input:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1);\n  box-shadow: 0 0 0 1px var(--jp-brand-color1);\n}\n\n/* Filter Toggle */\n.mcp-filter-toggle {\n  margin-top: 8px;\n}\n\n.mcp-toggle-label {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n  font-size: 12px;\n  color: var(--jp-ui-font-color1);\n  user-select: none;\n}\n\n.mcp-toggle-checkbox {\n  cursor: pointer;\n  width: 16px;\n  height: 16px;\n  margin: 0;\n}\n\n.mcp-toggle-text {\n  line-height: 1.4;\n}\n\n/* Tools list - scrollable container */\n.mcp-tools-list {\n  flex: 1 1 0;\n  overflow: hidden auto;\n  padding: 12px;\n  min-height: 0; /* Critical for flex children with overflow */\n}\n\n/* Tool Item */\n.mcp-tool-item {\n  margin-bottom: 10px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 4px;\n  background: var(--jp-layout-color2);\n  transition: all 0.2s;\n  flex-shrink: 0; /* Prevent items from shrinking */\n}\n\n.mcp-tool-item:hover {\n  border-color: var(--jp-brand-color1);\n  box-shadow: 0 2px 4px rgb(0 0 0 / 15%);\n  transform: translateY(-1px);\n}\n\n.mcp-tool-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  padding: 12px 14px;\n  gap: 10px;\n}\n\n.mcp-tool-info {\n  flex: 1;\n  min-width: 0;\n}\n\n.mcp-tool-label {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color0);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  margin-bottom: 4px;\n  line-height: 1.4;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.mcp-tool-param-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2px 6px;\n  background: var(--jp-brand-color1);\n  color: white;\n  font-size: 10px;\n  font-weight: 600;\n  border-radius: 3px;\n  line-height: 1;\n  flex-shrink: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n\n.mcp-tool-id {\n  font-size: 11px;\n  color: var(--jp-ui-font-color2);\n  font-family: var(--jp-code-font-family);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  line-height: 1.3;\n}\n\n.mcp-tool-buttons {\n  display: flex;\n  gap: 6px;\n  flex-shrink: 0;\n}\n\n.mcp-tool-button {\n  padding: 6px 12px;\n  font-size: 11px;\n  font-weight: 500;\n  white-space: nowrap;\n  min-width: 60px;\n  border: 1px solid var(--jp-border-color2);\n  background: var(--jp-layout-color2);\n  color: var(--jp-ui-font-color1);\n  transition: all 0.2s;\n}\n\n.mcp-button-local:hover:not(:disabled) {\n  background: var(--jp-layout-color3);\n  border-color: var(--jp-border-color1);\n  color: var(--jp-ui-font-color0);\n}\n\n.mcp-button-remote:hover:not(:disabled) {\n  background: var(--jp-brand-color1);\n  border-color: var(--jp-brand-color1);\n  color: white;\n}\n\n.mcp-tool-button:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n/* Tool Form */\n.mcp-tool-form {\n  border-top: 1px solid var(--jp-border-color2);\n  padding: 12px;\n  background: var(--jp-layout-color1);\n}\n\n.mcp-form-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 8px;\n}\n\n.mcp-form-title {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1);\n}\n\n.mcp-form-close {\n  background: transparent;\n  border: none;\n  font-size: 20px;\n  line-height: 1;\n  color: var(--jp-ui-font-color2);\n  cursor: pointer;\n  padding: 0;\n  width: 20px;\n  height: 20px;\n}\n\n.mcp-form-close:hover {\n  color: var(--jp-ui-font-color0);\n}\n\n.mcp-form-description {\n  font-size: 11px;\n  color: var(--jp-ui-font-color2);\n  margin-bottom: 8px;\n  line-height: 1.4;\n  font-style: italic;\n}\n\n.mcp-form-required {\n  font-size: 11px;\n  color: var(--jp-warn-color1);\n  margin-bottom: 8px;\n  font-weight: 600;\n}\n\n.mcp-form-input {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 3px;\n  background: var(--jp-input-background);\n  color: var(--jp-ui-font-color0);\n  font-size: 12px;\n  font-family: var(--jp-code-font-family);\n  resize: vertical;\n  margin-bottom: 8px;\n}\n\n.mcp-form-input:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1);\n  box-shadow: 0 0 0 1px var(--jp-brand-color1);\n}\n\n.mcp-form-error {\n  color: var(--jp-error-color1);\n  font-size: 11px;\n  margin-bottom: 8px;\n}\n\n.mcp-form-actions {\n  display: flex;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 6px;\n}\n\n.mcp-form-actions button {\n  font-size: 11px;\n  padding: 5px 12px;\n}\n\n/* Message list - scrollable */\n.mcp-messages-list {\n  flex: 1 1 auto;\n  overflow: hidden auto;\n  padding: 12px;\n  min-height: 0; /* Critical for flex children with overflow */\n  height: 100%; /* Ensure it takes available height */\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n/* Message Item */\n.mcp-message-item {\n  margin-bottom: 0;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 4px;\n  background: var(--jp-layout-color2);\n  overflow: hidden;\n}\n\n.mcp-message-sent {\n  border-left: 3px solid var(--jp-success-color1);\n}\n\n.mcp-message-received {\n  border-left: 3px solid var(--jp-info-color1);\n}\n\n.mcp-message-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px 14px;\n  cursor: pointer;\n  user-select: none;\n  transition: background 0.2s;\n}\n\n.mcp-message-header:hover {\n  background: var(--jp-layout-color1);\n}\n\n.mcp-message-info {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex: 1;\n  min-width: 0;\n}\n\n.mcp-message-direction {\n  font-size: 14px;\n  font-weight: 600;\n  width: 22px;\n  text-align: center;\n}\n\n.mcp-sent {\n  color: var(--jp-success-color1);\n}\n\n.mcp-received {\n  color: var(--jp-info-color1);\n}\n\n.mcp-message-type {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color0);\n  font-family: var(--jp-code-font-family);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.mcp-message-time {\n  font-size: 11px;\n  color: var(--jp-ui-font-color2);\n  white-space: nowrap;\n  line-height: 1.3;\n}\n\n.mcp-message-expand {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2);\n  margin-left: 8px;\n}\n\n.mcp-message-body {\n  border-top: 1px solid var(--jp-border-color2);\n  padding: 12px;\n  background: var(--jp-layout-color1);\n  max-height: 300px;\n  overflow: auto;\n}\n\n.mcp-message-body pre {\n  margin: 0;\n  font-size: 11px;\n  font-family: var(--jp-code-font-family);\n  color: var(--jp-ui-font-color1);\n  white-space: pre-wrap;\n  overflow-wrap: break-word;\n}\n\n/* Empty State */\n.mcp-empty-state {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 40px 20px;\n  color: var(--jp-ui-font-color2);\n  font-size: 13px;\n  text-align: center;\n}\n\n/* Scrollbar Styles */\n.mcp-tools-list::-webkit-scrollbar,\n.mcp-messages-list::-webkit-scrollbar,\n.mcp-message-body::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n\n.mcp-tools-list::-webkit-scrollbar-track,\n.mcp-messages-list::-webkit-scrollbar-track,\n.mcp-message-body::-webkit-scrollbar-track {\n  background: var(--jp-layout-color1);\n}\n\n.mcp-tools-list::-webkit-scrollbar-thumb,\n.mcp-messages-list::-webkit-scrollbar-thumb,\n.mcp-message-body::-webkit-scrollbar-thumb {\n  background: var(--jp-border-color2);\n  border-radius: 4px;\n}\n\n.mcp-tools-list::-webkit-scrollbar-thumb:hover,\n.mcp-messages-list::-webkit-scrollbar-thumb:hover,\n.mcp-message-body::-webkit-scrollbar-thumb:hover {\n  background: var(--jp-border-color1);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./style/base.css"
/*!************************!*\
  !*** ./style/base.css ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./base.css */ "./node_modules/css-loader/dist/cjs.js!./style/base.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ },

/***/ "./style/components.css"
/*!******************************!*\
  !*** ./style/components.css ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_components_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./components.css */ "./node_modules/css-loader/dist/cjs.js!./style/components.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_components_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_components_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_components_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_components_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }

}]);
//# sourceMappingURL=style_index_js.f97468c43525a3a1c738.js.map