//"use strict";

/* global autoTelegramMenuTelegramAdapterInstanceId */
/*************************************************/
/* Primary and only one thing to configure       */
/*************************************************/
const telegramInstance                  = autoTelegramMenuTelegramAdapterInstanceId ? `${autoTelegramMenuTelegramAdapterInstanceId}` :  '0';   // Primary and only one config parameter for the script
/*************************************************/
// All other constants and variables are only for internal use

// @ts-ignore
const nodeOS = require('node:os');
// @ts-ignore
const nodeFS = require('node:fs');
// @ts-ignore
const nodePath = require('node:path');
// @ts-ignore
const nodeProcess = require('node:process');
// @ts-ignore
const nodeVm = require('node:vm');

// @ts-ignore
const axios = require('axios');

/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */



const _l = true;

/*** Make functions to be printable in JSON.stringify with names ***/
Object.defineProperty(Function.prototype, "toJSON", {
    value:  function() { return `function ${this.name}` }
});

/*** Make RegExp to be printable in JSON.stringify with names ***/
Object.defineProperty(RegExp.prototype, "toJSON", {
    value: RegExp.prototype.toString
});

/*** Make new method `format` to be available for the Date object ***/
/*** Make RegExp to be printable in JSON.stringify with names ***/
Object.defineProperty(RegExp.prototype, "toJSON", {
    value: RegExp.prototype.toString
});

//*** Commands - begin ***//
const
    cmdPrefix                               = 'cmd',
    cmdBack                                 = `${cmdPrefix}Back`,
    cmdClose                                = `${cmdPrefix}Close`,
    cmdHome                                 = `${cmdPrefix}Home`,
    cmdAcknowledgeAlert                     = `${cmdPrefix}AckAlert`,
    cmdAcknowledgeAllAlerts                 = `${cmdPrefix}AckAllAlerts`,
    cmdAcknowledgeAndUnsubscribeAlert       = `${cmdPrefix}AckAndUnsAlert`,
    cmdAlertSubscribe                       = `${cmdPrefix}AlertSubscribe`,
    cmdGetInput                             = `${cmdPrefix}GetInput`,
    cmdUseCommonTranslation                 = `${cmdPrefix}UseCTransl`,
    cmdItemAdd                              = `${cmdPrefix}ItemAdd`,
    cmdItemPress                            = `${cmdPrefix}ItemPress`,
    cmdItemMoveUp                           = `${cmdPrefix}ItemMoveUp`,
    cmdItemMoveDown                         = `${cmdPrefix}ItemMoveDown`,
    cmdItemNameGet                          = `${cmdPrefix}ItemNameGet`,
    cmdItemDownload                         = `${cmdPrefix}ItemDownload`,
    cmdItemUpload                           = `${cmdPrefix}ItemUpload`,
    cmdItemDelete                           = `${cmdPrefix}ItemDel`,
    cmdItemDeleteConfirm                    = `${cmdPrefix}ItemDelConfirm`,
    cmdItemMark                             = `${cmdPrefix}ItemMark`,
    cmdItemsProcess                         = `${cmdPrefix}ItemsProcess`,
    cmdItemJumpTo                           = `${cmdPrefix}ItemsJumpTo`,
    cmdCreateReportEnum                     = `${cmdPrefix}CreateReportEnum`,
    cmdSetOffset                            = `${cmdPrefix}SetOffset`,
    cmdDeleteAllSentImages                  = `${cmdPrefix}DelAllSentImages`,
    cmdItemReset                            = `${cmdPrefix}ItemReset`,
    cmdCached                               = `${cmdPrefix}Cached`,
    cmdNoOperation                          = `${cmdPrefix}NoOp`,
    cmdEmptyCommand                         = 'emptyCmd',
//*** Commands - end ***//

    telegramAdapter = `telegram.${telegramInstance}`,

    //*** Various prefixes for ioBroker states ***//
    scriptRepositorySite                    = 'https://github.com/',
    scriptRepositorySubUrl                  = '/PeterVoronov/ioBrokerTelegramMenuScript/',
    scriptVersion                           = 'v0.9.5-dev',
    scriptBranchRemoteFolder                = `${scriptRepositorySubUrl}blob/${scriptVersion}/`,
    scriptCoreLocalesRemoteFolder           = `${scriptBranchRemoteFolder}locales/`,


    prefixPrimary                           = `0_userdata.0.telegram_automenu.${telegramInstance}`,
    prefixConfigStates                      = `${prefixPrimary}.config`,
    prefixTranslationStates                 = `${prefixPrimary}.translations`,
    prefixCacheStates                       = `${prefixPrimary}.cache`,
    prefixExtensionId                       = 'ext',
    prefixExternalStates                    = 'external',
    prefixEnums                             = 'enum',

    //*** Bot message identification stamp ***//
    botMessageStamp = '\u200B\uFEFF\uFEFF\uFEFF\u200B',

    //*** Graphs related constants ***//
    graphsDefaultTemplate                   = 'default',
    graphsTemporaryFolder                   = '_temp_',

    temporaryFolderPrefix                   = 'autoTelegramTemporary-',

    //*** Data type constants ***//
    dataTypeTranslation                     = 'transl',
    dataTypePrimaryEnums                    = 'enums',
    dataTypeDestination                     = 'dest',
    dataTypeFunction                        = 'funcs',
    dataTypeConfig                          = 'conf',
    dataTypeReport                          = 'reps',
    dataTypeReportMember                    = 'repMemb',
    dataTypeAlertSubscribed                 = 'alertS',
    dataTypeDeviceAttributes                = 'deviceAttributes',
    dataTypeDeviceButtons                   = 'deviceButtons',
    dataTypeStateValue                      = 'stateV',
    dataTypeMenuRoles                       = 'mRoles',
    dataTypeMenuRoleRules                   = 'mRoleR',
    dataTypeMenuUsers                       = 'mUsers',
    dataTypeMenuUserRoles                   = 'mUserR',
    dataTypeGraph                           = 'graph',
    dataTypeBackup                          = 'backup',
    dataTypeGroups                          = 'groups',
    dataTypeIgnoreInput                     = '=====',

    //*** Time interval constants ***//
    timeDelta24                             = '23:59:00',
    timeDelta48                             = '47:59:00',
    timeDelta96                             = '95:59:00',

    //*** ID constants ***//
    idEnumerations                          = 'enumerations',
    idFunctions                             = 'functions',
    idDestinations                          = 'destinations',
    idSimpleReports                         = 'simpleReports',
    idConfig                                = 'config',
    idTranslation                           = 'translation',
    idExternal                              = prefixExternalStates,
    idAlerts                                = 'alerts',

    //*** Items default delimiter ***//
    itemsDelimiter                          = '::',

    //*** Do commands ***//
    doAll                                   = 'all',
    doUpload                                = 'upload',
    doUploadDirectly                        = 'uploadD',
    doUploadFromRepo                        = 'uploadR',
    doDownload                              = 'download',

    //*** Time intervals ***//
    timeIntervalsInMinutes                           = {
        'm'                                 : 1,
        'h'                                 : 60,
        'D'                                 : 24*60,
        'W'                                 : 7*24*60,
        'M'                                 : 30*24*60,
        'Y'                                 : 365*24*60
    },
    timeIntervalsIndexList                  = Object.keys(timeIntervalsInMinutes).join(''),

    //*** Jump to commands ***//
    jumpToUp                                = '@up',
    jumpToLeft                              = '@left',
    jumpToRight                             = '@right',

    //*** Icons ***//
    iconItemDelete                          = '🗑️',
    iconItemEdit                            = '✍️',
    iconItemDisabled                        = '🚫',
    iconItemReadOnly                        = '👁️',
    iconItemNotFound                        = '❓',
    iconItemOn                              = '✅',
    iconItemOff                             = '❌',
    iconItemUser                            = '👤',
    iconItemUsers                           = '👥',
    iconItemRole                            = '🎭',
    iconItemAlertOn                         = '🔔',
    iconItemAlertOff                        = '🔕',
    iconItemAlerts                          = '📣',
    iconItemTranslation                     = '📖',
    iconItemCommon                          = '🌐',
    iconItemButton                          = '🔘',
    iconItemCheckMark                       = '✔️',
    iconItemSquareButton                    = '🔳',
    iconItemSquareButtonBlack               = '🔲',
    iconItemFull                            = '💯',
    iconItemMoveUp                          = '👆',
    iconItemMoveDown                        = '👇',
    iconItemMoveLeft                        = '👈',
    iconItemMoveRight                       = '👉',
    iconItemPinching                        = '🤏',
    iconItemDownload                        = '⏬',
    iconItemUpload                          = '⏫',
    iconItemDevice                          = '📺',
    iconItemChart                           = '📈',
    iconItemAttribute                       = '📑',
    iconItemFastLeft                        = '⏪',
    iconItemFastRight                       = '⏩',
    iconItemPlus                            = '➕',
    iconItemRefresh                         = '🔃',
    iconItemApply                           = '🆗',
    iconItemToSubItem                       = '↳',
    iconItemToSubItemByArrow                = '❱',
    iconItemIsExternal                      = '👾',
    iconItemBackup                          = '🗃️',
    iconItemBackupCreate                    = '⤵️',
    iconItemBackupRestore                   = '⤴️',
    iconItemAbove                           = '⤒',
    iconItemLess                            = '⤓',
    iconItemHistory                         = '📃',
    iconItemReset                           = '↺',
    iconItemUnavailable                     = '🆘'
    ;



//*** ConfigOptions - begin ***//

const
    cfgPrefix                               = 'cfg',
    cfgDefaultIconOn                        = `${cfgPrefix}DefaultIconOn`,
    cfgDefaultIconOff                       = `${cfgPrefix}DefaultIconOff`,
    cfgMaxButtonsOnScreen                   = `${cfgPrefix}MaxButtonsOnScreen`,
    cfgSummaryTextLengthMax                 = `${cfgPrefix}SummaryTextLengthMax`,
    cfgTextLengthModifierForGChats          = `${cfgPrefix}TextLengthModifierForGChats`,
    cfgMenuUsers                            = `${cfgPrefix}MenuUsers`,
    cfgMenuRoles                            = `${cfgPrefix}MenuRoles`,
    cfgMessagesForMenuCall                  = `${cfgPrefix}MessagesForMenuCall`,
    cfgClearMenuCall                        = `${cfgPrefix}ClearMenuCall`,
    cfgShowHomeButton                       = `${cfgPrefix}ShowHomeButton`,
    cfgShowResultMessages                   = `${cfgPrefix}ShowResultMessages`,
    cfgMenuRefreshInterval                  = `${cfgPrefix}MenuRefreshInterval`,
    cfgAllowToDeleteEmptyEnums              = `${cfgPrefix}AllowToDeleteEmptyEnums`,
    cfgConfigBackupCopiesCount              = `${cfgPrefix}ConfigBackupCopiesCount`,
    cfgAlertMessageTemplateMain             = `${cfgPrefix}AlertMessageTemplateMain`,
    cfgAlertMessageTemplateThreshold        = `${cfgPrefix}AlertMessageTemplateThreshold`,
    cfgCheckAlertStatesOnStartUp            = `${cfgPrefix}CheckAlertStatesOnStartUp`,
    cfgThresholdsForNumericString           = `${cfgPrefix}ThresholdsForNumericString`,
    cfgMenuLanguage                         = `${cfgPrefix}MenuLanguage`,
    cfgMenuFunctionsFirst                   = `${cfgPrefix}MenuFunctionsFirst`,
    cfgMenuFastGeneration                   = `${cfgPrefix}MenuFastGeneration`,
    cfgDateTimeTemplate                     = `${cfgPrefix}DateTimeTemplate`,
    cfgExternalMenuTimeout                  = `${cfgPrefix}ExternalMenuTimeout`,
    cfgHierarchicalCaption                  = `${cfgPrefix}HierarchicalCaption`,
    cfgHistoryAdapter                       = `${cfgPrefix}HistoryAdapter`,
    cfgGraphsTemplates                      = `${cfgPrefix}GraphsTemplates`,
    cfgGraphsScale                          = `${cfgPrefix}GraphsScale`,
    cfgGraphsIntervals                      = `${cfgPrefix}GraphsIntervals`,
    cfgAlertMessagesHistoryDepth            = `${cfgPrefix}AlertMessagesHistoryDepth`,
    cfgUpdateMessageTime                    = `${cfgPrefix}UpdateMessageTime`,
    cfgUpdateMessagesOnStart                = `${cfgPrefix}UpdateMessagesOnStart`,
    cfgDebugMode                            = `${cfgPrefix}DebugMode`;
const
    alertMessageTemplateDefault             = '${alertFunctionName} "${alertDeviceName} ${translations(In).toLowerCase} ${alertDestinationName}"${alertStateName? $value -:} ${alertStateValue}';

const
    configDefaultOptions = {
        [cfgMenuUsers]                      : {},
        [cfgMenuRoles]                      : {},
        [cfgMaxButtonsOnScreen]             : 24,                               // maximum buttons on one screen except alerts and global menu related
        [cfgMessagesForMenuCall]            : ['/menu'],                        // List of commands to show the menu
        [cfgMenuRefreshInterval]            : 0,                                // Interval to refresh current menu screen(forcibly from script for all users, disabled if '0')
        [cfgExternalMenuTimeout]            : 500,                              // Timeout to wait an answer from extensions
        [cfgHistoryAdapter]                 : '',                               // History adapter for eCharts
        [cfgGraphsTemplates]                : '',                               // Folder with e-charts templates
        [cfgAllowToDeleteEmptyEnums]        : true,                             // Allow to delete an empty enums (functions, destinations, reports)
        [cfgConfigBackupCopiesCount]        : 7,                                // Max backup copies of config to be stored. If 0 - automatic backup will not work
        [cfgAlertMessageTemplateMain]       : alertMessageTemplateDefault,
        [cfgAlertMessageTemplateThreshold]  : alertMessageTemplateDefault + " [${alertThresholdIcon}${alertThresholdValue}]",
        [cfgCheckAlertStatesOnStartUp]      : false,                            // Check stored states values on the start of script, to raise an alert
        [cfgThresholdsForNumericString]     : false,                            // Make possible to set thresholds for states of string type, which is really numeric
        [cfgDebugMode]                      : false,                            // Enable debug mode - huge amount of logs
        [cfgMenuLanguage]                   : "ru",                             // Menu display language
        [cfgMenuFunctionsFirst]             : true,                             // Menu display functions on top (or destinations)
        [cfgMenuFastGeneration]             : true,                             // Menu generation buster - less checks, possible empty submenus
        [cfgSummaryTextLengthMax]           : 30,                               // Maximum numbers of symbols per line (approximate, for )
        [cfgTextLengthModifierForGChats]    : -4,                               // Modifier for the max of symbols per line for a group chats
        [cfgClearMenuCall]                  : true,                             // Delete command, after menu is shown
        [cfgHierarchicalCaption]            : 0,                                // show caption of the current menu hierarchically
        [cfgShowHomeButton]                 : true,                             // Alway show 'Home' button
        [cfgShowResultMessages]             : true,                             // Show alert messages, as reactions on some input
        [cfgGraphsScale]                    : 1,                                // Scale for e-charts graphs
        [cfgGraphsIntervals]                : [
                                                {id: '2h',  minutes: timeIntervalsInMinutes.h * 2},
                                                {id: '6h',  minutes: timeIntervalsInMinutes.h * 6},
                                                {id: '12h', minutes: timeIntervalsInMinutes.h * 12},
                                                {id: '1D',  minutes: timeIntervalsInMinutes.D},
                                                {id: '3D',  minutes: timeIntervalsInMinutes.D * 3},
                                                {id: '1W',  minutes: timeIntervalsInMinutes.W},
                                                {id: '2W',  minutes: timeIntervalsInMinutes.W * 2},
                                                {id: '1M',  minutes: timeIntervalsInMinutes.M},
                                                {id: '3M',  minutes: timeIntervalsInMinutes.M * 3},
                                                {id: '6M',  minutes: timeIntervalsInMinutes.M * 6},
                                                {id: '1Y',  minutes: timeIntervalsInMinutes.Y },
                                            ],                                 // Time ranges back from now, in minutes
        [cfgDefaultIconOn]                  : iconItemOn,
        [cfgDefaultIconOff]                 : iconItemOff,
        [cfgAlertMessagesHistoryDepth]      : 48,                               // Alert messages history depth in hours
        [cfgUpdateMessageTime]              : '12:05',
        [cfgUpdateMessagesOnStart]          : 5,                                // Refresh menu messages after script start. If 0 - will not refresh.
        [cfgDateTimeTemplate]               : "DD.MM hh:mm:ss",                 // Template for date and time in Menu

    },

    configDefaultOptionMasks = {
        [cfgUpdateMessageTime]              : {text: 'hh:mm', rule:/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/},
        [cfgGraphsIntervals]                : {text: '#m|#h|#D|#W|#M|#Y', rule: new RegExp(`^(\\d+)([${timeIntervalsIndexList}])$`)}
    }
;

const
    configGlobalOptions = [ cfgMenuUsers, cfgMenuRoles, cfgMessagesForMenuCall, cfgMaxButtonsOnScreen,
                            cfgMenuRefreshInterval, cfgExternalMenuTimeout, cfgHistoryAdapter, cfgGraphsTemplates,
                            cfgAllowToDeleteEmptyEnums, cfgConfigBackupCopiesCount, cfgCheckAlertStatesOnStartUp,
                            cfgThresholdsForNumericString, cfgDebugMode],
    configHiddenOptions = [cfgMenuUsers, cfgMenuRoles],
    configOptionScopeGlobal = 'global',
    configOptionScopeUser = 'user',
    cachedConfigNewLanguageId = 'newLanguageId';

/**
 *  It's a class that manages a set of configuration options, and provides a menu to allow the user to change them.
 */
class ConfigOptions {
    /**
     * Constructor function for the class
     *
     * @param {string} prefix - prefix for storing the configuration items
     * @param {object} initialObject - default values for the configuration items
     * @param {object} cfgItemMasks - validation mask (RegExp) for the configuration items
     * @param {function} functionScheduleMenuMessageRenew - function, to refresh user menu, not rare, then 24 hours
     * @param {function} functionScheduleMenuUpdate - function to renew menu every `cfgMenuRefreshInterval)` seconds
     */
    constructor(prefix, initialObject, cfgItemMasks, functionScheduleMenuMessageRenew, functionScheduleMenuUpdate) {
        this.prefix = prefix;
        this.globalConfig = {...initialObject};
        this.configItemMasks = {...cfgItemMasks};
        this.perUserConfig = new Map();
        this.externalSubscriptions = new Map();
        this.menuSchedule = undefined;
        this.functionScheduleMenuMessageRenew = functionScheduleMenuMessageRenew;
        this.functionScheduleMenuUpdate = functionScheduleMenuUpdate;
    }

    /**
     * The function is used to determine if a configuration item can be a user configuration item.
     *
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {boolean}
     */
    #isUserConfigOption(cfgItem, user) {
        return (! configGlobalOptions.includes(cfgItem)) && (user && user.hasOwnProperty('userId') && user.userId);
    }

    /**
     * This method is used to generate sub-prefix for storing the configuration items.
     * If the config item is a user config option, then used the user's id, otherwise the string `global` is used
     *
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {string}
     */
    #getStateIdSubPrefix(cfgItem, user) {
        return  this.#isUserConfigOption(cfgItem, user) ? `${user.userId}` : configOptionScopeGlobal;
    }

    /**
     * This method returns a string that is the object/state id for the current config item
     *
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {string} `${this.prefix}.${this.#getStateIdSubPrefix(cfgItem, user)}.`;
     */
    #getStateId(cfgItem, user) {
        return  `${this.prefix}.${this.#getStateIdSubPrefix(cfgItem, user)}.${cfgItem}`;
    }

    /**
     * This method checks, if the current config item is exists
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {boolean} A boolean value.
     */
    existsOption(cfgItem, user) {
        if (this.#isUserConfigOption(cfgItem, user)) {
            if (this.perUserConfig.has(user.userId)) {
                const perUserConfig = this.perUserConfig.get(user.userId);
                return perUserConfig.hasOwnProperty(cfgItem)
                && (perUserConfig[cfgItem] !== undefined)
                && (perUserConfig[cfgItem] !== null);
            }
        }
        else {
            return this.globalConfig.hasOwnProperty(cfgItem) && (this.globalConfig[cfgItem] !== undefined) && (this.globalConfig[cfgItem] !== null);
        }
        return false;
    }

    /**
     * This method checks, if the config item has own separate value for current user then return it, otherwise return the global value
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {any} A copy of the value of the configuration item.
     */
    getOption(cfgItem, user) {
        if (this.#isUserConfigOption(cfgItem, user) && this.existsOption(cfgItem, user)) {
            return objectDeepClone(this.perUserConfig.get(user.userId)[cfgItem]);
        }
        else if (this.existsOption(cfgItem,)) {
            return objectDeepClone(this.globalConfig[cfgItem]);
        }
        else {
            return undefined;
        }
    }

    /**
     * This method checks, if the config item has related modifier - return the value with the modifier applied,
     * otherwise - return it as it is
     * @param {string} cfgItem - The id of the configuration item.
     * @param {object=} user - The user object.
     * @returns {any} A copy of the value of the configuration item.
     */
    getOptionWithModifier(cfgItem, user) {
        let result = this.getOption(cfgItem, user);
        switch (cfgItem) {
            case cfgSummaryTextLengthMax:
                if ((user.userId != user.chatId) && typeOf(result, 'number') && (this.existsOption(cfgTextLengthModifierForGChats, user) || this.existsOption(cfgTextLengthModifierForGChats))) {
                    result += this.getOption(cfgTextLengthModifierForGChats, user);
                }
                break;

            default:
                break;
        }
        return result;
    }

    /**
     * This method checks, if the config item exists then subscribe a function call on it's change
     * externalSubscriptions map.
     * @param {string} cfgItem - The id of the configuration item to subscribe to.
     * @param {function} functionToProcess - This is the function that will be called when the option is changed.
     */
    subscribeOnOption(cfgItem, functionToProcess) {
        if (this.existsOption(cfgItem) && (typeOf(functionToProcess) === 'function')) {
            this.externalSubscriptions.set(cfgItem, functionToProcess);
        }
    }

    /**
     * This method clear any subscription on config item changes.
     * @param {string} cfgItem - The id of the configuration item.
     */
    unSubscribeOnOption(cfgItem) {
        if (this.existsOption(cfgItem) && this.externalSubscriptions.has(cfgItem)) {
            this.externalSubscriptions.delete(cfgItem);
        }
    }

    /**
     * This method gets a validation mask (RegExp) for the configuration item.
     * @param {string} cfgItem - The id of the configuration item.
     * @returns {RegExp|undefined} The validation mask (RegExp) rule for the given configItem.
     */
    getMask(cfgItem) {
        if (this.configItemMasks.hasOwnProperty(cfgItem) && this.configItemMasks[cfgItem]) {
            return this.configItemMasks[cfgItem].rule;
        }
        return undefined;
    }

    /**
     * This method return the appropriate validation mask description, or data type of the configuration item.
     * @param {string} cfgItem - The id of the configuration item.
     * @returns {string|undefined} The validation mask description or type of the value of the config item.
     */
    getMaskDescription(cfgItem) {
        if (this.configItemMasks.hasOwnProperty(cfgItem) && this.configItemMasks[cfgItem]) {
            return this.configItemMasks[cfgItem].text;
        }
        else {
            const currentType = typeOf(this.globalConfig[cfgItem]);
            // @ts-ignore
            if (! ['array', 'map', 'object'].includes(currentType)) return currentType;
        }
        return undefined;
    }

    /**
     * This method sets the configuration item value. If this item can be user-specific - it will be stored separately,
     * in the user context. If the user value is equal to the global - user value will be cleared.
     * @param {string} cfgItem - The id of the config item to set.
     * @param {object|undefined} user - The user object.
     * @param {any} value - The value to set the config item to.
     */
    setOption(cfgItem, user, value) {
        if (this.#isUserConfigOption(cfgItem, user)) {
            const perUserConfig = this.perUserConfig.has(user.userId) ? this.perUserConfig.get(user.userId) : {};
            if (JSON.stringify(this.getOption(cfgItem, null), mapReplacer) === JSON.stringify(value, mapReplacer)) {
                this.deleteUserOption(cfgItem, user);
            }
            else {
                perUserConfig[cfgItem] = value;
                this.perUserConfig.set(user.userId, perUserConfig);
                this.saveOption(cfgItem, user);
            }
            if (cfgItem === cfgUpdateMessageTime) this.functionScheduleMenuMessageRenew(value, user.userId);
        }
        else {
            this.globalConfig[cfgItem] = value;
            this.saveOption(cfgItem);
            if (cfgItem === cfgUpdateMessageTime) this.functionScheduleMenuMessageRenew(value);
        }
    }

    /**
     * This method deletes a user-specific value of the configuration item.
     * @param {string} cfgItem - The id of the config item.
     * @param {object} user - The user object.
     */
    deleteUserOption(cfgItem, user) {
        if (this.#isUserConfigOption(cfgItem, user)) {
            const perUserConfig = this.perUserConfig.has(user.userId) ? this.perUserConfig.get(user.userId) : {};
            delete perUserConfig[cfgItem];
            this.perUserConfig.set(user.userId, perUserConfig);
            const stateId = this.#getStateId(cfgItem, user);
            if (existsState(stateId)) deleteState(stateId, (error, result) => {
                if (error) {
                    console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
                }
                else {
                    console.log(`configOptions key state '${stateId}' is deleted with result : ${JSON.stringify(result)}`);
                }
            });
        }
    }

    /**
     * This method takes a preliminary value of the config item, and convert it to the type, equal to the type of current(default) value the item.
     * @param {string} cfgItem - The id of the config item.
     * @param {any} value - the value to be parsed
     * @returns {any} The result of the parseOption function.
     */
    parseOption(cfgItem, value) {
        const currentType = typeOf(this.globalConfig[cfgItem]);
        let
            result,
            valueToParseType = typeOf(value);
        if (currentType === 'array') {
            if (valueToParseType === 'string') {
                if (value.indexOf('[') === 0) {
                    try {
                        result = JSON.parse(value);
                    }
                    catch (err) {
                        console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
                    }
                }
                else {
                    result = value.split(',');
                }
            }
            else if (typeOf(value) === 'array') {
                this.globalConfig[cfgItem] = value;
            }
        }
        else if (currentType === 'map') {
            if (valueToParseType === 'string') {
                try {
                    value = JSON.parse(value, mapReviver);
                }
                catch (err) {
                    console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
                }
                valueToParseType = typeof(value);
            }
            if (valueToParseType === 'map') {
                result = value;
            }
        }
        else if (currentType === 'object') {
            if (valueToParseType === 'string') {
                try {
                    value = JSON.parse(value);
                }
                catch (err) {
                    console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
                }
                valueToParseType = typeof(value);
            }
            if (valueToParseType === 'object') {
                result = value;
            }
        }
        else if (currentType === 'number') {
            if (valueToParseType === 'string') {
                if (! isNaN(value)) result = Number(value);
            }
            else if (valueToParseType === 'number') {
                result = value;
            }
        }
        else if (currentType === 'boolean') {
            if (valueToParseType === 'string') {
                if (['true', 'false'].includes(value)) result = value === 'true' ? true : false;
            }
            else if (valueToParseType === 'number') {
                result = value !== 0;
            }
            else if (valueToParseType === 'boolean') {
                result = value;
            }
        }
        if (currentType === 'string') {
            if (valueToParseType === 'string') {
                result = value;
            }
            else if ((valueToParseType === 'number') || (valueToParseType === 'boolean')) {
                result = `${value}`;
            }
            const currentMask =  this.getMask(cfgItem);
            switch (typeOf(currentMask)) {
                case 'regexp':
                    result = currentMask && currentMask.test(result) ? result : undefined;
                    break;
                default:
                    break;
            }
        }
        // console.log(`cfgItem = ${cfgItem}, result = ${JSON.stringify(result)}, typeOf(result) = ${typeOf(result)}`)
        return result;
    }


    /**
     * This method load, parse and set the value of the config item from the appropriate state.
     * @param {string} cfgItem - The id of the config item to load.
     * @param {object=} user - The user object.
     */
    loadOption(cfgItem, user) {
        const stateId = this.#getStateId(cfgItem, user);
        // console.log(`cfgItem = ${cfgItem}, user = ${user ? user.userId : ''}, id = ${id}`)
        if (existsState(stateId)) {
            const actualValue = this.parseOption(cfgItem, getState(stateId).val);
            if (actualValue !== undefined) this.setOption(cfgItem, user, actualValue);
            // console.warn(`Option ${this.#isUserConfigOption(cfgItem, user) ? user.userId : optionTypeGlobal} '${cfgItem}'  is configured to ' + ${JSON.stringify(this.getOption(cfgItem, user))} from ${id}`);
        }
        else if (! this.#isUserConfigOption(cfgItem, user) ) {
            this.saveOption(cfgItem, user);
        }
    }

    /**
     * This method loads values of the configuration item from the global and the user contexts.
     * @param {object=} user - The user object.
     */
    loadOptions(user) {
        for (const cfgItem of Object.keys(this.globalConfig)) {
            if ((! user) || (user && (! configGlobalOptions.includes(cfgItem)))) this.loadOption(cfgItem, user);
        }
        if (! user) {
            /** it will check all possible states under 'this.prefix' ... **/
            $(`state[id=${this.prefix}.*]`).each((stateId) => {
                const itemKey = '' + stateId.split('.').pop();
                if (! this.globalConfig.hasOwnProperty(itemKey)) {
                    console.log(`Found obsolete configOptions key = ${JSON.stringify(itemKey)}`);
                    deleteState(stateId, (error, result) => {
                        if (error) {
                            console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
                        }
                        else {
                            console.log(`configOptions key state '${stateId}' is deleted with result : ${JSON.stringify(result)}`);
                        }
                    });
                }
            });
        }
    }

    /**
     * This method subscribe on the changes of config items value out of the Telegram Menu
     */
    subscribeOnOptions() {
        on({id: new RegExp(`${this.prefix}.*`), change: 'ne', ack: false}, (obj) => {
            if (obj && obj.id) {
                const cfgItemPath = obj.id.replace(`${this.prefix}.`,'').split('.');
                logs(`cfgItemPath = ${cfgItemPath}`);
                if (cfgItemPath.length === 2) {
                    const [cfgItemPrefix, cfgItem] = cfgItemPath;
                    logs(`Start processing configOptions[${cfgItem}, ${cfgItemPrefix}] with possible value = ${obj.state.val}}`);
                    if (this.existsOption(cfgItem) && ((cfgItemPrefix === configOptionScopeGlobal)
                        // @ts-ignore
                        || (! isNaN(cfgItemPrefix)))) {
                        const actualValue = this.parseOption(cfgItem, obj.state.val);
                        if (actualValue !== undefined)  {
                            this.setOption(cfgItem, cfgItemPrefix === configOptionScopeGlobal ? null : {userId: Number(cfgItemPrefix)}, actualValue);
                            logs(`configOptions[${cfgItem}, ${cfgItemPrefix}] is set to ${JSON.stringify(actualValue)}`);
                        }
                        if (this.externalSubscriptions.has(cfgItem)) {
                            const functionToProcess = this.externalSubscriptions.get(cfgItem);
                            if (typeOf(functionToProcess)) {
                                functionToProcess(cfgItem);
                                logs(`External function ${functionToProcess} is executed on configOptions[${cfgItem}, ${cfgItemPrefix}] = ${JSON.stringify(actualValue)}`);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * This method  saves the value of a configuration item in appropriate state.
     * @param {string} cfgItem - The id of the config item
     * @param {object=} user - The user object, which is null if it is global option
     */
    saveOption(cfgItem, user) {
        let currentValue = this.getOption(cfgItem, user),
            stateType = typeof currentValue;
        if ((currentValue !== undefined) && (currentValue !== null)) {
            const
                id = this.#getStateId(cfgItem, user);
            // console.log(`cfgItem = ${cfgItem}, user = ${user ? user.userId : ''}, id = ${id}`)
            if (stateType === 'object') {
                currentValue = JSON.stringify(currentValue, mapReplacer);
                // @ts-ignore
                stateType = 'json';
            }
            if (existsState(id) && (getObject(id).common.type === stateType)) {
                setState(id, currentValue, true);
                // console.log('state ' + JSON.stringify(id) + ' saved for option ' + JSON.stringify(cfgItem) + ' = ' + JSON.stringify(currentValue));
            }
            else {
                if (existsState(id)) deleteState(id, (error, _result) => {
                    if (error) {
                        console.warn(`Error during deletion of state '${cfgItem}' : ${JSON.stringify(error)}`);
                    }
                    else {
                        // console.log(`configOptions key state '${cfgItem}' is deleted with result : ${JSON.stringify(result)}`);
                        createState(id, currentValue, {name: cfgItem, type: stateType, read: true, write: true});
                    }
                });
                createState(id, currentValue, {name: cfgItem, type: stateType, read: true, write: true});
                // console.log(`State ${id} is created for option ${cfgItem} = ${JSON.stringify(currentValue)}`);
            }
        }
    }

    /**
     * This method returns the object, contained all config items, as  for global as for users scope
     * @returns {object}
     */
    getDataForBackup() {
        const backupData = {
            globalConfig: this.globalConfig,
            perUserConfig: this.perUserConfig
        };
        return backupData;
    }

    /**
     * This method parses the backup object and set the config items values from it.
     * @param {object} backupData
     */
    restoreDataFromBackup(backupData) {
        if (typeOf(backupData, 'object') && backupData.hasOwnProperty('globalConfig') && typeOf(backupData.globalConfig, 'object')) {
            Object.keys(this.globalConfig).forEach(cfgItem => {
                if (backupData.globalConfig.hasOwnProperty(cfgItem) && (backupData.globalConfig[cfgItem] !== undefined) && (backupData.globalConfig[cfgItem] !== null)) {
                    // logs(`setOption(${cfgItem}) = ${JSON.stringify(backupData.globalConfig[cfgItem])}`, _l)
                    if (this.globalConfig[cfgItem] !== backupData.globalConfig[cfgItem]) this.setOption(cfgItem, null, backupData.globalConfig[cfgItem]);
                }
            });
            if (this.perUserConfig.size) {
                this.perUserConfig.forEach((userConfig, userId) => {
                    const userConfigBackup = backupData.hasOwnProperty('perUserConfig') && typeOf(backupData.perUserConfig, 'map') && backupData.perUserConfig.size && backupData.perUserConfig.has(userId) ? backupData.perUserConfig.get(userId) : undefined;
                    Object.keys(userConfig).forEach(cfgItem => {
                        if  (! (userConfigBackup && userConfigBackup.hasOwnProperty(cfgItem) && (userConfigBackup[cfgItem] !== undefined) && (userConfigBackup[cfgItem] !== null))) {
                            this.deleteUserOption(cfgItem, {userId});
                        }
                    });
                });
            }
            if (backupData.hasOwnProperty('perUserConfig') && typeOf(backupData.perUserConfig, 'map') && backupData.perUserConfig.size) {
                backupData.perUserConfig.forEach((userConfigData, userId) => {
                    Object.keys(this.globalConfig).forEach(cfgItem => {
                        if ( (! configGlobalOptions.includes(cfgItem)) && userConfigData.hasOwnProperty(cfgItem) && (userConfigData[cfgItem] !== undefined) && (userConfigData[cfgItem] !== null)) {
                            // logs(`setOption(${cfgItem}, ${JSON.stringify({userId})}) = ${JSON.stringify(userConfigData[cfgItem])}`, _l)
                            if (this.globalConfig[cfgItem] !== userConfigData[cfgItem]) this.setOption(cfgItem, {userId}, userConfigData[cfgItem]);
                        }
                    });
                });
            }
        }
    }


    /**
     * This method generates a submenu to process config items which as arrays as value based on
     * user's access level.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]}
     */
    menuGenerateForArray(user, menuItemToProcess) {
        logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            [cfgItem, optionScope] = commandUnpackParams(menuItemToProcess.param),
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            currentAccessLevel = menuItemToProcess.accessLevel,
            isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
            isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
            isSystemLevelOption = configGlobalOptions.includes(cfgItem),
            isThisLevelAllowModify = isSystemLevelOption ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify;
        let
            subMenuIndex = 0,
            subMenu = [];
        let currentArray = configOptions.getOption(cfgItem, optionScope === configOptionScopeGlobal ? null : user);
        for(const itemValue of currentArray) {
            const subMenuItem = {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `"${itemValue}"`,
                submenu: new Array()
            };
            if (isThisLevelAllowModify) {
                let subSubMenuIndex = 0;
                subSubMenuIndex = subMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeConfig, cfgItem, optionScope, subMenuIndex));
                subSubMenuIndex = subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeConfig, cfgItem, optionScope, subMenuIndex));
            }
            else {
                subMenuItem.param = cmdNoOperation;
            }
            subMenuIndex = subMenu.push(subMenuItem);
        }
        if (isThisLevelAllowModify) {
            subMenuIndex = subMenu.push(menuAddItemMenuItemGenerate(user, currentIndex, subMenuIndex, dataTypeConfig, cfgItem, optionScope, subMenuIndex));
        }
        return subMenu;
    }

    /**
     * This method generates a configuration options submenu for global and user-level parameters based on the user's access level.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]} An array of objects (menu items).
     */
    menuGenerate(user, menuItemToProcess) {
        logs(`user = ${user}, menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            currentIcon = menuItemToProcess.icon,
            currentAccessLevel = menuItemToProcess.accessLevel,
            isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
            isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
            optionTypes = ['systemLevelOptions', 'userLevelOptions'];
        let
            subMenu = [],
            subMenuIndex = 0;
        optionTypes.forEach(optionType => {
            const
                isSystemLevelOption = optionType === 'systemLevelOptions',
                isThisLevelAllowModify = isSystemLevelOption ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify,
                optionFilter = isSystemLevelOption ? (optionId) => (configGlobalOptions.includes(optionId)) : (optionId) => (! configGlobalOptions.includes(optionId)),
                optionTypeItem = {
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, optionType)}`,
                    icon: currentIcon,
                    submenu: new Array()
                    // text: ` [${this.cfg[cfgItem]}] `,
                };
            Object.keys(this.globalConfig)
            .filter(optionId => ! configHiddenOptions.includes(optionId))
            .filter(optionId => (optionFilter(optionId)))
            .forEach((cfgItem, itemOrder) => {
                const
                    itemType = typeOf(this.globalConfig[cfgItem]),
                    currentItemName = translationsItemCoreGet(user, cfgItem),
                    currentItem = {
                        index: `${currentIndex}.${subMenuIndex}.${itemOrder}`,
                        name: `${currentItemName}`,
                        icon: currentIcon,
                        // text: ` [${this.cfg[cfgItem]}] `,
                    };
                if (isThisLevelAllowModify) currentItem.submenu = new Array();
                let subSubMenuIndex = 0;
                if (isCurrentAccessLevelFull) {
                    subSubMenuIndex = currentItem.submenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}.${subMenuIndex}.${itemOrder}`, subSubMenuIndex, dataTypeTranslation, cfgItem));
                }
                const optionScopes = isSystemLevelOption ? [configOptionScopeGlobal] : (isCurrentAccessLevelFull && (! isSystemLevelOption) ?  [configOptionScopeGlobal, configOptionScopeUser] : [configOptionScopeUser]);
                optionScopes.forEach(optionScope => {
                    const
                        currentSubMenuItemName = translationsItemMenuGet(user, 'SetValue', optionScope === configOptionScopeGlobal ? configOptionScopeGlobal : ''),
                        subMenuItem = {
                            index: `${currentIndex}.${subMenuIndex}.${itemOrder}.${subSubMenuIndex}`,
                            name: `${currentSubMenuItemName}`,
                            icon: iconItemEdit,
                            param: commandsPackParams(cmdGetInput, dataTypeConfig, cfgItem, optionScope),
                            submenu: itemType === 'array' ? (user, menuItemToProcess) => {this.menuGenerateForArray(user, menuItemToProcess)} : []
                        };
                    const currentOptionValue = optionScope === configOptionScopeGlobal ? this.globalConfig[cfgItem] : this.getOption(cfgItem, user);
                    switch (cfgItem) {
                        case cfgMenuLanguage:
                            subMenuItem.accessLevel = currentAccessLevel;
                            subMenuItem.param = commandsPackParams(optionScope, currentOptionValue);
                            subMenuItem.submenu = (user, menuItemToProcess) => {
                                let
                                    subMenu = new Array(),
                                    subMenuIndex = 0;
                                const
                                    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                                    [optionScope, currentLanguage] = commandUnpackParams(menuItemToProcess.param);
                                Object.keys(translationsList).sort().forEach((languageId) => {
                                    const subMenuItem = {
                                        index: `${currentIndex}.${subMenuIndex}`,
                                        name: `${languageId}`,
                                        icon: currentLanguage === languageId ? configOptions.getOption(cfgDefaultIconOn) : '',
                                        param: currentLanguage === languageId ? cmdNoOperation : '',
                                        submenu: new Array()
                                    };
                                    if (currentLanguage !== languageId) {
                                        let subSubMenuIndex = 0;
                                        subSubMenuIndex = subMenuItem.submenu.push({
                                            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                            name: `${translationsItemCoreGet(user, 'cmdItemSelect')}`,
                                            icon: '',
                                            param: commandsPackParams(cmdItemPress, dataTypeConfig, cfgItem, optionScope, languageId),
                                            submenu: []
                                        });
                                        subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeConfig, cfgItem, optionScope, languageId));
                                    }
                                    subMenuIndex = subMenu.push(subMenuItem);
                                });
                                if (optionScope === configOptionScopeGlobal) {
                                    subMenuIndex = subMenu.push({
                                        index: `${currentIndex}.${subMenuIndex}`,
                                        name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                                        icon: iconItemPlus,
                                        param: commandsPackParams(cfgItem, optionScope),
                                        group: 'addNew',
                                        submenu: (user, menuItemToProcess) => {
                                            let
                                                subMenu = [],
                                                subMenuIndex = 0;
                                            const
                                                currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                                                [cfgItem, typeOfOption] = commandUnpackParams(menuItemToProcess.param);
                                            if (cachedExistsValue(user, cachedConfigNewLanguageId)) {
                                                const newLanguageId = translationsValidateLanguageId(cachedGetValue(user, cachedConfigNewLanguageId));
                                                if (newLanguageId && newLanguageId.length) {
                                                    subMenu.push(
                                                        {
                                                            index: `${currentIndex}.${subMenuIndex}`,
                                                            name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${newLanguageId}'`,
                                                            icon: iconItemApply,
                                                            group: cmdItemsProcess,
                                                            param: commandsPackParams(cmdItemsProcess, dataTypeConfig, cfgItem, typeOfOption, newLanguageId),
                                                            submenu: [],
                                                        }
                                                    );
                                                    cachedDelValue(user, cachedConfigNewLanguageId);
                                                }
                                                else {
                                                    subMenu.push(
                                                        {
                                                            index: `${currentIndex}.${subMenuIndex}`,
                                                            name: `${translationsItemCoreGet(user, 'cmdFixId')} = '${cachedGetValue(user, cachedConfigNewLanguageId)}'`,
                                                            icon: iconItemEdit,
                                                            param: commandsPackParams(cmdGetInput, dataTypeConfig, cfgItem, typeOfOption),
                                                            submenu: [],
                                                        }
                                                    );
                                                }
                                            }
                                            else {
                                                subMenu.push(
                                                    {
                                                        index: `${currentIndex}.${subMenuIndex}`,
                                                        name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
                                                        icon: iconItemEdit,
                                                        param: commandsPackParams(cmdGetInput, dataTypeConfig, cfgItem, typeOfOption),
                                                        submenu: [],
                                                    }
                                                );
                                            }
                                            return subMenu;
                                        }
                                    });
                                }
                                return subMenu;
                            };
                            break;

                        case cfgGraphsIntervals:
                            subMenuItem.submenu = (user, menuItemToProcess) => {
                                let
                                    subMenu = new Array(),
                                    subMenuIndex = 0;

                                const
                                    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                                    currentAccessLevel = menuItemToProcess.accessLevel,
                                    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
                                    isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
                                    [cfgItem, optionScope] = commandUnpackParams(menuItemToProcess.param),
                                    isThisLevelAllowModify = optionScope === configOptionScopeGlobal ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify,
                                    currentIntervals = this.getOption(cfgItem, optionScope === configOptionScopeUser ? user : undefined);
                                    const currentIntervalsMaxIndex = currentIntervals.length - 1;
                                currentIntervals.forEach(({id: graphsIntervalId, minutes: graphsIntervalMinutes}, graphsIntervalIndex) => {
                                    const subMenuItem = {
                                        index: `${currentIndex}.${subMenuIndex}`,
                                        name: `[${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}]`,
                                        text: `${graphsIntervalMinutes}`,
                                        submenu: new Array(),
                                    };
                                    if (isThisLevelAllowModify) {
                                        let subSubMenuIndex = 0;
                                        [subMenuItem.submenu,  subSubMenuIndex] = menuMoveItemUpDownMenuPartGenerate(user, subMenuItem.submenu,`${currentIndex}.${subMenuIndex}`, subSubMenuIndex,  graphsIntervalIndex, currentIntervalsMaxIndex, undefined, dataTypeConfig, cfgItem, optionScope, graphsIntervalIndex);
                                        subSubMenuIndex = subMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeTranslation, translationsItemTextGet(user, 'TimeRange', graphsIntervalId)));
                                        subSubMenuIndex = subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeConfig, cfgItem, optionScope, graphsIntervalIndex));
                                    }
                                    [subMenuItem.submenu,  subMenuIndex] = menuNavigationLeftRightMenuPartGenerate(user, subMenuItem.submenu, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, graphsIntervalIndex, currentIntervalsMaxIndex);
                                    subMenuIndex = subMenu.push(subMenuItem);
                                });
                                if (isThisLevelAllowModify) {
                                    subMenuIndex = subMenu.push(menuAddItemMenuItemGenerate(user, currentIndex, subMenuIndex, dataTypeConfig, cfgItem, optionScope, subMenuIndex));
                                    if (optionScope === configOptionScopeUser) {
                                        subMenuIndex = subMenu.push(menuResetItemMenuItemGenerate(user, currentIndex, subMenuIndex, dataTypeConfig, cfgItem));
                                    }
                                }
                                return subMenu;
                            };
                            break;

                        default:
                            break;
                    }
                    switch (itemType) {
                        case 'array': {
                            if (isThisLevelAllowModify) {
                                subMenuItem.accessLevel = currentAccessLevel;
                                subMenuItem.param = commandsPackParams(cfgItem, optionScope);
                            }
                            else {
                                currentItem.submenu = (user, menuItemToProcess) => {this.menuGenerateForArray(user, menuItemToProcess)};
                                currentItem.accessLevel = currentAccessLevel;
                                currentItem.param = commandsPackParams(cfgItem, optionScope);
                            }
                            break;
                        }
                        case 'number': {
                            if (isSystemLevelOption || (optionScope === configOptionScopeUser)) currentItem.name = `${currentItem.name} [${currentOptionValue}]`;
                            subMenuItem.name += `[${currentOptionValue}]`;
                            break;
                        }
                        case 'string': {
                            let maxTextLength = this.globalConfig[cfgSummaryTextLengthMax] - 5 - currentItemName.length;
                            if (isSystemLevelOption || (optionScope === configOptionScopeUser)) currentItem.name += ` ['${currentOptionValue.length > maxTextLength ? '...' : ''}${currentOptionValue.slice(-maxTextLength)}']`;
                            maxTextLength = this.globalConfig[cfgSummaryTextLengthMax] - 5 -currentSubMenuItemName.length;
                            subMenuItem.name += ` ['${currentOptionValue.length > maxTextLength ? '...' : ''}${currentOptionValue.slice(-maxTextLength)}']`;
                            break;
                        }
                        case 'boolean': {
                            if (isSystemLevelOption || (optionScope === configOptionScopeUser)) currentItem.name += ` ${currentOptionValue ? this.globalConfig[cfgDefaultIconOn] : this.globalConfig[cfgDefaultIconOff]}`;
                            subMenuItem.name += ` ${currentOptionValue ? this.globalConfig[cfgDefaultIconOn] : this.globalConfig[cfgDefaultIconOff]}`;
                            subMenuItem.param = commandsPackParams(cmdItemPress, dataTypeConfig, cfgItem, optionScope);
                            break;
                        }

                        default:
                            break;
                    }
                    if (isThisLevelAllowModify) {
                        subSubMenuIndex = currentItem.submenu.push(subMenuItem);
                    }
                    else if (itemType !== 'array') {
                        currentItem.param = cmdNoOperation;
                    }
                });
                optionTypeItem.submenu.push(currentItem);
            });
            subMenuIndex = subMenu.push(optionTypeItem);
        });
        return subMenu;
    }

    /**
     * If the refresh interval for menu is configured - then make init of the appropriate schedule
     */
    setScheduler() {
        if (this.menuSchedule) {
            logs('delete current schedule = ' + JSON.stringify(''));
            clearSchedule(this.menuSchedule);
            this.menuSchedule = undefined;
        }
        if (this.globalConfig.cfgMenuRefreshInterval > 0) {
            const scheduleString = '*' + (this.globalConfig.cfgMenuRefreshInterval < 60 ? '/' + this.globalConfig.cfgMenuRefreshInterval : '') +
                ' *' + (this.globalConfig.cfgMenuRefreshInterval >= 60 ? '/' + Math.trunc(this.globalConfig.cfgMenuRefreshInterval / 60) : '') +
                ' * * * *';
            logs('scheduleString = ' + JSON.stringify(scheduleString));
            // this.menuSchedule = schedule(scheduleString, () => {this.functionScheduleMenuUpdate});
        }
    }
}

/**
 * Global variable to store the all configuration options/items (ConfigOption class).
 */
const configOptions = new ConfigOptions(prefixConfigStates, configDefaultOptions, configDefaultOptionMasks, menuScheduleMenuMessageRenew, menuUpdateMenuBySchedule);


//*** ConfigOptions - end ***//


const
    cachedRolesNewRoleId = 'menuRolesNewRoleId',
    cachedRolesNewRule = 'menuRolesCurrentNewRule',
    cachedRolesRoleUnderEdit = 'menuRolesRoleUnderEdit',
    rolesIdAndMaskDelimiter = ':',
    rolesMaskAnyValue = '*',
    rolesMaskAnyItem = `${rolesMaskAnyValue}${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`,
    rolesInitialRule = {mask: rolesMaskAnyItem, accessLevel: ''},
    rolesAccessLevelFull = 'full',
    rolesAccessLevelSelective = 'selective',
    rolesAccessLevelReadOnly = 'read-only',
    rolesAccessLevelSilent = 'silent',
    rolesAccessLevelForbidden = 'forbidden',
    rolesAccessLevelPossible = 'possible',
    rolesDefaultAdmin = 'defaultAdmin',
    rolesDefaultUser = 'defaultUser';


//*** Roles - begin ***//

/**
 * Class to work with user roles for menu, based on rules with masks and access levels.
 */
class MenuRoles {

    static accessLevels = [rolesAccessLevelFull, rolesAccessLevelSelective, rolesAccessLevelReadOnly, rolesAccessLevelSilent, rolesAccessLevelForbidden, rolesAccessLevelPossible];
    static accessLevelsHidden = [rolesAccessLevelPossible];
    static accessLevelsIcons = [iconItemFull, iconItemPinching, iconItemReadOnly, iconItemAlertOff, iconItemDisabled];
    static accessLevelsPreventToShow = [rolesAccessLevelForbidden];

    /**
     * This method compares two access levels and returns a number that indicates which one is higher.
     * The result is the index of the accessLevelA in the array minus the index of the accessLevelB in the array.
     * @param {string} accessLevelA - The access level 'A'
     * @param {string} accessLevelB - The access level 'B'
     * @returns {number} result of comparison
     */
    static compareAccessLevels(accessLevelA, accessLevelB) {
        return MenuRoles.accessLevels.indexOf(accessLevelA) - MenuRoles.accessLevels.indexOf(accessLevelB);
    }

    /**
     * This method is a constructor for a class.
     * @param {string} configId - The id of the configuration item, which holds all internal class object data.
     */
    constructor(configId) {
        this.configId = configId;
        this.data = {};
        this.compiledData = {};
        this.getRelatedDataFunction = undefined;
    }

    /**
     * This method make a refresh of class instance - i.e. load and save.
     */
    refresh() {
        this.load();
        this.save();
    }

    /**
     * This method init(parse and compile it into appropriate RegExp objects) the all rules, assigned to the role.
     * @param {number|string=} itemId - rule item Id.
     */
    initRules(itemId) {
        if (itemId !== undefined) {
            itemId = this.existsId(itemId);
            if (typeOf(this.data[itemId], 'array')) this.data[itemId] = MenuRoles.sortRules(this.data[itemId]);
            this.compileRules(itemId);
        }
        else {
            Object.keys(this.data).forEach(roleId => {
                this.initRules(roleId);
            });
        }
    }

    /**
     * Load all roles and its rules from appropriate config item. Then init rules via `initRules`.
     */
    load() {
        if (configOptions.existsOption(this.configId)) this.data = objectDeepClone(configOptions.getOption(this.configId));
        if (Object.keys(this.data).length === 0) {
            this.data = {
                [rolesDefaultAdmin]: [
                    {mask: rolesMaskAnyItem, accessLevel: rolesAccessLevelFull},
                ],
                [rolesDefaultUser]: [
                    {mask: rolesMaskAnyItem , accessLevel: rolesAccessLevelSelective},
                    {mask: `setup${rolesIdAndMaskDelimiter}config`, accessLevel: rolesAccessLevelSelective},
                    {mask: `setup${rolesIdAndMaskDelimiter}alerts`, accessLevel: rolesAccessLevelFull},
                    {mask: `setup${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`, accessLevel: rolesAccessLevelForbidden}
                ]
            };
        }
        this.initRules();
    }

    /**
     * This method store the all roles and its rules in the appropriate config item.
     */
    save() {
        configOptions.setOption(this.configId, null, this.data);
    }

    /**
     * This function assigns the function that will be used to get the related data outside of the current class.
     * Used to share data between different classes - `MenuRoles` and `MenuUsers`.
     * @param {function} relatedGetDataFunction
     */
    assignRelated(relatedGetDataFunction) {
        this.getRelatedDataFunction = relatedGetDataFunction;
    }

    /**
     * Check the if the items with `itemId` is exists
     * @param {number|string} itemId - The itemId (roleId for the `MenuRoles`, userId for the `MenuUsers`).
     * @returns {string} The return a string contained itemId or empty string if doesn't exists.
     */
    existsId(itemId) {
        return this.data.hasOwnProperty(itemId) && (this.data[itemId] !== undefined) && (this.data[itemId] !== null) ? `${itemId}` : '';
    }

    /**
     * If the roleId doesn't exist, then create it. Otherwise add each rule from rulesList to the existing role.
     * @param {string} itemId - The role Id.
     * @param {string|object[]} rulesList - array of objects with properties `mask` and `accessLevel`.
     */
    addRole(itemId, rulesList) {
        if (! this.existsId(itemId)) {
            this.data[itemId] = [];
        }
        if (Array.isArray(rulesList)) {
            rulesList.forEach(newRule => {
                if ((typeof(newRule) === 'object') && newRule.hasOwnProperty('mask') && newRule.hasOwnProperty('accessLevel')) {
                    if (! this.data[itemId].find(rule => JSON.stringify(rule) === JSON.stringify(newRule))) {
                        this.data[itemId].push(newRule);
                    }
                }
            });
        }
        this.save();
    }

    /**
     * If the role exists and has no associated users, delete the role and save the data.
     * @param {string} itemId - The Id of the role to delete.
     * @param {string=} _options - The id of the role to delete.
     * @returns {boolean} The result of the delete operation.
     */
    delRole(itemId, _options) {
        let result = false;
        if (this.existsId(itemId)) {
            if  (this.getUsers(itemId).length === 0) {
                delete this.data[itemId];
                this.save();
                result = true;
            }
        }
        return result;
    }

    /**
     * Return an object with roles Id as names of the object properties, and the rules lists as its values.
     * If `itemId` is defined and exists - return object with only one property.
     * If `compiled` is set to `true` - return the 'compiles', i.e. RegExp rules, instead of text definitions.
     * @param {string=} itemId - The id of the role you want to get. If you want to get all roles, leave this blank.
     * @param {boolean=} compiled - Boolean selector of the rules format.
     * @returns {object} An object with the roleId's are the keys and the appropriate rules lists are the values.
     */
    getRoles(itemId, compiled) {
        let roles = {};
        if (itemId) {
            if (this.existsId(itemId)) {
                roles = {[itemId]: compiled ? this.compiledData[itemId] : this.data[itemId]};
            }
        }
        else {
            roles = this.sortRoles(compiled ? this.compiledData : this.data);
        }
        return roles;
    }

    /**
     * This method takes an object, sorts the properties, and returns a new object with the properties in sorted order.
     * @param {object} roles - The roles object.
     * @returns {object} An object with the keys sorted.
     */
    sortRoles(roles) {
        let sortedRoles = {};
        Object.keys(roles).sort().forEach(roleId => {
            sortedRoles[roleId] = roles[roleId];
        });
        return sortedRoles;
    }

    /**
     * This method sorts rules in rules array using the rule `mask` property.
     * @param {object[]} rules - Rules array.
     * @param {boolean=} inverseMasks - Boolean selector to use original or inverted masks/
     * @param {boolean=} sortDescending - The sort order boolean selector.
     * @returns {object[]} - arrays with sorted rules.
     */
    static sortRules(rules, inverseMasks, sortDescending) {
        let result = rules;
        if (rules && typeOf(rules, 'array') && (rules.length > 0)) {
            if (inverseMasks) {
                if (rules[0].hasOwnProperty('maskInverted') && rules[0].maskInverted) {
                    result = rules.sort((ruleA, ruleB) => (sortDescending ? ruleB.maskInverted.localeCompare(ruleA.maskInverted) : ruleA.maskInverted.localeCompare(ruleB.maskInverted)));
                }
                else {
                    result = rules.sort((ruleA, ruleB) => (sortDescending ? MenuRoles.maskInverse(ruleB.mask).localeCompare(MenuRoles.maskInverse(ruleA.mask)) : MenuRoles.maskInverse(ruleA.mask).localeCompare(MenuRoles.maskInverse(ruleB.mask))));
                }
            }
            else {
                result = rules.sort((ruleA, ruleB) => (sortDescending ? ruleB.mask.localeCompare(ruleA.mask) : ruleA.mask.localeCompare(ruleB.mask)));
            }
        }
        return result;
    }

    /**
     * This method invert a single mask. Mask has a format `prefix[:suffix]`, if dot and suffix
     * is exists - it return the 'suffix:prefix' value.
     * @param {string} mask - mask string.
     * @returns {string} - Inverted mask string.
     */
    static maskInverse(mask) {
        const [maskPrefix, maskSuffix] = mask.split(rolesIdAndMaskDelimiter);
        if (maskSuffix) {
            return `${maskSuffix}${rolesIdAndMaskDelimiter}${maskPrefix}`;
        }
        else {
            return maskPrefix;
        }
    }


    /**
     * If the getRelatedDataFunction is a function, then call it with the itemId parameter and return the
     * result. Otherwise, return an empty array.
     * @param {string} itemId - The id of the role you want to get the assigned users for.
     * @returns {string[]} An array of users Ids.
     */
    getUsers(itemId) {
        if (typeof(this.getRelatedDataFunction) === 'function') {
            return this.getRelatedDataFunction(itemId);
        }
        else {
            return [];
        }
    }

    /**
     * If the role with itemId exists, return the array of rules, otherwise return an empty array.
     * @param {string} itemId - The role ID to get the rules for.
     * @param {boolean=} _compiled - defined to be compatible with the child class (`MenuUsers`) method.
     * @returns {object[]} An array of rules.
     */
    getRules(itemId, _compiled) {
        if (this.existsId(itemId)) {
            return this.data[itemId];
        }
        return [];
    }

    /**
     * If the roleId exists and the rulesList is an array, then save the rulesList to the role.
     * If users is defined (i.e. object of the MenuUsers class) then call the updateRules method with the roleId.
     * @param {string} itemId - The role Id to set the rules for.
     * @param {object[]} rulesList - an array of rules objects.
     * @param {object=} users - object of the MenuUsers class.
     * @returns The return th result as boolean value.
     */
    setRules(itemId, rulesList, users) {
        if (this.existsId(itemId) && (Array.isArray(rulesList))) {
            this.data[itemId] = rulesList;
            this.initRules(itemId);
            if (users /* && users.hasOwnProperty('updateRules') */) users.updateRules(itemId);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * This method parse a text definitions of rules for the rule with Id = `itemId` and compile it to the appropriate set of RegExp objects.
     * @param {string} itemId - role Id to process.
     */
     compileRules(itemId) {
        if (this.existsId(itemId)) {
            const currentRules = this.data[itemId];
            if (typeOf(currentRules, 'array')) {
                let compiledData = new Array();
                currentRules.forEach(currentRule => {compiledData.push({...currentRule})});
                const compileRule = (inputRule) => {
                    const currentRule = {...inputRule};
                    const
                        [ruleMaskPrefix, ruleMaskSuffix] = currentRule.mask.split(rolesIdAndMaskDelimiter),
                        isPrefixAny = ruleMaskPrefix === rolesMaskAnyValue,
                        isSuffixAny = ruleMaskSuffix === rolesMaskAnyValue,
                        [ruleMaskPrefixParentId, ruleMaskPrefixDescendantId] = ruleMaskPrefix.split('.'),
                        [ruleMaskSuffixParentId, ruleMaskSuffixDescendantId] = ruleMaskSuffix.split('.');
                    if (! (isPrefixAny  && isSuffixAny)) {
                        if (! isPrefixAny) {
                            if (ruleMaskPrefixDescendantId && (MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) < 0) ) {
                                const
                                    parentMask = `${ruleMaskPrefixParentId}${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`,
                                    currentParent = compiledData.find(rule => (rule.mask === parentMask));
                                if (currentParent && (currentParent.accessLevel === rolesAccessLevelForbidden)) {
                                    currentParent.accessLevel = rolesAccessLevelPossible;
                                }
                                else if (! currentParent) {
                                    compiledData.push({
                                        mask: parentMask,
                                        accessLevel: rolesAccessLevelPossible
                                    });
                                }
                            }
                        }
                        if (! isSuffixAny) {
                            if (ruleMaskSuffixDescendantId && (MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) < 0)) {
                                const
                                    parentMask = `${ruleMaskPrefix}${rolesIdAndMaskDelimiter}${ruleMaskSuffixParentId}`,
                                    currentParent = compiledData.find(rule => (rule.mask === parentMask));
                                if (currentParent && (currentParent.accessLevel === rolesAccessLevelForbidden)) {
                                    currentParent.accessLevel = rolesAccessLevelPossible;
                                }
                                else if (! currentParent) {
                                    compiledData.push({
                                        mask: parentMask,
                                        accessLevel: rolesAccessLevelPossible
                                    });
                                }
                            }
                        }
                    }
                };
                this.data[itemId].forEach(currentRule => {compileRule(currentRule)});
                const regexpAny = `[^${rolesIdAndMaskDelimiter}]`;
                compiledData = MenuRoles.sortRules(compiledData);
                compiledData.forEach(currentRule => {
                    const
                        [ruleMaskPrefix, ruleMaskSuffix] = currentRule.mask.split(rolesIdAndMaskDelimiter),
                        isPrefixAny = ruleMaskPrefix === rolesMaskAnyValue,
                        isSuffixAny = ruleMaskSuffix === rolesMaskAnyValue,
                        [ruleMaskPrefixParentId, ruleMaskPrefixDescendantId] = ruleMaskPrefix.split('.'),
                        [ruleMaskSuffixParentId, ruleMaskSuffixDescendantId] = ruleMaskSuffix.split('.'),
                        regexpPrefix = isPrefixAny ? `${regexpAny}+?` : (ruleMaskPrefixDescendantId ? `${ruleMaskPrefixParentId}\\.${ruleMaskPrefixDescendantId}` :  `${ruleMaskPrefixParentId}${regexpAny}*?`),
                        regexpSuffix = isSuffixAny ? `${regexpAny}+?` : (ruleMaskSuffixDescendantId ? `${ruleMaskSuffixParentId}\\.${ruleMaskSuffixDescendantId}` : `${ruleMaskSuffixParentId}${regexpAny}*?`);
                currentRule.maskInverted = `${ruleMaskSuffix}${rolesIdAndMaskDelimiter}${ruleMaskPrefix}`;
                currentRule.regexpDirect = new RegExp(`^${regexpPrefix}\\${rolesIdAndMaskDelimiter}${regexpSuffix}$`);
                currentRule.regexpDirectHalf = new RegExp(isPrefixAny ?  `${regexpAny}+?` : (isSuffixAny || (MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0) ? `^${regexpPrefix}$` : '^$'));
                currentRule.regexpInverted = new RegExp(`^${regexpSuffix}\\${rolesIdAndMaskDelimiter}${regexpPrefix}$`);
                currentRule.regexpInvertedHalf = new RegExp(isSuffixAny ? `${regexpAny}+?` : (isPrefixAny || (MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0) ? `^${regexpSuffix}$`: '^$'));
                    // logs(`mask = ${currentRule.mask}, accessLevel = ${currentRule.accessLevel}. regexp = ${JSON.stringify(currentRule.regexpDirect)}`)
                });
                this.compiledData[itemId] = compiledData;
            }
        }
    }



    /**
     * This method returns the access level of a menu item for a given role, based on appropriate rules.
     * @param {string} itemId - The id of the role that is being checked.
     * @param {string} menuItemId - The id of the menu item.
     * @param {boolean=} inverseMasks - Boolean to process mask as it is or inverted.
     * @returns {string} The result accessLevel.
     */
    getMenuItemAccess(itemId, menuItemId, inverseMasks) {
        const result = MenuRoles.#getAccessLevel(menuItemId, this.getRules(itemId, true), false, inverseMasks);
        return result;
    }


    /**
     * This method returns the access level of a menu item for a effective role rules list, based on appropriate rules.
     * @param {string} menuItemId - The id of the menu item.
     * @param {object[]} effectiveRoleRulesList - The rules list(`Array`) to process.
     * @param {boolean=} returnRule - Boolean selector for the return value,
     *  in case of true will return the whole effective rule, instead of access level string.
     * @param {boolean=} inverseMasks - to process mask as it is or inverted.
     * @returns {object|string} The result is a rule object or access level sting.
     */
    static #getAccessLevel(menuItemId, effectiveRoleRulesList, returnRule, inverseMasks) {
        let result;
        const
            menuItemIdParts = menuItemId.split(rolesIdAndMaskDelimiter),
            [menuIdPrefix, menuIdSuffix] = menuItemId.split(rolesIdAndMaskDelimiter),
            regexpMatch = effectiveRoleRulesList.filter(rule => {
                const
                    regexp = menuIdSuffix ? (inverseMasks ? rule.regexpInverted: rule.regexpDirect) : (inverseMasks ? rule.regexpInvertedHalf: rule.regexpDirectHalf),
                    [maskPrefix, maskSuffix] = (inverseMasks ? rule.maskInverted : rule.mask ).split(rolesIdAndMaskDelimiter);
                return regexp.test(menuItemId) && (! ((menuItemIdParts.length === 1) && (maskPrefix === rolesMaskAnyValue) && (maskSuffix !== rolesMaskAnyValue) && (MenuRoles.accessLevelsPreventToShow.includes(rule.accessLevel))));
            });
        if (regexpMatch && regexpMatch.length) {
            result = {...MenuRoles.sortRules(regexpMatch, inverseMasks, true)[0]};
            const [maskPrefix, maskSuffix] = (inverseMasks ? result.maskInverted : result.mask).split(rolesIdAndMaskDelimiter);
            if (result.accessLevel === rolesAccessLevelPossible) {
                if (((maskPrefix !== rolesMaskAnyValue) && (maskPrefix !== menuIdPrefix)) || (menuIdSuffix && (maskSuffix !== rolesMaskAnyValue) && (maskSuffix !== menuIdSuffix))) {
                    result = undefined;
                }
            }
            else if ((! MenuRoles.accessLevelsPreventToShow.includes(result.accessLevel)) && (menuItemIdParts.length === 1) && (maskPrefix === rolesMaskAnyValue) && (maskSuffix !== rolesMaskAnyValue) ) {
                result.accessLevel = rolesAccessLevelPossible;
            }
            // else if ((! returnRule) && (menuItemId.split(idAndMaskDelimiter).length === 1) && (result.mask.split(idAndMaskDelimiter).length === 2) && (MenuRoles.compareAccessLevels(result.accessLevel, accessLevelForbidden) < 0)) {
            //     result.accessLevel = accessLevelPossible
            //     logs(`menuItemId = ${menuItemId}, result = ${JSON.stringify(result)}`);
            // }
        }
        // if (!returnRule) logs(`menuItemId = ${menuItemId}, result = ${JSON.stringify(result)}, \nregexpMatch = ${JSON.stringify(regexpMatch)}, \neffectiveRoleRulesList = ${JSON.stringify(effectiveRoleRulesList, null, 1)}`);
        result = returnRule ? result : (result !== undefined ? result.accessLevel : rolesAccessLevelForbidden);
        return result;
    }

    /**
     * The method is supposed to return a list of rules that is the result of filtering the first list of
     * rules by the second list of rules.
     * @param {object[]} rulesToFilter - The rules list(`Array`) that is being filtered.
     * @param {object[]} rulesAsFilter - The rules list(`Array`) that is being used to filter the roleToFilter.
     * @param {object[]} resultRules - The result rules list(`Array`), which will be enriched by this method.
     * @returns The enriched resultRules is being returned.
     */
    static #filterRoleByRole(rulesToFilter, rulesAsFilter, resultRules) {
        rulesToFilter.forEach(ruleToFilter => {
            let resultRule = MenuRoles.#getAccessLevel(ruleToFilter.mask, rulesAsFilter, true);
            if ((! resultRule) ||
                (MenuRoles.compareAccessLevels(ruleToFilter.accessLevel, resultRule.accessLevel) < 0) ||
                ((! ruleToFilter.mask.includes(rolesMaskAnyValue)) && resultRule.mask.includes(rolesMaskAnyValue)) ||
                (ruleToFilter.mask.includes(rolesMaskAnyValue) && resultRule.mask.includes(rolesMaskAnyValue)) && (ruleToFilter.mask.split('').filter(char => char === '.').length > resultRule.mask.split('').filter(char => char === '.').length)) {
                resultRule = ruleToFilter;
            }
            if (! resultRules.find(rule => ((rule.mask === resultRule.mask) && MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) <= 0))) {
                resultRules.push(resultRule);
            }
            else if (resultRules.find(rule => ((rule.mask === resultRule.mask) && MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) > 0))) {
                resultRules = resultRules.filter(rule => (! ((rule.mask === resultRule.mask) && MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) > 0)));
                resultRules.push(resultRule);
            }
        });
        return resultRules;
    }

    /**
     * This static method merge two rules lists(`Arrays`) to exclude doubles and overlapping.
     * @param {object[]} rulesListA - one rules list(`Array`).
     * @param {object[]} rulesListB - second rules list(`Array`).
     * @returns {object[]} Merged rules list(`Array`).
     */
    static mergeRulesLists(rulesListA, rulesListB) {
        if (! rulesListA) rulesListA = [];
        if (! rulesListB) rulesListB = [];
        if (rulesListA.length === 1 && (rulesListA[0].mask === rolesMaskAnyItem && rulesListA[0].accessLevel === rolesAccessLevelFull)) {
            return rulesListA;
        }
        else if (rulesListB.length === 1 && (rulesListB[0].mask === rolesMaskAnyItem && rulesListB[0].accessLevel === rolesAccessLevelFull)) {
            return rulesListB;
        }
        else {
            let resultRules = [];
            const maskAllA = rulesListA.find(rule => rule.mask === rolesMaskAnyItem);
            const maskAllB = rulesListB.find(rule => rule.mask === rolesMaskAnyItem);
            if (maskAllA && ( (! maskAllB) || (MenuRoles.compareAccessLevels(maskAllA.accessLevel, maskAllB.accessLevel) < 0))) {
                resultRules.push(maskAllA);
            }
            else if (maskAllB) {
                resultRules.push(maskAllB);
            }
            const
                roleAFiltered = rulesListA.filter(rule => rule.mask !== rolesMaskAnyItem),
                roleBFiltered = rulesListB.filter(rule => rule.mask !== rolesMaskAnyItem);
            resultRules = MenuRoles.#filterRoleByRole(roleAFiltered, roleBFiltered, resultRules);
            resultRules = MenuRoles.#filterRoleByRole(roleBFiltered, roleAFiltered, resultRules);
            return MenuRoles.sortRules(resultRules);
        }
    }

    /**
     * This method takes a mask (a string) and returns a readable string.
     * @param {object} user - The user object.
     * @param {string} mask - String in a format 'prefix:suffix'.
     * @returns {string} A string which expand prefix and suffix to the menu functions and destinations.
     */
    static #maskToReadable(user, mask) {
        const rootMenu = menuRootMenuItemGenerate(null);
        let [maskPrefix, maskSuffix] = mask.split(rolesIdAndMaskDelimiter);
        if (maskPrefix !== rolesMaskAnyValue) {
            const [maskPrefixParentId, maskPrefixDescendantId] = maskPrefix.split('.');
            let menuItem = rootMenu.submenu.find(item => item.id === maskPrefixParentId);
            if (menuItem && menuItem.hasOwnProperty('name')) {
                maskPrefix = menuItem.name;
                if (maskPrefixDescendantId) {
                    const menuItemDescendant = menuItem.descendants.find(item => item.id === maskPrefixDescendantId);
                    if (menuItemDescendant && menuItemDescendant.hasOwnProperty('name')) {
                        maskPrefix += `.${menuItemDescendant.name}`;
                        menuItem = menuItemDescendant;
                    }
                    else {
                        maskPrefix += `.${maskPrefixDescendantId}`;
                    }
                }
            }
        }
        if (maskSuffix !== rolesMaskAnyValue) {
            const
                isMenuFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst),
                secondLevelDataType = isMenuFunctionsFirst ? dataTypeDestination : dataTypeFunction,
                secondLevelList = enumerationsList[secondLevelDataType].list,
                [maskSuffixParentId, maskSuffixDescendantId] = maskSuffix.split('.');
            if (Object.keys(secondLevelList).includes(maskSuffixParentId)) {
                if (maskSuffixDescendantId) {
                    maskSuffix = Object.keys(secondLevelList).includes(maskSuffix) && secondLevelList[maskSuffix].hasOwnProperty('name')
                        ? translationsGetEnumName(user, secondLevelDataType, maskSuffix)
                        : maskSuffixDescendantId;
                }
                maskSuffix = `${(secondLevelList[maskSuffixParentId].hasOwnProperty('name')
                    ? translationsGetEnumName(user, secondLevelDataType, maskSuffixParentId)
                    : maskSuffixParentId)}${maskSuffixDescendantId ? `.${maskSuffix}` : ''}`;

            }
            else {
                for (const menuItem of rootMenu.submenu) {
                    if (Array.isArray(menuItem.submenu)) {
                        const subMenuItem = menuItem.submenu.find(item => item.id === maskSuffix);
                        if (subMenuItem && subMenuItem.hasOwnProperty('name')) {
                            maskSuffix = subMenuItem.name;
                            break;
                        }
                    }
                }
            }
        }
        return `${maskPrefix}${rolesIdAndMaskDelimiter}${maskSuffix}`;
    }

    /**
     * This method generates a submenu to show and process the access level an appropriate rule (existing or newly created).
     * @param {object} user - user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]} Newly generated submenu.
     */
    #menuRuleSetAccessLevel(user, menuItemToProcess) {
        logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        // logs(`existsCachedState(user, cachedCurrentNewRule) = ${existsCachedState(user, cachedCurrentNewRule)}`);
        // logs(`getCachedState(user, cachedCurrentNewRule) = ${JSON.stringify(getCachedState(user, cachedCurrentNewRule))}`);
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            [_cmdId, dataType, roleId, ruleIndex] = commandUnpackParams(menuItemToProcess.param),
            isForNewRule = Number(ruleIndex) == -1,
            currentRole = cachedExistsValue(user, cachedRolesRoleUnderEdit) ? cachedGetValue(user, cachedRolesRoleUnderEdit) : {roleId : 'emptyRole', rules: []},
            currentRoleRules = currentRole.roleId === roleId ? currentRole['rules'] : (this.existsId(roleId) ? this.getRules(roleId) : []),
            currentRule = isForNewRule
                ? (cachedExistsValue(user, cachedRolesNewRule) ? cachedGetValue(user, cachedRolesNewRule) : {})
                : (cachedExistsValue(user, cachedRolesNewRule) ? cachedGetValue(user, cachedRolesNewRule) : currentRoleRules[ruleIndex]);
        let
            subMenu = [],
            subMenuIndex = 0;
        logs(`currentRule = ${JSON.stringify(currentRule)}`);
        MenuRoles.accessLevels.filter(accessLevel => ! MenuRoles.accessLevelsHidden.includes(accessLevel)).forEach((accessLevel, levelIndex) => {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `[${translationsItemTextGet(user, 'AccessLevel', accessLevel)}]`,
                icon: accessLevel === currentRule.accessLevel ? MenuRoles.accessLevelsIcons[levelIndex] : iconItemButton,
                param: commandsPackParams(cmdItemPress, dataType, roleId, ruleIndex, accessLevel),
                submenu: []
            });
        });
        if ((isForNewRule || cachedExistsValue(user, cachedRolesNewRule)) && MenuRoles.accessLevels.includes(currentRule.accessLevel)) {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
                icon: iconItemApply,
                group: cmdItemsProcess,
                param: commandsPackParams(cmdItemsProcess, dataType, roleId),
                submenu: []
            });
        }
        return subMenu;
    }


    /**
     * This method takes a rule object, and returns a string containing formatted rule's details/properties (mask and accessLevel).
     * @param {object} user The user object.
     * @param {object} rule The rule object.
     * @returns {string} A formatted string.
     */
    static #ruleDetails(user, rule) {
        return  rule
            ?
                `\n<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, [
                    {label: translationsItemTextGet(user, 'RuleMask'), valueString:rule.mask},
                    {label: translationsItemTextGet(user, 'RuleAccessLevel'), valueString:rule.accessLevel}
                ])}</code>`
            :
                '';
    }


    /**
     * This method generates a submenu for the new `rule` creation for the `role`.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]} Newly generated submenu.
     */
    #menuGenerateRoleRulesAddItem(user, menuItemToProcess) {
        const isMenuFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst);
        /**
         * This method generates a submenu to select an appropriate access level for the `mask`.
         * @param {object} user - The user object.
         * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
         * @returns {object[]} Newly generated submenu.
         */
        function selectMask(user, menuItemToProcess) {
            const
                currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                [_cmdId, upperItemId, currentItemId] = commandUnpackParams(menuItemToProcess.param),
                currentMasks = [`${upperItemId}${rolesIdAndMaskDelimiter}${currentItemId}`, `${rolesMaskAnyValue}${rolesIdAndMaskDelimiter}${currentItemId}`],
                savedMask = cachedExistsValue(user, cachedRolesNewRule) ? cachedGetValue(user, cachedRolesNewRule)['mask'] : '',
                rootMenu = menuRootMenuItemGenerate(null),
                jumpToArray = [jumpToUp, jumpToUp, rootMenu.submenu.length];
            let
                subMenu = [],
                subMenuIndex = 0;
            if (upperItemId.includes('.')) jumpToArray.unshift(jumpToUp);
            currentMasks.forEach(currentMask => {
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `[${currentMask}]`,
                    icon: currentMask === savedMask ? iconItemSquareButton : iconItemButton,
                    param: commandsPackParams(cmdItemMark, dataTypeMenuRoleRules, currentMask),
                    submenu: []
                });
            });
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedMask}]`,
                icon: iconItemEdit,
                param: commandsPackParams(cmdItemJumpTo, jumpToArray.join('.')),
                submenu: []
            });
            return subMenu;
        }


        /**
         * This method takes a menu item, and generates a menu item based on `rootMenu` item, but with a submenu
         * that contains a list of all the possible subitems for that menu item (with no check of access levels).
         * @param {object} user - The user object.
         * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
         * @param {string} currentIndex - The current menu item index.
         * @param {string=} parentItemId - The parent menu item Id.
         * @returns {object} The resulted menu item.
         */
        function menuGenerateItemWithSubMenus(user, menuItemToProcess, currentIndex, parentItemId) {
            const resultItem = {
                index: `${currentIndex}`,
                name: `${menuItemToProcess.name}${menuItemToProcess.icon ? ` ${menuItemToProcess.icon}` : ''}`,
                icon: iconItemButton,
                group: parentItemId ? parentItemId : menuButtonsDefaultGroup,
                function: (user, _menuItemToProcess) => (MenuRoles.#ruleDetails(user, cachedGetValue(user, cachedRolesNewRule))),
                submenu: new Array()
            };
            const
                currentItemId = parentItemId ? `${parentItemId}.${menuItemToProcess.id}` : menuItemToProcess.id,
                enumId = isMenuFunctionsFirst ? 'funcEnum' : 'destEnum',
                enumNameDeclinationKey = isMenuFunctionsFirst ? enumerationsNamesMain : enumerationsNamesMany,
                secondLevelDataType = isMenuFunctionsFirst ? dataTypeDestination : dataTypeFunction,
                jumpArray = [jumpToUp, rootMenu.submenu.length],
                secondLevelList = enumerationsList[secondLevelDataType].list,
                secondLevelListIds = Object.keys(secondLevelList).filter((itemId) => (secondLevelList[itemId].isEnabled && secondLevelList[itemId].isAvailable)).sort((itemA, itemB) => (secondLevelList[itemA].order - secondLevelList[itemB].order));
            if (parentItemId) jumpArray.unshift(jumpToUp);
            let subIndex = 0;
            if (menuItemToProcess.hasOwnProperty(enumId)) {
                if (menuItemToProcess.hasOwnProperty('descendants')) {
                    menuItemToProcess.descendants.forEach(descendantItem => {
                        subIndex = resultItem.submenu.push(menuGenerateItemWithSubMenus(user, descendantItem, `${currentIndex}.${subIndex}`, menuItemToProcess.id));
                    });
                }
                secondLevelListIds.forEach(itemId => {
                    const currentItem = secondLevelList[itemId];
                    let currentItemName = translationsGetEnumName(user, secondLevelDataType, itemId, enumNameDeclinationKey);
                    if (itemId.includes('.')) {
                        const parentId = itemId.split('.').shift();
                        currentItemName = `${translationsGetEnumName(user, secondLevelDataType, parentId, enumNameDeclinationKey)} ${iconItemToSubItemByArrow} ${currentItemName}`;
                    }
                    subIndex = resultItem.submenu.push({
                        index: `${currentIndex}.${subIndex}`,
                        name: `${currentItemName}${currentItem.icon ? ` ${currentItem.icon}` :''}`,
                        icon: iconItemButton,
                        param: commandsPackParams(cmdEmptyCommand, currentItemId, itemId),
                        function: (user, _menuItemToProcess) => (MenuRoles.#ruleDetails(user, cachedGetValue(user, cachedRolesNewRule))),
                        submenu: selectMask
                    });
                });
            }
            else if (Array.isArray(menuItemToProcess.submenu)) {
                menuItemToProcess.submenu.forEach(subMenuItem => {
                    if (subMenuItem.hasOwnProperty('id') && subMenuItem.id) {
                        subIndex = resultItem.submenu.push({
                            index: `${currentIndex}.${subIndex}`,
                            name: `${subMenuItem.name}`,
                            icon: iconItemButton,
                            param: commandsPackParams(cmdEmptyCommand, currentItemId, subMenuItem.id),
                            function: (user, _menuItemToProcess) => (MenuRoles.#ruleDetails(user, cachedGetValue(user, cachedRolesNewRule))),
                            submenu: selectMask
                        });
                    }
                });
            }
            const currentMask = `${currentItemId}${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`;
            subIndex = resultItem.submenu.push({
                index: `${currentIndex}.${subIndex}`,
                name: `[${currentMask}]`,
                icon: currentMask === savedRule.mask ? iconItemSquareButton : iconItemButton,
                param: commandsPackParams(cmdItemMark, dataTypeMenuRoleRules, currentMask),
                submenu: []
            });
            subIndex = resultItem.submenu.push({
                index: `${currentIndex}.${subIndex}`,
                name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedRule.mask}]`,
                icon: iconItemEdit,
                param: commandsPackParams(cmdItemJumpTo, jumpArray.join('.')),
                submenu: []
            });
            // logs(`resultItem = ${JSON.stringify(resultItem)}`)
            return resultItem;
        }

        if (! cachedExistsValue(user, cachedRolesNewRule)) {
            cachedSetValue(user, cachedRolesNewRule, {...rolesInitialRule});
        }
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            roleId = menuItemToProcess.param,
            rootMenu = menuRootMenuItemGenerate(null),
            savedRule = cachedGetValue(user, cachedRolesNewRule);
        let
            subMenu = [],
            subMenuIndex = 0;
        rootMenu.submenu.forEach(rootMenuItem => {
            subMenuIndex = subMenu.push(menuGenerateItemWithSubMenus(user, rootMenuItem, `${currentIndex}.${subMenuIndex}`));
        });
        subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedRule.mask}]`,
            icon: iconItemEdit,
            param: commandsPackParams(cmdEmptyCommand, dataTypeMenuRoleRules, roleId, -1),
            function: (user, _menuItemToProcess) => (MenuRoles.#ruleDetails(user, savedRule)),
            submenu: (user, menuItemToProcess) => {return this.#menuRuleSetAccessLevel(user, menuItemToProcess)}});
            logs(`subMenu 2 = ${JSON.stringify(subMenu, null, 2)}`);
        return subMenu;
    }


    /**
     * This method generates a menu for a `role`, which has a list of `rules`, each rule having a `mask` and an `access level`.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]} Newly generated submenu.
     */
    #menuGenerateRoleRules(user, menuItemToProcess) {

        logs(`#ruleRolesMenuGenerate:\n user = ${user}, menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            currentAccessLevel = menuItemToProcess.accessLevel,
            roleId = menuItemToProcess.param,
            isNewRole = ! this.existsId(roleId);
        let currentRole = {};
        if (cachedExistsValue(user, cachedRolesRoleUnderEdit)) {
            currentRole = cachedGetValue(user, cachedRolesRoleUnderEdit);
            if (currentRole.roleId !== roleId) {
                cachedDelValue(user, cachedRolesRoleUnderEdit);
            }
        }
        if ((! cachedExistsValue(user, cachedRolesRoleUnderEdit)) || (currentRole.roleId !== roleId)) {
            currentRole = {roleId : roleId, rules: isNewRole ? [{...rolesInitialRule}] : this.getRules(roleId)};
        }
        const
            currentRoleRules = currentRole['rules'];
        let
            subMenu = [],
            subMenuIndex = 0;
        currentRoleRules.forEach(rule => {
            const
                maskReadable = MenuRoles.#maskToReadable(user, rule.mask),
                ruleCurrentDetails = MenuRoles.#ruleDetails(user, rule),
                currentItem = {
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `[${maskReadable}]`,
                    icon: MenuRoles.accessLevelsIcons[MenuRoles.accessLevels.indexOf(rule.accessLevel)],
                    text: ruleCurrentDetails,
                    submenu: new Array()
                };
            if ((roleId === rolesDefaultAdmin) || (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) >= 0)) {
                currentItem.param = cmdNoOperation;
            }
            else {
                let subSubId = 0;
                subSubId = currentItem.submenu.push({
                    index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
                    name: `${translationsItemMenuGet(user, 'RuleSetAccessLevel')}`,
                    // icon: iconItemDelete,
                    param: commandsPackParams(cmdEmptyCommand, dataTypeMenuRoleRules, roleId, subMenuIndex),
                    text: ruleCurrentDetails,
                    submenu: (user, menuItemToProcess) => {return this.#menuRuleSetAccessLevel(user, menuItemToProcess)}
                });
                if (rule.mask !== rolesMaskAnyItem) currentItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubId, dataTypeMenuRoleRules, roleId, subMenuIndex));
            }
            subMenuIndex = subMenu.push(currentItem);
        });
        if ((roleId !== rolesDefaultAdmin) &&  (isNewRole || (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0))) {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                group: 'itemAdd',
                icon: iconItemPlus,
                param: roleId,
                function: (user, _menuItemToProcess) => {
                    if (! cachedExistsValue(user, cachedRolesRoleUnderEdit)) {
                        cachedSetValue(user, cachedRolesRoleUnderEdit, {roleId : roleId, rules: currentRoleRules});
                    }
                    return MenuRoles.#ruleDetails(user, cachedGetValue(user, cachedRolesNewRule));
                },
                submenu: (user, menuItemToProcess) => {return this.#menuGenerateRoleRulesAddItem(user, menuItemToProcess)}
            });
            if ((isNewRole && currentRoleRules.length) || (JSON.stringify(this.getRules(roleId)) !== JSON.stringify(currentRoleRules))) {
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
                    icon: iconItemApply,
                    group: cmdItemsProcess,
                    param: commandsPackParams(cmdItemsProcess, dataTypeMenuRoles, roleId),
                    submenu: []
                });
            }
            else if ((! cachedExistsValue(user, cachedRolesRoleUnderEdit)) && ((this.existsId(roleId)) && (rolesInMenu.getUsers(roleId).length === 0))) {
                subMenuIndex = subMenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}`, subMenuIndex, dataTypeMenuRoles, roleId));
            }
        }
        return subMenu;
    }


    /**
     * This method returns a string containing a formatted details/properties of current role.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
     * @returns {string} A formatted string.
     */
    #menuItemDetailsRole(user, menuItemToProcess) {
        // logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            roleId = menuItemToProcess.param.includes(itemsDelimiter) ? commandUnpackParams(menuItemToProcess.param)[2]: menuItemToProcess.param,
            currentRoles = objectDeepClone(this.data);
            // logs(`existsCachedState(user, cachedCurrentRoleRules) = ${existsCachedState(user, cachedCurrentRoleRules)}`);
            if (cachedExistsValue(user, cachedRolesRoleUnderEdit)) {
                const newRole = cachedGetValue(user, cachedRolesRoleUnderEdit);
                if (! currentRoles.hasOwnProperty(newRole.roleId)) {
                    currentRoles[newRole.roleId] = newRole.rules;
                }
                // logs(`currentRoles = ${JSON.stringify(currentRoles)}`);
            }
        const
            currentRoleRules = currentRoles[roleId],
            currentRoleDetailsList= [
                {
                    label: translationsItemTextGet(user, 'RoleId'),
                    valueString: roleId
                },
                {
                    label: translationsItemTextGet(user, 'RoleRulesCount'),
                    valueString: `${currentRoleRules.length}`
                },
                {
                    label: translationsItemTextGet(user, 'RoleAssignedUsers'),
                    valueString: `${this.getUsers(roleId).length}`
                },
            ];
        return currentRoleDetailsList.length ? `\n<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, currentRoleDetailsList)}</code>` : '';
    }

    /**
     * This method generates a menu of roles, with possibility to edit or to add a new role.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]} Newly generated submenu.
     */
    menuGenerate(user, menuItemToProcess) {
        logs(`menuGenerate:\n user = ${user}, menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            currentIcon = menuItemToProcess.icon,
            currentAccessLevel = menuItemToProcess.accessLevel;
        let
            subMenu = [],
            subMenuIndex = 0;
        // this.data = this.loadData();
        cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesRoleUnderEdit);
        cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesNewRule);
        const currentRoles = objectDeepClone(this.getRoles());
        // logs(`existsCachedState(user, cachedMenuRolesCurrentNewRole) = ${existsCachedState(user, cachedMenuRolesCurrentNewRole)}`);
        if (cachedExistsValue(user, cachedRolesRoleUnderEdit)) {
            const newRole = cachedGetValue(user, cachedRolesRoleUnderEdit);
            if (! currentRoles.hasOwnProperty(newRole.roleId)) {
                currentRoles[newRole.roleId] = newRole.rules;
            }
            // logs(`currentRoles = ${JSON.stringify(currentRoles)}`);
        }
        Object.keys(currentRoles).forEach(roleId => {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `[${roleId}]`,
                icon: currentIcon,
                param: roleId,
                function: (user, menuItemToProcess) => {return this.#menuItemDetailsRole(user, menuItemToProcess)},
                accessLevel: currentAccessLevel,
                submenu: (user, menuItemToProcess) => {return this.#menuGenerateRoleRules(user, menuItemToProcess)}
            });
        });
        if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                group: 'addItem',
                icon: iconItemPlus,
                function: (user, _menuItemToProcess) => {
                    if (cachedExistsValue(user, cachedRolesNewRoleId)) {
                        const newRoleId = cachedGetValue(user, cachedRolesNewRoleId);
                        if (newRoleId.length <= 12) {
                            cachedSetValue(user, cachedRolesRoleUnderEdit, {roleId : newRoleId, rules: []});
                            cachedDelValue(user, cachedRolesNewRoleId);
                        }
                    }
                },
                submenu: (user, menuItemToProcess) => {
                    const
                        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
                    let
                        subMenu = [],
                        subMenuIndex = 0;
                    const newRoleId = cachedGetValue(user, cachedRolesNewRoleId);
                    if (newRoleId) {
                        if (newRoleId.length > 12) {
                            cachedSetValue(user, cachedRolesNewRoleId, newRoleId.slice(0, 12));
                            subMenuIndex = subMenu.push(
                                {
                                    index: `${currentIndex}.${subMenuIndex}`,
                                    name: `${translationsItemCoreGet(user, 'cmdFixId')}`,
                                    icon: iconItemEdit,
                                    param: commandsPackParams(cmdGetInput, dataTypeMenuRoles, '', 'fixId'),
                                    submenu: [],
                                }
                            );
                        }
                        else {
                            logs(`newRoleId = ${newRoleId}`);
                            const rootMenu = menuRootMenuItemGenerate(null);
                            subMenuIndex = subMenu.push(
                                {
                                    index: `${currentIndex}.${subMenuIndex}`,
                                    name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${newRoleId}'`,
                                    icon: iconItemRole,
                                    param: commandsPackParams(cmdItemJumpTo, [0, rootMenu.submenu.length].join('.')),
                                    submenu: []
                                }
                            );
                        }
                    }
                    else {
                        subMenu.push(
                            {
                                index: `${currentIndex}.${subMenuIndex}`,
                                name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
                                icon: iconItemEdit,
                                param: commandsPackParams(cmdGetInput, dataTypeMenuRoles, '', 'setId'),
                                submenu: [],
                            }
                        );
                    }
                    return subMenu;
                }
            });
        }
        return subMenu;
    }

}
//*** Roles - end ***//



//*** Users - begin ***//

/**
 *   Creating a class called MenuUsers that inherits from MenuRoles.
 */
class MenuUsers extends MenuRoles {
    /**
     * This function is a constructor for the class MenuUsers, which is a inherits the class
     * MenuRoles.
     * @param {string} configId - The id of the configuration item, which holds all internal class object data.
     */
    constructor(configId) {
        super(configId);
        this.itemDetailsList = ['isEnabled', 'userId', 'isAvailable', 'userName', 'firstName', 'lastName'];
    }

    /**
     * Load all users definitions and its roles from appropriate config item. Then init rules via `initRules`.
     */
    load() {
        if (configOptions.existsOption(this.configId)) this.data = configOptions.getOption(this.configId);
        const initial = Object.keys(this.data).length === 0;
        Object.keys(this.data).forEach(user => this.data[user].available = false);
        const telegramUsersId = `${telegramAdapter}.communicate.users`;
        if (existsState(telegramUsersId)) {
            const telegramUsersListState = getState(telegramUsersId);
            if (telegramUsersListState.hasOwnProperty('val') && telegramUsersListState.val && (typeof(telegramUsersListState) === 'object')) {
                const users = JSON.parse(telegramUsersListState.val);
                Object.keys(users).forEach(user => {
                    const userId = typeof(user) !== 'number' ? Number(user) : user;
                    if (this.data.hasOwnProperty(userId)) {
                        this.data[userId].available = true;
                        this.initRules(userId);
                    }
                    else {
                        this.data[userId] = {
                            userId: userId,
                            isAvailable: true,
                            isEnabled: initial,
                            roles: initial ? [rolesDefaultAdmin] : []
                        };
                        Object.keys(users[user]).forEach(attr => this.data[userId][attr] = users[user][attr]);
                    }
                });
            }
        }
    }

    /**
     * This method returns the string contained an userId if it exists, otherwise it returns an empty string.
     * @param {number|string} itemId - The user's Id.
     * @returns {string} string.
     */
    existsId(itemId) {
        itemId = `${itemId}`;
        return (this.data.hasOwnProperty(itemId) && this.data[itemId]) ? itemId : '';
    }

    /**
     * If the user with itemId exists and is enabled, return the string contained an itemId, otherwise return an empty string.
     * @param {number|string} itemId - The user's ID.
     * @returns {string} string.
     */
    validId(itemId) {
        itemId = `${itemId}`;
        return (this.existsId(itemId) && this.data[itemId].isEnabled) ? itemId : '';
    }

    /**
     * This method toggle the user state `isEnabled`.
     * @param {number|string} itemId - The Id of the user to toggle.
     */
    toggleItemIsEnabled(itemId) {
        itemId = this.existsId(itemId);
        if (itemId) {
            this.data[itemId].isEnabled = ! this.data[itemId].isEnabled;
            if (this.data[itemId].isEnabled) this.compileRules(itemId);
            this.save();
        }
    }

    /**
     * This method checks if the user with `itemId` has an appropriate `roleId`.
     * @param {number|string}itemId - The Id of the user to check for.
     * @param {string}roleId - The role Id to check for.
     * @returns {boolean} The return value is a boolean.
     */
    hasRole(itemId, roleId) {
        itemId = this.existsId(itemId);
        return itemId && this.data[itemId].roles.includes(roleId);
    }

    /**
     * This method adds a role with `roleId` to a user with Id = `itemId`.
     * @param {number|string} itemId - The Id of the user to modify.
     * @param {string} roleId - The Id of the a role to add.
     */
    addRole(itemId, roleId) {
        itemId = this.existsId(itemId);
        if (itemId) {
            if (! this.hasRole(itemId, roleId)) {
                if (Object.keys(this.getRoles()).includes(roleId)) {
                    this.data[itemId].roles.push(roleId);
                    this.compileRules(itemId);
                    this.save();
                }
            }
        }
    }

    /**
     * This method delete a role with `roleId` from a user with Id = `itemId`.
     * @param {number|string} itemId - The Id of the user to modify.
     * @param {string}roleId - The Id of the a role to be deleted.
     * @returns {boolean} The result of the deletion.
     */
    delRole(itemId, roleId) {
        let result = false;
        itemId = this.existsId(itemId);
        if (itemId && this.hasRole(itemId, roleId)) {
            this.data[itemId].roles.splice(this.data[itemId].roles.indexOf(roleId),  1);
            this.compileRules(itemId);
            this.save();
            result = true;
        }
        return result;
    }

    /**
     * This method return a sorted list of a roles (as an object properties) associated with the user with Id = `itemId`.
     * @param {number|string=} itemId - The Id of the user to process.
     * @param {boolean=} compiled - The boolean selector to define a return format of the roles rules.
     * @returns {object} An object as a list of roles as object properties.
     */
    getRoles(itemId, compiled) {
        let roles = {};
        if (itemId) {
            itemId = this.existsId(itemId);
            if (itemId && this.data[itemId]['roles'].length) {
                // logs(`getRoles ${userId} roles = ${JSON.stringify(this.data[userId]['roles'])}, ${typeof(this.getRelatedDataFunction)}`)
                if (typeof(this.getRelatedDataFunction) === 'function') {
                    this.data[itemId]['roles'].forEach(roleId => {
                        const role = this.getRelatedDataFunction ? this.getRelatedDataFunction(roleId, compiled) : undefined;
                        roles = {...roles, ...role};
                    });
                }
            }
        }
        else {
            roles = {...(this.getRelatedDataFunction ? this.getRelatedDataFunction(undefined, compiled) : {})};
        }
        // logs(`getRoles ${userId} ${JSON.stringify(roles)}`)
        return this.sortRoles(roles);
    }

    /**
     * This method returns the user object if the `itemId` exists, otherwise it returns undefined.
     * @param {number|string} itemId - The Id of the user to process.
     * @returns {object} The user object.
     */
    getUser(itemId) {
        itemId = this.existsId(itemId);
        if (itemId) {
            return this.data[itemId];
        }
        return undefined;
    }

    /**
     * This method returns an array of userIds for all users that associated with a roleId that matches the roleId passed in as
     * an argument.
     *
     * If no roleId is passed in, it returns an array of userIds for all existing users.
     * @param {number|string=} roleId - The role id to filter by. If not provided, all users are returned.
     * @returns {object[]} An array of userIds
     */
    getUsers(roleId) {
        const users = roleId ? Object.values(this.data).filter(user => user.roles.includes(roleId)) : Object.values(this.data);
        return users.map(user => user.userId);
    }

    /**
     * This method returns a list(`Object`) of rules objects the user with Id = `itemId` which merged from an associated roles rules lists(Arrays).
     * @param {number|string} itemId - The Id of the user to process.
     * @param {boolean=} compiled - The boolean selector to define a return format of the roles rules.
     * @returns {object[]} An array of rules.
     */
    getRules(itemId, compiled) {
        let rules = [];
        itemId = this.existsId(itemId);
        if (itemId) {
            rules = Object.values(this.getRoles(itemId, compiled));
            // logs(`getRules userId = ${userId} compiled = ${compiled} rules = ${JSON.stringify(rules)}`);
            if (rules.length) {
                if (rules.length === 1) {
                    rules = rules[0];
                }
                else {
                    rules = rules.reduce((previousValue, currentValue) => MenuRoles.mergeRulesLists(previousValue, currentValue));
                }
            }
        }
        return rules;
    }


    /**
     *  This method parse a text definitions of rules of an associated roles with user with Id = `itemId` and compile it to the appropriate sets of RegExp objects.
     * @param {number|string} itemId
     */
    compileRules(itemId) {
        itemId = this.existsId(itemId);
        if (itemId) {
            this.compiledData[itemId] = this.getRules(itemId, true);
        }
    }

    /**
     * This method is updates(compile) all rules of role with Id = `roleId` associated with a user with Id = `itemId`.
     * If the roleId is not defined - will process all roles for an appropriate user.
     * If the userId is not defined - will process all users associated with am appropriate role.
     * @param {string=} roleId - The Id of the role to process.
     * @param {number|string=} userId - The Id of the user to process.
     */
    updateRules(roleId, userId) {
        if (userId) {
            userId = this.existsId(userId);
            if (userId) {
                this.compileRules(userId);
            }
        }
        else {
            const users = this.getUsers(roleId);
            if (users) {
                users.forEach(userId => this.updateRules(undefined, userId));
            }
        }
    }


    /**
     * This method generates a menu of users, with possibility to edit user.
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @returns {object[]}  Newly generated submenu.
     */
    menuGenerate(user, menuItemToProcess) {
        logs(`user = ${user}, menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
        const
            currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            currentIcon = menuItemToProcess.icon;
        let
            subMenu = [],
            subMenuIndex = 0;
        this.load();
        Object.keys(this.data).forEach(userId => {
            const
                currentUser = this.data[userId],
                currentFullName = `${currentUser.firstName ? currentUser.firstName : ''}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`;
            logs(`currentUser = ${JSON.stringify(currentUser)}`);
            let  currentUserDetailsList= [];
            this.itemDetailsList.forEach((item) => {
                if (currentUser.hasOwnProperty(item)) {
                    const currentUserDetailsLineObject = {
                        label: `${translationsItemTextGet(user, 'user', item)}`
                    };
                    if (typeof(currentUser[item]) === 'boolean') {
                        currentUserDetailsLineObject.valueString = currentUser[item] ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user);
                        currentUserDetailsLineObject.lengthModifier = 1;
                    }
                    else {
                        currentUserDetailsLineObject.valueString =  currentUser.hasOwnProperty(item) ? currentUser[item] : currentItem;
                    }
                    currentUserDetailsList.push(currentUserDetailsLineObject);
                }
            });
            const currentItem = {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${currentFullName}${currentUser.userName ? ` [${currentUser.userName}]` : ''}`,
                icon: currentUser.isAvailable && currentUser.isEnabled ? iconItemUser : (! currentUser.isEnabled ? iconItemDisabled : iconItemNotFound),
                param: userId,
                text: currentUserDetailsList.length ? `\n<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, currentUserDetailsList)}</code>` : '',
                submenu: new Array()
            };
            let subSubId = 0;
            if (currentUser.userId !== user.userId) {
                subSubId = currentItem.submenu.push({
                    index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
                    name: `${translationsItemTextGet(user, currentUser.isEnabled ? 'SwitchOff' : 'SwitchOn')}`,
                    icon: currentUser.isEnabled ? currentIcon  : iconItemDisabled,
                    param: commandsPackParams(cmdItemPress, dataTypeMenuUsers, userId),
                    submenu: [],
                });
            }
            const rolesList = Object.keys(this.getRoles(userId)).join(',');
            currentItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
                name: `${translationsItemMenuGet(user, 'RolesList')}: [${rolesList.length > 23 ? `${rolesList.slice(0, 10)}...` : rolesList}]`,
                param: userId,
                submenu: (user, menuItemToProcess) => {
                    const
                        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                        userId = menuItemToProcess.param;
                    let
                        subMenu = [],
                        subMenuIndex = 0;
                    const
                        allRoles = Object.keys(this.getRoles()),
                        userRoles = Object.keys(this.getRoles(userId));
                    allRoles.forEach(roleId => {
                        subMenuIndex = subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `[${roleId}]`,
                            icon:  userRoles.includes(roleId) ? iconItemRole : iconItemDisabled,
                            param: commandsPackParams(cmdItemPress, dataTypeMenuUserRoles, userId, roleId),
                            submenu: []
                            // text: ` [${this.cfg[cfgItem]}] `,
                        });
                    });
                    return subMenu;
                },
            });
            subMenuIndex = subMenu.push(currentItem);
        });
        return subMenu;
    }

}

const
/**
 * Global variable to store the all menu roles (MenuRoles class).
 */
    rolesInMenu = new MenuRoles(cfgMenuRoles),
/**
 * Global variable to store the all menu users descriptions (MenuUsers class).
 */
    usersInMenu = new MenuUsers(cfgMenuUsers);

//*** Users - end ***//




//*** Translation - begin ***//
/**
 * Global variable to store the localization translations as na object properties.
 */
const translationsList = {};  // Localization translation
const
    translationsCommonFunctionsAttributesPrefix = `${idFunctions}.common`,
    translationsLocalesExtractRegExp = /<a.+?href="([^"]+)">locale_([^.]+).json<\/a>/g,
    translationsVersion = '1.0',
    translationsType = 'telegramMenuTranslation',
    cachedTranslationsToUpload = 'translationToUpload',
    translationsPrimaryStateId = 'primaryState',
    translationsExtensionsPrefix = 'extensions',
    translationsSubPrefix = 'translations',
    translationsCoreId = 'core',
    translationsTopItems = [translationsCoreId, idFunctions, idDestinations, idSimpleReports],
    translationsUpdateModes = ['replace', 'overwrite', 'enrich', 'template'];

/**
 * This function validates the language Id via `Intl.Collator.supportedLocalesOf()`.
 * @param {string} languageId - The language Id for validation.
 * @returns {string} - The language Id, if it is valid. `Undefined` in other case.
 */
function translationsValidateLanguageId(languageId){
    let langId = '';
    try {
        const canonicalLang = Intl.Collator.supportedLocalesOf(languageId);
        if ((languageId.length === 2) && (canonicalLang.length)) {
            langId = canonicalLang[0];
        }
    }
    catch (error) {
        console.warn(`Error of language id  '${languageId}' check '${error}'`);
    }
    return langId;
}

/**
 * This function store the current user translation to the appropriate state.
 * If user object is not defined - will store all existing translations from
 * the  global variable `translationsList`.
 * @param {object=} user - The user object.
 */
function translationsSave(user) {
    logs(`saveTranslation() from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    let translationIds = [];
    if (user) {
        translationIds.push(configOptions.getOption(cfgMenuLanguage, user));
    }
    else {
        translationIds = Object.keys(translationsList);
    }
    translationIds.forEach(languageId => {
        const
            translationId = `${prefixTranslationStates}.${languageId}`,
            translationString = JSON.stringify(objectKeysSort(translationsList[languageId]));
        logs(`translationId = ${translationId} namesTranslation = ${JSON.stringify(translationsList[languageId], null, 2)}`);
        if (existsState(translationId)) {
            setState(translationId, translationString, true);
        }
        else {
            // @ts-ignore
            createState(translationId, translationString, {name: `Translation ${languageId}`, type: 'json', read: true, write: true});
        }
    });
    if (! user) {
        /** it will check all possible states under 'this.prefix' ... **/
        $(`state[id=${prefixTranslationStates}.*]`).each((stateId) => {
            const languageId = '' + stateId.split('.').pop();
            if (! translationsList.hasOwnProperty(languageId)) {
                console.log(`Found obsolete translation language = ${JSON.stringify(languageId)}`);
                deleteState(stateId, (error, result) => {
                    if (error) {
                        console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
                    }
                    else {
                        console.log(`Obsolete translation language state '${stateId}' is deleted with result : ${JSON.stringify(result)}`);
                    }
                });
            }
        });
    }
}

/**
 * This function loads all translations from the appropriate states
 * under `translationStatePrefix` path.
 */
function translationsLoad() {
    logs(`loadTranslation() from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    $(`state[id=${prefixTranslationStates}.*]`).each( (translationId) => {
        const
            languageId = translationId.replace(`${prefixTranslationStates}.`, ''),
            canonicalLang = translationsValidateLanguageId(languageId);
        // logs(`languageId = ${languageId}, langId = ${langId}`);
        if (canonicalLang) {
            try {
                // logs(`langId = ${langId}, translationId = ${translationId}`);
                translationsList[canonicalLang] = JSON.parse(getState(translationId).val);
            }
            catch (error) {
                console.warn(`Can't process a translation for language ${languageId}!`);
                // translationList[languageId] = {};
            }
            // logs(`translationsList[${langId}] = ${JSON.stringify(translationsList[langId])}`);
        }
        else {
            console.warn(`Unknown language id '${languageId}', can't process it!`);
        }
    });
}

/**
 * This functions downloads locales from the repo and returns the translations object into the `callback` function.
 * @param {string} languageId - The language Id, like 'en', 'de', 'uk', ..., or 'all', to download all of them.
 * @param {string} extensionId - The extension id, to download specific translations.
 * @param {function(object=, string|object=):void} callback - The callback function in format `callback(translation, error)`.
 */
function translationsLoadLocalesFromRepository(languageId, extensionId, callback) {
    /**
     * This functions process the list of locales links iterative way, and returns the translations object into the `callback` function.
     * @param {object} repo - The axios object, initiated to the repo main link.
     * @param {string[]} languageIds - The array of language Ids, like ['en', 'de', 'uk', ...]
     * @param {object} translations - The object, with languageId's as properties , with values - links to the 'locale_xx.json' files in repo.
     * @param {function(object=, string|object=):void} callback - The callback function in format `callback(translation, error)`.
     */
    function translationsDownloadFromRepo(repo, languageIds, translations, callback) {
        const
            languageId = languageIds.shift();
        if (languageId) {
            repo.get(translations[languageId])
            .then(function(response) {
                if (response && response.data && typeOf(response.data,'object')) {
                    translations[languageId] = response.data;
                }
            })
            .catch(function(error) {
                console.warn(`Can't download locale '${languageId}' from the repo! Error is '${error}'.`);
            })
            .then(function() {
                if (languageIds.length) {
                    translationsDownloadFromRepo(repo, languageIds, translations, callback);
                }
                else {
                    callback(translations, undefined);
                }
            });
        }
        else {
            callback(translations, undefined);
        }
    }

    const github = axios.create({
        baseURL: scriptRepositorySite,
        timeout: 10000
    });
    if (languageId && (languageId !== doAll)) {
        languageId = translationsValidateLanguageId(languageId);
    }
    else {
        languageId = doAll;
    }
    if (languageId) {
        const remoteFolder = extensionId && (extensionId !== translationsCoreId) ? `${scriptBranchRemoteFolder}${translationsExtensionsPrefix}/${extensionId.replace(prefixExtensionId, '').toLowerCase()}/locales/`: scriptCoreLocalesRemoteFolder;
        console.log(remoteFolder);
        github.get(remoteFolder)
        .then(function(response) {
            if (response && response.data) {
                let
                    localesLinks = {},
                    parsedLocale;
                while ((parsedLocale = translationsLocalesExtractRegExp.exec(response.data))) {
                    console.log(`parsed = ${parsedLocale}`);
                    if (parsedLocale && parsedLocale.length && parsedLocale[1] && parsedLocale[2]) {
                        localesLinks[parsedLocale[2]] = parsedLocale[1].replace('/blob/', '/raw/');
                    }
                }
                if ((languageId !== doAll) && localesLinks.hasOwnProperty(languageId)) {
                    localesLinks = {[languageId]: localesLinks[languageId]};
                }
                else if (languageId !== doAll) {
                    callback(undefined, `Language with id = ${languageId} is not presented in repo!`);
                }
                translationsDownloadFromRepo(github, Object.keys(localesLinks), localesLinks, callback);
            }
        })
        .catch(function(error) {
            callback(undefined, `Can't get the locales list from repo! Error is '${error}'.`);
        });
    }
    else {
        callback(undefined, 'Wrong language Id!');
    }
}


/**
 * This function deletes an backup file from the server.
 */
async function translationsInitialLoadLocalesFromRepository(){
    return new Promise((resolve, reject) => {
        translationsLoadLocalesFromRepository(doAll, translationsCoreId, (locales, error) => {
            if (error) {
                console.warn(`Can't make an initial load of locales from repo! Error is '${error}'.`);
                reject(error);
            }
            else {
                Object.keys(locales).forEach(languageId => {
                    if (typeOf(locales[languageId], 'object') && translationsCheckAndCacheUploadedFile(cachedCommonId, '', '', '', locales[languageId])) {
                        const newTranslation = locales[languageId];
                        if (newTranslation && newTranslation.hasOwnProperty(idTranslation) && typeOf(newTranslation[idTranslation], 'object') && (Math.abs(translationsCompareVersion(newTranslation['version'])) < 10)) {
                            translationsList[languageId] = newTranslation[idTranslation];
                        }
                    }
                });
                translationsSave();
                resolve(true);
            }
        });
    });
}

/**
 * This function compares the translation version vs current value.
 * @param {string} versionToCompare - The version to compare
 * @returns {number} - The result of comparison:
 * - 0 - when fully equal;
 * - -9 <> -1 - when versionToCompare has lower minor version,
 * - 1 <> 9 - when versionToCompare has higher minor version,
 * - < -10  - when versionToCompare has lower major version,
 * - \> 10 - when versionToCompare has higher major version,
 */
function translationsCompareVersion(versionToCompare) {
    const
        [translationVersionToCompareMajor, translationVersionToCompareMinor] = (versionToCompare && versionToCompare.includes('.') ? versionToCompare : '0.0').split('.'),
        [translationCurrentVersionMajor, translationCurrentVersionMinor] = translationsVersion.split('.'),
        majorVersionCompare = Number(translationVersionToCompareMajor) - Number(translationCurrentVersionMajor),
        minorVersionCompare = Number(translationVersionToCompareMinor) - Number(translationCurrentVersionMinor);
    return majorVersionCompare * 100 + minorVersionCompare;
}

/**
 * This function took the new translation from the cache, and update current
 * translation for the current user language, for the specific part of
 * translation, and by specific mode of update.
 * @param {object} user - The user object.
 * @param {string} translationPart - The translation pars, currently is:
 * - 'core',
 * - 'functions',
 * - 'destinations',
 * - 'simpleReports',
 * - 'all' of them.
 * @param {string} translationUpdateMode - The update mode:
 * - 'replace' - deletes old and replace by new,
 * - 'overwrite' - overwrite the existing items with new values,
 * - 'enrich' - add new items, not exists in current translation,
 * - 'template' - add new items, not exists in current translation, and deletes old, not exists in the new.
 * @returns {string} - The result of the operation (empty string on success, otherwise - the error text).
 */
function translationsProcessLanguageUpdate(user, translationPart, translationUpdateMode) {

    /**
     * This function update a translation part (or inherited object) by new values and in appropriate mode.
     * @param {object} translationCurrentPart - The translation part to update.
     * @param {object} translationInputPart - The new values.
     * @param {string} translationUpdateMode - The update mode.
     * @returns {object} The updated translation part.
     */
    function translationsProcessUpdate(translationCurrentPart, translationInputPart, translationUpdateMode) {
        console.log(`translationUpdateMode = ${translationUpdateMode}`);
        switch (translationUpdateMode) {
            case 'replace': {
                translationCurrentPart = translationInputPart;
                break;
            }
            case 'overwrite':
            case 'enrich': {
                Object.keys(translationInputPart).forEach(translationKey => {
                    if (translationCurrentPart.hasOwnProperty(translationKey)) {
                        if (typeOf(translationCurrentPart[translationKey], 'object') && typeOf(translationInputPart[translationKey], 'object')) {
                            translationCurrentPart[translationKey] = translationsProcessUpdate(translationCurrentPart[translationKey], translationInputPart[translationKey], translationUpdateMode);
                        }
                        else if (translationUpdateMode === 'overwrite') {
                            if (typeOf(translationInputPart[translationKey], 'object') || (typeOf(translationCurrentPart[translationKey]) === typeOf(translationInputPart[translationKey]))) {
                                translationCurrentPart[translationKey] = translationInputPart[translationKey];
                            }
                        }
                        else if (translationUpdateMode === 'enrich') {
                            if (typeOf(translationInputPart[translationKey], 'string') && (typeOf(translationCurrentPart[translationKey]) === typeOf(translationInputPart[translationKey])) && (translationCurrentPart[translationKey].includes(translationKey))) {
                                translationCurrentPart[translationKey] = translationInputPart[translationKey];
                            }
                        }
                    }
                    else {
                        translationCurrentPart[translationKey] = translationInputPart[translationKey];
                    }
                });
                break;
            }
            case 'template':{
                const translationTemplatePart = objectDeepClone(translationInputPart);
                Object.keys(translationTemplatePart).forEach(translationKey => {
                    if (translationCurrentPart.hasOwnProperty(translationKey)) {
                        if (typeOf(translationTemplatePart[translationKey], 'object') && typeOf(translationCurrentPart[translationKey], 'object')) {
                            translationTemplatePart[translationKey] = translationsProcessUpdate(translationCurrentPart[translationKey], translationInputPart[translationKey], translationUpdateMode);
                        }
                        else if (typeOf(translationTemplatePart[translationKey]) === typeOf(translationCurrentPart[translationKey])) {
                            translationTemplatePart[translationKey] = translationCurrentPart[translationKey];
                        }
                    }
                });
                translationCurrentPart = translationTemplatePart;
                break;
            }
            default:
                break;
        }
        return translationCurrentPart;
    }
    let result = '';
    if (cachedExistsValue(user, cachedTranslationsToUpload)) {
        const
            translationInputFull = cachedGetValue(user, cachedTranslationsToUpload),
            _translationInputLanguage = translationInputFull.hasOwnProperty('language') ? translationsValidateLanguageId(translationInputFull.language) : '',
            translationInputVersionCompare = translationsCompareVersion(translationInputFull['version']);
        if (translationInputFull.hasOwnProperty(idTranslation) && typeOf(translationInputFull[idTranslation], 'object') && (Math.abs(translationInputVersionCompare) < 10)) {
            const
                translationPossibleUpdateModes = translationInputVersionCompare ? ['overwrite'] : translationsUpdateModes,
                translationCurrentParts = translationPart === doAll ? translationsTopItems : [translationPart],
                translationCurrentLanguage = configOptions.getOption(cfgMenuLanguage, user),
                translationCurrent = objectDeepClone(translationsGetCurrentForUser(user));
            if (translationPossibleUpdateModes.includes(translationUpdateMode)) {
                const translationInput = translationInputFull[idTranslation];
                translationCurrentParts.forEach((translationPart) => {
                    if (translationPart.indexOf(prefixExtensionId) === 0) {
                        const extensionId = translationPart.replace(prefixExtensionId, '').toLowerCase();
                        if (extensionId) {
                            if (! translationCurrent.hasOwnProperty(idFunctions)) translationCurrent[idFunctions] = {};
                            if (! translationCurrent[idFunctions].hasOwnProperty(idExternal)) translationCurrent[idFunctions][idExternal] = {};
                            if (! translationCurrent[idFunctions][idExternal].hasOwnProperty(translationPart)) translationCurrent[idFunctions][idExternal][translationPart] = {};
                            if (translationCurrent[idFunctions][idExternal][translationPart].hasOwnProperty(translationsSubPrefix)) {
                                translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix] =
                                    translationsProcessUpdate(
                                        translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix],
                                        translationInput[idFunctions][idExternal][extensionId][translationsSubPrefix],
                                        translationUpdateMode
                                    );
                            }
                            else {
                                translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix] = translationInput[idFunctions][idExternal][extensionId][translationsSubPrefix];
                            }
                        }
                    }
                    else if (translationInput.hasOwnProperty(translationPart)) {
                        if (translationCurrent.hasOwnProperty(translationPart)) {
                            translationCurrent[translationPart] = translationsProcessUpdate(translationCurrent[translationPart], translationInput[translationPart], translationUpdateMode);
                        }
                        else {
                            translationCurrent[translationPart] = translationInput[translationPart];
                        }
                    }
                });
                translationsList[translationCurrentLanguage] = translationCurrent;
                translationsSave(user);
            }
            else {
                result = translationsItemTextGet(user, 'MsgTranslationsNonApplicableUpdateMode');
            }
        }
        else {
            result = translationsItemTextGet(user, 'MsgTranslationsIncompatibleVersion');
        }
    }
    return result;
}

/**
 * This functions returns the current translation for the user (or global one configured).
 * @param {object} user - The user object.
 * @returns {object} The current translation object.
 */
function translationsGetCurrentForUser(user) {
    logs(`translationGetCurrentForUser(${user}) from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    // logs(`translationsList = ${JSON.stringify(translationsList)}`);
    let
        languageId = configOptions.getOption(cfgMenuLanguage, user),
        currentTranslation;
    // logs(`languageId = ${languageId}`);
    if ((! translationsList[languageId])) {
        console.warn(`Language ${languageId}, configured for current user is not exists!`);
        languageId = configOptions.getOption(cfgMenuLanguage);
    }
    if (translationsList[languageId]) {
        currentTranslation = translationsList[languageId];
    }
    return currentTranslation;
}

/**
 * This function returns the closest to the translation Id object
 * (from inheritance hierarchy point of view) depend on the
 * value of `pointOnItemItself`.
 * @param {object} user - The user object.
 * @param {string|string[]} translationId - The translation Id.
 * @param {boolean=} pointOnItemItself - The inheritance level selector.
 * @returns The translation object contains the translation Id.
 */
function translationsPointOnItemOwner(user, translationId, pointOnItemItself) {
    logs(`translationPointOnItemOwner(${translationId}) from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    const
        // @ts-ignore
        idsList = translationId ? (typeOf(translationId, 'string') ? translationId.split('.') : translationId) : [],
        whileCondition = pointOnItemItself ? 0 : 1;
    let currentTranslation = translationsGetCurrentForUser(user);
    if (currentTranslation) {
        while (idsList.length > whileCondition) {
            const currentId = idsList.shift();
            if (currentId) {
                if (! currentTranslation.hasOwnProperty(`${currentId}`))  {
                    currentTranslation[currentId] = {};
                }
                currentTranslation = currentTranslation[currentId];
            }
        }
    }
    return currentTranslation;
}

/**
 * This functions returns the value for the appropriate translation Id from the
 * current user translation.
 * @param {object} user - The user object.
 * @param {string} translationId - The translation Id.
 * @returns {string} The translation value for the provided Id.
 */
function translationsItemGet(user, translationId) {
    logs(`getFromTranslation(user, ${translationId}) from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    // logs(`translationId = ${translationId}`, _l)
    const
        currentTranslation = translationsPointOnItemOwner(user, translationId),
        translationIdArray = translationId ? translationId.split('.') : [],
        idPrefix = translationIdArray.length ? translationIdArray[0] : '',
        shortId = translationIdArray.pop();
    // logs(`\n\n translationId = ${translationId}, shortId = ${JSON.stringify(shortId)}, currentTranslation = ${JSON.stringify(currentTranslation)}`)
    // logs(`currentTranslation[${shortId}] = ${currentTranslation[shortId]}`);
    if (translationId && shortId && currentTranslation) {
        if (! currentTranslation.hasOwnProperty(shortId)) {
            console.warn(`translationId '${translationId}' is not found. getFromTranslation is called from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
            currentTranslation[shortId] = translationId;
            translationsSave(user);
        }
        else if (((translationId.indexOf(translationsCommonFunctionsAttributesPrefix) !== 0) && (currentTranslation[shortId].indexOf(translationsCommonFunctionsAttributesPrefix) === 0))
            || (idPrefix && (translationId.indexOf(translationsCommonFunctionsAttributesPrefix) !== 0) && (currentTranslation[shortId].indexOf(translationsCommonFunctionsAttributesPrefix) === 0))) {
            return translationsItemGet(user, currentTranslation[shortId]);
        }
        return currentTranslation[shortId];
    }
    else {
        return 'No translation';
    }
}


/**
 * This functions returns the value for the appropriate translation Id from the
 * current user translation.
 * @param {object} user - The user object.
 * @param {string} translationId - The translation Id.
 * @returns {string} The translation value for the provided Id.
 */
 function translationsItemCoreGet(user, translationId) {
    return translationsItemGet(user, `${translationsCoreId}.${translationId}`);
 }

/**
 * This functions generates translation Id by joining a list of items, and
 * adding the "type" selector as prefix.
 * @param {string} translationIdType - The "type" selector.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation Id.
 */
 function translationsItemGenerateId(translationIdType, ...items ) {
    let result = translationIdType;
    if ((items) && Array.isArray(items)) {
        result += items.map(item => (stringCapitalize(item))).join('');
    }
    return result;
}

/**
 * This functions returns the value for the appropriate text translation Id,
 * which will be generated as a joint string, from the current user translation.
 * @param {object} user - The user object.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation value for the provided Id.
 */
 function translationsItemTextGet(user, ...items) {
    return translationsItemCoreGet(user, translationsItemGenerateId('text', ...items ));
}

/**
 * This functions returns the value for the appropriate menu translation Id,
 * which will be generated as a joint string, from the current user translation.
 * @param {object} user - The user object.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation value for the provided Id.
 */
 function translationsItemMenuGet(user, ...items) {
    return translationsItemCoreGet(user, translationsItemGenerateId('menu', ...items ));
}


/**
 * This functions set the new value to the appropriate translation Id.
 * @param {object} user - The user object.
 * @param {string} translationId - The translation Id.
 * @param {string} translationValue - The new value.
 */
function translationsItemStore(user, translationId, translationValue) {
    logs(`putToTranslation(${translationId}, ${translationValue}) from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    const
        currentTranslation = translationsPointOnItemOwner(user, translationId),
        shortId = translationId.split('.').pop();
    if (currentTranslation && shortId) {
        currentTranslation[shortId] = translationValue;
        translationsSave(user);
    }
}

/**
 * This functions deletes the appropriate translation record.
 * @param {object} user - The user object.
 * @param {string} translationId - The translation Id.
 */
function translationsItemDelete(user, translationId) {
    logs(`delFromTranslation(${translationId}) from ${arguments.callee.caller  ? arguments.callee.caller.name : ''}`);
    const idsList = translationId.split('.');
    let currentTranslation = translationsPointOnItemOwner(user, translationId);
    if (currentTranslation && idsList) {
        while (idsList.length > 0) {
            const shortId = idsList.pop();
            if (shortId) {
                delete currentTranslation[shortId];
                if ((idsList.length === 0) || (Object.keys(currentTranslation).length > 0 )) break;
                currentTranslation = translationsPointOnItemOwner(user, idsList.join('.'));
            }
        }
        translationsSave(user);
    }
}

/**
 * This function generates an object translation Id, based on assigned to it function and destination.
 * @param {object|string} object - The ioBroker object or Id of object.
 * @param {string=} functionId - The function Id string.
 * @param {string=} destinationId - The destination Id string.
 * @param {boolean=} isCommon - The indicator of common attributes.
 * @returns {string|undefined} The translation Id string.
 */
 function translationsGetObjectId(object, functionId, destinationId, isCommon) {
    logs(`object = ${JSON.stringify(object)}`);
    let translationId;
    const
        functionsList = enumerationsList[dataTypeFunction].list,
        destinationsList = enumerationsList[dataTypeDestination].list;
    if ((typeof(functionId) === 'string') && (functionsList.hasOwnProperty(functionId))) {
        if (! typeOf(destinationId, 'string') || (destinationId && typeOf(destinationId, 'string') && destinationsList.hasOwnProperty(destinationId))) {
            if (object && (((typeof(object) === 'object') && object.hasOwnProperty('_id')) || (typeof(object) === 'string'))) {
                const
                    currentFunction = functionsList[functionId],
                    funcEnum = currentFunction.enum,
                    objectId = typeof(object) === 'string' ? object : object._id,
                    prefixId = objectId.split('.').slice(0, currentFunction.statesInFolders ? -2 : -1).join('.');
                functionId = functionId.replace('.','_');
                translationId = `${isCommon ? translationsCommonFunctionsAttributesPrefix : `${idFunctions}.${funcEnum}.${functionId}`}.${destinationId ? `${idDestinations}.${destinationId}.${objectId.split('.').join('_')}` : objectId.replace(`${prefixId}.`, '').split('.').join('_')}`;
            }
        }
    }
    return translationId;
}

/**
 * This function retrieve a string with name of the object.
 * @param {object} user - The user object.
 * @param {object|string} object - The ioBroker object or Id of object.
 * @param {object|string} object - The ioBroker object or Id of object.
 * @param {string=} functionId - The function Id string.
 * @param {string=} destinationId - The destination Id string.
 * @param {boolean=} isCommon - The indicator of common attributes.
 * @returns {string} The result name of object.
 */
function translationsGetObjectName(user, object, functionId, destinationId, isCommon) {
    logs(`object = ${JSON.stringify(object)}`);
    const translationId = translationsGetObjectId(object, functionId, destinationId, isCommon);
    // logs(`object = ${object}, translationId = ${translationId}`, _l);
    if (translationId) {
        const objectName = translationsItemGet(user, translationId);
        if (objectName !== translationId) {
            return objectName;
        }
        else if ((typeof(object) === 'string') && (! existsObject(object))) {
            return objectName;
        }
    }
    if ((typeof(object) === 'string') && existsObject(object)) {
        object = getObject(object);
    }
    logs(`object 2 = ${JSON.stringify(object)}`);
    if (object && object.hasOwnProperty('common') && object.common.hasOwnProperty('name')) {
        const objectCommonName = object.common.name;
        if (typeof objectCommonName === 'string') {
            return objectCommonName;
        }
        else if (typeof objectCommonName === 'object') {
            const languageFromConfig = configOptions.getOption(cfgMenuLanguage, user);
            if (objectCommonName.hasOwnProperty(languageFromConfig)) {
                return objectCommonName[languageFromConfig];
            }
            else if (objectCommonName.hasOwnProperty("en")) {
                return objectCommonName.en;
            }
            else {
                let objectCommonNames = objectCommonName.values();
                if (objectCommonNames.length > 0) {
                    return objectCommonNames[0] ;
                }
            }
        }
    }
    return 'Undefined';
}

/**
 * This function generates an enums translation Id, based on its type and Id.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string=} enumId - The string contained an enum Id.
 * @param {string=} enumNameDeclinationKey - The "declination" key for the Name (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
 * @returns {string} The translation id string for the enum.
 */
function translationsGetEnumId(user, enumerationType, enumId, enumNameDeclinationKey) {
    let result ='';
    if (enumId) {
        enumId = enumId.includes(prefixEnums) ? enumId.split('.').slice(2).join('.') : enumId;
        if (enumerationType && (enumerationsList.hasOwnProperty(enumerationType)) && enumerationsList[enumerationType].list.hasOwnProperty(enumId)) {
            const
                currentEnumerations = enumerationsList[enumerationType],
                currentEnumerationList = enumerationsList[enumerationType].list,
                currentEnum = currentEnumerationList[enumId],
                enumPrefix = `${currentEnumerations.id}.${currentEnum.enum}.${enumId.replace('.', '_')}`;
            if (currentEnum.isExternal && currentEnum.nameTranslationId && currentEnum.translationsKeys && currentEnum.translationsKeys.includes(currentEnum.nameTranslationId)) {
                result = `${enumPrefix}.${translationsSubPrefix}.${currentEnum.nameTranslationId}`;
            }
            else {
                if ((enumNameDeclinationKey === undefined) || (enumNameDeclinationKey === null)) enumNameDeclinationKey = enumerationsNamesMain;
                result =  `${enumPrefix}.${enumerationsNamesTranslationIdPrefix}.${enumNameDeclinationKey}`;
            }
        }
    }
    return result;
}

/**
 * This function returns an enums name, based on its type and Id.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string=} enumId - The string contained an enum Id.
 * @param {string=} enumNameDeclinationKey - The "declination" key for the Name (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
 * @returns {string} The translation id string for the enum.
 */
function translationsGetEnumName(user, enumerationType, enumId, enumNameDeclinationKey) {
    const translationId = translationsGetEnumId(user, enumerationType, enumId, enumNameDeclinationKey);
    if (translationId) return translationsItemGet(user, translationId);
    return '';
}

/**
 * This function returns a translation file(object) part name by it's Id.
 * @param {object} user - The user object.
 * @param {string} translationPartId - The translation file part Id (i.e. core, functions, ..., all);
 * @returns {string} The related name in current language.
 */
function translationsGetPartName(user, translationPartId) {
    const translationPartPrefix = [translationsCoreId, doAll].includes(translationPartId) ? idTranslation : '';
    return translationsItemMenuGet(user, translationPartPrefix, translationPartId);
}

/**
 * This function is used to get all translations for the extensions as an object.
 * @param {object} user - The user object.
 * @param {string} extensionId - The extension ID.
 * @returns {object} The object, consists a translations, as a properties.
 */
function translationsGetForExtension(user, extensionId) {
    let translations = {};
    if (extensionId) {
        let extensionFunctionId = extensionId;
        if (extensionFunctionId.indexOf(prefixExtensionId) === 0) {
            extensionFunctionId = extensionFunctionId.replace(prefixExtensionId, '');
        }
        else {
            extensionId = `${prefixExtensionId}.${stringCapitalize(extensionId)}`;
        }
        if (enumerationsList[dataTypeFunction].list.hasOwnProperty(extensionId) && enumerationsList[dataTypeFunction].list[extensionId].isExternal) {
            const currentExtension = enumerationsList[dataTypeFunction].list[extensionId];
            if (currentExtension.hasOwnProperty('translationsKeys') && currentExtension.translationsKeys) {
                const translationsKeyPrefix = `${idFunctions}.${idExternal}.${extensionId}.${translationsSubPrefix}`;
                currentExtension.translationsKeys.forEach(translationKey => {
                    const currentTranslation = translationsItemGet(user, `${translationsKeyPrefix}.${translationKey}`);
                    translations[translationKey] = currentTranslation !== 'No translation' ? currentTranslation : translationKey;
                });
            }
        }
    }
    return translations;
}


/**
 * This function checks if the file is exists, has a right size and structure. And if yes - store it's content in cache.
 * @param {object} user - The user object.
 * @param {string} translationFileFullPath - The full path to the file, including the name.
 * @param {string} translationFileName - The name of file, including extension.
 * @param {string|number} translationFileSize  - The file size, can be 0, in this case will not be checked.
 * @param {object=} translationObject  - Translation object, equal to the ile content.
 * @returns {boolean} The file check status
 */
function translationsCheckAndCacheUploadedFile(user, translationFileFullPath, translationFileName, translationFileSize, translationObject) {
    let translationFileIsOk = false;
    if (translationFileFullPath.includes(nodePath.join('document', translationFileName)) || translationObject) {
        try {
            if (translationObject === undefined) nodeFS.accessSync(translationFileFullPath, nodeFS.constants.R_OK);
            const fileStats = translationObject === undefined ? nodeFS.statSync(translationFileFullPath) : {};
            if (translationObject || (translationFileSize && Number(translationFileSize) === 0) || (translationFileSize && Number(translationFileSize) && (fileStats.size === Number(translationFileSize)))) {
                let inputTranslation = translationObject === undefined ? nodeFS.readFileSync(translationFileFullPath) : translationObject;
                try {
                    inputTranslation = typeOf(inputTranslation, 'string') ? JSON.parse(inputTranslation) : inputTranslation;
                    const currentLanguage = translationsValidateLanguageId(inputTranslation.language);
                    translationFileName = translationFileName ? translationFileName : `locale_${currentLanguage}.json`;
                    // logs(`inputTranslation = ${JSON.stringify(inputTranslation, null, 2)}`, _l);
                    // logs(`${(inputTranslation.type === translationType)}, ${(inputTranslation.version === translationVersion)}, ${(currentLanguage)}, ${inputTranslation.translation}`, _l)
                    if ((inputTranslation.type === translationsType) && (inputTranslation.version === translationsVersion)
                        && (currentLanguage) && inputTranslation.translation) {
                            cachedSetValue(user, cachedTranslationsToUpload, inputTranslation);
                            translationFileIsOk = true;
                            console.warn(`Translation '${translationFileName}' for language '${inputTranslation.language}' is uploaded and can be processed!`);
                    }
                    else {
                        console.warn(`Translation '${translationFileName}' is uploaded, but has wrong format and can't be processed!`);
                    }
                }
                catch (err) {
                    console.warn(`JSON parse error: ${JSON.stringify(err)} for translation '${translationFileName}'!`);
                }
            }
            else {
                console.warn(`Translation '${translationFileName}' is uploaded, but has wrong size and can't be processed!`);
            }
            nodeFS.rm(translationFileFullPath, {force: true }, (err) => {
                if (err) console.warn(`Can't delete translation file '${translationFileFullPath}'! Error: '${JSON.stringify(err)}'.`);
            });
        }
        catch (err) {
            console.warn(`Can't read translation file '${translationFileFullPath}'!`);
        }
    }
    return translationFileIsOk;
}

/**
 * This function generates a submenu to process an uploading translation JSON file.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsUploadMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0;
    let
        subMenuIndex = 0,
        subMenu = [];
    if (isCurrentAccessLevelAllowModify && cachedExistsValue(user, cachedTranslationsToUpload)) {
        const
            inputTranslation = cachedGetValue(user, cachedTranslationsToUpload),
            [_cmdId, _currentType, _currentUploadMode, currentPart, _currentMode] = commandUnpackParams(menuItemToProcess.param),
            currentLanguage = inputTranslation ? translationsValidateLanguageId(inputTranslation.language) : '',
            currentUploadMode = menuItemToProcess.id,
            _currentVersion =  inputTranslation ? inputTranslation.version : '';
        if (currentLanguage && inputTranslation.translation) {
            const translationParts = currentPart ? [currentPart] : [...translationsTopItems, doAll];
            translationParts.forEach(translationPart => {
                const
                    isExtensionTranslation = translationPart.indexOf(prefixExtensionId) === 0,
                    extensionId = isExtensionTranslation ? translationPart.replace(prefixExtensionId, '').toLowerCase() : '',
                    isExtensionTranslationExists = isExtensionTranslation && extensionId
                        && inputTranslation.translation.hasOwnProperty(idFunctions)
                        && inputTranslation.translation[idFunctions].hasOwnProperty(idExternal)
                        && inputTranslation.translation[idFunctions][idExternal].hasOwnProperty(extensionId)
                        && inputTranslation.translation[idFunctions][idExternal][extensionId].hasOwnProperty(translationsSubPrefix)
                        && inputTranslation.translation[idFunctions][idExternal][extensionId][translationsSubPrefix];
                if (inputTranslation.translation.hasOwnProperty(translationPart) || (translationPart === doAll) || isExtensionTranslationExists) {
                    const
                        translationPartName = isExtensionTranslationExists ? translationPart : translationsGetPartName(user, translationPart),
                        subMenuItem = {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemMenuGet(user, 'ItemsProcess')} ${translationPartName}`,
                            icon: iconItemApply,
                            group: cmdItemsProcess,
                            param: commandsPackParams(cmdEmptyCommand, dataTypeTranslation, currentUploadMode, translationPart),
                            function: translationsUploadMenuItemDetails,
                            submenu: new Array()
                        };
                    translationsUpdateModes.forEach((translationUpdateMode, translationUpdateModeIndex) => {
                        subMenuItem.submenu.push({
                            index: `${currentIndex}.${subMenuIndex}.${translationUpdateModeIndex}`,
                            name: translationsItemMenuGet(user, idTranslation, translationUpdateMode),
                            icon: iconItemApply,
                            group: cmdItemsProcess,
                            function: translationsUploadMenuItemDetails,
                            param: commandsPackParams(cmdItemsProcess, dataTypeTranslation, currentUploadMode, translationPart, translationUpdateMode),
                            submenu: []
                        });

                    });
                    subMenuIndex = subMenu.push(subMenuItem);
                }
            });
        }
    }
    return subMenu;
}

/**
 * This function returns a string containing formatted details/properties of current role.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
*/
function translationsUploadMenuItemDetails(user, menuItemToProcess) {
    const
        [_cmdId, _currentType, _currentUploadMode, currentPart, _currentMode] = commandUnpackParams(menuItemToProcess.param),
        currentItemDetailsList = [];
    if (cachedExistsValue(user, cachedTranslationsToUpload)) {
        const
            inputTranslation = cachedGetValue(user, cachedTranslationsToUpload),
            currentLanguage = translationsValidateLanguageId(inputTranslation.language),
            _currentVersion = inputTranslation.version;
        currentItemDetailsList.push({label: translationsItemCoreGet(user, 'cfgMenuLanguage'), valueString: configOptions.getOption(cfgMenuLanguage, user)});
        currentItemDetailsList.push({label: translationsItemTextGet(user, 'languageInFile'), valueString: currentLanguage});
        if (currentPart) currentItemDetailsList.push({label: translationsItemTextGet(user, 'translationPart'), valueString: currentPart.indexOf(prefixExtensionId) === 0 ? currentPart : translationsGetPartName(user, currentPart)});
    }
    return currentItemDetailsList.length ? `<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, currentItemDetailsList)}</code>` : '';
}


/**
 * This function generates a submenu to manage the Translation basic items (i.e. menu, command and text related).
 * The selector is an `Id` property of `menuItemToProcess` object.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsBasicItemsMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        translationType = menuItemToProcess.id,
        currentTranslation = translationsPointOnItemOwner(user, translationsCoreId, true);
    let
        subMenuIndex = 0,
        subMenu = [];
    Object.keys(currentTranslation)
        .filter((key) => (key.indexOf(translationType) === 0))
        .sort()
        .forEach((translationKey) => {
            logs(`Translation key is ${translationKey}`);
            if ((! translationKey.includes('.')) && (translationKey.indexOf(translationType) === 0)) {
                let
                    subSubMenuIndex = 0,
                    subMenuItem = {
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `[${currentTranslation[translationKey]}] ${currentTranslation[translationKey].includes(translationKey) ? iconItemNotFound : '' }`,
                        icon: iconItemTranslation,
                        text: ` (${translationKey})`,
                        submenu: new Array()
                    };
                    if (isCurrentAccessLevelAllowModify) {
                        subSubMenuIndex = subMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeTranslation, `${translationsCoreId}.${translationKey}`));
                        subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeTranslation, `${translationsCoreId}.${translationKey}`));
                    }
                    else {
                        subMenuItem.param = cmdNoOperation;
                    }
                subMenuIndex = subMenu.push(subMenuItem);
            }
        });
    return subMenu;
}

/**
 * This function generates a submenu to manage the functions related Translation items (i.e. buttons, attributes and common attributes).
 * The selector is an `Id` property of `menuItemToProcess` object.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsFunctionStatesItemsMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        translationType = `${idFunctions}.${menuItemToProcess.id}`,
        currentTranslation = translationsPointOnItemOwner(user, translationType, true),
        currentFunctionId = menuItemToProcess.funcEnum,
        deviceAttributesListKeys = currentFunctionId && enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunctionId) ? Object.keys(enumerationsList[dataTypeFunction].list[currentFunctionId].deviceAttributes).map(key => key.split('.').join('_')) : [],
        deviceButtonsListKeys = currentFunctionId && enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunctionId) ? Object.keys(enumerationsList[dataTypeFunction].list[currentFunctionId].deviceButtons).map(key => key.split('.').join('_')) : [],
        currentDeviceListKeys = menuItemToProcess.param === dataTypeDeviceAttributes ? deviceAttributesListKeys : deviceButtonsListKeys;

    // logs(`translationType = ${translationType}, currentTranslation = ${JSON.stringify(currentTranslation)}, currentCommonPrefix = ${commonFunctionsAttributesTranslationPrefix}`, _l);
    let subMenu = [];
    Object.keys(currentTranslation)
        .filter(translationKey => typeof(currentTranslation[translationKey]) === 'string')
        .filter(translationKey => ((! currentFunctionId) || (! deviceAttributesListKeys.find(attrId => (attrId === translationKey)))))
        .filter(translationKey => ((! currentFunctionId) || (! deviceButtonsListKeys.find(attrId => (attrId === translationKey)))))
        .filter(translationKey => ((! currentFunctionId) || currentDeviceListKeys.find(attrId => (translationKey.indexOf(attrId) === 0))))
        .forEach((translationKey, translationKeyIndex) => {
            // logs(`key = ${translationKey}, translationType = ${translationType}`, _l);
            const currentTranslationId = `${translationType}.${translationKey}`;
            let currentValue = currentTranslation[translationKey];
            if (currentValue === currentTranslationId) {
                currentValue += ' ' + iconItemNotFound;
            }
            else if (currentValue.indexOf(translationsCommonFunctionsAttributesPrefix) === 0) {
                currentValue = `${translationsItemGet(user, `${translationsCommonFunctionsAttributesPrefix}.${translationKey}`)} ${iconItemCommon}`;
            }
            let
                subSubMenuIndex = 0,
                subMenuItem = {
                    index: `${currentIndex}.${translationKeyIndex}`,
                    name: `${currentValue}`,
                    text: ` [${currentTranslationId}]`,
                    icon: translationType === translationsCommonFunctionsAttributesPrefix ? iconItemCommon : '',
                    submenu: new Array()
                };
            if (isCurrentAccessLevelAllowModify) {
                subSubMenuIndex = subMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user, `${currentIndex}.${translationKeyIndex}`, subSubMenuIndex, dataTypeTranslation, currentTranslationId));
                subSubMenuIndex = subMenuItem.submenu.push({
                    index: `${currentIndex}.${translationKeyIndex}.${subSubMenuIndex}`,
                    name: `${translationsItemCoreGet(user, cmdUseCommonTranslation)}`,
                    icon: iconItemCommon,
                    param: commandsPackParams(cmdUseCommonTranslation, dataTypeTranslation, currentTranslationId),
                    submenu: [],
                });
                subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${translationKeyIndex}`, subSubMenuIndex, dataTypeTranslation, translationKey));
            }
            else {
                subMenuItem.param = cmdNoOperation;
            }
            subMenu.push(subMenuItem);
        });
    return subMenu;
}


/**
 * This function generates a submenu to manage the functions devices related Translation items.
 * The selector is an `Id` property of `menuItemToProcess` object.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsFunctionDeviceItemsMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        translationType = `${idFunctions}.${menuItemToProcess.id}`,
        _currentFunction = menuItemToProcess.funcEnum,
        currentTranslation = translationsPointOnItemOwner(user, `${translationType}.destinations`, true),
        destinationItems = enumerationsList[dataTypeDestination].list;
    // logs(`translationType = ${translationType}, currentTranslation = ${JSON.stringify(currentTranslation)}`, _l);
    let subMenu = [];
    Object.keys(currentTranslation)
        .filter(translationKey => ((typeof(currentTranslation[translationKey]) === 'object') && (destinationItems.hasOwnProperty(translationKey))))
        .forEach((translationKey, translationKeyIndex) => {
            const
                subMenuItem = {
                    index: `${currentIndex}.${translationKeyIndex}`,
                    name: `${translationsGetEnumName(user, dataTypeDestination, translationKey, enumerationsNamesMain)}`,
                    // text: ` [${currentTranslationId}]`,
                    // icon: currentIcon,\
                    submenu: new Array()
                },
                currentDevices = currentTranslation[translationKey];
            Object.keys(currentDevices).forEach((translationDeviceKey, translationDeviceKeyIndex) => {
                // logs(`key = ${translationDeviceKey}, translationType = ${translationType}`, _l);
                const currentTranslationId = `${translationType}.destinations.${translationKey}.${translationDeviceKey}`;
                let
                    currentValue = currentDevices[translationDeviceKey],
                    subSubMenuIndex = 0;
                if (currentValue === currentTranslationId) {
                    currentValue = `${currentValue.split('.').pop().split('_').slice(-4).join('.')} ${iconItemNotFound}`;
                }
                const subSubMenuItem = {
                    index: `${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`,
                    name: `${currentValue}`,
                    text: ` [${currentTranslationId}]`,
                    // icon: currentIcon,
                    submenu: new Array()
                };
                if (isCurrentAccessLevelAllowModify) {
                    subSubMenuIndex = subSubMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`, subSubMenuIndex, dataTypeTranslation, translationType, translationKeyIndex, translationDeviceKeyIndex));
                    subSubMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`, subSubMenuIndex, dataTypeTranslation, translationType, translationKeyIndex, translationDeviceKeyIndex));
                }
                else {
                    subSubMenuItem.param = cmdNoOperation;
                }
                subMenuItem.submenu.push(subSubMenuItem);
            });
            subMenu.push(subMenuItem);
        });
    return subMenu;
}

/**
 * This function generates a submenu to manage the appropriate extension translations items .
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsExtensionsTranslationsItemsMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        extensionId = menuItemToProcess.id,
        translationType = `${idFunctions}.${idExternal}.${extensionId}.${translationsSubPrefix}`,
        _currentTranslation = translationsPointOnItemOwner(user, translationType, true),
        currentTranslationKeys = enumerationsList[dataTypeFunction].list.hasOwnProperty(extensionId) ? enumerationsList[dataTypeFunction].list[extensionId].translationsKeys : [];
    // logs(`currentTranslation = ${JSON.stringify(currentTranslation)}, currentTranslationKeys = ${JSON.stringify(currentTranslationKeys)}`, _l);
    let subMenu = [];
    if (currentTranslationKeys) currentTranslationKeys.forEach((translationKey, translationKeyIndex) => {
        const
            subMenuItem = {
                index: `${currentIndex}.${translationKeyIndex}`,
                name: translationsItemGet(user, `${translationType}.${translationKey}`),
                icon: iconItemTranslation,
                text: ` (${translationKey})`
            };
        if (isCurrentAccessLevelAllowModify) {
            subMenuItem.param = commandsPackParams(cmdEmptyCommand, `${translationType}.${translationKey}`);
            subMenuItem.submenu = (user, menuItemToProcess) => {
                const
                    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                    [_cmdId, translationId] = commandUnpackParams(menuItemToProcess.param);
                let
                    subMenu = new Array(),
                    subMenuIndex = 0;
                subMenuIndex = subMenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}`, subMenuIndex, dataTypeTranslation, translationId));
                subMenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}`, subMenuIndex, dataTypeTranslation, translationId));
                return subMenu;
            };
        }
        else {
            subMenuItem.submenu = [];
            subMenuItem.param = cmdNoOperation;
        }
        subMenu.push(subMenuItem);
    });
    // logs(`subMenu = ${JSON.stringify(subMenu)}`, _l);
    return subMenu;
}

/**
 * This function generates several menu items to support download and
 * upload translations functionality.
 * @param {object} user - The user object.
 * @param {string} translationPartId - The translation part ID.
 * @returns {object[]} array of menu items.
 */
function translationsDownloadUploadMenuPartGenerate(user, translationPartId) {
    return [
            {
            name: translationsItemMenuGet(user, 'TranslationDownload'),
            icon: iconItemDownload,
            group: 'menuTranslationFile',
            id: doDownload,
            param: commandsPackParams(cmdItemDownload, translationPartId === translationsCoreId ? '' : translationPartId)
        },
        {
            name: translationsItemMenuGet(user, 'TranslationUpload'),
            icon: iconItemUpload,
            group: 'menuTranslationFile',
            id: doUpload,
            submenu: [
                {
                    name: translationsItemMenuGet(user, 'TranslationUploadDirectly'),
                    icon: iconItemUpload,
                    group: 'menuTranslationFile',
                    id: doUploadDirectly,
                    param:  commandsPackParams(cmdItemUpload, dataTypeTranslation, doUploadDirectly, translationPartId === translationsCoreId ? '' : translationPartId),
                    function: translationsUploadMenuItemDetails,
                    submenu: translationsUploadMenuGenerate
                },
                {
                    name: translationsItemMenuGet(user, 'TranslationUploadFromRepo'),
                    icon: iconItemUpload,
                    group: 'menuTranslationFile',
                    id: doUploadFromRepo,
                    param:  commandsPackParams(cmdItemUpload, dataTypeTranslation, doUploadFromRepo, translationPartId),
                    function: translationsUploadMenuItemDetails,
                    submenu: translationsUploadMenuGenerate
                }
            ]
        }
    ];
}


//*** Translation - end ***//

//*** cachedStates - begin ***//

const
    cachedIsWaitForInput = 'isWaitForInput',
    cachedMenuOn = 'menuOn',
    cachedMenuItem = 'menuItem',
    cachedBotSendMessageId = 'botSendMessageId',
    cachedMessageId = 'messageId',
    cachedUser = 'user',
    cachedLastMessage = 'lastMessage',
    cachedCurrentState = 'currentState',
    cachedCommonId = 'common',
    cachedMode = 'mode',
    cachedDelCachedOnBack = 'delCachedOnBack',
    cachedSentImages = 'sentImages';

/**
 * The attributes list for the appropriate ioBroker states (to store the cache items).
 */
const cachedValuesStatesCommonAttributes = {
    [cachedBotSendMessageId] : {name:"Message ID of last sent message by the bot", type: 'number', read: true, write: true, role: 'id'},
    [cachedMessageId] : {name:"Message ID of last received request", type: 'number', read: true, write: true, role: 'id'},
    [cachedUser]: {name:"user data as json", type: "json", read: true, write: true, role: "text"},
    [cachedMenuOn] : {name:"Is menu shown to the user", type: 'boolean', read: true, write: true, role: 'state'},
    [cachedMenuItem] : {name:"Last menu item shown to the user", type: 'json', read: true, write: true, role: 'json'},
    [cachedLastMessage] : {name:"Last menu message sent to the user", type: 'json', read: true, write: true, role: 'json'},
    [cachedCurrentState] : {name:"State currently processed in Menu", type: 'json', read: true, write: true, role: 'json'},
    [cachedMode] : {name:"Current user mode", type: 'number', read: true, write: true, role: 'number'},
    'enumerationItems' : {name:"List of Items for menu", type: 'json', read: true, write: true, role: 'json'},
    [prefixExternalStates] : {name:"External state", type: 'json', read: true, write: true, role: 'state'},
    [cachedSentImages] : {name:"List of sent images", type: 'json', read: true, write: true, role: 'json'},
};
const cachedTimeDeltaParseRegExp = /^(((\d*)?:)?(\d*)?:)?(\d*)$/;
// let cachedStates = {};
const cachedValuesMap = new Map();

/**
 * This function returns an ioBroker `state Id` for appropriate cached `value Id`.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @returns {string} The Id of ioBroker state.
 */
function cachedGetValueId(user, valueId) {
    if ((typeof(user) === 'string') && (user === cachedCommonId)) user = {chatId: user};
    // logs(`user = ${JSON.stringify(user)}`);
    return user && user.chatId ? `${prefixCacheStates}.${user.chatId}.${valueId}` : '';
}

/**
 * This function checks if the appropriate cached value exists in the Map object or as an ioBroker state.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @returns {boolean} - True if the an appropriate cached value is exists.
 */
function cachedExistsValue(user, valueId) {
    const id = cachedGetValueId(user, valueId);
    // logs(`statesCache.hasOwnProperty(${id}) = ${id && cachedStates.hasOwnProperty(id)}`);
    logs(`statesCache.has(${id}) = ${id && cachedValuesMap.has(id)}`);
    if (id) {
        if (valueId.indexOf(prefixExternalStates) === 0 ) valueId = prefixExternalStates;
        // return (cachedStates.hasOwnProperty(id) || (cachedStatesCommonAttr.hasOwnProperty(state) && existsState(id)));
        return (cachedValuesMap.has(id) || (cachedValuesStatesCommonAttributes.hasOwnProperty(valueId) && existsState(id)));
    }
    return false;
}


/**
 * This function returns a value for the appropriate cached value Id.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @param {boolean=} getLastChange - The selector, to define an output. If true - will
 * return an array with value and lastChange timestamp of it.
 * @returns {any|[any, number]}
 */
function cachedGetValue(user, valueId, getLastChange) {
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(valueId));
    const id = cachedGetValueId(user, valueId);
    let result, stateLastChange;
    if (id) {
        logs(`statesCache.has(${id}) = ${cachedValuesMap.has(id)}`);
        if (valueId.indexOf(prefixExternalStates) === 0 ) valueId = prefixExternalStates;
        if (((! cachedValuesMap.has(id)) || getLastChange) && cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
            if (existsState(id)) {
                const currentState = getState(id);
                if (currentState !== undefined) {
                    let cachedVal = currentState.val;
                    stateLastChange = currentState.lc;
                    if (((cachedValuesStatesCommonAttributes[valueId].type === 'string') || (cachedValuesStatesCommonAttributes[valueId].type === 'json')) && (cachedVal.length > 0)) {
                        try {
                            cachedVal = JSON.parse(cachedVal, mapReviver);
                        }
                        catch (err) {
                            // cachedStates[id] = cachedVal;
                            logs(`Parse error - ${JSON.stringify(err)}`);
                        }
                    }
                    cachedValuesMap.set(id, cachedVal);
                    logs(`Non cached = ${JSON.stringify(cachedVal)} type of ${typeOf(cachedVal)}`);
                }
            }
        }
        if (cachedValuesMap.has(id)) {
            logs(`Cached = ${JSON.stringify(cachedValuesMap.get(id))} type of ${typeOf(cachedValuesMap.get(id))}`);
            result = objectDeepClone(cachedValuesMap.get(id));
        }
    }
    return getLastChange ? [result, stateLastChange] : result;
}

/**
 * This function returns a value for the appropriate cached value Id,
 * and check its age against an appropriate `cachedValueMaxAge`.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @param {string} cachedValueMaxAge - The string in a format 'hh:mm:ss'
 * @returns {[any, boolean]} The array with cached value and boolean indicator of it's age and presence.
 */
function cachedGetValueAndCheckItIfOld(user, valueId, cachedValueMaxAge) {
    const
        checkDate = new Date(),
        deltaMatch = cachedValueMaxAge.match(cachedTimeDeltaParseRegExp),
        [_tmp1, _tmp2, _tmp3, deltaHours, deltaMinutes, deltaSeconds] = deltaMatch ? deltaMatch : [],
        [cachedValue, cachedValueLC] = cachedGetValue(user, valueId, true);
    if (deltaSeconds) checkDate.setSeconds(checkDate.getSeconds() - Number(deltaSeconds));
    if (deltaMinutes) checkDate.setMinutes(checkDate.getMinutes() - Number(deltaMinutes));
    if (deltaHours) checkDate.setHours(checkDate.getHours() - Number(deltaHours));
    const isStateOldOrNotExists = (cachedValue === undefined) || (cachedValueLC === undefined) || (cachedValueLC <= checkDate.valueOf());
    return [cachedValue, isStateOldOrNotExists];
}



/**
 * This function sets a value for the appropriate cached value Id.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @param {any} value - The value to set.
 */
function cachedSetValue(user, valueId, value) {
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(valueId));
    logs('value = ' + JSON.stringify(value));
    const id = cachedGetValueId(user, valueId);
    if (id) {
        const currentValue = cachedValuesMap.has(id) ? cachedValuesMap.get(id) : null;
        logs(`currentValue = ${currentValue}`);
        if ( (currentValue === null) || (JSON.stringify(currentValue, mapReplacer) !== JSON.stringify(value, mapReplacer)) ) {
            cachedValuesMap.set(id, value);
            logs(`statesCache.get(${id}) = ${JSON.stringify(cachedValuesMap.get(id))}`);
            const common = {};
            if (valueId.indexOf(prefixExternalStates) === 0 ) {
                common.name = `${cachedValuesStatesCommonAttributes[prefixExternalStates].name} ${valueId}`;
                valueId = prefixExternalStates;
            }
            if (cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
                if (((cachedValuesStatesCommonAttributes[valueId].type === 'string') || (cachedValuesStatesCommonAttributes[valueId].type === 'json')) && (typeOf(value) !== 'string')) {
                    value = JSON.stringify(value, mapReplacer);
                }
                if (existsState(id)) {
                    setState(id, value, true);
                }
                else {
                    logs(`id = ${id}, value = ${value},  attr = ${cachedValuesStatesCommonAttributes[valueId]}`);
                    createState(id, value, {...cachedValuesStatesCommonAttributes[valueId], ...common});
                }
            }
        }
    }
}

/**
 * This function deletes a value from a Map object (and appropriate ioBroker
 * state) for the appropriate cached value Id.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
*/
function cachedDelValue(user, valueId) {
    logs('user = ' + JSON.stringify(user));
    logs('state = ' + JSON.stringify(valueId));
    const id = cachedGetValueId(user, valueId);
    if (id) {
        if (existsState(id)) {
            deleteState(id);
        }
        if (cachedValuesMap.has(id)) {
           cachedValuesMap.delete(id);
        }
    }
}


/**
 * Make getting the cached values available for an External Scripts. This
 * function will listen on the messages with Id equal to the
 * `autoTelegramMenuExtensionsGetCachedState`.
 * @param {any} data
 * @param {function} callback
 */
function cachedOnGetCachedState(data, callback) {
    const {user, valueId} = data;
    logs(`user= ${user}`);
    logs(`valueId= ${JSON.stringify(valueId)}`);
    const value = cachedGetValue(user, `${prefixExternalStates}${valueId}`);
    logs(`value= ${JSON.stringify(value)}`);
    if (value === undefined) {
        callback(null);
    }
    else {
        callback(value);
    }

}

/**
 * Make setting the cached values available for an External Scripts. This
 * function will listen on the messages with Id equal to the
 * `autoTelegramMenuExtensionsSetCachedState`.
 * @param {any} data
 * @param {function} callback
 */
function cachedOnSetCachedState(data, callback) {
    const {user, valueId, value} = data;
    logs(`user= ${user}`);
    logs(`valueId= ${JSON.stringify(valueId)}`);
    logs(`value= ${JSON.stringify(value)}`);
    cachedSetValue(user, `${prefixExternalStates}${valueId}`, value);
    callback(true);
}


/**
 * This function stores the pair of menu index and cached value Id, which will
 * be cleared, when user will return to this menu Index.
 * @param {object} user - The user object.
 * @param {string} menuItemIndex - The target menu index.
 * @param {string} valueId - The Id of cached value.
 */
function cachedAddToDelCachedOnBack(user, menuItemIndex, valueId) {
    let cachedToDelete = cachedExistsValue(user, cachedDelCachedOnBack) ? cachedGetValue(user, cachedDelCachedOnBack) : {};
    if (! cachedToDelete.hasOwnProperty(menuItemIndex)) {
        cachedToDelete[menuItemIndex] = [];
    }
    if (! cachedToDelete[menuItemIndex].includes(valueId)) {
        cachedToDelete[menuItemIndex].push(valueId);
        cachedSetValue(user, cachedDelCachedOnBack, cachedToDelete);
    }
}
//*** cachedStates - end ***//

//*** sentImages - begin ***//
/**
 * This function stores a sent image telegram message Id to the cache, to provide
 * possibility to delete it after from menu.
 * @param {object} user - The user object.
 * @param {number} messageId - Id of message sent to telegram.
 */
function sentImageStore(user, messageId) {
    const sentImages = cachedExistsValue(user, cachedSentImages) ? cachedGetValue(user, cachedSentImages) : new Map();
    sentImages.set(messageId, new Date());
    cachedSetValue(user, cachedSentImages, sentImages);
}

/**
 * This function returns an array of Id's of  message with images sent to telegram.
 * @param {object} user - The user object.
 * @returns {number[]} - Array of messages Id's sent to telegram.
 */
function sentImagesGet(user) {
    const lastEditableTime = new Date(Date.now() - (48*3600-60)*100);
    const sentImages = cachedExistsValue(user, cachedSentImages) ? cachedGetValue(user, cachedSentImages) : new Map();
    let imagesIds = new Array();
    sentImages.forEach((imageDate, imageId) => {
        if (imageDate < lastEditableTime) {
            sentImages.delete(imageId);
        }
        else {
            imagesIds.push(imageId);
        }
    });
    if (sentImages.size) {
        cachedSetValue(user, cachedSentImages, sentImages);
    }
    else {
        cachedDelValue(user, cachedSentImages);
    }
    return imagesIds;
}

/**
 * This function make check of existing of any stored message with image, early sent to telegram.
 * @param {object} user - The user object.
 * @returns {boolean} True, if any message Id is stored. False - if otherwise.
 */
function sentImagesExists(user) {
    const lastEditableTime = new Date(Date.now() - (48*3600-60)*100);
    const sentImages = cachedExistsValue(user, cachedSentImages) ? cachedGetValue(user, cachedSentImages) : new Map();
    sentImages.forEach((imageDate, imageId) => {
        if (imageDate < lastEditableTime) {
            sentImages.delete(imageId);
        }
    });
    if (sentImages.size) {
        cachedSetValue(user, cachedSentImages, sentImages);
        return true;
    }
    else {
        cachedDelValue(user, cachedSentImages);
    }
    return false;
}

/**
 * This function delete all sent images from telegram chat, if their message Id's is stored in cache.
 * @param {object} user - The user object.
 */
function sentImagesDelete(user) {

    /**
     * This sub-function used for iterative deleting messages, using it as callback in command to telegram adapter.
     * @param {*} result
     * @param {object} user - The user object.
     * @param {object} telegramObject - The object contained instructions to telegram.
     * @param {number[]} sentImages - An array of Id's of  message with images sent to telegram
     */
    function sentImagesDeleteCallBack(result, user, telegramObject, sentImages) {
        if (! result) {
            console.warn(`Can't send message (${JSON.stringify(telegramObject)}) to (${JSON.stringify(user)})!\nResult = ${JSON.stringify(result)}.`);
        }
        // logs(`sentImages = ${sentImages}`);
        if (sentImages.length) {
            telegramObject = telegramMessagesClearCurrentMessage(user, false, true, sentImages.shift());
            // logs(`telegramObject = ${JSON.stringify(telegramObject)}`);
            if (telegramObject) sendTo(telegramAdapter, telegramObject, result => {sentImagesDeleteCallBack(result, user, telegramObject, sentImages )});
        }
    }

    let sentImages = sentImagesGet(user);
    if (sentImages.length) {
        // logs(`sentImages = ${sentImages}`);
        const telegramObject = telegramMessagesClearCurrentMessage(user, false, true, sentImages.shift());
        // logs(`telegramObject = ${JSON.stringify(telegramObject)}`);
        if (telegramObject) {
            sendTo(telegramAdapter, telegramObject, result => {sentImagesDeleteCallBack(result, user, telegramObject, sentImages )});
            cachedDelValue(user, cachedSentImages);
        }
    }
}

//*** sentImages - end ***//


//*** Enumerations - begin ***//

const
    enumerationsNamesMain = 'Main',
    enumerationsNamesBasic = 'Basic',
    enumerationsNamesMany = 'Many',
    enumerationsNamesInside = 'Inside',
    enumerationsNamesEnterTo = 'EnterTo',
    enumerationsNamesExitFrom = 'ExitFrom',
    enumerationsNamesTranslationIdPrefix = 'names',
    enumerationsDeviceBasicAttributes = '-ts:lc:-ack:-q:-from:-user',
    enumerationsSubTypes = [dataTypeDeviceAttributes, dataTypeDeviceButtons],
    enumerationsSubTypesExtended = [...enumerationsSubTypes, dataTypePrimaryEnums],
    enumerationsAccessLevelToShow = 'showAccessLevel',
    enumerationsAccessLevelToPress = 'pressAccessLevel',
    enumerationsDeviceButtonsAccessLevelAttrs  = [enumerationsAccessLevelToShow, enumerationsAccessLevelToPress],
    enumerationsExcludeForExternal = ['deviceAttributes', 'deviceButtons', 'devicesTranslation', 'deviceAttributesValuesTranslation', 'deviceButtonsValuesTranslation', 'simplifyMenuWithOneDevice', 'showDestNameOnSimplify', 'statesInFolders'],
    enumerationsFunctionNotFound = 'noFunction',
    enumerationsConvertButtonToAttribute = 'useButtonAsAttribute',
    enumerationsEditEnums = 'editEnums',
    enumerationsList = {
        [dataTypeFunction]: {
            list: {},
            id: idFunctions,
            enums: {
                functions: {
                  isEnabled: true,
                  order: 0,
                  icon: "🔆"
                }
            },
            state: `${prefixPrimary}.${idFunctions}`,
            icon: '⚛️',
            defaultObject: {
                isAvailable : true,
                isEnabled : false,
                isExternal: false,
                order : 0,
                state: 'state',
                availableState: '',
                icon: '🔆',
                enum: idFunctions,
                name: enumerationsNamesMain,
                nameTranslationId: undefined,
                names: [enumerationsNamesBasic, enumerationsNamesMany],
                translationsKeys: undefined,
                group: '',
                deviceAttributes: `state:${enumerationsDeviceBasicAttributes}`,
                deviceButtons: {},
                simplifyMenuWithOneDevice: false,
                showDestNameOnSimplify: true,
                statesInFolders: false,
                iconOn: configOptions.getOption(cfgDefaultIconOn),
                iconOff: configOptions.getOption(cfgDefaultIconOff)
            }
        },
        [dataTypeDestination]: {
            list: {},
            id: idDestinations,
            enums: {
                rooms: {
                  isEnabled: true,
                  order: 0,
                  icon: "🏠"
                },
                people: {
                  isEnabled: true,
                  order: 1,
                  icon: "🧍"
                }
            },
            state: `${prefixPrimary}.${idDestinations}`,
            icon: '🏢',
            defaultObject: {
                isAvailable : true,
                isEnabled : false,
                enum: '',
                icon: '',
                name: enumerationsNamesMain,
                names: [enumerationsNamesBasic, enumerationsNamesInside, enumerationsNamesEnterTo, enumerationsNamesExitFrom],
                group: '',
                order : 0,
            }
        },
        [dataTypeReport]: {
            list: {},
            id: idSimpleReports,
            enums: {
                simpleReports: {
                  isEnabled: true,
                  order: 0,
                  icon: "ℹ️"
                }
            },
            state: `${prefixPrimary}.${idSimpleReports}`,
            icon: 'ℹ️',
            defaultObject: {
                isAvailable : true,
                isEnabled : false,
                enum: idSimpleReports,
                name: enumerationsNamesMain,
                group: '',
                alwaysExpanded: false,
                graphsEnabled: false,
                order : 0,
                icon: 'ℹ️'
            }
        }
    },
    enumerationItemDefaultDetails = ['itemId', 'isAvailable', 'state', 'order'];

/**
 * This function make compare of the enumerationItems of identical type for sorting
 * it by the `order` property.
 * @param {object} a - The enumerationItem object.
 * @param {object} b - The enumerationItem object.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 * @returns {number} The result of compare [-1, 0, 1] used for the `Array.sort()`.
 */
function enumerationsCompareOrderOfItems(a, b, enumerationType) {
    if (enumerationsList.hasOwnProperty(enumerationType)) {
        const itemsList = enumerationsList[enumerationType].list;
        if (itemsList.hasOwnProperty(a) && itemsList.hasOwnProperty(b)) {
            return itemsList[a].order - itemsList[b].order;
        }
        else if (itemsList.hasOwnProperty(a)) {
            return 1;
        }
        else if (itemsList.hasOwnProperty(b)) {
            return -1;
        }
    }
    return a < b ? -1 : ( a > b ? 1 : 0);
}

/**
 * This function load a list(`Object`) of `enumerationItems` of appropriate `type`
 * from the related ioBroker state.
 * Result will be stored in the global variable `enumerationItems`.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 */
function enumerationsLoad(enumerationType) {
    logs(`  enumerationItems[${enumerationType}] = ${JSON.stringify(enumerationsList[enumerationType])}`);
    enumerationsList[enumerationType].list = {};
    if (existsState(enumerationsList[enumerationType].state)) {
        const parsedObject = JSON.parse(getState(enumerationsList[enumerationType].state).val);
        if (parsedObject.hasOwnProperty('list')  && typeOf(parsedObject.list, 'object') && parsedObject.list) {
            enumerationsList[enumerationType].list = parsedObject.list;
        }
        if (parsedObject.hasOwnProperty('enums')  && typeOf(parsedObject.enums, 'object') && parsedObject.enums) {
            enumerationsList[enumerationType].enums = parsedObject.enums;
        }
    }
    // logs(`  enumerationItems[${enumerationType}].list = ${JSON.stringify(enumerationsList[enumerationType].list, null, 2)}`, _l);
}

/**
 * This function store a list(`Object`) of `enumerationItems` of appropriate `type`
 * in the related ioBroker state.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 */
function enumerationsSave(enumerationType) {
    logs(`  enumerationItems[${enumerationType}] = ${JSON.stringify(enumerationsList[enumerationType])}`);
    const listToSave = JSON.stringify({enums: enumerationsList[enumerationType].enums/* , icons: enumerationItems[enumerationType].icons */, list: enumerationsList[enumerationType].list});
    if (existsState(enumerationsList[enumerationType].state)) {
        logs(`  save ${enumerationsList[enumerationType].state}`);
        setState(enumerationsList[enumerationType].state, listToSave, true);
    }
    else {
        logs(`  create ${enumerationsList[enumerationType].state}`);
        // @ts-ignore
        createState(enumerationsList[enumerationType].state, listToSave, cachedValuesStatesCommonAttributes.enumerationItems);
    }
}

/**
 * This function change an `order` property of `enumerationItems` in current
 * list(`Object`), to eliminate a gap in sequence (for example - after deleting
 * or adding items).
 * @param {object} currentEnumeration - The `list` of `enumerationItems` to be processed.
 * @returns {number} - The number of items in the current `list`.
 */
function enumerationsReorderItems(currentEnumeration) {
    logs(`  enumerationItems= ${JSON.stringify(currentEnumeration)}`);
    // let currentEnumeration = enumerationItems[enumerationType].list;
    let countItems = 0;
    Object.keys(currentEnumeration)
        .sort((a, b) => (currentEnumeration[a].order - currentEnumeration[b].order))
        .forEach((currentItem) => {
            currentEnumeration[currentItem].order = countItems;
            countItems++;
        });
    return countItems;
}

/**
 * This function initializes the enumerationItems of appropriate type. It's mean
 * it will update it from the ioBroker state, and check, if the appropriate
 * ioBroker `enums` or Auto Telegram Menu Extensions is available.
 * Result will be stored in the `enumerationItems[enumerationType].list`.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 * @param {boolean=} withExtensions - The selector to init Extensions.
 */
function enumerationsInit(enumerationType, withExtensions) {
    logs(`  enumerationItems= ${JSON.stringify(enumerationsList[enumerationType])}`);
    let currentEnumerationList = enumerationsList[enumerationType].list;
    let countItems = enumerationsReorderItems(currentEnumerationList);
    Object.keys(currentEnumerationList).forEach((currentItem) => {
        currentEnumerationList[currentItem] = objectAssignToTemplateLevelOne(enumerationsList[enumerationType].defaultObject, currentEnumerationList[currentItem]);
        if ((! currentEnumerationList[currentItem].isExternal) || withExtensions ) currentEnumerationList[currentItem].isAvailable = false;
    });
    if ((enumerationType === dataTypeFunction) && withExtensions)  extensionsInit();
    Object.keys(enumerationsList[enumerationType].enums).forEach(enumType => {
        for (const currentEnum of getEnums(enumType)) {
            // logs(`enumerationType = ${enumerationType}, enumType = ${enumType},  currentEnum = ${JSON.stringify(currentEnum, null, 2)}}`, _l);
            const currentItem = currentEnum.id.replace(`${prefixEnums}.${enumType}.`, '');
            const
                currentItemSectionsCount = currentItem.split('.').length,
                compositeParentEnum = currentItemSectionsCount === 2 ? `${enumType}.${currentItem.split('.').shift()}` : '',
                isCurrentItemAcceptable = (currentItemSectionsCount === 1) || ((currentItemSectionsCount === 2) && (getEnums(compositeParentEnum).length > 0));
            if (isCurrentItemAcceptable) {
                logs(`currentItem = ${currentItem}, \n has = ${currentEnumerationList.hasOwnProperty(currentItem)}, currentEnumeration[${currentItem}] = ${JSON.stringify(currentEnumerationList[currentItem])}`);
                if (currentEnumerationList.hasOwnProperty(currentItem) && (currentEnumerationList[currentItem] !== undefined)) {
                    currentEnumerationList[currentItem].isAvailable = true;
                }
                else {
                    let currentItemPosition = countItems;
                    if (currentItemSectionsCount === 2) {
                        const
                            parentItemId =  currentItem.split('.').shift(),
                            currentEnumerationIds = Object.keys(currentEnumerationList).sort((a, b) => (currentEnumerationList[a].order - currentEnumerationList[b].order));
                        currentItemPosition = currentEnumerationIds.indexOf(parentItemId);
                        do {
                            currentItemPosition++;
                        } while ((currentItemPosition < countItems) && (currentEnumerationIds[currentItemPosition].indexOf(parentItemId) === 0));
                        if (currentItemPosition  < countItems) {
                            for( let itemIndex = currentItemPosition; itemIndex < countItems; itemIndex++){
                                currentEnumerationList[currentEnumerationIds[itemIndex]].order++;
                            }
                        }
                    }
                    currentEnumerationList[currentItem] = {...enumerationsList[enumerationType].defaultObject, order: currentItemPosition, enum: enumType, icon: enumerationsList[enumerationType].enums[enumType].icon};
                    logs(`\ncurrentEnumeration[${currentItem}] = ${JSON.stringify(currentEnumerationList[currentItem])}`);
                    countItems++;
                }
                if ((enumerationType === dataTypeFunction) && currentEnumerationList[currentItem].hasOwnProperty('deviceAttributes') && (typeOf(currentEnumerationList[currentItem].deviceAttributes, 'string'))) {
                    const
                        currentDeviceAttributes = currentEnumerationList[currentItem].deviceAttributes,
                        deviceAttributesList = {};
                    currentDeviceAttributes.split(':').forEach((deviceAttr, stateIndex) => {
                        const isEnabled = deviceAttr[0] !== '-';
                        if (! isEnabled) deviceAttr = deviceAttr.slice(1);
                        deviceAttributesList[deviceAttr] = {
                            isEnabled : isEnabled,
                            convertValueCode: "",
                            nameTranslationId: translationsGetObjectId(deviceAttr.split('.').join('_'), currentItem, undefined, enumerationsDeviceBasicAttributes.includes(deviceAttr)),
                            order : stateIndex
                        };
                    });
                    currentEnumerationList[currentItem].deviceAttributes = deviceAttributesList;
                }
            }
        }
    });
    // logs(`  enumerationItems[${enumerationType}].list = ${JSON.stringify(enumerationsList[enumerationType].list, null, 2)}`, _l);
}

/**
 * This function store a new `name` of appropriate enumerationItem, including it's
 * declinations.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem, i.e. ioBroker enum Id.
 * @param {object} enumerationItem - The current enumerationItem object.
 * @param {string} newName - The new Name value.
 * @param {string=} nameDeclinationKey - The "declination" key for the Name (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
 */
function enumerationsUpdateItemName(user, enumerationType, enumerationItemId, enumerationItem, newName, nameDeclinationKey) {
    if (newName && (typeof(newName) === 'string')) {
        const translationIdPrefix = translationsGetEnumId(user, enumerationType, enumerationItemId, '');
        if (enumerationItem.hasOwnProperty('names') &&  (typeOf(enumerationItem.names) === 'array')) {
            newName = newName.trim();
            let tmpKeys = [...enumerationItem.names];
            tmpKeys.unshift(enumerationsNamesMain);
            if (nameDeclinationKey) {
                if (tmpKeys.includes(nameDeclinationKey)) translationsItemStore(user, `${translationIdPrefix}${nameDeclinationKey}`, newName);
            }
            else {
                if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName)  {
                    tmpKeys.forEach(nameKey => translationsItemStore(user, `${translationIdPrefix}${nameKey}`, nameKey === enumerationsNamesMain ? newName : newName.toLowerCase()));
                }
            }
        }
        else {
            if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName) translationsItemStore(user, `${translationIdPrefix}${enumerationsNamesMain}`, newName);
        }
    }
}

/**
 * This function rereads the name of appropriate ioBroker enum in appropriate language.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem, i.e. ioBroker enum Id.
 */
function enumerationsRereadItemName(user, enumerationType, enumerationItemId) {
    const
        currentEnumeration = enumerationsList[enumerationType].list,
        fullItemId = `${prefixEnums}.${currentEnumeration[enumerationItemId].enum}.${enumerationItemId}`,
        currentEnum = getEnums(currentEnumeration[enumerationItemId].enum).find((current) => (current.id === fullItemId) );
    if ((currentEnum !== undefined) && currentEnum.hasOwnProperty('name') && (currentEnum.name !== undefined) ) {
        enumerationsUpdateItemName(user, enumerationType, enumerationItemId, currentEnumeration[enumerationItemId],
            currentEnum.name[configOptions.getOption(cfgMenuLanguage)] ? currentEnum.name[configOptions.getOption(cfgMenuLanguage)] :
                (currentEnum.name['en'] ? currentEnum.name['en'] : (typeof(currentEnum.name) === 'string' ? currentEnum.name : enumerationItemId)));
    }
    enumerationsSave(enumerationType);
}



/**
 * This function generates a submenu to manage a group property of the
 * appropriate enumerationItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function enumerationItemGroupsMenuGenerate(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    let
        subMenuIndex = 0,
        subMenu = [];
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        [_cmdId, dataType, currentItem, dataTypeExtraId] = commandUnpackParams(menuItemToProcess.param),
        currentEnumeration = enumerationsGetList(dataType, dataTypeExtraId),
        currentMenuItem = currentEnumeration[currentItem],
        currentMenuItemGroup = currentMenuItem ? currentMenuItem.group : '',
        existingGroups = new Array();
    Object.keys(currentEnumeration)
        .sort((a, b) => (currentEnumeration[a].order - currentEnumeration[b].order))
        .forEach((item) => {
            if (currentEnumeration[item].hasOwnProperty('group') && currentEnumeration[item].group) {
                const currentGroup = currentEnumeration[item].group;
                if (! existingGroups.includes(currentGroup)) {
                    existingGroups.push(currentGroup);
                    subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `[${currentGroup}]`,
                        icon: currentGroup === currentMenuItemGroup ? iconItemCheckMark : '',
                        param: commandsPackParams(cmdItemPress, dataTypeGroups, currentItem, dataType, currentGroup, dataTypeExtraId),
                        submenu: []
                    });
                }
            }
        });
    subMenuIndex = subMenu.push(menuAddItemMenuItemGenerate(user, currentIndex, subMenuIndex, dataTypeGroups, currentItem, dataType, dataTypeExtraId));

    return subMenu;
}

/**
 * This function generates a submenu to manage appropriate enumerationItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function enumerationsItemMenuGenerate(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    let
        subMenuIndex = 0,
        subMenu = [];
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        [_cmdId, dataType, currentItem, _paramToSkip, dataTypeExtraId, _otherParams] = commandUnpackParams(menuItemToProcess.param),
        currentEnumeration = enumerationsGetList(dataType, dataTypeExtraId);
    const
        currentEnumerationItem = currentEnumeration[currentItem],
        currentEnumerationItemEnum = currentEnumerationItem.enum,
        currentIcon = currentEnumerationItem.isEnabled ? (currentEnumerationItem.hasOwnProperty('icon') ? currentEnumerationItem.icon : '') : iconItemDisabled,
        lastItemIndex = Object.keys(currentEnumeration).length - 1;
    if (isCurrentAccessLevelAllowModify) {
        if (dataType !== dataTypePrimaryEnums) {
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemTextGet(user, currentEnumerationItem.isEnabled ? 'SwitchOff' : 'SwitchOn')}`,
                icon: currentIcon,
                param: commandsPackParams(cmdItemPress, dataType, currentItem, 'isEnabled', dataTypeExtraId),
                group: 'topRows',
                submenu: [],
            } );
        }
        [subMenu,  subMenuIndex] = menuMoveItemUpDownMenuPartGenerate(user, subMenu, currentIndex, subMenuIndex, currentEnumerationItem.order, lastItemIndex, 'topRows', dataType, currentItem, dataTypeExtraId);
    }
    // logs(` = ${JSON.stringify(currentEnumerationItem)}`, _l);
    let enumerationItemAttrs = Object.keys(currentEnumerationItem);
    switch (dataType) {
        case dataTypeFunction:
            if (! currentEnumerationItem.isExternal) {
                enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('deviceAttributes'), 0, 'devicesTranslation');
                enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('deviceAttributes') + 1, 0, 'deviceAttributesValuesTranslation');
                enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('deviceButtons') + 1, 0, 'deviceButtonsValuesTranslation');
            }
            break;

        case dataTypeDeviceButtons:
            if (! enumerationItemAttrs.includes('group')) enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('order'), 0, 'group');
            break;

        default:
            break;
    }
    logs(` = ${JSON.stringify(enumerationItemAttrs)}`);
    let devicesMenuItem, devicesMenuIndex;
    for (let enumerationItemAttr of enumerationItemAttrs) {
        if (currentEnumerationItem.isExternal && enumerationsExcludeForExternal.includes(enumerationItemAttr)) {
            continue;
        }
        switch (enumerationItemAttr) {
            case 'isAvailable':
            case 'isEnabled':
            case 'isExternal':
            case 'enum':
            case 'order':
            case 'roleToReport':
            case 'stateToReport':
            case 'hiddenName':
            case 'nameTranslationId':
            case 'scriptName':
            case 'showAccessLevel':
            case 'pressAccessLevel': {
                break;
            }

            case 'deviceAttributes':
            case 'deviceButtons':
            case 'deviceAttributesValuesTranslation':
            case 'deviceButtonsValuesTranslation':
            case 'devicesTranslation': {
                if (! devicesMenuItem) {
                    devicesMenuIndex = subMenuIndex;
                    devicesMenuItem = {
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemMenuGet(user, 'Devices')}`,
                        param: enumerationItemAttr,
                        accessLevel: currentAccessLevel,
                        funcEnum: currentItem,
                        icon: iconItemDevice,
                        submenu: new Array(),
                    };
                    subMenuIndex = subMenu.push(devicesMenuItem);
                }
                switch (enumerationItemAttr) {
                    case 'deviceAttributes':
                    case 'deviceButtons':
                        devicesMenuItem.submenu.push({
                                index: `${currentIndex}.${devicesMenuIndex}.${devicesMenuItem.submenu.length}`,
                                name: `${translationsItemMenuGet(user, enumerationItemAttr)}`,
                                id: enumerationItemAttr,
                                accessLevel: currentAccessLevel,
                                param: currentItem,
                                icon: enumerationItemAttr === 'deviceAttributes' ? iconItemAttribute : iconItemSquareButtonBlack,
                                submenu: enumerationsListMenuGenerate,
                            });
                        break;

                    case 'deviceAttributesValuesTranslation':
                    case 'deviceButtonsValuesTranslation':
                    case 'devicesTranslation':
                        devicesMenuItem.submenu.push({
                            index: `${currentIndex}.${devicesMenuIndex}.${devicesMenuItem.submenu.length}`,
                            name: `${translationsItemMenuGet(user, enumerationItemAttr)}`,
                            accessLevel: currentAccessLevel,
                            param: enumerationItemAttr.replace('ValuesTranslation', ''),
                            funcEnum: currentItem,
                            icon: iconItemTranslation,
                            id: `${currentEnumerationItemEnum}.${currentItem.replace('.', '_') }`,
                            submenu: ['deviceAttributesValuesTranslation', 'deviceButtonsValuesTranslation'] .includes(enumerationItemAttr) ?  translationsFunctionStatesItemsMenuGenerate :  translationsFunctionDeviceItemsMenuGenerate,
                        });
                        break;
                }
                break;
            }

            case 'name': {
                if (isCurrentAccessLevelAllowModify) {
                    if ((enumerationItemAttrs.includes('nameTranslationId')) && currentEnumerationItem['nameTranslationId']) {
                        subMenuIndex = subMenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}`, subMenuIndex, dataTypeTranslation, translationsGetEnumId(user, dataType, currentItem, enumerationsNamesMain)));
                    }
                    else {
                        subMenuIndex = subMenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}`, subMenuIndex, dataType, currentItem, 'names', enumerationsNamesMain));
                        subMenuIndex = subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemCoreGet(user, cmdItemNameGet)}`,
                            param: commandsPackParams(cmdItemNameGet, dataType, currentItem, enumerationItemAttr),
                            submenu: [],
                        });
                    }
                }
                break;
            }

            case 'names': {
                if (typeOf(currentEnumerationItem.names, 'array') && ! ((enumerationItemAttrs.includes('nameTranslationId')) && currentEnumerationItem['nameTranslationId'])) {
                    let
                        namesItem = {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemTextGet(user, 'Names')}`,
                            submenu: new Array(),
                        },
                        namesSub = 0
                    ;
                    let tmpKeys = [...currentEnumerationItem.names];
                    tmpKeys.shift();
                    if (tmpKeys.length) {
                        tmpKeys.forEach(namesKey => {
                            namesSub = namesItem.submenu.push({
                                index: `${currentIndex}.${subMenuIndex}.${namesSub}`,
                                name: `${translationsItemCoreGet(user, 'cmdItemRename')} "${translationsItemTextGet(user, namesKey)}" (${translationsGetEnumName(user, dataType, currentItem, namesKey)})`,
                                icon: isCurrentAccessLevelAllowModify ? iconItemEdit : '',
                                param: commandsPackParams(isCurrentAccessLevelAllowModify ? cmdGetInput : cmdNoOperation, dataType, currentItem, 'names', namesKey),
                                submenu: [],
                            });
                        });
                        subMenuIndex = subMenu.push(namesItem);
                    }
                }
                break;
            }

            case 'group': {
                const groupItem = {
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'group')}: [${currentEnumerationItem[enumerationItemAttr] == undefined ? '' : currentEnumerationItem[enumerationItemAttr]}]`,
                    icon: iconItemEdit,
                };
                if (isCurrentAccessLevelAllowModify) {
                    groupItem.param = commandsPackParams(cmdEmptyCommand, dataType, currentItem, dataTypeExtraId);
                    groupItem.submenu = enumerationItemGroupsMenuGenerate;
                }
                else {
                    groupItem.param = cmdNoOperation;
                    groupItem.submenu = [];
                }
                subMenuIndex = subMenu.push(groupItem);
                break;
            }

            case  'translationsKeys': {
                // logs(`currentItem = ${currentItem}, isCurrentAccessLevelAllowModify = ${isCurrentAccessLevelAllowModify} `, _l);
                if (isCurrentAccessLevelAllowModify) {
                    subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemMenuGet(user, 'extensionTranslations')}`,
                        id: currentItem,
                        submenu: menuMakeMenuIndexed([
                            {
                                name: `${translationsItemMenuGet(user, 'extensionTranslations')}`,
                                id: currentItem,
                                submenu: translationsExtensionsTranslationsItemsMenuGenerate
                            },
                            ...translationsDownloadUploadMenuPartGenerate(user, currentItem)], `${currentIndex}.${subMenuIndex}`)
                    });
                }
                break;
            }

            default: {
                switch (typeof(currentEnumerationItem[enumerationItemAttr])) {
                    case 'boolean':
                        subMenuIndex = subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemMenuGet(user, enumerationItemAttr)} (${currentEnumerationItem[enumerationItemAttr] ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user) })`,
                            param:  commandsPackParams(isCurrentAccessLevelAllowModify ? cmdItemPress : cmdNoOperation, dataType, currentItem, enumerationItemAttr, dataTypeExtraId),
                            submenu: [],
                        });
                        break;

                    default:
                        subMenuIndex = subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemMenuGet(user, enumerationItemAttr)} "${currentEnumerationItem[enumerationItemAttr]}"`,
                            icon: isCurrentAccessLevelAllowModify ? iconItemEdit : '',
                            param: commandsPackParams(isCurrentAccessLevelAllowModify ? cmdGetInput : cmdNoOperation, dataType, currentItem, enumerationItemAttr, dataTypeExtraId),
                            group: enumerationItemAttr.indexOf('icon') === 0 ? 'icon' : menuButtonsDefaultGroup,
                            submenu: [],
                        });
                        break;
                }
                break;
            }
        }
    }
    if (isCurrentAccessLevelAllowModify){
        switch (dataType) {
            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                const
                    currentFunction = enumerationsList[dataTypeFunction].list[dataTypeExtraId],
                    translationType = `${currentFunction.enum}.${dataTypeExtraId.replace('.', '_')}`,
                    currentTranslation = translationsPointOnItemOwner(user, translationType, true),
                    currentIds = currentItem === currentFunction.state ? [currentItem, translationsPrimaryStateId] : (enumerationsDeviceBasicAttributes.includes(currentItem) ? [] : [currentItem]);
                if (dataType === dataTypeDeviceButtons) {
                    enumerationsDeviceButtonsAccessLevelAttrs.forEach(accessLevelsAttr => {
                        const subMenuItem = {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemTextGet(user, 'set', accessLevelsAttr)}`,
                            icon: (MenuRoles.accessLevels.indexOf(currentEnumerationItem[accessLevelsAttr]) >= 0) ? MenuRoles.accessLevelsIcons[MenuRoles.accessLevels.indexOf(currentEnumerationItem[accessLevelsAttr])] : iconItemAttribute,
                            submenu: new Array(),
                        };
                        let subSubMenuIndex = 0;
                        if (accessLevelsAttr === enumerationsAccessLevelToPress) {
                            subSubMenuIndex = subMenuItem.submenu.push({
                                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                name: `[${translationsItemTextGet(user, enumerationsConvertButtonToAttribute)}]`,
                                icon: currentEnumerationItem[accessLevelsAttr] === enumerationsConvertButtonToAttribute ? iconItemAttribute : iconItemButton,
                                param: commandsPackParams(cmdItemPress, dataType, currentItem, accessLevelsAttr, dataTypeExtraId, enumerationsConvertButtonToAttribute),
                                submenu: []
                            });
                        }
                        MenuRoles.accessLevels.filter(accessLevel => ! MenuRoles.accessLevelsHidden.includes(accessLevel)).forEach((accessLevel, levelIndex) => {
                            if (accessLevel !== rolesAccessLevelForbidden) {
                                subSubMenuIndex = subMenuItem.submenu.push({
                                    index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                    name: `[${translationsItemTextGet(user, 'AccessLevel', accessLevel)}]`,
                                    icon: accessLevel === currentEnumerationItem[accessLevelsAttr] ? MenuRoles.accessLevelsIcons[levelIndex] : iconItemButton,
                                    param: commandsPackParams(cmdItemPress, dataType, currentItem, accessLevelsAttr, dataTypeExtraId, accessLevel),
                                    submenu: []
                                });
                            }
                        });
                        subSubMenuIndex = subMenuItem.submenu.push({
                            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                            name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
                            icon: iconItemApply,
                            group: cmdItemsProcess,
                            param: commandsPackParams(cmdItemJumpTo, [jumpToUp].join('.')),
                            submenu: []
                        });
                        subMenuIndex = subMenu.push(subMenuItem);
                    });
                }
                currentIds.forEach(currentId => {
                    const
                        currentTranslationShortId = currentId.split('.').join('_'),
                        currentTranslationId = `${translationType}.${currentTranslationShortId}`;
                    let currentValue = currentTranslation[currentTranslationShortId];
                    // logs(`translationType = ${translationType}, currentTranslationId = ${currentTranslationId}, currentTranslationShortId = ${currentTranslationShortId}, currentValue = ${currentValue}`);
                    if ((currentValue === null || currentValue === undefined) || (currentId === currentTranslationId)) {
                        currentValue = `${currentTranslationId} ${iconItemNotFound}`;
                    }
                    else if (currentValue.indexOf(translationsCommonFunctionsAttributesPrefix) === 0) {
                        currentValue = `${translationsItemGet(user, `${translationsCommonFunctionsAttributesPrefix}.${currentId}`)} ${iconItemCommon}`;
                    }
                    else {
                        currentValue = `${translationsItemCoreGet(user, 'cmdItemRename')}: "${currentValue}"`;
                    }
                    let
                        subSubMenuIndex = 0,
                        subMenuItem = {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${currentValue}`,
                            text: ` [${currentTranslationId}]`,
                            group: 'cmdItemRename',
                            icon: iconItemEdit,
                            submenu: new Array()
                        };
                    subSubMenuIndex = subMenuItem.submenu.push(menuRenameItemMenuItemGenerate(user,`${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeTranslation, currentTranslationId));
                    subSubMenuIndex = subMenuItem.submenu.push({
                        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                        name: `${translationsItemCoreGet(user, cmdUseCommonTranslation)}`,
                        icon: iconItemCommon,
                        param: commandsPackParams(cmdUseCommonTranslation, dataTypeTranslation, currentTranslationId),
                        submenu: [],
                    });
                    subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeTranslation, dataTypeTranslation, currentTranslationId));
                    subMenuIndex = subMenu.push(subMenuItem);
                });
                break;
            }

            case dataTypeReport: {
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'ReportEdit')}`,
                    param: currentItem,
                    submenu: simpleReportMenuGenerateReportEdit,
                });
                break;
            }
        }
        if (((dataType === dataTypePrimaryEnums) && (enumerationsGetActiveSubItemsCount(dataTypeExtraId, currentItem) === 0)) ||
            ((dataType !== dataTypePrimaryEnums) &&
            ((configOptions.getOption(cfgAllowToDeleteEmptyEnums) && enumerationsIsItemCanBeDeleted(dataType, currentItem, true)) || (enumerationsIsItemCanBeDeleted(dataType, currentItem, false))
            ))
            )
            subMenuIndex = subMenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}`, subMenuIndex, dataType, currentItem, dataTypeExtraId));
    }
    [subMenu,  subMenuIndex] = menuNavigationLeftRightMenuPartGenerate(user, subMenu, currentIndex, subMenuIndex, currentEnumerationItem.order, lastItemIndex);
    logs(`subMenu = ${JSON.stringify(subMenu)}`);
    return subMenu;
}

/**
 * This function return a count of  enabled enumerations items for appropriate
 * primary enum(like `functions', `rooms`, etc)
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} primaryEnumId - The appropriate primary enum Id.
 * @returns {number} The count of items.
 */
function enumerationsGetActiveSubItemsCount(enumerationType, primaryEnumId) {
    const extraMenuList = enumerationsList[enumerationType].list;
    return Object.keys(extraMenuList).filter(itemId => (extraMenuList[itemId].isEnabled  && (extraMenuList[itemId].enum === primaryEnumId))).length;
}

/**
 * This function make a check, is the current `enumerationItem` can be deleted.
 * If the `withEnum` is true - to extend the check on related enum.
 * The result is a enumId in case of `withEnum`, or 'can be deleted' in case of
 * deletion is possible and empty string  - if not.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem, i.e. ioBroker enum Id.
 * @param {boolean=} withEnum - The selector of deletion check.
 * @returns {string} The string containing the appropriate enum Id in case of `withEnum`, or 'can be deleted' in case of deletion is possible and empty string  - if not.
 */
function enumerationsIsItemCanBeDeleted(enumerationType, enumerationItemId, withEnum){
    const
        currentEnumeration = enumerationsList[enumerationType],
        currentEnumerationItemObject =  currentEnumeration && currentEnumeration.list.hasOwnProperty(enumerationItemId) ? currentEnumeration.list[enumerationItemId] : {},
        enumObjectId = currentEnumeration && currentEnumerationItemObject.isAvailable && Object.keys(currentEnumeration.enums).includes(currentEnumerationItemObject.enum) ? `${prefixEnums}.${currentEnumerationItemObject.enum}.${enumerationItemId}` : '',
        enumObject = enumObjectId && (! currentEnumerationItemObject.isExternal) ? getObject(enumObjectId) : null,
        enumMembers = enumObject ? (enumObject.hasOwnProperty('common') && enumObject.common.hasOwnProperty('members') ? enumObject.common.members : []) : [];
    return withEnum && enumObjectId && enumMembers && (enumMembers.length === 0) ? enumObjectId : ((! withEnum) && currentEnumerationItemObject && (! enumObjectId) ? 'can be deleted' : '');
}

/**
 * This function a string containing a formatted details/properties of current enumerations item.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
 */
function enumerationsItemMenuItemDetails(user, menuItemToProcess) {
    const
        [_cmdId, enumerationType, currentItem, _paramToSkip, enumerationTypeExtraId, _otherParams] = commandUnpackParams(menuItemToProcess.param),
        currentEnumeration = enumerationsGetList(enumerationType, enumerationTypeExtraId),
        currentEnumerationItem = currentEnumeration[currentItem];
    const currentItemDetailsList = [];
    enumerationItemDefaultDetails.forEach((item) => {
        if (currentEnumerationItem.hasOwnProperty(item) || (item === 'itemId')) {
            const currentItemDetailsLineObject = {
                label: `${translationsItemTextGet(user, 'list', item)}`
            };
            if (typeof(currentEnumerationItem[item]) === 'boolean') {
                currentItemDetailsLineObject.valueString = currentEnumerationItem[item] ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user);
                currentItemDetailsLineObject.lengthModifier = 1;
            }
            else {
                currentItemDetailsLineObject.valueString =  currentEnumerationItem.hasOwnProperty(item) ? currentEnumerationItem[item] : (currentEnumerationItem.hasOwnProperty('enum') ? `[${currentEnumerationItem.enum}.]${currentItem}` : currentItem);
            }
            currentItemDetailsList.push(currentItemDetailsLineObject);
        }
    });
    if (currentEnumerationItem.order > 0) {
        const
            previousOrder = currentEnumerationItem.order - 1,
            previousItem = Object.keys(currentEnumeration).find(item => currentEnumeration[item].order === (previousOrder));
        currentItemDetailsList.push({
            label: translationsItemTextGet(user, 'ListPrevious'),
            valueString: previousItem ? enumerationsItemName(user, enumerationType, previousItem, currentEnumeration[previousItem]) : ''
        });
    }
    if (currentEnumerationItem.order < (Object.keys(currentEnumeration).length - 1)) {
        const
            nextOrder = currentEnumerationItem.order + 1,
            nextItem = Object.keys(currentEnumeration).find(item => currentEnumeration[item].order === (nextOrder));
        currentItemDetailsList.push({
            label: translationsItemTextGet(user, 'ListNext'),
            valueString: nextItem ? enumerationsItemName(user, enumerationType, nextItem, currentEnumeration[nextItem]) : ''
    });
    }
    if (enumerationType === dataTypePrimaryEnums) {
        const dataTypeActiveSubItemsCount = enumerationsGetActiveSubItemsCount(enumerationTypeExtraId, currentItem);
        currentItemDetailsList.push({label: `${translationsItemMenuGet(user, enumerationsList[enumerationTypeExtraId].id)}`, valueString: `${dataTypeActiveSubItemsCount}`});
        currentItemDetailsList.push({label: `${translationsItemTextGet(user, 'canBeDeleted')}`, lengthModifier: 1, valueString: `${dataTypeActiveSubItemsCount === 0 ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user)}`});
    }
    else if (currentEnumerationItem.enum ) {
        currentItemDetailsList.push({label: `${translationsItemTextGet(user, 'canBeDeleted')}`, lengthModifier: 1, valueString: `${(configOptions.getOption(cfgAllowToDeleteEmptyEnums) && enumerationsIsItemCanBeDeleted(enumerationType, currentItem, true)) || (enumerationsIsItemCanBeDeleted(enumerationType, currentItem, false)) ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user)}`});
    }
    return currentItemDetailsList.length ? `<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, currentItemDetailsList)}</code>` : '';
}

/**
 * This function returns a name of current enumerations item.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem.
 * @param {object} enumerationItem - The current enumerationItem object.
 * @returns {string} The enumerations item name.
 */
function enumerationsItemName(user, enumerationType, enumerationItemId, enumerationItem) {
    const currentItemTranslationId = translationsGetEnumId(user, enumerationType, enumerationItemId, enumerationsNamesMain);
    // logs(`enumerationType = ${enumerationType}, enumerationItemId = ${enumerationItemId}, currentItemTranslationId = ${currentItemTranslationId}`, _l)
    if (enumerationItem.hasOwnProperty('name') && (enumerationItem.name !== undefined) && (translationsItemGet(user, currentItemTranslationId) === currentItemTranslationId) ) {
        // logs(`currentItemTranslationId ${currentItemTranslationId}`);
        enumerationsRereadItemName(user, enumerationType, enumerationItemId);
    }
    let result = enumerationItem.name ?
        translationsItemGet(user, currentItemTranslationId) :
        (enumerationType === dataTypePrimaryEnums ?
            `${stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumerationItemId}`))} [${enumerationItemId}]` :
            translationsItemGet(user, enumerationItem.nameTranslationId)
        );
    if (enumerationItem.name && enumerationItemId.includes('.')) {
        const parentId = enumerationItemId.split('.').shift();
        result = `${translationsGetEnumName(user, enumerationType, parentId, enumerationsNamesMain)} ${iconItemToSubItemByArrow} ${result}`;
    }
    return result;
}

/**
 * This function generates a submenu with all enumerations items of appropriate enumerationType.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function enumerationsListMenuGenerate(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentAccessLevel = menuItemToProcess.accessLevel,
        enumerationType = menuItemToProcess.hasOwnProperty('id') ? menuItemToProcess.id : menuItemToProcess.param,
        enumerationTypeExtraId = enumerationsSubTypesExtended.includes(enumerationType) ? menuItemToProcess.param : undefined;
    if (enumerationType !== dataTypePrimaryEnums) {
        const dataType = enumerationsSubTypes.includes(enumerationType) ? dataTypeFunction : enumerationType;
        enumerationsLoad(dataType);
        enumerationsInit(dataType);
    }
    if (enumerationsSubTypes.includes(enumerationType)) {
        if (Object.keys(enumerationsList[dataTypeFunction].list[enumerationTypeExtraId][enumerationType]).length === 0) {
            enumerationsRefreshFunctionDeviceStates(enumerationTypeExtraId, enumerationType, false);
        }
    }
    const currentEnumeration = enumerationsGetList(enumerationType, enumerationTypeExtraId);
    let
        subMenu = [],
        subMenuIndex = 0;
    Object.keys(currentEnumeration)
        .sort((a, b) => (currentEnumeration[a].order - currentEnumeration[b].order))
        .forEach((currentItem) => {
            // logs(`currentItem = ${JSON.stringify(currentItem)}`, _l);
            const
                currentEnumerationItem = currentEnumeration[currentItem],
                currentIcon = currentEnumerationItem.isEnabled ? (currentEnumerationItem.hasOwnProperty('icon') ? currentEnumerationItem.icon : '') : iconItemDisabled;
            // logs(`currentEnumerationItem = ${JSON.stringify(currentEnumerationItem)}`, _l);
            const currentMenuItem = {
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${enumerationsItemName(user, enumerationType, currentItem, currentEnumerationItem)}${currentEnumerationItem.isExternal ? ` ${iconItemIsExternal}`: ''}`,
                    icon: currentIcon,
                    accessLevel: currentAccessLevel,
                    function: enumerationsItemMenuItemDetails,
                    param: commandsPackParams(cmdEmptyCommand, enumerationType, currentItem, enumerationsSubTypesExtended.includes(enumerationType) ? '' : undefined, enumerationsSubTypesExtended.includes(enumerationType) ? enumerationTypeExtraId : undefined),
                    submenu: enumerationsItemMenuGenerate
            };
            switch (enumerationType) {
                case dataTypeDeviceAttributes:
                case dataTypeDeviceButtons:
                    currentMenuItem.funcEnum = menuItemToProcess.param;
                    break;
                default:
                    break;
            }
            subMenuIndex = subMenu.push(currentMenuItem);
        });

    switch (enumerationType) {

        case dataTypeFunction:
        case dataTypeDestination:
        case dataTypeReport:
            switch (enumerationType) {
                case dataTypeFunction:
                    subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemMenuGet(user, 'commonStatesTranslation')}`,
                        icon: iconItemCommon,
                        accessLevel: currentAccessLevel,
                        id: `${translationsCommonFunctionsAttributesPrefix}`,
                        submenu: translationsFunctionStatesItemsMenuGenerate,
                    });
                    break;
                case dataTypeReport:
                    if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
                        const subMenuItem = {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                            icon: iconItemPlus,
                            group: cmdItemAdd,
                            param: '',
                        };
                        const currentEnumsList = Object.keys(enumerationsList[enumerationType].enums);
                        if (currentEnumsList.length === 1) {
                            subMenuItem.submenu = simpleReportMenuGenerateReportEdit;
                        }
                        else {
                            subMenuItem.submenu = new Array();
                            currentEnumsList.forEach((enumId, enumIndex) => {
                                subMenuItem.submenu.push({
                                    index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
                                    name: `${stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumId}`))}`,
                                    icon: iconItemPlus,
                                    accessLevel: currentAccessLevel,
                                    id: enumId,
                                    param: '',
                                    submenu: simpleReportMenuGenerateReportEdit,
                                });
                            });
                        }
                        subMenuIndex = subMenu.push(subMenuItem);
                    }
                    break;
            }
            subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, enumerationsEditEnums)}`,
                icon: iconItemEdit,
                accessLevel: currentAccessLevel,
                param: enumerationType,
                group: enumerationsEditEnums,
                id: dataTypePrimaryEnums,
                submenu: enumerationsListMenuGenerate,
            });
            break;

        case dataTypeDeviceAttributes:
        case dataTypeDeviceButtons:
            if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemCoreGet(user, 'cmdItemsLoad')}`,
                    icon: iconItemRefresh,
                    group: cmdItemsProcess,
                    param:  commandsPackParams(cmdItemsProcess, enumerationType, menuItemToProcess.param),
                    submenu: [],
                });
            }
            break;

        case dataTypePrimaryEnums:
            if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
                let availableEnums = new Array();
                getEnums().forEach(enumObject => {
                    const shortId = enumObject.id.replace(`${prefixEnums}.`, '');
                    if (! shortId.includes('.')) availableEnums.push(shortId);
                });
                Object.keys(enumerationsList).forEach(dataType => {
                    Object.keys(enumerationsList[dataType].enums).forEach(enumId => {
                        if (availableEnums.includes(enumId)) availableEnums.splice(availableEnums.indexOf(enumId), 1);
                    });
                });
                if (availableEnums.length) {
                    const subMenuItem = {
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                        funcEnum: menuItemToProcess.funcEnum,
                        icon: iconItemPlus,
                        group: cmdItemAdd,
                        submenu: new Array(),
                    };
                    availableEnums.forEach((enumId, enumIndex) => {
                        subMenuItem.submenu.push({
                            index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
                            name: `${stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumId}`))}[${enumId}]`,
                            param: commandsPackParams(cmdItemPress, enumerationType, enumId, cmdItemAdd, enumerationTypeExtraId),
                            submenu: []
                        });
                    });
                    subMenuIndex = subMenu.push(subMenuItem);
                }
            }
            break;

        default:
            break;
    }
    return subMenu;
}


/**
 * This function checks, if the current ioBroker state object has appropriate History adapter configured.
 * @param {object} stateObject - The ioBroker object.
 * @param {string} historyAdapterId - The history adapter Id.
 * @returns {boolean} 'True' if history is enabled for state.
 */
function enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) {
    return stateObject.common && stateObject.common.hasOwnProperty('custom')
        && stateObject.common.custom && stateObject.common.custom.hasOwnProperty(historyAdapterId)
        && stateObject.common.custom[historyAdapterId];
}

/**
 * This function generates a submenu with Buttons for each state which have an "RW" access.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} Newly generated submenu.
 */
function enumerationsMenuGenerateDeviceButtons(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentDestinationId = menuItemToProcess.destEnum,
        destinationsList = enumerationsList[dataTypeDestination].list,
        currentDestination = destinationsList[currentDestinationId],
        currentDestinationEnum = currentDestination.enum,
        fullDestinationId = `enum.${currentDestinationEnum}.${currentDestinationId}`,
        currentFunctionId = menuItemToProcess.funcEnum,
        functionsList = enumerationsList[dataTypeFunction].list,
        currentFunction = functionsList[currentFunctionId],
        currentFunctionEnum = currentFunction.enum,
        fullFunctionId = `enum.${currentFunctionEnum}.${currentFunctionId}`,
        isStatesInFolders = currentFunction.statesInFolders,
        currentIcons = {on: currentFunction.iconOn, off: currentFunction.iconOff},
        deviceAttributesList = currentFunction.deviceAttributes,
        currentDeviceAttributes = deviceAttributesList ? Object.keys(deviceAttributesList).filter((deviceAttr) => (deviceAttributesList[deviceAttr].isEnabled)).sort((a, b) => (deviceAttributesList[a].order - deviceAttributesList[b].order)) : [],
        deviceButtonsList = currentFunction.deviceButtons,
        currentDeviceButtons = deviceButtonsList ? Object.keys(deviceButtonsList).filter((deviceButton) => (deviceButtonsList[deviceButton].isEnabled)).sort((a, b) => (deviceButtonsList[a].order - deviceButtonsList[b].order)) : [],
        primaryStateId = menuItemToProcess.state,
        idPrefix = primaryStateId.split('.').slice(0, isStatesInFolders ? -2 : -1).join('.'),
        primaryStateShortId = primaryStateId.replace(`${idPrefix}.`,''),
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        isCurrentAccessLevelNonSilent = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelSilent) < 0,
        historyAdapterId = configOptions.getOption(cfgHistoryAdapter, user),
        graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
        isGraphsEnabled = historyAdapterId && existsObject(`${graphsTemplatesFolder}.${graphsDefaultTemplate}`),
        statesForGraphs = new Map();
    let
        subMenuIndex = 0,
        subMenu = [];
    // logs('menuItemToProcess = ' + JSON.stringify(menuItemToProcess), _l);
    logs('currentMenuFuncId = ' + JSON.stringify(currentFunctionId));
    logs('currentMenuStateId = ' + JSON.stringify(primaryStateId));
    // logs('mainStateShortId = ' + JSON.stringify(mainStateShortId));
    if (isGraphsEnabled) {
        currentDeviceAttributes.forEach((deviceAttributeId) => {
            const
                stateIdFull = `${idPrefix}.${deviceAttributeId}`,
                stateShortIdSectionsCount = deviceAttributeId.split('.').length;
            if (existsObject(stateIdFull) && (( stateShortIdSectionsCount == 1) || (isStatesInFolders && ( stateShortIdSectionsCount == 2)))) {
                const stateObject = getObject(stateIdFull, '*');
                logs('itemObject.common = ' + JSON.stringify(stateObject.common));
                if (stateObject && stateObject.hasOwnProperty('common') && stateObject.common) {
                    const currentStateType = stateObject.common['type'];
                    if (enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) && (currentStateType === 'number')) {
                        statesForGraphs.set(stateIdFull, translationsGetObjectName(user, stateObject, currentFunctionId));
                    }
                }
            }
        });
    }
    currentDeviceButtons.forEach((deviceButtonId) => {
        const
            stateIdFull = `${idPrefix}.${deviceButtonId}`,
            stateShortIdSectionsCount = deviceButtonId.split('.').length,
            currentButton = deviceButtonsList[deviceButtonId],
            isButtonAllowedToShow = MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.showAccessLevel) <= 0,
            isButtonAllowedToPress = isCurrentAccessLevelAllowModify && (MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.pressAccessLevel) <= 0) && menuItemIsAvailable(currentFunction, primaryStateId);
        // logs(`deviceButtonId = ${deviceButtonId}, isButtonAllowedToShow = ${isButtonAllowedToShow}, isButtonAllowedToPress = ${isButtonAllowedToPress}, stateIdFull ${stateIdFull}`);
        /* to process only right devices */
        if (isButtonAllowedToShow && existsObject(stateIdFull) && (( stateShortIdSectionsCount == 1) || (isStatesInFolders && ( stateShortIdSectionsCount == 2)))) {
            const stateObject = getObject(stateIdFull, '*');
            // logs('itemObject.common = ' + JSON.stringify(stateObject.common));
            if (stateObject && stateObject.hasOwnProperty('common') && stateObject.common) {
                const
                    stateObjectEnums = stateObject.hasOwnProperty('enumIds') ? stateObject['enumIds'] : undefined,
                    isStateObjectRight = stateObjectEnums && stateObjectEnums.includes(fullFunctionId) && stateObjectEnums.includes(fullDestinationId),
                    isCurrentStateWritable = stateObject.common.hasOwnProperty('write') ? stateObject.common.write : false,
                    currentStateType = stateObject.common['type'];
                // logs(`stateObjectEnums = ${JSON.stringify(stateObjectEnums)}, fullFunctionId = ${fullFunctionId}, fullDestinationId = ${fullDestinationId}`);
                // logs(`isStateObjectRight = ${JSON.stringify(isStateObjectRight)}, isCurrentStateWritable = ${isCurrentStateWritable} `);
                if (isStateObjectRight && isCurrentStateWritable) {
                    const stateName = translationsGetObjectName(user, stateObject, currentFunctionId);
                    // logs(`stateName = ${JSON.stringify(stateName)}`);
                    if (stateName) {
                        let
                            subSubMenuIndex = 0,
                            currentState = existsState(stateIdFull) ? getState(stateIdFull): undefined,
                            stateValue = currentState !== undefined ? currentState.val : undefined,
                            states = [],
                            subMenuItem = {
                                index: `${currentIndex}.${subMenuIndex}`,
                                name: `${stateName}`,
                                funcEnum: currentFunctionId,
                                group: currentButton.group ? currentButton.group : menuButtonsDefaultGroup,
                                submenu: new Array()
                            };
                        logs('stateObject = ' + JSON.stringify(stateObject, null, 2));
                        if (currentStateType === 'boolean') {
                            if (stateValue === undefined) stateValue = false;
                            subMenuItem.icons = currentIcons;
                            subMenuItem.state = stateIdFull;
                        }
                        else if (stateObject.common.hasOwnProperty('states') && (['string','number'].includes(currentStateType) )) {
                            states = enumerationsExtractPossibleValueStates(stateObject.common['states']);
                            logs('states = ' + JSON.stringify(states));
                            if ((states !== undefined) && Object.keys(states).length > 0) {
                                subMenuItem.icon = '';
                                for (const [possibleValue, possibleName] of Object.entries(states)) {
                                    if (isButtonAllowedToPress) {
                                        logs(`possibleValue = ${JSON.stringify(possibleValue)}, possibleName = ${JSON.stringify(possibleName)}`);
                                        const subSubMenuItem = {
                                            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                            name: `${enumerationsStateValueDetails(user, stateObject, currentFunctionId, {val: possibleValue})['valueString'] /*  possibleName !== undefined ? possibleName : possibleValue */}`,
                                            state: commandsPackParams(stateIdFull, possibleValue),
                                            funcEnum: currentFunctionId,
                                            icon: stateValue == possibleValue ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user),
                                            submenu: []
                                        };
                                        subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);
                                    }
                                    if (stateValue == possibleValue) {
                                        subMenuItem.name += ` (${(enumerationsStateValueDetails(user, stateObject, currentFunctionId, currentState)['valueString'])})`;
                                    }
                                }
                                logs('subMenuItem = ' + JSON.stringify(subMenuItem, null, 2));
                            }
                        }
                        else if (currentStateType === 'number') {
                            const step = Number(stateObject.common.hasOwnProperty('step') ? stateObject.common['step'] : 1);
                            stateValue = Number(stateValue);
                            for(let steps = stateValue - 2 * step; steps <= stateValue + 2 * step; steps += step) {
                                if ( ((! stateObject.common.hasOwnProperty('min')) || (steps >=  Number(stateObject.common['min'])))
                                && ((! stateObject.common.hasOwnProperty('max')) || (steps <=  Number(stateObject.common['max'])))) {
                                    states.push(steps);
                                }
                            }
                            subMenuItem.icon = '';
                            subMenuItem.name += ` (${stateValue ? stateValue : iconItemNotFound}${stateObject.common.hasOwnProperty('unit') ? ` ${stateObject.common['unit']}` : '' })`;
                            logs('states.length = ' + JSON.stringify(states.length));
                            if (isButtonAllowedToPress) {
                                states.forEach(possibleValue => {
                                    logs('possibleValue = ' + JSON.stringify(possibleValue));
                                    const subSubMenuItem = {
                                        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                        name: `${possibleValue}${stateObject.common.hasOwnProperty('unit') ? ` ${stateObject.common['unit']}` : '' }`,
                                        state: commandsPackParams(stateIdFull, possibleValue),
                                        funcEnum: currentFunctionId,
                                        icon: stateValue == possibleValue ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff,),
                                        submenu: []
                                    };
                                    subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);

                                });
                                subSubMenuIndex = subMenuItem.submenu.push({
                                    index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                                    name: `${translationsItemMenuGet(user, 'SetValue')} (${stateValue ? stateValue : ''}${stateObject.common.hasOwnProperty('unit') ? ` ${stateObject.common['unit']}` : '' })`,
                                    icon: iconItemEdit,
                                    funcEnum: currentFunctionId,
                                    param: commandsPackParams(cmdGetInput, dataTypeStateValue, currentFunctionId, stateIdFull, 'number'),
                                    submenu: []
                                });
                            }
                        }
                        if ((subMenuItem.icon !== undefined) || subMenuItem.icons) {
                            logs('subMenuItem.icon = ' + JSON.stringify(subMenuItem.icon));
                            if (! isButtonAllowedToPress) subMenuItem.param = cmdNoOperation;
                            if (deviceButtonId !== primaryStateShortId) {
                                subMenuIndex = subMenu.push(subMenuItem);
                            }
                            else {
                                subMenuIndex = subMenu.unshift(subMenuItem);
                            }
                        }
                        if (isGraphsEnabled && enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) && (currentStateType === 'number')) {
                            statesForGraphs.set(stateIdFull, stateName);
                        }
                    }
                }
            }
        }
    });
    if (isCurrentAccessLevelNonSilent) {
        const alertSubscribeItem = alertsSubscribedOnMenuItemGenerate(`${currentIndex}.${subMenuIndex}`, `${translationsItemCoreGet(user, cmdAlertSubscribe)}`, primaryStateId, undefined, commandsPackParams(cmdAlertSubscribe, primaryStateId, currentFunctionId, currentDestinationId));
        if (alertSubscribeItem) {
            subMenuIndex = subMenu.push(alertSubscribeItem);
        }
        subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'AlertsSubscriptionExtended')}`,
            param: primaryStateId,
            destEnum: currentDestinationId,
            funcEnum: currentFunctionId,
            accessLevel: currentAccessLevel,
            icon: iconItemAlerts,
            function: enumerationsDeviceAttributesMenuItemDetails,
            group: 'alerts',
            submenu: alertsMenuGenerateExtraSubscription
        });
    }
    if (statesForGraphs.size) {
        const subMenuItem = {
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'Graphs')}`,
            icon: iconItemChart,
            submenu: new Array()
        };
        let subSubMenuIndex = 0;
        statesForGraphs.forEach((stateName, stateId) => {
            const subSubMenuItem = {
                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                name: `${stateName}`,
                icon: iconItemChart,
                submenu: new Array(),
            };
            let subSubSubMenuIndex = 0;
            const graphsIntervals = configOptions.getOption(cfgGraphsIntervals, user);
            if (graphsIntervals && typeOf(graphsIntervals, 'array') && graphsIntervals.length) {
                graphsIntervals.forEach(({id: graphsIntervalId, minutes: graphsIntervalMinutes}) => {
                    // logs(`generateTextTranslationId('TimeRange', graphsTimeRangeId) = ${generateTextTranslationId('TimeRange', graphsTimeRangeId)}`);
                    subSubSubMenuIndex = subSubMenuItem.submenu.push({
                        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}.${subSubSubMenuIndex}`,
                        name: `${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}`,
                        icon: iconItemChart,
                        group: cmdItemsProcess,
                        param: commandsPackParams(cmdItemsProcess, dataTypeGraph, stateId, stateName, graphsIntervalMinutes, currentFunctionId, menuItemToProcess.destEnum)
                    });
                });
            }
            if (sentImagesExists(user)) {
                subSubSubMenuIndex = subSubMenuItem.submenu.push({
                    index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}.${subSubSubMenuIndex}`,
                    name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
                    icon: iconItemDelete,
                    param: cmdDeleteAllSentImages,
                    group: cmdDeleteAllSentImages
                });
            }
            subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);
        });
        if (sentImagesExists(user)) {
            subSubMenuIndex = subMenuItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
                icon: iconItemDelete,
                param: cmdDeleteAllSentImages,
                group: cmdDeleteAllSentImages
            });
        }
        subMenuIndex = subMenu.push(subMenuItem);
    }
    if (menuItemToProcess.hasOwnProperty('navigationParams') && typeOf(menuItemToProcess.navigationParams, 'array') && (menuItemToProcess.navigationParams.length === 4)) {
        [subMenu, subMenuIndex]  = menuNavigationLeftRightMenuPartGenerate(user, subMenu, currentIndex, subMenuIndex, menuItemToProcess.navigationParams[0], menuItemToProcess.navigationParams[1], undefined, false, menuItemToProcess.navigationParams[2], menuItemToProcess.navigationParams[3]);
    }
    // logs('subMenu New = ' + JSON.stringify(subMenu, null, 1), _l);
    return subMenu;

}

/**
 * This function extracts the list(`object`) of possible value states for the appropriate ioBroker state.
 * @param {*} inputStates
 * @returns
 */
function enumerationsExtractPossibleValueStates(inputStates) {
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

/**
 * This function used to evaluate the code, associated with the attribute, to convert the ioBroker state value to new one.
 * @param {object} user - The user object.
 * @param {any} inputValue - The input value.
 * @param {string} convertValueCode - The string, contained converting code.
 * @returns {any} The result of conversion.
 */
function enumerationsEvaluateValueConversionCode(user, inputValue, convertValueCode) {
    // logs(`value = ${value}, convertValueCode = ${convertValueCode}`)
    const printDate = 'printDate(value)';
    if (typeOf(convertValueCode, 'string')) {
        if ((convertValueCode === printDate) || (convertValueCode === `${printDate};`)) {
            try {
                inputValue = formatDate(new Date(inputValue), configOptions.getOption(cfgDateTimeTemplate, user));
            }
            catch (error) {
                console.warn(`Can't print date printDate(${inputValue})! Error is "${JSON.stringify(error)}".`);
            }
        }
        else if (convertValueCode.length > 0) {
            const sandbox = { value: inputValue, result: undefined };
            nodeVm.createContext(sandbox); // Contextify the sandbox.
            try {
                if (convertValueCode.includes('return')) {
                    nodeVm.runInContext(`const func = () => {${convertValueCode}}; result = func()`, sandbox);
                }
                else {
                    nodeVm.runInContext(`const func = () => (${convertValueCode}); result = func()`, sandbox);
                }
                /**
                 * ! fix - to check!
                 */
                inputValue = sandbox.result;
            }
            catch (error) {
                console.warn(`Can't convert value with ${convertValueCode}! Error is "${JSON.stringify(error)}".`);
            }
        }
    }
    return inputValue;
}

/**
 * This function get the ioBroker state value and return it as object contained an formatted string and it's length modifier, taking in account all possible states and it's units.
 * @param {object} user - The user object.
 * @param {string|object} stateIdOrObject - The id of the state or the it's object representation.
 * @param {string} functionId - The id of the associated function.
 * @param {object=} currentState - The object, contained the current state information.
 * @returns {object} The resulted object contained the formatted string.
 */
function enumerationsStateValueDetails(user, stateIdOrObject, functionId, currentState) {
    const currObject = ((typeof(stateIdOrObject) === 'string') && existsObject(stateIdOrObject)) ? getObject(stateIdOrObject) : stateIdOrObject;
    let valueString = '';
    let lengthModifier = 0;
    if (currObject && (typeof(currObject) === 'object') && currObject.hasOwnProperty('_id') && currObject.hasOwnProperty('common')) {
        const
            currentId = currObject._id,
            currentFunction = enumerationsList[dataTypeFunction].list[functionId],
            currentAttributeId = currentId.split('.').slice( - currentFunction.state.split('.').length).join('.'),
            convertValueCode = currentFunction.deviceAttributes.hasOwnProperty(currentAttributeId) ? currentFunction.deviceAttributes[currentAttributeId].convertValueCode : "",
            stateTranslationIdSuffix = currentId.split('.').slice( - currentFunction.state.split('.').length).join('_'),
            currObjectType = currObject.common['type'],
            currObjectUnit = currObject.common.hasOwnProperty('unit') ? currObject.common['unit'] : '',
            currStateVal = enumerationsEvaluateValueConversionCode(user, (currentState && currentState.hasOwnProperty('val')) ? currentState.val : (existsState(currentId) ? getState(currentId).val : undefined), convertValueCode),
            currStateValType = currStateVal == undefined ? currObjectType : typeof(currStateVal),
            currStateValueId = `${stateTranslationIdSuffix}_${currStateVal}`;
        logs('currObject = ' + JSON.stringify(currObject));
        // logs(`${currentFunction.enum}.${functionId}, currState = ${JSON.stringify(currStateVal)}, currStateValType = ${currStateValType}`);
        if ( (currObjectType === 'boolean') &&  (currStateValType === 'boolean')) {
            if (currStateVal !== undefined) {
                valueString = translationsGetObjectName(user, currStateValueId, functionId);
                // logs(`valueString = ${valueString}, currStateValueId = ${currStateValueId}`)
                if ((valueString === 'Undefined') || (valueString.includes(currStateValueId))) {
                    valueString = currStateVal ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user);
                    lengthModifier = 1;
                }
            }
            else {
                valueString = configOptions.getOption(cfgDefaultIconOff, user);
                lengthModifier = 1;
            }
        }
        else if (currObject.common.hasOwnProperty('states') && (['string','number'].includes(currObject.common['type']) )) {
            const states = enumerationsExtractPossibleValueStates(currObject.common['states']);
            if (currStateVal !== undefined) {
                if (states.hasOwnProperty(currStateVal)) {
                    valueString =  translationsGetObjectName(user, currStateValueId, functionId);
                    if ((valueString === 'Undefined') || (valueString.includes(currStateValueId))) valueString = states[currStateVal];
                    if (valueString === undefined) valueString = currStateVal;
                }
                else {
                    valueString = `${currStateVal}`;
                }
            }
        }
        else if ( (currObjectType === 'number') &&  (currStateValType === 'number')) {
            valueString = (currStateVal === undefined ? '' : (Number.isInteger(currStateVal) ? currStateVal : currStateVal.toFixed(2))) + (currObjectUnit ?  ' ' + currObjectUnit : '');
        }
        else if (currStateValType === 'string') {
            valueString = (currStateVal === undefined ? '' : currStateVal) + (currObjectUnit ?  ' ' + currObjectUnit : '');
        }
    }
    return {valueString, lengthModifier};
}


/**
 * This function a string containing formatted details/properties of current role.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
*/
function enumerationsDeviceAttributesMenuItemDetails(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess, null, 2)}`);
    logs(`user = ${JSON.stringify(user)}`);
    let text = '';
    if ((typeof menuItemToProcess === 'object') && (menuItemToProcess.hasOwnProperty('state'))) {
        const
            currentFunctionId = menuItemToProcess.funcEnum,
            primaryStateId = menuItemToProcess.state,
            functionsList = enumerationsList[dataTypeFunction].list,
            currentFunction = functionsList[currentFunctionId],
            isStatesInFolders = currentFunction.statesInFolders,
            idPrefix = primaryStateId.split('.').slice(0, isStatesInFolders ? -2 : -1).join('.');
        if (functionsList.hasOwnProperty(menuItemToProcess.funcEnum) && currentFunction.hasOwnProperty('deviceAttributes')) {
            const
                primaryObject = getObject(primaryStateId),
                primaryState = getState(primaryStateId),
                deviceAttributesList = currentFunction.deviceAttributes,
                deviceAttributesArray = [],
                deviceAttributes = Object.keys(deviceAttributesList).filter((deviceAttr) => (deviceAttributesList[deviceAttr].isEnabled)).sort((a, b) => (deviceAttributesList[a].order - deviceAttributesList[b].order)),
                currentAccessLevel = menuItemToProcess.accessLevel,
                isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
                deviceButtonsList = currentFunction.deviceButtons,
                currentDeviceButtons = deviceButtonsList ? Object.keys(deviceButtonsList).filter((deviceButton) => (deviceButtonsList[deviceButton].isEnabled)).sort((a, b) => (deviceButtonsList[a].order - deviceButtonsList[b].order)) : [];
            currentDeviceButtons.forEach((deviceButtonId) => {
                const
                    currentButton = deviceButtonsList[deviceButtonId],
                    isButtonAllowedToShow = MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.showAccessLevel) <= 0,
                    isButtonAllowedToPress = isCurrentAccessLevelAllowModify && (MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.pressAccessLevel) <= 0);
                if (isButtonAllowedToShow && (! isButtonAllowedToPress)) {
                    deviceAttributes.push(deviceButtonId);
                }
            });
            // currentFunction.deviceAttributes.split(':').forEach((deviceAttribute) => {
            deviceAttributes.forEach((deviceAttribute) => {
                let timeStamp;
                logs(`deviceAttribute = ${JSON.stringify(deviceAttribute)}`);
                switch (deviceAttribute) {
                    case 'ts': {
                        timeStamp = new Date(Number(primaryState.ts));
                        // break omitted
                    }
                    case 'lc': {
                        timeStamp = timeStamp ? timeStamp : new Date(Number(primaryState.lc));
                        deviceAttributesArray.push({
                            label: translationsGetObjectName(user, deviceAttribute, currentFunctionId, undefined, true),
                            // @ts-ignore
                            valueString: formatDate(timeStamp, configOptions.getOption(cfgDateTimeTemplate, user)),
                            lengthModifier: 0
                        });
                        break;
                    }
                    case 'ack': {
                        deviceAttributesArray.push({
                            label: translationsGetObjectName(user, deviceAttribute, currentFunctionId, undefined, true),
                            valueString: primaryState.ack ? configOptions.getOption(cfgDefaultIconOn, user) : configOptions.getOption(cfgDefaultIconOff, user),
                            lengthModifier: 1
                        });
                        break;
                    }
                    default: {
                        const deviceAttributeId = `${idPrefix}.${deviceAttribute}`;
                        logs(`deviceAttributeId = ${JSON.stringify(deviceAttributeId)}`);
                        if (existsObject(deviceAttributeId)) {
                            const currObject = deviceAttributeId === primaryStateId ? primaryObject : getObject(deviceAttributeId);
                            deviceAttributesArray.push({label: translationsGetObjectName(user, deviceAttributeId === primaryStateId ? translationsPrimaryStateId : currObject, currentFunctionId), ...enumerationsStateValueDetails(user, currObject, currentFunctionId, deviceAttributeId === primaryStateId ? primaryState : null)});
                        }
                        break;
                    }
                }
            });
            text = `<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, deviceAttributesArray)}</code>`;
        }
    }
    return text;
}


/**
 * This function gets a menu list based on the enumerationType and enumerationTypeExtraId parameters.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string} enumerationTypeExtraId - The secondary (subordinated) enumerationType.
 * @returns {object} The appropriate enumerations object.
 */
function enumerationsGetList(enumerationType, enumerationTypeExtraId) {
    // logs(`dataType = ${dataType}, dataTypeExtraId = ${dataTypeExtraId}`);
    return enumerationTypeExtraId ?
        (enumerationsSubTypes.includes(enumerationType) ?
            enumerationsList[dataTypeFunction].list[enumerationTypeExtraId][enumerationType] :
            ( enumerationType === dataTypePrimaryEnums ?
                enumerationsList[enumerationTypeExtraId].enums :
                {}
            )
        ):
        enumerationsList[enumerationType].list;
}

/**
 * This function go thru the all ioBroker states, which are linked with
 * appropriate `functionId` enum, and gathers all fills their unique id's
 * in appropriate list(`Object`) of `Attributes` or `Devices` for this `functionId`.
 * @param {string} functionId - The enum Id (enumerationItem.Id).
 * @param {string} typeOfDeviceStates - The one of the possible values:
 * - `dataTypeDeviceAttributes` - the states with RO access to the value,
 * - `dataTypeDeviceButtons` - the states with RW access to the value,
 * @param {boolean} isOnlyEnabled - The selector to filter only Enabled Attributes or Buttons.
 * @returns
 */
function enumerationsRefreshFunctionDeviceStates(functionId, typeOfDeviceStates, isOnlyEnabled) {
    if (enumerationsList[dataTypeFunction].list.hasOwnProperty(functionId) && enumerationsSubTypes.includes(typeOfDeviceStates)) {
        isOnlyEnabled = typeOf(isOnlyEnabled, 'boolean') ? isOnlyEnabled : false;
        const
            currentFunction = enumerationsList[dataTypeFunction].list[functionId],
            currentDeviceStatesList = typeOfDeviceStates === dataTypeDeviceAttributes ? currentFunction.deviceAttributes : currentFunction.deviceButtons,
            currentDeviceStatesListCount = Object.keys(currentDeviceStatesList).length,
            destinationsList = enumerationsList[dataTypeDestination].list,
            destinationsListKeys = Object.keys(destinationsList).filter((destId) => (destinationsList[destId].isEnabled && destinationsList[destId].isAvailable)).sort((a, b) => (destinationsList[a].order - destinationsList[b].order));
        if (typeOfDeviceStates === dataTypeDeviceAttributes) {
            enumerationsDeviceBasicAttributes.split(':').forEach((deviceAttr) => {
                deviceAttr = deviceAttr.indexOf('-') === 0 ? deviceAttr.slice(1) : deviceAttr;
                if (! Object.keys(currentDeviceStatesList).includes(deviceAttr)) {
                    currentDeviceStatesList[deviceAttr] = {
                        isEnabled : false,
                        nameTranslationId: translationsGetObjectId(deviceAttr.split('.').join('_'), functionId, undefined, enumerationsDeviceBasicAttributes.includes(deviceAttr)),
                        order : Object.keys(currentDeviceStatesList).length
                    };
                }
            });
        }
        $(`state[id=*${currentFunction.state}](${currentFunction.enum}=${functionId})`).each( (mainId) =>  {
            if (existsObject(mainId)) {
                const
                    mainObject = getObject(mainId, '*'),
                    idPrefix = mainId.split('.').slice(0, currentFunction.statesInFolders ? -2 : -1).join('.'),
                    fullFuncId = `enum.${currentFunction.enum}.${functionId}`;
                if (mainObject.hasOwnProperty('enumIds') ) {
                    for (const destId of destinationsListKeys) {
                        const fullDestId = `enum.${destinationsList[destId].enum}.${destId}`;
                        // logs(`idPrefix = ${idPrefix}, fullDestId = ${fullDestId}`, _l);
                        if (mainObject['enumIds'] && mainObject['enumIds'].includes(fullDestId)) {
                            $(`state[id=${idPrefix}.*](${currentFunction.enum}=${functionId})`).each((stateId) => {
                                if (existsObject(stateId)) {
                                    const currentObject = getObject(stateId, '*');
                                    if (currentObject['enumIds'] && currentObject['enumIds'].includes(fullFuncId) && currentObject['enumIds'].includes(fullDestId)) {
                                        if ((currentObject.common) && (((typeOfDeviceStates === dataTypeDeviceAttributes) && (! currentObject.common.write)) || ((typeOfDeviceStates === dataTypeDeviceButtons) && currentObject.common.write))) {
                                            const deviceAttr = stateId.replace(`${idPrefix}.`, '');
                                            logs(`deviceAttr = ${deviceAttr}`);
                                            if (! Object.keys(currentDeviceStatesList).includes(deviceAttr)) {
                                                currentDeviceStatesList[deviceAttr] = {
                                                    isEnabled : isOnlyEnabled,
                                                    nameTranslationId: translationsGetObjectId(deviceAttr.split('.').join('_'), functionId, undefined, enumerationsDeviceBasicAttributes.includes(deviceAttr)),
                                                    order : Object.keys(currentDeviceStatesList).length,
                                                };
                                                if (typeOfDeviceStates === dataTypeDeviceAttributes) {
                                                    currentDeviceStatesList[deviceAttr].convertValueCode = "";
                                                }
                                                else {
                                                    currentDeviceStatesList[deviceAttr].group = '';
                                                    currentDeviceStatesList[deviceAttr].showAccessLevel = rolesAccessLevelReadOnly;
                                                    currentDeviceStatesList[deviceAttr].pressAccessLevel = rolesAccessLevelSelective;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            break;
                        }
                    }
                }
            }
        });
        if (Object.keys(currentDeviceStatesList).length !== currentDeviceStatesListCount) {
            enumerationsSave(dataTypeFunction);
            return true;
        }
    }
    return false;
}

//*** Enumerations - end ***//


//*** Extensions - begin ***//

/**
 * This function is used to process a registration messages from AutoTelegramMenu Extensions.
 * @param {object} extensionDetails - The object, contained
 * - `id` - The Extension Id,
 * - `name` - The Extension name,
 * - `icon` - The Extension Icon,
 * - `externalMenu` - The Extension Root menu item Id,
 * - `scriptName` - The script name, which contains the Extension,
 * properties.
 * @param {function} callback - The callback function.
 */
function extensionsOnRegisterToAutoTelegramMenu(extensionDetails, callback) {
    const {id , nameTranslationId, icon, externalMenu, scriptName, translationsKeys} = extensionDetails;
    logs(`id= ${id}, full info = ${JSON.stringify(extensionDetails, null, 2)}`);
    logs(`scriptName= ${JSON.stringify(scriptName)}`);
    const extensionId = `${prefixExtensionId}${stringCapitalize(id)}`;
    const functionsList = enumerationsList[dataTypeFunction].list;
    if (functionsList.hasOwnProperty(extensionId) && (functionsList[extensionId] !== undefined)) {
        functionsList[extensionId].isAvailable = true;
        functionsList[extensionId].scriptName = scriptName;
        functionsList[extensionId].state = externalMenu;
        functionsList[extensionId].nameTranslationId = nameTranslationId;
        functionsList[extensionId].translationsKeys = translationsKeys;
    }
    else {
        functionsList[extensionId] = {...enumerationsList[dataTypeFunction].defaultObject,
            isAvailable: true,
            isExternal: true,
            enum: idExternal,
            nameTranslationId: nameTranslationId,
            order: Object.keys(functionsList).length,
            icon: icon,
            state: externalMenu,
            deviceAttributes: {},
            scriptName: scriptName,
            translationsKeys: translationsKeys
        };
    }
    enumerationsSave(dataTypeFunction);
    callback({success: true});
}

const
    extensionsInitCommand = autoTelegramMenuExtensionsInitCommand ? `${autoTelegramMenuExtensionsInitCommand}` : 'autoTelegramMenuExtensionsInit',
    extensionsRegisterCommand = autoTelegramMenuExtensionsRegisterCommand ? `${autoTelegramMenuExtensionsRegisterCommand}` : 'autoTelegramMenuExtensionsRegister',
    /** Make cached values manage be available for External Scripts */
    extensionsGetCachedStateCommand = autoTelegramMenuExtensionsGetCachedStateCommand ? `${autoTelegramMenuExtensionsGetCachedStateCommand}` : 'autoTelegramMenuExtensionsGetCachedState',
    extensionsSetCachedStateCommand = autoTelegramMenuExtensionsSetCachedStateCommand ? `${autoTelegramMenuExtensionsSetCachedStateCommand}` : 'autoTelegramMenuExtensionsSetCachedState',
    extensionsSendFileCommand = autoTelegramMenuExtensionsSendFile ? `${autoTelegramMenuExtensionsSendFile}` : 'autoTelegramMenuExtensionsSendFile',
    extensionsSendImageCommand = autoTelegramMenuExtensionsSendImage ? `${autoTelegramMenuExtensionsSendImage}` : 'autoTelegramMenuExtensionsSendImage',
    extensionSendAlertToTelegramCommand = autoTelegramMenuExtensionsSendAlertToTelegram ? `${autoTelegramMenuExtensionsSendAlertToTelegram}` : 'autoTelegramMenuExtensionsSendAlertToTelegram';

/**
 * This function send a message to all Extensions with request to the to send a registration Message.
 */
function extensionsInit() {
    const timeout = configOptions.getOption(cfgExternalMenuTimeout);
    messageTo(extensionsInitCommand, {messageId : extensionsRegisterCommand, timeout: timeout }, {timeout: timeout}, (result) => {
        logs(`${extensionsInitCommand} result = ${JSON.stringify(result)}`);
    });
}

//*** Extensions - end ***//

//*** Alerts - begin ***//

const
    alertsStateFullId = `${prefixPrimary}.${idAlerts}`,
    cachedAlertMessages = 'alertMessages',
    alertThresholdSet = 'alertThresholdSet',
    alertThresholdId = 'threshold',
    alertThresholdOnTimeIntervalId = 'onTimeInterval',
    alertMessageTemplateId = 'messageTemplate',
    alertsStoredVariables = new Map();

let alertsRules = {};

cachedValuesStatesCommonAttributes[cachedAlertMessages] = {name:"List of alert messages from alert subscriptions", type: 'json', read: true, write: true, role: 'text'};
cachedValuesStatesCommonAttributes[idAlerts] = {name:"List of states for alert subscription", type: 'json', read: true, write: true, role: 'text'};

/**
 * This function return current alerts list as an object
 * @returns {object} List of alerts
 */
function alertsGet() {
    if (! (typeOf(alertsRules, 'object') && (Object.keys(alertsRules).length > 0)) && (existsState(alertsStateFullId))) {
        const alertsState = getState(alertsStateFullId);
        if ((alertsState !== undefined) && typeOf(alertsState.val, 'string')) {
            try {
                alertsRules = JSON.parse(alertsState.val, mapReviver);
            }
            catch (err) {
                // cachedStates[id] = cachedVal;
                console.warn(`Alert parse error - ${JSON.stringify(err)}`);
                alertsRules = {};
            }
        }
    }
    return alertsRules;
}

/**
 * This function stores current alerts list in cache and in appropriate state.
 * @param {object} alerts  - List of alerts to store.
 */
function alertsStore(alerts) {
    if (typeOf(alerts, 'object') && (Object.keys(alerts).length > 0)) {
        alertsRules = objectDeepClone(alerts);
        const stringValue = JSON.stringify(alerts, mapReplacer);
        if (existsState(alertsStateFullId)) {
            setState(alertsStateFullId, stringValue, true);
        }
        else {
            logs(`id = ${alertsStateFullId}, value = ${stringValue},  attr = ${cachedValuesStatesCommonAttributes[idAlerts]}`);
            createState(alertsStateFullId, stringValue, cachedValuesStatesCommonAttributes[idAlerts]);
        }
    }
}

/**
 * This function is used to store the current `value` of monitored `state`.
 * @param {string} alertStateId - Id of the `state`, monitored for alerts.
 * @param {any=} currentValue  - Current state `value`. If not defined - will be read from `state`.
 */
function alertsStoreStateValue(alertStateId, currentValue){
    // logs(`alertStateId = ${alertStateId}, currentValue = ${currentValue}`, _l)
    if (currentValue === undefined) {
        if (existsState(alertStateId)) {
            currentValue = getState(alertStateId).val;
        }
    }
    const alerts = alertsGet();
    if ((currentValue !== undefined) && alerts.hasOwnProperty(alertStateId)) {
        alerts[alertStateId].value = currentValue;
        alertsStore(alerts);
    }
}

/**
 * This function manage alerts, i.e. store a new one, add a `recipient`(`chatId`)
 * for existing one, stores the changes in the thresholds for exiting one for
 * existing `recipient`, or deletes a `recipients` or `alerts` itself.
 * The behavior is depend on the an exists or not the appropriate `alerts` or
 * `recipients`.  If it exists and the `Thresholds` are undefined or not changed -
 * the appropriate recipient will be deleted from `alert` definition.
 * If `alert` definition has no `recipients` - it will be deleted too.
 * @param {object} user - The user object.
 * @param {string} alertId - The ioBroker state full Id.
 * @param {string=} alertFunc - The id of function enum, linked with a state.
 * @param {string=} alertDest - The id of destination enum, linked with a state.
 * @param {object=} alertDetailsOrThresholds - The object, contained the Thresholds definitions.
 */
function alertsManage(user, alertId, alertFunc, alertDest, alertDetailsOrThresholds) {
    let alerts = alertsGet();
    if (alerts === undefined) alerts = {};
    if (alertDetailsOrThresholds === undefined) alertDetailsOrThresholds = {};
    if (alerts.hasOwnProperty(alertId)) {
        if (alerts[alertId].chatIds.has(user.chatId) && (JSON.stringify(alerts[alertId].chatIds.get(user.chatId))) === JSON.stringify(alertDetailsOrThresholds)) {
            if (alerts[alertId].chatIds.size === 1) {
                delete alerts[alertId];
                unsubscribe(alertId);
            }
            else {
                alerts[alertId].chatIds.delete(user.chatId);
            }
        }
        else if (alertFunc) {
            alerts[alertId].chatIds.set(user.chatId, alertDetailsOrThresholds);
        }
    }
    else if (alertFunc && alertDest) {
        const chatsMap = new Map();
        chatsMap.set(user.chatId, alertDetailsOrThresholds);
        alerts[alertId] = {function: alertFunc, destination: alertDest, chatIds: chatsMap};
        on({id: alertId, change: 'ne'}, alertsOnSubscribedState);
    }
    logs(`alerts = ${JSON.stringify(alerts)}`);
    cachedDelValue(user, alertThresholdSet);
    alertsStore(alerts);
}

/**
 * This function returns an icon, which show  if the any alerts is enabled for an
 * appropriate `state` and `recipient`.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the icon wil be identified.
 * @returns {string} The one of icon : `iconItemAlertOff` or `iconItemAlertOn`.
 */
function alertsGetIcon(user, menuItemToProcess) {
    const alerts = alertsGet();
    if (alerts && alerts.hasOwnProperty(menuItemToProcess.state) && alerts[menuItemToProcess.state].chatIds.has(user.chatId)) return iconItemAlertOn;
    return iconItemAlertOff;
}

/**
 * This function is used to load stored alerts and subscribe on appropriate states changes.
 * @param {boolean=} checkStates - The selector, to define, will the previous values be checked.
 */
function alertsInit(checkStates) {
    const alerts = alertsGet();
    // console.log(`alerts = ${JSON.stringify(alerts)}`);
    const
        statesToSubscribe = Object.keys(alerts),
        currentSubscriptions = getSubscriptions(),
        currentlySubscribedStates = Object.keys(currentSubscriptions)
            .filter(stateId => (currentSubscriptions[stateId].filter(handler => (handler.name === scriptName)).length))
            .filter(stateId => (! stateId.includes(telegramAdapter)))
            .filter(stateId => (! stateId.includes(prefixPrimary)));
    // logs(`currentlySubscribedStates, length = ${currentlySubscribedStates.length}, list = ${JSON.stringify(currentlySubscribedStates)}`, _l);
    statesToSubscribe.forEach(stateId => {
        if (! currentlySubscribedStates.includes(stateId)) {
            // logs(`subscribe on ${stateId}`, _l);
            if (existsState(stateId)) on({id: stateId, change: 'ne'}, alertsOnSubscribedState);
        }
    });
    currentlySubscribedStates.forEach(stateId => {
        if (! statesToSubscribe.includes(stateId)) {
            // logs(`unsubscribe on ${stateId}`, _l);
            unsubscribe(stateId);
        }
    });
    onMessageUnregister(extensionSendAlertToTelegramCommand);
    // @ts-ignore
    onMessage(extensionSendAlertToTelegramCommand, alertsOnAlertToTelegram);
    if (checkStates && configOptions.getOption(cfgCheckAlertStatesOnStartUp)) {
        statesToSubscribe.forEach(stateId => {
            if (alerts[stateId].hasOwnProperty('value') && existsState(stateId)) {
                const
                    currentValue = getState(stateId).val,
                    oldValue = alerts[stateId].value;
                if ((currentValue !== undefined) && (currentValue !== oldValue)) {
                    alertsOnSubscribedState({id: stateId, state: {val: currentValue}, oldState : {val: oldValue}});
                }
            }
        });
    }
}

/**
 * This function push an alert message to the arrays of alert messages for
 * appropriate recipient, and initiate the showing it in a Telegram.
 * @param {object} user - The user object.
 * @param {string} alertId - The alert Id, i.e. appropriate ioBroker state Id.
 * @param {string} alertMessage - The alert message text.
 * @param {boolean=} isAcknowledged - The alert message acknowledge status.
 */
function alertsMessagePush(user, alertId, alertMessage, isAcknowledged) {
    logs(`user = ${JSON.stringify(user)}`);
    logs(`id = ${JSON.stringify(alertId)}`);
    logs(`alertMessage = ${JSON.stringify(alertMessage)}`);
    const alertMessages = alertsHistoryClearOld(user);
    alertMessages.push( {
        ack: isAcknowledged ? true : false,
        id: alertId,
        message: alertMessage,
        // @ts-ignore
        date: (new Date()).valueOf()
    });
    alertsStoreMessagesToCache(user, alertMessages);
    const
        itemPos = cachedGetValue(user, cachedMenuItem),
        isMenuOn = cachedGetValue(user, cachedMenuOn),
        [_lastUserMessageId, isUserMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, '95:59:00');
    if (isMenuOn && itemPos && (! isUserMessageOldOrNotExists) && (! isAcknowledged)) menuProcessMenuItem(user, undefined, undefined, true);
}

/**
 * This function returns an Array of all cached messages for the current user of chat group.
 * @param {object} user - The user object.
 * @param {boolean=} nonAcknowledged - The selector to filter only unacknowledged messages.
 * @returns {object[]} The array of alert messages.
 */
function alertGetMessages(user, nonAcknowledged) {
    const alertMessages = cachedExistsValue(user, cachedAlertMessages) ?  cachedGetValue(user, cachedAlertMessages) : [];
    /**  temporary code **/
    alertMessages.forEach(alertMessage => {
        if ((! alertMessage.hasOwnProperty('ack')) && typeOf(alertMessage.date, 'string')) {
            alertMessage.ack = false;
            const
                [alertDate, alertTime] = alertMessage.date.split(' '),
                alertYear = 2022,
                [alertDay, alertMonth] = alertDate.split('.'),
                [alertHour, alertMinutes, alertSeconds] = alertTime.split(':'),
                alertD = new Date(alertYear, +alertMonth - 1, +alertDay, +alertHour, +alertMinutes, alertSeconds === undefined ? 0 : +alertSeconds);
            alertMessage.date = alertD.valueOf();
        }
    });
    /**  temporary code **/
    return nonAcknowledged ? alertMessages.filter(alertMessage => (! alertMessage.ack)) : alertMessages;
}

/**
 * This function stores the alert messages for the user or group chat to the cache.
 * @param {object} user - The user object.
 * @param {object[]} alertMessages - The array of alert messages.
 */
function alertsStoreMessagesToCache(user, alertMessages) {
    if (! typeOf(alertMessages, 'array')) {
        alertMessages = [];
    }
    cachedSetValue(user, cachedAlertMessages, alertMessages);
}

/**
 *
 * @param {object} user - The user object.
 * @param {string} template - The message template.
 * @param {object} variables - The object contained default variables.
 * @returns {string} The result of interpretation of the template.
 */
function alertsProcessMessageTemplate(user, template, variables) {
// alertMessageTemplateDefaultPrefix= '${alertFunctionName} "${alertDeviceName} ${translations(In).toLowerCase} ${alertDestinationName}"',
// alertMessageTemplateDefault = alertMessageTemplateDefaultPrefix + " ${alertStatus}",
// alertMessageTemplateDefaultThreshold = alertMessageTemplateDefaultPrefix + " ${alertStatus} [${alertThresholdIcon}${alertThresholdValue}]",
    return template.replace(/\${(.+?)}/g, (_matchedString, stringToProcess) => {
        let
            result = '',
            postProcess = '';
        if (stringToProcess.includes('.')) [stringToProcess, postProcess] = stringToProcess.split('.');
        const translations = stringToProcess.match(/^translations\((\S+?)\)$/);
        if (translations && typeOf(translations, 'array') && (translations.length === 2)) {
            result = translationsItemTextGet(user, translations[1]);
        }
        else if (variables.hasOwnProperty(stringToProcess)) {
            result = `${variables[stringToProcess]}`;
        }
        else if (stringToProcess.includes('?') && stringToProcess.includes(':')) {
            const ifClause = stringToProcess.match(/^(\w+?)\?(.*?)\:(.*?)$/);
            if (ifClause && typeOf(ifClause, 'array') && (ifClause.length === 4) && variables.hasOwnProperty(ifClause[1])) {
                const conditionParam = variables[ifClause[1]];
                result = ifClause[conditionParam ? 2 : 3].replace(/\$value/g, conditionParam);
            }
        }
        if (result) {
           switch (postProcess) {
                case 'toLowerCase': {
                    result = result.toLowerCase();
                    break;
                }
                case 'toUpperCase': {
                    result = result.toUpperCase();
                    break;
                }
            }
        }
        return result;
    });
}

/**
 * This function is called when state of any subscribed for alert objects is changed.
 * @param {object} object - This object contained all information about changed state.
 */
function alertsOnSubscribedState(object) {
    const
        alerts = alertsGet(),
        activeChatGroups = telegramGetGroupChats(true),
        objectId = object.id;
    if ((alerts !== undefined) && alerts.hasOwnProperty(objectId)) {
        // logs(`alerts[${obj.id}] = ${JSON.stringify(alerts[obj.id])}`);
        let alertIsRaised = false;
        const
            currentStateValue = object.state.val,
            oldStateValue = object.oldState.val;
        alerts[objectId].chatIds.forEach((detailsOrThresholds, chatId) => {
            chatId = Number(chatId);
            const user = chatId > 0 ? telegramUsersGenerateUserObjectFromId(chatId) : telegramUsersGenerateUserObjectFromId(undefined, chatId);
            if ((chatId > 0) || (activeChatGroups.includes(chatId))) {
                let currentState = cachedGetValue(user, cachedCurrentState);
                logs(`make an menu alert for = ${JSON.stringify(user)} on state ${JSON.stringify(objectId)}`);
                const
                    alertMessages = new Array(),
                    alertObject = getObject(objectId, true),
                    alertDestinationId = alerts[objectId].destination,
                    alertDestinationName = translationsGetEnumName(user, dataTypeDestination, alertDestinationId, enumerationsNamesInside),
                    alertFunctionId = alerts[objectId].function,
                    functionsList = enumerationsList[dataTypeFunction].list,
                    alertFunction = functionsList && functionsList.hasOwnProperty(alertFunctionId) ? functionsList[alertFunctionId] : undefined,
                    isStatesInFolders = alertFunction && alertFunction.statesInFolders,
                    isAlertStatePrimary = alertFunction && (objectId.split('.').slice(isStatesInFolders ? -2 : -1).join('.') === alertFunction.state),
                    alertFunctionName = translationsGetEnumName(user, dataTypeFunction, alertFunctionId, enumerationsNamesMain),
                    alertStateValue = alertFunctionId ? enumerationsStateValueDetails(user, objectId, alertFunctionId, object.state)['valueString'] : object.state.val,
                    _alertStateOldValue = alertFunctionId ? enumerationsStateValueDetails(user, objectId, alertFunctionId, object.oldState)['valueString'] : object.oldState.val,
                    alertDeviceName = translationsGetObjectName(user, objectId.split('.').slice(0, isStatesInFolders ? -2 : -1).join('.'), alertFunctionId, alertDestinationId),
                    alertStateName = isAlertStatePrimary ? '' : translationsGetObjectName(user, alertObject, alertFunctionId),
                    alertStateType = alertObject.common['type'],
                    alertMessageValues = {alertFunctionName, alertDeviceName, alertDestinationName, alertStateName, alertStateValue};
                logs(`alertDestId = ${alertDestinationId}, alertDestName = ${JSON.stringify(alertDestinationName)}`);
                if ((alertStateType === 'boolean')
                    ||
                    (alertObject.common.hasOwnProperty('states') && (['string','number'].includes(alertStateType)))
                    ) {
                    const
                        alertMessageTemplate = detailsOrThresholds.hasOwnProperty(alertMessageTemplateId) ? detailsOrThresholds[alertMessageTemplateId] : configOptions.getOption(cfgAlertMessageTemplateMain, user),
                        onTimeInterval = detailsOrThresholds.hasOwnProperty(alertThresholdOnTimeIntervalId) ? detailsOrThresholds[alertThresholdOnTimeIntervalId] : 0,
                        idStoredTimerOn = [objectId, chatId, 'timerOn'].join(itemsDelimiter),
                        idStoredTimerValue = [objectId, chatId, 'timerValue'].join(itemsDelimiter),
                        storedTimerOn = alertsStoredVariables.has(idStoredTimerOn) ? alertsStoredVariables.get(idStoredTimerOn) : undefined,
                        [storedTimerValue, storedTimerOldValue] = (storedTimerOn && alertsStoredVariables.has(idStoredTimerValue)) ? alertsStoredVariables.get(idStoredTimerValue) : [undefined, undefined],
                        alertMessageText = alertsProcessMessageTemplate(user, alertMessageTemplate, alertMessageValues);
                    if (onTimeInterval) {
                        if (storedTimerOn) {
                            if (currentStateValue !== storedTimerValue) {
                                clearTimeout(storedTimerOn);
                                alertsStoredVariables.delete(idStoredTimerOn);
                                alertsStoredVariables.delete(idStoredTimerValue);
                            }
                        }
                        if ((storedTimerOn === undefined) || (currentStateValue !== storedTimerOldValue)) {
                            alertsStoredVariables.set(idStoredTimerValue, [currentStateValue, oldStateValue]);
                            alertsStoredVariables.set(idStoredTimerOn, setTimeout(() => {
                                alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
                                alertsStoredVariables.delete(idStoredTimerOn);
                                alertsStoredVariables.delete(idStoredTimerValue);
                            }, onTimeInterval * 1000));
                        }
                    }
                    else {
                        alertMessages.push(alertMessageText);
                    }
                }
                else if ((alertStateType === 'number') && (Object.keys(detailsOrThresholds).length)) {
                    const alertDefaultTemplate = configOptions.getOption(cfgAlertMessageTemplateThreshold, user);
                    Object.keys(detailsOrThresholds)
                        .sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB)))
                        .forEach(alertThresholdValue => {
                            const
                                currentThreshold = detailsOrThresholds[alertThresholdValue],
                                onAbove = currentThreshold.onAbove,
                                onLess = currentThreshold.onLess,
                                thresholdValue = Number(alertThresholdValue),
                                onTimeInterval = currentThreshold.hasOwnProperty(alertThresholdOnTimeIntervalId) ? currentThreshold[alertThresholdOnTimeIntervalId] : 0,
                                idStoredTimerOn = [objectId, chatId, alertThresholdValue, 'timerOn'].join(itemsDelimiter),
                                idStoredTimerStatus = [objectId, chatId, alertThresholdValue, 'timerStatus'].join(itemsDelimiter),
                                storedTimerOn = alertsStoredVariables.has(idStoredTimerOn) ? alertsStoredVariables.get(idStoredTimerOn) : undefined,
                                storedTimerStatus = (storedTimerOn && alertsStoredVariables.has(idStoredTimerStatus)) ? alertsStoredVariables.get(idStoredTimerStatus) : 0,
                                isLess = (currentStateValue < thresholdValue) && ((oldStateValue >= thresholdValue)  || (storedTimerOn && (storedTimerStatus < 0))),
                                isAbove = (currentStateValue >= thresholdValue) && ((oldStateValue < thresholdValue) || (storedTimerOn && (storedTimerStatus < 0))),
                                alertMessageTemplate = currentThreshold.hasOwnProperty(alertMessageTemplateId) ? currentThreshold[alertMessageTemplateId] : alertDefaultTemplate;
                            alertMessageValues['alertThresholdIcon'] = isLess ? iconItemLess : iconItemAbove;
                            alertMessageValues['alertThresholdValue'] = alertThresholdValue;
                            const alertMessageText = alertsProcessMessageTemplate(user, alertMessageTemplate, alertMessageValues);
                            if (onTimeInterval) {
                                if (storedTimerOn) {
                                    const currentTimerStatus = storedTimerStatus + (storedTimerStatus > 0 ? (isLess ? -1 :  0) : (isAbove ? 1 : 0));
                                    if (currentTimerStatus === 0) {
                                        clearTimeout(storedTimerOn);
                                        alertsStoredVariables.delete(idStoredTimerOn);
                                        alertsStoredVariables.delete(idStoredTimerStatus);
                                    }
                                }
                                else {
                                    const currentTimerStatus =  isLess && onLess ? -1 : (isAbove && onAbove ? 1 : 0);
                                    if (currentTimerStatus !== 0) {
                                        alertsStoredVariables.set(idStoredTimerStatus, isLess ? -1 :  1);
                                        alertsStoredVariables.set(idStoredTimerOn, setTimeout(() => {
                                            alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
                                            alertsStoredVariables.delete(idStoredTimerOn);
                                            alertsStoredVariables.delete(idStoredTimerStatus);
                                        }, onTimeInterval * 1000));
                                    }
                                }
                            }
                            else {
                                alertMessages.push(alertMessageText);
                            }
                        });
                }
                alertMessages.forEach(alertMessageText => alertsMessagePush(user, objectId, alertMessageText, objectId === currentState));
                if ((alertMessages.length > 0) && (! alertIsRaised)) {
                    alertIsRaised = true;
                }
            }
            else {
                logs(`Current chatId = ${chatId} is belong to non active chat`);
            }
        });
        if (alertIsRaised && configOptions.getOption(cfgCheckAlertStatesOnStartUp)) {
            alertsStoreStateValue(object.id, object.state.val);
        }
    }
}

/**
 * This function called when the message with id `alertToTelegram` from `extensions` is come.
 * @param {object} data - Contains target user, extension Id and message text.
 * @param {function} callback - Standard callback to call on success.
 */
function alertsOnAlertToTelegram(data, callback) {
    const
        {user, id, alertMessage} = data,
        userObject = typeOf(user, 'object') && (user.hasOwnProperty('userId') || user.hasOwnProperty('chatId')) ? user : (Number(user) > 0 ? telegramUsersGenerateUserObjectFromId(Number(user)) : telegramUsersGenerateUserObjectFromId(undefined, Number(user)));
    alertsMessagePush(userObject, id, alertMessage);
    callback({success: true});
}

/**
 * This function generates a submenu with all alerts in the history of current user.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function alertsHistoryMenuGenerate(user, menuItemToProcess) {
    const
        alertMessages = alertGetMessages(user),
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
    let
        subMenu = [],
        subMenuIndex = 0;
    for (let alertIndex = alertMessages.length - 1; alertIndex >= 0; alertIndex--) {
        const
            alertMessage = alertMessages[alertIndex],
            // @ts-ignore
            alertDate = formatDate(new Date(alertMessage.date), configOptions.getOption(cfgDateTimeTemplate, user));
        subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${alertDate}: ${alertMessage.message}`,
            icon: alertMessage.ack ? iconItemAlertOff : iconItemAlertOn,
            param: alertIndex,
            submenu: (user, menuItemToProcess) => {
                const
                    alertMessages = alertGetMessages(user),
                    currentMessageIndex = menuItemToProcess.param !== undefined ? Number(menuItemToProcess.param) : -1;
                if ((currentMessageIndex >= 0) && (currentMessageIndex < alertMessages.length)) {
                    if (! alertMessages[currentMessageIndex].ack) {
                        alertMessages[currentMessageIndex].ack = true;
                        alertsStoreMessagesToCache(user, alertMessages);
                        menuClearCachedMenuItemsAndRows(user);
                    }
                }
                const [subSubMenu, _subSubMenuIndex] = menuNavigationLeftRightMenuPartGenerate(user, [], `${currentIndex}.${subMenuIndex}`, subMenuIndex, currentMessageIndex, alertMessages.length - 1, undefined, true);
                return subSubMenu;
            },
        });
    }
    return subMenu;
}

/**
 * This function is used to clear an old `alert messages` for the current `user`.
 * If `alertsMessages` is not defined - will read it from  `cache` for current
 * user and store the result to `cache` back.
 * @param {object} user - The user object.
 * @param {object[]=} alertsMessages - Array of alert message objects.
 * @returns object[] Array of alert message objects.
 */
function alertsHistoryClearOld(user, alertsMessages) {
    const
        oldestDate = new Date(),
        noInput = alertsMessages === undefined;
    alertsMessages = noInput ? alertGetMessages(user) : alertsMessages;
    oldestDate.setHours(oldestDate.getHours() - configOptions.getOption(cfgAlertMessagesHistoryDepth, user));
    const oldestDateNumber = oldestDate.valueOf();
    alertsMessages =  alertsMessages !== undefined ? alertsMessages.filter(alertsMessage => (alertsMessage.date > oldestDateNumber)) : [];
    if (noInput) alertsStoreMessagesToCache(user, alertsMessages);
    return alertsMessages;
}

/**
 * This function generates a submenu with all alerts, on which the current recipient is subscribed.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateSubscribed(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    const
        alertsList = alertsGet(),
        destList = enumerationsList[dataTypeDestination].list,
        funcsList = enumerationsList[dataTypeFunction].list,
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
        currentFuncId = menuItemToProcess.funcEnum,
        currentDestId = menuItemToProcess.destEnum,
        currentAccessLevel = menuItemToProcess.accessLevel,
        isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
        currentObjectIndex = menuItemToProcess.param;
    let
        alertsBy = {},
        subMenu = [];
    logs(`currentFuncId = ${currentFuncId}, currentDestId = ${currentDestId}`);
    if (alertsList && Object.keys(alertsList).length) {
        Object.keys(alertsList).forEach((alertId, alertIndex) => {
            if (alertsList[alertId].chatIds.has(user.chatId) && existsObject(alertId)) {
                const
                    alertObject = getObject(alertId),
                    alertFuncId = alertsList[alertId].function,
                    alertDestId = alertsList[alertId].destination,
                    alertFirstLevelId = isFunctionsFirst ?  alertFuncId : alertDestId,
                    alertSecondLevelId = isFunctionsFirst ? alertDestId : alertFuncId;
                if (alertObject && (
                    (isFunctionsFirst && (! currentFuncId) || (alertFirstLevelId === currentFuncId))
                    ||
                    ((! isFunctionsFirst) && (! currentDestId) || (alertFirstLevelId === currentDestId))
                    )) {
                    if (! alertsBy.hasOwnProperty(alertFirstLevelId)) alertsBy[alertFirstLevelId] = {};
                    if (
                        (isFunctionsFirst && (! currentDestId) || (alertSecondLevelId === currentDestId)) ||
                        ((! isFunctionsFirst) && (! currentFuncId) || (alertSecondLevelId === currentFuncId))
                        ) {
                        if (! alertsBy[alertFirstLevelId].hasOwnProperty(alertSecondLevelId)) alertsBy[alertFirstLevelId][alertSecondLevelId] = {};
                        const
                            alertIdShort = alertId.split('.').pop(),
                            alertTopId = alertId.split('.').slice(0, -1).join('.');
                        if (! alertsBy[alertFirstLevelId][alertSecondLevelId].hasOwnProperty('alertTopId')) {
                            logs(`alertTopId = ${JSON.stringify(alertTopId)}, alertFunc = ${alertFirstLevelId}`);
                            alertsBy[alertFirstLevelId][alertSecondLevelId][alertTopId] = {
                                name: translationsGetObjectName(user, alertTopId, alertFuncId, alertDestId),
                                index: alertIndex
                            };

                        }
                        logs(`funcsList[${alertFirstLevelId}] = ${JSON.stringify(funcsList[alertFuncId], null, 2)}`);
                        alertsBy[alertFirstLevelId][alertSecondLevelId][alertTopId][alertId] =
                            translationsGetObjectName(user, alertIdShort === funcsList[alertFuncId].state ? translationsPrimaryStateId : alertObject, alertFuncId);
                        logs(`alertsByFunctions[${alertFirstLevelId}][${alertSecondLevelId}][${alertTopId}] = ${JSON.stringify(alertsBy[alertFirstLevelId][alertSecondLevelId][alertTopId], null, 2)}`);
                    }
                }
            }
        });
        logs(`alertsBy = ${JSON.stringify(alertsBy, null, 2)}`);
        if (alertsBy && Object.keys(alertsBy).length) {
            let levelMenuIndex = 0;
            const
                levelList = isFunctionsFirst ?  funcsList : destList,
                inputLevel = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
                levelEnum = isFunctionsFirst ? 'funcEnum' : 'destEnum';
            if ((! currentFuncId) && (! currentDestId) && (currentObjectIndex === undefined)) {
                Object.keys(levelList)
                .filter((levelId) => (levelList[levelId].isEnabled && levelList[levelId].isAvailable))
                .sort((a, b) => (levelList[a].order - levelList[b].order))
                .forEach((alertLevel) => {
                        if (alertsBy.hasOwnProperty(alertLevel)) {
                            levelMenuIndex = subMenu.push({
                                index: `${currentIndex}.${levelMenuIndex}`,
                                name: `${translationsGetEnumName(user, inputLevel, alertLevel)}`,
                                icon: levelList[alertLevel].icon,
                                [levelEnum]: alertLevel,
                                accessLevel: currentAccessLevel,
                                submenu: alertsMenuGenerateSubscribed
                            });
                        }
                    });
            }
            else if (
                (
                    (isFunctionsFirst && (! currentDestId))
                    ||
                    ((! isFunctionsFirst) && (! currentFuncId) )
                )
                && (currentObjectIndex === undefined)) {
                const
                    levelList = isFunctionsFirst ? destList : funcsList,
                    currentInputType = isFunctionsFirst ? dataTypeDestination : dataTypeFunction,
                    currentId = isFunctionsFirst ? currentFuncId : currentDestId,
                    alertsDestList = alertsBy[currentId];
                let levelMenuIndex = 0;
                Object.keys(levelList)
                    .filter((levelId) => (levelList[levelId].isEnabled && levelList[levelId].isAvailable))
                    .sort((a, b) => (levelList[a].order - levelList[b].order))
                    .forEach((alertLevel) => {
                        if (alertsDestList.hasOwnProperty(alertLevel)) {
                            levelMenuIndex = subMenu.push({
                                index: `${currentIndex}.${levelMenuIndex}`,
                                name: `${translationsGetEnumName(user, currentInputType, alertLevel)}`,
                                icon: isFunctionsFirst ? menuItemToProcess.icon : levelList[alertLevel].icon,
                                funcEnum: isFunctionsFirst ? currentFuncId : alertLevel,
                                destEnum: isFunctionsFirst ? alertLevel : currentDestId,
                                accessLevel: currentAccessLevel,
                                submenu: alertsMenuGenerateSubscribed
                            });
                        }
                    });
            }
            else if  (currentObjectIndex === undefined) {
                let objectMenuIndex = 0;
                const objectsIdList = isFunctionsFirst ? alertsBy[currentFuncId][currentDestId] : alertsBy[currentDestId][currentFuncId] ;
                Object.keys(objectsIdList).sort().forEach(objectId => {
                    objectMenuIndex = subMenu.push({
                        index: `${currentIndex}.${objectMenuIndex}`,
                        name: `${objectsIdList[objectId]['name']}`,
                        icon: menuItemToProcess.icon,
                        funcEnum: currentFuncId,
                        destEnum: currentDestId,
                        accessLevel: currentAccessLevel,
                        param: objectsIdList[objectId]['index'],
                        submenu: alertsMenuGenerateSubscribed
                    });
                });
            }
            else {
                let alertMenuIndex = 0;
                logs(`alertsList = ${JSON.stringify(alertsList)}, Object.keys(alertsList)[${currentObjectIndex}] = ${JSON.stringify(Object.keys(alertsList)[currentObjectIndex])}`);
                const
                    currentObject = Object.keys(alertsList)[currentObjectIndex].split('.').slice(0, -1).join('.'),
                    alertsIdList = isFunctionsFirst ? alertsBy[currentFuncId][currentDestId][currentObject] : alertsBy[currentDestId][currentFuncId][currentObject];
                logs(`alertsIdList = ${JSON.stringify(alertsIdList)}, currentObject = ${currentObject}`);
                Object.keys(alertsIdList).filter(key => ! ['name', 'index'].includes(key)).sort().forEach(alertId => {
                    alertMenuIndex = subMenu.push({
                        index: `${currentIndex}.${alertMenuIndex}`,
                        name: `${alertsIdList[alertId]}`,
                        icon: menuItemToProcess.icon,
                        param: isCurrentAccessLevelAllowModify ? '' : cmdNoOperation,
                        submenu: isCurrentAccessLevelAllowModify ? [menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${alertMenuIndex}`, 0, dataTypeAlertSubscribed, alertId)] : []
                    });
                });
            }
        }
    }
    logs(`newMenu = ${JSON.stringify(subMenu, null, 2)}`);
    return subMenu;
}


/**
 * This function returns an alert details or thresholds for the current
 * alertId and recipient. If some temporary thresholds is cached - it will
 * return an joint details or thresholds object.
 * If the selector `returnBoth` is true, the original and joint thresholds
 * will be returned as an array.
 * @param {object} user - The user object.
 * @param {string} alertId - The alert Id, i.e. an appropriate ioBroker state
 * full Id.
 * @param {boolean=} returnBoth - The selector to define the result format.
 * @returns {object|object[]} The thresholds of thresholds array.
 */
function alertsGetStateAlertDetailsOrThresholds(user, alertId, returnBoth) {
    const
        alerts = alertsGet(),
        currentStateAlert = alerts.hasOwnProperty(alertId) ? alerts[alertId] : undefined,
        currentStateAlertThresholds = currentStateAlert && currentStateAlert.hasOwnProperty('chatIds') && currentStateAlert.chatIds  && currentStateAlert.chatIds.has(user.chatId) ? objectDeepClone(currentStateAlert.chatIds.get(user.chatId)) : {},
        /* cachedThresholds = existsCachedValue(user, alertThresholdSet) ? getCachedValue(user, alertThresholdSet) : {},
        currentThresholds = {...currentStateAlertThresholds, ...cachedThresholds}; */
        currentThresholds = cachedExistsValue(user, alertThresholdSet) ? cachedGetValue(user, alertThresholdSet) : currentStateAlertThresholds;
    return returnBoth ? [currentThresholds, currentStateAlertThresholds] : currentThresholds;
}

/**
 * This function generate a menu item with related submenu to conduct an alert
 * subscription management for the appropriate ioBroker state (`itemState`).
 * @param {string} itemIndex - The positional index for new menu item.
 * @param {string} itemName - The name of the new menu item.
 * @param {string} itemState - The related ioBroker state.
 * @param {object} itemStateObject - The related ioBroker state object (can be `undefined`).
 * @param {string} itemParam - The additional command params.
 * @param {boolean=} isExtraMenu - The selector to show more detailed params.
 * @returns {object} Menu item object.
 */
function alertsSubscribedOnMenuItemGenerate(itemIndex, itemName, itemState, itemStateObject, itemParam, isExtraMenu) {
    let menuItem;
    if ((itemStateObject === undefined) || (itemStateObject === null)) itemStateObject = getObject(itemState);
    if (itemStateObject && itemStateObject.hasOwnProperty('common') && itemStateObject.common) {
        const itemStateType = itemStateObject.common['type'];
        menuItem = {
            index: itemIndex,
            name: itemName,
            state: itemState,
            icons: alertsGetIcon,
            group: 'alerts',
            param: itemParam
        };
        let isNumericString = false;
        if (configOptions.getOption(cfgThresholdsForNumericString)) {
            if ((itemStateType === 'string') && ! itemStateObject.common.hasOwnProperty('states')) {
                const
                    currentState = getState(itemState),
                    currentStateValue = currentState !== undefined ? currentState.val : undefined,
                    currentStateNumeric = currentState !== undefined ? Number(currentStateValue) : NaN;
                isNumericString = ! isNaN(currentStateNumeric) && `${currentStateNumeric}` === currentStateValue.slice(0, `${currentStateNumeric}`.length);
            }
        }
        if (
            (itemStateType === 'boolean')
            ||
            (itemStateObject.common.hasOwnProperty('states') && (['string','number'].includes(itemStateType) ))
        ) {
            if (isExtraMenu) {
                menuItem.param = commandsPackParams(cmdEmptyCommand, ...commandUnpackParams(itemParam).slice(1));
                menuItem['submenu'] = (user, menuItemToProcess) => {
                    const
                        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                        currentName = menuItemToProcess.name,
                        [_cmdId, currentStateId, currentFunctionId, currentDestinationId] = commandUnpackParams(menuItemToProcess.param),
                        [currentAlertDetails, currentStateAlertDetails] = alertsGetStateAlertDetailsOrThresholds(user, currentStateId, true),
                        currentOnTimeInterval = `${currentAlertDetails.hasOwnProperty(alertThresholdOnTimeIntervalId) ? currentAlertDetails[alertThresholdOnTimeIntervalId] : 0} ${translationsItemTextGet(user, 'secondsShort')}`,
                        currentMessageTemplate = currentAlertDetails.hasOwnProperty(alertMessageTemplateId) ? currentAlertDetails[alertMessageTemplateId] : configOptions.getOption(cfgAlertMessageTemplateMain, user);
                    let
                        subMenu = [],
                        subMenuIndex = 0;
                    subMenuIndex = subMenu.push(menuEditItemMenuItemGenerate(user, currentIndex, subMenuIndex, `${translationsItemTextGet(user, alertThresholdOnTimeIntervalId)} {${currentOnTimeInterval}}`, '', dataTypeAlertSubscribed, currentStateId, -1, alertThresholdOnTimeIntervalId, currentOnTimeInterval));
                    subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemTextGet(user, alertMessageTemplateId)}${currentAlertDetails.hasOwnProperty(alertMessageTemplateId) ? '' : `(${translationsItemTextGet(user, 'global')}})`}`,
                        icon: iconItemEdit,
                        group: alertMessageTemplateId,
                        param: commandsPackParams(cmdEmptyCommand, dataTypeAlertSubscribed, currentStateId, -1, alertMessageTemplateId, currentMessageTemplate),
                        submenu: [
                            menuEditItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, 0, `${translationsItemTextGet(user, alertMessageTemplateId)}`, 'edit', dataTypeAlertSubscribed, currentStateId, -1, alertMessageTemplateId, currentMessageTemplate),
                            menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, 1, dataTypeAlertSubscribed, currentStateId, -1, alertMessageTemplateId)
                        ],
                    });
                    const isAlertDetailsSetChanged = JSON.stringify(currentStateAlertDetails) !== JSON.stringify(currentAlertDetails);
                    subMenu.push(
                        {
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${currentName}${isAlertDetailsSetChanged ?  ` (${iconItemEdit})` : ''}`,
                            icons: alertsGetIcon,
                            group: cmdItemsProcess,
                            state: currentStateId,
                            param: commandsPackParams(cmdAlertSubscribe, currentStateId, currentFunctionId, currentDestinationId),
                            submenu: [],
                        }
                    );
                    return subMenu;
                };
            }
            else {
                menuItem['submenu'] = [];
            }
        }
        else if ((itemStateType === 'number') || isNumericString) {
            menuItem.param = commandsPackParams(cmdEmptyCommand, ...commandUnpackParams(itemParam).slice(1));
            menuItem['submenu'] = alertsMenuGenerateManageThresholds;
        }
        else {
            menuItem = undefined;
        }
    }
    return menuItem;
}

/**
 * This function generates a submenu to manage thresholds, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateManageThresholds(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentName = menuItemToProcess.name,
        [_cmdId, currentStateId, currentFunctionId, currentDestinationId] = commandUnpackParams(menuItemToProcess.param),
        currentStateObject = getObject(currentStateId),
        currentStateUnits = currentStateObject && currentStateObject.hasOwnProperty('common') && currentStateObject.common && currentStateObject.common.hasOwnProperty('unit') && currentStateObject.common.unit ? ` ${currentStateObject.common.unit}` : '',
        [currentThresholds, currentStateAlertThresholds] = alertsGetStateAlertDetailsOrThresholds(user, currentStateId, true);
    let
        subMenu = [],
        subMenuIndex = 0;
    Object.keys(currentThresholds).sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB))).forEach(currentThresholdNumber => {
        const
            currentThreshold = currentThresholds[currentThresholdNumber],
            currentOnTimeInterval = `${currentThreshold.hasOwnProperty(alertThresholdOnTimeIntervalId) ? currentThreshold[alertThresholdOnTimeIntervalId] : 0} ${translationsItemTextGet(user, 'secondsShort')}`,
            currentThresholdMessageTemplate = currentThreshold.hasOwnProperty(alertMessageTemplateId) ? currentThreshold[alertMessageTemplateId] : configOptions.getOption(cfgAlertMessageTemplateThreshold, user),
            subMenuItem = {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${currentThresholdNumber}${currentStateUnits} [${currentThreshold.onAbove ? iconItemAbove : ''}${currentThreshold.onLess ? iconItemLess : ''}]({currentOnTimeInterval})`,
                icon: iconItemEdit,
                submenu: new Array()
            };
        let subSubMenuIndex = 0;
        subSubMenuIndex = subMenuItem.submenu.push(menuEditItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, `${currentThresholdNumber}${currentStateUnits}`, 'value', dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertThresholdId, `${currentThresholdNumber}${currentStateUnits}`));
        subSubMenuIndex = subMenuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            name: `${currentThresholdNumber}${currentStateUnits} ${iconItemAbove}`,
            icon: currentThreshold.onAbove ? configOptions.getOption(cfgDefaultIconOn, user) :  configOptions.getOption(cfgDefaultIconOff, user) ,
            group: 'borders',
            param: commandsPackParams((currentThreshold.onAbove === currentThreshold.onLess) || (! currentThreshold.onAbove) ? cmdItemPress : cmdNoOperation, dataTypeAlertSubscribed, currentStateId, subMenuIndex, 'onAbove'),
            submenu: [],
        });
        subSubMenuIndex = subMenuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            name: `${currentThresholdNumber}${currentStateUnits} ${iconItemLess}`,
            icon: currentThreshold.onLess ? configOptions.getOption(cfgDefaultIconOn, user) :  configOptions.getOption(cfgDefaultIconOff, user) ,
            group: 'borders',
            param: commandsPackParams((currentThreshold.onAbove === currentThreshold.onLess) || (! currentThreshold.onLess) ? cmdItemPress : cmdNoOperation, dataTypeAlertSubscribed, currentStateId, subMenuIndex, 'onLess'),
            submenu: [],
        });
        subSubMenuIndex = subMenuItem.submenu.push(menuEditItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, `${translationsItemTextGet(user, alertThresholdOnTimeIntervalId)} {${currentOnTimeInterval}}`, 'thresholdOn', dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertThresholdOnTimeIntervalId, currentOnTimeInterval));
        subSubMenuIndex = subMenuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            name: `${translationsItemTextGet(user, alertMessageTemplateId)}${currentThreshold.hasOwnProperty(alertMessageTemplateId) ? '' : `(${translationsItemTextGet(user, 'global')}})`}`,
            icon: iconItemEdit,
            group: alertMessageTemplateId,
            param: commandsPackParams(cmdEmptyCommand, dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertMessageTemplateId, currentThresholdMessageTemplate),
            submenu: [
                menuEditItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`, 0, `${translationsItemTextGet(user, alertMessageTemplateId)}`, 'edit', dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertMessageTemplateId, currentThresholdMessageTemplate),
                menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`, 1, dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertMessageTemplateId)
            ],
        });
        subMenuItem.submenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, dataTypeAlertSubscribed, currentStateId, subMenuIndex));
        subMenuIndex = subMenu.push(subMenuItem);
    });
    subMenuIndex = subMenu.push(menuAddItemMenuItemGenerate(user, currentIndex, subMenuIndex, dataTypeAlertSubscribed, currentStateId, subMenuIndex, alertThresholdId));
    const isThresholdsSetChanged = JSON.stringify(currentStateAlertThresholds) !== JSON.stringify(currentThresholds);
    if (isThresholdsSetChanged || Object.keys(currentStateAlertThresholds).length) {
        subMenuIndex = subMenu.push(
            {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${currentName}${isThresholdsSetChanged ?  ` (${iconItemEdit})` : ''}`,
                icons: alertsGetIcon,
                group: cmdItemsProcess,
                state: currentStateId,
                param: commandsPackParams(cmdAlertSubscribe, currentStateId, currentFunctionId, currentDestinationId),
                submenu: [],
            }
        );
    }
    return subMenu;
}

/**
 * This function generates a submenu with all possible states, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateExtraSubscription(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentDestinationId = menuItemToProcess.destEnum,
        destinationsList = enumerationsList[dataTypeDestination].list,
        currentDestination = destinationsList[currentDestinationId],
        currentDestinationEnum = currentDestination.enum,
        fullDestinationId = `enum.${currentDestinationEnum}.${currentDestinationId}`,
        currentFunctionId = menuItemToProcess.funcEnum,
        functionsList = enumerationsList[dataTypeFunction].list,
        currentFunction = functionsList[currentFunctionId],
        currentFunctionEnum = currentFunction.enum,
        fullFunctionId = `enum.${currentFunctionEnum}.${currentFunctionId}`,
        isStatesInFolders = currentFunction.statesInFolders,
        _currentIcons = {on: currentFunction.iconOn, off: currentFunction.iconOff},
        deviceAttributesList = currentFunction.deviceAttributes,
        currentDeviceAttributes = deviceAttributesList ? Object.keys(deviceAttributesList).filter((deviceAttr) => (deviceAttributesList[deviceAttr].isEnabled)).sort((a, b) => (deviceAttributesList[a].order - deviceAttributesList[b].order)) : [],
        deviceButtonsList = currentFunction.deviceButtons,
        currentDeviceButtons = deviceButtonsList ? Object.keys(deviceButtonsList).filter((deviceButton) => (deviceButtonsList[deviceButton].isEnabled)).sort((a, b) => (deviceButtonsList[a].order - deviceButtonsList[b].order)) : [],
        currentDeviceStates = [...currentDeviceAttributes, ...currentDeviceButtons],
        primaryStateId = menuItemToProcess.param,
        idPrefix = primaryStateId.split('.').slice(0, isStatesInFolders ? -2 : -1).join('.'),
        currentAccessLevel = menuItemToProcess.accessLevel;
    let
        subMenu = [],
        subMenuIndex = 0;
        currentDeviceStates.forEach((shortStateId, stateIndex) => {
            if (! enumerationsDeviceBasicAttributes.includes(shortStateId)  && (currentDeviceStates.indexOf(shortStateId) === stateIndex)) {
                const currentStateId = [idPrefix, shortStateId].join('.');
                if (currentDeviceAttributes.includes(shortStateId) ||
                    (currentDeviceButtons.includes(shortStateId) && (MenuRoles.compareAccessLevels(currentAccessLevel, deviceButtonsList[shortStateId].showAccessLevel) <= 0))) {
                    if (existsObject(currentStateId)) {
                        const currentStateObject = getObject(currentStateId, '*');
                        if (currentStateObject && currentStateObject.hasOwnProperty('common') && currentStateObject.common) {
                            const
                                stateObjectEnums = currentStateObject.hasOwnProperty('enumIds') ? currentStateObject['enumIds'] : undefined,
                                isStateObjectRight = stateObjectEnums && stateObjectEnums.includes(fullFunctionId) && stateObjectEnums.includes(fullDestinationId);
                            if (isStateObjectRight) {
                                const
                                    stateIndex = `${currentIndex}.${subMenuIndex}`,
                                    stateName = `${translationsGetObjectName(user, currentStateObject, currentFunctionId)}`,
                                    subMenuItem = alertsSubscribedOnMenuItemGenerate(stateIndex, stateName, currentStateId, currentStateObject, commandsPackParams(cmdAlertSubscribe, currentStateId, currentFunctionId, currentDestinationId), true);
                                if (subMenuItem) {
                                    // logs(`subMenuItem = ${JSON.stringify(subMenuItem, null, 1)}`, _l)
                                    subMenuIndex = subMenu.push(subMenuItem);
                                }
                            }

                        }
                    }
                }
            }
        });
    return subMenu;
}

//*** Alerts - end ***//

//*** Backup - begin ***//

const
    backupFolder = 'AutoTelegramMenuBackup',
    backupPrefix = 'ATMBackup',
    backupModeAuto = 'auto',
    backupModeManual = 'manual',
    backupModeCreate = 'create',
    backupModeRestore = 'restore',
    backupFileMask = new RegExp(`${backupPrefix}-(\\d{4}-\\d{2}-\\d{2})-(\\d{2}-\\d{2}-\\d{2})-(\\S+)\\.json`),
    backupItemAll = doAll,
    backupItemConfigOptions = 'configOptions',
    backupItemMenuListItems = 'enumerationItems',
    backupItemAlerts = 'alerts',
    backupRestoreItemsList = {[backupItemAll]: doAll, [backupItemConfigOptions]: 'configuration', [backupItemMenuListItems]: 'functionsDestsReports', [backupItemAlerts]: backupItemAlerts};
let _backupScheduleReference;

/**
 * This function generates a submenu to manage Auto Telegram Menu configuration
 * backup and restore.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function backupMenuGenerate(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        _currentId = menuItemToProcess.id,
        currentAccessLevel = menuItemToProcess.accessLevel,
        backupFiles = backupGetFolderList();
    let
        subMenu = [],
        subMenuIndex = 0;
    if (! MenuRoles.accessLevelsPreventToShow.includes(currentAccessLevel)) {
        subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'BackupCreate')}`,
                icon: iconItemBackupCreate,
                id: backupModeCreate,
                param: MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0 ? commandsPackParams(cmdItemsProcess, dataTypeBackup, backupModeCreate) : cmdNoOperation,
                submenu: []
        });
        if (backupFiles.length) {
            const restoreSubMenu = {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'BackupRestore')}`,
                icon: iconItemBackupRestore,
                id: backupModeRestore,
                submenu: new Array()
            };
            const restoreSubSubMenu = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0 ? backupRestoreMenuGenerate : [];
            backupFiles.forEach((fileName, fileIndex) => {
                const
                    backupFileDetails = fileName.match(backupFileMask),
                    [_fullName, backupDate, backupTime, backupMode] = backupFileDetails && (backupFileDetails.length === 4) ? backupFileDetails : [];
                if (backupDate && backupTime && backupMode) {
                    restoreSubMenu.submenu.push({
                        index: `${currentIndex}.${subMenuIndex}.${fileIndex}`,
                        name: `${backupDate} ${backupTime.split('-').join(':')} [${backupMode}]`,
                        // icon: iconItemBackupCreate,
                        param: MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0 ? fileName : cmdNoOperation,
                        submenu: restoreSubSubMenu,
                    });
                }
            });
            subMenuIndex = subMenu.push(restoreSubMenu);
        }
    }
    return subMenu;
}

/**
 * This function generates a submenu to manage Auto Telegram Menu configuration
 * restore (to select a backup and scope).
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function backupRestoreMenuGenerate(user, menuItemToProcess) {
    // logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`, _l);
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        currentParam = menuItemToProcess.param;
    let
        subMenu = [],
        subMenuIndex = 0;
    Object.keys(backupRestoreItemsList).forEach(backupItem => {
        subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, backupModeRestore, backupRestoreItemsList[backupItem])}`,
            icon: iconItemBackupRestore,
            param: commandsPackParams(cmdItemsProcess, dataTypeBackup, backupModeRestore, currentParam, backupItem),
            submenu: []
        });
    });
    subMenuIndex = subMenu.push(menuDeleteItemMenuItemGenerate(user, `${currentIndex}`, subMenuIndex, dataTypeBackup, currentParam));
    return subMenu;
}

/**
 * This function deletes an backup file from the server.
 * @param {string=} backupFileName - The file name of the backup file.
 */
async function backupFileDelete(backupFileName){
    const fileToDelete = `${backupFolder}/${backupFileName}`;
    return new Promise((resolve, reject) => {
        delFile('', fileToDelete, (error) => {
            if (error) {
                console.warn(`Can't delete backup file ${fileToDelete}! Error is '${error}'.`);
                reject(error);
            }
            else {
                console.warn(`Backup file ${fileToDelete} was successfully deleted.`);
                resolve(true);
            }
        });
    });
}

/**
 * This function writes configuration to the backup file from the server.
 * @param {string} backupFileName - The file name of the backup file.
 * @param {string} backupDataJSON - The configuration in the JSON format.
 * @param {string} backupMode - The backup mode - `manual' or 'auto`(scheduled).
 */
async function backupFileWrite(backupFileName, backupDataJSON, backupMode){
    return new Promise((resolve, reject) => {
        writeFile('', backupFileName, backupDataJSON, (error) => {
            if (error) {
                console.warn(`Can't create backup file ${backupFileName}! Error is '${error}'.`);
                reject(error);
            }
            else {
                console.warn(`Backup file ${backupFileName} is created successfully.`);
                resolve(backupMode);
            }
        });
    });
}

/**
 * This function reads configuration from the backup file on the server.
 * @param {string} backupFileName - The file name of the backup file.
 * @returns {Promise<string>} The promise with the stored configuration in JSON format..
 */
async function backupFileRead(backupFileName){
    return new Promise((resolve, reject) => {
        readFile('', backupFileName, (error, data) => {
            if (error) {
                console.warn(`Cant' read backup file ${backupFileName}! Error is '${error}'.`);
                reject(error);
            }
            else {
                // console.warn(`Backup file ${backupFileName} is created successfully.`);
                resolve(data ? `${data}` : '');
            }
        });
    });
}

/**
 * This function consolidate all configuration in one JSON and then write it to
 * the backup file on the server.
 * @param {string} backupMode - The backup mode - `manual' or 'auto`(scheduled).
 */
async function backupCreate(backupMode) {
    const backupData = {
        [backupItemConfigOptions]: configOptions.getDataForBackup(),
    };
    const enumerationItemsBackup = {};
    Object.keys(enumerationsList).forEach(dataType => {
        enumerationItemsBackup[dataType] = {
            enums: enumerationsList[dataType].enums,
            list: enumerationsList[dataType].list
        };
    });
    backupData[backupItemMenuListItems] = enumerationItemsBackup;
    backupData[backupItemAlerts] = alertsGet();
    const backupDataJSON = JSON.stringify(backupData, mapReplacer, 2);
    // logs(`${backupDataJSON}`, 1);
    const
        // @ts-ignore
        dateNow = formatDate(new Date(), 'YYYY-MM-DD-hh-mm-ss'),
        backupFileName = nodePath.join(backupFolder,`${backupPrefix}-${dateNow}-${backupMode}.json`);
    return await backupFileWrite(backupFileName, backupDataJSON, backupMode)
        .then(await backupDeleteOldFiles)
        .catch(_error => {});
    // logs(`Files: ${JSON.stringify(backupGetFolderList(), null, 1)}`, _l);
}

/**
 * This function reads the stored configuration JSON from the server and then
 * replace appropriate configuration items, depending on `restoreItem` value.
 * @param {string} fileName - The file name of the backup file.
 * @param {string=} restoreItem - The selector of the configuration part to restore.
 */
async function backupRestore(fileName, restoreItem) {
    let result = false;
    if (backupFileMask.test(fileName)) {
        const
            backupFileName = nodePath.join(backupFolder, fileName),
            backupData = await backupFileRead(backupFileName).catch(_error => {});
        let restoreData;
        if (backupData) {
            result = true;
            try {
                restoreData = JSON.parse(backupData, mapReviver);
            }
            catch (error) {
                console.warn(`Can't parse data from file ${backupFileName}! Error is '${JSON.stringify(error)}'.\nData in file is '${backupData}'`);
            }
            const restoreItems = Object.keys(backupRestoreItemsList);
            if (restoreData &&
                (restoreItems.filter(backupItem => (restoreData.hasOwnProperty(backupItem) && restoreData[backupItem])).length === (restoreItems.length - 1))) {
                let itemsToRestore = [restoreItem];
                if (restoreItem === backupItemAll) {
                    itemsToRestore = Object.keys(backupRestoreItemsList);
                    itemsToRestore.shift();
                }
                itemsToRestore.forEach(itemToRestore => {
                    switch (itemToRestore) {
                        case backupItemConfigOptions:
                            // logs(`1 itemToRestore = ${JSON.stringify(restoreData[itemToRestore])}`, _l);
                            if (restoreData.hasOwnProperty(itemToRestore) && typeOf(restoreData[itemToRestore], 'object')) {
                                configOptions.restoreDataFromBackup(restoreData[backupItemConfigOptions]);
                                rolesInMenu.refresh();
                                usersInMenu.refresh();
                            }
                            break;

                        case backupItemMenuListItems:
                            // logs(`2 itemToRestore = ${JSON.stringify(restoreData[itemToRestore])}`, _l);
                            if (restoreData.hasOwnProperty(itemToRestore) && typeOf(restoreData[itemToRestore], 'object')) {
                                const enumerationItemsBackup = restoreData[itemToRestore];
                                Object.keys(enumerationsList).forEach(dataType => {
                                    if (enumerationItemsBackup.hasOwnProperty(dataType) && typeOf(enumerationItemsBackup[dataType], 'object')
                                        && enumerationItemsBackup[dataType].hasOwnProperty('enums') && enumerationItemsBackup[dataType].enums
                                        && enumerationItemsBackup[dataType].hasOwnProperty('list') && enumerationItemsBackup[dataType].list ) {
                                        // logs(`enumerationItems[${dataType}] = ${JSON.stringify(
                                        //     {
                                        //         enums: enumerationItemsBackup[dataType].enums,
                                        //         list: enumerationItemsBackup[dataType].list
                                        //     }
                                        // )}`, _l)
                                        enumerationsList[dataType].enums = enumerationItemsBackup[dataType].enums;
                                        enumerationsList[dataType].list = enumerationItemsBackup[dataType].list;
                                        enumerationsInit(dataType);
                                        enumerationsSave(dataType);
                                    }
                                });
                            }
                            break;

                        case backupItemAlerts:
                            // logs(`3 itemToRestore = ${JSON.stringify(restoreData[itemToRestore])}`, _l);
                            if (restoreData.hasOwnProperty(itemToRestore) && typeOf(restoreData[itemToRestore], 'object')) {
                                alertsStore(restoreData[itemToRestore]);
                                alertsInit();
                            }
                            break;


                        default:
                            break;
                    }
                });
            }
            else {
                result = false;
                console.warn(`Inconsistent data from file ${backupFileName}!\nData in file is '${backupData}'`);
            }
        }
    }
    return result;
}


/**
 * This function delete an old (as it configured) backup files.
 * @param {*} mode - The filter of files, based on a creation mode (`manual` or `auto`).
 * //@returns {boolean} result of
 */
async function backupDeleteOldFiles(mode) {
    if (mode === backupModeAuto) {
        const
            backupFiles = backupGetFolderList(),
            maxBackupFiles = configOptions.getOption(cfgConfigBackupCopiesCount);
        while (backupFiles.length > maxBackupFiles) {
            await backupFileDelete(backupFiles.shift()).catch(_error => {});
        }
    }
    return true;
}

/**
 * This function returns a list of files in backup folder.
 * @returns {string[]} Array of files.
 */
function backupGetFolderList() {
    let result = [];
    const
        currentDir = nodeProcess.cwd(),
        adapterSubPath = nodePath.join('node_modules', 'iobroker.javascript');
    if (currentDir.includes(adapterSubPath)) {
        const backupDir = nodePath.join(currentDir.replace(adapterSubPath, nodePath.join('iobroker-data', 'files', '0_userdata.0', backupFolder)));
        const listOfBackups = nodeFS.readdirSync(backupDir);
        result = listOfBackups.filter(fileName => backupFileMask.test(fileName)).sort();
    }
    return result;
}

//*** Backup - end ***//

//*** simpleReports - begin ***//

const
    cachedSimpleReportIdToCreate = 'simpleReportIdToCreate',
    cachedSimpleReportNewQuery = 'simpleReportNewQuery',
    simpleReportQueryParamsTemplate = () => { return {queryDests: [], queryState: '', queryRole: '', queryStates: [], queryPossibleStates: []} },
    simpleReportFunctionTemplate = {
        "common": {
            "name": {
             "en": ""
            },
            "members": [],
            "icon": "",
            "color": false
        },
        "type": "enum",
    };

/**
 * This function generates a submenu to manage (create or edit) the SimpleReports.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateReportEdit(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    let newMenu = [];
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        reportId = menuItemToProcess.param,
        enumId = menuItemToProcess.param ? menuItemToProcess.param : Object.keys(enumerationsList[dataTypeReport].enums)[0];
    if (reportId) {
        const
            reportObjectId = `${prefixEnums}.${enumerationsList[dataTypeReport].list[reportId].enum}.${reportId}`,
            reportObject = getObject(reportObjectId);
        let memberId = 0;
        logs(`reportObject = ${JSON.stringify(reportObject, null, 2)}`);
        /** show list of states, already assigned to report */
        if (reportObject.common.hasOwnProperty('members')) {
            reportObject.common.members.forEach((member) => {
                if (member) {
                    const memberTopObjectName = translationsGetObjectName(user, member.split('.').slice(0, -1).join('.'));
                    memberId = newMenu.push({
                        index: `${currentIndex}.${memberId}`,
                        name: `${memberTopObjectName} (${member.split('.').pop()})`,
                        icon: enumerationsList[dataTypeReport].icon,
                        function: (_user, _menuItemToProcess) => (`${memberTopObjectName} (${member})`),
                        submenu: [
                            menuDeleteItemMenuItemGenerate(user, `${currentIndex}.${memberId}`, 0, dataTypeReportMember, reportId, memberId)
                        ],
                    });
                }
            });
        }
        memberId = newMenu.push({
            index: `${currentIndex}.${memberId}`,
            name: `${translationsItemMenuGet(user, 'ReportMarkNewStates')}`,
            icon: enumerationsList[dataTypeReport].icon,
            param: reportId,
            /** submenu function for collecting query params (dests, states, roles) */
            submenu: (user, menuItemToProcess) => {
                logs(`(${user}, menuItemToProcess)`);
                const
                    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                    reportId = menuItemToProcess.param;
                let
                    subMenuIndex = 0,
                    subMenu = [];
                const {queryDests, queryState, queryRole} = cachedExistsValue(user, cachedSimpleReportNewQuery) ? cachedGetValue(user, cachedSimpleReportNewQuery) : simpleReportQueryParamsTemplate();
                if (! cachedExistsValue(user, cachedSimpleReportNewQuery)) cachedSetValue(user, cachedSimpleReportNewQuery,  {queryDests, queryState, queryRole});
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineDest')} (${queryDests.length}, ${Object.keys(enumerationsList[dataTypeDestination].list).filter((key) => (enumerationsList[dataTypeDestination].list[key].isEnabled)).length})`,
                    icon: enumerationsList[dataTypeReport].icon,
                    /** submenu function for dests selection */
                    submenu: (user, menuItemToProcess) => {
                        logs(`(${user}, menuItemToProcess)`);
                        const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
                        let
                            subMenu = [],
                            subMenuIndex = 0;
                        Object.keys(enumerationsList[dataTypeDestination].list).filter((key) => (enumerationsList[dataTypeDestination].list[key].isEnabled)).forEach((key) => {
                            const _isSelected = queryDests.includes(key)? '|' : '';
                            subMenuIndex = subMenu.push({
                                index: `${currentIndex}.${subMenuIndex}`,
                                name: `${translationsGetEnumName(user, dataTypeDestination, key)}`,
                                icon: queryDests.includes(key) ? configOptions.getOption(cfgDefaultIconOn, user) : enumerationsList[dataTypeDestination].list[key].icon,
                                param: commandsPackParams(cmdItemMark, dataTypeReportMember, dataTypeDestination, key),
                                submenu: []
                            });
                        });
                        return subMenu;
                    }
                });
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineState')} (${queryState})`,
                    icon: iconItemEdit,
                    param: commandsPackParams(cmdGetInput, dataTypeReportMember, 'queryState'),
                    submenu: []
                });
                subMenuIndex = subMenu.push({
                    index: `${currentIndex}.${subMenuIndex}`,
                    name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineRole')} (${queryRole})`,
                    icon: iconItemEdit,
                    param: commandsPackParams(cmdGetInput, dataTypeReportMember, 'queryRole', 2),
                    submenu: [],
                });
                if (queryRole || queryState) {
                    subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemMenuGet(user, 'ReportNewStatesStartSearch')}`,
                        icon: enumerationsList[dataTypeReport].icon,
                        param: reportId,
                        /** submenu function for selecting states from a query result and assigning them to report */
                        submenu: (user, menuItemToProcess) => {
                            logs(`(${user}, menuItemToProcess)`);
                            const
                                currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                                reportId = menuItemToProcess.param;
                            let
                                {queryDests, queryState, queryRole, queryStates, queryPossibleStates} = cachedGetValue(user, cachedSimpleReportNewQuery),
                                subMenu = [],
                                subMenuIndex = 0,
                                destsList = queryDests,
                                currentDestId = '',
                                destIndex = 0,
                                itemsMarked = 0;
                            if (! destsList.length) {
                                destsList = Object.keys(enumerationsList[dataTypeDestination].list);
                            }
                            logs(`destsList = ${JSON.stringify(destsList)}, queryState = ${queryState}, queryRole = ${queryRole}`);
                            const query = `state${queryState ? `[id=*.${queryState}]` : '[id=*]'}${queryRole ? `[role=${queryRole}]` : ''}`;
                            logs(`query = ${query}`);
                            destsList.forEach((destinationId) => {
                                const currentDestination = enumerationsList[dataTypeDestination].list[destinationId];
                                $(`${query}${destinationId ? `(${currentDestination.enum}=${destinationId})` : ''}`).each((id, index) => {
                                    if(currentDestId !== destinationId) {
                                        if (currentDestId) {
                                            destIndex++;
                                            subMenu[subMenuIndex - 1].name = `${subMenu[subMenuIndex - 1].name} (${subMenu[subMenuIndex - 1].submenu.length}, ${itemsMarked})`;
                                        }
                                        currentDestId = destinationId;
                                        subMenuIndex = subMenu.push({
                                            index: `${currentIndex}.${subMenuIndex}`,
                                            name: `${translationsGetEnumName(user, dataTypeDestination, destinationId)}`,
                                            icon: enumerationsList[dataTypeReport].icon,
                                            submenu: []
                                        });
                                        itemsMarked = 0;
                                    }
                                    const stateTopObjectName = translationsGetObjectName(user, id.split('.').slice(0, -1).join('.'));
                                    subMenu[destIndex].submenu.push({
                                        index: `${currentIndex}.${subMenuIndex-1}.${index}`,
                                        name: `${stateTopObjectName} (${id.split('.').pop()})`,
                                        icon: queryStates.includes(id) ? configOptions.getOption(cfgDefaultIconOn, user) : enumerationsList[dataTypeDestination].icon,
                                        function: (_user, _menuItemToProcess) => (`${stateTopObjectName} (${id})`),
                                        submenu: [
                                            {
                                                index: `${currentIndex}.${subMenuIndex-1}.${index}`,
                                                name: `${translationsItemMenuGet(user, 'ItemMarkUnMark')}`,
                                                icon: queryStates.includes(id) ? configOptions.getOption(cfgDefaultIconOn, user) : enumerationsList[dataTypeDestination].icon,
                                                param: commandsPackParams(cmdItemMark, dataTypeReportMember, 'states', queryPossibleStates.length),
                                                submenu: []
                                            }
                                        ]
                                    });
                                    if (queryStates.includes(id)) itemsMarked++;
                                    queryPossibleStates.push(id);
                                });
                            });
                            if (subMenuIndex) subMenu[subMenuIndex - 1].name = `${subMenu[subMenuIndex - 1].name} (${subMenu[subMenuIndex - 1].submenu.length}, ${itemsMarked})`;
                            subMenuIndex = subMenu.push({
                                index: `${currentIndex}.${subMenuIndex}`,
                                name: `${translationsItemMenuGet(user, 'ItemsProcessMarked')}`,
                                icon: configOptions.getOption(cfgDefaultIconOn, user),
                                group: cmdItemsProcess,
                                param: commandsPackParams(cmdItemsProcess, dataTypeReportMember, reportId, 'marked'),
                                submenu: []
                            });
                            subMenuIndex = subMenu.push({
                                index: `${currentIndex}.${subMenuIndex}`,
                                name: `${translationsItemMenuGet(user, 'ItemsProcessAll')}`,
                                icon: enumerationsList[dataTypeReport].icon,
                                param: commandsPackParams(cmdItemsProcess, dataTypeReportMember, reportId, doAll),
                                submenu: []
                            });
                            logs(`statesArray = ${JSON.stringify(queryPossibleStates)}`);
                            logs(`submenu = ${JSON.stringify(subMenu, null, 2)}`);
                            cachedSetValue(user, cachedSimpleReportNewQuery, {queryDests, queryState, queryRole, queryStates, queryPossibleStates});
                            return subMenu;
                        },
                    });
                }
                logs(`submenu = ${JSON.stringify(subMenu, null, 2)}`);
                return subMenu;
            }
        });
    }
    else {
        cachedDelValue(user, cachedSimpleReportNewQuery);
        const simpleReportId = cachedGetValue(user, cachedSimpleReportIdToCreate);
        if (simpleReportId) {
            if (/[^a-zA-Z0-9]/.test(simpleReportId)) {
                newMenu.push(
                    {
                        index: `${currentIndex}.0`,
                        name: `${translationsItemCoreGet(user, 'cmdFixId')}`,
                        icon: iconItemEdit,
                        param: commandsPackParams(cmdGetInput, dataTypeReport, '', 'fixId'),
                        submenu: [],
                    }
                );
            }
            else {
                newMenu.push(
                    {
                        index: `${currentIndex}.0`,
                        name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${simpleReportId}'`,
                        icon: enumerationsList[dataTypeReport].icon,
                        param: commandsPackParams(cmdCreateReportEnum, dataTypeReport, simpleReportId, enumId),
                        submenu: [],
                    }
                );
                cachedDelValue(user, cachedSimpleReportIdToCreate);
            }
        }
        else {
            newMenu.push(
                {
                    index: `${currentIndex}.0`,
                    name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
                    icon: iconItemEdit,
                    param: commandsPackParams(cmdGetInput, dataTypeReport, '', 'setId'),
                    submenu: [],
                }
            );
        }
    }
    return newMenu;
}

/**
 * This function generates the structure of the SimpleReport, based on the list
 * of ioBroker states.
 * @param {string[]} reportStatesList - The list(Array) of the ioBroker states.
 * @returns {object} The SimpleReport structure.
 */
function simpleReportPrepareStructure(reportStatesList) {
    const funcsList = enumerationsList[dataTypeFunction].list;
    logs(`reportStatesList = ${JSON.stringify(reportStatesList)}`);
    let
        reportStatesStructure = {},
        objectToFunctionList = {};
    reportStatesList.forEach(stateId => {
        if (existsObject(stateId)) {
            const
                currentObject = getObject(stateId, '*');
            if (currentObject.hasOwnProperty('enumIds')) {
                const
                    topStateId = stateId.split('.').slice(0, -1).join('.'),
                    destsEnums = Object.keys(enumerationsList[dataTypeDestination].enums),
                    funcsEnums = Object.keys(enumerationsList[dataTypeFunction].enums),
                    functionsList = enumerationsList[dataTypeFunction].list,
                    stateDests = currentObject['enumIds'].filter((key) => {
                            for (let enumType of destsEnums) {
                                if (key.indexOf(`${prefixEnums}.${enumType}`) === 0)
                                    return true;
                            }
                            return false;
                        }).map(key => key.split('.').pop());
                let stateFuncs = currentObject['enumIds'].filter(key => (funcsEnums.find(enumId => (key.indexOf(`${prefixEnums}.${enumId}`) === 0)))).map(key => key.split('.').pop());
                stateDests.forEach(stateDest => {
                    if (! stateFuncs.length) {
                        stateFuncs.push(enumerationsFunctionNotFound);
                    }
                    else if (stateFuncs.length > 1) {
                        if (! Object.keys(objectToFunctionList).length) {
                            Object.keys(funcsList).forEach( functionId => {
                                const fullId = `${prefixEnums}.${functionsList[functionId].enum}.${functionId}`;
                                if (existsObject(fullId)) {
                                    const functionObject = getObject(fullId);
                                    if (functionObject.hasOwnProperty('common') && functionObject.common.hasOwnProperty('members')) {
                                        functionObject.common.members.forEach(item => {
                                            objectToFunctionList[item] = functionId;
                                        });
                                    }
                                }

                            });
                        }
                        let currentStateId = stateId;
                        logs(`objectToFunctionList = ${JSON.stringify(objectToFunctionList)}`);
                        while (currentStateId.includes('.')) {
                            if ( objectToFunctionList.hasOwnProperty(currentStateId) ) {
                                stateFuncs = [objectToFunctionList[currentStateId]];
                                break;
                            }
                            currentStateId = currentStateId.split('.').slice(0, -1).join('.');
                        }
                    }
                    stateFuncs.forEach(stateFunc => {
                        if (! reportStatesStructure.hasOwnProperty(stateDest)) {
                            reportStatesStructure[stateDest] = {};
                        }
                        if (! reportStatesStructure[stateDest].hasOwnProperty(stateFunc)) {
                            reportStatesStructure[stateDest][stateFunc] = {};
                        }
                        if (! reportStatesStructure[stateDest][stateFunc].hasOwnProperty(topStateId)) {
                            reportStatesStructure[stateDest][stateFunc][topStateId] = new Array();
                        }
                        reportStatesStructure[stateDest][stateFunc][topStateId].push(currentObject);
                    });
                });
            }

        }
    });
    logs(`reportStatesStructure = ${JSON.stringify(reportStatesStructure, null, 2)}`);
    return reportStatesStructure;
}

/**
 * This function takes a list of ioBroker states from a stored SimpleReports and returns a
 * report, as a formatted multiline string, each of line contained the name of
 * the state object and its current value
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the report will be generated.
 * @returns {string}
 */
function simpleReportGenerate(user, menuItemToProcess) {
    logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    let reportText = '';
    const
        reportsList = enumerationsList[dataTypeReport];
    logs(`Object.keys(reportItem.list) = ${JSON.stringify(Object.keys(reportsList.list))}`);
    logs(`reportItem = ${JSON.stringify(reportsList, null, 2)}`);
    if (menuItemToProcess && menuItemToProcess.hasOwnProperty('id') && Object.keys(reportsList.list).includes(menuItemToProcess.id)) {
        const
            reportId = menuItemToProcess.id,
            reportObject = getObject(`${prefixEnums}.${reportsList.list[reportId].enum}.${reportId}`);
        logs(`reportId = ${reportId}`);
        logs(`reportObject = ${JSON.stringify(reportObject)}`);
        if (reportObject && reportObject.hasOwnProperty('common') && reportObject.common.hasOwnProperty('members') && Array.isArray(reportObject.common['members']) && reportObject.common['members'].length) {
            const
                reportStatesList = reportObject.common['members'].sort(),
                _funcsList = enumerationsList[dataTypeFunction].list,
                isAlwaysExpanded = reportsList.list[reportId].alwaysExpanded;
            logs(`reportStatesList = ${JSON.stringify(reportStatesList)}`);
            let
                reportStatesStructure = simpleReportPrepareStructure(reportStatesList);
            logs(`reportStatesStructure = ${JSON.stringify(reportStatesStructure, null, 2)}`);
            let reportLines = new Array();
            Object.keys(reportStatesStructure).sort((a, b) => (enumerationsCompareOrderOfItems(a, b, dataTypeDestination))).forEach(currentDestId => {
                const linePrefix = '- ';
                reportLines.push({label: `${linePrefix}${translationsItemTextGet(user, 'In').toLowerCase()} ${translationsGetEnumName(user, dataTypeDestination, currentDestId, enumerationsNamesInside)}`});
                const currentFuncs = Object.keys(reportStatesStructure[currentDestId]);
                currentFuncs.sort((a, b) => (enumerationsCompareOrderOfItems(a, b, dataTypeFunction))).forEach(currentFuncId => {
                    if (isAlwaysExpanded || (currentFuncs.length > 1)) {
                        reportLines.push({label: ` ${linePrefix}${stringCapitalize(translationsGetEnumName(user, dataTypeFunction, currentFuncId, enumerationsNamesMany))}`});
                    }
                    const currentDeviceObjects = Object.keys(reportStatesStructure[currentDestId][currentFuncId]);
                    currentDeviceObjects.forEach(currentDeviceObject => {
                        if (isAlwaysExpanded || (currentDeviceObjects.length > 1)) {
                            reportLines.push({label: `  ${linePrefix}${translationsGetObjectName(user, currentDeviceObject)}`});
                        }
                        const currentStateObjects = reportStatesStructure[currentDestId][currentFuncId][currentDeviceObject];
                        currentStateObjects.forEach(currentStateObject => {
                            if (isAlwaysExpanded || (currentStateObjects.length > 1)) {
                                reportLines.push({label: `   ${linePrefix}${translationsGetObjectName(user, currentStateObject, currentFuncId)}`});
                            }
                            reportLines[reportLines.length - 1] = {...reportLines[reportLines.length - 1], ...enumerationsStateValueDetails(user, currentStateObject, currentFuncId)};
                        });
                    });
                });
            });
            logs(`reportLines = ${JSON.stringify(reportLines)}`);
            reportText = `<code>${menuPrintFixedLengthLinesForMenuItemDetails(user, reportLines)}</code>`;
        }
    }
    logs(`reportText = ${JSON.stringify(reportText)}`);
    return reportText;
}

/**
 * This function generates a submenu for an appropriate SimpleReport, which contains a list
 * of graphs for the report, and a command * to delete all sent images.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} Newly generated submenu.
 */
function simpleReportMenuGenerateGraphs(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        reportId = menuItemToProcess.id,
        reportsList = enumerationsList[dataTypeReport].list,
        reportItem = reportsList[reportId],
        graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user);
    let subMenu = [];
    if (reportItem) {
        const reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
        if (reportObject && reportObject.hasOwnProperty('common') && reportObject.common.hasOwnProperty('members') && Array.isArray(reportObject.common['members']) && reportObject.common['members'].length) {
            const reportStatesList = reportObject.common['members'].sort();
            let shortStates = reportStatesList.map(state => state.split('.').pop()).reduce((previousState, currentState) => { if (! previousState.includes(currentState)) previousState.push(currentState); return previousState }, new Array());
            const graphsTemplate = shortStates.length === 1 ? (existsObject(`${graphsTemplatesFolder}.${shortStates[0]}`) ? shortStates[0] : graphsDefaultTemplate) : undefined;
            if (graphsTemplate) {
                let subMenuIndex = 0;
                const graphsIntervals = configOptions.getOption(cfgGraphsIntervals, user);
                if (graphsIntervals && typeOf(graphsIntervals, 'array') && graphsIntervals.length) {
                    graphsIntervals.forEach(({id: graphsIntervalId, minutes: graphsIntervalMinutes}) => {
                        // logs(`generateTextTranslationId('TimeRange', graphsTimeRangeId) = ${generateTextTranslationId('TimeRange', graphsTimeRangeId)}`);
                        subMenuIndex = subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}`,
                            icon: iconItemChart,
                            group: cmdItemsProcess,
                            param: commandsPackParams(cmdItemsProcess, dataTypeGraph, graphsTemplate, dataTypeReport, graphsIntervalMinutes, reportId)
                        });
                    });
                }
                if (sentImagesExists(user)) {
                    subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
                        icon: iconItemDelete,
                        param: cmdDeleteAllSentImages,
                        group: cmdDeleteAllSentImages
                    });
                }
            }
        }
    }
    return subMenu;
}

//*** simpleReports - end ***//

//*** menu related functions - begin ***//

const
    menuItemButtonPrefix = 'menu-',                    // Technical parameter for the telegram menu items
    menuRefreshScheduled = new Map,
    menuRefreshTimeAllUsers = 0,
    menuButtonsDefaultGroup = 'defaultGroup';

/**
 * This function generates a root menu item for a user based on the user's access level.
 * @param {object} user - The user object.
 * @param {string=} topRootMenuItemId - Id of one of root menu subitem, to generate menu only for them as root.
 * @returns {object} Newly generated root menu item(or one of root item submenu items).
 */
 function menuRootMenuItemGenerate(user, topRootMenuItemId) {

    const
        rootMenu = {
            index: '',
            name: translationsItemMenuGet(user, 'RootText'),
            icon: '🎩',
            submenu: new Array()
        },
        isMenuFastGeneration = configOptions.getOption(cfgMenuFastGeneration, user),
        isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
        isFunctionsFirstGlobal = configOptions.getOption(cfgMenuFunctionsFirst),
        inverseMasks = isFunctionsFirst !== isFunctionsFirstGlobal,
        functionsList = enumerationsList[dataTypeFunction].list,
        functionsListIds = Object.keys(functionsList)
            .filter((func) => (functionsList[func].isEnabled && functionsList[func].isAvailable ))
            .sort((a, b) => (functionsList[a].order - functionsList[b].order)),
        destinationsList = enumerationsList[dataTypeDestination].list,
        destinationsListIds = Object.keys(destinationsList)
            .filter((dest) => (destinationsList[dest].isEnabled && destinationsList[dest].isAvailable))
            .sort((a, b) => (destinationsList[a].order - destinationsList[b].order)),
        currentDataType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
        currentEnumId = isFunctionsFirst ? 'funcEnum' : 'destEnum',
        currentNameId = isFunctionsFirst ? enumerationsNamesMany : enumerationsNamesMain,
        currentList = isFunctionsFirst ? functionsList : destinationsList,
        currentListIds =  isFunctionsFirst ? functionsListIds : destinationsListIds;

    /**
     * This function generates the root menu item `Setup`, which contains all
     * items related to the configuration of the Auto Telegram Menu.
     * @param {object} user - The user object.
     * @returns {object} Newly generated `Setup` item.
     */
    function menuRootSetupMenuItemGenerate(user) {
        const menuItem = {
            name: translationsItemMenuGet(user, 'Setup'),
            id: 'setup',
            group: 'setupTopItem',
            icon: '🛠️',
            submenu: new Array()
        };
        if ((user === null) || (user && user.userId && (MenuRoles.compareAccessLevels(usersInMenu.getMenuItemAccess(user.userId, menuItem.id), rolesAccessLevelForbidden) !== 0))) {
            const subMenu = [
                {
                    name: translationsItemMenuGet(user, 'Configuration'),
                    id: idConfig,
                    icon: '⚙️',
                    group: idConfig,
                    submenu: (user, menuItemToProcess) => (configOptions.menuGenerate(user, menuItemToProcess))
                },
                {
                    name: translationsItemMenuGet(user, idTranslation),
                    id: dataTypeTranslation,
                    icon: iconItemTranslation,
                    group: idTranslation,
                    submenu:[
                        {
                            name: translationsItemMenuGet(user, 'TranslationMenuItems'),
                            icon: iconItemTranslation,
                            id: 'menu',
                            submenu: translationsBasicItemsMenuGenerate
                        },
                        {
                            name: translationsItemMenuGet(user, 'TranslationCommandItems'),
                            icon: iconItemTranslation,
                            id: 'cmd',
                            submenu: translationsBasicItemsMenuGenerate
                        },
                        {
                            name: translationsItemMenuGet(user, 'TranslationTextItems'),
                            icon: iconItemTranslation,
                            id: 'text',
                            submenu: translationsBasicItemsMenuGenerate
                        },
                        ...translationsDownloadUploadMenuPartGenerate(user, translationsCoreId)
                    ]
                },
                {
                    name: translationsItemMenuGet(user, 'UsersList'),
                    id: 'users',
                    icon: iconItemUsers,
                    group: 'users',
                    submenu: (user, menuItemToProcess) => usersInMenu.menuGenerate(user, menuItemToProcess)
                },
                {
                    name: translationsItemMenuGet(user, 'RolesList'),
                    id: 'roles',
                    icon: iconItemRole,
                    group: 'users',
                    submenu: (user, menuItemToProcess) => rolesInMenu.menuGenerate(user, menuItemToProcess)
                },
                {
                    name: translationsItemMenuGet(user, 'Backup'),
                    id: 'backup',
                    icon: iconItemBackup,
                    group: 'backup',
                    submenu: (user, menuItemToProcess) => backupMenuGenerate(user, menuItemToProcess)
                },
                {
                    name: translationsItemMenuGet(user, 'Alerts'),
                    id: 'alerts',
                    icon: iconItemAlerts,
                    group: 'alerts',
                    submenu: [
                        {
                            name: translationsItemMenuGet(user, 'AlertsHistory'),
                            id: 'alertsHistory',
                            icon: iconItemHistory,
                            submenu: alertsHistoryMenuGenerate
                        },
                        {
                            name: translationsItemMenuGet(user, 'SubscribedAlerts'),
                            id: 'alertsSubscribed',
                            icon: iconItemAlerts,
                            submenu: alertsMenuGenerateSubscribed
                        }
                    ]
                },
            ];
            subMenu.splice(1, 0, ...Object.keys(enumerationsList).map(dataType => ({
                name: translationsItemMenuGet(user, enumerationsList[dataType].id),
                id: dataType,
                icon: enumerationsList[dataType].icon,
                group: idEnumerations,
                submenu: enumerationsListMenuGenerate
            })));
            logs(`subMenu`);
            subMenu.forEach(subMenuItem => {
                const subMenuItemAccessLevel = user && user.userId ? usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${subMenuItem.id}`) : '';
                if ((user === null) || (user && user.userId && (MenuRoles.compareAccessLevels(subMenuItemAccessLevel, rolesAccessLevelForbidden) < 0))) {
                    subMenuItem.accessLevel = subMenuItemAccessLevel;
                    if (Array.isArray(subMenuItem.submenu) && subMenuItem.submenu.length) {
                        subMenuItem.submenu.forEach(subSubMenuItem => (subSubMenuItem.accessLevel = subMenuItemAccessLevel));
                    }
                    menuItem.submenu.push(subMenuItem);
                }
            });
            if (user && user.userId && sentImagesExists(user)) {
                menuItem.submenu.push({
                    name: translationsItemCoreGet(user, cmdDeleteAllSentImages),
                    id: cachedSentImages,
                    icon: iconItemDelete,
                    param: cmdDeleteAllSentImages,
                    group: cmdDeleteAllSentImages
                });
            }
            if (menuItem.submenu.length) {
                return menuItem;
            }
        }
        return null;
    }

    /**
     * This function generates the root menu item `SimpleReports`.
     * @param {object} user - The user object.
     * @returns {object} Newly generated `SimpleReports` item.
     */
    function menuRootReportsMenuItemGenerate(user) {
        const
            historyAdapterId = configOptions.getOption(cfgHistoryAdapter, user),
            graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
            isGraphsEnabled = historyAdapterId && existsObject(`${graphsTemplatesFolder}.${graphsDefaultTemplate}`);
        menuItem = {
            name: translationsItemMenuGet(user, 'SimpleReports'),
            id: 'info',
            group: 'info',
            icon: 'ℹ️',
            submenu: new Array()
        };
        if ((user === null) || (user && user.userId && (MenuRoles.compareAccessLevels(usersInMenu.getMenuItemAccess(user.userId, menuItem.id), rolesAccessLevelForbidden) !== 0))) {
            const
                reportsList = enumerationsList[dataTypeReport].list,
                reportsIndex = Object.keys(reportsList).filter((key) => (reportsList[key].isEnabled)).sort((a, b) => (reportsList[a].order - reportsList[b].order));
            reportsIndex.forEach((reportId) => {
                if ((user === null) || (user && user.userId && (MenuRoles.compareAccessLevels(usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${reportId}`), rolesAccessLevelForbidden) < 0))) {
                    const currentReport = reportsList[reportId];
                    const subMenuRefresh = [{
                        name: `${translationsItemMenuGet(user, 'Refresh')}`,
                        icon: iconItemRefresh,
                        param: commandsPackParams(cmdItemJumpTo, ''),
                        group: 'refresh',
                        submenu: [],
                    }];
                    menuItem.submenu.push({
                        name: `${translationsGetEnumName(user, dataTypeReport, reportId)}`,
                        icon: currentReport.icon ? currentReport.icon : enumerationsList[dataTypeReport].icon,
                        function: simpleReportGenerate,
                        group: currentReport.group ? currentReport.group : menuButtonsDefaultGroup,
                        id: reportId,
                        submenu: isGraphsEnabled && currentReport.graphsEnabled ? (user, menuItemToProcess) => subMenuRefresh.concat(simpleReportMenuGenerateGraphs(user, menuItemToProcess)) : subMenuRefresh
                    });
                }
            });
            if (menuItem.submenu.length) {
                return menuItem;
            }
        }
        return null;
    }


    /**
     * This function generates the root menu item for appropriate `function`
     * or `destination`, depend on what is configured to be a first level items.
     * @param {object} user - The user object.
     * @param {string} enumerationType - The string defines the enumerationItem type.
     * @param {object} currentEnumeration - The list of menu items for the appropriate enumerationType.
     * @param {string} itemId - The Id of the menu item.
     * @param {string} nameDeclinationKey - The "declination" key for the Name (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
     * @param {boolean=} isDescendant - The indicator, if this menu item has a parent one.
     * @returns {object} Newly generated root menu item.
     */
    function menuRootEnumerationMenuItemGenerate(user, enumerationType, currentEnumeration, itemId, nameDeclinationKey, isDescendant) {
        if (isDescendant || (! itemId.includes('.')) ) {
            const
                currentItem = currentEnumeration[itemId],
                menuItem = {
                    icon: currentItem.icon,
                    id: isDescendant ? itemId.split('.').pop() : itemId,
                    [currentEnumId]: itemId,
                    descendants: new Array(),
                    group: currentItem.group ? currentItem.group : menuButtonsDefaultGroup,
                };
            if (currentItem.isExternal) {
                menuItem.name = stringCapitalize(translationsGetEnumName(user, enumerationType, itemId));
                menuItem.externalMenu = currentItem.state;
                menuItem.submenu = [];
            }
            else {
                menuItem.name = stringCapitalize(translationsGetEnumName(user, enumerationType, itemId, nameDeclinationKey));
                menuItem.submenu = menuFirstLevelMenuGenerate;
                const descendantIds = currentListIds.filter(itemListId => ((itemListId !== itemId) && (itemListId.indexOf(itemId) === 0)));
                descendantIds.forEach(itemDescendantId => {
                    const menuDescendantItem = menuRootEnumerationMenuItemGenerate(user, enumerationType, currentList, itemDescendantId, nameDeclinationKey, true);
                    if (menuDescendantItem) {
                        menuItem.descendants.push(menuDescendantItem);
                    }
                });
            }
            const menuItemAccessLevel = user && user.userId  ? usersInMenu.getMenuItemAccess(user.userId, itemId, (! currentItem.isExternal) && inverseMasks) : '';
            if ((menuItem.descendants.length > 0) || (user === null) || ((isMenuFastGeneration ) && menuItemAccessLevel && (MenuRoles.compareAccessLevels(menuItemAccessLevel, rolesAccessLevelForbidden) < 0))) {
                return menuItem;
            }
            else if (menuItemAccessLevel && (! MenuRoles.accessLevelsPreventToShow.includes(menuItemAccessLevel))) {
                if (typeOf(menuItem.submenu) === 'function') {
                    const subMenu = menuItem.submenu(user, menuItem);
                    if (subMenu.length) {
                        return menuItem;
                    }
                }
            }
        }
        return null;
    }



    // logs(`Done 0`);
    let menuItem;
    if ((topRootMenuItemId !== undefined) && (topRootMenuItemId !== null)) {
        switch (topRootMenuItemId) {
            case 'setup':
                menuItem = menuRootSetupMenuItemGenerate(user);
                break;

            case 'info':
                menuItem = menuRootReportsMenuItemGenerate(user);
                break;

            default:
                if (currentListIds.includes(topRootMenuItemId)) {
                    menuItem = menuRootEnumerationMenuItemGenerate(user, currentDataType, currentList, topRootMenuItemId, currentNameId);
                }
                break;
        }
    }
    if (menuItem) {
        rootMenu.submenu.push(menuItem);
    }
    else {
        currentListIds.forEach(itemId => {
            const menuItem = menuRootEnumerationMenuItemGenerate(user, currentDataType, currentList, itemId, currentNameId);
            if (menuItem) {
                rootMenu.submenu.push(menuItem);
            }
        });
        if (! isFunctionsFirst) {
            functionsListIds.filter(itemId => (functionsList[itemId].isExternal)).forEach(itemId => {
                const menuItem = menuRootEnumerationMenuItemGenerate(user, dataTypeFunction, functionsList, itemId, enumerationsNamesMany);
                if (menuItem) {
                    rootMenu.submenu.push(menuItem);
                }
            });
        }
        // logs(`Done 1`);
        menuItem = menuRootReportsMenuItemGenerate(user);
        if (menuItem && menuItem.submenu.length) {
            rootMenu.submenu.push(menuItem);
        }
        menuItem = menuRootSetupMenuItemGenerate(user);
        if (menuItem && menuItem.submenu.length) {
            rootMenu.submenu.push(menuItem);
        }
    }
    // logs(`Done`);
    return rootMenu;
}

/**
 * Generates menu item with confirmation subitem for the deletion of any menu
 * item, which will be processed by `cmdItemDeleteConfirm`.
 * @param {string} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {string} dataType - The type of the item, which will be deleted.
 * @param {*} dataItem - The primary item or collection of items identification.
 * @param {*=} dataId - The secondary id for the item.
 * @param  {...any} dataValues - The additional parameters of an item, required for the `cmdItemDeleteConfirm`
 * @returns {object} The menu item object {index:..., name:..., icon:..., param:..., submenu:[...]}.
 */
function menuDeleteItemMenuItemGenerate(user, upperMenuItemIndex, subMenuItemIndex, dataType, dataItem, dataId, ...dataValues) {
    // logs(`param = ${commandPackParams(cmdItemDeleteConfirm, dataType, dataItem, dataId, ...dataValues)}`, _l)
    return {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: `${translationsItemCoreGet(user, cmdItemDelete)}`,
        icon: iconItemDelete,
        group: cmdItemDelete,
        param: commandsPackParams(cmdItemDelete, dataType, dataItem, subMenuItemIndex, dataId, ...dataValues),
        submenu: [
            {
                index: `${upperMenuItemIndex}.${subMenuItemIndex}.0`,
                name: `${translationsItemCoreGet(user, cmdItemDeleteConfirm)}`,
                icon: iconItemDelete,
                //cfgItem, typeOfOption, subMenuIndex
                param: commandsPackParams(cmdItemDeleteConfirm, dataType, dataItem, dataId, ...dataValues),
                submenu: [],
            }
        ],
    };
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {...any} commandParams - The params to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., param:..., submenu:[...]}
 */
function menuRenameItemMenuItemGenerate(user, upperMenuItemIndex, subMenuItemIndex, ...commandParams) {
    return {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: `${translationsItemCoreGet(user, 'cmdItemRename')}`,
        icon: iconItemEdit,
        param: commandsPackParams(cmdGetInput, ...commandParams),
        submenu: [],
    };
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} itemGroup - The name of the menu item.
 * @param {...any} commandParams - The params to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., param:..., submenu:[...]}
 */
function menuEditItemMenuItemGenerate(user, upperMenuItemIndex, subMenuItemIndex, itemName, itemGroup, ...commandParams) {
    const result = {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: itemName,
        icon: iconItemEdit,
        param: commandsPackParams(cmdGetInput, ...commandParams),
        submenu: [],
    };
    if (itemGroup) result.group = itemGroup;
    return result;
}

/**
 * Generates menu item which call the user input for Add new item (i.e. set name).
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {...any} commandParams - The params to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., param:..., submenu:[...]}.
 */
function menuAddItemMenuItemGenerate(user, upperMenuItemIndex, subMenuItemIndex, ...commandParams) {
    return {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
        icon: iconItemPlus,
        param: commandsPackParams(cmdGetInput, ...commandParams),
        group: 'addNew',
        submenu: []
    };
}

/**
 * Generates menu item which call the reset for current menu item.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {...any} commandParams - The params to be processed by `cmdItemReset`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., param:..., submenu:[...]}.
 */
function menuResetItemMenuItemGenerate(user, upperMenuItemIndex, subMenuItemIndex, ...commandParams) {
    return {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: `${translationsItemCoreGet(user, cmdItemReset)}`,
        icon: iconItemReset,
        param: commandsPackParams(cmdItemReset, ...commandParams),
        group: 'reset',
        submenu: []
    };
}

/**
 * Generates two navigation menu items which will be  processed by `cmdItemJumpTo`.
 * @param {object} user - The user object.
 * @param {object[]} subMenu - The current level menu items array.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {number} currentItemIndex - The index of an item in the appropriate collection (array).
 * @param {number} lastItemIndex - The current max index in the appropriate collection (array) which holds an item.
 * @param {string=} groupId - The group Id for menu.
 * @param {boolean=} backwardOrder - If items is indexed from max to min.
 * @param {string=} leftItemMenuId - left menu item ID for non numeric index.
 * @param {string=} rightItemMenuId - left menu item ID for non numeric index.
 * @returns {[object[], number]} The array with an updated `subMenu` with new menu navigation items, processed by `cmdItemJumpTo`, and updated `subMenuItemIndex`.
 */
function menuNavigationLeftRightMenuPartGenerate(user, subMenu, upperMenuItemIndex, subMenuItemIndex, currentItemIndex, lastItemIndex, groupId, backwardOrder, leftItemMenuId, rightItemMenuId) {
    const currentItemSubIndex = upperMenuItemIndex.split('.').pop();
    if (currentItemSubIndex &&
        // @ts-ignore
        (! isNaN(currentItemSubIndex) || (leftItemMenuId || rightItemMenuId))) {
        if ((backwardOrder && (currentItemIndex < lastItemIndex)) || (!backwardOrder && (currentItemIndex > 0))) {
            subMenuItemIndex = subMenu.push({
                index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
                name: `${iconItemMoveLeft}`,
                param: commandsPackParams(cmdItemJumpTo, (leftItemMenuId ? [jumpToUp, leftItemMenuId] : [jumpToLeft]).join('.')),
                group: groupId === undefined ? cmdItemJumpTo : groupId,
                submenu: [],
            });
        }
        if ((backwardOrder && (currentItemIndex > 0)) || (!backwardOrder && (currentItemIndex < lastItemIndex))) {
            subMenuItemIndex = subMenu.push({
                index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
                name: `${iconItemMoveRight}`,
                param: commandsPackParams(cmdItemJumpTo, (rightItemMenuId ? [jumpToUp, rightItemMenuId] : [jumpToRight]).join('.')),
                group: groupId === undefined ? cmdItemJumpTo : groupId,
                submenu: [],
            });
        }
    }
    return [subMenu, subMenuItemIndex];
}

/**
 * Generates two menu items to move an item `up` and `down` in it's holder collection(array), which will be processed by `cmdItemMoveUp`/`cmdItemMoveDown`
 * @param {object} user - The user object.
 * @param {object[]} subMenu - The current level menu items array.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {number} currentItemIndex - The index of an item in the appropriate collection (array).
 * @param {number} lastItemIndex - The current max index in the appropriate collection (array) which holds an item.
 * @param {string=} groupId - The group Id for menu.
 * @param {...any} commandParams - The params, are required for  `cmdItemMoveUp`/`cmdItemMoveDown` to identify an item.
 * @returns {[object[], number]} The array with an updated `subMenu` with new menu items to move an item `up` and `down`, and updated `subMenuItemIndex`.
 */
function menuMoveItemUpDownMenuPartGenerate(user, subMenu, upperMenuItemIndex, subMenuItemIndex, currentItemIndex, lastItemIndex, groupId, ...commandParams) {
    if (currentItemIndex > 0) {
        subMenuItemIndex = subMenu.push({
            index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
            name: `${iconItemMoveUp}`,
            param: commandsPackParams(cmdItemMoveUp, ...commandParams),
            group: groupId === undefined ? 'moveItem' : groupId,
            submenu: [],
        });
    }
    if (currentItemIndex < lastItemIndex) {
        subMenuItemIndex = subMenu.push({
            index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
            name: `${iconItemMoveDown}`,
            param: commandsPackParams(cmdItemMoveDown, ...commandParams),
            group: groupId === undefined ? 'moveItem' : groupId,
            submenu: [],
        });
    }
    return [subMenu, subMenuItemIndex];
}


//*** menu items related functions - begin ***//

/**
 * This function generates a submenu for an appropriate first level item (`function` or `destination`).
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} Newly generated submenu.
 */
function menuFirstLevelMenuGenerate(user, menuItemToProcess) {
    const
        currentIndex = menuItemToProcess.parentId ? `${menuItemToProcess.parentId}.${menuItemToProcess.id}` : menuItemToProcess.id,
        isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
        primaryInputType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
        primaryMenuItemsList = enumerationsList[primaryInputType].list,
        primaryLevelMenuItemId = menuItemToProcess.parentId ? `${menuItemToProcess.parentId}.${menuItemToProcess.id}` : menuItemToProcess.id;
    let subMenu = [];
    // logs('primaryLevelMenuItemId = ' + JSON.stringify(primaryLevelMenuItemId), _l);
    if (primaryMenuItemsList.hasOwnProperty(primaryLevelMenuItemId)) {
        const
            primaryEnumId =  isFunctionsFirst ? 'funcEnum' : 'destEnum',
            secondaryEnumId =  isFunctionsFirst ? 'destEnum' : 'funcEnum',
            secondaryInputType = isFunctionsFirst ? dataTypeDestination : dataTypeFunction,
            namesCurrent = isFunctionsFirst ? enumerationsNamesMain : enumerationsNamesMany,
            isFunctionsFirstGlobal = configOptions.getOption(cfgMenuFunctionsFirst),
            inverseMasks = isFunctionsFirst !== isFunctionsFirstGlobal,
            primaryMenuItem = primaryMenuItemsList[primaryLevelMenuItemId],
            primaryState = primaryMenuItem.state,
            primaryStateSectionsCount = primaryState ? primaryState.split('.').length : 0,
            secondaryMenuItemsList = enumerationsList[secondaryInputType].list,
            secondaryMenuItemsIndex = Object.keys(secondaryMenuItemsList).filter((destId) => (secondaryMenuItemsList[destId].isEnabled && secondaryMenuItemsList[destId].isAvailable)).sort((a, b) => (secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)),
            deviceList = {};
        let
            currentIcons = isFunctionsFirst ? {on: primaryMenuItem.iconOn, off: primaryMenuItem.iconOff} : {},
            currentIcon = isFunctionsFirst ? primaryMenuItem.icon : '';
        // logs(`currentLevelMenuItemsList = ${JSON.stringify(currentLevelMenuItemsList)}`);
        if (menuItemToProcess.hasOwnProperty('descendants') && typeOf(menuItemToProcess.descendants, 'array') && menuItemToProcess.descendants.length) {
            const currentMenuItemDescendants = menuMakeMenuIndexed(menuItemToProcess.descendants, currentIndex);
            if (currentMenuItemDescendants && typeOf(currentMenuItemDescendants, 'array') && currentMenuItemDescendants.length)
                currentMenuItemDescendants.forEach(descendantItem => subMenu.push({...descendantItem, parentId: primaryLevelMenuItemId, group: 'descendants'}));
        }
        /** this way to find an objects only by function and then filter by dest/destEnum, is a ten times faster than include destEnum in search pattern
         like $(`state[id=*.${currentFunction.state}](${currentFunction.enum}=${currentFuncId})(${destsList[destId].enum}=${destId})`) */
        // logs(`state[id=*${isFunctionsFirst ? `.${primaryState}` : ''}](${primaryMenuItem.enum}=${currentMenuId})`);
        // logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess, null, 2)}`)
        $(`state[id=*${isFunctionsFirst ? `.${primaryState}` : ''}](${primaryMenuItem.enum}=${primaryLevelMenuItemId})`).each( (stateId) =>  {
            if (existsObject(stateId)) {
                const currentObject = getObject(stateId, '*');
                let shortStateId = primaryState ? stateId.split('.').slice(- primaryStateSectionsCount).join('.') : '';
                if (currentObject.hasOwnProperty('enumIds') ) {
                    secondaryMenuItemsIndex.forEach((currentLevelMenuItemId) => {
                        const currentLevelMenuItem = secondaryMenuItemsList[currentLevelMenuItemId];
                        if (! isFunctionsFirst ) shortStateId = stateId.split('.').slice(- currentLevelMenuItem.state.split('.').length).join('.');
                        //  logs(`\n shortStateId = ${shortStateId}, currentLevelMenuItemId = ${currentLevelMenuItemId}, currentLevelMenuItem = ${JSON.stringify(currentLevelMenuItem)}`, _l);
                        //  logs(`currentObject(${stateId})['enumIds'].includes(${enumsPrefix}.${secondaryMenuItemsList[currentLevelMenuItemId].enum}.${currentLevelMenuItemId}) = ${currentObject['enumIds'].includes(`enum.${secondaryMenuItemsList[currentLevelMenuItemId].enum}.${currentLevelMenuItemId}`)}`)
                        if ((isFunctionsFirst || (currentLevelMenuItem.state === shortStateId)) && currentObject['enumIds'].includes(`${prefixEnums}.${secondaryMenuItemsList[currentLevelMenuItemId].enum}.${currentLevelMenuItemId}`)) {
                            if (! deviceList.hasOwnProperty(currentLevelMenuItemId)) deviceList[currentLevelMenuItemId] = [];
                            if (! deviceList[currentLevelMenuItemId].includes(stateId)) deviceList[currentLevelMenuItemId].push(stateId);
                        }
                    });
                }
            }
        });
        // logs(`deviceList = ${JSON.stringify(deviceList, null, 2)}`, _l)
        Object.keys(deviceList).sort((a, b) => (secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)).forEach((currentLevelMenuItemId) => {
            if (currentLevelMenuItemId && currentLevelMenuItemId.includes('.')) {
                const [parentId, _descendantId] = currentLevelMenuItemId.split('.');
                if (! Object.keys(deviceList).includes(parentId)) {
                    deviceList[parentId] = [];
                }
            }
        });
        Object.keys(deviceList).sort((a, b) => (secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)).forEach((currentLevelMenuItemId) => {
            // logs(`currentLevelMenuItemId = ${JSON.stringify(currentLevelMenuItemId)}, deviceList[currentLevelMenuItemId] = ${deviceList[currentLevelMenuItemId]}`);
            // if (deviceList.hasOwnProperty(currentLevelMenuItemId)) {
            const
                menuItemId = `${primaryLevelMenuItemId}${rolesIdAndMaskDelimiter}${currentLevelMenuItemId}`,
                currentAccessLevel = user && user.userId ? usersInMenu.getMenuItemAccess(user.userId, menuItemId, inverseMasks) : undefined,
                functionId = isFunctionsFirst ? primaryLevelMenuItemId : currentLevelMenuItemId,
                destinationId = isFunctionsFirst ? currentLevelMenuItemId : primaryLevelMenuItemId;
            // logs(`primaryLevelMenuItemId = ${primaryLevelMenuItemId}, currentLevelMenuItemId = ${currentLevelMenuItemId}, currentAccessLevel = ${currentAccessLevel}`, _l);
            if (currentAccessLevel && (! MenuRoles.accessLevelsPreventToShow.includes(currentAccessLevel))) {
                const currentLevelMenuItem = secondaryMenuItemsList[currentLevelMenuItemId];
                if (! isFunctionsFirst)  {
                    currentIcons = {on: currentLevelMenuItem.iconOn, off: currentLevelMenuItem.iconOff};
                    currentIcon = currentLevelMenuItem.icon;
                }
                let currentMenuItem = {
                    index: `${currentIndex}.${currentLevelMenuItemId}`,
                    name: `${stringCapitalize(translationsGetEnumName(user, secondaryInputType, currentLevelMenuItemId, namesCurrent))}`,
                    icon: currentIcon,
                    id: currentLevelMenuItemId,
                    [primaryEnumId]: primaryLevelMenuItemId,
                    [secondaryEnumId]: currentLevelMenuItemId,
                    accessLevel: currentAccessLevel,
                    group: currentLevelMenuItem.group ? currentLevelMenuItem.group : menuButtonsDefaultGroup,
                    submenu: new Array()
                };
                const isStatesInFolders = isFunctionsFirst ? primaryMenuItem.statesInFolders : currentLevelMenuItem;
                // logs('deviceList[currentLevelMenuItemId] = ' + JSON.stringify(deviceList[currentLevelMenuItemId]));
                if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelForbidden) < 0 ) deviceList[currentLevelMenuItemId].forEach((deviceStateId, _deviceIndex) => {
                    const
                        idPrefix = deviceStateId.split('.').slice(0, isStatesInFolders ? -2 : -1).join('.'),
                        deviceId = idPrefix.split('.').pop();
                    logs(`stateId = ${JSON.stringify(deviceStateId)}`);
                    const deviceMenuItem = {
                        index: `${currentIndex}.${currentLevelMenuItemId}.${deviceId}`,
                        name: `${translationsGetObjectName(user, idPrefix, functionId, destinationId)}`,
                        state: deviceStateId,
                        type: menuItemToProcess.type,
                        id: menuItemId,
                        [primaryEnumId]: primaryLevelMenuItemId,
                        [secondaryEnumId]: currentLevelMenuItemId,
                        accessLevel: currentAccessLevel,
                        function: enumerationsDeviceAttributesMenuItemDetails,
                        icons: currentIcons,
                        icon: currentIcon,
                        submenu: enumerationsMenuGenerateDeviceButtons
                    };
                    logs('deviceMenuItem = ' + JSON.stringify(deviceMenuItem, null, 2));
                    currentMenuItem.submenu.push(deviceMenuItem);
                });
                if (((isFunctionsFirst && primaryMenuItem.simplifyMenuWithOneDevice) ||
                    ((! isFunctionsFirst) && (! currentLevelMenuItemId.includes('.')) && currentLevelMenuItem.simplifyMenuWithOneDevice)) &&
                    (currentMenuItem.submenu.length === 1)) {
                    if ((isFunctionsFirst && primaryMenuItem.simplifyMenuWithOneDevice && primaryMenuItem.showDestNameOnSimplify) ||
                        ((! isFunctionsFirst)  && currentLevelMenuItem.simplifyMenuWithOneDevice && currentLevelMenuItem.showDestNameOnSimplify)) {
                        currentMenuItem.submenu[0]['name'] = currentMenuItem.name;
                    }
                    currentMenuItem.submenu[0]['index'] = currentMenuItem.index;
                    currentMenuItem.submenu[0]['id'] = currentMenuItem.id;
                    currentMenuItem = currentMenuItem.submenu[0];
                }
                currentMenuItem.submenu = menuAddNavigationLeftRightToSubMenu(user, currentMenuItem.submenu);
                if (currentLevelMenuItemId.includes('.')) {
                    const [parentId, descendantId] = currentLevelMenuItemId.split('.');
                    let parentItem = subMenu.find(subMenuItem => ((subMenuItem[secondaryEnumId] === parentId)));
                    if (parentItem ) {
                        const parentSubMenu = parentItem.submenu;
                        currentMenuItem.parentId = parentId;
                        currentMenuItem.id = descendantId;
                        currentMenuItem.group += 'descendants';
                        let firstDeviceIndex = 0;
                        for(firstDeviceIndex; firstDeviceIndex < parentSubMenu.length; firstDeviceIndex++) {
                            if (! parentSubMenu[firstDeviceIndex].parentId) {
                                break;
                            }
                        }
                        if (firstDeviceIndex < parentSubMenu.length) {
                            parentItem.submenu.splice(firstDeviceIndex, 0, currentMenuItem);
                        }
                        else {
                            parentItem.submenu.push(currentMenuItem);
                        }
                        /** can be used, instead of checking item in GenMenuRowToProcess by last index part **/
                        // parentItem.submenu = makeMenuIndexed(parentItem.submenu, parentItem.index);
                    }
                }
                else {
                    subMenu.push(currentMenuItem);
                }
            }
            // }
        });
    }
    // logs(`subMenu Pre = ${JSON.stringify(subMenu, null, 1)}`, _l);
    if (subMenu.length) {
        for (const subMenuIndex of subMenu.keys()) {
            const currentSubMenu = subMenu[subMenuIndex].submenu;
            if (typeOf(currentSubMenu) === 'array' && (currentSubMenu.length === 0)) {
                delete subMenu[subMenuIndex];
            }
        }
        subMenu = subMenu.filter(item => (item));
        subMenu = menuAddNavigationLeftRightToSubMenu(user, subMenu);
    }
    // logs(`subMenu New = ${JSON.stringify(subMenu, null, 1)}`, _l);
    return subMenu;
}

/**
 * This function add navigation buttons to current sub menu.
 * @param {object} user - The user object.
 * @param {array} subMenu - The sub menu to process.
 * @returns {array} = The result sub menu.
 */
function menuAddNavigationLeftRightToSubMenu(user, subMenu) {
    if (typeOf(subMenu, 'array') && subMenu.length) {
        const subMenuMaxIndex = subMenu.length - 1;
        if (subMenuMaxIndex) {
            let _subSubMenuIndex = 0;
            subMenu.forEach((subMenuItem, subMenuItemIndex) => {
                // logs(`typeOf(subMenuItem.submenu) ${typeOf(subMenuItem.submenu)}`, _l);
                const nonNumberIndexes = [subMenuItemIndex > 0 ? subMenu[subMenuItemIndex - 1].index.split('.').pop() : undefined, subMenuItemIndex < subMenuMaxIndex ? subMenu[subMenuItemIndex + 1].index.split('.').pop() : undefined];
                if (typeOf(subMenuItem.submenu, 'array')) {
                    [subMenuItem.submenu, _subSubMenuIndex]  = menuNavigationLeftRightMenuPartGenerate(user, subMenuItem.submenu, subMenuItem.index, subMenuItem.submenu.length, subMenuItemIndex, subMenuMaxIndex, undefined, false, ...nonNumberIndexes);
                }
                else if (typeOf(subMenuItem.submenu, 'function')) {
                    subMenuItem.navigationParams = [subMenuItemIndex, subMenuMaxIndex, ...nonNumberIndexes];
                }
            });
        }
    }
    return subMenu;
}



/**
 * This function process the array with strings to create  multi-line string with fixed length of lines.
 * @param {object} user - The user object.
 * @param {object[]} linesArray - The input array of objects contained an formatted string and it's length modifier.
 * @returns {string} The result formatted string.
 */
function menuPrintFixedLengthLinesForMenuItemDetails(user, linesArray) {
    const maxLineLen = configOptions.getOptionWithModifier(cfgSummaryTextLengthMax, user);
    let printedText = '';
    linesArray.forEach(lineObject => {
        logs(`reportLineObject = ${JSON.stringify(lineObject)}`);
        let lineLabel = lineObject['label'];
        const
            lineValue = lineObject.hasOwnProperty('valueString') ? `${lineObject['valueString']}` : '',
            lineValueLength = lineValue.length + (lineObject.hasOwnProperty('lengthModifier') ? lineObject['lengthModifier'] : 0),
            lineLabelLengthMax = maxLineLen - lineValueLength;
        if (lineLabelLengthMax <= lineLabel.length) {
            lineLabel = `${lineLabel.slice(0, lineLabelLengthMax - 1)}:`;
        }
        else {
            lineLabel = `${lineLabel}:`.padEnd(lineLabelLengthMax);
        }
        printedText += `${printedText ? '\r\n' : ''}${lineLabel}${lineValue}`;
    });
    return printedText;
}


//*** menu items related functions - end ***//


/**
 * This function "executes" pressed menu item, so - it go from the root to the current menu item, prepared the
 * menu to the draw and then do one of the action:
 * - changes the ioBroker state,
 * - calling the Extension command,
 * - simple draw the submenu under menu item.
 * @param {object} user - The user object.
 * @param {string=} cmd - The command to execute.
 * @param {string[]=} cmdPos - The position of the menu item in the menu tree, each item of array describes the position of item on each level of hierarchy of menu.
 * @param {boolean=} clearBefore - The selector, to identify, is it needed to be previous message from Auto Telegram Menu cleared.
 * @param {boolean=} clearUserMessage - The selector to identify, should be user message to be deleted.
 * @param {boolean=} isSilent - The selector, how to inform user about message (show or not update of menu as a new message).
 * @param {boolean=} skipConfirmation - The selector, based on which the message about success will or will not be displayed.
 */
function menuProcessMenuItem(user, cmd, cmdPos, clearBefore, clearUserMessage, isSilent, skipConfirmation) {
    let timer;

    /**
     * This function is called, when the "execution" is finished successfully.
     * It displayed pop-up with result, and then redraw the menu.
     * @param {*=} resultMessage -(`string`) The string with a message about execution result.
     */
    function stateSetSuccessfully(resultMessage) {
        clearTimeout(timer);
        cachedSetValue(user, cachedCurrentState, '');
        cmdPos = cmdPos ? cmdPos.slice(0, cmdPos.length-1) : [];
        telegramMessagesDisplayPopUpMessage(user, resultMessage ? resultMessage : translationsItemTextGet(user, 'MsgSuccess'));
        menuClearCachedMenuItemsAndRows(user);
        menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
    }

    /**
     * This function "process" the received menu item, after it was prepared.
     * @param {*} _preparedMessageObject -(`object`) The prepared telegram message object (including buttons).
     * @param {*} menuItemToProcess -(`object`) The menu item, which have to be "processed".
     */
    function executeMenuItem(_preparedMessageObject, menuItemToProcess) {
        logs('cmdItem = ' + JSON.stringify(menuItemToProcess));
        if( (cmd) && (menuItemToProcess) && (menuItemToProcess.submenu.length === 0) && ! menuItemToProcess.hasOwnProperty('function')) {
            if ( menuItemToProcess.hasOwnProperty('state') && (menuItemToProcess.state)) {
                let [currState, possibleValue] = commandUnpackParams(menuItemToProcess.state);
                const currObject = getObject(currState);
                logs('currObject = ' + JSON.stringify(currObject));
                const _role = currObject.common['role'];
                if (currObject.common['write']) {
                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
                        console.error(`Error! No response for object ${currState}`);
                        cmdPos = cmdPos ? cmdPos.slice(0, cmdPos.length-1) : [];
                        menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
                    }, 4000);
                    cachedSetValue(user, cachedCurrentState, currState);
                    const currObjectType = currObject.common['type'];
                    if ((currObjectType === 'boolean') || (possibleValue !== undefined)) {
                        if (currObjectType === 'boolean') {
                            setState(currState, ! getState(currState).val, stateSetSuccessfully );
                        }
                        else if (currObject.common.hasOwnProperty('states') && (['string','number'].includes(currObjectType) )) {
                                const currObjectStates = enumerationsExtractPossibleValueStates(currObject.common['states']);
                                logs('possibleValue = ' + JSON.stringify(possibleValue));
                                logs('Object.keys(states). = ' + JSON.stringify(Object.keys(currObjectStates)));
                                if (Object.keys(currObjectStates).includes(possibleValue) ) {
                                    setState(currState, currObjectType === 'number' ? Number(possibleValue) : possibleValue, stateSetSuccessfully);
                                }
                                else {
                                    console.error(`Value '${possibleValue}' not in the acceptable list ${JSON.stringify(Object.keys(currObjectStates))}`);
                                    telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgValueNotInTheList'));
                                    clearTimeout(timer);
                                }
                        }
                        else if ((currObjectType === 'number')) {
                            const possibleNumber = Number(possibleValue);
                            const currObjectStep = Number(currObject.common.hasOwnProperty('step') ? currObject.common['step'] : 1);
                            if (((! currObject.common.hasOwnProperty('min')) || (possibleNumber >= Number(currObject.common['min']))) &&
                                ((! currObject.common.hasOwnProperty('max')) || (possibleNumber <= Number(currObject.common['max']))) &&
                                ((possibleNumber % currObjectStep) == 0 )) {
                                setState(currState, possibleNumber, stateSetSuccessfully);
                            }
                            else {
                                console.error(`Unacceptable value '${possibleNumber}' for object conditions ${JSON.stringify(currObject.common)}`);
                                telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                                clearTimeout(timer);
                            }
                        }
                        else {
                            clearTimeout(timer);
                            console.error(`Unsupported object type: '${currObjectType}'`);
                            telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgUnsupportedObjectType'));
                        }
                    }
                    else {
                        clearTimeout(timer);
                        cmdPos = cmdPos ? cmdPos.slice(0, cmdPos.length-1) : [];
                        console.error(`Unacceptable value '${possibleValue}' for object conditions ${JSON.stringify(currObject.common)}`);
                        telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                        menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
                    }
                }
            }
            else if ( menuItemToProcess.hasOwnProperty('externalCommand') && (menuItemToProcess.externalCommand !== undefined)) {
                logs('cmdItem = ' + JSON.stringify(menuItemToProcess));
                clearTimeout(timer);
                timer = setTimeout(function() {
                    telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
                    console.error(`Error! No response for external command ${JSON.stringify(menuItemToProcess)}`);
                    cmdPos = cmdPos ? cmdPos.slice(0, cmdPos.length-1) : [];
                    menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
                }, configOptions.getOption(cfgExternalMenuTimeout) + 10);
                messageTo(menuItemToProcess.externalCommand, {user, data: menuItemToProcess.hasOwnProperty('externalCommandParams') ? menuItemToProcess.externalCommandParams : undefined, funcEnum: menuItemToProcess.funcEnum, translations: translationsGetForExtension(user, menuItemToProcess.funcEnum)}, {timeout: configOptions.getOption(cfgExternalMenuTimeout)}, function externalCommandExecuted(result){
                    if (result.success) {
                        stateSetSuccessfully();
                    }
                    else {
                        stateSetSuccessfully(result.error);

                    }
                });

            }
            else {
                if (! skipConfirmation) telegramMessagesDisplayPopUpMessage(user);
                menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
            }
        }
        else {
            logs('cmdPos 2 = ' + JSON.stringify(cmdPos));
            if (! skipConfirmation) telegramMessagesDisplayPopUpMessage(user);
            menuDrawMenuItem(user, cmdPos, clearBefore, clearUserMessage, isSilent);
        }
    }

    if ((cmd !== undefined) && (cmd !== null)) {
        cmdPos = menuExtractMenuItemPosition(cmd);
    }
    else {
        if ((cmdPos === undefined ) || (cmdPos === null)) {
            cmdPos = cachedExistsValue(user, cachedMenuItem) ?  cachedGetValue(user, cachedMenuItem) : [];
        }
    }
    // logs(`cmd = ${cmd}, cmdPos = ${JSON.stringify(cmdPos)}`);
    user.rootMenu = menuMakeMenuIndexed(menuRootMenuItemGenerate(user, cmdPos && cmdPos.length ? cmdPos[0] : undefined ));
    // logs('user.rootMenu = ' + JSON.stringify(user.rootMenu), 1);
    menuGetMenuRowToProcess(user, user.rootMenu, cmdPos ? [...cmdPos] : [], null, '', executeMenuItem);
}




/**
 * This function draw menu item.
 * @param {object} user - The user object.
 * @param {string[]=} itemPos - The position of the menu item in the menu tree, each item of array describes the position of item on each level of hierarchy of menu.
 * @param {boolean=} clearBefore - The selector, to identify, is it needed to be previous message from Auto Telegram Menu cleared.
 * @param {boolean=} clearUserMessage - The selector to identify, should be user message to be deleted.
 * @param {boolean=} isSilent - The selector, how to inform user about message (show or not update of menu as a new message).
 */
function menuDrawMenuItem(user, itemPos, clearBefore, clearUserMessage, isSilent) {

    /**
     * This function "draw" the received menu item, after it was prepared.
     * @param {*} preparedMessageObject -(`object`) The prepared telegram message object (including buttons).
     * @param {*} _menuItemToProcess -(`object`) The menu item, which have to be "drawn".
     */
    function drawPreparedMenuItem(preparedMessageObject, _menuItemToProcess) {
        // logs(`preparedMessageObject = ${JSON.stringify(preparedMessageObject, null, 2)}`, _l);
        // logs(`subMenuRow = ${JSON.stringify(menuItemToProcess, null, 2)}`);
        preparedMessageObject.buttons = menuSplitButtonsArrayIntoButtonsPerRowsArray(user, preparedMessageObject.buttons);
        let lastRow = [{ text: translationsItemCoreGet(user, cmdClose), callback_data: `${cmdClose}${user.userId ? `${itemsDelimiter}${user.userId}` : ''}` }];
        if(preparedMessageObject.backIndex !== undefined) {
            if (configOptions.getOption(cfgShowHomeButton, user)) {
                lastRow.unshift({ text: translationsItemCoreGet(user, cmdHome), callback_data: cmdHome });
            }
            lastRow.unshift({ text: translationsItemCoreGet(user, cmdBack), callback_data: cmdBack + preparedMessageObject.backIndex});
        }
        preparedMessageObject.buttons.push(lastRow);
        // logs(`preparedMessageObject.buttons = ${JSON.stringify(preparedMessageObject.buttons, null, 2)}`, _l);
        telegramMessagesFormatAndPushToQueueMessage(user, preparedMessageObject, clearBefore, clearUserMessage, ! cachedGetValue(user, cachedMenuOn), isSilent);
    }

    if (itemPos === undefined) {
        itemPos = cachedGetValue(user, cachedMenuItem);
    }
    cachedSetValue(user, cachedMenuItem, itemPos);
    logs('itemPos = ' + JSON.stringify(itemPos));
    menuGetMenuRowToProcess(user, user.rootMenu, itemPos ? [...itemPos] : [], null, '', drawPreparedMenuItem);
}

const
    cachedMenuItemsAndRows = 'menuItemsAndRows';

/**
 * This function deletes the cached pre-drawn state of the user's menu items and rows.
 * @param {object} user - The user that is currently logged in.
 */
function menuClearCachedMenuItemsAndRows(user) {
    cachedDelValue(user, cachedMenuItemsAndRows);
}

const cachedMenuLongCommandsWithParams = 'longCommandsWithParams';
const cachedMenuButtonsOffset = 'buttonsOffset';


/**
 * This function go from the root level down to the target menu item (by `targetMenuPos`) iterative way, filling on each turn the appropriate information, as to the
 * text part of Telegram message, as for the buttons part, to prepare it for "draw" to user.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which have to be processed, to reach the final destination item by `targetMenuPos`.
 * @param {string[]} targetMenuPos - The position of the menu item in the menu tree, each item of array describes the position of item on each level of hierarchy of menu.
 * @param {object} preparedMessageObject - The prepared for "draw" the Telegram message object related to the the `targetMenuPos`. Will be filled additionally on each iteration.
 * @param {string} currentIndent - The current indent on this step of iteration for the text part of Telegram message.
 * @param {function} callback - The function, which will receive a result of calculation - function(preparedMessageObject, menuItemToProcess).
 */
function menuGetMenuRowToProcess(user, menuItemToProcess, targetMenuPos, preparedMessageObject, currentIndent, callback) {
    logs('user = ' + JSON.stringify(user));
    logs('currentMenuItem = ' + JSON.stringify(menuItemToProcess));
    logs('currentMenuPos = ' + JSON.stringify(targetMenuPos));
    logs('preparedMessageObject = ' + JSON.stringify(preparedMessageObject, null, 2));
    logs('currentTab = ' + JSON.stringify(currentIndent));
    logs('callback = ' + JSON.stringify(callback));
    if (! preparedMessageObject) {
        const
            [savedMenu, savedRows, savedTab] = cachedExistsValue(user, cachedMenuItemsAndRows) ?  cachedGetValue(user, cachedMenuItemsAndRows) : [null, null, 0],
            savedPos = savedMenu && savedMenu.index ? savedMenu.index.split('.') : null;
        logs(`currentMenuPos: ${JSON.stringify(targetMenuPos)}, savedPos: ${JSON.stringify(savedPos)}, savedMenu: ${JSON.stringify(savedMenu)}`);
        if (savedPos && (targetMenuPos.join('.').indexOf(savedPos.join('.')) === 0)) {
            targetMenuPos = targetMenuPos.slice(savedPos.length);
            menuItemToProcess = savedMenu;
            preparedMessageObject = {...savedRows};
            currentIndent = savedTab;
            logs(`New subMenuPos: ${JSON.stringify(targetMenuPos)}, preparedMessageObject: ${JSON.stringify(preparedMessageObject)}`);
        }
        else {
            preparedMessageObject = {
                menutext: '',
                state: '',
                buttons: []
            };
        }
    }
    if (menuItemToProcess.externalMenu) {
        messageTo(menuItemToProcess.externalMenu, {user, data: menuItemToProcess, funcEnum: menuItemToProcess.funcEnum, translations: translationsGetForExtension(user, menuItemToProcess.funcEnum)}, {timeout: configOptions.getOption(cfgExternalMenuTimeout)}, function subMenuUpdated(subMenu){
            // logs(`menuItemToProcess.externalMenu = ${menuItemToProcess.externalMenu}, \n subMenu = ${JSON.stringify(subMenu)}, \n translations = ${JSON.stringify(translationsGetForExtension(user, menuItemToProcess.funcEnum))}`, _l);
            if ( ! ((typeof(subMenu) === 'object') && ( subMenu.hasOwnProperty('error'))) && subMenu.hasOwnProperty('name')) {
                logs(`subMenu = ${JSON.stringify(subMenu, null, 2)}`);
                menuItemToProcess = menuMakeMenuIndexed(subMenu);
                logs(`subMenuRow = ${JSON.stringify(menuItemToProcess, null, 2)}`);
            }
            else {
                if ((typeof(subMenu) === 'object') && subMenu.hasOwnProperty('error')) {
                    console.warn(`Can't update subMenu from externalMenu ${menuItemToProcess.externalMenu}! No result. Error is ${subMenu.error}`);
                }
                targetMenuPos = [];
            }
            menuItemToProcess.externalMenu = null;
            menuGetMenuRowToProcess(user, menuItemToProcess, targetMenuPos, preparedMessageObject, currentIndent, callback);
        });
    }
    else if (menuItemToProcess.submenu && (typeof(menuItemToProcess.submenu) === 'function')) {
        logs('currentMenuItem.submenu = ' + JSON.stringify(menuItemToProcess.submenu));
        menuItemToProcess.submenu = menuItemToProcess.submenu(user, menuItemToProcess);
        logs('currentMenuItem = ' + JSON.stringify(menuItemToProcess));
        logs('currentMenuItem.submenu = ' + JSON.stringify(menuItemToProcess.submenu));
        menuGetMenuRowToProcess(user, menuItemToProcess, targetMenuPos, preparedMessageObject, currentIndent, callback);
    }
    else {
        const hierarchicalCaption = configOptions.getOption(cfgHierarchicalCaption, user);
        if (hierarchicalCaption) {
            currentIndent = currentIndent.padStart(currentIndent.length + hierarchicalCaption);
        }
        let currentSubMenuPos;
        // logs('currentMenuItem = ' + JSON.stringify(currentMenuItem, null, 2));
        if ((menuItemToProcess.submenu.length > 0) && (targetMenuPos.length > 0)) {
            logs(`typeof(currentMenuPos[0]) = ${typeof(targetMenuPos[0])}`);
            logs(`Number(currentMenuPos[0]) = ${Number(targetMenuPos[0])}`);
            logs(`(typeof(currentMenuPos[0]) === 'string') && (Number(currentMenuPos[0]) == NaN) = ${(typeof(targetMenuPos[0]) === 'string') && isNaN(Number(targetMenuPos[0]))}`);
            currentSubMenuPos = targetMenuPos.shift();
            if ((typeof(currentSubMenuPos) === 'string') && isNaN(Number(currentSubMenuPos))) {
                logs(`currentMenuItem.submenu = ${JSON.stringify(menuItemToProcess.submenu)}`);
                currentSubMenuPos = menuItemToProcess.submenu.findIndex((item) => {
                    logs(`item = ${JSON.stringify(item)}`);
                    return ((item.hasOwnProperty('id') && item.id === currentSubMenuPos) || (item.index.split('.').pop() === currentSubMenuPos));
                });
                logs(`currentSubMenuPos = ${JSON.stringify(currentSubMenuPos)}`);
            }
        }
        if ((currentSubMenuPos !== undefined) && (currentSubMenuPos >= 0) && (menuItemToProcess.submenu.length > 0) && (currentSubMenuPos < menuItemToProcess.submenu.length)) {
            logs(`currentSubMenuPos = ${currentSubMenuPos}, currentMenuItem = ${JSON.stringify(menuItemToProcess, null, 2)}`);
            preparedMessageObject.menutext += (hierarchicalCaption ? '\n\r' + (preparedMessageObject.menutext ? currentIndent + iconItemToSubItem : ''): (preparedMessageObject.menutext ? ' ' + iconItemToSubItemByArrow + ' ' : ''))  + menuGetMenuItemIcon(user, menuItemToProcess) + menuItemToProcess.name;
            const subMenuItem = menuItemToProcess.submenu[currentSubMenuPos];
            logs(`subMenuItem = ${JSON.stringify(subMenuItem, null, 2)}`);
            preparedMessageObject.name = subMenuItem.hasOwnProperty('name') ? subMenuItem.name : undefined;
            logs(`(1) subMenuRow.submenu[${currentSubMenuPos}] = ${JSON.stringify(subMenuItem)}`);
            preparedMessageObject.function = subMenuItem.hasOwnProperty('function') ? subMenuItem.function : undefined;
            preparedMessageObject.state = subMenuItem.hasOwnProperty('state') ? subMenuItem.state : undefined;
            preparedMessageObject.type = subMenuItem.hasOwnProperty('type') ? subMenuItem.type : undefined;
            preparedMessageObject.destEnum = subMenuItem.hasOwnProperty('destEnum') ? subMenuItem.destEnum : undefined;
            preparedMessageObject.funcEnum = subMenuItem.hasOwnProperty('funcEnum') ? subMenuItem.funcEnum : undefined;
            menuGetMenuRowToProcess(user, subMenuItem, targetMenuPos, preparedMessageObject, currentIndent, callback);
        }
        else {
            logs(`currentMenuItem 2 = ${JSON.stringify(menuItemToProcess/* , null, 2 */)}`);
            logs(`preparedMessageObject 2 = ${JSON.stringify(preparedMessageObject/* , null, 2 */)}`);
            logs(`currentMenuPos 2 = ${JSON.stringify(targetMenuPos/* , null, 2 */)}`);
            logs(`currentSubMenuPos = ${JSON.stringify(currentSubMenuPos/* , null, 2 */)}`);
            if (currentSubMenuPos >= menuItemToProcess.submenu.length) {
                let savedPos = cachedGetValue(user, cachedMenuItem);
                logs(`savedPos = ${JSON.stringify(savedPos/* , null, 2 */)}`);
                if (targetMenuPos.length) {
                    for (let i = targetMenuPos.length -1; i >=0 ; i-- ) {
                        if (savedPos[savedPos.length - 1] === targetMenuPos[i]) {
                            savedPos.pop();
                        }
                    }
                }
                if (savedPos[savedPos.length - 1] === currentSubMenuPos) {
                    savedPos.pop();
                }
                cachedSetValue(user, cachedMenuItem, savedPos);
                logs(`savedPos 2 = ${JSON.stringify(savedPos/* , null, 2 */)}`);
            }
            if (menuItemToProcess.submenu.length) {
                cachedSetValue(user, cachedMenuItemsAndRows, [menuItemToProcess, {...preparedMessageObject}, currentIndent]);
            }
            preparedMessageObject.menutext += (hierarchicalCaption ? '\n\r' + (preparedMessageObject.menutext ? currentIndent + iconItemToSubItem : ''): (preparedMessageObject.menutext ? ` ${iconItemToSubItemByArrow} ` : ''))  + menuGetMenuItemIcon(user, menuItemToProcess) + menuItemToProcess.name;
            preparedMessageObject.buttons = [];
            const
                currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                currentBackIndex = currentIndex ? currentIndex.split('.').slice(0, -1).join('.') : '' ,
                maxButtonsCount = configOptions.getOption(cfgMaxButtonsOnScreen, user);
            let buttonsCount = menuItemToProcess.submenu.length;
            let buttonsOffset = 0;
            if (buttonsCount > maxButtonsCount) {
                if (cachedExistsValue(user, cachedMenuButtonsOffset)) {
                    if (currentIndex) cachedAddToDelCachedOnBack(user, currentBackIndex, cachedMenuButtonsOffset);
                    const [forIndex, currentOffset] = commandUnpackParams(cachedGetValue(user, cachedMenuButtonsOffset));
                    if (currentIndex === forIndex) {
                        buttonsOffset = Number(currentOffset);
                        buttonsCount = buttonsCount - buttonsOffset;
                    }
                    else {
                        cachedDelValue(user, cachedMenuButtonsOffset);
                    }
                }
            }
            if (currentIndex) preparedMessageObject.backIndex = currentBackIndex;
            // logs(`buttonsOffset = ${buttonsOffset}, buttonsCount = ${buttonsCount}, maxButtonsCount = ${maxButtonsCount}`);
            const
                isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
                callbackDataToCache = new Map();
            // currentMenuItem.submenu.forEach(currentSubMenuItem => {
            for (let buttonsIndex = 0; buttonsIndex < (buttonsCount > maxButtonsCount ? maxButtonsCount : buttonsCount); buttonsIndex++) {
                const currentSubMenuItem = menuItemToProcess.submenu[buttonsIndex + buttonsOffset];
                // logs(`currentSubMenuItem[${buttonsIndex + buttonsOffset}] = ${JSON.stringify(currentSubMenuItem, null, 2)}`);
                logs(`getIndex(subMenuItem.name) = ${currentIndex}`);
                const currentSubIndex = currentSubMenuItem.index;
                let callbackData = menuItemButtonPrefix + currentSubIndex;
                if (currentSubMenuItem.hasOwnProperty('param') && (typeof(currentSubMenuItem.param) === 'string') && (currentSubMenuItem.param.indexOf(cmdPrefix) === 0) && (currentSubMenuItem.param !== cmdPrefix)) {
                    if (currentSubMenuItem.param.length > 64) {
                        callbackDataToCache.set(currentSubIndex, currentSubMenuItem.param);
                        callbackData = commandsPackParams(cmdCached, currentSubIndex);
                    }
                    else {
                        callbackData = currentSubMenuItem.param;
                    }
                }
                if (callbackData.length > 64) {
                    console.error(`Callback_data max possible length exceed! subMenuItem: \n${JSON.stringify(currentSubMenuItem, null, 2)}`);
                    callbackData = cmdNoOperation;
                }
                const
                    currentObject = currentSubMenuItem.destEnum && currentSubMenuItem.state && currentSubMenuItem.funcEnum ? getObject(currentSubMenuItem.state) : undefined,
                    currentValue =  currentObject && (currentObject.common['type'] !== 'boolean') ? ` (${enumerationsStateValueDetails(user, currentObject, currentSubMenuItem.funcEnum).valueString})`: '',
                    currentIcon = (currentValue && isFunctionsFirst) ? '' :  menuGetMenuItemIcon(user, currentSubMenuItem);
                preparedMessageObject.buttons.push({
                    text:  `${currentIcon}${currentSubMenuItem.name}${currentValue}`,
                    icon: currentIcon,
                    group: currentSubMenuItem.group ? currentSubMenuItem.group : menuButtonsDefaultGroup,
                    callback_data: callbackData
                });
            }
            if (buttonsOffset > 0) {
                preparedMessageObject.buttons.push({
                    text:  `${iconItemFastLeft}${translationsItemMenuGet(user, 'Prev')} (${buttonsOffset/maxButtonsCount})`,
                    icon: iconItemFastLeft,
                    group: 'offset',
                    callback_data: commandsPackParams(cmdSetOffset, currentIndex, buttonsOffset - maxButtonsCount)
                });
            }
            if (buttonsCount > maxButtonsCount) {
                preparedMessageObject.buttons.push({
                    text:  `${iconItemFastRight}${translationsItemMenuGet(user, 'Next')} (${Math.ceil(buttonsCount/maxButtonsCount) - 1})`,
                    icon: iconItemFastRight,
                    group: 'offset',
                    callback_data: commandsPackParams(cmdSetOffset, currentIndex, buttonsOffset + maxButtonsCount)
                });
            }
            // logs(`callbackDataToCache = ${JSON.stringify(callbackDataToCache, mapReplacer)}`);
            if (callbackDataToCache.size) {
                // logs(`callbackDataToCache.size = ${callbackDataToCache.size}`);
                cachedSetValue(user, cachedMenuLongCommandsWithParams, callbackDataToCache);
            }
            if ( preparedMessageObject.hasOwnProperty('function') && (typeof preparedMessageObject.function === "function") ) {
                const functionResult = preparedMessageObject.function(user, menuItemToProcess);
                if (typeof functionResult === 'string') {
                    preparedMessageObject.menutext += functionResult.length > 0 ? '\r\n' + functionResult : '';
                }
            }
            else if (menuItemToProcess.hasOwnProperty('text') && (menuItemToProcess.text !== undefined)) {
                preparedMessageObject.menutext += menuItemToProcess.text.length > 0 ? menuItemToProcess.text : '';
            }
            logs(`preparedMessageObject 3 = ${JSON.stringify(preparedMessageObject/* , null, 2 */)}`);
            callback(preparedMessageObject, menuItemToProcess);
        }
    }
}

/**
 * This function checks the availability of menu item(device) via `availableState` property of `function`.
 * @param {string|object} currentFunction - The id or full definition object of current `function`.
 * @param {string} primaryStateFullId - The full id of the primary state of the menu item(device).
 * @returns {boolean} The availability status.
 */
function menuItemIsAvailable(currentFunction, primaryStateFullId ) {
    if (typeOf(currentFunction, 'string')) {
        currentFunction = enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunction) ? enumerationsList[dataTypeFunction].list[currentFunction] : undefined;
    }
    else if (! typeOf(currentFunction, 'object')) {
        currentFunction = null;
    }
    let result = true;
    if (currentFunction && currentFunction.hasOwnProperty('availableState')) {
        const currentFunctionAvailableStateId = currentFunction.availableState;
        if (currentFunctionAvailableStateId && primaryStateFullId) {
            const currentItemAvailableStateId = [...primaryStateFullId.split('.').slice(0, currentFunction.statesInFolders ? -2 : -1), currentFunctionAvailableStateId].join('.');
            if (existsState(currentItemAvailableStateId)) {
                const currentItemAvailableState = getState(currentItemAvailableStateId);
                if (currentItemAvailableState && currentItemAvailableState.hasOwnProperty('val')) {
                    result = currentItemAvailableState.val;
                }
            }
        }
    }
    return result;
}

/**
 * This function checks if the menu item has an `icons` property that is an object, then use the on or off icon depending
 * on the state value. In case if `icons` property that is a function, then call the function and use the return value.
 * Otherwise, use the `icon` property.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which have to be processed, to reach the final destination item by `targetMenuPos`.
 * @returns {string} The icon of the menu item.
 */
function menuGetMenuItemIcon(user, menuItemToProcess) {
    // logs(`\nsubMenuRowItem = ${JSON.stringify(menuItemToProcess)}`, _l);
    let icon = menuItemToProcess.icon ? menuItemToProcess.icon : '';
    if (menuItemToProcess !== undefined) {
        const currentFunction = menuItemToProcess.hasOwnProperty('funcEnum') && enumerationsList[dataTypeFunction].list.hasOwnProperty(menuItemToProcess.funcEnum) ? enumerationsList[dataTypeFunction].list[menuItemToProcess.funcEnum] : undefined;
        if (currentFunction && menuItemToProcess.hasOwnProperty('state') && menuItemToProcess.state) {
            if (! menuItemIsAvailable(currentFunction, menuItemToProcess.state)) icon = iconItemUnavailable;
        }
        if (icon !== iconItemUnavailable) {
            if (typeOf(menuItemToProcess.icons,'object')) {
                if (menuItemToProcess.hasOwnProperty('state') && existsObject(menuItemToProcess.state) && (getObject(menuItemToProcess.state).common.type === 'boolean')) {
                    icon = existsState(menuItemToProcess.state) ? (getState(menuItemToProcess.state).val ? menuItemToProcess.icons.on : menuItemToProcess.icons.off) : menuItemToProcess.icons.off;
                }
            }
            else if (typeOf(menuItemToProcess.icons, 'function')) {
                icon = menuItemToProcess.icons(user, menuItemToProcess);
            }
        }
    }
    return icon;
}

/**
 * This function extract the target menu item position as an array of "coordinates" from string.
 * @param {string} menuItemPositionString - The string, contained the "coordinates" in format 1.2.3.4".
 * @return {string[]} - The "coordinates" Array in format [1, 2, 3, 4].
 */
function menuExtractMenuItemPosition(menuItemPositionString) {
    logs('typeof cmd = ' + (typeof menuItemPositionString));
    logs('cmd = ' + JSON.stringify(menuItemPositionString));
    if (typeof menuItemPositionString === 'string') {
        if (menuItemPositionString.length === 0) {
            return [];
        }
        else {
            return menuItemPositionString.split('.');
        }
    }
    else {
        return [];
    }

}

/**
 * This function clear Telegram message with Auto Telegram Menu, stores it's status as closed and clears appropriate cache values.
 * @param {object} user - The user object.
 */
function menuCloseMenu(user) {
    telegramMessagesClearCurrentMessage(user, false);
    cachedSetValue(user, cachedMenuOn, false);
    cachedDelValue(user, cachedMenuItem);
}

/**
 * This function, in case of the schedule for menu update is enabled in configuration, go thru all users, and checks the current open by user menu item for updates.
 * In case of it consists new information - it will be "redrawn".
 */
function menuUpdateMenuBySchedule() {
    const usersIds = usersInMenu.getUsers();
    for (const userId of usersIds) {
        logs('user = ' + JSON.stringify(userId));
        const user = telegramUsersGenerateUserObjectFromId(userId);
        if (cachedGetValue(user, cachedMenuOn) === true) {
            const itemPos = cachedGetValue(user, cachedMenuItem);
            logs('for user = ' +JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
            if ( (! cachedGetValue(user, cachedIsWaitForInput)) && (itemPos !== undefined)) {
                logs('make an menu update for = ' + JSON.stringify(user));
                // doMenuItem(user);
            }
        }
        else {
            logs('for user = ' +JSON.stringify(userId) + ' menu is closed');
        }
    }
}



/**
 * This function schedule a renew of the Telegram message, which consists a Auto Telegram Menu, to avoid the time limitation for the bots to edit their own messages.
 * @param {string} atTime - The time of the day as string in the format of 'hh:mm'.
 * @param {number=} idOfUser - The user's id.
 */
function menuScheduleMenuMessageRenew(atTime, idOfUser) {
    if ((! idOfUser) || (idOfUser && usersInMenu.validId(idOfUser))) {
        if (idOfUser && menuRefreshScheduled.has(idOfUser) && menuRefreshScheduled.has(menuRefreshTimeAllUsers) && (menuRefreshScheduled.get(menuRefreshTimeAllUsers).atTime === atTime)) {
            clearSchedule(menuRefreshScheduled.get(idOfUser).reference);
            menuRefreshScheduled.delete(idOfUser);
        }
        else {
            const currentUser = idOfUser ? idOfUser : menuRefreshTimeAllUsers;
            const scheduledRefresh = menuRefreshScheduled.has(currentUser) ?  menuRefreshScheduled.get(currentUser) : {atTime: '', reference: null};
            if (scheduledRefresh.atTime !== atTime) {
                if (scheduledRefresh.reference) clearSchedule(scheduledRefresh.reference);
                const atTimeArray = atTime.split(':');
                scheduledRefresh.atTime = atTime;
                scheduledRefresh.reference = schedule({hour: atTimeArray.shift(), minute: atTimeArray.pop()},
                    () => {
                            console.log(`Refresh is scheduled on ${atTime} for ${currentUser === menuRefreshTimeAllUsers ? 'all users' :` userId = ${currentUser}`}.`);
                            menuRenewMenuMessage(currentUser === idOfUser ? idOfUser : menuRefreshTimeAllUsers);
                        }
                );
                menuRefreshScheduled.set(currentUser, scheduledRefresh);
            }
        }
    }
}

/**
 * This function refreshes the Telegram message for a particular user or for all, who have no personal
 * config item value `cfgUpdateMessageTime` set, including group chats.
 * @param {number} idOfUser - The user ID of the user to refresh the menu for. Can be empty, for all.
 * @param {boolean=} forceNow - The selector, to force the refresh for all users now, independently from configured value.
 */
function menuRenewMenuMessage(idOfUser, forceNow) {
    let userIds = (idOfUser !== menuRefreshTimeAllUsers) && usersInMenu.validId(idOfUser) ? [idOfUser] : usersInMenu.getUsers();
    // logs('userIds = ' + JSON.stringify(userIds), _l);
    if (idOfUser === menuRefreshTimeAllUsers) {
        userIds = userIds.concat(telegramGetGroupChats(true));
        // logs(`users = ${JSON.stringify(userIds)}`, _l);
    }
    userIds.forEach(userId => {
        // logs('userId = ' + JSON.stringify(userId), _l);
        if ((idOfUser == userId) || ((idOfUser === menuRefreshTimeAllUsers) && ((! menuRefreshScheduled.has(userId)) || forceNow))) {
            const user = telegramUsersGenerateUserObjectFromId(userId > 0 ? userId : undefined, userId > 0 ? undefined : userId);
            // logs('user = ' + JSON.stringify(user), _l);
            const
                [_lastBotMessageId48, isBotMessageOld48OrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48),
                [_lastBotMessageId24, isBotMessageOld24OrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta24),
                isCachedMenuOn = cachedGetValue(user, cachedMenuOn);
            if ((isCachedMenuOn === true) && (! isBotMessageOld48OrNotExists) && isBotMessageOld24OrNotExists) {
                const itemPos = cachedGetValue(user, cachedMenuItem);
                console.warn('for user = ' +JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
                if ( (! cachedGetValue(user, cachedIsWaitForInput)) && (itemPos !== undefined)) {
                    console.warn(`Make an menu refresh for user/chat group = ${JSON.stringify({...user, rootMenu : null})}`);
                    menuProcessMenuItem(user, undefined, itemPos, true, false, true);
                }
            }
            else if (! isBotMessageOld24OrNotExists) {
                console.warn(`For user/chat group = ${JSON.stringify({...user, rootMenu : null})} menu is updated(by new message) less the 24 hours ago. Menu refresh is not required.`);
            }
            else {
                console.warn(`For user/chat group = ${JSON.stringify({...user, rootMenu : null})} menu is closed(${!isCachedMenuOn}) or unaccessible(${isBotMessageOld48OrNotExists}). Can't refresh.`);
            }
            alertsHistoryClearOld(user);
        }
    });
}

/**
 * This function splits the input buttonsArray to the Array of buttons Arrays, based on configured `cfgSummaryTextLengthMax` and the buttons groups assignment.
 * @param {object} user - The user object.
 * @param {object[]} buttonsArray - The plain array with buttons objects.
 * @returns {array[]} The Array of Arrays of buttons objects, represented the rows.
 */
function menuSplitButtonsArrayIntoButtonsPerRowsArray(user, buttonsArray) {
    logs('menuArr = ' + JSON.stringify(buttonsArray));
    let resultArr = [];
    const
        defaultButtonKeys = ['text', 'callback_data'],
        maxTextLength = configOptions.getOptionWithModifier(cfgSummaryTextLengthMax, user);
    // logs(`maxTextLength = ${maxTextLength}`, _l);
    let
        buttonsRow = [],
        currentGroup = '';
    for (let i = 0; i < buttonsArray.length; i ++) {
        buttonsRow = [];
        logs('menuArr[ i = ' + i + ' ].length = ' + JSON.stringify(buttonsArray[i].text.length));
        let countLength = 0;
        for (let j = i; j < buttonsArray.length; j++) {
            const
                currentButton =  buttonsArray[j],
                currentLength = currentButton.text.length + (currentButton.icon ? 1 : 0);
                logs(`currentButton.text = ${currentButton.text}, currentButton.group = ${currentButton.group}, currentGroup = ${currentGroup}`);
            if (((countLength > 0) && ((countLength + currentLength) > maxTextLength)) || (currentGroup && (currentGroup !== currentButton.group)) ) {
                currentGroup = currentButton.group ? currentButton.group : menuButtonsDefaultGroup;
                logs(`currentGroup = ${currentGroup}`);
                if (countLength > 0)
                    break;
            }
            else {
                currentGroup = currentButton.group ? currentButton.group : menuButtonsDefaultGroup;
                countLength += currentLength + (countLength === 0 ? 0 : 3);
                Object.keys(currentButton).forEach(buttonKey => {if (! defaultButtonKeys.includes(buttonKey)) delete currentButton[buttonKey];});
                buttonsRow.push(currentButton);
                i = j;
            }
        }
        logs('i = ' + JSON.stringify(i));
        // logs('buttonsRow = ' + JSON.stringify(buttonsRow), _l);
        resultArr.push(buttonsRow);
    }
    // logs('resultArr = ' + JSON.stringify(resultArr, null, 2), _l);
    return resultArr;
}

/**
 * This function go thru the menu item with submenus or thru the submenu array and create a new one, with `index` property filled with string,
 * consist the each menu item "coordinates", based on the `indexPrefix`.
 * @param {object|object[]} inputMenu - The menu object or array of menu objects, which to be indexed.
 * @param {string=} indexPrefix - The index prefix for the current menu level.
 * @returns {object|object[]} Newly created menu item or submenu array.
 */
function menuMakeMenuIndexed(inputMenu, indexPrefix) {
    // logs('menuRow = ' + JSON.stringify(menuRow));
    logs('indexPrefix = ' + JSON.stringify(indexPrefix));
    let newMenuRow;
    if (Array.isArray(inputMenu)) {
        // indexPrefix = indexPrefix && indexPrefix.length > 0 ? indexPrefix + '.' : '';
        newMenuRow = [];
        for (const key of inputMenu.keys()) {
            let newMenuRowItem = {};
            // if ((indexPrefix.length === 0) && ! menuRow[key].hasOwnProperty('id')) {
            //     menuRow[key].id = menuRow[key].funcEnum;
            // }
            const indexSuffix = inputMenu[key].hasOwnProperty('id') && inputMenu[key].id && (! inputMenu[key].id.includes('.')) ? inputMenu[key].id : key;
            newMenuRowItem.index = indexPrefix && indexPrefix.length > 0 ? [indexPrefix, indexSuffix].join('.') : indexSuffix;
            newMenuRowItem.name = inputMenu[key].name;
            if (inputMenu[key].hasOwnProperty('id') ) {
                newMenuRowItem.id = inputMenu[key].id;
            }
            if (inputMenu[key].hasOwnProperty('accessLevel') ) {
                newMenuRowItem.accessLevel = inputMenu[key].accessLevel;
            }
            if (inputMenu[key].hasOwnProperty('state') ) {
                newMenuRowItem.state = inputMenu[key].state;
            }
            if (inputMenu[key].hasOwnProperty('group') ) {
                newMenuRowItem.group = inputMenu[key].group;
            }
            if (inputMenu[key].hasOwnProperty('icon') ) {
                newMenuRowItem.icon = inputMenu[key].icon;
            }
            if (inputMenu[key].hasOwnProperty('icons') ) {
                newMenuRowItem.icons = inputMenu[key].icons;
            }
            if (inputMenu[key].hasOwnProperty('type') ) {
                newMenuRowItem.type = inputMenu[key].type;
            }
            if (inputMenu[key].hasOwnProperty('funcEnum') ) {
                newMenuRowItem.funcEnum = inputMenu[key].funcEnum;
            }
            if (inputMenu[key].hasOwnProperty('destEnum') ) {
                newMenuRowItem.destEnum = inputMenu[key].destEnum;
            }
            if (inputMenu[key].hasOwnProperty('function') ) {
                newMenuRowItem.function = inputMenu[key].function;
            }
            if (inputMenu[key].hasOwnProperty('param') ) {
                newMenuRowItem.param = inputMenu[key].param;
            }
            if (inputMenu[key].hasOwnProperty('text') ) {
                newMenuRowItem.text = inputMenu[key].text;
            }
            if (inputMenu[key].hasOwnProperty('externalCommand') ) {
                newMenuRowItem.externalCommand = inputMenu[key].externalCommand;
            }
            if (inputMenu[key].hasOwnProperty('externalCommandParams') ) {
                newMenuRowItem.externalCommandParams = inputMenu[key].externalCommandParams;
            }
            if (inputMenu[key].hasOwnProperty('externalMenu') ) {
                newMenuRowItem.externalMenu = inputMenu[key].externalMenu;
            }
            if (inputMenu[key].hasOwnProperty('externalMenuParams') ) {
                newMenuRowItem.externalMenuParams = inputMenu[key].externalMenuParams;
            }
            if (inputMenu[key].hasOwnProperty('descendants') ) {
                newMenuRowItem.descendants = [...inputMenu[key].descendants];
            }
            if (inputMenu[key].hasOwnProperty('navigationParams') ) {
                newMenuRowItem.navigationParams = [...inputMenu[key].navigationParams];
            }
            if (newMenuRowItem.submenu === undefined) {
                if (Array.isArray(inputMenu[key].submenu) && inputMenu[key].submenu.length ) {
                    newMenuRowItem.submenu = menuMakeMenuIndexed(inputMenu[key].submenu, newMenuRowItem.index);
                }
                else {
                    newMenuRowItem.submenu = inputMenu[key].submenu;
                }
            }
            newMenuRow.push(newMenuRowItem);
        }
    }
    else if ((typeof inputMenu === 'object') && inputMenu.hasOwnProperty('submenu')) {
        newMenuRow = {};
        newMenuRow['icon'] = inputMenu.icon;
        newMenuRow['index'] = inputMenu.index !== undefined ? inputMenu.index : '';
        newMenuRow['name'] = inputMenu.name;
        newMenuRow['submenu'] = menuMakeMenuIndexed(inputMenu.submenu, newMenuRow['index']);
        if (inputMenu.hasOwnProperty('text') ) newMenuRow['text'] = inputMenu.text;
        if (inputMenu.hasOwnProperty('externalCommand') ) newMenuRow['externalCommand'] = inputMenu.externalCommand;
    }
    return newMenuRow;
}

//*** menu related functions - end ***//


//*** User input and command processing - begin ***//

/**
 * This function "packs"(joins) the command and it's params into a string.
 * @param  {...any} inputParams
 * @returns {string}
 */
function commandsPackParams(...inputParams) {
    return inputParams.filter(inputParam => ((inputParam !== undefined) && inputParam !== null)).join(itemsDelimiter);
}


/**
 * This function "unpack"(splits) command and params from string to the array.
 * @param {string} param
 * @param {string[]=} defaultValue
 * @returns {string[]}
 */
function commandUnpackParams(param, defaultValue) {
    let result = defaultValue && typeOf(defaultValue, 'array') ? defaultValue : [];
    if (param && typeOf(param, 'string')) {
        result = param.split(itemsDelimiter);
    }
    return result;
}

/**
 * This function is a core to process of  the user input. It can be an input as user message, or the appropriate text, when the menu button is pressed.
 * @param {object} user - The user object.
 * @param {string} userInputToProcess - The string, contained the user input.
 */
async function commandUserInputCallback(user, userInputToProcess) {

    const
        isWaitForInput = cachedGetValue(user, cachedIsWaitForInput),
        userInput = isWaitForInput ? isWaitForInput : userInputToProcess,
        isLongCommandsCached = userInput.indexOf(cmdCached) === 0,
        longCommandId = isLongCommandsCached ? commandUnpackParams(userInput).pop() : null,
        cachedLongCommands = isLongCommandsCached && cachedExistsValue(user, cachedMenuLongCommandsWithParams) ? cachedGetValue(user, cachedMenuLongCommandsWithParams) : null,
        inputData = cachedLongCommands && cachedLongCommands.has(longCommandId) ? cachedLongCommands.get(longCommandId) : userInput,
        [currentCommand, currentType, currentItem, currentParam, currentValue, currentSubParam, currentSubValue, ..._otherItems] = commandUnpackParams(inputData, [cmdNoOperation]),
        menuMessageObject = {};
    let
        currentMenuPosition = cachedGetValue(user, cachedMenuItem);
    if (cachedExistsValue(user, cachedMenuLongCommandsWithParams)) cachedDelValue(user, cachedMenuLongCommandsWithParams);
    // logs(`cachedCommand = ${cachedLongCommands}`, _l);
    // logs(`currentCommand = ${currentCommand}, currentType = ${currentType}, currentItem = ${currentItem}, currentParam = ${currentParam}, currentValue = ${currentValue}, currentSubParam = ${currentSubParam}, currentSubValue = ${currentSubValue}, currentMenuItem = ${JSON.stringify(currentMenuPosition)}`, _l);

    if (isWaitForInput) {
        if (userInputToProcess != dataTypeIgnoreInput) {
            switch (currentCommand) {
                case cmdItemUpload: {
                    // logs(`currentType = ${currentType}, currentItem = ${currentItem}, currentParam = ${currentParam}, userInputToProcess = ${userInputToProcess}`, _l);
                    switch (currentType) {
                        case dataTypeTranslation: {
                            const isTranslationFileOk = translationsCheckAndCacheUploadedFile(user, userInputToProcess, currentItem, currentParam);
                            if (isTranslationFileOk) {
                                currentMenuPosition.push(
                                    // @ts-ignore
                                    isNaN(currentValue)
                                        ? currentValue : Number(currentValue));
                                // logs(`currentMenuItem = ${currentMenuItem}`);
                            }
                            else {
                                telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                            }
                            break;
                        }

                        default: {
                            break;
                        }
                    }
                    break;
                }

                case cmdGetInput:
                default: {
                    switch (currentType) {
                        case dataTypeTranslation: {
                            let currentTranslationId = currentItem;
                            if (currentParam && currentValue) {
                                let destTranslation = translationsPointOnItemOwner(user, `${currentItem}.destinations`, true);
                                if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentParam))) {
                                    currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(currentParam)]}`;
                                    destTranslation = destTranslation[Object.keys(destTranslation)[Number(currentParam)]];
                                    if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentValue))) {
                                        currentTranslationId += `.${Object.keys(destTranslation)[Number(currentValue)]}`;
                                    }
                                    else {
                                        currentTranslationId = '';
                                    }
                                }
                                else {
                                    currentTranslationId = '';
                                }
                            }
                            if (currentTranslationId) translationsItemStore(user, currentTranslationId, userInputToProcess);
                            const currentTranslation = translationsGetCurrentForUser(user);
                            if (currentParam && (! currentValue)) {
                                const newPosition = Object.keys(currentTranslation)
                                    .filter((key) => (! key.includes('.')) && (key.indexOf(currentParam) === 0))
                                    .sort((a, b) => (currentTranslation[a].localeCompare(currentTranslation[b])))
                                    .indexOf(currentItem);
                                if (newPosition >= 0) {
                                    currentMenuPosition.splice(-1, newPosition);
                                }
                            }
                            break;
                        }

                        case dataTypePrimaryEnums: {
                            if (currentValue && enumerationsList[currentValue]) {
                                const currentEnumsList = enumerationsList[currentValue].enums;
                                if (currentEnumsList[currentItem]) {
                                    const
                                        oldIcon = currentEnumsList[currentItem].icon,
                                        currentList = enumerationsList[currentValue].list;
                                    currentEnumsList[currentItem].icon = userInputToProcess;
                                    Object.keys(currentList).forEach(currentListItem => {if ((currentList[currentListItem].enum === currentItem) && (currentList[currentListItem].icon === oldIcon)) currentList[currentListItem].icon = userInputToProcess;});
                                    enumerationsInit(currentValue);
                                    enumerationsSave(currentValue);
                                }
                            }
                            break;
                        }

                        case dataTypeDestination:
                        case dataTypeFunction:{
                            switch (currentParam) {
                                case 'state': {
                                    const currentDeviceAttributes = enumerationsList[currentType].list[currentItem].deviceAttributes;
                                    if (currentDeviceAttributes && currentDeviceAttributes.hasOwnProperty(currentParam)) {
                                        currentDeviceAttributes[userInputToProcess] = objectDeepClone(currentDeviceAttributes[currentParam]);
                                        currentDeviceAttributes[userInputToProcess].nameTranslationId = translationsGetObjectId(translationsGetObjectId(userInputToProcess.split('.').join('_'), currentItem, undefined, enumerationsDeviceBasicAttributes.includes(userInputToProcess)));
                                        delete currentDeviceAttributes[currentParam];
                                    }
                                    break;
                                }
                            }
                        }
                        // break omitted
                        case dataTypeReport: {
                            switch (currentParam) {
                                case 'setId':
                                case 'fixId':
                                    cachedSetValue(user, cachedSimpleReportIdToCreate, userInputToProcess);
                                    break;

                                case 'names':
                                    enumerationsUpdateItemName(user, currentType, currentItem, enumerationsList[currentType].list[currentItem], userInputToProcess, currentValue !== enumerationsNamesMain ? currentValue : '');
                                    break;

                                default:
                                    enumerationsList[currentType].list[currentItem][currentParam] = userInputToProcess;
                                    break;
                            }
                            enumerationsSave(currentType);
                            break;
                        }

                        case dataTypeDeviceAttributes:
                        case dataTypeDeviceButtons: {
                            if (currentValue && enumerationsList[dataTypeFunction].list[currentValue]) {
                                enumerationsList[dataTypeFunction].list[currentValue][currentType][currentItem][currentParam] = userInputToProcess;
                            }
                            enumerationsSave(dataTypeFunction);
                            break;
                        }

                        case dataTypeGroups: {
                            const currentEnumeration = enumerationsGetList(currentParam, currentValue);
                            if (currentItem && currentEnumeration && currentEnumeration.hasOwnProperty(currentItem) && currentEnumeration[currentItem]) {
                                currentEnumeration[currentItem].group = userInputToProcess;
                            }
                            // logs(`currentParam, currentValue = ${[currentType, currentItem, currentParam, currentValue,]}`, _l)
                            if (currentValue) {
                                enumerationsSave(dataTypeFunction);
                            }
                            else {
                                enumerationsSave(currentParam);
                            }
                            break;
                        }


                        case dataTypeMenuRoles: {
                            switch (currentParam) {
                                case 'setId':
                                case 'fixId':
                                    cachedSetValue(user, cachedRolesNewRoleId, userInputToProcess);
                                    break;
                                default:
                                    break;
                            }
                            break;
                        }

                        case dataTypeReportMember: {
                            let queryParams = cachedGetValue(user, cachedSimpleReportNewQuery);
                            queryParams = queryParams ? queryParams : simpleReportQueryParamsTemplate();
                            queryParams[currentItem] = userInputToProcess;
                            cachedSetValue(user, cachedSimpleReportNewQuery, queryParams);
                            break;
                        }

                        case dataTypeConfig: {
                            if (currentItem === cfgMenuLanguage) {
                                cachedSetValue(user, cachedConfigNewLanguageId, userInputToProcess);
                            }
                            else {
                                const configItem = configOptions.getOption(currentItem, currentParam === configOptionScopeGlobal ? null : user);
                                if (typeOf(configItem, 'array') &&
                                    // @ts-ignore
                                    (! isNaN(currentValue))) {
                                    const configItemIndex = Number(currentValue);
                                    let newValue;
                                    newValue = userInputToProcess;
                                    if ( configItemIndex < configItem.length) {
                                        if (currentItem === cfgGraphsIntervals) {
                                            configItem[configItemIndex].name = newValue;
                                        }
                                        else {
                                            configItem[configItemIndex] = newValue;
                                        }
                                    }
                                    else {
                                        if (currentItem === cfgGraphsIntervals) {
                                            const
                                                currentMask =  configOptions.getMask(currentItem),
                                                configItemMask  = configOptions.getMaskDescription(currentItem),
                                                parsedValueArray = currentMask && currentMask.test(userInputToProcess) ? userInputToProcess.match(currentMask): [],
                                                parsedValue = parsedValueArray && parsedValueArray.length && timeIntervalsInMinutes.hasOwnProperty(parsedValueArray[2]) ? Number(parsedValueArray[1]) * timeIntervalsInMinutes[parsedValueArray[2]] : undefined;
                                            newValue = parsedValue !== undefined ? {id: userInputToProcess, minutes: parsedValue} : null;
                                            menuMessageObject.menutext =  `${translationsItemTextGet(user, 'WrongValue')}!\n${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'ForConfig')} '${translationsItemCoreGet(user, currentItem)}' (${translationsItemTextGet(user, 'CurrentValue')} = ${configItem})${configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''}:`;
                                        }
                                        if (newValue !== null) configItem.push(newValue);
                                    }
                                    configOptions.setOption(currentItem, user, configItem);
                                }
                                else {
                                    const parsedValue = configOptions.parseOption(currentItem, userInputToProcess);
                                    if (parsedValue === undefined) {
                                        const
                                            configItem = configOptions.getOption(currentItem, currentParam === configOptionScopeGlobal ? null : user),
                                            configItemMask  = configOptions.getMaskDescription(currentItem);
                                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'WrongValue')}!\n${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'ForConfig')} '${translationsItemCoreGet(user, currentItem)}' (${translationsItemTextGet(user, 'CurrentValue')} = ${configItem})${configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''}:`;
                                    }
                                    else {
                                        configOptions.setOption(currentItem, currentParam === configOptionScopeGlobal ? null : user, parsedValue);
                                    }
                                }
                            }
                            break;
                        }

                        case dataTypeStateValue: {
                            if (existsObject(currentParam)) {
                                const
                                    stateObject = getObject(currentParam);
                                if (stateObject.common.type === 'number') {
                                    // @ts-ignore
                                    if (! isNaN(userInputToProcess)
                                        && ((! stateObject.common.hasOwnProperty('min')) || (Number(userInputToProcess) >= Number(stateObject.common.min)))
                                        && ((! stateObject.common.hasOwnProperty('max')) || (Number(userInputToProcess) <= Number(stateObject.common.max)))
                                        ) {
                                        await setStateAsync(currentParam, Number(userInputToProcess));
                                        telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgSuccess'));
                                    }
                                    else {
                                        console.warn(`Unacceptable value '${userInputToProcess}' for object conditions ${JSON.stringify(stateObject.common)}`);
                                        telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                                    }
                                }
                            }
                            break;
                        }

                        case dataTypeAlertSubscribed: {
                            switch (currentValue) {
                                case alertThresholdId:
                                case alertThresholdOnTimeIntervalId:{
                                    // @ts-ignore
                                    userInputToProcess = Number(userInputToProcess);
                                    break;
                                }
                            }
                            if (Number.isNaN(userInputToProcess) && (currentValue !== alertMessageTemplateId)) {
                                console.warn(`Unacceptable value '${userInputToProcess}' for number conditions`);
                                telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                            }
                            else {
                                const
                                    alertDetailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, currentItem),
                                    currentThresholdIndex = Number(currentParam),
                                    currentThresholdsKeys = currentThresholdIndex >= 0 ? Object.keys(alertDetailsOrThresholds).sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB))) : [];
                                if (currentValue === alertThresholdId) {
                                    let currentThresholdRules = {onAbove: true, onLess: true};
                                    if (currentThresholdIndex < currentThresholdsKeys.length) {
                                        currentThresholdRules = alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                                        delete alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                                    }
                                    alertDetailsOrThresholds[userInputToProcess] = currentThresholdRules;
                                    if (currentThresholdIndex < currentThresholdsKeys.length) {
                                        const newIndex = Object.keys(alertDetailsOrThresholds).sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB))).findIndex(threshold => (Number(threshold) === Number(userInputToProcess)));
                                        currentMenuPosition.splice(-1, 1, newIndex);
                                    }
                                }
                                else {
                                    const currentDetailsOrThreshold = currentThresholdIndex >= 0 ? alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]] : alertDetailsOrThresholds;
                                    currentDetailsOrThreshold[currentValue] = userInputToProcess;
                                }
                                cachedSetValue(user, alertThresholdSet, alertDetailsOrThresholds);
                                const backStepsForCacheDelete = (currentThresholdIndex >= 0  ? -2 : -1) + (currentValue === alertMessageTemplateId ? -1 : 0);
                                cachedAddToDelCachedOnBack(user, currentMenuPosition.slice(0, backStepsForCacheDelete).join('.'), alertThresholdSet);
                                menuClearCachedMenuItemsAndRows(user);
                            }
                            break;
                        }

                        default: {
                            break;
                        }
                    }
                    logs('New values is set');
                    menuClearCachedMenuItemsAndRows(user);
                    break;
                }
            }

        }
        if (menuMessageObject.menutext) {
            menuMessageObject.menutext += botMessageStamp;
            telegramMessagesFormatAndPushToQueueMessage(user, menuMessageObject, (user.userId !== user.chatId) || (currentCommand !== cmdGetInput), (user.userId === user.chatId), false);
        }
        else {
            cachedSetValue(user, cachedIsWaitForInput, false);
            /** if it private chat - delete user input, if it group - clear menu, and recreate it after user input **/
            menuProcessMenuItem(user, undefined, currentMenuPosition, (user.userId !== user.chatId) || (currentCommand !== cmdGetInput), (user.userId === user.chatId) && (currentCommand === cmdGetInput), false, true);
        }
    }
    else if (currentCommand === cmdGetInput) {
        switch (currentType) {
            case dataTypeTranslation: {
                let
                    currentTranslationId = currentItem,
                    currentTranslationValue;
                if (currentParam && currentValue) {
                    let destTranslation = translationsPointOnItemOwner(user, `${currentItem}.destinations`, true);
                    if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentParam))) {
                        currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(currentParam)]}`;
                        destTranslation = destTranslation[Object.keys(destTranslation)[Number(currentParam)]];
                        if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentValue))) {
                            currentTranslationId += `.${Object.keys(destTranslation)[Number(currentValue)]}`;
                            currentTranslationValue = destTranslation[Object.keys(destTranslation)[Number(currentValue)]];
                        }
                    }
                }
                else {
                    currentTranslationValue = translationsItemGet(user, currentTranslationId);
                }
                if (currentTranslationValue) menuMessageObject.menutext = `${translationsItemCoreGet(user, 'cmdItemRename')} ${currentTranslationId} = "${currentTranslationValue}" :`;
                break;
            }

            case dataTypePrimaryEnums: {
                if (currentValue && enumerationsList[currentValue]) {
                    const currentEnumsList = enumerationsList[currentValue].enums;
                    if (currentEnumsList[currentItem]) {
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} "${translationsItemTextGet(user, currentType, currentParam)}" = ${currentEnumsList[currentItem].icon}:`;
                    }
                }
                break;
            }

            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport: {
                switch (currentParam) {
                    case 'setId':
                    case 'fixId': {
                        const simpleReportId = cachedGetValue(user, cachedSimpleReportIdToCreate);
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} ${translationsItemTextGet(user, simpleReportId ? 'fix': 'set', 'reportId')} ${simpleReportId ? `= ${simpleReportId}` : ''}`;
                        cachedDelValue(user, cachedSimpleReportIdToCreate);
                        break;
                    }

                    case 'names': {
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} "${translationsItemTextGet(user, currentValue)}" = ${translationsGetEnumName(user, currentType, currentItem, currentValue)}:`;
                        break;
                    }

                    default: {
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} "${translationsItemTextGet(user, currentParam)}" = ${enumerationsList[currentType].list[currentItem][currentParam]}:`;
                        break;
                    }
                }
                break;
            }

            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                if (currentValue && enumerationsList[dataTypeFunction].list[currentValue]) {
                    menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} "${translationsItemTextGet(user, currentParam)}" = ${enumerationsList[dataTypeFunction].list[currentValue][currentType][currentItem][currentParam]}:`;
                }
                break;
            }

            case dataTypeMenuRoles: {
                switch (currentParam) {
                    case 'setId':
                    case 'fixId': {
                        const newRoleId = cachedGetValue(user, cachedRolesNewRoleId);
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} ${translationsItemTextGet(user, newRoleId ? 'fix': 'set', 'RoleId')} ${newRoleId ? `= ${newRoleId}` : ''}`;
                        cachedDelValue(user, cachedRolesNewRoleId);
                        break;
                    }
                    default: {
                        // menuMessageObject.menutext =  `${getFromTranslation(user, generateTranslationIdForText('SetNewAttributeValue'))} ${getFromTranslation(user, generateTextId('for', currentType))} "${getFromTranslation(user, generateTextId(currentType, currentParam))}" = ${enumerationItems[currentType].list[currentItem][currentParam]}:`;
                        break;
                    }
                }
                break;
            }


            case dataTypeReportMember: {
                const queryParams = cachedGetValue(user, cachedSimpleReportNewQuery);
                menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'ForReportQuery')} ${translationsItemTextGet(user, currentItem)} ${queryParams && queryParams.hasOwnProperty(currentItem) && queryParams[currentItem] ? `= ${queryParams[currentItem]}` : ''}`;
                break;
            }

            case dataTypeAlertSubscribed: {
                menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} ${translationsItemTextGet(user, currentValue)}${currentSubParam ? ` = ${currentSubParam}` : ''}:`;
                break;
            }

            case dataTypeConfig: {
                const
                    configItem = configOptions.getOption(currentItem, currentParam === configOptionScopeGlobal ? null : user),
                    configItemMask  = configOptions.getMaskDescription(currentItem);
                logs(`configItem (${typeof(configItem)}${Array.isArray(configItem) ? ', Array' : ''}) = ${JSON.stringify(configItem)})`);
                logs(`configItem (${typeof(currentParam)}) = ${JSON.stringify(currentParam)})`);
                if ((typeOf(configItem) === 'array')
                    // @ts-ignore
                    && (! isNaN(currentValue))) {
                    const configItemIndex = Number(currentValue);
                    if (configItemIndex < configItem.length) {
                        const
                            itemByIndex = configItem[configItemIndex],
                            itemId = currentItem === cfgGraphsIntervals ? itemByIndex.id : configItemIndex,
                            itemValue = currentItem === cfgGraphsIntervals ? itemByIndex.name : itemByIndex;
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} '${translationsItemCoreGet(user, currentItem)}[${itemId}]' (${translationsItemTextGet(user, 'CurrentValue')} = ${itemValue}):`;
                    }
                    else {
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'AddNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} '${translationsItemCoreGet(user, currentItem)}[]':`;
                    }
                }
                else {
                    if (currentItem === cfgMenuLanguage) {
                        const newLanguageId = cachedGetValue(user, cachedConfigNewLanguageId);
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, newLanguageId ? 'FixNewAttributeValue' : 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'ForConfig')} ${translationsItemCoreGet(user, currentItem)}'${newLanguageId ? `(${newLanguageId})` : ''}:`;
                    }
                    else {
                        menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'ForConfig')} '${translationsItemCoreGet(user, currentItem)}' (${translationsItemTextGet(user, 'CurrentValue')} = ${configItem})${configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''}:`;
                    }
                }
                break;
            }

            case dataTypeStateValue: {
                if (existsObject(currentParam)) {
                    const
                        stateObject = getObject(currentParam),
                        currentName = translationsGetObjectName(user, stateObject, currentItem),
                        currentValue = existsState(currentParam) ? getState(currentParam).val : null;
                    menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)} '${currentName}' (${translationsItemTextGet(user, 'CurrentValue')} = ${currentValue ? currentValue : iconItemNotFound}${stateObject.common.hasOwnProperty('unit') ? ` ${stateObject.common['unit']}` : '' }))`;
                    if (stateObject.common.type === 'number') {
                        menuMessageObject.menutext += `, ${translationsItemTextGet(user, 'Number')}`; //
                        if (stateObject.common.hasOwnProperty('min') || stateObject.common.hasOwnProperty('max')) {
                            menuMessageObject.menutext += '(';
                            if (stateObject.common.hasOwnProperty('min')) {
                                menuMessageObject.menutext += `${translationsItemTextGet(user, 'Min')} = ${stateObject.common.min}`;
                            }
                            menuMessageObject.menutext += ' - ';
                            if (stateObject.common.hasOwnProperty('max')) {
                                menuMessageObject.menutext += `${translationsItemTextGet(user, 'Max')} = ${stateObject.common.max}`;
                            }
                            menuMessageObject.menutext += ')';
                        }
                    }
                    menuMessageObject.menutext += ':';
                }
                break;
            }

            default: {
                menuMessageObject.menutext =  `${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(user, 'for', currentType)}:`;
                break;
            }
        }
        if (menuMessageObject.menutext) {
            menuMessageObject.menutext += botMessageStamp;
        cachedSetValue(user, cachedIsWaitForInput, inputData);
            telegramMessagesFormatAndPushToQueueMessage(user, menuMessageObject, false, false, false);
        }
        else {
            menuProcessMenuItem(user);
        }
    }
    else if (configOptions.getOption(cfgMessagesForMenuCall, user).includes(currentCommand)){
        // setCachedValue(user, cachedMenuOn, false);
        /** if it private chat - delete user input, if configured **/
        menuProcessMenuItem(user, undefined, undefined, true, configOptions.getOption(cfgClearMenuCall, user) && (user.userId === user.chatId), false, true);
    }
    else if (currentCommand.indexOf(cmdClose) === 0) {

        menuCloseMenu(user);
    }
    else if (currentCommand.indexOf(cmdBack) === 0) {
        currentMenuPosition = currentCommand.replace(cmdBack,'');
        logs(`currentMenuItem = ${JSON.stringify(currentMenuPosition)}`);
        if (cachedExistsValue(user, cachedDelCachedOnBack)) {
            const cachedToDelete = cachedGetValue(user, cachedDelCachedOnBack);
            if (cachedToDelete && cachedToDelete.hasOwnProperty(currentMenuPosition)) {
                if (Array.isArray(cachedToDelete[currentMenuPosition])) {
                    logs(`cachedToDelete[currentMenuItem] = ${JSON.stringify(cachedToDelete[currentMenuPosition])}`);
                    cachedToDelete[currentMenuPosition].forEach(cachedId => (cachedDelValue(user, cachedId)));
                }
                delete cachedToDelete[currentMenuPosition];
            }
            cachedSetValue(user, cachedDelCachedOnBack, {...cachedToDelete});
        }
        currentMenuPosition = menuExtractMenuItemPosition(currentMenuPosition);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdHome) {
        if (cachedExistsValue(user, cachedDelCachedOnBack)) {
            const cachedToDelete = cachedGetValue(user, cachedDelCachedOnBack);
            Object.keys(cachedToDelete).forEach(itemsToDelete => {
                if (Array.isArray(cachedToDelete[itemsToDelete])) {
                    logs(`cachedToDelete[[${itemsToDelete}] = ${JSON.stringify(cachedToDelete[itemsToDelete])}`);
                    cachedToDelete[itemsToDelete].forEach(cachedId => (cachedDelValue(user, cachedId)));
                    delete cachedToDelete[itemsToDelete];
                }
            });
            cachedDelValue(user, cachedDelCachedOnBack);
        }
        menuProcessMenuItem(user, undefined, []);
    }
    else if (currentCommand.indexOf(menuItemButtonPrefix) === 0) {
        menuProcessMenuItem(user, currentCommand.replace(menuItemButtonPrefix,''));
    }
    else if ((currentCommand === cmdAcknowledgeAlert) || (currentCommand === cmdAcknowledgeAndUnsubscribeAlert)) {
        const alertMessages = alertGetMessages(user);
        let alertLastNonAcknowledgedMessage;
        for (let i = alertMessages.length - 1; i >= 0; --i) {
            const alertMessage = alertMessages[i];
            if ((! alertMessage.ack)) {
                alertLastNonAcknowledgedMessage = alertMessage;
                break;
            }
        }
        logs('alertMessages = ' + JSON.stringify(alertMessages));
        if (alertLastNonAcknowledgedMessage !== undefined) {
            alertLastNonAcknowledgedMessage.ack = true;
            alertsStoreMessagesToCache(user, alertMessages);
            if (currentCommand === cmdAcknowledgeAndUnsubscribeAlert) alertsManage(user, alertLastNonAcknowledgedMessage.id);
        }
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user);
    }
    else if (currentCommand === cmdAcknowledgeAllAlerts) {
        const alertMessages = alertGetMessages(user);
        alertMessages.filter(alertMessage => (! alertMessage.ack)).forEach(alertMessage => {alertMessage.ack = true});
        alertsStoreMessagesToCache(user, alertMessages);
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user);
    }
    else if (currentCommand === cmdItemPress) {
        switch (currentType) {
            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport:
            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                const currentList = enumerationsSubTypes.includes(currentType) && currentValue ? enumerationsList[dataTypeFunction].list[currentValue][currentType] : enumerationsList[currentType].list;
                if (enumerationsSubTypes.includes(currentType) && enumerationsDeviceButtonsAccessLevelAttrs.includes(currentParam)) {
                    currentList[currentItem][currentParam] = currentSubParam;
                }
                else {
                    currentList[currentItem][currentParam] = ! currentList[currentItem][currentParam];
                    if ((currentType === dataTypeFunction) && (currentParam === 'isEnabled') && currentList[currentItem][currentParam]) {
                        enumerationsRefreshFunctionDeviceStates(currentItem, dataTypeDeviceAttributes, false);
                        enumerationsRefreshFunctionDeviceStates(currentItem, dataTypeDeviceButtons, true);
                    }
                }
                enumerationsSave(enumerationsSubTypes.includes(currentType) && currentValue ? dataTypeFunction : currentType);
                break;
            }

            case dataTypePrimaryEnums: {
                if (enumerationsList.hasOwnProperty(currentValue)) {
                    if (currentParam === cmdItemAdd) {
                        enumerationsList[currentValue].enums[currentItem] = {
                            isEnabled: true,
                            order: Object.keys(enumerationsList[currentValue].enums).length,
                            icon: ''
                        };
                        // initMenuListItems(currentValue);
                        enumerationsSave(currentValue);
                        currentMenuPosition.splice(-2, 2, dataTypePrimaryEnums);
                    }
                }
                break;
            }

            case dataTypeGroups: {
                const currentEnumeration = enumerationsGetList(currentParam, currentSubParam ? currentSubParam : '');
                if (currentItem && currentEnumeration && currentEnumeration.hasOwnProperty(currentItem) && currentEnumeration[currentItem]) {
                    currentEnumeration[currentItem].group = currentEnumeration[currentItem].group === currentValue ? '' : currentValue;
                }
                if (currentSubParam) {
                    enumerationsSave(dataTypeFunction);
                }
                else {
                    enumerationsSave(currentParam);
                }
                break;
            }


            case dataTypeConfig: {
                switch (currentItem) {
                    case cfgMenuLanguage:
                        configOptions.setOption(currentItem, currentParam === configOptionScopeUser ? user : null, currentValue);
                        currentMenuPosition.splice(-1, 1);
                        break;
                    default:
                        configOptions.setOption(currentItem, currentParam === configOptionScopeUser ? user : null, ! configOptions.getOption(currentItem, currentParam === configOptionScopeUser ? user : null));
                        break;
                }
                break;
            }

            case dataTypeAlertSubscribed: {
                const
                    currentThresholds = alertsGetStateAlertDetailsOrThresholds(user, currentItem),
                    currentThresholdsKeys = Object.keys(currentThresholds).sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB))),
                    currentThresholdIndex = Number(currentParam);
                if (currentThresholdIndex < currentThresholdsKeys.length) {
                    currentThresholds[currentThresholdsKeys[currentThresholdIndex]][currentValue] = ! currentThresholds[currentThresholdsKeys[currentThresholdIndex]][currentValue];
                    cachedSetValue(user, alertThresholdSet, currentThresholds);
                    cachedAddToDelCachedOnBack(user, currentMenuPosition.slice(0, -2).join('.'), alertThresholdSet);
                }
                break;
            }

            case dataTypeMenuUsers: {
                usersInMenu.toggleItemIsEnabled(currentItem);
                break;
            }

            case dataTypeMenuUserRoles: {
                if (usersInMenu.hasRole(currentItem, currentParam)) {
                    usersInMenu.delRole(currentItem, currentParam);
                }
                else {
                    usersInMenu.addRole(currentItem, currentParam);
                }
                break;
            }

            case dataTypeMenuRoleRules: {
                const currentIndex = Number(currentParam);
                if (currentIndex === -1) {
                    if (cachedExistsValue(user, cachedRolesNewRule)) {
                        const currentRule = cachedGetValue(user, cachedRolesNewRule);
                        currentRule['accessLevel'] = currentValue;
                        cachedSetValue(user, cachedRolesNewRule, currentRule);
                    }
                }
                else {
                    if (rolesInMenu.existsId(currentItem)) {
                        let currentRules = rolesInMenu.getRules(currentItem);
                        if (currentRules.length > currentIndex) {
                            const currentRule = {...currentRules[currentIndex]};
                            currentRule['accessLevel'] = currentValue;
                            cachedSetValue(user, cachedRolesNewRule, currentRule);
                        }
                    }
                }
                break;
            }

            default: {
                break;
            }
        }
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemDownload) {
        nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
            if (err) {
                console.warn(`Can't create temporary directory! Error: '${JSON.stringify(err)}'.`);
            }
            else {
                const
                    languageId = configOptions.getOption(cfgMenuLanguage),
                    tmpFileName = nodePath.join(tmpDirectory, `menuTranslation_${languageId}.json`),
                    currentTranslation = translationsGetCurrentForUser(user);
                nodeFS.writeFile(tmpFileName, JSON.stringify({type: translationsType, language: languageId, version: translationsVersion, translation: currentTranslation}, null, 2), err => {
                    if (err) {
                        console.warn(`Can't create temporary file '${tmpFileName}'! Error: '${JSON.stringify(err)}'.`);
                    }
                    else {
                        telegramSendFile(user, tmpFileName);
                    }
                });
            }
        });
    }
    else if (currentCommand === cmdItemUpload) {
        switch (currentType) {
            case dataTypeTranslation:
                switch (currentItem) {
                    case doUploadDirectly: {
                        cachedSetValue(user, cachedIsWaitForInput, userInputToProcess);
                        cachedDelValue(user, cachedTranslationsToUpload);
                        telegramMessagesFormatAndPushToQueueMessage(user, {menutext: translationsItemTextGet(user, 'UploadTranslationFile')}, false, false, false);
                        break;
                    }

                    case doUploadFromRepo: {
                        const currentLanguageId = configOptions.getOption(cfgMenuLanguage, user);
                        translationsLoadLocalesFromRepository(currentLanguageId, currentParam, (locales, _error) => {
                            if (locales && typeOf(locales, 'object') && locales.hasOwnProperty(currentLanguageId) && typeOf(locales[currentLanguageId], 'object')) {
                                const isTranslationFileOk = translationsCheckAndCacheUploadedFile(user, '', '', '', locales[currentLanguageId]);
                                if (isTranslationFileOk) {
                                    currentMenuPosition.push(
                                        // @ts-ignore
                                        isNaN(currentItem)
                                            ? currentItem : Number(currentItem));
                                    // logs(`currentMenuItem = ${currentMenuItem}`);
                                    menuProcessMenuItem(user, undefined, currentMenuPosition);
                                }
                                else {
                                    telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                                }
                            }
                            else {
                                telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                            }
                        });
                        break;
                    }

                    default: {
                        break;
                    }
                }
                break;

            default:
                break;
        }
    }
    else if (currentCommand === cmdItemDelete) {
        switch (currentType) {
            default:
                currentMenuPosition.push(
                    // @ts-ignore
                    isNaN(currentParam)
                        ? currentParam : Number(currentParam));
                break;
        }
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemDeleteConfirm) {
        switch (currentType) {
            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport: {
                const enumObjectId = enumerationsIsItemCanBeDeleted(currentType, currentItem, true);
                if (enumObjectId) {
                    await deleteObjectAsync(enumObjectId);
                }
            }
                // break omitted
            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                const currentList = enumerationsSubTypes.includes(currentType) && currentParam ? enumerationsList[dataTypeFunction].list[currentParam][currentType] : enumerationsList[currentType].list;
                delete currentList[currentItem];
                enumerationsReorderItems(currentList);
                enumerationsSave(enumerationsSubTypes.includes(currentType)  && currentParam ? dataTypeFunction : currentType);
                currentMenuPosition.splice(-2, 2);
                logs(`currentMenuItem = ${JSON.stringify(currentMenuPosition)}`);
                break;
            }

            case dataTypePrimaryEnums: {
                if (enumerationsList.hasOwnProperty(currentParam)) {
                    const
                        currentEnumsList = enumerationsList[currentParam].enums;
                    if (Object.keys(currentEnumsList).includes(currentItem)) {
                        delete currentEnumsList[currentItem];
                        enumerationsSave(currentParam);
                        currentMenuPosition.splice(-3, 3, dataTypePrimaryEnums);
                    }
                }
                break;
            }


            case dataTypeReportMember: {
                const
                    currentReportId = `${prefixEnums}.${enumerationsList[dataTypeReport].list[currentItem].enum}.${currentItem}`;
                let
                    currentReportObject = getObject(currentReportId);
                delete currentReportObject.common.members[Number(currentParam)];
                currentReportObject.common.members = currentReportObject.common.members.filter(n => n);
                // @ts-ignore
                await setObjectAsync(currentReportId, currentReportObject);
                currentMenuPosition.splice(-2, 2);
                break;
            }

            case dataTypeAlertSubscribed: {
                if (currentParam !== undefined) {
                    const
                        currentDetailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, currentItem),
                        currentThresholdIndex = Number(currentParam),
                        currentThresholdsKeys = currentThresholdIndex >= 0 ? Object.keys(currentDetailsOrThresholds).sort((thresholdA, thresholdB) => (Number(thresholdA) - Number(thresholdB))) : [];
                    if (currentThresholdIndex < currentThresholdsKeys.length) {
                        if (currentValue) {
                            const currentDetailOrThreshold = currentThresholdIndex >= 0 ? currentDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]] : currentDetailsOrThresholds;
                            if (currentDetailOrThreshold.hasOwnProperty(currentValue)) delete currentDetailOrThreshold[currentValue];
                        }
                        else if (currentThresholdIndex >= 0) {
                            delete currentDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                        }
                        cachedSetValue(user, alertThresholdSet, currentDetailsOrThresholds);
                        cachedAddToDelCachedOnBack(user, currentMenuPosition.slice(0, -3).join('.'), alertThresholdSet);
                        currentMenuPosition.splice(-2, 2);
                    }
                }
                else {
                    alertsManage(user, currentItem);
                    currentMenuPosition.splice(-4, 4);
                }
                break;
            }

            case dataTypeTranslation: {
                let currentTranslationId = currentItem;
                if (currentParam && currentValue) {
                    let destTranslation = translationsPointOnItemOwner(user, `${currentItem}.destinations`, true);
                    if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentParam))) {
                        currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(currentParam)]}`;
                        destTranslation = destTranslation[Object.keys(destTranslation)[Number(currentParam)]];
                        if (destTranslation && (typeOf(destTranslation) === 'object') && (Object.keys(destTranslation).length > Number(currentValue))) {
                            currentTranslationId += `.${Object.keys(destTranslation)[Number(currentValue)]}`;
                        }
                        else {
                            currentTranslationId = '';
                        }
                    }
                    else {
                        currentTranslationId = '';
                    }
                }
                if (currentTranslationId) {
                    translationsItemDelete(user, currentTranslationId);
                    currentMenuPosition.splice(-2, 2);
                }
                break;
            }

            case dataTypeConfig: {
                switch (currentItem) {
                    case cfgMenuLanguage: {
                        switch (currentParam) {
                            case configOptionScopeGlobal:
                                if (translationsList.hasOwnProperty(currentValue)) {
                                    delete translationsList[currentValue];
                                    currentMenuPosition.splice(-2, 2);
                                    translationsSave();
                                }
                                break;
                        }
                        break;
                    }

                    default: {
                        let configItemArray = configOptions.getOption(currentItem,  currentParam === configOptionScopeGlobal ? null : user);
                        // logs(`currentItem = ${currentItem}, currentParam = ${currentParam}, configItemArray = ${configItemArray}, currentValue = ${currentValue}`, _l)
                        if (configItemArray && Array.isArray(configItemArray)) {
                            if (configItemArray.length > Number(currentValue)) {
                                configItemArray.splice(Number(currentValue), 1);
                                configOptions.setOption(currentItem, currentParam === configOptionScopeGlobal ? null : user, configItemArray);
                                currentMenuPosition.splice(-2, 2);
                            }
                        }
                        break;
                    }
                    }

                break;
            }

            case dataTypeMenuRoleRules: {
                const
                    currentRole = cachedExistsValue(user, cachedRolesRoleUnderEdit) ? cachedGetValue(user, cachedRolesRoleUnderEdit) : undefined,
                    currentRoleId = currentRole ? currentRole.roleId : currentItem;

                switch (currentRoleId) {
                    case currentItem: {
                        let currentRules = currentRole ? currentRole.rules : (rolesInMenu.existsId(currentItem) ? rolesInMenu.getRules(currentItem) : undefined);
                        if (currentRules) {
                            const currentIndex = Number(currentParam);
                            if (currentRules.length > currentIndex) {
                                currentRules.splice(currentIndex,  1);
                                if (currentRole) {
                                    currentRole.rules = currentRules;
                                    cachedSetValue(user, cachedRolesRoleUnderEdit, currentRole);
                                }
                                else {
                                    rolesInMenu.setRules(currentItem, currentRules, usersInMenu);
                                }
                                currentMenuPosition.splice(-2, 2);
                            }
                        }
                        break;
                    }
                    default: {
                        break;
                    }
                }
                break;
            }

            case dataTypeMenuRoles: {
                if (rolesInMenu.existsId(currentItem) && (rolesInMenu.getUsers(currentItem).length === 0)) {
                    rolesInMenu.delRole(currentItem);
                    currentMenuPosition.splice(-2, 2);
                    menuClearCachedMenuItemsAndRows(user);
                    cachedDelValue(user, cachedRolesRoleUnderEdit);
                }
                break;
            }

            case dataTypeBackup: {
                await backupFileDelete(currentItem).catch();
                currentMenuPosition.splice(-2, 2);
                break;
            }

            default: {
                break;
            }
        }
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemMark) {
        switch (currentType) {
            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport: {
                break;
            }

            case dataTypeReportMember: {
                let queryParams = cachedGetValue(user, cachedSimpleReportNewQuery);
                queryParams = queryParams ? queryParams : simpleReportQueryParamsTemplate();
                switch (currentItem) {
                    case dataTypeDestination:
                        if (queryParams.queryDests.includes(currentParam) ) {
                            delete queryParams.queryDests[queryParams.queryDests.indexOf(currentParam)];
                        }
                        else {
                            queryParams.queryDests.push(currentParam);
                        }
                        queryParams.queryStates = [];
                        queryParams.queryPossibleStates = [];
                        break;

                    case 'states':
                        if (queryParams.queryStates.includes(queryParams.queryPossibleStates[currentParam])) {
                            delete queryParams.queryStates[queryParams.queryStates.indexOf(queryParams.queryPossibleStates[currentParam])];
                        }
                        else {
                            queryParams.queryStates.push(queryParams.queryPossibleStates[currentParam]);
                        }
                        currentMenuPosition.splice(-1);
                        break;

                    default:
                        break;
                }
                cachedSetValue(user, cachedSimpleReportNewQuery, queryParams);
                menuClearCachedMenuItemsAndRows(user);
                break;
            }

            case dataTypeConfig: {
                break;
            }

            case dataTypeMenuRoleRules: {
                const currentRule = cachedExistsValue(user, cachedRolesNewRule) ? cachedGetValue(user, cachedRolesNewRule) : {mask: rolesMaskAnyItem, accessLevel: ''};
                if (currentRule['mask'] === currentItem) {
                    currentRule['mask'] = rolesMaskAnyItem;
                }
                else {
                    currentRule['mask'] = currentItem;
                }
                cachedSetValue(user, cachedRolesNewRule, currentRule);
                menuClearCachedMenuItemsAndRows(user);
                logs(`currentMenuItem = ${currentMenuPosition}`);
                break;
            }
            default: {
                break;
            }
        }
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemsProcess) {
        switch (currentType) {
            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport: {
                break;
            }

            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                if (enumerationsRefreshFunctionDeviceStates(currentItem, currentType, false)) menuClearCachedMenuItemsAndRows(user);
                break;
            }

            case dataTypeTranslation: {
                if (cachedExistsValue(user, cachedTranslationsToUpload)) {
                    const updateTranslationResult = translationsProcessLanguageUpdate(user, currentParam, currentValue);
                    telegramMessagesDisplayPopUpMessage(user, updateTranslationResult ? updateTranslationResult : translationsItemTextGet(user, 'MsgSuccess'));
                }
                else {
                    telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                }
                // logs(`currentMenuItem = ${currentMenuItem}`);
                currentMenuPosition.splice(-2);
                break;
            }

            case dataTypeReportMember: {
                const
                    queryParams = cachedGetValue(user, cachedSimpleReportNewQuery),
                    queryStates = currentParam === doAll ? queryParams.queryPossibleStates : queryParams.queryStates;
                if (queryStates.length) {
                    const
                        currentReportId = `${prefixEnums}.${enumerationsList[dataTypeReport].list[currentItem].enum}.${currentItem}`;
                    let
                        currentReportObject = getObject(currentReportId);
                    logs(`currentReportObject = ${JSON.stringify(currentReportObject, null, 2)}`);
                    if (currentReportObject) {
                        if (! currentReportObject.common.hasOwnProperty('members')) {
                            currentReportObject.common.members = [];
                        }
                        queryStates.forEach((state) => {
                            if (! currentReportObject.common.members.includes(state)) {
                                currentReportObject.common.members.push(state);
                            }
                        });
                        // @ts-ignore
                        await setObjectAsync(currentReportId, currentReportObject);
                        logs(`currentReportObject = ${JSON.stringify(getObject(currentReportId), null, 2)}`);
                    }

                }
                currentMenuPosition.splice(-2, 2);
                cachedDelValue(user, cachedSimpleReportNewQuery);
                break;
            }

            case dataTypeConfig: {
                switch (currentItem) {
                    case cfgMenuLanguage:
                        if (currentParam === configOptionScopeGlobal) {
                            const newLanguageId = currentValue;
                            if (! translationsList.hasOwnProperty(newLanguageId)) {
                                const menuPosition = currentMenuPosition;
                                translationsLoadLocalesFromRepository(newLanguageId, translationsCoreId, (locales, _error) => {
                                    translationsList[newLanguageId] = {};
                                    if (locales && typeOf(locales, 'object') && locales.hasOwnProperty(newLanguageId) && typeOf(locales[newLanguageId], 'object')) {
                                        if (translationsCheckAndCacheUploadedFile(user, '', '', '', locales[newLanguageId])) {
                                            const newTranslation = locales[newLanguageId];
                                            if (newTranslation && newTranslation.hasOwnProperty(idTranslation) && typeOf(newTranslation[idTranslation], 'object') && (Math.abs(translationsCompareVersion(newTranslation['version'])) < 10)) {
                                                translationsList[newLanguageId] = newTranslation[idTranslation];
                                            }
                                        }
                                    }
                                    translationsSave();
                                    menuPosition.splice(-1, 1);
                                    menuProcessMenuItem(user, undefined, menuPosition);
                                });
                                currentMenuPosition = undefined;
                            }
                        }
                        break;

                    default:
                        break;
                }
                break;
            }

            case dataTypeMenuRoleRules: {
                if (cachedExistsValue(user, cachedRolesNewRule)) {
                    const
                        currentRule = cachedGetValue(user, cachedRolesNewRule),
                        currentRole = cachedExistsValue(user, cachedRolesRoleUnderEdit)
                                ? cachedGetValue(user, cachedRolesRoleUnderEdit)
                                : {roleId : currentItem, rules: rolesInMenu.existsId(currentItem) ? rolesInMenu.getRules(currentItem) : []};
                    let currentRoleRules = [...currentRole['rules']];
                    currentRoleRules = currentRoleRules.filter(rule => (rule.mask !== currentRule.mask) );
                    currentRoleRules.push(currentRule);
                    cachedSetValue(user, cachedRolesRoleUnderEdit, {roleId : currentRole.roleId, rules: currentRoleRules});
                    cachedDelValue(user, cachedRolesNewRule);
                    currentMenuPosition.splice(-2, 2);
                }
                break;
            }

            case dataTypeMenuRoles: {
                if (cachedExistsValue(user, cachedRolesRoleUnderEdit)) {
                    const currentRole = cachedGetValue(user, cachedRolesRoleUnderEdit);
                    if (currentItem === currentRole.roleId) {
                        if (rolesInMenu.existsId(currentRole.roleId)) {
                            rolesInMenu.setRules(currentRole.roleId, currentRole.rules, usersInMenu);
                        }
                        else {
                            rolesInMenu.addRole(currentRole.roleId, currentRole.rules);
                            currentMenuPosition.splice(-1);
                        }
                        cachedDelValue(user, cachedRolesRoleUnderEdit);
                    }
                    menuClearCachedMenuItemsAndRows(user);
                }
                break;
            }

            case dataTypeGraph: {
                const
                    graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
                    historyAdapter = `system.adapter.${configOptions.getOption(cfgHistoryAdapter)}`,
                    shortStateId = currentItem.split('.').pop(),
                    graphTemplateId = existsObject(`${graphsTemplatesFolder}.${shortStateId}`) ? `${graphsTemplatesFolder}.${shortStateId}` : `${graphsTemplatesFolder}.${graphsDefaultTemplate}`;
                // logs(`graphTemplateId = ${graphTemplateId}, currentItem = ${currentItem}`);
                // logs(`existsObject(graphTemplateId) = ${existsObject(graphTemplateId)}, existsState(currentParam) = ${existsState(currentItem)}`);
                if (existsObject(graphTemplateId) && ((currentParam === dataTypeReport) || existsState(currentItem))) {
                    let graphTemplate = getObject(graphTemplateId);
                    const
                        graphAdapter = graphsTemplatesFolder.split('.').slice(0, 2).join('.');
                    // logs(`graphTemplate = ${JSON.stringify(graphTemplate, null, 2)}`);
                    if (graphTemplate.native && graphTemplate.native.data && graphTemplate.native.data.lines && (graphTemplate.native.data.lines.length === 1)) {
                        if (currentParam === dataTypeReport) {
                            const
                                reportId = currentSubParam,
                                reportsList = enumerationsList[dataTypeReport].list,
                                reportItem = reportsList[reportId],
                                reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
                            if (reportObject && reportObject.hasOwnProperty('common') && reportObject.common.hasOwnProperty('members') && Array.isArray(reportObject.common['members']) && reportObject.common['members'].length) {
                                const
                                    reportStatesList = reportObject.common['members'].sort(),
                                    reportStatesStructure  = simpleReportPrepareStructure(reportStatesList),
                                    graphLines = graphTemplate.native.data.lines,
                                    templateLine = graphLines.pop();
                                templateLine.instance = historyAdapter;
                                // logs(`templateLine ${typeOf(templateLine)} = ${JSON.stringify(templateLine, null, 2)}`);
                                let currentUnit;
                                Object.keys(reportStatesStructure).sort((a, b) => (enumerationsCompareOrderOfItems(a, b, dataTypeDestination))).forEach(currentDestId => {
                                    const currentFuncs = Object.keys(reportStatesStructure[currentDestId]);
                                    currentFuncs.sort((a, b) => (enumerationsCompareOrderOfItems(a, b, dataTypeFunction))).forEach(currentFuncId => {
                                        const currentDeviceObjects = Object.keys(reportStatesStructure[currentDestId][currentFuncId]);
                                        currentDeviceObjects.forEach(currentDeviceObject => {
                                            const currentStateObjects = reportStatesStructure[currentDestId][currentFuncId][currentDeviceObject];
                                            currentStateObjects.forEach(currentStateObject => {
                                                const currentLine = objectDeepClone(templateLine);
                                                if (currentUnit === undefined) currentUnit = currentStateObject.common && currentStateObject.common.unit ? currentStateObject.common.unit : '';
                                                currentLine.unit = currentUnit;
                                                currentLine.id = currentStateObject._id;
                                                currentLine.name = `${translationsItemTextGet(user, 'In').toLowerCase()} ${translationsGetEnumName(user, dataTypeDestination, currentDestId, enumerationsNamesInside)}`;
                                                if (graphLines.length > 0) currentLine.commonYAxis = "0";
                                                currentLine.lineStyle = (graphLines.length % 3) === 0 ? 'solid' : ((graphLines.length % 3) === 1 ? 'dashed' : 'dotted');
                                                graphLines.push(currentLine);
                                            });
                                        });
                                    });
                                });
                                graphTemplate.native.data.title = translationsGetEnumName(user, dataTypeReport, reportId);
                            }
                        }
                        else {
                            const
                                currentStateObject = getObject(currentItem),
                                currentLine = graphTemplate.native.data.lines[0];
                            currentLine.id = currentItem;
                            currentLine.name = currentParam;
                            currentLine.unit = currentStateObject.common && currentStateObject.common.unit ? currentStateObject.common.unit : '';
                            currentLine.instance = historyAdapter;
                            graphTemplate.native.data.title = `${translationsGetEnumName(user, dataTypeFunction, currentSubParam, enumerationsNamesMain)} ${translationsItemTextGet(user, 'In').toLowerCase()} ${translationsGetEnumName(user, dataTypeDestination, currentSubValue, enumerationsNamesInside)}`;
                        }
                        graphTemplate.native.data.range = currentValue;
                        const newTemplateId = `${graphAdapter}.${graphsTemporaryFolder}.${user.userId}.${user.chatId}`;
                        graphTemplate['_id'] = newTemplateId;
                        try {
                            // @ts-ignore
                            await setObjectAsync(newTemplateId, graphTemplate);
                        }
                        catch (error) {
                            console.warn(`Can't create temporary template object ${newTemplateId}`);
                        }
                        if (existsObject(newTemplateId)) {
                            // logs(`newTemplateId`);
                            nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
                                if (err) {
                                    console.warn(`Can't create temporary directory! Error: '${JSON.stringify(err)}'.`);
                                }
                                else {
                                    const
                                        tmpGraphFileName = nodePath.join(tmpDirectory, 'graph.png'),
                                        scaleSize = configOptions.getOption(cfgGraphsScale, user);
                                    sendTo(graphAdapter,
                                        {
                                            preset: newTemplateId,
                                            renderer: 'png',
                                            width: Math.round(1024*scaleSize),                    // default 1024
                                            height: Math.round(300*scaleSize),                    // default 300
                                            compressionLevel: 0,
                                            filters: 0,
                                            fileOnDisk: tmpGraphFileName
                                        },
                                        result => {
                                            if (result.error) {
                                                console.error(`error: JSON.stringify(result.error)`);
                                            }
                                            else if (result.data) {
                                                telegramSendImage(user, tmpGraphFileName);
                                                deleteObjectAsync(newTemplateId);
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    }
                }
                currentMenuPosition = undefined;
                break;
            }

            case dataTypeBackup: {
                switch (currentItem) {
                    case backupModeCreate:
                        if (await backupCreate(backupModeManual)) {
                            menuClearCachedMenuItemsAndRows(user);
                            currentMenuPosition.push(1);
                            telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgSuccess'));
                        }
                        else {
                            telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgError'));
                        }
                        break;

                    case backupModeRestore:
                        if (await backupRestore(currentParam, currentValue)) {
                            telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgSuccess'));
                            if (currentValue === backupItemAll) currentMenuPosition.splice(-1);
                        }
                        else {
                            telegramMessagesDisplayPopUpMessage(user, translationsItemTextGet(user, 'MsgError'));
                        }
                        break;
                    default:
                        break;
                }
                break;
            }

            default: {
                break;
            }
        }
        if (currentMenuPosition) menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemReset) {
        switch (currentType) {
            case dataTypeConfig:
                if (! configGlobalOptions.includes(currentItem)) {
                    configOptions.deleteUserOption(currentItem, user);
                    // logs(`exists = ${JSON.stringify(configOptions.existsOption(currentItem, user))}, currentItem = ${JSON.stringify(configOptions.getOption(currentItem, user))}`, _l)
                    menuClearCachedMenuItemsAndRows(user);
                }
                break;

            default:
                break;
        }
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if ((currentCommand === cmdItemMoveUp) || (currentCommand === cmdItemMoveDown)) {
        switch (currentType) {
            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport:
            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
                const
                    currentList = enumerationsSubTypes.includes(currentType) && currentParam ?  enumerationsList[dataTypeFunction].list[currentParam][currentType] : enumerationsList[currentType].list,
                    currentOrder = currentList[currentItem].order,
                    newOrder = currentOrder + (currentCommand === cmdItemMoveUp ? -1 : 1 );
                logs(`currentOrder = ${currentOrder} newOrder = ${newOrder}`);
                const newItem = Object.keys(currentList).find((cItem) => {
                    return currentList[cItem].order === newOrder;
                });
                if (newItem != undefined) {
                    currentList[newItem].order = currentOrder;
                    currentList[currentItem].order = newOrder;
                    currentMenuPosition.splice(-1, 1, newOrder);
                }
                enumerationsSave(enumerationsSubTypes.includes(currentType) && currentParam ? dataTypeFunction : currentType);
                break;
            }
            case dataTypeConfig:   {
                const currentIntervals = configOptions.getOption(currentItem, currentParam === configOptionScopeGlobal ? null : user);
                switch (currentItem) {
                    case cfgGraphsIntervals:{
                        const
                            currentIntervalIndex = Number(currentValue),
                            currentInterval = currentIntervals[currentIntervalIndex],
                            newPosition = currentIntervalIndex + (currentCommand === cmdItemMoveUp ? -1 : 1);
                        currentIntervals.splice(currentIntervalIndex, 1);
                        currentIntervals.splice(newPosition, 0, currentInterval);
                        currentMenuPosition.splice(-1, 1, newPosition);
                        configOptions.setOption(currentItem, user, currentIntervals);
                        menuClearCachedMenuItemsAndRows(user);
                        break;
                    }
                    default: {
                        break;
                    }
                }
                break;
            }

            default: {
                break;
            }
        }

        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdItemNameGet) {
        const currentEnumeration = enumerationsList[currentType].list;
        if (currentEnumeration[currentItem].isExternal) {
            const timeout = configOptions.getOption(cfgExternalMenuTimeout);
            messageTo(`${currentEnumeration[currentItem].state}.update`, {request: ['name', 'icon'], timeout: timeout}, {timeout: timeout}, (result) => {
                if (result.success) {
                    if (result.name) {
                        enumerationsUpdateItemName(user, currentType, currentItem, currentEnumeration[currentItem], result.name);
                    }
                    if (result.icon) {
                        currentEnumeration[currentItem].icon = result.icon;
                    }
                    enumerationsSave(currentType);
                    menuClearCachedMenuItemsAndRows(user);
                }
                menuProcessMenuItem(user);
                logs(`${currentEnumeration[currentItem].state}.update result = ${JSON.stringify(result)}`);
            });
        }
        else {
            enumerationsRereadItemName(user, currentItem, currentEnumeration[currentItem]);
            menuProcessMenuItem(user);
        }
    }
    else if (currentCommand === cmdCreateReportEnum) {
        logs(`currentCommand params = ${JSON.stringify([currentCommand, currentType, currentItem, currentParam] )}`);
        let
            obj = {...simpleReportFunctionTemplate};
        obj.common.name.en = stringCapitalize(currentItem);
        try {
            const newReportId = `${prefixEnums}.${currentParam}.${currentItem}`;
            // @ts-ignore
            await setObjectAsync(newReportId, obj);
            logs(`Object ${newReportId} is created : ${existsObject(newReportId)}`);
            menuClearCachedMenuItemsAndRows(user);
        }
        catch (error) {
            console.error(`Object can not be created - setObject don't enabled. Error is ${JSON.stringify(error)}`);
            currentMenuPosition.splice(-1);
        }
        if (Object.keys(enumerationsList[dataTypeReport].enums).length > 1) currentMenuPosition.splice(-1);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdUseCommonTranslation) {
        const
            commonTranslationId = `${translationsCommonFunctionsAttributesPrefix}.${currentItem.split('.').pop()}`,
            currentTranslationIdValue = translationsItemGet(user, currentItem);
        if ((translationsItemGet(user, commonTranslationId) === commonTranslationId) && (currentTranslationIdValue !== currentItem)) {
            translationsItemStore(user, commonTranslationId, currentTranslationIdValue);
        }
        translationsItemStore(user, currentItem, commonTranslationId);
        menuProcessMenuItem(user, undefined, cachedGetValue(user, cachedMenuItem).slice(0,-1));
    }
    else if (currentCommand === cmdAlertSubscribe) {
        alertsManage(user, currentType, currentItem, currentParam, alertsGetStateAlertDetailsOrThresholds(user, currentType));
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user);
    }
    else if (currentCommand === cmdItemJumpTo) {
        const jumpToArray = currentType.split('.');
        jumpToArray.forEach(menuIndex => {
            if (menuIndex === jumpToUp) {
                if (currentMenuPosition.length) currentMenuPosition.pop();
            }
            else if ((menuIndex === jumpToLeft) || (menuIndex === jumpToRight)) {
                if (currentMenuPosition.length) {
                    let currentPos = currentMenuPosition.pop();
                    if (! isNaN(currentPos)) {
                        currentPos = Number(currentPos) + (menuIndex === jumpToLeft ? -1 : 1);
                    }
                    currentMenuPosition.push(currentPos);
                }
            }
            else if (menuIndex) {
                currentMenuPosition.push(menuIndex);
            }
        });
        menuClearCachedMenuItemsAndRows(user);
        logs(`currentMenuItem = ${currentMenuPosition}`);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdSetOffset) {
        currentMenuPosition = currentType.split('.');
        const currentOffset = [currentType, currentItem].join(itemsDelimiter);
        cachedSetValue(user, cachedMenuButtonsOffset, currentOffset);
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdDeleteAllSentImages) {
        sentImagesDelete(user);
        menuClearCachedMenuItemsAndRows(user);
        menuProcessMenuItem(user, undefined, currentMenuPosition);
    }
    else if (currentCommand === cmdNoOperation) {
        menuProcessMenuItem(user);
    }
}

//*** User input and command processing - end ***//



//*** Group chats - begin ***//

/**
* This functions collects a list of the group chats by looking thru the tree of the its cache states.
* @param {boolean} activeOnly - Boolean selector to filter only active group chats, i.e. with last message from the bot not older the 48 hours
* @returns {number[]} Array of group chats Ids
*/
function telegramGetGroupChats(activeOnly) {
    const chatsList = new Array();
    $(`state[id=${prefixCacheStates}.*.${cachedMenuOn}]`).each((stateId) => {
        const chatId = Number(stateId.split('.').slice(-2,-1));
        if ((! isNaN(chatId)) && (chatId < 0)) {
            if (activeOnly) {
                const
                    user = telegramUsersGenerateUserObjectFromId(undefined, chatId),
                    [_lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48),
                    [_lastUserMessageId, isUserMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedLastMessage, timeDelta96);
                if ((! isBotMessageOldOrNotExists) && (! isUserMessageOldOrNotExists)) chatsList.push(chatId);
            }
            else {
                chatsList.push(chatId);
            }

        }
    });
    return chatsList;
}

//*** Group chats - end ***//


//*** send messages to Telegram - begin ***//

const cachedTelegramMessagesQueue = 'messagesQueue';

/**
 * This function prepare appropriate telegram message object with path to the file and push it to the queue.
 * @param {object} user - The user object.
 * @param {string} fileFullPath - The full path to the file.
 * @param {function=} callback - The callback function, to return the result of sending file.
 */
function telegramSendFile(user, fileFullPath, callback) {
    nodeFS.access(fileFullPath, nodeFS.constants.R_OK, (error) => {
        if (error) {
            const errorMessage = `Can't read file ${fileFullPath}! Error is ${JSON.stringify(error)}`;
            console.warn(errorMessage);
            if (callback) callback({success: false, error: errorMessage});
        }
        else {
            const documentTelegramObject = {
                text: fileFullPath,
                type: 'document'
            };
            if (user.userId) documentTelegramObject.user = telegramUsersGetUserIdForTelegram(user);
            if (user.userId != user.chatId) {
                documentTelegramObject.chatId = user.chatId;
            }
            menuClearCachedMenuItemsAndRows(user);
            const clearCurrent = telegramMessagesClearCurrentMessage(user, false, true);
            telegramMessagesPushMessageToQueue(user, clearCurrent ? [clearCurrent, documentTelegramObject] : documentTelegramObject);
            if (callback) callback({success: true});
        }
    });
}

/**
 * This function prepare appropriate telegram message object with path to the file and push it to the queue.
 * @param {object} user - The user object.
 * @param {string} imageFullPath - The full path to the image file.
 * @param {function=} callback - The callback function, to return the result of sending image.
 */
function telegramSendImage(user, imageFullPath, callback) {
    nodeFS.access(imageFullPath, nodeFS.constants.R_OK, (error) => {
        if (error) {
            const errorMessage = `Can't read file ${imageFullPath}! Error is ${JSON.stringify(error)}`;
            console.warn(errorMessage);
            if (callback) callback({success: false, error: errorMessage});
        }
        else {
            const imageTelegramObject = {
                text: imageFullPath,
                type: 'photo'
            };
            if (user.userId) imageTelegramObject.user = telegramUsersGetUserIdForTelegram(user);
            if (user.userId != user.chatId) {
                imageTelegramObject.chatId = user.chatId;
            }
            menuClearCachedMenuItemsAndRows(user);
            const clearCurrent = telegramMessagesClearCurrentMessage(user, false, true);
            telegramMessagesPushMessageToQueue(user, clearCurrent ? [clearCurrent, imageTelegramObject] : imageTelegramObject);
            if (callback) callback({success: true});
        }
    });
}

/**
 * This function process the `extensionsSendFileCommand`.
 * @param {object} data - The object with the 'user'(the uses object) and 'fileFullPath' properties.
 * @param {function} callback - The function to return status to extension.
 */
function telegramOnSendFileCommand(data, callback) {
    const {user, fileFullPath} = data;
    if (user && fileFullPath) {
        telegramSendFile(user, fileFullPath, callback);
    }
    else {
        const error = `Wrong data provided! ${JSON.stringify(data)}`;
        console.warn(error);
        callback({success: false, error});
    }
}

/**
 * This function process the `extensionsSendFileCommand`.
 * @param {object} data - The object with the 'user'(the uses object) and 'imageFullPath' properties.
 * @param {function} callback - The function to return status to extension.
 */
function telegramOnSendImageCommand(data, callback) {
    const {user, imageFullPath} = data;
    if (user && imageFullPath) {
        telegramSendImage(user, imageFullPath, callback);
    }
    else {
        const error = `Wrong data provided! ${JSON.stringify(data)}`;
        console.warn(error);
        callback({success: false, error});
    }
}


/**
 * This function finalize preparation of Telegram message object, to send or edit Telegram bot message, and push it to the sending queue.
 * @param {object} user - The user object.
 * @param {object} preparedMessageObject - The prepared for "draw" the Telegram message object.
 * @param {boolean=} clearBefore - The selector, to identify, is it needed to be previous message from Auto Telegram Menu cleared.
 * @param {boolean=} clearUserMessage - The selector to identify, should be user message to be deleted.
 * @param {boolean=} createNewMessage - The selector to create new Telegram message instead of edit exiting one.
 * @param {boolean=} isSilent - The selector, how to inform user about message (show or not update of menu as a new message).
 */
function telegramMessagesFormatAndPushToQueueMessage(user, preparedMessageObject, clearBefore, clearUserMessage, createNewMessage, isSilent) {
    const alertMessages = alertGetMessages(user, true);
    logs('alertMessages = ' + JSON.stringify(alertMessages));
    let alertMessage = '';
    if (alertMessages.length && (preparedMessageObject.buttons !== undefined) ) {
        // @ts-ignore
        const alertDate = formatDate(new Date(alertMessages[alertMessages.length - 1].date), configOptions.getOption(cfgDateTimeTemplate, user));
        alertMessage = `<b><u>${alertDate}:</u> ${alertMessages[alertMessages.length - 1].message}</b>\r\n\r\n`;
        logs('alertMessage = ' + JSON.stringify(alertMessages[alertMessages.length - 1].message));
        let alertRow = [{ text: translationsItemCoreGet(user, cmdAcknowledgeAlert), group: 'alertMain', callback_data: cmdAcknowledgeAlert}];
        const
            alerts = alertsGet(),
            lastAlertId = alertMessages[alertMessages.length - 1].id;
        if (alerts.hasOwnProperty(lastAlertId) && alerts[lastAlertId].chatIds.has(user.chatId)) {
            alertRow.push({ text: translationsItemCoreGet(user, cmdAcknowledgeAndUnsubscribeAlert), group: 'alertMain', callback_data: cmdAcknowledgeAndUnsubscribeAlert});
        }
        if (alertMessages.length > 1) {
            alertRow.push({ text: '(' + alertMessages.length + ') ' + translationsItemCoreGet(user, cmdAcknowledgeAllAlerts), group: 'alertAll', callback_data: cmdAcknowledgeAllAlerts});
        }
        for (const alertButtons of menuSplitButtonsArrayIntoButtonsPerRowsArray(user, alertRow).values()) {
            preparedMessageObject.buttons.push(alertButtons);
        }
    }
    const isMenuOn = (cachedExistsValue(user, cachedMenuOn) && cachedGetValue(user, cachedMenuOn));
    logs(`isMenuOn = ${JSON.stringify(isMenuOn)}, toDisplayMenu = ${JSON.stringify(createNewMessage)}`);
    if (isMenuOn || createNewMessage) {
        // @ts-ignore
        const timeStamp = '<i>' + formatDate(new Date(), configOptions.getOption(cfgDateTimeTemplate, user)) + '</i> ';
        const lastMessage = cachedGetValue(user, cachedLastMessage);
        if ((lastMessage != JSON.stringify(preparedMessageObject)) || createNewMessage || clearBefore) {
            logs('lastMessage is not equal to preparedMessageObject, sendTo Telegram initiated');
            logs('lastMessage = ' + JSON.stringify(lastMessage));
            logs('preparedMessageObject = ' + JSON.stringify(preparedMessageObject));
            cachedSetValue(user, cachedLastMessage, JSON.stringify(preparedMessageObject));
            const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48);
            let telegramObject = {
                    text: alertMessage + (preparedMessageObject.buttons === undefined ? '' : timeStamp) + preparedMessageObject.menutext,
                    parse_mode: 'HTML'
                };
            if (user.userId) telegramObject.user = telegramUsersGetUserIdForTelegram(user);
            if (user.userId != user.chatId) {
                telegramObject.chatId = user.chatId;
            }
            if ((createNewMessage && (! isMenuOn)) || clearBefore || isBotMessageOldOrNotExists) {
                if (preparedMessageObject.buttons !== undefined) {
                    telegramObject.reply_markup = {
                            inline_keyboard: preparedMessageObject.buttons,
                        };
                }
                if (isSilent) telegramObject.disable_notification = isSilent;
            }
            else {
                telegramObject[telegramCommandEditMessage] = {
                        options: {
                            chat_id: user.chatId,
                            message_id: lastBotMessageId,
                            parse_mode: 'HTML'
                        }
                    };
                if (preparedMessageObject.buttons !== undefined) {
                    telegramObject[telegramCommandEditMessage].options.reply_markup = {
                            inline_keyboard: preparedMessageObject.buttons,
                        };
                }
            }
            let telegramObjects = new Array();
            if (clearBefore ||
                    (
                        (
                            (! telegramObject.hasOwnProperty(telegramCommandEditMessage))  ||
                            (telegramObject[telegramCommandEditMessage] === undefined)
                        ) && (! isBotMessageOldOrNotExists)
                    )
                ) {
                const clearCurrent = telegramMessagesClearCurrentMessage(user, false, true);
                if (clearCurrent) telegramObjects.push(clearCurrent);
            }
            telegramObjects.push(telegramObject);
            if (clearUserMessage) {
                telegramObjects = [telegramObjects];
                const clearUser = telegramMessagesClearCurrentMessage(user, clearUserMessage, true);
                if (clearUser) telegramObjects.push(clearUser);
            }
            // logs(`telegramObjects = ${JSON.stringify(telegramObjects, null, 2)}`, _l)
            telegramMessagesPushMessageToQueue(user, telegramObjects);
            if (createNewMessage || clearBefore ) {
                cachedSetValue(user, cachedMenuOn, true);
            }
        }
        else {
            logs('lastMessage is equal to preparedMessageObject, sendTo Telegram skipped');
        }

    }

}

/**
 * This function pushes current Telegram message object to the queue/
 * @param {object} user - The user object.
 * @param {object|object[]} telegramObject - The Telegram message object (or an array of "linked" objects) to push to the queue.
 */
function telegramMessagesPushMessageToQueue(user, telegramObject) {
    let userMessagesQueue = cachedGetValue(user, cachedTelegramMessagesQueue);
    logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
    if (! userMessagesQueue) {
        userMessagesQueue = [];
    }
    const isReady = userMessagesQueue.length === 0;
    if (typeOf(telegramObject, 'array') && telegramObject.length && typeOf(telegramObject[0], 'array')) {
        telegramObject.forEach(telegramSubObject => userMessagesQueue.push(telegramSubObject));
    }
    else {
        userMessagesQueue.push(telegramObject);
    }
    logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue, null, 2)}`);
    cachedSetValue(user, cachedTelegramMessagesQueue, userMessagesQueue);
    if (isReady) {
        telegramMessagesSendToFromQueue(user);
    }
}


/**
 * This take the appropriate message from queue and send it to the Telegram adapter.
 * @param {object} user - The user object.
 * @param {number=} messageId - The Telegram message unique Id.
 */
function telegramMessagesSendToFromQueue(user, messageId) {

    /**
     * The function to process the result of sending the message to the Telegram adapter, and take and process a "linked" one, if it exists(for example delete and new one).
     * @param {number} result - The result of sending the message by Telegram adapter.
     * @param {object} user - The user object.
     * @param {object} telegramObject - The Telegram message object, result of sending is processing.
     * @param {object[]} telegramObjects - The arrays of Telegram objects, which can contain one message, or two, "linked" together.
     * @param {number} currentLength - The current length of queue.
     * @param {boolean=} waitForLog - The selector to identify is needed to wait for log for error details.
     */
    function telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, sendToTS, waitForLog) {
        let
            userMessagesQueue = cachedGetValue(user, cachedTelegramMessagesQueue),
            telegramLastUserError;
        const currentTS = Date.now();
        if (! result) {
            if (waitForLog) {
                setTimeout(() => {
                    telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, sendToTS, false);
                },
                telegramDelayToCatchLog);
            }
            else {
                // logs(`telegramLastErrors = ${JSON.stringify(telegramLastErrors)}, ${telegramLastErrors.hasOwnProperty(`${user.chatId}`)}`, _l)
                if (telegramLastErrors && telegramLastErrors.hasOwnProperty(`${user.chatId}`) && telegramLastErrors[`${user.chatId}`]) {
                    telegramLastUserError = telegramLastErrors[`${user.chatId}`];
                    if ((telegramLastUserError.ts < sendToTS) || (telegramLastUserError.ts > currentTS)) {
                        telegramLastUserError = null;
                    }
                }
                console.warn(`Can't send message (${JSON.stringify(telegramObject)}) to (${JSON.stringify({...user, rootMenu : null})})!\nResult = ${JSON.stringify(result)}.\nError details = ${JSON.stringify(telegramLastUserError, null, 2)}.`);
                if (telegramLastUserError && telegramLastUserError.hasOwnProperty['error'] && (telegramLastUserError.error.level === telegramErrorLevelFatal)) {
                    setTimeout(() => {
                        telegramMessagesSendToFromQueue(user);
                    },
                    telegramDelayToSendReTry);
                }
                else if (telegramLastUserError && telegramLastUserError.hasOwnProperty['error'] && (telegramLastUserError.error.level === telegramErrorLevelTelegram) && telegramObject && telegramObject.hasOwnProperty(telegramLastUserError.command)) {
                    const
                        [currentMessageId, isCurrentMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48);
                    if ((! isCurrentMessageOldOrNotExists ) && (currentMessageId != telegramObject[telegramLastUserError.command].options.message_id) ) {
                        telegramObject[telegramLastUserError.command].options.message_id = currentMessageId;
                        sendTo(telegramAdapter, telegramObject, result => {telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true)});
                    }
                    else {
                        result = -1;
                    }
                }
                else if (telegramObject && (telegramObject.hasOwnProperty(telegramCommandDeleteMessage) || telegramObject.hasOwnProperty(telegramCommandEditMessage))) {
                    const
                        messageCommand = telegramObject.hasOwnProperty(telegramCommandDeleteMessage) ? telegramCommandDeleteMessage : telegramCommandEditMessage,
                        [currentMessageId, isCurrentMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48);
                    if ((! isCurrentMessageOldOrNotExists ) && (currentMessageId != telegramObject[messageCommand].options.message_id) ) {
                        telegramObject[messageCommand].options.message_id = currentMessageId;
                        sendTo(telegramAdapter, telegramObject, result => {telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true)});
                    }
                    else {
                        result = -1;
                    }
                }
                if (telegramObject && (result === -1)) {
                    if (telegramObject.hasOwnProperty(telegramCommandEditMessage) && (telegramObjects.length === 1)) {
                        telegramObject.reply_markup = {
                            inline_keyboard: telegramObject[telegramCommandEditMessage].options.reply_markup.inline_keyboard
                        };
                        delete telegramObject[telegramCommandEditMessage];
                        telegramObjects = [telegramObject];
                        sendTo(telegramAdapter, telegramObject, result => {telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true)});
                    }
                }
            }
        }
        if (result) {
            if ((result === 1) && telegramObject.hasOwnProperty('type') && (['document','photo'].includes(telegramObject['type']) )) {
                if (nodePath.dirname(telegramObject.text).includes(temporaryFolderPrefix)) nodeFS.rm(nodePath.dirname(telegramObject.text), { recursive: true, force: true }, (err) => {
                    if (err) console.warn(`Can't delete temporary file  '${telegramObject.text}' and directory! Error: '${JSON.stringify(err)}'.`);
                });
            }
            // logs(`result = ${result}, getCachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)}, telegramObject = ${JSON.stringify(telegramObject)}`);
            // logs(`\n = ${(result === 1) && telegramObject && telegramObject[telegramCommandDeleteMessage] && telegramObject[telegramCommandDeleteMessage].isBotMessage}`)
            if ((result === 1) && telegramObject && telegramObject[telegramCommandDeleteMessage] && telegramObject[telegramCommandDeleteMessage].isBotMessage && cachedExistsValue(user, cachedBotSendMessageId)) {
                // logs(`getCachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)} == telegramObject[telegramCommandDeleteMessage].options.message_id ${telegramObject[telegramCommandDeleteMessage].options.message_id} == ${getCachedState(user, cachedBotSendMessageId) == telegramObject[telegramCommandDeleteMessage].options.message_id}`)
                if (cachedGetValue(user, cachedBotSendMessageId) == telegramObject[telegramCommandDeleteMessage].options.message_id) {
                    cachedDelValue(user, cachedBotSendMessageId);
                }

            }
            if (telegramObjects.length) {
                telegramObject = telegramObjects.shift();
                // logs(`\ntelegramObject = ${JSON.stringify(telegramObject)}, \ntelegramObjects = ${JSON.stringify(telegramObjects)}`);
                sendTo(telegramAdapter, telegramObject, result => {telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true)});
            }
            else {
                if (userMessagesQueue) {
                    userMessagesQueue.splice(0, currentLength);
                    logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
                    if (userMessagesQueue.length === 0) {
                        cachedDelValue(user, cachedTelegramMessagesQueue);
                    }
                    else {
                        cachedSetValue(user, cachedTelegramMessagesQueue, userMessagesQueue);
                    }
                }
            }
        }
    }

    if (telegramIsConnected) {
        const userMessagesQueue = cachedGetValue(user, cachedTelegramMessagesQueue);
        if (userMessagesQueue && userMessagesQueue.length ) {
            if (messageId === undefined) {
                const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48);
                if (! isBotMessageOldOrNotExists) {
                    messageId = lastBotMessageId;
                }
            }
            let
                /**
                 * If messages in queue more then 2 - we will take last one, otherwise - first one.
                */
                currentPos = userMessagesQueue.length > 2 ? userMessagesQueue.length - 1 : 0,
                telegramObjects;
                // will send a last message, to prevent spamming the telegram with flipping some states in ioBroker. In case of user input - we will not lost any message
            do {
                telegramObjects = userMessagesQueue[currentPos];
                if (telegramObjects === undefined) {
                    if (currentPos < (userMessagesQueue.length - 1)) {
                        currentPos = userMessagesQueue.length - 1;
                    }
                    else if (currentPos > 0) (
                        currentPos -= 1
                    );
                    else {
                        cachedDelValue(user, cachedTelegramMessagesQueue);
                        currentPos = -1;
                    }
                    telegramObjects = currentPos >= 0 ? userMessagesQueue[currentPos] : undefined;
                }
                if (typeOf(telegramObjects, 'object')) telegramObjects = [telegramObjects];
                if (telegramObjects && telegramObjects[0][telegramCommandDeleteMessage] && telegramObjects[0][telegramCommandDeleteMessage].isBotMessage) {
                    telegramObjects[0][telegramCommandDeleteMessage].options.message_id = messageId;
                    if (telegramObjects[0][telegramCommandDeleteMessage].options.message_id === undefined) {
                        console.warn(`No message for Delete! Going to skip command ${JSON.stringify(telegramObjects[0])}.`);
                        telegramObjects.shift();
                    }
                    if (telegramObjects && (telegramObjects.length === 0)) {
                        userMessagesQueue.splice(currentPos, 1);
                        logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
                        if (userMessagesQueue.length === 0) {
                            cachedDelValue(user, cachedTelegramMessagesQueue);
                        }
                        else {
                            cachedSetValue(user, cachedTelegramMessagesQueue, userMessagesQueue);
                        }
                        telegramObjects = undefined;
                    }
                }
            } while ((telegramObjects === undefined) && (userMessagesQueue.length));
            if (telegramObjects) {
                if (messageId) {
                    if (telegramObjects[0].hasOwnProperty(telegramCommandEditMessage)) {
                        telegramObjects[0][telegramCommandEditMessage].options.message_id = messageId;
                    }
                }
                // logs(`messageId = ${messageId}`, _l);
                const
                    telegramObject = telegramObjects.shift(),
                    sentToTimeStamp = Date.now();
                // logs(`\n userMessagesQueue.length = ${userMessagesQueue.length}, userMessagesQueue = ${JSON.stringify(userMessagesQueue)}\ntelegramObject = ${JSON.stringify(telegramObject)}, \ntelegramObjects = ${JSON.stringify(telegramObjects)}`, _l);
                sendTo(telegramAdapter, telegramObject, result => {telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentPos + 1, sentToTimeStamp, true)});
            }
        }
    }
    else {
        telegramQueuesIsWaitingConnection.push(user);
    }
}


/**
 * This function generates a Telegram message object with a command to delete Telegram message (from bot or user), and return it or push to the queue.
 * @param {object} user - The user object.
 * @param {boolean} isUserMessageToDelete - The selector to delete a user message.
 * @param {boolean=} createTelegramObjectOnly - The selector to create and return message, instead of deletion.
 * @param {number=} messageIdToDelete - The Telegram message unique id for the deletion.
 * @returns
 */
function telegramMessagesClearCurrentMessage(user, isUserMessageToDelete, createTelegramObjectOnly, messageIdToDelete) {
    const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(user, cachedBotSendMessageId, timeDelta48);
    const messageId = messageIdToDelete ? messageIdToDelete : (isUserMessageToDelete ? cachedGetValue(user, cachedMessageId) : (isBotMessageOldOrNotExists ? undefined : lastBotMessageId));
    if (messageId) {
        logs('messageId = ' + messageId);
        const telegramObject = {
            deleteMessage: {
                options: {
                    chat_id: user.chatId,
                    message_id: messageId,
                },
                isBotMessage: ! isUserMessageToDelete,
            }
        };
        if (user.userId) telegramObject.user = telegramUsersGetUserIdForTelegram(user);
        if (user.userId != user.chatId) {
            telegramObject.chatId = user.chatId;
        }
        if (!createTelegramObjectOnly) {
            cachedSetValue(user, cachedLastMessage, '');
            telegramMessagesPushMessageToQueue(user, telegramObject);
        }
        return telegramObject;
    }
    return undefined;
}

/**
 * This function displays a pop-up message or confirm the pressing of the button.
 * @param {object} user - The user object
 * @param {string=} text - The text to be displayed.
 * @param {boolean=} showAlert - The show alert attribute.
 */
function telegramMessagesDisplayPopUpMessage(user, text, showAlert) {
    if(configOptions.getOption(cfgShowResultMessages, user)) {
        const telegramObject = {
            answerCallbackQuery: {
                show_alert: showAlert ? true : false
            }
        };
        if (text && (typeOf(text) === 'string') && text.length) {
            telegramObject.answerCallbackQuery.text = text;
        }
        /** Can send pop-up only in private chat **/
        if (user.userId == user.chatId) {
            if (user.userId) telegramObject.user = telegramUsersGetUserIdForTelegram(user);
            sendTo(telegramAdapter, telegramObject,    result => {
                if (! result) {
                    console.warn(`Can't send pop-up message (${JSON.stringify(telegramObject)}) to (${JSON.stringify(user)})!\nResult = ${JSON.stringify(result)}.`);
                }
            });
        }
    }
}

//*** send messages to Telegram - end ***//



//*** Telegram interaction - begin ***//

let telegramIsConnected = false;
const
    telegramQueuesIsWaitingConnection = [],
    telegramLastErrors = {},
    telegramErrorParseRegExp = /^telegram.\d\s+\(\d+\)\s+Cannot\s+send\s+(\w+)\s+\[chatId\s-\s(-?\d+)\]:\s+Error:\s(\w+?):\s(.+?):\s(.+)$/,
    telegramCommandEditMessage = 'editMessageText',
    telegramCommandDeleteMessage = 'deleteMessage',
    telegramErrorLevelFatal = 'EFATAL',
    telegramErrorLevelTelegram = 'ETELEGRAM',
    telegramDelayToSendReTry = 3000,
    telegramDelayToCatchLog = 20;

/**
 * This function extracts the user Id for the Telegram message object.
 * @param {object} user - The user object.
 * @returns {string|number} The userId
 */
function telegramUsersGetUserIdForTelegram(user) {
    if (!(user.hasOwnProperty('userName') && user.hasOwnProperty('firstName')) && cachedExistsValue(user, cachedUser)) {
        user = cachedGetValue(user, cachedUser);
    }
    if (user.hasOwnProperty('userName')) {
        return user.userName;
    }
    else if (user.hasOwnProperty('firstName')) {
        return user.firstName;
    }
    return user.userId;
}

/**
 * This function generate a user object based on userId and/or chatId.
 * @param {number=} userId
 * @param {number=} chatId
 * @returns
 */
function telegramUsersGenerateUserObjectFromId(userId, chatId) {
    let user = {
            userId: userId,
            chatId: userId ? userId : chatId
        };
    const cachedObject = cachedGetValue(user, cachedUser);
    if (cachedObject && (typeof(cachedObject) === 'object') && (cachedObject.hasOwnProperty('userName') || cachedObject.hasOwnProperty('firstName'))) {
        user = {...user, ...cachedObject};
        for (const attr in ['userId', 'chatId']) {
            if (typeof(user[attr]) === 'string') user[attr] = Number(user[attr]);
        }
    }
    return user;
}

function telegramOnLogError(logRecord) {
    if (typeOf(logRecord, 'object') && logRecord.hasOwnProperty('from') && (logRecord.from === telegramAdapter)) {
        try {
            const telegramErrorParsed = telegramErrorParseRegExp.exec(logRecord.message);
            if (telegramErrorParsed && (telegramErrorParsed.length === 6) &&
                // @ts-ignore
                (! isNaN(telegramErrorParsed[2]))) {
                telegramLastErrors[telegramErrorParsed[2]] = {
                    ts: logRecord.ts,
                    command: telegramErrorParsed[1],
                    error: {
                        level: telegramErrorParsed[3],
                        info: telegramErrorParsed[4],
                        message: telegramErrorParsed[5]
                    }
                };
                // logs(`telegramLastErrors[${telegramErrorParsed[2]}] = ${JSON.stringify(telegramLastErrors[telegramErrorParsed[2]])}`, _l)
            }
        }
        catch (error) {
            //
        }
    }
}


/**
 * This function used to watch the state `connected` of the Telegram adapter.
 * @param {object} connected - The special object, if called from subscription on changes.
 */
function telegramOnConnected(connected) {
    logs('connected = ' + JSON.stringify(connected));
    if (typeOf(connected,'object') && connected.hasOwnProperty('state') && connected.state.hasOwnProperty('val')) {
        telegramIsConnected = connected.state.val;
    }
    else {
        telegramIsConnected = false;
    }
    const
        telegramBotSendRawId = `${telegramAdapter}.communicate.botSendRaw`,
        telegramRequestRawId = `${telegramAdapter}.communicate.requestRaw`,
        telegramRequestPathFile = `${telegramAdapter}.communicate.pathFile`;
    unsubscribe(telegramBotSendRawId);
    unsubscribe(telegramRequestRawId);
    if (telegramIsConnected) {
        /** answerRawSubscribe */
        on({id: telegramBotSendRawId, change: 'ne'}, function answerRawSubscribe(obj) {
            let sent;
            try {
                sent = JSON.parse(obj.state.val);
            }
            catch (err) {
                logs(`JSON parse error: ${JSON.stringify(err)}`);
                return undefined;
            }
            // logs(`sent = ${JSON.stringify(sent, null, 2)}`);
            if (sent && typeof(sent) === 'object' && sent.hasOwnProperty('message_id') && sent.message_id && sent.hasOwnProperty('chat') && sent.chat.hasOwnProperty('type')) {
                let user = {};
                const messageId = sent.message_id;
                if (sent.chat.type === 'private') {
                    user  = {
                        userId: sent.chat.id,
                        chatId: sent.chat.id,
                        firstName: sent.chat.first_name,
                        lastName: sent.chat.last_name,
                        userName: sent.chat.username
                    };
                }
                else {
                    user.chatId = sent.chat.id;
                }
                let
                    isBotMessage = false,
                    isDocument = false,
                    userId = 0;
                logs(`user = ${JSON.stringify(user)}, botSendMessageId = ${JSON.stringify(messageId)}`);
                if (sent.hasOwnProperty("reply_markup") && sent.reply_markup.hasOwnProperty("inline_keyboard") && (sent.reply_markup.inline_keyboard !== undefined) ) {
                    const inline_keyboard = sent.reply_markup.inline_keyboard;
                    logs('inline_keyboard = ' + JSON.stringify(inline_keyboard, null, 2));
                    isBotMessage = inline_keyboard.findIndex(
                        (keyboard) => (
                            keyboard.findIndex(
                                (element) => {
                                    if (element.hasOwnProperty("callback_data") && (element.callback_data.indexOf(cmdClose) === 0)) {
                                        userId = element.callback_data.split(itemsDelimiter).pop();
                                        return true;
                                    }
                                    return false;
                                }
                            ) >= 0
                        )
                    ) >= 0;
                    if (isBotMessage && messageId) cachedSetValue(user, cachedBotSendMessageId, messageId);
                    logs(`isBotMessage = ${JSON.stringify(isBotMessage)}, botSendMessageId = ${JSON.stringify(messageId)}`);
                }
                else if ((sent.hasOwnProperty('text')) && sent.text.includes(botMessageStamp)) {
                    logs(`is Bot Message - ${sent.text}`);
                    isBotMessage = true;
                }
                if (sent.hasOwnProperty('photo')) {
                    // logs(`Photo, messageId =  ${sent.message_id}`);
                    sentImageStore(user, sent.message_id);
                    isDocument = true;
                }
                else if (sent.hasOwnProperty('document')) {
                    isDocument = true;
                }
                if (isBotMessage) {
                    if ((! user.userId) && userId) {
                        user.userId = Number(userId);
                        user = {...cachedGetValue({userId, chatId: userId}, cachedUser), ...user};
                        logs(`user = ${JSON.stringify(user)}`);
                    }
                    cachedSetValue(user, cachedMenuOn, true);
                    telegramMessagesSendToFromQueue(user, messageId );
                }
                else if (isDocument) {
                    if (! user.userId) {
                        user = {...cachedGetValue(user, cachedUser), ...user};
                    }
                    // logs(`CachedState(user, cachedMenuOn) = ${getCachedState(user, cachedMenuOn)}, CachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)}`)
                    menuClearCachedMenuItemsAndRows(user);
                    cachedDelValue(user, cachedMenuOn);
                    menuProcessMenuItem(user);
                }
            }
        });
        /** requestRawSubscribe */
        on({id: telegramRequestRawId, change: 'ne'}, function requestRawSubscribe(obj) {
            let request;
            try {
                request = JSON.parse(obj.state.val);
            }
            catch (err) {
                logs(`JSON parse error: ${JSON.stringify(err)}`);
                return undefined;
            }
            logs(`raw = ${JSON.stringify(request, null, 2)}`);
            if (request.hasOwnProperty('from') && request.from.hasOwnProperty('id')) {
                const
                    userId = request.from.id,
                    users = usersInMenu.getUsers();
                if (users.includes(userId)) {
                    let messageId, chatId, command;
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
                            logs(`user = ${JSON.stringify(userId)}, chatId = ${JSON.stringify(chatId)}, messageId = ${JSON.stringify(messageId)}, command = ${JSON.stringify(command)}`);
                            let user = {};
                            if ((command !== undefined) || request.hasOwnProperty('document')) {
                                user  = {
                                    userId: request.from.id,
                                    chatId: chatId,
                                    firstName: request.from.first_name,
                                    lastName: request.from.last_name,
                                    userName: request.from.username
                                };
                                if (user.userId == user.chatId) cachedSetValue(user, cachedUser, user);
                            }
                            if (command !== undefined) {
                                if (request.data) {
                                    /** if by some reason the menu is freezed - delete freezed queue ...**/
                                    if (cachedExistsValue(user, cachedTelegramMessagesQueue)) {
                                        console.warn(`Some output is in cache:\n${JSON.stringify(cachedGetValue(user, cachedTelegramMessagesQueue))}.\nGoing to delete it!`);
                                        cachedDelValue(user, cachedTelegramMessagesQueue);
                                    }
                                    /** and as we received command - the menu is on now **/
                                    // setCachedState(user, cachedMenuOn, true);
                                }
                                cachedSetValue(user, cachedMessageId, messageId);
                                commandUserInputCallback(user, command);
                            }
                            else if (request.hasOwnProperty('document')) {
                                if (cachedExistsValue(user, cachedIsWaitForInput)) {
                                    const [isWaitForInput, currentType, currentItem, _currentParam, _currentValue, _currentSubParam, _currentSubValue, ..._otherItems] = commandUnpackParams(cachedGetValue(user, cachedIsWaitForInput));
                                    // logs(`isWaitForInput = ${isWaitForInput}, subMenuItemId = ${subMenuItemId}`);
                                    if (isWaitForInput === cmdItemUpload) {
                                        cachedSetValue(user, cachedIsWaitForInput, commandsPackParams(cmdItemUpload, currentType, request.document.file_name, request.document.file_size, currentItem));
                                        on({id: telegramRequestPathFile, change: 'any'}, (obj)  => {
                                            unsubscribe(telegramRequestPathFile);
                                            commandUserInputCallback(user, obj.state.val);
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    console.warn(`Access denied. User ${JSON.stringify(request.from.first_name)} ${JSON.stringify(request.from.last_name)} (${JSON.stringify(request.from.username)}) with id = ${userId} not in the list!`);
                }
            }
        });
        setTimeout( () => {
                while (telegramQueuesIsWaitingConnection.length) {
                    telegramMessagesSendToFromQueue(telegramQueuesIsWaitingConnection.shift());
                }
            },
            telegramDelayToSendReTry
        );
    }
}

//*** Telegram iteraction - end ***//

/**
 * This function is used to init and start an Auto Telegram Menu.
 */
async function autoTelegramMenuInstanceInit() {

    configOptions.loadOptions(); // 1
    configOptions.subscribeOnOptions();

    rolesInMenu.refresh();
    rolesInMenu.assignRelated((roleId) => usersInMenu.getUsers(roleId)); // 2
    configOptions.subscribeOnOption(cfgMenuRoles, () => {rolesInMenu.refresh()});
    usersInMenu.assignRelated((roleId, compiled) => rolesInMenu.getRoles(roleId, compiled));
    usersInMenu.refresh();
    usersInMenu.getUsers().forEach(userId => {if (usersInMenu.validId(userId)) configOptions.loadOptions(usersInMenu.getUser(userId));}); // 3
    configOptions.subscribeOnOption(cfgMenuUsers, () => {usersInMenu.refresh()});

    /** Cached states */
    // @ts-ignore
    onMessage(extensionsGetCachedStateCommand, cachedOnGetCachedState); // 4
    // @ts-ignore
    onMessage(extensionsSetCachedStateCommand, cachedOnSetCachedState); // 5

    /** send File or Image */
    // @ts-ignore
    onMessage(extensionsSendFileCommand, telegramOnSendFileCommand);
    // @ts-ignore
    onMessage(extensionsSendImageCommand, telegramOnSendImageCommand);

    /** update translation */
    translationsLoad();

    if (Object.keys(translationsList).length === 0) {
        await translationsInitialLoadLocalesFromRepository();
    }

    /** enumerationItems Init */
    //External Scripts Init
    // @ts-ignore
    onMessage(extensionsRegisterCommand, extensionsOnRegisterToAutoTelegramMenu); // 6

    Object.keys(enumerationsList).forEach(itemType => {
        enumerationsLoad(itemType);
        enumerationsInit(itemType, itemType === dataTypeFunction);
        enumerationsSave(itemType);
    });

    const telegramConnectedId = `system.adapter.${telegramAdapter}.connected`;
    /*** subscribe on Telegram ***/
    telegramOnConnected({state: getState(telegramConnectedId)});
    on({id: telegramConnectedId, change: 'ne'}, telegramOnConnected);
    onLog('error', telegramOnLogError);

    /** load and subcribe on alerts */
    alertsInit(true);

    if (configOptions.getOption(cfgConfigBackupCopiesCount)) {
        _backupScheduleReference = schedule({hour: 2, minute: 5},() => {backupCreate(backupModeAuto)});
    }

    if (configOptions.getOption(cfgUpdateMessagesOnStart)) {
        const updateAt = new Date(Date.now() + configOptions.getOption(cfgUpdateMessagesOnStart)*60*1000);
        schedule({
                second: updateAt.getSeconds(),
                hour: updateAt.getHours(),
                minute: updateAt.getMinutes(),
                date: updateAt.getDate(),
                month: updateAt.getMonth(),
                year: updateAt.getFullYear()
            },
            () => {
                console.log(`Refresh after start is scheduled on ${updateAt.toString()} fo all users!`);
                menuRenewMenuMessage(menuRefreshTimeAllUsers, true);
            }
    );
    }
}


autoTelegramMenuInstanceInit();



//*** Utility functions - begin ***//

/**
 * This function is a wrapper of embedded `typeof` operator.
 * @param {*} value - The input value, to return or check a type of it.
 * @param {string=} compareWithType - The text code of possible JavaScript type, to compare with.
 * @returns {string|boolean} The result is a text, when `compareWithType` is not defined, or the boolean value.
 */
function typeOf(value, compareWithType) {
    let result;
    if (Array.isArray(value) || (value instanceof Array)) {
        result = 'array';
    }
    else if (value instanceof Map) {
        result = 'map';
    }
    else if (value instanceof RegExp) {
        result = 'regexp';
    }
    else if (value instanceof Date) {
        result = 'date';
    }
    else {
        result = typeof(value);
    }
    if (compareWithType && (typeof(compareWithType) === 'string') && compareWithType.length) {
        return result === compareWithType;
    }
    else {
        return result;
    }
}


/**
 * This function capitalize the first letter of string.
 * @param {string} string - The string to capitalize.
 * @returns {string} The result string.
 */
function stringCapitalize(string) {
    if (string && (typeof(string) === 'string')) {
        return string[0].toUpperCase() + string.slice(1);
    }
    return '';
}

/**
 * This function is doing a full clone of any object with all levels of hierarchy.
 * @param {any} obj
 * @returns
 */
function objectDeepClone(obj) {
    // logs(`obj = ${JSON.stringify(obj)}`);
    let objCopy;

    /** Handle the 3 simple types, and null or undefined */
    if ((obj == null) || (obj == undefined) || (typeof(obj) !== "object")) return obj;

    /** Handle Date */
    if (obj instanceof Date) {
        objCopy = new Date();
        objCopy.setTime(obj.getTime());
        return objCopy;
    }

    /** Handle Map */
    if (obj instanceof Map/* obj instanceof Map */) {
        objCopy = new Map();
        obj.forEach((value, key) => (objCopy.set(key, objectDeepClone(value))));
        return objCopy;
    }

    /** Handle Array */
    if (Array.isArray(obj) || (obj instanceof Array)) {
        objCopy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            objCopy[i] = objectDeepClone(obj[i]);
        }
        return objCopy;
    }

    /** Handle RegExp */
    if (obj instanceof RegExp) {
        objCopy = new RegExp(obj.toString());
    }

    /** Handle any objects */
    if (typeof(obj) === "object") {
        objCopy = {};
        for (let attr in obj) {
            if (obj.hasOwnProperty(attr)) objCopy[attr] = objectDeepClone(obj[attr]);
        }
        return objCopy;
    }

    throw new Error(`Unable to copy obj: '${JSON.stringify(obj)}'! Its type '${typeof(obj)}' isn't supported!`);
}

/**
 * This function took a `template` object and enreach it by data from the `inputObject` on a first level of inheritance.
 * @param {any} template - The teplate object.
 * @param {any} inputObject - The input object.
 * @param {any=} level - The level of inheritance.
 * @returns {any} The result of enreach.
 */
function objectAssignToTemplateLevelOne(template, inputObject, level) {
    logs(`template = ${JSON.stringify(template)}`);
    logs(`obj = ${JSON.stringify(inputObject)}`);
    logs(`level = ${JSON.stringify(level)}`);


    if(( level === null) || ( level === undefined)) level = 0;

    if ((inputObject === null) || (inputObject === undefined))  {
        return objectDeepClone(template);
    }

    if (typeOf(template, 'object') && typeOf(inputObject, 'object')) {
        if (level) {
            return objectDeepClone(inputObject);
        }
        else {
            let copy = {};
            for (const key of Object.keys(template)) {
                const newValue = objectAssignToTemplateLevelOne(template[key], inputObject[key], level++);
                if (newValue !== undefined) copy[key] =  newValue;
            }
            return copy;

        }
    }
    else {
        return objectDeepClone(inputObject);
    }
}


/**
 * This function creates a new object, based on an input one, with sorted properties.
 * @param {object} inputObject - The input object.
 * @returns {object} The "sorted" object.
 */
function objectKeysSort(inputObject) {
    const sortedObject = {};
    if (typeof(inputObject) === 'object') {
            Object.keys(inputObject).sort().forEach((id) => {
                if (typeof(inputObject[id]) === 'object') {
                    sortedObject[id] = objectKeysSort(inputObject[id]);
                }
                else {
                    sortedObject[id] = inputObject[id];
                }
            });
    }
    return sortedObject;
}

/**
 * This function logs the message, in case of debug variable is set.
 * @param {string} txt - The text to be logged.
 * @param {any=} debug - The selector for the logging.
 */
function logs(txt, debug) {
    if ((configOptions.getOption(cfgDebugMode)) || (debug !== undefined)){
        console.log((arguments.callee.caller  ? arguments.callee.caller.name : '') + ': ' + txt);
    }
}

/**
 * The replacer function, to convert map objects to JSON.
 * @param {any} key - The key(name) of the object, to be replaced.
 * @param {any} value - The value of the object, to be replaced.
 * @returns {any} The result of replace.
 */
function mapReplacer(key, value) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: [...value]
      };
    }
    else {
      return value;
    }
}

/**
 * The reviver function, to convert JSON to the Map object.
 * @param {any} key - The key(name) of the object, to be revived.
 * @param {any} value - The value of the object, to be revived.
 * @returns {any} The result of revive.
 */
function mapReviver(key, value) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
}

//*** Utility functions - end ***//
