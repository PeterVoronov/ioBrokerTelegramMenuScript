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
    menucall:   ['Меню', 'меню', '/menu'],      // Команда для вызова меню
    menuPrefix: 'menu-',                // Префикс для отправляемых комманд при нажатии на кнопку, можно не менять
    showHome:   true,                   // Показывать кнопку Домой
    showMsg:    true,                   // Показывать вплывающие сообщения
    language:   "ru",                   // Язык общения
    locale:     "ru-RU",                // Язык общения    
    debug:      false                    // Режим отладки, подробное логирование
};

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
    menucall:   ['Меню', 'меню', '/menu'],      // Команда для вызова меню
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
            type: 'door',
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
            rooms : true,
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
                    '.consumer_overloaded'  : 'Превышена нагрузка', 
                    '.current'              : 'Ток нагрузки', 
                    '.voltage'              : 'Напряжение в сети', 
                    '.temperature'          : 'Температура внутри', 
                    '.load_power'           : 'Текущее потребление',
                    '.consumption'          : 'Всего потреблено', 
                    '.link_quality'         : 'Уровень сигнала'
                },
            statusitems :
                {
                }
        },
    'door' :
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
                        true : 'Открыта',
                        false : 'Закрыта'
                    }
                }                
        },
};


/*** submenuGenerator ***/
function submenuGenerator(upperMenuItem) {
    logs('ВЫЗОВ ФУНКЦИИ submenuGenerator(upperMenuItem) из ' + arguments.callee.caller.name);
    logs('upperMenuItem = ' + JSON.stringify(upperMenuItem));
    var upperMenuIndex = getIndex(upperMenuItem.name);
    var subMenu = [];
    var currId = 0;
    var lastRoom = '';
    var roomIndex = -1;
    var roomMenuIndex = '';
    var roomMenuItem;
    var menuItemName = '';
    processObjects(submenuParams[upperMenuItem.type]['mask'], submenuParams[upperMenuItem.type]['role'], upperMenuItem.type, function plugsCB (id, room) {
        logs('ВЫЗОВ ФУНКЦИИ plugsCB(id, room) из ' + arguments.callee.caller.name);
        logs('id = ' + JSON.stringify(id));
        logs('room = ' + JSON.stringify(room));
        logs('lastRoom = ' + JSON.stringify(lastRoom));
        logs('roomIndex = ' + JSON.stringify(roomIndex));
        logs('roomMenuIndex = ' + JSON.stringify(roomMenuIndex));
        logs('roomMenuItem = ' + JSON.stringify(roomMenuItem));
        logs('menuItemName = ' + JSON.stringify(menuItemName));
        logs('subMenu = ' + JSON.stringify(subMenu));
        const idPrefix = id.split('.').slice(0,-1).join('.');

        if ((lastRoom === room.id)  || submenuParams[upperMenuItem.type]['rooms']) {
            if ((roomIndex < 0) && (lastRoom === room.id)  && submenuParams[upperMenuItem.type]['rooms']) {
                roomIndex++;
                roomIndex++;
                currId--; 
            } else if (lastRoom !== room.id) {
                roomIndex = -1;
            }
            if (roomIndex < 0) {
                if (lastRoom === room.id) {
                    currId--; 
                }
                roomMenuItem = {
                                    name: upperMenuIndex + '.' + currId + '-' + getRoomName(room.id, room.name,'Main'),
                                    icon: upperMenuItem.icon,
                                    submenu: []
                                };
                roomIndex++;
                if (lastRoom === room.id) {
                    var tempItem = subMenu.pop();
                    tempItem.name = upperMenuIndex + '.' + currId + '.' + roomIndex + '-' + getObject(tempItem.state.split('.').slice(0,-1).join('.')).common.name;
                    for (var i = 0; i < tempItem.submenu.length; i++) {
                        tempItem.submenu[i].name =  upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + i + '-' + skipIndex(tempItem.submenu[i].name);
                    }
                    roomMenuItem.submenu.push(tempItem);
                    roomIndex++;
                }
                subMenu.push(roomMenuItem);
            }
            roomMenuIndex = '.' + roomIndex;
            menuItemName = getObject(idPrefix).common.name;
        }
        else {
            roomIndex = -1;
            roomMenuIndex = '';
            menuItemName = getRoomName(room.id, room.name,'Main');
        }
        const menuItem = {
                            name: upperMenuIndex + '.' + currId + roomMenuIndex + '-' + menuItemName,
                            state: id,
                            type: upperMenuItem.type,
                            icons: submenuParams[upperMenuItem.type]['icons'],
                            submenu: []
                        };
        if (submenuParams[upperMenuItem.type]['report'] !== 'undefined' ){
            menuItem.function = submenuParams[upperMenuItem.type]['report'];
        }
        var currSubId = 0;
        for (const [state, name] of Object.entries(submenuParams[upperMenuItem.type]['menuitems'])) {
            if (existsState(idPrefix + state)) {
                menuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + roomMenuIndex + '.' + currSubId + '-' + name,
                                    state: idPrefix + state,
                                    icons: submenuParams[upperMenuItem.type]['icons'],
                                    submenu: []
                                })
                currSubId++;
            }
        }        
        if (lastRoom === room.id) {
            roomMenuItem.submenu.push(menuItem)
            roomIndex++;
        }
        else {
            if (submenuParams[upperMenuItem.type]['rooms']) {
                roomMenuItem.submenu.push(menuItem)
                roomIndex = -1;
                roomMenuIndex = '';
            }
            else {
                subMenu.push(menuItem);
            }
            currId++;
        }
        lastRoom = room.id;
    })
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
            text += (text.length > 0 ? '\r\n' : '') + name.padEnd(maxLeftLen) + ' : ';
            if (existsObject(idPrefix + state)) {
                const currObject = getObject(idPrefix + state);
                logs('currObject = ' + JSON.stringify(currObject));
                if (existsState(idPrefix + state)) {
                    const currState = getState(idPrefix + state);
                    logs('currState = ' + JSON.stringify(currState));
                    if (currObject.common.type === 'boolean') {
                        text += currState.val ? submenuParams[menuObject.type]['icons']['on'].padStart(maxRightLen-1) : submenuParams[menuObject.type]['icons']['off'].padStart(maxRightLen-1);
                    } 
                    else if (currObject.common.type === 'number') {
                        text += currState.val.toFixed(2).padStart(maxRightLen) + ' ' + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : '');
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
        logs('ОБЬЕКТ = ' + JSON.stringify(getObject(cmdItem.state)));
        var obj = getObject(cmdItem.state);
        var role = obj.common.role;
        if (obj.common.write) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                showMsg('Ошибка! нет ответа', user);
                cmdPos = cmdPos.slice(0, cmdPos.length-1);
                showMenu(user, cmdPos, cmdItem);
            }, 4000); 
            if(obj.common.type === 'boolean'){
                setState(cmdItem.state, !getState(cmdItem.state).val, function cb(){
                    clearTimeout(timer);
                    cmdPos = cmdPos.slice(0, cmdPos.length-1);
                    showMsg('Успешно!', user);
                    showMenu(user, cmdPos);
                    logs('СОСТОЯНИЕ = ' + getState(cmdItem.state).val);
                });
            } else {
                logs('НЕ ВЕРНЫЙ ТИП ОБЬЕКТА');
                showMsg('Не верный тип обьекта', user);
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
        if (menuRows.hasOwnProperty('function') && (typeof menuRows.function === "function")) {
            logs('itemPos = ' + JSON.stringify(itemPos));
            if (menuItem === undefined) {
                menuItem = getMenuItem(itemPos.concat(menuBase));
            }
            const resultText = menuRows.function(menuItem);
            menuRows.menutext += resultText.length > 0 ? '\r\n' + resultText : '';
        }
        logs('menuRows 2 = ' + JSON.stringify(menuRows));
        sendTo(options.telegram, {
            user: user,
            text: menuRows.menutext,
            parse_mode: 'HTML',
            editMessageText: {
                options: {
                    chat_id: getState(options.telegram + ".communicate.requestChatId").val, 
                    message_id: getState(options.telegram + ".communicate.requestMessageId").val,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: menuRows.buttons,
                    }
                }
            }
        });
    } else {
        closeMenu(user);
        menuRows.buttons = splitMenu(menuRows.buttons);
        menuRows.buttons.push([{ text: options.closeText, callback_data: options.closeCmd }]);
        logs('menuRows 4 ' + JSON.stringify(menuRows));
        sendTo(options.telegram, {
            user: user,
            text: menuRows.menutext,
            parse_mode: 'HTML',            
            reply_markup: {
                inline_keyboard: menuRows.buttons,
            }
        }); 
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
        if(subMenuRow.submenu[n].hasOwnProperty('function')) {
            menuRows.function = subMenuRow.submenu[n].function;
        }
        if(subMenuRow.submenu[n].hasOwnProperty('state')) {
            menuRows.state = subMenuRow.submenu[n].state;
        }
        if(subMenuRow.submenu[n].hasOwnProperty('type')) {
            menuRows.type = subMenuRow.submenu[n].type;
        }                
        if (subMenuPos.length > 0) { 
            menuRows.backIndex = getIndex(subMenuRow.submenu[n].name);
        }
        return getMenuRow(subMenuRow.submenu[n], subMenuPos, menuRows);
    } else {
        for (var i = 0; i < subMenuRow.submenu.length; i++) {
            menuRows.buttons.push({
                text: getItemIcon(subMenuRow.submenu[i]) + ' ' + skipIndex(subMenuRow.submenu[i].name),
                callback_data: options.menuPrefix + subMenuRow.submenu[i].name
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

/*** closeMenu ***/
function closeMenu(user) {  
    logs('ВЫЗОВ ФУНКЦИИ closeMenu(user) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    sendTo(options.telegram, {
        user: user,
        deleteMessage: {
            options: {
                chat_id: getState(options.telegram + ".communicate.requestChatId").val, 
                message_id: getState(options.telegram + ".communicate.requestMessageId").val,
            }
        }
    });
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
            user: user,
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
function logs(txt) {
    if(options.debug){
        log(arguments.callee.caller.name + ': ' + txt);
    }
}

/*** callback ***/
function callback(user, cmd) {  
    logs('ВЫЗОВ ФУНКЦИИ callback(user, cmd) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));    
    logs('cmd = ' + cmd);
    if(options.menucall.indexOf(cmd) >= 0){
        showMenu(user, []);
    } else {
        if(cmd === options.closeCmd){
            closeMenu(user);
        } else if(cmd.indexOf(options.backCmd) === 0){
            showMenu(user, getItemPos(cmd.replace(options.backCmd,'')));
        } else if(cmd === options.homeCmd){
            showMenu(user, []);
        } else {
            doMenuItem(user, cmd.replace(options.menuPrefix,''))
        }
    }
}

/*** subscribe on Telegram ***/
on({id: options.telegram + '.communicate.request', change: 'any'}, function (obj) {   
    var cmd = (obj.state.val.substring(obj.state.val.indexOf(']')+1)).toLowerCase(); 
    var userid = getState(options.telegram + ".communicate.requestChatId").val;
    if (userid){
        var name = getState(options.telegram + ".communicate.users").val;
        try {
            name = JSON.parse(name);
        } catch (err) {
            logs("Ошибка парсинга - " + JSON.stringify(err));
        }
        if (options.users_id.indexOf(userid) >= 0){
            logs('Пользователь - ' + name[userid].firstName + '(' + name[userid].userName +') с id - ' + userid + '; Отправленная команда - ' + cmd);
            callback(name[userid].userName, cmd);
        }  else {
            log('Доступ запрещен. Пользователя - ' + name[userid] + '(' + name[userid].userName +') с id - ' + userid + ' нет в списке доверенных.' );
        }
    }
});

