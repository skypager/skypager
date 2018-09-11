var vm = require('vm-browserify');
var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
    'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
    'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
    'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
    'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];
var Context = (function () {
    function Context() {
    }
    return Context;
})();
function createContext(context) {
    var copy = new Context();
    if (typeof context === 'object') {
        Object.keys(context).forEach(function (key) { return copy[key] = context[key]; });
    }
    return copy;
}
;
function isContext(context) {
    return context instanceof Context;
}
function runInContext(code, context) {
    var iframe = document.createElement('iframe');
    if (!iframe.style) {
        iframe.style = {};
    }
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    var iframeWindow = iframe.contentWindow;
    var iframeEval = iframeWindow.eval;
    if (!iframeEval && iframeWindow.execScript) {
        iframeWindow.execScript.call(iframeWindow, 'null');
        iframeEval = iframeWindow.eval;
    }
    Object.keys(context).forEach(function (key) {
        iframeWindow[key] = context[key];
    });
    Object.keys(globals).forEach(function (key) {
        if (context[key]) {
            iframeWindow[key] = context[key];
        }
    });
    var result = iframeEval.call(iframeWindow, code);
    Object.keys(iframeWindow).forEach(function (key) {
        if (key in context || Object.keys(iframeWindow).indexOf(key) === -1) {
            context[key] = iframeWindow[key];
        }
    });
    globals.forEach(function (key) {
        if (!(key in context)) {
            Object.defineProperty(context, key, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: iframeWindow[key]
            });
        }
    });
    document.body.removeChild(iframe);
    return result;
}
;
function runInDebugContext(code) {
    return runInNewContext(code);
}
;
function runInNewContext(code, context) {
    var contextInstance = createContext(context);
    var result = runInContext(code, contextInstance);
    if (typeof context === 'object') {
        Object.keys(contextInstance).forEach(function (key) {
            context[key] = contextInstance[key];
        });
    }
    return result;
}
;
function runInThisContext(code) {
    return eval(code);
}
;
var Script = (function () {
    function Script(code) {
        this.code = code;
    }
    Script.prototype.runInContext = function (context) {
        return runInContext(this.code, context);
    };
    Script.prototype.runInNewContext = function (context) {
        return runInNewContext(this.code, context);
    };
    Script.prototype.runInThisContext = function () {
        return runInThisContext(this.code);
    };
    return Script;
})();
exports.shim = {
    Script: Script,
    createContext: createContext,
    isContext: isContext,
    runInContext: runInContext,
    runInDebugContext: runInDebugContext,
    runInNewContext: runInNewContext,
    runInThisContext: runInThisContext
};
exports.__esModule = true;
exports["default"] = (vm ? vm : exports.shim);
