(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SkypagerSheetsServer"] = factory();
	else
		root["SkypagerSheetsServer"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var _global = global,
    React = _global.React,
    skypager = _global.skypager,
    semanticUIReact = _global.semanticUIReact,
    ReactDOM = _global.ReactDOM,
    ReactRouterDOM = _global.ReactRouterDOM;
var Header = semanticUIReact.Header,
    Loader = semanticUIReact.Loader,
    Container = semanticUIReact.Container,
    Segment = semanticUIReact.Segment,
    Table = semanticUIReact.Table;
var render = ReactDOM.render;
var Component = React.Component;
skypager.clients.register('app', function () {
  return __webpack_require__(3);
});
var client = global.sheetsClient = skypager.client('app');

var ListSheets =
/*#__PURE__*/
function (_Component) {
  _inherits(ListSheets, _Component);

  function ListSheets() {
    _classCallCheck(this, ListSheets);

    return _possibleConstructorReturn(this, _getPrototypeOf(ListSheets).apply(this, arguments));
  }

  _createClass(ListSheets, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          _onClick = _this$props.onClick,
          _this$props$sheets = _this$props.sheets,
          sheets = _this$props$sheets === void 0 ? {} : _this$props$sheets;
      var records = Object.keys(sheets).map(function (id) {
        return Object.assign({}, sheets[id], {
          id: id
        });
      });
      return React.createElement(Container, null, records.map(function (record, idx) {
        return React.createElement(Segment, {
          key: record.id + idx,
          onClick: function onClick() {
            return _onClick(record.id, record);
          },
          raised: true
        }, React.createElement(Header, {
          content: record.id
        }));
      }));
    }
  }]);

  return ListSheets;
}(Component);

var ShowSheet =
/*#__PURE__*/
function (_Component2) {
  _inherits(ShowSheet, _Component2);

  function ShowSheet() {
    _classCallCheck(this, ShowSheet);

    return _possibleConstructorReturn(this, _getPrototypeOf(ShowSheet).apply(this, arguments));
  }

  _createClass(ShowSheet, [{
    key: "render",
    value: function render() {
      var entries = runtime.lodash.entries;
      var _this$props2 = this.props,
          _this$props2$data = _this$props2.data,
          data = _this$props2$data === void 0 ? {} : _this$props2$data,
          sheetId = _this$props2.sheetId;
      return entries(data).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            worksheetId = _ref2[0],
            rows = _ref2[1];

        return React.createElement(Table, {
          key: worksheetId
        }, rows[0] && React.createElement(Table.Header, null, Object.keys(rows[0]).map(function (val, k) {
          return React.createElement(Table.HeaderCell, {
            key: "th-".concat(k)
          }, val);
        })), React.createElement(Table.Body, null, rows.map(function (row, index) {
          return React.createElement(Table.Row, {
            key: "row-".concat(index)
          }, Object.values(row).map(function (val, k) {
            return React.createElement(Table.Cell, {
              key: "row-".concat(k)
            }, val);
          }));
        })));
      });
    }
  }]);

  return ShowSheet;
}(Component);

var App =
/*#__PURE__*/
function (_Component3) {
  _inherits(App, _Component3);

  function App() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, App);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(App)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      loading: true
    });

    return _this;
  }

  _createClass(App, [{
    key: "componentDidMount",
    value: function () {
      var _componentDidMount = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var sheets;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return client.listSheets();

              case 2:
                sheets = _context.sent;
                this.setState({
                  sheets: sheets,
                  loading: false
                });

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function componentDidMount() {
        return _componentDidMount.apply(this, arguments);
      };
    }()
  }, {
    key: "selectSheet",
    value: function selectSheet(sheetId) {
      var _this2 = this;

      this.setState({
        sheetId: sheetId,
        loading: true
      });
      return client.showFullSheet(sheetId).then(function (data) {
        return _this2.setState({
          loading: false,
          data: data
        });
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this$state = this.state,
          loading = _this$state.loading,
          sheets = _this$state.sheets,
          sheetId = _this$state.sheetId,
          data = _this$state.data;
      return React.createElement(Container, null, loading && React.createElement(Loader, {
        active: true
      }), !loading && !sheetId && sheets && React.createElement(ListSheets, {
        onClick: this.selectSheet.bind(this),
        sheets: sheets
      }), !loading && sheetId && data && React.createElement(ShowSheet, {
        data: data,
        sheetId: sheetId
      }));
    }
  }]);

  return App;
}(Component);

render(React.createElement(App, null), document.getElementById('root'));
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 2 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "interfaceMethods", function() { return interfaceMethods; });
/* harmony export (immutable) */ __webpack_exports__["listSheets"] = listSheets;
/* harmony export (immutable) */ __webpack_exports__["showFullSheet"] = showFullSheet;
/* harmony export (immutable) */ __webpack_exports__["showWorksheet"] = showWorksheet;
var interfaceMethods = ['listSheets', 'showFullSheet', 'showWorksheet'];
function listSheets() {
  var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return this.client.get("/sheets", {
    query: query
  }).then(function (r) {
    return r.data;
  });
}
function showFullSheet(sheetKey) {
  var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return this.client.get("/sheets/".concat(sheetKey), {
    query: query
  }).then(function (r) {
    return r.data;
  });
}
function showWorksheet(sheetKey, worksheetKey) {
  var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return this.client.get("/sheets/".concat(sheetKey, "/worksheetKey"), {
    query: query
  }).then(function (r) {
    return r.data;
  });
}

/***/ })
/******/ ]);
});
//# sourceMappingURL=app.js.map