//"use strict";

/* global autoTelegramMenuTelegramAdapterInstanceId */
/*************************************************/
/* Primary and only one thing to configure     */
/*************************************************/
const telegramInstance = autoTelegramMenuTelegramAdapterInstanceId
  ? `${autoTelegramMenuTelegramAdapterInstanceId}`
  : '0'; // Primary and only one config parameter for the script
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
Object.defineProperty(Function.prototype, 'toJSON', {
  // eslint-disable-next-line space-before-function-paren
  value: function () {
    return `function ${this.name}`;
  },
});

/*** Make RegExp to be printable in JSON.stringify with names ***/
Object.defineProperty(RegExp.prototype, 'toJSON', {
  value: RegExp.prototype.toString,
});

/*** Make new method `format` to be available for the Date object ***/
/*** Make RegExp to be printable in JSON.stringify with names ***/
Object.defineProperty(RegExp.prototype, 'toJSON', {
  value: RegExp.prototype.toString,
});

//*** Commands - begin ***//
const cmdPrefix = 'cmd',
  cmdSetState = `${cmdPrefix}SetState`,
  cmdExternalCommand = `${cmdPrefix}ExternalCommand`,
  cmdBack = `${cmdPrefix}Back`,
  cmdClose = `${cmdPrefix}Close`,
  cmdHome = `${cmdPrefix}Home`,
  cmdAcknowledgeAlert = `${cmdPrefix}AckAlert`,
  cmdAcknowledgeAllAlerts = `${cmdPrefix}AckAllAlerts`,
  cmdAcknowledgeAndUnsubscribeAlert = `${cmdPrefix}AckAndUnsAlert`,
  cmdAlertSubscribe = `${cmdPrefix}AlertSubscribe`,
  cmdGetInput = `${cmdPrefix}GetInput`,
  cmdUseCommonTranslation = `${cmdPrefix}UseCTransl`,
  cmdItemAdd = `${cmdPrefix}ItemAdd`,
  cmdItemPress = `${cmdPrefix}ItemPress`,
  cmdItemMoveUp = `${cmdPrefix}ItemMoveUp`,
  cmdItemMoveDown = `${cmdPrefix}ItemMoveDown`,
  cmdItemNameGet = `${cmdPrefix}ItemNameGet`,
  cmdItemDownload = `${cmdPrefix}ItemDownload`,
  cmdItemUpload = `${cmdPrefix}ItemUpload`,
  cmdItemDelete = `${cmdPrefix}ItemDel`,
  cmdItemDeleteConfirm = `${cmdPrefix}ItemDelConfirm`,
  cmdItemMark = `${cmdPrefix}ItemMark`,
  cmdItemsProcess = `${cmdPrefix}ItemsProcess`,
  cmdItemJumpTo = `${cmdPrefix}ItemJumpTo`,
  cmdCreateReportEnum = `${cmdPrefix}CreateReportEnum`,
  cmdSetOffset = `${cmdPrefix}SetOffset`,
  cmdDeleteAllSentImages = `${cmdPrefix}DelAllSentImages`,
  cmdItemReset = `${cmdPrefix}ItemReset`,
  cmdNoOperation = `${cmdPrefix}NoOp`,
  cmdEmptyCommand = 'emptyCmd',
  //*** Commands - end ***//

  telegramAdapter = `telegram.${telegramInstance}`,
  //*** Various prefixes for ioBroker states ***//
  scriptRepositorySite = 'https://github.com/',
  scriptRepositorySubUrl = '/PeterVoronov/ioBrokerTelegramMenuScript/',
  scriptVersion = 'v0.9.5-dev',
  scriptBranchRemoteFolder = `${scriptRepositorySubUrl}blob/${scriptVersion}/`,
  scriptCoreLocalesRemoteFolder = `${scriptBranchRemoteFolder}locales/`,
  prefixPrimary = `0_userdata.0.telegram_automenu.${telegramInstance}`,
  prefixConfigStates = `${prefixPrimary}.config`,
  prefixTranslationStates = `${prefixPrimary}.translations`,
  prefixCacheStates = `${prefixPrimary}.cache`,
  prefixExtensionId = 'ext',
  prefixExternalStates = 'external',
  prefixEnums = 'enum',
  //*** Bot message identification stamp ***//
  botMessageStamp = '\u200B\uFEFF\uFEFF\uFEFF\u200B',
  //*** Graphs related constants ***//
  graphsDefaultTemplate = 'default',
  graphsTemporaryFolder = '_temp_',
  temporaryFolderPrefix = 'autoTelegramTemporary-',
  //*** Data type constants ***//
  dataTypeTranslation = 'transl',
  dataTypePrimaryEnums = 'enums',
  dataTypeDestination = 'dests',
  dataTypeFunction = 'funcs',
  dataTypeExtension = 'extensions',
  dataTypeConfig = 'conf',
  dataTypeReport = 'reps',
  dataTypeReportMember = 'repMemb',
  dataTypeAlertSubscribed = 'alertS',
  dataTypeTrigger = 'trigger',
  dataTypeDeviceAttributes = 'deviceAttributes',
  dataTypeDeviceButtons = 'deviceButtons',
  dataTypeDeviceStatesAttributes = 'stateAttributes',
  dataTypeStateValue = 'stateV',
  dataTypeMenuRoles = 'mRoles',
  dataTypeMenuRoleRules = 'mRoleR',
  dataTypeMenuRoleRulesMask = 'mRoleRM',
  dataTypeMenuUsers = 'mUsers',
  dataTypeMenuUserRoles = 'mUserR',
  dataTypeGraph = 'graph',
  dataTypeBackup = 'backup',
  dataTypeGroups = 'groups',
  dataTypeIgnoreInput = '=====',
  //*** Time interval constants ***//
  timeDelta24 = {hours: 23, minutes: 59, seconds: 0},
  timeDelta48 = {hours: 47, minutes: 59, seconds: 0},
  timeDelta96 = {hours: 95, minutes: 59, seconds: 0},
  //*** ID constants ***//
  idEnumerations = 'enumerations',
  idFunctions = 'functions',
  idDestinations = 'destinations',
  idSimpleReports = 'simpleReports',
  idConfig = 'config',
  idTranslation = 'translation',
  idExternal = dataTypeExtension,
  idAlerts = 'alerts',
  //*** Items default delimiter ***//
  itemsDelimiter = '::',
  //*** Do commands ***//
  doAll = 'all',
  doUpload = 'upload',
  doUploadDirectly = 'uploadD',
  doUploadFromRepo = 'uploadR',
  doDownload = 'download',
  //*** Time intervals ***//
  timeIntervalsInMinutes = {
    m: 1,
    h: 60,
    D: 60 * 24,
    W: 60 * 24 * 7,
    M: 60 * 24 * 30,
    Y: 60 * 24 * 365,
  },
  timeIntervalsIndexList = Object.keys(timeIntervalsInMinutes).join(''),
  //*** Jump to commands ***//
  jumpToUp = '@up',
  jumpToLeft = '@left',
  jumpToRight = '@right',
  //*** Icons ***//
  iconItemDelete = '🗑️',
  iconItemEdit = '✍️',
  iconItemDisabled = '🚫',
  iconItemReadOnly = '👁️',
  iconItemNotFound = '❓',
  iconItemOn = '✅',
  iconItemOff = '❌',
  iconItemUser = '👤',
  iconItemUsers = '👥',
  iconItemRole = '🎭',
  iconItemAlertOn = '🔔',
  iconItemAlertOff = '🔕',
  iconItemAlerts = '📣',
  iconItemTrigger = '🕹️',
  iconItemTranslation = '📖',
  iconItemCommon = '🌐',
  iconItemButton = '🔘',
  iconItemCheckMark = '✔️',
  iconItemSquareButton = '🔳',
  iconItemSquareButtonBlack = '🔲',
  iconItemFull = '💯',
  iconItemMoveUp = '👆',
  iconItemMoveDown = '👇',
  iconItemMoveLeft = '👈',
  iconItemMoveRight = '👉',
  iconItemPinching = '🤏',
  iconItemDownload = '⏬',
  iconItemUpload = '⏫',
  iconItemDevice = '📺',
  iconItemChart = '📈',
  iconItemAttribute = '📑',
  _iconItemFastLeft = '⏪',
  _iconItemFastRight = '⏩',
  iconItemNext = '▶️',
  iconItemPrevious = '◀️',
  iconItemPlus = '➕',
  iconItemRefresh = '🔃',
  iconItemApply = '🆗',
  iconItemToSubItem = '↳',
  iconItemToSubItemByArrow = '❱',
  iconItemIsExternal = '👾',
  iconItemBackup = '🗃️',
  iconItemBackupCreate = '⤵️',
  iconItemBackupRestore = '⤴️',
  iconItemAbove = '⤒',
  iconItemLess = '⤓',
  iconItemHistory = '📃',
  iconItemReset = '↺',
  iconItemUnavailable = '🆘',
  iconItemEmpty = '❔';
const attributesToCopyFromOriginToAlias = ['read', 'write', 'min', 'max', 'step', 'states', 'unit'];

//*** ConfigOptions - begin ***//

const cfgPrefix = 'cfg',
  cfgDefaultIconOn = `${cfgPrefix}DefaultIconOn`,
  cfgDefaultIconOff = `${cfgPrefix}DefaultIconOff`,
  cfgMaxButtonsOnScreen = `${cfgPrefix}MaxButtonsOnScreen`,
  cfgSummaryTextLengthMax = `${cfgPrefix}SummaryTextLengthMax`,
  cfgTextLengthModifierForGChats = `${cfgPrefix}TextLengthModifierForGChats`,
  cfgMenuUsers = `${cfgPrefix}MenuUsers`,
  cfgMenuRoles = `${cfgPrefix}MenuRoles`,
  cfgMessagesForMenuCall = `${cfgPrefix}MessagesForMenuCall`,
  cfgClearMenuCall = `${cfgPrefix}ClearMenuCall`,
  cfgShowHomeButton = `${cfgPrefix}ShowHomeButton`,
  cfgShowHorizontalNavigation = `${cfgPrefix}ShowHorizontalNavigation`,
  cfgShowResultMessages = `${cfgPrefix}ShowResultMessages`,
  cfgMenuRefreshInterval = `${cfgPrefix}MenuRefreshInterval`,
  cfgUseAliasOriginForCommonAttrs = `${cfgPrefix}UseAliasOriginForCommonAttrs`,
  cfgSkipAttributesWithNullValue = `${cfgPrefix}SkipAttributesWithNullValue`,
  cfgAllowToDeleteEmptyEnums = `${cfgPrefix}AllowToDeleteEmptyEnums`,
  cfgConfigBackupCopiesCount = `${cfgPrefix}ConfigBackupCopiesCount`,
  cfgAlertMessageTemplateMain = `${cfgPrefix}AlertMessageTemplateMain`,
  cfgAlertMessageTemplateThreshold = `${cfgPrefix}AlertMessageTemplateThreshold`,
  cfgCheckAlertStatesOnStartUp = `${cfgPrefix}CheckAlertStatesOnStartUp`,
  cfgThresholdsForNumericString = `${cfgPrefix}ThresholdsForNumericString`,
  cfgMenuLanguage = `${cfgPrefix}MenuLanguage`,
  cfgMenuFunctionsFirst = `${cfgPrefix}MenuFunctionsFirst`,
  cfgMenuFastGeneration = `${cfgPrefix}MenuFastGeneration`,
  cfgDateTimeTemplate = `${cfgPrefix}DateTimeTemplate`,
  cfgExternalMenuTimeout = `${cfgPrefix}ExternalMenuTimeout`,
  cfgHierarchicalCaption = `${cfgPrefix}HierarchicalCaption`,
  cfgHistoryAdapter = `${cfgPrefix}HistoryAdapter`,
  cfgGraphsTemplates = `${cfgPrefix}GraphsTemplates`,
  cfgGraphsScale = `${cfgPrefix}GraphsScale`,
  cfgGraphsIntervals = `${cfgPrefix}GraphsIntervals`,
  cfgAlertMessagesHistoryDepth = `${cfgPrefix}AlertMessagesHistoryDepth`,
  cfgUpdateMessageTime = `${cfgPrefix}UpdateMessageTime`,
  cfgUpdateMessagesOnStart = `${cfgPrefix}UpdateMessagesOnStart`,
  cfgDebugMode = `${cfgPrefix}DebugMode`;
const alertMessageTemplateDefault =
  '${alertFunctionName} "${alertDeviceName} ${translations(In).toLowerCase} ${alertDestinationName}"${alertStateName? $value -:} ${alertStateValue}';

const configDefaultOptions = {
    [cfgMenuUsers]: {},
    [cfgMenuRoles]: {},
    [cfgMaxButtonsOnScreen]: 24, // maximum buttons on one screen except alerts and global menu related
    [cfgMessagesForMenuCall]: ['/menu'], // List of commands to show the menu
    [cfgMenuRefreshInterval]: 0, // Interval to refresh current menu screen(forcibly from script for all users, disabled if '0')
    [cfgExternalMenuTimeout]: 500, // Timeout to wait an answer from extensions
    [cfgHistoryAdapter]: '', // History adapter for eCharts
    [cfgGraphsTemplates]: '', // Folder with e-charts templates
    [cfgUseAliasOriginForCommonAttrs]: true, // Get object 'common' description from alias "source".
    [cfgSkipAttributesWithNullValue]: true, //Don't show device attributes with `null` value. Not applicable on buttons and PrimaryState
    [cfgAllowToDeleteEmptyEnums]: true, // Allow to delete an empty enums (functions, destinations, reports)
    [cfgConfigBackupCopiesCount]: 7, // Max backup copies of config to be stored. If 0 - automatic backup will not work
    [cfgAlertMessageTemplateMain]: alertMessageTemplateDefault,
    [cfgAlertMessageTemplateThreshold]: alertMessageTemplateDefault + ' [${alertThresholdIcon}${alertThresholdValue}]',
    [cfgCheckAlertStatesOnStartUp]: false, // Check stored states values on the start of script, to raise an alert
    [cfgThresholdsForNumericString]: false, // Make possible to set thresholds for states of string type, which is really numeric
    [cfgDebugMode]: false, // Enable debug mode - huge amount of logs
    [cfgMenuLanguage]: 'ru', // Menu display language
    [cfgMenuFunctionsFirst]: true, // Menu display functions on top (or destinations)
    [cfgMenuFastGeneration]: true, // Menu generation buster - less checks, possible empty submenus
    [cfgSummaryTextLengthMax]: 30, // Maximum numbers of symbols per line (approximate, for )
    [cfgTextLengthModifierForGChats]: -4, // Modifier for the max of symbols per line for a group chats
    [cfgClearMenuCall]: true, // Delete command, after menu is shown
    [cfgHierarchicalCaption]: 0, // show caption of the current menu hierarchically
    [cfgShowHomeButton]: true, // Always show 'Home' button
    [cfgShowHorizontalNavigation]: false, // Always show "Horizontal" navigation buttons,
    [cfgShowResultMessages]: true, // Show alert messages, as reactions on some input
    [cfgGraphsScale]: 1, // Scale for e-charts graphs
    [cfgGraphsIntervals]: [
      {id: '2h', minutes: timeIntervalsInMinutes.h * 2},
      {id: '6h', minutes: timeIntervalsInMinutes.h * 6},
      {id: '12h', minutes: timeIntervalsInMinutes.h * 12},
      {id: '1D', minutes: timeIntervalsInMinutes.D},
      {id: '3D', minutes: timeIntervalsInMinutes.D * 3},
      {id: '1W', minutes: timeIntervalsInMinutes.W},
      {id: '2W', minutes: timeIntervalsInMinutes.W * 2},
      {id: '1M', minutes: timeIntervalsInMinutes.M},
      {id: '3M', minutes: timeIntervalsInMinutes.M * 3},
      {id: '6M', minutes: timeIntervalsInMinutes.M * 6},
      {id: '1Y', minutes: timeIntervalsInMinutes.Y},
    ], // Time ranges back from now, in minutes
    [cfgDefaultIconOn]: iconItemOn,
    [cfgDefaultIconOff]: iconItemOff,
    [cfgAlertMessagesHistoryDepth]: 48, // Alert messages history depth in hours
    [cfgUpdateMessageTime]: '12:05',
    [cfgUpdateMessagesOnStart]: 5, // Refresh menu messages after script start. If 0 - will not refresh.
    [cfgDateTimeTemplate]: 'DD.MM hh:mm:ss', // Template for date and time in Menu
  },
  configDefaultOptionMasks = {
    [cfgUpdateMessageTime]: {text: 'hh:mm', rule: /^([0-1]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/},
    [cfgGraphsIntervals]: {text: '#m|#h|#D|#W|#M|#Y', rule: new RegExp(`^(\\d+)([${timeIntervalsIndexList}])$`)},
  };
const configGlobalOptions = [
    cfgMenuUsers,
    cfgMenuRoles,
    cfgMessagesForMenuCall,
    cfgMaxButtonsOnScreen,
    cfgMenuRefreshInterval,
    cfgExternalMenuTimeout,
    cfgHistoryAdapter,
    cfgGraphsTemplates,
    cfgUseAliasOriginForCommonAttrs,
    cfgAllowToDeleteEmptyEnums,
    cfgConfigBackupCopiesCount,
    cfgCheckAlertStatesOnStartUp,
    cfgThresholdsForNumericString,
    cfgDebugMode,
  ],
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
    return !configGlobalOptions.includes(cfgItem) && user && user.hasOwnProperty('userId') && user.userId;
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
    return this.#isUserConfigOption(cfgItem, user) ? `${user.userId}` : configOptionScopeGlobal;
  }

  /**
   * This method returns a string that is the object/state id for the current config item
   *
   * @param {string} cfgItem - The id of the configuration item.
   * @param {object=} user - The user object.
   * @returns {string} `${this.prefix}.${this.#getStateIdSubPrefix(cfgItem, user)}.`;
   */
  #getStateId(cfgItem, user) {
    return `${this.prefix}.${this.#getStateIdSubPrefix(cfgItem, user)}.${cfgItem}`;
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
        return (
          perUserConfig.hasOwnProperty(cfgItem) &&
          perUserConfig[cfgItem] !== undefined &&
          perUserConfig[cfgItem] !== null
        );
      }
    } else {
      return (
        this.globalConfig.hasOwnProperty(cfgItem) &&
        this.globalConfig[cfgItem] !== undefined &&
        this.globalConfig[cfgItem] !== null
      );
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
    } else if (this.existsOption(cfgItem)) {
      return objectDeepClone(this.globalConfig[cfgItem]);
    } else {
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
        if (
          user.userId != user.chatId &&
          typeOf(result, 'number') &&
          (this.existsOption(cfgTextLengthModifierForGChats, user) || this.existsOption(cfgTextLengthModifierForGChats))
        ) {
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
    if (this.existsOption(cfgItem) && typeOf(functionToProcess) === 'function') {
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
    } else {
      const currentType = typeOf(this.globalConfig[cfgItem]);
      // @ts-ignore
      if (!['array', 'map', 'object'].includes(currentType)) return currentType;
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
      if (
        JSON.stringify(this.getOption(cfgItem, null), JSONReplacerWithMap) ===
        JSON.stringify(value, JSONReplacerWithMap)
      ) {
        this.deleteUserOption(cfgItem, user);
      } else {
        perUserConfig[cfgItem] = value;
        this.perUserConfig.set(user.userId, perUserConfig);
        this.saveOption(cfgItem, user);
      }
      if (cfgItem === cfgUpdateMessageTime) this.functionScheduleMenuMessageRenew(value, user.userId);
    } else {
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
      if (existsState(stateId))
        deleteState(stateId, (error, result) => {
          if (error) {
            console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
          } else {
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
    let result,
      valueToParseType = typeOf(value);
    if (currentType === 'array') {
      if (valueToParseType === 'string') {
        if (value.indexOf('[') === 0) {
          try {
            result = JSON.parse(value);
          } catch (err) {
            console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
          }
        } else {
          result = value.split(',');
        }
      } else if (typeOf(value) === 'array') {
        this.globalConfig[cfgItem] = value;
      }
    } else if (currentType === 'map') {
      if (valueToParseType === 'string') {
        try {
          value = JSON.parse(value, JSONReviverWithMap);
        } catch (err) {
          console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
        }
        valueToParseType = typeof value;
      }
      if (valueToParseType === 'map') {
        result = value;
      }
    } else if (currentType === 'object') {
      if (valueToParseType === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          console.error(`Parse error on configOptions[${cfgItem}] - ${JSON.stringify(err)}`);
        }
        valueToParseType = typeof value;
      }
      if (valueToParseType === 'object') {
        result = value;
      }
    } else if (currentType === 'number') {
      if (valueToParseType === 'string') {
        if (!isNaN(value)) result = Number(value);
      } else if (valueToParseType === 'number') {
        result = value;
      }
    } else if (currentType === 'boolean') {
      if (valueToParseType === 'string') {
        if (['true', 'false'].includes(value)) result = value === 'true' ? true : false;
      } else if (valueToParseType === 'number') {
        result = value !== 0;
      } else if (valueToParseType === 'boolean') {
        result = value;
      }
    }
    if (currentType === 'string') {
      if (valueToParseType === 'string') {
        result = value;
      } else if (valueToParseType === 'number' || valueToParseType === 'boolean') {
        result = `${value}`;
      }
      const currentMask = this.getMask(cfgItem);
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
    } else if (!this.#isUserConfigOption(cfgItem, user)) {
      this.saveOption(cfgItem, user);
    }
  }

  /**
   * This method loads values of the configuration item from the global and the user contexts.
   * @param {object=} user - The user object.
   */
  loadOptions(user) {
    for (const cfgItem of Object.keys(this.globalConfig)) {
      if (!user || (user && !configGlobalOptions.includes(cfgItem))) this.loadOption(cfgItem, user);
    }
    if (!user) {
      /** it will check all possible states under 'this.prefix' ... **/
      $(`state[id=${this.prefix}.*]`).each((stateId) => {
        const itemKey = '' + stateId.split('.').pop();
        if (!this.globalConfig.hasOwnProperty(itemKey)) {
          console.log(`Found obsolete configOptions key = ${JSON.stringify(itemKey)}`);
          deleteState(stateId, (error, result) => {
            if (error) {
              console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
            } else {
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
        const cfgItemPath = obj.id.replace(`${this.prefix}.`, '').split('.');
        logs(`cfgItemPath = ${cfgItemPath}`);
        if (cfgItemPath.length === 2) {
          const [cfgItemPrefix, cfgItem] = cfgItemPath;
          logs(`Start processing configOptions[${cfgItem}, ${cfgItemPrefix}] with possible value = ${obj.state.val}}`);
          if (
            this.existsOption(cfgItem) &&
            (cfgItemPrefix === configOptionScopeGlobal ||
              // @ts-ignore
              !isNaN(cfgItemPrefix))
          ) {
            const actualValue = this.parseOption(cfgItem, obj.state.val);
            if (actualValue !== undefined) {
              this.setOption(
                cfgItem,
                cfgItemPrefix === configOptionScopeGlobal ? null : {userId: Number(cfgItemPrefix)},
                actualValue,
              );
              logs(`configOptions[${cfgItem}, ${cfgItemPrefix}] is set to ${JSON.stringify(actualValue)}`);
            }
            if (this.externalSubscriptions.has(cfgItem)) {
              const functionToProcess = this.externalSubscriptions.get(cfgItem);
              if (typeOf(functionToProcess)) {
                functionToProcess(cfgItem);
                logs(
                  `External function ${functionToProcess} is executed on configOptions[${cfgItem}, ${cfgItemPrefix}] = ${JSON.stringify(
                    actualValue,
                  )}`,
                );
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
    if (currentValue !== undefined && currentValue !== null) {
      const id = this.#getStateId(cfgItem, user);
      // console.log(`cfgItem = ${cfgItem}, user = ${user ? user.userId : ''}, id = ${id}`)
      if (stateType === 'object') {
        currentValue = JSON.stringify(currentValue, JSONReplacerWithMap);
        // @ts-ignore
        stateType = 'json';
      }
      if (existsState(id) && getObject(id).common.type === stateType) {
        setState(id, currentValue, true);
        // console.log('state ' + JSON.stringify(id) + ' saved for option ' + JSON.stringify(cfgItem) + ' = ' + JSON.stringify(currentValue));
      } else {
        if (existsState(id))
          deleteState(id, (error, _result) => {
            if (error) {
              console.warn(`Error during deletion of state '${cfgItem}' : ${JSON.stringify(error)}`);
            } else {
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
      perUserConfig: this.perUserConfig,
    };
    return backupData;
  }

  /**
   * This method parses the backup object and set the config items values from it.
   * @param {object} backupData
   */
  restoreDataFromBackup(backupData) {
    if (
      typeOf(backupData, 'object') &&
      backupData.hasOwnProperty('globalConfig') &&
      typeOf(backupData.globalConfig, 'object')
    ) {
      Object.keys(this.globalConfig).forEach((cfgItem) => {
        if (
          backupData.globalConfig.hasOwnProperty(cfgItem) &&
          backupData.globalConfig[cfgItem] !== undefined &&
          backupData.globalConfig[cfgItem] !== null
        ) {
          // logs(`setOption(${cfgItem}) = ${JSON.stringify(backupData.globalConfig[cfgItem])}`, _l)
          if (this.globalConfig[cfgItem] !== backupData.globalConfig[cfgItem])
            this.setOption(cfgItem, null, backupData.globalConfig[cfgItem]);
        }
      });
      if (this.perUserConfig.size) {
        this.perUserConfig.forEach((userConfig, userId) => {
          const userConfigBackup =
            backupData.hasOwnProperty('perUserConfig') &&
            typeOf(backupData.perUserConfig, 'map') &&
            backupData.perUserConfig.size &&
            backupData.perUserConfig.has(userId)
              ? backupData.perUserConfig.get(userId)
              : undefined;
          Object.keys(userConfig).forEach((cfgItem) => {
            if (
              !(
                userConfigBackup &&
                userConfigBackup.hasOwnProperty(cfgItem) &&
                userConfigBackup[cfgItem] !== undefined &&
                userConfigBackup[cfgItem] !== null
              )
            ) {
              this.deleteUserOption(cfgItem, {userId});
            }
          });
        });
      }
      if (
        backupData.hasOwnProperty('perUserConfig') &&
        typeOf(backupData.perUserConfig, 'map') &&
        backupData.perUserConfig.size
      ) {
        backupData.perUserConfig.forEach((userConfigData, userId) => {
          Object.keys(this.globalConfig).forEach((cfgItem) => {
            if (
              !configGlobalOptions.includes(cfgItem) &&
              userConfigData.hasOwnProperty(cfgItem) &&
              userConfigData[cfgItem] !== undefined &&
              userConfigData[cfgItem] !== null
            ) {
              // logs(`setOption(${cfgItem}, ${JSON.stringify({userId})}) = ${JSON.stringify(userConfigData[cfgItem])}`, _l)
              if (this.globalConfig[cfgItem] !== userConfigData[cfgItem])
                this.setOption(cfgItem, {userId}, userConfigData[cfgItem]);
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
    // logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`, _l);
    const {item: cfgItem, scope: optionScope} = menuItemToProcess.options,
      currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      currentAccessLevel = menuItemToProcess.accessLevel,
      isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
      isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
      isSystemLevelOption = configGlobalOptions.includes(cfgItem),
      isThisLevelAllowModify = isSystemLevelOption ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify;
    let subMenuIndex = 0,
      subMenu = [];
    let currentArray = configOptions.getOption(cfgItem, optionScope === configOptionScopeGlobal ? null : user);
    for (const itemValue of currentArray) {
      const subMenuItem = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `"${itemValue}"`,
        submenu: new Array(),
      };
      if (isThisLevelAllowModify) {
        let subSubMenuIndex = 0;
        const currentCommandOptions = {
          dataType: dataTypeConfig,
          item: cfgItem,
          scope: optionScope,
          index: subMenuIndex,
        };
        subSubMenuIndex = subMenuItem.submenu.push(
          menuMenuItemGenerateRenameItem(
            user,
            `${currentIndex}.${subMenuIndex}`,
            subSubMenuIndex,
            currentCommandOptions,
          ),
        );
        subSubMenuIndex = subMenuItem.submenu.push(
          menuMenuItemGenerateDeleteItem(
            user,
            `${currentIndex}.${subMenuIndex}`,
            subSubMenuIndex,
            currentCommandOptions,
          ),
        );
      } else {
        subMenuItem.command = cmdNoOperation;
      }
      subMenuIndex = subMenu.push(subMenuItem);
    }
    if (isThisLevelAllowModify) {
      subMenu.push(
        menuMenuItemGenerateAddItem(user, currentIndex, subMenuIndex, {
          dataType: dataTypeConfig,
          item: cfgItem,
          scope: optionScope,
          index: subMenuIndex,
        }),
      );
    }
    // logs(`subMenu = ${JSON.stringify(subMenu)}`, _l);
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
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon,
      currentAccessLevel = menuItemToProcess.accessLevel,
      isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
      isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
      optionTypes = ['systemLevelOptions', 'userLevelOptions'];
    let subMenu = [],
      subMenuIndex = 0;
    optionTypes.forEach((optionType) => {
      const isSystemLevelOption = optionType === 'systemLevelOptions',
        isThisLevelAllowModify = isSystemLevelOption ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify,
        optionFilter = isSystemLevelOption
          ? (optionId) => configGlobalOptions.includes(optionId)
          : (optionId) => !configGlobalOptions.includes(optionId),
        optionTypeItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, optionType)}`,
          icon: currentIcon,
          submenu: new Array(),
          // text: ` [${this.cfg[cfgItem]}] `,
        };
      Object.keys(this.globalConfig)
        .filter((optionId) => !configHiddenOptions.includes(optionId))
        .filter((optionId) => optionFilter(optionId))
        .forEach((cfgItem, itemOrder) => {
          const itemType = typeOf(this.globalConfig[cfgItem]),
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
            subSubMenuIndex = currentItem.submenu.push(
              menuMenuItemGenerateRenameItem(user, `${currentIndex}.${subMenuIndex}.${itemOrder}`, subSubMenuIndex, {
                dataType: dataTypeTranslation,
                translationId: `${translationsCoreId}.${cfgItem}`,
              }),
            );
          }
          const optionScopes = isSystemLevelOption
            ? [configOptionScopeGlobal]
            : isCurrentAccessLevelFull && !isSystemLevelOption
            ? [configOptionScopeGlobal, configOptionScopeUser]
            : [configOptionScopeUser];
          optionScopes.forEach((optionScope) => {
            const currentSubMenuItemName = translationsItemMenuGet(
                user,
                'SetValue',
                optionScope === configOptionScopeGlobal ? configOptionScopeGlobal : '',
              ),
              subMenuItem = {
                index: `${currentIndex}.${subMenuIndex}.${itemOrder}.${subSubMenuIndex}`,
                name: `${currentSubMenuItemName}`,
                icon: iconItemEdit,
                accessLevel: currentAccessLevel,
              };
            const currentOptionValue =
              optionScope === configOptionScopeGlobal ? this.globalConfig[cfgItem] : this.getOption(cfgItem, user);
            switch (cfgItem) {
              case cfgMenuLanguage:
                subMenuItem.options = {scope: optionScope, value: currentOptionValue};
                subMenuItem.submenu = (user, menuItemToProcess) => {
                  let subMenu = new Array(),
                    subMenuIndex = 0;
                  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                    {scope: optionScope, value: currentLanguage} = menuItemToProcess.options;
                  Object.keys(translationsList)
                    .sort()
                    .forEach((languageId) => {
                      const subMenuItem = {
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${languageId}`,
                        icon: currentLanguage === languageId ? configOptions.getOption(cfgDefaultIconOn) : '',
                        command: currentLanguage === languageId ? cmdNoOperation : '',
                        submenu: new Array(),
                      };
                      if (currentLanguage !== languageId) {
                        let subSubMenuIndex = 0;
                        const currentCommandOptions = {
                          dataType: dataTypeConfig,
                          item: cfgItem,
                          scope: optionScope,
                          value: languageId,
                        };
                        subSubMenuIndex = subMenuItem.submenu.push({
                          index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                          name: `${translationsItemCoreGet(user, 'cmdItemSelect')}`,
                          icon: '',
                          command: cmdItemPress,
                          options: currentCommandOptions,
                          submenu: [],
                        });
                        subMenuItem.submenu.push(
                          menuMenuItemGenerateDeleteItem(
                            user,
                            `${currentIndex}.${subMenuIndex}`,
                            subSubMenuIndex,
                            currentCommandOptions,
                          ),
                        );
                      }
                      subMenuIndex = subMenu.push(subMenuItem);
                    });
                  if (optionScope === configOptionScopeGlobal) {
                    subMenuIndex = subMenu.push({
                      index: `${currentIndex}.${subMenuIndex}`,
                      name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                      icon: iconItemPlus,
                      options: {item: cfgItem, scope: optionScope},
                      group: 'addNew',
                      submenu: (user, menuItemToProcess) => {
                        let subMenu = [],
                          subMenuIndex = 0;
                        const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                          {item: cfgItem, scope: optionScope} = menuItemToProcess.options;
                        if (cachedValueExists(user, cachedConfigNewLanguageId)) {
                          const newLanguageId = translationsValidateLanguageId(
                            cachedValueGet(user, cachedConfigNewLanguageId),
                          );
                          if (newLanguageId && newLanguageId.length) {
                            subMenu.push({
                              index: `${currentIndex}.${subMenuIndex}`,
                              name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${newLanguageId}'`,
                              icon: iconItemApply,
                              group: cmdItemsProcess,
                              command: cmdItemsProcess,
                              options: {
                                dataType: dataTypeConfig,
                                item: cfgItem,
                                scope: optionScope,
                                value: newLanguageId,
                              },
                              submenu: [],
                            });
                            cachedValueDelete(user, cachedConfigNewLanguageId);
                          } else {
                            subMenu.push({
                              index: `${currentIndex}.${subMenuIndex}`,
                              name: `${translationsItemCoreGet(user, 'cmdFixId')} = '${cachedValueGet(
                                user,
                                cachedConfigNewLanguageId,
                              )}'`,
                              icon: iconItemEdit,
                              command: cmdGetInput,
                              options: {dataType: dataTypeConfig, item: cfgItem, scope: optionScope},
                              submenu: [],
                            });
                          }
                        } else {
                          subMenu.push({
                            index: `${currentIndex}.${subMenuIndex}`,
                            name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
                            icon: iconItemEdit,
                            command: cmdGetInput,
                            options: {dataType: dataTypeConfig, item: cfgItem, scope: optionScope},
                            submenu: [],
                          });
                        }
                        return subMenu;
                      },
                    });
                  }
                  return subMenu;
                };
                break;

              case cfgGraphsIntervals:
                (subMenuItem.options = {item: cfgItem, scope: optionScope, [menuOptionHorizontalNavigation]: true}),
                  (subMenuItem.submenu = (user, menuItemToProcess) => {
                    let subMenu = new Array(),
                      subMenuIndex = 0;
                    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                      currentAccessLevel = menuItemToProcess.accessLevel,
                      isCurrentAccessLevelAllowModify =
                        MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
                      isCurrentAccessLevelFull =
                        MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
                      {item: cfgItem, scope: optionScope} = menuItemToProcess.options,
                      isThisLevelAllowModify =
                        optionScope === configOptionScopeGlobal
                          ? isCurrentAccessLevelFull
                          : isCurrentAccessLevelAllowModify,
                      currentIntervals = this.getOption(
                        cfgItem,
                        optionScope === configOptionScopeUser ? user : undefined,
                      );
                    const currentIntervalsMaxIndex = currentIntervals.length - 1;
                    currentIntervals.forEach(
                      ({id: graphsIntervalId, minutes: graphsIntervalMinutes}, graphsIntervalIndex) => {
                        const subMenuItem = {
                          index: `${currentIndex}.${subMenuIndex}`,
                          name: `[${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}]`,
                          text: `${graphsIntervalMinutes}`,
                          submenu: new Array(),
                        };
                        if (isThisLevelAllowModify) {
                          let subSubMenuIndex = 0;
                          const currentCommandOptions = {
                            dataType: dataTypeConfig,
                            item: cfgItem,
                            scope: optionScope,
                            index: graphsIntervalIndex,
                          };
                          [subMenuItem.submenu, subSubMenuIndex] = menuMenuPartGenerateMoveItemUpAndDown(
                            user,
                            subMenuItem.submenu,
                            `${currentIndex}.${subMenuIndex}`,
                            subSubMenuIndex,
                            graphsIntervalIndex,
                            currentIntervalsMaxIndex,
                            currentCommandOptions,
                          );
                          subSubMenuIndex = subMenuItem.submenu.push(
                            menuMenuItemGenerateRenameItem(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, {
                              dataType: dataTypeTranslation,
                              translationId: translationsItemGenerateTextId('TimeRange', graphsIntervalId),
                            }),
                          );
                          subMenuItem.submenu.push(
                            menuMenuItemGenerateDeleteItem(
                              user,
                              `${currentIndex}.${subMenuIndex}`,
                              subSubMenuIndex,
                              currentCommandOptions,
                            ),
                          );
                        }
                        subMenuIndex = subMenu.push(subMenuItem);
                      },
                    );
                    if (isThisLevelAllowModify) {
                      subMenuIndex = subMenu.push(
                        menuMenuItemGenerateAddItem(user, currentIndex, subMenuIndex, {
                          dataType: dataTypeConfig,
                          item: cfgItem,
                          scope: optionScope,
                          index: subMenuIndex,
                        }),
                      );
                      if (optionScope === configOptionScopeUser) {
                        subMenuIndex = subMenu.push(
                          menuMenuItemGenerateResetItem(user, currentIndex, subMenuIndex, {
                            dataType: dataTypeConfig,
                            item: cfgItem,
                          }),
                        );
                      }
                    }
                    return subMenu;
                  });
                break;

              default: {
                subMenuItem.options = {dataType: dataTypeConfig, item: cfgItem, scope: optionScope};
                switch (itemType) {
                  case 'array': {
                    if (isThisLevelAllowModify) {
                      subMenuItem.submenu = (user, menuItemToProcess) => {
                        return this.menuGenerateForArray(user, menuItemToProcess);
                      };
                    } else {
                      currentItem.accessLevel = currentAccessLevel;
                      currentItem.options = {dataType: dataTypeConfig, item: cfgItem, scope: optionScope};
                      currentItem.submenu = (user, menuItemToProcess) => {
                        return this.menuGenerateForArray(user, menuItemToProcess);
                      };
                    }
                    break;
                  }
                  case 'number': {
                    if (isSystemLevelOption || optionScope === configOptionScopeUser)
                      currentItem.name = `${currentItem.name} [${currentOptionValue}]`;
                    subMenuItem.name += `[${currentOptionValue}]`;
                    subMenuItem.command = cmdGetInput;
                    break;
                  }
                  case 'string': {
                    let maxTextLength = this.globalConfig[cfgSummaryTextLengthMax] - 5 - currentItemName.length;
                    if (isSystemLevelOption || optionScope === configOptionScopeUser)
                      currentItem.name += ` ['${
                        currentOptionValue.length > maxTextLength ? '...' : ''
                      }${currentOptionValue.slice(-maxTextLength)}']`;
                    maxTextLength = this.globalConfig[cfgSummaryTextLengthMax] - 5 - currentSubMenuItemName.length;
                    subMenuItem.name += ` ['${
                      currentOptionValue.length > maxTextLength ? '...' : ''
                    }${currentOptionValue.slice(-maxTextLength)}']`;
                    subMenuItem.command = cmdGetInput;
                    break;
                  }
                  case 'boolean': {
                    if (isSystemLevelOption || optionScope === configOptionScopeUser)
                      currentItem.name += ` ${
                        currentOptionValue ? this.globalConfig[cfgDefaultIconOn] : this.globalConfig[cfgDefaultIconOff]
                      }`;
                    subMenuItem.name += ` ${
                      currentOptionValue ? this.globalConfig[cfgDefaultIconOn] : this.globalConfig[cfgDefaultIconOff]
                    }`;
                    subMenuItem.command = cmdItemPress;
                    break;
                  }

                  default:
                    break;
                }
                break;
              }
            }

            if (isThisLevelAllowModify) {
              subSubMenuIndex = currentItem.submenu.push(subMenuItem);
            } else if (itemType !== 'array') {
              currentItem.command = cmdNoOperation;
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
      const scheduleString =
        '*' +
        (this.globalConfig.cfgMenuRefreshInterval < 60 ? '/' + this.globalConfig.cfgMenuRefreshInterval : '') +
        ' *' +
        (this.globalConfig.cfgMenuRefreshInterval >= 60
          ? '/' + Math.trunc(this.globalConfig.cfgMenuRefreshInterval / 60)
          : '') +
        ' * * * *';
      logs('scheduleString = ' + JSON.stringify(scheduleString));
    }
  }
}

/**
 * Global variable to store the all configuration options/items (ConfigOption class).
 */
const configOptions = new ConfigOptions(
  prefixConfigStates,
  configDefaultOptions,
  configDefaultOptionMasks,
  menuMessageRenewSchedule,
  menuMenuUpdateBySchedule,
);

//*** ConfigOptions - end ***//

const cachedRolesNewRoleId = 'menuRolesNewRoleId',
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
  static accessLevels = [
    rolesAccessLevelFull,
    rolesAccessLevelSelective,
    rolesAccessLevelReadOnly,
    rolesAccessLevelSilent,
    rolesAccessLevelForbidden,
    rolesAccessLevelPossible,
  ];
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
    } else {
      Object.keys(this.data).forEach((roleId) => {
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
        [rolesDefaultAdmin]: [{mask: rolesMaskAnyItem, accessLevel: rolesAccessLevelFull}],
        [rolesDefaultUser]: [
          {mask: rolesMaskAnyItem, accessLevel: rolesAccessLevelSelective},
          {mask: `setup${rolesIdAndMaskDelimiter}config`, accessLevel: rolesAccessLevelSelective},
          {mask: `setup${rolesIdAndMaskDelimiter}alerts`, accessLevel: rolesAccessLevelFull},
          {mask: `setup${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`, accessLevel: rolesAccessLevelForbidden},
        ],
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
    return this.data.hasOwnProperty(itemId) && this.data[itemId] !== undefined && this.data[itemId] !== null
      ? `${itemId}`
      : '';
  }

  /**
   * If the roleId doesn't exist, then create it. Otherwise add each rule from rulesList to the existing role.
   * @param {string} itemId - The role Id.
   * @param {string|object[]} rulesList - array of objects with properties `mask` and `accessLevel`.
   */
  addRole(itemId, rulesList) {
    if (!this.existsId(itemId)) {
      this.data[itemId] = [];
    }
    if (Array.isArray(rulesList)) {
      rulesList.forEach((newRule) => {
        if (typeof newRule === 'object' && newRule.hasOwnProperty('mask') && newRule.hasOwnProperty('accessLevel')) {
          if (!this.data[itemId].find((rule) => JSON.stringify(rule) === JSON.stringify(newRule))) {
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
      if (this.getUsers(itemId).length === 0) {
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
  getRoles(itemId, compiled = false) {
    let roles = {};
    if (itemId) {
      if (this.existsId(itemId)) {
        roles = {[itemId]: compiled ? this.compiledData[itemId] : this.data[itemId]};
      }
    } else {
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
    Object.keys(roles)
      .sort()
      .forEach((roleId) => {
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
  static sortRules(rules, inverseMasks = false, sortDescending = false) {
    let currentSort;
    if (rules && typeOf(rules, 'array') && rules.length > 0) {
      if (inverseMasks) {
        if (rules[0].hasOwnProperty('maskInverted') && rules[0].maskInverted) {
          currentSort = (ruleA, ruleB) =>
            sortDescending
              ? ruleB.maskInverted.localeCompare(ruleA.maskInverted)
              : ruleA.maskInverted.localeCompare(ruleB.maskInverted);
        } else {
          currentSort = (ruleA, ruleB) =>
            sortDescending
              ? MenuRoles.maskInverse(ruleB.mask).localeCompare(MenuRoles.maskInverse(ruleA.mask))
              : MenuRoles.maskInverse(ruleA.mask).localeCompare(MenuRoles.maskInverse(ruleB.mask));
        }
      } else {
        currentSort = (ruleA, ruleB) =>
          sortDescending ? ruleB.mask.localeCompare(ruleA.mask) : ruleA.mask.localeCompare(ruleB.mask);
      }
    }
    return currentSort ? rules.sort(currentSort) : rules;
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
    } else {
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
    if (typeof this.getRelatedDataFunction === 'function') {
      return this.getRelatedDataFunction(itemId);
    } else {
      return [];
    }
  }

  /**
   * If the role with itemId exists, return the array of rules, otherwise return an empty array.
   * @param {string} itemId - The role ID to get the rules for.
   * @param {boolean=} _compiled - defined to be compatible with the child class (`MenuUsers`) method.
   * @returns {object[]} An array of rules.
   */
  getRules(itemId, _compiled = false) {
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
    if (this.existsId(itemId) && Array.isArray(rulesList)) {
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
        currentRules.forEach((currentRule) => {
          compiledData.push({...currentRule});
        });
        const compileRule = (inputRule) => {
          const currentRule = {...inputRule};
          const [ruleMaskPrefix, ruleMaskSuffix] = currentRule.mask.split(rolesIdAndMaskDelimiter),
            isPrefixAny = ruleMaskPrefix === rolesMaskAnyValue,
            isSuffixAny = ruleMaskSuffix === rolesMaskAnyValue,
            [ruleMaskPrefixHolderId, ruleMaskPrefixSubordinatedId] = ruleMaskPrefix.split('.'),
            [ruleMaskSuffixHolderId, ruleMaskSuffixSubordinatedId] = ruleMaskSuffix.split('.');
          if (!(isPrefixAny && isSuffixAny)) {
            if (!isPrefixAny) {
              if (
                ruleMaskPrefixSubordinatedId &&
                MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) < 0
              ) {
                const holderMask = `${ruleMaskPrefixHolderId}${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`,
                  currentHolder = compiledData.find((rule) => rule.mask === holderMask);
                if (currentHolder && currentHolder.accessLevel === rolesAccessLevelForbidden) {
                  currentHolder.accessLevel = rolesAccessLevelPossible;
                } else if (!currentHolder) {
                  compiledData.push({
                    mask: holderMask,
                    accessLevel: rolesAccessLevelPossible,
                  });
                }
              }
            }
            if (!isSuffixAny) {
              if (
                ruleMaskSuffixSubordinatedId &&
                MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) < 0
              ) {
                const holderMask = `${ruleMaskPrefix}${rolesIdAndMaskDelimiter}${ruleMaskSuffixHolderId}`,
                  currentHolder = compiledData.find((rule) => rule.mask === holderMask);
                if (currentHolder && currentHolder.accessLevel === rolesAccessLevelForbidden) {
                  currentHolder.accessLevel = rolesAccessLevelPossible;
                } else if (!currentHolder) {
                  compiledData.push({
                    mask: holderMask,
                    accessLevel: rolesAccessLevelPossible,
                  });
                }
              }
            }
          }
        };
        this.data[itemId].forEach((currentRule) => {
          compileRule(currentRule);
        });
        const regexpAny = `[^${rolesIdAndMaskDelimiter}]`;
        compiledData = MenuRoles.sortRules(compiledData);
        compiledData.forEach((currentRule) => {
          const [ruleMaskPrefix, ruleMaskSuffix] = currentRule.mask.split(rolesIdAndMaskDelimiter),
            isPrefixAny = ruleMaskPrefix === rolesMaskAnyValue,
            isSuffixAny = ruleMaskSuffix === rolesMaskAnyValue,
            [ruleMaskPrefixHolderId, ruleMaskPrefixSubordinatedId] = ruleMaskPrefix.split('.'),
            [ruleMaskSuffixHolderId, ruleMaskSuffixSubordinatedId] = ruleMaskSuffix.split('.'),
            regexpPrefix = isPrefixAny
              ? `${regexpAny}+?`
              : ruleMaskPrefixSubordinatedId
              ? `${ruleMaskPrefixHolderId}\\.${ruleMaskPrefixSubordinatedId}`
              : `${ruleMaskPrefixHolderId}${regexpAny}*?`,
            regexpSuffix = isSuffixAny
              ? `${regexpAny}+?`
              : ruleMaskSuffixSubordinatedId
              ? `${ruleMaskSuffixHolderId}\\.${ruleMaskSuffixSubordinatedId}`
              : `${ruleMaskSuffixHolderId}${regexpAny}*?`;
          currentRule.maskInverted = `${ruleMaskSuffix}${rolesIdAndMaskDelimiter}${ruleMaskPrefix}`;
          currentRule.regexpDirect = new RegExp(`^${regexpPrefix}\\${rolesIdAndMaskDelimiter}${regexpSuffix}$`);
          currentRule.regexpDirectHalf = new RegExp(
            isPrefixAny
              ? `${regexpAny}+?`
              : isSuffixAny || MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0
              ? `^${regexpPrefix}$`
              : '^$',
          );
          currentRule.regexpInverted = new RegExp(`^${regexpSuffix}\\${rolesIdAndMaskDelimiter}${regexpPrefix}$`);
          currentRule.regexpInvertedHalf = new RegExp(
            isSuffixAny
              ? `${regexpAny}+?`
              : isPrefixAny || MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0
              ? `^${regexpSuffix}$`
              : '^$',
          );
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
  getMenuItemAccess(itemId, menuItemId, inverseMasks = false) {
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
  static #getAccessLevel(menuItemId, effectiveRoleRulesList, returnRule = false, inverseMasks = false) {
    let result;
    const menuItemIdParts = menuItemId.split(rolesIdAndMaskDelimiter),
      [menuIdPrefix, menuIdSuffix] = menuItemId.split(rolesIdAndMaskDelimiter),
      regexpMatch = effectiveRoleRulesList.filter((rule) => {
        const regexp = menuIdSuffix
            ? inverseMasks
              ? rule.regexpInverted
              : rule.regexpDirect
            : inverseMasks
            ? rule.regexpInvertedHalf
            : rule.regexpDirectHalf,
          [maskPrefix, maskSuffix] = (inverseMasks ? rule.maskInverted : rule.mask).split(rolesIdAndMaskDelimiter);
        return (
          regexp.test(menuItemId) &&
          !(
            menuItemIdParts.length === 1 &&
            maskPrefix === rolesMaskAnyValue &&
            maskSuffix !== rolesMaskAnyValue &&
            MenuRoles.accessLevelsPreventToShow.includes(rule.accessLevel)
          )
        );
      });
    if (regexpMatch && regexpMatch.length) {
      result = {...MenuRoles.sortRules(regexpMatch, inverseMasks, true)[0]};
      const [maskPrefix, maskSuffix] = (inverseMasks ? result.maskInverted : result.mask).split(
        rolesIdAndMaskDelimiter,
      );
      if (result.accessLevel === rolesAccessLevelPossible) {
        if (
          (maskPrefix !== rolesMaskAnyValue && maskPrefix !== menuIdPrefix) ||
          (menuIdSuffix && maskSuffix !== rolesMaskAnyValue && maskSuffix !== menuIdSuffix)
        ) {
          result = undefined;
        }
      } else if (
        !MenuRoles.accessLevelsPreventToShow.includes(result.accessLevel) &&
        menuItemIdParts.length === 1 &&
        maskPrefix === rolesMaskAnyValue &&
        maskSuffix !== rolesMaskAnyValue
      ) {
        result.accessLevel = rolesAccessLevelPossible;
      }
    }
    result = returnRule ? result : result !== undefined ? result.accessLevel : rolesAccessLevelForbidden;
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
    rulesToFilter.forEach((ruleToFilter) => {
      let resultRule = MenuRoles.#getAccessLevel(ruleToFilter.mask, rulesAsFilter, true);
      if (
        !resultRule ||
        MenuRoles.compareAccessLevels(ruleToFilter.accessLevel, resultRule.accessLevel) < 0 ||
        (!ruleToFilter.mask.includes(rolesMaskAnyValue) && resultRule.mask.includes(rolesMaskAnyValue)) ||
        (ruleToFilter.mask.includes(rolesMaskAnyValue) &&
          resultRule.mask.includes(rolesMaskAnyValue) &&
          ruleToFilter.mask.split('').filter((char) => char === '.').length >
            resultRule.mask.split('').filter((char) => char === '.').length)
      ) {
        resultRule = ruleToFilter;
      }
      if (
        !resultRules.find(
          (rule) =>
            rule.mask === resultRule.mask &&
            MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) <= 0,
        )
      ) {
        resultRules.push(resultRule);
      } else if (
        resultRules.find(
          (rule) =>
            rule.mask === resultRule.mask &&
            MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) > 0,
        )
      ) {
        resultRules = resultRules.filter(
          (rule) =>
            !(
              rule.mask === resultRule.mask &&
              MenuRoles.compareAccessLevels(rule.accessLevel, resultRule.accessLevel) > 0
            ),
        );
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
    if (!rulesListA) rulesListA = [];
    if (!rulesListB) rulesListB = [];
    if (
      rulesListA.length === 1 &&
      rulesListA[0].mask === rolesMaskAnyItem &&
      rulesListA[0].accessLevel === rolesAccessLevelFull
    ) {
      return rulesListA;
    } else if (
      rulesListB.length === 1 &&
      rulesListB[0].mask === rolesMaskAnyItem &&
      rulesListB[0].accessLevel === rolesAccessLevelFull
    ) {
      return rulesListB;
    } else {
      let resultRules = [];
      const maskAllA = rulesListA.find((rule) => rule.mask === rolesMaskAnyItem);
      const maskAllB = rulesListB.find((rule) => rule.mask === rolesMaskAnyItem);
      if (maskAllA && (!maskAllB || MenuRoles.compareAccessLevels(maskAllA.accessLevel, maskAllB.accessLevel) < 0)) {
        resultRules.push(maskAllA);
      } else if (maskAllB) {
        resultRules.push(maskAllB);
      }
      const roleAFiltered = rulesListA.filter((rule) => rule.mask !== rolesMaskAnyItem),
        roleBFiltered = rulesListB.filter((rule) => rule.mask !== rolesMaskAnyItem);
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
    const rootMenu = menuMenuItemGenerateRootMenu(null);
    let [maskPrefix, maskSuffix] = mask.split(rolesIdAndMaskDelimiter);
    if (maskPrefix !== rolesMaskAnyValue) {
      const [maskPrefixHolderId, maskPrefixSubordinatedId] = maskPrefix.split('.');
      let menuItem = rootMenu.submenu.find((item) => item.id === maskPrefixHolderId);
      if (menuItem && menuItem.hasOwnProperty('name')) {
        maskPrefix = menuItem.name;
        if (maskPrefixSubordinatedId) {
          const menuItemSubordinated = menuItem.subordinates.find((item) => item.id === maskPrefixSubordinatedId);
          if (menuItemSubordinated && menuItemSubordinated.hasOwnProperty('name')) {
            maskPrefix += `.${menuItemSubordinated.name}`;
          } else {
            maskPrefix += `.${maskPrefixSubordinatedId}`;
          }
        }
      }
    }
    if (maskSuffix !== rolesMaskAnyValue) {
      const isMenuFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst),
        secondLevelDataType = isMenuFunctionsFirst ? dataTypeDestination : dataTypeFunction,
        secondLevelList = enumerationsList[secondLevelDataType].list,
        [maskSuffixHolderId, maskSuffixSubordinatedId] = maskSuffix.split('.');
      if (Object.keys(secondLevelList).includes(maskSuffixHolderId)) {
        if (maskSuffixSubordinatedId) {
          maskSuffix =
            Object.keys(secondLevelList).includes(maskSuffix) && secondLevelList[maskSuffix].hasOwnProperty('name')
              ? translationsGetEnumName(user, secondLevelDataType, maskSuffix)
              : maskSuffixSubordinatedId;
        }
        maskSuffix = `${
          secondLevelList[maskSuffixHolderId].hasOwnProperty('name')
            ? translationsGetEnumName(user, secondLevelDataType, maskSuffixHolderId)
            : maskSuffixHolderId
        }${maskSuffixSubordinatedId ? `.${maskSuffix}` : ''}`;
      } else {
        for (const menuItem of rootMenu.submenu) {
          if (Array.isArray(menuItem.submenu)) {
            const subMenuItem = menuItem.submenu.find((item) => item.id === maskSuffix);
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
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      {dataType, roleId, ruleIndex} = menuItemToProcess.options,
      isForNewRule = Number(ruleIndex) == -1,
      currentRole = cachedValueExists(user, cachedRolesRoleUnderEdit)
        ? cachedValueGet(user, cachedRolesRoleUnderEdit)
        : {roleId: 'emptyRole', rules: []},
      currentRoleRules =
        currentRole.roleId === roleId ? currentRole['rules'] : this.existsId(roleId) ? this.getRules(roleId) : [],
      currentRule = isForNewRule
        ? cachedValueExists(user, cachedRolesNewRule)
          ? cachedValueGet(user, cachedRolesNewRule)
          : {}
        : cachedValueExists(user, cachedRolesNewRule)
        ? cachedValueGet(user, cachedRolesNewRule)
        : currentRoleRules[ruleIndex];
    let subMenu = [],
      subMenuIndex = 0;
    logs(`currentRule = ${JSON.stringify(currentRule)}`);
    MenuRoles.accessLevels
      .filter((accessLevel) => !MenuRoles.accessLevelsHidden.includes(accessLevel))
      .forEach((accessLevel, levelIndex) => {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `[${translationsItemTextGet(user, 'AccessLevel', accessLevel)}]`,
          icon: accessLevel === currentRule.accessLevel ? MenuRoles.accessLevelsIcons[levelIndex] : iconItemButton,
          command: cmdItemPress,
          options: {dataType, roleId, ruleIndex, accessLevel},
          submenu: [],
        });
      });
    if (
      (isForNewRule || cachedValueExists(user, cachedRolesNewRule)) &&
      MenuRoles.accessLevels.includes(currentRule.accessLevel)
    ) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
        icon: iconItemApply,
        group: cmdItemsProcess,
        command: cmdItemsProcess,
        options: {dataType, roleId},
        submenu: [],
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
    return rule
      ? `\n<code>${menuMenuItemDetailsPrintFixedLengthLines(user, [
          {label: translationsItemTextGet(user, 'RuleMask'), valueString: rule.mask},
          {label: translationsItemTextGet(user, 'RuleAccessLevel'), valueString: rule.accessLevel},
        ])}</code>`
      : '';
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
      const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
        {upperItemId, itemId: currentItemId} = menuItemToProcess.options,
        currentMasks = [
          `${upperItemId}${rolesIdAndMaskDelimiter}${currentItemId}`,
          `${rolesMaskAnyValue}${rolesIdAndMaskDelimiter}${currentItemId}`,
        ],
        savedMask = cachedValueExists(user, cachedRolesNewRule) ? cachedValueGet(user, cachedRolesNewRule)['mask'] : '',
        rootMenu = menuMenuItemGenerateRootMenu(null),
        jumpToArray = [jumpToUp, jumpToUp, rootMenu.submenu.length];
      let subMenu = [],
        subMenuIndex = 0;
      if (upperItemId.includes('.')) jumpToArray.unshift(jumpToUp);
      currentMasks.forEach((currentMask) => {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `[${currentMask}]`,
          icon: currentMask === savedMask ? iconItemSquareButton : iconItemButton,
          command: cmdItemMark,
          options: {dataType: dataTypeMenuRoleRulesMask, item: currentMask},
          submenu: [],
        });
      });
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedMask}]`,
        icon: iconItemEdit,
        command: cmdItemJumpTo,
        options: {jumpToArray},
        submenu: [],
      });
      return subMenu;
    }

    /**
     * This method takes a menu item, and generates a menu item based on `rootMenu` item, but with a submenu
     * that contains a list of all the possible subitems for that menu item (with no check of access levels).
     * @param {object} user - The user object.
     * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
     * @param {string} currentIndex - The current menu item index.
     * @param {string=} holderItemId - The holder menu item Id.
     * @returns {object} The resulted menu item.
     */
    function menuGenerateItemWithSubMenus(user, menuItemToProcess, currentIndex, holderItemId) {
      const resultItem = {
        index: `${currentIndex}`,
        name: `${menuItemToProcess.name}${menuItemToProcess.icon ? ` ${menuItemToProcess.icon}` : ''}`,
        icon: iconItemButton,
        group: holderItemId ? holderItemId : menuButtonsDefaultGroup,
        function: (user, _menuItemToProcess) => MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule)),
        submenu: new Array(),
      };
      const currentItemId = holderItemId ? `${holderItemId}.${menuItemToProcess.id}` : menuItemToProcess.id,
        enumerationId = isMenuFunctionsFirst ? 'function' : 'destination',
        enumNameDeclinationKey = isMenuFunctionsFirst ? enumerationsNamesMain : enumerationsNamesMany,
        secondLevelDataType = isMenuFunctionsFirst ? dataTypeDestination : dataTypeFunction,
        jumpToArray = [jumpToUp, rootMenu.submenu.length],
        secondLevelList = enumerationsList[secondLevelDataType].list,
        secondLevelListIds = Object.keys(secondLevelList)
          .filter((itemId) => secondLevelList[itemId].isEnabled && secondLevelList[itemId].isAvailable)
          .sort((itemA, itemB) => secondLevelList[itemA].order - secondLevelList[itemB].order);
      if (holderItemId) jumpToArray.unshift(jumpToUp);
      let subIndex = 0;
      if (
        menuItemToProcess.hasOwnProperty('options') &&
        menuItemToProcess.options.hasOwnProperty(enumerationId) &&
        menuItemToProcess.options[enumerationId]
      ) {
        if (menuItemToProcess.hasOwnProperty('subordinates')) {
          menuItemToProcess.subordinates.forEach((subordinatedItem) => {
            subIndex = resultItem.submenu.push(
              menuGenerateItemWithSubMenus(user, subordinatedItem, `${currentIndex}.${subIndex}`, menuItemToProcess.id),
            );
          });
        }
        secondLevelListIds.forEach((itemId) => {
          const currentItem = secondLevelList[itemId];
          let currentItemName = translationsGetEnumName(user, secondLevelDataType, itemId, enumNameDeclinationKey);
          if (itemId.includes('.')) {
            const holderId = itemId.split('.').shift();
            currentItemName = `${translationsGetEnumName(
              user,
              secondLevelDataType,
              holderId,
              enumNameDeclinationKey,
            )} ${iconItemToSubItemByArrow} ${currentItemName}`;
          }
          subIndex = resultItem.submenu.push({
            index: `${currentIndex}.${subIndex}`,
            name: `${currentItemName}${currentItem.icon ? ` ${currentItem.icon}` : ''}`,
            icon: iconItemButton,
            options: {upperItemId: currentItemId, itemId},
            function: (user, _menuItemToProcess) =>
              MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule)),
            submenu: selectMask,
          });
        });
      } else if (Array.isArray(menuItemToProcess.submenu)) {
        menuItemToProcess.submenu.forEach((subMenuItem) => {
          if (subMenuItem.hasOwnProperty('id') && subMenuItem.id) {
            subIndex = resultItem.submenu.push({
              index: `${currentIndex}.${subIndex}`,
              name: `${subMenuItem.name}`,
              icon: iconItemButton,
              options: {upperItemId: currentItemId, itemId: subMenuItem.id},
              function: (user, _menuItemToProcess) =>
                MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule)),
              submenu: selectMask,
            });
          }
        });
      }
      const currentMask = `${currentItemId}${rolesIdAndMaskDelimiter}${rolesMaskAnyValue}`;
      subIndex = resultItem.submenu.push({
        index: `${currentIndex}.${subIndex}`,
        name: `[${currentMask}]`,
        icon: currentMask === savedRule.mask ? iconItemSquareButton : iconItemButton,
        command: cmdItemMark,
        options: {dataType: dataTypeMenuRoleRulesMask, item: currentMask},
        submenu: [],
      });
      subIndex = resultItem.submenu.push({
        index: `${currentIndex}.${subIndex}`,
        name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedRule.mask}]`,
        icon: iconItemEdit,
        command: cmdItemJumpTo,
        options: {jumpToArray},
        submenu: [],
      });
      // logs(`resultItem = ${JSON.stringify(resultItem)}`)
      return resultItem;
    }

    if (!cachedValueExists(user, cachedRolesNewRule)) {
      cachedValueSet(user, cachedRolesNewRule, {...rolesInitialRule});
    }
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      {roleId} = menuItemToProcess.options,
      rootMenu = menuMenuItemGenerateRootMenu(null),
      savedRule = cachedValueGet(user, cachedRolesNewRule);
    let subMenu = [],
      subMenuIndex = 0;
    rootMenu.submenu.forEach((rootMenuItem) => {
      subMenuIndex = subMenu.push(menuGenerateItemWithSubMenus(user, rootMenuItem, `${currentIndex}.${subMenuIndex}`));
    });
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'SetAccelLevel')}[${savedRule.mask}]`,
      icon: iconItemEdit,
      options: {dataType: dataTypeMenuRoleRules, roleId, ruleIndex: -1, [menuOptionHorizontalNavigation]: false},
      function: (user, _menuItemToProcess) => MenuRoles.#ruleDetails(user, savedRule),
      submenu: (user, menuItemToProcess) => {
        return this.#menuRuleSetAccessLevel(user, menuItemToProcess);
      },
    });
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
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      currentAccessLevel = menuItemToProcess.accessLevel,
      {roleId} = menuItemToProcess.options,
      isNewRole = !this.existsId(roleId);
    let currentRole = {};
    if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
      currentRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
      if (currentRole.roleId !== roleId) {
        cachedValueDelete(user, cachedRolesRoleUnderEdit);
      }
    }
    if (!cachedValueExists(user, cachedRolesRoleUnderEdit) || currentRole.roleId !== roleId) {
      currentRole = {roleId: roleId, rules: isNewRole ? [{...rolesInitialRule}] : this.getRules(roleId)};
    }
    const currentRoleRules = currentRole['rules'];
    let subMenu = [],
      subMenuIndex = 0;
    currentRoleRules.forEach((rule) => {
      const maskReadable = MenuRoles.#maskToReadable(user, rule.mask),
        ruleCurrentDetails = MenuRoles.#ruleDetails(user, rule),
        currentItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: `[${maskReadable}]`,
          icon: MenuRoles.accessLevelsIcons[MenuRoles.accessLevels.indexOf(rule.accessLevel)],
          text: ruleCurrentDetails,
          submenu: new Array(),
        };
      if (
        roleId === rolesDefaultAdmin ||
        MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) >= 0
      ) {
        currentItem.command = cmdNoOperation;
      } else {
        let subSubId = 0;
        const currentCommandOptions = {dataType: dataTypeMenuRoleRules, roleId, ruleIndex: subMenuIndex};
        subSubId = currentItem.submenu.push({
          index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
          name: `${translationsItemMenuGet(user, 'RuleSetAccessLevel')}`,
          // icon: iconItemDelete,
          options: currentCommandOptions,
          text: ruleCurrentDetails,
          submenu: (user, menuItemToProcess) => {
            return this.#menuRuleSetAccessLevel(user, menuItemToProcess);
          },
        });
        if (rule.mask !== rolesMaskAnyItem)
          currentItem.submenu.push(
            menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, subSubId, currentCommandOptions),
          );
      }
      subMenuIndex = subMenu.push(currentItem);
    });
    if (
      roleId !== rolesDefaultAdmin &&
      (isNewRole || MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0)
    ) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
        group: 'itemAdd',
        icon: iconItemPlus,
        options: {roleId, [menuOptionHorizontalNavigation]: false},
        function: (user, _menuItemToProcess) => {
          if (!cachedValueExists(user, cachedRolesRoleUnderEdit)) {
            cachedValueSet(user, cachedRolesRoleUnderEdit, {roleId: roleId, rules: currentRoleRules});
          }
          return MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule));
        },
        submenu: (user, menuItemToProcess) => {
          return this.#menuGenerateRoleRulesAddItem(user, menuItemToProcess);
        },
      });
      const currentCommandOptions = {dataType: dataTypeMenuRoles, roleId};
      if (
        (isNewRole && currentRoleRules.length) ||
        JSON.stringify(this.getRules(roleId)) !== JSON.stringify(currentRoleRules)
      ) {
        subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
          icon: iconItemApply,
          group: cmdItemsProcess,
          command: cmdItemsProcess,
          options: currentCommandOptions,
          submenu: [],
        });
      } else if (
        !cachedValueExists(user, cachedRolesRoleUnderEdit) &&
        this.existsId(roleId) &&
        rolesInMenu.getUsers(roleId).length === 0
      ) {
        subMenu.push(menuMenuItemGenerateDeleteItem(user, `${currentIndex}`, subMenuIndex, currentCommandOptions));
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
    const {roleId} = menuItemToProcess.options,
      currentRoles = objectDeepClone(this.data);
    // logs(`existsCachedState(user, cachedCurrentRoleRules) = ${existsCachedState(user, cachedCurrentRoleRules)}`);
    if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
      const newRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
      if (!currentRoles.hasOwnProperty(newRole.roleId)) {
        currentRoles[newRole.roleId] = newRole.rules;
      }
      // logs(`currentRoles = ${JSON.stringify(currentRoles)}`);
    }
    const currentRoleRules = currentRoles[roleId],
      currentRoleDetailsList = [
        {
          label: translationsItemTextGet(user, 'RoleId'),
          valueString: roleId,
        },
        {
          label: translationsItemTextGet(user, 'RoleRulesCount'),
          valueString: `${currentRoleRules.length}`,
        },
        {
          label: translationsItemTextGet(user, 'RoleAssignedUsers'),
          valueString: `${this.getUsers(roleId).length}`,
        },
      ];
    return currentRoleDetailsList.length
      ? `\n<code>${menuMenuItemDetailsPrintFixedLengthLines(user, currentRoleDetailsList)}</code>`
      : '';
  }

  /**
   * This method generates a menu of roles, with possibility to edit or to add a new role.
   * @param {object} user - The user object.
   * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
   * @returns {object[]} Newly generated submenu.
   */
  menuGenerate(user, menuItemToProcess) {
    logs(`menuGenerate:\n user = ${user}, menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon,
      currentAccessLevel = menuItemToProcess.accessLevel;
    let subMenu = [],
      subMenuIndex = 0;
    cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesRoleUnderEdit);
    cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesNewRule);
    const currentRoles = objectDeepClone(this.getRoles());
    // logs(`existsCachedState(user, cachedMenuRolesCurrentNewRole) = ${existsCachedState(user, cachedMenuRolesCurrentNewRole)}`);
    if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
      const newRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
      if (!currentRoles.hasOwnProperty(newRole.roleId)) {
        currentRoles[newRole.roleId] = newRole.rules;
      }
      // logs(`currentRoles = ${JSON.stringify(currentRoles)}`);
    }
    Object.keys(currentRoles).forEach((roleId) => {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `[${roleId}]`,
        icon: currentIcon,
        options: {roleId},
        function: (user, menuItemToProcess) => {
          return this.#menuItemDetailsRole(user, menuItemToProcess);
        },
        accessLevel: currentAccessLevel,
        submenu: (user, menuItemToProcess) => {
          return this.#menuGenerateRoleRules(user, menuItemToProcess);
        },
      });
    });
    if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
        group: 'addItem',
        icon: iconItemPlus,
        function: (user, _menuItemToProcess) => {
          if (cachedValueExists(user, cachedRolesNewRoleId)) {
            const newRoleId = cachedValueGet(user, cachedRolesNewRoleId);
            if (newRoleId.length <= 12) {
              cachedValueSet(user, cachedRolesRoleUnderEdit, {roleId: newRoleId, rules: []});
              cachedValueDelete(user, cachedRolesNewRoleId);
            }
          }
        },
        submenu: (user, menuItemToProcess) => {
          const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
          let subMenu = [],
            subMenuIndex = 0;
          const newRoleId = cachedValueGet(user, cachedRolesNewRoleId);
          if (newRoleId) {
            if (newRoleId.length > 12) {
              cachedValueSet(user, cachedRolesNewRoleId, newRoleId.slice(0, 12));
              subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemCoreGet(user, 'cmdFixId')}`,
                icon: iconItemEdit,
                command: dataTypeMenuRoles,
                options: {dataType: dataTypeMenuRoles, mode: 'fixId'},
                submenu: [],
              });
            } else {
              logs(`newRoleId = ${newRoleId}`);
              const rootMenu = menuMenuItemGenerateRootMenu(null);
              subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${newRoleId}'`,
                icon: iconItemRole,
                command: cmdItemJumpTo,
                options: {jumpToArray: [0, rootMenu.submenu.length]},
                submenu: [],
              });
            }
          } else {
            subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
              icon: iconItemEdit,
              command: dataTypeMenuRoles,
              options: {dataType: dataTypeMenuRoles, mode: 'setId'},
              submenu: [],
            });
          }
          return subMenu;
        },
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
    Object.keys(this.data).forEach((user) => (this.data[user].available = false));
    const telegramUsersId = `${telegramAdapter}.communicate.users`;
    if (existsState(telegramUsersId)) {
      const telegramUsersListState = getState(telegramUsersId);
      if (
        telegramUsersListState.hasOwnProperty('val') &&
        telegramUsersListState.val &&
        typeof telegramUsersListState === 'object'
      ) {
        const users = JSON.parse(telegramUsersListState.val);
        Object.keys(users).forEach((user) => {
          const userId = typeof user !== 'number' ? Number(user) : user;
          if (this.data.hasOwnProperty(userId)) {
            this.data[userId].available = true;
            this.initRules(userId);
          } else {
            this.data[userId] = {
              userId: userId,
              isAvailable: true,
              isEnabled: initial,
              roles: initial ? [rolesDefaultAdmin] : [],
            };
            Object.keys(users[user]).forEach((attr) => (this.data[userId][attr] = users[user][attr]));
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
    return this.data.hasOwnProperty(itemId) && this.data[itemId] ? itemId : '';
  }

  /**
   * If the user with itemId exists and is enabled, return the string contained an itemId, otherwise return an empty string.
   * @param {number|string} itemId - The user's ID.
   * @returns {string} string.
   */
  validId(itemId) {
    itemId = `${itemId}`;
    return this.existsId(itemId) && this.data[itemId].isEnabled ? itemId : '';
  }

  /**
   * This method toggle the user state `isEnabled`.
   * @param {number|string} itemId - The Id of the user to toggle.
   */
  toggleItemIsEnabled(itemId) {
    itemId = this.existsId(itemId);
    if (itemId) {
      this.data[itemId].isEnabled = !this.data[itemId].isEnabled;
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
      if (!this.hasRole(itemId, roleId)) {
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
      this.data[itemId].roles.splice(this.data[itemId].roles.indexOf(roleId), 1);
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
  getRoles(itemId, compiled = false) {
    let roles = {};
    if (itemId) {
      itemId = this.existsId(itemId);
      if (itemId && this.data[itemId]['roles'].length) {
        // logs(`getRoles ${userId} roles = ${JSON.stringify(this.data[userId]['roles'])}, ${typeof(this.getRelatedDataFunction)}`)
        if (typeof this.getRelatedDataFunction === 'function') {
          this.data[itemId]['roles'].forEach((roleId) => {
            const role = this.getRelatedDataFunction ? this.getRelatedDataFunction(roleId, compiled) : undefined;
            roles = {...roles, ...role};
          });
        }
      }
    } else {
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
    const users = roleId
      ? Object.values(this.data).filter((user) => user.roles.includes(roleId))
      : Object.values(this.data);
    return users.map((user) => user.userId);
  }

  /**
   * This method returns a list(`Object`) of rules objects the user with Id = `itemId` which merged from an associated roles rules lists(Arrays).
   * @param {number|string} itemId - The Id of the user to process.
   * @param {boolean=} compiled - The boolean selector to define a return format of the roles rules.
   * @returns {object[]} An array of rules.
   */
  getRules(itemId, compiled = false) {
    let rules = [];
    itemId = this.existsId(itemId);
    if (itemId) {
      rules = Object.values(this.getRoles(itemId, compiled));
      // logs(`getRules userId = ${userId} compiled = ${compiled} rules = ${JSON.stringify(rules)}`);
      if (rules.length) {
        if (rules.length === 1) {
          rules = rules[0];
        } else {
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
    } else {
      const users = this.getUsers(roleId);
      if (users) {
        users.forEach((userId) => this.updateRules(undefined, userId));
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
    const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon;
    let subMenu = [],
      subMenuIndex = 0;
    this.load();
    Object.keys(this.data).forEach((userId) => {
      const currentUser = this.data[userId],
        currentFullName = `${currentUser.firstName ? currentUser.firstName : ''}${
          currentUser.lastName ? ` ${currentUser.lastName}` : ''
        }`;
      logs(`currentUser = ${JSON.stringify(currentUser)}`);
      let currentUserDetailsList = [];
      this.itemDetailsList.forEach((item) => {
        if (currentUser.hasOwnProperty(item)) {
          const currentUserDetailsLineObject = {
            label: `${translationsItemTextGet(user, 'user', item)}`,
          };
          if (typeof currentUser[item] === 'boolean') {
            currentUserDetailsLineObject.valueString = currentUser[item]
              ? configOptions.getOption(cfgDefaultIconOn, user)
              : configOptions.getOption(cfgDefaultIconOff, user);
            currentUserDetailsLineObject.lengthModifier = 1;
          } else {
            currentUserDetailsLineObject.valueString = currentUser.hasOwnProperty(item)
              ? currentUser[item]
              : currentItem;
          }
          currentUserDetailsList.push(currentUserDetailsLineObject);
        }
      });
      const currentItem = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${currentFullName}${currentUser.userName ? ` [${currentUser.userName}]` : ''}`,
        icon:
          currentUser.isAvailable && currentUser.isEnabled
            ? iconItemUser
            : !currentUser.isEnabled
            ? iconItemDisabled
            : iconItemNotFound,
        text: currentUserDetailsList.length
          ? `\n<code>${menuMenuItemDetailsPrintFixedLengthLines(user, currentUserDetailsList)}</code>`
          : '',
        submenu: new Array(),
      };
      let subSubId = 0;
      if (currentUser.userId !== user.userId) {
        subSubId = currentItem.submenu.push({
          index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
          name: `${translationsItemTextGet(user, currentUser.isEnabled ? 'SwitchOff' : 'SwitchOn')}`,
          icon: currentUser.isEnabled ? currentIcon : iconItemDisabled,
          command: cmdItemPress,
          options: {dataType: dataTypeMenuUsers, userId},
          submenu: [],
        });
      }
      const rolesList = Object.keys(this.getRoles(userId)).join(',');
      currentItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubId}`,
        name: `${translationsItemMenuGet(user, 'RolesList')}: [${
          rolesList.length > 23 ? `${rolesList.slice(0, 10)}...` : rolesList
        }]`,
        options: {userId},
        submenu: (_user, menuItemToProcess) => {
          const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
            {userId} = menuItemToProcess.options;
          let subMenu = [],
            subMenuIndex = 0;
          const allRoles = Object.keys(this.getRoles()),
            userRoles = Object.keys(this.getRoles(userId));
          allRoles.forEach((roleId) => {
            subMenuIndex = subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: `[${roleId}]`,
              icon: userRoles.includes(roleId) ? iconItemRole : iconItemDisabled,
              command: cmdItemPress,
              options: {dataType: dataTypeMenuUserRoles, userId, roleId},
              submenu: [],
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

const /**
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
const translationsList = {}; // Localization translation
const translationsCommonFunctionsAttributesPrefix = `${idFunctions}.common`,
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
function translationsValidateLanguageId(languageId) {
  let langId = '';
  try {
    const canonicalLang = Intl.Collator.supportedLocalesOf(languageId);
    if (languageId.length === 2 && canonicalLang.length) {
      langId = canonicalLang[0];
    }
  } catch (error) {
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
  let translationIds = [];
  if (user) {
    translationIds.push(configOptions.getOption(cfgMenuLanguage, user));
  } else {
    translationIds = Object.keys(translationsList);
  }
  translationIds.forEach((languageId) => {
    const translationId = `${prefixTranslationStates}.${languageId}`,
      translationString = JSON.stringify(objectKeysSort(translationsList[languageId]));
    logs(
      `translationId = ${translationId} namesTranslation = ${JSON.stringify(translationsList[languageId], null, 2)}`,
    );
    if (existsState(translationId)) {
      setState(translationId, translationString, true);
    } else {
      // @ts-ignore
      createState(translationId, translationString, {
        name: `Translation ${languageId}`,
        type: 'json',
        read: true,
        write: true,
      });
    }
  });
  if (!user) {
    /** it will check all possible states under 'this.prefix' ... **/
    $(`state[id=${prefixTranslationStates}.*]`).each((stateId) => {
      const languageId = '' + stateId.split('.').pop();
      if (!translationsList.hasOwnProperty(languageId)) {
        console.log(`Found obsolete translation language = ${JSON.stringify(languageId)}`);
        deleteState(stateId, (error, result) => {
          if (error) {
            console.warn(`Error during deletion of state '${stateId}' : ${JSON.stringify(error)}`);
          } else {
            console.log(
              `Obsolete translation language state '${stateId}' is deleted with result : ${JSON.stringify(result)}`,
            );
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
  $(`state[id=${prefixTranslationStates}.*]`).each((translationId) => {
    const languageId = translationId.replace(`${prefixTranslationStates}.`, ''),
      canonicalLang = translationsValidateLanguageId(languageId);
    // logs(`languageId = ${languageId}, langId = ${langId}`);
    if (canonicalLang) {
      try {
        // logs(`langId = ${langId}, translationId = ${translationId}`);
        translationsList[canonicalLang] = JSON.parse(getState(translationId).val);
      } catch (error) {
        console.warn(`Can't process a translation for language ${languageId}!`);
      }
      // logs(`translationsList[${langId}] = ${JSON.stringify(translationsList[langId])}`);
    } else {
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
    const languageId = languageIds.shift();
    if (languageId) {
      repo
        .get(translations[languageId])
        .then((response) => {
          if (response && response.data && typeOf(response.data, 'object')) {
            translations[languageId] = response.data;
          }
        })
        .catch((error) => {
          console.warn(`Can't download locale '${languageId}' from the repo! Error is '${error}'.`);
        })
        .then(() => {
          if (languageIds.length) {
            translationsDownloadFromRepo(repo, languageIds, translations, callback);
          } else {
            callback(translations, undefined);
          }
        });
    } else {
      callback(translations, undefined);
    }
  }

  const github = axios.create({
    baseURL: scriptRepositorySite,
    timeout: 10000,
  });
  if (languageId && languageId !== doAll) {
    languageId = translationsValidateLanguageId(languageId);
  } else {
    languageId = doAll;
  }
  if (languageId) {
    const remoteFolder =
      extensionId && extensionId !== translationsCoreId
        ? `${scriptBranchRemoteFolder}${translationsExtensionsPrefix}/${extensionId
            .replace(prefixExtensionId, '')
            .toLowerCase()}/locales/`
        : scriptCoreLocalesRemoteFolder;
    console.log(remoteFolder);
    github
      .get(remoteFolder)
      .then((response) => {
        if (response && response.data) {
          let localesLinks = {},
            parsedLocale;
          while ((parsedLocale = translationsLocalesExtractRegExp.exec(response.data))) {
            console.log(`parsed = ${parsedLocale}`);
            if (parsedLocale && parsedLocale.length && parsedLocale[1] && parsedLocale[2]) {
              localesLinks[parsedLocale[2]] = parsedLocale[1].replace('/blob/', '/raw/');
            }
          }
          if (languageId !== doAll && localesLinks.hasOwnProperty(languageId)) {
            localesLinks = {[languageId]: localesLinks[languageId]};
          } else if (languageId !== doAll) {
            callback(undefined, `Language with id = ${languageId} is not presented in repo!`);
          }
          translationsDownloadFromRepo(github, Object.keys(localesLinks), localesLinks, callback);
        }
      })
      .catch((error) => {
        callback(undefined, `Can't get the locales list from repo! Error is '${error}'.`);
      });
  } else {
    callback(undefined, 'Wrong language Id!');
  }
}

/**
 * This function deletes an backup file from the server.
 */
async function translationsInitialLoadLocalesFromRepository() {
  return new Promise((resolve, reject) => {
    translationsLoadLocalesFromRepository(doAll, translationsCoreId, (locales, error) => {
      if (error) {
        console.warn(`Can't make an initial load of locales from repo! Error is '${error}'.`);
        reject(error);
      } else {
        Object.keys(locales).forEach((languageId) => {
          if (
            typeOf(locales[languageId], 'object') &&
            translationsCheckAndCacheUploadedFile(cachedCommonId, '', '', '', locales[languageId])
          ) {
            const newTranslation = locales[languageId];
            if (
              newTranslation &&
              newTranslation.hasOwnProperty(idTranslation) &&
              typeOf(newTranslation[idTranslation], 'object') &&
              Math.abs(translationsCompareVersion(newTranslation['version'])) < 10
            ) {
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
  const [translationVersionToCompareMajor, translationVersionToCompareMinor] = (
      versionToCompare && versionToCompare.includes('.') ? versionToCompare : '0.0'
    ).split('.'),
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
        Object.keys(translationInputPart).forEach((translationKey) => {
          if (translationCurrentPart.hasOwnProperty(translationKey)) {
            if (
              typeOf(translationCurrentPart[translationKey], 'object') &&
              typeOf(translationInputPart[translationKey], 'object')
            ) {
              translationCurrentPart[translationKey] = translationsProcessUpdate(
                translationCurrentPart[translationKey],
                translationInputPart[translationKey],
                translationUpdateMode,
              );
            } else if (translationUpdateMode === 'overwrite') {
              if (
                typeOf(translationInputPart[translationKey], 'string') &&
                typeOf(translationCurrentPart[translationKey]) === typeOf(translationInputPart[translationKey])
              ) {
                translationCurrentPart[translationKey] = translationInputPart[translationKey];
              }
            } else if (translationUpdateMode === 'enrich') {
              if (
                typeOf(translationInputPart[translationKey], 'string') &&
                typeOf(translationCurrentPart[translationKey]) === typeOf(translationInputPart[translationKey]) &&
                translationCurrentPart[translationKey].includes(translationKey)
              ) {
                translationCurrentPart[translationKey] = translationInputPart[translationKey];
              }
            }
          } else {
            translationCurrentPart[translationKey] = translationInputPart[translationKey];
          }
        });
        break;
      }
      case 'template': {
        const translationTemplatePart = objectDeepClone(translationInputPart);
        Object.keys(translationTemplatePart).forEach((translationKey) => {
          if (translationCurrentPart.hasOwnProperty(translationKey)) {
            if (
              typeOf(translationTemplatePart[translationKey], 'object') &&
              typeOf(translationCurrentPart[translationKey], 'object')
            ) {
              translationTemplatePart[translationKey] = translationsProcessUpdate(
                translationCurrentPart[translationKey],
                translationInputPart[translationKey],
                translationUpdateMode,
              );
            } else if (
              typeOf(translationTemplatePart[translationKey]) === typeOf(translationCurrentPart[translationKey])
            ) {
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
  if (cachedValueExists(user, cachedTranslationsToUpload)) {
    const translationInputFull = cachedValueGet(user, cachedTranslationsToUpload),
      _translationInputLanguage = translationInputFull.hasOwnProperty('language')
        ? translationsValidateLanguageId(translationInputFull.language)
        : '',
      translationInputVersionCompare = translationsCompareVersion(translationInputFull['version']);
    if (
      translationInputFull.hasOwnProperty(idTranslation) &&
      typeOf(translationInputFull[idTranslation], 'object') &&
      Math.abs(translationInputVersionCompare) < 10
    ) {
      const translationPossibleUpdateModes = translationInputVersionCompare ? ['overwrite'] : translationsUpdateModes,
        translationCurrentParts = translationPart === doAll ? translationsTopItems : [translationPart],
        translationCurrentLanguage = configOptions.getOption(cfgMenuLanguage, user),
        translationCurrent = objectDeepClone(translationsGetCurrentForUser(user));
      if (translationPossibleUpdateModes.includes(translationUpdateMode)) {
        const translationInput = translationInputFull[idTranslation];
        translationCurrentParts.forEach((translationPart) => {
          if (translationPart.indexOf(prefixExtensionId) === 0) {
            const extensionId = translationPart.replace(prefixExtensionId, '').toLowerCase();
            if (extensionId) {
              if (!translationCurrent.hasOwnProperty(idFunctions)) translationCurrent[idFunctions] = {};
              if (!translationCurrent[idFunctions].hasOwnProperty(idExternal))
                translationCurrent[idFunctions][idExternal] = {};
              if (!translationCurrent[idFunctions][idExternal].hasOwnProperty(translationPart))
                translationCurrent[idFunctions][idExternal][translationPart] = {};
              if (translationCurrent[idFunctions][idExternal][translationPart].hasOwnProperty(translationsSubPrefix)) {
                translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix] =
                  translationsProcessUpdate(
                    translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix],
                    translationInput[idFunctions][idExternal][extensionId][translationsSubPrefix],
                    translationUpdateMode,
                  );
              } else {
                translationCurrent[idFunctions][idExternal][translationPart][translationsSubPrefix] =
                  translationInput[idFunctions][idExternal][extensionId][translationsSubPrefix];
              }
            }
          } else if (translationInput.hasOwnProperty(translationPart)) {
            if (translationCurrent.hasOwnProperty(translationPart)) {
              translationCurrent[translationPart] = translationsProcessUpdate(
                translationCurrent[translationPart],
                translationInput[translationPart],
                translationUpdateMode,
              );
            } else {
              translationCurrent[translationPart] = translationInput[translationPart];
            }
          }
        });
        translationsList[translationCurrentLanguage] = translationCurrent;
        translationsSave(user);
      } else {
        result = translationsItemTextGet(user, 'MsgTranslationsNonApplicableUpdateMode');
      }
    } else {
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
  // logs(`translationsList = ${JSON.stringify(translationsList)}`);
  let languageId = configOptions.getOption(cfgMenuLanguage, user),
    currentTranslation;
  // logs(`languageId = ${languageId}`);
  if (!translationsList[languageId]) {
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
function translationsPointOnItemOwner(user, translationId, pointOnItemItself = false) {
  const // @ts-ignore
    idsList = translationId ? (typeOf(translationId, 'string') ? translationId.split('.') : translationId) : [],
    whileCondition = pointOnItemItself ? 0 : 1;
  let currentTranslation = translationsGetCurrentForUser(user);
  if (currentTranslation) {
    while (idsList.length > whileCondition) {
      const currentId = idsList.shift();
      if (currentId) {
        if (!currentTranslation.hasOwnProperty(`${currentId}`)) {
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
  // logs(`translationId = ${translationId}`, _l)
  const currentTranslation = translationsPointOnItemOwner(user, translationId),
    translationIdArray = translationId ? translationId.split('.') : [],
    idPrefix = translationIdArray.length ? translationIdArray[0] : '',
    shortId = translationIdArray.pop();
  // logs(`\n\n translationId = ${translationId}, shortId = ${JSON.stringify(shortId)}, currentTranslation = ${JSON.stringify(currentTranslation)}`)
  // logs(`currentTranslation[${shortId}] = ${currentTranslation[shortId]}`);
  if (translationId && shortId && currentTranslation) {
    if (!currentTranslation.hasOwnProperty(shortId)) {
      console.warn(
        `translationId '${translationId}' is not found. getFromTranslation is called from ${
          arguments.callee && arguments.callee.caller ? arguments.callee.caller.name : ''
        }`,
      );
      currentTranslation[shortId] = translationId;
      translationsSave(user);
    } else if (
      (translationId.indexOf(translationsCommonFunctionsAttributesPrefix) !== 0 &&
        currentTranslation[shortId].indexOf(translationsCommonFunctionsAttributesPrefix) === 0) ||
      (idPrefix &&
        translationId.indexOf(translationsCommonFunctionsAttributesPrefix) !== 0 &&
        currentTranslation[shortId].indexOf(translationsCommonFunctionsAttributesPrefix) === 0)
    ) {
      return translationsItemGet(user, currentTranslation[shortId]);
    }
    return currentTranslation[shortId];
  } else {
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
function translationsItemGenerateId(translationIdType, ...items) {
  let result = translationIdType;
  if (items && Array.isArray(items)) {
    result += items.map((item) => stringCapitalize(item)).join('');
  }
  return result;
}

/**
 * This functions generates translation Id by joining a list of items, and
 * adding the "type" selector as prefix after `Core` identifier.
 * @param {string} translationIdType - The "type" selector.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation Id.
 */
function translationsItemGenerateCoreId(translationIdType, ...items) {
  let result = `${translationsCoreId}.${translationIdType}`;
  if (items && Array.isArray(items)) {
    result += items.map((item) => stringCapitalize(item)).join('');
  }
  return result;
}

/**
 * This functions generates translation Id by joining a list of items, and
 * adding the 'text' "type" selector as prefix.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation Id.
 */
function translationsItemGenerateTextId(...items) {
  return translationsItemGenerateCoreId('text', ...items);
}

/**
 * This functions generates translation Id by joining a list of items, and
 * adding the 'menu' "type" selector as prefix.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation Id.
 */
function _translationsItemGenerateMenuId(...items) {
  return translationsItemGenerateCoreId('menu', ...items);
}

/**
 * This functions returns the value for the appropriate text translation Id,
 * which will be generated as a joint string, from the current user translation.
 * @param {object} user - The user object.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation value for the provided Id.
 */
function translationsItemTextGet(user, ...items) {
  return translationsItemCoreGet(user, translationsItemGenerateId('text', ...items));
}

/**
 * This functions returns the value for the appropriate menu translation Id,
 * which will be generated as a joint string, from the current user translation.
 * @param {object} user - The user object.
 * @param  {...any} items - The one or several string arguments, array of strings.
 * @returns {string} The translation value for the provided Id.
 */
function translationsItemMenuGet(user, ...items) {
  return translationsItemCoreGet(user, translationsItemGenerateId('menu', ...items));
}

/**
 * This functions set the new value to the appropriate translation Id.
 * @param {object} user - The user object.
 * @param {string} translationId - The translation Id.
 * @param {string} translationValue - The new value.
 */
function translationsItemStore(user, translationId, translationValue) {
  const currentTranslation = translationsPointOnItemOwner(user, translationId),
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
  const idsList = translationId.split('.');
  let currentTranslation = translationsPointOnItemOwner(user, translationId);
  if (currentTranslation && idsList) {
    while (idsList.length > 0) {
      const shortId = idsList.pop();
      if (shortId) {
        delete currentTranslation[shortId];
        if (idsList.length === 0 || Object.keys(currentTranslation).length > 0) break;
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
function translationsGetObjectId(object, functionId, destinationId, isCommon = false) {
  logs(`object = ${JSON.stringify(object)}`);
  let translationId;
  const functionsList = enumerationsList[dataTypeFunction].list,
    destinationsList = enumerationsList[dataTypeDestination].list;
  if ((functionId && typeOf(functionId, 'string') && functionsList.hasOwnProperty(functionId)) || isCommon) {
    if (
      !typeOf(destinationId, 'string') ||
      (destinationId && typeOf(destinationId, 'string') && destinationsList.hasOwnProperty(destinationId))
    ) {
      if (object && ((typeof object === 'object' && object.hasOwnProperty('_id')) || typeof object === 'string')) {
        const currentFunction = functionsList[functionId],
          currentEnum = currentFunction ? currentFunction.enum : '',
          objectId = typeOf(object, 'string') ? object : object._id,
          prefixId = currentFunction
            ? objectId.split('.').slice(0, -currentFunction.statesSectionsCount).join('.')
            : '';
        if (functionId) functionId = functionId.replace('.', '_');
        translationId = `${
          isCommon ? translationsCommonFunctionsAttributesPrefix : `${idFunctions}.${currentEnum}.${functionId}`
        }.${
          destinationId
            ? `${idDestinations}.${destinationId}.${objectId.split('.').join('_')}`
            : objectId.replace(`${prefixId}.`, '').split('.').join('_')
        }`;
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
function translationsGetObjectName(user, object, functionId, destinationId, isCommon = false) {
  logs(`object = ${JSON.stringify(object)}`);
  let result = '';
  const translationId = translationsGetObjectId(object, functionId, destinationId, isCommon);
  // logs(`object = ${object}, translationId = ${translationId}`, _l);
  if (translationId) {
    const objectName = translationsItemGet(user, translationId);
    if (objectName !== translationId || (typeof object === 'string' && !existsObject(object))) {
      result = objectName;
    }
  }
  if (!result) {
    if (typeof object === 'string' && existsObject(object)) {
      object = getObject(object);
    }
    logs(`object 2 = ${JSON.stringify(object)}`);
    if (object && object.hasOwnProperty('common') && object.common.hasOwnProperty('name')) {
      const objectCommonName = object.common.name;
      if (typeof objectCommonName === 'string') {
        result = objectCommonName;
      } else if (typeof objectCommonName === 'object') {
        const languageFromConfig = configOptions.getOption(cfgMenuLanguage, user);
        if (objectCommonName.hasOwnProperty(languageFromConfig)) {
          result = objectCommonName[languageFromConfig];
        } else if (objectCommonName.hasOwnProperty('en')) {
          result = objectCommonName.en;
        } else {
          let objectCommonNames = objectCommonName.values();
          if (objectCommonNames.length > 0) {
            result = objectCommonNames[0];
          }
        }
      }
    }
  }
  return result ? result.trim() : 'Undefined';
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
  let result = '';
  if (enumId) {
    enumId = enumId.includes(prefixEnums) ? enumId.split('.').slice(2).join('.') : enumId;
    if (
      enumerationType &&
      enumerationsList.hasOwnProperty(enumerationType) &&
      enumerationsList[enumerationType].list.hasOwnProperty(enumId)
    ) {
      const currentEnumerations = enumerationsList[enumerationType],
        currentEnumerationList = enumerationsList[enumerationType].list,
        currentEnum = currentEnumerationList[enumId],
        enumPrefix = `${currentEnumerations.id}.${currentEnum.enum}.${enumId.replace('.', '_')}`;
      // logs(`currentEnum.isExternal = ${currentEnum.isExternal}, ${currentEnum.nameTranslationId}, currentEnum.translationsKeys ${currentEnum.translationsKeys}`, _l)
      if (
        currentEnum.isExternal &&
        currentEnum.nameTranslationId &&
        currentEnum.translationsKeys &&
        currentEnum.translationsKeys.includes(currentEnum.nameTranslationId)
      ) {
        result = `${enumPrefix}.${translationsSubPrefix}.${currentEnum.nameTranslationId}`;
      } else {
        if (enumNameDeclinationKey === undefined || enumNameDeclinationKey === null)
          enumNameDeclinationKey = enumerationsNamesMain;
        result = `${enumPrefix}.${enumerationsNamesTranslationIdPrefix}.${enumNameDeclinationKey}`;
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
    } else {
      extensionId = `${prefixExtensionId}.${stringCapitalize(extensionId)}`;
    }
    if (
      enumerationsList[dataTypeFunction].list.hasOwnProperty(extensionId) &&
      enumerationsList[dataTypeFunction].list[extensionId].isExternal
    ) {
      const currentExtension = enumerationsList[dataTypeFunction].list[extensionId];
      if (currentExtension.hasOwnProperty('translationsKeys') && currentExtension.translationsKeys) {
        const translationsKeyPrefix = `${idFunctions}.${idExternal}.${extensionId}.${translationsSubPrefix}`;
        currentExtension.translationsKeys.forEach((translationKey) => {
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
function translationsCheckAndCacheUploadedFile(
  user,
  translationFileFullPath,
  translationFileName,
  translationFileSize,
  translationObject,
) {
  let translationFileIsOk = false;
  if (translationFileFullPath.includes(nodePath.join('document', translationFileName)) || translationObject) {
    try {
      if (translationObject === undefined) nodeFS.accessSync(translationFileFullPath, nodeFS.constants.R_OK);
      const fileStats = translationObject === undefined ? nodeFS.statSync(translationFileFullPath) : {};
      if (
        translationObject ||
        (translationFileSize && Number(translationFileSize) === 0) ||
        (translationFileSize && Number(translationFileSize) && fileStats.size === Number(translationFileSize))
      ) {
        let inputTranslation =
          translationObject === undefined ? nodeFS.readFileSync(translationFileFullPath) : translationObject;
        try {
          inputTranslation = typeOf(inputTranslation, 'string') ? JSON.parse(inputTranslation) : inputTranslation;
          const currentLanguage = translationsValidateLanguageId(inputTranslation.language);
          translationFileName = translationFileName ? translationFileName : `locale_${currentLanguage}.json`;
          // logs(`inputTranslation = ${JSON.stringify(inputTranslation, null, 2)}`, _l);
          // logs(`${(inputTranslation.type === translationType)}, ${(inputTranslation.version === translationVersion)}, ${(currentLanguage)}, ${inputTranslation.translation}`, _l)
          if (
            inputTranslation.type === translationsType &&
            inputTranslation.version === translationsVersion &&
            currentLanguage &&
            inputTranslation.translation
          ) {
            cachedValueSet(user, cachedTranslationsToUpload, inputTranslation);
            translationFileIsOk = true;
            console.warn(
              `Translation '${translationFileName}' for language '${inputTranslation.language}' is uploaded and can be processed!`,
            );
          } else {
            console.warn(
              `Translation '${translationFileName}' is uploaded, but has wrong format and can't be processed!`,
            );
          }
        } catch (err) {
          console.warn(`JSON parse error: ${JSON.stringify(err)} for translation '${translationFileName}'!`);
        }
      } else {
        console.warn(`Translation '${translationFileName}' is uploaded, but has wrong size and can't be processed!`);
      }
      nodeFS.rm(translationFileFullPath, {force: true}, (err) => {
        if (err)
          console.warn(`Can't delete translation file '${translationFileFullPath}'! Error: '${JSON.stringify(err)}'.`);
      });
    } catch (err) {
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
function translationsMenuGenerateUploadTranslation(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0;
  let subMenuIndex = 0,
    subMenu = [];
  if (isCurrentAccessLevelAllowModify && cachedValueExists(user, cachedTranslationsToUpload)) {
    const inputTranslation = cachedValueGet(user, cachedTranslationsToUpload),
      {translationPart: currentPart} = menuItemToProcess.options,
      currentLanguage = inputTranslation ? translationsValidateLanguageId(inputTranslation.language) : '',
      currentUploadMode = menuItemToProcess.id,
      _currentVersion = inputTranslation ? inputTranslation.version : '';
    if (currentLanguage && inputTranslation.translation) {
      const translationParts = currentPart ? [currentPart] : [...translationsTopItems, doAll];
      translationParts.forEach((translationPart) => {
        const isExtensionTranslation = translationPart.indexOf(prefixExtensionId) === 0,
          extensionId = isExtensionTranslation ? translationPart.replace(prefixExtensionId, '').toLowerCase() : '',
          isExtensionTranslationExists =
            isExtensionTranslation &&
            extensionId &&
            inputTranslation.translation.hasOwnProperty(idFunctions) &&
            inputTranslation.translation[idFunctions].hasOwnProperty(idExternal) &&
            inputTranslation.translation[idFunctions][idExternal].hasOwnProperty(extensionId) &&
            inputTranslation.translation[idFunctions][idExternal][extensionId].hasOwnProperty(translationsSubPrefix) &&
            inputTranslation.translation[idFunctions][idExternal][extensionId][translationsSubPrefix];
        if (
          inputTranslation.translation.hasOwnProperty(translationPart) ||
          translationPart === doAll ||
          isExtensionTranslationExists
        ) {
          const translationPartName = isExtensionTranslationExists
              ? translationPart
              : translationsGetPartName(user, translationPart),
            subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemMenuGet(user, 'ItemsProcess')} ${translationPartName}`,
              icon: iconItemApply,
              group: cmdItemsProcess,
              options: {
                [menuOptionHorizontalNavigation]: false,
                dataType: dataTypeTranslation,
                uploadMode: currentUploadMode,
                translationPart,
              },
              function: translationsUploadMenuItemDetails,
              submenu: new Array(),
            };
          translationsUpdateModes.forEach((translationUpdateMode, translationUpdateModeIndex) => {
            subMenuItem.submenu.push({
              index: `${currentIndex}.${subMenuIndex}.${translationUpdateModeIndex}`,
              name: translationsItemMenuGet(user, idTranslation, translationUpdateMode),
              icon: iconItemApply,
              group: cmdItemsProcess,
              function: translationsUploadMenuItemDetails,
              command: cmdItemsProcess,
              options: {
                [menuOptionHorizontalNavigation]: false,
                dataType: dataTypeTranslation,
                uploadMode: currentUploadMode,
                translationPart,
                updateMode: translationUpdateMode,
              },
              submenu: [],
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
  const {translationPart: currentPart} = menuItemToProcess.options,
    currentItemDetailsList = [];
  if (cachedValueExists(user, cachedTranslationsToUpload)) {
    const inputTranslation = cachedValueGet(user, cachedTranslationsToUpload),
      currentLanguage = translationsValidateLanguageId(inputTranslation.language),
      _currentVersion = inputTranslation.version;
    currentItemDetailsList.push({
      label: translationsItemCoreGet(user, 'cfgMenuLanguage'),
      valueString: configOptions.getOption(cfgMenuLanguage, user),
    });
    currentItemDetailsList.push({label: translationsItemTextGet(user, 'languageInFile'), valueString: currentLanguage});
    if (currentPart)
      currentItemDetailsList.push({
        label: translationsItemTextGet(user, 'translationPart'),
        valueString:
          currentPart.indexOf(prefixExtensionId) === 0 ? currentPart : translationsGetPartName(user, currentPart),
      });
  }
  return currentItemDetailsList.length
    ? `<code>${menuMenuItemDetailsPrintFixedLengthLines(user, currentItemDetailsList)}</code>`
    : '';
}

/**
 * This function generates a submenu to manage the Translation basic items (i.e. menu, command and text related).
 * The selector is an `Id` property of `menuItemToProcess` object.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsMenuGenerateBasicItems(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    translationType = menuItemToProcess.id,
    currentTranslation = translationsPointOnItemOwner(user, translationsCoreId, true);
  let subMenuIndex = 0,
    subMenu = [];
  Object.keys(currentTranslation)
    .filter((key) => key.indexOf(translationType) === 0)
    .sort()
    .forEach((translationKey) => {
      logs(`Translation key is ${translationKey}`);
      if (!translationKey.includes('.') && translationKey.indexOf(translationType) === 0) {
        let subSubMenuIndex = 0,
          subMenuItem = {
            index: `${currentIndex}.${subMenuIndex}`,
            name: `[${currentTranslation[translationKey]}] ${
              currentTranslation[translationKey].includes(translationKey) ? iconItemNotFound : ''
            }`,
            icon: iconItemTranslation,
            text: ` (${translationKey})`,
            submenu: new Array(),
          };
        if (isCurrentAccessLevelAllowModify) {
          const currentCommandOptions = {
            dataType: dataTypeTranslation,
            translationId: translationsItemGenerateCoreId('', translationKey),
          };
          subSubMenuIndex = subMenuItem.submenu.push(
            menuMenuItemGenerateRenameItem(
              user,
              `${currentIndex}.${subMenuIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
          subMenuItem.submenu.push(
            menuMenuItemGenerateDeleteItem(
              user,
              `${currentIndex}.${subMenuIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
        } else {
          subMenuItem.command = cmdNoOperation;
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
function translationsMenuGenerateFunctionStatesItems(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {
      function: currentFunctionId,
      functionEnum: currentFunctionEnum,
      dataType: currentDataType,
      translationPrefix,
    } = menuItemToProcess.options,
    translationType = translationPrefix
      ? translationPrefix
      : `${idFunctions}.${currentFunctionEnum}.${currentFunctionId.replace('.', '_')}`,
    currentTranslation = translationsPointOnItemOwner(user, translationType, true),
    deviceAttributesListKeys =
      currentFunctionId && enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunctionId)
        ? Object.keys(enumerationsList[dataTypeFunction].list[currentFunctionId].deviceAttributes).map((key) =>
            key.split('.').join('_'),
          )
        : [],
    deviceButtonsListKeys =
      currentFunctionId && enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunctionId)
        ? Object.keys(enumerationsList[dataTypeFunction].list[currentFunctionId].deviceButtons).map((key) =>
            key.split('.').join('_'),
          )
        : [],
    currentDeviceListKeys =
      currentDataType === dataTypeDeviceAttributes ? deviceAttributesListKeys : deviceButtonsListKeys;

  // logs(`translationType = ${translationType}, currentTranslation = ${JSON.stringify(currentTranslation)}, currentTranslationPrefix = ${translationPrefix}`, _l);
  let subMenu = [];
  Object.keys(currentTranslation)
    .filter((translationKey) => typeof currentTranslation[translationKey] === 'string')
    .filter(
      (translationKey) => !currentFunctionId || !deviceAttributesListKeys.find((attrId) => attrId === translationKey),
    )
    .filter(
      (translationKey) => !currentFunctionId || !deviceButtonsListKeys.find((attrId) => attrId === translationKey),
    )
    .filter(
      (translationKey) =>
        !currentFunctionId || currentDeviceListKeys.find((attrId) => translationKey.indexOf(attrId) === 0),
    )
    .forEach((translationKey, translationKeyIndex) => {
      // logs(`key = ${translationKey}, translationType = ${translationType}`, _l);
      const currentTranslationId = `${translationType}.${translationKey}`;
      let currentValue = currentTranslation[translationKey];
      if (currentValue === currentTranslationId) {
        currentValue += ' ' + iconItemNotFound;
      } else if (currentValue.indexOf(translationsCommonFunctionsAttributesPrefix) === 0) {
        currentValue = `${translationsItemGet(
          user,
          `${translationsCommonFunctionsAttributesPrefix}.${translationKey}`,
        )} ${iconItemCommon}`;
      }
      let subSubMenuIndex = 0,
        subMenuItem = {
          index: `${currentIndex}.${translationKeyIndex}`,
          name: `${currentValue}`,
          text: ` [${currentTranslationId}]`,
          icon: translationType === translationsCommonFunctionsAttributesPrefix ? iconItemCommon : '',
          submenu: new Array(),
        };
      if (isCurrentAccessLevelAllowModify) {
        const currentCommandOptions = {dataType: dataTypeTranslation, translationId: currentTranslationId};
        subSubMenuIndex = subMenuItem.submenu.push(
          menuMenuItemGenerateRenameItem(
            user,
            `${currentIndex}.${translationKeyIndex}`,
            subSubMenuIndex,
            currentCommandOptions,
          ),
        );
        if (translationPrefix !== translationsCommonFunctionsAttributesPrefix) {
          subSubMenuIndex = subMenuItem.submenu.push({
            index: `${currentIndex}.${translationKeyIndex}.${subSubMenuIndex}`,
            name: `${translationsItemCoreGet(user, cmdUseCommonTranslation)}`,
            icon: iconItemCommon,
            command: cmdUseCommonTranslation,
            options: currentCommandOptions,
            submenu: [],
          });
        }
        subMenuItem.submenu.push(
          menuMenuItemGenerateDeleteItem(
            user,
            `${currentIndex}.${translationKeyIndex}`,
            subSubMenuIndex,
            currentCommandOptions,
          ),
        );
      } else {
        subMenuItem.command = cmdNoOperation;
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
function translationsMenuGenerateFunctionDeviceItems(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {function: currentFunction, functionEnum: currentFunctionEnum} = menuItemToProcess.options,
    translationType = `${idFunctions}.${currentFunctionEnum}.${currentFunction.replace('.', '_')}`,
    currentTranslation = translationsPointOnItemOwner(user, `${translationType}.destinations`, true),
    destinationItems = enumerationsList[dataTypeDestination].list;
  // logs(`translationType = ${translationType}, currentTranslation = ${JSON.stringify(currentTranslation)}`, _l);
  let subMenu = [];
  Object.keys(currentTranslation)
    .filter(
      (translationKey) =>
        typeof currentTranslation[translationKey] === 'object' && destinationItems.hasOwnProperty(translationKey),
    )
    .forEach((translationKey, translationKeyIndex) => {
      const subMenuItem = {
          index: `${currentIndex}.${translationKeyIndex}`,
          name: `${translationsGetEnumName(user, dataTypeDestination, translationKey, enumerationsNamesMain)}`,
          // text: ` [${currentTranslationId}]`,
          // icon: currentIcon,\
          submenu: new Array(),
        },
        currentDevices = currentTranslation[translationKey];
      Object.keys(currentDevices).forEach((translationDeviceKey, translationDeviceKeyIndex) => {
        // logs(`key = ${translationDeviceKey}, translationType = ${translationType}`, _l);
        const currentTranslationId = `${translationType}.destinations.${translationKey}.${translationDeviceKey}`;
        let currentValue = currentDevices[translationDeviceKey],
          subSubMenuIndex = 0;
        if (currentValue === currentTranslationId) {
          currentValue = `${currentValue.split('.').pop().split('_').slice(-4).join('.')} ${iconItemNotFound}`;
        }
        const subSubMenuItem = {
          index: `${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`,
          name: `${currentValue}`,
          text: ` [${currentTranslationId}]`,
          // icon: currentIcon,
          submenu: new Array(),
        };
        if (isCurrentAccessLevelAllowModify) {
          const currentCommandOptions = {
            dataType: dataTypeTranslation,
            translationType: translationType,
            item: translationKeyIndex,
            index: translationDeviceKeyIndex,
          };
          subSubMenuIndex = subSubMenuItem.submenu.push(
            menuMenuItemGenerateRenameItem(
              user,
              `${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
          subSubMenuItem.submenu.push(
            menuMenuItemGenerateDeleteItem(
              user,
              `${currentIndex}.${translationKeyIndex}.${translationDeviceKeyIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
        } else {
          subSubMenuItem.command = cmdNoOperation;
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
function translationsMenuGenerateExtensionsTranslationsItems(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    extensionId = menuItemToProcess.id,
    translationType = `${idFunctions}.${idExternal}.${extensionId}.${translationsSubPrefix}`,
    _currentTranslation = translationsPointOnItemOwner(user, translationType, true),
    currentTranslationKeys = enumerationsList[dataTypeFunction].list.hasOwnProperty(extensionId)
      ? enumerationsList[dataTypeFunction].list[extensionId].translationsKeys
      : [];
  // logs(`currentTranslation = ${JSON.stringify(currentTranslation)}, currentTranslationKeys = ${JSON.stringify(currentTranslationKeys)}`, _l);
  let subMenu = [];
  if (currentTranslationKeys)
    currentTranslationKeys.forEach((translationKey, translationKeyIndex) => {
      const subMenuItem = {
        index: `${currentIndex}.${translationKeyIndex}`,
        name: translationsItemGet(user, `${translationType}.${translationKey}`),
        icon: iconItemTranslation,
        text: ` (${translationKey})`,
      };
      if (isCurrentAccessLevelAllowModify) {
        (subMenuItem.options = {dataType: dataTypeTranslation, translationId: `${translationType}.${translationKey}`}),
          (subMenuItem.submenu = (user, menuItemToProcess) => {
            const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
            let subMenu = new Array(),
              subMenuIndex = 0;
            subMenuIndex = subMenu.push(
              menuMenuItemGenerateRenameItem(user, `${currentIndex}`, subMenuIndex, menuItemToProcess.options),
            );
            subMenu.push(
              menuMenuItemGenerateDeleteItem(user, `${currentIndex}`, subMenuIndex, menuItemToProcess.options),
            );
            return subMenu;
          });
      } else {
        subMenuItem.submenu = [];
        subMenuItem.command = cmdNoOperation;
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
  translationPartId = translationPartId === translationsCoreId ? '' : translationPartId;
  return [
    {
      name: translationsItemMenuGet(user, 'TranslationDownload'),
      icon: iconItemDownload,
      group: 'menuTranslationFile',
      id: doDownload,
      command: cmdItemDownload,
      options: {translationPart: translationPartId},
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
          command: cmdItemUpload,
          options: {dataType: dataTypeTranslation, uploadMode: doUploadDirectly, translationPart: translationPartId},
          function: translationsUploadMenuItemDetails,
          submenu: translationsMenuGenerateUploadTranslation,
        },
        {
          name: translationsItemMenuGet(user, 'TranslationUploadFromRepo'),
          icon: iconItemUpload,
          group: 'menuTranslationFile',
          id: doUploadFromRepo,
          command: cmdItemUpload,
          options: {dataType: dataTypeTranslation, uploadMode: doUploadFromRepo, translationPart: translationPartId},
          function: translationsUploadMenuItemDetails,
          submenu: translationsMenuGenerateUploadTranslation,
        },
      ],
    },
  ];
}

//*** Translation - end ***//

//*** cachedStates - begin ***//

const cachedIsWaitForInput = 'isWaitForInput',
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
  [cachedBotSendMessageId]: {
    name: 'Message ID of last sent message by the bot',
    type: 'number',
    read: true,
    write: true,
    role: 'id',
  },
  [cachedMessageId]: {name: 'Message ID of last received request', type: 'number', read: true, write: true, role: 'id'},
  [cachedUser]: {name: 'user data as json', type: 'json', read: true, write: true, role: 'object'},
  [cachedMenuOn]: {name: 'Is menu shown to the user', type: 'boolean', read: true, write: true, role: 'state'},
  [cachedMenuItem]: {name: 'Last menu item shown to the user', type: 'json', read: true, write: true, role: 'json'},
  [cachedLastMessage]: {
    name: 'Last menu message sent to the user',
    type: 'string',
    read: true,
    write: true,
    role: 'text',
  },
  [cachedCurrentState]: {
    name: 'State currently processed in Menu',
    type: 'string',
    read: true,
    write: true,
    role: 'id',
  },
  [cachedMode]: {name: 'Current user mode', type: 'number', read: true, write: true, role: 'number'},
  enumerationItems: {name: 'List of Items for menu', type: 'json', read: true, write: true, role: 'json'},
  [prefixExternalStates]: {name: 'External state', type: 'json', read: true, write: true, role: 'json'},
  [cachedSentImages]: {name: 'List of sent images', type: 'json', read: true, write: true, role: 'json'},
};
const cachedValuesMap = new Map();

/**
 * This function returns an ioBroker `state Id` for appropriate cached `value Id`.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @returns {string} The Id of ioBroker state.
 */
function cachedGetValueId(user, valueId) {
  if (typeof user === 'string' && user === cachedCommonId) user = {chatId: user};
  // logs(`user = ${JSON.stringify(user)}`);
  return user && user.chatId ? `${prefixCacheStates}.${user.chatId}.${valueId}` : '';
}

/**
 * This function checks if the appropriate cached value exists in the Map object or as an ioBroker state.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @returns {boolean} - True if the an appropriate cached value is exists.
 */
function cachedValueExists(user, valueId) {
  const id = cachedGetValueId(user, valueId);
  // logs(`statesCache.hasOwnProperty(${id}) = ${id && cachedStates.hasOwnProperty(id)}`);
  logs(`statesCache.has(${id}) = ${id && cachedValuesMap.has(id)}`);
  if (id) {
    if (valueId.indexOf(prefixExternalStates) === 0) valueId = prefixExternalStates;
    // return (cachedStates.hasOwnProperty(id) || (cachedStatesCommonAttr.hasOwnProperty(state) && existsState(id)));
    return cachedValuesMap.has(id) || (cachedValuesStatesCommonAttributes.hasOwnProperty(valueId) && existsState(id));
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
function cachedValueGet(user, valueId, getLastChange = false) {
  logs('user = ' + JSON.stringify(user));
  logs('state = ' + JSON.stringify(valueId));
  const id = cachedGetValueId(user, valueId);
  let result, stateLastChange;
  if (id) {
    logs(`statesCache.has(${id}) = ${cachedValuesMap.has(id)}`);
    if (valueId.indexOf(prefixExternalStates) === 0) valueId = prefixExternalStates;
    if ((!cachedValuesMap.has(id) || getLastChange) && cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
      if (existsState(id)) {
        const currentState = getState(id);
        if (currentState !== undefined) {
          let cachedVal = currentState.val;
          stateLastChange = currentState.lc;
          if (cachedValuesStatesCommonAttributes[valueId].type === 'json' && cachedVal.length > 0) {
            try {
              cachedVal = JSON.parse(cachedVal, JSONReviverWithMap);
            } catch (err) {
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
 * @param {object} cachedValueMaxAge - The object with attributed {hours, minutes, seconds}.
 * @returns {[any, boolean]} The array with cached value and boolean indicator of it's age and presence.
 */
function cachedGetValueAndCheckItIfOld(user, valueId, cachedValueMaxAge) {
  const checkDate = new Date(),
    [cachedValue, cachedValueLC] = cachedValueGet(user, valueId, true);
  if (cachedValueMaxAge.seconds) checkDate.setSeconds(checkDate.getSeconds() - Number(cachedValueMaxAge.seconds));
  if (cachedValueMaxAge.minutes) checkDate.setMinutes(checkDate.getMinutes() - Number(cachedValueMaxAge.minutes));
  if (cachedValueMaxAge.hours) checkDate.setHours(checkDate.getHours() - Number(cachedValueMaxAge.hours));
  const isStateOldOrNotExists =
    cachedValue === undefined || cachedValueLC === undefined || cachedValueLC <= checkDate.valueOf();
  return [cachedValue, isStateOldOrNotExists];
}

/**
 * This function sets a value for the appropriate cached value Id.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @param {any} value - The value to set.
 */
function cachedValueSet(user, valueId, value) {
  logs('user = ' + JSON.stringify(user));
  logs('state = ' + JSON.stringify(valueId));
  logs('value = ' + JSON.stringify(value));
  const id = cachedGetValueId(user, valueId);
  if (id) {
    const currentValue = cachedValuesMap.has(id) ? cachedValuesMap.get(id) : null;
    logs(`currentValue = ${currentValue}`);
    if (
      currentValue === null ||
      JSON.stringify(currentValue, JSONReplacerWithMap) !== JSON.stringify(value, JSONReplacerWithMap)
    ) {
      cachedValuesMap.set(id, value);
      logs(`statesCache.get(${id}) = ${JSON.stringify(cachedValuesMap.get(id))}`);
      const common = {};
      if (valueId.indexOf(prefixExternalStates) === 0) {
        common.name = `${cachedValuesStatesCommonAttributes[prefixExternalStates].name} ${valueId}`;
        valueId = prefixExternalStates;
      }
      if (cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
        if (!typeOf(value, 'string')) {
          if (cachedValuesStatesCommonAttributes[valueId].type === 'string') {
            value = `${value}`;
          } else if (cachedValuesStatesCommonAttributes[valueId].type === 'json') {
            value = JSON.stringify(value, JSONReplacerWithMap);
          }
        }
        if (existsState(id)) {
          setState(id, value, true);
        } else {
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
function cachedValueDelete(user, valueId) {
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
function cachedActionOnGetCachedState(data, callback) {
  const {user, valueId} = data;
  logs(`user= ${user}`);
  logs(`valueId= ${JSON.stringify(valueId)}`);
  const value = cachedValueGet(user, `${prefixExternalStates}${valueId}`);
  logs(`value= ${JSON.stringify(value)}`);
  if (value === undefined) {
    callback(null);
  } else {
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
function cachedActionOnSetCachedState(data, callback) {
  const {user, valueId, value} = data;
  logs(`user= ${user}`);
  logs(`valueId= ${JSON.stringify(valueId)}`);
  logs(`value= ${JSON.stringify(value)}`);
  cachedValueSet(user, `${prefixExternalStates}${valueId}`, value);
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
  let cachedToDelete = cachedValueExists(user, cachedDelCachedOnBack)
    ? cachedValueGet(user, cachedDelCachedOnBack)
    : {};
  if (!cachedToDelete.hasOwnProperty(menuItemIndex)) {
    cachedToDelete[menuItemIndex] = [];
  }
  if (!cachedToDelete[menuItemIndex].includes(valueId)) {
    cachedToDelete[menuItemIndex].push(valueId);
    cachedValueSet(user, cachedDelCachedOnBack, cachedToDelete);
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
  const sentImages = cachedValueExists(user, cachedSentImages) ? cachedValueGet(user, cachedSentImages) : new Map();
  sentImages.set(messageId, new Date());
  cachedValueSet(user, cachedSentImages, sentImages);
}

/**
 * This function returns an array of Id's of  message with images sent to telegram.
 * @param {object} user - The user object.
 * @returns {number[]} - Array of messages Id's sent to telegram.
 */
function sentImagesGet(user) {
  const lastEditableTime = new Date(Date.now() - (48 * 3600 - 60) * 100);
  const sentImages = cachedValueExists(user, cachedSentImages) ? cachedValueGet(user, cachedSentImages) : new Map();
  let imagesIds = new Array();
  sentImages.forEach((imageDate, imageId) => {
    if (imageDate < lastEditableTime) {
      sentImages.delete(imageId);
    } else {
      imagesIds.push(imageId);
    }
  });
  if (sentImages.size) {
    cachedValueSet(user, cachedSentImages, sentImages);
  } else {
    cachedValueDelete(user, cachedSentImages);
  }
  return imagesIds;
}

/**
 * This function make check of existing of any stored message with image, early sent to telegram.
 * @param {object} user - The user object.
 * @returns {boolean} True, if any message Id is stored. False - if otherwise.
 */
function sentImagesExists(user) {
  const lastEditableTime = new Date(Date.now() - (48 * 3600 - 60) * 100);
  const sentImages = cachedValueExists(user, cachedSentImages) ? cachedValueGet(user, cachedSentImages) : new Map();
  sentImages.forEach((imageDate, imageId) => {
    if (imageDate < lastEditableTime) {
      sentImages.delete(imageId);
    }
  });
  if (sentImages.size) {
    cachedValueSet(user, cachedSentImages, sentImages);
    return true;
  } else {
    cachedValueDelete(user, cachedSentImages);
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
    if (!result) {
      console.warn(
        `Can't send message (${JSON.stringify(telegramObject)}) to (${JSON.stringify(
          user,
        )})!\nResult = ${JSON.stringify(result)}.`,
      );
    }
    // logs(`sentImages = ${sentImages}`);
    if (sentImages.length) {
      telegramObject = telegramMessageClearCurrent(user, false, true, sentImages.shift());
      // logs(`telegramObject = ${JSON.stringify(telegramObject)}`);
      if (telegramObject)
        sendTo(telegramAdapter, telegramObject, (result) => {
          sentImagesDeleteCallBack(result, user, telegramObject, sentImages);
        });
    }
  }

  let sentImages = sentImagesGet(user);
  if (sentImages.length) {
    // logs(`sentImages = ${sentImages}`);
    const telegramObject = telegramMessageClearCurrent(user, false, true, sentImages.shift());
    // logs(`telegramObject = ${JSON.stringify(telegramObject)}`);
    if (telegramObject) {
      sendTo(telegramAdapter, telegramObject, (result) => {
        sentImagesDeleteCallBack(result, user, telegramObject, sentImages);
      });
      cachedValueDelete(user, cachedSentImages);
    }
  }
}

//*** sentImages - end ***//

//*** Enumerations - begin ***//

const enumerationsNamesMain = 'Main',
  enumerationsNamesBasic = 'Basic',
  enumerationsNamesMany = 'Many',
  enumerationsNamesInside = 'Inside',
  enumerationsNamesEnterTo = 'EnterTo',
  enumerationsNamesExitFrom = 'ExitFrom',
  enumerationsNamesTranslationIdPrefix = 'names',
  enumerationDeviceStateAttributes = ['ts', 'lc', 'ack', 'q', 'from', 'user'],
  enumerationsDeviceStatesTypes = [dataTypeDeviceAttributes, dataTypeDeviceButtons],
  enumerationDeviceSubTypes = [...enumerationsDeviceStatesTypes, dataTypeDeviceStatesAttributes],
  enumerationsAccessLevelToShow = 'showAccessLevel',
  enumerationsAccessLevelToPress = 'pressAccessLevel',
  enumerationsDeviceButtonsAccessLevelAttrs = [enumerationsAccessLevelToShow, enumerationsAccessLevelToPress],
  enumerationsFunctionNotFound = 'noFunction',
  enumerationsConvertButtonToAttribute = 'useButtonAsAttribute',
  enumerationsEditEnums = 'editEnums',
  enumerationsDefaultObjects = {
    [dataTypeFunction]: {
      isAvailable: true,
      isEnabled: false,
      isExternal: false,
      order: 0,
      holder: '',
      state: 'state',
      availableState: '',
      icon: '🔆',
      enum: idFunctions,
      name: enumerationsNamesMain,
      names: [enumerationsNamesBasic, enumerationsNamesMany],
      group: '',
      deviceAttributes: {},
      deviceButtons: {},
      simplifyMenuWithOneDevice: false,
      showDestNameOnSimplify: true,
      statesSectionsCount: 1,
      iconOn: configOptions.getOption(cfgDefaultIconOn),
      iconOff: configOptions.getOption(cfgDefaultIconOff),
    },
    [dataTypeExtension]: {
      isAvailable: true,
      isEnabled: false,
      isExternal: false,
      order: 0,
      holder: '',
      state: 'state',
      icon: '👾',
      enum: idExternal,
      translationsKeys: [],
      nameTranslationId: '',
      group: '',
    },
    [dataTypeDestination]: {
      isAvailable: true,
      isEnabled: false,
      enum: '',
      icon: '',
      name: enumerationsNamesMain,
      names: [enumerationsNamesBasic, enumerationsNamesInside, enumerationsNamesEnterTo, enumerationsNamesExitFrom],
      group: '',
      order: 0,
    },
    [dataTypeReport]: {
      isAvailable: true,
      isEnabled: false,
      enum: idSimpleReports,
      name: enumerationsNamesMain,
      group: '',
      alwaysExpanded: false,
      graphsEnabled: false,
      order: 0,
      icon: 'ℹ️',
    },
  },
  enumerationsList = {
    [dataTypeFunction]: {
      list: {},
      id: idFunctions,
      enums: {
        functions: {
          isEnabled: true,
          order: 0,
          icon: '🔆',
        },
      },
      state: `${prefixPrimary}.${idFunctions}`,
      icon: '⚛️',
    },
    [dataTypeDestination]: {
      list: {},
      id: idDestinations,
      enums: {
        rooms: {
          isEnabled: true,
          order: 0,
          icon: '🏠',
        },
        people: {
          isEnabled: true,
          order: 1,
          icon: '🧍',
        },
      },
      state: `${prefixPrimary}.${idDestinations}`,
      icon: '🏢',
    },
    [dataTypeReport]: {
      list: {},
      id: idSimpleReports,
      enums: {
        simpleReports: {
          isEnabled: true,
          order: 0,
          icon: 'ℹ️',
        },
      },
      state: `${prefixPrimary}.${idSimpleReports}`,
      icon: 'ℹ️',
    },
  },
  enumerationItemDefaultDetails = ['itemId', 'isAvailable', 'state', 'order'],
  enumerationItemAttributesWithReset = ['convertValueCode'];

/**
 * This function make compare of the enumerationItems of identical type for sorting
 * it by the `order` property.
 * @param {object} a - The enumerationItem object.
 * @param {object} b - The enumerationItem object.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 * @param {object=} enumerationList - The list of the enumerationItems.
 * @returns {number} The result of compare [-1, 0, 1] used for the `Array.sort()`.
 */
function enumerationsCompareOrderOfItems(a, b, enumerationType, enumerationList) {
  if (enumerationList || enumerationsList.hasOwnProperty(enumerationType)) {
    const itemsList = enumerationList ? enumerationList : enumerationsList[enumerationType].list;
    if (itemsList.hasOwnProperty(a) && itemsList.hasOwnProperty(b)) {
      return itemsList[a].order - itemsList[b].order;
    } else if (itemsList.hasOwnProperty(a)) {
      return 1;
    } else if (itemsList.hasOwnProperty(b)) {
      return -1;
    }
  }
  return a < b ? -1 : a > b ? 1 : 0;
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
    if (parsedObject.hasOwnProperty('list') && typeOf(parsedObject.list, 'object') && parsedObject.list) {
      enumerationsList[enumerationType].list = parsedObject.list;
    }
    if (parsedObject.hasOwnProperty('enums') && typeOf(parsedObject.enums, 'object') && parsedObject.enums) {
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
  // logs(`  enumerationItems[${enumerationType}] = ${JSON.stringify(enumerationsList[enumerationType])}`, _l);
  const listToSave = JSON.stringify({
    enums: enumerationsList[enumerationType].enums,
    list: enumerationsList[enumerationType].list,
  });
  if (existsState(enumerationsList[enumerationType].state)) {
    logs(`  save ${enumerationsList[enumerationType].state}`);
    setState(enumerationsList[enumerationType].state, listToSave, true);
  } else {
    logs(`  create ${enumerationsList[enumerationType].state}`);
    // @ts-ignore
    createState(
      enumerationsList[enumerationType].state,
      // @ts-ignore
      listToSave,
      cachedValuesStatesCommonAttributes.enumerationItems,
    );
  }
}

/**
 * This function change an `order` property of `enumerationItems` in current
 * list(`Object`), to eliminate a gap in sequence (for example - after deleting
 * or adding items).
 * @param {object} currentEnumerations - The `list` of `enumerationItems` to be processed.
 * @returns {number} - The number of items in the current `list`.
 */
function enumerationsReorderItems(currentEnumerations) {
  logs(`  enumerationItems= ${JSON.stringify(currentEnumerations)}`);
  let countItems = 0;
  Object.keys(currentEnumerations)
    .sort((a, b) => currentEnumerations[a].order - currentEnumerations[b].order)
    .forEach((currentItem) => {
      currentEnumerations[currentItem].order = countItems;
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
function enumerationsInit(enumerationType, withExtensions = false) {
  logs(`  enumerationItems= ${JSON.stringify(enumerationsList[enumerationType])}`);
  let currentEnumerationList = enumerationsList[enumerationType].list;
  let countItems = enumerationsReorderItems(currentEnumerationList);
  Object.keys(currentEnumerationList).forEach((currentItem) => {
    // logs(`currentItem = ${currentItem}, currentEnumerationList[currentItem].isExternal ? dataTypeExtension : enumerationType ${currentEnumerationList[currentItem].isExternal ? dataTypeExtension : enumerationType}`, _l)
    currentEnumerationList[currentItem] = objectAssignToTemplateLevelOne(
      enumerationsDefaultObjects[currentEnumerationList[currentItem].isExternal ? dataTypeExtension : enumerationType],
      currentEnumerationList[currentItem],
    );
    if (!currentEnumerationList[currentItem].isExternal || withExtensions)
      currentEnumerationList[currentItem].isAvailable = false;
  });
  if (enumerationType === dataTypeFunction && withExtensions) extensionsInit();
  Object.keys(enumerationsList[enumerationType].enums).forEach((enumType) => {
    for (const currentEnum of getEnums(enumType)) {
      // logs(`enumerationType = ${enumerationType}, enumType = ${enumType},  currentEnum = ${JSON.stringify(currentEnum, null, 2)}}`, _l);
      const currentItem = currentEnum.id.replace(`${prefixEnums}.${enumType}.`, '');
      const currentItemSections = currentItem.split('.'),
        currentItemSectionsCount = currentItemSections.length,
        holderItemId = currentItemSectionsCount === 2 ? currentItemSections.shift() : '',
        compositeHolderEnum = currentItemSectionsCount === 2 ? `${enumType}.${holderItemId}` : '',
        isCurrentItemAcceptable =
          currentItemSectionsCount === 1 ||
          (currentItemSectionsCount === 2 && getEnums(compositeHolderEnum).length > 0);
      if (isCurrentItemAcceptable) {
        // logs(`currentItem = ${currentItem}, \n has = ${currentEnumerationList.hasOwnProperty(currentItem)}, currentEnumeration[${currentItem}] = ${JSON.stringify(currentEnumerationList[currentItem])}`, _l);
        if (currentEnumerationList.hasOwnProperty(currentItem) && currentEnumerationList[currentItem] !== undefined) {
          currentEnumerationList[currentItem].isAvailable = true;
          if (holderItemId) currentEnumerationList[currentItem].holder = holderItemId;
        } else {
          let currentItemPosition = countItems;
          if (currentItemSectionsCount === 2) {
            const currentEnumerationIds = Object.keys(currentEnumerationList).sort(
              (a, b) => currentEnumerationList[a].order - currentEnumerationList[b].order,
            );
            currentItemPosition = currentEnumerationIds.indexOf(holderItemId);
            do {
              currentItemPosition++;
            } while (
              currentItemPosition < countItems &&
              currentEnumerationIds[currentItemPosition].indexOf(holderItemId) === 0
            );
            if (currentItemPosition < countItems) {
              for (let itemIndex = currentItemPosition; itemIndex < countItems; itemIndex++) {
                currentEnumerationList[currentEnumerationIds[itemIndex]].order++;
              }
            }
          }
          currentEnumerationList[currentItem] = {
            ...enumerationsDefaultObjects[
              currentEnumerationList[currentItem].isExternal ? dataTypeExtension : enumerationType
            ],
            order: currentItemPosition,
            holder: holderItemId,
            enum: enumType,
            icon: enumerationsList[enumerationType].enums[enumType].icon,
          };
          // logs(`\ncurrentEnumeration[${currentItem}] = ${JSON.stringify(currentEnumerationList[currentItem])}`);
          countItems++;
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
function enumerationsUpdateItemName(
  user,
  enumerationType,
  enumerationItemId,
  enumerationItem,
  newName,
  nameDeclinationKey,
) {
  if (newName && typeof newName === 'string') {
    const translationIdPrefix = translationsGetEnumId(user, enumerationType, enumerationItemId, '');
    if (enumerationItem.hasOwnProperty('names') && typeOf(enumerationItem.names) === 'array') {
      newName = newName.trim();
      let tmpKeys = [...enumerationItem.names];
      tmpKeys.unshift(enumerationsNamesMain);
      if (nameDeclinationKey) {
        if (tmpKeys.includes(nameDeclinationKey))
          translationsItemStore(user, `${translationIdPrefix}${nameDeclinationKey}`, newName);
      } else {
        if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName) {
          tmpKeys.forEach((nameKey) =>
            translationsItemStore(
              user,
              `${translationIdPrefix}${nameKey}`,
              nameKey === enumerationsNamesMain ? newName : newName.toLowerCase(),
            ),
          );
        }
      }
    } else {
      if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName)
        translationsItemStore(user, `${translationIdPrefix}${enumerationsNamesMain}`, newName);
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
  const currentEnumeration = enumerationsList[enumerationType].list,
    fullItemId = `${prefixEnums}.${currentEnumeration[enumerationItemId].enum}.${enumerationItemId}`,
    currentEnum = getEnums(currentEnumeration[enumerationItemId].enum).find((current) => current.id === fullItemId);
  if (currentEnum !== undefined && currentEnum.hasOwnProperty('name') && currentEnum.name !== undefined) {
    enumerationsUpdateItemName(
      user,
      enumerationType,
      enumerationItemId,
      currentEnumeration[enumerationItemId],
      currentEnum.name[configOptions.getOption(cfgMenuLanguage)]
        ? currentEnum.name[configOptions.getOption(cfgMenuLanguage)]
        : currentEnum.name['en']
        ? currentEnum.name['en']
        : typeof currentEnum.name === 'string'
        ? currentEnum.name
        : enumerationItemId,
    );
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
function enumerationMenuGenerateItemGroups(user, menuItemToProcess) {
  logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
  let subMenuIndex = 0,
    subMenu = [];
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    {dataType: dataTypeItem, item: currentItem, dataTypeExtraId} = menuItemToProcess.options,
    currentEnumerationsList = enumerationsGetList(dataTypeItem, dataTypeExtraId),
    currentMenuItem = currentEnumerationsList[currentItem],
    currentMenuItemGroup = currentMenuItem ? currentMenuItem.group : '',
    existingGroups = new Array();
  Object.keys(currentEnumerationsList)
    .sort((a, b) => currentEnumerationsList[a].order - currentEnumerationsList[b].order)
    .forEach((item) => {
      if (currentEnumerationsList[item].hasOwnProperty('group') && currentEnumerationsList[item].group) {
        const currentGroup = currentEnumerationsList[item].group;
        if (!existingGroups.includes(currentGroup)) {
          existingGroups.push(currentGroup);
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `[${currentGroup}]`,
            icon: currentGroup === currentMenuItemGroup ? iconItemCheckMark : '',
            command: cmdItemPress,
            options: {
              dataType: dataTypeGroups,
              item: currentItem,
              groupDataType: dataTypeItem,
              group: currentGroup,
              groupDataTypeExtraId: dataTypeExtraId,
            },
            submenu: [],
          });
        }
      }
    });
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateAddItem(user, currentIndex, subMenuIndex, {
      dataType: dataTypeGroups,
      item: currentItem,
      groupDataType: dataTypeItem,
      groupDataTypeExtraId: dataTypeExtraId,
    }),
  );

  return subMenu;
}

/**
 * This function generates a submenu to manage appropriate enumerationItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function enumerationsMenuGenerateEnumerationItem(user, menuItemToProcess) {
  logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
  let subMenuIndex = 0,
    subMenu = [];
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {
      dataType: enumerationType,
      item: currentItem,
      dataTypeExtraId: enumerationTypeExtraId,
      list: currentEnumerationsList,
    } = menuItemToProcess.options;
  const currentEnumerationItem = currentEnumerationsList[currentItem],
    currentEnumerationItemEnum = currentEnumerationItem.enum,
    currentIcon = currentEnumerationItem.isEnabled
      ? currentEnumerationItem.hasOwnProperty('icon')
        ? currentEnumerationItem.icon
        : ''
      : iconItemDisabled,
    lastItemIndex = Object.keys(currentEnumerationsList).length - 1;
  if (isCurrentAccessLevelAllowModify) {
    if (enumerationType !== dataTypePrimaryEnums) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemTextGet(user, currentEnumerationItem.isEnabled ? 'SwitchOff' : 'SwitchOn')}`,
        icon: currentIcon,
        command: cmdItemPress,
        options: {
          dataType: enumerationType,
          item: currentItem,
          attribute: 'isEnabled',
          dataTypeExtraId: enumerationTypeExtraId,
        },
        group: 'topRows',
        submenu: [],
      });
    }
    if (
      !(enumerationType === dataTypeDeviceStatesAttributes && !currentEnumerationItem.isEnabled) &&
      enumerationType !== dataTypePrimaryEnums
    ) {
      [subMenu, subMenuIndex] = menuMenuPartGenerateMoveItemUpAndDown(
        user,
        subMenu,
        currentIndex,
        subMenuIndex,
        currentEnumerationItem.order,
        lastItemIndex,
        {dataType: enumerationType, item: currentItem, dataTypeExtraId: enumerationTypeExtraId},
        'topRows',
      );
    }
  }
  // logs(` = ${JSON.stringify(currentEnumerationItem)}`, _l);
  let enumerationItemAttrs = Object.keys(currentEnumerationItem);
  switch (enumerationType) {
    case dataTypeFunction:
      if (!currentEnumerationItem.isExternal) {
        enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('deviceAttributes'), 0, 'devicesTranslation');
        enumerationItemAttrs.splice(
          enumerationItemAttrs.indexOf('deviceAttributes') + 1,
          0,
          'deviceAttributesValuesTranslation',
        );
        enumerationItemAttrs.splice(
          enumerationItemAttrs.indexOf('deviceButtons') + 1,
          0,
          'deviceButtonsValuesTranslation',
        );
      }
      break;

    case dataTypeDeviceButtons: {
      if (!enumerationItemAttrs.includes('group'))
        enumerationItemAttrs.splice(enumerationItemAttrs.indexOf('order'), 0, 'group');
    }
    // eslint-disable-next-line no-fallthrough
    case dataTypeDeviceAttributes: {
      if (!currentEnumerationItem.hasOwnProperty('stateAttributes') || !currentEnumerationItem.stateAttributes) {
        currentEnumerationItem.stateAttributes = [];
        enumerationItemAttrs.push('stateAttributes');
      }
      break;
    }

    default:
      break;
  }
  // logs(` = ${JSON.stringify(enumerationItemAttrs)}`, _l);
  let devicesMenuItem, devicesMenuIndex;
  for (let enumerationItemAttr of enumerationItemAttrs) {
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
        if (!devicesMenuItem) {
          devicesMenuIndex = subMenuIndex;
          devicesMenuItem = {
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'Devices')}`,
            accessLevel: currentAccessLevel,
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
              accessLevel: currentAccessLevel,
              options: {dataType: enumerationItemAttr, dataTypeExtraId: currentItem},
              icon: enumerationItemAttr === 'deviceAttributes' ? iconItemAttribute : iconItemSquareButtonBlack,
              submenu: enumerationsMenuGenerateListOfEnumerationItems,
            });
            break;

          case 'deviceAttributesValuesTranslation':
          case 'deviceButtonsValuesTranslation':
          case 'devicesTranslation':
            devicesMenuItem.submenu.push({
              index: `${currentIndex}.${devicesMenuIndex}.${devicesMenuItem.submenu.length}`,
              name: `${translationsItemMenuGet(user, enumerationItemAttr)}`,
              accessLevel: currentAccessLevel,
              options: {
                function: currentItem,
                functionEnum: currentEnumerationItemEnum,
                dataType: enumerationItemAttr.replace('ValuesTranslation', ''),
              },
              icon: iconItemTranslation,
              submenu: ['deviceAttributesValuesTranslation', 'deviceButtonsValuesTranslation'].includes(
                enumerationItemAttr,
              )
                ? translationsMenuGenerateFunctionStatesItems
                : translationsMenuGenerateFunctionDeviceItems,
            });
            break;
        }
        break;
      }

      case 'stateAttributes': {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${devicesMenuIndex}`,
          name: `${translationsItemMenuGet(user, enumerationItemAttr)}`,
          accessLevel: currentAccessLevel,
          options: {
            dataType: dataTypeDeviceStatesAttributes,
            dataTypeExtraId: {dataType: enumerationType, function: enumerationTypeExtraId, item: currentItem},
          },
          icon: '',
          submenu: enumerationsMenuGenerateListOfEnumerationItems,
        });
        break;
      }

      case 'name': {
        if (isCurrentAccessLevelAllowModify) {
          if (enumerationItemAttrs.includes('nameTranslationId') && currentEnumerationItem['nameTranslationId']) {
            subMenuIndex = subMenu.push(
              menuMenuItemGenerateRenameItem(user, `${currentIndex}`, subMenuIndex, {
                dataType: dataTypeTranslation,
                translationId: translationsGetEnumId(user, enumerationType, currentItem, enumerationsNamesMain),
              }),
            );
          } else {
            subMenuIndex = subMenu.push(
              menuMenuItemGenerateRenameItem(user, `${currentIndex}`, subMenuIndex, {
                dataType: enumerationType,
                item: currentItem,
                attribute: 'names',
                index: enumerationsNamesMain,
              }),
            );
            subMenuIndex = subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemCoreGet(user, cmdItemNameGet)}`,
              command: cmdItemNameGet,
              options: {dataType: enumerationType, item: currentItem},
              submenu: [],
            });
          }
        }
        break;
      }

      case 'names': {
        if (
          typeOf(currentEnumerationItem.names, 'array') &&
          !(enumerationItemAttrs.includes('nameTranslationId') && currentEnumerationItem['nameTranslationId'])
        ) {
          let namesItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemTextGet(user, 'Names')}`,
              submenu: new Array(),
            },
            namesSub = 0;
          let tmpKeys = [...currentEnumerationItem.names];
          tmpKeys.shift();
          if (tmpKeys.length) {
            tmpKeys.forEach((namesKey) => {
              namesSub = namesItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${namesSub}`,
                name: `${translationsItemCoreGet(user, 'cmdItemRename')} "${translationsItemTextGet(
                  user,
                  namesKey,
                )}" (${translationsGetEnumName(user, enumerationType, currentItem, namesKey)})`,
                icon: isCurrentAccessLevelAllowModify ? iconItemEdit : '',
                command: isCurrentAccessLevelAllowModify ? cmdGetInput : cmdNoOperation,
                options: {dataType: enumerationType, item: currentItem, attribute: 'names', declinationKey: namesKey},
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
          name: `${translationsItemMenuGet(user, 'group')}: [${
            currentEnumerationItem[enumerationItemAttr] == undefined ? '' : currentEnumerationItem[enumerationItemAttr]
          }]`,
          icon: iconItemEdit,
        };
        if (isCurrentAccessLevelAllowModify) {
          groupItem.options = {dataType: enumerationType, item: currentItem, dataTypeExtraId: enumerationTypeExtraId};
          groupItem.submenu = enumerationMenuGenerateItemGroups;
        } else {
          groupItem.command = cmdNoOperation;
          groupItem.submenu = [];
        }
        subMenuIndex = subMenu.push(groupItem);
        break;
      }

      case 'translationsKeys': {
        // logs(`currentItem = ${currentItem}, isCurrentAccessLevelAllowModify = ${isCurrentAccessLevelAllowModify} `, _l);
        if (isCurrentAccessLevelAllowModify) {
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'extensionTranslations')}`,
            id: currentItem,
            submenu: menuMenuReIndex(
              [
                {
                  name: `${translationsItemMenuGet(user, 'extensionTranslations')}`,
                  id: currentItem,
                  submenu: translationsMenuGenerateExtensionsTranslationsItems,
                },
                ...translationsDownloadUploadMenuPartGenerate(user, currentItem),
              ],
              `${currentIndex}.${subMenuIndex}`,
            ),
          });
        }
        break;
      }

      case 'holder': {
        if (isCurrentAccessLevelAllowModify && currentEnumerationItem.isExternal) {
          const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemMenuGet(user, enumerationItemAttr)}`,
              icon: iconItemEdit,
              group: enumerationItemAttr.indexOf('icon') === 0 ? 'icon' : menuButtonsDefaultGroup,
              submenu: new Array(),
            },
            currentHolder = currentEnumerationItem[enumerationItemAttr];
          let subSubMenuIndex = 0;
          Object.keys(currentEnumerationsList)
            .filter(
              (itemId) => !itemId.includes('.') && itemId !== currentItem && currentEnumerationsList[itemId].isEnabled,
            )
            .forEach((itemId) => {
              const isCurrentHolder = itemId === currentHolder,
                currentItemName = enumerationsItemName(user, enumerationType, itemId, currentEnumerationsList[itemId]);
              subSubMenuIndex = subMenuItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                name: currentItemName,
                icon: isCurrentHolder ? iconItemCheckMark : '',
                command: cmdItemPress,
                options: {dataType: enumerationType, item: currentItem, attribute: enumerationItemAttr, value: itemId},
                submenu: [],
              });
              if (isCurrentHolder) subMenuItem.name += ` "${currentItemName}"`;
            });
          subMenuIndex = subMenu.push(subMenuItem);
        }
        break;
      }

      case 'statesSectionsCount': {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'statesInFolders')} (${
            currentEnumerationItem[enumerationItemAttr] === 2
              ? configOptions.getOption(cfgDefaultIconOn, user)
              : configOptions.getOption(cfgDefaultIconOff, user)
          })`,
          command: isCurrentAccessLevelAllowModify ? cmdItemPress : cmdNoOperation,
          options: {
            dataType: enumerationType,
            item: currentItem,
            attribute: enumerationItemAttr,
            dataTypeExtraId: enumerationTypeExtraId,
            value: currentEnumerationItem[enumerationItemAttr] === 2 ? 1 : 2,
          },
          submenu: [],
        });
        break;
      }

      default: {
        switch (typeof currentEnumerationItem[enumerationItemAttr]) {
          case 'boolean': {
            subMenuIndex = subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemMenuGet(user, enumerationItemAttr)} (${
                currentEnumerationItem[enumerationItemAttr]
                  ? configOptions.getOption(cfgDefaultIconOn, user)
                  : configOptions.getOption(cfgDefaultIconOff, user)
              })`,
              command: isCurrentAccessLevelAllowModify ? cmdItemPress : cmdNoOperation,
              options: {
                dataType: enumerationType,
                item: currentItem,
                attribute: enumerationItemAttr,
                dataTypeExtraId: enumerationTypeExtraId,
              },
              submenu: [],
            });
            break;
          }

          default: {
            const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemMenuGet(user, enumerationItemAttr)} "${
                currentEnumerationItem[enumerationItemAttr]
              }"`,
              icon: isCurrentAccessLevelAllowModify ? iconItemEdit : '',
              command: isCurrentAccessLevelAllowModify
                ? enumerationItemAttributesWithReset.includes(enumerationItemAttr)
                  ? cmdEmptyCommand
                  : cmdGetInput
                : cmdNoOperation,
              options: {
                dataType: enumerationType,
                item: currentItem,
                attribute: enumerationItemAttr,
                dataTypeExtraId: enumerationTypeExtraId,
              },
              group: enumerationItemAttr.indexOf('icon') === 0 ? 'icon' : menuButtonsDefaultGroup,
              submenu: new Array(),
            };
            if (isCurrentAccessLevelAllowModify && enumerationItemAttributesWithReset.includes(enumerationItemAttr)) {
              let subSubMenuIndex = 0;
              const currentSubMenuIndex = `${currentIndex}.${subMenuIndex}`,
                currentCommandOptions = {
                  dataType: enumerationType,
                  item: currentItem,
                  attribute: enumerationItemAttr,
                  dataTypeExtraId: enumerationTypeExtraId,
                };
              subSubMenuIndex = subMenuItem.submenu.push(
                menuMenuItemGenerateEditItem(
                  user,
                  currentSubMenuIndex,
                  subSubMenuIndex,
                  `${translationsItemMenuGet(user, enumerationItemAttr)} "${
                    currentEnumerationItem[enumerationItemAttr]
                  }"`,
                  '',
                  currentCommandOptions,
                ),
              );
              subMenuItem.submenu.push(
                menuMenuItemGenerateResetItem(user, currentSubMenuIndex, subSubMenuIndex, currentCommandOptions),
              );
            }
            subMenuIndex = subMenu.push(subMenuItem);
            break;
          }
        }
        break;
      }
    }
  }
  if (isCurrentAccessLevelAllowModify) {
    switch (enumerationType) {
      case dataTypeDeviceAttributes:
      case dataTypeDeviceButtons: {
        const currentFunction = enumerationsList[dataTypeFunction].list[enumerationTypeExtraId],
          translationType = `${enumerationsList[dataTypeFunction].id}.${
            currentFunction.enum
          }.${enumerationTypeExtraId.replace('.', '_')}`,
          currentTranslation = translationsPointOnItemOwner(user, translationType, true),
          currentIds =
            currentItem === currentFunction.state
              ? enumerationType === dataTypeDeviceButtons
                ? [currentItem, translationsPrimaryStateId]
                : [currentItem]
              : [currentItem];
        if (enumerationType === dataTypeDeviceButtons) {
          enumerationsDeviceButtonsAccessLevelAttrs.forEach((accessLevelsAttr) => {
            const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemTextGet(user, 'set', accessLevelsAttr)}`,
              icon:
                MenuRoles.accessLevels.indexOf(currentEnumerationItem[accessLevelsAttr]) >= 0
                  ? MenuRoles.accessLevelsIcons[
                      MenuRoles.accessLevels.indexOf(currentEnumerationItem[accessLevelsAttr])
                    ]
                  : iconItemAttribute,
              submenu: new Array(),
            };
            let subSubMenuIndex = 0;
            if (accessLevelsAttr === enumerationsAccessLevelToPress) {
              subSubMenuIndex = subMenuItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                name: `[${translationsItemTextGet(user, enumerationsConvertButtonToAttribute)}]`,
                icon:
                  currentEnumerationItem[accessLevelsAttr] === enumerationsConvertButtonToAttribute
                    ? iconItemAttribute
                    : iconItemButton,
                command: cmdItemPress,
                options: {
                  dataType: enumerationType,
                  item: currentItem,
                  attribute: accessLevelsAttr,
                  dataTypeExtraId: enumerationTypeExtraId,
                  value: enumerationsConvertButtonToAttribute,
                },
                submenu: [],
              });
            }
            MenuRoles.accessLevels
              .filter((accessLevel) => !MenuRoles.accessLevelsHidden.includes(accessLevel))
              .forEach((accessLevel, levelIndex) => {
                if (accessLevel !== rolesAccessLevelForbidden) {
                  subSubMenuIndex = subMenuItem.submenu.push({
                    index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                    name: `[${translationsItemTextGet(user, 'AccessLevel', accessLevel)}]`,
                    icon:
                      accessLevel === currentEnumerationItem[accessLevelsAttr]
                        ? MenuRoles.accessLevelsIcons[levelIndex]
                        : iconItemButton,
                    command: cmdItemPress,
                    options: {
                      dataType: enumerationType,
                      item: currentItem,
                      attribute: accessLevelsAttr,
                      dataTypeExtraId: enumerationTypeExtraId,
                      value: accessLevel,
                    },
                    submenu: [],
                  });
                }
              });
            subSubMenuIndex = subMenuItem.submenu.push({
              index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
              name: `${translationsItemMenuGet(user, 'ItemsProcess')}`,
              icon: iconItemApply,
              group: cmdItemsProcess,
              command: cmdItemJumpTo,
              options: {jumpToArray: [jumpToUp]},
              submenu: [],
            });
            subMenuIndex = subMenu.push(subMenuItem);
          });
        }
        currentIds.forEach((currentId) => {
          const currentTranslationShortId = currentId.split('.').join('_'),
            currentTranslationId = `${translationType}.${currentTranslationShortId}`;
          let currentValue = currentTranslation[currentTranslationShortId];
          // logs(`translationType = ${translationType}, currentTranslationId = ${currentTranslationId}, currentTranslationShortId = ${currentTranslationShortId}, currentValue = ${currentValue}`);
          if (currentValue === null || currentValue === undefined || currentId === currentTranslationId) {
            currentValue = `${currentTranslationId} ${iconItemNotFound}`;
          } else if (currentValue.indexOf(translationsCommonFunctionsAttributesPrefix) === 0) {
            currentValue = `${translationsItemGet(
              user,
              `${translationsCommonFunctionsAttributesPrefix}.${currentId}`,
            )} ${iconItemCommon}`;
          } else {
            currentValue = `${translationsItemCoreGet(user, 'cmdItemRename')}: "${currentValue}"`;
          }
          if (currentId === translationsPrimaryStateId) currentValue += ` (${translationsItemMenuGet(user, 'state')})`;
          let subSubMenuIndex = 0,
            subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${currentValue}`,
              text: ` [${currentTranslationId}]`,
              group: 'cmdItemRename',
              icon: iconItemEdit,
              submenu: new Array(),
            };
          const currentCommandOptions = {dataType: dataTypeTranslation, translationId: currentTranslationId};
          subSubMenuIndex = subMenuItem.submenu.push(
            menuMenuItemGenerateRenameItem(
              user,
              `${currentIndex}.${subMenuIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
          subSubMenuIndex = subMenuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            name: `${translationsItemCoreGet(user, cmdUseCommonTranslation)}`,
            icon: iconItemCommon,
            command: cmdUseCommonTranslation,
            options: {dataType: dataTypeTranslation, translationId: currentTranslationId},
            submenu: [],
          });
          subMenuItem.submenu.push(
            menuMenuItemGenerateDeleteItem(
              user,
              `${currentIndex}.${subMenuIndex}`,
              subSubMenuIndex,
              currentCommandOptions,
            ),
          );
          subMenuIndex = subMenu.push(subMenuItem);
        });
        break;
      }

      case dataTypeReport: {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'ReportEdit')}`,
          options: {item: currentItem},
          submenu: simpleReportMenuGenerateReportEdit,
        });
        break;
      }
    }
    if (
      (enumerationType === dataTypePrimaryEnums &&
        enumerationsGetActiveSubItemsCount(enumerationTypeExtraId, currentItem) === 0) ||
      (enumerationType !== dataTypePrimaryEnums &&
        enumerationType !== dataTypeDeviceStatesAttributes &&
        ((configOptions.getOption(cfgAllowToDeleteEmptyEnums) &&
          enumerationsIsItemCanBeDeleted(enumerationType, currentItem, true)) ||
          enumerationsIsItemCanBeDeleted(enumerationType, currentItem, false)))
    )
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateDeleteItem(user, `${currentIndex}`, subMenuIndex, {
          dataType: enumerationType,
          item: currentItem,
          dataTypeExtraId: enumerationTypeExtraId,
        }),
      );
  }
  // logs(`subMenu = ${JSON.stringify(subMenu)}`, _l);
  return subMenu;
}

/**
 * This function return a count of  enabled enumerations items for appropriate
 * primary enum(like `functions', `rooms`, etc)
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string=} primaryEnumId - The appropriate primary enum Id.
 * @returns {number} The count of items.
 */
function enumerationsGetActiveSubItemsCount(enumerationType, primaryEnumId) {
  const extraMenuList = enumerationsList[enumerationType].list;
  return Object.keys(extraMenuList).filter(
    (itemId) =>
      extraMenuList[itemId].isEnabled && (primaryEnumId === undefined || extraMenuList[itemId].enum === primaryEnumId),
  ).length;
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
function enumerationsIsItemCanBeDeleted(enumerationType, enumerationItemId, withEnum = false) {
  const currentEnumeration = enumerationsList[enumerationType],
    currentEnumerationItemObject =
      currentEnumeration && currentEnumeration.list.hasOwnProperty(enumerationItemId)
        ? currentEnumeration.list[enumerationItemId]
        : {},
    enumObjectId =
      currentEnumeration &&
      currentEnumerationItemObject.isAvailable &&
      Object.keys(currentEnumeration.enums).includes(currentEnumerationItemObject.enum)
        ? `${prefixEnums}.${currentEnumerationItemObject.enum}.${enumerationItemId}`
        : '',
    enumObject = enumObjectId && !currentEnumerationItemObject.isExternal ? getObject(enumObjectId) : null,
    enumMembers = enumObject
      ? enumObject.hasOwnProperty('common') && enumObject.common.hasOwnProperty('members')
        ? enumObject.common.members
        : []
      : [];
  return withEnum && enumObjectId && enumMembers && enumMembers.length === 0
    ? enumObjectId
    : !withEnum && currentEnumerationItemObject && !enumObjectId
    ? 'can be deleted'
    : '';
}

/**
 * This function a string containing a formatted details/properties of current enumerations item.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
 */
function enumerationsMenuItemDetailsEnumerationItem(user, menuItemToProcess) {
  const {
      dataType: enumerationType,
      item: currentItem,
      dataTypeExtraId: enumerationTypeExtraId,
      list: currentEnumerationsList,
    } = menuItemToProcess.options,
    currentEnumerationItem = currentEnumerationsList[currentItem];
  const currentItemDetailsList = [];
  enumerationItemDefaultDetails.forEach((item) => {
    if (currentEnumerationItem.hasOwnProperty(item) || item === 'itemId') {
      const currentItemDetailsLineObject = {
        label: `${translationsItemTextGet(user, 'list', item)}`,
      };
      if (typeof currentEnumerationItem[item] === 'boolean') {
        currentItemDetailsLineObject.valueString = currentEnumerationItem[item]
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user);
        currentItemDetailsLineObject.lengthModifier = 1;
      } else {
        currentItemDetailsLineObject.valueString = currentEnumerationItem.hasOwnProperty(item)
          ? currentEnumerationItem[item]
          : currentEnumerationItem.hasOwnProperty('enum')
          ? `[${currentEnumerationItem.enum}.]${currentItem}`
          : currentItem;
      }
      currentItemDetailsList.push(currentItemDetailsLineObject);
    }
  });
  if (currentEnumerationItem.order > 0) {
    const previousOrder = currentEnumerationItem.order - 1,
      previousItem = Object.keys(currentEnumerationsList).find(
        (item) => currentEnumerationsList[item].order === previousOrder,
      );
    currentItemDetailsList.push({
      label: translationsItemTextGet(user, 'ListPrevious'),
      valueString: previousItem
        ? enumerationsItemName(user, enumerationType, previousItem, currentEnumerationsList[previousItem])
        : '',
    });
  }
  if (currentEnumerationItem.order < Object.keys(currentEnumerationsList).length - 1) {
    const nextOrder = currentEnumerationItem.order + 1,
      nextItem = Object.keys(currentEnumerationsList).find((item) => currentEnumerationsList[item].order === nextOrder);
    currentItemDetailsList.push({
      label: translationsItemTextGet(user, 'ListNext'),
      valueString: nextItem
        ? enumerationsItemName(user, enumerationType, nextItem, currentEnumerationsList[nextItem])
        : '',
    });
  }
  if (enumerationType === dataTypeFunction || enumerationType === dataTypeDestination) {
    currentItemDetailsList.push({
      label: translationsItemMenuGet(user, 'holder'),
      valueString:
        currentEnumerationItem.holder && currentEnumerationsList.hasOwnProperty(currentEnumerationItem.holder)
          ? enumerationsItemName(
              user,
              enumerationType,
              currentEnumerationItem.holder,
              currentEnumerationsList[currentEnumerationItem.holder],
            )
          : '',
    });
  }
  if (enumerationType === dataTypePrimaryEnums) {
    const dataTypeActiveSubItemsCount = enumerationsGetActiveSubItemsCount(enumerationTypeExtraId, currentItem);
    currentItemDetailsList.push({
      label: `${translationsItemMenuGet(user, enumerationsList[enumerationTypeExtraId].id)}`,
      valueString: `${dataTypeActiveSubItemsCount}`,
    });
    currentItemDetailsList.push({
      label: `${translationsItemTextGet(user, 'canBeDeleted')}`,
      lengthModifier: 1,
      valueString: `${
        dataTypeActiveSubItemsCount === 0
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user)
      }`,
    });
  } else if (currentEnumerationItem.enum) {
    currentItemDetailsList.push({
      label: `${translationsItemTextGet(user, 'canBeDeleted')}`,
      lengthModifier: 1,
      valueString: `${
        (configOptions.getOption(cfgAllowToDeleteEmptyEnums) &&
          enumerationsIsItemCanBeDeleted(enumerationType, currentItem, true)) ||
        enumerationsIsItemCanBeDeleted(enumerationType, currentItem, false)
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user)
      }`,
    });
  }
  return currentItemDetailsList.length
    ? `<code>${menuMenuItemDetailsPrintFixedLengthLines(user, currentItemDetailsList)}</code>`
    : '';
}

/**
 * This function returns a name of current enumerations item.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem.
 * @param {object=} enumerationItem - The current enumerationItem object.
 * @returns {string} The enumerations item name.
 */
function enumerationsItemName(user, enumerationType, enumerationItemId, enumerationItem) {
  const currentItemTranslationId = translationsGetEnumId(
    user,
    enumerationType,
    enumerationItemId,
    enumerationsNamesMain,
  );
  // logs(`enumerationType = ${enumerationType}, enumerationItemId = ${enumerationItemId}, currentItemTranslationId = ${currentItemTranslationId}, enumerationItem = ${JSON.stringify(enumerationItem)}`, _l)
  if (enumerationItem === undefined) {
    const enumerationList = enumerationsGetList(enumerationType);
    enumerationItem = enumerationList ? enumerationList[enumerationItemId] : enumerationItem;
  }
  if (
    enumerationItem &&
    enumerationItem.name !== undefined &&
    translationsItemGet(user, currentItemTranslationId) === currentItemTranslationId
  ) {
    // logs(`currentItemTranslationId ${currentItemTranslationId}`);
    enumerationsRereadItemName(user, enumerationType, enumerationItemId);
  }
  let result =
    enumerationItem.name || enumerationItem.isExternal
      ? translationsItemGet(user, currentItemTranslationId)
      : enumerationType === dataTypePrimaryEnums
      ? `${stringCapitalize(
          translationsGetObjectName(user, `${prefixEnums}.${enumerationItemId}`),
        )} [${enumerationItemId}]`
      : enumerationItem.nameTranslationId
      ? translationsItemGet(user, enumerationItem.nameTranslationId)
      : 'No translation';
  if (
    [dataTypeFunction, dataTypeDestination].includes(enumerationType) &&
    enumerationItem.name &&
    enumerationItemId.includes('.')
  ) {
    const holderId = enumerationItemId.split('.').shift();
    result = `${translationsGetEnumName(
      user,
      enumerationType,
      holderId,
      enumerationsNamesMain,
    )} ${iconItemToSubItemByArrow} ${result}`;
  }
  return result;
}

/**
 * This function generates a submenu with all enumerations items of appropriate enumerationType.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function enumerationsMenuGenerateListOfEnumerationItems(user, menuItemToProcess) {
  logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    {dataType: enumerationType, dataTypeExtraId: enumerationTypeExtraId} = menuItemToProcess.options,
    enumerationPrimaryType = enumerationsGetPrimaryDataType(enumerationType, enumerationTypeExtraId);
  if (enumerationType !== dataTypePrimaryEnums) {
    enumerationsLoad(enumerationPrimaryType);
    enumerationsInit(enumerationPrimaryType);
  }
  const currentEnumerationsList = enumerationsGetList(enumerationType, enumerationTypeExtraId);
  if (enumerationsDeviceStatesTypes.includes(enumerationType)) {
    if (Object.keys(enumerationsGetList).length === 0) {
      enumerationsRefreshFunctionDeviceStates(user, enumerationTypeExtraId, enumerationType);
    }
  }
  let subMenu = [],
    subMenuIndex = 0;
  Object.keys(currentEnumerationsList)
    .sort((a, b) => currentEnumerationsList[a].order - currentEnumerationsList[b].order)
    .forEach((currentItem) => {
      // logs(`currentItem = ${JSON.stringify(currentItem)}`, _l);
      const currentEnumerationItem = currentEnumerationsList[currentItem],
        currentIcon = currentEnumerationItem.isEnabled
          ? currentEnumerationItem.hasOwnProperty('icon')
            ? currentEnumerationItem.icon
            : ''
          : iconItemDisabled;
      // logs(`currentItem = ${JSON.stringify(currentItem)}, currentEnumerationItem = ${JSON.stringify(currentEnumerationItem)}`, _l);
      const currentMenuItem = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${enumerationsItemName(user, enumerationType, currentItem, currentEnumerationItem)}${
          currentEnumerationItem.isExternal ? ` ${iconItemIsExternal}` : ''
        }`,
        icon: currentIcon,
        accessLevel: currentAccessLevel,
        function: enumerationsMenuItemDetailsEnumerationItem,
        options: {
          [menuOptionHorizontalNavigation]: true,
          dataType: enumerationType,
          item: currentItem,
          dataTypeExtraId: enumerationTypeExtraId,
          list: currentEnumerationsList,
        },
        submenu: enumerationsMenuGenerateEnumerationItem,
      };
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
            options: {translationPrefix: translationsCommonFunctionsAttributesPrefix},
            submenu: translationsMenuGenerateFunctionStatesItems,
          });
          break;
        case dataTypeReport:
          if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
            const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
              icon: iconItemPlus,
              group: cmdItemAdd,
            };
            const currentEnumsList = Object.keys(enumerationsList[enumerationType].enums);
            if (currentEnumsList.length === 1) {
              subMenuItem.options = {enumType: enumerationsList[enumerationType].enums[0], item: ''};
              subMenuItem.submenu = simpleReportMenuGenerateReportEdit;
            } else {
              subMenuItem.submenu = new Array();
              currentEnumsList.forEach((enumId, enumIndex) => {
                subMenuItem.submenu.push({
                  index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
                  name: `${stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumId}`))}`,
                  icon: iconItemPlus,
                  accessLevel: currentAccessLevel,
                  options: {enumType: enumId, item: ''},
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
        group: enumerationsEditEnums,
        options: {dataType: dataTypePrimaryEnums, dataTypeExtraId: enumerationType},
        submenu: enumerationsMenuGenerateListOfEnumerationItems,
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
          command: cmdItemsProcess,
          options: {dataType: enumerationType, dataTypeExtraId: enumerationTypeExtraId},
          submenu: [],
        });
      }
      break;

    case dataTypePrimaryEnums:
      if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
        let availableEnums = new Array();
        getEnums().forEach((enumObject) => {
          const shortId = enumObject.id.replace(`${prefixEnums}.`, '');
          if (!shortId.includes('.')) availableEnums.push(shortId);
        });
        Object.keys(enumerationsList).forEach((dataType) => {
          Object.keys(enumerationsList[dataType].enums).forEach((enumId) => {
            if (availableEnums.includes(enumId)) availableEnums.splice(availableEnums.indexOf(enumId), 1);
          });
        });
        if (availableEnums.length) {
          const subMenuItem = {
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
            icon: iconItemPlus,
            group: cmdItemAdd,
            submenu: new Array(),
          };
          availableEnums.forEach((enumId, enumIndex) => {
            subMenuItem.submenu.push({
              index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
              name: `${stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumId}`))}[${enumId}]`,
              command: cmdItemPress,
              options: {
                dataType: dataTypePrimaryEnums,
                dataTypeExtraId: enumerationTypeExtraId,
                mode: cmdItemAdd,
                item: enumId,
              },
              submenu: [],
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
  const stateObjectCommon = stateObject ? stateObject.common : undefined;
  return (
    stateObjectCommon &&
    stateObjectCommon.hasOwnProperty('custom') &&
    stateObjectCommon.custom &&
    stateObjectCommon.custom.hasOwnProperty(historyAdapterId) &&
    stateObjectCommon.custom[historyAdapterId]
  );
}

function enumerationsGetDeviceName(user, stateId, functionId, destinationId) {
  const functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[functionId],
    deviceId = currentFunction ? stateId.split('.').slice(0, -currentFunction.statesSectionsCount).join('.') : '';
  return deviceId ? translationsGetObjectName(user, deviceId, functionId, destinationId) : '';
}

/**
 * This function generates a submenu with Buttons for each state which have an "RW" access.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} Newly generated submenu.
 */
function enumerationsMenuGenerateDevice(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    {
      function: currentFunctionId,
      destination: currentDestinationId,
      state: primaryStateId,
      device: devicePrefix,
    } = menuItemToProcess.options,
    destinationsList = enumerationsList[dataTypeDestination].list,
    currentDestination = destinationsList[currentDestinationId],
    fullDestinationId = [prefixEnums, currentDestination.enum, currentDestinationId].join('.'),
    functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[currentFunctionId],
    fullFunctionId = [prefixEnums, currentFunction.enum, currentFunctionId].join('.'),
    deviceAttributesList = currentFunction.deviceAttributes,
    currentDeviceAttributes = deviceAttributesList
      ? Object.keys(deviceAttributesList)
          .filter((deviceAttr) => deviceAttributesList[deviceAttr].isEnabled)
          .sort((a, b) => deviceAttributesList[a].order - deviceAttributesList[b].order)
      : [],
    deviceButtonsList = currentFunction.deviceButtons,
    currentDeviceButtons = deviceButtonsList
      ? Object.keys(deviceButtonsList)
          .filter((deviceButton) => deviceButtonsList[deviceButton].isEnabled)
          .sort((a, b) => deviceButtonsList[a].order - deviceButtonsList[b].order)
      : [],
    primaryStateShortId = primaryStateId.replace(`${devicePrefix}.`, ''),
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    isCurrentAccessLevelNonSilent = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelSilent) < 0,
    historyAdapterId = configOptions.getOption(cfgHistoryAdapter, user),
    graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
    isGraphsEnabled = historyAdapterId && existsObject(`${graphsTemplatesFolder}.${graphsDefaultTemplate}`),
    defaultIconOn = configOptions.getOption(cfgDefaultIconOn, user),
    defaultIconOff = configOptions.getOption(cfgDefaultIconOff, user),
    statesForGraphs = new Map();
  let subMenuIndex = 0,
    subMenu = [];
  // logs('menuItemToProcess = ' + JSON.stringify(menuItemToProcess), _l);
  // logs('mainStateShortId = ' + JSON.stringify(mainStateShortId));
  if (isGraphsEnabled) {
    currentDeviceAttributes.forEach((deviceAttributeId) => {
      const stateIdFull = `${devicePrefix}.${deviceAttributeId}`;
      if (existsObject(stateIdFull)) {
        const stateObject = getObjectEnriched(stateIdFull, '*'),
          stateObjectCommon = stateObject.common;
        if (stateObject && stateObjectCommon) {
          const currentStateType = stateObjectCommon['type'];
          if (enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) && currentStateType === 'number') {
            statesForGraphs.set(stateIdFull, translationsGetObjectName(user, stateObject, currentFunctionId));
          }
        }
      }
    });
  }
  currentDeviceButtons.forEach((deviceButtonId) => {
    const stateIdFull = `${devicePrefix}.${deviceButtonId}`,
      currentButton = deviceButtonsList[deviceButtonId],
      convertValueCode = currentButton.convertValueCode,
      isButtonAllowedToPress =
        isCurrentAccessLevelAllowModify &&
        MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.pressAccessLevel) <= 0 &&
        menuItemIsAvailable(currentFunction, primaryStateId);
    if (isButtonAllowedToPress && existsObject(stateIdFull)) {
      const stateObject = getObjectEnriched(stateIdFull, '*'),
        stateObjectCommon = stateObject.common;
      if (stateObject && stateObject.hasOwnProperty('common') && stateObjectCommon) {
        const stateObjectEnums = stateObject.hasOwnProperty('enumIds') ? stateObject.enumIds : [],
          isRightState = stateObjectEnums.includes(fullFunctionId) && stateObjectEnums.includes(fullDestinationId),
          isCurrentStateWritable = stateObjectCommon.hasOwnProperty('write') ? stateObjectCommon.write : false,
          currentStateType = stateObjectCommon['type'];
        if (isRightState && isCurrentStateWritable) {
          const stateName = translationsGetObjectName(user, stateObject, currentFunctionId);
          if (stateName) {
            let subSubMenuIndex = 0,
              currentState = existsState(stateIdFull) ? getState(stateIdFull) : undefined,
              stateValue =
                currentState !== undefined
                  ? enumerationsEvaluateValueConversionCode(user, currentState.val, convertValueCode)
                  : undefined,
              states = [];
            const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${stateName}`,
              group: currentButton.group ? currentButton.group : menuButtonsDefaultGroup,
              submenu: new Array(),
            };
            const currentOptions = {
              function: currentFunctionId,
              state: stateIdFull,
              valueType: currentStateType,
              device: devicePrefix,
            };
            if (currentStateType === 'boolean') {
              subMenuItem.icon =
                stateValue === undefined || stateValue === null
                  ? iconItemNotFound
                  : deviceButtonId === primaryStateId
                  ? stateValue
                    ? currentFunction.iconOn
                    : currentFunction.iconOff
                  : stateValue
                  ? defaultIconOn
                  : defaultIconOff;
              subMenuItem.command = cmdSetState;
              subMenuItem.options = currentOptions;
            } else if (stateObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(currentStateType)) {
              states = enumerationsExtractPossibleValueStates(stateObjectCommon['states']);
              // logs('states = ' + JSON.stringify(states));
              if (states !== undefined && Object.keys(states).length > 0) {
                subMenuItem.icon = '';
                for (const [possibleValue, _possibleName] of Object.entries(states)) {
                  const subSubMenuItem = {
                    index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                    name: `${
                      enumerationsStateValueDetails(user, stateObject, currentFunctionId, {val: possibleValue})[
                        'valueString'
                      ]
                    }`,
                    command: cmdSetState,
                    options: {...currentOptions, value: possibleValue},
                    group: 'possibleValues',
                    icon: stateValue == possibleValue ? defaultIconOn : defaultIconOff,
                    submenu: [],
                  };
                  subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);
                  if (stateValue == possibleValue) {
                    subMenuItem.name += ` (${
                      enumerationsStateValueDetails(user, stateObject, currentFunctionId, currentState)['valueString']
                    })`;
                  }
                }
                // logs('subMenuItem = ' + JSON.stringify(subMenuItem, null, 2));
              }
            } else if (currentStateType === 'number') {
              const step = stateObjectCommon.hasOwnProperty('step') ? stateObjectCommon['step'] : 1,
                valueMin = stateObjectCommon.hasOwnProperty('min') ? stateObjectCommon['min'] : undefined,
                valueMax = stateObjectCommon.hasOwnProperty('max') ? stateObjectCommon['max'] : undefined;
              for (let value = stateValue - 2 * step; value <= stateValue + 2 * step; value += step) {
                if ((valueMin === undefined || value >= valueMin) && (valueMax === undefined || value <= valueMax)) {
                  states.push(value);
                }
              }
              subMenuItem.icon = '';
              subMenuItem.name += ` (${stateValue ? stateValue : iconItemNotFound}${
                stateObjectCommon.hasOwnProperty('unit') ? ` ${stateObjectCommon['unit']}` : ''
              })`;
              states.forEach((possibleValue) => {
                const subSubMenuItem = {
                  index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                  name: `${possibleValue}${
                    stateObjectCommon.hasOwnProperty('unit') ? ` ${stateObjectCommon['unit']}` : ''
                  }`,
                  command: cmdSetState,
                  options: {...currentOptions, value: possibleValue},
                  group: 'possibleValues',
                  icon: stateValue == possibleValue ? defaultIconOn : defaultIconOff,
                  submenu: [],
                };
                subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);
              });
              subSubMenuIndex = subMenuItem.submenu.push({
                index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'SetValue')} (${stateValue ? stateValue : ''}${
                  stateObjectCommon.hasOwnProperty('unit') ? ` ${stateObjectCommon['unit']}` : ''
                })`,
                icon: iconItemEdit,
                command: cmdGetInput,
                options: {...currentOptions, dataType: dataTypeStateValue},
                submenu: [],
              });
            }
            // logs('subMenuItem = ' + JSON.stringify(subMenuItem, null, 2), _l);
            if (subMenuItem.icon !== undefined || subMenuItem.icons) {
              // logs('subMenuItem.icon = ' + JSON.stringify(subMenuItem.icon), _l);
              if (deviceButtonId !== primaryStateShortId) {
                subMenuIndex = subMenu.push(subMenuItem);
              } else {
                subMenuIndex = subMenu.unshift(subMenuItem);
              }
            }
            if (
              isGraphsEnabled &&
              enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) &&
              currentStateType === 'number'
            ) {
              statesForGraphs.set(stateIdFull, stateName);
            }
          }
        }
      }
    }
  });
  if (isCurrentAccessLevelNonSilent) {
    const alertSubscribeItem = alertsMenuItemGenerateSubscribedOn(
      `${currentIndex}.${subMenuIndex}`,
      `${translationsItemCoreGet(user, cmdAlertSubscribe)}`,
      {function: currentFunctionId, destination: currentDestinationId, state: primaryStateId},
    );
    if (alertSubscribeItem) {
      subMenuIndex = subMenu.push(alertSubscribeItem);
    }
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'AlertsSubscriptionExtended')}`,
      options: {
        function: currentFunctionId,
        destination: currentDestinationId,
        device: devicePrefix,
      },
      accessLevel: currentAccessLevel,
      icon: iconItemAlerts,
      function: enumerationsMenuItemDetailsDevice,
      group: 'alerts',
      submenu: alertsMenuGenerateExtraSubscription,
    });
    if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) === 0) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'TriggersManage')}`,
        options: {
          function: currentFunctionId,
          destination: currentDestinationId,
          device: devicePrefix,
        },
        accessLevel: currentAccessLevel,
        icon: iconItemTrigger,
        function: enumerationsMenuItemDetailsDevice,
        group: 'triggers',
        submenu: triggersMenuGenerate,
      });
    }
  }
  if (statesForGraphs.size) {
    const subMenuItem = {
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'Graphs')}`,
      icon: iconItemChart,
      submenu: new Array(),
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
            command: cmdItemsProcess,
            options: {
              dataType: dataTypeGraph,
              function: currentFunctionId,
              destination: currentDestinationId,
              state: stateId,
              name: stateName,
              graphsInterval: graphsIntervalMinutes,
            },
          });
        });
      }
      if (sentImagesExists(user)) {
        subSubSubMenuIndex = subSubMenuItem.submenu.push({
          index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}.${subSubSubMenuIndex}`,
          name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
          icon: iconItemDelete,
          command: cmdDeleteAllSentImages,
          group: cmdDeleteAllSentImages,
        });
      }
      subSubMenuIndex = subMenuItem.submenu.push(subSubMenuItem);
    });
    if (sentImagesExists(user)) {
      subSubMenuIndex = subMenuItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
        name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
        icon: iconItemDelete,
        command: cmdDeleteAllSentImages,
        group: cmdDeleteAllSentImages,
      });
    }
    subMenuIndex = subMenu.push(subMenuItem);
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
  if (typeof inputStates === 'string') {
    const statesArray =
      inputStates.indexOf(';') > 0
        ? inputStates.split(';')
        : inputStates.indexOf(',') > 0
        ? inputStates.split(',')
        : [];
    logs('statesArray = ' + JSON.stringify(statesArray));
    for (let iState of statesArray.values()) {
      const [possibleValue, possibleName] = iState.split(':');
      states[possibleValue.trim()] = possibleName.trim();
    }
    logs('states = ' + JSON.stringify(states));
    return states;
  } else if (Array.isArray(inputStates)) {
    return undefined;
  } else if (typeof inputStates === 'object') {
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
  if (convertValueCode && inputValue !== undefined && inputValue !== null) {
    const printDate = 'printDate(value)';
    if (typeOf(convertValueCode, 'string') && convertValueCode.length > 0) {
      if (convertValueCode === printDate || convertValueCode === `${printDate};`) {
        try {
          inputValue = formatDate(new Date(inputValue), configOptions.getOption(cfgDateTimeTemplate, user));
        } catch (error) {
          console.warn(`Can't print date printDate(${inputValue})! Error is "${JSON.stringify(error)}".`);
        }
      } else {
        const sandbox = {value: inputValue, result: undefined};
        nodeVm.createContext(sandbox); // Contextify the sandbox.
        try {
          if (convertValueCode.includes('return')) {
            nodeVm.runInContext(`const func = () => {${convertValueCode}}; result = func()`, sandbox);
          } else {
            nodeVm.runInContext(`const func = () => (${convertValueCode}); result = func()`, sandbox);
          }
          inputValue = sandbox.result;
        } catch (error) {
          console.warn(`Can't convert value with ${convertValueCode}! Error is "${JSON.stringify(error)}".`);
        }
      }
    }
  }
  return inputValue;
}

/**
 * This function make a test of `convertValueCode` to accept or no it.
 * @param {object} user - The user object.
 * @param {string} functionId - The appropriate `Function` ID.
 * @param {string} stateToTestOnShortId - The appropriate state short ID.
 * @param {string} convertValueCodeToTest - The code to test.
 * @returns {boolean} Test result - `true` if everything is OK.
 */
function enumerationsTestValueConversionCode(user, functionId, stateToTestOnShortId, convertValueCodeToTest) {
  let result = true,
    isStateToTestOnFound = false,
    stateToTestValue = undefined;
  const functionsList = enumerationsList[dataTypeFunction].list,
    destinationsList = enumerationsList[dataTypeDestination].list,
    destinationsListIds = Object.keys(destinationsList).filter((itemId) => destinationsList[itemId].isEnabled),
    currentFunction =
      functionsList && functionId && functionsList.hasOwnProperty(functionId) ? functionsList[functionId] : undefined;
  $(`state[id=*.${stateToTestOnShortId}](${currentFunction.enum}=${functionId})`).each((stateId) => {
    if (!isStateToTestOnFound) {
      const currentStateObject = getObject(stateId, '*');
      const currentItemEnums = currentStateObject['enumIds'];
      if (
        destinationsListIds.filter((itemId) =>
          currentItemEnums.includes(`${prefixEnums}.${destinationsList[itemId].enum}.${itemId}`),
        ).length > 0
      ) {
        const stateToTestValueObject = getState(stateId);
        if (
          stateToTestValueObject &&
          stateToTestValueObject.hasOwnProperty('val') &&
          stateToTestValueObject.val !== undefined &&
          stateToTestValueObject.val !== null
        ) {
          stateToTestValue = stateToTestValueObject.val;
          isStateToTestOnFound = true;
        }
      }
    }
  });
  if (isStateToTestOnFound) {
    const testResultValue = enumerationsEvaluateValueConversionCode(user, stateToTestValue, convertValueCodeToTest);
    result = testResultValue !== stateToTestValue;
  }
  return result;
}

/**
 * This function get the ioBroker state value and return it as object contained an formatted string and it's length modifier, taking in account all possible states and it's units.
 * @param {object} user - The user object.
 * @param {string|object} stateIdOrObject - The id of the state or the it's object representation.
 * @param {string} functionId - The id of the associated function.
 * @param {object=} currentState - The object, contained the current state information.
 * @param {boolean=} skipCodeConversion - The selector to skip code conversion.
 * @returns {object} The resulted object contained the formatted string.
 */
function enumerationsStateValueDetails(user, stateIdOrObject, functionId, currentState, skipCodeConversion = false) {
  const currObject =
    typeof stateIdOrObject === 'string' && existsObject(stateIdOrObject)
      ? getObjectEnriched(stateIdOrObject)
      : stateIdOrObject;
  let valueString = '';
  let lengthModifier = 0;
  if (
    currObject &&
    typeof currObject === 'object' &&
    currObject.hasOwnProperty('_id') &&
    currObject.hasOwnProperty('common')
  ) {
    skipCodeConversion = skipCodeConversion ? skipCodeConversion : false;
    const currentId = currObject._id,
      currentFunction = enumerationsList[dataTypeFunction].list[functionId],
      currentAttributeId = currentId.split('.').slice(-currentFunction.statesSectionsCount).join('.'),
      currentDeviceButtonsAndAttributes = {...currentFunction.deviceAttributes, ...currentFunction.deviceButtons},
      convertValueCode = currentDeviceButtonsAndAttributes.hasOwnProperty(currentAttributeId)
        ? currentDeviceButtonsAndAttributes[currentAttributeId].convertValueCode
        : '',
      stateTranslationIdSuffix = currentAttributeId.split('.').join('_'),
      currentObjectType = currObject.common['type'],
      currObjectUnit = currObject.common.hasOwnProperty('unit') ? currObject.common['unit'] : '',
      currentStateVal =
        currentState && currentState.hasOwnProperty('val')
          ? currentState.val
          : existsState(currentId)
          ? getState(currentId).val
          : undefined,
      currentStateValue = skipCodeConversion
        ? currentStateVal
        : enumerationsEvaluateValueConversionCode(user, currentStateVal, convertValueCode),
      currentStateValueType = currentStateValue == undefined ? currentObjectType : typeof currentStateValue,
      currentStateValueId = `${stateTranslationIdSuffix}_${currentStateValue}`;
    logs('currObject = ' + JSON.stringify(currObject));
    // logs(`${currentFunction.enum}.${functionId}, currState = ${JSON.stringify(currStateVal)}, currStateValType = ${currStateValType}`);
    if (currentStateValueType === 'boolean') {
      const currentIconOn =
          currentAttributeId === currentFunction.state
            ? currentFunction.iconOn
            : configOptions.getOption(cfgDefaultIconOn, user),
        currentIconOff =
          currentAttributeId === currentFunction.state
            ? currentFunction.iconOff
            : configOptions.getOption(cfgDefaultIconOff, user);
      if (currentStateValue !== undefined) {
        valueString = translationsGetObjectName(user, currentStateValueId, functionId);
        // logs(`valueString = ${valueString}, currStateValueId = ${currStateValueId}`)
        if (valueString === 'Undefined' || valueString.includes(currentStateValueId)) {
          valueString = currentStateValue ? currentIconOn : currentIconOff;
          lengthModifier = valueString.length === 1 ? 1 : 0;
        }
      } else {
        valueString = currentIconOff;
        lengthModifier = valueString.length === 1 ? 1 : 0;
      }
    } else if (currObject.common.hasOwnProperty('states') && ['string', 'number'].includes(currObject.common['type'])) {
      const states = enumerationsExtractPossibleValueStates(currObject.common['states']);
      if (currentStateValue !== undefined) {
        if (states.hasOwnProperty(currentStateValue)) {
          valueString = translationsGetObjectName(user, currentStateValueId, functionId);
          if (valueString === 'Undefined' || valueString.includes(currentStateValueId))
            valueString = states[currentStateValue];
          if (valueString === undefined) valueString = currentStateValue;
        } else {
          valueString = `${currentStateValue}`;
        }
      }
    } else if (currentStateValueType === 'number') {
      valueString =
        (currentStateValue === undefined
          ? ''
          : `${Number.isInteger(currentStateValue) ? currentStateValue : currentStateValue.toFixed(2)}`) +
        (currObjectUnit ? ' ' + currObjectUnit : '');
    } else if (currentStateValueType === 'string') {
      valueString =
        (currentStateValue === undefined ? '' : currentStateValue) + (currObjectUnit ? ' ' + currObjectUnit : '');
    }
  }
  return {valueString, lengthModifier};
}

/**
 * This function a string containing formatted details/properties of current device attributes.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
 */
function enumerationsMenuItemDetailsDevice(user, menuItemToProcess) {
  logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess, null, 2)}`);
  logs(`user = ${JSON.stringify(user)}`);
  let text = '';
  const {
      function: currentFunctionId,
      destination: currentDestinationId,
      state: primaryStateId,
      device: devicePrefix,
    } = menuItemToProcess.options,
    functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[currentFunctionId],
    currentFunctionFullId = [prefixEnums, currentFunction.enum, currentFunctionId].join('.'),
    destinationList = enumerationsList[dataTypeDestination].list,
    currentDestination = destinationList[currentDestinationId],
    currentDestinationFullId = [prefixEnums, currentDestination.enum, currentDestinationId].join('.'),
    isSkipAttributesWithNullValue = configOptions.getOption(cfgSkipAttributesWithNullValue, user);
  if (currentFunction && currentFunction.hasOwnProperty('deviceAttributes') && existsObject(primaryStateId)) {
    const primaryObject = getObjectEnriched(primaryStateId, '*'),
      deviceAttributesList = currentFunction.deviceAttributes,
      deviceAttributesArray = [],
      deviceAttributes = Object.keys(deviceAttributesList)
        .filter((deviceAttr) => deviceAttributesList[deviceAttr].isEnabled)
        .sort((a, b) => deviceAttributesList[a].order - deviceAttributesList[b].order),
      currentAccessLevel = menuItemToProcess.accessLevel,
      isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
      deviceButtonsList = currentFunction.deviceButtons,
      currentDeviceButtons = deviceButtonsList
        ? Object.keys(deviceButtonsList)
            .filter((deviceButton) => deviceButtonsList[deviceButton].isEnabled)
            .sort((a, b) => deviceButtonsList[a].order - deviceButtonsList[b].order)
        : [];
    currentDeviceButtons.forEach((deviceButtonId) => {
      const currentButton = deviceButtonsList[deviceButtonId],
        isButtonAllowedToShow = MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.showAccessLevel) <= 0,
        isButtonAllowedToPress =
          isCurrentAccessLevelAllowModify &&
          MenuRoles.compareAccessLevels(currentAccessLevel, currentButton.pressAccessLevel) <= 0;
      if (isButtonAllowedToShow && !isButtonAllowedToPress) {
        deviceAttributes.push(deviceButtonId);
      }
    });
    deviceAttributes.forEach((deviceAttribute) => {
      // logs(`deviceAttribute = ${JSON.stringify(deviceAttribute)}`, _l);
      const deviceAttributeId = `${devicePrefix}.${deviceAttribute}`,
        isPrimaryState = deviceAttributeId === primaryStateId;
      if (isPrimaryState || existsObject(deviceAttributeId)) {
        const stateObject = isPrimaryState ? primaryObject : getObjectEnriched(deviceAttributeId, '*'),
          stateObjectEnums = stateObject.hasOwnProperty('enumIds') && stateObject.enumIds ? stateObject.enumIds : [];
        if (stateObjectEnums.includes(currentFunctionFullId) && stateObjectEnums.includes(currentDestinationFullId)) {
          const attributeState = existsState(deviceAttributeId) ? getState(deviceAttributeId) : undefined,
            isCurrentStateNotEmpty = attributeState && attributeState.val !== null && attributeState.val !== undefined;
          if (isPrimaryState || isCurrentStateNotEmpty || !isSkipAttributesWithNullValue) {
            deviceAttributesArray.push({
              label: translationsGetObjectName(
                user,
                isPrimaryState ? translationsPrimaryStateId : stateObject,
                currentFunctionId,
              ),
              ...enumerationsStateValueDetails(user, stateObject, currentFunctionId, attributeState),
            });
            if (attributeState) {
              const currentDeviceStateDetails = deviceAttributesList.hasOwnProperty(deviceAttribute)
                ? deviceAttributesList[deviceAttribute]
                : deviceButtonsList.hasOwnProperty(deviceAttribute)
                ? deviceButtonsList[deviceAttribute]
                : undefined;
              if (currentDeviceStateDetails && currentDeviceStateDetails.hasOwnProperty('stateAttributes')) {
                currentDeviceStateDetails.stateAttributes.forEach((stateAttributeId) => {
                  const stateAttributeLine = {
                    label: ` ${translationsGetObjectName(user, stateAttributeId, currentFunctionId, undefined, true)}`,
                    valueString: '',
                    lengthModifier: 0,
                  };
                  switch (stateAttributeId) {
                    case 'ts':
                    case 'lc': {
                      const timeStamp = attributeState[stateAttributeId]
                        ? new Date(Number(attributeState[stateAttributeId]))
                        : undefined;
                      stateAttributeLine.valueString = timeStamp
                        ? formatDate(timeStamp, configOptions.getOption(cfgDateTimeTemplate, user))
                        : '';
                      break;
                    }
                    case 'ack': {
                      stateAttributeLine.valueString = attributeState.ack
                        ? configOptions.getOption(cfgDefaultIconOn, user)
                        : configOptions.getOption(cfgDefaultIconOff, user);
                      stateAttributeLine.lengthModifier = 1;
                      break;
                    }
                    default: {
                      stateAttributeLine.valueString = attributeState[stateAttributeId];
                      break;
                    }
                  }
                  deviceAttributesArray.push(stateAttributeLine);
                });
              }
            }
          }
        }
      }
    });
    text = `<code>${menuMenuItemDetailsPrintFixedLengthLines(user, deviceAttributesArray)}</code>`;
  }
  // logs(`text = ${text}`, _l)
  return text;
}

/**
 * This function gets a menu list based on the enumerationType and enumerationTypeExtraId parameters.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string|object=} enumerationTypeExtraId - The extra (primary) enumerationType or item of it.
 * @returns {object} The appropriate enumerations object.
 */
function enumerationsGetList(enumerationType, enumerationTypeExtraId) {
  const enumerationPrimaryType = enumerationsGetPrimaryDataType(enumerationType, enumerationTypeExtraId);
  let currentList = undefined;
  if (enumerationTypeExtraId) {
    if (enumerationType === dataTypePrimaryEnums) {
      currentList = enumerationsList[enumerationPrimaryType].enums;
    } else if (typeOf(enumerationTypeExtraId, 'string')) {
      currentList = enumerationsList[enumerationPrimaryType].list[enumerationTypeExtraId][enumerationType];
    } else if (typeOf(enumerationTypeExtraId, 'object')) {
      const currentDeviceAttribute = enumerationsGetDeviceState(enumerationType, enumerationTypeExtraId);
      if (currentDeviceAttribute) {
        currentList = enumerationsGenerateDeviceStateAttributesList(currentDeviceAttribute);
      }
    }
  } else {
    currentList = enumerationsList[enumerationType].list;
  }
  return currentList;
}

/**
 * This function gets a primary enumeration type from on the enumerationType and enumerationTypeExtraId parameters.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string} enumerationTypeExtraId - The extra (primary) enumerationType or item of it.
 * @returns {string} The appropriate enumeration type.
 */
function enumerationsGetPrimaryDataType(enumerationType, enumerationTypeExtraId) {
  return enumerationTypeExtraId
    ? enumerationDeviceSubTypes.includes(enumerationType)
      ? dataTypeFunction
      : enumerationType === dataTypePrimaryEnums
      ? enumerationTypeExtraId
      : enumerationType
    : enumerationType;
}

/**
 * This function extract the Device state, when enumerationTYpe is `dataTypeDeviceStatesAttributes`.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string|object} enumerationTypeExtraId - The extra (primary) enumerationType or item of it.
 * @returns {object}
 */
function enumerationsGetDeviceState(enumerationType, enumerationTypeExtraId) {
  let currentDeviceState = undefined;
  if (typeOf(enumerationTypeExtraId, 'object')) {
    if (
      enumerationTypeExtraId.hasOwnProperty('dataType') &&
      enumerationTypeExtraId.hasOwnProperty('function') &&
      enumerationTypeExtraId.hasOwnProperty('item')
    ) {
      if (
        enumerationsDeviceStatesTypes.includes(enumerationTypeExtraId.dataType) &&
        enumerationType === dataTypeDeviceStatesAttributes &&
        enumerationTypeExtraId.item
      ) {
        const currentFunction = enumerationsList[dataTypeFunction].list[enumerationTypeExtraId.function],
          currentDeviceStates = currentFunction ? currentFunction[enumerationTypeExtraId.dataType] : undefined;
        currentDeviceState = currentDeviceStates ? currentDeviceStates[enumerationTypeExtraId.item] : undefined;
      }
    }
  }
  return currentDeviceState;
}

/**
 * This function converts state(Button or Attribute of Device) attributes array ino "standard" list of object.
 * @param {object} currentDeviceState - The state for which list of attributes to be created.
 * @returns {object} The List of attributes for state.
 */
function enumerationsGenerateDeviceStateAttributesList(currentDeviceState) {
  const currentStateAttributesList = {};
  if (currentDeviceState) {
    const currentStateAttributes = currentDeviceState.stateAttributes ? currentDeviceState.stateAttributes : [];
    currentStateAttributes.forEach((currentStateAttribute, currentStateAttributeIndex) => {
      currentStateAttributesList[currentStateAttribute] = {
        isEnabled: true,
        nameTranslationId: translationsGetObjectId(currentStateAttribute, '', undefined, true),
        order: currentStateAttributeIndex,
      };
    });
    let currentStateAttributeIndex = currentStateAttributes.length;
    enumerationDeviceStateAttributes.forEach((currentStateAttribute) => {
      if (!currentStateAttributes.includes(currentStateAttribute)) {
        currentStateAttributesList[currentStateAttribute] = {
          isEnabled: false,
          nameTranslationId: translationsGetObjectId(currentStateAttribute, '', undefined, true),
          order: currentStateAttributeIndex,
        };
        currentStateAttributeIndex++;
      }
    });
  }
  return currentStateAttributesList;
}

function enumerationsProcessDeviceStatesList(user, currentAccessLevel, options, processStateFn) {
  const {
      attributes: attributesFilter,
      buttons: buttonsFilter,
      details: withDetails,
      function: currentFunctionId,
      destination: currentDestinationId,
      device: devicePrefix,
    } = options,
    destinationsList = enumerationsList[dataTypeDestination].list,
    currentDestination = destinationsList[currentDestinationId],
    currentDestinationEnum = currentDestination.enum,
    fullDestinationId = `${prefixEnums}.${currentDestinationEnum}.${currentDestinationId}`,
    functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[currentFunctionId],
    currentFunctionEnum = currentFunction.enum,
    fullFunctionId = `${prefixEnums}.${currentFunctionEnum}.${currentFunctionId}`;
  let currentDeviceStates = new Array(),
    currentDeviceStatesList = {};
  if (attributesFilter === 'all') {
    const deviceAttributesList = currentFunction.deviceAttributes;
    if (deviceAttributesList) {
      currentDeviceStates = Object.keys(deviceAttributesList)
        .filter((deviceAttr) => deviceAttributesList[deviceAttr].isEnabled)
        .sort((a, b) => deviceAttributesList[a].order - deviceAttributesList[b].order);
    }
    if (withDetails) {
      currentDeviceStates.forEach(
        (deviceAttribute) => (currentDeviceStatesList[deviceAttribute] = deviceAttributesList[deviceAttribute]),
      );
    }
  }
  if (buttonsFilter) {
    const deviceButtonsList = currentFunction.deviceButtons;
    if (deviceButtonsList) {
      const currentDeviceButtons = Object.keys(deviceButtonsList)
        .filter((deviceButton) => {
          return (
            deviceButtonsList[deviceButton].isEnabled &&
            !currentDeviceStates.includes(deviceButton) &&
            ((buttonsFilter === 'show' &&
              MenuRoles.compareAccessLevels(currentAccessLevel, deviceButtonsList[deviceButton].showAccessLevel) <=
                0) ||
              (buttonsFilter === 'press' &&
                MenuRoles.compareAccessLevels(currentAccessLevel, deviceButtonsList[deviceButton].pressAccessLevel) <=
                  0) ||
              buttonsFilter === 'all')
          );
        })
        .sort((a, b) => deviceButtonsList[a].order - deviceButtonsList[b].order);
      if (withDetails) {
        currentDeviceButtons.forEach(
          (deviceButton) => (currentDeviceStatesList[deviceButton] = deviceButtonsList[deviceButton]),
        );
      }
      currentDeviceStates = currentDeviceStates.concat(currentDeviceButtons);
    }
  }
  currentDeviceStates.forEach((deviceStateId) => {
    const deviceStateIdFull = [devicePrefix, deviceStateId].join('.'),
      deviceStateObject = getObjectEnriched(deviceStateIdFull, '*');
    if (deviceStateObject && deviceStateObject.hasOwnProperty('enumIds')) {
      const deviceStateObjectEnums = deviceStateObject.enumIds;
      if (deviceStateObjectEnums.includes(fullFunctionId) && deviceStateObjectEnums.includes(fullDestinationId)) {
        const deviceStateDetails = withDetails ? currentDeviceStatesList[deviceStateId] : {};
        processStateFn(user, deviceStateId, deviceStateIdFull, deviceStateObject, deviceStateDetails, options);
      }
    }
  });
}

/**
 * This function go thru the all ioBroker states, which are linked with appropriate `functionId` enum, and gathers all
 * states and fills their unique id's in appropriate list(`Object`) of `Attributes` or `Devices` for this `functionId`.
 * @param {object} user - The user object.
 * @param {string} functionId - The enum Id (enumerationItem.Id).
 * @param {string} typeOfDeviceStates - The one of the possible values:
 * - `dataTypeDeviceAttributes` - the states with RO access to the value,
 * - `dataTypeDeviceButtons` - the states with RW access to the value,
 * @returns {boolean} True if new states are found.
 */
function enumerationsRefreshFunctionDeviceStates(user, functionId, typeOfDeviceStates) {
  if (
    enumerationsList[dataTypeFunction].list.hasOwnProperty(functionId) &&
    enumerationsDeviceStatesTypes.includes(typeOfDeviceStates)
  ) {
    const currentFunction = enumerationsList[dataTypeFunction].list[functionId],
      currentDeviceStatesList =
        typeOfDeviceStates === dataTypeDeviceAttributes
          ? currentFunction.deviceAttributes
          : currentFunction.deviceButtons,
      currentDeviceStatesListCount = Object.keys(currentDeviceStatesList).length,
      destinationsList = enumerationsList[dataTypeDestination].list,
      destinationsListKeys = Object.keys(destinationsList)
        .filter((destId) => destinationsList[destId].isEnabled && destinationsList[destId].isAvailable)
        .sort((a, b) => destinationsList[a].order - destinationsList[b].order);
    $(`state[id=*${currentFunction.state}](${currentFunction.enum}=${functionId})`).each((mainId) => {
      if (existsObject(mainId)) {
        const mainObject = getObjectEnriched(mainId, '*'),
          idPrefix = mainId.split('.').slice(0, -currentFunction.statesSectionsCount).join('.'),
          fullFuncId = `${prefixEnums}.${currentFunction.enum}.${functionId}`;
        if (mainObject.hasOwnProperty('enumIds')) {
          for (const destId of destinationsListKeys) {
            const fullDestId = `${prefixEnums}.${destinationsList[destId].enum}.${destId}`;
            // logs(`idPrefix = ${idPrefix}, fullDestId = ${fullDestId}`, _l);
            if (mainObject['enumIds'] && mainObject['enumIds'].includes(fullDestId)) {
              $(`state[id=${idPrefix}.*](${currentFunction.enum}=${functionId})`).each((stateId) => {
                if (existsObject(stateId)) {
                  const currentObject = getObjectEnriched(stateId, '*');
                  if (
                    currentObject['enumIds'] &&
                    currentObject['enumIds'].includes(fullFuncId) &&
                    currentObject['enumIds'].includes(fullDestId)
                  ) {
                    if (currentObject.common) {
                      let currentObjectCommon = currentObject.common;
                      if (
                        (typeOfDeviceStates === dataTypeDeviceAttributes && !currentObjectCommon.write) ||
                        (typeOfDeviceStates === dataTypeDeviceButtons && currentObjectCommon.write)
                      ) {
                        const deviceAttr = stateId.replace(`${idPrefix}.`, '');
                        // logs(`deviceAttr = ${deviceAttr}`, _l);
                        if (!Object.keys(currentDeviceStatesList).includes(deviceAttr)) {
                          const currentDeviceAttrTranslationId = translationsGetObjectId(
                            deviceAttr.split('.').join('_'),
                            functionId,
                            undefined,
                          );
                          currentDeviceStatesList[deviceAttr] = {
                            isEnabled: false,
                            nameTranslationId: currentDeviceAttrTranslationId,
                            stateAttributes: [],
                            order: Object.keys(currentDeviceStatesList).length,
                          };
                          if (typeOfDeviceStates === dataTypeDeviceAttributes) {
                            currentDeviceStatesList[deviceAttr].convertValueCode = '';
                          } else {
                            currentDeviceStatesList[deviceAttr].group = '';
                            currentDeviceStatesList[deviceAttr].showAccessLevel = rolesAccessLevelReadOnly;
                            currentDeviceStatesList[deviceAttr].pressAccessLevel = rolesAccessLevelSelective;
                          }
                          if (
                            currentDeviceAttrTranslationId &&
                            translationsItemGet(user, currentDeviceAttrTranslationId) === currentDeviceAttrTranslationId
                          ) {
                            translationsItemStore(
                              user,
                              currentDeviceAttrTranslationId,
                              translationsGetObjectName(user, currentObject),
                            );
                          }
                        }
                        /**
                         * Small overhead, to store all possible values to translation keys
                         */
                        if (currentObjectCommon.hasOwnProperty('type') && currentObjectCommon.type) {
                          const currentDeviceAttrTranslationId = currentDeviceStatesList[deviceAttr].nameTranslationId;
                          if (currentDeviceAttrTranslationId) {
                            const currentObjectType = currentObjectCommon.type;
                            if (currentObjectType === 'boolean') {
                              translationsItemGet(user, [currentDeviceAttrTranslationId, 'true'].join('_'));
                              translationsItemGet(user, [currentDeviceAttrTranslationId, 'false'].join('_'));
                            } else if (
                              currentObjectCommon.hasOwnProperty('states') &&
                              currentObjectCommon.states &&
                              typeOf(currentObjectCommon.states, 'object')
                            ) {
                              Object.entries(currentObjectCommon.states).forEach(([possibleValue, possibleName]) => {
                                const currentPossibleStateTranslationId = [
                                  currentDeviceAttrTranslationId,
                                  possibleValue,
                                ].join('_');
                                if (
                                  translationsItemGet(user, currentPossibleStateTranslationId) ===
                                  currentPossibleStateTranslationId
                                ) {
                                  translationsItemStore(user, currentPossibleStateTranslationId, possibleName);
                                }
                              });
                            }
                          }
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
 * - `extensionRootMenuId` - The Extension Root menu item Id,
 * - `scriptName` - The script name, which contains the Extension,
 * properties.
 * @param {function} callback - The callback function.
 */
function extensionsActionOnRegisterToAutoTelegramMenu(extensionDetails, callback) {
  const {id, nameTranslationId, icon, extensionRootMenuId, scriptName, translationsKeys} = extensionDetails;
  // logs(`id= ${id}, full info = ${JSON.stringify(extensionDetails, null, 2)}`, _l);
  logs(`scriptName= ${JSON.stringify(scriptName)}`);
  const extensionId = `${prefixExtensionId}${stringCapitalize(id)}`;
  const functionsList = enumerationsList[dataTypeFunction].list;
  if (functionsList.hasOwnProperty(extensionId) && functionsList[extensionId] !== undefined) {
    functionsList[extensionId].isAvailable = true;
    functionsList[extensionId].scriptName = scriptName;
    functionsList[extensionId].state = extensionRootMenuId;
    functionsList[extensionId].nameTranslationId = nameTranslationId;
    functionsList[extensionId].translationsKeys = translationsKeys;
  } else {
    functionsList[extensionId] = {
      ...enumerationsDefaultObjects[dataTypeExtension],
      isAvailable: true,
      isExternal: true,
      enum: idExternal,
      nameTranslationId: nameTranslationId,
      order: Object.keys(functionsList).length,
      icon: icon,
      state: extensionRootMenuId,
      deviceAttributes: {},
      scriptName: scriptName,
      translationsKeys: translationsKeys,
    };
  }
  enumerationsSave(dataTypeFunction);
  callback({success: true});
}

const extensionsInitCommand = autoTelegramMenuExtensionsInitCommand
    ? `${autoTelegramMenuExtensionsInitCommand}`
    : 'autoTelegramMenuExtensionsInit',
  extensionsRegisterCommand = autoTelegramMenuExtensionsRegisterCommand
    ? `${autoTelegramMenuExtensionsRegisterCommand}`
    : 'autoTelegramMenuExtensionsRegister',
  /** Make cached values manage be available for External Scripts */
  extensionsGetCachedStateCommand = autoTelegramMenuExtensionsGetCachedStateCommand
    ? `${autoTelegramMenuExtensionsGetCachedStateCommand}`
    : 'autoTelegramMenuExtensionsGetCachedState',
  extensionsSetCachedStateCommand = autoTelegramMenuExtensionsSetCachedStateCommand
    ? `${autoTelegramMenuExtensionsSetCachedStateCommand}`
    : 'autoTelegramMenuExtensionsSetCachedState',
  extensionsSendFileCommand = autoTelegramMenuExtensionsSendFile
    ? `${autoTelegramMenuExtensionsSendFile}`
    : 'autoTelegramMenuExtensionsSendFile',
  extensionsSendImageCommand = autoTelegramMenuExtensionsSendImage
    ? `${autoTelegramMenuExtensionsSendImage}`
    : 'autoTelegramMenuExtensionsSendImage',
  extensionSendAlertToTelegramCommand = autoTelegramMenuExtensionsSendAlertToTelegram
    ? `${autoTelegramMenuExtensionsSendAlertToTelegram}`
    : 'autoTelegramMenuExtensionsSendAlertToTelegram';

/**
 * This function send a message to all Extensions with request to the to send a registration Message.
 */
function extensionsInit() {
  const timeout = configOptions.getOption(cfgExternalMenuTimeout);
  messageTo(
    extensionsInitCommand,
    {messageId: extensionsRegisterCommand, timeout: timeout},
    {timeout: timeout},
    (result) => {
      logs(`${extensionsInitCommand} result = ${JSON.stringify(result)}`);
    },
  );
}

//*** Extensions - end ***//

//*** Alerts - begin ***//

const alertsStateFullId = `${prefixPrimary}.${idAlerts}`,
  cachedAlertMessages = 'alertMessages',
  cachedAlertsListPrepared = 'alertsListPrepared',
  cachedAlertThresholdSet = 'alertThresholdSet',
  alertThresholdId = 'threshold',
  onTimeIntervalId = 'onTimeInterval',
  alertMessageTemplateId = 'messageTemplate',
  alertPropagateDistributions = [
    'alertPropagateFuncAndDest',
    'alertPropagateDestination',
    'alertPropagateFunction',
    'alertPropagateGlobal',
  ],
  alertPropagateOptions = ['alertPropagateOverwrite', 'alertPropagateSkip'],
  alertsStoredVariables = new Map();

let alertsRules = {};

cachedValuesStatesCommonAttributes[cachedAlertMessages] = {
  name: 'List of alert messages from alert subscriptions',
  type: 'json',
  read: true,
  write: true,
  role: 'array',
};
cachedValuesStatesCommonAttributes[idAlerts] = {
  name: 'List of states for alert subscription',
  type: 'json',
  read: true,
  write: true,
  role: 'list',
};

/**
 * This function return current alerts list as an object
 * @returns {object} List of alerts
 */
function alertsGet() {
  if (!(typeOf(alertsRules, 'object') && Object.keys(alertsRules).length > 0) && existsState(alertsStateFullId)) {
    const alertsState = getState(alertsStateFullId);
    if (alertsState !== undefined && typeOf(alertsState.val, 'string')) {
      try {
        alertsRules = JSON.parse(alertsState.val, JSONReviverWithMap);
      } catch (err) {
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
  if (typeOf(alerts, 'object') && Object.keys(alerts).length > 0) {
    alertsRules = objectDeepClone(alerts);
    const stringValue = JSON.stringify(alerts, JSONReplacerWithMap);
    if (existsState(alertsStateFullId)) {
      setState(alertsStateFullId, stringValue, true);
    } else {
      logs(
        `id = ${alertsStateFullId}, value = ${stringValue},  attr = ${cachedValuesStatesCommonAttributes[idAlerts]}`,
      );
      createState(alertsStateFullId, stringValue, cachedValuesStatesCommonAttributes[idAlerts]);
    }
  }
}

/**
 * This function is used to store the current `value` of monitored `state`.
 * @param {string} alertStateId - Id of the `state`, monitored for alerts.
 * @param {any=} currentValue  - Current state `value`. If not defined - will be read from `state`.
 */
function alertsStoreStateValue(alertStateId, currentValue) {
  // logs(`alertStateId = ${alertStateId}, currentValue = ${currentValue}`, _l)
  if (currentValue === undefined) {
    if (existsState(alertStateId)) {
      currentValue = getState(alertStateId).val;
    }
  }
  const alerts = alertsGet();
  if (currentValue !== undefined && alerts.hasOwnProperty(alertStateId)) {
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
    if (
      alerts[alertId].chatIds.has(user.chatId) &&
      (JSON.stringify(alerts[alertId].chatIds.get(user.chatId)) === JSON.stringify(alertDetailsOrThresholds) ||
        JSON.stringify(alertDetailsOrThresholds) === '{}')
    ) {
      if (alerts[alertId].chatIds.size === 1) {
        delete alerts[alertId];
        unsubscribe(alertId);
      } else {
        alerts[alertId].chatIds.delete(user.chatId);
      }
    } else if (alertFunc) {
      alerts[alertId].chatIds.set(user.chatId, alertDetailsOrThresholds);
    }
  } else if (alertFunc && alertDest) {
    const chatsMap = new Map();
    chatsMap.set(user.chatId, alertDetailsOrThresholds);
    alerts[alertId] = {function: alertFunc, destination: alertDest, chatIds: chatsMap};
    on({id: alertId, change: 'ne'}, alertsActionOnSubscribedState);
  }
  logs(`alerts = ${JSON.stringify(alerts)}`);
  cachedValueDelete(user, cachedAlertThresholdSet);
  cachedValueDelete(user, cachedAlertsListPrepared);
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
  if (
    alerts &&
    menuItemToProcess.hasOwnProperty('options') &&
    menuItemToProcess.options.hasOwnProperty('state') &&
    alerts.hasOwnProperty(menuItemToProcess.options.state) &&
    alerts[menuItemToProcess.options.state].chatIds.has(user.chatId)
  )
    return iconItemAlertOn;
  return iconItemAlertOff;
}

/**
 * This function is used to load stored alerts and subscribe on appropriate states changes.
 * @param {boolean=} checkStates - The selector, to define, will the previous values be checked.
 */
function alertsInit(checkStates = false) {
  const alerts = alertsGet();
  // console.log(`alerts = ${JSON.stringify(alerts)}`);
  const statesToSubscribe = Object.keys(alerts),
    currentSubscriptions = getSubscriptions(),
    currentlySubscribedStates = Object.keys(currentSubscriptions)
      .filter((stateId) => currentSubscriptions[stateId].filter((handler) => handler.name === scriptName).length)
      .filter((stateId) => !stateId.includes(telegramAdapter))
      .filter((stateId) => !stateId.includes(prefixPrimary));
  // logs(`currentlySubscribedStates, length = ${currentlySubscribedStates.length}, list = ${JSON.stringify(currentlySubscribedStates)}`, _l);
  statesToSubscribe.forEach((stateId) => {
    if (!currentlySubscribedStates.includes(stateId)) {
      // logs(`subscribe on ${stateId}`, _l);
      if (existsState(stateId)) on({id: stateId, change: 'ne'}, alertsActionOnSubscribedState);
    }
  });
  currentlySubscribedStates.forEach((stateId) => {
    if (!statesToSubscribe.includes(stateId)) {
      // logs(`unsubscribe on ${stateId}`, _l);
      unsubscribe(stateId);
    }
  });
  onMessageUnregister(extensionSendAlertToTelegramCommand);
  // @ts-ignore
  onMessage(extensionSendAlertToTelegramCommand, alertsOnAlertToTelegram);
  if (checkStates && configOptions.getOption(cfgCheckAlertStatesOnStartUp)) {
    statesToSubscribe.forEach((stateId) => {
      if (alerts[stateId].hasOwnProperty('value') && existsState(stateId)) {
        const currentValue = getState(stateId).val,
          oldValue = alerts[stateId].value;
        if (currentValue !== undefined && currentValue !== oldValue) {
          alertsActionOnSubscribedState({id: stateId, state: {val: currentValue}, oldState: {val: oldValue}});
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
function alertsMessagePush(user, alertId, alertMessage, isAcknowledged = false) {
  logs(`user = ${JSON.stringify(user)}`);
  logs(`id = ${JSON.stringify(alertId)}`);
  logs(`alertMessage = ${JSON.stringify(alertMessage)}`);
  const alertMessages = alertsHistoryClearOld(user);
  alertMessages.push({
    ack: isAcknowledged ? true : false,
    id: alertId,
    message: alertMessage,
    // @ts-ignore
    date: new Date().valueOf(),
  });
  alertsStoreMessagesToCache(user, alertMessages);
  const itemPos = cachedValueGet(user, cachedMenuItem),
    isMenuOn = cachedValueGet(user, cachedMenuOn),
    [_lastUserMessageId, isUserMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
      user,
      cachedBotSendMessageId,
      timeDelta96,
    );
  if (isMenuOn && itemPos && !isUserMessageOldOrNotExists && !isAcknowledged) {
    menuMenuItemsAndRowsClearCached(user);
    menuMenuDraw(user, undefined, {clearBefore: true});
  }
}

/**
 * This function returns an Array of all cached messages for the current user of chat group.
 * @param {object} user - The user object.
 * @param {boolean=} nonAcknowledged - The selector to filter only unacknowledged messages.
 * @returns {object[]} The array of alert messages.
 */
function alertGetMessages(user, nonAcknowledged = false) {
  const alertMessages = cachedValueExists(user, cachedAlertMessages) ? cachedValueGet(user, cachedAlertMessages) : [];
  return nonAcknowledged ? alertMessages.filter((alertMessage) => !alertMessage.ack) : alertMessages;
}

/**
 * This function stores the alert messages for the user or group chat to the cache.
 * @param {object} user - The user object.
 * @param {object[]} alertMessages - The array of alert messages.
 */
function alertsStoreMessagesToCache(user, alertMessages) {
  if (!typeOf(alertMessages, 'array')) {
    alertMessages = [];
  }
  cachedValueSet(user, cachedAlertMessages, alertMessages);
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
    let result = '',
      postProcess = '';
    if (stringToProcess.includes('.')) [stringToProcess, postProcess] = stringToProcess.split('.');
    const translations = stringToProcess.match(/^translations\((\S+?)\)$/);
    if (translations && typeOf(translations, 'array') && translations.length === 2) {
      result = translationsItemTextGet(user, translations[1]);
    } else if (variables.hasOwnProperty(stringToProcess)) {
      result = `${variables[stringToProcess]}`;
    } else if (stringToProcess.includes('?') && stringToProcess.includes(':')) {
      const ifClause = stringToProcess.match(/^(\w+?)\?(.*?)\:(.*?)$/);
      if (ifClause && typeOf(ifClause, 'array') && ifClause.length === 4 && variables.hasOwnProperty(ifClause[1])) {
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
function alertsActionOnSubscribedState(object) {
  const alerts = alertsGet(),
    activeChatGroups = telegramGetGroupChats(true),
    objectId = object.id;
  if (alerts !== undefined && alerts.hasOwnProperty(objectId)) {
    // logs(`alerts[${obj.id}] = ${JSON.stringify(alerts[obj.id])}`);
    const alertObject = getObjectEnriched(objectId, '*'),
      alertDestinationId = alerts[objectId].destination,
      alertFunctionId = alerts[objectId].function,
      functionsList = enumerationsList[dataTypeFunction].list,
      alertFunction =
        functionsList && functionsList.hasOwnProperty(alertFunctionId) ? functionsList[alertFunctionId] : undefined;
    if (alertFunction) {
      const alertStateSectionsCount = alertFunction.statesSectionsCount,
        alertStateShortId = objectId.split('.').slice(-alertStateSectionsCount).join('.'),
        isAlertStatePrimary = alertFunction && alertStateShortId === alertFunction.state,
        alertFunctionDeviceButtonsAndAttributes = {...alertFunction.deviceAttributes, ...alertFunction.deviceButtons},
        convertValueCode = alertFunctionDeviceButtonsAndAttributes.hasOwnProperty(alertStateShortId)
          ? alertFunctionDeviceButtonsAndAttributes[alertStateShortId].convertValueCode
          : '',
        alertStateType = alertObject.common['type'];
      if (configOptions.getOption(cfgCheckAlertStatesOnStartUp)) alertsStoreStateValue(objectId, object.state.val);
      alerts[objectId].chatIds.forEach((detailsOrThresholds, chatId) => {
        chatId = Number(chatId);
        const user =
          chatId > 0 ? telegramGenerateUserObjectFromId(chatId) : telegramGenerateUserObjectFromId(undefined, chatId);
        if (chatId > 0 || activeChatGroups.includes(chatId)) {
          let currentState = cachedValueGet(user, cachedCurrentState);
          logs(`make an menu alert for = ${JSON.stringify(user)} on state ${JSON.stringify(objectId)}`);
          const currentStateValue = enumerationsEvaluateValueConversionCode(user, object.state.val, convertValueCode),
            oldStateValue = enumerationsEvaluateValueConversionCode(user, object.oldState.val, convertValueCode),
            alertStateValue = enumerationsStateValueDetails(user, alertObject, alertFunctionId, object.state)[
              'valueString'
            ],
            _alertStateOldValue = enumerationsStateValueDetails(user, alertObject, alertFunctionId, object.oldState)[
              'valueString'
            ],
            alertDeviceName = translationsGetObjectName(
              user,
              objectId.split('.').slice(0, -alertStateSectionsCount).join('.'),
              alertFunctionId,
              alertDestinationId,
            ),
            alertStateName = isAlertStatePrimary ? '' : translationsGetObjectName(user, alertObject, alertFunctionId),
            alertDestinationName = translationsGetEnumName(
              user,
              dataTypeDestination,
              alertDestinationId,
              enumerationsNamesInside,
            ),
            alertFunctionName = translationsGetEnumName(user, dataTypeFunction, alertFunctionId, enumerationsNamesMain),
            alertMessageValues = {
              alertFunctionName,
              alertDeviceName,
              alertDestinationName,
              alertStateName,
              alertStateValue,
            };
          logs(`alertDestId = ${alertDestinationId}, alertDestName = ${JSON.stringify(alertDestinationName)}`);
          if (
            alertStateType === 'boolean' ||
            (alertObject.common.hasOwnProperty('states') && ['string', 'number'].includes(alertStateType))
          ) {
            const alertMessageTemplate = detailsOrThresholds.hasOwnProperty(alertMessageTemplateId)
                ? detailsOrThresholds[alertMessageTemplateId]
                : configOptions.getOption(cfgAlertMessageTemplateMain, user),
              onTimeInterval = detailsOrThresholds.hasOwnProperty(onTimeIntervalId)
                ? detailsOrThresholds[onTimeIntervalId]
                : 0,
              idStoredTimerOn = [objectId, chatId, 'timerOn'].join(itemsDelimiter),
              idStoredTimerValue = [objectId, chatId, 'timerValue'].join(itemsDelimiter),
              storedTimerOn = alertsStoredVariables.has(idStoredTimerOn)
                ? alertsStoredVariables.get(idStoredTimerOn)
                : undefined,
              [storedTimerValue, storedTimerOldValue] =
                storedTimerOn && alertsStoredVariables.has(idStoredTimerValue)
                  ? alertsStoredVariables.get(idStoredTimerValue)
                  : [undefined, undefined],
              alertMessageText = alertsProcessMessageTemplate(user, alertMessageTemplate, alertMessageValues);
            if (onTimeInterval) {
              if (storedTimerOn) {
                if (currentStateValue !== storedTimerValue) {
                  clearTimeout(storedTimerOn);
                  alertsStoredVariables.delete(idStoredTimerOn);
                  alertsStoredVariables.delete(idStoredTimerValue);
                }
              }
              if (storedTimerOn === undefined || currentStateValue !== storedTimerOldValue) {
                alertsStoredVariables.set(idStoredTimerValue, [currentStateValue, oldStateValue]);
                alertsStoredVariables.set(
                  idStoredTimerOn,
                  setTimeout(() => {
                    alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
                    alertsStoredVariables.delete(idStoredTimerOn);
                    alertsStoredVariables.delete(idStoredTimerValue);
                  }, onTimeInterval * 1000),
                );
              }
            } else {
              alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
            }
          } else if (alertStateType === 'number' && Object.keys(detailsOrThresholds).length) {
            const alertDefaultTemplate = configOptions.getOption(cfgAlertMessageTemplateThreshold, user);
            Object.keys(detailsOrThresholds)
              .sort((thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB))
              .forEach((alertThresholdValue) => {
                const currentThreshold = detailsOrThresholds[alertThresholdValue],
                  onAbove = currentThreshold.onAbove,
                  onLess = currentThreshold.onLess,
                  thresholdValue = Number(alertThresholdValue),
                  onTimeInterval = currentThreshold.hasOwnProperty(onTimeIntervalId)
                    ? currentThreshold[onTimeIntervalId]
                    : 0,
                  idStoredTimerOn = [objectId, chatId, alertThresholdValue, 'timerOn'].join(itemsDelimiter),
                  idStoredTimerStatus = [objectId, chatId, alertThresholdValue, 'timerStatus'].join(itemsDelimiter),
                  storedTimerOn = alertsStoredVariables.has(idStoredTimerOn)
                    ? alertsStoredVariables.get(idStoredTimerOn)
                    : undefined,
                  storedTimerStatus =
                    storedTimerOn && alertsStoredVariables.has(idStoredTimerStatus)
                      ? alertsStoredVariables.get(idStoredTimerStatus)
                      : 0,
                  isLess =
                    currentStateValue < thresholdValue &&
                    (oldStateValue >= thresholdValue || (storedTimerOn && storedTimerStatus > 0)),
                  isAbove =
                    currentStateValue >= thresholdValue &&
                    (oldStateValue < thresholdValue || (storedTimerOn && storedTimerStatus < 0)),
                  alertMessageTemplate = currentThreshold.hasOwnProperty(alertMessageTemplateId)
                    ? currentThreshold[alertMessageTemplateId]
                    : alertDefaultTemplate;
                alertMessageValues['alertThresholdIcon'] = isLess ? iconItemLess : iconItemAbove;
                alertMessageValues['alertThresholdValue'] = alertThresholdValue;
                const alertMessageText = alertsProcessMessageTemplate(user, alertMessageTemplate, alertMessageValues);
                if (onTimeInterval) {
                  if (storedTimerOn) {
                    const currentTimerStatus =
                      storedTimerStatus + (storedTimerStatus > 0 ? (isLess ? -1 : 0) : isAbove ? 1 : 0);
                    if (currentTimerStatus === 0 && storedTimerStatus !== 0) {
                      clearTimeout(storedTimerOn);
                      alertsStoredVariables.delete(idStoredTimerOn);
                      alertsStoredVariables.delete(idStoredTimerStatus);
                    }
                  } else {
                    const currentTimerStatus = isLess && onLess ? -1 : isAbove && onAbove ? 1 : 0;
                    if (currentTimerStatus !== 0) {
                      const alertMessageDelayed = () => {
                        alertsStoredVariables.delete(idStoredTimerOn);
                        alertsStoredVariables.delete(idStoredTimerStatus);
                        alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
                      };
                      alertsStoredVariables.set(idStoredTimerStatus, currentTimerStatus);
                      alertsStoredVariables.set(
                        idStoredTimerOn,
                        setTimeout(alertMessageDelayed, onTimeInterval * 1000),
                      );
                    }
                  }
                } else if (isLess || isAbove) {
                  alertsMessagePush(user, objectId, alertMessageText, objectId === currentState);
                }
              });
          }
        } else {
          logs(`Current chatId = ${chatId} is belong to non active chat`);
        }
      });
    }
  }
}

/**
 * This function called when the message with id `alertToTelegram` from `extensions` is come.
 * @param {object} data - Contains target user, extension Id and message text.
 * @param {function} callback - Standard callback to call on success.
 */
function alertsOnAlertToTelegram(data, callback) {
  const {user, id, alertMessage} = data,
    userObject =
      typeOf(user, 'object') && (user.hasOwnProperty('userId') || user.hasOwnProperty('chatId'))
        ? user
        : Number(user) > 0
        ? telegramGenerateUserObjectFromId(Number(user))
        : telegramGenerateUserObjectFromId(undefined, Number(user));
  alertsMessagePush(userObject, id, alertMessage);
  callback({success: true});
}

/**
 * This function generates a submenu with all alerts in the history of current user.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function alertsMenuGenerateHistoryOfAlerts(user, menuItemToProcess) {
  const alertMessages = alertGetMessages(user),
    alertMessagesMaxIndex = alertMessages.length - 1,
    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    alertMessageAcknowledge = (user, menuItemToProcess) => {
      const {item: alertIndex} = menuItemToProcess.options,
        alertMessages = alertGetMessages(user),
        alertMessage = alertMessages[alertIndex];
      if (!alertMessage.ack) {
        alertMessage.ack = true;
        alertsStoreMessagesToCache(user, alertMessages);
        menuMenuItemsAndRowsClearCached(user);
        setTimeout(() => {
          menuMenuDraw(user);
        }, 10);
      }
      return [];
    };
  let subMenu = [],
    subMenuIndex = 0;
  if (alertMessagesMaxIndex >= 0) {
    for (let alertIndex = alertMessagesMaxIndex; alertIndex >= 0; alertIndex--) {
      const alertMessage = alertMessages[alertIndex],
        alertDate = formatDate(new Date(alertMessage.date), configOptions.getOption(cfgDateTimeTemplate, user));
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${alertDate}: ${alertMessage.message}`,
        icon: alertMessage.ack ? iconItemAlertOff : iconItemAlertOn,
        options: {[menuOptionHorizontalNavigation]: true, item: alertIndex},
        function: alertMessageAcknowledge,
        submenu: [],
      });
    }
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
  const oldestDate = new Date(),
    noInput = alertsMessages === undefined;
  alertsMessages = noInput ? alertGetMessages(user) : alertsMessages;
  oldestDate.setHours(oldestDate.getHours() - configOptions.getOption(cfgAlertMessagesHistoryDepth, user));
  const oldestDateNumber = oldestDate.valueOf();
  alertsMessages =
    alertsMessages !== undefined ? alertsMessages.filter((alertsMessage) => alertsMessage.date > oldestDateNumber) : [];
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
  const alertsList = alertsGet(),
    destinationsList = enumerationsList[dataTypeDestination].list,
    functionsList = enumerationsList[dataTypeFunction].list,
    currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    currentAccessLevel = menuItemToProcess.accessLevel,
    _isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {function: currentFunctionId, destination: currentDestinationId, item: currentDeviceId} = menuItemToProcess.options,
    levelFirstId = isFunctionsFirst ? currentFunctionId : currentDestinationId,
    levelSecondId = isFunctionsFirst ? currentDestinationId : currentFunctionId;
  let alertsListPrepared = {},
    subMenu = [];
  if (alertsList && Object.keys(alertsList).length) {
    if (cachedValueExists(user, cachedAlertsListPrepared)) {
      alertsListPrepared = cachedValueGet(user, cachedAlertsListPrepared);
    } else {
      Object.keys(alertsList).forEach((alertId) => {
        if (alertsList[alertId].chatIds.has(user.chatId) && existsObject(alertId)) {
          const alertObject = getObjectEnriched(alertId),
            alertFuncId = alertsList[alertId].function,
            alertDestId = alertsList[alertId].destination,
            alertFirstLevelId = isFunctionsFirst ? alertFuncId : alertDestId,
            alertSecondLevelId = isFunctionsFirst ? alertDestId : alertFuncId,
            currentFunction = functionsList[alertFuncId],
            currentFunctionStateParts = currentFunction.statesSectionsCount;
          if (alertObject && (!levelFirstId || alertFirstLevelId.indexOf(levelFirstId) === 0)) {
            if (!alertsListPrepared.hasOwnProperty(alertFirstLevelId)) alertsListPrepared[alertFirstLevelId] = {};
            if (!levelSecondId || alertSecondLevelId.indexOf(levelSecondId) === 0) {
              if (!alertsListPrepared[alertFirstLevelId].hasOwnProperty(alertSecondLevelId))
                alertsListPrepared[alertFirstLevelId][alertSecondLevelId] = {};
              const alertTopId = alertId.split('.').slice(0, -currentFunctionStateParts).join('.'),
                alertIdShort = alertId.replace(`${alertTopId}.`, '');
              if (!alertsListPrepared[alertFirstLevelId][alertSecondLevelId].hasOwnProperty(alertTopId)) {
                alertsListPrepared[alertFirstLevelId][alertSecondLevelId][alertTopId] = {
                  name: translationsGetObjectName(user, alertTopId, alertFuncId, alertDestId),
                };
              }
              alertsListPrepared[alertFirstLevelId][alertSecondLevelId][alertTopId][alertId] =
                translationsGetObjectName(
                  user,
                  alertIdShort === functionsList[alertFuncId].state ? translationsPrimaryStateId : alertObject,
                  alertFuncId,
                );
            }
          }
        }
      });
      if (!levelFirstId && !levelSecondId) {
        cachedValueSet(user, cachedAlertsListPrepared, alertsListPrepared);
        cachedAddToDelCachedOnBack(user, currentIndex.split('.').slice(0, -1).join('.'), cachedAlertsListPrepared);
      }
    }
    if (alertsListPrepared && Object.keys(alertsListPrepared).length) {
      let levelMenuIndex = 0;
      const levelFirstList = isFunctionsFirst ? functionsList : destinationsList,
        isLevelFirstIdHolder = levelFirstId && !levelFirstId.includes('.'),
        isLevelSecondIdHolder = levelSecondId && !levelSecondId.includes('.'),
        levelFirstType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
        levelSecondType = isFunctionsFirst ? dataTypeDestination : dataTypeFunction,
        levelFirstEnum = isFunctionsFirst ? 'function' : 'destination',
        levelSecondEnum = isFunctionsFirst ? 'destination' : 'function';
      if ((!levelFirstId || isLevelFirstIdHolder) && !levelSecondId && currentDeviceId === undefined) {
        const levelFirstProceed = [];
        Object.keys(levelFirstList)
          .filter((levelId) => levelFirstList[levelId].isEnabled && levelFirstList[levelId].isAvailable)
          .filter(
            (levelId) =>
              !levelFirstId ||
              (isLevelFirstIdHolder && levelId !== levelFirstId && levelId.indexOf(levelFirstId) === 0),
          )
          .sort((a, b) => levelFirstList[a].order - levelFirstList[b].order)
          .forEach((alertLevel) => {
            if (alertsListPrepared.hasOwnProperty(alertLevel)) {
              if (!isLevelFirstIdHolder) alertLevel = `${alertLevel.split('.').shift()}`;
              if (!levelFirstProceed.includes(alertLevel)) {
                levelMenuIndex = subMenu.push({
                  index: `${currentIndex}.${levelMenuIndex}`,
                  name: `${translationsGetEnumName(user, levelFirstType, alertLevel)}`,
                  icon: levelFirstList[alertLevel].icon,
                  options: {[levelFirstEnum]: alertLevel},
                  accessLevel: currentAccessLevel,
                  submenu: alertsMenuGenerateSubscribed,
                });
                levelFirstProceed.push(alertLevel);
              }
            }
          });
      }
      if (levelFirstId && (!levelSecondId || isLevelSecondIdHolder) && currentDeviceId === undefined) {
        const levelSecondList = isFunctionsFirst ? destinationsList : functionsList,
          alertsSecondLevelList = alertsListPrepared[levelFirstId],
          levelSecondProceed = [];
        if (alertsSecondLevelList)
          Object.keys(levelSecondList)
            .filter((levelId) => levelSecondList[levelId].isEnabled && levelSecondList[levelId].isAvailable)
            .filter(
              (levelId) =>
                !levelSecondId ||
                (isLevelSecondIdHolder && levelId !== levelSecondId && levelId.indexOf(levelSecondId) === 0),
            )
            .sort((a, b) => levelSecondList[a].order - levelSecondList[b].order)
            .forEach((alertLevel) => {
              if (alertsSecondLevelList.hasOwnProperty(alertLevel)) {
                if (!isLevelSecondIdHolder) alertLevel = `${alertLevel.split('.').shift()}`;
                if (!levelSecondProceed.includes(alertLevel)) {
                  levelMenuIndex = subMenu.push({
                    index: `${currentIndex}.${levelMenuIndex}`,
                    name: `${translationsGetEnumName(user, levelSecondType, alertLevel)}`,
                    options: {
                      [levelFirstEnum]: levelFirstId,
                      [levelSecondEnum]: alertLevel,
                    },
                    accessLevel: currentAccessLevel,
                    submenu: alertsMenuGenerateSubscribed,
                  });
                  levelSecondProceed.push(alertLevel);
                }
              }
            });
      }
      if (levelFirstId && levelSecondId && currentDeviceId === undefined) {
        const objectsIdList = alertsListPrepared[levelFirstId][levelSecondId];
        if (objectsIdList)
          Object.keys(objectsIdList)
            .sort()
            .forEach((objectId) => {
              levelMenuIndex = subMenu.push({
                index: `${currentIndex}.${levelMenuIndex}`,
                name: `${objectsIdList[objectId]['name']}`,
                icon: menuItemToProcess.icon,
                accessLevel: currentAccessLevel,
                options: {function: currentFunctionId, destination: currentDestinationId, item: objectId},
                submenu: alertsMenuGenerateSubscribed,
              });
            });
      } else if (levelFirstId && levelSecondId) {
        let alertMenuIndex = 0;
        const alertsIdList = alertsListPrepared[levelFirstId][levelSecondId][currentDeviceId],
          currentFunction = functionsList[currentFunctionId],
          deviceAttributesList = currentFunction.deviceAttributes,
          currentDeviceAttributes = deviceAttributesList
            ? Object.keys(deviceAttributesList).sort(
                (a, b) => deviceAttributesList[a].order - deviceAttributesList[b].order,
              )
            : [],
          deviceButtonsList = currentFunction.deviceButtons,
          currentDeviceButtons = deviceButtonsList
            ? Object.keys(deviceButtonsList).sort((a, b) => deviceButtonsList[a].order - deviceButtonsList[b].order)
            : [],
          currentDeviceStates = [...currentDeviceAttributes, ...currentDeviceButtons],
          deviceStatesProceed = [];
        currentDeviceStates.forEach((deviceState) => {
          const alertId = [currentDeviceId, deviceState].join('.');
          if (alertsIdList.hasOwnProperty(alertId) && !deviceStatesProceed.includes(alertId)) {
            deviceStatesProceed.push(alertId);
            alertMenuIndex = subMenu.push(
              alertsMenuItemGenerateSubscribedOn(
                `${currentIndex}.${alertMenuIndex}`,
                alertsIdList[alertId],
                {function: currentFunctionId, destination: currentDestinationId, state: alertId},
                undefined,
                true,
              ),
            );
          }
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
function alertsGetStateAlertDetailsOrThresholds(user, alertId, returnBoth = false) {
  const alerts = alertsGet(),
    currentStateAlert = alerts.hasOwnProperty(alertId) ? alerts[alertId] : undefined,
    currentStateAlertThresholds =
      currentStateAlert &&
      currentStateAlert.hasOwnProperty('chatIds') &&
      currentStateAlert.chatIds &&
      currentStateAlert.chatIds.has(user.chatId)
        ? objectDeepClone(currentStateAlert.chatIds.get(user.chatId))
        : {},
    currentThresholds = cachedValueExists(user, cachedAlertThresholdSet)
      ? cachedValueGet(user, cachedAlertThresholdSet)
      : currentStateAlertThresholds;
  return returnBoth ? [currentThresholds, currentStateAlertThresholds] : currentThresholds;
}

/**
 * This function generate a menu item with related submenu to conduct an alert
 * subscription management for the appropriate ioBroker state (`itemState`).
 * @param {string} itemIndex - The positional index for new menu item.
 * @param {string} itemName - The name of the new menu item.
 * @param {object} itemOptions - The menu item object options.
 * @param {object=} itemStateObject - The related ioBroker state object (can be `undefined`).
 * @param {boolean=} isExtraMenu - The selector to show more detailed params.
 * @returns {object} Menu item object.
 */
function alertsMenuItemGenerateSubscribedOn(itemIndex, itemName, itemOptions, itemStateObject, isExtraMenu = false) {
  let menuItem;
  const itemState = itemOptions.state;
  if (itemStateObject === undefined || itemStateObject === null) itemStateObject = getObjectEnriched(itemState);
  if (itemStateObject && itemStateObject.hasOwnProperty('common') && itemStateObject.common) {
    const itemStateType = itemStateObject.common['type'];
    menuItem = {
      index: itemIndex,
      name: itemName,
      icons: alertsGetIcon,
      group: 'alerts',
      command: cmdAlertSubscribe,
      options: itemOptions,
    };
    let isNumericString = false;
    if (configOptions.getOption(cfgThresholdsForNumericString)) {
      if (itemStateType === 'string' && !itemStateObject.common.hasOwnProperty('states')) {
        const currentState = getState(itemState),
          currentStateValue = currentState !== undefined ? currentState.val : undefined,
          currentStateNumeric = currentState !== undefined ? Number(currentStateValue) : NaN;
        isNumericString =
          !isNaN(currentStateNumeric) &&
          `${currentStateNumeric}` === currentStateValue.slice(0, `${currentStateNumeric}`.length);
      }
    }
    if (
      itemStateType === 'boolean' ||
      (itemStateObject.common.hasOwnProperty('states') && ['string', 'number'].includes(itemStateType))
    ) {
      if (isExtraMenu) {
        menuItem['submenu'] = alertsMenuGenerateManageBoolean;
        menuItem['command'] = cmdEmptyCommand;
      } else {
        menuItem['submenu'] = [];
      }
    } else if (itemStateType === 'number' || isNumericString) {
      menuItem['submenu'] = alertsMenuGenerateManageNumeric;
      menuItem['command'] = cmdEmptyCommand;
    } else {
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
function alertsMenuGenerateManageBoolean(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentName = menuItemToProcess.name,
    {function: currentFunctionId, destination: currentDestinationId, state: currentStateId} = menuItemToProcess.options,
    alerts = alertsGet(),
    alertIsOn = alerts && alerts.hasOwnProperty(currentStateId) && alerts[currentStateId].chatIds.has(user.chatId),
    [currentAlertDetails, currentStateAlertDetails] = alertIsOn
      ? alertsGetStateAlertDetailsOrThresholds(user, currentStateId, true)
      : [{}, {}],
    currentOnTimeInterval = `${
      currentAlertDetails.hasOwnProperty(onTimeIntervalId) ? currentAlertDetails[onTimeIntervalId] : 0
    } ${translationsItemTextGet(user, 'secondsShort')}`,
    currentMessageTemplate = currentAlertDetails.hasOwnProperty(alertMessageTemplateId)
      ? currentAlertDetails[alertMessageTemplateId]
      : configOptions.getOption(cfgAlertMessageTemplateMain, user);
  let subMenu = [],
    subMenuIndex = 0;
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateEditItem(
      user,
      currentIndex,
      subMenuIndex,
      `${translationsItemTextGet(user, onTimeIntervalId)} {${currentOnTimeInterval}}`,
      '',
      {
        dataType: dataTypeAlertSubscribed,
        state: currentStateId,
        index: -1,
        item: onTimeIntervalId,
        value: currentOnTimeInterval,
      },
    ),
  );
  const currentCommandOptions = {
    dataType: dataTypeAlertSubscribed,
    state: currentStateId,
    index: -1,
    item: alertMessageTemplateId,
    value: currentMessageTemplate,
  };
  subMenuIndex = subMenu.push({
    index: `${currentIndex}.${subMenuIndex}`,
    name: `${translationsItemTextGet(user, alertMessageTemplateId)}${
      currentAlertDetails.hasOwnProperty(alertMessageTemplateId) ? '' : `(${translationsItemTextGet(user, 'global')}})`
    }`,
    icon: iconItemEdit,
    group: alertMessageTemplateId,
    submenu: [
      menuMenuItemGenerateEditItem(
        user,
        `${currentIndex}.${subMenuIndex}`,
        0,
        `${translationsItemTextGet(user, alertMessageTemplateId)}`,
        'edit',
        currentCommandOptions,
      ),
      menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, 1, currentCommandOptions),
    ],
  });
  const isAlertDetailsSetChanged = JSON.stringify(currentStateAlertDetails) !== JSON.stringify(currentAlertDetails);
  subMenuIndex = subMenu.push({
    index: `${currentIndex}.${subMenuIndex}`,
    name: `${currentName}${isAlertDetailsSetChanged ? ` (${iconItemEdit})` : ''}`,
    icons: alertsGetIcon,
    group: cmdItemsProcess,
    command: cmdAlertSubscribe,
    options: {function: currentFunctionId, destination: currentDestinationId, state: currentStateId},
    submenu: [],
  });
  if (!isAlertDetailsSetChanged && alertIsOn) {
    subMenu.push(
      alertMenuItemGenerateAlertPropagation(
        user,
        currentIndex,
        subMenuIndex,
        currentStateId,
        currentFunctionId,
        currentDestinationId,
      ),
    );
  }
  return subMenu;
}

/**
 * This function generates a submenu to manage thresholds, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateManageNumeric(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentName = menuItemToProcess.name,
    {function: currentFunctionId, destination: currentDestinationId, state: currentStateId} = menuItemToProcess.options,
    currentStateObject = getObjectEnriched(currentStateId),
    currentStateUnits =
      currentStateObject &&
      currentStateObject.hasOwnProperty('common') &&
      currentStateObject.common &&
      currentStateObject.common.hasOwnProperty('unit') &&
      currentStateObject.common.unit
        ? ` ${currentStateObject.common.unit}`
        : '',
    [currentThresholds, currentStateAlertThresholds] = alertsGetStateAlertDetailsOrThresholds(
      user,
      currentStateId,
      true,
    );
  let subMenu = [],
    subMenuIndex = 0;
  Object.keys(currentThresholds)
    .sort((thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB))
    .forEach((currentThresholdNumber) => {
      const currentThreshold = currentThresholds[currentThresholdNumber],
        currentOnTimeInterval = `${
          currentThreshold.hasOwnProperty(onTimeIntervalId) ? currentThreshold[onTimeIntervalId] : 0
        } ${translationsItemTextGet(user, 'secondsShort')}`,
        currentThresholdMessageTemplate = currentThreshold.hasOwnProperty(alertMessageTemplateId)
          ? currentThreshold[alertMessageTemplateId]
          : configOptions.getOption(cfgAlertMessageTemplateThreshold, user),
        subMenuItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${currentThresholdNumber}${currentStateUnits} [${currentThreshold.onAbove ? iconItemAbove : ''}${
            currentThreshold.onLess ? iconItemLess : ''
          }](${currentOnTimeInterval})`,
          icon: iconItemEdit,
          submenu: new Array(),
        };
      let subSubMenuIndex = 0;
      subSubMenuIndex = subMenuItem.submenu.push(
        menuMenuItemGenerateEditItem(
          user,
          `${currentIndex}.${subMenuIndex}`,
          subSubMenuIndex,
          `${currentThresholdNumber}${currentStateUnits}`,
          'value',
          {
            dataType: dataTypeAlertSubscribed,
            state: currentStateId,
            index: subMenuIndex,
            item: alertThresholdId,
            value: currentThresholdNumber,
          },
        ),
      );
      subSubMenuIndex = subMenuItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
        name: `${currentThresholdNumber}${currentStateUnits} ${iconItemAbove}`,
        icon: currentThreshold.onAbove
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command:
          currentThreshold.onAbove === currentThreshold.onLess || !currentThreshold.onAbove
            ? cmdItemPress
            : cmdNoOperation,
        options: {dataType: dataTypeAlertSubscribed, state: currentStateId, item: subMenuIndex, mode: 'onAbove'},
        submenu: [],
      });
      subSubMenuIndex = subMenuItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
        name: `${currentThresholdNumber}${currentStateUnits} ${iconItemLess}`,
        icon: currentThreshold.onLess
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command:
          currentThreshold.onAbove === currentThreshold.onLess || !currentThreshold.onLess
            ? cmdItemPress
            : cmdNoOperation,
        options: {dataType: dataTypeAlertSubscribed, state: currentStateId, item: subMenuIndex, mode: 'onLess'},
        submenu: [],
      });
      subSubMenuIndex = subMenuItem.submenu.push(
        menuMenuItemGenerateEditItem(
          user,
          `${currentIndex}.${subMenuIndex}`,
          subSubMenuIndex,
          `${translationsItemTextGet(user, onTimeIntervalId)} {${currentOnTimeInterval}}`,
          'thresholdOn',
          {
            dataType: dataTypeAlertSubscribed,
            state: currentStateId,
            index: subMenuIndex,
            item: onTimeIntervalId,
            value: currentOnTimeInterval,
          },
        ),
      );
      const currentCommandOptions = {
        dataType: dataTypeAlertSubscribed,
        state: currentStateId,
        index: subMenuIndex,
        item: alertMessageTemplateId,
        value: currentThresholdMessageTemplate,
      };
      subSubMenuIndex = subMenuItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
        name: `${translationsItemTextGet(user, alertMessageTemplateId)}${
          currentThreshold.hasOwnProperty(alertMessageTemplateId) ? '' : `(${translationsItemTextGet(user, 'global')}})`
        }`,
        icon: iconItemEdit,
        group: alertMessageTemplateId,
        submenu: [
          menuMenuItemGenerateEditItem(
            user,
            `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            0,
            `${translationsItemTextGet(user, alertMessageTemplateId)}`,
            'edit',
            currentCommandOptions,
          ),
          menuMenuItemGenerateDeleteItem(
            user,
            `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
            1,
            currentCommandOptions,
          ),
        ],
      });
      subMenuItem.submenu.push(
        menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, subSubMenuIndex, {
          dataType: dataTypeAlertSubscribed,
          state: currentStateId,
          index: subMenuIndex,
        }),
      );
      subMenuIndex = subMenu.push(subMenuItem);
    });
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateAddItem(user, currentIndex, subMenuIndex, {
      dataType: dataTypeAlertSubscribed,
      state: currentStateId,
      index: subMenuIndex,
      item: alertThresholdId,
    }),
  );
  const isThresholdsSetChanged = JSON.stringify(currentStateAlertThresholds) !== JSON.stringify(currentThresholds);
  if (isThresholdsSetChanged || Object.keys(currentStateAlertThresholds).length) {
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${currentName}${isThresholdsSetChanged ? ` (${iconItemEdit})` : ''}`,
      icons: alertsGetIcon,
      group: cmdItemsProcess,
      command: cmdAlertSubscribe,
      options: {function: currentFunctionId, destination: currentDestinationId, state: currentStateId},
      submenu: [],
    });
  }
  if (!isThresholdsSetChanged && Object.keys(currentStateAlertThresholds).length) {
    subMenu.push(
      alertMenuItemGenerateAlertPropagation(
        user,
        currentIndex,
        subMenuIndex,
        currentStateId,
        currentFunctionId,
        currentDestinationId,
      ),
    );
  }
  return subMenu;
}

/**
 * Generates menu item which options submenu to propagate current `Alert` configuration
 * to other `Devices`, inside one `Destination`, `Function`, `Destination` & `Function` or
 * on any `Device`, with the same `Attribute`.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {string} currentStateId - The current state ID.
 * @param {string} currentFunctionId - The current Function ID.
 * @param {string} currentDestinationId - The current Destination ID.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function alertMenuItemGenerateAlertPropagation(
  user,
  upperMenuItemIndex,
  subMenuItemIndex,
  currentStateId,
  currentFunctionId,
  currentDestinationId,
) {
  const subMenuItem = {
    index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
    name: `${translationsItemMenuGet(user, 'alertPropagate')}`,
    icon: '',
    group: 'propagate',
    submenu: new Array(),
  };
  let subSubMenuItemIndex = 0;
  alertPropagateDistributions.forEach((alertPropagateDistribution) => {
    const subSubMenuItem = {
      index: `${upperMenuItemIndex}.${subMenuItemIndex}.${subSubMenuItemIndex}`,
      name: `${translationsItemMenuGet(user, alertPropagateDistribution)}`,
      icon: '',
      submenu: new Array(),
    };
    let subSubSubMenuItemIndex = 0;
    alertPropagateOptions.forEach((alertPropagateOption) => {
      subSubSubMenuItemIndex = subSubMenuItem.submenu.push({
        index: `${upperMenuItemIndex}.${subMenuItemIndex}.${subSubMenuItemIndex}.${subSubSubMenuItemIndex}`,
        name: `${translationsItemMenuGet(user, alertPropagateOption)}`,
        icon: '',
        command: cmdItemsProcess,
        options: {
          dataType: dataTypeAlertSubscribed,
          range: alertPropagateDistribution,
          mode: alertPropagateOption,
          function: currentFunctionId,
          destination: currentDestinationId,
          state: currentStateId,
        },
        submenu: [],
      });
    });
    subSubMenuItemIndex = subMenuItem.submenu.push(subSubMenuItem);
  });
  return subMenuItem;
}

/**
 * This function generates a submenu with all possible attributes, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateExtraSubscription(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: currentFunctionId, destination: currentDestinationId} = options,
    currentAccessLevel = menuItemToProcess.accessLevel,
    horizontalNavigation = !cachedValueExists(user, cachedAlertThresholdSet);
  let subMenu = [],
    subMenuIndex = 0;
  const generateAlertSubscriptionMenuItem = (user, _stateId, stateIdFull, stateObject, _stateDetails, _options) => {
    const stateIndex = `${currentIndex}.${subMenuIndex}`,
      stateName = `${translationsGetObjectName(user, stateObject, currentFunctionId)}`,
      subMenuItem = alertsMenuItemGenerateSubscribedOn(
        stateIndex,
        stateName,
        {
          function: currentFunctionId,
          destination: currentDestinationId,
          state: stateIdFull,
          [menuOptionHorizontalNavigation]: horizontalNavigation,
        },
        stateObject,
        true,
      );
    if (subMenuItem) {
      subMenuIndex = subMenu.push(subMenuItem);
    }
  };
  const optionsToProcess = {...options, attributes: 'all', buttons: 'show'};
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsToProcess, generateAlertSubscriptionMenuItem);
  return subMenu;
}

//*** Alerts - end ***//

//*** Triggers - begin ***//

const triggersInAlertsId = 0,
  cachedTriggersDetails = 'triggersDetails';

function triggersGetStateSubType(stateId, stateObject) {
  let result = undefined;
  if (stateObject && stateObject.common) {
    const stateObjectCommon = stateObject.common,
      stateType = stateObjectCommon['type'];
    let isNumericString = false;
    if (configOptions.getOption(cfgThresholdsForNumericString)) {
      if (stateType === 'string' && !stateObjectCommon.hasOwnProperty('states')) {
        const currentState = getState(stateId),
          currentStateValue = currentState !== undefined ? currentState.val : undefined,
          currentStateNumeric = currentState !== undefined ? Number(currentStateValue) : NaN;
        isNumericString =
          !isNaN(currentStateNumeric) &&
          `${currentStateNumeric}` === currentStateValue.slice(0, `${currentStateNumeric}`.length);
      }
    }
    if (stateType === 'boolean') {
      result = 'boolean';
    } else if (stateObjectCommon.states && ['string', 'number'].includes(stateType)) {
      result = 'list';
    } else if (stateType === 'number' || isNumericString) {
      result = 'number';
    }
  }
  return result;
}

/**
 * This function generates a submenu with all possible attributes, on which the trigger can be made in the appropriate
 * menuItem of submenu.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerate(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId} = options,
    currentAccessLevel = menuItemToProcess.accessLevel,
    horizontalNavigation = !cachedValueExists(user, cachedTriggersDetails);
  let subMenu = [],
    subMenuIndex = 0;
  const generateTriggersMenuItem = (user, _stateId, stateIdFull, stateObject, stateDetails, _options) => {
      if (stateObject && stateObject.common) {
        const itemStateSubType = triggersGetStateSubType(stateIdFull, stateObject);
        if (itemStateSubType) {
          const stateIndex = `${currentIndex}.${subMenuIndex}`,
            stateName = `${translationsGetObjectName(user, stateObject, functionId)}`;
          subMenuIndex = subMenu.push({
            index: stateIndex,
            name: stateName,
            icons: triggersGetIcon,
            options: {
              function: functionId,
              destination: destinationId,
              state: stateIdFull,
              type: itemStateSubType,
              convertValueCode: stateDetails.convertValueCode,
              [menuOptionHorizontalNavigation]: horizontalNavigation,
            },
            submenu: triggersMenuGenerateManageState,
          });
        }
      }
    },
    optionsToProcess = {...options, attributes: 'all', buttons: 'show'};
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsToProcess, generateTriggersMenuItem);
  return subMenu;
}

/**
 * This function returns an triggers for the current stateId. If some temporary triggers is cached - it will return
 * an joint object.
 * If the selector `returnBoth` is true, the original and joint triggers will be returned as an array.
 * @param {object} user - The user object.
 * @param {string} stateId - The alert Id, i.e. an appropriate ioBroker state
 * full Id.
 * @param {boolean=} returnBoth - The selector to define the result format.
 * @returns {object|object[]} The thresholds of thresholds array.
 */
function triggersGetStateTriggers(user, stateId, returnBoth = false) {
  const alerts = alertsGet(),
    currentStateAlert = alerts.hasOwnProperty(stateId) ? alerts[stateId] : undefined,
    currentStateTriggers =
      currentStateAlert && currentStateAlert.chatIds && currentStateAlert.chatIds.has(triggersInAlertsId)
        ? objectDeepClone(currentStateAlert.chatIds.get(triggersInAlertsId))
        : [],
    currentTriggers = cachedValueExists(user, cachedTriggersDetails)
      ? cachedValueGet(user, cachedTriggersDetails)
      : currentStateTriggers;
  return returnBoth ? [currentTriggers, currentStateTriggers] : currentTriggers;
}

function triggersGetIndex(triggers, triggerId) {
  if (triggers && typeOf(triggers, 'array')) {
    return triggers.findIndex((trigger) => trigger.id === triggerId);
  }
  return false;
}

function triggersSort(triggers, sorted) {
  if (triggers && typeOf(triggers, 'array')) {
    triggers = triggers.sort((triggerA, triggerB) => {
      if (triggerA.type === 'number') {
        const valueCompare = triggerA.value - triggerB.value;
        if (valueCompare) {
          return valueCompare;
        } else {
          return triggerA.onAbove ? -1 : 1;
        }
      } else if (triggerA.type === 'boolean') {
        return triggerA.value ? -1 : 1;
      } else {
        if (sorted) {
          return sorted.indexOf(triggerA.value) - sorted.indexOf(triggerB.value);
        } else {
          if (typeOf(triggerA.value, 'number')) {
            return triggerA.value - triggerB.value;
          } else {
            return triggerA.value.localeCompare(triggerB.value);
          }
        }
      }
    });
  }
  return triggers;
}

/**
 * This function returns an icon, which show  if the any trigger is enabled for an appropriate `state`.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the icon wil be identified.
 * @returns {string} The one of icon : `iconItemAlertOff` or `iconItemAlertOn`.
 */
function triggersGetIcon(user, menuItemToProcess) {
  const alerts = alertsGet();
  if (
    alerts &&
    menuItemToProcess.hasOwnProperty('options') &&
    menuItemToProcess.options.hasOwnProperty('state') &&
    alerts.hasOwnProperty(menuItemToProcess.options.state) &&
    alerts[menuItemToProcess.options.state].chatIds.has(triggersInAlertsId)
  )
    return iconItemTrigger;
  return iconItemEmpty;
}

/**
 * This function returns an icon, which show  if the any trigger is enabled for an appropriate `state`.
 * @param {object} trigger - The menu item, for which the icon wil be identified.
 * @returns {string} The one of icon : `iconItemAlertOff` or `iconItemAlertOn`.
 */
function triggersGetEnabledIcon(trigger) {
  return trigger ? (trigger.enabled ? iconItemTrigger : iconItemDisabled) : iconItemEmpty;
}

/**
 * This function generates a submenu to manage triggers, which can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageState(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentName = menuItemToProcess.name,
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId, type: stateSubType} = options,
    stateObject = getObjectEnriched(stateId);
  let subMenu = [],
    subMenuIndex = 0;
  if (stateObject && stateObject.common) {
    const stateObjectCommon = stateObject.common,
      stateUnits = stateObjectCommon.unit ? ` ${stateObjectCommon.unit}` : '',
      [triggers, currentStateTriggers] = triggersGetStateTriggers(user, stateId, true),
      stateOptions = {
        dataType: dataTypeTrigger,
        function: functionId,
        destination: destinationId,
        state: stateId,
        type: stateSubType,
      };
    triggers.forEach((trigger) => {
      const onTimeInterval = `${
          trigger.hasOwnProperty(onTimeIntervalId) ? trigger[onTimeIntervalId] : 0
        } ${translationsItemTextGet(user, 'secondsShort')}`,
        triggerId = trigger.id,
        triggerValue = trigger.value,
        triggerName = enumerationsStateValueDetails(user, stateObject, functionId, {val: triggerValue})['valueString'],
        currentTriggerDetails = stateSubType === 'number' ? ` [${trigger.onAbove ? iconItemAbove : iconItemLess}]` : '';
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${triggerName}${stateUnits}${currentTriggerDetails} (${onTimeInterval})`,
        icon: triggersGetEnabledIcon(trigger),
        options: {...stateOptions, item: triggerId, stateUnits},
        function: triggersMenuItemDetailsTrigger,
        submenu: triggersMenuGenerateManageTrigger,
      });
    });
    const possibleValueItem = triggersMenuItemGenerateSetValue(
      user,
      currentIndex,
      subMenuIndex,
      stateObject,
      triggers,
      {
        ...options,
        type: stateSubType,
        itemName: translationsItemCoreGet(user, cmdItemAdd),
        itemIcon: iconItemPlus,
        itemGroup: 'addNew',
        mode: 'add',
      },
    );
    if (possibleValueItem) subMenu.push(possibleValueItem);
    const isTriggersSetChanged = JSON.stringify(currentStateTriggers) !== JSON.stringify(triggers);
    if (isTriggersSetChanged || (currentStateTriggers && currentStateTriggers.length)) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${currentName}${isTriggersSetChanged ? ` (${iconItemEdit})` : ''}`,
        icons: triggersGetIcon,
        group: cmdItemsProcess,
        command: cmdItemsProcess,
        options: {...stateOptions, function: functionId, destination: destinationId},
        submenu: [],
      });
    }
    /* if (false && !isTriggersSetChanged && Object.keys(currentStateTriggers).length) {
      subMenu.push(
        alertMenuItemGenerateAlertPropagation(
          user,
          currentIndex,
          subMenuIndex,
          stateId,
          functionId,
          destinationId,
        ),
      );
    } */
  }
  return subMenu;
}

function triggersMenuItemGenerateSetValue(
  user,
  upperMenuItemIndex,
  subMenuItemIndex,
  currentObject,
  triggers,
  baseOptions,
) {
  let menuItem = undefined;
  if (currentObject && currentObject.common) {
    const currentObjectCommon = currentObject.common,
      {
        function: functionId,
        destination: _destinationId,
        item,
        state,
        type,
        convertValueCode,
        itemName,
        itemIcon,
        itemGroup,
        mode,
        value: currentValue,
      } = baseOptions,
      itemOptions = {dataType: dataTypeTrigger, state, type, mode, item};
    if (type === 'number') {
      menuItem =
        itemGroup === 'addNew'
          ? menuMenuItemGenerateAddItem(user, upperMenuItemIndex, subMenuItemIndex, itemOptions)
          : menuMenuItemGenerateEditItem(user, upperMenuItemIndex, subMenuItemIndex, itemName, itemGroup, {
              ...itemOptions,
              value: currentValue,
            });
    } else {
      menuItem = {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
        name: itemName,
        icon: itemIcon,
        group: itemGroup,
        submenu: new Array(),
      };
      const currentStateType = currentObjectCommon['type'];
      let possibleValues = new Array();
      if (type === 'boolean') {
        possibleValues = [true, false];
      } else {
        const possibleStateValues = enumerationsExtractPossibleValueStates(currentObjectCommon['states']);
        if (possibleStateValues)
          possibleValues = Object.keys(possibleStateValues).map((possibleValue) =>
            convertValueCode
              ? convertValueCode(possibleValue)
              : currentStateType === 'number'
              ? Number(possibleValue)
              : possibleValue,
          );
      }
      if (possibleValues.length) {
        possibleValues.forEach((possibleValue, subSubMenuIndex) => {
          const valueName = enumerationsStateValueDetails(user, currentObject, functionId, {val: possibleValue}, true)[
            'valueString'
          ];
          if (!triggers || triggersGetIndex(triggers, possibleValue) < 0) {
            menuItem.submenu.push({
              index: `${upperMenuItemIndex}.${subMenuItemIndex}.${subSubMenuIndex}`,
              name: valueName,
              command: cmdItemPress,
              options: {...itemOptions, value: possibleValue, sorted: possibleValues},
              submenu: [],
            });
          }
        });
        if (menuItem.submenu.length === 0) menuItem = undefined;
      }
    }
  }
  return menuItem;
}

function triggersMenuGenerateManageTrigger(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    {
      dataType,
      function: functionId,
      destination: destinationId,
      state: stateId,
      type: stateSubType,
      item: triggerId,
      stateUnits,
    } = menuItemToProcess.options,
    triggers = triggersGetStateTriggers(user, stateId),
    triggerIndex = triggersGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      triggerValue = trigger.value,
      messageTemplate = trigger.hasOwnProperty(alertMessageTemplateId)
        ? trigger[alertMessageTemplateId]
        : configOptions.getOption(cfgAlertMessageTemplateThreshold, user),
      onTimeInterval = `${
        trigger.hasOwnProperty(onTimeIntervalId) ? trigger[onTimeIntervalId] : 0
      } ${translationsItemTextGet(user, 'secondsShort')}`,
      targetStateId = trigger.targetState,
      targetFunction = trigger.targetFunction,
      targetValue = trigger.targetValue,
      triggerOptions = {
        dataType,
        function: functionId,
        destination: destinationId,
        state: stateId,
        type: stateSubType,
        item: triggerId,
      };
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: translationsItemTextGet(user, 'enabled'),
      icon: triggersGetEnabledIcon(trigger),
      command: cmdItemPress,
      options: {...triggerOptions, mode: 'enabled', value: triggerValue},
      submenu: [],
    });
    if (stateSubType === 'number') {
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateEditItem(user, currentIndex, subMenuIndex, `${triggerValue}${stateUnits}`, 'value', {
          ...triggerOptions,
          mode: 'edit',
          value: triggerValue,
        }),
      );
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: iconItemAbove,
        icon: trigger.onAbove
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command: cmdItemPress,
        options: {...triggerOptions, mode: 'onAbove'},
        submenu: [],
      });
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: iconItemLess,
        icon: trigger.onLess
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command: cmdItemPress,
        options: {...triggerOptions, mode: 'onLess'},
        submenu: [],
      });
    }
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateEditItem(
        user,
        `${currentIndex}.${subMenuIndex}`,
        subMenuIndex,
        `${translationsItemTextGet(user, onTimeIntervalId)} {${onTimeInterval}}`,
        'thresholdOn',
        {...triggerOptions, mode: onTimeIntervalId, value: onTimeInterval},
      ),
    );
    const messageOptions = {...triggerOptions, mode: alertMessageTemplateId, value: messageTemplate};
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}.${subMenuIndex}`,
      name: `${translationsItemTextGet(user, alertMessageTemplateId)}${
        trigger.hasOwnProperty(alertMessageTemplateId) ? '' : `(${translationsItemTextGet(user, 'global')}})`
      }`,
      icon: iconItemEdit,
      group: alertMessageTemplateId,
      submenu: [
        menuMenuItemGenerateEditItem(
          user,
          `${currentIndex}.${subMenuIndex}`,
          0,
          `${translationsItemTextGet(user, alertMessageTemplateId)}`,
          'edit',
          messageOptions,
        ),
        menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, 1, messageOptions),
      ],
    });
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: translationsItemTextGet(user, 'targetState'),
      icon: iconItemEdit,
      group: 'target',
      options: {...triggerOptions, value: targetStateId, mode: 'targetState'},
      submenu: triggersMenuGenerateBrowseAllStates,
    });
    if (targetStateId) {
      const targetObject = existsObject(targetStateId) ? getObject(targetStateId) : undefined,
        targetSubType = triggersGetStateSubType(targetStateId, targetObject),
        targetValueItem = triggersMenuItemGenerateSetValue(
          user,
          currentIndex,
          subMenuIndex,
          getObject(targetStateId),
          triggers,
          {
            ...triggerOptions,
            function: targetFunction,
            type: targetSubType,
            itemName: translationsItemTextGet(user, 'targetValue'),
            itemIcon: iconItemEdit,
            itemGroup: 'target',
            mode: 'targetValue',
            value: targetValue,
          },
        );
      if (targetValueItem) subMenuIndex = subMenu.push(targetValueItem);
    }
    subMenu.push(menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, subMenuIndex, triggerOptions));
  }
  return subMenu;
}

function triggersMenuGenerateBrowseAllStates(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    currentOptions = menuItemToProcess.options,
    // triggers = triggersGetStateTriggers(user, stateId),
    // triggerIndex = triggersGetIndex(triggers, triggerId),
    enumerationsMenu = menuMenuItemGenerateRootMenu(user, 'enumerationsOnly'),
    subMenu = enumerationsMenu ? enumerationsMenu.submenu : [],
    convertDevice = (device) => {
      device.function = triggersMenuItemDetailsTrigger;
      device.submenu = triggersMenuGenerateSelectTargetState;
      return device;
    };
  return menuMenuReIndex(subMenu, currentIndex, {...currentOptions, currentIndex, deviceFunction: convertDevice});
}

function triggersMenuItemDetailsTrigger(user, menuItemToProcess) {
  const options =
      menuItemToProcess.options && menuItemToProcess.options.extraOptions
        ? menuItemToProcess.options.extraOptions
        : menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId, item} = options;
  let text = '';
  if (options && stateId && item) {
    const triggers = triggersGetStateTriggers(user, stateId),
      triggerIndex = triggersGetIndex(triggers, item),
      trigger = triggers && triggerIndex >= 0 ? triggers[triggerIndex] : undefined;
    if (trigger) {
      const sourceStateDetails = {
        label: ` ${translationsGetObjectName(user, stateId, functionId)}`,
        ...enumerationsStateValueDetails(user, stateId, functionId, {val: trigger.value}),
      };
      if (trigger.onAbove !== undefined && trigger.onLess !== undefined) {
        sourceStateDetails.valueString = `${trigger.onAbove ? '&gt;=' : '&lt;'} ${sourceStateDetails.valueString}`;
        sourceStateDetails.lengthModifier = sourceStateDetails.lengthModifier - 3;
      }
      const triggerAttributesArray = [
        {
          label: translationsItemTextGet(user, 'enabled'),
          valueString: triggersGetEnabledIcon(trigger),
          lengthModifier: 1,
        },
        {
          label: translationsItemTextGet(user, onTimeIntervalId),
          valueString: trigger[onTimeIntervalId],
        },
        {
          label: translationsItemTextGet(user, 'source'),
          valueString: '',
        },
        {
          label: ` ${translationsItemTextGet(user, 'function')}`,
          valueString: enumerationsItemName(user, dataTypeFunction, functionId),
        },
        {
          label: ` ${translationsItemTextGet(user, 'device')}`,
          valueString: enumerationsGetDeviceName(user, options.state, functionId, destinationId),
        },
        sourceStateDetails,
      ];
      const targetStateId = trigger.targetState,
        targetFunctionId = trigger.targetFunction,
        targetDestinationId = trigger.targetDestination;
      if (targetStateId && targetFunctionId) {
        const targetStateDetails = {
          label: ` ${translationsGetObjectName(user, targetStateId, targetFunctionId)}`,
          ...enumerationsStateValueDetails(user, targetStateId, targetFunctionId, {val: trigger.targetValue}),
        };
        triggerAttributesArray.push({
          label: translationsItemTextGet(user, 'target'),
          valueString: '',
        });
        triggerAttributesArray.push({
          label: ` ${translationsItemTextGet(user, 'function')}`,
          valueString: enumerationsItemName(user, dataTypeFunction, targetFunctionId),
        });
        triggerAttributesArray.push({
          label: ` ${translationsItemTextGet(user, 'device')}`,
          valueString: enumerationsGetDeviceName(user, targetStateId, targetFunctionId, targetDestinationId),
        });
        triggerAttributesArray.push(targetStateDetails);
      }
      text = `<code>${menuMenuItemDetailsPrintFixedLengthLines(user, triggerAttributesArray)}</code>`;
    }
  }
  return text;
}

function triggersMenuGenerateSelectTargetState(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, extraOptions} = options,
    currentAccessLevel = menuItemToProcess.accessLevel;
  let subMenu = [],
    subMenuIndex = 0;

  const generateDeviceStateMenuItem = (user, _stateId, stateIdFull, stateObject, _stateDetails, _options) => {
      if (stateObject) {
        const stateIndex = `${currentIndex}.${subMenuIndex}`,
          stateName = `${translationsGetObjectName(user, stateObject, functionId)}`;
        subMenuIndex = subMenu.push({
          index: stateIndex,
          name: stateName,
          icons: triggersGetIcon,
          command: cmdItemPress,
          options: {...extraOptions, function: functionId, destination: destinationId, value: stateIdFull},
          submenu: [],
        });
      }
    },
    optionsToProcess = {...options, buttons: 'all'};
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsToProcess, generateDeviceStateMenuItem);
  return subMenu;
}

//*** Triggers - end ***//

//*** Backup - begin ***//

const backupFolder = 'AutoTelegramMenuBackup',
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
  backupRestoreItemsList = {
    [backupItemAll]: doAll,
    [backupItemConfigOptions]: 'configuration',
    [backupItemMenuListItems]: 'functionsDestsReports',
    [backupItemAlerts]: backupItemAlerts,
  };
let _backupScheduleReference;

/**
 * This function generates a submenu to manage Auto Telegram Menu configuration
 * backup and restore.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function backupMenuGenerateBackupAndRestore(user, menuItemToProcess) {
  logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`);
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    _currentId = menuItemToProcess.id,
    currentAccessLevel = menuItemToProcess.accessLevel,
    backupFiles = backupGetFolderList();
  let subMenu = [],
    subMenuIndex = 0;
  if (!MenuRoles.accessLevelsPreventToShow.includes(currentAccessLevel)) {
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'BackupCreate')}`,
      icon: iconItemBackupCreate,
      id: backupModeCreate,
      command:
        MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0
          ? cmdItemsProcess
          : cmdNoOperation,
      options: {dataType: dataTypeBackup, mode: backupModeCreate},
      submenu: [],
    });
    if (backupFiles.length) {
      const restoreSubMenu = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'BackupRestore')}`,
        icon: iconItemBackupRestore,
        id: backupModeRestore,
        submenu: new Array(),
      };
      const restoreSubSubMenu =
          MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0
            ? backupMenuGenerateRestore
            : [],
        restoreSubCommand =
          MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0
            ? {}
            : {command: cmdNoOperation};
      backupFiles.forEach((fileName, fileIndex) => {
        const backupFileDetails = fileName.match(backupFileMask),
          [_fullName, backupDate, backupTime, backupMode] =
            backupFileDetails && backupFileDetails.length === 4 ? backupFileDetails : [];
        if (backupDate && backupTime && backupMode) {
          restoreSubMenu.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${fileIndex}`,
            name: `${backupDate} ${backupTime.split('-').join(':')} [${backupMode}]`,
            // icon: iconItemBackupCreate,
            options: {fileName},
            submenu: restoreSubSubMenu,
            ...restoreSubCommand,
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
function backupMenuGenerateRestore(user, menuItemToProcess) {
  // logs(`menuItemToProcess = ${JSON.stringify(menuItemToProcess)}`, _l);
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    {fileName} = menuItemToProcess.options;
  let subMenu = [],
    subMenuIndex = 0;
  Object.keys(backupRestoreItemsList).forEach((backupItem) => {
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, backupModeRestore, backupRestoreItemsList[backupItem])}`,
      icon: iconItemBackupRestore,
      command: cmdItemsProcess,
      options: {dataType: dataTypeBackup, mode: backupModeRestore, fileName, item: backupItem},
      submenu: [],
    });
  });
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateDeleteItem(user, `${currentIndex}`, subMenuIndex, {dataType: dataTypeBackup, fileName}),
  );
  return subMenu;
}

/**
 * This function deletes an backup file from the server.
 * @param {string} backupFileName - The file name of the backup file.
 * @returns {promise} The result promise.
 */
function backupFileDelete(backupFileName) {
  const fileToDelete = `${backupFolder}/${backupFileName}`;
  return new Promise((resolve, reject) => {
    delFile('', fileToDelete, (error) => {
      if (error) {
        console.warn(`Can't delete backup file ${fileToDelete}! Error is '${error}'.`);
        reject(error);
      } else {
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
async function backupFileWrite(backupFileName, backupDataJSON, backupMode) {
  return new Promise((resolve, reject) => {
    writeFile('', backupFileName, backupDataJSON, (error) => {
      if (error) {
        console.warn(`Can't create backup file ${backupFileName}! Error is '${error}'.`);
        reject(error);
      } else {
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
async function backupFileRead(backupFileName) {
  return new Promise((resolve, reject) => {
    readFile('', backupFileName, (error, data) => {
      if (error) {
        console.warn(`Cant' read backup file ${backupFileName}! Error is '${error}'.`);
        reject(error);
      } else {
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
function backupCreate(backupMode) {
  const backupData = {
    [backupItemConfigOptions]: configOptions.getDataForBackup(),
  };
  const enumerationItemsBackup = {};
  Object.keys(enumerationsList).forEach((dataType) => {
    enumerationItemsBackup[dataType] = {
      enums: enumerationsList[dataType].enums,
      list: enumerationsList[dataType].list,
    };
  });
  backupData[backupItemMenuListItems] = enumerationItemsBackup;
  backupData[backupItemAlerts] = alertsGet();
  const backupDataJSON = JSON.stringify(backupData, JSONReplacerWithMap, 2);
  // logs(`${backupDataJSON}`, 1);
  const // @ts-ignore
    dateNow = formatDate(new Date(), 'YYYY-MM-DD-hh-mm-ss'),
    backupFileName = nodePath.join(backupFolder, `${backupPrefix}-${dateNow}-${backupMode}.json`);
  return new Promise((resolve, reject) => {
    backupFileWrite(backupFileName, backupDataJSON, backupMode)
      .then((backupMode) => {
        backupDeleteOldFiles(backupMode).finally(() => {
          resolve(true);
        });
      })
      .catch(reject);
  });
  // logs(`Files: ${JSON.stringify(backupGetFolderList(), null, 1)}`, _l);
}

/**
 * This function reads the stored configuration JSON from the server and then
 * replace appropriate configuration items, depending on `restoreItem` value.
 * @param {string} fileName - The file name of the backup file.
 * @param {string=} restoreItem - The selector of the configuration part to restore.
 * @returns {promise} The result promise.
 */
function backupRestore(fileName, restoreItem) {
  return new Promise((resolve, reject) => {
    if (backupFileMask.test(fileName)) {
      const backupFileName = nodePath.join(backupFolder, fileName);
      backupFileRead(backupFileName)
        .then((backupData) => {
          if (backupData) {
            try {
              let restoreData;
              restoreData = JSON.parse(backupData, JSONReviverWithMap);
              const restoreItems = Object.keys(backupRestoreItemsList);
              if (
                restoreData &&
                restoreItems.filter((backupItem) => restoreData.hasOwnProperty(backupItem) && restoreData[backupItem])
                  .length ===
                  restoreItems.length - 1
              ) {
                let itemsToRestore = [restoreItem];
                if (restoreItem === backupItemAll) {
                  itemsToRestore = Object.keys(backupRestoreItemsList);
                  itemsToRestore.shift();
                }
                itemsToRestore.forEach((itemToRestore) => {
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
                        Object.keys(enumerationsList).forEach((dataType) => {
                          if (
                            enumerationItemsBackup.hasOwnProperty(dataType) &&
                            typeOf(enumerationItemsBackup[dataType], 'object') &&
                            enumerationItemsBackup[dataType].hasOwnProperty('enums') &&
                            enumerationItemsBackup[dataType].enums &&
                            enumerationItemsBackup[dataType].hasOwnProperty('list') &&
                            enumerationItemsBackup[dataType].list
                          ) {
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
                resolve(true);
              } else {
                console.warn(`Inconsistent data from file ${backupFileName}!\nData in file is '${backupData}'`);
                reject(false);
              }
            } catch (error) {
              console.warn(
                `Can't parse data from file ${backupFileName}! Error is '${JSON.stringify(
                  error,
                )}'.\nData in file is '${backupData}'`,
              );
              reject(error);
            }
          } else {
            reject(false);
          }
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      reject(false);
    }
  });
}

/**
 * This function delete an old (as it configured) backup files.
 * @param {*} mode - The filter of files, based on a creation mode (`manual` or `auto`).
 * @returns {promise} The result of deletion.
 */
function backupDeleteOldFiles(mode) {
  const backupFiles = mode === backupModeAuto ? backupGetFolderList() : [],
    maxBackupFiles = mode === backupModeAuto ? configOptions.getOption(cfgConfigBackupCopiesCount) : 0,
    deleteNextBackupFile = (resolve, reject) => {
      if (backupFiles.length > maxBackupFiles) {
        const backupFileName = backupFiles.shift();
        if (backupFileName)
          backupFileDelete(backupFileName).finally(() => {
            deleteNextBackupFile(resolve, reject);
          });
      } else {
        resolve(true);
      }
    };
  return new Promise((resolve, reject) => {
    deleteNextBackupFile(resolve, reject);
  });
}

/**
 * This function returns a list of files in backup folder.
 * @returns {string[]} Array of files.
 */
function backupGetFolderList() {
  let result = [];
  const currentDir = nodeProcess.cwd(),
    adapterSubPath = nodePath.join('node_modules', 'iobroker.javascript');
  if (currentDir.includes(adapterSubPath)) {
    const backupDir = nodePath.join(
      currentDir.replace(adapterSubPath, nodePath.join('iobroker-data', 'files', '0_userdata.0', backupFolder)),
    );
    const listOfBackups = nodeFS.readdirSync(backupDir);
    result = listOfBackups.filter((fileName) => backupFileMask.test(fileName)).sort();
  }
  return result;
}

//*** Backup - end ***//

//*** simpleReports - begin ***//

const cachedSimpleReportIdToCreate = 'simpleReportIdToCreate',
  cachedSimpleReportNewQuery = 'simpleReportNewQuery',
  simpleReportQueryParamsTemplate = () => {
    return {queryDests: [], queryState: '', queryRole: '', queryStates: [], queryPossibleStates: []};
  },
  simpleReportFunctionTemplate = {
    common: {
      name: {
        en: '',
      },
      members: [],
      icon: '',
      color: false,
    },
    type: 'enum',
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
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    {enumType: enumId, item: reportId} = menuItemToProcess.options;
  if (reportId) {
    const reportObjectId = `${prefixEnums}.${enumerationsList[dataTypeReport].list[reportId].enum}.${reportId}`,
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
            function: (_user, _menuItemToProcess) => `${memberTopObjectName} (${member})`,
            submenu: [
              menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${memberId}`, 0, {
                dataType: dataTypeReportMember,
                item: reportId,
                index: memberId,
              }),
            ],
          });
        }
      });
    }
    memberId = newMenu.push({
      index: `${currentIndex}.${memberId}`,
      name: `${translationsItemMenuGet(user, 'ReportMarkNewStates')}`,
      icon: enumerationsList[dataTypeReport].icon,
      options: {item: reportId},
      /** submenu function for collecting query params (dests, states, roles) */
      submenu: (user, menuItemToProcess) => {
        logs(`(${user}, menuItemToProcess)`);
        const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
          {item: reportId} = menuItemToProcess.options;
        let subMenuIndex = 0,
          subMenu = [];
        const {queryDests, queryState, queryRole} = cachedValueExists(user, cachedSimpleReportNewQuery)
          ? cachedValueGet(user, cachedSimpleReportNewQuery)
          : simpleReportQueryParamsTemplate();
        if (!cachedValueExists(user, cachedSimpleReportNewQuery))
          cachedValueSet(user, cachedSimpleReportNewQuery, {queryDests, queryState, queryRole});
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineDest')} (${queryDests.length}, ${
            Object.keys(enumerationsList[dataTypeDestination].list).filter(
              (key) => enumerationsList[dataTypeDestination].list[key].isEnabled,
            ).length
          })`,
          icon: enumerationsList[dataTypeReport].icon,
          /** submenu function for dests selection */
          submenu: (user, menuItemToProcess) => {
            logs(`(${user}, menuItemToProcess)`);
            const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '';
            let subMenu = [],
              subMenuIndex = 0;
            Object.keys(enumerationsList[dataTypeDestination].list)
              .filter((key) => enumerationsList[dataTypeDestination].list[key].isEnabled)
              .forEach((key) => {
                const _isSelected = queryDests.includes(key) ? '|' : '';
                subMenuIndex = subMenu.push({
                  index: `${currentIndex}.${subMenuIndex}`,
                  name: `${translationsGetEnumName(user, dataTypeDestination, key)}`,
                  icon: queryDests.includes(key)
                    ? configOptions.getOption(cfgDefaultIconOn, user)
                    : enumerationsList[dataTypeDestination].list[key].icon,
                  command: cmdItemMark,
                  options: {dataType: dataTypeReportMember, itemType: dataTypeDestination, item: key},
                  submenu: [],
                });
              });
            return subMenu;
          },
        });
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineState')} (${queryState})`,
          icon: iconItemEdit,
          command: cmdGetInput,
          options: {dataType: dataTypeReportMember, item: 'queryState'},
          submenu: [],
        });
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, 'ReportNewStatesDefineRole')} (${queryRole})`,
          icon: iconItemEdit,
          command: cmdGetInput,
          options: {dataType: dataTypeReportMember, item: 'queryRole'},
          submenu: [],
        });
        if (queryRole || queryState) {
          subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'ReportNewStatesStartSearch')}`,
            icon: enumerationsList[dataTypeReport].icon,
            options: {item: reportId},
            /** submenu function for selecting states from a query result and assigning them to report */
            submenu: (user, menuItemToProcess) => {
              logs(`(${user}, menuItemToProcess)`);
              const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
                {item: reportId} = menuItemToProcess.options;
              let {queryDests, queryState, queryRole, queryStates, queryPossibleStates} = cachedValueGet(
                  user,
                  cachedSimpleReportNewQuery,
                ),
                subMenu = [],
                subMenuIndex = 0,
                destsList = queryDests,
                currentDestId = '',
                destIndex = 0,
                itemsMarked = 0;
              if (!destsList.length) {
                destsList = Object.keys(enumerationsList[dataTypeDestination].list);
              }
              logs(`destsList = ${JSON.stringify(destsList)}, queryState = ${queryState}, queryRole = ${queryRole}`);
              const query = `state${queryState ? `[id=*.${queryState}]` : '[id=*]'}${
                queryRole ? `[role=${queryRole}]` : ''
              }`;
              logs(`query = ${query}`);
              destsList.forEach((destinationId) => {
                const currentDestination = enumerationsList[dataTypeDestination].list[destinationId];
                $(`${query}${destinationId ? `(${currentDestination.enum}=${destinationId})` : ''}`).each(
                  (id, index) => {
                    if (currentDestId !== destinationId) {
                      if (currentDestId) {
                        destIndex++;
                        subMenu[subMenuIndex - 1].name = `${subMenu[subMenuIndex - 1].name} (${
                          subMenu[subMenuIndex - 1].submenu.length
                        }, ${itemsMarked})`;
                      }
                      currentDestId = destinationId;
                      subMenuIndex = subMenu.push({
                        index: `${currentIndex}.${subMenuIndex}`,
                        name: `${translationsGetEnumName(user, dataTypeDestination, destinationId)}`,
                        icon: enumerationsList[dataTypeReport].icon,
                        submenu: [],
                      });
                      itemsMarked = 0;
                    }
                    const stateTopObjectName = translationsGetObjectName(user, id.split('.').slice(0, -1).join('.'));
                    subMenu[destIndex].submenu.push({
                      index: `${currentIndex}.${subMenuIndex - 1}.${index}`,
                      name: `${stateTopObjectName} (${id.split('.').pop()})`,
                      icon: queryStates.includes(id)
                        ? configOptions.getOption(cfgDefaultIconOn, user)
                        : enumerationsList[dataTypeDestination].icon,
                      function: (_user, _menuItemToProcess) => `${stateTopObjectName} (${id})`,
                      submenu: [
                        {
                          index: `${currentIndex}.${subMenuIndex - 1}.${index}`,
                          name: `${translationsItemMenuGet(user, 'ItemMarkUnMark')}`,
                          icon: queryStates.includes(id)
                            ? configOptions.getOption(cfgDefaultIconOn, user)
                            : enumerationsList[dataTypeDestination].icon,
                          command: cmdItemMark,
                          options: {
                            dataType: dataTypeReportMember,
                            itemType: 'states',
                            item: queryPossibleStates.length,
                          },
                          submenu: [],
                        },
                      ],
                    });
                    if (queryStates.includes(id)) itemsMarked++;
                    queryPossibleStates.push(id);
                  },
                );
              });
              if (subMenuIndex)
                subMenu[subMenuIndex - 1].name = `${subMenu[subMenuIndex - 1].name} (${
                  subMenu[subMenuIndex - 1].submenu.length
                }, ${itemsMarked})`;
              subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'ItemsProcessMarked')}`,
                icon: configOptions.getOption(cfgDefaultIconOn, user),
                group: cmdItemsProcess,
                command: cmdItemsProcess,
                options: {dataType: dataTypeReportMember, item: reportId, mode: 'marked'},
                submenu: [],
              });
              subMenuIndex = subMenu.push({
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemMenuGet(user, 'ItemsProcessAll')}`,
                icon: enumerationsList[dataTypeReport].icon,
                command: cmdItemsProcess,
                options: {dataType: dataTypeReportMember, item: reportId, mode: doAll},
                submenu: [],
              });
              logs(`statesArray = ${JSON.stringify(queryPossibleStates)}`);
              logs(`submenu = ${JSON.stringify(subMenu, null, 2)}`);
              cachedValueSet(user, cachedSimpleReportNewQuery, {
                queryDests,
                queryState,
                queryRole,
                queryStates,
                queryPossibleStates,
              });
              return subMenu;
            },
          });
        }
        logs(`submenu = ${JSON.stringify(subMenu, null, 2)}`);
        return subMenu;
      },
    });
  } else if (enumId) {
    cachedValueDelete(user, cachedSimpleReportNewQuery);
    const simpleReportId = cachedValueGet(user, cachedSimpleReportIdToCreate);
    if (simpleReportId) {
      if (/[^a-zA-Z0-9]/.test(simpleReportId)) {
        newMenu.push({
          index: `${currentIndex}.0`,
          name: `${translationsItemCoreGet(user, 'cmdFixId')}`,
          icon: iconItemEdit,
          command: cmdGetInput,
          options: {dataType: dataTypeReport, mode: 'fixId'},
          submenu: [],
        });
      } else {
        newMenu.push({
          index: `${currentIndex}.0`,
          name: `${translationsItemCoreGet(user, 'cmdCreateWithId')} = '${simpleReportId}'`,
          icon: enumerationsList[dataTypeReport].icon,
          command: cmdCreateReportEnum,
          options: {dataType: dataTypeReport, item: simpleReportId, enum: enumId},
          submenu: [],
        });
        cachedValueDelete(user, cachedSimpleReportIdToCreate);
      }
    } else {
      newMenu.push({
        index: `${currentIndex}.0`,
        name: `${translationsItemCoreGet(user, 'cmdSetId')}`,
        icon: iconItemEdit,
        command: cmdGetInput,
        options: {dataType: dataTypeReport, mode: 'setId'},
        submenu: [],
      });
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
  let reportStatesStructure = {},
    objectToFunctionList = {};
  reportStatesList.forEach((stateId) => {
    if (existsObject(stateId)) {
      const currentObject = getObjectEnriched(stateId, '*');
      if (currentObject.hasOwnProperty('enumIds')) {
        const topStateId = stateId.split('.').slice(0, -1).join('.'),
          destsEnums = Object.keys(enumerationsList[dataTypeDestination].enums),
          funcsEnums = Object.keys(enumerationsList[dataTypeFunction].enums),
          functionsList = enumerationsList[dataTypeFunction].list,
          stateDests = currentObject['enumIds']
            .filter((key) => {
              for (let enumType of destsEnums) {
                if (key.indexOf(`${prefixEnums}.${enumType}`) === 0) return true;
              }
              return false;
            })
            .map((key) => key.split('.').pop());
        let stateFuncs = currentObject['enumIds']
          .filter((key) => funcsEnums.find((enumId) => key.indexOf(`${prefixEnums}.${enumId}`) === 0))
          .map((key) => key.split('.').pop());
        stateDests.forEach((stateDest) => {
          if (!stateFuncs.length) {
            stateFuncs.push(enumerationsFunctionNotFound);
          } else if (stateFuncs.length > 1) {
            if (!Object.keys(objectToFunctionList).length) {
              Object.keys(funcsList).forEach((functionId) => {
                const fullId = `${prefixEnums}.${functionsList[functionId].enum}.${functionId}`;
                if (existsObject(fullId)) {
                  const functionObject = getObject(fullId);
                  if (functionObject.hasOwnProperty('common') && functionObject.common.hasOwnProperty('members')) {
                    functionObject.common.members.forEach((item) => {
                      objectToFunctionList[item] = functionId;
                    });
                  }
                }
              });
            }
            let currentStateId = stateId;
            logs(`objectToFunctionList = ${JSON.stringify(objectToFunctionList)}`);
            while (currentStateId.includes('.')) {
              if (objectToFunctionList.hasOwnProperty(currentStateId)) {
                stateFuncs = [objectToFunctionList[currentStateId]];
                break;
              }
              currentStateId = currentStateId.split('.').slice(0, -1).join('.');
            }
          }
          stateFuncs.forEach((stateFunc) => {
            if (!reportStatesStructure.hasOwnProperty(stateDest)) {
              reportStatesStructure[stateDest] = {};
            }
            if (!reportStatesStructure[stateDest].hasOwnProperty(stateFunc)) {
              reportStatesStructure[stateDest][stateFunc] = {};
            }
            if (!reportStatesStructure[stateDest][stateFunc].hasOwnProperty(topStateId)) {
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
  const reportsList = enumerationsList[dataTypeReport];
  logs(`Object.keys(reportItem.list) = ${JSON.stringify(Object.keys(reportsList.list))}`);
  logs(`reportItem = ${JSON.stringify(reportsList, null, 2)}`);
  if (
    menuItemToProcess &&
    menuItemToProcess.hasOwnProperty('id') &&
    Object.keys(reportsList.list).includes(menuItemToProcess.id)
  ) {
    const reportId = menuItemToProcess.id,
      reportObject = getObject(`${prefixEnums}.${reportsList.list[reportId].enum}.${reportId}`);
    logs(`reportId = ${reportId}`);
    logs(`reportObject = ${JSON.stringify(reportObject)}`);
    if (
      reportObject &&
      reportObject.hasOwnProperty('common') &&
      reportObject.common.hasOwnProperty('members') &&
      Array.isArray(reportObject.common['members']) &&
      reportObject.common['members'].length
    ) {
      const reportStatesList = reportObject.common['members'].sort(),
        _funcsList = enumerationsList[dataTypeFunction].list,
        isAlwaysExpanded = reportsList.list[reportId].alwaysExpanded;
      logs(`reportStatesList = ${JSON.stringify(reportStatesList)}`);
      let reportStatesStructure = simpleReportPrepareStructure(reportStatesList);
      logs(`reportStatesStructure = ${JSON.stringify(reportStatesStructure, null, 2)}`);
      const reportLines = new Array();
      const currentSort = (a, b) => enumerationsCompareOrderOfItems(a, b, dataTypeFunction);
      Object.keys(reportStatesStructure)
        .sort((a, b) => enumerationsCompareOrderOfItems(a, b, dataTypeDestination))
        .forEach((currentDestId) => {
          const linePrefix = '- ';
          reportLines.push({
            label: `${linePrefix}${translationsItemTextGet(user, 'In').toLowerCase()} ${translationsGetEnumName(
              user,
              dataTypeDestination,
              currentDestId,
              enumerationsNamesInside,
            )}`,
          });
          const currentFuncs = Object.keys(reportStatesStructure[currentDestId]).sort(currentSort);
          currentFuncs.forEach((currentFuncId) => {
            if (isAlwaysExpanded || currentFuncs.length > 1) {
              reportLines.push({
                label: ` ${linePrefix}${stringCapitalize(
                  translationsGetEnumName(user, dataTypeFunction, currentFuncId, enumerationsNamesMany),
                )}`,
              });
            }
            const currentDeviceObjects = Object.keys(reportStatesStructure[currentDestId][currentFuncId]);
            currentDeviceObjects.forEach((currentDeviceObject) => {
              if (isAlwaysExpanded || currentDeviceObjects.length > 1) {
                reportLines.push({label: `  ${linePrefix}${translationsGetObjectName(user, currentDeviceObject)}`});
              }
              const currentStateObjects = reportStatesStructure[currentDestId][currentFuncId][currentDeviceObject];
              currentStateObjects.forEach((currentStateObject) => {
                if (isAlwaysExpanded || currentStateObjects.length > 1) {
                  reportLines.push({
                    label: `   ${linePrefix}${translationsGetObjectName(user, currentStateObject, currentFuncId)}`,
                  });
                }
                reportLines[reportLines.length - 1] = {
                  ...reportLines[reportLines.length - 1],
                  ...enumerationsStateValueDetails(user, currentStateObject, currentFuncId),
                };
              });
            });
          });
        });
      logs(`reportLines = ${JSON.stringify(reportLines)}`);
      reportText = `<code>${menuMenuItemDetailsPrintFixedLengthLines(user, reportLines)}</code>`;
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
  const currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
    reportId = menuItemToProcess.id,
    reportsList = enumerationsList[dataTypeReport].list,
    reportItem = reportsList[reportId],
    graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user);
  let subMenu = [];
  if (reportItem) {
    const reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
    if (
      reportObject &&
      reportObject.hasOwnProperty('common') &&
      reportObject.common.hasOwnProperty('members') &&
      Array.isArray(reportObject.common['members']) &&
      reportObject.common['members'].length
    ) {
      const reportStatesList = reportObject.common['members'].sort();
      let shortStates = reportStatesList
        .map((state) => state.split('.').pop())
        .reduce((previousState, currentState) => {
          if (!previousState.includes(currentState)) {
            previousState.push(currentState);
          }
          return previousState;
        }, new Array());
      const graphsTemplate =
        shortStates.length === 1
          ? existsObject(`${graphsTemplatesFolder}.${shortStates[0]}`)
            ? shortStates[0]
            : graphsDefaultTemplate
          : undefined;
      let subMenuIndex = 0;
      const subMenuRefresh = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'Refresh')}`,
        icon: iconItemRefresh,
        command: cmdItemJumpTo,
        group: 'refresh',
        submenu: [],
      };
      subMenuIndex = subMenu.push(subMenuRefresh);
      if (graphsTemplate) {
        const graphsIntervals = configOptions.getOption(cfgGraphsIntervals, user);
        if (graphsIntervals && typeOf(graphsIntervals, 'array') && graphsIntervals.length) {
          graphsIntervals.forEach(({id: graphsIntervalId, minutes: graphsIntervalMinutes}) => {
            // logs(`generateTextTranslationId('TimeRange', graphsTimeRangeId) = ${generateTextTranslationId('TimeRange', graphsTimeRangeId)}`);
            subMenuIndex = subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}`,
              icon: iconItemChart,
              group: cmdItemsProcess,
              command: cmdItemsProcess,
              options: {
                dataType: dataTypeGraph,
                itemType: dataTypeReport,
                item: reportId,
                template: graphsTemplate,
                graphsInterval: graphsIntervalMinutes,
              },
            });
          });
        }
        if (sentImagesExists(user)) {
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemCoreGet(user, cmdDeleteAllSentImages)}`,
            icon: iconItemDelete,
            command: cmdDeleteAllSentImages,
            group: cmdDeleteAllSentImages,
          });
        }
      }
    }
  }
  return subMenu;
}

//*** simpleReports - end ***//

//*** menu related functions - begin ***//

const menuItemButtonPrefix = 'menu-', // Technical parameter for the telegram menu items
  menuRefreshScheduled = new Map(),
  menuRefreshTimeAllUsers = 0,
  menuButtonsDefaultGroup = 'defaultGroup';

/**
 * This function generates a root menu item for a user based on the user's access level.
 * @param {object} user - The user object.
 * @param {string=} topRootMenuItemId - Id of one of root menu subitem, to generate menu only for them as root.
 * @returns {object} Newly generated root menu item(or one of root item submenu items).
 */
function menuMenuItemGenerateRootMenu(user, topRootMenuItemId) {
  const rootMenu = {
      index: '',
      name: translationsItemMenuGet(user, 'RootText'),
      icon: '🎩',
      options: {[menuOptionHorizontalNavigation]: false},
      submenu: new Array(),
    },
    isMenuFastGeneration = configOptions.getOption(cfgMenuFastGeneration, user),
    isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    isFunctionsFirstGlobal = configOptions.getOption(cfgMenuFunctionsFirst),
    inverseMasks = isFunctionsFirst !== isFunctionsFirstGlobal,
    functionsList = enumerationsList[dataTypeFunction].list,
    functionsListIds = Object.keys(functionsList)
      .filter((func) => functionsList[func].isEnabled && functionsList[func].isAvailable)
      .sort((a, b) => functionsList[a].order - functionsList[b].order),
    destinationsList = enumerationsList[dataTypeDestination].list,
    destinationsListIds = Object.keys(destinationsList)
      .filter((dest) => destinationsList[dest].isEnabled && destinationsList[dest].isAvailable)
      .sort((a, b) => destinationsList[a].order - destinationsList[b].order),
    currentDataType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
    currentEnumerationId = isFunctionsFirst ? 'function' : 'destination',
    currentNameId = isFunctionsFirst ? enumerationsNamesMany : enumerationsNamesMain,
    currentList = isFunctionsFirst ? functionsList : destinationsList,
    currentListIds = isFunctionsFirst ? functionsListIds : destinationsListIds;

  /**
   * This function generates the root menu item `Setup`, which contains all
   * items related to the configuration of the Auto Telegram Menu.
   * @param {object} user - The user object.
   * @returns {object} Newly generated `Setup` item.
   */
  function menuMenuItemGenerateRootMenuSetup(user) {
    const menuItem = {
      name: translationsItemMenuGet(user, 'Setup'),
      id: 'setup',
      group: 'setupTopItem',
      icon: '🛠️',
      submenu: new Array(),
    };
    if (
      user === null ||
      (user &&
        user.userId &&
        MenuRoles.compareAccessLevels(
          usersInMenu.getMenuItemAccess(user.userId, menuItem.id),
          rolesAccessLevelForbidden,
        ) !== 0)
    ) {
      const subMenu = [
        {
          name: translationsItemMenuGet(user, 'Configuration'),
          id: idConfig,
          icon: '⚙️',
          group: idConfig,
          submenu: (user, menuItemToProcess) => configOptions.menuGenerate(user, menuItemToProcess),
        },
        {
          name: translationsItemMenuGet(user, idTranslation),
          id: dataTypeTranslation,
          icon: iconItemTranslation,
          group: idTranslation,
          submenu: [
            {
              name: translationsItemMenuGet(user, 'TranslationMenuItems'),
              icon: iconItemTranslation,
              id: 'menu',
              submenu: translationsMenuGenerateBasicItems,
            },
            {
              name: translationsItemMenuGet(user, 'TranslationCommandItems'),
              icon: iconItemTranslation,
              id: 'cmd',
              submenu: translationsMenuGenerateBasicItems,
            },
            {
              name: translationsItemMenuGet(user, 'TranslationTextItems'),
              icon: iconItemTranslation,
              id: 'text',
              submenu: translationsMenuGenerateBasicItems,
            },
            ...translationsDownloadUploadMenuPartGenerate(user, translationsCoreId),
          ],
        },
        {
          name: translationsItemMenuGet(user, 'UsersList'),
          id: 'users',
          icon: iconItemUsers,
          group: 'users',
          submenu: (user, menuItemToProcess) => usersInMenu.menuGenerate(user, menuItemToProcess),
        },
        {
          name: translationsItemMenuGet(user, 'RolesList'),
          id: 'roles',
          icon: iconItemRole,
          group: 'users',
          submenu: (user, menuItemToProcess) => rolesInMenu.menuGenerate(user, menuItemToProcess),
        },
        {
          name: translationsItemMenuGet(user, 'Backup'),
          id: 'backup',
          icon: iconItemBackup,
          group: 'backup',
          submenu: (user, menuItemToProcess) => backupMenuGenerateBackupAndRestore(user, menuItemToProcess),
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
              submenu: alertsMenuGenerateHistoryOfAlerts,
            },
            {
              name: translationsItemMenuGet(user, 'SubscribedAlerts'),
              id: 'alertsSubscribed',
              icon: iconItemAlerts,
              submenu: alertsMenuGenerateSubscribed,
              options: {},
            },
          ],
        },
      ];
      subMenu.splice(
        1,
        0,
        ...Object.keys(enumerationsList).map((dataType) => ({
          name: translationsItemMenuGet(user, enumerationsList[dataType].id),
          id: dataType,
          icon: enumerationsList[dataType].icon,
          group: idEnumerations,
          options: {dataType},
          submenu: enumerationsMenuGenerateListOfEnumerationItems,
        })),
      );
      logs(`subMenu`);
      subMenu.forEach((subMenuItem) => {
        const subMenuItemAccessLevel =
          user && user.userId
            ? usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${subMenuItem.id}`)
            : '';
        if (
          user === null ||
          (user && user.userId && MenuRoles.compareAccessLevels(subMenuItemAccessLevel, rolesAccessLevelForbidden) < 0)
        ) {
          subMenuItem.accessLevel = subMenuItemAccessLevel;
          if (Array.isArray(subMenuItem.submenu) && subMenuItem.submenu.length) {
            subMenuItem.submenu.forEach((subSubMenuItem) => (subSubMenuItem.accessLevel = subMenuItemAccessLevel));
          }
          menuItem.submenu.push(subMenuItem);
        }
      });
      if (user && user.userId && sentImagesExists(user)) {
        menuItem.submenu.push({
          name: translationsItemCoreGet(user, cmdDeleteAllSentImages),
          id: cachedSentImages,
          icon: iconItemDelete,
          command: cmdDeleteAllSentImages,
          group: cmdDeleteAllSentImages,
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
  function menuMenuItemGenerateRootReports(user) {
    const historyAdapterId = configOptions.getOption(cfgHistoryAdapter, user),
      graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
      isGraphsEnabled = historyAdapterId && existsObject(`${graphsTemplatesFolder}.${graphsDefaultTemplate}`),
      menuItem = {
        name: translationsItemMenuGet(user, 'SimpleReports'),
        id: 'info',
        group: 'info',
        icon: 'ℹ️',
        submenu: new Array(),
      };
    if (
      user === null ||
      (user &&
        user.userId &&
        MenuRoles.compareAccessLevels(
          usersInMenu.getMenuItemAccess(user.userId, menuItem.id),
          rolesAccessLevelForbidden,
        ) !== 0)
    ) {
      const reportsList = enumerationsList[dataTypeReport].list,
        reportsIndex = Object.keys(reportsList)
          .filter((key) => reportsList[key].isEnabled)
          .sort((a, b) => reportsList[a].order - reportsList[b].order),
        subMenuRefresh = {
          name: `${translationsItemMenuGet(user, 'Refresh')}`,
          icon: iconItemRefresh,
          command: cmdItemJumpTo,
          group: 'refresh',
          submenu: [],
        };
      reportsIndex.forEach((reportId) => {
        if (
          user === null ||
          (user &&
            user.userId &&
            MenuRoles.compareAccessLevels(
              usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${reportId}`),
              rolesAccessLevelForbidden,
            ) < 0)
        ) {
          const currentReport = reportsList[reportId];
          menuItem.submenu.push({
            name: `${translationsGetEnumName(user, dataTypeReport, reportId)}`,
            icon: currentReport.icon ? currentReport.icon : enumerationsList[dataTypeReport].icon,
            function: simpleReportGenerate,
            group: currentReport.group ? currentReport.group : menuButtonsDefaultGroup,
            id: reportId,
            submenu: (user, menuItemToProcess) => {
              const currentIndex = menuItemToProcess.index;
              let subMenu = [],
                subMenuIndex = 0;
              if (isGraphsEnabled && currentReport.graphsEnabled) {
                subMenu = simpleReportMenuGenerateGraphs(user, menuItemToProcess);
              } else {
                subMenu.push({...subMenuRefresh, index: [currentIndex, subMenuIndex].join('.')});
              }
              return subMenu;
            },
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
   * @param {boolean=} isSubordinated - The indicator, if this menu item has a holder one.
   * @returns {object} Newly generated root menu item.
   */
  function menuMenuItemGenerateRootEnumeration(
    user,
    enumerationType,
    currentEnumeration,
    itemId,
    nameDeclinationKey,
    isSubordinated = false,
  ) {
    let result = null;
    const currentItem = currentEnumeration[itemId];
    if (isSubordinated || !currentItem.holder) {
      const menuItem = {
        icon: currentItem.icon,
        id: isSubordinated ? itemId.split('.').pop() : itemId,
        options: {[currentEnumerationId]: itemId, [menuOptionHorizontalNavigation]: true},
        subordinates: new Array(),
        group: currentItem.group ? currentItem.group : menuButtonsDefaultGroup,
      };
      if (currentItem.holder) {
        menuItem.holderId = currentItem.holder;
        menuItem.group = 'subordinates';
      }
      if (currentItem.isExternal) {
        menuItem.name = stringCapitalize(translationsGetEnumName(user, enumerationType, itemId));
        menuItem.submenu = currentItem.state;
        menuItem.extensionId = itemId;
      } else {
        menuItem.name = stringCapitalize(translationsGetEnumName(user, enumerationType, itemId, nameDeclinationKey));
        menuItem.submenu = menuMenuGenerateFirstLevelAfterRoot;
        const subordinatedIds = currentListIds.filter((itemListId) => currentList[itemListId].holder === itemId);
        subordinatedIds.forEach((itemSubordinatedId) => {
          const menuSubordinatedItem = menuMenuItemGenerateRootEnumeration(
            user,
            enumerationType,
            currentList,
            itemSubordinatedId,
            nameDeclinationKey,
            true,
          );
          if (menuSubordinatedItem) {
            menuItem.subordinates.push(menuSubordinatedItem);
          }
        });
      }
      const menuItemAccessLevel =
        user && user.userId
          ? usersInMenu.getMenuItemAccess(user.userId, itemId, !currentItem.isExternal && inverseMasks)
          : '';
      if (
        menuItem.subordinates.length > 0 ||
        user === null ||
        (isMenuFastGeneration &&
          menuItemAccessLevel &&
          MenuRoles.compareAccessLevels(menuItemAccessLevel, rolesAccessLevelForbidden) < 0)
      ) {
        result = menuItem;
      } else if (menuItemAccessLevel && !MenuRoles.accessLevelsPreventToShow.includes(menuItemAccessLevel)) {
        if (typeOf(menuItem.submenu) === 'function') {
          const subMenu = menuItem.submenu(user, menuItem);
          if (subMenu.length) {
            result = menuItem;
          }
        }
      }
    }
    return result;
  }

  // logs(`Done 0`);
  if (topRootMenuItemId !== undefined && topRootMenuItemId !== null) {
    switch (topRootMenuItemId) {
      case 'setup':
        rootMenu.submenu.push(menuMenuItemGenerateRootMenuSetup(user));
        break;

      case 'info':
        rootMenu.submenu.push(menuMenuItemGenerateRootReports(user));
        break;

      case 'enumerationsOnly':
        currentListIds.forEach((itemId) => {
          const menuItem = menuMenuItemGenerateRootEnumeration(
            user,
            currentDataType,
            currentList,
            itemId,
            currentNameId,
          );
          if (menuItem) {
            rootMenu.submenu.push(menuItem);
          }
        });
        break;

      default:
        if (currentListIds.includes(topRootMenuItemId)) {
          rootMenu.submenu.push(
            menuMenuItemGenerateRootEnumeration(user, currentDataType, currentList, topRootMenuItemId, currentNameId),
          );
        }
        break;
    }
  } else {
    currentListIds.forEach((itemId) => {
      const menuItem = menuMenuItemGenerateRootEnumeration(user, currentDataType, currentList, itemId, currentNameId);
      if (menuItem) {
        rootMenu.submenu.push(menuItem);
      }
    });
    if (!isFunctionsFirst) {
      functionsListIds
        .filter((itemId) => functionsList[itemId].isExternal)
        .forEach((itemId) => {
          const menuItem = menuMenuItemGenerateRootEnumeration(
            user,
            dataTypeFunction,
            functionsList,
            itemId,
            enumerationsNamesMany,
          );
          if (menuItem) {
            rootMenu.submenu.push(menuItem);
          }
        });
    }
    // logs(`Done 1`);
    let menuItem = menuMenuItemGenerateRootReports(user);
    if (menuItem && menuItem.submenu.length) {
      rootMenu.submenu.push(menuItem);
    }
    menuItem = menuMenuItemGenerateRootMenuSetup(user);
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
 * @param  {object} commandOptions - The options required for the `cmdItemDeleteConfirm`
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateDeleteItem(user, upperMenuItemIndex, subMenuItemIndex, commandOptions) {
  // logs(`command = ${commandPackParams(cmdItemDeleteConfirm, dataType, dataItem, dataId, ...dataValues)}`, _l)
  return {
    index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemDelete)}`,
    icon: iconItemDelete,
    group: cmdItemDelete,
    command: cmdItemDelete,
    options: {index: subMenuItemIndex},
    submenu: [
      {
        index: `${upperMenuItemIndex}.${subMenuItemIndex}.0`,
        name: `${translationsItemCoreGet(user, cmdItemDeleteConfirm)}`,
        icon: iconItemDelete,
        //cfgItem, typeOfOption, subMenuIndex
        command: cmdItemDeleteConfirm,
        options: commandOptions,
        submenu: [],
      },
    ],
  };
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} _user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} itemGroup - The name of the menu item.
 * @param {object} commandOptions - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateEditItem(
  _user,
  upperMenuItemIndex,
  subMenuItemIndex,
  itemName,
  itemGroup,
  commandOptions,
) {
  const menuItem = {
    index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
    name: itemName,
    icon: iconItemEdit,
    command: cmdGetInput,
    options: commandOptions,
    submenu: [],
  };
  if (itemGroup) menuItem.group = itemGroup;
  return menuItem;
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {object} commandOptions - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateRenameItem(user, upperMenuItemIndex, subMenuItemIndex, commandOptions) {
  return menuMenuItemGenerateEditItem(
    user,
    upperMenuItemIndex,
    subMenuItemIndex,
    `${translationsItemCoreGet(user, 'cmdItemRename')}`,
    '',
    commandOptions,
  );
}

/**
 * Generates menu item which call the user input for Add new item (i.e. set name).
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {object} commandOptions - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateAddItem(user, upperMenuItemIndex, subMenuItemIndex, commandOptions) {
  return {
    index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
    icon: iconItemPlus,
    command: cmdGetInput,
    options: commandOptions,
    group: 'addNew',
    submenu: [],
  };
}

/**
 * Generates menu item which call the reset for current menu item.
 * @param {object} user - The user object.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {object} commandOptions - The options to be processed by `cmdItemReset`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateResetItem(user, upperMenuItemIndex, subMenuItemIndex, commandOptions) {
  return {
    index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemReset)}`,
    icon: iconItemReset,
    command: cmdItemReset,
    options: commandOptions,
    group: 'reset',
    submenu: [],
  };
}

/**
 * Generates two menu items to move an item `up` and `down` in it's holder collection(array), which will be processed by `cmdItemMoveUp`/`cmdItemMoveDown`
 * @param {object} user - The user object.
 * @param {object[]} subMenu - The current level menu items array.
 * @param {string} upperMenuItemIndex - The upper level item menu index.
 * @param {number} subMenuItemIndex - The index of an item to be created.
 * @param {number} currentItemIndex - The index of an item in the appropriate collection (array).
 * @param {number} lastItemIndex - The current max index in the appropriate collection (array) which holds an item.
 * @param {object} commandOptions - The options, are required for  `cmdItemMoveUp`/`cmdItemMoveDown` to identify an item.
 * @param {string=} groupId - The group Id for menu.
 * @returns {[object[], number]} The array with an updated `subMenu` with new menu items to move an item `up` and `down`, and updated `subMenuItemIndex`.
 */
function menuMenuPartGenerateMoveItemUpAndDown(
  user,
  subMenu,
  upperMenuItemIndex,
  subMenuItemIndex,
  currentItemIndex,
  lastItemIndex,
  commandOptions,
  groupId = 'moveItem',
) {
  if (currentItemIndex > 0) {
    subMenuItemIndex = subMenu.push({
      index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
      name: `${iconItemMoveUp}`,
      command: cmdItemMoveUp,
      options: commandOptions,
      group: groupId,
      submenu: [],
    });
  }
  if (currentItemIndex < lastItemIndex) {
    subMenuItemIndex = subMenu.push({
      index: `${upperMenuItemIndex}.${subMenuItemIndex}`,
      name: `${iconItemMoveDown}`,
      command: cmdItemMoveDown,
      options: commandOptions,
      group: groupId,
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
function menuMenuGenerateFirstLevelAfterRoot(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index /* holderId
      ? `${menuItemToProcess.holderId}.${menuItemToProcess.id}`
      : menuItemToProcess.id */,
    isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    primaryInputType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
    primaryMenuItemsList = enumerationsList[primaryInputType].list,
    primaryLevelMenuItemId = menuItemToProcess.holderId
      ? `${menuItemToProcess.holderId}.${menuItemToProcess.id}`
      : menuItemToProcess.id,
    itemOptions = menuItemToProcess.options ? menuItemToProcess.options : {},
    {extraOptions} = itemOptions;
  let subMenu = [];
  // logs('primaryLevelMenuItemId = ' + JSON.stringify(primaryLevelMenuItemId), _l);
  if (primaryMenuItemsList.hasOwnProperty(primaryLevelMenuItemId)) {
    const primaryEnumerationId = isFunctionsFirst ? 'function' : 'destination',
      secondaryEnumerationId = isFunctionsFirst ? 'destination' : 'function',
      secondaryInputType = isFunctionsFirst ? dataTypeDestination : dataTypeFunction,
      namesCurrent = isFunctionsFirst ? enumerationsNamesMain : enumerationsNamesMany,
      isFunctionsFirstGlobal = configOptions.getOption(cfgMenuFunctionsFirst),
      inverseMasks = isFunctionsFirst !== isFunctionsFirstGlobal,
      primaryMenuItem = primaryMenuItemsList[primaryLevelMenuItemId],
      primaryState = isFunctionsFirst ? primaryMenuItem.state : '',
      primaryStateSectionsCount = isFunctionsFirst ? primaryMenuItem.statesSectionsCount : 0,
      secondaryMenuItemsList = enumerationsList[secondaryInputType].list,
      secondaryMenuItemsIndex = Object.keys(secondaryMenuItemsList)
        .filter((destId) => secondaryMenuItemsList[destId].isEnabled && secondaryMenuItemsList[destId].isAvailable)
        .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order),
      deviceList = {};
    let currentIcons = isFunctionsFirst ? {on: primaryMenuItem.iconOn, off: primaryMenuItem.iconOff} : {},
      currentIcon = isFunctionsFirst ? primaryMenuItem.icon : '';
    // logs(`currentLevelMenuItemsList = ${JSON.stringify(currentLevelMenuItemsList)}`);
    if (
      menuItemToProcess.hasOwnProperty('subordinates') &&
      typeOf(menuItemToProcess.subordinates, 'array') &&
      menuItemToProcess.subordinates.length
    ) {
      subMenu = menuMenuReIndex(menuItemToProcess.subordinates, currentIndex, extraOptions);
    }
    /**
     * this way to find an objects only by function and then filter by destination,
     * is a ten times faster than include destination in search pattern,
     * like $(`state[id=*.${currentFunction.state}](${currentFunction.enum}=${currentFuncId})(${destsList[destId].enum}=${destId})`)
     */
    $(
      `state[id=*${isFunctionsFirst ? `.${primaryState}` : ''}](${primaryMenuItem.enum}=${primaryLevelMenuItemId})`,
    ).each((stateId) => {
      if (existsObject(stateId)) {
        const currentObject = getObjectEnriched(stateId, '*');
        let shortStateId = isFunctionsFirst ? stateId.split('.').slice(-primaryStateSectionsCount).join('.') : '';
        if (currentObject.hasOwnProperty('enumIds')) {
          secondaryMenuItemsIndex.forEach((currentLevelMenuItemId) => {
            const currentLevelMenuItem = secondaryMenuItemsList[currentLevelMenuItemId];
            if (!isFunctionsFirst)
              shortStateId = stateId.split('.').slice(-currentLevelMenuItem.statesSectionsCount).join('.');
            if (
              (isFunctionsFirst || currentLevelMenuItem.state === shortStateId) &&
              currentObject['enumIds'].includes(
                `${prefixEnums}.${secondaryMenuItemsList[currentLevelMenuItemId].enum}.${currentLevelMenuItemId}`,
              )
            ) {
              if (!deviceList.hasOwnProperty(currentLevelMenuItemId)) deviceList[currentLevelMenuItemId] = [];
              if (!deviceList[currentLevelMenuItemId].includes(stateId))
                deviceList[currentLevelMenuItemId].push(stateId);
            }
          });
        }
      }
    });
    // logs(`deviceList = ${JSON.stringify(deviceList, null, 2)}`, _l)
    Object.keys(deviceList)
      .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)
      .forEach((currentLevelMenuItemId) => {
        if (currentLevelMenuItemId && currentLevelMenuItemId.includes('.')) {
          const [holderId, _subordinatedId] = currentLevelMenuItemId.split('.');
          if (!Object.keys(deviceList).includes(holderId)) {
            deviceList[holderId] = [];
          }
        }
      });
    Object.keys(deviceList)
      .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)
      .forEach((currentLevelMenuItemId) => {
        // logs(`currentLevelMenuItemId = ${JSON.stringify(currentLevelMenuItemId)}, deviceList[currentLevelMenuItemId] = ${deviceList[currentLevelMenuItemId]}`);
        // if (deviceList.hasOwnProperty(currentLevelMenuItemId)) {
        const menuItemId = `${primaryLevelMenuItemId}${rolesIdAndMaskDelimiter}${currentLevelMenuItemId}`,
          currentAccessLevel =
            user && user.userId ? usersInMenu.getMenuItemAccess(user.userId, menuItemId, inverseMasks) : undefined,
          functionId = isFunctionsFirst ? primaryLevelMenuItemId : currentLevelMenuItemId,
          destinationId = isFunctionsFirst ? currentLevelMenuItemId : primaryLevelMenuItemId;
        // logs(`primaryLevelMenuItemId = ${primaryLevelMenuItemId}, currentLevelMenuItemId = ${currentLevelMenuItemId}, currentAccessLevel = ${currentAccessLevel}`, _l);
        if (currentAccessLevel && !MenuRoles.accessLevelsPreventToShow.includes(currentAccessLevel)) {
          const currentLevelMenuItem = secondaryMenuItemsList[currentLevelMenuItemId];
          if (!isFunctionsFirst) {
            currentIcons = {on: currentLevelMenuItem.iconOn, off: currentLevelMenuItem.iconOff};
            currentIcon = currentLevelMenuItem.icon;
          }
          let currentMenuItem = {
            index: `${currentIndex}.${currentLevelMenuItemId}`,
            name: `${stringCapitalize(
              translationsGetEnumName(user, secondaryInputType, currentLevelMenuItemId, namesCurrent),
            )}`,
            icon: currentIcon,
            id: currentLevelMenuItemId,
            options: {
              [primaryEnumerationId]: primaryLevelMenuItemId,
              [secondaryEnumerationId]: currentLevelMenuItemId,
              [menuOptionHorizontalNavigation]: true,
            },
            accessLevel: currentAccessLevel,
            group: currentLevelMenuItem.group ? currentLevelMenuItem.group : menuButtonsDefaultGroup,
            submenu: new Array(),
          };
          const statesSectionsCount = isFunctionsFirst
            ? primaryMenuItem.statesSectionsCount
            : currentLevelMenuItem.statesSectionsCount;
          // logs('deviceList[currentLevelMenuItemId] = ' + JSON.stringify(deviceList[currentLevelMenuItemId]));
          if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelForbidden) < 0)
            deviceList[currentLevelMenuItemId].forEach((deviceStateId, _deviceIndex) => {
              const devicePrefix = deviceStateId.split('.').slice(0, -statesSectionsCount).join('.'),
                deviceId = devicePrefix.split('.').pop();
              let deviceMenuItem = {
                index: `${currentIndex}.${currentLevelMenuItemId}.${deviceId}`,
                name: `${translationsGetObjectName(user, devicePrefix, functionId, destinationId)}`,
                type: menuItemToProcess.type,
                id: menuItemId,
                accessLevel: currentAccessLevel,
                options: {
                  [primaryEnumerationId]: primaryLevelMenuItemId,
                  [secondaryEnumerationId]: currentLevelMenuItemId,
                  state: deviceStateId,
                  device: devicePrefix,
                },
                function: enumerationsMenuItemDetailsDevice,
                icons: currentIcons,
                icon: currentIcon,
                submenu: enumerationsMenuGenerateDevice,
              };
              if (extraOptions && extraOptions.deviceFunction) {
                deviceMenuItem.options = {...deviceMenuItem.options, extraOptions};
                const deviceFunction = extraOptions.deviceFunction;
                deviceMenuItem = deviceFunction(deviceMenuItem);
              }
              if (deviceMenuItem) currentMenuItem.submenu.push(deviceMenuItem);
            });
          if (
            ((isFunctionsFirst && primaryMenuItem.simplifyMenuWithOneDevice) ||
              (!isFunctionsFirst &&
                !currentLevelMenuItemId.includes('.') &&
                currentLevelMenuItem.simplifyMenuWithOneDevice)) &&
            currentMenuItem.submenu.length === 1
          ) {
            if (
              (isFunctionsFirst &&
                primaryMenuItem.simplifyMenuWithOneDevice &&
                primaryMenuItem.showDestNameOnSimplify) ||
              (!isFunctionsFirst &&
                currentLevelMenuItem.simplifyMenuWithOneDevice &&
                currentLevelMenuItem.showDestNameOnSimplify)
            ) {
              currentMenuItem.submenu[0]['name'] = currentMenuItem.name;
            }
            currentMenuItem.submenu[0]['index'] = currentMenuItem.index;
            currentMenuItem.submenu[0]['id'] = currentMenuItem.id;
            currentMenuItem = currentMenuItem.submenu[0];
          }
          if (currentLevelMenuItemId.includes('.')) {
            const [holderId, subordinatedId] = currentLevelMenuItemId.split('.');
            let holderItem = subMenu.find((subMenuItem) => subMenuItem.id === holderId);
            if (holderItem) {
              const holderSubMenu = holderItem.submenu;
              currentMenuItem.holderId = holderId;
              currentMenuItem.id = subordinatedId;
              currentMenuItem.group += 'subordinates';
              let firstDeviceIndex = 0;
              for (firstDeviceIndex; firstDeviceIndex < holderSubMenu.length; firstDeviceIndex++) {
                if (!holderSubMenu[firstDeviceIndex].holderId) {
                  break;
                }
              }
              if (firstDeviceIndex < holderSubMenu.length) {
                holderItem.submenu.splice(firstDeviceIndex, 0, currentMenuItem);
              } else {
                holderItem.submenu.push(currentMenuItem);
              }
              /** can be used, instead of checking item in GenMenuRowToProcess by last index part **/
              // holderItem.submenu = makeMenuIndexed(holderItem.submenu, holderItem.index);
            }
          } else {
            subMenu.push(currentMenuItem);
          }
        }
        // }
      });
  }
  // logs(`subMenu Pre = ${JSON.stringify(subMenu, null, 1)}`, _l);
  if (subMenu.length) {
    for (const subMenuIndex of subMenu.keys()) {
      const currentSubMenuItem = subMenu[subMenuIndex],
        currentSubMenuItemSubmenu = currentSubMenuItem.submenu;
      if (typeOf(currentSubMenuItemSubmenu, 'array') && currentSubMenuItemSubmenu.length === 0) {
        delete subMenu[subMenuIndex];
      }
    }
    subMenu = subMenu.filter((item) => item);
  }
  // logs(`subMenu New = ${JSON.stringify(subMenu, null, 1)}`, _l);
  return subMenu;
}

/**
 * This function process the array with strings to create  multi-line string with fixed length of lines.
 * @param {object} user - The user object.
 * @param {object[]} linesArray - The input array of objects contained an formatted string and it's length modifier.
 * @returns {string} The result formatted string.
 */
function menuMenuItemDetailsPrintFixedLengthLines(user, linesArray) {
  const maxLineLen = configOptions.getOptionWithModifier(cfgSummaryTextLengthMax, user);
  let printedText = '';
  linesArray.forEach((lineObject) => {
    logs(`reportLineObject = ${JSON.stringify(lineObject)}`);
    let lineLabel = lineObject['label'];
    const lineValue = lineObject.hasOwnProperty('valueString') ? `${lineObject['valueString']}` : '',
      lineValueLength =
        lineValue.length + (lineObject.hasOwnProperty('lengthModifier') ? lineObject['lengthModifier'] : 0),
      lineLabelLengthMax = maxLineLen - lineValueLength;
    if (lineLabelLengthMax <= lineLabel.length) {
      lineLabel = `${lineLabel.slice(0, lineLabelLengthMax - 1)}:`;
    } else {
      lineLabel = `${lineLabel}:`.padEnd(lineLabelLengthMax);
    }
    printedText += `${printedText ? '\r\n' : ''}${lineLabel}${lineValue}`;
  });
  return printedText;
}

//*** menu items related functions - end ***//

const cachedMenuItemsAndRows = 'menuItemsAndRows',
  cachedCommandsOptionsList = 'commandsOptions',
  cachedMenuButtonsOffset = 'buttonsOffset',
  menuOptionHorizontalNavigation = 'horizontalNavigation';

/**
 * This function deletes the cached pre-drawn state of the user's menu items and rows.
 * @param {object} user - The user that is currently logged in.
 */
function menuMenuItemsAndRowsClearCached(user) {
  cachedValueDelete(user, cachedMenuItemsAndRows);
}

/**
 * This function go from the root level down to the target menu item (by `targetMenuPos`) iterative way, filling on each turn the appropriate information, as to the
 * text part of Telegram message, as for the buttons part, to prepare it for "draw" to user.
 * @param {object} user - The user object.
 * @param {string[]=} targetMenuPos - The position of the menu item in the menu tree, each item of array describes the position of item on each level of hierarchy of menu.
 * @param {object=} messageOptions - The options to draw the menu.
 * @param {object=} menuItemToProcess - The menu item, which have to be processed, to reach the final destination item by `targetMenuPos`.
 * @param {object=} messageObject - The prepared for "draw" the Telegram message object related to the the `targetMenuPos`. Will be filled additionally on each iteration.
 * @param {string=} currentIndent - The current indent on this step of iteration for the text part of Telegram message.
 */
function menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent = '') {
  /**
   * Default situation for call to draw menu, outside the function (i.e. no iterative call)
   */
  let topItemIndex = undefined;
  if (!menuItemToProcess) {
    if (targetMenuPos) {
      cachedValueSet(user, cachedMenuItem, targetMenuPos);
      targetMenuPos = [...targetMenuPos];
    } else {
      targetMenuPos = cachedValueExists(user, cachedMenuItem) ? cachedValueGet(user, cachedMenuItem) : [];
    }
    topItemIndex = targetMenuPos && targetMenuPos.length ? targetMenuPos[0] : undefined;
    menuItemToProcess = user.rootMenu
      ? user.rootMenu
      : menuMenuReIndex(menuMenuItemGenerateRootMenu(user, topItemIndex));
    const defaultOptions = {
      clearBefore: false,
      clearUserMessage: false,
      createNewMessage: !cachedValueGet(user, cachedMenuOn),
      isSilent: false,
      noDraw: false,
    };
    messageOptions = messageOptions ? {...defaultOptions, ...messageOptions} : defaultOptions;
  }
  /**
   * End of Default
   */
  if (!messageObject) {
    const [savedMenu, savedRows, savedTab] = cachedValueExists(user, cachedMenuItemsAndRows)
        ? cachedValueGet(user, cachedMenuItemsAndRows)
        : [null, null, 0],
      savedPos = savedMenu && savedMenu.index ? savedMenu.index.split('.') : null;
    // logs(`currentMenuPos: ${JSON.stringify(targetMenuPos)}, savedPos: ${JSON.stringify(savedPos)}, savedMenu: ${JSON.stringify(savedMenu)}`);
    if (savedPos && targetMenuPos && targetMenuPos.join('.').indexOf(savedPos.join('.')) === 0) {
      targetMenuPos = targetMenuPos.slice(savedPos.length);
      menuItemToProcess = savedMenu;
      messageObject = {...savedRows};
      currentIndent = savedTab;
      // logs(`New subMenuPos: ${JSON.stringify(targetMenuPos)}, preparedMessageObject: ${JSON.stringify(preparedMessageObject)}`);
    } else {
      messageObject = {
        message: '',
        buttons: [],
      };
    }
  }
  switch (typeOf(menuItemToProcess.submenu)) {
    case 'string': {
      const extensionMenuId = menuItemToProcess.submenu;
      messageTo(
        extensionMenuId,
        {
          user,
          data: menuItemToProcess,
          extensionId: menuItemToProcess.extensionId,
          translations: translationsGetForExtension(user, menuItemToProcess.extensionId),
        },
        {timeout: configOptions.getOption(cfgExternalMenuTimeout)},
        (newMenuItem) => {
          // logs(`extensionMenuId = ${extensionMenuId}, \n subMenu = ${JSON.stringify(subMenu)}, \n translations = ${JSON.stringify(translationsGetForExtension(user, menuItemToProcess.extensionId))}`, _l);
          if (
            !(typeof newMenuItem === 'object' && newMenuItem.hasOwnProperty('error')) &&
            newMenuItem.hasOwnProperty('name')
          ) {
            // logs(`subMenu = ${JSON.stringify(newMenuItem, null, 2)}`);
            menuItemToProcess = menuMenuReIndex(newMenuItem);
            // logs(`subMenuRow = ${JSON.stringify(menuItemToProcess, null, 2)}`, _l);
          } else {
            if (typeof newMenuItem === 'object' && newMenuItem.hasOwnProperty('error')) {
              console.warn(
                `Can't update subMenu from extensionMenuId ${extensionMenuId}! No result. Error is ${newMenuItem.error}`,
              );
            }
            targetMenuPos = [];
          }
          menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent);
        },
      );
      break;
    }
    case 'function': {
      menuItemToProcess.submenu = menuItemToProcess.submenu(user, menuItemToProcess);
      menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent);
      break;
    }
    default: {
      const hierarchicalCaption = configOptions.getOption(cfgHierarchicalCaption, user);
      if (hierarchicalCaption) {
        if (currentIndent === undefined) currentIndent = '';
        currentIndent = currentIndent.padStart(currentIndent.length + hierarchicalCaption);
      }
      let currentSubMenuPos;
      if (menuItemToProcess.submenu.length > 0 && targetMenuPos && targetMenuPos.length > 0) {
        currentSubMenuPos = targetMenuPos.shift();
        if (typeof currentSubMenuPos === 'string' && isNaN(Number(currentSubMenuPos))) {
          currentSubMenuPos = menuItemToProcess.submenu.findIndex(
            (item) =>
              (item.hasOwnProperty('id') && item.id === currentSubMenuPos) ||
              item.index.split('.').pop() === currentSubMenuPos,
          );
        } else {
          currentSubMenuPos = Number(currentSubMenuPos);
        }
      }
      if (
        currentSubMenuPos !== undefined &&
        currentSubMenuPos >= 0 &&
        menuItemToProcess.submenu.length > 0 &&
        currentSubMenuPos < menuItemToProcess.submenu.length
      ) {
        logs(
          `currentSubMenuPos = ${currentSubMenuPos}, currentMenuItem = ${JSON.stringify(menuItemToProcess, null, 2)}`,
        );
        messageObject.message +=
          (hierarchicalCaption
            ? '\n\r' + (messageObject.message ? currentIndent + iconItemToSubItem : '')
            : messageObject.message
            ? ' ' + iconItemToSubItemByArrow + ' '
            : '') +
          menuMenuItemGetIcon(user, menuItemToProcess) +
          menuItemToProcess.name;
        const subMenuItem = menuItemToProcess.submenu[currentSubMenuPos];
        messageObject.index = subMenuItem.index;
        if (messageObject.index === topItemIndex) {
          messageObject.shortIndex = topItemIndex;
        } else if (messageObject.shortIndex !== undefined) {
          messageObject.shortIndex = [messageObject.shortIndex, currentSubMenuPos].join('.');
        } else {
          messageObject.shortIndex = currentSubMenuPos;
        }
        // logs(`messageObject = ${JSON.stringify(messageObject, null, 2)}`, _l);
        messageObject.name = subMenuItem.hasOwnProperty('name') ? subMenuItem.name : undefined;
        messageObject.function = subMenuItem.hasOwnProperty('function') ? subMenuItem.function : undefined;
        messageObject.options =
          subMenuItem.hasOwnProperty('options') && subMenuItem.options !== undefined ? subMenuItem.options : {};
        if (messageObject.navigationLeft !== undefined) messageObject.navigationLeft = undefined;
        if (messageObject.navigationRight !== undefined) messageObject.navigationRight = undefined;
        const currentSubMenuMaxIndex = menuItemToProcess.submenu.length - 1,
          currentOptions = messageObject.options,
          horizontalNavigation =
            currentOptions && currentOptions.hasOwnProperty(menuOptionHorizontalNavigation)
              ? currentOptions[menuOptionHorizontalNavigation]
                ? 1
                : -1
              : 0;
        if (
          currentSubMenuMaxIndex > 0 &&
          (horizontalNavigation > 0 || configOptions.getOption(cfgShowHorizontalNavigation, user)) &&
          !(horizontalNavigation < 0)
        ) {
          if (currentSubMenuPos > 0) {
            for (let itemPos = currentSubMenuPos - 1; itemPos >= 0; itemPos--) {
              if (
                menuItemToProcess.submenu[itemPos].command === undefined ||
                !menuItemToProcess.submenu[itemPos].command.includes(cmdPrefix)
              ) {
                messageObject.navigationLeft = itemPos;
                break;
              }
            }
          }
          if (currentSubMenuPos < currentSubMenuMaxIndex) {
            for (let itemPos = currentSubMenuPos + 1; itemPos <= currentSubMenuMaxIndex; itemPos++) {
              if (
                menuItemToProcess.submenu[itemPos].command === undefined ||
                !menuItemToProcess.submenu[itemPos].command.includes(cmdPrefix)
              ) {
                messageObject.navigationRight = itemPos;
                break;
              }
            }
          }
        }
        menuMenuDraw(user, targetMenuPos, messageOptions, subMenuItem, messageObject, currentIndent);
      } else {
        cachedValueDelete(user, cachedMenuItemsAndRows);
        if (currentSubMenuPos >= menuItemToProcess.submenu.length) {
          let savedPos = cachedValueGet(user, cachedMenuItem);
          if (targetMenuPos && targetMenuPos.length) {
            for (let i = targetMenuPos.length - 1; i >= 0; i--) {
              if (savedPos[savedPos.length - 1] === targetMenuPos[i]) {
                savedPos.pop();
              }
            }
          }
          if (savedPos[savedPos.length - 1] === currentSubMenuPos) {
            savedPos.pop();
          }
          cachedValueSet(user, cachedMenuItem, savedPos);
        }
        if (menuItemToProcess.submenu.length) {
          cachedValueSet(user, cachedMenuItemsAndRows, [menuItemToProcess, {...messageObject}, currentIndent]);
        }
        messageObject.message +=
          (hierarchicalCaption
            ? '\n\r' + (messageObject.message ? currentIndent + iconItemToSubItem : '')
            : messageObject.message
            ? ` ${iconItemToSubItemByArrow} `
            : '') +
          menuMenuItemGetIcon(user, menuItemToProcess) +
          menuItemToProcess.name;
        if (messageObject.hasOwnProperty('function') && typeof messageObject.function === 'function') {
          const functionResult = messageObject.function(user, menuItemToProcess);
          if (typeof functionResult === 'string') {
            messageObject.message += functionResult.length > 0 ? '\r\n' + functionResult : '';
          }
        } else if (menuItemToProcess.hasOwnProperty('text') && menuItemToProcess.text !== undefined) {
          messageObject.message += menuItemToProcess.text.length > 0 ? menuItemToProcess.text : '';
        }
        messageObject.buttons = [];
        let currentIndex = menuItemToProcess.index !== undefined ? menuItemToProcess.index : '',
          currentBackIndex = currentIndex ? currentIndex.split('.').slice(0, -1).join('.') : '';
        const maxButtonsCount = configOptions.getOption(cfgMaxButtonsOnScreen, user);
        let buttonsCount = menuItemToProcess.submenu.length;
        let buttonsOffset = 0;
        if (buttonsCount > maxButtonsCount) {
          if (cachedValueExists(user, cachedMenuButtonsOffset)) {
            if (currentIndex) cachedAddToDelCachedOnBack(user, currentBackIndex, cachedMenuButtonsOffset);
            const [forIndex, currentOffset] = commandsParamsUnpack(cachedValueGet(user, cachedMenuButtonsOffset));
            if (currentIndex === forIndex) {
              buttonsOffset = Number(currentOffset);
              buttonsCount = buttonsCount - buttonsOffset;
            } else {
              cachedValueDelete(user, cachedMenuButtonsOffset);
            }
          }
        }
        if (currentIndex && currentIndex.length > 44) {
          currentIndex = currentIndex.replace(messageObject.index, messageObject.shortIndex);
          currentBackIndex = currentIndex.split('.').slice(0, -1).join('.');
        }
        // logs(`buttonsOffset = ${buttonsOffset}, buttonsCount = ${buttonsCount}, maxButtonsCount = ${maxButtonsCount}`);
        const _isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
          callbackDataToCache = new Map();
        // currentMenuItem.submenu.forEach(currentSubMenuItem => {
        for (
          let buttonsIndex = 0;
          buttonsIndex < (buttonsCount > maxButtonsCount ? maxButtonsCount : buttonsCount);
          buttonsIndex++
        ) {
          const currentSubMenuItem = menuItemToProcess.submenu[buttonsIndex + buttonsOffset];
          // logs(`currentSubMenuItem[${buttonsIndex + buttonsOffset}] = ${JSON.stringify(currentSubMenuItem, null, 2)}`, _l);
          const currentSubIndex =
            currentSubMenuItem.index.length > 50
              ? currentSubMenuItem.index.replace(messageObject.index, messageObject.shortIndex)
              : currentSubMenuItem.index;
          let callbackData = menuItemButtonPrefix + currentSubIndex;
          if (
            currentSubMenuItem.hasOwnProperty('command') &&
            typeof currentSubMenuItem.command === 'string' &&
            currentSubMenuItem.command.indexOf(cmdPrefix) === 0 &&
            currentSubMenuItem.command !== cmdPrefix
          ) {
            if (currentSubMenuItem.options) {
              callbackData = commandsCallbackDataPrepare(
                currentSubMenuItem.command,
                currentSubMenuItem.options,
                currentSubIndex,
                callbackDataToCache,
              );
            } else {
              callbackData = currentSubMenuItem.command;
            }
          } else if (currentSubMenuItem.hasOwnProperty('extensionCommandId')) {
            callbackData = commandsCallbackDataPrepare(
              cmdExternalCommand,
              {
                function: currentSubMenuItem.extensionId,
                item: currentSubMenuItem.extensionCommandId,
                attribute: currentSubMenuItem.externalCommandParams,
              },
              currentSubIndex,
              callbackDataToCache,
            );
          }
          messageObject.buttons.push({
            icon: menuMenuItemGetIcon(user, currentSubMenuItem),
            text: currentSubMenuItem.name,
            group: currentSubMenuItem.group ? currentSubMenuItem.group : menuButtonsDefaultGroup,
            callback_data: callbackData,
          });
        }
        if (buttonsOffset > 0) {
          messageObject.buttons.push({
            text: `${iconItemPrevious}${translationsItemMenuGet(user, 'Prev')} (${buttonsOffset / maxButtonsCount})`,
            group: 'offset',
            callback_data: commandsCallbackDataPrepare(
              cmdSetOffset,
              {index: currentIndex, offset: buttonsOffset - maxButtonsCount},
              [currentIndex, 'prev'].join('.'),
              callbackDataToCache,
            ),
          });
        }
        if (buttonsCount > maxButtonsCount) {
          messageObject.buttons.push({
            text: `${iconItemNext}${translationsItemMenuGet(user, 'Next')} (${
              Math.ceil(buttonsCount / maxButtonsCount) - 1
            })`,
            group: 'offset',
            callback_data: commandsCallbackDataPrepare(
              cmdSetOffset,
              {index: currentIndex, offset: buttonsOffset + maxButtonsCount},
              [currentIndex, 'next'].join('.'),
              callbackDataToCache,
            ),
          });
        }
        if (messageObject.navigationLeft !== undefined) {
          messageObject.buttons.push({
            text: `${iconItemMoveLeft}`,
            group: menuOptionHorizontalNavigation,
            callback_data: commandsCallbackDataPrepare(
              cmdItemJumpTo,
              {jumpToArray: [jumpToUp, messageObject.navigationLeft]},
              [currentIndex, 'left'].join('.'),
              callbackDataToCache,
            ),
          });
        }
        if (messageObject.navigationRight !== undefined) {
          messageObject.buttons.push({
            text: `${iconItemMoveRight}`,
            group: menuOptionHorizontalNavigation,
            callback_data: commandsCallbackDataPrepare(
              cmdItemJumpTo,
              {jumpToArray: [jumpToUp, messageObject.navigationRight]},
              [currentIndex, 'right'].join('.'),
              callbackDataToCache,
            ),
          });
        }
        messageObject.buttons = menuButtonsArraySplitIntoButtonsPerRowsArray(user, messageObject.buttons);
        let lastRow = [
          {
            text: translationsItemCoreGet(user, cmdClose),
            callback_data: `${cmdClose}${user.userId ? `${itemsDelimiter}${user.userId}` : ''}`,
          },
        ];
        if (currentBackIndex !== undefined) {
          if (configOptions.getOption(cfgShowHomeButton, user)) {
            lastRow.unshift({text: translationsItemCoreGet(user, cmdHome), callback_data: cmdHome});
          }
          lastRow.unshift({
            text: translationsItemCoreGet(user, cmdBack),
            callback_data: cmdBack + currentBackIndex,
          });
        }
        messageObject.buttons.push(lastRow);
        const alertMessages = alertGetMessages(user, true),
          alertMessagesCount = alertMessages.length,
          alertMessage = alertMessages.pop();
        logs('alertMessages = ' + JSON.stringify(alertMessages));
        if (alertMessage) {
          // @ts-ignore
          const alertDate = formatDate(new Date(alertMessage.date), configOptions.getOption(cfgDateTimeTemplate, user));
          messageObject.alert = `<b><u>${alertDate}:</u> ${alertMessage.message}</b>\r\n\r\n`;
          // logs('alertMessage = ' + JSON.stringify(alertMessages[alertMessages.length - 1].message));
          const alerts = alertsGet(),
            lastAlertId = alertMessage.id,
            alertRow = [
              {
                text: translationsItemCoreGet(user, cmdAcknowledgeAlert),
                callback_data: cmdAcknowledgeAlert,
              },
            ];
          if (alerts.hasOwnProperty(lastAlertId) && alerts[lastAlertId].chatIds.has(user.chatId)) {
            alertRow.push({
              text: translationsItemCoreGet(user, cmdAcknowledgeAndUnsubscribeAlert),
              callback_data: cmdAcknowledgeAndUnsubscribeAlert,
            });
          }
          messageObject.buttons.push(alertRow);
          if (alertMessagesCount) {
            messageObject.buttons.push([
              {
                text: '(' + alertMessagesCount + ') ' + translationsItemCoreGet(user, cmdAcknowledgeAllAlerts),
                callback_data: cmdAcknowledgeAllAlerts,
              },
            ]);
          }
        }
        cachedValueSet(user, cachedCommandsOptionsList, callbackDataToCache);
        // logs(`preparedMessageObject 3 = ${JSON.stringify(preparedMessageObject/* , null, 2 */)}`);
        if (!(messageOptions && messageOptions.hasOwnProperty('noDraw') && messageOptions.noDraw)) {
          telegramMessageObjectPush(
            user,
            {message: messageObject.message, buttons: messageObject.buttons, alert: messageObject.alert},
            messageOptions,
          );
        }
      }
      break;
    }
  }
}

/**
 * This function checks the availability of menu item(device) via `availableState` property of `function`.
 * @param {string|object} currentFunction - The id or full definition object of current `function`.
 * @param {string} primaryStateFullId - The full id of the primary state of the menu item(device).
 * @returns {boolean} The availability status.
 */
function menuItemIsAvailable(currentFunction, primaryStateFullId) {
  if (typeOf(currentFunction, 'string')) {
    currentFunction = enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunction)
      ? enumerationsList[dataTypeFunction].list[currentFunction]
      : undefined;
  } else if (!typeOf(currentFunction, 'object')) {
    currentFunction = null;
  }
  let result = true;
  if (currentFunction && currentFunction.hasOwnProperty('availableState')) {
    const currentFunctionAvailableStateId = currentFunction.availableState;
    if (currentFunctionAvailableStateId && primaryStateFullId) {
      const currentItemAvailableStateId = [
        ...primaryStateFullId.split('.').slice(0, -currentFunction.statesSectionsCount),
        currentFunctionAvailableStateId,
      ].join('.');
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
function menuMenuItemGetIcon(user, menuItemToProcess) {
  // logs(`\nsubMenuRowItem = ${JSON.stringify(menuItemToProcess)}`, _l);
  let icon = '';
  if (menuItemToProcess !== undefined) {
    if (menuItemToProcess.hasOwnProperty('options')) {
      const {function: currentFunctionId, state: currentStateId, device: devicePrefix} = menuItemToProcess.options,
        currentFunction =
          currentFunctionId && enumerationsList[dataTypeFunction].list.hasOwnProperty(currentFunctionId)
            ? enumerationsList[dataTypeFunction].list[currentFunctionId]
            : undefined;
      if (currentFunction && currentStateId) {
        if (!menuItemIsAvailable(currentFunction, currentStateId)) icon = iconItemUnavailable;
      }
      if (icon !== iconItemUnavailable) {
        if (typeOf(menuItemToProcess.icons, 'object')) {
          if (currentStateId && existsObject(currentStateId) && getObject(currentStateId).common.type === 'boolean') {
            const currentAttributeId = currentStateId.replace(`${devicePrefix}.`, ''),
              currentFunctionDeviceButtonsAndAttributes = {
                ...currentFunction.deviceAttributes,
                ...currentFunction.deviceButtons,
              },
              convertValueCode = currentFunctionDeviceButtonsAndAttributes.hasOwnProperty(currentAttributeId)
                ? currentFunctionDeviceButtonsAndAttributes[currentAttributeId].convertValueCode
                : '',
              currentValue = existsState(currentStateId) ? getState(currentStateId).val : undefined;
            icon =
              currentValue === undefined || currentValue === null
                ? iconItemNotFound
                : enumerationsEvaluateValueConversionCode(user, currentValue, convertValueCode)
                ? menuItemToProcess.icons.on
                : menuItemToProcess.icons.off;
          }
        } else if (typeOf(menuItemToProcess.icons, 'function')) {
          icon = menuItemToProcess.icons(user, menuItemToProcess);
        }
      }
    }
    if ((icon === undefined || icon === '') && menuItemToProcess.icon) icon = menuItemToProcess.icon;
  }
  return icon;
}

/**
 * This function extract the target menu item position as an array of "coordinates" from string.
 * @param {string} menuItemPositionString - The string, contained the "coordinates" in format 1.2.3.4".
 * @return {string[]} - The "coordinates" Array in format [1, 2, 3, 4].
 */
function menuMenuItemExtractPosition(menuItemPositionString) {
  logs('typeof cmd = ' + typeof menuItemPositionString);
  logs('cmd = ' + JSON.stringify(menuItemPositionString));
  if (typeof menuItemPositionString === 'string') {
    if (menuItemPositionString.length === 0) {
      return [];
    } else {
      return menuItemPositionString.split('.');
    }
  } else {
    return [];
  }
}

/**
 * This function clear Telegram message with Auto Telegram Menu, stores it's status as closed and clears appropriate cache values.
 * @param {object} user - The user object.
 */
function menuMenuClose(user) {
  telegramMessageClearCurrent(user, false);
  cachedValueSet(user, cachedMenuOn, false);
  cachedValueDelete(user, cachedMenuItem);
}

/**
 * This function, in case of the schedule for menu update is enabled in configuration, go thru all users, and checks the current open by user menu item for updates.
 * In case of it consists new information - it will be "redrawn".
 */
function menuMenuUpdateBySchedule() {
  const usersIds = usersInMenu.getUsers();
  for (const userId of usersIds) {
    logs('user = ' + JSON.stringify(userId));
    const user = telegramGenerateUserObjectFromId(userId);
    if (cachedValueGet(user, cachedMenuOn) === true) {
      const itemPos = cachedValueGet(user, cachedMenuItem);
      logs('for user = ' + JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
      if (!cachedValueGet(user, cachedIsWaitForInput) && itemPos !== undefined) {
        logs('make an menu update for = ' + JSON.stringify(user));
        // doMenuItem(user);
      }
    } else {
      logs('for user = ' + JSON.stringify(userId) + ' menu is closed');
    }
  }
}

/**
 * This function schedule a renew of the Telegram message, which consists a Auto Telegram Menu, to avoid the time limitation for the bots to edit their own messages.
 * @param {string} atTime - The time of the day as string in the format of 'hh:mm'.
 * @param {number=} idOfUser - The user's id.
 */
function menuMessageRenewSchedule(atTime, idOfUser) {
  if (!idOfUser || (idOfUser && usersInMenu.validId(idOfUser))) {
    if (
      idOfUser &&
      menuRefreshScheduled.has(idOfUser) &&
      menuRefreshScheduled.has(menuRefreshTimeAllUsers) &&
      menuRefreshScheduled.get(menuRefreshTimeAllUsers).atTime === atTime
    ) {
      clearSchedule(menuRefreshScheduled.get(idOfUser).reference);
      menuRefreshScheduled.delete(idOfUser);
    } else {
      const currentUser = idOfUser ? idOfUser : menuRefreshTimeAllUsers;
      const scheduledRefresh = menuRefreshScheduled.has(currentUser)
        ? menuRefreshScheduled.get(currentUser)
        : {atTime: '', reference: null};
      if (scheduledRefresh.atTime !== atTime) {
        if (scheduledRefresh.reference) clearSchedule(scheduledRefresh.reference);
        const atTimeArray = atTime.split(':');
        scheduledRefresh.atTime = atTime;
        scheduledRefresh.reference = schedule({hour: atTimeArray.shift(), minute: atTimeArray.pop()}, () => {
          console.log(
            `Refresh is scheduled on ${atTime} for ${
              currentUser === menuRefreshTimeAllUsers ? 'all users' : ` userId = ${currentUser}`
            }.`,
          );
          menuMenuMessageRenew(currentUser === idOfUser ? idOfUser : menuRefreshTimeAllUsers, false, false);
        });
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
 * @param {boolean=} noDraw - The selector, to do only preparation work (i.e. some cached values).
 */
function menuMenuMessageRenew(idOfUser, forceNow = false, noDraw = false) {
  let userIds =
    idOfUser !== menuRefreshTimeAllUsers && usersInMenu.validId(idOfUser) ? [idOfUser] : usersInMenu.getUsers();
  // logs('userIds = ' + JSON.stringify(userIds), _l);
  if (idOfUser === menuRefreshTimeAllUsers) {
    userIds = userIds.concat(telegramGetGroupChats(true));
    // logs(`users = ${JSON.stringify(userIds)}`, _l);
  }
  userIds.forEach((userId) => {
    // logs('userId = ' + JSON.stringify(userId), _l);
    if (
      idOfUser == userId ||
      (idOfUser === menuRefreshTimeAllUsers && (!menuRefreshScheduled.has(userId) || forceNow || noDraw))
    ) {
      const user = telegramGenerateUserObjectFromId(userId > 0 ? userId : undefined, userId > 0 ? undefined : userId);
      // logs('user = ' + JSON.stringify(user), _l);
      const [_lastBotMessageId48, isBotMessageOld48OrNotExists] = cachedGetValueAndCheckItIfOld(
          user,
          cachedBotSendMessageId,
          timeDelta48,
        ),
        [_lastBotMessageId24, isBotMessageOld24OrNotExists] = cachedGetValueAndCheckItIfOld(
          user,
          cachedBotSendMessageId,
          timeDelta24,
        ),
        isCachedMenuOn = cachedValueGet(user, cachedMenuOn);
      if (isCachedMenuOn === true && ((!isBotMessageOld48OrNotExists && isBotMessageOld24OrNotExists) || noDraw)) {
        const itemPos = cachedValueGet(user, cachedMenuItem);
        console.warn('for user = ' + JSON.stringify(user) + ' menu is open on ' + JSON.stringify(itemPos));
        if (!cachedValueGet(user, cachedIsWaitForInput) && itemPos !== undefined) {
          if (noDraw) {
            console.warn(
              `Make an menu object prepared for user/chat group = ${JSON.stringify({...user, rootMenu: null})}`,
            );
          } else {
            console.warn(`Make an menu refresh for user/chat group = ${JSON.stringify({...user, rootMenu: null})}`);
          }
          menuMenuDraw(user, itemPos, {clearBefore: true, clearUserMessage: false, isSilent: true, noDraw});
        }
      } else if (!isBotMessageOld24OrNotExists) {
        console.warn(
          `For user/chat group = ${JSON.stringify({
            ...user,
            rootMenu: null,
          })} menu is updated(by new message) less the 24 hours ago. Menu refresh is not required.`,
        );
      } else {
        console.warn(
          `For user/chat group = ${JSON.stringify({
            ...user,
            rootMenu: null,
          })} menu is closed(${!isCachedMenuOn}) or unaccessible(${isBotMessageOld48OrNotExists}). Can't refresh.`,
        );
      }
      alertsHistoryClearOld(user);
    }
  });
}

/**
 * This function splits the input `buttonsArray` to the `buttonsRowsArray`, based on configured `cfgSummaryTextLengthMax`
 * and the buttons groups assignment.
 * @param {object} user - The user object.
 * @param {object[]} buttonsArray - The plain array with buttons objects.
 * @returns {array[]} The Array of Arrays of buttons objects, represented the rows.
 */
function menuButtonsArraySplitIntoButtonsPerRowsArray(user, buttonsArray) {
  const maxTextLength = configOptions.getOptionWithModifier(cfgSummaryTextLengthMax, user),
    menuButtonsDefaultGroup = 'defaultGroup';
  let buttonsRowsArray = [],
    buttonsRow = [],
    currentRowLength = 0,
    currentGroup = '';
  buttonsArray.forEach((currentButton, _buttonIndex) => {
    const currentLength = currentButton.text.length + (currentButton.icon ? 2 : 0);
    if (
      (buttonsRow.length > 0 && currentRowLength + currentLength > maxTextLength) ||
      (currentGroup && currentGroup !== currentButton.group)
    ) {
      currentGroup = currentButton.group ? currentButton.group : menuButtonsDefaultGroup;
      buttonsRowsArray.push(buttonsRow);
      buttonsRow = [];
      currentRowLength = 0;
    }
    currentGroup = currentButton.group ? currentButton.group : menuButtonsDefaultGroup;
    buttonsRow.push({
      text: `${currentButton.icon ? currentButton.icon : ''}${currentButton.text}`,
      callback_data: currentButton.callback_data,
    });
    currentRowLength += currentLength;
  });
  if (buttonsRow.length > 0) {
    buttonsRowsArray.push(buttonsRow);
  }
  return buttonsRowsArray;
}

/**
 * This function is a re-indexing of an input menu. It takes the input menu, which can be either an object or an array
 * of objects, and then creates a new menu with an index property filled with strings consisting of “coordinates” based
 * off of the given indexPrefix. In filling the index, it takes the id property of the menu item (if it exists) or the
 * current index of the item in the array.
 * @param {object|object[]} inputMenu - The menu object or array of menu objects, which to be indexed.
 * @param {string=} indexPrefix - The index prefix for the current menu level.
 * @param {object=} extraOptions - The extra options object.
 * @returns {object|object[]} Newly created menu item or submenu array.
 */
function menuMenuReIndex(inputMenu, indexPrefix, extraOptions) {
  let newMenuRow;
  if (typeOf(inputMenu, 'array')) {
    newMenuRow = [];
    inputMenu
      .filter((menuItem) => menuItem)
      .forEach((menuItem, menuItemIndex) => {
        const newMenuRowItem = {},
          indexSuffix =
            menuItem.hasOwnProperty('id') && menuItem.id && !menuItem.id.includes('.') ? menuItem.id : menuItemIndex;
        newMenuRowItem.index =
          indexPrefix && indexPrefix.length > 0 ? [indexPrefix, indexSuffix].join('.') : indexSuffix;
        Object.keys(menuItem).forEach((attributeId) => {
          switch (attributeId) {
            case 'index': {
              break;
            }
            case 'subordinates': {
              newMenuRowItem[attributeId] = [...menuItem[attributeId]];
              break;
            }
            case 'submenu': {
              if (typeOf(menuItem.submenu, 'array') && menuItem.submenu.length) {
                newMenuRowItem.submenu = menuMenuReIndex(menuItem.submenu, newMenuRowItem.index, extraOptions);
              } else {
                newMenuRowItem.submenu = menuItem.submenu;
              }
              break;
            }
            case 'options': {
              if (extraOptions) {
                if (menuItem.options) {
                  newMenuRowItem.options = {...menuItem.options, extraOptions};
                } else {
                  newMenuRowItem.options = {extraOptions};
                }
                break;
              }
            }
            // eslint-disable-next-line no-fallthrough
            default:
              newMenuRowItem[attributeId] = menuItem[attributeId];
              break;
          }
        });
        newMenuRow.push(newMenuRowItem);
      });
  } else if (typeof inputMenu === 'object' && inputMenu.hasOwnProperty('submenu')) {
    newMenuRow = objectDeepClone({...inputMenu, submenu: undefined});
    if (extraOptions) {
      if (newMenuRow.options) {
        newMenuRow.options = {...newMenuRow.options, extraOptions};
      } else {
        newMenuRow.options = {extraOptions};
      }
    }
    newMenuRow.index = newMenuRow.index !== undefined ? newMenuRow.index : '';
    newMenuRow.submenu = typeOf(inputMenu.submenu, 'array')
      ? menuMenuReIndex(inputMenu.submenu, newMenuRow.index, extraOptions)
      : inputMenu.submenu;
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
function commandsParamsPack(...inputParams) {
  return inputParams.filter((inputParam) => inputParam !== undefined && inputParam !== null).join(itemsDelimiter);
}

/**
 * This function prepares command with option to be fit into `callbackData` field of telegramMenu button object.
 * If length of callbackData is more then 64, then all options data will be stored in separate map `callbackDataToCache`.
 * @param {string} command - The current menu item command ID.
 * @param {object} options - The command options object.
 * @param {string} index - The index of current menu item.
 * @param {Map} callbackDataToCache - The Map object to store options in cache.
 * @returns {string} The command and options(or index) "packed" to string;
 */
function commandsCallbackDataPrepare(command, options, index, callbackDataToCache) {
  callbackDataToCache.set(index, options);
  return commandsParamsPack(command, index);
}

/**
 * This function "unpack"(splits) command and params from string to the array.
 * @param {string} command - The "command" string, with Command ID and parameters, splitted by `itemsDelimiter`.
 * @param {string[]=} defaultValue
 * @returns {string[]}
 */
function commandsParamsUnpack(command, defaultValue) {
  let result = defaultValue && typeOf(defaultValue, 'array') ? defaultValue : [];
  if (command && typeOf(command, 'string')) {
    result = command.split(itemsDelimiter);
  }
  return result;
}

/**
 * This function "extracts"(parses) command and respective options from string to the object.
 * @param {object} user - The user object.
 * @param {string} userInputString  - The user input or data from menu.
 * @param {Map=} commandsOptionsList  - The Map with command-options pairs.
 * @returns {object} The result object in format {command: , options: }.
 */
function commandsExtractCommandWithOptions(user, userInputString, commandsOptionsList) {
  let currentOptions = {};
  const [currentCommand, currentCommandIndex] = commandsParamsUnpack(userInputString, [cmdNoOperation]);
  if (currentCommandIndex) {
    const cachedLongCommands = commandsOptionsList
      ? commandsOptionsList
      : cachedValueExists(user, cachedCommandsOptionsList)
      ? cachedValueGet(user, cachedCommandsOptionsList)
      : undefined;
    if (cachedLongCommands && cachedLongCommands.has(currentCommandIndex)) {
      currentOptions = cachedLongCommands.get(currentCommandIndex);
    }
  }
  return {command: currentCommand, options: currentOptions, index: currentCommandIndex};
}

/**
 * This function is a core to process of  the user input. It can be an input as user message,
 * or the appropriate text, when the menu button is pressed.
 * @param {object} user - The user object.
 * @param {string} userInputToProcess - The string, contained the user input.
 */
async function commandsUserInputProcess(user, userInputToProcess) {
  let timer;

  /**
   * This function is called, when the "execution" is finished.
   * It displayed pop-up with result, and then redraw the menu.
   * @param {object} user - The user object.
   * @param {any=} result -(`string`) The execution result.
   * @param {boolean=} isFromGetInput - The selector to identify a way of input value come
   */
  function stateOrCommandProcessed(user, result, isFromGetInput = false) {
    if (timer) clearTimeout(timer);
    cachedValueSet(user, cachedCurrentState, '');
    telegramMessageDisplayPopUp(user, result.error ? result.error : translationsItemTextGet(user, 'MsgSuccess'));
    if (!result.error || result.success) {
      menuMenuItemsAndRowsClearCached(user);
      if (isFromGetInput) {
        menuMenuDraw(user, undefined, {
          clearBefore: user.userId !== user.chatId,
          clearUserMessage: user.userId === user.chatId,
        });
      } else {
        menuMenuDraw(user);
      }
    }
  }

  /**
   * This function is used to set the state value via standard 'setState' and process the result.
   * @param {object} user - The user object.
   * @param {string} stateId - The state ID to set value.
   * @param {any=} stateValue  - The possible value for the state.
   * @param {boolean=} isFromGetInput - The selector to identify a way of input value come.
   */
  function setStateValue(user, stateId, stateValue, isFromGetInput = false) {
    // logs(`setState with state: '${currentType}' and value ${currentItem}`, _l);
    const currentObject = getObjectEnriched(stateId);
    logs('currObject = ' + JSON.stringify(currentObject));
    if (currentObject.common['write']) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
        console.error(`Error! No response from setState() for ${stateId}`);
        menuMenuDraw(user);
      }, 4000);
      cachedValueSet(user, cachedCurrentState, stateId);
      const currentObjectCommon = currentObject.common,
        currentStateType = currentObjectCommon['type'],
        setStateCallback = (error) =>
          stateOrCommandProcessed(user, {success: error === undefined, error}, isFromGetInput);
      if (currentStateType === 'boolean' || stateValue !== undefined) {
        if (currentStateType === 'boolean') {
          const currentState = getState(stateId),
            currentStateValue = currentState.val === undefined || currentState.val === null ? false : currentState.val;
          setState(stateId, !currentStateValue, setStateCallback);
        } else if (currentObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(currentStateType)) {
          const currentStatePossibleValues = enumerationsExtractPossibleValueStates(currentObjectCommon['states']);
          logs('possibleValue = ' + JSON.stringify(stateValue));
          logs('Object.keys(states). = ' + JSON.stringify(Object.keys(currentStatePossibleValues)));
          if (Object.keys(currentStatePossibleValues).includes(stateValue)) {
            setState(stateId, currentStateType === 'number' ? Number(stateValue) : stateValue, setStateCallback);
          } else {
            console.error(
              `Value '${stateValue}' not in the acceptable list ${JSON.stringify(
                Object.keys(currentStatePossibleValues),
              )}`,
            );
            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueNotInTheList'));
            clearTimeout(timer);
          }
        } else if (currentStateType === 'number') {
          const possibleNumber = Number(stateValue);
          if (checkNumberStateValue(stateId, possibleNumber, currentObjectCommon)) {
            setState(stateId, possibleNumber, setStateCallback);
          } else {
            console.error(
              `Unacceptable value '${possibleNumber}' for object conditions ${JSON.stringify(currentObject.common)}`,
            );
            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
            clearTimeout(timer);
          }
        } else {
          clearTimeout(timer);
          console.error(`Unsupported object type: '${currentStateType}'`);
          telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgUnsupportedObjectType'));
        }
      } else {
        clearTimeout(timer);
        console.error(
          `Unacceptable value '${stateValue}' for state conditions ${JSON.stringify(currentObject.common)}`,
        );
        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
      }
    }
  }

  const isWaitForInput = cachedValueGet(user, cachedIsWaitForInput),
    userInput = isWaitForInput ? isWaitForInput : userInputToProcess,
    menuMessageObject = {};
  let currentMenuPosition = cachedValueGet(user, cachedMenuItem);
  const {command: currentCommand, options: commandOptions} = commandsExtractCommandWithOptions(user, userInput);
  // logs(`userInput = ${userInput}, userInputToProcess: ${userInputToProcess}, command = ${currentCommand}, commandOptions = ${JSON.stringify(commandOptions)}, currentMenuItem = ${currentMenuPosition}`, _l);
  if (isWaitForInput) {
    if (userInputToProcess != dataTypeIgnoreInput) {
      switch (currentCommand) {
        case cmdItemUpload: {
          // logs(`commandOptions.dataType = ${commandOptions.dataType}, currentItem = ${currentItem}, currentParam = ${currentParam}, userInputToProcess = ${userInputToProcess}`, _l);
          switch (commandOptions.dataType) {
            case dataTypeTranslation: {
              const isTranslationFileOk = translationsCheckAndCacheUploadedFile(
                user,
                userInputToProcess,
                commandOptions.fileName,
                commandOptions.fileSize,
              );
              if (isTranslationFileOk) {
                currentMenuPosition.push(
                  // @ts-ignore
                  isNaN(commandOptions.translationPart)
                    ? commandOptions.translationPart
                    : Number(commandOptions.translationPart),
                );
                // logs(`currentMenuItem = ${currentMenuItem}`);
              } else {
                telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
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
          switch (commandOptions.dataType) {
            case dataTypeTranslation: {
              let currentTranslationId;
              if (commandOptions.translationType && commandOptions.item && commandOptions.index) {
                currentTranslationId = commandOptions.translationType;
                let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > Number(commandOptions.item)
                ) {
                  currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(commandOptions.item)]}`;
                  destTranslation = destTranslation[Object.keys(destTranslation)[Number(commandOptions.item)]];
                  if (
                    destTranslation &&
                    typeOf(destTranslation) === 'object' &&
                    Object.keys(destTranslation).length > Number(commandOptions.index)
                  ) {
                    currentTranslationId += `.${Object.keys(destTranslation)[Number(commandOptions.index)]}`;
                  }
                }
              } else if (commandOptions.translationId) {
                currentTranslationId = commandOptions.translationId;
              }
              if (currentTranslationId) translationsItemStore(user, currentTranslationId, userInputToProcess);
              const currentTranslation = translationsGetCurrentForUser(user);
              if (commandOptions.translationType && commandOptions.item && !commandOptions.index) {
                const newPosition = Object.keys(currentTranslation)
                  .filter((key) => !key.includes('.') && key.indexOf(commandOptions.item) === 0)
                  .sort((a, b) => currentTranslation[a].localeCompare(currentTranslation[b]))
                  .indexOf(commandOptions.translationType);
                if (newPosition >= 0) {
                  currentMenuPosition.splice(-1, newPosition);
                }
              }
              break;
            }

            case dataTypeDestination:
            case dataTypeFunction:
            case dataTypeReport:
            case dataTypePrimaryEnums:
            case dataTypeDeviceAttributes:
            case dataTypeDeviceButtons: {
              const currentEnumerationsList = enumerationsGetList(
                commandOptions.dataType,
                commandOptions.dataTypeExtraId,
              );
              switch (commandOptions.attribute) {
                case 'state': {
                  const currentDeviceAttributes = currentEnumerationsList[commandOptions.item].deviceAttributes;
                  if (currentDeviceAttributes && currentDeviceAttributes.hasOwnProperty(commandOptions.attribute)) {
                    currentDeviceAttributes[userInputToProcess] = objectDeepClone(
                      currentDeviceAttributes[commandOptions.attribute],
                    );
                    currentDeviceAttributes[userInputToProcess].nameTranslationId = translationsGetObjectId(
                      userInputToProcess.split('.').join('_'),
                      commandOptions.item,
                      undefined,
                    );
                    delete currentDeviceAttributes[commandOptions.attribute];
                  }
                  break;
                }
                case 'setId':
                case 'fixId': {
                  cachedValueSet(user, cachedSimpleReportIdToCreate, userInputToProcess);
                  break;
                }
                case 'names': {
                  enumerationsUpdateItemName(
                    user,
                    commandOptions.dataType,
                    commandOptions.item,
                    currentEnumerationsList[commandOptions.item],
                    userInputToProcess,
                    commandOptions.index !== enumerationsNamesMain ? commandOptions.index : '',
                  );
                  break;
                }
                case 'convertValueCode': {
                  if (
                    enumerationsTestValueConversionCode(
                      user,
                      commandOptions.dataTypeExtraId,
                      commandOptions.item,
                      userInputToProcess,
                    )
                  ) {
                    currentEnumerationsList[commandOptions.item][commandOptions.attribute] = userInputToProcess;
                  } else {
                    console.warn(
                      `Unacceptable value '${userInputToProcess}' code conversion of attribute ${commandOptions.item} for function ${commandOptions.dataTypeExtraId}`,
                    );
                    telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                  }
                  break;
                }
                default: {
                  const oldIcon =
                    commandOptions.dataType === dataTypePrimaryEnums && commandOptions.attribute === 'icon'
                      ? currentEnumerationsList[commandOptions.item][commandOptions.attribute]
                      : '';
                  currentEnumerationsList[commandOptions.item][commandOptions.attribute] = userInputToProcess;
                  if (commandOptions.dataType === dataTypePrimaryEnums && commandOptions.attribute === 'icon') {
                    const workList = enumerationsList[commandOptions.dataTypeExtraId].list;
                    Object.keys(workList).forEach((currentListItem) => {
                      if (
                        workList[currentListItem].enum === commandOptions.dataType &&
                        currentEnumerationsList[currentListItem].icon === oldIcon
                      ) {
                        currentEnumerationsList[currentListItem].icon = userInputToProcess;
                      }
                    });
                    enumerationsInit(commandOptions.dataTypeExtraId);
                  }
                  break;
                }
              }
              enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
              break;
            }

            case dataTypeGroups: {
              const currentEnumerationsList = enumerationsGetList(
                commandOptions.groupDataType,
                commandOptions.groupDataTypeExtraId,
              );
              if (
                commandOptions.item &&
                currentEnumerationsList &&
                currentEnumerationsList.hasOwnProperty(commandOptions.item) &&
                currentEnumerationsList[commandOptions.item]
              ) {
                currentEnumerationsList[commandOptions.item].group = userInputToProcess;
              }
              // logs(`currentParam, currentValue = ${[commandOptions.dataType, currentItem, currentParam, currentValue,]}`, _l)
              enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
              break;
            }

            case dataTypeMenuRoles: {
              switch (commandOptions.mode) {
                case 'setId':
                case 'fixId':
                  cachedValueSet(user, cachedRolesNewRoleId, userInputToProcess);
                  break;
                default:
                  break;
              }
              break;
            }

            case dataTypeReportMember: {
              let queryParams = cachedValueGet(user, cachedSimpleReportNewQuery);
              queryParams = queryParams ? queryParams : simpleReportQueryParamsTemplate();
              queryParams[commandOptions.item] = userInputToProcess;
              cachedValueSet(user, cachedSimpleReportNewQuery, queryParams);
              break;
            }

            case dataTypeConfig: {
              if (commandOptions.item === cfgMenuLanguage) {
                cachedValueSet(user, cachedConfigNewLanguageId, userInputToProcess);
              } else {
                const configItem = configOptions.getOption(
                  commandOptions.item,
                  commandOptions.scope === configOptionScopeGlobal ? null : user,
                );
                if (
                  typeOf(configItem, 'array') &&
                  // @ts-ignore
                  !isNaN(commandOptions.index)
                ) {
                  const configItemIndex = Number(commandOptions.index);
                  let newValue;
                  newValue = userInputToProcess;
                  if (configItemIndex < configItem.length) {
                    if (commandOptions.item === cfgGraphsIntervals) {
                      configItem[configItemIndex].name = newValue;
                    } else {
                      configItem[configItemIndex] = newValue;
                    }
                  } else {
                    if (commandOptions.item === cfgGraphsIntervals) {
                      const currentMask = configOptions.getMask(commandOptions.item),
                        configItemMask = configOptions.getMaskDescription(commandOptions.item),
                        parsedValueArray =
                          currentMask && currentMask.test(userInputToProcess)
                            ? userInputToProcess.match(currentMask)
                            : [],
                        parsedValue =
                          parsedValueArray &&
                          parsedValueArray.length &&
                          timeIntervalsInMinutes.hasOwnProperty(parsedValueArray[2])
                            ? Number(parsedValueArray[1]) * timeIntervalsInMinutes[parsedValueArray[2]]
                            : undefined;
                      newValue = parsedValue !== undefined ? {id: userInputToProcess, minutes: parsedValue} : null;
                      menuMessageObject.message = `${translationsItemTextGet(
                        user,
                        'WrongValue',
                      )}!\n${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(
                        user,
                        'ForConfig',
                      )} '${translationsItemCoreGet(user, commandOptions.item)}' (${translationsItemTextGet(
                        user,
                        'CurrentValue',
                      )} = ${userInputToProcess})${
                        configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''
                      }:`;
                    }
                    if (newValue !== null) {
                      configItem.push(newValue);
                      if (menuMessageObject.message) menuMessageObject.message = '';
                    }
                  }
                  configOptions.setOption(commandOptions.item, user, configItem);
                } else {
                  const parsedValue = configOptions.parseOption(commandOptions.item, userInputToProcess);
                  if (parsedValue === undefined) {
                    const configItem = configOptions.getOption(
                        commandOptions.item,
                        commandOptions.scope === configOptionScopeGlobal ? null : user,
                      ),
                      configItemMask = configOptions.getMaskDescription(commandOptions.item);
                    menuMessageObject.message = `${translationsItemTextGet(
                      user,
                      'WrongValue',
                    )}!\n${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(
                      user,
                      'ForConfig',
                    )} '${translationsItemCoreGet(user, commandOptions.item)}' (${translationsItemTextGet(
                      user,
                      'CurrentValue',
                    )} = ${configItem})${
                      configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''
                    }:`;
                  } else {
                    configOptions.setOption(
                      commandOptions.item,
                      commandOptions.scope === configOptionScopeGlobal ? null : user,
                      parsedValue,
                    );
                  }
                }
              }
              break;
            }

            case dataTypeStateValue: {
              setStateValue(user, commandOptions.state, userInputToProcess, true);
              break;
            }

            case dataTypeAlertSubscribed: {
              switch (commandOptions.item) {
                case alertThresholdId:
                case onTimeIntervalId: {
                  // @ts-ignore
                  userInputToProcess = Number(userInputToProcess);
                  break;
                }
              }
              if (Number.isNaN(userInputToProcess) && commandOptions.item !== alertMessageTemplateId) {
                console.warn(`Unacceptable value '${userInputToProcess}' for number conditions`);
                telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
              } else if (
                commandOptions.item === alertThresholdId &&
                !checkNumberStateValue(commandOptions.state, Number(userInputToProcess))
              ) {
                console.warn(`Unacceptable value '${userInputToProcess}' for state conditions`);
                telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
              } else {
                const alertDetailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
                  currentThresholdIndex = Number(commandOptions.index),
                  currentThresholdsKeys =
                    currentThresholdIndex >= 0
                      ? Object.keys(alertDetailsOrThresholds).sort(
                          (thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB),
                        )
                      : [];

                if (commandOptions.item === alertThresholdId) {
                  let currentThresholdRules = {onAbove: true, onLess: true};
                  if (currentThresholdIndex < currentThresholdsKeys.length) {
                    currentThresholdRules = alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                    delete alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                  }
                  alertDetailsOrThresholds[userInputToProcess] = currentThresholdRules;
                  if (currentThresholdIndex < currentThresholdsKeys.length) {
                    const newIndex = Object.keys(alertDetailsOrThresholds)
                      .sort((thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB))
                      .findIndex((threshold) => Number(threshold) === Number(userInputToProcess));
                    currentMenuPosition.splice(-1, 1, newIndex);
                  }
                } else {
                  const currentDetailsOrThreshold =
                    currentThresholdIndex >= 0
                      ? alertDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]]
                      : alertDetailsOrThresholds;
                  if (
                    commandOptions.item === onTimeIntervalId &&
                    // @ts-ignore
                    userInputToProcess === 0
                  ) {
                    delete currentDetailsOrThreshold[commandOptions.item];
                  } else {
                    currentDetailsOrThreshold[commandOptions.item] = userInputToProcess;
                  }
                }
                cachedValueSet(user, cachedAlertThresholdSet, alertDetailsOrThresholds);
                const backStepsForCacheDelete =
                  (currentThresholdIndex >= 0 ? -2 : -1) + (commandOptions.item === alertMessageTemplateId ? -1 : 0);
                cachedAddToDelCachedOnBack(
                  user,
                  currentMenuPosition.slice(0, backStepsForCacheDelete).join('.'),
                  cachedAlertThresholdSet,
                );
                menuMenuItemsAndRowsClearCached(user);
              }
              break;
            }

            case dataTypeTrigger: {
              switch (commandOptions.mode) {
                case 'add':
                case 'edit':
                case 'targetValue':
                case onTimeIntervalId: {
                  if (commandOptions.state) {
                    if (Number.isNaN(userInputToProcess)) {
                      console.warn(`Unacceptable value '${userInputToProcess}' for number conditions`);
                      telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                    } else if (
                      ['add', 'edit'].includes(commandOptions.mode) &&
                      !checkNumberStateValue(commandOptions.state, Number(userInputToProcess))
                    ) {
                      console.warn(`Unacceptable value '${userInputToProcess}' for state conditions`);
                      telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                    } else {
                      const triggerValue = Number(userInputToProcess);
                      let triggers = triggersGetStateTriggers(user, commandOptions.state),
                        backStepsForCacheDelete = -1;
                      switch (commandOptions.mode) {
                        case 'add': {
                          let triggerId = [triggerValue, 'onAbove'].join('.');
                          const triggerOnAbove = triggersGetIndex(triggers, triggerId) < 0;
                          if (!triggerOnAbove) triggerId = [triggerValue, 'onLess'].join('.');
                          if (!triggerOnAbove && triggersGetIndex(triggers, triggerId) >= 0) {
                            console.warn(`Unacceptable value '${userInputToProcess}' - already exists`);
                            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                          } else {
                            triggers.push({
                              id: triggerId,
                              enabled: false,
                              type: 'number',
                              value: triggerValue,
                              [onTimeIntervalId]: 0,
                              onAbove: triggerOnAbove,
                              onLess: !triggerOnAbove,
                              targetState: '',
                              targetFunction: undefined,
                              targetValue: undefined,
                            });
                            triggers = triggersSort(triggers);
                          }
                          break;
                        }
                        case 'edit': {
                          const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                          if (triggerIndex >= 0) {
                            const trigger = triggers[triggerIndex];
                            let triggerId = [triggerValue, trigger.onAbove ? 'onAbove' : 'onLess'].join('.');
                            if (triggersGetIndex(triggers, triggerId) < 0) {
                              trigger.value = triggerValue;
                              trigger.id = triggerId;
                              trigger.enabled = false;
                              triggers = triggersSort(triggers);
                              currentMenuPosition.splice(-1, 1, triggersGetIndex(triggers, triggerId));
                              backStepsForCacheDelete--;
                            }
                          } else {
                            triggers = undefined;
                          }
                          break;
                        }
                        case 'targetValue': {
                          if (commandOptions.item) {
                            const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                            if (triggerIndex >= 0) {
                              backStepsForCacheDelete--;
                              const trigger = triggers[triggerIndex];
                              trigger.targetValue = triggerValue;
                            } else {
                              triggers = undefined;
                            }
                          } else {
                            triggers = undefined;
                          }
                          break;
                        }

                        case onTimeIntervalId: {
                          if (commandOptions.item) {
                            const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                            if (triggerIndex >= 0) {
                              backStepsForCacheDelete--;
                              const trigger = triggers[triggerIndex];
                              trigger[onTimeIntervalId] = triggerValue;
                            } else {
                              triggers = undefined;
                            }
                          } else {
                            triggers = undefined;
                          }
                          break;
                        }
                      }
                      if (triggers) {
                        cachedValueSet(user, cachedTriggersDetails, triggers);
                        cachedAddToDelCachedOnBack(
                          user,
                          currentMenuPosition.slice(0, backStepsForCacheDelete).join('.'),
                          cachedTriggersDetails,
                        );
                        menuMenuItemsAndRowsClearCached(user);
                      }
                    }
                  }
                  break;
                }
                default:
                  break;
              }
              break;
            }

            default: {
              break;
            }
          }
          logs('New values is set');
          menuMenuItemsAndRowsClearCached(user);
          break;
        }
      }
    }
    if (menuMessageObject.message) {
      menuMessageObject.message += botMessageStamp;
      cachedValueSet(user, cachedLastMessage, '');
      telegramMessageObjectPush(user, menuMessageObject, {
        clearBefore: user.userId !== user.chatId || currentCommand !== cmdGetInput,
        clearUserMessage: user.userId === user.chatId,
        createNewMessage: false,
        isSilent: false,
      });
    } else {
      cachedValueSet(user, cachedIsWaitForInput, false);
      /** if it private chat - delete user input, if it group - clear menu, and recreate it after user input **/
      if (commandOptions.dataType !== dataTypeStateValue) {
        menuMenuDraw(user, currentMenuPosition, {
          clearBefore: user.userId !== user.chatId || currentCommand !== cmdGetInput,
          clearUserMessage: user.userId === user.chatId && currentCommand === cmdGetInput,
        });
      }
    }
  } else if (currentCommand.indexOf(cmdClose) === 0) {
    menuMenuClose(user);
  } else if (currentCommand.indexOf(cmdBack) === 0) {
    currentMenuPosition = currentCommand.replace(cmdBack, '');
    logs(`currentMenuItem = ${JSON.stringify(currentMenuPosition)}`);
    if (cachedValueExists(user, cachedDelCachedOnBack)) {
      const cachedToDelete = cachedValueGet(user, cachedDelCachedOnBack);
      if (cachedToDelete && cachedToDelete.hasOwnProperty(currentMenuPosition)) {
        if (Array.isArray(cachedToDelete[currentMenuPosition])) {
          logs(`cachedToDelete[currentMenuItem] = ${JSON.stringify(cachedToDelete[currentMenuPosition])}`);
          cachedToDelete[currentMenuPosition].forEach((cachedId) => cachedValueDelete(user, cachedId));
        }
        delete cachedToDelete[currentMenuPosition];
      }
      cachedValueSet(user, cachedDelCachedOnBack, {...cachedToDelete});
    }
    currentMenuPosition = menuMenuItemExtractPosition(currentMenuPosition);
    menuMenuDraw(user, currentMenuPosition);
  } else if (configOptions.getOption(cfgMessagesForMenuCall, user).includes(currentCommand)) {
    // setCachedValue(user, cachedMenuOn, false);
    /** if it private chat - delete user input, if configured **/
    menuMenuDraw(user, undefined, {
      clearBefore: true,
      clearUserMessage: configOptions.getOption(cfgClearMenuCall, user) && user.userId === user.chatId,
    });
  } else if (currentCommand.indexOf(menuItemButtonPrefix) === 0) {
    menuMenuDraw(user, menuMenuItemExtractPosition(currentCommand.replace(menuItemButtonPrefix, '')));
  } else {
    switch (currentCommand) {
      case cmdGetInput: {
        switch (commandOptions.dataType) {
          case dataTypeTranslation: {
            let currentTranslationId, currentTranslationValue;
            if (commandOptions.translationType && commandOptions.item && commandOptions.index) {
              currentTranslationId = commandOptions.translationType;
              let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
              if (
                destTranslation &&
                typeOf(destTranslation) === 'object' &&
                Object.keys(destTranslation).length > Number(commandOptions.item)
              ) {
                currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(commandOptions.item)]}`;
                destTranslation = destTranslation[Object.keys(destTranslation)[Number(commandOptions.item)]];
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > Number(commandOptions.index)
                ) {
                  currentTranslationId += `.${Object.keys(destTranslation)[Number(commandOptions.index)]}`;
                  currentTranslationValue = destTranslation[Object.keys(destTranslation)[Number(commandOptions.index)]];
                }
              }
            } else if (commandOptions.translationId) {
              currentTranslationId = commandOptions.translationId;
              currentTranslationValue = translationsItemGet(user, currentTranslationId);
            }
            if (currentTranslationValue)
              menuMessageObject.message = `${translationsItemCoreGet(
                user,
                'cmdItemRename',
              )} ${currentTranslationId} = "${currentTranslationValue}" :`;
            break;
          }

          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport:
          case dataTypePrimaryEnums:
          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons: {
            const currentEnumerationsList = enumerationsGetList(
              commandOptions.dataType,
              commandOptions.dataTypeExtraId,
            );
            switch (commandOptions.attribute) {
              case 'setId':
              case 'fixId': {
                const simpleReportId = cachedValueGet(user, cachedSimpleReportIdToCreate);
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} ${translationsItemTextGet(
                  user,
                  simpleReportId ? 'fix' : 'set',
                  'reportId',
                )} ${simpleReportId ? `= ${simpleReportId}` : ''}`;
                cachedValueDelete(user, cachedSimpleReportIdToCreate);
                break;
              }

              case 'names': {
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} "${translationsItemTextGet(
                  user,
                  commandOptions.index,
                )}" = ${translationsGetEnumName(
                  user,
                  commandOptions.dataType,
                  commandOptions.item,
                  commandOptions.index,
                )}:`;
                break;
              }

              default: {
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} "${translationsItemMenuGet(
                  user,
                  commandOptions.attribute,
                )}" = ${currentEnumerationsList[commandOptions.item][commandOptions.attribute]}:`;
                break;
              }
            }
            break;
          }

          case dataTypeMenuRoles: {
            switch (commandOptions.mode) {
              case 'setId':
              case 'fixId': {
                const newRoleId = cachedValueGet(user, cachedRolesNewRoleId);
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} ${translationsItemTextGet(
                  user,
                  newRoleId ? 'fix' : 'set',
                  'RoleId',
                )} ${newRoleId ? `= ${newRoleId}` : ''}`;
                cachedValueDelete(user, cachedRolesNewRoleId);
                break;
              }
              default: {
                // menuMessageObject.message =  `${getFromTranslation(user, generateTranslationIdForText('SetNewAttributeValue'))} ${getFromTranslation(user, generateTextId('for', commandOptions.dataType))} "${getFromTranslation(user, generateTextId(commandOptions.dataType, currentParam))}" = ${enumerationItems[commandOptions.dataType].list[currentItem][currentParam]}:`;
                break;
              }
            }
            break;
          }

          case dataTypeReportMember: {
            const queryParams = cachedValueGet(user, cachedSimpleReportNewQuery);
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'ForReportQuery')} ${translationsItemTextGet(
              user,
              commandOptions.item,
            )} ${
              queryParams && queryParams.hasOwnProperty(commandOptions.item) && queryParams[commandOptions.item]
                ? `= ${queryParams[commandOptions.item]}`
                : ''
            }`;
            break;
          }

          case dataTypeAlertSubscribed: {
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} ${translationsItemTextGet(
              user,
              commandOptions.item,
            )}${commandOptions.value ? ` = ${commandOptions.value}` : ''}:`;
            break;
          }

          case dataTypeTrigger: {
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} ${
              commandOptions.value ? ` = ${commandOptions.value}` : ''
            }:`;
            break;
          }

          case dataTypeConfig: {
            const configItem = configOptions.getOption(
                commandOptions.item,
                commandOptions.scope === configOptionScopeGlobal ? null : user,
              ),
              configItemMask = configOptions.getMaskDescription(commandOptions.item);
            logs(
              `configItem (${typeof configItem}${Array.isArray(configItem) ? ', Array' : ''}) = ${JSON.stringify(
                configItem,
              )})`,
            );
            if (
              typeOf(configItem) === 'array' &&
              // @ts-ignore
              !isNaN(commandOptions.index)
            ) {
              const configItemIndex = Number(commandOptions.index);
              if (configItemIndex < configItem.length) {
                const itemByIndex = configItem[configItemIndex],
                  itemId = commandOptions.item === cfgGraphsIntervals ? itemByIndex.id : configItemIndex,
                  itemValue = commandOptions.item === cfgGraphsIntervals ? itemByIndex.name : itemByIndex;
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} '${translationsItemCoreGet(
                  user,
                  commandOptions.item,
                )}[${itemId}]' (${translationsItemTextGet(user, 'CurrentValue')} = ${itemValue}):`;
              } else {
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'AddNewAttributeValue',
                )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} '${translationsItemCoreGet(
                  user,
                  commandOptions.item,
                )}[]':`;
              }
            } else {
              if (commandOptions.item === cfgMenuLanguage) {
                const newLanguageId = cachedValueGet(user, cachedConfigNewLanguageId);
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  newLanguageId ? 'FixNewAttributeValue' : 'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'ForConfig')} ${translationsItemCoreGet(
                  user,
                  commandOptions.item,
                )}'${newLanguageId ? `(${newLanguageId})` : ''}:`;
              } else {
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(user, 'ForConfig')} '${translationsItemCoreGet(
                  user,
                  commandOptions.item,
                )}' (${translationsItemTextGet(user, 'CurrentValue')} = ${configItem})${
                  configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''
                }:`;
              }
            }
            break;
          }

          case dataTypeStateValue: {
            if (existsObject(commandOptions.state)) {
              const currentStateId = commandOptions.state,
                stateObject = getObjectEnriched(currentStateId),
                stateObjectCommon = stateObject.common,
                currentName = translationsGetObjectName(user, stateObject, commandOptions.function),
                currentValue = existsState(currentStateId) ? getState(currentStateId).val : null;
              menuMessageObject.message = `${translationsItemTextGet(
                user,
                'SetNewAttributeValue',
              )} '${currentName}' (${translationsItemTextGet(user, 'CurrentValue')} = ${
                currentValue ? currentValue : iconItemNotFound
              }${stateObjectCommon.hasOwnProperty('unit') ? ` ${stateObjectCommon['unit']}` : ''})`;
              if (stateObjectCommon.type === 'number') {
                menuMessageObject.message += `, ${translationsItemTextGet(user, 'Number')}`; //
                if (stateObjectCommon.hasOwnProperty('min') || stateObjectCommon.hasOwnProperty('max')) {
                  menuMessageObject.message += '[';
                  if (stateObjectCommon.hasOwnProperty('min')) {
                    menuMessageObject.message += `${translationsItemTextGet(user, 'Min')} = ${stateObjectCommon.min}`;
                  }
                  menuMessageObject.message += ' - ';
                  if (stateObjectCommon.hasOwnProperty('max')) {
                    menuMessageObject.message += `${translationsItemTextGet(user, 'Max')} = ${stateObjectCommon.max}`;
                  }
                  menuMessageObject.message += ']';
                }
              }
              menuMessageObject.message += ':';
            }
            break;
          }

          default: {
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)}:`;
            break;
          }
        }
        if (menuMessageObject.message) {
          menuMessageObject.message += botMessageStamp;
          cachedValueSet(user, cachedIsWaitForInput, userInputToProcess);
          telegramMessageObjectPush(user, menuMessageObject, {
            clearBefore: false,
            clearUserMessage: false,
            createNewMessage: false,
            isSilent: false,
          });
        } else {
          menuMenuDraw(user, currentMenuPosition);
        }
        break;
      }
      case cmdHome: {
        if (cachedValueExists(user, cachedDelCachedOnBack)) {
          const cachedToDelete = cachedValueGet(user, cachedDelCachedOnBack);
          Object.keys(cachedToDelete).forEach((itemsToDelete) => {
            if (Array.isArray(cachedToDelete[itemsToDelete])) {
              logs(`cachedToDelete[[${itemsToDelete}] = ${JSON.stringify(cachedToDelete[itemsToDelete])}`);
              cachedToDelete[itemsToDelete].forEach((cachedId) => cachedValueDelete(user, cachedId));
              delete cachedToDelete[itemsToDelete];
            }
          });
          cachedValueDelete(user, cachedDelCachedOnBack);
        }
        menuMenuDraw(user, []);
        break;
      }
      case cmdSetState: {
        setStateValue(user, commandOptions.state, commandOptions.value);
        break;
      }
      case cmdExternalCommand: {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
          console.error(
            `Error! No response from external command ${commandOptions.item} for function ${commandOptions.dataType}`,
          );
        }, configOptions.getOption(cfgExternalMenuTimeout) + 10);
        logs(
          `External command ${commandOptions.item} for function ${commandOptions.function}, with params ${commandOptions.attribute}`,
          _l,
        );
        menuMenuDraw(user);
        messageTo(
          commandOptions.item,
          {
            user,
            data: commandOptions.attribute,
            extensionId: commandOptions.function,
            translations: translationsGetForExtension(user, commandOptions.function),
          },
          {timeout: configOptions.getOption(cfgExternalMenuTimeout)},
          (result) => stateOrCommandProcessed(user, result),
        );
        break;
      }
      case cmdAcknowledgeAlert:
      case cmdAcknowledgeAllAlerts:
      case cmdAcknowledgeAndUnsubscribeAlert: {
        const alertMessages = alertGetMessages(user),
          alertMessagesNonAcknowledged = alertMessages.filter((alertMessage) => !alertMessage.ack).reverse(),
          alertAcknowledge = (alertMessage) => {
            alertMessage.ack = true;
            if (currentCommand === cmdAcknowledgeAndUnsubscribeAlert) alertsManage(user, alertMessage.id);
            return currentCommand === cmdAcknowledgeAllAlerts;
          };
        alertMessagesNonAcknowledged.every(alertAcknowledge);
        if (alertMessagesNonAcknowledged.length) {
          alertsStoreMessagesToCache(user, alertMessages);
          menuMenuItemsAndRowsClearCached(user);
          menuMenuDraw(user, currentMenuPosition);
        }
        break;
      }
      case cmdItemPress: {
        switch (commandOptions.dataType) {
          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport:
          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons:
          case dataTypeDeviceStatesAttributes: {
            const currentEnumerationsList = enumerationsGetList(
                commandOptions.dataType,
                commandOptions.dataTypeExtraId,
              ),
              currentDataItem = currentEnumerationsList[commandOptions.item];
            if (commandOptions.attribute !== undefined) {
              if (
                enumerationsDeviceStatesTypes.includes(commandOptions.dataType) &&
                enumerationsDeviceButtonsAccessLevelAttrs.includes(commandOptions.attribute)
              ) {
                currentDataItem[commandOptions.attribute] = commandOptions.value;
              } else {
                switch (typeOf(currentDataItem[commandOptions.attribute])) {
                  case 'boolean': {
                    if (commandOptions.value === undefined) {
                      currentDataItem[commandOptions.attribute] = !currentDataItem[commandOptions.attribute];
                    }

                    break;
                  }

                  default: {
                    if (commandOptions.value) {
                      currentDataItem[commandOptions.attribute] =
                        currentDataItem[commandOptions.attribute] === commandOptions.value ? '' : commandOptions.value;
                    }
                    break;
                  }
                }
                if (
                  commandOptions.dataType === dataTypeFunction &&
                  commandOptions.attribute === 'isEnabled' &&
                  currentEnumerationsList[commandOptions.item][commandOptions.attribute]
                ) {
                  enumerationsRefreshFunctionDeviceStates(user, commandOptions.item, dataTypeDeviceAttributes);
                  enumerationsRefreshFunctionDeviceStates(user, commandOptions.item, dataTypeDeviceButtons);
                } else if (
                  commandOptions.dataType === dataTypeDeviceStatesAttributes &&
                  commandOptions.attribute === 'isEnabled'
                ) {
                  const currentDeviceAttribute = enumerationsGetDeviceState(
                      commandOptions.dataType,
                      commandOptions.dataTypeExtraId,
                    ),
                    currentSort = (a, b) =>
                      enumerationsCompareOrderOfItems(a, b, dataTypeDeviceStatesAttributes, currentEnumerationsList);
                  currentDeviceAttribute.stateAttributes = Object.keys(currentEnumerationsList)
                    .filter((currentAttribute) => currentEnumerationsList[currentAttribute].isEnabled)
                    .sort(currentSort);
                }
              }
              enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
            }
            break;
          }

          case dataTypePrimaryEnums: {
            if (enumerationsList.hasOwnProperty(commandOptions.dataTypeExtraId)) {
              if (commandOptions.mode === cmdItemAdd) {
                enumerationsList[commandOptions.dataTypeExtraId].enums[commandOptions.item] = {
                  isEnabled: true,
                  order: Object.keys(enumerationsList[commandOptions.dataTypeExtraId].enums).length,
                  icon: '',
                };
                enumerationsSave(commandOptions.dataTypeExtraId);
                currentMenuPosition.splice(-2, 2, dataTypePrimaryEnums);
              }
            }
            break;
          }

          case dataTypeGroups: {
            const currentEnumerationsList = enumerationsGetList(
              commandOptions.groupDataType,
              commandOptions.groupDataTypeExtraId,
            );
            if (
              commandOptions.item &&
              currentEnumerationsList &&
              currentEnumerationsList.hasOwnProperty(commandOptions.item) &&
              currentEnumerationsList[commandOptions.item]
            ) {
              currentEnumerationsList[commandOptions.item].group =
                currentEnumerationsList[commandOptions.item].group === commandOptions.group ? '' : commandOptions.group;
            }
            enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
            break;
          }

          case dataTypeConfig: {
            switch (commandOptions.item) {
              case cfgMenuLanguage:
                configOptions.setOption(
                  commandOptions.item,
                  commandOptions.scope === configOptionScopeUser ? user : null,
                  commandOptions.value,
                );
                currentMenuPosition.splice(-1, 1);
                break;
              default:
                configOptions.setOption(
                  commandOptions.item,
                  commandOptions.scope === configOptionScopeUser ? user : null,
                  !configOptions.getOption(
                    commandOptions.item,
                    commandOptions.scope === configOptionScopeUser ? user : null,
                  ),
                );
                break;
            }
            break;
          }

          case dataTypeAlertSubscribed: {
            const currentThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
              currentThresholdsKeys = Object.keys(currentThresholds).sort(
                (thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB),
              ),
              currentThresholdIndex = Number(commandOptions.item);
            if (currentThresholdIndex < currentThresholdsKeys.length) {
              currentThresholds[currentThresholdsKeys[currentThresholdIndex]][commandOptions.mode] =
                !currentThresholds[currentThresholdsKeys[currentThresholdIndex]][commandOptions.mode];
              cachedValueSet(user, cachedAlertThresholdSet, currentThresholds);
              cachedAddToDelCachedOnBack(user, currentMenuPosition.slice(0, -2).join('.'), cachedAlertThresholdSet);
            }
            break;
          }

          case dataTypeTrigger: {
            // logs(`options = ${JSON.stringify(commandOptions)}`, _l)
            if (commandOptions.state) {
              let triggers = triggersGetStateTriggers(user, commandOptions.state),
                backStepsForCacheDelete = -1;
              switch (commandOptions.mode) {
                case 'onAbove':
                case 'onLess': {
                  if (commandOptions.item) {
                    const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                    if (triggerIndex >= 0) {
                      backStepsForCacheDelete--;
                      const trigger = triggers[triggerIndex],
                        triggerId = [trigger.value, trigger.onAbove ? 'onLess' : 'onAbove'].join('.');
                      if (triggersGetIndex(triggers, triggerId) < 0) {
                        trigger.id = triggerId;
                        trigger.onAbove = !trigger.onAbove;
                        trigger.onLess = !trigger.onLess;
                        trigger.enabled = false;
                      } else {
                        triggers = undefined;
                      }
                    } else {
                      triggers = undefined;
                    }
                  }
                  break;
                }
                case 'targetState': {
                  if (commandOptions.item) {
                    const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                    if (triggerIndex >= 0) {
                      backStepsForCacheDelete--;
                      const trigger = triggers[triggerIndex];
                      if (trigger.targetState !== commandOptions.value) {
                        trigger.enabled = false;
                        trigger.targetValue = undefined;
                      }
                      trigger.targetState = commandOptions.value;
                      trigger.targetFunction = commandOptions.function;
                      trigger.targetDestination = commandOptions.destination;
                      currentMenuPosition = commandOptions.currentIndex.split('.').slice(0, -1);
                    } else {
                      triggers = undefined;
                    }
                  } else {
                    triggers = undefined;
                  }
                  break;
                }

                case 'targetValue': {
                  if (commandOptions.item) {
                    const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                    if (triggerIndex >= 0) {
                      backStepsForCacheDelete--;
                      const trigger = triggers[triggerIndex];
                      trigger.targetValue = commandOptions.value;
                      currentMenuPosition.splice(-1, 1);
                    } else {
                      triggers = undefined;
                    }
                  } else {
                    triggers = undefined;
                  }
                  break;
                }

                case 'enabled': {
                  if (commandOptions.item) {
                    const triggerIndex = triggersGetIndex(triggers, commandOptions.item);
                    if (triggerIndex >= 0) {
                      backStepsForCacheDelete--;
                      const trigger = triggers[triggerIndex];
                      if (trigger.enabled) {
                        trigger.enabled = false;
                      } else if (!trigger.enabled && trigger.targetState && trigger.targetValue !== undefined) {
                        trigger.enabled = !trigger.enabled;
                      } else {
                        triggers = undefined;
                      }
                    } else {
                      triggers = undefined;
                    }
                  } else {
                    triggers = undefined;
                  }
                  break;
                }

                case 'add': {
                  triggers.push({
                    id: commandOptions.value,
                    enabled: false,
                    type: commandOptions.type,
                    [onTimeIntervalId]: 0,
                    value: commandOptions.value,
                    targetState: '',
                    targetFunction: undefined,
                    targetDestination: undefined,
                    targetValue: undefined,
                  });
                  triggers = triggersSort(triggers, commandOptions.sorted);
                  currentMenuPosition.splice(-1, 1);
                  break;
                }

                default: {
                  triggers = undefined;
                  break;
                }
              }
              if (triggers) {
                cachedValueSet(user, cachedTriggersDetails, triggers);
                cachedAddToDelCachedOnBack(
                  user,
                  currentMenuPosition.slice(0, backStepsForCacheDelete).join('.'),
                  cachedTriggersDetails,
                );
                menuMenuItemsAndRowsClearCached(user);
              }
            }
            break;
          }

          case dataTypeMenuUsers: {
            usersInMenu.toggleItemIsEnabled(commandOptions.userId);
            break;
          }

          case dataTypeMenuUserRoles: {
            if (usersInMenu.hasRole(commandOptions.userId, commandOptions.roleId)) {
              usersInMenu.delRole(commandOptions.userId, commandOptions.roleId);
            } else {
              usersInMenu.addRole(commandOptions.userId, commandOptions.roleId);
            }
            break;
          }

          case dataTypeMenuRoleRules: {
            const currentIndex = Number(commandOptions.ruleIndex);
            if (currentIndex === -1) {
              if (cachedValueExists(user, cachedRolesNewRule)) {
                const currentRule = cachedValueGet(user, cachedRolesNewRule);
                currentRule['accessLevel'] = commandOptions.accessLevel;
                cachedValueSet(user, cachedRolesNewRule, currentRule);
              }
            } else {
              if (rolesInMenu.existsId(commandOptions.roleId)) {
                let currentRules = rolesInMenu.getRules(commandOptions.roleId);
                if (currentRules.length > currentIndex) {
                  const currentRule = {...currentRules[currentIndex]};
                  currentRule['accessLevel'] = commandOptions.accessLevel;
                  cachedValueSet(user, cachedRolesNewRule, currentRule);
                }
              }
            }
            break;
          }

          default: {
            break;
          }
        }
        menuMenuItemsAndRowsClearCached(user);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemDownload: {
        nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
          if (err) {
            console.warn(`Can't create temporary directory! Error: '${JSON.stringify(err)}'.`);
          } else {
            const languageId = configOptions.getOption(cfgMenuLanguage),
              tmpFileName = nodePath.join(tmpDirectory, `menuTranslation_${languageId}.json`),
              currentTranslation = translationsGetCurrentForUser(user);
            nodeFS.writeFile(
              tmpFileName,
              JSON.stringify(
                {
                  type: translationsType,
                  language: languageId,
                  version: translationsVersion,
                  translation: currentTranslation,
                },
                null,
                2,
              ),
              (err) => {
                if (err) {
                  console.warn(`Can't create temporary file '${tmpFileName}'! Error: '${JSON.stringify(err)}'.`);
                } else {
                  telegramFileSend(user, tmpFileName);
                }
              },
            );
          }
        });
        break;
      }
      case cmdItemUpload: {
        switch (commandOptions.dataType) {
          case dataTypeTranslation:
            switch (commandOptions.uploadMode) {
              case doUploadDirectly: {
                cachedValueSet(user, cachedIsWaitForInput, userInputToProcess);
                cachedValueDelete(user, cachedTranslationsToUpload);
                telegramMessageObjectPush(
                  user,
                  {message: translationsItemTextGet(user, 'UploadTranslationFile')},
                  {
                    clearBefore: false,
                    clearUserMessage: false,
                    createNewMessage: false,
                    isSilent: false,
                  },
                );
                break;
              }

              case doUploadFromRepo: {
                const currentLanguageId = configOptions.getOption(cfgMenuLanguage, user);
                translationsLoadLocalesFromRepository(
                  currentLanguageId,
                  commandOptions.translationPart,
                  (locales, _error) => {
                    if (
                      locales &&
                      typeOf(locales, 'object') &&
                      locales.hasOwnProperty(currentLanguageId) &&
                      typeOf(locales[currentLanguageId], 'object')
                    ) {
                      const isTranslationFileOk = translationsCheckAndCacheUploadedFile(
                        user,
                        '',
                        '',
                        '',
                        locales[currentLanguageId],
                      );
                      if (isTranslationFileOk) {
                        currentMenuPosition.push(
                          // @ts-ignore
                          isNaN(commandOptions.uploadMode)
                            ? commandOptions.uploadMode
                            : Number(commandOptions.uploadMode),
                        );
                        // logs(`currentMenuItem = ${currentMenuItem}`);
                        menuMenuDraw(user, currentMenuPosition);
                      } else {
                        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                      }
                    } else {
                      telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                    }
                  },
                );
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
        break;
      }
      case cmdItemDelete: {
        switch (commandOptions.dataType) {
          default:
            currentMenuPosition.push(
              // @ts-ignore
              isNaN(commandOptions.index) ? commandOptions.index : Number(commandOptions.index),
            );
            break;
        }
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemDeleteConfirm: {
        switch (commandOptions.dataType) {
          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport: {
            const enumObjectId = enumerationsIsItemCanBeDeleted(commandOptions.dataType, commandOptions.item, true);
            if (enumObjectId) {
              await deleteObjectAsync(enumObjectId);
            }
          }
          // break omitted
          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons: {
            const currentEnumerationsList = enumerationsGetList(
              commandOptions.dataType,
              commandOptions.dataTypeExtraId,
            );
            delete currentEnumerationsList[commandOptions.item];
            enumerationsReorderItems(currentEnumerationsList);
            enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
            currentMenuPosition.splice(-2, 2);
            logs(`currentMenuItem = ${JSON.stringify(currentMenuPosition)}`);
            break;
          }

          case dataTypePrimaryEnums: {
            if (enumerationsList.hasOwnProperty(commandOptions.dataTypeExtraId)) {
              const currentEnumsList = enumerationsList[commandOptions.dataTypeExtraId].enums;
              if (Object.keys(currentEnumsList).includes(commandOptions.item)) {
                delete currentEnumsList[commandOptions.item];
                enumerationsSave(commandOptions.dataTypeExtraId);
                currentMenuPosition.splice(-3, 3, dataTypePrimaryEnums);
              }
            }
            break;
          }

          case dataTypeReportMember: {
            const currentReportId = `${prefixEnums}.${
              enumerationsList[dataTypeReport].list[commandOptions.item].enum
            }.${commandOptions.item}`;
            let currentReportObject = getObject(currentReportId);
            delete currentReportObject.common.members[Number(commandOptions.index)];
            currentReportObject.common.members = currentReportObject.common.members.filter((n) => n);
            // @ts-ignore
            await setObjectAsync(currentReportId, currentReportObject);
            currentMenuPosition.splice(-2, 2);
            break;
          }

          case dataTypeAlertSubscribed: {
            if (commandOptions.index !== undefined) {
              const currentDetailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
                currentThresholdIndex = Number(commandOptions.index),
                currentThresholdsKeys =
                  currentThresholdIndex >= 0
                    ? Object.keys(currentDetailsOrThresholds).sort(
                        (thresholdA, thresholdB) => Number(thresholdA) - Number(thresholdB),
                      )
                    : [];
              if (currentThresholdIndex < currentThresholdsKeys.length) {
                if (commandOptions.item) {
                  const currentDetailOrThreshold =
                    currentThresholdIndex >= 0
                      ? currentDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]]
                      : currentDetailsOrThresholds;
                  if (currentDetailOrThreshold.hasOwnProperty(commandOptions.item))
                    delete currentDetailOrThreshold[commandOptions.item];
                } else if (currentThresholdIndex >= 0) {
                  delete currentDetailsOrThresholds[currentThresholdsKeys[currentThresholdIndex]];
                }
                cachedValueSet(user, cachedAlertThresholdSet, currentDetailsOrThresholds);
                cachedAddToDelCachedOnBack(user, currentMenuPosition.slice(0, -3).join('.'), cachedAlertThresholdSet);
                currentMenuPosition.splice(-2, 2);
              }
            } else {
              alertsManage(user, commandOptions.state);
              currentMenuPosition.splice(-4, 4);
            }
            break;
          }

          case dataTypeTrigger: {
            if (commandOptions.state && commandOptions.item) {
              let triggers = triggersGetStateTriggers(user, commandOptions.state);
              const triggerIndex = triggersGetIndex(triggers, commandOptions.item),
                backStepsForCacheDelete = -2;
              if (triggerIndex >= 0) {
                triggers.splice(triggerIndex, 1);
                cachedValueSet(user, cachedTriggersDetails, triggers);
                cachedAddToDelCachedOnBack(
                  user,
                  currentMenuPosition.slice(0, backStepsForCacheDelete).join('.'),
                  cachedTriggersDetails,
                );
                menuMenuItemsAndRowsClearCached(user);
                currentMenuPosition.splice(-2, 2);
              }
            }
            break;
          }

          case dataTypeTranslation: {
            let currentTranslationId;
            if (
              commandOptions.translationType &&
              commandOptions.item !== undefined &&
              commandOptions.index !== undefined
            ) {
              currentTranslationId = commandOptions.translationType;
              let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
              if (
                destTranslation &&
                typeOf(destTranslation) === 'object' &&
                Object.keys(destTranslation).length > Number(commandOptions.item)
              ) {
                currentTranslationId += `.destinations.${Object.keys(destTranslation)[Number(commandOptions.item)]}`;
                destTranslation = destTranslation[Object.keys(destTranslation)[Number(commandOptions.item)]];
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > Number(commandOptions.index)
                ) {
                  currentTranslationId += `.${Object.keys(destTranslation)[Number(commandOptions.index)]}`;
                }
              }
            } else if (commandOptions.translationId) {
              currentTranslationId = commandOptions.translationId;
            }
            if (currentTranslationId) {
              translationsItemDelete(user, currentTranslationId);
              currentMenuPosition.splice(-2, 2);
            }
            break;
          }

          case dataTypeConfig: {
            switch (commandOptions.item) {
              case cfgMenuLanguage: {
                switch (commandOptions.scope) {
                  case configOptionScopeGlobal:
                    if (translationsList.hasOwnProperty(commandOptions.value)) {
                      delete translationsList[commandOptions.value];
                      currentMenuPosition.splice(-2, 2);
                      translationsSave();
                    }
                    break;
                }
                break;
              }

              default: {
                let configItemArray = configOptions.getOption(
                  commandOptions.item,
                  commandOptions.scope === configOptionScopeGlobal ? null : user,
                );
                // logs(`currentItem = ${currentItem}, currentParam = ${currentParam}, configItemArray = ${configItemArray}, currentValue = ${currentValue}`, _l)
                if (configItemArray && Array.isArray(configItemArray)) {
                  if (configItemArray.length > Number(commandOptions.index)) {
                    configItemArray.splice(Number(commandOptions.index), 1);
                    configOptions.setOption(
                      commandOptions.item,
                      commandOptions.scope === configOptionScopeGlobal ? null : user,
                      configItemArray,
                    );
                    currentMenuPosition.splice(-2, 2);
                  }
                }
                break;
              }
            }

            break;
          }

          case dataTypeMenuRoleRules: {
            const currentRole = cachedValueExists(user, cachedRolesRoleUnderEdit)
                ? cachedValueGet(user, cachedRolesRoleUnderEdit)
                : undefined,
              currentRoleId = currentRole ? currentRole.roleId : commandOptions.roleId;

            switch (currentRoleId) {
              case commandOptions.roleId: {
                let currentRules = currentRole
                  ? currentRole.rules
                  : rolesInMenu.existsId(currentRoleId)
                  ? rolesInMenu.getRules(currentRoleId)
                  : undefined;
                if (currentRules) {
                  const currentIndex = Number(commandOptions.ruleIndex);
                  if (currentRules.length > currentIndex) {
                    currentRules.splice(currentIndex, 1);
                    if (currentRole) {
                      currentRole.rules = currentRules;
                      cachedValueSet(user, cachedRolesRoleUnderEdit, currentRole);
                    } else {
                      rolesInMenu.setRules(currentRoleId, currentRules, usersInMenu);
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
            if (
              rolesInMenu.existsId(commandOptions.roleId) &&
              rolesInMenu.getUsers(commandOptions.roleId).length === 0
            ) {
              rolesInMenu.delRole(commandOptions.roleId);
              currentMenuPosition.splice(-2, 2);
              menuMenuItemsAndRowsClearCached(user);
              cachedValueDelete(user, cachedRolesRoleUnderEdit);
            }
            break;
          }

          case dataTypeBackup: {
            backupFileDelete(commandOptions.fileName)
              .then(() => {
                telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgSuccess'));
                const currentMenuPosition = cachedValueGet(user, cachedMenuItem);
                currentMenuPosition.splice(-2, 2);
                menuMenuDraw(user, currentMenuPosition);
              })
              .catch((_error) => {
                telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgError'));
              });
            currentMenuPosition = undefined;
            break;
          }

          default: {
            break;
          }
        }
        if (currentMenuPosition) menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemMark: {
        switch (commandOptions.dataType) {
          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport: {
            break;
          }

          case dataTypeReportMember: {
            let queryParams = cachedValueGet(user, cachedSimpleReportNewQuery);
            queryParams = queryParams ? queryParams : simpleReportQueryParamsTemplate();
            switch (commandOptions.itemType) {
              case dataTypeDestination:
                if (queryParams.queryDests.includes(commandOptions.item)) {
                  delete queryParams.queryDests[queryParams.queryDests.indexOf(commandOptions.item)];
                } else {
                  queryParams.queryDests.push(commandOptions.item);
                }
                queryParams.queryStates = [];
                queryParams.queryPossibleStates = [];
                break;

              case 'states':
                if (queryParams.queryStates.includes(queryParams.queryPossibleStates[commandOptions.item])) {
                  delete queryParams.queryStates[
                    queryParams.queryStates.indexOf(queryParams.queryPossibleStates[commandOptions.item])
                  ];
                } else {
                  queryParams.queryStates.push(queryParams.queryPossibleStates[commandOptions.item]);
                }
                currentMenuPosition.splice(-1);
                break;

              default:
                break;
            }
            cachedValueSet(user, cachedSimpleReportNewQuery, queryParams);
            menuMenuItemsAndRowsClearCached(user);
            break;
          }

          case dataTypeConfig: {
            break;
          }

          case dataTypeMenuRoleRulesMask: {
            const currentRule = cachedValueExists(user, cachedRolesNewRule)
              ? cachedValueGet(user, cachedRolesNewRule)
              : {mask: rolesMaskAnyItem, accessLevel: ''};
            if (currentRule['mask'] === commandOptions.item) {
              currentRule['mask'] = rolesMaskAnyItem;
            } else {
              currentRule['mask'] = commandOptions.item;
            }
            cachedValueSet(user, cachedRolesNewRule, currentRule);
            menuMenuItemsAndRowsClearCached(user);
            logs(`currentMenuItem = ${currentMenuPosition}`);
            break;
          }
          default: {
            break;
          }
        }
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemsProcess: {
        switch (commandOptions.dataType) {
          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport: {
            break;
          }

          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons: {
            if (
              enumerationsRefreshFunctionDeviceStates(user, commandOptions.dataTypeExtraId, commandOptions.dataType)
            ) {
              menuMenuItemsAndRowsClearCached(user);
            } else {
              telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgSuccess'));
            }
            break;
          }

          case dataTypeTranslation: {
            if (cachedValueExists(user, cachedTranslationsToUpload)) {
              const updateTranslationResult = translationsProcessLanguageUpdate(
                user,
                commandOptions.translationPart,
                commandOptions.updateMode,
              );
              telegramMessageDisplayPopUp(
                user,
                updateTranslationResult ? updateTranslationResult : translationsItemTextGet(user, 'MsgSuccess'),
              );
            } else {
              telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
            }
            // logs(`currentMenuItem = ${currentMenuItem}`);
            currentMenuPosition.splice(-2);
            break;
          }

          case dataTypeAlertSubscribed: {
            if (
              commandOptions.range &&
              commandOptions.mode &&
              alertPropagateDistributions.includes(commandOptions.range) &&
              alertPropagateOptions.includes(commandOptions.mode)
            ) {
              const alertStateId = commandOptions.state,
                propagateRange = commandOptions.range,
                propagateMode = commandOptions.mode,
                functionsList = enumerationsList[dataTypeFunction].list,
                functionsListIds = Object.keys(functionsList).filter(
                  (itemId) => !functionsList[itemId].isExternal && functionsList[itemId].isEnabled,
                ),
                alertFunctionId = commandOptions.function,
                alertFunction =
                  functionsList && alertFunctionId && functionsList.hasOwnProperty(alertFunctionId)
                    ? functionsList[alertFunctionId]
                    : undefined,
                alertStateSectionsCount = alertFunction ? alertFunction.statesSectionsCount : 1,
                destinationsList = enumerationsList[dataTypeDestination].list,
                destinationsListIds = Object.keys(destinationsList).filter(
                  (itemId) => destinationsList[itemId].isEnabled,
                ),
                alertDestinationId = commandOptions.destination,
                alertDestination =
                  destinationsList && alertDestinationId && destinationsList.hasOwnProperty(alertDestinationId)
                    ? destinationsList[alertDestinationId]
                    : undefined,
                alertStateShortId = alertStateId.split('.').slice(-alertStateSectionsCount).join('.'),
                alerts = alertsGet(),
                alertIsOn =
                  alerts && alerts.hasOwnProperty(alertStateId) && alerts[alertStateId].chatIds.has(user.chatId);
              if (alertIsOn) {
                const alertStateAlertDetails = alerts[alertStateId].chatIds.get(user.chatId),
                  filterId = `state[id=*.${alertStateShortId}]`,
                  filterFunction = `(${alertFunction.enum}=${alertFunctionId})`,
                  filterDestination = `(${alertDestination.enum}=${alertDestinationId})`,
                  filterEnum = ['alertPropagateFuncAndDest', 'alertPropagateFunction'].includes(propagateRange)
                    ? filterFunction
                    : propagateRange === 'alertPropagateDestination'
                    ? filterDestination
                    : '';
                $(`${filterId}${filterEnum}`).each((stateId) => {
                  if (stateId !== alertStateId) {
                    const enumMask =
                        propagateRange === 'alertPropagateFuncAndDest'
                          ? alertDestination.enum
                          : propagateRange === 'alertPropagateGlobal'
                          ? '*'
                          : '',
                      currentStateObject = getObject(stateId, enumMask);
                    if (currentStateObject) {
                      let toProcessState = false;
                      switch (propagateRange) {
                        case 'alertPropagateFuncAndDest': {
                          if (currentStateObject.hasOwnProperty('enumIds') && currentStateObject['enumIds']) {
                            toProcessState = currentStateObject['enumIds'].includes(
                              `${prefixEnums}.${alertDestination.enum}.${alertDestinationId}`,
                            );
                          }
                          break;
                        }
                        case 'alertPropagateGlobal': {
                          if (currentStateObject.hasOwnProperty('enumIds') && currentStateObject['enumIds']) {
                            const currentItemEnums = currentStateObject['enumIds'];
                            toProcessState =
                              functionsListIds.filter((itemId) =>
                                currentItemEnums.includes(`${prefixEnums}.${functionsList[itemId].enum}.${itemId}`),
                              ).length > 0 &&
                              destinationsListIds.filter((itemId) =>
                                currentItemEnums.includes(`${prefixEnums}.${destinationsList[itemId].enum}.${itemId}`),
                              ).length > 0;
                          }
                          break;
                        }
                        default: {
                          toProcessState = true;
                          break;
                        }
                      }
                      if (toProcessState) {
                        const currentStateAlertDetails =
                            alerts && alerts.hasOwnProperty(stateId) && alerts[stateId].chatIds.has(user.chatId)
                              ? alerts[stateId].chatIds.get(user.chatId)
                              : undefined,
                          isDifferentAlertDetails =
                            JSON.stringify(currentStateAlertDetails) !== JSON.stringify(alertStateAlertDetails);
                        if (isDifferentAlertDetails) {
                          if (
                            (currentStateAlertDetails && propagateMode === 'alertPropagateOverwrite') ||
                            currentStateAlertDetails === undefined
                          ) {
                            // logs(`stateId = ${stateId}, currentItem = ${currentItem}, currentParam = ${currentParam}, ${JSON.stringify(alertStateAlertDetails)}`, _l)
                            alertsManage(
                              user,
                              stateId,
                              alertFunctionId,
                              alertDestinationId,
                              Object.keys(alertStateAlertDetails).length ? alertStateAlertDetails : undefined,
                            );
                          }
                        }
                      }
                    }
                  }
                });
                currentMenuPosition.splice(-2);
              }
            }
            break;
          }

          case dataTypeReportMember: {
            const queryParams = cachedValueGet(user, cachedSimpleReportNewQuery),
              queryStates = commandOptions.mode === doAll ? queryParams.queryPossibleStates : queryParams.queryStates;
            if (queryStates.length) {
              const currentReportId = `${prefixEnums}.${
                enumerationsList[dataTypeReport].list[commandOptions.item].enum
              }.${commandOptions.item}`;
              let currentReportObject = getObject(currentReportId);
              logs(`currentReportObject = ${JSON.stringify(currentReportObject, null, 2)}`);
              if (currentReportObject) {
                if (!currentReportObject.common.hasOwnProperty('members')) {
                  currentReportObject.common.members = [];
                }
                queryStates.forEach((state) => {
                  if (!currentReportObject.common.members.includes(state)) {
                    currentReportObject.common.members.push(state);
                  }
                });
                // @ts-ignore
                await setObjectAsync(currentReportId, currentReportObject);
                logs(`currentReportObject = ${JSON.stringify(getObject(currentReportId), null, 2)}`);
              }
            }
            currentMenuPosition.splice(-2, 2);
            cachedValueDelete(user, cachedSimpleReportNewQuery);
            break;
          }

          case dataTypeConfig: {
            switch (commandOptions.item) {
              case cfgMenuLanguage:
                if (commandOptions.scope === configOptionScopeGlobal) {
                  const newLanguageId = commandOptions.value;
                  if (!translationsList.hasOwnProperty(newLanguageId)) {
                    const menuPosition = currentMenuPosition;
                    translationsLoadLocalesFromRepository(newLanguageId, translationsCoreId, (locales, _error) => {
                      translationsList[newLanguageId] = {};
                      if (
                        locales &&
                        typeOf(locales, 'object') &&
                        locales.hasOwnProperty(newLanguageId) &&
                        typeOf(locales[newLanguageId], 'object')
                      ) {
                        if (translationsCheckAndCacheUploadedFile(user, '', '', '', locales[newLanguageId])) {
                          const newTranslation = locales[newLanguageId];
                          if (
                            newTranslation &&
                            newTranslation.hasOwnProperty(idTranslation) &&
                            typeOf(newTranslation[idTranslation], 'object') &&
                            Math.abs(translationsCompareVersion(newTranslation['version'])) < 10
                          ) {
                            translationsList[newLanguageId] = newTranslation[idTranslation];
                          }
                        }
                      }
                      translationsSave();
                      menuPosition.splice(-1, 1);
                      menuMenuDraw(user, menuPosition);
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
            if (cachedValueExists(user, cachedRolesNewRule)) {
              const currentRule = cachedValueGet(user, cachedRolesNewRule),
                currentRole = cachedValueExists(user, cachedRolesRoleUnderEdit)
                  ? cachedValueGet(user, cachedRolesRoleUnderEdit)
                  : {
                      roleId: commandOptions.roleId,
                      rules: rolesInMenu.existsId(commandOptions.roleId)
                        ? rolesInMenu.getRules(commandOptions.roleId)
                        : [],
                    };
              let currentRoleRules = [...currentRole['rules']];
              currentRoleRules = currentRoleRules.filter((rule) => rule.mask !== currentRule.mask);
              currentRoleRules.push(currentRule);
              cachedValueSet(user, cachedRolesRoleUnderEdit, {roleId: currentRole.roleId, rules: currentRoleRules});
              cachedValueDelete(user, cachedRolesNewRule);
              currentMenuPosition.splice(-2, 2);
            }
            break;
          }

          case dataTypeMenuRoles: {
            if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
              const currentRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
              if (commandOptions.roleId === currentRole.roleId) {
                if (rolesInMenu.existsId(currentRole.roleId)) {
                  rolesInMenu.setRules(currentRole.roleId, currentRole.rules, usersInMenu);
                } else {
                  rolesInMenu.addRole(currentRole.roleId, currentRole.rules);
                  currentMenuPosition.splice(-1);
                }
                cachedValueDelete(user, cachedRolesRoleUnderEdit);
              }
              menuMenuItemsAndRowsClearCached(user);
            }
            break;
          }

          case dataTypeGraph: {
            const graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
              historyAdapter = `system.adapter.${configOptions.getOption(cfgHistoryAdapter)}`,
              currentState = commandOptions.state,
              currentShortStateId = currentState ? currentState.split('.').pop() : undefined,
              graphTemplateId =
                commandOptions.template && existsObject(`${graphsTemplatesFolder}.${commandOptions.template}`)
                  ? `${graphsTemplatesFolder}.${commandOptions.template}`
                  : currentShortStateId && existsObject(`${graphsTemplatesFolder}.${currentShortStateId}`)
                  ? `${graphsTemplatesFolder}.${currentShortStateId}`
                  : `${graphsTemplatesFolder}.${graphsDefaultTemplate}`;
            // logs(`graphTemplateId = ${graphTemplateId}, currentState = ${currentState}`);
            // logs(`existsObject(graphTemplateId) = ${existsObject(graphTemplateId)}, existsState(currentParam) = ${existsState(currentState)}`);
            if (
              existsObject(graphTemplateId) &&
              (commandOptions.itemType === dataTypeReport || existsState(currentState))
            ) {
              let graphTemplate = getObject(graphTemplateId);
              const graphAdapter = graphsTemplatesFolder.split('.').slice(0, 2).join('.');
              // logs(`graphTemplate = ${JSON.stringify(graphTemplate, null, 2)}`);
              if (
                graphTemplate.native &&
                graphTemplate.native.data &&
                graphTemplate.native.data.lines &&
                graphTemplate.native.data.lines.length === 1
              ) {
                if (commandOptions.itemType === dataTypeReport) {
                  const reportId = commandOptions.item,
                    reportsList = enumerationsList[dataTypeReport].list,
                    reportItem = reportsList[reportId],
                    reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
                  if (
                    reportObject &&
                    reportObject.hasOwnProperty('common') &&
                    reportObject.common.hasOwnProperty('members') &&
                    Array.isArray(reportObject.common['members']) &&
                    reportObject.common['members'].length
                  ) {
                    const reportStatesList = reportObject.common['members'].sort(),
                      reportStatesStructure = simpleReportPrepareStructure(reportStatesList),
                      graphLines = graphTemplate.native.data.lines,
                      templateLine = graphLines.pop();
                    templateLine.instance = historyAdapter;
                    // logs(`templateLine ${typeOf(templateLine)} = ${JSON.stringify(templateLine, null, 2)}`);
                    let currentUnit;
                    const currentSort = (a, b) => enumerationsCompareOrderOfItems(a, b, dataTypeFunction);
                    Object.keys(reportStatesStructure)
                      .sort((a, b) => enumerationsCompareOrderOfItems(a, b, dataTypeDestination))
                      .forEach((currentDestId) => {
                        const currentFuncs = Object.keys(reportStatesStructure[currentDestId]).sort(currentSort);
                        currentFuncs.forEach((currentFuncId) => {
                          const currentDeviceObjects = Object.keys(reportStatesStructure[currentDestId][currentFuncId]);
                          currentDeviceObjects.forEach((currentDeviceObject) => {
                            const currentStateObjects =
                              reportStatesStructure[currentDestId][currentFuncId][currentDeviceObject];
                            currentStateObjects.forEach((currentStateObject) => {
                              const currentLine = objectDeepClone(templateLine);
                              if (currentUnit === undefined)
                                currentUnit =
                                  currentStateObject.common && currentStateObject.common.unit
                                    ? currentStateObject.common.unit
                                    : '';
                              currentLine.unit = currentUnit;
                              currentLine.id = currentStateObject._id;
                              currentLine.name = `${translationsItemTextGet(
                                user,
                                'In',
                              ).toLowerCase()} ${translationsGetEnumName(
                                user,
                                dataTypeDestination,
                                currentDestId,
                                enumerationsNamesInside,
                              )}`;
                              if (graphLines.length > 0) currentLine.commonYAxis = '0';
                              currentLine.lineStyle =
                                graphLines.length % 3 === 0
                                  ? 'solid'
                                  : graphLines.length % 3 === 1
                                  ? 'dashed'
                                  : 'dotted';
                              graphLines.push(currentLine);
                            });
                          });
                        });
                      });
                    graphTemplate.native.data.title = translationsGetEnumName(user, dataTypeReport, reportId);
                  }
                } else {
                  const currentStateObject = getObject(currentState),
                    currentLine = graphTemplate.native.data.lines[0];
                  currentLine.id = currentState;
                  currentLine.name = commandOptions.name;
                  currentLine.unit =
                    currentStateObject.common && currentStateObject.common.unit ? currentStateObject.common.unit : '';
                  currentLine.instance = historyAdapter;
                  graphTemplate.native.data.title = `${translationsGetEnumName(
                    user,
                    dataTypeFunction,
                    currentState.function,
                    enumerationsNamesMain,
                  )} ${translationsItemTextGet(user, 'In').toLowerCase()} ${translationsGetEnumName(
                    user,
                    dataTypeDestination,
                    commandOptions.destination,
                    enumerationsNamesInside,
                  )}`;
                }
                graphTemplate.native.data.range = commandOptions.graphsInterval;
                const newTemplateId = `${graphAdapter}.${graphsTemporaryFolder}.${user.userId}.${user.chatId}`;
                graphTemplate['_id'] = newTemplateId;
                // @ts-ignore
                setObject(newTemplateId, graphTemplate, (error, _result) => {
                  if (error) {
                    console.warn(`Can't create temporary template object ${newTemplateId}`);
                  } else {
                    nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
                      if (err) {
                        console.warn(`Can't create temporary directory! Error: '${JSON.stringify(err)}'.`);
                      } else {
                        const tmpGraphFileName = nodePath.join(tmpDirectory, 'graph.png'),
                          scaleSize = configOptions.getOption(cfgGraphsScale, user);
                        sendTo(
                          graphAdapter,
                          {
                            preset: newTemplateId,
                            renderer: 'png',
                            width: Math.round(1024 * scaleSize), // default 1024
                            height: Math.round(300 * scaleSize), // default 300
                            compressionLevel: 0,
                            filters: 0,
                            fileOnDisk: tmpGraphFileName,
                          },
                          (result) => {
                            if (result.error) {
                              console.error(`error: JSON.stringify(result.error)`);
                            } else if (result.data) {
                              telegramImageSend(user, tmpGraphFileName);
                              deleteObject(newTemplateId);
                            }
                          },
                        );
                      }
                    });
                  }
                });
              }
            }
            currentMenuPosition = undefined;
            break;
          }

          case dataTypeBackup: {
            switch (commandOptions.mode) {
              case backupModeCreate: {
                currentMenuPosition = undefined;
                backupCreate(backupModeManual)
                  .then((_result) => {
                    menuMenuItemsAndRowsClearCached(user);
                    const currentMenuPosition = cachedValueGet(user, cachedMenuItem);
                    currentMenuPosition.push(1);
                    telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgSuccess'));
                    menuMenuDraw(user, currentMenuPosition);
                  })
                  .catch((_error) => {
                    telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgError'));
                  });
                currentMenuPosition = undefined;
                break;
              }
              case backupModeRestore: {
                currentMenuPosition = undefined;
                backupRestore(commandOptions.fileName, commandOptions.item)
                  .then(() => {
                    telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgSuccess'));
                    const currentMenuPosition = cachedValueGet(user, cachedMenuItem);
                    if (commandOptions.item === backupItemAll) currentMenuPosition.splice(-1);
                    menuMenuDraw(user, currentMenuPosition);
                  })
                  .catch(() => telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgError')));
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
        if (currentMenuPosition) menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemReset: {
        switch (commandOptions.dataType) {
          case dataTypeConfig: {
            if (!configGlobalOptions.includes(commandOptions.item)) {
              configOptions.deleteUserOption(commandOptions.item, user);
              menuMenuItemsAndRowsClearCached(user);
            }
            break;
          }

          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons: {
            const currentEnumerationsList = enumerationsGetList(
              commandOptions.dataType,
              commandOptions.dataTypeExtraId,
            );
            if (currentEnumerationsList) {
              if (
                currentEnumerationsList[commandOptions.item] &&
                typeOf(currentEnumerationsList[commandOptions.item][commandOptions.attribute], 'string')
              ) {
                currentEnumerationsList[commandOptions.item][commandOptions.attribute] = '';
              }
            }
            enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
            menuMenuItemsAndRowsClearCached(user);
            break;
          }

          default: {
            break;
          }
        }
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemMoveUp:
      case cmdItemMoveDown: {
        switch (commandOptions.dataType) {
          case dataTypeDestination:
          case dataTypeFunction:
          case dataTypeReport:
          case dataTypeDeviceAttributes:
          case dataTypeDeviceButtons:
          case dataTypeDeviceStatesAttributes: {
            const currentEnumerationsList = enumerationsGetList(
                commandOptions.dataType,
                commandOptions.dataTypeExtraId,
              ),
              currentOrder = currentEnumerationsList[commandOptions.item].order,
              newOrder = currentOrder + (currentCommand === cmdItemMoveUp ? -1 : 1);
            logs(`currentOrder = ${currentOrder} newOrder = ${newOrder}`);
            const newItem = Object.keys(currentEnumerationsList).find((cItem) => {
              return currentEnumerationsList[cItem].order === newOrder;
            });
            if (newItem != undefined) {
              currentEnumerationsList[newItem].order = currentOrder;
              currentEnumerationsList[commandOptions.item].order = newOrder;
              currentMenuPosition.splice(-1, 1, newOrder);
            }
            if (commandOptions.dataType === dataTypeDeviceStatesAttributes) {
              const currentDeviceAttribute = enumerationsGetDeviceState(
                  commandOptions.dataType,
                  commandOptions.dataTypeExtraId,
                ),
                currentSort = (a, b) =>
                  enumerationsCompareOrderOfItems(a, b, dataTypeDeviceStatesAttributes, currentEnumerationsList);
              currentDeviceAttribute.stateAttributes = Object.keys(currentEnumerationsList)
                .filter((currentAttribute) => currentEnumerationsList[currentAttribute].isEnabled)
                .sort(currentSort);
              menuMenuItemsAndRowsClearCached(user);
            }
            enumerationsSave(enumerationsGetPrimaryDataType(commandOptions.dataType, commandOptions.dataTypeExtraId));
            break;
          }
          case dataTypeConfig: {
            const currentOptionArray = configOptions.getOption(
              commandOptions.item,
              commandOptions.scope === configOptionScopeGlobal ? null : user,
            );
            switch (commandOptions.item) {
              case cfgGraphsIntervals: {
                const currentIntervalIndex = Number(commandOptions.index),
                  currentInterval = currentOptionArray[currentIntervalIndex],
                  newPosition = currentIntervalIndex + (currentCommand === cmdItemMoveUp ? -1 : 1);
                currentOptionArray.splice(currentIntervalIndex, 1);
                currentOptionArray.splice(newPosition, 0, currentInterval);
                currentMenuPosition.splice(-1, 1, newPosition);
                configOptions.setOption(
                  commandOptions.item,
                  commandOptions.scope === configOptionScopeGlobal ? null : user,
                  currentOptionArray,
                );
                menuMenuItemsAndRowsClearCached(user);
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

        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemNameGet: {
        const currentList = enumerationsList[commandOptions.dataType].list;
        if (!currentList[commandOptions.item].isExternal) {
          enumerationsRereadItemName(user, commandOptions.item, currentList[commandOptions.item]);
          menuMenuDraw(user, currentMenuPosition);
        }
        break;
      }
      case cmdCreateReportEnum: {
        let obj = {...simpleReportFunctionTemplate};
        obj.common.name.en = stringCapitalize(commandOptions.item);
        try {
          const newReportId = `${prefixEnums}.${commandOptions.enum}.${commandOptions.item}`;
          // @ts-ignore
          await setObjectAsync(newReportId, obj);
          logs(`Object ${newReportId} is created : ${existsObject(newReportId)}`);
          menuMenuItemsAndRowsClearCached(user);
        } catch (error) {
          console.error(`Object can not be created - setObject don't enabled. Error is ${JSON.stringify(error)}`);
          currentMenuPosition.splice(-1);
        }
        if (Object.keys(enumerationsList[dataTypeReport].enums).length > 1) currentMenuPosition.splice(-1);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdUseCommonTranslation: {
        const currentTranslationId = commandOptions.translationId,
          commonTranslationId = `${translationsCommonFunctionsAttributesPrefix}.${currentTranslationId
            .split('.')
            .pop()}`,
          currentTranslationIdValue = translationsItemGet(user, currentTranslationId);
        if (
          translationsItemGet(user, commonTranslationId) === commonTranslationId &&
          currentTranslationIdValue !== commandOptions.translationId
        ) {
          translationsItemStore(user, commonTranslationId, currentTranslationIdValue);
        }
        translationsItemStore(user, currentTranslationId, commonTranslationId);
        menuMenuDraw(user, cachedValueGet(user, cachedMenuItem).slice(0, -1));
        break;
      }
      case cmdAlertSubscribe: {
        alertsManage(
          user,
          commandOptions.state,
          commandOptions.function,
          commandOptions.destination,
          alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
        );
        menuMenuItemsAndRowsClearCached(user);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdItemJumpTo: {
        const jumpToArray = commandOptions.jumpToArray ? commandOptions.jumpToArray : [];
        jumpToArray.forEach((jumpToItem) => {
          if (jumpToItem === jumpToUp) {
            if (currentMenuPosition.length) currentMenuPosition.pop();
          } else if (jumpToItem === jumpToLeft || jumpToItem === jumpToRight) {
            if (currentMenuPosition.length) {
              let currentPos = currentMenuPosition.pop();
              if (!isNaN(currentPos)) {
                currentPos = Number(currentPos) + (jumpToItem === jumpToLeft ? -1 : 1);
              }
              currentMenuPosition.push(currentPos);
            }
          } else if (jumpToItem !== undefined) {
            currentMenuPosition.push(jumpToItem);
          }
        });
        menuMenuItemsAndRowsClearCached(user);
        // logs(`currentMenuItem = ${currentMenuPosition}`, _l);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdSetOffset: {
        currentMenuPosition = commandOptions.index.split('.');
        const currentOffset = [commandOptions.index, commandOptions.offset].join(itemsDelimiter);
        cachedValueSet(user, cachedMenuButtonsOffset, currentOffset);
        menuMenuItemsAndRowsClearCached(user);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdDeleteAllSentImages: {
        sentImagesDelete(user);
        menuMenuItemsAndRowsClearCached(user);
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
      case cmdNoOperation: {
        menuMenuDraw(user, currentMenuPosition);
        break;
      }
    }
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
    const chatId = Number(stateId.split('.').slice(-2, -1));
    if (!isNaN(chatId) && chatId < 0) {
      if (activeOnly) {
        const user = telegramGenerateUserObjectFromId(undefined, chatId),
          [_lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
            user,
            cachedBotSendMessageId,
            timeDelta48,
          ),
          [_lastUserMessageId, isUserMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
            user,
            cachedLastMessage,
            timeDelta96,
          );
        if (!isBotMessageOldOrNotExists && !isUserMessageOldOrNotExists) chatsList.push(chatId);
      } else {
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
function telegramFileSend(user, fileFullPath, callback) {
  nodeFS.access(fileFullPath, nodeFS.constants.R_OK, (error) => {
    if (error) {
      const errorMessage = `Can't read file ${fileFullPath}! Error is ${JSON.stringify(error)}`;
      console.warn(errorMessage);
      if (callback) callback({success: false, error: errorMessage});
    } else {
      const documentTelegramObject = {
        text: fileFullPath,
        type: 'document',
      };
      if (user.userId) documentTelegramObject.user = telegramGetUserIdForTelegram(user);
      if (user.userId != user.chatId) {
        documentTelegramObject.chatId = user.chatId;
      }
      menuMenuItemsAndRowsClearCached(user);
      const clearCurrent = telegramMessageClearCurrent(user, false, true);
      telegramObjectPushToQueue(user, clearCurrent ? [clearCurrent, documentTelegramObject] : documentTelegramObject);
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
function telegramImageSend(user, imageFullPath, callback) {
  nodeFS.access(imageFullPath, nodeFS.constants.R_OK, (error) => {
    if (error) {
      const errorMessage = `Can't read file ${imageFullPath}! Error is ${JSON.stringify(error)}`;
      console.warn(errorMessage);
      if (callback) callback({success: false, error: errorMessage});
    } else {
      const imageTelegramObject = {
        text: imageFullPath,
        type: 'photo',
      };
      if (user.userId) imageTelegramObject.user = telegramGetUserIdForTelegram(user);
      if (user.userId != user.chatId) {
        imageTelegramObject.chatId = user.chatId;
      }
      menuMenuItemsAndRowsClearCached(user);
      const clearCurrent = telegramMessageClearCurrent(user, false, true);
      telegramObjectPushToQueue(user, clearCurrent ? [clearCurrent, imageTelegramObject] : imageTelegramObject);
      if (callback) callback({success: true});
    }
  });
}

/**
 * This function process the `extensionsSendFileCommand`.
 * @param {object} data - The object with the 'user'(the uses object) and 'fileFullPath' properties.
 * @param {function} callback - The function to return status to extension.
 */
function telegramActionOnFileSendCommand(data, callback) {
  const {user, fileFullPath} = data;
  if (user && fileFullPath) {
    telegramFileSend(user, fileFullPath, callback);
  } else {
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
function telegramActionOnImageSendCommand(data, callback) {
  const {user, imageFullPath} = data;
  if (user && imageFullPath) {
    telegramImageSend(user, imageFullPath, callback);
  } else {
    const error = `Wrong data provided! ${JSON.stringify(data)}`;
    console.warn(error);
    callback({success: false, error});
  }
}

/**
 * This function finalize preparation of Telegram message object, to send or edit Telegram bot message, and push it to the sending queue.
 * @param {object} user - The user object.
 * @param {object} messageObject - The prepared for "draw" the Telegram message object.
 * @param {object} messageOptions - The message options.
 */
function telegramMessageObjectPush(user, messageObject, messageOptions) {
  const {clearBefore, clearUserMessage, createNewMessage, isSilent} = messageOptions;
  const isMenuOn = cachedValueExists(user, cachedMenuOn) && cachedValueGet(user, cachedMenuOn);
  if (isMenuOn || createNewMessage) {
    const timeStamp = '<i>' + formatDate(new Date(), configOptions.getOption(cfgDateTimeTemplate, user)) + '</i> ',
      lastMessagePlainText = cachedValueExists(user, cachedLastMessage) ? cachedValueGet(user, cachedLastMessage) : '',
      currentMessagePlainText = JSON.stringify(messageObject);
    if (lastMessagePlainText !== currentMessagePlainText || createNewMessage || clearBefore) {
      cachedValueSet(user, cachedLastMessage, currentMessagePlainText);
      const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
        user,
        cachedBotSendMessageId,
        timeDelta48,
      );
      let telegramObject = {
        text:
          (messageObject.alert ? messageObject.alert : '') +
          (messageObject.buttons ? timeStamp : '') +
          messageObject.message,
        parse_mode: 'HTML',
      };
      if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
      if (user.userId != user.chatId) {
        telegramObject.chatId = user.chatId;
      }
      if ((createNewMessage && !isMenuOn) || clearBefore || isBotMessageOldOrNotExists) {
        if (messageObject.buttons !== undefined) {
          telegramObject.reply_markup = {
            inline_keyboard: messageObject.buttons,
          };
        }
        if (isSilent) telegramObject.disable_notification = isSilent;
      } else {
        telegramObject[telegramCommandEditMessage] = {
          options: {
            chat_id: user.chatId,
            message_id: lastBotMessageId,
            parse_mode: 'HTML',
          },
        };
        if (messageObject.buttons !== undefined) {
          telegramObject[telegramCommandEditMessage].options.reply_markup = {
            inline_keyboard: messageObject.buttons,
          };
        }
      }
      let telegramObjects = new Array();
      if (
        clearBefore ||
        ((!telegramObject.hasOwnProperty(telegramCommandEditMessage) ||
          telegramObject[telegramCommandEditMessage] === undefined) &&
          !isBotMessageOldOrNotExists)
      ) {
        const clearCurrent = telegramMessageClearCurrent(user, false, true);
        if (clearCurrent) telegramObjects.push(clearCurrent);
      }
      telegramObjects.push(telegramObject);
      if (clearUserMessage) {
        telegramObjects = [telegramObjects];
        const clearUser = telegramMessageClearCurrent(user, clearUserMessage, true);
        if (clearUser) telegramObjects.push(clearUser);
      }
      // logs(`telegramObjects = ${JSON.stringify(telegramObjects, null, 2)}`, _l)
      telegramObjectPushToQueue(user, telegramObjects);
      if (createNewMessage || clearBefore) {
        cachedValueSet(user, cachedMenuOn, true);
      }
    } else {
      logs('lastMessage is equal to preparedMessageObject, sendTo Telegram skipped');
    }
  }
}

/**
 * This function pushes current Telegram message object to the queue/
 * @param {object} user - The user object.
 * @param {object|object[]} telegramObject - The Telegram message object (or an array of "linked" objects) to push to the queue.
 */
function telegramObjectPushToQueue(user, telegramObject) {
  let userMessagesQueue = cachedValueGet(user, cachedTelegramMessagesQueue);
  logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
  if (!userMessagesQueue) {
    userMessagesQueue = [];
  }
  const isReady = userMessagesQueue.length === 0;
  if (typeOf(telegramObject, 'array') && telegramObject.length && typeOf(telegramObject[0], 'array')) {
    telegramObject.forEach((telegramSubObject) => userMessagesQueue.push(telegramSubObject));
  } else {
    userMessagesQueue.push(telegramObject);
  }
  logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue, null, 2)}`);
  cachedValueSet(user, cachedTelegramMessagesQueue, userMessagesQueue);
  if (isReady) {
    telegramQueueProcess(user);
  }
}

/**
 * This take the appropriate message from queue and send it to the Telegram adapter.
 * @param {object} user - The user object.
 * @param {number=} messageId - The Telegram message unique Id.
 */
function telegramQueueProcess(user, messageId) {
  /**
   * The function to process the result of sending the message to the Telegram adapter, and take and process a "linked" one, if it exists(for example delete and new one).
   * @param {number} result - The result of sending the message by Telegram adapter.
   * @param {object} user - The user object.
   * @param {object} telegramObject - The Telegram message object, result of sending is processing.
   * @param {object[]} telegramObjects - The arrays of Telegram objects, which can contain one message, or two, "linked" together.
   * @param {number} currentLength - The current length of queue.
   * @param {boolean=} waitForLog - The selector to identify is needed to wait for log for error details.
   */
  function telegramSendToCallBack(
    result,
    user,
    telegramObject,
    telegramObjects,
    currentLength,
    sendToTS,
    waitForLog = false,
  ) {
    let userMessagesQueue = cachedValueGet(user, cachedTelegramMessagesQueue),
      telegramError;
    const currentTS = Date.now();
    if (!result) {
      if (waitForLog) {
        setTimeout(() => {
          telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, sendToTS, false);
        }, telegramDelayToCatchLog);
      } else {
        // logs(`telegramLastErrors = ${JSON.stringify(telegramLastErrors, JSONReplacerWithMap)}}`, _l)
        if (telegramLastErrors && telegramLastErrors.size) {
          if (user.chatId > 0 && telegramLastErrors.has(user.chatId)) {
            telegramError = telegramLastErrors.get(user.chatId);
            if (telegramError.ts < sendToTS || telegramError.ts > currentTS) {
              telegramError = null;
            } else {
              telegramLastErrors.delete(user.chatId);
            }
          } else if (user.chatId < 0 && telegramLastErrors.has(0)) {
            const groupChatErrors = telegramLastErrors.get(0);
            if (typeOf(groupChatErrors, 'array') && groupChatErrors.length) {
              const errorIndex = groupChatErrors.findIndex((error) => error.ts >= sendToTS && error.ts < currentTS);
              if (errorIndex >= 0) {
                telegramError = groupChatErrors[errorIndex];
                groupChatErrors.splice(errorIndex, 1);
              }
            }
          }
        }
        console.warn(
          `Can't send message (${JSON.stringify(telegramObject)}) to (${JSON.stringify({
            ...user,
            rootMenu: null,
          })})!\nResult = ${JSON.stringify(result)}.\nError details = ${JSON.stringify(telegramError, null, 2)}.`,
        );
        if (
          telegramError &&
          telegramError.hasOwnProperty('error') &&
          telegramError.error.level === telegramErrorLevelFatal
        ) {
          console.warn(`Going to retry send the whole message after timeout = ${telegramDelayToSendReTry} ms.`);
          setTimeout(() => {
            console.warn(`Retrying message send.`);
            telegramQueueProcess(user);
          }, telegramDelayToSendReTry);
        } else if (
          telegramError &&
          telegramError.hasOwnProperty['error'] &&
          telegramError.error.level === telegramErrorLevelTelegram &&
          telegramObject &&
          telegramObject.hasOwnProperty(telegramError.command)
        ) {
          const [currentMessageId, isCurrentMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
            user,
            cachedBotSendMessageId,
            timeDelta48,
          );
          if (
            !isCurrentMessageOldOrNotExists &&
            currentMessageId != telegramObject[telegramError.command].options.message_id
          ) {
            telegramObject[telegramError.command].options.message_id = currentMessageId;
            sendTo(telegramAdapter, telegramObject, (result) => {
              telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
            });
          } else {
            result = -1;
          }
        } else if (
          telegramObject &&
          (telegramObject.hasOwnProperty(telegramCommandDeleteMessage) ||
            telegramObject.hasOwnProperty(telegramCommandEditMessage))
        ) {
          const messageCommand = telegramObject.hasOwnProperty(telegramCommandDeleteMessage)
              ? telegramCommandDeleteMessage
              : telegramCommandEditMessage,
            [currentMessageId, isCurrentMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
              user,
              cachedBotSendMessageId,
              timeDelta48,
            );
          if (
            !isCurrentMessageOldOrNotExists &&
            currentMessageId != telegramObject[messageCommand].options.message_id
          ) {
            telegramObject[messageCommand].options.message_id = currentMessageId;
            sendTo(telegramAdapter, telegramObject, (result) => {
              telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
            });
          } else {
            result = -1;
          }
        }
        if (telegramObject && result === -1) {
          if (telegramObject.hasOwnProperty(telegramCommandEditMessage) && telegramObjects.length === 1) {
            telegramObject.reply_markup = {
              inline_keyboard: telegramObject[telegramCommandEditMessage].options.reply_markup.inline_keyboard,
            };
            delete telegramObject[telegramCommandEditMessage];
            telegramObjects = [telegramObject];
            sendTo(telegramAdapter, telegramObject, (result) => {
              telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
            });
          }
        }
      }
    }
    if (result) {
      if (
        result === 1 &&
        telegramObject.hasOwnProperty('type') &&
        ['document', 'photo'].includes(telegramObject['type'])
      ) {
        if (nodePath.dirname(telegramObject.text).includes(temporaryFolderPrefix))
          nodeFS.rm(nodePath.dirname(telegramObject.text), {recursive: true, force: true}, (err) => {
            if (err)
              console.warn(
                `Can't delete temporary file  '${telegramObject.text}' and directory! Error: '${JSON.stringify(err)}'.`,
              );
          });
      }
      // logs(`result = ${result}, getCachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)}, telegramObject = ${JSON.stringify(telegramObject)}`);
      // logs(`\n = ${(result === 1) && telegramObject && telegramObject[telegramCommandDeleteMessage] && telegramObject[telegramCommandDeleteMessage].isBotMessage}`)
      if (
        result === 1 &&
        telegramObject &&
        telegramObject[telegramCommandDeleteMessage] &&
        telegramObject[telegramCommandDeleteMessage].isBotMessage &&
        cachedValueExists(user, cachedBotSendMessageId)
      ) {
        // logs(`getCachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)} == telegramObject[telegramCommandDeleteMessage].options.message_id ${telegramObject[telegramCommandDeleteMessage].options.message_id} == ${getCachedState(user, cachedBotSendMessageId) == telegramObject[telegramCommandDeleteMessage].options.message_id}`)
        if (
          cachedValueGet(user, cachedBotSendMessageId) ==
          telegramObject[telegramCommandDeleteMessage].options.message_id
        ) {
          cachedValueDelete(user, cachedBotSendMessageId);
        }
      }
      if (telegramObjects.length) {
        telegramObject = telegramObjects.shift();
        // logs(`\ntelegramObject = ${JSON.stringify(telegramObject)}, \ntelegramObjects = ${JSON.stringify(telegramObjects)}`);
        sendTo(telegramAdapter, telegramObject, (result) => {
          telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
        });
      } else {
        if (userMessagesQueue) {
          userMessagesQueue.splice(0, currentLength);
          logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
          if (userMessagesQueue.length === 0) {
            cachedValueDelete(user, cachedTelegramMessagesQueue);
          } else {
            cachedValueSet(user, cachedTelegramMessagesQueue, userMessagesQueue);
          }
        }
      }
    }
  }

  if (telegramIsConnected) {
    const userMessagesQueue = cachedValueGet(user, cachedTelegramMessagesQueue);
    if (userMessagesQueue && userMessagesQueue.length) {
      if (messageId === undefined) {
        const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
          user,
          cachedBotSendMessageId,
          timeDelta48,
        );
        if (!isBotMessageOldOrNotExists) {
          messageId = lastBotMessageId;
        }
      }
      let /**
         * If messages in queue more then 2 - we will take last one, otherwise - first one.
         */
        currentPos = userMessagesQueue.length > 2 ? userMessagesQueue.length - 1 : 0,
        telegramObjects;
      // will send a last message, to prevent spamming the telegram with flipping some states in ioBroker. In case of user input - we will not lost any message
      do {
        telegramObjects = objectDeepClone(userMessagesQueue[currentPos]);
        if (telegramObjects === undefined) {
          if (currentPos < userMessagesQueue.length - 1) {
            currentPos = userMessagesQueue.length - 1;
          } else if (currentPos > 0) currentPos -= 1;
          else {
            cachedValueDelete(user, cachedTelegramMessagesQueue);
            currentPos = -1;
          }
          telegramObjects = currentPos >= 0 ? objectDeepClone(userMessagesQueue[currentPos]) : undefined;
        }
        if (typeOf(telegramObjects, 'object')) telegramObjects = [telegramObjects];
        if (
          telegramObjects &&
          telegramObjects[0][telegramCommandDeleteMessage] &&
          telegramObjects[0][telegramCommandDeleteMessage].isBotMessage
        ) {
          telegramObjects[0][telegramCommandDeleteMessage].options.message_id = messageId;
          if (telegramObjects[0][telegramCommandDeleteMessage].options.message_id === undefined) {
            console.warn(`No message for Delete! Going to skip command ${JSON.stringify(telegramObjects[0])}.`);
            telegramObjects.shift();
          }
          if (telegramObjects && telegramObjects.length === 0) {
            userMessagesQueue.splice(currentPos, 1);
            logs(`userMessagesQueue = ${JSON.stringify(userMessagesQueue)}`);
            if (userMessagesQueue.length === 0) {
              cachedValueDelete(user, cachedTelegramMessagesQueue);
            } else {
              cachedValueSet(user, cachedTelegramMessagesQueue, userMessagesQueue);
            }
            telegramObjects = undefined;
          }
        }
      } while (telegramObjects === undefined && userMessagesQueue.length);
      if (telegramObjects) {
        if (messageId) {
          if (telegramObjects[0].hasOwnProperty(telegramCommandEditMessage)) {
            telegramObjects[0][telegramCommandEditMessage].options.message_id = messageId;
          }
        }
        // logs(`messageId = ${messageId}`, _l);
        const telegramObject = telegramObjects.shift(),
          sentToTimeStamp = Date.now();
        // logs(`\n userMessagesQueue.length = ${userMessagesQueue.length}, userMessagesQueue = ${JSON.stringify(userMessagesQueue)}\ntelegramObject = ${JSON.stringify(telegramObject)}, \ntelegramObjects = ${JSON.stringify(telegramObjects)}`, _l);
        sendTo(telegramAdapter, telegramObject, (result) => {
          telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentPos + 1, sentToTimeStamp, true);
        });
      }
    }
  } else {
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
function telegramMessageClearCurrent(user, isUserMessageToDelete, createTelegramObjectOnly = false, messageIdToDelete) {
  const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
    user,
    cachedBotSendMessageId,
    timeDelta48,
  );
  const messageId = messageIdToDelete
    ? messageIdToDelete
    : isUserMessageToDelete
    ? cachedValueGet(user, cachedMessageId)
    : isBotMessageOldOrNotExists
    ? undefined
    : lastBotMessageId;
  if (messageId) {
    logs('messageId = ' + messageId);
    const telegramObject = {
      deleteMessage: {
        options: {
          chat_id: user.chatId,
          message_id: messageId,
        },
        isBotMessage: !isUserMessageToDelete,
      },
    };
    if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
    if (user.userId != user.chatId) {
      telegramObject.chatId = user.chatId;
    }
    if (!createTelegramObjectOnly) {
      cachedValueSet(user, cachedLastMessage, '');
      telegramObjectPushToQueue(user, telegramObject);
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
function telegramMessageDisplayPopUp(user, text, showAlert = false) {
  if (configOptions.getOption(cfgShowResultMessages, user)) {
    const telegramObject = {
      answerCallbackQuery: {
        show_alert: showAlert ? true : false,
      },
    };
    if (text && typeOf(text) === 'string' && text.length) {
      telegramObject.answerCallbackQuery.text = text;
    }
    /** Can send pop-up only in private chat **/
    if (user.userId == user.chatId) {
      if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
      sendTo(telegramAdapter, telegramObject, (result) => {
        if (!result) {
          console.warn(
            `Can't send pop-up message (${JSON.stringify(telegramObject)}) to (${JSON.stringify(
              user,
            )})!\nResult = ${JSON.stringify(result)}.`,
          );
        }
      });
    }
  }
}

//*** send messages to Telegram - end ***//

//*** Telegram interaction - begin ***//

let telegramIsConnected = false;
const telegramQueuesIsWaitingConnection = [],
  telegramLastErrors = new Map(),
  telegramErrorParseRegExp =
    /^telegram.\d\s+\(\d+\)\s+Cannot\s+send\s+(\w+)\s+\[(chatId|user)\s-\s(-?\d+|\w+)\]:\s+Error:\s(\w+?):\s(.+?):\s(.+)$/,
  telegramCommandEditMessage = 'editMessageText',
  telegramCommandDeleteMessage = 'deleteMessage',
  telegramErrorLevelFatal = 'EFATAL',
  telegramErrorLevelTelegram = 'ETELEGRAM',
  telegramDelayToSendReTry = 3000,
  telegramDelayToCatchLog = 20,
  telegramBotSendRawId = `${telegramAdapter}.communicate.botSendRaw`,
  telegramRequestRawId = `${telegramAdapter}.communicate.requestRaw`,
  telegramRequestPathFile = `${telegramAdapter}.communicate.pathFile`;

/**
 * This function extracts the user Id for the Telegram message object.
 * @param {object} user - The user object.
 * @returns {string|number} The userId
 */
function telegramGetUserIdForTelegram(user) {
  if (!(user.hasOwnProperty('userName') && user.hasOwnProperty('firstName')) && cachedValueExists(user, cachedUser)) {
    user = cachedValueGet(user, cachedUser);
  }
  if (user.hasOwnProperty('userName')) {
    return user.userName;
  } else if (user.hasOwnProperty('firstName')) {
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
function telegramGenerateUserObjectFromId(userId, chatId) {
  let user = {
    userId: userId,
    chatId: userId ? userId : chatId,
  };
  const cachedObject = cachedValueGet(user, cachedUser);
  if (
    cachedObject &&
    typeof cachedObject === 'object' &&
    (cachedObject.hasOwnProperty('userName') || cachedObject.hasOwnProperty('firstName'))
  ) {
    user = {...user, ...cachedObject};
    for (const attr in ['userId', 'chatId']) {
      if (typeof user[attr] === 'string') user[attr] = Number(user[attr]);
    }
  }
  return user;
}

/**
 * This function is used to process the error log records, related to telegram, to catch and process
 * errors in iteracting with Telegram.
 * @param {any} logRecord
 */
function telegramActionOnLogError(logRecord) {
  if (typeOf(logRecord, 'object') && logRecord.hasOwnProperty('from') && logRecord.from === telegramAdapter) {
    try {
      const telegramErrorParsed = telegramErrorParseRegExp.exec(logRecord.message);
      if (telegramErrorParsed && telegramErrorParsed.length === 7) {
        const // @ts-ignore
          chatId = isNaN(telegramErrorParsed[3]) ? 0 : Number(telegramErrorParsed[3]),
          errorMessage = {
            ts: logRecord.ts,
            command: telegramErrorParsed[1],
            chatId: chatId,
            error: {
              level: telegramErrorParsed[4],
              info: telegramErrorParsed[5],
              message: telegramErrorParsed[6],
            },
          };
        if (chatId) {
          telegramLastErrors.set(chatId, errorMessage);
        } else {
          if (!telegramLastErrors.has(chatId)) {
            telegramLastErrors.set(chatId, []);
          }
          const currentErrors = telegramLastErrors.get(chatId);
          currentErrors.push(errorMessage);
        }
        // logs(`error = ${telegramErrorParsed} = ${JSON.stringify(telegramLastErrors, JSONReplacerWithMap)}`, _l)
      }
    } catch (error) {
      //
    }
  }
}

/**
 * This function used to process changes in appropriate `requestRaw` state for Telegram Adapter, to process the user
 * input, menu button pressing and file sending.
 * @param {object} obj - The `requestRaw` state change object.
 */
function telegramActionOnUserRequestRaw(obj) {
  let userRequest = {};
  try {
    userRequest = JSON.parse(obj.state.val);
  } catch (err) {
    logs(`JSON parse error: ${JSON.stringify(err)}`);
  }
  logs(`raw = ${JSON.stringify(userRequest, null, 2)}`);
  if (typeOf(userRequest, 'object') && userRequest.hasOwnProperty('from') && userRequest.from.hasOwnProperty('id')) {
    const userId = userRequest.from.id,
      users = usersInMenu.getUsers();
    if (users.includes(userId)) {
      let messageId, chatId, command;
      if (userRequest.hasOwnProperty('message_id')) {
        messageId = userRequest.message_id;
      } else if (userRequest.hasOwnProperty('message') && userRequest.message.hasOwnProperty('message_id')) {
        messageId = userRequest.message.message_id;
      }
      if (messageId !== undefined) {
        if (userRequest.hasOwnProperty('chat') && userRequest.chat.hasOwnProperty('id')) {
          chatId = userRequest.chat.id;
        } else if (
          userRequest.hasOwnProperty('message') &&
          userRequest.message.hasOwnProperty('chat') &&
          userRequest.message.chat.hasOwnProperty('id')
        ) {
          chatId = userRequest.message.chat.id;
        }
        if (chatId != undefined) {
          if (userRequest.hasOwnProperty('text')) {
            command = userRequest.text;
          } else if (userRequest.hasOwnProperty('data')) {
            command = userRequest.data;
          }
          logs(
            `user = ${JSON.stringify(userId)}, chatId = ${JSON.stringify(chatId)}, messageId = ${JSON.stringify(
              messageId,
            )}, command = ${JSON.stringify(command)}`,
          );
          let user = {};
          if (command !== undefined || userRequest.hasOwnProperty('document')) {
            user = {
              userId: userRequest.from.id,
              chatId: chatId,
              firstName: userRequest.from.first_name,
              lastName: userRequest.from.last_name,
              userName: userRequest.from.username,
            };
            if (user.userId == user.chatId) cachedValueSet(user, cachedUser, user);
          }
          if (command !== undefined) {
            if (userRequest.data) {
              /** if by some reason the menu is freezed - delete freezed queue ...**/
              if (cachedValueExists(user, cachedTelegramMessagesQueue)) {
                console.warn(
                  `Some output is in cache:\n${JSON.stringify(
                    cachedValueGet(user, cachedTelegramMessagesQueue),
                  )}.\nGoing to delete it!`,
                );
                cachedValueDelete(user, cachedTelegramMessagesQueue);
              }
              /** and as we received command - the menu is on now **/
              // setCachedState(user, cachedMenuOn, true);
            }
            cachedValueSet(user, cachedMessageId, messageId);
            commandsUserInputProcess(user, command);
          } else if (userRequest.hasOwnProperty('document')) {
            if (cachedValueExists(user, cachedIsWaitForInput)) {
              const {
                  command: currentCommand,
                  options: commandOptions,
                  index: commandIndex,
                } = commandsExtractCommandWithOptions(user, cachedValueGet(user, cachedIsWaitForInput)),
                commandsOptionsList = cachedValueExists(user, cachedCommandsOptionsList)
                  ? cachedValueGet(user, cachedCommandsOptionsList)
                  : undefined;
              // logs(`isWaitForInput = ${isWaitForInput}, subMenuItemId = ${subMenuItemId}`);
              if (currentCommand === cmdItemUpload) {
                cachedValueSet(
                  user,
                  cachedIsWaitForInput,
                  commandsCallbackDataPrepare(
                    cmdItemUpload,
                    {
                      ...commandOptions,
                      fileName: userRequest.document.file_name,
                      fileSize: userRequest.document.file_size,
                    },
                    commandIndex,
                    commandsOptionsList,
                  ),
                );
                cachedValueSet(user, cachedCommandsOptionsList, commandsOptionsList);
                on({id: telegramRequestPathFile, change: 'any'}, (obj) => {
                  unsubscribe(telegramRequestPathFile);
                  commandsUserInputProcess(user, obj.state.val);
                });
              }
            }
          }
        }
      }
    } else {
      console.warn(
        `Access denied. User ${JSON.stringify(userRequest.from.first_name)} ${JSON.stringify(
          userRequest.from.last_name,
        )} (${JSON.stringify(userRequest.from.username)}) with id = ${userId} not in the list!`,
      );
    }
  }
}

/**
 * This function is used to parse the Telegram message sent to uses, to more clear identification what and to whom
 * it was sent. Especially it needed to clear separation message ID's between multiple users and group chats.
 * @param {object} obj - The `botSendRaw` state change object.
 */
function telegramActionOnSendToUserRaw(obj) {
  let botMessage;
  try {
    botMessage = JSON.parse(obj.state.val);
  } catch (err) {
    logs(`JSON parse error: ${JSON.stringify(err)}`);
  }
  // logs(`sent = ${JSON.stringify(sent, null, 2)}`);
  if (
    typeOf(botMessage, 'object') &&
    botMessage.hasOwnProperty('message_id') &&
    botMessage.message_id &&
    botMessage.hasOwnProperty('chat') &&
    botMessage.chat.hasOwnProperty('type')
  ) {
    let user = {};
    const messageId = botMessage.message_id;
    if (botMessage.chat.type === 'private') {
      user = {
        userId: botMessage.chat.id,
        chatId: botMessage.chat.id,
        firstName: botMessage.chat.first_name,
        lastName: botMessage.chat.last_name,
        userName: botMessage.chat.username,
      };
    } else {
      user.chatId = botMessage.chat.id;
    }
    let isBotMessage = false,
      isDocument = false,
      userId = 0;
    logs(`user = ${JSON.stringify(user)}, botSendMessageId = ${JSON.stringify(messageId)}`);
    if (
      botMessage.hasOwnProperty('reply_markup') &&
      botMessage.reply_markup.hasOwnProperty('inline_keyboard') &&
      botMessage.reply_markup.inline_keyboard !== undefined
    ) {
      const inline_keyboard = botMessage.reply_markup.inline_keyboard;
      logs('inline_keyboard = ' + JSON.stringify(inline_keyboard, null, 2));
      isBotMessage =
        inline_keyboard.findIndex(
          (keyboard) =>
            keyboard.findIndex((element) => {
              if (element.hasOwnProperty('callback_data') && element.callback_data.indexOf(cmdClose) === 0) {
                userId = element.callback_data.split(itemsDelimiter).pop();
                return true;
              }
              return false;
            }) >= 0,
        ) >= 0;
      if (isBotMessage && messageId) cachedValueSet(user, cachedBotSendMessageId, messageId);
      logs(`isBotMessage = ${JSON.stringify(isBotMessage)}, botSendMessageId = ${JSON.stringify(messageId)}`);
    } else if (botMessage.hasOwnProperty('text') && botMessage.text.includes(botMessageStamp)) {
      logs(`is Bot Message - ${botMessage.text}`);
      isBotMessage = true;
    }
    if (botMessage.hasOwnProperty('photo')) {
      // logs(`Photo, messageId =  ${sent.message_id}`);
      sentImageStore(user, botMessage.message_id);
      isDocument = true;
    } else if (botMessage.hasOwnProperty('document')) {
      isDocument = true;
    }
    if (isBotMessage) {
      if (!user.userId && userId) {
        user.userId = Number(userId);
        user = {...cachedValueGet({userId, chatId: userId}, cachedUser), ...user};
        logs(`user = ${JSON.stringify(user)}`);
      }
      cachedValueSet(user, cachedMenuOn, true);
      telegramQueueProcess(user, messageId);
    } else if (isDocument) {
      if (!user.userId) {
        user = {...cachedValueGet(user, cachedUser), ...user};
      }
      // logs(`CachedState(user, cachedMenuOn) = ${getCachedState(user, cachedMenuOn)}, CachedState(user, cachedBotSendMessageId) = ${getCachedState(user, cachedBotSendMessageId)}`)
      menuMenuItemsAndRowsClearCached(user);
      cachedValueDelete(user, cachedMenuOn);
      menuMenuDraw(user);
    }
  }
}

/**
 * This function used to watch the state `connected` of the Telegram adapter.
 * @param {object} connected - The special object, if called from subscription on changes.
 */
function telegramActionOnConnected(connected) {
  logs('connected = ' + JSON.stringify(connected));
  if (typeOf(connected, 'object') && connected.hasOwnProperty('state') && connected.state.hasOwnProperty('val')) {
    telegramIsConnected = connected.state.val;
  } else {
    telegramIsConnected = false;
  }
  unsubscribe(telegramBotSendRawId);
  unsubscribe(telegramRequestRawId);
  if (telegramIsConnected) {
    /** answerRawSubscribe */
    on({id: telegramBotSendRawId, change: 'ne'}, telegramActionOnSendToUserRaw);
    /** requestRawSubscribe */
    on({id: telegramRequestRawId, change: 'ne'}, telegramActionOnUserRequestRaw);
    setTimeout(() => {
      while (telegramQueuesIsWaitingConnection.length) {
        telegramQueueProcess(telegramQueuesIsWaitingConnection.shift());
      }
    }, telegramDelayToSendReTry);
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
  configOptions.subscribeOnOption(cfgMenuRoles, () => {
    rolesInMenu.refresh();
  });
  usersInMenu.assignRelated((roleId, compiled) => rolesInMenu.getRoles(roleId, compiled));
  usersInMenu.refresh();
  usersInMenu.getUsers().forEach((userId) => {
    if (usersInMenu.validId(userId)) configOptions.loadOptions(usersInMenu.getUser(userId));
  }); // 3
  configOptions.subscribeOnOption(cfgMenuUsers, () => {
    usersInMenu.refresh();
  });

  /** Cached states */
  // @ts-ignore
  onMessage(extensionsGetCachedStateCommand, cachedActionOnGetCachedState); // 4
  // @ts-ignore
  onMessage(extensionsSetCachedStateCommand, cachedActionOnSetCachedState); // 5

  /** send File or Image */
  // @ts-ignore
  onMessage(extensionsSendFileCommand, telegramActionOnFileSendCommand);
  // @ts-ignore
  onMessage(extensionsSendImageCommand, telegramActionOnImageSendCommand);

  /** update translation */
  translationsLoad();

  if (Object.keys(translationsList).length === 0) {
    await translationsInitialLoadLocalesFromRepository();
  }

  /** enumerationItems Init */
  //External Scripts Init
  // @ts-ignore
  onMessage(extensionsRegisterCommand, extensionsActionOnRegisterToAutoTelegramMenu); // 6

  Object.keys(enumerationsList).forEach((itemType) => {
    enumerationsLoad(itemType);
    enumerationsInit(itemType, itemType === dataTypeFunction);
    enumerationsSave(itemType);
  });

  const telegramConnectedId = `system.adapter.${telegramAdapter}.connected`;
  /*** subscribe on Telegram ***/
  telegramActionOnConnected({state: getState(telegramConnectedId)});
  on({id: telegramConnectedId, change: 'ne'}, telegramActionOnConnected);
  onLog('error', telegramActionOnLogError);

  /** load and subcribe on alerts */
  alertsInit(true);

  if (configOptions.getOption(cfgConfigBackupCopiesCount)) {
    _backupScheduleReference = schedule({hour: 2, minute: 5}, () => {
      backupCreate(backupModeAuto);
    });
  }

  if (configOptions.getOption(cfgUpdateMessagesOnStart)) {
    const updateAt = new Date(Date.now() + configOptions.getOption(cfgUpdateMessagesOnStart) * 60 * 1000);
    schedule(
      {
        second: updateAt.getSeconds(),
        hour: updateAt.getHours(),
        minute: updateAt.getMinutes(),
        date: updateAt.getDate(),
        month: updateAt.getMonth(),
        year: updateAt.getFullYear(),
      },
      () => {
        console.log(`Refresh after start is scheduled on ${updateAt.toString()} fo all users!`);
        menuMenuMessageRenew(menuRefreshTimeAllUsers, true, false);
      },
    );
  }
  menuMenuMessageRenew(menuRefreshTimeAllUsers, true, true);
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
  if (Array.isArray(value) || value instanceof Array) {
    result = 'array';
  } else if (value instanceof Map) {
    result = 'map';
  } else if (value instanceof RegExp) {
    result = 'regexp';
  } else if (value instanceof Date) {
    result = 'date';
  } else {
    result = typeof value;
  }
  if (compareWithType && typeof compareWithType === 'string' && compareWithType.length) {
    return result === compareWithType;
  } else {
    return result;
  }
}

/**
 * This function capitalize the first letter of string.
 * @param {string} string - The string to capitalize.
 * @returns {string} The result string.
 */
function stringCapitalize(string) {
  if (string && typeof string === 'string') {
    return string[0].toUpperCase() + string.slice(1);
  }
  return '';
}

/**
 * This function extends standard `getObject`. If current object is an 'alias', it will enrich the `common`
 * property of it by the data from the 'origin' object.
 * @param {string} id - The object ID.
 * @param {string=} enumId - Which enum should be included in the returned object. true to return all enums.
 * @returns {object} The result object.
 */
function getObjectEnriched(id, enumId) {
  if (existsObject(id)) {
    const currentObject = enumId ? getObject(id, enumId) : getObject(id);
    if (
      configOptions.getOption(cfgUseAliasOriginForCommonAttrs) &&
      currentObject.hasOwnProperty('common') &&
      currentObject.common
    ) {
      const currentObjectCommon = currentObject.common;
      if (currentObjectCommon.hasOwnProperty('alias')) {
        const currentObjectAlias = currentObjectCommon.alias;
        let originObjectId = '';
        if (currentObjectAlias.hasOwnProperty('id') && typeOf(currentObjectAlias.id, 'string')) {
          originObjectId = currentObjectAlias.id;
        } else if (currentObjectAlias.id.hasOwnProperty('write')) {
          originObjectId = currentObjectAlias.write;
        } else if (currentObjectAlias.id.hasOwnProperty('read')) {
          originObjectId = currentObjectAlias.read;
        }
        if (originObjectId) {
          if (currentObjectAlias.hasOwnProperty('read') || currentObjectAlias.hasOwnProperty('write')) {
            if (!currentObjectCommon.hasOwnProperty('read')) currentObjectCommon.read = true;
            currentObjectCommon.write =
              currentObjectAlias.hasOwnProperty('write') || currentObjectAlias.id.hasOwnProperty('write');
          } else {
            const originObject = getObject(originObjectId);
            if (originObject && originObject.hasOwnProperty('common') && originObject.common) {
              const originObjectCommon = originObject.common;
              attributesToCopyFromOriginToAlias.forEach((attributeId) => {
                if (
                  !currentObjectCommon.hasOwnProperty(attributeId) &&
                  originObjectCommon.hasOwnProperty(attributeId)
                ) {
                  currentObjectCommon[attributeId] = originObjectCommon[attributeId];
                }
              });
            }
          }
        }
      }
    }
    return currentObject;
  } else {
    return undefined;
  }
}

function checkNumberStateValue(stateId, value, stateObject) {
  const currentObject = stateObject ? stateObject : getObjectEnriched(stateId);
  if (value !== undefined && currentObject && currentObject.common) {
    const currentObjectCommon = currentObject.common,
      currentType = currentObjectCommon['type'];
    if (currentType === 'number') {
      const currentStateValuesStep = currentObjectCommon.hasOwnProperty('step')
        ? Number(currentObjectCommon['step'])
        : 1;
      return (
        (currentObjectCommon.min === undefined || value >= currentObjectCommon.min) &&
        (currentObjectCommon.max === undefined || value <= currentObjectCommon.max) &&
        value % currentStateValuesStep == 0
      );
    }
  }
  return false;
}

/**
 * This function is doing a full clone of any object with all levels of hierarchy.
 * @param {any} obj
 * @returns
 */
function objectDeepClone(obj) {
  // If the object is `null` or not an object, return the object itself
  if (obj === null || typeof obj !== 'object') return obj;

  // If the object is an array, clone each element in the array
  if (Array.isArray(obj)) {
    return obj.map(objectDeepClone);
  }

  // If the object is a Date, return a new Date object with the same value
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // If the object is a RegExp, return a new RegExp object with the same value
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }

  // If the object is a Map, clone each key-value pair in the Map
  if (obj instanceof Map) {
    const clonedMap = new Map();
    obj.forEach((value, key) => clonedMap.set(key, objectDeepClone(value)));
    return clonedMap;
  }

  // If the object is a regular object, clone each property in the object
  const clonedObject = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObject[key] = objectDeepClone(obj[key]);
    }
  }

  return clonedObject;
}

/**
 * This function took a `template` object and enreach it by data from the `inputObject` on a first level of inheritance.
 * @param {any} template - The teplate object.
 * @param {any} inputObject - The input object.
 * @param {any=} level - The level of inheritance.
 * @returns {any} The result of enreach.
 */
function objectAssignToTemplateLevelOne(template, inputObject, level = 0) {
  // Clone the input object to prevent mutating it
  const clonedInput = objectDeepClone(inputObject);
  // Return the cloned input object if it's not an object
  if (typeof clonedInput !== 'object' || clonedInput === null) return clonedInput;
  // Return the cloned input object if the level is greater than 0
  if (level > 0) return clonedInput;
  // Create an empty object to store the result
  const result = {};
  // Loop over the properties in the template object
  for (const key of Object.keys(template)) {
    // Get the value of the property in the input object
    const inputValue = clonedInput[key];
    // Recursively call the function for the property value
    const newValue = objectAssignToTemplateLevelOne(template[key], inputValue, level + 1);
    // Add the new value to the result object if it's defined
    if (newValue !== undefined) result[key] = newValue;
  }
  // Return the result object
  return result;
}

/**
 * This function creates a new object, based on an input one, with sorted properties.
 * @param {object} inputObject - The input object.
 * @returns {object} The "sorted" object.
 */
function objectKeysSort(inputObject) {
  let sortedObject = {};
  // Check for type of inputObject and sort by alphabetical order
  if (typeOf(inputObject) === 'object') {
    const keys = Object.keys(inputObject).sort();
    // Iterate through each key and copy values to sortedObject
    keys.forEach((id) => {
      // Recursive call of function when encountering object value
      if (typeof inputObject[id] === 'object') {
        sortedObject[id] = objectKeysSort(inputObject[id]);
      } else {
        sortedObject[id] = inputObject[id];
      }
    });
  } else {
    sortedObject = inputObject;
  }
  return sortedObject;
}

/**
 * This function logs the message, in case of debug variable is set.
 * @param {string} txt - The text to be logged.
 * @param {any=} debug - The selector for the logging.
 */
function logs(txt, debug) {
  if (configOptions.getOption(cfgDebugMode) || debug !== undefined) {
    console.log((arguments.callee && arguments.callee.caller ? arguments.callee.caller.name : '') + ': ' + txt);
  }
}

/**
 * The replacer function, to convert map objects to JSON.
 * @param {any} key - The key(name) of the object, to be replaced.
 * @param {any} value - The value of the object, to be replaced.
 * @returns {any} The result of replace.
 */
function JSONReplacerWithMap(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: [...value],
    };
  } else {
    return value;
  }
}

/**
 * The reviver function, to convert JSON to the Map object.
 * @param {any} key - The key(name) of the object, to be revived.
 * @param {any} value - The value of the object, to be revived.
 * @returns {any} The result of revive.
 */
function JSONReviverWithMap(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

//*** Utility functions - end ***//
