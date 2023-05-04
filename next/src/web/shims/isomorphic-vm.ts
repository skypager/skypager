const globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
  'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
  'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
  'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
  'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

class Context { 
  [key: string]: any;
}

function createContext(context?: any): Context {
  var copy = new Context();

  if (typeof context === 'object') {
    Object.keys(context).forEach(key => copy[key] = context[key]);
  }

  return copy;
};

function isContext(context: any): context is Context {
  return context instanceof Context;
}

function runInContext(code: string, context: Context): any {
  const iframe = document.createElement('iframe');

  if (!iframe.style) {
    (iframe as any).style = {};
  }

  iframe.style.display = 'none';

  document.body.appendChild(iframe);

  const iframeWindow: any = iframe.contentWindow;
  let iframeEval = iframeWindow.eval;

  if (!iframeEval && iframeWindow.execScript) {
    iframeWindow.execScript.call(iframeWindow, 'null');
    iframeEval = iframeWindow.eval;
  }

  Object.keys(context).forEach(key => {
    iframeWindow[key] = context[key];
  });

  Object.keys(globals).forEach(key => {
    if (context[key]) {
      iframeWindow[key] = context[key];
    }
  });

  const result = iframeEval.call(iframeWindow, code);

  Object.keys(iframeWindow).forEach(key => {
    if (key in context || Object.keys(iframeWindow).indexOf(key) === -1) {
      context[key] = iframeWindow[key];
    }
  });

  globals.forEach(key => {
    if (!(key in context)) {
      Object.defineProperty(context, key, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: iframeWindow[key],
      });
    }
  });

  document.body.removeChild(iframe);

  return result;
};

function runInDebugContext(code: string): any {
  return runInNewContext(code);
};

function runInNewContext(code: string, context?: any): any {
  const contextInstance = createContext(context);
  const result = runInContext(code, contextInstance);

  if (typeof context === 'object') {
    Object.keys(contextInstance).forEach(key => {
      context[key] = contextInstance[key];
    });
  }

  return result;
};

function runInThisContext(code: string): any {
  return (0, eval)(code);
};

class Script {
  private code: string;
  constructor(code: string) {
    this.code = code;
  }

  runInContext(context: Context) {
    return runInContext(this.code, context);
  }

  runInNewContext(context?: any) {
    return runInNewContext(this.code, context);
  }

  runInThisContext() {
    return runInThisContext(this.code);
  }
}

export interface VMContext {
  [name: string]: any;
}

export interface VMScript {
  new (code: string) : VMScript;
  runInContext(context: VMContext) : any;
  runInNewContext(context?: any) : any;
  runInThisContext() : any;
}

export interface VM {
  Script: VMScript;
  createContext(context?: any): VMContext;
  isContext(context: any): context is VMContext;
  runInContext(code: string, context: VMContext): any;
  runInDebugContext(code: string): any;
  runInNewContext(code: string, context?: any): any;
  runInThisContext(code: string): any;
}

export const shim: VM = <any>{
  Script,
  createContext,
  isContext,
  runInContext,
  runInDebugContext,
  runInNewContext,
  runInThisContext,
};

export default shim as VM 