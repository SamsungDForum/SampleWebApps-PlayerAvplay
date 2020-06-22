App = window.App || {};
App.KeyHandler = (function KeyHandler() {
    var handledDelegated = [];
    var handledButtons = [];
    var isKeyHandlerEnabled = true;


    function registerKey(key) {
        tizen.tvinputdevice.registerKey(key);
    }

    function registerKeyHandler(keyCode, keyName, handler) {
        if (keyName) {
            registerKey(keyName);
        }

        document.addEventListener('keydown', function keyHandler(event) {
            if (event.keyCode === keyCode) {
                handler(event);
            }
        });
    }

    function addHandlerForDelegated(parentElementSelector, handler) {
        handledDelegated.push({
            delegatedSelector: parentElementSelector,
            handler: handler
        });
    }

    function addHandlersForButtons(buttonsWithHandlers) {
        buttonsWithHandlers.forEach(function (buttonWithHandler) {
            handledButtons.push({
                elementSelector: buttonWithHandler.elementSelector,
                handler: buttonWithHandler.handler
            });
        });
    }

    function initKeyHandler() {
        document.addEventListener('keydown', function onKeyDown(event) {
            var isHandled = false;

            if (!isKeyHandlerEnabled) {
                return;
            }

            handledButtons.forEach(function (buttonWithHandler) {
                var elem = document.querySelector(buttonWithHandler.elementSelector);

                if (event.keyCode === 13 && elem && elem.classList.contains('active')) {
                    buttonWithHandler.handler(event);
                    isHandled = true;
                }
            });

            if (!isHandled) {
                handledDelegated.forEach(function handleDelegated(delegatedWithHandler) {
                    var i = 0;
                    var delegated = document.querySelector(delegatedWithHandler.delegatedSelector);
                    var children = delegated.querySelectorAll('[data-list-item]');

                    if (event.keyCode === 13) {
                        for (i; i < children.length; i += 1) {
                            if (children[i].classList.contains('active')) {
                                delegatedWithHandler.handler(children[i]);
                                break;
                            }
                        }
                    }
                });
            }
        });
    }

    function enableKeyHandler() {
        isKeyHandlerEnabled = true;
    }

    function disableKeyHandler() {
        isKeyHandlerEnabled = false;
    }

    return {
        addHandlerForDelegated: addHandlerForDelegated,
        addHandlersForButtons: addHandlersForButtons,
        registerKeyHandler: registerKeyHandler,
        initKeyHandler: initKeyHandler,
        enableKeyHandler: enableKeyHandler,
        disableKeyHandler: disableKeyHandler
    };
}());
