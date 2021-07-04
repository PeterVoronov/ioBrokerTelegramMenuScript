//Telegram bot with inline menu, based on https://blog.instalator.ru/archives/1996 by Vladimir Vilisov aka instalator

// https://www.emojicopy.com/ эмодзи

//////////// Настройки ///////////
var options = {
    telegram:   'telegram.0',           // Инстанция драйвера
    backText:   '🔙 Назад',             // Надпись на кнопке Назад
    backCmd:    'back-',                 //Префикс команды кнопки Назад
    closeText:  '❌ Закрыть',           // Надпись на кнопке Закрыть
    closeCmd:   'close',                //Команда кнопки Закрыть
    homeText:   '🏚 Главная',           // Надпись на кнопке Домой
    homeCmd:    'home',                  //Команда кнопки Домой
    width:      3,                      // Максимальное количество столбцов с кнопками
    users_id:   [123456789,234567891],            // id пользователей которые имеют доступ к меню
    username:   true,                   // использовать Имя Пользователя(UserName) телеграмм для общения
    menucall:   ['Меню', 'меню', '/menu'],      // Команды для вызова меню
    clearmenucall: true,                // Удалять команду пользователя, вызвавшую меню
    menuPrefix: 'menu-',                // Префикс для отправляемых комманд при нажатии на кнопку, можно не менять
    showHome:   true,                   // Показывать кнопку Домой
    showMsg:    true,                   // Показывать вплывающие сообщения
    language:   "ru",                   // Язык общения
    locale:     "ru-RU",                // Язык общения    
    debug:      false                    // Режим отладки, подробное логирование
};

/////////// МЕНЮ НАЧАЛО ////////////
const menu = {
    name: 'Главное меню',
    icon: '⚙️',
    submenu: [
        { // Двери
            name: 'Двери',
            icon: '🚪',
            funcEnum: 'door',
            type: 'magnet',
            submenu: submenuGenerator
        },
        { // Окна
            name: 'Окна',
            icon: '⬜',
            funcEnum: 'window',
            type: 'magnet',
            submenu: submenuGenerator
        },
        { // Освещение
            name: 'Освещение',
            icon: '💡',
            submenu: [
                {
                    name: 'Прихожая',
                    state: 'linkeddevices.0.switches.lonsonho.light.lobby.state',
                    icons: {on: '💡', off: '✖️'},
                    submenu: []
                },
            ]
        },
        { // Розетки
            name: 'Розетки',
            icon: '🔌',
            funcEnum: 'plug',
            type: 'plug',
            submenu: submenuGenerator
        },        
        { // Информация
            name: 'Информация',
            icon: 'ℹ️',
            submenu: [
                {
                    name: 'Температура',
                    function: Environments,
                    param: 'temperature',
                    icon: '🌡',
                    submenu: []
                },
                {
                    name: 'Влажность',
                    function: Environments,
                    param: 'humidity', // А можно вызвать функцию вот так
                    icon: '💦',
                    submenu: []
                }
            ]
        },
    ]
};
/////////// МЕНЮ КОНЕЦ ////////////

/////////// ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ НАЧАЛО /////////////

const submenuParams = {
    'plug' :
        {
            mask : 'linkeddevices.0.sockets.*.plug.*.state',
            role : 'switch',
            state : 'state',
            rooms : false,
            icons : {on: '✅', off: '❌'},
            menuitems :
                {
                    '.state' : 'Вкл/выкл',
                    '.auto_off' : 'Автовыключение',
                    '.led_disabled_night' : 'Выкл. индикатор',
                    '.power_outage_memory' : 'Запоминать состояние'
                },
            report: reportGenerator,
            reportitems :
                {
                    '.consumer_connected'   : 'Нагрузка подключена',
                    '.consumer_overload'    : 'Превышена нагрузка',
                    '.current'              : 'Ток нагрузки',
                    '.voltage'              : 'Напряжение в сети',
                    '.temperature'          : 'Температура внутри',
                    '.load_power'           : 'Текущее потребление',
                    '.energy'               : 'Всего потреблено',
                    '.link_quality'         : 'Уровень сигнала'
                },
            statusitems :
                {
                }
        },
    'magnet' :
        {
            mask : 'linkeddevices.0.sensors.*.magnet.*.opened',
            role : 'state',
            state: 'opened',
            icons : {on: '🔓', off: '🔐'},
            report: reportGenerator,
            menuitems :
                {
                },
            reportitems :
                {
                },
            statusitems :
                {
                    'lc' : 'Не менялся с',
                    'ack' : 'Потдвержден',
                    'ts' : 'По состоянию на',
                    'val' : {
                        'prefix' : 'Статус',
                        true : 'Открыт(-а)(-о)',
                        false : 'Закрыт(-а)(-о)'
                    }
                }
        },
};

const mainDataPrefix = '0_userdata.0.telegram_automenu.';

/*** statesCommonAttr ***/
const statesCommonAttr = {
    'botSendMessageId' : {name:"Message ID of last sent message by the bot", type: 'number', read: true, write: true, role: 'id'},
    'messageId' : {name:"Message ID of last received request", type: 'number', read: true, write: true, role: 'id'},
    'user': {name:"user data as json", type: "string", read: true, write: true, role: "text"},
    'menuOn' : {name:"Is menu shown to the user", type: 'boolean', read: true, write: true, role: 'state'}
};

/*** statesCache ***/
var statesCache = {};

/*** Make functions be printable in JSON.stringify with names ***/
Function.prototype.toJSON = function() { return `${this.name}` }

/*** getStateCached ***/
function getStateCached(user, state) {
    logs('ВЫЗОВ ФУНКЦИИ getStateCached(user, state, value) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(state));
    const id = mainDataPrefix + 'cache.' + options.telegram + '.' + user + '.' + state;
    if (statesCache.hasOwnProperty(id)) {
        logs('Cached = ' + JSON.stringify(statesCache[id]));
        return JSON.parse(statesCache[id]);
    }
    else {
        if (existsState(id)) {
            statesCache[id] = getState(id).val;
            logs('Non cached = ' + JSON.stringify(statesCache[id]));
            return JSON.parse(statesCache[id]);
        }
    }
    return undefined;
}

/*** setStateCached ***/
function setStateCached(user, state, value) {
    logs('ВЫЗОВ ФУНКЦИИ setStateCached(user, state, value) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(state));
    logs('value = ' + JSON.stringify(value));
    const id = mainDataPrefix + 'cache.' + options.telegram + '.' + user + '.' + state;
    statesCache[id] = value;
    if (existsState(id)) {
        setState(id,value,true);
    }
    else {
        if (statesCommonAttr.hasOwnProperty(state) ) {
            createState(id, value, statesCommonAttr[state])
        }
    }
}

/*** delStateCached ***/
function delStateCached(user, state) {
    logs('ВЫЗОВ ФУНКЦИИ delStateCached(user, state) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(state));
    const id = mainDataPrefix + 'cache.' + options.telegram + '.' + user + '.' + state;
    if (existsState(id)) {
        deleteState(id);
    }
    if (statesCache.hasOwnProperty(id)) {
        delete statesCache[id];
    }
}

/*** initConfig ***/
function initConfig() {
    logs('ВЫЗОВ ФУНКЦИИ initConfig() из ' + arguments.callee.caller.name);
    const configPrefix = '0_userdata.0.telegram_automenu.config.';
    for (const [key, value] of Object.entries(options)) {
        const id = configPrefix + key;
        if (existsState(id)) {
            options[key] = getState(id).val;
            if (Array.isArray(value)) {
                options[key] = options[key].split(',');
            }
            logs('option ' + JSON.stringify(key) + ' = ' + JSON.stringify(value) + ' is configured to ' + JSON.stringify(options[key]));
            //options[key] = newVal;
        }
        else {
            let stateVal = value;
            let stateType = typeof stateVal;
            if (Array.isArray(stateVal)) {
                stateVal = stateVal.join(',');
                stateType = 'string';
            }
            createState(id, stateVal, {name: key, type: stateType, read: true, write: true})
            logs('state ' + JSON.stringify(id) + ' created for option ' + JSON.stringify(key) + ' = ' + JSON.stringify(stateVal));
        }
    }
    on({id: /^0_userdata\.0\.telegram_automenu\.config\..*$/, change: 'ne'}, function optionsSubscribe(obj) {
        logs('ВЫЗОВ ФУНКЦИИ optionsSubscribe(obj)');
        logs('obj = ' + JSON.stringify(obj));
        const key = obj['id'].split('.').pop();
        if (Array.isArray(options[key])) {
            options[key] = obj['state']['val'].split(',');
        }
        else {
            options[key] = obj['state']['val'];
        }
        setState(obj['id'], obj['state']['val'], true);
        logs('options[' + key + '] is set to ' + JSON.stringify(options[key]));
    });
}



/*** submenuGenerator ***/
function submenuGenerator(upperMenuItem) {
    logs('ВЫЗОВ ФУНКЦИИ submenuGenerator(upperMenuItem) из ' + arguments.callee.caller.name);
    logs('upperMenuItem = ' + JSON.stringify(upperMenuItem));
    var upperMenuIndex = getIndex(upperMenuItem.name);
    var subMenu = [];
    var currId = -1;
    var lastRoom = '';
    var roomIndex = -1;
    var roomMenuIndex = '';
    var roomMenuItem;
    var menuItemName = '';
    processObjects(submenuParams[upperMenuItem.type]['mask'], submenuParams[upperMenuItem.type]['role'], upperMenuItem.funcEnum, function plugsCB (id, room) {
        logs('ВЫЗОВ ФУНКЦИИ plugsCB(id, room) из ' + arguments.callee.caller.name);
        logs('id = ' + JSON.stringify(id));
        logs('room = ' + JSON.stringify(room));
        logs('lastRoom = ' + JSON.stringify(lastRoom));
        logs('roomIndex = ' + JSON.stringify(roomIndex));
        logs('currId = ' + JSON.stringify(currId));
        logs('roomMenuIndex = ' + JSON.stringify(roomMenuIndex));
        logs('roomMenuItem = ' + JSON.stringify(roomMenuItem));
        logs('menuItemName = ' + JSON.stringify(menuItemName));
        logs('subMenu = ' + JSON.stringify(subMenu));
        const idPrefix = id.split('.').slice(0,-1).join('.');
        if (lastRoom != room.id) {
            if ((! submenuParams[upperMenuItem.type]['rooms']) && (currId >= 0) && (subMenu[subMenu.length-1].submenu.length === 1)) {
                subMenu = unRoom(subMenu);
            }
            currId++;
            roomMenuItem = {
                                name: upperMenuIndex + '.' + currId + '-' + getRoomName(room.id, room.name,'Main'),
                                icon: upperMenuItem.icon,
                                submenu: []
                            };
            roomIndex = 0;
            subMenu.push(roomMenuItem);
        }
        var menuItem = {
                            name: upperMenuIndex + '.' + currId + '.' + roomIndex + '-' + getObject(idPrefix).common.name,
                            state: id,
                            type: upperMenuItem.type,
                            icons: submenuParams[upperMenuItem.type]['icons'],
                            submenu: []
                        };
        if ((submenuParams[upperMenuItem.type].hasOwnProperty('report')) && (submenuParams[upperMenuItem.type]['report'] !== undefined )) {
            menuItem.function = submenuParams[upperMenuItem.type]['report'];
        }
        var currSubId = 0;
        for (const [state, name] of Object.entries(submenuParams[upperMenuItem.type]['menuitems'])) {
            if (existsState(idPrefix + state)) {
                const currObject = getObject(idPrefix + state);
                logs('currObject = ' + JSON.stringify(currObject));
                if (currObject.common.type === 'boolean') {
                    menuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + name,
                                    state: idPrefix + state,
                                    icons: submenuParams[upperMenuItem.type]['icons'],
                                    submenu: []
                                })
                    currSubId++;
                }
                else {
                    if ((currObject.common.type === 'string') && (currObject.common.hasOwnProperty('states') )) {
                        const currState = getState(idPrefix + state).val;
                        const states = currObject.common.states.split(';');
                        if (states.length > 0) {
                            var subMenuItem = {
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + name,
                                    icon: upperMenuItem.icon,
                                    submenu: []
                                };
                            for (let iState = 0; iState < states.length; ++iState) {
                                const [possibleValue, possibleName] = states[iState].split(':');
                                logs('possibleValue = ' + JSON.stringify(possibleValue), 1 );
                                logs('possibleName = ' + JSON.stringify(possibleName));
                                subMenuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '.' + iState + '-' + (possibleName !== undefined ? possibleName : possibleValue),
                                    state: idPrefix + state + ':' + possibleValue,
                                    icon: submenuParams[upperMenuItem.type]['icons'][currState == possibleValue ? 'on' : 'off'],
                                    submenu: []
                                })

                            }
                            menuItem.submenu.push(subMenuItem);
                            currSubId++;
                        }
                    }
                }
            }
        }
        roomMenuItem.submenu.push(menuItem)
        roomIndex++;
        lastRoom = room.id;
    })
    if ((! submenuParams[upperMenuItem.type]['rooms']) && (subMenu[subMenu.length-1].submenu.length === 1)) {
        subMenu = unRoom(subMenu);
    }
    logs('subMenu New = ' + JSON.stringify(subMenu));
    return subMenu;
}

/*** unRoom ***/
function unRoom(subMenu) {
    logs('ВЫЗОВ ФУНКЦИИ unRoom(subMenu) из ' + arguments.callee.caller.name);
    logs('subMenu = ' + JSON.stringify(subMenu));
    var roomMenuItem = subMenu.pop();
    roomMenuItem.submenu[0].name = roomMenuItem.name;
    roomMenuItem.submenu[0].submenu = unRoomLevel(roomMenuItem.submenu[0].submenu, 0);
    logs('subMenu new = ' + JSON.stringify(roomMenuItem.submenu[0].submenu));
    subMenu.push(roomMenuItem.submenu[0])
    return subMenu;
}

/*** unRoomLevel ***/
function unRoomLevel(subMenu, level) {
    logs('ВЫЗОВ ФУНКЦИИ unRoomLevel(subMenu) из ' + arguments.callee.caller.name);
    logs('subMenu = ' + JSON.stringify(subMenu));
    logs('level = ' + JSON.stringify(level));
    for (var subMenuItem of subMenu) {
        logs('subMenuItem.name = ' + JSON.stringify(subMenuItem.name));
        var newIndex = getIndex(subMenuItem.name).split('.');
        logs('oldIndex = ' + JSON.stringify(newIndex));
        newIndex.splice(-2 - level, 1);
        logs('newIndex = ' + JSON.stringify(newIndex));
        subMenuItem.name =  newIndex.join('.') + '-' + skipIndex(subMenuItem.name);
        if (subMenuItem.hasOwnProperty('submenu') && (subMenuItem.submenu.length > 0)) {
            subMenuItem.submenu = unRoomLevel(subMenuItem.submenu, level + 1);
        }
    }
    return subMenu;
}

/*** processObjects ***/
function processObjects(objMask, objRole, objFunc, objCB) {
    logs('ВЫЗОВ ФУНКЦИИ processObjects(objMask, objRole, objFunc, objCB) из ' + arguments.callee.caller.name);
    logs('objMask = ' + JSON.stringify(objMask));
    logs('objRole = ' + JSON.stringify(objRole));
    logs('objFunc = ' + JSON.stringify(objFunc));
    logs('objCB = ' + JSON.stringify(objCB));
    const listRooms = getEnums('rooms');
    for (let currRoom of listRooms) {
        logs('currRoom = ' + JSON.stringify(currRoom));
        $('state[id=' + objMask + '][role=' + objRole + '](functions=' + objFunc + ')(rooms=' + currRoom.id.split('.').pop() + ')').each( function (id) {
            objCB (id, currRoom);
        } );
    }
}


/*** reportGenerator ***/
function reportGenerator(menuObject) {
    logs('ВЫЗОВ ФУНКЦИИ reportGenerator(menuObject) из ' + arguments.callee.caller.name);
    logs('menuObject = ' + JSON.stringify(menuObject));
    if ((typeof menuObject === 'object') && (menuObject.hasOwnProperty('state'))) {
        var maxLeftLen = 15;
        const maxRightLen = 8;
        const idPrefix = menuObject.state.split('.').slice(0,-1).join('.');
        var textStatus = '';
        var text = '';
        if (submenuParams[menuObject.type].hasOwnProperty('statusitems') && submenuParams[menuObject.type]['statusitems'].hasOwnProperty('val')) {
            const currState = getState(menuObject.state);
            textStatus += submenuParams[menuObject.type]['statusitems']['val']['prefix'].padEnd(maxLeftLen) + ' : ' + submenuParams[menuObject.type]['statusitems']['val'][currState.val];
            if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('ack')) {
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['ack'].padEnd(maxLeftLen) + ' : ' + (currState.ack ? 'Да' : 'Нет');
            }
            if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('lc')) {
                const lastChanged = new Date(currState.lc);
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['lc'].padEnd(maxLeftLen) + ' : ' + lastChanged.toLocaleString(options.locale);
            }
            if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('ts')) {
                const timeStamp = new Date(currState.ts);
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['ts'].padEnd(maxLeftLen) + ' : ' + timeStamp.toLocaleString(options.locale);
            }
        }
        maxLeftLen = 20;
        for (const [state, name] of Object.entries(submenuParams[menuObject.type]['reportitems'])) {
            if (existsObject(idPrefix + state)) {
                text += (text.length > 0 ? '\r\n' : '') + name.padEnd(maxLeftLen) + ' : ';
                const currObject = getObject(idPrefix + state);
                logs('currObject = ' + JSON.stringify(currObject));
                if (existsState(idPrefix + state)) {
                    const currState = getState(idPrefix + state);
                    logs('currState = ' + JSON.stringify(currState));
                    if ((currObject.common.type === 'boolean') && (typeof currState.val === 'boolean')) {
                        text += currState.val ? submenuParams[menuObject.type]['icons']['on'].padStart(maxRightLen-1) : submenuParams[menuObject.type]['icons']['off'].padStart(maxRightLen-1);
                    }
                    else if ((currObject.common.type === 'number') && (typeof currState.val === 'number')) {
                        text += currState.val.toFixed(2).padStart(maxRightLen) + ' ' + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : '');
                    }
                    else if (typeof currState.val === 'string') {
                        text += currState.val.padStart(maxRightLen) + ' ' + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : ''); 
                    }
                }
                else {
                    if (currObject.common.type === 'boolean') {
                        text += submenuParams[menuObject.type]['icons']['off'].padStart(maxRightLen-1);
                    }
                    else if (currObject.common.type === 'number') {
                        text += (0).toFixed(2).padStart(maxRightLen)  + ' ' + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : '');
                    }
                }
            }
        }
        text = '<code>' + textStatus + (((textStatus.length > 0) && (text.length > 0)) ? '\r\n' : '') + text  + '</code>';
    };
    return text;
}



/*** Environments ***/
function Environments(menuObject) {
    logs('ВЫЗОВ ФУНКЦИИ Environments(menuObject) из ' + arguments.callee.caller.name);
    logs('menuObject = ' + JSON.stringify(menuObject));
    var text = '';
    if ((typeof menuObject === 'object') && (menuObject.hasOwnProperty('param'))) {
        var maxLength = 0;
        $('state[0_userdata.0.rooms.*.localNames](functions=localization)').each(function (id) {
            //logs('id = ' + id);
            const currentLength = getState(id).val.split(',')[getDeclIndex('inside')].length;
            //logs("maxLength = " + maxLength + " currentLength = " + currentLength);
            maxLength = currentLength > maxLength ? currentLength : maxLength;
        });
        const report = '- ';
        $('[role=value.' + menuObject.param + '](functions=environment)').each(function (id) {
            //logs('id = ' + id);
            const currObject = getObject(id, 'rooms');
            logs('currObject = ' + JSON.stringify(currObject))
            text += text ? '\r\n' : '<code>'
            text += report + (getRoomName(currObject['enumIds'][0], currObject['enumNames'][0],'inside') + ':').padEnd(maxLength+1) + ' ';
            logs('getState(' + id + ') = ' + JSON.stringify(getState(id))+ JSON.stringify(currObject.common.unit));
            text += getState(id).val.toFixed(2).padStart(6,' ') + ' ' + currObject.common.unit;
            //logs('Text = ' + text);
        });
        text += '</code>'
    }
    return text;
}

/////////// ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ КОНЕЦ /////////////


////////////////////////////////////////////////////////////////
////////////////////////// МАГИЯ ///////////////////////////////
////////////////////////////////////////////////////////////////

/*** doMenuItem ***/
function doMenuItem(user, cmd) {
    logs('ВЫЗОВ ФУНКЦИИ doMenuItem(user, cmd) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('cmd = ' + JSON.stringify(cmd));
    var timer;
    var cmdPos = getItemPos(cmd);
    logs('cmdPos = ' + JSON.stringify(cmdPos));
    const cmdItem = getMenuItem(cmdPos.concat(addMenuIndex(menu)));
    logs('cmdItem = ' + JSON.stringify(cmdItem));
    if((cmdItem.submenu.length === 0) && cmdItem.hasOwnProperty('state') && ! cmdItem.hasOwnProperty('function')){
        const [currState, possibleValue] = cmdItem.state.split(':');
        var currObject = getObject(currState);
        logs('currObject = ' + JSON.stringify(currObject));
        var role = currObject.common.role;
        if (currObject.common.write) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                showMsg('Ошибка! нет ответа', user);
                cmdPos = cmdPos.slice(0, cmdPos.length-1);
                showMenu(user, cmdPos, cmdItem);
            }, 4000);
            if(currObject.common.type === 'boolean'){
                setState(currState, !getState(currState).val, function cb(){
                    clearTimeout(timer);
                    cmdPos = cmdPos.slice(0, cmdPos.length-1);
                    showMsg('Успешно!', user);
                    showMenu(user, cmdPos);
                    logs('currState.val = ' + getState(currState).val);
                });
            } else {
                if ((currObject.common.type === 'string') && (currObject.common.hasOwnProperty('states')) && ! ( possibleValue === undefined) ) {
                    logs('possibleValue = ' + JSON.stringify(possibleValue));
                    if (getState(currState).val !== possibleValue) {
                        setState(currState, possibleValue, function cb(){
                            clearTimeout(timer);
                            cmdPos = cmdPos.slice(0, cmdPos.length-1);
                            showMsg('Успешно!', user);
                            showMenu(user, cmdPos);
                            logs('currState.val = ' + getState(currState).val);
                        });
                    }
                    else {
                        clearTimeout(timer);
                    }
                }
                else {
                    logs('НЕ ВЕРНЫЙ ТИП ОБЬЕКТА');
                    showMsg('Не верный тип обьекта', user);
                }
            }
        }
        else {
            clearTimeout(timer);
            cmdPos = cmdPos.slice(0, cmdPos.length-1);
            showMenu(user, cmdPos, cmdItem);
            logs('Объект ' + cmdItem.state + ' только для чтения!');
        }
    } else {
        return showMenu(user, cmdPos, cmdItem);
    }

}

/*** showMenu ***/
function showMenu(user, itemPos, menuItem) {
    logs('ВЫЗОВ ФУНКЦИИ showMenu(user, itemPos, menuItem) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('itemPos = ' + JSON.stringify(itemPos));
    logs('menuItem = ' + JSON.stringify(menuItem));
    var menuBase = addMenuIndex(menu);
    var menuRows = {
        menutext: (menuBase.icon ? menuBase.icon + ' ':'') + skipIndex(menuBase.name),
        state: '',
        backIndex: getIndex(menuBase.name),
        buttons: []
    };
    var subMenuPos = itemPos.concat([]);
    logs('itemPos = ' + JSON.stringify(itemPos));
    logs('subMenuPos = ' + JSON.stringify(subMenuPos));
    logs('menuBase = ' + JSON.stringify(menuBase));
    menuRows = getMenuRow(Object.assign({}, menuBase), subMenuPos, menuRows);
    logs('menuRows = ' + JSON.stringify(menuRows));
    if(itemPos.length > 0){
        menuRows.buttons = splitMenu(menuRows.buttons);
        var lastRow = [{ text: options.backText, callback_data: options.backCmd + menuRows.backIndex + '-' }];
        if (options.showHome) {
            lastRow.push({ text: options.homeText, callback_data: options.homeCmd });
        }
        lastRow.push({ text: options.closeText, callback_data: options.closeCmd });
        menuRows.buttons.push(lastRow);
        logs('menuRows.buttons = ' + JSON.stringify(menuRows.buttons));
        if ( menuRows.hasOwnProperty('function') && (typeof menuRows.function === "function") ) {
            logs('itemPos = ' + JSON.stringify(itemPos));
            if (menuItem === undefined) {
                menuItem = getMenuItem(itemPos.concat(menuBase));
            }
            const resultText = menuRows.function(menuItem);
            menuRows.menutext += resultText.length > 0 ? '\r\n' + resultText : '';
        }
        logs('menuRows 2 = ' + JSON.stringify(menuRows));
        sendTo(options.telegram, {
            user: getUser(user),
            text: menuRows.menutext,
            parse_mode: 'HTML',
            editMessageText: {
                options: {
                    chat_id: user,
                    message_id: getStateCached(user, 'botSendMessageId'),
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: menuRows.buttons,
                    }
                }
            }
        });
    } else {
        menuRows.buttons = splitMenu(menuRows.buttons);
        menuRows.buttons.push([{ text: options.closeText, callback_data: options.closeCmd }]);
        if (getStateCached(user, 'menuOn')) {
            logs('menuRows 3 ' + JSON.stringify(menuRows));
            sendTo(options.telegram, {
                user: getUser(user),
                text: menuRows.menutext,
                parse_mode: 'HTML',
                editMessageText: {
                    options: {
                        chat_id: user,
                        message_id: getStateCached(user, 'botSendMessageId'),
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: menuRows.buttons,
                        }
                    }
                }
            });
        }
        else {
            //closeMenu(user);
            logs('menuRows 4 ' + JSON.stringify(menuRows));
            sendTo(options.telegram, {
                user: getUser(user),
                text: menuRows.menutext,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: menuRows.buttons,
                }
            });
            setStateCached(user, 'menuOn', true);
        }
    }
}

/*** getMenuRow ***/
function getMenuRow(subMenuRow, subMenuPos, menuRows) {
    logs('ВЫЗОВ ФУНКЦИИ getMenuRow(subMenuRow, subMenuPos, menuRows) из ' + arguments.callee.caller.name);
    logs('subMenuRow = ' + JSON.stringify(subMenuRow));
    logs('subMenuPos = ' + JSON.stringify(subMenuPos));
    logs('menuRows = ' + JSON.stringify(menuRows));
    var n;
    if (typeof subMenuRow.submenu === 'function') {
        subMenuRow.submenu = subMenuRow.submenu(subMenuRow);
    }
    if(subMenuPos.length > 0){
        menuRows.menutext += ' > ' + getItemIcon(subMenuRow.submenu[subMenuPos[0]]) + skipIndex(subMenuRow.submenu[subMenuPos[0]].name);
        n = subMenuPos.shift();
        logs('(1) subMenuRow.submenu[' + n + '] = ' + JSON.stringify(subMenuRow.submenu[n]));
        menuRows.function = subMenuRow.submenu[n].hasOwnProperty('function') ? subMenuRow.submenu[n].function : undefined;
        menuRows.state = subMenuRow.submenu[n].hasOwnProperty('state') ? subMenuRow.submenu[n].state : undefined;
        menuRows.type = subMenuRow.submenu[n].hasOwnProperty('type') ? subMenuRow.submenu[n].type : undefined;
        menuRows.funcEnum = subMenuRow.submenu[n].hasOwnProperty('funcEnum') ? subMenuRow.submenu[n].funcEnum : undefined;
        if (subMenuPos.length > 0) {
            menuRows.backIndex = getIndex(subMenuRow.submenu[n].name);
        }
        return getMenuRow(subMenuRow.submenu[n], subMenuPos, menuRows);
    } else {
        for (const subMenuItem of subMenuRow.submenu) {
            menuRows.buttons.push({
                text: getItemIcon(subMenuItem) + ' ' + skipIndex(subMenuItem.name),
                callback_data: options.menuPrefix + subMenuItem.name
            });
        }
        return menuRows;
    }
}

/*** getItemIcon ***/
function getItemIcon(subMenuRowItem) {
    logs('ВЫЗОВ ФУНКЦИИ getItemIcon(subMenuRowItem) из ' + arguments.callee.caller.name);
    logs('subMenuRowItem = ' + JSON.stringify(subMenuRowItem));
    var icon;
    if ((typeof subMenuRowItem.icons === 'object')) {
        if(subMenuRowItem.hasOwnProperty('state') && existsState(subMenuRowItem.state)) {
            icon = getState(subMenuRowItem.state).val ? subMenuRowItem.icons.on : subMenuRowItem.icons.off;
        } else {
            icon = subMenuRowItem.icon;
        }
    }
    else {
        icon = subMenuRowItem.icon ? subMenuRowItem.icon : '' ;
    }
    return icon;
}

/*** getItemPos ***/
function getItemPos(cmd) {
    logs('ВЫЗОВ ФУНКЦИИ getItemPos(cmd) из ' + arguments.callee.caller.name);
    logs('typeof cmd = ' + (typeof cmd));
    logs('cmd = ' + JSON.stringify(cmd));
    if (typeof cmd === 'string') {
        const cmdIndex = getIndex(cmd);
        if ( cmdIndex.length === 0) {
            return [];
        }
        else {
            return cmdIndex.split('.');
        }
    }

}

/*** getMenuItem ***/
function getMenuItem(subMenuPos) {
    logs('ВЫЗОВ ФУНКЦИИ getMenuItem(subMenuPos) из ' + arguments.callee.caller.name);
    logs('subMenuPos = ' + JSON.stringify(subMenuPos));
    if (subMenuPos.length > 1) {
        if (subMenuPos[subMenuPos.length - 1] !== undefined) {
            if (typeof subMenuPos[subMenuPos.length - 1].submenu === 'function') {
                const newSubMenu = subMenuPos[subMenuPos.length - 1].submenu(getIndex(subMenuPos[subMenuPos.length - 1].name));
                subMenuPos[subMenuPos.length - 1] = newSubMenu.length > subMenuPos[0] ? newSubMenu[subMenuPos[0]] : undefined;
            }
            else {
                subMenuPos[subMenuPos.length - 1] = subMenuPos[subMenuPos.length - 1].submenu.length > subMenuPos[0] ? subMenuPos[subMenuPos.length - 1].submenu[subMenuPos[0]] : undefined;
            }
        }
        subMenuPos.shift();
        return getMenuItem(subMenuPos);
    }
    else if (subMenuPos.length > 0) {
        return subMenuPos[0];
    }
    else {
        return undefined;
    }
}


/*** clearMessage ***/
function clearMessage(user, isUserMessage) {
    logs('ВЫЗОВ ФУНКЦИИ clearMessage(user, isUserMessage) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('isUserMessage = ' + JSON.stringify(isUserMessage));
    logs('messageid = ' + isUserMessage ? getStateCached(user, 'messageId') : getStateCached(user, 'botSendMessageId'));
    sendTo(options.telegram, {
        user: getUser(user),
        deleteMessage: {
            options: {
                chat_id: user,
                message_id: isUserMessage ? getStateCached(user, 'messageId') : getStateCached(user, 'botSendMessageId'),
            }
        }
    });
}

/*** closeMenu ***/
function closeMenu(user) {
    logs('ВЫЗОВ ФУНКЦИИ closeMenu(user) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    clearMessage(user, false);
    setStateCached(user, 'menuOn', false);
}

/*** splitMenu ***/
function splitMenu(menuArr) {
    logs('ВЫЗОВ ФУНКЦИИ splitMenu(menuArr) из ' + arguments.callee.caller.name);
    logs('menuArr = ' + JSON.stringify(menuArr));
    var i, j, resultArr = [];
    for (i = 0, j = menuArr.length; i < j; i += options.width) {
        resultArr.push(menuArr.slice(i, i + options.width));
    }
    return resultArr;
}

/*** showMsg ***/
function showMsg(text, user, showAlert) {
    logs('ВЫЗОВ ФУНКЦИИ showMsg(text, user, showAlert) из ' + arguments.callee.caller.name);
    logs('text = ' + JSON.stringify(text));
    logs('user = ' + JSON.stringify(user));
    logs('showAlert = ' + JSON.stringify(showAlert));
        if(options.showMsg){
        sendTo(options.telegram, {
            user: getUser(user),
            answerCallbackQuery: {
                text: text,
                showAlert: showAlert ? true:false
            }
        });
    }
}

/*** addMenuIndex ***/
function addMenuIndex(menuRow, indexPrefix) {
    logs('ВЫЗОВ ФУНКЦИИ addMenuIndex(menuRow) из ' + arguments.callee.caller.name);
    logs('menuRow = ' + JSON.stringify(menuRow));
    logs('indexPrefix = ' + JSON.stringify(indexPrefix));
    var newMenuRow;
    if (Array.isArray(menuRow)) {
        indexPrefix = indexPrefix.length > 0 ? indexPrefix + '.' : '';
        newMenuRow = [];
        for (const key of menuRow.keys()) {
            var newMenuRowItem = {};
            newMenuRowItem['name'] = indexPrefix + key + '-' + menuRow[key].name;
            if (menuRow[key].hasOwnProperty('state') ) {
                newMenuRowItem.state = menuRow[key].state;
            }
            if (menuRow[key].hasOwnProperty('icon') ) {
                newMenuRowItem.icon = menuRow[key].icon;
            }
            if (menuRow[key].hasOwnProperty('icons') ) {
                newMenuRowItem.icons = menuRow[key].icons;
            }
            if (menuRow[key].hasOwnProperty('type') ) {
                newMenuRowItem.type = menuRow[key].type;
            }
            if (menuRow[key].hasOwnProperty('funcEnum') ) {
                newMenuRowItem.funcEnum = menuRow[key].funcEnum;
            }
            if (menuRow[key].hasOwnProperty('function') ) {
                newMenuRowItem.function = menuRow[key].function;
            }
            if (menuRow[key].hasOwnProperty('param') ) {
                newMenuRowItem.param = menuRow[key].param;
            }
            if (Array.isArray(menuRow[key].submenu) && menuRow[key].submenu.length) {
                newMenuRowItem.submenu = addMenuIndex(menuRow[key].submenu, indexPrefix + key);
            }
            else if (typeof menuRow[key].submenu === 'function') {
                newMenuRowItem.submenu = menuRow[key].submenu(newMenuRowItem);
            }
            else {
                newMenuRowItem.submenu = menuRow[key].submenu;
            }
            newMenuRow.push(newMenuRowItem);
        }
    }
    else if ((typeof menuRow === 'object') && menuRow.hasOwnProperty('submenu')) {
        newMenuRow = {};
        newMenuRow.name = '-' + menuRow.name;
        newMenuRow.icon = menuRow.icon;
        newMenuRow.submenu = addMenuIndex(menuRow.submenu, '');
    }
    return newMenuRow;
}

/*** skipIndex ***/
function skipIndex(name) {
    logs('ВЫЗОВ ФУНКЦИИ skipIndex(name) из ' + arguments.callee.caller.name);
    logs('name = ' + JSON.stringify(name));
    const splitName = name.split('-',2);
    if (splitName.length === 1) {
        return splitName[0];
    }
    else {
        return splitName[1];
    }
}

/*** getIndex ***/
function getIndex(name) {
    logs('ВЫЗОВ ФУНКЦИИ getIndex(name) из ' + arguments.callee.caller.name);
    logs('name = ' + JSON.stringify(name));
    const splitName = name.split('-',2);
    if (splitName.length === 1) {
        return '';
    }
    else {
        return splitName[0];
    }
}

/*** getDeclIndex ***/
function getDeclIndex(strDecl) {
    logs('ВЫЗОВ ФУНКЦИИ getDeclIndex(strDecl) из ' + arguments.callee.caller.name);
    logs('strDecl = ' + JSON.stringify(strDecl));
    if (strDecl === 'basic') {
        return 1;
    }
    else if(strDecl === 'inside') {
        return 2;
    }
    else if(strDecl === 'enter') {
        return 3;
    }
    else if(strDecl === 'exit') {
        return 4;
    }
    return 0;
}


/*** getRoomName ***/
function getRoomName(roomEnum, roomNames, roomDecl) {
    logs('ВЫЗОВ ФУНКЦИИ getRoomName(roomEnum) из ' + arguments.callee.caller.name);
    logs('roomEnum = ' + JSON.stringify(roomEnum));
    logs('roomNames = ' + JSON.stringify(roomNames));
    logs('roomDecl = ' + JSON.stringify(roomDecl));
    roomEnum = roomEnum.split('.').pop();
    const roomState = $('(rooms=' + roomEnum + ')(functions=localization)').getState();
    logs('roomState = ' + JSON.stringify(roomState));
    if ((roomState === undefined) || (roomState === null)) {
        logs('options.language = ' + JSON.stringify(options.language) + ' ' + roomNames["ru"]);
        if (typeof roomNames === 'string') {
            return roomNames;
        } else if (roomNames[options.language] === undefined) {
            return roomNames["en"];
        }
        else {
            return roomNames[options.language] ;
        }
    }
    else {
        return roomState.val.split(',')[getDeclIndex(roomDecl)];
    }
}

/*** logs ***/
function logs(txt, debug) {
    if ((options.debug) || (debug !== undefined)){
        log(arguments.callee.caller.name + ': ' + txt);
    }
}

/*** getUser ***/
function getUser(user) {
    logs('ВЫЗОВ ФУНКЦИИ getUser(user) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    var name = getStateCached(user, 'user');
    logs('name = ' + JSON.stringify(name));
    logs('type = ' + typeof(name));
    if ((name === undefined) && (existsState(options.telegram + ".communicate.users"))) {
        name = JSON.parse(getState(options.telegram + ".communicate.users").val);
        logs('communicate.users = ' + name);
        if (name.hasOwnProperty(user)) {
            name = name[user];
        }
    }
    if (name !== undefined) {
        if (name.hasOwnProperty('userName')) {
            return name.userName;
        }
        else if (name.hasOwnProperty('firstName')) {
            return name.firstName;
        }
    }
    return '';
}

/*** callback ***/
function callback(user, cmd) {
    logs('ВЫЗОВ ФУНКЦИИ callback(user, cmd) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('cmd = ' + cmd);
    if(options.menucall.indexOf(cmd) >= 0){
        if (options.clearmenucall) {
            clearMessage(user, true);
        }
        setStateCached(user, 'menuOn', false);
        showMenu(user, []);
    } else {
        if(cmd === options.closeCmd){
            closeMenu(user);
        } else if(cmd.indexOf(options.backCmd) === 0){
            showMenu(user, getItemPos(cmd.replace(options.backCmd,'')));
        } else if(cmd === options.homeCmd){
            showMenu(user, []);
        } else if (cmd.indexOf(options.menuPrefix) === 0) {
            doMenuItem(user, cmd.replace(options.menuPrefix,''))
        }
    }
}




/*** subscribe on Telegram ***/
on({id: options.telegram + '.communicate.request', change: 'any'}, function  requestSubscribe(obj) {
    logs('ВЫЗОВ ФУНКЦИИ requestSubscribe(obj)');
    logs('obj = ' + JSON.stringify(obj));
    var cmd = (obj.state.val.substring(obj.state.val.indexOf(']')+1)).toLowerCase();
    if (cmd.length > 0) {
        const userid = getState(options.telegram + ".communicate.requestChatId").val;
        const messageId = getState(options.telegram + ".communicate.requestMessageId").val;
        if (userid){
            var name = getState(options.telegram + ".communicate.users").val;
            try {
                name = JSON.parse(name);
            } catch (err) {
                logs("Ошибка парсинга - " + JSON.stringify(err));
            }
            if ((options.users_id.indexOf(userid) >= 0) || (options.users_id.indexOf(userid.toString()) >= 0)){
                logs('Пользователь - ' + name[userid].firstName + '(' + name[userid].userName +') с id - ' + userid + '; Отправленная команда - ' + cmd + 'с ид = ' + messageId);
                setStateCached(userid, 'user', JSON.stringify(name[userid]));
                setStateCached(userid, 'messageId', messageId);
                callback(userid, cmd);
            }  else {
                log('Доступ запрещен. Пользователя - ' + name[userid] + '(' + name[userid].userName +') с id - ' + userid + ' нет в списке доверенных.' );
            }
        }
    }
});

/*** subscribe on Telegram bot activityes  ***/
on({id: options.telegram + '.communicate.botSendMessageId', change: 'any'}, function answerSubscribeMessage(obj) {
    logs('ВЫЗОВ ФУНКЦИИ answerSubscribeMessage(obj)');
    logs('obj = ' + JSON.stringify(obj));
    const userid = getState(options.telegram + ".communicate.botSendChatId").val;
    logs('userid = ' + JSON.stringify(userid));
    setStateCached(userid, 'botSendMessageId', obj.state.val);
});
on({id: options.telegram + '.communicate.botSendChatId', change: 'any'}, function answerSubscribeChat(obj) {
    logs('ВЫЗОВ ФУНКЦИИ answerSubscribeChat(obj)');
    logs('obj = ' + JSON.stringify(obj));
    const messageid = getState(options.telegram + ".communicate.botSendMessageId").val;
    logs('messageid = ' + JSON.stringify(messageid));
    setStateCached(obj.state.val, 'botSendMessageId', messageid);
});

initConfig();
