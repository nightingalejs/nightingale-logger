'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var util = _interopDefault(require('util'));
var levels = _interopDefault(require('nightingale-levels'));

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/* eslint-disable max-lines, flowtype/sort-keys */

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER = function () {
    return { handlers: [], processors: [] };
  };
}

if (!global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD) {
  global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER_RECORD = function (key, level) {
    var _global$__NIGHTINGALE = global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER(key),
        handlers = _global$__NIGHTINGALE.handlers,
        processors = _global$__NIGHTINGALE.processors;

    return {
      handlers: handlers.filter(function (handler) {
        return level >= handler.minLevel && (!handler.isHandling || handler.isHandling(level, key));
      }),
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

var Logger = function () {

  /**
   * Create a new Logger
   *
   * @param {string} key
   * @param {string} [displayName]
   */
  function Logger(key, displayName) {
    classCallCheck(this, Logger);

    this.key = key;
    this.displayName = displayName;

    if (key.includes('.')) {
      this.warn('nightingale: `.` in key is deprecated, replace with `:`', { key, displayName });
      this.key = key.replace(/\./g, ':');
    }
  }

  /** @private */


  createClass(Logger, [{
    key: 'getHandlersAndProcessors',
    value: function getHandlersAndProcessors(recordLevel) {
      return getConfigForLoggerRecord(this.key, recordLevel);
    }

    /** @private */

  }, {
    key: 'getConfig',
    value: function getConfig() {
      return global.__NIGHTINGALE_GET_CONFIG_FOR_LOGGER(this.key);
    }

    /**
     * Create a child logger
     */

  }, {
    key: 'child',
    value: function child(childSuffixKey, childDisplayName) {
      return new Logger(`${this.key}:${childSuffixKey}`, childDisplayName);
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

  }, {
    key: 'context',
    value: function (_context) {
      function context() {
        return _context.apply(this, arguments);
      }

      context.toString = function () {
        return _context.toString();
      };

      return context;
    }(function (context) {
      var logger = new Logger(this.key);
      logger.setContext(context);
      return logger;
    })

    /**
     * Set the context of this logger
     *
     * @param {Object} context
     */

  }, {
    key: 'setContext',
    value: function setContext(context) {
      this._context = context;
    }

    /**
     * Extends existing context of this logger
     */

  }, {
    key: 'extendsContext',
    value: function extendsContext(extendedContext) {
      Object.assign(this._context, extendedContext);
    }

    /**
     * Handle a record
     *
     * Use this only if you know what you are doing.
     */

  }, {
    key: 'addRecord',
    value: function addRecord(record) {
      var _getHandlersAndProces = this.getHandlersAndProcessors(record.level),
          handlers = _getHandlersAndProces.handlers,
          processors = _getHandlersAndProces.processors;

      if (handlers.length === 0) {
        if (record.level > levels.ERROR) {
          // eslint-disable-next-line no-console
          console.log('[nightingale] no logger for > error level.', {
            key: record.key,
            message: record.message
          });
        }
        return;
      }

      if (processors) {
        processors.forEach(function (process) {
          return process(record, record.context);
        });
      }

      handlers.some(function (handler) {
        return handler.handle(record) === false;
      });
    }

    /**
     * Log a message
     */

  }, {
    key: 'log',
    value: function log(message, metadata) {
      var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : levels.INFO;
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

      var context = metadata && metadata.context;
      if (metadata) {
        delete metadata.context;
      }

      var record = {
        level,
        key: this.key,
        displayName: this.displayName,
        datetime: new Date(),
        message,
        context: context || this._context,
        metadata,
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

  }, {
    key: 'trace',
    value: function trace(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.TRACE, { metadataStyles });
    }

    /**
     * Log a debug message
     */

  }, {
    key: 'debug',
    value: function debug(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.DEBUG, { metadataStyles });
    }

    /**
     * Notice an info message
     */

  }, {
    key: 'notice',
    value: function notice(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.NOTICE, { metadataStyles });
    }

    /**
     * Log an info message
     */

  }, {
    key: 'info',
    value: function info(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.INFO, { metadataStyles });
    }

    /**
     * Log a warn message
     */

  }, {
    key: 'warn',
    value: function warn(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.WARN, { metadataStyles });
    }

    /**
     * Log an error message
     */

  }, {
    key: 'error',
    value: function error(message) {
      var metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var metadataStyles = arguments[2];

      if (message instanceof Error) {
        metadata.error = message;
        message = `${metadata.error.name}: ${metadata.error.message}`;
      }
      this.log(message, metadata, levels.ERROR, { metadataStyles });
    }

    /**
     * Log an critical message
     */

  }, {
    key: 'critical',
    value: function critical(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.CRITICAL, { metadataStyles });
    }

    /**
     * Log a fatal message
     */

  }, {
    key: 'fatal',
    value: function fatal(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.FATAL, { metadataStyles });
    }

    /**
     * Log an alert message
     */

  }, {
    key: 'alert',
    value: function alert(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.ALERT, { metadataStyles });
    }

    /**
     * Log an inspected value
     */

  }, {
    key: 'inspectValue',
    value: function inspectValue(value, metadata, metadataStyles) {
      // Note: inspect is a special function for node:
      // https://github.com/nodejs/node/blob/a1bda1b4deb08dfb3e06cb778f0db40023b18318/lib/util.js#L210
      value = util.inspect(value, { depth: 6 });
      this.log(value, metadata, levels.DEBUG, { metadataStyles, styles: ['gray'] });
    }

    /**
     * Log a debugged var
     */

  }, {
    key: 'inspectVar',
    value: function inspectVar(varName, varValue, metadata, metadataStyles) {
      varValue = util.inspect(varValue, { depth: 6 });
      this.log(`${varName} = ${varValue}`, metadata, levels.DEBUG, {
        metadataStyles,
        styles: ['cyan']
      });
    }

    /**
     * Alias for infoSuccess
     */

  }, {
    key: 'success',
    value: function success(message, metadata, metadataStyles) {
      this.infoSuccess(message, metadata, metadataStyles);
    }

    /**
     * Log an info success message
     */

  }, {
    key: 'infoSuccess',
    value: function infoSuccess(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.INFO, {
        metadataStyles,
        symbol: '✔',
        styles: ['green', 'bold']
      });
    }

    /**
     * Log an debug success message
     */

  }, {
    key: 'debugSuccess',
    value: function debugSuccess(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.DEBUG, {
        metadataStyles,
        symbol: '✔',
        styles: ['green']
      });
    }

    /**
     * Alias for infoFail
     */

  }, {
    key: 'fail',
    value: function fail(message, metadata, metadataStyles) {
      this.infoFail(message, metadata, metadataStyles);
    }

    /**
     * Log an info fail message
     */

  }, {
    key: 'infoFail',
    value: function infoFail(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.INFO, {
        metadataStyles,
        symbol: '✖',
        styles: ['red', 'bold']
      });
    }

    /**
     * Log an debug fail message
     */

  }, {
    key: 'debugFail',
    value: function debugFail(message, metadata, metadataStyles) {
      this.log(message, metadata, levels.DEBUG, {
        metadataStyles,
        symbol: '✖',
        styles: ['red']
      });
    }

    /**
     * @returns {number} time to pass to timeEnd
     */

  }, {
    key: 'time',
    value: function time(message, metadata, metadataStyles) {
      var level = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : levels.DEBUG;

      if (message) {
        this.log(message, metadata, level, { metadataStyles });
      }

      return Date.now();
    }
  }, {
    key: 'infoTime',
    value: function infoTime(message, metadata, metadataStyles) {
      return this.time(message, metadata, metadataStyles, levels.INFO);
    }

    /**
     * Finds difference between when this method
     * was called and when the respective time method
     * was called, then logs out the difference
     * and deletes the original record
     */

  }, {
    key: 'timeEnd',
    value: function timeEnd(startTime, message) {
      var metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var metadataStyles = arguments[3];
      var level = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : levels.DEBUG;
      var options = arguments[5];

      var now = Date.now();

      var diffTime = now - startTime;

      if (diffTime < 1000) {
        metadata.readableTime = `${diffTime}ms`;
      } else {
        var seconds = diffTime > 1000 && Math.floor(diffTime / 1000);

        metadata.readableTime = `${seconds ? `${seconds}s and ` : ''}${diffTime - seconds * 1000}ms`;
      }

      metadata.timeMs = diffTime;
      this.log(message, metadata, level, Object.assign({}, options, { metadataStyles }));
    }

    /**
     * Like timeEnd, but with INFO level
     */

  }, {
    key: 'infoTimeEnd',
    value: function infoTimeEnd(time, message, metadata, metadataStyles) {
      this.timeEnd(time, message, metadata, metadataStyles, levels.INFO);
    }

    /**
     * Like timeEnd, but with INFO level
     */

  }, {
    key: 'infoSuccessTimeEnd',
    value: function infoSuccessTimeEnd(time, message, metadata, metadataStyles) {
      this.timeEnd(time, message, metadata, metadataStyles, levels.INFO, {
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

  }, {
    key: 'enter',
    value: function enter(fn, metadata, metadataStyles) {
      metadata = Object.assign({
        functionName: fn.name
      }, metadata);
      this.log('enter', metadata, levels.TRACE, { metadataStyles });
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

  }, {
    key: 'exit',
    value: function exit(fn, metadata, metadataStyles) {
      metadata = Object.assign({
        functionName: fn.name
      }, metadata);
      this.log('exit', metadata, levels.TRACE, { metadataStyles });
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

  }, {
    key: 'wrap',
    value: function wrap(fn, metadata, metadataStyles, callback) {
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
  }]);
  return Logger;
}();

module.exports = Logger;
//# sourceMappingURL=index-node4.cjs.js.map
