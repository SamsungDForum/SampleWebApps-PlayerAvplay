App = window.App || {};
App.Navigation = (function Navigation() {
    var activeMenu = null;
    var Menus = {};
    var isEnabled = true;

    function toggleFocusOnActiveItem() {
        activeMenu.getItems()[activeMenu.getFocusedElemIdx()].classList.toggle('active');
    }

    window.addEventListener('keydown', function keyHandler(event) {
        if (!isEnabled) {
            return;
        }

        switch (event.keyCode) {
            case 39: // right
                activeMenu.onKeyRight();
                break;
            case 37: // left
                activeMenu.onKeyLeft();
                break;
            case 38: // up
                activeMenu.onKeyUp();
                break;
            case 40: // down
                activeMenu.onKeyDown();
                break;
            case 13: // enter
                activeMenu.onKeyEnter();
                break;
            case 10009: // return
                activeMenu.onKeyReturn();
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn('Unhandled key:', event.code, event.keyCode);
        }
    }, false);

    function previousItem(menu) {
        var currentIndex = menu.getFocusedElemIdx();

        if (currentIndex !== 0) {
            toggleFocusOnActiveItem();
        }

        menu.setFocusedElemIdx(
            Math.max(currentIndex - 1, 0)
        );

        if (menu.getFocusedElemIdx() !== menu.getSelectedElemIdx()) {
            menu.getItems()[menu.getSelectedElemIdx()].classList.remove('selected');
        }

        if (currentIndex === 0) {
            menu.onBeforeFirstItem();
        } else {
            menu.onActiveItemChanged(menu.getItems()[menu.getFocusedElemIdx()]);
            toggleFocusOnActiveItem();
        }
    }

    function nextItem(menu) {
        var currentIndex = menu.getFocusedElemIdx();

        if (currentIndex !== menu.getItems().length - 1) {
            toggleFocusOnActiveItem();
        }

        menu.setFocusedElemIdx(
            Math.min(currentIndex + 1, menu.getItems().length - 1)
        );

        if (menu.getFocusedElemIdx() !== menu.getSelectedElemIdx()) {
            menu.getItems()[menu.getSelectedElemIdx()].classList.remove('selected');
        }

        if (currentIndex === menu.getItems().length - 1) {
            menu.onAfterLastItem();
        } else {
            menu.onActiveItemChanged(menu.getItems()[menu.getFocusedElemIdx()]);
            toggleFocusOnActiveItem();
        }
    }

    function removeMenuConnections(connectionName) {
        return function (menuName) {
            var currentMenu = Menus[menuName];

            if (currentMenu.previousMenu === connectionName) {
                currentMenu.previousMenu = null;
            } else if (currentMenu.nextMenu === connectionName) {
                currentMenu.nextMenu = null;
            }
        };
    }

    /**
     *
     * @param {String} name - name of the menu that will be active
     */
    function changeActiveMenu(name, index) {
        toggleFocusOnActiveItem();
        activeMenu = Menus[name] || activeMenu;
        if (index !== undefined) {
            activeMenu.setFocusedElemIdx(
                Math.max(0, Math.min(activeMenu.getItems().length - 1, index))
            );
        }
        toggleFocusOnActiveItem();
    }

    /**
     * Registers menu and select items based on if element's children contain data-list-item
     * @param {Object} config - menu config object
     * @param {HTMLElement} config.domEl - reference to html element containing buttons
     * @param {String} config.name - name of menu needed for identification
     * @param {String} [config.alignment=horizontal] - defines whether menu is 'horizontal' or 'vertical'
     * @param {String} [config.previousMenu] - name of previous menu to be focused
     * @param {String} [config.nextMenu] - name of next menu to be focused
     * @param {Boolean} [config.selectionVisible] - defined whether selected element should be decorated
     * @param {Function} [config.onBeforeFirstItem] - called when navigating to previous item when first item is focused
     * @param {Function} [config.onAfterLastItem] - called when navigating to next item when last item is focused
     * @param {Function} [config.onActiveItemChanged] - callback which is called after active item is changed
     * @param {String} [config.syncWith] - name of menu to synchronize focused index with
     * @param {Function} [config.onNextMenu] - called when navigating to next menu
     * @param {Function} [config.onPreviousMenu] - called when navigating to previous menu
     */
    function registerMenu(config) {
        var domEl = config.domEl;
        var focusedElemIdx = 0;
        var selectedItemIdx = 0;
        var menu = {
            name: config.name,
            syncWith: config.syncWith,
            getSelectedElemIdx: function getSelectedElemIdx() {
                return selectedItemIdx;
            },
            nextMenu: config.nextMenu,
            previousMenu: config.previousMenu,
            getItems: function getItems() {
                return domEl.querySelectorAll('[data-list-item]');
            },
            getFocusedElemIdx: function getFocusedElemIdx() {
                return focusedElemIdx;
            },
            setFocusedElemIdx: function setFocusedElemIdx(index) {
                focusedElemIdx = Math.min(menu.getItems().length - 1, Math.max(0, index));
            },
            setFocusedElemName: function setFocusedElemName(name) {
                var items = menu.getItems();
                var i;

                toggleFocusOnActiveItem();

                for (i = 0; i < items.length; i += 1) {
                    if (items[i].classList.contains(name)) {
                        menu.setFocusedElemIdx(i);
                        break;
                    }
                }

                toggleFocusOnActiveItem();
            },
            onKeyRight: function onKeyRight() { },
            onKeyLeft: function onKeyLeft() { },
            onKeyUp: function onKeyUp() { },
            onKeyDown: function onKeyDown() { },
            onKeyEnter: function onKeyEnter() {
                if (config.selectionVisible) {
                    menu.getItems()[selectedItemIdx].classList.remove('selected');
                    selectedItemIdx = focusedElemIdx;
                    menu.getItems()[selectedItemIdx].classList.add('selected');
                }
            },
            onKeyReturn: function onKeyReturn() { },
            onActiveItemChanged: config.onActiveItemChanged || function onFocusedElemChanged() { },
            onAfterLastItem: config.onAfterLastItem || function onAfterLastItem() {},
            onBeforeFirstItem: config.onBeforeFirstItem || function onBeforeFirstItem() {},
            onNextMenu: config.onNextMenu || function onNextMenu() {},
            onPreviousMenu: config.onPreviousMenu || function onPreviousMenu() {}
        };

        if (config.alignment === 'vertical') {
            menu.onKeyUp = previousItem.bind(null, menu);
            menu.onKeyDown = nextItem.bind(null, menu);
            menu.onKeyLeft = changeToPreviousMenu;
            menu.onKeyRight = changeToNextMenu;
        } else {
            menu.onKeyLeft = previousItem.bind(null, menu);
            menu.onKeyRight = nextItem.bind(null, menu);
            menu.onKeyUp = changeToPreviousMenu;
            menu.onKeyDown = changeToNextMenu;
        }

        Menus[config.name] = menu;

        if (!activeMenu) {
            activeMenu = menu;
            toggleFocusOnActiveItem();
        }

        return menu;

        function changeToPreviousMenu() {
            if (menu.previousMenu && !Menus[menu.previousMenu].getItems().length) {
                return;
            }

            if (menu.previousMenu && Menus[menu.previousMenu].syncWith === menu.name) {
                Menus[menu.previousMenu].setFocusedElemIdx(menu.getFocusedElemIdx());
            }

            changeActiveMenu(menu.previousMenu);
            menu.onPreviousMenu();
        }

        function changeToNextMenu() {
            if (menu.nextMenu && !Menus[menu.nextMenu].getItems().length) {
                return;
            }

            if (menu.nextMenu && Menus[menu.nextMenu].syncWith === menu.name) {
                Menus[menu.nextMenu].setFocusedElemIdx(menu.getFocusedElemIdx());
            }

            changeActiveMenu(menu.nextMenu);
            menu.onNextMenu();
        }
    }

    /**
     * Unregisters menu from map
     * @param {String} name - name of menu to be unregistered
     */
    function unregisterMenu(name) {
        var menu = Menus[name];

        if (!menu) {
            return;
        }

        if (menu.name === activeMenu.name) {
            if (menu.previousMenu) {
                changeActiveMenu(menu.previousMenu);
            } else if (menu.nextMenu) {
                changeActiveMenu(menu.nextMenu);
            } else {
                toggleFocusOnActiveItem();
                activeMenu = null;
            }
        }

        Object.getOwnPropertyNames(Menus)
            .forEach(removeMenuConnections(name));

        delete Menus[name];
    }

    function disable() {
        isEnabled = false;
    }

    function enable() {
        isEnabled = true;
    }

    function getMenu(menuName) {
        return Menus[menuName];
    }

    function getActiveMenu() {
        return activeMenu;
    }

    return {
        registerMenu: registerMenu,
        unregisterMenu: unregisterMenu,
        changeActiveMenu: changeActiveMenu,
        getMenu: getMenu,
        disable: disable,
        enable: enable,
        getActiveMenu: getActiveMenu
    };
}());
