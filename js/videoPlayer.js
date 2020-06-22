App = window.App || {};

App.VideoPlayer = (function VideoPlayer() {
    var playerStates = {
        IDLE: 'IDLE',
        NONE: 'NONE',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        READY: 'READY'
    };
    var JUMP_MILISECONDS = 10000;
    var FULLSCREEN_CLASS = 'fullscreenMode';
    var subtitlesOn = true;

    /**
     * Creates a new player instance
     *
     * @param {Object} config - contains player configuration
     * @param {Element} config.playerEl - element of type <object> that player will play in
     * @param {String} config.url - video url
     * @param {Element} config.controls - element containing controls for the player
     * @param {Object} [config.logger] - custom logger object
     * @param {Boolean} [config.set4KMode] - flag defining whether 4K mode should be set
     *
     * @returns {Object} - player instance
     */
    function create(config) {
        var logger = config.logger || console;
        var playerEl = config.playerEl;
        var controlsEl = config.controls;
        var subtitlesEl = config.subtitlesEl;
        var timerEl = config.timerEl;
        var isFullscreen = false;
        var playerCoords = {
            x: playerEl.offsetLeft,
            y: playerEl.offsetTop,
            width: playerEl.offsetWidth,
            height: playerEl.offsetHeight
        };
        var resolutionWidth;
        var resolutionHeight;
        var videoDuration = 0;
        var currentTime = 0;
        var listeners = {
            onbufferingstart: function onbufferingstart() {
                logger.log('Buffering start.');
            },
            onbufferingprogress: function onbufferingprogress(percent) {
                logger.log('Buffering progress data : ' + percent);
            },
            onbufferingcomplete: function onbufferingcomplete() {
                logger.log('Buffering complete.');
                videoDuration = videoDuration || webapis.avplay.getDuration();
            },
            oncurrentplaytime: function oncurrentplaytime(currentPlayTime) {
                logger.log('Current playtime: ' + currentPlayTime);
                currentTime = currentPlayTime;
                updateTime();
            },
            onevent: function onevent(eventType, eventData) {
                logger.log('event type: ' + eventType + ', data: ' + eventData);
            },
            onstreamcompleted: function onstreamcompleted() {
                logger.log('Stream Completed');

                if (timerEl) {
                    timerEl.textContent = '';
                }

                stop();
            },
            onerror: function onerror(eventType) {
                logger.error('event type error : ' + eventType);
            },
            onsubtitlechange: function onsubtitlechange(duration, text) {
                logger.log('Subtitles running');
                subtitlesEl.innerText = text;
            }
        };

        logger.log('Open: ' + config.url);

        // Check the screen width so that the AVPlay can be scaled accordingly
        tizen.systeminfo.getPropertyValue(
            'DISPLAY',
            function successHandler(data) {
                resolutionWidth = data.resolutionWidth;
                resolutionHeight = data.resolutionHeight;
                updatePlayerCoords(resolutionHeight, resolutionWidth);
                initialize(config.url);
            },
            function errorHandler() {
                resolutionWidth = window.innerWidth;
                resolutionHeight = window.innerHeight;
                initialize(config.url);
            }
        );

        function downloadAndSetSubtitles() {
            var subtitleFileName = 'subtitle' + new Date().getTime();
            var download = new tizen.DownloadRequest(
                config.subtitles,
                'wgt-private-tmp',
                subtitleFileName
            );

            // Subtitles needs to be on device to get loaded
            tizen.download.start(download, {
                oncompleted: function (id, fullPath) {
                    tizen.filesystem.resolve(
                        'wgt-private-tmp',
                        function onResolveSuccess(dir) {
                            var packageURI;
                            try {
                                packageURI = dir.toURI().substring(7);
                                // Setting subtitles for the stream
                                webapis.avplay.setExternalSubtitlePath(
                                    packageURI + '/' + subtitleFileName + '.smi'
                                );
                            } catch (e) {
                                // On 2015 different format of the URI is needed
                                packageURI = dir.toURI().replace('file://', '') + '/' + fullPath.split('/')[1];
                                webapis.avplay.setExternalSubtitlePath(packageURI);
                            }
                            if (!subtitlesOn) {
                                webapis.avplay.setSilentSubtitle(true);
                            }
                        },
                        function (e) {
                            logger.error(e.message);
                        },
                        'r'
                    );
                }
            });
        }

        function prepareAndPlay() {
            logger.log('Prepare');
            webapis.avplay.prepareAsync(play, logger.error);

            // Init subtitles
            if (config.subtitles) {
                downloadAndSetSubtitles();
            }
        }

        function play() {
            try {
                switch (webapis.avplay.getState()) {
                    case playerStates.IDLE: // Fallthrough
                    case playerStates.NONE:
                        prepareAndPlay();
                        break;
                    case playerStates.READY: // Fallthrough
                    case playerStates.PAUSED:
                        webapis.avplay.play();
                        logger.log('Play');
                        break;
                    default:
                        logger.warn('Unhandled player state');
                        break;
                }
            } catch (error) {
                logger.error(error.message);
            }
        }

        /**
         * Needed for 'PlayPause' key
         */
        function playPause() {
            if (webapis.avplay.getState() === playerStates.PLAYING) {
                pause();
            } else {
                play();
            }
        }

        function stop() {
            var playerState = webapis.avplay.getState();

            if (playerState === playerStates.PLAYING || playerState === playerStates.PAUSED) {
                webapis.avplay.stop();
                logger.log('Video stopped');

                currentTime = 0;
                updateTime();

                if (isFullscreen) {
                    toggleFullscreen();
                }
            }

            if (subtitlesEl) {
                subtitlesEl.innerText = '';
            }
        }

        function pause() {
            var playerState = webapis.avplay.getState();

            if (playerState === playerStates.PLAYING || playerState === playerStates.READY) {
                webapis.avplay.pause();
                logger.log('Video paused');
            }
        }

        function ff() {
            var newTime = currentTime + JUMP_MILISECONDS;

            if (newTime > videoDuration) {
                return;
            }

            try {
                webapis.avplay.jumpForward(JUMP_MILISECONDS);
                currentTime = newTime;
                updateTime();
            } catch (error) {
                logger.error('Failed fast forwarding: ' + error.message);
            }
        }

        function rew() {
            var newTime = currentTime - JUMP_MILISECONDS;

            if (newTime < 0) {
                return;
            }

            try {
                webapis.avplay.jumpBackward(JUMP_MILISECONDS);
                currentTime = newTime;
                updateTime();
            } catch (error) {
                logger.error('Failed rewinding: ' + error.message);
            }
        }

        // Turns subtitles on/off
        function toggleSubtitles() {
            subtitlesOn = !subtitlesOn;
            webapis.avplay.setSilentSubtitle(!subtitlesOn);
            logger.log(
                subtitlesOn ? 'subtitles On' : 'subtitlesOff'
            );
            subtitlesEl.innerText = '';
            subtitlesEl.classList.toggle('hidden');
        }

        function is4KSupported() {
            return webapis.productinfo.isUdPanelSupported();
        }

        /**
         * Set to TV to play UHD content.
         */
        function set4K() {
            webapis.avplay.setStreamingProperty('SET_MODE_4K', 'true');
            logger.log('4K mode is active');
        }

        function is8KSupported() {
            try {
                return webapis.productinfo.is8KPanelSupported();
            } catch (e) {
                return false;
            }
        }

        function set8K() {
            webapis.avplay.setStreamingProperty('ADAPTIVE_INFO', 'FIXED_MAX_RESOLUTION=7680x4320');
            logger.log('8K mode is active');
        }

        /**
         * Function to set specific bitrates used to play the stream.
         * In case of Smooth Streaming STARTBITRATE and SKIPBITRATE values 'LOWEST', 'HIGHEST', 'AVERAGE' can be set.
         * For other streaming engines there must be numeric values.
         *
         * @param {Number} from  - Lower value of bitrates range.
         * @param {Number} to    - Higher value of the bitrates range.
         * @param {Number} start - Bitrate which should be used for initial chunks.
         * @param {Number} skip  - Bitrate that will not be used.
         */
        function setBitrate(from, to, start, skip) {
            var bitrates = '|BITRATES=' + from + '~' + to;

            if (start !== '' && start !== undefined) {
                bitrates += '|STARTBITRATE=' + start;
            }

            if (to !== '' && to !== undefined) {
                bitrates += '|SKIPBITRATE=' + skip;
            }

            try {
                webapis.avplay.setStreamingProperty('ADAPTIVE_INFO', bitrates);
            } catch (error) {
                logger.error('Failed setting bitrates: ' + error.message);
            }
        }

        /**
         * Function to change current VIDEO/AUDIO/TEXT track
         *
         * @param {String} type  - Streaming type received with webapis.avplay.getTotalTrackInfo(),
         *                          possible values are: VIDEO, AUDIO, TEXT.
         * @param {Number} index - Track id received with webapis.avplay.getTotalTrackInfo().
         */
        function setTrack(type, index) {
            try {
                webapis.avplay.setSelectTrack(type, index);
            } catch (error) {
                logger.error('Failed setting track: ' + error.message);
            }
        }

        /**
         * @returns {Object} - information about all available stream tracks
         */
        function getTracks() {
            var tracksObject = {};
            var trackInfo;

            try {
                trackInfo = webapis.avplay.getTotalTrackInfo();
                tracksObject = {
                    type: typeof trackInfo,
                    length: trackInfo.length,
                    tracks: trackInfo.map(function mapTrack(track) {
                        return {
                            index: track.index,
                            type: track.type,
                            extraInfo: track.extra_info
                        };
                    })
                };
            } catch (error) {
                logger.error('Failed getting tracks: ' + error.message);
            }

            return tracksObject;
        }

        /**
         * @returns {Object} - streaming properties
         */
        function getProperties() {
            var properties = {};

            try {
                properties = {
                    availableBitrate: webapis.avplay.getStreamingProperty('AVAILABLE_BITRATE'),
                    currentBandwidth: webapis.avplay.getStreamingProperty('CURRENT_BANDWITH'),
                    duration: webapis.avplay.getStreamingProperty('DURATION'),
                    bufferSize: webapis.avplay.getStreamingProperty('BUFFER_SIZE'),
                    startFragment: webapis.avplay.getStreamingProperty('START_FRAGMENT'),
                    cookie: webapis.avplay.getStreamingProperty('COOKIE'),
                    customMessage: webapis.avplay.getStreamingProperty('CUSTOM_MESSAGE')
                };
            } catch (error) {
                logger.error('Failed getting properties: ' + error.message);
            }

            return properties;
        }

        /**
         * Switch between full screen mode and normal windowed mode.
         */
        function toggleFullscreen() {
            if (!isFullscreen) {
                try {
                    webapis.avplay.setDisplayRect(0, 0, resolutionWidth, resolutionHeight);
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
                } catch (error) {
                    logger.log(error.message);
                }

                logger.log('Fullscreen on');

                playerEl.classList.add(FULLSCREEN_CLASS);
                controlsEl.classList.add(FULLSCREEN_CLASS);

                if (timerEl) {
                    timerEl.classList.add(FULLSCREEN_CLASS);
                }

                if (subtitlesEl) {
                    subtitlesEl.classList.add(FULLSCREEN_CLASS);
                }

                isFullscreen = true;
            } else {
                try {
                    webapis.avplay.setDisplayRect(
                        playerCoords.x,
                        playerCoords.y,
                        playerCoords.width,
                        playerCoords.height
                    );
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');
                } catch (error) {
                    logger.log(error.message);
                }

                logger.log('Fullscreen off');
                playerEl.classList.remove(FULLSCREEN_CLASS);
                controlsEl.classList.remove(FULLSCREEN_CLASS);

                if (subtitlesEl) {
                    subtitlesEl.classList.remove(FULLSCREEN_CLASS);
                }

                if (timerEl) {
                    timerEl.classList.remove(FULLSCREEN_CLASS);
                }

                isFullscreen = false;
            }
        }

        function initialize(url) {
            try {
                webapis.avplay.open(url);
                webapis.avplay.setDisplayRect(
                    playerCoords.x,
                    playerCoords.y,
                    playerCoords.width,
                    playerCoords.height
                );
                webapis.avplay.setListener(listeners);
                webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');

                if (config.set4KMode) {
                    if (is4KSupported()) {
                        set4K();
                    } else {
                        logger.log('4K is not supported');
                    }
                }

                if (config.set8KMode) {
                    if (is8KSupported()) {
                        set8K();
                    } else {
                        logger.log('8K is not supported');
                    }
                }
            } catch (error) {
                logger.error(error.message);
            }
        }

        function changeVideo(url) {
            webapis.avplay.close();
            logger.log('Open: ' + url);
            initialize(url);
        }

        function updateTime() {
            if (!timerEl) {
                return;
            }

            timerEl.textContent = App.Utils.msToReadableTime(currentTime)
                + ' / '
                + App.Utils.msToReadableTime(videoDuration);
        }

        function updatePlayerCoords(screenHeight, screenWidth) {
            var viewPortHeight = 1080;
            var viewPortWidth = 1920;
            playerCoords.x *= screenWidth / viewPortWidth;
            playerCoords.y *= screenHeight / viewPortHeight;
            playerCoords.width *= screenWidth / viewPortWidth;
            playerCoords.height *= screenHeight / viewPortHeight;
        }

        function getState() {
            return webapis.avplay.getState();
        }

        document.addEventListener('visibilitychange', function eventHandler() {
            var playerState = webapis.avplay.getState();

            if (document.hidden) {
                if (playerState === 'READY' || playerState === 'PLAYING' || playerState === 'PAUSED') {
                    webapis.avplay.suspend();
                    logger.log('Player suspended');
                }
            } else {
                if (playerState === 'NONE' || playerState === 'PLAYING' || playerState === 'PAUSED') {
                    webapis.avplay.restore();
                    logger.log('Player restored');
                }
            }
        });

        return {
            play: play,
            playPause: playPause,
            stop: stop,
            pause: pause,
            ff: ff,
            rew: rew,
            setBitrate: setBitrate,
            setTrack: setTrack,
            getTracks: getTracks,
            getProperties: getProperties,
            toggleFullscreen: toggleFullscreen,
            toggleSubtitles: toggleSubtitles,
            changeVideo: changeVideo,
            getState: getState
        };
    }

    return {
        create: create,
        playerStates: playerStates
    };
}());
