App = window.App || {};
App.Utils = (function Utils() {
    function getTVModel() {
        return webapis.productinfo.getRealModel();
    }

    function getTVFirmware() {
        return webapis.productinfo.getFirmware();
    }

    /**
     * This function takes containerSelector, name, and info parameter,
     * and changes selected container content into name: info form
     *
     * @param {string} containerSelector - Selector for HTML element
     * @param {string} name - Name before colon
     * @param {function} info - Function returning string to be inputed after colon
     *
     * @example
     * // Inputs 'Model: TVModel into <div id="example"><div>
     * displayPairEl('.exaple', 'Model', () => 'TVModel');
     */
    function displayPairEl(containerSelector, name, info) {
        var container = document.querySelector(containerSelector);
        container.innerHTML = name + ': ' + info();
    }

    function toArray(obj) {
        var array = [];
        var i = 0;

        for (i; i < obj.length; i += 1) {
            array[i] = obj[i];
        }

        return array;
    }

    function stringifyHTMLElement(element) {
        var stringArr = ['&lt;', element.tagName.toLowerCase()];
        var stringArrWithAttrs = toArray(element.attributes).reduce(function (allAttrs, attribute) {
            allAttrs.push(' ', attribute.name, '="', attribute.nodeValue, '"');
            return allAttrs;
        }, stringArr);

        stringArrWithAttrs.push('&gt;');

        return stringArrWithAttrs.join('');
    }

    function getKeyForValue(val, obj) {
        return Object.getOwnPropertyNames(obj).filter(function (key) {
            return obj[key] === val;
        });
    }

    function scrollToCurrent(scrollingEl, currentEl) {
        var parentEl = scrollingEl;

        if (currentEl) {
            // Scrolls channel list so currently highlighted box is 2 boxes from the top of the screen
            parentEl.scrollTop = currentEl.offsetTop - (2 * currentEl.clientHeight);
        }
    }

    function numberToMinimalDigitString(number, digits) {
        var limit = Math.pow(10, digits - 1);
        var i;
        var retNumber = '';

        if (typeof number !== 'number') {
            return undefined;
        }

        if (digits > 0) {
            if (number < 0) {
                retNumber = number.toString();
            } else if (number === 0) {
                for (i = 0; i < digits; i += 1) {
                    retNumber = '0' + retNumber;
                }
            } else {
                retNumber = number < limit ? '0' + numberToMinimalDigitString(number, digits - 1) : number;
            }
        } else {
            retNumber = number;
        }

        return retNumber.toString();
    }

    function request(method, url, params, onSuccess, onError) {
        var xhr = new window.XMLHttpRequest();

        try {
            xhr.open(method, url);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onload = function () {
                if (xhr.status === 200) {
                    onSuccess(JSON.parse(xhr.responseText));
                } else {
                    onError(JSON.parse(xhr.responseText));
                }
            };

            xhr.onerror = function () {
                onError('[XHR] Connection refused');
            };
            xhr.send(JSON.stringify(params));
        } catch (e) {
            onError(e);
        }
    }

    function httpPost(url, params, onSuccess, onError) {
        request('POST', url, params, onSuccess, onError);
    }

    function httpGet(url, onSuccess, onError) {
        request('GET', url, null, onSuccess, onError);
    }

    function roundNumber(num, digits) {
        if (typeof num !== 'number') {
            return NaN;
        }

        if (typeof digits === 'number' && Math.floor(digits) === digits && digits >= 0) {
            return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
        }

        return Math.round(num * 100) / 100;
    }

    function dateToReadableString(date) {
        var months = [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ];

        if (!(date instanceof Date)) {
            return undefined;
        }

        return date.getDate()
            + ' ' + months[date.getMonth()]
            + ' ' + date.getFullYear()
            + ' ' + numberToMinimalDigitString(date.getHours(), 2)
            + ':' + numberToMinimalDigitString(date.getMinutes(), 2)
            + ':' + numberToMinimalDigitString(date.getSeconds(), 2);
    }

    // Takes a number in bytes and converts it to aproperiete unit and rounds it to 2 digits after comma
    function sizeToReadableString(size) {
        var string;
        var KB = 1024;
        var MB = 1048576;
        var GB = 1073741824;
        if (typeof size !== 'number') {
            return undefined;
        }

        if (!size && size !== 0) {
            string = '';
        } else if (size < KB) {
            string = size + 'B';
        } else if (size < MB) {
            string = roundNumber(size / KB) + 'KB';
        } else if (size < GB) {
            string = roundNumber(size / MB) + 'MB';
        } else {
            string = roundNumber(size / GB) + 'GB';
        }

        return string;
    }

    function negatePredicate(predicate) {
        return function () {
            return !predicate.apply(this, arguments);
        };
    }

    /**
     * This function takes time in miliseconds and returns easily readable string.
     *
     * @param {number} ms - Time in miliseconds
     * @returns {string} Time in format hh:mm:ss or mm:ss if hh is 0
     *
     * @example
     * // returns 1:15:10
     * msToReadableTime(4510000‬);
     */
    function msToReadableTime(ms) {
        var hours;
        var minutes;
        var seconds;
        var ret = '';
        if (typeof ms !== 'number') {
            return undefined;
        }
        hours = Math.floor(ms / 3600000);
        minutes = Math.floor((ms - hours * 3600000) / 60000);
        seconds = Math.floor((ms - hours * 3600000 - minutes * 60000) / 1000);
        if (hours !== 0) {
            ret += numberToMinimalDigitString(hours, 2) + ':';
        }
        ret += numberToMinimalDigitString(minutes, 2) + ':' + numberToMinimalDigitString(seconds, 2);
        return ret;
    }

    function shortenTitle(title) {
        return title.length > 25 ? title.substr(0, 22) + '...' : title;
    }

    return {
        getTVModel: getTVModel,
        getTVFirmware: getTVFirmware,
        displayPairEl: displayPairEl,
        toArray: toArray,
        stringifyHTMLElement: stringifyHTMLElement,
        getKeyForValue: getKeyForValue,
        roundNumber: roundNumber,
        scrollToCurrent: scrollToCurrent,
        numberToMinimalDigitString: numberToMinimalDigitString,
        request: request,
        httpPost: httpPost,
        httpGet: httpGet,
        dateToReadableString: dateToReadableString,
        sizeToReadableString: sizeToReadableString,
        msToReadableTime: msToReadableTime,
        shortenTitle: shortenTitle,
        negatePredicate: negatePredicate
    };
}());
