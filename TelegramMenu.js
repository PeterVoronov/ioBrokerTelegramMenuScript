//Telegram bot with inline menu, based on https://blog.instalator.ru/archives/1996 by Vladimir Vilisov aka instalator

// https://www.emojicopy.com/ эмодзи

//////////// Настройки ///////////
var options = {
    telegram:   'telegram.0',           // Инстанция драйвера
    backText:   '🔙 Назад',             // Надпись на кнопке Назад
    backCmd:    'back-',                //Префикс команды кнопки Назад
    closeText:  '❌ Закрыть',          // Надпись на кнопке Закрыть
    closeCmd:   'close',                //Команда кнопки Закрыть
    homeText:   '🏚 Главная',           // Надпись на кнопке Домой
    homeCmd:    'home',                 //Команда кнопки Домой
    alertText:   'Уведомлять',              // Надпись на кнопке Уведомлять
    defaultOnOffIcons:  ['✅', '❌'],         //Префикс команды кнопки Уведомлять
    acknowledgeText:   'Очистить',              // Надпись на кнопке Очистить
    acknowledgeCmd:   ' acknowledge',              // Команда кнопки Очистить
    acknowledgeAllText:   'Очистить все',              // Надпись на кнопке Очистить все    
    acknowledgeAllCmd:   'acknowledgeall',              // Команда кнопки Очистить все
    unsubscribeText:   'Отменить и очистить',              // Надпись на кнопке Отменить и очистить
    unsubscribeCmd:   'unsubscribe',              // Команда кнопки Отменить и очистить
    width:      3,                      // Максимальное количество столбцов с кнопками
    maxWidth:           30,                         // Максимальное количество символов в строке с кнопками
    users_id:   [123456789, 234567890],  // id пользователей которые имеют доступ к меню
    admins_id:          [123456789],                // id пользовапользователей с правами администратора
    adminItemCommands: {
        'rename' : 'Переименовать',
    },                                              // Команда кнопки переименовать
    username:           true,                       // использовать Имя Пользователя(UserName) телеграмм для общения
    menucall:           ['Меню', 'меню', '/menu'],  // Команды для вызова меню
    clearmenucall:      true,                       // Удалять команду пользователя, вызвавшую меню
    menuPrefix:         'menu-',                    // Префикс для отправляемых комманд при нажатии на кнопку, можно не менять
    showHome:           true,                       // Показывать кнопку Домой
    showMsg:            true,                       // Показывать вплывающие сообщения
    updateInterval:     0,                          // Интервал обновления данных в "открытом" пункте меню, секунды
    language:           "ru",                       // Язык общения
    locale:             "ru-RU",                    // Язык общения
    datetimeTemplate:   "dd.mm HH:MM:ss",           // форма отображения даты и времени
    menuExtensions:     "script.js.Telegram.Auto_telegram_menu_Extensions", // Script name for any additional menus, which can't be auto generated
    extensionsTimeout:  500, // timeout to wait an answer from extensions
    hierarhicalCaption: false,                      // show caption of the current menu hierarhically
    namesDictonary:     {
        cmdRenameItem:              'Переименовать',
        pleaseRename:               'Введите новое название:',
        cmdBack:                    '🔙 Назад',
        cmdClose:                   '❌ Закрыть',
        cmdHome:                    '🏚 Главная',
        cmdAlertSubcribe:           'Уведомлять',
        cmdAcknowledgeAlert:        'Очистить',
        cmdacknowledgeAllAlerts:    'Очистить все',
        cmdUnsubscribeAlert:        'Отменить и очистить',
    },                                              // Localisation dictonary
    debug:              false                       // Режим отладки, подробное логирование
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
        { // Движение/присутствие
            name: 'Движение',
            icon: '👀',
            funcEnum: 'presence',
            type: 'motion',
            submenu: submenuGenerator
        },      
        { // Освещение
            name: 'Освещение',
            icon: '💡',
            funcEnum: 'light',
            type: 'switch',
            submenu: submenuGenerator
        },        
        { // Розетки
            name: 'Розетки',
            icon: '🔌',
            funcEnum: 'plug',
            type: 'plug',
            submenu: submenuGenerator
        },
        { // Кондиционеры 
            name: 'Кондиционеры',
            icon: '🌀',
            funcEnum: 'air-conditioner',
            type: 'air-conditioner',
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
                },
                { // Блокировка сайтов в школьное время
                    name: 'Игровые сайты',
                    state: '0_userdata.0.network.mouse.school_time',
                    icons: {on: '⛔', off: '🟢'},
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
                    '.consumer_connected'   : 'Подключено',
                    '.load_power'           : 'Текущая нагрузка',
                    '.energy'               : 'Всего потреблено',
                    '.consumer_overload'    : 'Превышена нагрузка',
                    '.voltage'              : 'Напряжение в сети',
                    '.current'              : 'Ток нагрузки',
                    '.temperature'          : 'Температура',
                    '.link_quality'         : 'Уровень сигнала'
                },
            statusitems :
                {
                    'val' : {
                        'prefix' : 'Статус',
                        true : 'Включен(-о)',
                        false : 'Выключен(-о)'
                    }                    
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
                    /*
                    '.link_quality'         : 'Уровень сигнала'                    
                    */
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
    'motion' :
        {
            mask : 'linkeddevices.0.sensors.*.motion.*.occupancy',
            role : 'sensor.motion',
            state: 'occupancy',
            icons : {on: '🚶', off: '⚪'},
            report: reportGenerator,
            menuitems :
                {
                },
            reportitems :
                {
                    /*
                    '.link_quality'         : 'Уровень сигнала',
                    '.no_motion'            : 'Нет движения',
                    '.occupancy_timeout'    : 'Задержка'
                    */
                },
            statusitems :
                {
                    'lc' : 'Не менялся с',
                    'ack' : 'Потдвержден',
                    'ts' : 'По состоянию на',
                    'val' : {
                        'prefix' : 'Статус',
                        true : 'Движение',
                        false : 'Никого'
                    }
                }
        },        
    'switch' :
        {
            mask : 'linkeddevices.0.switches.*.light.*.state',
            role : 'switch',
            state : 'state',
            rooms : false,
            icons : {on: '💡', off: '✖️'},
            menuitems :
                {
                    '.state' : 'Вкл/выкл',
                    '.power_outage_memory' : 'Запоминать состояние'
                },
            report: reportGenerator,
            reportitems :
                {
                    '.consumer_connected'   : 'Подключено',
                    '.load_power'           : 'Текущая нагрузка',
                    '.energy'               : 'Всего потреблено',
                    '.consumer_overload'    : 'Превышена нагрузка',
                    '.voltage'              : 'Напряжение в сети',
                    '.current'              : 'Ток нагрузки',
                    '.temperature'          : 'Температура',
                    '.link_quality'         : 'Уровень сигнала'
                },
            statusitems :
                {
                    'lc' : 'Не менялся с',
                    'ack' : 'Потдвержден',
                    'ts' : 'По состоянию на',
                    'val' : {
                        'prefix' : 'Статус',
                        true : 'Включен(-о)',
                        false : 'Выключен(-о)'
                    }
                }
        },
    'air-conditioner' :
        {
            
            mask : 'alias.0.air-conditioners.*.*.POWER',
            state : 'POWER',
            /*
            mask : 'linkeddevices.0.air-conditioners.*.*.power',
            state : 'power',
            */
            role : 'switch.power',
            rooms : false,
            icons : {on: '🌀', off: '✖️'},
            menuitems :
                {
                /*    '.power'    : 'Вкл/выкл',
                    '.set'      : 'Цель',
                    '.mode'     : 'Режим работы',
                    '.speed'    : 'Скорость вентилятора',
                */},
            report: reportGenerator,
            reportitems :
                {
                    /*
                    '.ACTUAL'               : 'Температура',
                    '.HUMIDITY'             : 'Влажность',
                    */
                },
            statusitems :
                {
                    'lc' : 'Не менялся с',
                    'ack' : 'Потдвержден',
                    'ts' : 'По состоянию на',
                    'val' : {
                        'prefix' : 'Статус',
                        true : 'Включен',
                        false : 'Выключен'
                    }
                }
        },        
};

const mainDataPrefix = '0_userdata.0.telegram_automenu.';
const configPrefix = mainDataPrefix + 'config.';

/*** statesCommonAttr ***/
const statesCommonAttr = {
    'botSendMessageId' : {name:"Message ID of last sent message by the bot", type: 'number', read: true, write: true, role: 'id'},
    'messageId' : {name:"Message ID of last received request", type: 'number', read: true, write: true, role: 'id'},
    'user': {name:"user data as json", type: "string", read: true, write: true, role: "text"},
    'menuOn' : {name:"Is menu shown to the user", type: 'boolean', read: true, write: true, role: 'state'},
    'menuItem' : {name:"Last menu item shown to the user", type: 'string', read: true, write: true, role: 'text'},
    'lastMessage' : {name:"Last menu message sent to the user", type: 'string', read: true, write: true, role: 'text'},
    'alerts' : {name:"List of states for alert subscription", type: 'string', read: true, write: true, role: 'text'},
    'alertMessages' : {name:"List of alert messages from alert subscriptions", type: 'string', read: true, write: true, role: 'text'},
    'currentState' : {name:"State currently processed in Menu", type: 'string', read: true, write: true, role: 'text'},
    'mode' : {name:"Current user mode", type: 'number', read: true, write: true, role: 'number'},
};

/*** statesCache ***/
var statesCache = {};

/*** Make functions be printable in JSON.stringify with names ***/
Function.prototype.toJSON = function() { return `function ${this.name}` }

/*** getFromDict ***/
function getFromDict(dictId) {
    logs('getFromDict(dictId) from ' + arguments.callee.caller.name);
    logs('dictId = ' + JSON.stringify(dictId));
    if (options.namesDictonary.hasOwnProperty(dictId) && (options.namesDictonary[dictId] !== undefined)) {
        logs('namesDictonary[dictId] = ' + JSON.stringify(options.namesDictonary[dictId]));
        return options.namesDictonary[dictId];
    }
    else {
        return dictId;
    }
}

/*** putToDict ***/
function putToDict(dictId, name) {
    logs('putToDict(dictId, name) from ' + arguments.callee.caller.name);
    logs('dictId = ' + JSON.stringify(dictId));
    logs('name = ' + JSON.stringify(name));
    options.namesDictonary[dictId] = name;
    setState(configPrefix + 'namesDictonary', JSON.stringify(options.namesDictonary), true);
}

/*** getStateCached ***/
function getStateCached(user, state) {
    logs('Function getStateCached(user, state, value) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(state));
    const id = mainDataPrefix + 'cache.' + options.telegram + '.' + user + '.' + state;
    if (statesCache.hasOwnProperty(id)) {
        logs('Cached = ' + JSON.stringify(statesCache[id]) + ' type of ' + typeof(statesCache[id]));
        return Array.isArray(statesCache[id]) ? statesCache[id].slice() : (typeof(statesCache[id]) === 'object' ?  Object.assign({}, statesCache[id]) : statesCache[id]);
    }
    else if (statesCommonAttr.hasOwnProperty(state)) {
        if (existsState(id)) {
            const cachedVal = getState(id).val;
            if ((statesCommonAttr[state].type === 'string') && (cachedVal.length > 0)) {
                try {
                    statesCache[id] = JSON.parse(cachedVal);
                } catch (err) {
                    statesCache[id] = cachedVal;
                    logs("Ошибка парсинга - " + JSON.stringify(err));
                } 
            }
            else { 
                statesCache[id] = cachedVal;
            }
            logs('Non cached = ' + JSON.stringify(statesCache[id]) + ' type of ' + typeof(statesCache[id]));
            return Array.isArray(statesCache[id]) ? statesCache[id].slice() : (typeof(statesCache[id]) === 'object' ?  Object.assign({}, statesCache[id]) : statesCache[id]);
        }
    }
    return undefined;
}

/*** setStateCached ***/
function setStateCached(user, state, value) {
    logs('Function setStateCached(user, state, value) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(state));
    logs('value = ' + JSON.stringify(value));
    const id = mainDataPrefix + 'cache.' + options.telegram + '.' + user + '.' + state;
    logs( 'statesCache[id] = ' + (statesCache.hasOwnProperty(id) ? JSON.stringify(statesCache[id]) : undefined));
    if ( ! ( (statesCache.hasOwnProperty(id) && (JSON.stringify(statesCache[id]) === JSON.stringify(value)) ) ) ) {
        statesCache[id] = value;
        if (statesCommonAttr.hasOwnProperty(state)) {
            if ((statesCommonAttr[state].type === 'string') && (typeof value !== 'string')) {
                value = JSON.stringify(value);
            }
            if (existsState(id)) {
                setState(id,value,true);
            }
            else {
                createState(id, value, statesCommonAttr[state])
            }
        }
    }
}


/*** delStateCached ***/
function delStateCached(user, state) {
    logs('Function delStateCached(user, state) from ' + arguments.callee.caller.name);
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
    logs('Function initConfig() from ' + arguments.callee.caller.name); 
    for (const [key, value] of Object.entries(options)) {
        if (key.indexOf('_') !== 0 ){
            const id = configPrefix + key;
            if (existsState(id)) {
                let actualValue = getState(id).val;
                if (Array.isArray(value)) {
                    options[key] = actualValue.split(',');
                }
                else if (typeof(value) === 'object') {
                    try {
                        actualValue = JSON.parse(actualValue);
                    } catch (err) {
                        logs("Ошибка парсинга options[${key}]- " + JSON.stringify(err), true);
                    }
                    if (typeof(actualValue) === 'object') {
                        options[key] = Object.assign(options[key], actualValue);
                    }
                }
                else {
                    options[key] = actualValue;
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
                else if (typeof(stateVal) === 'object') {
                    stateVal = JSON.stringify(stateVal);
                    stateType = 'string';
                }
                createState(id, stateVal, {name: key, type: stateType, read: true, write: true})
                logs('state ' + JSON.stringify(id) + ' created for option ' + JSON.stringify(key) + ' = ' + JSON.stringify(stateVal));
            }
        }
    }
    setScheduler();
    $('state[id=' + configPrefix + '*' + ']').each(function checkOptionsItems(itemId, itemI) {
        const itemKey = itemId.split('.').pop();
        if (! options.hasOwnProperty(itemKey)) {
            logs('Found obsolete options key = ' + JSON.stringify(itemKey));
            deleteState(itemId, function deleteObsoleteOptions (error, result) {
                if (error) {
                    logs('Error during deletion of ' + itemId + ' : ' + JSON.stringify(error), true);
                }
                else {
                    logs('Options key ' + JSON.stringify(itemId) + ' is deleted with result : ' + JSON.stringify(result));
                }
            });
        }
    });
    on({id: new RegExp(configPrefix + '*'), change: 'ne'}, function optionsSubscribe(obj) {
        logs('Function optionsSubscribe(obj)');
        logs('obj = ' + JSON.stringify(obj, undefined, ' '));
        const key = obj.id.split('.').pop();
        if (Array.isArray(options[key])) {
            options[key] = obj.state.val.split(',');
        }
        else if (typeof(options[key]) === 'object') {
            try {
                options[key] = JSON.parse(obj.state.val);
            } catch (err) {
                logs("Ошибка парсинга options[${key}]- " + JSON.stringify(err), true);
                options[key] = obj.state.val;
            }  
        }
        else {
            options[key] = obj.state.val;
        }
        if (key === 'updateInterval') {
            setScheduler();
        }
        setState(obj.id, obj.state.val, true);
        logs('options[' + key + '] is set to ' + JSON.stringify(options[key]));
    });
    alertsInit();

    /*** subscribe on Telegram ***/
    if (getState('system.adapter.' + options.telegram + '.connected').val) {
        telegramConnected(true);
    }
    on({id: 'system.adapter.' + options.telegram + '.connected', change: 'ne'}, telegramConnected);
}

/*** setScheduler ***/
function setScheduler() {
    logs('Function setScheduler() from ' + arguments.callee.caller.name);
    if (options.hasOwnProperty('_updateMenuSchedule')) {
        logs('delete current schedule = ' + JSON.stringify(''));
        clearSchedule(options['_updateMenuSchedule']);
        delete options['_updateMenuSchedule'];
    }
    if (options.updateInterval > 0) {
        const scheduleString = '*' + (options.updateInterval < 60 ? '/' + options.updateInterval : '') 
            + ' *' + (options.updateInterval >= 60 ? '/' + Math.trunc(options.updateInterval / 60) : '') 
            + ' * * * *';
        logs('scheduleString = ' + JSON.stringify(scheduleString));
        options['_updateMenuSchedule'] = schedule(scheduleString, function scheduledCurrentMenuUpdate() {
            logs('Function updateCurrentMenuSchedule()');
            for (const user of options.users_id) {
                logs('user = ' + JSON.stringify(user));
                if (getStateCached(user, 'menuOn') === true) {
                    const itemPos = getStateCached(user, 'menuItem');
                    logs('for user = ' +JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
                    if ( (! getStateCached(user, 'isWaitForInput')) && (itemPos !== undefined)) {
                        logs('make an menu update for = ' + JSON.stringify(user));
                        doMenuItem(user, undefined, itemPos);
                    }
                }
                else {
                    logs('for user = ' +JSON.stringify(user) + ' menu is closed');
                }
            }
        });    
    }
}


/*** setAlert ***/
function setAlert(menuObject, user) {
    logs('Function setAlert(menuObject, user) from ' + arguments.callee.caller.name);
    logs('menuObject = ' + JSON.stringify(menuObject));
    logs('user = ' + JSON.stringify(user));
    let alerts = getStateCached(user, 'alerts');
    if (alerts === undefined) {
        alerts = {};
    }
    let alertsList = getStateCached('common', 'alerts');
    logs('alerts = ' + JSON.stringify(alerts));
    if (alerts.hasOwnProperty(menuObject.param)) {
        delete alerts[menuObject.param];
        setStateCached(user, 'alerts', alerts);
        let count = 0;
        for (const user_id of options.users_id) {
            let currentAlerts = getStateCached(user_id, 'alerts');
            if ((currentAlerts !== undefined) && currentAlerts.hasOwnProperty(menuObject.param)) {            
                count++;
            }
        }
        if (count === 0) {
            unsubscribe(menuObject.param);
            delete alertsList[menuObject.param];
        }    
    }
    else {
        alerts[menuObject.param] = true;
        let count = 0;
        for (const user_id of options.users_id) {
            let currentAlerts = getStateCached(user_id, 'alerts');
            if ((currentAlerts !== undefined) && currentAlerts.hasOwnProperty(menuObject.param)) {            
                count++;
            }
        }
        if (count === 0) {
            on({id: menuObject.param, change: 'ne'}, alertCallback);
        }
    }
    logs('alerts = ' + JSON.stringify(alerts));
    setStateCached(user, 'alerts', alerts);
    let itemPos = getIndex(menuObject.name).split('.');
    logs('itemPos = ' + JSON.stringify(itemPos));
    itemPos.pop();
    logs('itemPos = ' + JSON.stringify(itemPos));
    return itemPos;
}

/*** getAlertIcon ***/
function getAlertIcon(menuObject, user) {
    logs('Function getAlertIcon(menuObject) from ' + arguments.callee.caller.name);
    logs('menuObject = ' + JSON.stringify(menuObject));
    logs('user = ' + JSON.stringify(user));
    const alerts = getStateCached(user, 'alerts');
    if (alerts === undefined) {
        return options.defaultOnOffIcons[1];
    }
    else if (alerts.hasOwnProperty(menuObject.param)) {
        return options.defaultOnOffIcons[0];
    }
    return options.defaultOnOffIcons[1];
}

/*** alertsInit ***/
function alertsInit() {
    logs('Function alertsInit()');
    let isSet = {};
    for (const user_id of options.users_id) {
        let alerts = getStateCached(user_id, 'alerts');
        logs('alerts = ' + JSON.stringify(alerts));
        if (alerts !== undefined) {
            for (const alert of Object.keys(alerts)) {
                if (! isSet.hasOwnProperty(alert)) {
                    on({id: alert, change: 'ne'}, alertCallback);
                    isSet[alert] = true;
                }
            }
        }
    }
}

/*** alertCallback ***/
function alertCallback(obj) {
    logs('Function alertCallback(obj)');
    logs('obj = ' + JSON.stringify(obj));
    for (const user of options.users_id) {
        logs('user = ' + JSON.stringify(user));
        let currentState = getStateCached(user, 'currentState');
        logs('currentState = ' + JSON.stringify(currentState));
        if ((currentState === undefined) || (obj.id !== currentState)) {
            if (getStateCached(user, 'menuOn') === true) {
                const alerts = getStateCached(user, 'alerts');
                if ((alerts !== undefined) && alerts.hasOwnProperty(obj.id)) {
                    const itemPos = getStateCached(user, 'menuItem');
                    logs('for user = ' +JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
                    if (itemPos !== undefined) {
                        logs('make an menu alert for = ' + JSON.stringify(user) + ' on state ' + JSON.stringify(obj.id));
                        const alertObject = getObject(obj.id, 'rooms');
                        const alertRoom = getRoomName(alertObject['enumIds'][0], alertObject['enumNames'][0],'inside')
                        logs('alertRoom = ' + JSON.stringify(alertRoom));
                        const alertName = getObjectName(getObject(obj.id.split('.').slice(0,-1).join('.')).common.name);
                        logs('alertName = ' + JSON.stringify(alertName));
                        let alertStatus = obj.state.val;
                        if (typeof obj.state.val === 'boolean') {
                            for (const [key, value] of Object.entries(submenuParams)) {
                                let rule = new RegExp(value.mask,'i');
                                if (rule.test(obj.id)) {
                                    if (value.statusitems.hasOwnProperty('val')) {
                                        alertStatus = value.statusitems.val[alertStatus];
                                    }
                                    else if (typeof value.icons === 'object') {
                                        alertStatus = value.icons[alertStatus ? 'on' : 'off']
                                    }
                                }
                            }
                        }
                        else if (typeof obj.state.val === 'number') {
                            alertStatus = alertStatus.val.toFixed(2) + ' ' + (obj.common.hasOwnProperty('unit') ? obj.common.unit : '');
                        }
                        else if (typeof obj.state.val === 'string') {
                            alertStatus += (obj.common.hasOwnProperty('unit') ? ' ' + obj.common.unit : ''); 
                        }
                        let alertText = alertName + ' ' + alertRoom + ' ' + alertStatus;
                        logs('alertText = ' + JSON.stringify(alertText));
                        let alertMessages = getStateCached(user, 'alertMessages');
                        if (alertMessages === undefined) {
                            alertMessages = [];
                        }
                        alertMessages.push( {
                            id: obj.id,
                            message: alertText,
                            date: (new Date()).format(options.datetimeTemplate)
                        });
                        setStateCached(user, 'alertMessages', alertMessages);
                        doMenuItem(user, undefined, itemPos, true);
                    }
                }
            }
            else {
                logs('for user = ' +JSON.stringify(user) + ' menu is closed');
            }
        }
    }
}


/*** submenuExtensions ***/
function submenuExtensions(upperMenuItem) {
    logs('Function submenuExtensions(upperMenuItem) from ' + arguments.callee.caller.name);
    logs('upperMenuItem = ' + JSON.stringify(upperMenuItem));
    return [];
}

/*** submenuGenerator ***/
function submenuGenerator(upperMenuItem) {
    logs('Function submenuGenerator(upperMenuItem) from ' + arguments.callee.caller.name);
    logs('upperMenuItem = ' + JSON.stringify(upperMenuItem));
    var upperMenuIndex = getIndex(upperMenuItem.name);
    var subMenu = [];
    var currId = -1;
    var lastRoom = '';
    var roomIndex = -1;
    var roomMenuIndex = '';
    var roomMenuItem;
    var menuItemName = '';
    logs('mask = ' + JSON.stringify(submenuParams[upperMenuItem.type]['mask']));
    logs('role = ' + JSON.stringify(submenuParams[upperMenuItem.type]['role']));
    logs('funcEnum = ' + JSON.stringify(upperMenuItem.funcEnum));
    processObjects(submenuParams[upperMenuItem.type]['mask'], submenuParams[upperMenuItem.type]['role'], upperMenuItem.funcEnum, function plugsCB (id, room) {
        logs('Function plugsCB(id, room) from ' + arguments.callee.caller.name);
        logs('id = ' + JSON.stringify(id));
        logs('room = ' + JSON.stringify(room));
        logs('lastRoom = ' + JSON.stringify(lastRoom));
        logs('roomIndex = ' + JSON.stringify(roomIndex));
        logs('currId = ' + JSON.stringify(currId));
        logs('roomMenuIndex = ' + JSON.stringify(roomMenuIndex));
        logs('roomMenuItem = ' + JSON.stringify(roomMenuItem));
        logs('menuItemName = ' + JSON.stringify(menuItemName));
        logs('subMenu = ' + JSON.stringify(subMenu));
        logs(`submenuParams[${upperMenuItem.type}] = ${JSON.stringify(submenuParams[upperMenuItem.type])}`);
        const idPrefix = id.split('.').slice(0,-1).join('.');
        if (lastRoom != room.id) {
            if ((! submenuParams[upperMenuItem.type]['rooms']) && (currId >= 0) && (subMenu[subMenu.length-1].submenu.length === 1)) {
                subMenu = unRoom(subMenu);
            }
            currId++;
            roomMenuItem = {
                                name: upperMenuIndex + '.' + currId + '-' + getRoomName(room.id, room.name,'Main'),
                                icon: upperMenuItem.icon,
                                'room': room.id.split('.').pop(),
                                submenu: []
                            };
            roomIndex = 0;
            subMenu.push(roomMenuItem);
        }
        var menuItem = {
                            name: upperMenuIndex + '.' + currId + '.' + roomIndex + '-' + getObjectName(getObject(idPrefix).common.name),
                            state: id,
                            type: upperMenuItem.type,
                            funcEnum: upperMenuItem.funcEnum,
                            room: room.id.split('.').pop(),
                            icons: submenuParams[upperMenuItem.type]['icons'],
                            submenu: []
                        };
        if ((submenuParams[upperMenuItem.type].hasOwnProperty('report')) && (submenuParams[upperMenuItem.type]['report'] !== undefined )) {
            menuItem.function = submenuParams[upperMenuItem.type]['report'];
        }
        var currSubId = 0;
        let menuItems = Object.assign({}, submenuParams[upperMenuItem.type]['menuitems']);
        logs('room = ' + JSON.stringify(room.id.split('.').pop()));
        logs('upperMenuItem.funcEnum = ' + JSON.stringify(upperMenuItem.funcEnum));
        logs('menuItems = ' + JSON.stringify(menuItems));
        if (Object.keys(menuItems).length === 0) {
            //menuItems={};
            const mainObject = getObject(id);
            logs('id = ' + JSON.stringify(id));
            logs('mainObject = ' + JSON.stringify(mainObject));
            if (mainObject.common.write) {
                const itemState = id.split('.').pop();
                let itemName = getFromDict(upperMenuItem.funcEnum + '.' + itemState);
                if ( itemName === (upperMenuItem.funcEnum + '.' + itemState) ) { 
                    itemName = getObjectName(mainObject.common.name);
                }                
                menuItems['.' + itemState] = itemName;
            }
            logs('menuItems = ' + JSON.stringify(menuItems));
            $('state[id=' + idPrefix + '.*' + '](functions=' + upperMenuItem.funcEnum + ')(rooms=' + room.id.split('.').pop() + ')').each(function prepareMenuItems(itemId, itemI) {
                logs('itemId = ' + JSON.stringify(itemId));
                const itemObject = getObject(itemId);
                logs('itemObject.common = ' + JSON.stringify(itemObject.common));
                if (itemObject.common.write) {
                    const itemState = itemId.split('.').pop();
                    //to change in future!
                    let itemName = getFromDict(upperMenuItem.funcEnum + '.' + itemState);
                    if ( itemName === (upperMenuItem.funcEnum + '.' + itemState) ) { 
                        itemName = getObjectName(itemObject.common.name);
                    }
                    //
                    if ((itemState !== 'device_query') && (itemName.length > 0)) {
                        menuItems['.' + itemState] = itemName;
                    }
                }
            });
            logs('menuItems = ' + JSON.stringify(menuItems, undefined, ' '));
        }
        //menuItems = submenuParams[upperMenuItem.type]['menuitems'];
        for (const [stateId, stateName] of Object.entries(menuItems)) {
            if (existsState(idPrefix + stateId)) {
                let currObject = getObject(idPrefix + stateId);
                logs('currObject = ' + JSON.stringify(currObject));
                if (currObject.common.hasOwnProperty('alias') && currObject.common.alias.hasOwnProperty('id')) {
                    currObject = getObject(currObject.common.alias.id);
                }
                if (currObject.common.type === 'boolean') {
                    menuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + stateName,
                                    state: idPrefix + stateId,
                                    funcEnum: upperMenuItem.funcEnum,
                                    dictId: upperMenuItem.funcEnum + stateId,
                                    icons: submenuParams[upperMenuItem.type]['icons'],
                                    submenu: []
                                })
                    currSubId++;
                }
                else {
                    if (currObject.common.hasOwnProperty('states') && (['string','number'].indexOf(currObject.common.type) >= 0 )) {
                        const currState = getState(idPrefix + stateId).val;
                        const states = getPossibleStates(currObject.common.states);
                        logs('states = ' + JSON.stringify(states));
                        if ((states !== undefined) && Object.keys(states).length > 0) {
                            let subMenuItem = {
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + stateName,
                                    funcEnum: upperMenuItem.funcEnum,
                                    dictId: upperMenuItem.funcEnum + stateId,
                                    icon: '',
                                    submenu: []
                                };
                            let iState = 0;
                            for (const [possibleValue, possibleName] of Object.entries(states)) {
                                logs('possibleValue = ' + JSON.stringify(possibleValue));
                                logs('possibleName = ' + JSON.stringify(possibleName));
                                subMenuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '.' + iState + '-' + (possibleName !== undefined ? possibleName : possibleValue),
                                    'state': idPrefix + stateId + ':' + possibleValue,
                                    funcEnum: upperMenuItem.funcEnum,
                                    icon: options.defaultOnOffIcons[currState == possibleValue ? '0' : '1'],
                                    submenu: []
                                })
                                if (currState == possibleValue) {
                                    subMenuItem.name += ' (' + (possibleName !== undefined ? possibleName : possibleValue) + ')';
                                }
                                iState++;
                            }
                            logs('subMenuItem = ' + JSON.stringify(subMenuItem, undefined, ' '));
                            menuItem.submenu.push(subMenuItem);
                            currSubId++;
                        }
                    }
                    else if ((currObject.common.type === 'number') /*&&  currObject.common.hasOwnProperty('min') && currObject.common.hasOwnProperty('max')*/) {
                        const step = Number(currObject.common.hasOwnProperty('step') ? currObject.common.step : 1);
                        const currState = Number(getState(idPrefix + stateId).val);
                        let states = [];
                        for(let steps = currState - 2 * step; steps <= currState + 2 * step; steps += step) {
                            if ( ((! currObject.common.hasOwnProperty('min')) || (steps >=  Number(currObject.common.min))) && ((! currObject.common.hasOwnProperty('max')) || (steps <=  Number(currObject.common.max)))) {
                                states.push(steps);                          
                            }
                        }
                        if (states.length > 0) {
                            let subMenuItem = {
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + stateName,
                                    funcEnum: upperMenuItem.funcEnum,
                                    dictId: upperMenuItem.funcEnum + stateId,
                                    icon: '',
                                    submenu: []
                                };
                            let iState = 0;
                            for (const possibleValue of states) {
                                logs('possibleValue = ' + JSON.stringify(possibleValue));
                                subMenuItem.submenu.push({
                                    name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '.' + iState + '-' +  possibleValue + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : '' ),
                                    state: idPrefix + stateId + ':' + possibleValue,
                                    funcEnum: upperMenuItem.funcEnum,
                                    icon: options.defaultOnOffIcons[currState == possibleValue ? '0' : '1'],
                                    submenu: []
                                })
                                if (currState == possibleValue) {
                                    subMenuItem.name += ' (' + possibleValue + (currObject.common.hasOwnProperty('unit') ? currObject.common.unit : '' ) + ')';
                                }
                                iState++;
                            }
                            menuItem.submenu.push(subMenuItem);
                            currSubId++;
                        }
                    }
                }
            }          
        }
        menuItem.submenu.push({
            name: upperMenuIndex + '.' + currId + '.' + roomIndex + '.' + currSubId + '-' + options.alertText,
            icons: getAlertIcon,
            function: setAlert,
            param: id,
            submenu: []
        });
        logs('menuItem = ' + JSON.stringify(menuItem));
        roomMenuItem.submenu.push(menuItem)
        roomIndex++;
        lastRoom = room.id;
    })
    if ((! submenuParams[upperMenuItem.type]['rooms']) && ((subMenu.length > 0) && (subMenu[subMenu.length-1].submenu.length === 1))) {
        subMenu = unRoom(subMenu);
    }
    logs('subMenu New = ' + JSON.stringify(subMenu, undefined, ' '));
    return subMenu;
}

/*** getPossibleStates ***/
function getPossibleStates(inputStates) {
    logs('Function getPossibleStates(inputStates) from ' + arguments.callee.caller.name);
    logs('inputStates = ' + JSON.stringify(inputStates));
    let states = {};
    if (typeof(inputStates) === 'string') {
        const statesArray = inputStates.indexOf(';') > 0 ? inputStates.split(';') : (inputStates.indexOf(',') > 0 ? inputStates.split(',') : []);
        logs('statesArray = ' + JSON.stringify(statesArray));
        for (let iState of statesArray.values()) {
            const [possibleValue, possibleName] = iState.split(':');
            states[possibleValue.trim()] = possibleName.trim();
        }
        logs('states = ' + JSON.stringify(states));
        return states;
    }
    else if (Array.isArray(inputStates)) {
        return undefined;
    }
    else if (typeof(inputStates) === 'object') {
        return inputStates;
    }
}


/*** unRoom ***/
function unRoom(subMenu) {
    logs('Function unRoom(subMenu) from ' + arguments.callee.caller.name);
    logs('subMenu = ' + JSON.stringify(subMenu, undefined, ' '));
    var roomMenuItem = subMenu.pop();
    roomMenuItem.submenu[0].name = roomMenuItem.name;
    roomMenuItem.submenu[0]['room'] = roomMenuItem.room;
    roomMenuItem.submenu[0].submenu = unRoomIterator(roomMenuItem.submenu[0].submenu, 0);
    subMenu.push(roomMenuItem.submenu[0]);
    logs('subMenu new = ' + JSON.stringify(subMenu, undefined, ' '));
    return subMenu;
}

/*** unRoomIterator ***/
function unRoomIterator(subMenu, level) {
    logs('Function unRoomIterator(subMenu) from ' + arguments.callee.caller.name);
    logs('subMenu = ' + JSON.stringify(subMenu));
    logs('level = ' + JSON.stringify(level));
    for (var subMenuItem of subMenu) {
        logs('subMenuItem.name = ' + JSON.stringify(subMenuItem.name));
        var newIndex = getIndex(subMenuItem.name).split('.');
        logs('oldIndex = ' + JSON.stringify(newIndex));
        newIndex.splice( -2 - level,  1);
        logs('newIndex = ' + JSON.stringify(newIndex));
        subMenuItem.name =  newIndex.join('.') + '-' + skipIndex(subMenuItem.name);
        if (subMenuItem.hasOwnProperty('submenu') && (subMenuItem.submenu.length > 0)) {
            subMenuItem.submenu = unRoomIterator(subMenuItem.submenu, level + 1);
        }
    }
    return subMenu;
}



/*** processObjects ***/
function processObjects(objMask, objRole, objFunc, objCB) {
    logs('Function processObjects(objMask, objRole, objFunc, objCB) from ' + arguments.callee.caller.name);
    logs('objMask = ' + JSON.stringify(objMask));
    logs('objRole = ' + JSON.stringify(objRole));
    logs('objFunc = ' + JSON.stringify(objFunc));
    logs('objCB = ' + JSON.stringify(objCB));
    const listRooms = getEnums('rooms');
    for (let currRoom of listRooms) {
        logs('currRoom = ' + JSON.stringify(currRoom));
        //$('state[id=' + objMask + '][role=' + objRole + '](functions=' + objFunc + ')(rooms=' + currRoom.id.split('.').pop() + ')').each( function (id) {
        $('state[id=' + objMask + '](functions=' + objFunc + ')(rooms=' + currRoom.id.split('.').pop() + ')').each( function (id) {
            objCB (id, currRoom);
        } );
    }
}


/*** reportGenerator ***/
function reportGenerator(menuObject, user, menuRows) {
    logs('Function reportGenerator(menuObject, user, menuRows) from ' + arguments.callee.caller.name);
    logs('menuObject = ' + JSON.stringify(menuObject, undefined, ' '));
    logs('user = ' + JSON.stringify(user));
    logs('menuRows = ' + JSON.stringify(menuRows, undefined, ' '));
    if ((typeof menuObject === 'object') && (menuObject.hasOwnProperty('state'))) {
        var maxLeftLen = 19;
        const maxRightLen = 8;
        const idPrefix = menuObject.state.split('.').slice(0,-1).join('.');
        var textStatus = '';
        var text = '';
        if (submenuParams[menuObject.type].hasOwnProperty('statusitems') && submenuParams[menuObject.type]['statusitems'].hasOwnProperty('val')) {
            const currState = getState(menuObject.state);
            textStatus += submenuParams[menuObject.type]['statusitems']['val']['prefix'].concat(':').padEnd(maxLeftLen) + ' ' + submenuParams[menuObject.type]['statusitems']['val'][currState.val].padStart(maxRightLen);
            /*if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('ack')) {
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['ack'].concat(':').padEnd(maxLeftLen) + ' ' + ((currState.ack ? 'Да' : 'Нет').padStart(maxRightLen));
            }*/
            if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('ts')) {
                const timeStamp = new Date(currState.ts);
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['ts'].concat(':').padEnd(maxLeftLen) + ' ' + timeStamp.format(options.datetimeTemplate).padStart(maxRightLen);
            }
            if (submenuParams[menuObject.type]['statusitems'].hasOwnProperty('lc')) {
                const lastChanged = new Date(currState.lc);
                textStatus += '\r\n' + submenuParams[menuObject.type]['statusitems']['lc'].concat(':').padEnd(maxLeftLen) + ' ' + lastChanged.format(options.datetimeTemplate).padStart(maxRightLen);
            }
        }
        maxLeftLen = 19;
        let reportitems = {};       
        if (submenuParams[menuObject.type].hasOwnProperty('reportitems') && (Object.keys(submenuParams[menuObject.type]['reportitems']).length > 0)) {
            reportitems = submenuParams[menuObject.type]['reportitems'];
        }
        else if (menuObject.hasOwnProperty('funcEnum') && menuObject.hasOwnProperty('room')) {
            $('state[id=' + idPrefix + '.*' + '](functions=' + menuObject.funcEnum + ')(rooms=' + menuObject.room + ')').each( function prepareReportItems(itemId, itemI) {
                logs('itemId = ' + JSON.stringify(itemId));
                if (itemId !== menuObject.state) {
                    const itemObject = getObject(itemId);
                    logs('itemObject.common = ' + JSON.stringify(itemObject.common));
                    if (! itemObject.common.write) {
                        const itemState = itemId.split('.').pop();
                        //to change in future!
                        let itemName = getFromDict(menuObject.funcEnum + '.' + itemState);
                        if ( itemName === (menuObject.funcEnum + '.' + itemState) ) { 
                            itemName = getObjectName(itemObject.common.name);
                        }
                        logs(`reportitems[.${itemState}] = ${JSON.stringify(itemName)}`);
                        reportitems['.' + itemState] = itemName;
                        if (menuRows.hasOwnProperty('toRename') && (menuRows.toRename !== undefined)) {
                            menuRows.toRename[menuObject.funcEnum + '.' + itemState] = itemName;
                        }
                    }
                }
            });
        }
        for (const [state, name] of Object.entries(reportitems)) {
            if (existsObject(idPrefix + state)) {
                text += (text.length > 0 ? '\r\n' : '') + name.concat(':').padEnd(maxLeftLen) + ' ';
                const currObject = getObject(idPrefix + state);
                logs('currObject = ' + JSON.stringify(currObject));
                if (existsState(idPrefix + state)) {
                    const currState = getState(idPrefix + state);
                    logs('currState = ' + JSON.stringify(currState));
                    if ((currObject.common.type === 'boolean') && (typeof currState.val === 'boolean')) {
                        text += options.defaultOnOffIcons[currState.val ? 0 : 1].padStart(maxRightLen-2);
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
    logs('Function Environments(menuObject) from ' + arguments.callee.caller.name);
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
function doMenuItem(user, cmd, cmdPos, isAlert) {
    logs('Function doMenuItem(user, cmd) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('cmd = ' + JSON.stringify(cmd));
    logs('cmdPos = ' + JSON.stringify(cmdPos));
    logs('isAlert = ' + JSON.stringify(isAlert));
    var menuBase;
    const extensionScriptState = 'javascript.' + instance + '.' + options.menuExtensions.replace('.js.', 'Enabled.');
    logs(`scriptState = ${JSON.stringify(extensionScriptState)}`);
    if ((options.menuExtensions.length  > 0) && existsState(extensionScriptState)) {
        logs(`scriptState ${JSON.stringify(extensionScriptState)} exists`);
        const started = startScript(options.menuExtensions, true);
        logs(`Script ${options.menuExtensions} is ${started ? 'already ' : ''}started`);
        messageTo('updateAutoTelegramMenu', menu, {timeout: options.extensionsTimeout}, function menuUpdated(menuAddOns){
            logs('Function menuUpdated(menuAddOns)');
            logs('menuAddOns = ' + JSON.stringify(menuAddOns));
            if ( ! ((typeof(menuAddOns) === 'object') && ( menuAddOns.hasOwnProperty('error'))) && (Array.isArray(menuAddOns) && (menuAddOns.length > 0))) {
                menuBase = Object.assign({}, menu);
                menuBase.submenu = menuBase.submenu.concat(menuAddOns);
                logs(`updatedMenu = ${JSON.stringify(menuBase, null, ' ')}`);
                menuBase = addMenuIndex(menuBase);
            }
            else {
                if ((typeof(menuAddOns) === 'object') && menuAddOns.hasOwnProperty('error')) {
                    logs(`Can't update menu from extension ${options.menuExtensions}! No result. Error is ${menuAddOns.error}`, true);
                }
                menuBase = addMenuIndex(menu);
            }
            doMenuExtended(user, menuBase, cmd, cmdPos, isAlert);
        });
    }
    else {
        menuBase = addMenuIndex(menu);
        doMenuExtended(user, menuBase, cmd, cmdPos, isAlert);
    }

}

/*** doMenu ***/
function doMenuExtended(user, menuBase, cmd, cmdPos, isAlert) {
    logs('Function doMenuExtended(user, menuBase, cmd, cmdPos, isAlert) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('menuBase = ' + JSON.stringify(menuBase));
    logs('cmd = ' + JSON.stringify(cmd));
    logs('cmdPos = ' + JSON.stringify(cmdPos));
    logs('isAlert = ' + JSON.stringify(isAlert));
    var timer;
    if (cmd !== undefined) {
        cmdPos = getItemPos(cmd);
    }
    else {
        if (cmdPos === undefined ) {
            cmdPos = getStateCached(user, 'menuItem');
        }
    }
    logs('cmdPos = ' + JSON.stringify(cmdPos));
    //const cmdItem = getMenuItem(cmdPos.concat(addMenuIndex(menu)));
    getMenuItem(cmdPos, addMenuIndex(menuBase), undefined, function doMenuTo (cmdItem){
        logs('cmdItem = ' + JSON.stringify(cmdItem));
        if( (cmd !== undefined) && (cmdItem !== undefined) && (cmdItem.submenu.length === 0) && cmdItem.hasOwnProperty('state') && ! cmdItem.hasOwnProperty('function')){
            let [currState, possibleValue] = cmdItem.state.split(':');
            var currObject = getObject(currState);
            if (currObject.common.hasOwnProperty('alias') && currObject.common.alias.hasOwnProperty('id')) {
                currObject = getObject(currObject.common.alias.id);
            }        
            logs('currObject = ' + JSON.stringify(currObject));
            var role = currObject.common.role;
            if (currObject.common.write) {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    showMsg('Ошибка! нет ответа', user);
                    cmdPos = cmdPos.slice(0, cmdPos.length-1);
                    showMenu(user, menuBase, cmdPos, cmdItem);
                }, 4000);
                setStateCached(user, 'currentState', currState);
                if(currObject.common.type === 'boolean'){
                    setState(currState, !getState(currState).val, function cb(){
                        clearTimeout(timer);
                        setStateCached(user, 'currentState', '');
                        cmdPos = cmdPos.slice(0, cmdPos.length-1);
                        showMsg('Успешно!', user);
                        showMenu(user, menuBase, cmdPos);
                        logs('currState.val = ' + getState(currState).val);
                    });
                } else {
                    if (currObject.common.hasOwnProperty('states') && (['string','number'].indexOf(currObject.common.type) >= 0 ) && ! ( possibleValue === undefined) ) {
                        if (currObject.common.type === 'number') {
                            possibleValue = Number(possibleValue);
                        }
                        const states = getPossibleStates(currObject.common.states);
                        logs('possibleValue = ' + JSON.stringify(possibleValue));
                        logs('Object.keys(states). = ' + JSON.stringify(Object.keys(states)));
                        if ((getState(currState).val !== possibleValue) && (Object.keys(states).indexOf('' + possibleValue) >= 0 )) {
                            setState(currState, possibleValue, function cb(){
                                clearTimeout(timer);
                                cmdPos = cmdPos.slice(0, cmdPos.length-1);
                                showMsg('Успешно!', user);
                                showMenu(user, menuBase, cmdPos);
                                logs('currState.val = ' + getState(currState).val);
                            });
                        }
                        else {
                            logs('НЕВЕРНОЕ ЗНАЧЕНИЕ ОБЬЕКТА');
                            showMsg('Неверное значение обьекта', user);
                            clearTimeout(timer);
                        }
                    }
                    else if ((currObject.common.type === 'number')) {
                        possibleValue = Number(possibleValue);
                        const step = Number(currObject.common.hasOwnProperty('step') ? currObject.common.step : 1);
                        if (((! currObject.common.hasOwnProperty('min')) || (possibleValue >= Number(currObject.common.min))) && 
                            ((! currObject.common.hasOwnProperty('max')) || (possibleValue <= Number(currObject.common.max))) && 
                            ((possibleValue % step) == 0 )) {
                            setState(currState, possibleValue, function cb(){
                                clearTimeout(timer);
                                cmdPos = cmdPos.slice(0, cmdPos.length-1);
                                showMsg('Успешно!', user);
                                showMenu(user, menuBase, cmdPos);
                                logs('currState.val = ' + getState(currState).val);
                            });
                        }
                        else {
                            logs('НЕВЕРНОЕ ЗНАЧЕНИЕ ОБЬЕКТА', true);
                            showMsg('Неверное значение обьекта', user);
                            clearTimeout(timer);
                        }

                    }
                    else {
                        clearTimeout(timer);
                        logs('НЕВЕРНЫЙ ТИП ОБЬЕКТА');
                        showMsg('Неверный тип обьекта', user);
                    }
                }
            }
            else {
                clearTimeout(timer);
                cmdPos = cmdPos.slice(0, cmdPos.length-1);
                showMenu(user, menuBase, cmdPos, cmdItem);
                logs('Объект ' + cmdItem.state + ' только для чтения!');
            }
        } else {
            showMenu(user, menuBase, cmdPos, cmdItem, isAlert);
        }
    });
}

/*** showMenu ***/
function showMenu(user, menuBase, itemPos, menuItem, isAlert) {
    logs('Function showMenuToUser(user, itemPos, menuItem, isAlert) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('menuBase = ' + JSON.stringify(menuBase));
    logs('itemPos = ' + JSON.stringify(itemPos));
    logs('menuItem = ' + JSON.stringify(menuItem));
    logs('isAlert = ' + JSON.stringify(isAlert));    
    if (itemPos === undefined) {
        itemPos = getStateCached(user, 'menuItem');
    }
    else {
        setStateCached(user, 'menuItem', itemPos);
    }
    getMenuItem(itemPos, menuBase, menuItem, function showMenuTo(subMenu){
        logs('Function showMenuTo(subMenu)');
        logs('subMenu = ' + JSON.stringify(subMenu));    
        /*var menuRows*/var menuCaption = {
            menutext: options.hierarhicalCaption ? '' : (menuBase.icon ? menuBase.icon + ' ':'') + skipIndex(menuBase.name),
            state: '',
            backIndex: getIndex(menuBase.name),
            buttons: []
        };
        var subMenuPos = itemPos.concat([]);
        logs('itemPos = ' + JSON.stringify(itemPos));
        logs('subMenuPos = ' + JSON.stringify(subMenuPos));
        logs('menuBase = ' + JSON.stringify(menuBase, undefined, ' '));
        /*menuRows = */getMenuRow(user, Object.assign({}, menuBase), subMenuPos, menuCaption, undefined, function showMenuRows(menuRows) {
        logs('Function showMenuRows(menuRows)');
        logs('menuRows = ' + JSON.stringify(menuRows, undefined, ' '));
        menuRows.buttons = splitMenu(menuRows.buttons);
        if(itemPos.length > 0){
            var lastRow = [{ text: options.backText, callback_data: options.backCmd + menuRows.backIndex + '-' }];
            if (options.showHome) {
                lastRow.push({ text: options.homeText, callback_data: options.homeCmd });
            }
            lastRow.push({ text: options.closeText, callback_data: options.closeCmd });
            menuRows.buttons.push(lastRow);
            logs('menuRows.buttons = ' + JSON.stringify(menuRows.buttons));
            if ( menuRows.hasOwnProperty('function') && (typeof menuRows.function === "function") ) {
                logs('itemPos = ' + JSON.stringify(itemPos));
                const functionResult = menuRows.function(subMenu, user, menuRows);
                if (typeof functionResult === 'string') {
                    menuRows.menutext += functionResult.length > 0 ? '\r\n' + functionResult : '';
                }
                else if (Array.isArray(functionResult) ) {
                    logs('functionResult = ' + JSON.stringify(functionResult));
                    showMenu(user, menuBase, functionResult);
                    return;
                }
            }
            else if (menuRows.hasOwnProperty('text') && (menuRows.text !== undefined)) {
                menuRows.menutext += menuRows.text.length > 0 ? menuRows.text : '';
            }
            const userMode = getStateCached(user, 'mode');
            const isAdmin = (options.admins_id.indexOf(user) >= 0) || (options.admins_id.indexOf(user.toString()) >= 0);
            const isAdminEnabled = (userMode !== undefined) && (userMode === 1);
            if ( isAdmin && isAdminEnabled) {
                let adminRow = [];
                if (menuRows.hasOwnProperty('room') && (menuRows.room !== undefined)) {
                    //for future
                }
                if (menuRows.hasOwnProperty('dictId') && (menuRows.dictId !== undefined)) {
                    adminRow.push(
                        { 
                            text: getFromDict('cmdRenameItem') + ' (' + menuRows.name.split(' (').shift() + ')', 
                            callback_data: 'cmdRenameItem' + ':' + menuRows.dictId,
                        });                
                }
                if (menuRows.hasOwnProperty('toRename') && (menuRows.toRename !== undefined)) {
                    logs('menuRows.toRename = ' + JSON.stringify(menuRows.toRename));
                    for (const[renameId, renameName] of Object.entries(menuRows.toRename)) {
                        adminRow.push(
                            { 
                                text: getFromDict('cmdRenameItem') + ' (' + renameName.split(' (').shift() + ')', 
                                callback_data: 'cmdRenameItem' + ':' + renameId
                            });
                    }
                }
                if (adminRow.length > 0) {
                    adminRow = splitMenu(adminRow);
                    for (const adminButtons of adminRow.values()) {
                        menuRows.buttons.push(adminButtons);
                    }                    
                }
            }        
            logs('menuRows 2 = ' + JSON.stringify(menuRows));
            sendMessage(user, menuRows, isAlert, false);
        } else {
            logs('menuRows 3 = ' + JSON.stringify(menuRows));
            menuRows.buttons.push([{ text: options.closeText, callback_data: options.closeCmd }]);
            sendMessage(user, menuRows, isAlert, ! getStateCached(user, 'menuOn'));
        }
        });
    });
}


/*** sendMessage ***/
function sendMessage(user, menuRows, isAlert, toDisplayMenu) {
    logs('Function sendMessage(user, menuRows, alertMessage, toDisplayMenu) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('menuRows = ' + JSON.stringify(menuRows));
    logs('isAlert = ' + JSON.stringify(isAlert));    
    logs('toDisplayMenu = ' + JSON.stringify(toDisplayMenu));
    let alertMessages = getStateCached(user, 'alertMessages');
    if (alertMessages === undefined) {
        alertMessages = [];
    }
    logs('alertMessages = ' + JSON.stringify(alertMessages));
    let alertMessage = '';
    if (alertMessages.length && (menuRows.buttons !== undefined) ) {
        alertMessage = '<b><u>' + alertMessages[alertMessages.length - 1].date + ':</u> ' + alertMessages[alertMessages.length - 1].message  + '</b>' + '\r\n' + '\r\n';
        logs('alertMessage = ' + JSON.stringify(alertMessages[alertMessages.length - 1].message));
        let alertRow = [{ text: options.acknowledgeText, callback_data: options.acknowledgeCmd}];
        let alerts = getStateCached(user, 'alerts');
        if (alerts.hasOwnProperty(alertMessages[alertMessages.length - 1].id)) {
            alertRow.push({ text: options.unsubscribeText, callback_data: options.unsubscribeCmd});
        }
        if (alertMessages.length > 1) {
            alertRow.push({ text: '(' + alertMessages.length + ') ' + options.acknowledgeAllText, callback_data: options.acknowledgeAllCmd});
        }
        alertRow = splitMenu(alertRow);
        for (const alertButtons of alertRow.values()) {
            menuRows.buttons.push(alertButtons);
        }
        //menuRows.buttons.push(alertRow);
    }    
    if (getStateCached(user, 'menuOn') || toDisplayMenu) {
        const timeStamp = '<i>' + (new Date()).format(options.datetimeTemplate) + '</i> ';
        const lastMessage = getStateCached(user, 'lastMessage');
        if ((lastMessage != JSON.stringify(menuRows)) || toDisplayMenu || isAlert) {
            logs('lastMessage is not equal to menuRows, sendTo Telegram initiated');
            logs('lastMessage = ' + JSON.stringify(lastMessage));
            logs('menuRows = ' + JSON.stringify(menuRows));
            setStateCached(user, 'lastMessage', JSON.stringify(menuRows));         
            let telegramObject = {
                    user: getUser(user),
                    text: alertMessage + (menuRows.buttons === undefined ? '' : timeStamp) + menuRows.menutext,
                    parse_mode: 'HTML'
                };
            if (toDisplayMenu || isAlert ) {
                if (menuRows.buttons !== undefined) {
                    telegramObject['reply_markup'] = {
                            inline_keyboard: menuRows.buttons,
                        }
                }
            }
            else {
                telegramObject['editMessageText'] = {
                        options: {
                            chat_id: user,
                            message_id: getStateCached(user, 'botSendMessageId'),
                            parse_mode: 'HTML', /*
                            reply_markup:  {
                                inline_keyboard: menuRows.buttons,
                            }*/
                        }
                    };
                if (menuRows.buttons !== undefined) {
                    telegramObject['editMessageText']['options']['reply_markup'] = {
                            inline_keyboard: menuRows.buttons,
                        }
                }
            }              
            menuRows.menutext += alertMessage;
            if (isAlert) {
                sendMessageQueued(user, [
                    {
                        user: getUser(user),
                        deleteMessage: {
                            options: {
                                chat_id: user,
                                message_id: getStateCached(user, 'botSendMessageId'),
                            }
                        }
                    }, telegramObject]);
            }
            else {
                sendMessageQueued(user, telegramObject);
            }
            if (toDisplayMenu || isAlert ) {
                setStateCached(user, 'menuOn', true);
            }
        }
        else {
            logs('lastMessage is equal to menuRows, sendTo Telegram skipped');
        }
         
    }

}


/*** sendMessageQueued ***/
function sendMessageQueued(user, telegramObject) {
    logs('Function sendMessageQueued(user, telegramObject) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('telegramObject = ' + JSON.stringify(telegramObject));
    const isLocked = user + '.isLocked';
    const userMessageQueue = user + '.messageQueue';
    logs('statesCache[' + isLocked + '] = ' + JSON.stringify(statesCache[isLocked]));
    logs('statesCache[' + userMessageQueue + '].length = ' + JSON.stringify(statesCache.hasOwnProperty(userMessageQueue) ? statesCache[userMessageQueue].length : undefined));
    if ((statesCache.hasOwnProperty(isLocked) && statesCache[isLocked]) ) {
        if (! statesCache.hasOwnProperty(userMessageQueue)) {
            statesCache[userMessageQueue] = [];
        }
        statesCache[userMessageQueue].push(telegramObject);
    }
    else {
        statesCache[isLocked] = true;
        if (Array.isArray(telegramObject)) {
            sendTo(options.telegram, telegramObject[0], function (result) {sendTo(options.telegram, telegramObject[1])});
        }
        else {
            sendTo(options.telegram, telegramObject);            
        }
        logs('statesCache[' + userMessageQueue + '] = ' + JSON.stringify(statesCache[userMessageQueue]));
        logs('telegramObject = ' + JSON.stringify(telegramObject));
    }
}


/*** getMenuRow ***/
function getMenuRow(user, subMenuRow, subMenuPos, menuRows, currentTab, callback) {
    logs('Function getMenuRow(user, subMenuRow, subMenuPos, menuRows, currentTab, callback) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('subMenuRow = ' + JSON.stringify(subMenuRow));
    logs('subMenuPos = ' + JSON.stringify(subMenuPos));
    logs('menuRows = ' + JSON.stringify(menuRows, undefined, ' '));
    logs('currentTab = ' + JSON.stringify(currentTab));
    logs('callback = ' + JSON.stringify(callback));
    var n;
    if (typeof subMenuRow.submenu === 'function') {
        logs('subMenuRow.submenu = ' + JSON.stringify(subMenuRow.submenu));
        subMenuRow.submenu = subMenuRow.submenu(subMenuRow);
        getMenuRow(user, subMenuRow, subMenuPos, menuRows, currentTab, callback);
    }
    else if (subMenuRow.extension !== undefined) {
        //const extensionScriptState = 'javascript.' + instance + '.' + options.menuExtensions.replace('.js.', 'Enabled.');
        //logs(`scriptState = ${JSON.stringify(extensionScriptState)}`);
        //if ((options.menuExtensions.length  > 0) && existsState(extensionScriptState)) {
            //logs(`scriptState ${JSON.stringify(extensionScriptState)} exists`);
            //const started = startScript(options.menuExtensions, true);
            //logs(`Script ${options.menuExtensions} is ${started ? 'already ' : ''}started`);
            messageTo(subMenuRow.extension, subMenuRow, {timeout: options.extensionsTimeout}, function subMenuUpdated(subMenu){
                logs('Function subMenuUpdated(subMenu)');
                logs('subMenu = ' + JSON.stringify(subMenu));
                if ( ! ((typeof(subMenu) === 'object') && ( subMenu.hasOwnProperty('error'))) && subMenu.hasOwnProperty('name')) {
                    logs(`subMenu = ${JSON.stringify(subMenu, null, ' ')}`);
                    subMenuRow = addMenuIndex(subMenu);
                    logs(`subMenuRow = ${JSON.stringify(subMenuRow, null, ' ')}`);
                }
                else {
                    if ((typeof(subMenu) === 'object') && subMenu.hasOwnProperty('error')) {
                        logs(`Can't update subMenu from extension ${subMenuRow.extension}! No result. Error is ${subMenu.error}`, true);
                    }
                }
                subMenuRow.extension = undefined;
                getMenuRow(user, subMenuRow, subMenuPos, menuRows, currentTab, callback);
            });
        //}        
    }
    else {
        options.hierarhicalCaption && (currentTab = currentTab === undefined ? '' : '      ' + currentTab);
        //if (subMenuRow.submenu.length > 0) {
            if ((subMenuRow.submenu.length > 0) && (subMenuPos.length > 0)) {
                menuRows.menutext += (options.hierarhicalCaption ? (currentTab.length > 0 ? ' > ' : '') + '\n\r ' + currentTab : ' > ')  + getItemIcon(user, subMenuRow.submenu[subMenuPos[0]]) + skipIndex(subMenuRow.submenu[subMenuPos[0]].name);
                menuRows.name = subMenuRow.submenu[subMenuPos[0]].hasOwnProperty('name') ? skipIndex(subMenuRow.submenu[subMenuPos[0]].name) : undefined;
                //menuRows.text = subMenuRow.submenu[subMenuPos[0]].hasOwnProperty('text') ? subMenuRow.submenu[subMenuPos[0]].text : undefined;
                n = subMenuPos.shift();
                logs('(1) subMenuRow.submenu[' + n + '] = ' + JSON.stringify(subMenuRow.submenu[n]));
                menuRows.function = subMenuRow.submenu[n].hasOwnProperty('function') ? subMenuRow.submenu[n].function : undefined;
                menuRows.state = subMenuRow.submenu[n].hasOwnProperty('state') ? subMenuRow.submenu[n].state : undefined;
                menuRows.type = subMenuRow.submenu[n].hasOwnProperty('type') ? subMenuRow.submenu[n].type : undefined;
                menuRows.room = subMenuRow.submenu[n].hasOwnProperty('room') ? subMenuRow.submenu[n].room : undefined;
                menuRows.funcEnum = subMenuRow.submenu[n].hasOwnProperty('funcEnum') ? subMenuRow.submenu[n].funcEnum : undefined;
                menuRows.dictId = subMenuRow.submenu[n].hasOwnProperty('dictId') ? subMenuRow.submenu[n].dictId : undefined;
                menuRows.toRename = {};
                if (subMenuPos.length > 0) {
                    menuRows.backIndex = getIndex(subMenuRow.submenu[n].name);
                }
                getMenuRow(user, subMenuRow.submenu[n], subMenuPos, menuRows, currentTab, callback);
            } else {
                logs(`subMenuRow 2 = ${JSON.stringify(subMenuRow, null, ' ')}`);
                /*if (menuRows.text === undefined)*/ menuRows.text = subMenuRow.hasOwnProperty('text') ? subMenuRow.text : undefined;                
                for (const subMenuItem of subMenuRow.submenu) {
                    if (subMenuItem.hasOwnProperty('dictId') && (subMenuItem.dictId !== undefined) && 
                        subMenuItem.hasOwnProperty('state') && (subMenuItem.state !== undefined) ) {
                        menuRows.toRename[subMenuItem.dictId] = skipIndex(subMenuItem.name);
                    }
                    menuRows.buttons.push({
                        text: getItemIcon(user, subMenuItem) + ' ' + skipIndex(subMenuItem.name),
                        callback_data: options.menuPrefix + subMenuItem.name
                    });
                }
                callback(menuRows);
            }
        /*}
        else {
            callback(menuRows);
        }*/
    }
}

/*** getItemIcon ***/
function getItemIcon(user, subMenuRowItem) {
    logs('Function getItemIcon(user, subMenuRowItem) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('subMenuRowItem = ' + JSON.stringify(subMenuRowItem));
    var icon = '';
    if (subMenuRowItem !== undefined) {
        if ((typeof subMenuRowItem.icons === 'object')) {
            if (subMenuRowItem.hasOwnProperty('state') && existsState(subMenuRowItem.state)) {
                icon = getState(subMenuRowItem.state).val ? subMenuRowItem.icons.on : subMenuRowItem.icons.off;
            } 
            else {
                icon = subMenuRowItem.icon;
            }
        }
        else if (typeof subMenuRowItem.icons === 'function') {
                icon = subMenuRowItem.icons(subMenuRowItem, user);
        }
        else {
            icon = subMenuRowItem.icon ? subMenuRowItem.icon : '' ;
        }
    }
    return icon;
}

/*** getItemPos ***/
function getItemPos(cmd) {
    logs('Function getItemPos(cmd) from ' + arguments.callee.caller.name);
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
function getMenuItem(itemPos, subMenu, menuItem, callback) {
    logs('Function getMenuItem(subMenuPos) from ' + arguments.callee.caller.name);
    logs('itemPos = ' + JSON.stringify(itemPos));
    logs('subMenu = ' + JSON.stringify(subMenu));
    let newSubMenu = subMenu;
    if (menuItem === undefined) {
        if (itemPos.length > 0) {
            if (subMenu !== undefined) {
                if (typeof subMenu.submenu === 'function') {
                    logs('subMenu.submenu = ' + JSON.stringify(subMenu.submenu));
                    newSubMenu = subMenu.submenu(subMenu);
                    logs('newSubMenu = ' + JSON.stringify(newSubMenu));
                    newSubMenu = newSubMenu.length > itemPos[0] ? newSubMenu[itemPos[0]] : undefined;
                }
                else {
                    newSubMenu = subMenu.submenu.length > itemPos[0] ? subMenu.submenu[itemPos[0]] : undefined;
                }
            }
            if (newSubMenu !== undefined) {
                getMenuItem(itemPos.slice(1), newSubMenu, undefined, callback);
                return
            }
        }
    }
    else {
        newSubMenu = menuItem;
    }
    logs('newSubMenu = ' + JSON.stringify(newSubMenu));
    callback(newSubMenu);
}


/*** clearMessage ***/
function clearMessage(user, isUserMessage, callback) {
    logs('Function clearMessage(user, isUserMessage) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('isUserMessage = ' + JSON.stringify(isUserMessage));
    logs('callback = ' + JSON.stringify(callback));
    const messageid = isUserMessage ? getStateCached(user, 'messageId') : getStateCached(user, 'botSendMessageId');
    logs('messageid = ' + messageid);
    setStateCached(user, 'lastMessage', '');
    sendTo(options.telegram, {
        user: getUser(user),
        deleteMessage: {
            options: {
                chat_id: user,
                message_id: messageid,
            }
        }
    }, callback);
}

/*** closeMenu ***/
function closeMenu(user) {
    logs('Function closeMenu(user) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    clearMessage(user, false);
    setStateCached(user, 'menuOn', false);
}

/*** splitMenu ***/
function splitMenu(menuArr) {
    logs('Function splitMenu(menuArr) from ' + arguments.callee.caller.name);
    logs('menuArr = ' + JSON.stringify(menuArr));
    let resultArr = [];
    if (options.maxWidth === 0) {
        var i, j;
        for (i = 0, j = menuArr.length; i < j; i += options.width) {
            resultArr.push(menuArr.slice(i, i + options.width));
        }
    }
    else {
        logs('options.maxWidth = ' + JSON.stringify(options.maxWidth));
        let buttonsRow = [];
        for (let i = 0; i < menuArr.length; i ++) {
            buttonsRow = [];
            logs('menuArr[ i = ' + i + ' ].length = ' + JSON.stringify(menuArr[i].text.length));
            let countLength = 0;
            for (let j = i; j < menuArr.length; j++) {
                logs('countLength = ' + JSON.stringify(countLength));          
                if ((countLength > 0) && (countLength + menuArr[j].text.length) > options.maxWidth) {
                    break;
                }
                else {
                    countLength += menuArr[j].text.length + (countLength === 0? 0 : 2);
                    buttonsRow.push(menuArr[j]);
                    i = j;
                }
            }
            logs('i = ' + JSON.stringify(i));
            logs('buttonsRow = ' + JSON.stringify(buttonsRow));
            resultArr.push(buttonsRow);
        }
    }
    return resultArr;
}

/*** showMsg ***/
function showMsg(text, user, showAlert) {
    logs('Function showMsg(text, user, showAlert) from ' + arguments.callee.caller.name);
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
    logs('Function addMenuIndex(menuRow) from ' + arguments.callee.caller.name);
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
            if (menuRow[key].hasOwnProperty('text') ) {
                newMenuRowItem.text = menuRow[key].text;
            }            
            if (menuRow[key].hasOwnProperty('extension') ) {
                newMenuRowItem.extension = menuRow[key].extension;
                newMenuRowItem.submenu = submenuExtensions;
            }
            if (newMenuRowItem.submenu === undefined) {
                if (Array.isArray(menuRow[key].submenu) && menuRow[key].submenu.length ) {
                    newMenuRowItem.submenu = addMenuIndex(menuRow[key].submenu, indexPrefix + key);
                }
                else {
                    newMenuRowItem.submenu = menuRow[key].submenu;
                }
            }
            newMenuRow.push(newMenuRowItem);
        }
    }
    else if ((typeof menuRow === 'object') && menuRow.hasOwnProperty('submenu')) {
        newMenuRow = {};
        newMenuRow.icon = menuRow.icon;
        const existingIndex = getIndex(menuRow.name);
        newMenuRow.name = (existingIndex === '' ?  '-' : '') + menuRow.name;
        newMenuRow.submenu = addMenuIndex(menuRow.submenu, existingIndex);
        if (menuRow.hasOwnProperty('text') ) newMenuRow.text = menuRow.text;
    }
    return newMenuRow;
}

/*** skipIndex ***/
function skipIndex(name) {
    logs('Function skipIndex(name) from ' + arguments.callee.caller.name);
    logs('name = ' + JSON.stringify(name));
    const indexOfDelimeter = name.indexOf('-');
    if (indexOfDelimeter >= 0) {
        return name.slice(indexOfDelimeter + 1);
    }
    else {
        return name;
    }
}

/*** getIndex ***/
function getIndex(name) {
    logs('Function getIndex(name) from ' + arguments.callee.caller.name);
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
    logs('Function getDeclIndex(strDecl) from ' + arguments.callee.caller.name);
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

/*** getObjectName ***/
function getObjectName(objectCommonName) {
    logs('Function getObjectName(objectCommonName) from ' + arguments.callee.caller.name);
    logs('objectCommonName = ' + JSON.stringify(objectCommonName));
    if (typeof objectCommonName === 'string') {
        return objectCommonName;
    } else if (typeof objectCommonName === 'object') {
        if (objectCommonName.hasOwnProperty(options.language)) {
            return objectCommonName[options.language];
        }
        else if (objectCommonName.hasOwnProperty("en")) {
            return objectCommonName["en"];
        }
        else {
            let objectCommonNames = objectCommonName.values();
            if (objectCommonNames.length > 0) {
                return objectCommonNames[0] ;
            }
        }
    }
    return 'Undefined';
}

/*** getRoomName ***/
function getRoomName(roomEnum, roomNames, roomDecl) {
    logs('Function getRoomName(roomEnum) from ' + arguments.callee.caller.name);
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
    logs('Function getUser(user) from ' + arguments.callee.caller.name);
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

/*** userInputCallback ***/
function userInputCallback(user, cmd) {
    logs('Function callback(user, cmd) from ' + arguments.callee.caller.name);
    logs('user = ' + JSON.stringify(user));
    logs('cmd = ' + cmd);
    if(options.menucall.indexOf(cmd) >= 0){
        if (options.clearmenucall) {
            clearMessage(user, true);
        }
        setStateCached(user, 'menuOn', false);
        doMenuItem(user, undefined, []);
    } else {
        if (cmd === options.closeCmd) {
            closeMenu(user);
        } 
        else if (cmd.indexOf(options.backCmd) === 0) {
            doMenuItem(user, undefined, getItemPos(cmd.replace(options.backCmd,'')));
        } 
        else if (cmd === options.homeCmd) {
            doMenuItem(user, undefined, []);
        }
        else if (cmd === options.acknowledgeCmd) {
            let alertMessages = getStateCached(user, 'alertMessages');
            logs('alertMessages = ' + JSON.stringify(alertMessages));
            if ((alertMessages !== undefined) && alertMessages.length > 0) {
                alertMessages.pop();
                setStateCached(user, 'alertMessages', alertMessages);
            }
            doMenuItem(user);
        } 
        else if (cmd === options.acknowledgeAllCmd) {
            setStateCached(user, 'alertMessages', []);
            doMenuItem(user);
        } 
        else if (cmd === options.unsubscribeCmd) {
            let alertMessages = getStateCached(user, 'alertMessages');
            logs('alertMessages = ' + JSON.stringify(alertMessages));
            if ((alertMessages !== undefined) && alertMessages.length > 0) {
                let alertMessage = alertMessages.pop();
                let alerts = Object.assign({}, getStateCached(user, 'alerts'));
                delete alerts[alertMessage.id]
                setStateCached(user, 'alerts', alerts);
                let count = 0;
                for (const user_id of options.users_id) {
                    let currentAlerts = getStateCached(user_id, 'alerts');
                    if ((currentAlerts !== undefined) && currentAlerts.hasOwnProperty(alertMessage.id)) {
                        count++;
                    }
                }                
                if (count === 0) {
                    unsubscribe(alertMessage.id);
                }
                setStateCached(user, 'alertMessages', alertMessages);
            }
            doMenuItem(user);
        } 
        else if (cmd.indexOf(options.menuPrefix) === 0) {
            doMenuItem(user, cmd.replace(options.menuPrefix,''))
        }
        else if (cmd.indexOf('cmdRenameItem:') === 0) {
            const dictId = cmd.split(':').pop();
            let menuRows = {
                menutext: getFromDict('pleaseRename') + ' (' + dictId + '):',
            };
            setStateCached(user, 'isWaitForInput', dictId);
            sendMessage(user, menuRows, false, false);
        }        
        else if (getStateCached(user, 'isWaitForInput')) {
            const dictId = getStateCached(user, 'isWaitForInput');
            putToDict(dictId, cmd);
            setStateCached(user, 'isWaitForInput', false);
            clearMessage(user, true);
            logs('New values is set');
            doMenuItem(user);
        }
    }
}




/*** subscribe on Telegram ***/

/*** telegramConnected ***/
function telegramConnected(connected) {
    logs('Function telegramConnected(connected)');
    logs('connected = ' + JSON.stringify(connected));
    if (typeof(connected) === 'object') {
        if (connected.hasOwnProperty('state') && connected.state.hasOwnProperty('val')) {
            connected = connected.state.val;
        }
    }
    unsubscribe(options.telegram + '.communicate.botSendRaw');
    unsubscribe(options.telegram + '.communicate.requestRaw');
    if (connected) {
        //answerRawSubscribe
        on({id: options.telegram + '.communicate.botSendRaw', change: 'ne'}, function answerRawSubscribe(obj) {
            logs('Function answerRawSubscribe(obj)');
            logs('obj = ' + JSON.stringify(obj));
            let sent = undefined;
            try {
                sent = JSON.parse(obj.state.val);
            } catch (err) {
                logs("Ошибка парсинга - " + JSON.stringify(err));
                return undefined;
            }    
            logs('val = ' + JSON.stringify(sent, undefined, ' '));    
            if ( typeof(sent) === 'object' ) {
                const user = sent.chat.id;
                const messageId = sent.message_id;
                logs('user = ' + JSON.stringify(user) + ' botSendMessageId = ' + JSON.stringify(messageId));
                if (sent.hasOwnProperty("reply_markup") && sent.reply_markup.hasOwnProperty("inline_keyboard") && (sent.reply_markup.inline_keyboard !== undefined) ) {
                    const inline_keyboard = sent.reply_markup.inline_keyboard;
                    logs('inline_keyboard = ' + JSON.stringify(inline_keyboard, undefined, ' '));
                    const isBotMessage = sent.reply_markup.inline_keyboard.findIndex(
                        (keyboard) => (
                            keyboard.findIndex(
                                (element) => (
                                    element.hasOwnProperty("callback_data") && (element.callback_data === "close")
                                ) 
                            ) >= 0 
                        )
                    );
                    logs('isBotMessage = ' + JSON.stringify(isBotMessage) + ' botSendMessageId = ' + JSON.stringify(messageId));
                    if (isBotMessage >= 0) {
                        setStateCached(user, 'botSendMessageId', messageId);
                    }
                }
                const isLocked = user + '.isLocked';
                const userMessageQueue = user + '.messageQueue';
                logs('statesCache[' + isLocked + '] = ' + JSON.stringify(statesCache[isLocked]));
                logs('statesCache[' + userMessageQueue + '].length = ' + JSON.stringify(statesCache.hasOwnProperty(userMessageQueue) ? statesCache[userMessageQueue].length : undefined));
                if ((statesCache.hasOwnProperty(isLocked) && statesCache[isLocked]) ) {
                    if (statesCache.hasOwnProperty(userMessageQueue) && statesCache[userMessageQueue].length ) {
                        let telegramObject = statesCache[userMessageQueue].shift();
                        logs('currentMessage = ' + JSON.stringify(telegramObject));
                        if (Array.isArray(telegramObject)) {
                            if (telegramObject[0].hasOwnProperty('deleteMessage')) {
                                telegramObject[0]['deleteMessage'].options.message_id = messageId;
                            }
                            sendTo(options.telegram, telegramObject[0], function (result) {sendTo(options.telegram, telegramObject[1])});
                        }
                        else {
                            for (let command of ['editMessageText', 'deleteMessage']) {
                                if (telegramObject.hasOwnProperty(command)) {
                                    telegramObject[command].options.message_id = messageId;
                                }
                            }
                            sendTo(options.telegram, telegramObject);
                        }
                    }
                    else {
                        statesCache[isLocked] = false;
                    }
                }
            }
        });
        //requestRawSubscribe
        on({id: options.telegram + '.communicate.requestRaw', change: 'ne'}, function requestRawSubscribe(obj) {
            logs('Function requestRawSubscribe(obj)');
            logs('obj = ' + JSON.stringify(obj));
            let request = undefined;
            try {
                request = JSON.parse(obj.state.val);
            } catch (err) {
                logs("Ошибка парсинга - " + JSON.stringify(err));
                return undefined;
            }
            logs('raw = ' + JSON.stringify(request,undefined,' '));
            if (request.hasOwnProperty('from') && request.from.hasOwnProperty('id')) {
                const user = request.from.id;
                if ((options.users_id.indexOf(user) >= 0) || (options.users_id.indexOf(user.toString()) >= 0)) {
                    let messageId = undefined;
                    let chatId = undefined;
                    let command = undefined;
                    if (request.hasOwnProperty('message_id')) {
                        messageId = request.message_id;
                    }
                    else if (request.hasOwnProperty('message') && request.message.hasOwnProperty('message_id')) {
                        messageId = request.message.message_id;
                    }
                    if (messageId !== undefined) {
                        if (request.hasOwnProperty('chat') && request.chat.hasOwnProperty('id')) {
                            chatId = request.chat.id;
                        }
                        else if (request.hasOwnProperty('message') && request.message.hasOwnProperty('chat') && request.message.chat.hasOwnProperty('id')) {
                            chatId = request.message.chat.id;
                        }
                        if (chatId != undefined) {
                            if (request.hasOwnProperty('text')) {
                                command = request.text;
                            }
                            else if (request.hasOwnProperty('data')) {
                                command = request.data;
                            }
                            logs('user = ' + JSON.stringify(user) + ' chatId = ' + JSON.stringify(chatId) + ' messageId = ' + JSON.stringify(messageId) + ' command = ' + JSON.stringify(command));
                            if (command !== undefined) {
                                setStateCached(user, 'user', {"firstName":request.from.first_name,"userName":request.from.username});
                                setStateCached(user, 'messageId', messageId);
                                userInputCallback(user, command);                        
                            }
                        }
                    }
                }
                else {
                    log('Доступ запрещен. Пользователя - ' + JSON.stringify(request.from.first_name) + ' ' + JSON.stringify(request.from.last_name)  + '(' + JSON.stringify(request.from.username) +') с id - ' + user + ' нет в списке доверенных.' );
                }
            }
        });
    }
}

initConfig();

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};


/*
* Date Format 1.2.3
* (c) 2007-2009 Steven Levithan <stevenlevithan.com>
* MIT license
*
* Includes enhancements by Scott Trenda <scott.trenda.net>
* and Kris Kowal <cixar.com/~kris.kowal/>
*
* Accepts a date, a mask, or a date and a mask.
* Returns a formatted version of the given date.
* The date defaults to the current date/time.
* The mask defaults to dateFormat.masks.default.
*/

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
		    val = String(val);
		    len = len || 2;
		    while (val.length < len) val = "0" + val;
		    return val;
		};

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
			    d: d,
			    dd: pad(d),
			    ddd: dF.i18n.dayNames[D],
			    dddd: dF.i18n.dayNames[D + 7],
			    m: m + 1,
			    mm: pad(m + 1),
			    mmm: dF.i18n.monthNames[m],
			    mmmm: dF.i18n.monthNames[m + 12],
			    yy: String(y).slice(2),
			    yyyy: y,
			    h: H % 12 || 12,
			    hh: pad(H % 12 || 12),
			    H: H,
			    HH: pad(H),
			    M: M,
			    MM: pad(M),
			    s: s,
			    ss: pad(s),
			    l: pad(L, 3),
			    L: pad(L > 99 ? Math.round(L / 10) : L),
			    t: H < 12 ? "a" : "p",
			    tt: H < 12 ? "am" : "pm",
			    T: H < 12 ? "A" : "P",
			    TT: H < 12 ? "AM" : "PM",
			    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
			    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
			    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
} ();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
    monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};
