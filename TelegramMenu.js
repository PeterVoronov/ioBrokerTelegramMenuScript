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
    menucall:   ['меню', '/menu'],      // Команда для вызова меню
    menuPrefix: 'menu-',                // Префикс для отправляемых комманд при нажатии на кнопку, можно не менять
    showHome:   true,                   // Показывать кнопку Домой
    showMsg:    true,                   // Показывать вплывающие сообщения
    debug:      true                    // Режим отладки, подробное логирование
};

/////////// МЕНЮ НАЧАЛО ////////////
var menu = {
    name: 'Главное меню',
    icon: '⚙️',
    submenu: [
        { // Сценарии
            name: 'Сценарии',
            icon: '⚙️',
            submenu: [
                {
                    name: 'ТВ',
                    state: 'javascript.0.Scenes.TV',
                    icons: {on: '📺', off: '✖️'},
                    submenu: []
                },
                {
                    name: 'Кино',
                    state: 'javascript.0.Scenes.Moves',
                    icons: {on: '📽', off: '✖️'},
                    submenu: []
                },
                {
                    name: 'Спать',
                    state: 'javascript.0.Scenes.Sleep',
                    icons: {on: '🛌', off: '✖️'},
                    submenu: []
                },
                {
                    name: 'Уборка',
                    state: 'javascript.0.Scenes.Сleaning',
                    icons: {on: '🤦', off: '✖️'},
                    submenu: []
                },
                {
                    name: 'Оповещение',
                    state: 'javascript.0.Scenes.sayOff',
                    icons: {on: '🔇', off: '🔊'},
                    submenu: []
                },
                {
                    name: 'Отпуск',
                    state: 'javascript.0.Scenes.Otpusk',
                    icons: {on: '📅', off: '✖️'},
                    submenu: []
                }
                ]
        },
        { // Освещение
            name: 'Освещение',
            icon: '💡',
            submenu: [
                {
                    name: 'Зал',
                    icon: '💡',
                    submenu: [
                        {
                            name: 'Основной 1',
                            state: 'mqtt.0.myhome.lighting.GuestRoom_main',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        },
                        {
                            name: 'Основной 2',
                            state: 'mqtt.0.myhome.lighting.GuestRoom_main2',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        },
                        {
                            name: 'Глазки',
                            state: 'mqtt.0.myhome.lighting.GuestRoom_sec',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        }
                    ]
                },
                {
                    name: 'Кухня',
                    icon: '💡',
                    submenu: [
                        {
                            name: 'Основной',
                            state: 'mqtt.0.myhome.lighting.Kitchen_main',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        },
                        {
                            name: 'Глазки',
                            state: 'mqtt.0.myhome.lighting.Kitchen_sec',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        }
                    ]
                },
                {
                    name: 'Ванная',
                    icon: '🛀',
                    submenu: [
                        {
                            name: 'Основной',
                            state: 'mqtt.0.myhome.lighting.BathRoom_main',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        },
                        {
                            name: 'Зеркало',
                            state: 'mqtt.0.myhome.lighting.BathRoom_sec',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        }
                    ]
                },
                {
                    name: 'Коридор',
                    icon: '💡',
                    submenu: [
                        {
                            name: 'Основной',
                            state: 'mqtt.0.myhome.lighting.Hall_main',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        }
                    ]
                },
                {
                    name: 'Спальня',
                    icon: '💡',
                    submenu: [
                        {
                            name: 'Основной',
                            state: 'mqtt.0.myhome.lighting.BedRoom_main',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        },
                        {
                            name: 'Глазки',
                            state: 'mqtt.0.myhome.lighting.BedRoom_sec',
                            icons: {on: '💡', off: '✖️'},
                            submenu: []
                        }
                    ]
                },
            ]
        },
        { // Шторы
            name: 'Шторы',
            icon: '⚙️',
            submenu: [
                {
                    name: 'Кухня',
                    state: 'javascript.0.Rollet.Kitchen.Close',
                    icons: {on: '🌚', off: '🌞'},
                    submenu: []
                },
                {
                    name: 'Спальня',
                    state: 'javascript.0.Rollet.Bedroom.Close',
                    icons: {on: '🌚', off: '🌞'},
                    submenu: []
                }
            ]
        },
        { // Разное
            name: 'Разное',
            icon: '⚙️',
            submenu: [
                {
                    name: 'Компьютер',
                    state: 'javascript.0.GetAdmin.Power',
                    icons: {on: '🖥️', off: '✖️'}, 
                    submenu: []
                },
                {
                    name: 'Кондиционер',
                    state: 'haier.0.power',
                    icons: {on: '☑️', off: '✖️'},
                    submenu: []
                },
                {
                    name: 'Вода',
                    icon: '🚰',
                    submenu: [
                        {
                            name: 'Открыть',
                            state: 'mqtt.0.myhome.Aquastoroj.ButtonOpen',
                            icons: {on: '🔄', off: '⏺'},
                            submenu: []
                        },
                        {
                            name: ' ',
                            state: 'mqtt.0.myhome.Aquastoroj.open',
                            icons: {on: 'Открыто', off: 'Закрыто'},
                            submenu: []
                        },
                        {
                            name: 'Закрыть',
                            state: 'mqtt.0.myhome.Aquastoroj.ButtonClose',
                            icons: {on: '🔄', off: '⏺'},
                            submenu: []
                        }
                    ]
                }
            ]
        },
        { // Информация
            name: 'Информация',
            icon: 'ℹ️',
            submenu: [
                {
                    name: 'Температура',
                    state: Temperature,
                    icon: '🌡',
                    submenu: []
                },
                {
                    name: 'Влажность',
                    state: Humidity, // А можно вызвать функцию вот так
                    icon: '💦',
                    submenu: []
                }
            ]
        },
    ]
};
/////////// МЕНЮ КОНЕЦ ////////////

/////////// ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ НАЧАЛО /////////////

function Environments(environmentRole) {
    var maxLength = 0;
    $('state[0_userdata.0.rooms.*.localNames](functions=localization)').each(function (id) {
        //logs(id);
        const currentLength = getState(id).val.split(',')[2].length;
        //logs(" Max = " + maxLength + " current = " + currentLength);
        maxLength = currentLength > maxLength ? currentLength : maxLength;
    });
    var text = '';
    const report = '- ';
    $('[role=value.' + environmentRole + '](functions=environment)').each(function (id) {
        //logs(id);
        const object = getObject(id, 'rooms');
        //logs('ОБЬЕКТ = ' + JSON.stringify(object))
        const room = getObject(id, 'rooms')["enumIds"][0].split('.').pop();
        //logs('ОБЬЕКТ = ' + JSON.stringify(getObject(id, 'rooms')["enumIds"][0].split('.').pop()));
        text += text ? '\r\n' : '<code>'
        text += report + ($('(rooms=' + room + ')(functions=localization)').getState().val.split(',')[2] + ':').padEnd(maxLength+1) + ' ';
        //logs('ОБЬЕКТ = ' + JSON.stringify(getState(id).val)+ JSON.stringify(object.common.unit));
        text += getState(id).val.toString().padEnd(5,'0') + ' ' + object.common.unit;
        //logs(text);
    });    
    return text + '</code>';
}

function Temperature() {
    //var text = '';
    //text += '- Температура в спальне: ' + getState('mqtt.0.myhome.Bedroom.Temp_room').val + '';
    //text += '\r\n- Температура на кухне: ' + getState('mqtt.0.myhome.Kitchen.Temp_room').val + '';
    //return text;
    return Environments('temperature')
}

function Humidity() {
    //var text = '';
    //text += '- Влажность в спальне: ' + getState('mqtt.0.myhome.Bedroom.Humidity_room').val + '%';
    //text += '\r\n- Влажность на кухне: ' + getState('mqtt.0.myhome.Kitchen.Humidity_room').val + '%';
    //return text;
    return Environments('humidity')
}

/////////// ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ КОНЕЦ /////////////


////////////////////////////////////////////////////////////////
////////////////////////// МАГИЯ ///////////////////////////////
////////////////////////////////////////////////////////////////
function doMenuItem(user, cmd) {
    logs('ВЫЗОВ ФУНКЦИИ doMenuItem(user, cmd) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('cmd = ' + JSON.stringify(cmd));
    var timer;
    var cmdPos = getItemPos(cmd);
    logs('cmdPos = ' + JSON.stringify(cmdPos));
    const cmdItem = getMenuItem(cmdPos.concat(menu));
    logs('cmdItem = ' + JSON.stringify(cmdItem));
    if(cmdItem.hasOwnProperty('state') && (typeof cmdItem.state !== 'function')){
        logs('ОБЬЕКТ = ' + JSON.stringify(getObject(cmdItem.state)));
        var obj = getObject(cmdItem.state);
        var role = obj.common.role;
        var type = obj.common.type;
        clearTimeout(timer);
        timer = setTimeout(function() {
            showMsg('Ошибка! нет ответа', user);
            cmdPos = cmdPos.slice(0, cmdPos.length-1);
            showMenu(user, cmdPos);
        }, 4000); 

    } else {
        return showMenu(user, cmdPos);
    }
    if(type === 'boolean'){
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

/*** showMenu ***/
function showMenu(user, itemPos) {  
    logs('ВЫЗОВ ФУНКЦИИ showMenu(user, num) из ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('itemPos = ' + JSON.stringify(itemPos));    
    var menuRows = {
        menutext: (menu.icon ? menu.icon + ' ':'') + skipIndex(menu.name),
        state: '',
        backIndex: getIndex(menu.name),
        buttons: []
    };
    var subMenuPos = itemPos.concat([]);
    logs('itemPos = ' + JSON.stringify(itemPos));
    logs('subMenuPos = ' + JSON.stringify(subMenuPos));
    menuRows = getMenuRow(menu.submenu, subMenuPos, menuRows);
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
        if(typeof menuRows.state === "function"){
            menuRows.menutext += '\r\n' + menuRows.state();
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
    if(subMenuPos.length > 0){
        menuRows.menutext += ' > ' + (subMenuRow[subMenuPos[0]].icon ? subMenuRow[subMenuPos[0]].icon + ' ':'') + skipIndex(subMenuRow[subMenuPos[0]].name);
        n = subMenuPos.shift();
        if(typeof subMenuRow[n].state == 'function'){
            menuRows.state = subMenuRow[n].state;
        }
        if (subMenuPos.length > 0) { 
            menuRows.backIndex = getIndex(subMenuRow[n].name);
        }
        return getMenuRow(subMenuRow[n].submenu, subMenuPos, menuRows);
    } else {
        logs('subMenuRow[' + n + '] = ' + JSON.stringify(subMenuRow[n]));
        for (var i = 0; i < subMenuRow.length; i++) {
            var icon;
            if(subMenuRow[i].state && typeof subMenuRow[i].state !== 'function' && getState(subMenuRow[i].state).val){
                icon = subMenuRow[i].icons.on;
            } else if (subMenuRow[i].state && typeof subMenuRow[i].state !== 'function'){
                icon = subMenuRow[i].icons.off;
            } else {
                icon = subMenuRow[i].icon;
            }
            logs('** subMenuRow[' + i + '] = ' + JSON.stringify(subMenuRow[i]));
            menuRows.buttons.push({
                text: icon + ' ' + skipIndex(subMenuRow[i].name),
                callback_data: options.menuPrefix + subMenuRow[i].name
            });
        }
        return menuRows;
    }
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
            subMenuPos[subMenuPos.length - 1] = subMenuPos[subMenuPos.length - 1].submenu.length > subMenuPos[0] ? subMenuPos[subMenuPos.length - 1].submenu[subMenuPos[0]] : undefined;
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

/*** closeMenu ***/
function closeMenu(user) {  
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
    var i, j, resultArr = [];
    for (i = 0, j = menuArr.length; i < j; i += options.width) {
        resultArr.push(menuArr.slice(i, i + options.width));
    }
    return resultArr;
}

/*** showMsg ***/
function showMsg(text, user, showAlert) {
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
    if (Array.isArray(menuRow)) {
        indexPrefix = indexPrefix.length > 0 ? indexPrefix + '.' : '';
        for (const key of menuRow.keys()) {
            menuRow[key].name = indexPrefix + key + '-' + menuRow[key].name;
            if (Array.isArray(menuRow[key].submenu) && menuRow[key].submenu.length) {
                menuRow[key].submenu = addMenuIndex(menuRow[key].submenu, indexPrefix + key);
            }
        }
    }
    else if ((typeof menuRow === 'object') && menuRow.hasOwnProperty('submenu')) {
        menuRow.name = '-' + menuRow.name;
        menuRow.submenu = addMenuIndex(menuRow.submenu, '');
    }
    return menuRow;
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

/*** logs ***/
function logs(txt) {
    if(options.debug){
        log(arguments.callee.caller.name + ': ' + txt);
    }
}

/*** indexing menu ***/
menu = addMenuIndex(menu);

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

