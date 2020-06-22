App = window.App || {};
App.Init = (function Init() {
    var infoEl = document.querySelector('.info');
    var HIDDEN_CLASS_NAME = 'hidden';
    var buttonsWithHandlers = [
        {
            elementSelector: '.toggle-info',
            handler: toggleInfo
        }
    ];
    var infoTimeoutId = setTimeout(function () {
        infoEl.classList.add(HIDDEN_CLASS_NAME);
    }, 8000);
    var logsContainerEl = document.querySelector('.logsContainer');
    var logsEl = document.querySelector('.logs');
    var SCROLL_STEP = 200;

    function toggleInfo() {
        if (infoTimeoutId !== null) {
            clearTimeout(infoTimeoutId);
            infoTimeoutId = null;
        }

        infoEl.classList.toggle(HIDDEN_CLASS_NAME);
    }

    App.Utils.displayPairEl('.firmware', 'Firmware', App.Utils.getTVFirmware);
    App.Utils.displayPairEl('.model', 'Model', App.Utils.getTVModel);

    App.KeyHandler.addHandlersForButtons(buttonsWithHandlers);
    App.KeyHandler.initKeyHandler();

    App.Navigation.registerMenu({
        domEl: document.querySelector('#buttons'),
        name: 'Basic',
        onAfterLastItem: function () {
            var logsLength = document.querySelectorAll('.log').length;
            var isNotFullscreen = !document.querySelector('.fullscreenMode');
            if (logsLength > 0 && isNotFullscreen) {
                App.Navigation.changeActiveMenu('Logs');
            }
        }
    });

    App.Navigation.registerMenu({
        domEl: logsEl,
        name: 'Logs',
        previousMenu: 'Basic',
        alignment: 'vertical',
        onPreviousMenu: function () {
            // If logs were created when user had focus on logs menu
            logsContainerEl.scrollTop = logsContainerEl.scrollHeight;
        }
    });

    document.body.addEventListener('keydown', function (event) {
        if (event.keyCode === 38 && logsEl.querySelector('.active')) { // UP button and focus on logs
            logsContainerEl.scrollTop -= SCROLL_STEP;
        } else if (event.keyCode === 40 && logsEl.querySelector('.active')) { // DOWN button and focus on logs
            logsContainerEl.scrollTop += SCROLL_STEP;
        }
    });
}());
