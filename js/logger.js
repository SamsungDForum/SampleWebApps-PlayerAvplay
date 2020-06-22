App = window.App || {};

App.Logger = (function Logger() {
    var logsLimit = 250;

    var logLevels = {
        ALL: 'all',
        DEBUG: 'debug',
        FATAL: 'error'
    };

    var logTypes = {
        LOG: 'log',
        WARN: 'warn',
        ERROR: 'error'
    };

    function create(configObj) {
        var loggerName = configObj.loggerName || 'LOGGER';
        var logLevel = configObj.logLevel || logLevels.ALL;
        var loggerEl = configObj.loggerEl;

        function executeLogs(type, msg) {
            var text = prepareLogText(logTypes[type.toUpperCase()].toUpperCase(), msg);
            var htmlLog = prepareOnscreenLogElem(type, text);

            // eslint-disable-next-line no-console
            console[type](text);
            loggerEl.appendChild(htmlLog);
            if (!loggerEl.querySelector('.active')) {
                htmlLog.scrollIntoView();
            }
            checkLogsAndDeleteIfNeeded();
        }

        function checkLogsAndDeleteIfNeeded() {
            var logsEl = document.querySelectorAll('.log');

            if (logsEl.length > logsLimit) {
                logsEl[0].remove();
            }
        }

        function isLoggingAllowed(logType) {
            var shouldLog = false;

            if (logType === logTypes.LOG) {
                shouldLog = logLevel === logLevels.ALL;
            } else if (logType === logTypes.WARN) {
                shouldLog = (logLevel === logLevels.DEBUG || logLevel === logLevels.ALL);
            } else if (logType === logTypes.ERROR) {
                // always display errors, so no check
                shouldLog = true;
            }

            return shouldLog;
        }

        function log() {
            if (isLoggingAllowed(logTypes.LOG)) {
                executeLogs(logTypes.LOG, arguments);
            }
        }

        function warn() {
            if (isLoggingAllowed(logTypes.WARN)) {
                executeLogs(logTypes.WARN, arguments);
            }
        }

        function error() {
            if (isLoggingAllowed(logTypes.ERROR)) {
                executeLogs(logTypes.ERROR, arguments);
            }
        }

        function prepareLogText(type, msg) {
            var args = Array.prototype.slice.call(msg);
            var logTime = new Date().toLocaleTimeString();
            var text = '[' + logTime + '][' + loggerName + '][' + type + ']: ';

            if (typeof msg === 'object') {
                text += args.map(function (arg) {
                    if (arg instanceof window.HTMLElement) {
                        return App.Utils.stringifyHTMLElement(arg);
                    }

                    return (typeof arg === 'object' ? JSON.stringify(arg) : arg);
                }).join(' | ');
            } else {
                text += msg;
            }

            return text;
        }

        function prepareOnscreenLogElem(type, msg) {
            var p = document.createElement('p');

            p.classList.add(type);
            p.innerHTML = msg;

            return p;
        }

        function clear() {
            loggerEl.innerHTML = '';
        }

        // if loggerEl is not passed it will just silently not print logs to the screen
        if (!configObj.loggerEl) {
            loggerEl = {
                appendChild: function () { },
                innerHTML: ''
            };

            warn('[LOGGER WARNING]: no loggerEl passed - no logs will be printed on screen');
        }

        return {
            log: log,
            warn: warn,
            error: error,
            clear: clear
        };
    }

    return {
        create: create,
        logLevels: logLevels
    };
}());
