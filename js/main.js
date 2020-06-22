App = window.App || {};

App.Main = (function Main() {
    var player;
    var playerStates = App.VideoPlayer.playerStates;

    function onReturn() {
        var playerState = player.getState();

        if (playerState !== playerStates.IDLE && playerState !== playerStates.NONE) {
            player.stop();
        } else {
            tizen.application.getCurrentApplication().hide();
        }
    }

    function registerKeyHandler(keyWithHandler) {
        App.KeyHandler.registerKeyHandler(keyWithHandler.keyCode, keyWithHandler.keyName, keyWithHandler.handler);
    }

    function registerKeyHandlers() {
        var keysWithHandlers = [
            { keyCode: 10252, handler: player.playPause, keyName: 'MediaPlayPause' },
            { keyCode: 415, handler: player.play, keyName: 'MediaPlay' },
            { keyCode: 19, handler: player.pause, keyName: 'MediaPause' },
            { keyCode: 413, handler: player.stop, keyName: 'MediaStop' },
            { keyCode: 417, handler: player.ff, keyName: 'MediaFastForward' },
            { keyCode: 412, handler: player.rew, keyName: 'MediaRewind' },
            { keyCode: 49, handler: player.toggleUhd, keyName: '1' },
            { keyCode: 50, handler: player.getTracks, keyName: '2' },
            { keyCode: 51, handler: player.getProperties, keyName: '3' },
            { keyCode: 10009, handler: onReturn }
        ];

        keysWithHandlers.forEach(registerKeyHandler);
    }

    function addButtonsHandlers() {
        var buttonsWithHandlers = [
            { elementSelector: '.play', handler: player.play },
            { elementSelector: '.pause', handler: player.pause },
            { elementSelector: '.stop', handler: player.stop },
            { elementSelector: '.ff', handler: player.ff },
            { elementSelector: '.rew', handler: player.rew },
            { elementSelector: '.fullscreen', handler: player.toggleFullscreen }
        ];

        App.KeyHandler.addHandlersForButtons(buttonsWithHandlers);
    }

    window.onload = function onload() {
        var playerLogger = App.Logger.create({
            loggerEl: document.querySelector('.logsContainer'),
            loggerName: 'Player',
            logLevel: App.Logger.logLevels.ALL
        });

        var playerConfig = {
            url: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            playerEl: document.querySelector('#av-player'),
            controls: document.querySelector('.buttons'),
            timerEl: document.querySelector('.time'),
            logger: playerLogger
        };

        // initialize player - loaded from videoPlayer.js
        player = App.VideoPlayer.create(playerConfig);

        registerKeyHandlers();
        addButtonsHandlers();
    };
}());
