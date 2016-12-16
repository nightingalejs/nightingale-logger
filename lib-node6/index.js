'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _nightingaleLevels = require('nightingale-levels');

var _nightingaleLevels2 = _interopRequireDefault(_nightingaleLevels);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER = function () {
    return { handlers: [], processors: [] };
  };
}

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD = (key, level) => {
    const { handlers, processors } = global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER(key);

    return {
      handlers: handlers.filter(handler => level >= handler.minLevel && (!handler.isHandling || handler.isHandling(level, key))),
      processors: processors
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
    this.key = key;
    this.displayName = displayName;

    if (key.includes('.')) {
      this.warn('nightingale: `.` in key is deprecated, replace with `:`', { key, displayName });
      this.key = key.replace(/\./g, ':');
    }
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
   */
  child(childSuffixKey, childDisplayName) {
    return new Logger(`${ this.key }:${ childSuffixKey }`, childDisplayName);
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
   */
  context(context) {
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
    this._context = context;
  }

  /**
   * Extends existing context of this logger
   */
  extendsContext(extendedContext) {
    Object.assign(this._context, extendedContext);
  }

  /**
   * Handle a record
   *
   * Use this only if you know what you are doing.
   */
  addRecord(record) {
    let { handlers, processors } = this.getHandlersAndProcessors(record.level);

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
   */
  log(message, metadata, level = _nightingaleLevels2.default.INFO, options = undefined) {
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
  }

  /**
   * Log a trace message
   */
  trace(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
  }

  /**
   * Log a debug message
   */
  debug(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles });
  }

  /**
   * Notice an info message
   */
  notice(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.NOTICE, { metadataStyles });
  }

  /**
   * Log an info message
   */
  info(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.INFO, { metadataStyles });
  }

  /**
   * Log a warn message
   */
  warn(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.WARN, { metadataStyles });
  }

  /**
   * Log an error message
   */
  error(message, metadata = {}, metadataStyles) {
    if (message instanceof Error) {
      metadata.error = message;
      message = `${ metadata.error.name }: ${ metadata.error.message }`;
    }
    this.log(message, metadata, _nightingaleLevels2.default.ERROR, { metadataStyles });
  }

  /**
   * Log an critical message
   */
  critical(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.CRITICAL, { metadataStyles });
  }

  /**
   * Log a fatal message
   */
  fatal(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.FATAL, { metadataStyles });
  }

  /**
   * Log an alert message
   */
  alert(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.ALERT, { metadataStyles });
  }

  /**
   * Log an inspected value
   */
  inspectValue(value, metadata, metadataStyles) {
    // Note: inspect is a special function for node:
    // https://github.com/nodejs/node/blob/a1bda1b4deb08dfb3e06cb778f0db40023b18318/lib/util.js#L210
    value = _util2.default.inspect(value, { depth: 6 });
    this.log(value, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles, styles: ['gray'] });
  }

  /**
   * Log a debugged var
   */
  inspectVar(varName, varValue, metadata, metadataStyles) {
    varValue = _util2.default.inspect(varValue, { depth: 6 });
    this.log(`${ varName } = ${ varValue }`, metadata, _nightingaleLevels2.default.DEBUG, { metadataStyles, styles: ['cyan'] });
  }

  /**
   * Alias for infoSuccess
   */
  success(message, metadata, metadataStyles) {
    this.infoSuccess(message, metadata, metadataStyles);
  }

  /**
   * Log an info success message
   */
  infoSuccess(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.INFO, {
      metadataStyles,
      symbol: '✔',
      styles: ['green', 'bold']
    });
  }

  /**
   * Log an debug success message
   */
  debugSuccess(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.DEBUG, {
      metadataStyles,
      symbol: '✔',
      styles: ['green']
    });
  }

  /**
   * Alias for infoFail
   */
  fail(message, metadata, metadataStyles) {
    this.infoFail(message, metadata, metadataStyles);
  }

  /**
   * Log an info fail message
   */
  infoFail(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.INFO, {
      metadataStyles,
      symbol: '✖',
      styles: ['red', 'bold']
    });
  }

  /**
   * Log an debug fail message
   */
  debugFail(message, metadata, metadataStyles) {
    this.log(message, metadata, _nightingaleLevels2.default.DEBUG, {
      metadataStyles,
      symbol: '✖',
      styles: ['red']
    });
  }

  /**
   * @returns {number} time to pass to timeEnd
   */
  time(message, metadata, metadataStyles, level = _nightingaleLevels2.default.DEBUG) {
    if (message) {
      this.log(message, metadata, level, { metadataStyles });
    }

    return Date.now();
  }

  infoTime(message, metadata, metadataStyles) {
    return this.time(message, metadata, metadataStyles, _nightingaleLevels2.default.INFO);
  }

  /**
   * Finds difference between when this method
   * was called and when the respective time method
   * was called, then logs out the difference
   * and deletes the original record
   */
  timeEnd(startTime, message, metadata = {}, metadataStyles, level = _nightingaleLevels2.default.DEBUG, options) {
    const now = Date.now();

    const diffTime = now - startTime;

    if (diffTime < 1000) {
      metadata.readableTime = `${ diffTime }ms`;
    } else {
      const seconds = diffTime > 1000 && Math.floor(diffTime / 1000);

      metadata.readableTime = `${ seconds ? `${ seconds }s and ` : '' }${ diffTime - seconds * 1000 }ms`;
    }

    metadata.timeMs = diffTime;
    this.log(message, metadata, level, _extends({}, options, { metadataStyles }));
  }

  /**
   * Like timeEnd, but with INFO level
   */
  infoTimeEnd(time, message, metadata, metadataStyles) {
    this.timeEnd(time, message, metadata, metadataStyles, _nightingaleLevels2.default.INFO);
  }

  /**
   * Like timeEnd, but with INFO level
   */
  infoSuccessTimeEnd(time, message, metadata, metadataStyles) {
    this.timeEnd(time, message, metadata, metadataStyles, _nightingaleLevels2.default.INFO, {
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
   */
  enter(fn, metadata, metadataStyles) {
    metadata = _extends({
      functionName: fn.name
    }, metadata);
    this.log('enter', metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
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
   */
  exit(fn, metadata, metadataStyles) {
    metadata = _extends({
      functionName: fn.name
    }, metadata);
    this.log('exit', metadata, _nightingaleLevels2.default.TRACE, { metadataStyles });
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
//# sourceMappingURL=index.js.map