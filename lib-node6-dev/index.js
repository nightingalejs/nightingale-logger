'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _tcombForked = require('tcomb-forked');

var _tcombForked2 = _interopRequireDefault(_tcombForked);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _nightingaleLevels = require('nightingale-levels');

var _nightingaleLevels2 = _interopRequireDefault(_nightingaleLevels);

var _nightingaleDebug = require('nightingale-debug');

var _nightingaleDebug2 = _interopRequireDefault(_nightingaleDebug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER = function () {
    return { handlers: [], processors: [] };
  };
}

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD = function (key, level) {
    var _global$__NIGHTINGALE = global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER(key);

    const handlers = _global$__NIGHTINGALE.handlers;
    const processors = _global$__NIGHTINGALE.processors;


    return {
      handlers: handlers.filter(handler => level >= (0, _nightingaleDebug2.default)(handler.minLevel, key) && (!handler.isHandling || handler.isHandling(level, key))),
      processors
    };
  };
}

/** @private */
function getConfigForLoggerRecord(key, recordLevel) {
  return global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD(key, recordLevel);
}

/**
 * Interface that allows you to log records.
 * This records are treated by handlers
 */
class Logger {

  /**
   * Create a new Logger
   *
   * @param {string} key
   * @param {string} [displayName]
   */
  constructor(key, displayName) {
    _assert(key, _tcombForked2.default.String, 'key');

    _assert(displayName, _tcombForked2.default.maybe(_tcombForked2.default.String), 'displayName');

    this.key = key;
    this.displayName = displayName;
  }

  /** @private */
  getHandlersAndProcessors(recordLevel) {
    return getConfigForLoggerRecord(this.key, recordLevel);
  }

  /** @private */
  getConfig() {
    return global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER(this.key);
  }

  /**
   * Create a child logger
   *
   * @param {string} childSuffixKey
   * @param {string} [childDisplayName]
   * @returns {Logger}
   */
  child(childSuffixKey, childDisplayName) {
    _assert(childSuffixKey, _tcombForked2.default.String, 'childSuffixKey');

    _assert(childDisplayName, _tcombForked2.default.maybe(_tcombForked2.default.String), 'childDisplayName');

    return new Logger(`${ this.key }.${ childSuffixKey }`, childDisplayName);
  }

  /**
   * Create a new Logger with the same key a this attached context
   *
   * @example
   * const loggerMyService = new Logger('app.myService');
   * function someAction(arg1) {
     *     const logger = loggerMyService.context({ arg1 });
     *     logger.info('starting');
     *     // do stuff
     *     logger.info('done');
     * }
   *
   * @param {Object} context
   * @returns {Logger}
   */
  context(context) {
    _assert(context, _tcombForked2.default.Object, 'context');

    const logger = new Logger(this.key);
    logger.setContext(context);
    return logger;
  }

  /**
   * Set the context of this logger
   *
   * @param {Object} context
   */
  setContext(context) {
    _assert(context, _tcombForked2.default.Object, 'context');

    this._context = context;
  }

  /**
   * Extends existing context of this logger
   *
   * @param {Object} extendedContext
   */
  extendsContext(extendedContext) {
    _assert(extendedContext, _tcombForked2.default.Object, 'extendedContext');

    Object.assign(this._context, extendedContext);
  }

  /**
   * Handle a record
   *
   * Use this only if you know what you are doing.
   *
   * @param {Object} record
   */
  addRecord(record) {
    _assert(record, _tcombForked2.default.Object, 'record');

    var _getHandlersAndProces = this.getHandlersAndProcessors(record.level);

    let handlers = _getHandlersAndProces.handlers;
    let processors = _getHandlersAndProces.processors;


    if (handlers.length === 0) {
      if (record.level > _nightingaleLevels2.default.ERROR) {
        // eslint-disable-next-line no-console
        console.log('[nightingale] no logger for > error level.', {
          key: record.key,
          message: record.message
        });
      }
      return;
    }

    if (processors) {
      processors.forEach(process => process(record, record.context));
    }

    handlers.some(handler => handler.handle(record) === false);
  }

  /**
   * Log a message
   *
   * @param {string} message
   * @param {Object} metadata
   * @param {int} [level]
   * @param {Object} [options]
   * @return {Logger}
   */
  log(message, metadata) {
    let level = _assert(arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _nightingaleLevels2.default.INFO, _tcombForked2.default.Number, 'level');

    let options = _assert(arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'options');

    _assert(message, _tcombForked2.default.String, 'message');

    _assert(metadata, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadata');

    _assert(level, _tcombForked2.default.Number, 'level');

    _assert(options, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'options');

    let context = metadata && metadata.context;
    if (metadata) {
      delete metadata.context;
    }

    let record = {
      level: level,
      key: this.key,
      displayName: this.displayName,
      datetime: new Date(),
      message: message,
      context: context || this._context,
      metadata: metadata,
      extra: {}
    };

    if (options) {
      record = Object.assign(options, record);
    }

    this.addRecord(record);
    return this;
  }

  /**
   * Log a trace message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  trace(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
  }

  /**
   * Log a debug message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  debug(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles });
  }

  /**
   * Log an info message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  info(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.INFO, { metadataStyles });
  }

  /**
   * Log a warn message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  warn(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.WARN, { metadataStyles });
  }

  /**
   * Log an error message
   *
   * @param {string|Error} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  error(message) {
    let metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let metadataStyles = arguments[2];

    if (message instanceof Error) {
      metadata.error = message;
      message = `${ metadata.error.name }: ${ metadata.error.message }`;
    }
    return this.log(message, metadata, _nightingaleLevels2.default.ERROR, { metadataStyles });
  }

  /**
   * Log an alert message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  alert(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.ALERT, { metadataStyles });
  }

  /**
   * Log a fatal message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  fatal(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.FATAL, { metadataStyles });
  }

  /**
   * Log an inspected value
   *
   * @param {*} value
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  inspectValue(value, metadata, metadataStyles) {
    // Note: inspect is a special function for node:
    // https://github.com/nodejs/node/blob/a1bda1b4deb08dfb3e06cb778f0db40023b18318/lib/util.js#L210
    value = _util2.default.inspect(value, { depth: 6 });
    return this.log(value, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles, styles: ['gray'] });
  }

  /**
   * Log a debugged var
   *
   * @param {string} varName
   * @param {*} varValue
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  inspectVar(varName, varValue, metadata, metadataStyles) {
    varValue = _util2.default.inspect(varValue, { depth: 6 });
    return this.log(`${ varName } = ${ varValue }`, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles, styles: ['cyan'] });
  }

  /**
   * Alias for infoSuccess
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  success(message, metadata, metadataStyles) {
    return this.infoSuccess(message, metadata, metadataStyles);
  }

  /**
   * Log an info success message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  infoSuccess(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.INFO, {
      metadataStyles,
      symbol: '✔',
      styles: ['green', 'bold']
    });
  }

  /**
   * Log an debug success message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  debugSuccess(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.DEBUG, {
      metadataStyles,
      symbol: '✔',
      styles: ['green']
    });
  }

  /**
   * Alias for infoFail
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  fail(message, metadata, metadataStyles) {
    return this.infoFail(message, metadata, metadataStyles);
  }

  /**
   * Log an info fail message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  infoFail(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.INFO, {
      metadataStyles,
      symbol: '✖',
      styles: ['red', 'bold']
    });
  }

  /**
   * Log an debug fail message
   *
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  debugFail(message, metadata, metadataStyles) {
    return this.log(message, metadata, _nightingaleLevels2.default.DEBUG, {
      metadataStyles,
      symbol: '✖',
      styles: ['red']
    });
  }

  /**
   * @param {string} [message]
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @param {number} [level = levels.DEBUG]
   * @returns {*} time to pass to timeEnd
   */
  time(message, metadata, metadataStyles) {
    let level = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _nightingaleLevels2.default.DEBUG;

    if (message) {
      this.log(message, metadata, level, { metadataStyles });
    }

    return Date.now();
  }

  infoTime(message, metadata, metadataStyles) {
    _assert(message, _tcombForked2.default.String, 'message');

    _assert(metadata, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadata');

    _assert(metadataStyles, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadataStyles');

    return this.time(message, metadata, metadataStyles, _nightingaleLevels2.default.INFO);
  }

  /**
   * Finds difference between when this method
   * was called and when the respective time method
   * was called, then logs out the difference
   * and deletes the original record
   *
   * @param {number=} time return of previous call to time()
   * @param {string} message
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @param {number} [level = levels.DEBUG]
   */
  timeEnd(time, message) {
    let metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let metadataStyles = arguments[3];
    let level = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _nightingaleLevels2.default.DEBUG;
    let options = arguments[5];

    const now = Date.now();

    const diffTime = now - time;

    if (diffTime < 1000) {
      metadata.readableTime = `${ diffTime }ms`;
    } else {
      const seconds = diffTime > 1000 && Math.floor(diffTime / 1000);
      const ms = diffTime - seconds * 1000;
      metadata.readableTime = `${ seconds ? `${ seconds }s and ` : '' }${ ms }ms`;
    }

    metadata.timeMs = diffTime;
    this.log(message, metadata, level, _extends({}, options, { metadataStyles }));
  }

  /**
   * Like timeEnd, but with INFO level
   */
  infoTimeEnd(time, message, metadata, metadataStyles) {
    _assert(time, _tcombForked2.default.Number, 'time');

    _assert(message, _tcombForked2.default.String, 'message');

    _assert(metadata, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadata');

    _assert(metadataStyles, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadataStyles');

    return this.timeEnd(time, message, metadata, metadataStyles, _nightingaleLevels2.default.INFO);
  }

  /**
   * Like timeEnd, but with INFO level
   */
  infoSuccessTimeEnd(time, message, metadata, metadataStyles) {
    _assert(time, _tcombForked2.default.Number, 'time');

    _assert(message, _tcombForked2.default.String, 'message');

    _assert(metadata, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadata');

    _assert(metadataStyles, _tcombForked2.default.maybe(_tcombForked2.default.Object), 'metadataStyles');

    return this.timeEnd(time, message, metadata, metadataStyles, _nightingaleLevels2.default.INFO, {
      symbol: '✔',
      styles: ['green', 'bold']
    });
  }

  /**
   * Log an enter in a function
   *
   * @example
   * class A {
     *   method(arg1) {
     *     logger.enter(method, { arg1 });
     *     // Do your stuff
     *   }
     * }
   *
   * @param {Function} fn
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  enter(fn) {
    let metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let metadataStyles = arguments[2];

    metadata = _extends({
      functionName: fn.name
    }, metadata);
    return this.log('enter', metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
  }

  /**
   * Log an exit in a function
   *
   * @example
   * const logger = new ConsoleLogger('myNamespace.A');
   * class A {
     *   method(arg1) {
     *     // Do your stuff
     *     logger.exit(method, { arg1 });
     *   }
     * }
   *
   *
   * @param {Function} fn
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @return {Logger}
   */
  exit(fn, metadata, metadataStyles) {
    metadata = _extends({
      functionName: fn.name
    }, metadata);
    return this.log('exit', metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
  }

  /**
   * Wrap around a function to log enter and exit of a function
   *
   * @example
   * const logger = new ConsoleLogger('myNamespace.A');
   * class A {
     *   method() {
     *     logger.wrap(method, () => {
     *       // Do your stuff
     *     });
     *   }
     * }
   *
   * @param {Function} fn
   * @param {Object} [metadata]
   * @param {Object} [metadataStyles]
   * @param {Function} callback
   */
  wrap(fn, metadata, metadataStyles, callback) {
    if (typeof metadata === 'function') {
      callback = metadata;
      metadata = undefined;
    } else if (typeof metadataStyles === 'function') {
      callback = metadataStyles;
      metadataStyles = undefined;
    }

    this.enter(fn, metadata, metadataStyles);
    callback();
    this.exit(fn);
  }
}
exports.default = Logger;

function _assert(x, type, name) {
  function message() {
    return 'Invalid value ' + _tcombForked2.default.stringify(x) + ' supplied to ' + name + ' (expected a ' + _tcombForked2.default.getTypeName(type) + ')';
  }

  if (_tcombForked2.default.isType(type)) {
    if (!type.is(x)) {
      type(x, [name + ': ' + _tcombForked2.default.getTypeName(type)]);

      _tcombForked2.default.fail(message());
    }
  } else if (!(x instanceof type)) {
    _tcombForked2.default.fail(message());
  }

  return x;
}
//# sourceMappingURL=index.js.map