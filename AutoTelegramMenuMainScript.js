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

// @ts-ignore
const url = require('url');

// @ts-ignore
const emojiRegex = require('emoji-regex');

// @ts-ignore
const jsonStringifySafe = require('json-stringify-safe');

/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

const _l = true;

/*** Make functions to be printable in JSON.stringify with names ***/
// prettier-ignore
Object.defineProperty(Function.prototype, 'toJSON', { // NOSONAR
  // eslint-disable-next-line space-before-function-paren
  value: function () {
    return `function ${this.name}`;
  },
});

/*** Make RegExp to be printable in JSON.stringify with names ***/
// prettier-ignore
Object.defineProperty(RegExp.prototype, 'toJSON', { // NOSONAR
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
  cmdItemSetValue = `${cmdPrefix}ItemSetValue`,
  cmdItemSetInterimValue = `${cmdPrefix}ItemSetInterimValue`,
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
  //*** Location of source of the script ***//
  scriptGitHubAPISite = 'https://api.github.com/',
  scriptRepositoryPath = '/PeterVoronov/ioBrokerTelegramMenuScript/',
  scriptBranch = 'v0.9.5-dev',
  scriptCoreLocalesRemoteFolder = 'locales',
  //*** Various prefixes for ioBroker states ***//
  prefixPrimary = `0_userdata.0.telegram_automenu.${telegramInstance}`,
  prefixConfigStates = `${prefixPrimary}.config`,
  prefixTranslationStates = `${prefixPrimary}.translations`,
  prefixCacheStates = `${prefixPrimary}.cache`,
  prefixCacheStatesCommon = `${prefixCacheStates}.common`,
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
  dataTypeDestination = 'destination',
  dataTypeFunction = 'function',
  dataTypeExtension = 'extensions',
  dataTypeConfig = 'conf',
  dataTypeReport = 'report',
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
  idCachedAlertsStatesValues = 'alertsStatesPreviousValues',
  idTriggersLogs = 'triggersLogs',
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
  //*** Time internal (first part) ***//
  timeInternalModeInterval = 'interval',
  timeInternalModeTime = 'time',
  timeInternalModeMonthAndDay = 'monthAndDay',
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
  iconItemOk = '👌',
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
  iconItemBelow = '⤓',
  iconItemHistory = '📃',
  iconItemReset = '↺',
  iconItemUnavailable = '🆘',
  iconItemCondition = '🤔', //☑️
  iconItemEmpty = '❔',
  iconItemClock = '⏰';
const attributesToCopyFromOriginToAlias = ['read', 'write', 'min', 'max', 'step', 'states', 'unit'];
const checkEmojiRegex = emojiRegex();

const encodedStr = (rawStr) => rawStr.replace(/[<>&]/g, (char) => '&#' + char.charCodeAt(0) + ';');

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
  cfgDebugMode = `${cfgPrefix}DebugMode`,
  cfgTriggersLogsMaxCountRecordsPerTrigger = `${cfgPrefix}TriggersLogsMaxCountRecordsPerTrigger`;
const alertMessageTemplateDefault =
  '${alertFunctionName} "${alertDeviceName} ${translations(In).toLowerCase} ${alertDestinationName}"${alertStateName? $value -:} ${alertStateValue}'; // NOSONAR

const configOptionsParameters = {
    [cfgMenuUsers]: {type: 'object', systemLevel: true, hidden: true, default: {}, description: 'Menu users'},
    [cfgMenuRoles]: {type: 'object', systemLevel: true, hidden: true, default: {}, description: 'Menu roles'},
    [cfgMessagesForMenuCall]: {
      type: 'array',
      subType: 'string',
      systemLevel: true,
      hidden: false,
      default: ['/menu'],
      description: 'List of commands to show the menu',
    },
    [cfgMaxButtonsOnScreen]: {
      type: 'number',
      min: 10,
      max: 50,
      step: 1,
      systemLevel: true,
      hidden: false,
      default: 24,
      description: 'Maximum buttons on one screen except alerts and global menu related',
    },
    [cfgMenuRefreshInterval]: {
      type: 'time',
      mode: timeInternalModeInterval,
      template: 'ms',
      systemLevel: true,
      hidden: false,
      default: 0,
      description: 'Interval to refresh current menu screen(disabled if "0")',
    },
    [cfgExternalMenuTimeout]: {
      type: 'number',
      min: 100,
      max: 10000,
      step: 10,
      unit: 'ms',
      systemLevel: true,
      hidden: false,
      default: 500,
      description: 'Timeout to wait an answer from extensions',
    },
    [cfgHistoryAdapter]: {
      type: 'string',
      systemLevel: true,
      hidden: false,
      default: '',
      description: 'History adapter',
    },
    [cfgGraphsTemplates]: {
      type: 'string',
      systemLevel: true,
      hidden: false,
      default: '',
      description: 'Folder with e-charts templates',
    },
    [cfgUseAliasOriginForCommonAttrs]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: true,
      description: 'Get object "common" description from alias "source".',
    },
    [cfgSkipAttributesWithNullValue]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: true,
      description: "Don't show device attributes with `null` value. Except Buttons and PrimaryState",
    },
    [cfgAllowToDeleteEmptyEnums]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: true,
      description: 'Allow to delete an empty enums (functions, destinations, reports)',
    },
    [cfgConfigBackupCopiesCount]: {
      type: 'number',
      min: 0,
      max: 50,
      step: 1,
      systemLevel: true,
      hidden: false,
      default: 7,
      description: 'Max backup copies of config to be stored. If 0 - automatic backup will not work',
    },
    [cfgAlertMessageTemplateMain]: {
      type: 'string',
      systemLevel: false,
      hidden: false,
      default: alertMessageTemplateDefault,
      description: 'Template for alert message',
    },
    [cfgAlertMessageTemplateThreshold]: {
      type: 'string',
      systemLevel: true,
      hidden: false,
      default: alertMessageTemplateDefault,
      description: 'Template for alert message with threshold',
    },
    [cfgCheckAlertStatesOnStartUp]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: false,
      description: 'Check stored states values on the start of script, to raise an alert',
    },
    [cfgThresholdsForNumericString]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: false,
      description: 'Make possible to set thresholds for states of string type, which is really numeric',
    },
    [cfgTriggersLogsMaxCountRecordsPerTrigger]: {
      type: 'numeric',
      systemLevel: true,
      hidden: false,
      default: 50,
      description: 'Maximum count of records per trigger in trigger logs',
    },
    [cfgDebugMode]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: false,
      description: 'Enable debug mode - huge amount of logs',
    },
    [cfgMenuLanguage]: {
      type: 'string',
      systemLevel: true,
      hidden: false,
      default: 'ru',
      description: 'Menu display language',
    },
    [cfgMenuFunctionsFirst]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: true,
      description: 'Menu display functions on top (or destinations)',
    },
    [cfgMenuFastGeneration]: {
      type: 'boolean',
      systemLevel: true,
      hidden: false,
      default: true,
      description: 'Menu generation buster - less checks, possible empty submenus',
    },
    [cfgSummaryTextLengthMax]: {
      type: 'number',
      min: 20,
      max: 60,
      step: 1,
      systemLevel: false,
      hidden: false,
      default: 30,
      description: 'Maximum numbers of symbols per line (approximate, for )',
    },
    [cfgTextLengthModifierForGChats]: {
      type: 'number',
      min: -10,
      max: 10,
      step: 1,
      systemLevel: false,
      hidden: false,
      default: -4,
      description: 'Modifier for the max of symbols per line for a group chats',
    },
    [cfgClearMenuCall]: {
      type: 'boolean',
      systemLevel: false,
      hidden: false,
      default: true,
      description: 'Delete command, after menu is shown',
    },
    [cfgHierarchicalCaption]: {
      type: 'number',
      min: 0,
      max: 10,
      step: 1,
      systemLevel: false,
      hidden: false,
      default: 0,
      description: 'show caption of the current menu hierarchically',
    },
    [cfgShowHomeButton]: {
      type: 'boolean',
      systemLevel: false,
      hidden: false,
      default: true,
      description: "Always show 'Home' button",
    },
    [cfgShowHorizontalNavigation]: {
      type: 'boolean',
      systemLevel: false,
      hidden: false,
      default: false,
      description: 'Always show "Horizontal" navigation buttons,',
    },
    [cfgShowResultMessages]: {
      type: 'boolean',
      systemLevel: false,
      hidden: false,
      default: true,
      description: 'Show alert messages, as reactions on some input',
    },
    [cfgGraphsScale]: {
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.1,
      systemLevel: false,
      hidden: false,
      default: 1,
      description: 'Scale for e-charts graphs',
    },
    [cfgGraphsIntervals]: {
      type: 'array',
      subType: 'object',
      systemLevel: false,
      hidden: false,
      template: {text: '#m|#h|#D|#W|#M|#Y', rule: new RegExp(`^(\\d+)([${timeIntervalsIndexList}])$`)},
      default: [
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
      ],
      description: 'Time ranges back from now, in minutes',
    },
    [cfgDefaultIconOn]: {
      type: 'string',
      systemLevel: false,
      hidden: false,
      default: iconItemOn,
      description: 'Default icon for ON state',
    },
    [cfgDefaultIconOff]: {
      type: 'string',
      systemLevel: false,
      hidden: false,
      default: iconItemOff,
      description: 'Default icon for OFF state',
    },
    [cfgAlertMessagesHistoryDepth]: {
      type: 'time',
      mode: timeInternalModeInterval,
      template: 'dh',
      systemLevel: false,
      hidden: false,
      default: 48,
      description: 'Alert messages history depth in hours',
    },
    [cfgUpdateMessageTime]: {
      type: 'time',
      mode: timeInternalModeTime,
      template: 'hm',
      systemLevel: false,
      hidden: false,
      default: '12:05',
      description: 'Time to update menu messages',
    },
    [cfgUpdateMessagesOnStart]: {
      type: 'time',
      mode: timeInternalModeInterval,
      template: 'm',
      systemLevel: false,
      hidden: false,
      default: 5,
      description: 'Refresh menu messages after script start. If 0 - will not refresh.',
    },
    [cfgDateTimeTemplate]: {
      type: 'string',
      systemLevel: false,
      hidden: false,
      default: 'DD.MM hh:mm:ss',
      description: 'Template for date and time in Menu',
    },
  },
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
   * @param {object} optionsDetails - the detailed descriptions of the configuration items with default values
   * @param {function} functionScheduleMenuMessageRenew - function, to refresh user menu, not rare, then 24 hours
   * @param {function} functionScheduleMenuUpdate - function to renew menu every `cfgMenuRefreshInterval)` seconds
   */
  constructor(prefix, optionsDetails, functionScheduleMenuMessageRenew, functionScheduleMenuUpdate) {
    this.prefix = prefix;
    this.configOptions = {...optionsDetails};
    this.globalConfig = {};
    Object.keys(optionsDetails).forEach((key) => {
      this.globalConfig[key] = optionsDetails[key].default;
    });
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
  isUserConfigOption(cfgItem, user) {
    return !this.configOptions[cfgItem].systemLevel && user?.userId;
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
    return this.isUserConfigOption(cfgItem, user) ? `${user.userId}` : configOptionScopeGlobal;
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
    if (this.isUserConfigOption(cfgItem, user)) {
      if (this.perUserConfig.has(user.userId)) {
        const perUserConfig = this.perUserConfig.get(user.userId);
        return perUserConfig.hasOwnProperty(cfgItem) && isDefined(perUserConfig[cfgItem]);
      }
    } else {
      return this.globalConfig.hasOwnProperty(cfgItem) && isDefined(this.globalConfig[cfgItem]);
    }
    return false;
  }

  /**
   * This method checks, if the config item has own separate value for current user then return it,
   * otherwise return the global value
   * @param {string} cfgItem - The id of the configuration item.
   * @param {object=} user - The user object.
   * @returns {any} A copy of the value of the configuration item.
   */
  getOption(cfgItem, user) {
    if (this.isUserConfigOption(cfgItem, user) && this.existsOption(cfgItem, user)) {
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
    if (this.configOptions.hasOwnProperty(cfgItem) && typeOf(this.configOptions[cfgItem].template, 'object')) {
      return this.configOptions[cfgItem].template.rule;
    }
    return undefined;
  }

  /**
   * This method return the appropriate validation mask description, or data type of the configuration item.
   * @param {string} cfgItem - The id of the configuration item.
   * @returns {string|undefined} The validation mask description or type of the value of the config item.
   */
  getMaskDescription(cfgItem) {
    if (this.configOptions.hasOwnProperty(cfgItem)) {
      if (typeOf(this.configOptions[cfgItem].template, 'object')) {
        return this.configOptions[cfgItem].template.text;
      } else {
        return typeOf(this.configOptions[cfgItem].subType, 'string')
          ? this.configOptions[cfgItem].subType
          : this.configOptions[cfgItem].type;
      }
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
    if (this.isUserConfigOption(cfgItem, user)) {
      const perUserConfig = this.perUserConfig.has(user.userId) ? this.perUserConfig.get(user.userId) : {};
      if (jsonStringify(this.getOption(cfgItem, null)) === jsonStringify(value)) {
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
      if (cfgItem === cfgMenuRefreshInterval) this.setScheduler();
    }
  }

  /**
   * This method deletes a user-specific value of the configuration item.
   * @param {string} cfgItem - The id of the config item.
   * @param {object} user - The user object.
   */
  deleteUserOption(cfgItem, user) {
    if (this.isUserConfigOption(cfgItem, user)) {
      const perUserConfig = this.perUserConfig.has(user.userId) ? this.perUserConfig.get(user.userId) : {};
      delete perUserConfig[cfgItem];
      this.perUserConfig.set(user.userId, perUserConfig);
      const stateId = this.#getStateId(cfgItem, user);
      if (existsState(stateId))
        deleteState(stateId, (error, result) => {
          if (error) {
            warns(`Error during deletion of state '${stateId}' : ${jsonStringify(error)}`);
          } else {
            logs(`configOptions key state '${stateId}' is deleted with result : ${jsonStringify(result)}`);
          }
        });
    }
  }

  /**
   * This method takes a preliminary value of the config item, and convert it to the type,
   * equal to the type of current(default) value the item.
   * @param {string} cfgItem - The id of the config item.
   * @param {any} value - the value to be parsed
   * @returns {any} The result of the parseOption function.
   */
  parseOption(cfgItem, value) {
    const cfgItemType = this.configOptions[cfgItem].type;
    let result,
      valueToParseType = typeOf(value);
    if (cfgItemType === 'array') {
      if (valueToParseType === 'string') {
        if (value.indexOf('[') === 0) {
          try {
            result = jsonParse(value);
          } catch (err) {
            errs(`Parse error on configOptions[${cfgItem}] - ${jsonStringify(err)}`);
          }
        } else {
          result = value.split(',');
        }
      } else if (valueToParseType === 'array') {
        this.globalConfig[cfgItem] = value;
      }
    } else if (cfgItemType === 'map') {
      if (valueToParseType === 'string') {
        try {
          value = jsonParse(value);
        } catch (err) {
          errs(`Parse error on configOptions[${cfgItem}] - ${jsonStringify(err)}`);
        }
        valueToParseType = typeOf(value);
      }
      if (valueToParseType === 'map') {
        result = value;
      }
    } else if (cfgItemType === 'object') {
      if (valueToParseType === 'string') {
        try {
          value = jsonParse(value);
        } catch (err) {
          errs(`Parse error on configOptions[${cfgItem}] - ${jsonStringify(err)}`);
        }
        valueToParseType = typeOf(value);
      }
      if (valueToParseType === 'object') {
        result = value;
      }
    } else if (cfgItemType === 'number') {
      if (valueToParseType === 'string') {
        if (!isNaN(value)) result = Number(value);
      } else if (valueToParseType === 'number') {
        result = value;
      }
    } else if (cfgItemType === 'boolean') {
      if (valueToParseType === 'string') {
        if (['true', 'false'].includes(value)) result = value === 'true';
      } else if (valueToParseType === 'number') {
        result = value !== 0;
      } else if (valueToParseType === 'boolean') {
        result = value;
      }
    }
    if (cfgItemType === 'string') {
      if (valueToParseType === 'string') {
        result = value;
      } else if (valueToParseType === 'number' || valueToParseType === 'boolean') {
        result = `${value}`;
      }
      const currentMask = this.getMask(cfgItem);
      switch (typeOf(currentMask)) {
        case 'regexp':
          result = currentMask?.test(result) ? result : undefined;
          break;
        default:
          break;
      }
    }
    return result;
  }

  /**
   * This method load, parse and set the value of the config item from the appropriate state.
   * @param {string} cfgItem - The id of the config item to load.
   * @param {object=} user - The user object.
   */
  loadOption(cfgItem, user) {
    const stateId = this.#getStateId(cfgItem, user);
    if (existsState(stateId)) {
      const actualValue = this.parseOption(cfgItem, getState(stateId).val);
      if (isDefined(actualValue)) this.setOption(cfgItem, user, actualValue);
    } else if (!this.isUserConfigOption(cfgItem, user)) {
      this.saveOption(cfgItem, user);
    }
  }

  /**
   * This method loads values of the configuration item from the global and the user contexts.
   * @param {object=} user - The user object.
   */
  loadOptions(user) {
    for (const cfgItem of Object.keys(this.globalConfig)) {
      if (!user || this.isUserConfigOption(cfgItem, user)) this.loadOption(cfgItem, user);
    }
    if (!user) {
      /** it will check all possible states under 'this.prefix' ... **/
      $(`state[id=${this.prefix}.*]`).each((stateId) => {
        const itemKey = '' + stateId.split('.').pop();
        if (!this.globalConfig.hasOwnProperty(itemKey)) {
          logs(`Found obsolete configOptions key = ${jsonStringify(itemKey)}`);
          deleteState(stateId, (error, result) => {
            if (error) {
              warns(`Error during deletion of state '${stateId}' : ${jsonStringify(error)}`);
            } else {
              logs(`configOptions key state '${stateId}' is deleted with result : ${jsonStringify(result)}`);
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
      if (obj?.id) {
        const cfgItemPath = obj.id.replace(`${this.prefix}.`, '').split('.');
        if (cfgItemPath.length === 2) {
          const [cfgItemPrefix, cfgItem] = cfgItemPath;
          if (
            this.existsOption(cfgItem) &&
            (cfgItemPrefix === configOptionScopeGlobal ||
              // @ts-ignore
              !isNaN(cfgItemPrefix))
          ) {
            const actualValue = this.parseOption(cfgItem, obj.state.val);
            if (isDefined(actualValue)) {
              this.setOption(
                cfgItem,
                cfgItemPrefix === configOptionScopeGlobal ? null : {userId: Number(cfgItemPrefix)},
                actualValue,
              );
            }
            if (this.externalSubscriptions.has(cfgItem)) {
              const functionToProcess = this.externalSubscriptions.get(cfgItem);
              if (typeOf(functionToProcess)) {
                functionToProcess(cfgItem);
                logs(
                  `External function ${functionToProcess} is executed on ` +
                    `configOptions[${cfgItem}, ${cfgItemPrefix}] = ${jsonStringify(actualValue)}`,
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
    if (isDefined(currentValue)) {
      const id = this.#getStateId(cfgItem, user);
      if (stateType === 'object') {
        currentValue = jsonStringify(currentValue);
        // @ts-ignore
        stateType = 'json';
      }
      if (existsState(id) && getObject(id).common.type === stateType) {
        setState(id, currentValue, true);
      } else {
        if (existsState(id))
          deleteState(id, (error, _result) => {
            if (error) {
              warns(`Error during deletion of state '${cfgItem}' : ${jsonStringify(error)}`);
            } else {
              createState(id, currentValue, {name: cfgItem, type: stateType, read: true, write: true});
            }
          });
        createState(id, currentValue, {name: cfgItem, type: stateType, read: true, write: true});
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
        if (backupData.globalConfig.hasOwnProperty(cfgItem) && isDefined(backupData.globalConfig[cfgItem])) {
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
            if (!(userConfigBackup?.hasOwnProperty(cfgItem) && isDefined(userConfigBackup[cfgItem]))) {
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
              !this.configOptions[cfgItem].systemLevel &&
              userConfigData.hasOwnProperty(cfgItem) &&
              isDefined(userConfigData[cfgItem])
            ) {
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
    const {item: cfgItem, scope: optionScope} = menuItemToProcess.options,
      currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
      currentAccessLevel = menuItemToProcess.accessLevel,
      isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
      isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
      isSystemLevelOption = this.configOptions[cfgItem].systemLevel,
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
    return subMenu;
  }

  /**
   * This method generates a configuration options submenu for global and user-level parameters
   * based on the user's access level.
   * @param {object} user - The user object.
   * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
   * @returns {object[]} An array of objects (menu items).
   */
  menuGenerate(user, menuItemToProcess) {
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon,
      currentAccessLevel = menuItemToProcess.accessLevel,
      isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
      isCurrentAccessLevelFull = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) <= 0,
      optionTypes = ['systemLevelOptions', 'userLevelOptions'],
      maxStringLength = this.getOptionWithModifier(cfgSummaryTextLengthMax, user),
      iconOn = this.getOption(cfgDefaultIconOn, user),
      iconOff = this.getOption(cfgDefaultIconOff, user),
      formatItemName = (itemName, itemValue, itemType) => {
        let itemValueText = '',
          itemNameLength = getStringLength(itemName),
          itemValueLength = 0,
          otherElementsLength = getStringLength(currentIcon);
        if (itemType === 'string') {
          itemValueText = itemValue;
          otherElementsLength += 3;
        } else if (itemType === 'number') {
          itemValueText = `${itemValue}`;
          otherElementsLength += 2;
        } else if (itemType === 'boolean') {
          itemValueText = itemValue ? iconOn : iconOff;
          otherElementsLength += 1;
        }
        itemValueLength = getStringLength(itemValueText);
        if (itemNameLength + itemValueLength + otherElementsLength > maxStringLength) {
          if (itemValueLength > 0) {
            const maxValueLength = Math.trunc(maxStringLength / 2) - otherElementsLength;
            if (itemValueLength > maxValueLength) {
              itemValueText = '...' + itemValueText.slice(-maxValueLength + 2);
              itemValueLength = maxValueLength;
            }
          }
          if (itemNameLength + itemValueLength + otherElementsLength > maxStringLength) {
            itemName = itemName.substring(0, maxStringLength - itemValueLength - otherElementsLength - 2) + '...';
          }
        }
        if (itemValueLength > 0) {
          if (itemType === 'string') {
            itemValueText = `['${itemValueText}']`;
          } else if (itemType === 'number') {
            itemValueText = `[${itemValueText}]`;
          }
          return `${itemName} ${itemValueText}`;
        } else {
          return itemName;
        }
      };
    let subMenu = [],
      subMenuIndex = 0;
    optionTypes.forEach((optionType) => {
      const isSystemLevelOption = optionType === 'systemLevelOptions',
        isThisLevelAllowModify = isSystemLevelOption ? isCurrentAccessLevelFull : isCurrentAccessLevelAllowModify,
        optionFilter = isSystemLevelOption
          ? (optionId) => this.configOptions[optionId].systemLevel
          : (optionId) => !this.configOptions[optionId].systemLevel,
        optionTypeItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemMenuGet(user, optionType)}`,
          icon: currentIcon,
          submenu: new Array(),
          // text: ` [${this.cfg[cfgItem]}] `,
        };
      Object.keys(this.globalConfig)
        .filter((optionId) => !this.configOptions[optionId].hidden)
        .filter((optionId) => optionFilter(optionId))
        .forEach((cfgItem, itemOrder) => {
          let itemType = this.configOptions[cfgItem].type;
          const currentItemName = translationsItemCoreGet(user, cfgItem),
            currentItem = {
              index: `${currentIndex}.${subMenuIndex}.${itemOrder}`,
              name: `${currentItemName}`,
              icon: currentIcon,
              text: `${currentItemName}`,
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
          let optionScopes = [configOptionScopeUser];
          if (isSystemLevelOption) {
            optionScopes = [configOptionScopeGlobal];
          } else if (isCurrentAccessLevelFull) {
            optionScopes = [configOptionScopeGlobal, configOptionScopeUser];
          }
          optionScopes.forEach((optionScope) => {
            const currentOptionValue =
                optionScope === configOptionScopeGlobal ? this.globalConfig[cfgItem] : this.getOption(cfgItem, user),
              currentSubMenuItemName = translationsItemMenuGet(
                user,
                'SetValue',
                optionScope === configOptionScopeGlobal ? configOptionScopeGlobal : '',
              ),
              subSubMenuIndexPrefix = `${currentIndex}.${subMenuIndex}.${itemOrder}`,
              subMenuItem = {
                index: `${subSubMenuIndexPrefix}.${subSubMenuIndex}`,
                name: formatItemName(currentSubMenuItemName, currentOptionValue, itemType),
                icon: iconItemEdit,
                accessLevel: currentAccessLevel,
              };
            if (isSystemLevelOption || optionScope === configOptionScopeUser)
              currentItem.name = formatItemName(currentItem.name, currentOptionValue, itemType);
            switch (cfgItem) {
              case cfgMenuLanguage:
                subMenuItem.options = {scope: optionScope, value: currentOptionValue};
                subMenuItem.submenu = (user, menuItemToProcess) => {
                  let subMenu = new Array(),
                    subMenuIndex = 0;
                  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
                    {scope: optionScope, value: currentLanguage} = menuItemToProcess.options;
                  Object.keys(translationsList)
                    .sort() // NOSONAR
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
                        const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
                          {item: cfgItem, scope: optionScope} = menuItemToProcess.options;
                        if (cachedValueExists(user, cachedConfigNewLanguageId)) {
                          const newLanguageId = translationsValidateLanguageId(
                            cachedValueGet(user, cachedConfigNewLanguageId),
                          );
                          if (newLanguageId?.length) {
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
                            subMenu.push(
                              menuMenuItemGenerateEditItem(
                                user,
                                currentIndex,
                                subMenuIndex,
                                `${translationsItemCoreGet(user, 'cmdFixId')} = '${cachedValueGet(
                                  user,
                                  cachedConfigNewLanguageId,
                                )}'`,
                                '',
                                {dataType: dataTypeConfig, item: cfgItem, scope: optionScope},
                              ),
                            );
                          }
                        } else {
                          subMenu.push(
                            menuMenuItemGenerateEditItem(
                              user,
                              currentIndex,
                              subMenuIndex,
                              translationsItemCoreGet(user, 'cmdSetId'),
                              '',
                              {dataType: dataTypeConfig, item: cfgItem, scope: optionScope},
                            ),
                          );
                        }
                        return subMenu;
                      },
                    });
                  }
                  return subMenu;
                };
                break;

              case cfgGraphsIntervals:
                subMenuItem.options = {item: cfgItem, scope: optionScope, [menuOptionHorizontalNavigation]: true};
                subMenuItem.submenu = (user, menuItemToProcess) => {
                  let subMenu = new Array(),
                    subMenuIndex = 0;
                  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
                };
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

                  case 'number':
                  case 'string': {
                    subMenuItem.command = cmdGetInput;
                    break;
                  }

                  case 'boolean': {
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
              if (isDefined(configOptionsParameters[cfgItem])) {
                const itemSubType = configOptionsParameters[cfgItem];
                let interimItem;
                switch (itemSubType.type) {
                  case 'time': {
                    interimItem = menuMenuItemGenerateEditTime(
                      user,
                      subSubMenuIndexPrefix,
                      subSubMenuIndex,
                      subMenuItem.name,
                      '',
                      {
                        ...subMenuItem.options,
                        timeMode: itemSubType.mode,
                        timeTemplate: itemSubType.template,
                        value: currentOptionValue,
                        valueToDisplay: `${currentOptionValue}`,
                      },
                    );
                    break;
                  }
                  case 'number': {
                    const interimItemOptions = {
                      ...subMenuItem.options,
                      value: currentOptionValue,
                      valueToDisplay: `${currentOptionValue}`,
                      valueType: itemSubType.type,
                      valueOptions: {
                        ...subMenuItem.options.valueOptions,
                      },
                    };
                    if (itemSubType.hasOwnProperty('min')) interimItemOptions.valueOptions.min = itemSubType.min;
                    if (itemSubType.hasOwnProperty('max')) interimItemOptions.valueOptions.max = itemSubType.max;
                    if (itemSubType.hasOwnProperty('step')) interimItemOptions.valueOptions.step = itemSubType.step;
                    if (itemSubType.hasOwnProperty('unit')) interimItemOptions.valueOptions.unit = itemSubType.unit;
                    interimItem = menuMenuItemGenerateEditItemBasedOnValueType(
                      user,
                      subSubMenuIndexPrefix,
                      subSubMenuIndex,
                      subMenuItem.name,
                      '',
                      interimItemOptions,
                    );
                    break;
                  }
                  default: {
                    break;
                  }
                }
                if (typeOf(interimItem, 'object')) {
                  subMenuItem.options = interimItem.options;
                  subMenuItem.submenu = interimItem.submenu;
                  subMenuItem.command = interimItem.command;
                  subMenuItem.text = interimItem.text;
                }
              }
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
      clearSchedule(this.menuSchedule);
      this.menuSchedule = undefined;
    }
    if (this.globalConfig.cfgMenuRefreshInterval > 0) {
      const scheduleString =
        '0' +
        (this.globalConfig.cfgMenuRefreshInterval < 60 ? '/' + this.globalConfig.cfgMenuRefreshInterval : '') +
        ' *' +
        (this.globalConfig.cfgMenuRefreshInterval >= 60
          ? '/' + Math.trunc(this.globalConfig.cfgMenuRefreshInterval / 60)
          : '') +
        ' * * * *';
      this.menuSchedule = schedule(scheduleString, () => {
        this.functionScheduleMenuUpdate();
      });
    }
  }
}

/**
 * Global variable to store the all configuration options/items (ConfigOption class).
 */
const configOptions = new ConfigOptions(
  prefixConfigStates,
  configOptionsParameters,
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
    if (isDefined(itemId)) {
      // @ts-ignore
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
    return this.data.hasOwnProperty(itemId) && isDefined(this.data[itemId]) ? `${itemId}` : '';
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
          if (!this.data[itemId].find((rule) => jsonStringify(rule) === jsonStringify(newRule))) {
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
      .sort() // NOSONAR
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
   * This method parse a text definitions of rules for the rule with Id = `itemId` and
   * compile it to the appropriate set of RegExp objects.
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
            [ruleMaskSuffixHolderId, ruleMaskSuffixSubordinatedId] = ruleMaskSuffix.split('.');
          let regexpPrefix, regexpSuffix, regexpDirectHalf, regexpInvertedHalf;
          if (isPrefixAny) {
            regexpPrefix = `${regexpAny}+?`;
          } else if (ruleMaskPrefixSubordinatedId) {
            regexpPrefix = `${ruleMaskPrefixHolderId}\\.${ruleMaskPrefixSubordinatedId}`;
          } else {
            regexpPrefix = `${ruleMaskPrefixHolderId}${regexpAny}*?`;
          }
          if (isSuffixAny) {
            regexpSuffix = `${regexpAny}+?`;
          } else if (ruleMaskSuffixSubordinatedId) {
            regexpSuffix = `${ruleMaskSuffixHolderId}\\.${ruleMaskSuffixSubordinatedId}`;
          } else {
            regexpSuffix = `${ruleMaskSuffixHolderId}${regexpAny}*?`;
          }
          currentRule.maskInverted = `${ruleMaskSuffix}${rolesIdAndMaskDelimiter}${ruleMaskPrefix}`;
          currentRule.regexpDirect = new RegExp(`^${regexpPrefix}\\${rolesIdAndMaskDelimiter}${regexpSuffix}$`);
          if (isPrefixAny) {
            regexpDirectHalf = `${regexpAny}+?`;
          } else if (
            isSuffixAny ||
            MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0
          ) {
            regexpDirectHalf = `^${regexpPrefix}$`;
          } else {
            regexpDirectHalf = '^$';
          }
          currentRule.regexpDirectHalf = new RegExp(regexpDirectHalf);
          currentRule.regexpInverted = new RegExp(`^${regexpSuffix}\\${rolesIdAndMaskDelimiter}${regexpPrefix}$`);
          if (isSuffixAny) {
            regexpInvertedHalf = `${regexpAny}+?`;
          } else if (
            isPrefixAny ||
            MenuRoles.compareAccessLevels(currentRule.accessLevel, rolesAccessLevelForbidden) !== 0
          ) {
            regexpInvertedHalf = `^${regexpSuffix}$`;
          } else {
            regexpInvertedHalf = '^$';
          }
          currentRule.regexpInvertedHalf = new RegExp(regexpInvertedHalf);
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
        const [maskPrefix, maskSuffix] = (inverseMasks ? rule.maskInverted : rule.mask).split(rolesIdAndMaskDelimiter);
        let effectiveRegexp;
        if (menuIdSuffix) {
          if (inverseMasks) {
            effectiveRegexp = rule.regexpInverted;
          } else {
            effectiveRegexp = rule.regexpDirect;
          }
        } else if (inverseMasks) {
          effectiveRegexp = rule.regexpInvertedHalf;
        } else {
          effectiveRegexp = rule.regexpDirectHalf;
        }
        return (
          effectiveRegexp.test(menuItemId) &&
          !(
            menuItemIdParts.length === 1 &&
            maskPrefix === rolesMaskAnyValue &&
            maskSuffix !== rolesMaskAnyValue &&
            MenuRoles.accessLevelsPreventToShow.includes(rule.accessLevel)
          )
        );
      });
    if (regexpMatch?.length) {
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
    if (!returnRule) {
      if (isDefined(result)) {
        result = result.accessLevel;
      } else {
        result = rolesAccessLevelForbidden;
      }
    }
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
      if (menuItem?.hasOwnProperty('name')) {
        maskPrefix = menuItem.name;
        if (maskPrefixSubordinatedId) {
          const menuItemSubordinated = menuItem.subordinates.find((item) => item.id === maskPrefixSubordinatedId);
          if (menuItemSubordinated?.hasOwnProperty('name')) {
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
        }${maskSuffixSubordinatedId ? '.' + maskSuffix : ''}`;
      } else {
        for (const menuItem of rootMenu.submenu) {
          if (Array.isArray(menuItem.submenu)) {
            const subMenuItem = menuItem.submenu.find((item) => item.id === maskSuffix);
            if (subMenuItem?.hasOwnProperty('name')) {
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
   * This method generates a submenu to show and process the access level an appropriate rule
   * (existing or newly created).
   * @param {object} user - user - The user object.
   * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
   * @returns {object[]} Newly generated submenu.
   */
  #menuRuleSetAccessLevel(user, menuItemToProcess) {
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
      {dataType, roleId, ruleIndex} = menuItemToProcess.options,
      isForNewRule = Number(ruleIndex) == -1,
      currentRole = cachedValueExists(user, cachedRolesRoleUnderEdit)
        ? cachedValueGet(user, cachedRolesRoleUnderEdit)
        : {roleId: 'emptyRole', rules: []};
    let subMenu = [],
      subMenuIndex = 0,
      currentRoleRules,
      currentRule;
    if (currentRole.roleId === roleId) {
      currentRoleRules = currentRole['rules'];
    } else if (this.existsId(roleId)) {
      currentRoleRules = this.getRules(roleId);
    } else {
      currentRoleRules = [];
    }
    if (cachedValueExists(user, cachedRolesNewRule)) {
      currentRule = cachedValueGet(user, cachedRolesNewRule);
    } else {
      currentRule = isForNewRule ? {} : currentRoleRules[ruleIndex];
    }
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
   * This method takes a rule object, and returns a string containing formatted rule's details/properties
   * (mask and accessLevel).
   * @param {object} user The user object.
   * @param {object} rule The rule object.
   * @returns {string} A formatted string.
   */
  static #ruleDetails(user, rule) {
    return rule
      ? `${menuMenuItemDetailsPrintFixedLengthLines(user, [
          {label: translationsItemTextGet(user, 'RuleMask'), value: rule.mask},
          {label: translationsItemTextGet(user, 'RuleAccessLevel'), value: rule.accessLevel},
        ])}`
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
      const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
        name: `${menuItemToProcess.name}${menuItemToProcess.icon ? ' ' + menuItemToProcess.icon : ''}`,
        icon: iconItemButton,
        group: holderItemId || menuButtonsDefaultGroup,
        text: (user, _menuItemToProcess) => MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule)),
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
            name: `${currentItemName}${currentItem.icon ? ' ' + currentItem.icon : ''}`,
            icon: iconItemButton,
            options: {upperItemId: currentItemId, itemId},
            text: (user, _menuItemToProcess) => MenuRoles.#ruleDetails(user, cachedValueGet(user, cachedRolesNewRule)),
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
              text: (user, _menuItemToProcess) =>
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
      return resultItem;
    }

    if (!cachedValueExists(user, cachedRolesNewRule)) {
      cachedValueSet(user, cachedRolesNewRule, {...rolesInitialRule});
    }
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
      text: (user, _menuItemToProcess) => MenuRoles.#ruleDetails(user, savedRule),
      submenu: (user, menuItemToProcess) => {
        return this.#menuRuleSetAccessLevel(user, menuItemToProcess);
      },
    });
    return subMenu;
  }

  /**
   * This method generates a menu for a `role`, which has a list of `rules`, each rule having a `mask`
   * and an `access level`.
   * @param {object} user - The user object.
   * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
   * @returns {object[]} Newly generated submenu.
   */
  #menuGenerateRoleRules(user, menuItemToProcess) {
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
        text: (user, _menuItemToProcess) => {
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
        jsonStringify(this.getRules(roleId)) !== jsonStringify(currentRoleRules)
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
    const {roleId} = menuItemToProcess.options,
      currentRoles = objectDeepClone(this.data);
    if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
      const newRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
      if (!currentRoles.hasOwnProperty(newRole.roleId)) {
        currentRoles[newRole.roleId] = newRole.rules;
      }
    }
    const currentRoleRules = currentRoles[roleId],
      currentRoleDetailsList = [
        {
          label: translationsItemTextGet(user, 'RoleId'),
          value: roleId,
        },
        {
          label: translationsItemTextGet(user, 'RoleRulesCount'),
          value: `${currentRoleRules.length}`,
        },
        {
          label: translationsItemTextGet(user, 'RoleAssignedUsers'),
          value: `${this.getUsers(roleId).length}`,
        },
      ];
    return currentRoleDetailsList.length
      ? `${menuMenuItemDetailsPrintFixedLengthLines(user, currentRoleDetailsList)}`
      : '';
  }

  /**
   * This method generates a menu of roles, with possibility to edit or to add a new role.
   * @param {object} user - The user object.
   * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
   * @returns {object[]} Newly generated submenu.
   */
  menuGenerate(user, menuItemToProcess) {
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon,
      currentAccessLevel = menuItemToProcess.accessLevel;
    let subMenu = [],
      subMenuIndex = 0;
    cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesRoleUnderEdit);
    cachedAddToDelCachedOnBack(user, currentIndex, cachedRolesNewRule);
    const currentRoles = objectDeepClone(this.getRoles());
    if (cachedValueExists(user, cachedRolesRoleUnderEdit)) {
      const newRole = cachedValueGet(user, cachedRolesRoleUnderEdit);
      if (!currentRoles.hasOwnProperty(newRole.roleId)) {
        currentRoles[newRole.roleId] = newRole.rules;
      }
    }
    Object.keys(currentRoles).forEach((roleId) => {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `[${roleId}]`,
        icon: currentIcon,
        options: {roleId},
        text: (user, menuItemToProcess) => {
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
        text: (user, _menuItemToProcess) => {
          if (cachedValueExists(user, cachedRolesNewRoleId)) {
            const newRoleId = cachedValueGet(user, cachedRolesNewRoleId);
            if (newRoleId.length <= 12) {
              cachedValueSet(user, cachedRolesRoleUnderEdit, {roleId: newRoleId, rules: []});
              cachedValueDelete(user, cachedRolesNewRoleId);
            }
          }
        },
        submenu: (user, menuItemToProcess) => {
          const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '';
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
        const users = jsonParse(telegramUsersListState.val);
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
   * If the user with itemId exists and is enabled, return the string contained an itemId,
   * otherwise return an empty string.
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
   * This method return a full user name, as concatenation of First and Last names, or Nick(userName).
   * @param {number|string} itemId - The Id of the user to process.
   * @returns {string} The user Name string.
   */
  getUserName(itemId) {
    const user = this.getUser(itemId);
    let userName = '';
    if (user) {
      if (user.firstName || user.lastName) {
        userName = `${user.firstName ? user.firstName : ''}${user.lastName ? ' ' + user.lastName : ''}`;
      } else {
        userName = user.userName;
      }
    }
    return userName;
  }

  /**
   * This method returns an array of userIds for all users that associated with a
   * roleId that matches the roleId passed in as
   * an argument.
   *
   * If no roleId is passed in, it returns an array of userIds for all existing users.
   * @param {number|string=} roleId - The role id to filter by. If not provided, all users are returned.
   * @param {boolean=} enabledOnly - The selector to filter users.
   * @returns {object[]} An array of userIds
   */
  getUsers(roleId, enabledOnly = false) {
    const users = roleId
      ? Object.values(this.data).filter((user) => user.roles.includes(roleId))
      : Object.values(this.data);
    return users.filter((user) => !enabledOnly || (enabledOnly && user.isEnabled)).map((user) => user.userId);
  }

  /**
   * This method returns a list(`Object`) of rules objects the user with Id = `itemId`
   * which merged from an associated roles rules lists(Arrays).
   * @param {number|string} itemId - The Id of the user to process.
   * @param {boolean=} compiled - The boolean selector to define a return format of the roles rules.
   * @returns {object[]} An array of rules.
   */
  getRules(itemId, compiled = false) {
    let rules = [];
    itemId = this.existsId(itemId);
    if (itemId) {
      rules = Object.values(this.getRoles(itemId, compiled));
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
   *  This method parse a text definitions of rules of an associated roles with user with Id = `itemId`
   * and compile it to the appropriate sets of RegExp objects.
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
    const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
      currentIcon = menuItemToProcess.icon;
    let subMenu = [],
      subMenuIndex = 0;
    this.load();
    Object.keys(this.data).forEach((userId) => {
      const currentUser = this.data[userId],
        currentFullName = `${currentUser.firstName ? currentUser.firstName : ''}${
          currentUser.lastName ? ` ${currentUser.lastName}` : ''
        }`;
      let currentUserDetailsList = [];
      this.itemDetailsList.forEach((item) => {
        if (currentUser.hasOwnProperty(item)) {
          const currentUserDetailsLineObject = {
            label: `${translationsItemTextGet(user, 'user', item)}`,
          };
          if (typeof currentUser[item] === 'boolean') {
            currentUserDetailsLineObject.value = currentUser[item]
              ? configOptions.getOption(cfgDefaultIconOn, user)
              : configOptions.getOption(cfgDefaultIconOff, user);
          } else {
            currentUserDetailsLineObject.value = currentUser.hasOwnProperty(item) ? currentUser[item] : currentItem;
          }
          currentUserDetailsList.push(currentUserDetailsLineObject);
        }
      });
      let currentItemIcon;
      if (currentUser.isAvailable && currentUser.isEnabled) {
        currentItemIcon = iconItemUser;
      } else if (!currentUser.isEnabled) {
        currentItemIcon = iconItemDisabled;
      } else {
        currentItemIcon = iconItemNotFound;
      }
      const currentItem = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${currentFullName}${currentUser.userName ? ' [' + currentUser.userName + ']' : ''}`,
        icon: currentItemIcon,
        text: currentUserDetailsList.length
          ? `${menuMenuItemDetailsPrintFixedLengthLines(user, currentUserDetailsList)}`
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
          const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
  translationsLocalesExtractLanguageIdRegExp = /locale_(\w+).json/,
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
    warns(`Error of language id  '${languageId}' check '${error}'`);
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
      translationString = jsonStringify(objectKeysSort(translationsList[languageId]));
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
        logs(`Found obsolete translation language = ${jsonStringify(languageId)}`);
        deleteState(stateId, (error, result) => {
          if (error) {
            warns(`Error during deletion of state '${stateId}' : ${jsonStringify(error)}`);
          } else {
            logs(`Obsolete translation language state '${stateId}' is deleted with result : ${jsonStringify(result)}`);
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
    if (canonicalLang) {
      try {
        translationsList[canonicalLang] = jsonParse(getState(translationId).val);
      } catch (error) {
        warns(`Can't process a translation for language ${languageId}!`);
      }
    } else {
      warns(`Unknown language id '${languageId}', can't process it!`);
    }
  });
}

/**
 * This functions downloads locales from the repo and returns the translations object into the `callback` function.
 * @param {string} languageId - The language Id, like 'en', 'de', 'uk', ..., or 'all', to download all of them.
 * @param {string} extensionId - The extension id, to download specific translations.
 * @param {function(object=, string|object=):void} callback - The callback function
 * in format `callback(translation, error)`.
 */
function translationsLoadLocalesFromRepository(languageId, extensionId, callback) {
  /**
   * This functions process the list of locales links iterative way, and returns the translations object into
   * the `callback` function.
   * @param {object} repo - The axios object, initiated to the repo main link.
   * @param {string[]} languageIds - The array of language Ids, like ['en', 'de', 'uk', ...]
   * @param {object} localesUrls - The object, with languageId's as properties , with values - parsed urls objects
   * to the 'locale_xx.json' files in repo.
   * @param {object} translations - The object, with languageId's as properties , with values - downloaded translations.
   * @param {function(object=, string|object=):void} callback - The callback function
   * in format `callback(translation, error)`.
   */
  function translationsDownloadFromRepo(repo, languageIds, localesUrls, translations, callback) {
    const languageId = languageIds.shift();
    if (
      languageId &&
      localesUrls[languageId]?.['href'] &&
      localesUrls[languageId]?.['hostname'] &&
      localesUrls[languageId]?.['path']
    ) {
      const localeUrl = localesUrls[languageId];
      if (!isDefined(repo)) {
        repo = axios.create({
          baseURL: `${localeUrl.protocol}//${localeUrl.hostname}/`,
          timeout: 10000,
        });
      }
      repo
        .get(localeUrl.path)
        .then((response) => {
          if (response?.data && typeOf(response.data, 'object')) {
            if (!typeOf(translations, 'object')) translations = {};
            translations[languageId] = response.data;
          }
        })
        .catch((error) => {
          warns(`Can't download locale '${languageId}' from the repo! Error is '${error}'.`);
        })
        .then(() => {
          if (languageIds.length) {
            translationsDownloadFromRepo(repo, languageIds, localesUrls, translations, callback);
          } else {
            callback(translations, undefined);
          }
        });
    } else {
      callback(translations, undefined);
    }
  }

  const githubAPI = axios.create({
    baseURL: scriptGitHubAPISite,
    timeout: 10000,
  });
  if (languageId && languageId !== doAll) {
    languageId = translationsValidateLanguageId(languageId);
  } else {
    languageId = doAll;
  }
  if (languageId) {
    const remoteFolder =
      `/repos${scriptRepositoryPath}contents/` +
      (extensionId && extensionId !== translationsCoreId
        ? `${translationsExtensionsPrefix}/${extensionId.replace(prefixExtensionId, '').toLowerCase()}/`
        : '') +
      `${scriptCoreLocalesRemoteFolder}?ref=${scriptBranch}`;
    githubAPI
      .get(remoteFolder, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      })
      .then((response) => {
        if (response?.data && typeOf(response.data, 'array')) {
          const localesFolder = response.data,
            localesLinks = {};
          localesFolder.forEach((localesItem) => {
            if (localesItem?.name && localesItem?.download_url) {
              const parsedLocaleLanguageId = translationsLocalesExtractLanguageIdRegExp.exec(localesItem.name);
              if (parsedLocaleLanguageId?.length === 2 && parsedLocaleLanguageId[1]) {
                const localeLanguageId = parsedLocaleLanguageId[1];
                if (languageId === doAll || languageId === localeLanguageId) {
                  localesLinks[localeLanguageId] = url.parse(localesItem.download_url);
                }
              }
            }
          });
          if (Object.keys(localesLinks).length === 0) {
            callback(undefined, `Language with id = ${languageId} is not presented in repo!`);
          } else {
            translationsDownloadFromRepo(null, Object.keys(localesLinks), localesLinks, undefined, callback);
          }
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
        warns(`Can't make an initial load of locales from repo! Error is '${jsonStringify(error)}'.`);
        reject(error);
      } else {
        Object.keys(locales).forEach((languageId) => {
          if (
            typeOf(locales[languageId], 'object') &&
            translationsCheckAndCacheUploadedFile(cachedCommonId, '', '', '', locales[languageId])
          ) {
            const newTranslation = locales[languageId];
            if (
              newTranslation?.hasOwnProperty(idTranslation) &&
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
      versionToCompare?.includes('.') ? versionToCompare : '0.0'
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
      _translationInputLanguage = translationInputFull.hasOwnProperty('language') // NOSONAR
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
          if (translationPart.startsWith(prefixExtensionId)) {
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
  let languageId = configOptions.getOption(cfgMenuLanguage, user),
    currentTranslation;
  if (!translationsList[languageId]) {
    warns(`Language ${languageId}, configured for current user is not exists!`);
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
 * @param {string|string[]=} translationId - The translation Id.
 * @param {boolean=} pointOnItemItself - The inheritance level selector.
 * @returns The translation object contains the translation Id.
 */
function translationsPointOnItemOwner(user, translationId = [], pointOnItemItself = false) {
  const whileCondition = pointOnItemItself ? 0 : 1;
  let idsList = [],
    currentTranslation = translationsGetCurrentForUser(user);
  // @ts-ignore
  idsList = typeOf(translationId, 'string') ? translationId.split('.') : translationId;
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
  const currentTranslation = translationsPointOnItemOwner(user, translationId),
    translationIdArray = translationId ? translationId.split('.') : [],
    shortId = translationIdArray.pop();
  if (translationId && shortId && currentTranslation) {
    if (!currentTranslation.hasOwnProperty(shortId)) {
      warns(
        `translationId '${translationId}' is not found. getFromTranslation is called from ${
          arguments?.callee?.caller?.name ? arguments.callee.caller.name : '' // NOSONAR
        }`,
      );
      currentTranslation[shortId] = translationId;
      translationsSave(user);
    } else if (
      !translationId.startsWith(translationsCommonFunctionsAttributesPrefix) &&
      currentTranslation[shortId].startsWith(translationsCommonFunctionsAttributesPrefix)
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
  let result = '';
  const translationId = translationsGetObjectId(object, functionId, destinationId, isCommon);
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
    if (object?.common?.hasOwnProperty('name')) {
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
 * @param {string=} enumNameDeclinationKey - The "declination" key for the Name
 * (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
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
      if (
        currentEnum.isExternal &&
        currentEnum.nameTranslationId &&
        currentEnum.translationsKeys?.includes(currentEnum.nameTranslationId)
      ) {
        result = `${enumPrefix}.${translationsSubPrefix}.${currentEnum.nameTranslationId}`;
      } else {
        if (!typeOf(enumNameDeclinationKey, 'string')) enumNameDeclinationKey = enumerationsNamesMain;
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
 * @param {string=} enumNameDeclinationKey - The "declination" key for the Name
 * (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
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
  let translations = {currentLanguage: configOptions.getOption(cfgMenuLanguage, user)};
  if (extensionId) {
    let extensionFunctionId = extensionId;
    if (extensionFunctionId.startsWith(prefixExtensionId)) {
      extensionFunctionId = extensionFunctionId.replace(prefixExtensionId, ''); // NOSONAR
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
 * @param {object=} translationObject  - Translation object, equal to the file content.
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
      const noTranslationObject = !typeOf(translationObject, 'object');
      if (noTranslationObject) nodeFS.accessSync(translationFileFullPath, nodeFS.constants.R_OK);
      const fileStats = noTranslationObject ? nodeFS.statSync(translationFileFullPath) : {};
      if (
        translationObject ||
        (translationFileSize && Number(translationFileSize) === 0) ||
        (translationFileSize && Number(translationFileSize) && fileStats.size === Number(translationFileSize))
      ) {
        let inputTranslation = noTranslationObject ? nodeFS.readFileSync(translationFileFullPath) : translationObject;
        try {
          inputTranslation = typeOf(inputTranslation, 'string') ? jsonParse(inputTranslation) : inputTranslation;
          const currentLanguage = translationsValidateLanguageId(inputTranslation.language);
          translationFileName = translationFileName || `locale_${currentLanguage}.json`;
          if (
            inputTranslation.type === translationsType &&
            inputTranslation.version === translationsVersion &&
            currentLanguage &&
            inputTranslation.translation
          ) {
            cachedValueSet(user, cachedTranslationsToUpload, inputTranslation);
            translationFileIsOk = true;
            warns(
              `Translation '${translationFileName}' for language '${inputTranslation.language}' is uploaded!` +
                'And can be processed!',
            );
          } else {
            warns(`Translation '${translationFileName}' is uploaded, but has wrong format and can't be processed!`);
          }
        } catch (err) {
          warns(`JSON parse error: ${jsonStringify(err)} for translation '${translationFileName}'!`);
        }
      } else {
        warns(`Translation '${translationFileName}' is uploaded, but has wrong size and can't be processed!`);
      }
      nodeFS.rm(translationFileFullPath, {force: true}, (err) => {
        if (err) warns(`Can't delete translation file '${translationFileFullPath}'! Error: '${jsonStringify(err)}'.`);
      });
    } catch (err) {
      warns(`Can't read translation file '${translationFileFullPath}'!`);
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0;
  let subMenuIndex = 0,
    subMenu = [];
  if (isCurrentAccessLevelAllowModify && cachedValueExists(user, cachedTranslationsToUpload)) {
    const inputTranslation = cachedValueGet(user, cachedTranslationsToUpload),
      {translationPart: currentPart} = menuItemToProcess.options,
      currentLanguage = inputTranslation ? translationsValidateLanguageId(inputTranslation.language) : '',
      currentUploadMode = menuItemToProcess.id,
      _currentVersion = inputTranslation ? inputTranslation.version : ''; // NOSONAR
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
              text: translationsUploadMenuItemDetails,
              submenu: new Array(),
            };
          translationsUpdateModes.forEach((translationUpdateMode, translationUpdateModeIndex) => {
            subMenuItem.submenu.push({
              index: `${currentIndex}.${subMenuIndex}.${translationUpdateModeIndex}`,
              name: translationsItemMenuGet(user, idTranslation, translationUpdateMode),
              icon: iconItemApply,
              group: cmdItemsProcess,
              text: translationsUploadMenuItemDetails,
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
      _currentVersion = inputTranslation.version; // NOSONAR
    currentItemDetailsList.push({
      label: translationsItemCoreGet(user, 'cfgMenuLanguage'),
      value: configOptions.getOption(cfgMenuLanguage, user),
    });
    currentItemDetailsList.push({label: translationsItemTextGet(user, 'languageInFile'), value: currentLanguage});
    if (currentPart)
      currentItemDetailsList.push({
        label: translationsItemTextGet(user, 'translationPart'),
        value: currentPart.indexOf(prefixExtensionId) === 0 ? currentPart : translationsGetPartName(user, currentPart),
      });
  }
  return currentItemDetailsList.length
    ? `${menuMenuItemDetailsPrintFixedLengthLines(user, currentItemDetailsList)}`
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    translationType = menuItemToProcess.id,
    currentTranslation = translationsPointOnItemOwner(user, translationsCoreId, true);
  let subMenuIndex = 0,
    subMenu = [];
  Object.keys(currentTranslation)
    .filter((key) => key.startsWith(translationType))
    .sort() // NOSONAR
    .forEach((translationKey) => {
      if (!translationKey.includes('.') && translationKey.startsWith(translationType)) {
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
            translationId: translationsItemGenerateCoreId(translationKey),
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
 * This function generates a submenu to manage the functions related Translation items
 * (i.e. buttons, attributes and common attributes).
 * The selector is an `Id` property of `menuItemToProcess` object.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function translationsMenuGenerateFunctionStatesItems(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {
      function: currentFunctionId,
      functionEnum: currentFunctionEnum,
      dataType: currentDataType,
      translationPrefix,
    } = menuItemToProcess.options,
    translationType =
      translationPrefix || `${idFunctions}.${currentFunctionEnum}.${currentFunctionId.replace('.', '_')}`,
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
        !currentFunctionId || currentDeviceListKeys.find((attrId) => translationKey.startsWith(attrId)),
    )
    .forEach((translationKey, translationKeyIndex) => {
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    {function: currentFunction, functionEnum: currentFunctionEnum} = menuItemToProcess.options,
    translationType = `${idFunctions}.${currentFunctionEnum}.${currentFunction.replace('.', '_')}`,
    currentTranslation = translationsPointOnItemOwner(user, `${translationType}.destinations`, true),
    destinationItems = enumerationsList[dataTypeDestination].list;
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelAllowModify = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0,
    extensionId = menuItemToProcess.id,
    translationType = `${idFunctions}.${idExternal}.${extensionId}.${translationsSubPrefix}`,
    currentTranslationKeys = enumerationsList[dataTypeFunction].list.hasOwnProperty(extensionId)
      ? enumerationsList[dataTypeFunction].list[extensionId].translationsKeys
      : [];
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
        subMenuItem.options = {dataType: dataTypeTranslation, translationId: `${translationType}.${translationKey}`};
        subMenuItem.submenu = (user, menuItemToProcess) => {
          const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '';
          let subMenu = new Array(),
            subMenuIndex = 0;
          subMenuIndex = subMenu.push(
            menuMenuItemGenerateRenameItem(user, `${currentIndex}`, subMenuIndex, menuItemToProcess.options),
          );
          subMenu.push(
            menuMenuItemGenerateDeleteItem(user, `${currentIndex}`, subMenuIndex, menuItemToProcess.options),
          );
          return subMenu;
        };
      } else {
        subMenuItem.submenu = [];
        subMenuItem.command = cmdNoOperation;
      }
      subMenu.push(subMenuItem);
    });
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
          text: translationsUploadMenuItemDetails,
          submenu: translationsMenuGenerateUploadTranslation,
        },
        {
          name: translationsItemMenuGet(user, 'TranslationUploadFromRepo'),
          icon: iconItemUpload,
          group: 'menuTranslationFile',
          id: doUploadFromRepo,
          command: cmdItemUpload,
          options: {dataType: dataTypeTranslation, uploadMode: doUploadFromRepo, translationPart: translationPartId},
          text: translationsUploadMenuItemDetails,
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
  return user?.chatId ? `${prefixCacheStates}.${user.chatId}.${valueId}` : '';
}

/**
 * This function checks if the appropriate cached value exists in the Map object or as an ioBroker state.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @returns {boolean} - True if the an appropriate cached value is exists.
 */
function cachedValueExists(user, valueId) {
  const id = cachedGetValueId(user, valueId);
  if (id) {
    if (valueId.startsWith(prefixExternalStates)) valueId = prefixExternalStates;
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
  const id = cachedGetValueId(user, valueId);
  let result, stateLastChange;
  if (id) {
    if (valueId.startsWith(prefixExternalStates)) valueId = prefixExternalStates;
    if ((!cachedValuesMap.has(id) || getLastChange) && cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
      if (existsState(id)) {
        const currentState = getState(id);
        if (typeOf(currentState, 'object')) {
          let cachedVal = currentState.val;
          stateLastChange = currentState.lc;
          if (cachedValuesStatesCommonAttributes[valueId].type === 'json' && cachedVal.length > 0) {
            try {
              cachedVal = jsonParse(cachedVal);
            } catch (err) {
              warns(`Parse error - ${jsonStringify(err)}`);
            }
          }
          cachedValuesMap.set(id, cachedVal);
        }
      }
    }
    if (cachedValuesMap.has(id)) {
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
    !isDefined(cachedValue) || !isDefined(cachedValueLC) || cachedValueLC <= checkDate.valueOf();
  return [cachedValue, isStateOldOrNotExists];
}

/**
 * This function sets a value for the appropriate cached value Id.
 * @param {object} user - The user object.
 * @param {string} valueId - The Id of cached value.
 * @param {any} value - The value to set.
 */
function cachedValueSet(user, valueId, value) {
  const id = cachedGetValueId(user, valueId);
  if (id) {
    const currentValue = cachedValuesMap.has(id) ? cachedValuesMap.get(id) : undefined;
    if (!isDefined(currentValue) || jsonStringify(currentValue) !== jsonStringify(value)) {
      cachedValuesMap.set(id, value);
      const common = {};
      if (valueId.startsWith(prefixExternalStates)) {
        common.name = `${cachedValuesStatesCommonAttributes[prefixExternalStates].name} ${valueId}`;
        valueId = prefixExternalStates;
      }
      if (cachedValuesStatesCommonAttributes.hasOwnProperty(valueId)) {
        if (!typeOf(value, 'string')) {
          if (cachedValuesStatesCommonAttributes[valueId].type === 'string') {
            value = `${value}`;
          } else if (cachedValuesStatesCommonAttributes[valueId].type === 'json') {
            value = jsonStringify(value);
          }
        }
        if (existsState(id)) {
          setState(id, value, true);
        } else {
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
  const value = cachedValueGet(user, `${prefixExternalStates}${valueId}`);
  if (!isDefined(value)) {
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
    const resultObject = telegramSendToAdapterResponse(result, telegramObject);
    logs(`SendToTelegram: result (${typeOf(result)}) = ${jsonStringify(result, 1)}`, _l);
    logs(`resultObject: ${jsonStringify(resultObject, 1)}`, _l);
    if (!resultObject.success) {
      warns(
        `Can't send message (${jsonStringify(telegramObject)}) to (${jsonStringify(user)})!\nResult = ${jsonStringify(
          result,
        )}.`,
      );
    }
    if (sentImages.length) {
      telegramObject = telegramMessageClearCurrent(user, false, true, sentImages.shift());
      if (telegramObject)
        sendTo(telegramAdapter, telegramObject, (result) => {
          sentImagesDeleteCallBack(result, user, telegramObject, sentImages);
        });
    }
  }

  let sentImages = sentImagesGet(user);
  if (sentImages.length) {
    const telegramObject = telegramMessageClearCurrent(user, false, true, sentImages.shift());
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
      deviceAttributes: {
        state: {
          isEnabled: true,
          convertValueCode: '',
          stateAttributes: ['ts', 'lc'],
          nameTranslationId: 'functions.functions.unknown.state',
          order: 0,
        },
      },
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
    const itemsList = enumerationList || enumerationsList[enumerationType].list;
    if (itemsList.hasOwnProperty(a) && itemsList.hasOwnProperty(b)) {
      return itemsList[a].order - itemsList[b].order;
    } else if (itemsList.hasOwnProperty(a)) {
      return 1;
    } else if (itemsList.hasOwnProperty(b)) {
      return -1;
    }
  }
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * This function load a list(`Object`) of `enumerationItems` of appropriate `type`
 * from the related ioBroker state.
 * Result will be stored in the global variable `enumerationItems`.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 */
function enumerationsLoad(enumerationType) {
  enumerationsList[enumerationType].list = {};
  if (existsState(enumerationsList[enumerationType].state)) {
    const parsedObject = jsonParse(getState(enumerationsList[enumerationType].state).val);
    if (parsedObject.hasOwnProperty('list') && typeOf(parsedObject.list, 'object') && parsedObject.list) {
      enumerationsList[enumerationType].list = parsedObject.list;
    }
    if (parsedObject.hasOwnProperty('enums') && typeOf(parsedObject.enums, 'object') && parsedObject.enums) {
      enumerationsList[enumerationType].enums = parsedObject.enums;
    }
  }
}

/**
 * This function store a list(`Object`) of `enumerationItems` of appropriate `type`
 * in the related ioBroker state.
 * @param {string} enumerationType - The string defines the enumerationItem type.
 */
function enumerationsSave(enumerationType) {
  const listToSave = jsonStringify({
    enums: enumerationsList[enumerationType].enums,
    list: enumerationsList[enumerationType].list,
  });
  if (existsState(enumerationsList[enumerationType].state)) {
    setState(enumerationsList[enumerationType].state, listToSave, true);
  } else {
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
  let currentEnumerationList = enumerationsList[enumerationType].list;
  let countItems = enumerationsReorderItems(currentEnumerationList);
  Object.keys(currentEnumerationList).forEach((currentItem) => {
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
      const currentItem = currentEnum.id.replace(`${prefixEnums}.${enumType}.`, '');
      const currentItemSections = currentItem.split('.'),
        currentItemSectionsCount = currentItemSections.length,
        holderItemId = currentItemSectionsCount === 2 ? currentItemSections.shift() : '',
        compositeHolderEnum = currentItemSectionsCount === 2 ? `${enumType}.${holderItemId}` : '',
        isCurrentItemAcceptable =
          currentItemSectionsCount === 1 ||
          (currentItemSectionsCount === 2 && getEnums(compositeHolderEnum).length > 0);
      if (isCurrentItemAcceptable) {
        if (
          currentEnumerationList.hasOwnProperty(currentItem) &&
          typeOf(currentEnumerationList[currentItem], 'object')
        ) {
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
              currentEnumerationIds[currentItemPosition].startsWith(holderItemId)
            );
            if (currentItemPosition < countItems) {
              for (let itemIndex = currentItemPosition; itemIndex < countItems; itemIndex++) {
                currentEnumerationList[currentEnumerationIds[itemIndex]].order++;
              }
            }
          }
          const newItem = {
            ...enumerationsDefaultObjects[enumerationType],
            order: currentItemPosition,
            holder: holderItemId,
            enum: enumType,
            icon: enumerationsList[enumerationType].enums[enumType].icon,
          };
          if (enumerationType === dataTypeFunction && newItem?.deviceAttributes?.state) {
            newItem.deviceAttributes.state.nameTranslationId = translationsGetObjectId('state', currentItem, undefined);
          }
          currentEnumerationList[currentItem] = newItem;
          countItems++;
        }
      }
    }
  });
}

/**
 * This function store a new `name` of appropriate enumerationItem, including it's
 * declinations.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem, i.e. ioBroker enum Id.
 * @param {object} enumerationItem - The current enumerationItem object.
 * @param {string} newName - The new Name value.
 * @param {string=} nameDeclinationKey - The "declination" key for the Name
 * (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
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
      } else if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName) {
        tmpKeys.forEach((nameKey) =>
          translationsItemStore(
            user,
            `${translationIdPrefix}${nameKey}`,
            nameKey === enumerationsNamesMain ? newName : newName.toLowerCase(),
          ),
        );
      }
    } else if (translationsItemGet(user, `${translationIdPrefix}${enumerationsNamesMain}`) != newName) {
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
  if (currentEnum?.hasOwnProperty('name') && isDefined(currentEnum.name)) {
    let newName = enumerationItemId;
    if (typeOf(currentEnum.name, 'string')) {
      newName = currentEnum.name;
    } else if (currentEnum.name[configOptions.getOption(cfgMenuLanguage)]) {
      newName = currentEnum.name[configOptions.getOption(cfgMenuLanguage)];
    } else if (currentEnum.name['en']) {
      newName = currentEnum.name['en'];
    }
    enumerationsUpdateItemName(
      user,
      enumerationType,
      enumerationItemId,
      currentEnumeration[enumerationItemId],
      newName,
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
  let subMenuIndex = 0,
    subMenu = [];
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
  let subMenuIndex = 0,
    subMenu = [];
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
    lastItemIndex = Object.keys(currentEnumerationsList).length - 1;
  let currentIcon = iconItemDisabled;
  if (currentEnumerationItem.isEnabled) {
    currentIcon = currentEnumerationItem.icon || '';
  }
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
          index: `${currentIndex}.${subMenuIndex}`,
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
            typeOf(currentEnumerationItem[enumerationItemAttr], 'string')
              ? currentEnumerationItem[enumerationItemAttr]
              : ''
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
              group: enumerationItemAttr.startsWith('icon') ? 'icon' : menuButtonsDefaultGroup,
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
            let itemCommand = cmdNoOperation;
            if (isCurrentAccessLevelAllowModify) {
              itemCommand = enumerationItemAttributesWithReset.includes(enumerationItemAttr)
                ? cmdEmptyCommand
                : cmdGetInput;
            }
            const subMenuItem = {
              index: `${currentIndex}.${subMenuIndex}`,
              name: `${translationsItemMenuGet(user, enumerationItemAttr)} "${
                currentEnumerationItem[enumerationItemAttr]
              }"`,
              icon: isCurrentAccessLevelAllowModify ? iconItemEdit : '',
              command: itemCommand,
              options: {
                dataType: enumerationType,
                item: currentItem,
                attribute: enumerationItemAttr,
                dataTypeExtraId: enumerationTypeExtraId,
              },
              group: enumerationItemAttr.startsWith('icon') ? 'icon' : menuButtonsDefaultGroup,
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
          currentTranslation = translationsPointOnItemOwner(user, translationType, true);
        let currentIds = [currentItem];
        if (currentItem === currentFunction.state && enumerationType === dataTypeDeviceButtons) {
          currentIds = [currentItem, translationsPrimaryStateId];
        }
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
          if (!isDefined(currentValue) || currentId === currentTranslationId) {
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
          submenu: simpleReportMenuGenerateEditReportItems,
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
  return subMenu;
}

/**
 * This function return a count of enabled enumerations items for appropriate
 * primary enum(like `functions', `rooms`, etc)
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string=} primaryEnumId - The appropriate primary enum Id.
 * @returns {number} The count of items.
 */
function enumerationsGetActiveSubItemsCount(enumerationType, primaryEnumId) {
  const extraMenuList = enumerationsList[enumerationType].list;
  return Object.keys(extraMenuList).filter(
    (itemId) =>
      extraMenuList[itemId].isEnabled &&
      (!typeOf(primaryEnumId, 'string') || extraMenuList[itemId].enum === primaryEnumId),
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
 * @returns {string} The string containing the appropriate enum Id in case of `withEnum`,
 * or 'can be deleted' in case of deletion is possible and empty string  - if not.
 */
function enumerationsIsItemCanBeDeleted(enumerationType, enumerationItemId, withEnum = false) {
  const currentEnumeration = enumerationsList[enumerationType],
    currentEnumerationItemObject = currentEnumeration?.list?.hasOwnProperty(enumerationItemId)
      ? currentEnumeration.list[enumerationItemId]
      : {},
    enumObjectId =
      currentEnumeration &&
      currentEnumerationItemObject.isAvailable &&
      Object.keys(currentEnumeration.enums).includes(currentEnumerationItemObject.enum)
        ? `${prefixEnums}.${currentEnumerationItemObject.enum}.${enumerationItemId}`
        : '',
    enumObject = enumObjectId && !currentEnumerationItemObject.isExternal ? getObject(enumObjectId) : null,
    enumMembers = enumObject?.common?.members || [];
  if (withEnum && enumObjectId && enumMembers?.length === 0) {
    return enumObjectId;
  } else if (!withEnum && !enumObjectId && currentEnumerationItemObject) {
    return 'can be deleted';
  }
  return '';
}

/**
 * This function returns a string containing a formatted details/properties of current enumerations item.
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
      if (typeOf(currentEnumerationItem[item], 'boolean')) {
        currentItemDetailsLineObject.value = currentEnumerationItem[item]
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user);
      } else if (currentEnumerationItem.hasOwnProperty(item)) {
        currentItemDetailsLineObject.value = currentEnumerationItem[item];
      } else if (currentEnumerationItem.hasOwnProperty('enum')) {
        currentItemDetailsLineObject.value = `[${currentEnumerationItem.enum}.]${currentItem}`;
      } else {
        currentItemDetailsLineObject.value = currentItem;
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
      value: previousItem
        ? enumerationsItemName(user, enumerationType, previousItem, currentEnumerationsList[previousItem])
        : '',
    });
  }
  if (currentEnumerationItem.order < Object.keys(currentEnumerationsList).length - 1) {
    const nextOrder = currentEnumerationItem.order + 1,
      nextItem = Object.keys(currentEnumerationsList).find((item) => currentEnumerationsList[item].order === nextOrder);
    currentItemDetailsList.push({
      label: translationsItemTextGet(user, 'ListNext'),
      value: nextItem ? enumerationsItemName(user, enumerationType, nextItem, currentEnumerationsList[nextItem]) : '',
    });
  }
  if (enumerationType === dataTypeFunction || enumerationType === dataTypeDestination) {
    currentItemDetailsList.push({
      label: translationsItemMenuGet(user, 'holder'),
      value:
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
      value: `${dataTypeActiveSubItemsCount}`,
    });
    currentItemDetailsList.push({
      label: `${translationsItemTextGet(user, 'canBeDeleted')}`,
      value: `${
        dataTypeActiveSubItemsCount === 0
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user)
      }`,
    });
  } else if (currentEnumerationItem.enum) {
    currentItemDetailsList.push({
      label: `${translationsItemTextGet(user, 'canBeDeleted')}`,
      value: `${
        (configOptions.getOption(cfgAllowToDeleteEmptyEnums) &&
          enumerationsIsItemCanBeDeleted(enumerationType, currentItem, true)) ||
        enumerationsIsItemCanBeDeleted(enumerationType, currentItem, false)
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user)
      }`,
    });
  }
  return currentItemDetailsList.length
    ? `${menuMenuItemDetailsPrintFixedLengthLines(user, currentItemDetailsList)}`
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
  if (!typeOf(enumerationItem, 'object')) {
    const enumerationList = enumerationsGetList(enumerationType);
    enumerationItem = enumerationList ? enumerationList[enumerationItemId] : enumerationItem;
  }
  if (
    enumerationItem &&
    isDefined(enumerationItem.name) &&
    translationsItemGet(user, currentItemTranslationId) === currentItemTranslationId
  ) {
    enumerationsRereadItemName(user, enumerationType, enumerationItemId);
  }
  let result = 'No translation';
  if (enumerationItem.name || enumerationItem.isExternal) {
    result = translationsItemGet(user, currentItemTranslationId);
  } else if (enumerationType === dataTypePrimaryEnums) {
    const enumerationObjectId = `${prefixEnums}.${enumerationItemId}`;
    result = `${stringCapitalize(translationsGetObjectName(user, enumerationObjectId))} [${enumerationItemId}]`;
  } else if (enumerationItem.nameTranslationId) {
    result = translationsItemGet(user, enumerationItem.nameTranslationId);
  }
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
 * This function returns a name of current enumerations item.
 * @param {object} user - The user object.
 * @param {string} enumerationType  - The string defines the enumerationItem type.
 * @param {string} enumerationItemId - The Id of the current enumerationItem.
 * @returns {string} The enumerations item name.
 */
function enumerationsItemIcon(user, enumerationType, enumerationItemId) {
  let result = iconItemNotFound;
  const enumerationList = enumerationsGetList(enumerationType);
  if (isDefined(enumerationList)) {
    const enumerationItem = enumerationList[enumerationItemId];
    if (typeOf(enumerationItem, 'object') && typeof enumerationItem.icon === 'string') {
      result = enumerationItem.icon;
    }
  }
  return result;
}

/**
 * This function returns holder id of current enumeration or it's id if it holds other enumerations;
 * @param {object} enumerations - Te list of enumerations.
 * @param {string} enumerationId - The current enumeration Id.
 * @returns {string} The found Id or empty string;
 */
function enumerationsGetHolderIdOrIdWithIncludedItems(enumerations, enumerationId) {
  let result = '';
  if (typeOf(enumerations[enumerationId].holder, 'string')) {
    result = enumerations[enumerationId].holder;
  } else if (Object.keys(enumerations).every((item) => enumerations[item].holder === enumerationId)) {
    result = enumerationId;
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentAccessLevel = menuItemToProcess.accessLevel,
    {dataType: enumerationType, dataTypeExtraId: enumerationTypeExtraId} = menuItemToProcess.options,
    enumerationPrimaryType = enumerationsGetPrimaryDataType(enumerationType, enumerationTypeExtraId);
  if (enumerationType !== dataTypePrimaryEnums) {
    enumerationsLoad(enumerationPrimaryType);
    enumerationsInit(enumerationPrimaryType);
  }
  const currentEnumerationsList = enumerationsGetList(enumerationType, enumerationTypeExtraId);
  enumerationsReorderItems(currentEnumerationsList);
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
      const currentEnumerationItem = currentEnumerationsList[currentItem];
      let currentIcon = iconItemDisabled;
      if (currentEnumerationItem.isEnabled) {
        currentIcon = currentEnumerationItem.icon || '';
      }
      const currentMenuItem = {
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${enumerationsItemName(user, enumerationType, currentItem, currentEnumerationItem)}${
          currentEnumerationItem.isExternal ? ` ${iconItemIsExternal}` : ''
        }`,
        icon: currentIcon,
        accessLevel: currentAccessLevel,
        text: enumerationsMenuItemDetailsEnumerationItem,
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
        case dataTypeFunction: {
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'commonStatesTranslation')}`,
            icon: iconItemCommon,
            accessLevel: currentAccessLevel,
            options: {translationPrefix: translationsCommonFunctionsAttributesPrefix},
            submenu: translationsMenuGenerateFunctionStatesItems,
          });
          break;
        }
        case dataTypeReport: {
          if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelReadOnly) < 0) {
            const currentEnumsList = Object.keys(enumerationsList[enumerationType].enums);
            if (currentEnumsList?.length > 0) {
              const subMenuItem = {
                index: `${currentIndex}.${subMenuIndex}`,
                name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
                icon: iconItemPlus,
                group: cmdItemAdd,
              };
              if (currentEnumsList.length === 1) {
                subMenuItem.options = {enumType: currentEnumsList[0], item: ''};
                subMenuItem.submenu = simpleReportMenuGenerateCreateNewReport;
              } else {
                subMenuItem.submenu = new Array();
                currentEnumsList.forEach((enumId, enumIndex) => {
                  subMenuItem.submenu.push({
                    index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
                    name: stringCapitalize(translationsGetObjectName(user, `${prefixEnums}.${enumId}`)),
                    icon: iconItemPlus,
                    accessLevel: currentAccessLevel,
                    options: {enumType: enumId, item: ''},
                    submenu: simpleReportMenuGenerateCreateNewReport,
                  });
                });
              }
              subMenuIndex = subMenu.push(subMenuItem);
            }
          }
          break;
        }
        default: {
          break;
        }
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
            const enumObjectId = `${prefixEnums}.${enumId}`;
            subMenuItem.submenu.push({
              index: `${currentIndex}.${subMenuIndex}.${enumIndex}`,
              name: `${stringCapitalize(translationsGetObjectName(user, enumObjectId))}[${enumId}]`,
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
  return stateObjectCommon?.custom?.hasOwnProperty(historyAdapterId) && stateObjectCommon.custom[historyAdapterId];
}

/**
 * This function trying to find and return the Device name for Translations of ioBroker definition.
 * @param {object} user - The user object.
 * @param {string} stateId - The ioBroker state full ID.
 * @param {string} functionId - The Function ID.
 * @param {string} destinationId - The Destination ID.
 * @returns {string} The name of Device.
 */
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: primaryStateId, device: devicePrefix} = options,
    functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[functionId],
    primaryStateShortId = primaryStateId.replace(`${devicePrefix}.`, ''),
    currentAccessLevel = menuItemToProcess.accessLevel,
    isCurrentAccessLevelNonSilent = MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelSilent) < 0,
    historyAdapterId = configOptions.getOption(cfgHistoryAdapter, user),
    graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user),
    isGraphsEnabled = historyAdapterId && existsObject(`${graphsTemplatesFolder}.${graphsDefaultTemplate}`),
    defaultIconOn = configOptions.getOption(cfgDefaultIconOn, user),
    defaultIconOff = configOptions.getOption(cfgDefaultIconOff, user),
    statesForGraphs = new Map();
  let subMenuIndex = 0,
    subMenu = [];
  if (isGraphsEnabled) {
    const optionsForAttributes = {...options, attributes: 'all', buttons: 'showOnly', details: false},
      deviceAttributesCheckOnGraphs = (user, _stateId, stateIdFull, stateObject, _stateDetails, _options) => {
        const stateObjectCommon = stateObject.common;
        if (stateObjectCommon) {
          if (enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId)) {
            statesForGraphs.set(stateIdFull, translationsGetObjectName(user, stateObject, functionId));
          }
        }
      };
    enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsForAttributes, deviceAttributesCheckOnGraphs);
  }
  const optionsForButtons = {...options, attributes: 'no', buttons: 'press', details: true},
    deviceButtonsProcess = (user, deviceButtonId, stateIdFull, stateObject, currentButton, _options) => {
      const stateObjectCommon = stateObject.common,
        convertValueCode = currentButton.convertValueCode;
      if (stateObject && stateObjectCommon) {
        const isCurrentStateWritable = stateObjectCommon.hasOwnProperty('write') ? stateObjectCommon.write : false,
          currentStateType = stateObjectCommon['type'];
        if (isCurrentStateWritable) {
          const stateName = translationsGetObjectName(user, stateObject, functionId);
          if (stateName) {
            const currentState = existsState(stateIdFull) ? getState(stateIdFull) : undefined,
              stateValue = typeOf(currentState, 'object')
                ? // @ts-ignore
                  enumerationsEvaluateValueConversionCode(user, currentState.val, convertValueCode)
                : undefined;
            const currentOptions = {
              function: functionId,
              state: stateIdFull,
              stateType: currentStateType,
              stateObject: objectInfoDeplete(stateObject),
              valueType: currentStateType,
              device: devicePrefix,
              replaceCommand: cmdSetState,
              dataType: dataTypeStateValue,
              value: stateValue,
              icon: '',
              showValueInName: true,
              icons:
                deviceButtonId === primaryStateId
                  ? [currentFunction.iconOn, currentFunction.iconOff]
                  : [defaultIconOn, defaultIconOff],
            };
            const subMenuItem = menuMenuItemGenerateEditItemStateValue(
              user,
              currentIndex,
              subMenuIndex,
              stateName,
              '',
              currentOptions,
            );
            if (deviceButtonId !== primaryStateShortId) {
              subMenuIndex = subMenu.push(subMenuItem);
            } else {
              subMenuIndex = subMenu.unshift(subMenuItem);
            }
            if (
              isGraphsEnabled &&
              enumerationsIsHistoryEnabledForState(stateObject, historyAdapterId) &&
              !statesForGraphs.has(stateIdFull)
            ) {
              statesForGraphs.set(stateIdFull, stateName);
            }
          }
        }
      }
    };
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsForButtons, deviceButtonsProcess);
  if (isCurrentAccessLevelNonSilent) {
    const alertSubscribeItem = alertsMenuItemGenerateSubscribedOn(
      user,
      `${currentIndex}.${subMenuIndex}`,
      `${translationsItemCoreGet(user, cmdAlertSubscribe)}`,
      {function: functionId, destination: destinationId, state: primaryStateId},
    );
    if (alertSubscribeItem) {
      subMenuIndex = subMenu.push(alertSubscribeItem);
    }
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'AlertsSubscriptionExtended')}`,
      options: {
        function: functionId,
        destination: destinationId,
        device: devicePrefix,
      },
      accessLevel: currentAccessLevel,
      icon: iconItemAlerts,
      text: enumerationsMenuItemDetailsDevice,
      group: 'alerts',
      submenu: alertsMenuGenerateExtraSubscription,
    });
    if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelFull) === 0) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'triggers')}`,
        options: {
          function: functionId,
          destination: destinationId,
          device: devicePrefix,
        },
        accessLevel: currentAccessLevel,
        icon: iconItemTrigger,
        text: enumerationsMenuItemDetailsDevice,
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
          subSubSubMenuIndex = subSubMenuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}.${subSubSubMenuIndex}`,
            name: `${translationsItemTextGet(user, 'TimeRange', graphsIntervalId)}`,
            icon: iconItemChart,
            group: cmdItemsProcess,
            command: cmdItemsProcess,
            options: {
              dataType: dataTypeGraph,
              function: functionId,
              destination: destinationId,
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
  return subMenu;
}

/**
 * This function extracts the list(`object`) of possible value states for the appropriate ioBroker state.
 * @param {object} user - The user object.
 * @param {string|object} stateIdOrObject - The id of the state or the it's object representation.
 * @param {string=} functionId - The appropriate `Function` ID.
 * @returns {Map} The list of possible value states.
 */
function enumerationsExtractPossibleValueStates(user, stateIdOrObject, functionId = '') {
  const stateObject =
    typeOf(stateIdOrObject, 'string') && existsObject(stateIdOrObject)
      ? getObjectEnriched(stateIdOrObject)
      : stateIdOrObject;
  let states = new Map(),
    statesArray = [],
    value,
    namePossible = '',
    valueName,
    possibleValueTranslationId = '';
  if (typeOf(stateObject['common'], 'object')) {
    const objectCommon = stateObject['common'],
      inputStates = objectCommon.states,
      inputType = objectCommon.type,
      stateId = typeOf(stateIdOrObject, 'string') ? stateIdOrObject : stateObject._id,
      stateFunction = enumerationsList[dataTypeFunction].list[functionId],
      stateAttributeId = typeOf(stateFunction, 'object')
        ? stateId.split('.').slice(-stateFunction.statesSectionsCount).join('.')
        : '',
      stateTranslationIdPrefix = stateAttributeId.split('.').join('_');
    if (['string', 'object'].includes(`${typeOf(objectCommon)}`)) {
      if (typeOf(inputStates, 'string')) {
        if (inputStates.includes(';')) {
          statesArray = inputStates.split(';');
        } else if (inputStates.includes(',')) {
          statesArray = inputStates.split(',');
        }
      } else {
        statesArray = Object.keys(inputStates);
      }
      for (let iState of statesArray.values()) {
        if (typeOf(inputStates, 'string') && inputStates.includes(':')) {
          [value, namePossible] = iState.split(':');
          value = value.trim();
          namePossible = namePossible.trim();
        } else if (typeOf(inputStates, 'object')) {
          value = iState;
          namePossible = inputStates[iState];
        } else {
          value = undefined;
        }
        if (isDefined(value)) {
          if (typeOf(value, 'string') && inputType !== 'string') {
            value = getValueFromStringByType(value, inputType);
          }
        }
        if (typeOf(stateFunction, 'object')) {
          possibleValueTranslationId = `${stateTranslationIdPrefix}_${value}`;
          valueName = translationsGetObjectName(user, possibleValueTranslationId, functionId);
          if (valueName === 'Undefined' || valueName.includes(possibleValueTranslationId)) valueName = namePossible;
          if (!typeOf(valueName, 'string')) valueName = `${value}`;
        } else {
          valueName = namePossible;
        }
        states.set(value, valueName);
      }
    }
  }
  return states;
}

/**
 * This function used to evaluate the code, associated with the attribute,
 * to convert the ioBroker state value to new one.
 * @param {object} user - The user object.
 * @param {any} inputValue - The input value.
 * @param {string} convertValueCode - The string, contained converting code.
 * @returns {any} The result of conversion.
 */
function enumerationsEvaluateValueConversionCode(user, inputValue, convertValueCode) {
  if (convertValueCode && isDefined(inputValue)) {
    const printDate = 'printDate(value)';
    if (typeOf(convertValueCode, 'string') && convertValueCode.length > 0) {
      if (convertValueCode === printDate || convertValueCode === `${printDate};`) {
        try {
          inputValue = formatDate(new Date(inputValue), configOptions.getOption(cfgDateTimeTemplate, user));
        } catch (error) {
          warns(`Can't print date printDate(${inputValue})! Error is "${jsonStringify(error)}".`);
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
          warns(`Can't convert value with ${convertValueCode}! Error is "${jsonStringify(error)}".`);
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
    stateToTestValue;
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
        if (stateToTestValueObject?.hasOwnProperty('val') && isDefined(stateToTestValueObject.val)) {
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
 * This function get the ioBroker state value and return it as formatted string.
 * @param {object} user - The user object.
 * @param {string|object} stateIdOrObject - The id of the state or the it's object representation.
 * @param {string} functionId - The id of the associated function.
 * @param {object=} currentState - The object, contained the current state information.
 * @param {boolean=} skipCodeConversion - The selector to skip code conversion.
 * @returns {string} The resulted formatted string.
 */
function enumerationsStateValueDetails(user, stateIdOrObject, functionId, currentState, skipCodeConversion = false) {
  const currObject =
    typeOf(stateIdOrObject, 'string') && existsObject(stateIdOrObject)
      ? getObjectEnriched(stateIdOrObject)
      : stateIdOrObject;
  let text = '';
  if (
    currObject &&
    typeOf(currObject, 'object') &&
    currObject.hasOwnProperty('_id') &&
    currObject.hasOwnProperty('common')
  ) {
    skipCodeConversion = skipCodeConversion || false;
    const currentId = currObject._id,
      currentFunction = enumerationsList[dataTypeFunction].list[functionId],
      currentAttributeId = currentId.split('.').slice(-currentFunction.statesSectionsCount).join('.'),
      currentDeviceButtonsAndAttributes = {...currentFunction.deviceAttributes, ...currentFunction.deviceButtons},
      convertValueCode = currentDeviceButtonsAndAttributes.hasOwnProperty(currentAttributeId)
        ? currentDeviceButtonsAndAttributes[currentAttributeId].convertValueCode
        : '',
      stateTranslationIdPrefix = currentAttributeId.split('.').join('_'),
      currentObjectType = currObject.common['type'],
      currObjectUnit = currObject.common.hasOwnProperty('unit') ? currObject.common['unit'] : '';
    let currentStateVal;
    if (currentState?.hasOwnProperty('val')) {
      currentStateVal = currentState.val;
    } else if (existsState(currentId)) {
      currentStateVal = getState(currentId).val;
    }
    const currentStateValue = skipCodeConversion
        ? currentStateVal
        : enumerationsEvaluateValueConversionCode(user, currentStateVal, convertValueCode),
      currentStateValueType = !isDefined(currentStateValue) ? currentObjectType : typeof currentStateValue,
      currentStateValueTranslationId = `${stateTranslationIdPrefix}_${currentStateValue}`;
    if (isDefined(currentStateValue)) {
      if (currentStateValueType === 'boolean') {
        const currentIconOn =
            currentAttributeId === currentFunction.state
              ? currentFunction.iconOn
              : configOptions.getOption(cfgDefaultIconOn, user),
          currentIconOff =
            currentAttributeId === currentFunction.state
              ? currentFunction.iconOff
              : configOptions.getOption(cfgDefaultIconOff, user);
        if (isDefined(currentStateValue)) {
          text = translationsGetObjectName(user, currentStateValueTranslationId, functionId);
          if (text === 'Undefined' || text.includes(currentStateValueTranslationId)) {
            text = currentStateValue ? currentIconOn : currentIconOff;
          }
        }
      } else if (
        currObject.common.hasOwnProperty('states') &&
        ['string', 'number'].includes(currObject.common['type'])
      ) {
        const states = enumerationsExtractPossibleValueStates(user, currObject, functionId);
        if (typeOf(states, 'map') && states.has(currentStateValue)) {
          text = states.get(currentStateValue);
        } else {
          text = `${currentStateValue}`;
        }
      } else if (currentStateValueType === 'number') {
        // Determine the value part
        if (Number.isInteger(currentStateValue)) {
          text = currentStateValue.toString();
        } else {
          text = currentStateValue.toFixed(2);
        }
      } else if (currentStateValueType === 'string') {
        text = currentStateValue;
      }
    } else {
      text = iconItemNotFound;
    }
    if (text.length && currObjectUnit) text += ` ${currObjectUnit}`;
  }
  return text;
}

/**
 * This function generates a string containing formatted details/properties of current device attributes.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the description will be generated.
 * @returns {string} A formatted string.
 */
function enumerationsMenuItemDetailsDevice(user, menuItemToProcess) {
  const currentAccessLevel = menuItemToProcess.accessLevel,
    options = menuItemToProcess.options,
    {function: currentFunctionId, state: primaryStateId} = options,
    isSkipAttributesWithNullValue = configOptions.getOption(cfgSkipAttributesWithNullValue, user),
    optionsForAttributes = {
      ...options,
      attributes: 'all',
      buttons: 'showOnly',
      details: true,
    },
    deviceAttributesArray = [],
    deviceAttributesToDraw = (user, _deviceAttribute, deviceAttributeId, stateObject, stateDetails, _options) => {
      const isPrimaryState = deviceAttributeId === primaryStateId;
      if (stateObject) {
        const attributeState = existsState(deviceAttributeId) ? getState(deviceAttributeId) : undefined,
          isCurrentStateNotEmpty = attributeState && isDefined(attributeState.val);
        if (isPrimaryState || isCurrentStateNotEmpty || !isSkipAttributesWithNullValue) {
          deviceAttributesArray.push({
            label: translationsGetObjectName(user, stateObject, currentFunctionId),
            value: enumerationsStateValueDetails(user, stateObject, currentFunctionId, attributeState),
          });
          if (attributeState) {
            if (stateDetails?.hasOwnProperty('stateAttributes')) {
              stateDetails.stateAttributes.forEach((stateAttributeId) => {
                const stateAttributeLine = {
                  label: ` ${translationsGetObjectName(user, stateAttributeId, currentFunctionId, undefined, true)}`,
                  value: '',
                };
                switch (stateAttributeId) {
                  case 'ts':
                  case 'lc': {
                    const timeStamp = attributeState[stateAttributeId]
                      ? new Date(Number(attributeState[stateAttributeId]))
                      : undefined;
                    stateAttributeLine.value = timeStamp
                      ? formatDate(timeStamp, configOptions.getOption(cfgDateTimeTemplate, user))
                      : '';
                    break;
                  }

                  case 'ack': {
                    stateAttributeLine.value = attributeState.ack
                      ? configOptions.getOption(cfgDefaultIconOn, user)
                      : configOptions.getOption(cfgDefaultIconOff, user);
                    break;
                  }

                  default: {
                    stateAttributeLine.value = attributeState[stateAttributeId];
                    break;
                  }
                }
                deviceAttributesArray.push(stateAttributeLine);
              });
            }
          }
        }
      }
    };
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsForAttributes, deviceAttributesToDraw);
  if (deviceAttributesArray.length) {
    return `${menuMenuItemDetailsPrintFixedLengthLines(user, deviceAttributesArray)}`;
  } else {
    return '';
  }
}

/**
 * This function gets a menu list based on the enumerationType and enumerationTypeExtraId parameters.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string|object=} enumerationTypeExtraId - The extra (primary) enumerationType or item of it.
 * @returns {object} The appropriate enumerations object.
 */
function enumerationsGetList(enumerationType, enumerationTypeExtraId) {
  const enumerationPrimaryType = enumerationsGetPrimaryDataType(enumerationType, enumerationTypeExtraId);
  let currentList;
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
  if (enumerationTypeExtraId) {
    if (enumerationDeviceSubTypes.includes(enumerationType)) {
      return dataTypeFunction;
    } else if (enumerationType === dataTypePrimaryEnums) {
      return enumerationTypeExtraId;
    } else {
      return enumerationType;
    }
  } else {
    return enumerationType;
  }
}

/**
 * This function extract the Device state, when enumerationTYpe is `dataTypeDeviceStatesAttributes`.
 * @param {string} enumerationType - The primary enumerationType.
 * @param {string|object} enumerationTypeExtraId - The extra (primary) enumerationType or item of it.
 * @returns {object}
 */
function enumerationsGetDeviceState(enumerationType, enumerationTypeExtraId) {
  let currentDeviceState;
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

/**
 * @callback ProcessStateCallback
 * @param {object} user - The user object.
 * @param {string} deviceStateId - The part of state ID (without Device ID).
 * @param {string} deviceStateIdFull - The full State ID.
 * @param {object} deviceStateObject - The appropriate ioBroker object.
 * @param {object=} attributeOrButtonObject - The details about Attribute or Button.
 * @param {object} options - The input options.
 * @returns {void}
 */

/**
 * This function is used to execute `processStateFn` on each state of Device, depending on a filter conditions.
 * @param {object} user - The user object
 * @param {string} currentAccessLevel - The level of access to the Device of current User.
 * @param {object} options - The options to identify Devise, filters etc.
 *    - attributes: attributes filter, can be 'all' or any other value,
 *    - buttons: buttons filter, can be 'all', 'press', 'show' and 'showOnly',
 *    - details: boolean selector, to provide state details to `processStateFn`,
 *    - function: Function ID string,
 *    - destination: Destination ID string,
 *    - device: Device ID string
 * @param {ProcessStateCallback} processStateFn - The callback function, with fixed parameters.
 */
function enumerationsProcessDeviceStatesList(user, currentAccessLevel, options, processStateFn) {
  const {
      attributes: attributesFilter,
      buttons: buttonsFilter,
      details: withDetails,
      function: functionId,
      destination: destinationId,
      device: devicePrefix,
    } = options,
    destinationsList = enumerationsList[dataTypeDestination].list,
    currentDestination = destinationsList[destinationId],
    currentDestinationEnum = currentDestination.enum,
    fullDestinationId = `${prefixEnums}.${currentDestinationEnum}.${destinationId}`,
    functionsList = enumerationsList[dataTypeFunction].list,
    currentFunction = functionsList[functionId],
    currentFunctionEnum = currentFunction.enum,
    fullFunctionId = `${prefixEnums}.${currentFunctionEnum}.${functionId}`;
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
              (buttonsFilter === 'showOnly' &&
                MenuRoles.compareAccessLevels(currentAccessLevel, deviceButtonsList[deviceButton].showAccessLevel) <=
                  0 &&
                MenuRoles.compareAccessLevels(currentAccessLevel, deviceButtonsList[deviceButton].pressAccessLevel) >
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
    if (deviceStateObject?.hasOwnProperty('enumIds')) {
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
            if (mainObject['enumIds']?.includes(fullDestId)) {
              $(`state[id=${idPrefix}.*](${currentFunction.enum}=${functionId})`).each((stateId) => {
                if (existsObject(stateId)) {
                  const currentObject = getObjectEnriched(stateId, '*');
                  if (
                    currentObject['enumIds']?.includes(fullFuncId) &&
                    currentObject['enumIds']?.includes(fullDestId)
                  ) {
                    if (currentObject.common) {
                      let currentObjectCommon = currentObject.common;
                      if (
                        (typeOfDeviceStates === dataTypeDeviceAttributes && !currentObjectCommon.write) ||
                        (typeOfDeviceStates === dataTypeDeviceButtons && currentObjectCommon.write)
                      ) {
                        const deviceAttr = stateId.replace(`${idPrefix}.`, '');
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
  const extensionId = `${prefixExtensionId}${stringCapitalize(id)}`;
  const functionsList = enumerationsList[dataTypeFunction].list;
  if (functionsList.hasOwnProperty(extensionId) && typeOf(functionsList[extensionId], 'object')) {
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
      logs(`${extensionsInitCommand} result = ${jsonStringify(result)}`);
    },
  );
}

//*** Extensions - end ***//

//*** Alerts - begin ***//

const alertsStateFullId = `${prefixPrimary}.${idAlerts}`,
  cachedAlertsStatesValuesStateFullId = `${prefixCacheStatesCommon}.${idCachedAlertsStatesValues}`,
  cachedAlertMessages = 'alertMessages',
  cachedAlertsListPrepared = 'alertsListPrepared',
  cachedAlertThresholdSet = 'alertThresholdSet',
  alertThresholdId = 'threshold',
  thresholdEnumerable = 'enumerable',
  onTimeIntervalId = 'onTimeInterval',
  onTimeIntervalIndividualId = 'onTimeIntervalIndividual',
  alertMessageTemplateId = 'messageTemplate',
  alertPropagateFuncAndDest = 'alertPropagateFuncAndDest',
  alertPropagateDestination = 'alertPropagateDestination',
  alertPropagateFunction = 'alertPropagateFunction',
  alertPropagateDistributions = [alertPropagateFuncAndDest, alertPropagateDestination, alertPropagateFunction],
  alertPropagateOptions = ['alertPropagateOverwrite', 'alertPropagateSkip'],
  thresholdsVariables = new Map();

let alertsRules = {},
  cachedAlertsStatesValues = {};

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
cachedValuesStatesCommonAttributes[idCachedAlertsStatesValues] = {
  name: 'List of previous(cached) values of states for alert subscription',
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
    if (typeOf(alertsState, 'object') && typeOf(alertsState.val, 'string')) {
      try {
        alertsRules = jsonParse(alertsState.val);
      } catch (err) {
        // NOSONAR // cachedStates[id] = cachedVal;
        warns(`Alert parse error - ${jsonStringify(err)}`);
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
    const alertsJSON = jsonStringify(alerts);
    if (existsState(alertsStateFullId)) {
      setState(alertsStateFullId, alertsJSON, true);
    } else {
      createState(alertsStateFullId, alertsJSON, cachedValuesStatesCommonAttributes[idAlerts]);
    }
  }
}

/**
 * This function is used to store the current `value` of monitored `state` to
 * enable check alert states on start functionality.
 * @param {string} alertStateId - Id of the `state`, monitored for alerts.
 * @param {any=} currentValue  - Current state `value`. If not defined - will be read from `state`.
 */
function alertsStoreToCacheStateValue(alertStateId, currentValue) {
  if (!isDefined(currentValue)) {
    if (existsState(alertStateId)) {
      currentValue = getState(alertStateId).val;
    }
  }
  if (isDefined(currentValue)) {
    cachedAlertsStatesValues[alertStateId] = currentValue;
    const stringValue = jsonStringify(cachedAlertsStatesValues);
    if (existsState(cachedAlertsStatesValuesStateFullId)) {
      setState(cachedAlertsStatesValuesStateFullId, stringValue, true);
    } else {
      createState(
        cachedAlertsStatesValuesStateFullId,
        stringValue,
        cachedValuesStatesCommonAttributes[idCachedAlertsStatesValues],
      );
    }
  }
}

/**
 * This function is used to load the previous `value` of monitored `state` to
 * enable check alert states on start functionality.
 * @param {string} alertStateId - Id of the `state`, monitored for alerts.
 * @returns {any} The previous value of `state`.
 */
function alertsLoadFromCacheStateValue(alertStateId) {
  if (
    !(typeOf(cachedAlertsStatesValues, 'object') && Object.keys(cachedAlertsStatesValues).length > 0) &&
    existsState(cachedAlertsStatesValuesStateFullId)
  ) {
    const alertsStatesValuesState = getState(cachedAlertsStatesValuesStateFullId);
    if (typeOf(alertsStatesValuesState, 'object') && typeOf(alertsStatesValuesState.val, 'string')) {
      try {
        cachedAlertsStatesValues = jsonParse(alertsStatesValuesState.val);
      } catch (err) {
        // NOSONAR // cachedStates[id] = cachedVal;
        warns(`Alert states values parse error - ${jsonStringify(err)}`);
        if (!typeOf(cachedAlertsStatesValues, 'object')) cachedAlertsStatesValues = {};
      }
    }
  }
  return cachedAlertsStatesValues[alertStateId];
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
 * @param {string} stateId - The ioBroker state full Id.
 * @param {string=} functionId - The id of function enum, linked with a state.
 * @param {string=} destinationId - The id of destination enum, linked with a state.
 * @param {object=} alertDetailsOrThresholds - The object, contained the Thresholds definitions.
 * @param {boolean=} isTriggers - The selector to process a triggers.
 */
function alertsManage(user, stateId, functionId, destinationId, alertDetailsOrThresholds, isTriggers) {
  let alerts = alertsGet();
  if (!typeOf(alerts, 'object')) alerts = {};
  if (!typeOf(alertDetailsOrThresholds, 'array')) alertDetailsOrThresholds = [];
  const userId = isTriggers ? triggersInAlertsId : user.chatId;
  if (alerts.hasOwnProperty(stateId)) {
    const alert = alerts[stateId],
      alertDetails = alert.chatIds.has(userId) ? alert.chatIds.get(userId) : undefined;
    if (
      alertDetails &&
      (jsonStringify(alertDetails) === jsonStringify(alertDetailsOrThresholds) || alertDetailsOrThresholds.length === 0)
    ) {
      if (alert.chatIds.size === 1) {
        delete alerts[stateId];
        unsubscribe(stateId);
      } else {
        alert.chatIds.delete(userId);
      }
    } else if (functionId) {
      alert.chatIds.set(userId, alertDetailsOrThresholds);
    }
  } else if (functionId && destinationId) {
    const chatsMap = new Map();
    chatsMap.set(userId, alertDetailsOrThresholds);
    alerts[stateId] = {function: functionId, destination: destinationId, chatIds: chatsMap};
    on({id: stateId, change: 'ne'}, alertsActionOnSubscribedState);
  }
  if (isTriggers) {
    cachedValueDelete(user, cachedTriggersDetails);
  } else {
    cachedValueDelete(user, cachedAlertThresholdSet);
    cachedValueDelete(user, cachedAlertsListPrepared);
  }
  alertsStore(alerts);
}

/**
 * This function returns an icon, which show  if the any alerts is enabled for an appropriate `state` and `recipient`.
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
  const statesToSubscribe = Object.keys(alerts),
    currentSubscriptions = getSubscriptions(),
    currentlySubscribedStates = Object.keys(currentSubscriptions)
      .filter((stateId) => currentSubscriptions[stateId].filter((handler) => handler.name === scriptName).length)
      .filter((stateId) => !stateId.includes(telegramAdapter))
      .filter((stateId) => !stateId.includes(prefixPrimary));
  statesToSubscribe.forEach((stateId) => {
    if (!currentlySubscribedStates.includes(stateId)) {
      if (existsState(stateId)) on({id: stateId, change: 'ne'}, alertsActionOnSubscribedState);
    }
  });
  currentlySubscribedStates.forEach((stateId) => {
    if (!statesToSubscribe.includes(stateId)) {
      unsubscribe(stateId);
    }
  });
  onMessageUnregister(extensionSendAlertToTelegramCommand);
  // @ts-ignore
  onMessage(extensionSendAlertToTelegramCommand, alertsOnAlertToTelegram);
  if (checkStates && configOptions.getOption(cfgCheckAlertStatesOnStartUp)) {
    statesToSubscribe.forEach((stateId) => {
      if (existsState(stateId)) {
        const currentValue = getState(stateId).val,
          oldValue = alertsLoadFromCacheStateValue(stateId);
        if (isDefined(currentValue) && isDefined(oldValue) && currentValue !== oldValue) {
          alertsActionOnSubscribedState({id: stateId, state: {val: currentValue}, oldState: {val: oldValue}});
        }
      }
    });
  }
  triggersTimeRangeStartTimesUpdate();
  triggersLogsInit();
  // triggersTimeRangeStartTimeScheduled('0 0 9 * * *')
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
  const alertMessages = alertsHistoryClearOld(user);
  alertMessages.push({
    ack: !!isAcknowledged,
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
      const ifClause = stringToProcess.match(/^(\w+?)\?(.*?):(.*?)$/);
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
    stateId = object.id,
    isEmulatedForTriggers = object.isEmulatedForTriggers;
  if (typeOf(alerts, 'object') && alerts.hasOwnProperty(stateId)) {
    const alertTimeStamp = new Date(Date.now()),
      alertObject = getObjectEnriched(stateId, '*'),
      alertDestinationId = alerts[stateId].destination,
      alertFunctionId = alerts[stateId].function,
      functionsList = enumerationsList[dataTypeFunction].list,
      alertFunction = functionsList?.hasOwnProperty(alertFunctionId) ? functionsList[alertFunctionId] : undefined;
    if (alertFunction) {
      const alertStateSectionsCount = alertFunction.statesSectionsCount,
        alertStateShortId = stateId.split('.').slice(-alertStateSectionsCount).join('.'),
        isPrimaryState = alertStateShortId === alertFunction.state,
        alertFunctionDeviceButtonsAndAttributes = {...alertFunction.deviceAttributes, ...alertFunction.deviceButtons},
        convertValueCode = alertFunctionDeviceButtonsAndAttributes.hasOwnProperty(alertStateShortId)
          ? alertFunctionDeviceButtonsAndAttributes[alertStateShortId].convertValueCode
          : '',
        alertStateType = alertObject.common['type'];
      if (configOptions.getOption(cfgCheckAlertStatesOnStartUp))
        alertsStoreToCacheStateValue(stateId, object.state.val);
      alerts[stateId].chatIds.forEach((detailsOrThresholds, chatId) => {
        chatId = Number(chatId);
        const user = telegramGenerateUserObjectFromId(chatId),
          isTrigger = chatId === triggersInAlertsId;
        if (chatId >= 0 || activeChatGroups.includes(chatId)) {
          let currentState = cachedValueGet(user, cachedCurrentState);
          const stateValue = enumerationsEvaluateValueConversionCode(user, object.state.val, convertValueCode),
            stateValueOld = enumerationsEvaluateValueConversionCode(user, object.oldState.val, convertValueCode),
            messageValues = {};
          if (typeOf(user, 'object')) {
            messageValues.alertFunctionName = translationsGetEnumName(
              user,
              dataTypeFunction,
              alertFunctionId,
              enumerationsNamesMain,
            );
            messageValues.alertDestinationName = translationsGetEnumName(
              user,
              dataTypeDestination,
              alertDestinationId,
              enumerationsNamesInside,
            );
            messageValues.alertDeviceName = translationsGetObjectName(
              user,
              stateId.split('.').slice(0, -alertStateSectionsCount).join('.'),
              alertFunctionId,
              alertDestinationId,
            );
            messageValues.alertStateName = isPrimaryState
              ? ''
              : translationsGetObjectName(user, alertObject, alertFunctionId);
            messageValues.alertStateValue = enumerationsStateValueDetails(
              user,
              alertObject,
              alertFunctionId,
              object.state,
            );
            messageValues.alertStateOldValue = enumerationsStateValueDetails(
              user,
              alertObject,
              alertFunctionId,
              object.oldState,
            );
          }
          if (
            !isTrigger &&
            !isEmulatedForTriggers &&
            (alertStateType === 'boolean' ||
              (alertObject.common.hasOwnProperty('states') && ['string', 'number'].includes(alertStateType))) &&
            detailsOrThresholds.length === 1
          ) {
            const threshold = detailsOrThresholds[0],
              alertMessageTemplate = typeOf(threshold?.alertMessageTemplateId, 'string')
                ? threshold[alertMessageTemplateId]
                : configOptions.getOption(cfgAlertMessageTemplateMain, user),
              idStoredTimerOn = [stateId, chatId, 'timerOn'].join(itemsDelimiter),
              idStoredTimerValue = [stateId, chatId, 'timerValue'].join(itemsDelimiter),
              storedTimerOn = thresholdsVariables.has(idStoredTimerOn)
                ? thresholdsVariables.get(idStoredTimerOn)
                : undefined,
              [storedTimerValue, storedTimerOldValue] =
                storedTimerOn && thresholdsVariables.has(idStoredTimerValue)
                  ? thresholdsVariables.get(idStoredTimerValue)
                  : [undefined, undefined],
              alertMessageText = alertsProcessMessageTemplate(user, alertMessageTemplate, messageValues);
            let onTimeInterval = typeOf(threshold?.onTimeIntervalId, 'number') ? threshold[onTimeIntervalId] : 0;
            if (typeOf(threshold?.[onTimeIntervalIndividualId], 'map')) {
              if (threshold[onTimeIntervalIndividualId].has(stateValue)) {
                onTimeInterval = threshold[onTimeIntervalIndividualId].get(stateValue);
              }
            }
            if (onTimeInterval) {
              if (storedTimerOn) {
                if (stateValue !== storedTimerValue) {
                  clearTimeout(storedTimerOn);
                  thresholdsVariables.delete(idStoredTimerOn);
                  thresholdsVariables.delete(idStoredTimerValue);
                }
              }
              if (!isDefined(storedTimerOn) || stateValue !== storedTimerOldValue) {
                thresholdsVariables.set(idStoredTimerValue, [stateValue, stateValueOld]);
                thresholdsVariables.set(
                  idStoredTimerOn,
                  setTimeout(() => {
                    alertsMessagePush(user, stateId, alertMessageText, stateId === currentState);
                    thresholdsVariables.delete(idStoredTimerOn);
                    thresholdsVariables.delete(idStoredTimerValue);
                  }, onTimeInterval * 1000),
                );
              }
            } else {
              alertsMessagePush(user, stateId, alertMessageText, stateId === currentState);
            }
          } else if (
            (isTrigger || (alertStateType === 'number' && !isEmulatedForTriggers)) &&
            detailsOrThresholds.length
          ) {
            const alertDefaultTemplate = configOptions.getOption(cfgAlertMessageTemplateThreshold, user);
            detailsOrThresholds.forEach((threshold) => {
              if (threshold.isEnabled) {
                const {
                    value: thresholdValue,
                    id,
                    type,
                    onAbove,
                    onBelow,
                    targetState,
                    targetValue,
                    conditions,
                  } = threshold,
                  isNumeric = type === 'number',
                  timeRange = threshold[triggersTimeRangeId],
                  idStoredTimer = ['timer', stateId, chatId, id].join(itemsDelimiter),
                  idStoredData = ['data', stateId, chatId, isNumeric ? id : ''].join(itemsDelimiter),
                  timerOn = thresholdsVariables.has(idStoredTimer) ? thresholdsVariables.get(idStoredTimer) : undefined,
                  alertMessageTemplate = threshold.hasOwnProperty(alertMessageTemplateId)
                    ? threshold[alertMessageTemplateId]
                    : alertDefaultTemplate,
                  triggerLogItem = {
                    date: alertTimeStamp,
                    triggerState: stateId,
                    triggerFunction: alertFunctionId,
                    triggerDestination: alertDestinationId,
                    triggerValue: stateValue,
                    triggerId: id,
                  };
                let isBelow,
                  isAbove,
                  isTriggered,
                  storedValue,
                  storedValueOld,
                  timeRangeIsOk = true,
                  onTimeInterval = threshold.hasOwnProperty(onTimeIntervalId) ? threshold[onTimeIntervalId] : 0;
                if (isNumeric) {
                  storedValue =
                    timerOn && thresholdsVariables.has(idStoredData) ? thresholdsVariables.get(idStoredData) : 0;
                  isBelow =
                    stateValue < thresholdValue && (stateValueOld >= thresholdValue || (timerOn && storedValue > 0));
                  isAbove =
                    stateValue >= thresholdValue && (stateValueOld < thresholdValue || (timerOn && storedValue < 0));
                  messageValues['alertThresholdIcon'] = isBelow ? iconItemBelow : iconItemAbove;
                  if (typeOf(threshold?.[onTimeIntervalIndividualId], 'map')) {
                    let individualId = '';
                    if (isBelow && onBelow) {
                      individualId = 'onBelow';
                    } else if (isAbove && onAbove) {
                      individualId = 'onAbove';
                    }
                    if (threshold[onTimeIntervalIndividualId].has(individualId)) {
                      onTimeInterval = threshold[onTimeIntervalIndividualId].get(individualId);
                    }
                  }
                  if (isTrigger) {
                    if (isAbove) triggerLogItem['triggerAction'] = 'above';
                    if (isBelow) triggerLogItem['triggerAction'] = 'below';
                  }
                } else {
                  if (thresholdsVariables.has(idStoredData)) {
                    [storedValue, storedValueOld] = thresholdsVariables.get(idStoredData);
                  }
                  messageValues['alertThresholdIcon'] = '=';
                  isTriggered =
                    stateValue === thresholdValue && !(stateValueOld === storedValue && stateValue === storedValueOld);
                  if (isTrigger) triggerLogItem['triggerAction'] = 'equal';
                }
                let thresholdUsers = threshold.users;
                const pushAlertOrTriggerState = () => {
                  if (thresholdsVariables.has(idStoredTimer)) thresholdsVariables.delete(idStoredTimer);
                  if (thresholdsVariables.has(idStoredData)) thresholdsVariables.delete(idStoredData);
                  if (typeOf(thresholdUsers, 'array') && thresholdUsers.length > 0) {
                    thresholdUsers.forEach((userId) => {
                      const thresholdUser = telegramGenerateUserObjectFromId(userId);
                      messageValues.alertFunctionName = translationsGetEnumName(
                        thresholdUser,
                        dataTypeFunction,
                        alertFunctionId,
                        enumerationsNamesMain,
                      );
                      messageValues.alertDestinationName = translationsGetEnumName(
                        thresholdUser,
                        dataTypeDestination,
                        alertDestinationId,
                        enumerationsNamesInside,
                      );
                      messageValues.alertDeviceName = translationsGetObjectName(
                        thresholdUser,
                        stateId.split('.').slice(0, -alertStateSectionsCount).join('.'),
                        alertFunctionId,
                        alertDestinationId,
                      );
                      messageValues.alertStateName = isPrimaryState
                        ? ''
                        : translationsGetObjectName(thresholdUser, alertObject, alertFunctionId);
                      messageValues.alertStateValue = enumerationsStateValueDetails(
                        thresholdUser,
                        alertObject,
                        alertFunctionId,
                        object.state,
                      );
                      messageValues.alertStateOldValue = enumerationsStateValueDetails(
                        thresholdUser,
                        alertObject,
                        alertFunctionId,
                        object.oldState,
                      );
                      const targetFunctionId = threshold.targetFunction,
                        targetFunction = functionsList?.hasOwnProperty(targetFunctionId)
                          ? functionsList[targetFunctionId]
                          : undefined,
                        targetDestinationId = threshold.targetDestination;
                      if (targetFunction) {
                        const targetStateSectionsCount = targetFunction.statesSectionsCount;
                        messageValues.targetFunctionName = translationsGetEnumName(
                          thresholdUser,
                          dataTypeFunction,
                          targetFunctionId,
                          enumerationsNamesMain,
                        );
                        messageValues.targetDestinationName = translationsGetEnumName(
                          thresholdUser,
                          dataTypeDestination,
                          targetDestinationId,
                          enumerationsNamesInside,
                        );
                        messageValues.targetDeviceName = translationsGetObjectName(
                          thresholdUser,
                          targetState.split('.').slice(0, -targetStateSectionsCount).join('.'),
                          targetFunctionId,
                          targetDestinationId,
                        );
                        messageValues.targetStateName = translationsGetObjectName(
                          thresholdUser,
                          targetState,
                          targetFunctionId,
                        );
                        messageValues.targetStateValue = enumerationsStateValueDetails(
                          thresholdUser,
                          targetState,
                          targetFunctionId,
                          {val: targetValue},
                        );
                      }
                      messageValues['alertThresholdValue'] = thresholdValue;
                        const alertMessageText = alertsProcessMessageTemplate(
                        thresholdUser,
                        alertMessageTemplate,
                        messageValues,
                      );
                      alertsMessagePush(thresholdUser, stateId, alertMessageText, stateId === currentState);
                    });
                  }
                  if (isTrigger) {
                    if (threshold.log) {
                      triggerLogItem['targetState'] = targetState;
                      triggerLogItem['targetValue'] = targetValue;
                      console.log(
                        `The state "${targetState}" is triggered by the trigger with id = "${id}" to ` +
                          `"${targetValue}" because the value of state "${stateId}" has changed to ` +
                          `"${thresholdValue}"!`,
                      );
                    }
                    setState(targetState, targetValue, (error) => {
                      if (threshold.log) {
                        triggerLogItem['success'] = !isDefined(error);
                        triggerLogItem['error'] = jsonStringify(error);
                        triggersLogsPushTo(triggerLogItem);
                      }
                      if (isDefined(error)) {
                        warns(
                          `Can't set value ${targetValue} to state ${targetState}! Error is - ${jsonStringify(error)}.`,
                        );
                      }
                    });
                  }
                };
                if (typeOf(timeRange, 'object')) timeRangeIsOk = triggerTimeRangeCheck(alertTimeStamp, timeRange);
                if (timeRangeIsOk) {
                  if (onTimeInterval) {
                    if (timerOn) {
                      let toClear;
                      if (isNumeric) {
                        let adjustment = 0;
                        if (storedValue > 0 && isBelow) {
                          adjustment = -1;
                        } else if (storedValue <= 0 && isAbove) {
                          adjustment = 1;
                        }
                        toClear = storedValue + adjustment === 0 && storedValue !== 0;
                      } else {
                        toClear = stateValue !== storedValue;
                      }
                      if (toClear) {
                        clearTimeout(timerOn);
                        thresholdsVariables.delete(idStoredTimer);
                        thresholdsVariables.delete(idStoredData);
                      }
                    } else {
                      let currentStatus = 0;
                      if (isNumeric) {
                        if (isBelow && onBelow) {
                          currentStatus = -1;
                        } else if (isAbove && onAbove) {
                          currentStatus = 1;
                        }
                      }
                      if (currentStatus !== 0 || isTriggered) {
                        const conditionsCheck = triggersCheckConditions(conditions);
                        if (threshold.log) {
                          triggerLogItem['conditions'] = conditionsCheck;
                        }
                        if (conditionsCheck.passed) {
                          thresholdsVariables.set(
                            idStoredData,
                            isNumeric ? currentStatus : [stateValue, stateValueOld],
                          );
                          thresholdsVariables.set(
                            idStoredTimer,
                            setTimeout(pushAlertOrTriggerState, onTimeInterval * 1000),
                          );
                        }
                      }
                    }
                  } else if (isBelow || isAbove || isTriggered) {
                    const conditionsCheck = triggersCheckConditions(conditions);
                    if (threshold.log) {
                      triggerLogItem['conditions'] = conditionsCheck;
                    }
                    if (conditionsCheck.passed) pushAlertOrTriggerState();
                  }
                }
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
        : telegramGenerateUserObjectFromId(Number(user));
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
    currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
        text: alertMessageAcknowledge,
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
    noInput = !typeOf(alertsMessages, 'array');
  alertsMessages = noInput ? alertGetMessages(user) : alertsMessages;
  oldestDate.setHours(oldestDate.getHours() - configOptions.getOption(cfgAlertMessagesHistoryDepth, user));
  const oldestDateNumber = oldestDate.valueOf();
  alertsMessages = typeOf(alertsMessages, 'array')
    ? // @ts-ignore
      alertsMessages.filter((alertsMessage) => alertsMessage.date > oldestDateNumber)
    : [];
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
    currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    currentAccessLevel = menuItemToProcess.accessLevel,
    options = menuItemToProcess.options,
    {mode, function: functionId, destination: destinationId, item: deviceId} = options,
    levelFirstId = isFunctionsFirst ? functionId : destinationId,
    levelSecondId = isFunctionsFirst ? destinationId : functionId,
    userId = mode === 'alerts' ? user.chatId : triggersInAlertsId;
  let alertsListPrepared = {},
    subMenu = [];
  if (typeOf(alertsList, 'object') && Object.keys(alertsList).length) {
    if (cachedValueExists(user, cachedAlertsListPrepared)) {
      alertsListPrepared = cachedValueGet(user, cachedAlertsListPrepared);
    } else {
      Object.keys(alertsList).forEach((alertId) => {
        if (alertsList[alertId].chatIds.has(userId) && existsObject(alertId)) {
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
        levelSecondEnum = isFunctionsFirst ? 'destination' : 'function',
        noDeviceId = !typeOf(deviceId, 'string');
      if ((!levelFirstId || isLevelFirstIdHolder) && !levelSecondId && noDeviceId) {
        const levelFirstProceed = [];
        Object.keys(levelFirstList)
          .filter((levelId) => levelFirstList[levelId].isEnabled && levelFirstList[levelId].isAvailable)
          .filter(
            (levelId) =>
              !levelFirstId || (isLevelFirstIdHolder && levelId !== levelFirstId && levelId.startsWith(levelFirstId)),
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
                  options: {[levelFirstEnum]: alertLevel, mode},
                  accessLevel: currentAccessLevel,
                  submenu: alertsMenuGenerateSubscribed,
                });
                levelFirstProceed.push(alertLevel);
              }
            }
          });
      }
      if (levelFirstId && (!levelSecondId || isLevelSecondIdHolder) && noDeviceId) {
        const levelSecondList = isFunctionsFirst ? destinationsList : functionsList,
          alertsSecondLevelList = alertsListPrepared[levelFirstId],
          levelSecondProceed = [];
        if (alertsSecondLevelList)
          Object.keys(levelSecondList)
            .filter((levelId) => levelSecondList[levelId].isEnabled && levelSecondList[levelId].isAvailable)
            .filter(
              (levelId) =>
                !levelSecondId ||
                (isLevelSecondIdHolder && levelId !== levelSecondId && levelId.startsWith(levelSecondId)),
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
                      mode,
                    },
                    accessLevel: currentAccessLevel,
                    submenu: alertsMenuGenerateSubscribed,
                  });
                  levelSecondProceed.push(alertLevel);
                }
              }
            });
      }
      if (levelFirstId && levelSecondId && noDeviceId) {
        const objectsIdList = alertsListPrepared[levelFirstId][levelSecondId];
        if (objectsIdList)
          Object.keys(objectsIdList)
            .sort() // NOSONAR
            .forEach((objectId) => {
              levelMenuIndex = subMenu.push({
                index: `${currentIndex}.${levelMenuIndex}`,
                name: `${objectsIdList[objectId]['name']}`,
                icon: menuItemToProcess.icon,
                accessLevel: currentAccessLevel,
                options: {function: functionId, destination: destinationId, item: objectId, mode},
                submenu: alertsMenuGenerateSubscribed,
              });
            });
      } else if (levelFirstId && levelSecondId) {
        let alertMenuIndex = 0;
        const alertsIdList = alertsListPrepared[levelFirstId][levelSecondId][deviceId],
          optionsToProcess = {...options, device: deviceId, attributes: 'all', buttons: 'show', details: true},
          generateAlertOrTriggerMenuItem = (user, _stateId, stateIdFull, stateObject, stateDetails, _options) => {
            if (alertsIdList.hasOwnProperty(stateIdFull)) {
              const stateIndex = `${currentIndex}.${alertMenuIndex}`,
                stateName = `${translationsGetObjectName(user, stateObject, functionId)}`,
                horizontalNavigation = !cachedValueExists(user, cachedTriggersDetails),
                stateOptions = {
                  function: functionId,
                  destination: destinationId,
                  state: stateIdFull,
                  [menuOptionHorizontalNavigation]: horizontalNavigation,
                };
              if (mode === 'alerts') {
                alertMenuIndex = subMenu.push(
                  alertsMenuItemGenerateSubscribedOn(user, stateIndex, stateName, stateOptions, stateObject, true),
                );
              } else {
                const itemStateSubType = triggersGetStateCommonType(stateIdFull, stateObject);
                if (itemStateSubType) {
                  alertMenuIndex = subMenu.push({
                    index: stateIndex,
                    name: stateName,
                    icons: triggersGetIcon,
                    options: {
                      ...stateOptions,
                      stateObject: objectInfoDeplete(stateObject),
                      dataType: dataTypeTrigger,
                      convertValueCode: stateDetails.convertValueCode,
                    },
                    submenu: triggersMenuGenerateManageState,
                  });
                }
              }
            }
          };
        enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsToProcess, generateAlertOrTriggerMenuItem);
      }
    }
  }
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
    currentStateAlertThresholds = currentStateAlert?.chatIds?.has(user.chatId)
      ? objectDeepClone(currentStateAlert.chatIds.get(user.chatId))
      : [],
    currentThresholds = cachedValueExists(user, cachedAlertThresholdSet)
      ? cachedValueGet(user, cachedAlertThresholdSet)
      : currentStateAlertThresholds;
  return returnBoth ? [currentThresholds, currentStateAlertThresholds] : currentThresholds;
}

/**
 * This function generate a menu item with related submenu to conduct an alert
 * subscription management for the appropriate ioBroker state (`itemState`).
 * @param {object} user - The user object.
 * @param {string} itemIndex - The positional index for new menu item.
 * @param {string} itemName - The name of the new menu item.
 * @param {object} options - The menu item object options.
 * @param {object=} stateObject - The related ioBroker state object (can be `undefined`).
 * @param {boolean=} isExtraMenu - The selector to show more detailed params.
 * @returns {object} Menu item object.
 */
function alertsMenuItemGenerateSubscribedOn(user, itemIndex, itemName, options, stateObject, isExtraMenu = false) {
  let menuItem;
  const stateId = options.state;
  if (!typeOf(stateObject, 'object')) stateObject = getObjectEnriched(stateId);
  if (stateObject?.hasOwnProperty('common') && stateObject.common) {
    const stateType = stateObject.common['type'];
    menuItem = {
      index: itemIndex,
      name: itemName,
      icons: alertsGetIcon,
      group: 'alerts',
      command: cmdAlertSubscribe,
      options: {
        ...options,
        dataType: dataTypeAlertSubscribed,
        type: stateType,
        stateObject: objectInfoDeplete(stateObject),
      },
    };
    let isNumericString = false;
    if (configOptions.getOption(cfgThresholdsForNumericString)) {
      if (stateType === 'string' && !stateObject.common.hasOwnProperty('states')) {
        const currentState = getState(stateId),
          currentStateValue = typeOf(currentState, 'object') ? currentState.val : undefined,
          currentStateNumeric = typeOf(currentState, 'object') ? Number(currentStateValue) : NaN;
        isNumericString =
          !isNaN(currentStateNumeric) &&
          `${currentStateNumeric}` === currentStateValue.slice(0, `${currentStateNumeric}`.length);
      }
    }
    if (
      stateType === 'boolean' ||
      (stateObject.common.hasOwnProperty('states') && ['string', 'number'].includes(stateType))
    ) {
      const alertDetails = alertsGetStateAlertDetailsOrThresholds(user, stateId),
        thresholdIndex = thresholdsGetIndex(alertDetails, thresholdEnumerable);
      menuItem['options']['id'] = thresholdEnumerable;
      if (isExtraMenu) {
        if (thresholdIndex >= 0) {
          menuItem['options']['mode'] = 'edit';
          menuItem['command'] = cmdEmptyCommand;
        } else {
          menuItem['options']['mode'] = 'add';
          menuItem['command'] = cmdItemSetValue;
          menuItem['options']['value'] = itemIndex;
        }
        menuItem['submenu'] = alertsMenuGenerateManageEnumerableStates;
        menuItem['text'] = alertsMenuItemThresholdDetails;
      } else {
        menuItem['submenu'] = [];
        menuItem['options']['mode'] = thresholdIndex >= 0 ? 'remove' : 'add';
      }
    } else if (stateType === 'number' || isNumericString) {
      menuItem['submenu'] = alertsMenuGenerateManageNumericStates;
      menuItem['command'] = cmdEmptyCommand;
    } else {
      menuItem = undefined;
    }
  }
  return menuItem;
}

function alertsMenuItemThresholdDetails(user, menuItemToProcess) {
  const options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId, id: thresholdId} = options,
    stateObject = typeOf(options.stateObject, 'object') ? options.stateObject : getObjectEnriched(stateId),
    alertDetails = alertsGetStateAlertDetailsOrThresholds(user, stateId),
    thresholdIndex = typeOf(thresholdId, 'string') ? thresholdsGetIndex(alertDetails, thresholdId) : -1,
    threshold = thresholdIndex >= 0 ? alertDetails[thresholdIndex] : {},
    secondsText = translationsItemTextGet(user, 'secondsShort'),
    itemAboveText = threshold.onAbove ? iconItemAbove : '',
    itemBelowText = threshold.onBelow ? iconItemBelow : '',
    thresholdAttributesArray = [
      {
        label: translationsItemTextGet(user, 'isEnabled'),
        value: menuIconGenerate(user, threshold.isEnabled),
      },
      {
        label: translationsItemTextGet(user, 'source'),
        value: '',
      },
      {
        label: ` ${translationsItemTextGet(user, 'function')}`,
        value: enumerationsItemName(user, dataTypeFunction, functionId),
      },

      {
        label: ` ${translationsItemTextGet(user, 'destination')}`,
        value: enumerationsItemName(user, dataTypeDestination, destinationId),
      },
      {
        label: ` ${translationsItemTextGet(user, 'device')}`,
        value: enumerationsGetDeviceName(user, stateId, functionId, destinationId),
      },
      {
        label: ` ${translationsItemTextGet(user, 'state')}`,
        value: translationsGetObjectName(user, stateId, functionId),
      },
    ],
    timeIntervalsIndividual = threshold[onTimeIntervalIndividualId];
  if (thresholdId !== thresholdEnumerable) {
    thresholdAttributesArray.push({
      label: ` ${translationsItemTextGet(user, 'value')}`,
      value:
        enumerationsStateValueDetails(user, stateObject, functionId, {val: threshold.value}) +
        '[' +
        itemAboveText +
        itemBelowText +
        ']',
    });
  }
  thresholdAttributesArray.push({
    label: translationsItemTextGet(user, onTimeIntervalId),
    value: `${typeOf(threshold[onTimeIntervalId], 'number') ? threshold[onTimeIntervalId] : 0} ${secondsText}`,
  });
  if (typeOf(timeIntervalsIndividual, 'map') && timeIntervalsIndividual.size > 0) {
    thresholdAttributesArray.push({
      label: translationsItemTextGet(user, onTimeIntervalIndividualId),
      value: '',
    });
    timeIntervalsIndividual.forEach((individualInterval, individualId) => {
      let label = '';
      if (thresholdId === thresholdEnumerable) {
        label = enumerationsStateValueDetails(user, stateId, functionId, {val: individualId});
      } else if (individualId === 'onAbove') {
        label = iconItemAbove;
      } else {
        label = iconItemBelow;
      }
      thresholdAttributesArray.push({
        label: ` ${label}`,
        value: `${individualInterval} ${secondsText}`,
      });
    });
  }
  thresholdAttributesArray.push({
    label: translationsItemTextGet(user, alertMessageTemplateId),
    value: typeOf(threshold[alertMessageTemplateId], 'string')
      ? threshold[alertMessageTemplateId]
      : translationsItemTextGet(user, 'global'),
  });
  return menuMenuItemDetailsPrintFixedLengthLines(user, thresholdAttributesArray);
}

/**
 * This function generates a submenu to manage thresholds, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateManageEnumerableStates(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentName = menuItemToProcess.name,
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId, id: thresholdId} = options,
    alerts = alertsGet(),
    alertIsOn = alerts?.hasOwnProperty(stateId) && alerts[stateId].chatIds.has(user.chatId),
    [alertDetails, alertDetailsCurrent] = alertsGetStateAlertDetailsOrThresholds(user, stateId, true),
    thresholdIndex = typeOf(thresholdId, 'string') ? thresholdsGetIndex(alertDetails, thresholdId) : -1,
    threshold = thresholdIndex >= 0 ? alertDetails[thresholdIndex] : {},
    currentOnTimeInterval = `${
      typeOf(threshold?.[onTimeIntervalId], 'number') ? threshold[onTimeIntervalId] : 0
    } ${translationsItemTextGet(user, 'secondsShort')}`,
    currentMessageTemplate = typeOf(threshold?.alertMessageTemplateId, 'string')
      ? threshold[alertMessageTemplateId]
      : configOptions.getOption(cfgAlertMessageTemplateMain, user),
    timeText = `${translationsItemTextGet(user, onTimeIntervalId)} (${currentOnTimeInterval})`;
  let subMenu = [],
    subMenuIndex = 0;
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateEditTime(user, currentIndex, subMenuIndex, timeText, '', {
      ...options,
      item: onTimeIntervalId,
      value: threshold?.[onTimeIntervalId],
      timeTemplate: 'ms',
      valueOptions: {
        ...options['valueOptions'],
        valueToDisplay: currentOnTimeInterval,
      },
    }),
  );
  subMenuIndex = subMenu.push({
    index: `${currentIndex}.${subMenuIndex}`,
    name: translationsItemTextGet(user, onTimeIntervalIndividualId),
    icon: iconItemEdit,
    options: {...options, item: onTimeIntervalIndividualId},
    submenu: alertsMenuGenerateManageTimeIndividual,
  });

  const templateOptions = {...options, item: alertMessageTemplateId, value: currentMessageTemplate},
    templateText = translationsItemTextGet(user, alertMessageTemplateId),
    templateIndex = `${currentIndex}.${subMenuIndex}`;

  const itemTemplate = {
    index: templateIndex,
    name: templateText,
    icon: iconItemEdit,
    group: alertMessageTemplateId,
    submenu: [menuMenuItemGenerateEditItem(user, templateIndex, 0, templateText, 'edit', templateOptions)],
  };
  if (threshold?.[alertMessageTemplateId]) {
    itemTemplate.submenu.push(menuMenuItemGenerateResetItem(user, templateIndex, 1, templateOptions));
  } else {
    itemTemplate.name += ` (${translationsItemTextGet(user, 'global')})`;
  }
  subMenuIndex = subMenu.push(itemTemplate);

  const isAlertDetailsSetChanged = jsonStringify(alertDetailsCurrent) !== jsonStringify(alertDetails);
  subMenuIndex = subMenu.push({
    index: `${currentIndex}.${subMenuIndex}`,
    name: `${currentName} (${alertIsOn && !isAlertDetailsSetChanged ? iconItemDelete : iconItemEdit})`,
    icons: alertsGetIcon,
    group: cmdItemsProcess,
    command: cmdAlertSubscribe,
    options: menuItemToProcess.options,
    submenu: [],
  });
  if (!isAlertDetailsSetChanged && alertIsOn) {
    subMenu.push(
      alertMenuItemGenerateAlertPropagation(user, currentIndex, subMenuIndex, stateId, functionId, destinationId),
    );
  }
  return subMenu;
}

/**
 * This function generates a submenu to manage individual time intervals for each possible value of 'boolean' or
 * 'enumerable' states and for crossing the thresholds, again individually, for the 'number' state.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateManageTimeIndividual(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, state: stateId, id: thresholdId, item} = options,
    alertDetails = alertsGetStateAlertDetailsOrThresholds(user, stateId),
    thresholdIndex = typeOf(thresholdId, 'string') ? thresholdsGetIndex(alertDetails, thresholdId) : -1,
    threshold = thresholdIndex >= 0 ? alertDetails[thresholdIndex] : {},
    stateObject = typeOf(options.stateObject, 'object') ? options.stateObject : getObjectEnriched(stateId),
    stateObjectCommon = stateObject?.common,
    stateType = options?.stateType ? options.stateType : stateObjectCommon?.['type'],
    timeIntervals = threshold?.[item] || new Map(),
    timeIntervalCommon = threshold?.[onTimeIntervalId] || 0,
    secondsText = translationsItemTextGet(user, 'secondsShort');
  let subMenu = [],
    subMenuIndex = 0,
    possibleValues;
  if (stateObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(stateType)) {
    possibleValues = enumerationsExtractPossibleValueStates(user, stateObject, functionId);
  } else if (stateType === 'boolean') {
    possibleValues = new Map([
      [true, enumerationsStateValueDetails(user, stateId, functionId, {val: true})],
      [false, enumerationsStateValueDetails(user, stateId, functionId, {val: false})],
    ]);
  } else {
    possibleValues = new Map([
      ['onAbove', iconItemAbove],
      ['onBelow', iconItemBelow],
    ]);
  }
  possibleValues.forEach((valueText, value) => {
    const timeInterval = timeIntervals.has(value) ? timeIntervals.get(value) : timeIntervalCommon,
      timeIntervalText = `${timeInterval} ${secondsText}`;
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateEditTime(user, currentIndex, subMenuIndex, valueText, '', {
        ...options,
        subItem: value,
        value: timeInterval,
        timeTemplate: 'ms',
        showValueInName: true,
        valueOptions: {
          ...options['valueOptions'],
          valueToDisplay: timeIntervalText,
        },
      }),
    );
  });
  return subMenu;
}

/**
 * This function generates a submenu to manage thresholds, on which the
 * alert subscription can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function alertsMenuGenerateManageNumericStates(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    currentName = menuItemToProcess.name,
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId} = options,
    stateObject = getObjectEnriched(stateId),
    stateUnitId = stateObject?.common?.unit ? ` ${stateObject.common.unit}` : '',
    [thresholds, currentStateThresholds] = alertsGetStateAlertDetailsOrThresholds(user, stateId, true);
  let subMenu = [],
    subMenuIndex = 0;
  if (typeOf(thresholds, 'array')) {
    thresholds.forEach((threshold) => {
      const thresholdValueText = enumerationsStateValueDetails(user, stateObject, functionId, {val: threshold.value}),
        onTimeInterval = `${
          threshold.hasOwnProperty(onTimeIntervalId) ? threshold[onTimeIntervalId] : 0
        } ${translationsItemTextGet(user, 'secondsShort')}`;
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${thresholdValueText} [${threshold.onAbove ? iconItemAbove : ''}${
          threshold.onBelow ? iconItemBelow : ''
        }](${onTimeInterval})`,
        icon: iconItemEdit,
        text: alertsMenuItemThresholdDetails,
        options: {...options, id: threshold.id, valueOption: {...options?.valueOptions, unit: stateUnitId}},
        submenu: alertsMenuGenerateManageThreshold,
      });
    });
  }
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateEditItemStateValue(
      user,
      currentIndex,
      subMenuIndex,
      `${translationsItemCoreGet(user, cmdItemAdd)}`,
      'addNew',
      {
        dataType: dataTypeAlertSubscribed,
        state: stateId,
        icon: iconItemPlus,
        type: alertThresholdId,
        value: undefined,
        valueOverride: true,
        mode: 'add',
      },
    ),
  );
  const isThresholdsSetChanged = jsonStringify(currentStateThresholds) !== jsonStringify(thresholds);
  if (isThresholdsSetChanged || (typeOf(currentStateThresholds, 'array') && currentStateThresholds.length)) {
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${currentName} (${isThresholdsSetChanged ? iconItemEdit : iconItemDelete})`,
      icons: alertsGetIcon,
      group: cmdItemsProcess,
      command: cmdAlertSubscribe,
      options: {function: functionId, destination: destinationId, state: stateId},
      submenu: [],
    });
  }
  if (!isThresholdsSetChanged && typeOf(currentStateThresholds, 'array') && currentStateThresholds.length) {
    subMenu.push(
      alertMenuItemGenerateAlertPropagation(user, currentIndex, subMenuIndex, stateId, functionId, destinationId),
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
function alertsMenuGenerateManageThreshold(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    {state: stateId, id} = menuItemToProcess.options,
    stateUnitId = typeOf(menuItemToProcess?.options?.valueOptions?.unit, 'string')
      ? menuItemToProcess.options.valueOptions.unit
      : '',
    thresholds = alertsGetStateAlertDetailsOrThresholds(user, stateId),
    thresholdIndex = thresholdsGetIndex(thresholds, id);
  let subMenu = [],
    subMenuIndex = 0;
  if (thresholdIndex >= 0) {
    const threshold = thresholds[thresholdIndex],
      thresholdValue = threshold.value,
      onTimeInterval = `${
        threshold.hasOwnProperty(onTimeIntervalId) ? threshold[onTimeIntervalId] : 0
      } ${translationsItemTextGet(user, 'secondsShort')}`,
      currentThresholdMessageTemplate = threshold.hasOwnProperty(alertMessageTemplateId)
        ? threshold[alertMessageTemplateId]
        : configOptions.getOption(cfgAlertMessageTemplateThreshold, user),
      thresholdOptions = {dataType: dataTypeAlertSubscribed, state: stateId, type: alertThresholdId, id, mode: 'edit'};
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateEditItemStateValue(
        user,
        currentIndex,
        subMenuIndex,
        `${thresholdValue}${stateUnitId}`,
        'value',
        {
          ...thresholdOptions,
          item: 'value',
          value: thresholdValue,
        },
      ),
    );
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${thresholdValue}${stateUnitId} ${iconItemAbove}`,
      icon: menuIconGenerate(user, threshold.onAbove),
      group: 'borders',
      command: threshold.onAbove === threshold.onBelow || !threshold.onAbove ? cmdItemPress : cmdNoOperation,
      options: {...thresholdOptions, item: 'onAbove'},
      submenu: [],
    });
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${thresholdValue}${stateUnitId} ${iconItemBelow}`,
      icon: menuIconGenerate(user, threshold.onBelow),
      group: 'borders',
      command: threshold.onAbove === threshold.onBelow || !threshold.onBelow ? cmdItemPress : cmdNoOperation,
      options: {...thresholdOptions, item: 'onBelow'},
      submenu: [],
    });
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateEditTime(
        user,
        currentIndex,
        subMenuIndex,
        `${translationsItemTextGet(user, onTimeIntervalId)} (${onTimeInterval})`,
        'thresholdOn',
        {
          ...thresholdOptions,
          item: onTimeIntervalId,
          value: threshold[onTimeIntervalId],
          timeTemplate: 'ms',
          valueOptions: {
            ...thresholdOptions.valueOptions,
            valueToDisplay: onTimeInterval,
          },
        },
      ),
    );
    if (threshold.onAbove === threshold.onBelow) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: translationsItemTextGet(user, onTimeIntervalIndividualId),
        icon: iconItemEdit,
        options: {...thresholdOptions, item: onTimeIntervalIndividualId},
        submenu: alertsMenuGenerateManageTimeIndividual,
      });
    }
    const templateOptions = {...thresholdOptions, item: alertMessageTemplateId, value: currentThresholdMessageTemplate},
      templateText = translationsItemTextGet(user, alertMessageTemplateId),
      templateIndex = `${currentIndex}.${subMenuIndex}`;

    const itemTemplate = {
      index: templateIndex,
      name: templateText,
      icon: iconItemEdit,
      group: alertMessageTemplateId,
      submenu: [menuMenuItemGenerateEditItem(user, templateIndex, 0, templateText, 'edit', templateOptions)],
    };
    if (threshold[alertMessageTemplateId]) {
      itemTemplate.submenu.push(menuMenuItemGenerateResetItem(user, templateIndex, 1, templateOptions));
    } else {
      itemTemplate.name += ` (${translationsItemTextGet(user, 'global')})`;
    }
    subMenuIndex = subMenu.push(itemTemplate);

    subMenu.push(menuMenuItemGenerateDeleteItem(user, currentIndex, subMenuIndex, thresholdOptions));
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
        user,
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
  cachedTriggersDetails = 'triggersDetails',
  triggersTimeRangeId = 'triggersTimeRange',
  triggersTimeRangeHours = 'hours',
  triggersTimeRangeHoursWithMinutes = 'hoursWithMinutes',
  triggersTimeRangeDaysOfWeek = 'daysOfWeek',
  triggersTimeRangeMonths = 'months',
  triggersTimeRangeQuarters = 'quarters',
  triggersTimeRangeSeasons = 'seasons',
  triggersTimeRangeMonthsWithDays = 'monthsWithDays',
  triggersTimeRangeAttributes = [
    triggersTimeRangeHours,
    triggersTimeRangeHoursWithMinutes,
    triggersTimeRangeMonths,
    triggersTimeRangeQuarters,
    triggersTimeRangeSeasons,
    triggersTimeRangeMonthsWithDays,
    triggersTimeRangeDaysOfWeek,
  ],
  triggersTimeRangeAttributesShort = [
    'hoursShort',
    'hoursWithMinutesShort',
    'monthsShort',
    'quartersShort',
    'seasonsShort',
    'monthsWithDaysShort',
    'daysOfWeekShort',
  ],
  triggersTimeRangeQuartersItems = {
    I: [1, 2, 3],
    II: [4, 5, 6],
    III: [7, 8, 9],
    IV: [10, 11, 12],
  },
  triggersTimeRangeSeasonsItems = {
    winter: [12, 1, 2],
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
  },
  triggersTimeRangeSeasonsItemsShort = ['winterShort', 'springShort', 'summerShort', 'autumnShort'],
  triggerTimeRangeStartTimes = 'startTimes',
  triggersIconsArray = [iconItemTrigger, iconItemDisabled],
  triggersConditionIconsArray = [iconItemCondition, iconItemDisabled],
  triggersConditionOperators = ['==', '!=', '> ', '>=', '<', '<='],
  triggersTimeRangeStartTimes = new Map(),
  triggersLogsStateFullId = `${prefixCacheStatesCommon}.${idTriggersLogs}`;

let triggersLogs = new Array();

cachedValuesStatesCommonAttributes[idTriggersLogs] = {
  name: 'List of previous(cached) values of states for alert subscription',
  type: 'json',
  read: true,
  write: true,
  role: 'list',
};

/**
 * This function loads the triggers journal from the cache.
 */
function triggersLogsInit() {
  if (existsState(triggersLogsStateFullId)) {
    const triggersLogsString = getState(triggersLogsStateFullId).val;
    if (typeOf(triggersLogsString, 'string')) {
      try {
        triggersLogs = jsonParse(triggersLogsString);
      } catch (e) {
        triggersLogs = new Array();
      }
    }
  }
}

/**
 * This function pushes the trigger log item to the cache.
 * @param {object} triggerLogItem - The trigger log item.
 */
function triggersLogsPushTo(triggerLogItem) {
  const maxLogsItems = configOptions.getOption(cfgTriggersLogsMaxCountRecordsPerTrigger);
  if (typeOf(triggerLogItem, 'object')) {
    triggersLogs.push(triggerLogItem);
    if (
      triggersLogs.filter((logItem) => {
        return logItem.triggerState === triggerLogItem.triggerState && logItem.triggerId === triggerLogItem.triggerId;
      }).length > maxLogsItems
    ) {
      const first = triggersLogs.findIndex(
        (logItem) =>
          logItem.triggerState === triggerLogItem.triggerState && logItem.triggerId === triggerLogItem.triggerId,
      );
      triggersLogs.splice(first, 1);
    }
    const stringValue = jsonStringify(triggersLogs);
    if (existsState(triggersLogsStateFullId)) {
      setState(triggersLogsStateFullId, stringValue, true);
    } else {
      createState(triggersLogsStateFullId, stringValue, cachedValuesStatesCommonAttributes[idTriggersLogs]);
    }
  }
}

/**
 * This function returns a state type, described in 'common' section of State object.
 * @param {string} stateId - The ID of ioBroker State.
 * @param {object=} stateObject - The State object, if provided.
 * @returns {string} The string, describes the State type.
 */
function triggersGetStateCommonType(stateId, stateObject) {
  let result = '';
  if (stateObject?.common) {
    const stateObjectCommon = stateObject.common,
      stateType = stateObjectCommon['type'];
    let isNumericString = false;
    if (configOptions.getOption(cfgThresholdsForNumericString)) {
      if (stateType === 'string' && !stateObjectCommon.hasOwnProperty('states')) {
        const currentState = getState(stateId),
          currentStateValue = typeOf(currentState, 'object') ? currentState.val : undefined,
          currentStateNumeric = typeOf(currentState, 'object') ? Number(currentStateValue) : NaN;
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, destination: destinationId} = options,
    currentAccessLevel = menuItemToProcess.accessLevel,
    horizontalNavigation = !cachedValueExists(user, cachedTriggersDetails);
  let subMenu = [],
    subMenuIndex = 0;
  const generateTriggersMenuItem = (user, _stateId, stateIdFull, stateObject, stateDetails, _options) => {
      if (stateObject?.common) {
        const itemStateSubType = triggersGetStateCommonType(stateIdFull, stateObject);
        if (itemStateSubType) {
          const stateIndex = `${currentIndex}.${subMenuIndex}`,
            stateName = `${translationsGetObjectName(user, stateObject, functionId)}`;
          subMenuIndex = subMenu.push({
            index: stateIndex,
            name: stateName,
            icons: triggersGetIcon,
            options: {
              dataType: dataTypeTrigger,
              function: functionId,
              destination: destinationId,
              state: stateIdFull,
              stateObject: objectInfoDeplete(stateObject),
              triggerType: stateObject.common?.type,
              convertValueCode: stateDetails.convertValueCode,
              [menuOptionHorizontalNavigation]: horizontalNavigation,
            },
            submenu: triggersMenuGenerateManageState,
          });
        }
      }
    },
    optionsToProcess = {...options, attributes: 'all', buttons: 'show', details: true};
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
    currentStateTriggers = currentStateAlert?.chatIds?.has(triggersInAlertsId)
      ? objectDeepClone(currentStateAlert.chatIds.get(triggersInAlertsId))
      : [],
    currentTriggers = cachedValueExists(user, cachedTriggersDetails)
      ? cachedValueGet(user, cachedTriggersDetails)
      : currentStateTriggers;
  return returnBoth ? [currentTriggers, currentStateTriggers] : currentTriggers;
}

/**
 * This function returned the index of Threshold or Trigger definition in Alert or Triggers definition for State.
 * @param {object[]} triggers - The array of Thresholds or Triggers definitions.
 * @param {string} triggerId - The Threshold or Trigger ID, depending on the Type of it.
 * @returns {number} The index of appropriate Threshold or Trigger. -1 if not found.
 */
function thresholdsGetIndex(triggers, triggerId) {
  if (triggers && typeOf(triggers, 'array')) {
    return triggers.findIndex((trigger) => trigger.id === triggerId);
  }
  return -1;
}

/**
 * This function returned the subIndex of triggers for an equal threshold value and onAbove/onBelow value.
 * @param {object[]} triggers - The array of Triggers definitions.
 * @param {string} triggerIdPrefix - The Trigger ID prefix, depending on the Type of it.
 * @returns {number} The index of appropriate Threshold or Trigger. -1 if not found.
 */
function triggersGetMaxSubIndex(triggers, triggerIdPrefix) {
  if (
    typeOf(triggers, 'array') &&
    triggers.length > 0 &&
    typeOf(triggerIdPrefix, 'string') &&
    triggerIdPrefix.length > 0
  ) {
    const triggersSubIndexes = triggers
      .filter((currentTrigger) => currentTrigger.id.startsWith(triggerIdPrefix))
      .map((currentTrigger) => (typeOf(currentTrigger.index, 'number') ? currentTrigger.index : 0));
    return triggersSubIndexes.length ? Math.max(...triggersSubIndexes) : -1;
  } else {
    return -1;
  }
}

/**
 * This function returns sorted array of Alert Thresholds or Triggers definitions.
 * Sorting rules depend on a type of items.
 * @param {object[]} thresholds - The array of Thresholds or Triggers definitions.
 * @param {any[]=} preSorted - The pre-sorted array as pattern for sorting.
 * @returns {object[]} The result sorted array of Thresholds or Triggers definitions.
 */
function triggersSort(thresholds, preSorted) {
  if (thresholds && typeOf(thresholds, 'array')) {
    thresholds = thresholds.sort((thresholdA, thresholdB) => {
      let result = 0;
      if (thresholdA.type === 'number') {
        result = thresholdA.value - thresholdB.value;
        if (result === 0) {
          if (thresholdA.onAbove) {
            result = thresholdB.onAbove ? 0 : -1;
          } else {
            result = thresholdB.onAbove ? 1 : 0;
          }
        }
      } else if (thresholdA.type === 'boolean') {
        if (thresholdA.value) {
          result = thresholdB.value ? 0 : -1;
        } else {
          result = thresholdB.value ? 1 : 0;
        }
      } else if (preSorted) {
        result = preSorted.indexOf(thresholdA.value) - preSorted.indexOf(thresholdB.value);
      } else if (typeOf(thresholdA.value, 'number')) {
        result = thresholdA.value - thresholdB.value;
      } else {
        result = thresholdA.value.localeCompare(thresholdB.value);
      }
      if (result === 0) {
        result = (thresholdA.index ? thresholdA.index : 0) - (thresholdB.index ? thresholdB.index : 0);
      }
      return result;
    });
  }
  return thresholds;
}

/**
 * This function returns an icon, which show  if the any trigger is enabled for an appropriate `state`.
 * @param {object} _user - The user object.
 * @param {object} menuItemToProcess - The menu item, for which the icon wil be identified.
 * @returns {string} The one of icon : `iconItemAlertOff` or `iconItemAlertOn`.
 */
function triggersGetIcon(_user, menuItemToProcess) {
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
  if (trigger) {
    if (trigger.isEnabled) {
      return iconItemTrigger;
    } else {
      return iconItemDisabled;
    }
  } else {
    return iconItemEmpty;
  }
}

/**
 * This function generates a submenu to manage triggers, which can be made for the appropriate menuItem.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageState(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {function: functionId, state: stateId, stateObject} = options;
  let subMenu = [],
    subMenuIndex = 0;
  if (stateObject?.common) {
    const stateObjectCommon = stateObject?.common ? stateObject.common : getObjectEnriched(stateId)?.common,
      stateType = stateObjectCommon?.type,
      stateUnits = stateObjectCommon?.unit ? ` ${stateObjectCommon.unit}` : '',
      [triggers, currentStateTriggers] = triggersGetStateTriggers(user, stateId, true);
    if (typeOf(triggers, 'array')) {
      triggers.forEach((trigger) => {
        const onTimeInterval = `${
            trigger.hasOwnProperty(onTimeIntervalId) ? trigger[onTimeIntervalId] : 0
          } ${translationsItemTextGet(user, 'secondsShort')}`,
          triggerId = trigger.id,
          triggerValue = trigger.value,
          triggerName = enumerationsStateValueDetails(user, stateObject, functionId, {val: triggerValue});
        let currentTriggerDetails = '';
        if (stateType === 'number') {
          if (trigger.onAbove) {
            currentTriggerDetails = ` [${iconItemAbove}]`;
          } else {
            currentTriggerDetails = ` [${iconItemBelow}]`;
          }
        }
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${triggerName}${currentTriggerDetails} (${onTimeInterval}, ${triggerTimeRangeShortDescription(
            user,
            trigger[triggersTimeRangeId],
          )})`,
          icon: triggersGetEnabledIcon(trigger),
          options: {...options, id: triggerId, stateUnits},
          text: triggersMenuItemDetailsTrigger,
          submenu: triggersMenuGenerateManageTrigger,
        });
      });
    }
    const possibleValueItem = menuMenuItemGenerateEditItemStateValue(
      user,
      currentIndex,
      subMenuIndex,
      `${translationsItemCoreGet(user, cmdItemAdd)}`,
      'addNew',
      {
        ...options,
        icon: iconItemPlus,
        showValueInName: true,
        valueOverride: true,
        booleanSelect: true,
        applyMode: true,
        mode: 'add',
      },
    );
    if (possibleValueItem) subMenuIndex = subMenu.push(possibleValueItem);
    const isTriggersSetChanged = jsonStringify(currentStateTriggers) !== jsonStringify(triggers);
    if (isTriggersSetChanged) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemMenuGet(user, 'apply')} [${iconItemTrigger}]`,
        icon: iconItemOk,
        group: cmdItemsProcess,
        command: cmdItemPress,
        options: {...options, mode: 'save'},
        submenu: [],
      });
    } else if (currentStateTriggers?.length) {
      subMenu.push(menuMenuItemGenerateDeleteItem(user, currentIndex, subMenuIndex, options));
    }
  }
  return subMenu;
}

/**
 * This function generates the sub Menu to provide possibility to edit all Trigger attributes.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageTrigger(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: stateId, stateObject, id: triggerId, stateUnits} = options,
    triggers = triggersGetStateTriggers(user, stateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId),
    stateObjectCommon = stateObject?.common ? stateObject.common : getObjectEnriched(stateId)?.common,
    stateType = stateObjectCommon?.type;
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
      {
        targetState: targetStateId,
        targetFunction: targetFunctionId,
        targetDestination: targetDestinationId,
        conditions,
        targetValue,
      } = trigger,
      triggerOptions = {
        ...options,
        mode: 'edit',
      };
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateBooleanItem(
        user,
        currentIndex,
        subMenuIndex,
        translationsItemTextGet(user, 'isEnabled'),
        '',
        {...triggerOptions, item: 'isEnabled', value: trigger.isEnabled, icons: triggersIconsArray},
      ),
    );
    if (stateType === 'number') {
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateEditItemStateValue(
          user,
          currentIndex,
          subMenuIndex,
          `${triggerValue}${stateUnits}`,
          'value',
          {
            ...triggerOptions,
            item: 'value',
            value: triggerValue,
          },
        ),
      );
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: iconItemAbove,
        icon: trigger.onAbove
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command: cmdItemPress,
        options: {...triggerOptions, item: 'onAbove'},
        submenu: [],
      });
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: iconItemBelow,
        icon: trigger.onBelow
          ? configOptions.getOption(cfgDefaultIconOn, user)
          : configOptions.getOption(cfgDefaultIconOff, user),
        group: 'borders',
        command: cmdItemPress,
        options: {...triggerOptions, item: 'onBelow'},
        submenu: [],
      });
    }
    subMenuIndex = subMenu.push(
      menuMenuItemGenerateEditTime(
        user,
        currentIndex,
        subMenuIndex,
        `${translationsItemTextGet(user, onTimeIntervalId)} (${onTimeInterval})`,
        'thresholdOn',
        {
          ...triggerOptions,
          item: onTimeIntervalId,
          value: trigger[onTimeIntervalId],
          timeTemplate: 'ms',
          valueOptions: {
            ...triggerOptions.valueOptions,
            valueToDisplay: onTimeInterval,
          },
        },
      ),
    );
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemTextGet(user, triggersTimeRangeId)} (${triggerTimeRangeShortDescription(
        user,
        trigger[triggersTimeRangeId],
      )})`,
      icon: iconItemClock,
      group: triggersTimeRangeId,
      options: {...triggerOptions, item: triggersTimeRangeId},
      submenu: triggersMenuGenerateManageTimeRange,
    });
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: translationsItemTextGet(user, 'conditions') +
        (typeOf(conditions, 'array') && conditions.length ? ` (${conditions.length})` : ''),
      icon: iconItemCondition,
      options: triggerOptions,
      submenu: triggersMenuItemGenerateManageConditions,
    });
    subMenuIndex = subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemTextGet(user, 'state')} [${
        targetStateId
          ? enumerationsGetDeviceName(user, targetStateId, targetFunctionId, targetDestinationId) +
            '/' +
            translationsGetObjectName(user, targetStateId, targetFunctionId)
          : iconItemNotFound
      }]`,
      icon: iconItemEdit,
      group: 'target',
      options: {...triggerOptions, value: targetStateId, item: 'targetState'},
      submenu: triggersMenuGenerateSelectTargetDevice,
    });
    if (targetStateId) {
      const targetObject = existsObject(targetStateId) ? getObjectEnriched(targetStateId) : undefined;
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateEditItemStateValue(
          user,
          currentIndex,
          subMenuIndex,
          `${translationsItemTextGet(user, 'setTo')}`,
          'target',
          {
            ...triggerOptions,
            triggerState: stateId,
            state: targetStateId,
            stateObject: objectInfoDeplete(targetObject),
            booleanSelect: true,
            includeCurrent: true,
            item: 'targetValue',
            showValueInName: true,
            valueOverride: true,
            value: targetValue,
            applyMode: true,
          },
        ),
      );
      const logText = translationsItemTextGet(user, 'log');
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateBooleanItem(user, currentIndex, subMenuIndex, logText, 'messageTo', {
          ...triggerOptions,
          item: 'log',
          value: trigger.log,
          icons: [configOptions.getOption(cfgDefaultIconOn, user), configOptions.getOption(cfgDefaultIconOff, user)],
        }),
      );
      const activeUsersList = usersInMenu.getUsers(undefined, true),
        activeUsers = new Map(),
        itemName = translationsItemMenuGet(user, 'usersList');
      if (activeUsersList.length) {
        activeUsersList.forEach((userId) => {
          activeUsers.set(userId, usersInMenu.getUserName(userId));
        });
        subMenuIndex = subMenu.push(
          menuMenuItemGenerateSelectItem(user, currentIndex, subMenuIndex, itemName, activeUsers, 'messageTo', {
            ...triggerOptions,
            icon: iconItemUser,
            showValueInName: true,
            item: 'users',
            values: typeOf(trigger.users, 'array') ? trigger.users : [],
            applyMode: true,
            valueOptions: {
              interimCalculationMode: interimCalculationSelectMultiple,
              showInApply: (value) => value.length ? `${value.map((userId) => usersInMenu.getUserName(userId))}` : '',
            }
          }),
        );
      }
      if (typeOf(trigger.users, 'array') && trigger.users.length > 0) {
        const templateOptions = {...triggerOptions, item: alertMessageTemplateId, value: messageTemplate},
          templateText = translationsItemTextGet(user, alertMessageTemplateId),
          templateIndex = `${currentIndex}.${subMenuIndex}`;

        const itemTemplate = {
          index: templateIndex,
          name: `${translationsItemTextGet(user, alertMessageTemplateId)}`,
          icon: iconItemEdit,
          group: alertMessageTemplateId,
          submenu: [menuMenuItemGenerateEditItem(user, templateIndex, 0, templateText, 'edit', templateOptions)],
        };
        if (trigger[alertMessageTemplateId]) {
          itemTemplate.submenu.push(menuMenuItemGenerateResetItem(user, templateIndex, 1, templateOptions));
        } else {
          itemTemplate.name += ` (${translationsItemTextGet(user, 'global')})`;
        }
        subMenuIndex = subMenu.push(itemTemplate);
      }
    }
    subMenu.push(menuMenuItemGenerateDeleteItem(user, `${currentIndex}.${subMenuIndex}`, subMenuIndex, triggerOptions));
  }
  return subMenu;
}

/**
 * This function generates the text description of the  current Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will be described.
 * @returns {string} - The description of the Trigger.
 */
function triggersMenuItemDetailsTrigger(user, menuItemToProcess) {
  const options = menuItemToProcess?.options?.extraOptions
      ? menuItemToProcess.options.extraOptions
      : menuItemToProcess.options,
    {function: functionId, destination: destinationId, state: stateId, id} = options;
  let text = '';
  if (options && stateId && typeOf(id, 'string')) {
    const triggers = triggersGetStateTriggers(user, stateId),
      triggerIndex = thresholdsGetIndex(triggers, id),
      trigger = triggers && triggerIndex >= 0 ? triggers[triggerIndex] : undefined;
    if (trigger) {
      const {
          targetState: targetStateId,
          targetFunction: targetFunctionId,
          targetDestination: targetDestinationId,
          targetValue,
        } = trigger,
        sourceStateDetails = {
          label: ` ${translationsGetObjectName(user, stateId, functionId)}`,
          value: enumerationsStateValueDetails(user, stateId, functionId, {val: trigger.value}),
        };
      if (typeOf(trigger.onAbove, 'boolean') && typeOf(trigger.onBelow, 'boolean')) {
        sourceStateDetails.value = `${trigger.onAbove ? '˃=' : '˂'} ${sourceStateDetails.value}`;
      }
      const triggerAttributesArray = [
        {
          label: translationsItemTextGet(user, 'source'),
          value: '',
        },
        {
          label: ` ${translationsItemTextGet(user, 'function')}`,
          value: enumerationsItemName(user, dataTypeFunction, functionId),
        },

        {
          label: ` ${translationsItemTextGet(user, 'destination')}`,
          value: enumerationsItemName(user, dataTypeDestination, destinationId),
        },
        {
          label: ` ${translationsItemTextGet(user, 'device')}`,
          value: enumerationsGetDeviceName(user, options.state, functionId, destinationId),
        },
        sourceStateDetails,
        {
          label: translationsItemTextGet(user, 'isEnabled'),
          value: triggersGetEnabledIcon(trigger),
        },
        {
          label: translationsItemTextGet(user, onTimeIntervalId),
          value: trigger[onTimeIntervalId],
        },
        {
          label: translationsItemTextGet(user, triggersTimeRangeId),
          value: triggerTimeRangeShortDescription(user, trigger[triggersTimeRangeId]),
        },
      ];
      if (typeOf(trigger.conditions, 'array') && trigger.conditions.length) {
        triggerAttributesArray.push({
          label: `${translationsItemTextGet(user, 'conditions')}`,
          value: `${trigger.conditions.length}`,
        });
        trigger.conditions.forEach((condition) => {
          triggerAttributesArray.push({
            label: ` ${triggersGetConditionShortDescription(user, condition)}`,
            value: menuIconGenerate(user, condition.isEnabled, triggersConditionIconsArray),
          });
        });
      }
      if (targetStateId && targetFunctionId) {
        const targetStateDetails = {
          label: ` ${translationsGetObjectName(user, targetStateId, targetFunctionId)}`,
          value: enumerationsStateValueDetails(user, targetStateId, targetFunctionId, {val: targetValue}),
        };
        triggerAttributesArray.push({
          label: translationsItemTextGet(user, 'target'),
          value: '',
        });
        triggerAttributesArray.push({
          label: ` ${translationsItemTextGet(user, 'function')}`,
          value: enumerationsItemName(user, dataTypeFunction, targetFunctionId),
        });
        triggerAttributesArray.push({
          label: ` ${translationsItemTextGet(user, 'destination')}`,
          value: enumerationsItemName(user, dataTypeDestination, targetDestinationId),
        });
        triggerAttributesArray.push({
          label: ` ${translationsItemTextGet(user, 'device')}`,
          value: enumerationsGetDeviceName(user, targetStateId, targetFunctionId, targetDestinationId),
        });
        triggerAttributesArray.push(targetStateDetails);
      }
      triggerAttributesArray.push(
        {
          label: translationsItemTextGet(user, 'messageTo'),
          value: '',
        },
        {
          label: ` ${translationsItemTextGet(user, 'log')}`,
          value: trigger.log
            ? configOptions.getOption(cfgDefaultIconOn, user)
            : configOptions.getOption(cfgDefaultIconOff, user),
        },
        {
          label: ` ${translationsItemMenuGet(user, 'usersList')}`,
          value:
            typeOf(trigger.users, 'array') && trigger.users.length
              ? `${trigger.users.map((userId) => usersInMenu.getUserName(userId))}`
              : '',
        },
      );
      text = menuMenuItemDetailsPrintFixedLengthLines(user, triggerAttributesArray);
    }
  }
  return text;
}

/**
 * This function generates the default values for the appropriate triggers TimeRange attribute.
 * @param {string} triggerTimeRangeAttributeId - The attribute Id.
 * @returns {any[]} - The description of the Trigger.
 */
function triggersTimeRangeAttributesGenerateDefaults(triggerTimeRangeAttributeId) {
  let triggerTimeRangeAttribute = [];
  switch (triggerTimeRangeAttributeId) {
    case triggersTimeRangeHours: {
      triggerTimeRangeAttribute = [...Array(24).keys()];
      break;
    }
    case triggersTimeRangeDaysOfWeek: {
      triggerTimeRangeAttribute = [...Array(8).keys()];
      triggerTimeRangeAttribute.shift();
      break;
    }
    case triggersTimeRangeMonths: {
      triggerTimeRangeAttribute = [...Array(13).keys()];
      triggerTimeRangeAttribute.shift();
      break;
    }
    case triggersTimeRangeQuarters:
    case triggersTimeRangeSeasons: {
      triggerTimeRangeAttribute = [...Array(5).keys()];
      triggerTimeRangeAttribute.shift();
      break;
    }
    case triggersTimeRangeHoursWithMinutes:
    case triggersTimeRangeMonthsWithDays: {
      triggerTimeRangeAttribute = [];
      break;
    }

    default: {
      break;
    }
  }
  return triggerTimeRangeAttribute;
}

/**
 * This function generates the sub Menu to manage Time Ranges for the appropriate Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageTimeRange(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: targetStateId, id: triggerId} = options,
    triggers = triggersGetStateTriggers(user, targetStateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      triggerTimeRange = typeOf(trigger[triggersTimeRangeId], 'object') ? trigger[triggersTimeRangeId] : {};
    triggersTimeRangeAttributes.forEach((timeRangeAttribute) => {
      const timeRangeAttributePossibleValues = new Map(),
        triggerHasTimeRangeAttribute = typeOf(triggerTimeRange[timeRangeAttribute], 'array'),
        timeRangeAttributeDefaultValues = triggersTimeRangeAttributesGenerateDefaults(timeRangeAttribute),
        timeRangeAttributeValues = triggerHasTimeRangeAttribute
          ? triggerTimeRange[timeRangeAttribute]
          : timeRangeAttributeDefaultValues;
      switch (timeRangeAttribute) {
        case triggersTimeRangeHours: {
          if (!isDefined(triggerTimeRange[triggersTimeRangeHoursWithMinutes])) {
            [...Array(24).keys()].forEach((hour) => {
              timeRangeAttributePossibleValues.set(hour, hour);
            });
          }
          break;
        }
        case triggersTimeRangeDaysOfWeek: {
          const localDaysOfWeek = getLocalDaysOfWeekNames(configOptions.getOption(cfgMenuLanguage, user), 'long');
          localDaysOfWeek.forEach((dayOfWeekName, dayOfWeek) => {
            timeRangeAttributePossibleValues.set(dayOfWeek + 1, dayOfWeekName);
          });
          break;
        }
        case triggersTimeRangeMonths: {
          if (
            !isDefined(triggerTimeRange[triggersTimeRangeMonthsWithDays]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeQuarters]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeSeasons])
          ) {
            const localMonths = getLocalMonthsNames(configOptions.getOption(cfgMenuLanguage, user), 'long');
            localMonths.forEach((monthName, month) => {
              timeRangeAttributePossibleValues.set(month + 1, monthName);
            });
          }
          break;
        }
        case triggersTimeRangeQuarters: {
          if (
            !isDefined(triggerTimeRange[triggersTimeRangeMonthsWithDays]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeMonths]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeSeasons])
          ) {
            Object.keys(triggersTimeRangeQuartersItems).forEach((quarter, index) => {
              timeRangeAttributePossibleValues.set(index + 1, quarter);
            });
          }
          break;
        }
        case triggersTimeRangeSeasons: {
          if (
            !isDefined(triggerTimeRange[triggersTimeRangeMonthsWithDays]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeMonths]) &&
            !isDefined(triggerTimeRange[triggersTimeRangeQuarters])
          ) {
            Object.keys(triggersTimeRangeSeasonsItems).forEach((season, index) => {
              timeRangeAttributePossibleValues.set(index + 1, translationsItemTextGet(user, season));
            });
          }
          break;
        }
        default:
          break;
      }
      const attributeValues = triggerHasTimeRangeAttribute
        ? ` (${triggerTimeRangeShortDescription(
            user,
            {[timeRangeAttribute]: triggerTimeRange[timeRangeAttribute]},
            true,
          )})`
        : '';
      if (timeRangeAttributePossibleValues.size > 0) {
        subMenuIndex = subMenu.push(
          menuMenuItemGenerateSelectItem(
            user,
            currentIndex,
            subMenuIndex,
            `${translationsItemTextGet(user, timeRangeAttribute)}${attributeValues}`,
            timeRangeAttributePossibleValues,
            timeRangeAttribute,
            {
              ...options,
              applyMode: true,
              values: timeRangeAttributeValues,
              subItem: timeRangeAttribute,
              valueOptions: {
                ...options.valueOptions,
                showInApply: (value) => triggerTimeRangeShortDescription(user, {[timeRangeAttribute]: value}, true),
                interimCalculationMode: interimCalculationSelectMultiple,
                valuesDefault: timeRangeAttributeDefaultValues,
              },
            },
          ),
        );
      } else if (
        (timeRangeAttribute === triggersTimeRangeHoursWithMinutes &&
          !isDefined(triggerTimeRange[triggersTimeRangeHours])) ||
        (timeRangeAttribute === triggersTimeRangeMonthsWithDays &&
          !isDefined(triggerTimeRange[triggersTimeRangeMonths]) &&
          !isDefined(triggerTimeRange[triggersTimeRangeQuarters]) &&
          !isDefined(triggerTimeRange[triggersTimeRangeSeasons]))
      ) {
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${translationsItemTextGet(user, timeRangeAttribute)}${attributeValues}`,
          icon: iconItemEdit,
          group: timeRangeAttribute,
          options: {...options, subItem: timeRangeAttribute},
          submenu: triggersMenuGenerateManageTimeRangeDeltasItems,
        });
      }
    });
  }
  return subMenu;
}

/**
 * This function generates the sub Menu to manage Time Range Delta attributes (Hours with Minutes or Months with Days)
 * for the appropriate Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageTimeRangeDeltasItems(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: targetStateId, id: triggerId, subItem: timeRangeAttribute} = options,
    triggers = triggersGetStateTriggers(user, targetStateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      triggerTimeRange = typeOf(trigger[triggersTimeRangeId], 'object') ? trigger[triggersTimeRangeId] : {},
      triggerHasTimeRangeAttribute = typeOf(triggerTimeRange[timeRangeAttribute], 'array'),
      timeRangeAttributeValues = triggerHasTimeRangeAttribute
        ? triggerTimeRange[timeRangeAttribute]
        : triggersTimeRangeAttributesGenerateDefaults(timeRangeAttribute),
      timeRangeAttributeValuesDetails = triggerTimeRangeShortDescription(
        user,
        {[timeRangeAttribute]: timeRangeAttributeValues},
        true,
      ).replace(/[[\]]/g, ''),
      timeRangeAttributeValuesDeltasDetails = timeRangeAttributeValuesDetails.split(',');
    timeRangeAttributeValues.forEach((_value, index) => {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: timeRangeAttributeValuesDeltasDetails[index],
        icon: iconItemEdit,
        group: timeRangeAttribute,
        options: {...options, subItem: timeRangeAttribute, index},
        submenu: triggersMenuGenerateManageTimeRangeDeltasValues,
      });
    });
    subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: translationsItemCoreGet(user, cmdItemAdd),
      icon: iconItemPlus,
      group: 'addNew',
      options: {...options, subItem: timeRangeAttribute, index: timeRangeAttributeValues.length},
      submenu: triggersMenuGenerateManageTimeRangeDeltasValues,
    });
  }
  return subMenu;
}

const cachedTriggersTimeRangeDelta = 'triggersTimeRangeDelta';

/**
 * This function converts the timeRangeDeltaItem to string.
 * @param {object} user - The user object.
 * @param {number[]} deltaItem - The timeRangeDeltaItem to convert.
 * @param {string} timeRangeAttribute - The timeRangeAttribute to convert.
 * @returns {string} - The string representation of timeRangeDeltaItem.
 */
function timeRangeDeltaItemToString(user, deltaItem, timeRangeAttribute) {
  let result = '';
  switch (timeRangeAttribute) {
    case triggersTimeRangeHoursWithMinutes: {
      result = deltaItem?.length === 2 ? deltaItem.map((item) => zeroPad(item, 2)).join(':') : '??:??';
      break;
    }

    case triggersTimeRangeMonthsWithDays: {
      if (deltaItem?.length === 2) {
        result = `${zeroPad(deltaItem[1], 2)} ${
          deltaItem[0]
            ? getLocalMonthsNames(configOptions.getOption(cfgMenuLanguage, user), 'short')[deltaItem[0] - 1]
            : '????'
        }`;
      } else {
        result = '?? ????';
      }
      break;
    }

    default: {
      break;
    }
  }
  return result;
}

/**
 * This function generates the sub Menu to manage Time Range Delta attribute values (Hours with Minutes or Months with
 * Days) for the appropriate Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageTimeRangeDeltasValues(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: targetStateId, id: triggerId, subItem: timeRangeAttribute, index: deltaIndex} = options,
    triggers = triggersGetStateTriggers(user, targetStateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      triggerTimeRange = typeOf(trigger[triggersTimeRangeId], 'object') ? trigger[triggersTimeRangeId] : {},
      triggerHasTimeRangeAttribute = typeOf(triggerTimeRange[timeRangeAttribute], 'array'),
      timeRangeAttributeValues = triggerHasTimeRangeAttribute
        ? triggerTimeRange[timeRangeAttribute]
        : triggersTimeRangeAttributesGenerateDefaults(timeRangeAttribute),
      isValueNew = deltaIndex >= timeRangeAttributeValues.length,
      deltaValue = isValueNew ? [[], []] : timeRangeAttributeValues[deltaIndex];
    const deltaValueCurrent = cachedValueExists(user, cachedTriggersTimeRangeDelta)
        ? cachedValueGet(user, cachedTriggersTimeRangeDelta)
        : deltaValue,
      timeTemplate = timeRangeAttribute === triggersTimeRangeHoursWithMinutes ? 'hm' : 'MD',
      multiplier = timeInternalPerUnitMultipliers[timeTemplate[0]][timeTemplate[1]];
    deltaValueCurrent.forEach((deltaValueItem, deltaValueIndex) => {
      const deltaValueItemDetails = timeRangeDeltaItemToString(user, deltaValueItem, timeRangeAttribute);
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateEditTime(user, currentIndex, subMenuIndex, deltaValueItemDetails, timeRangeAttribute, {
          ...options,
          replaceCommand: cmdItemPress,
          value: deltaValueItem.reduce((a, item, index) => a + item * (index ? 1 : multiplier), 0),
          subIndex: deltaValueIndex,
          timeMode:
            timeRangeAttribute === triggersTimeRangeHoursWithMinutes
              ? timeInternalModeInterval
              : timeInternalModeMonthAndDay,
          timeTemplate: timeTemplate,
          valueOptions: {
            ...options.valueOptions,
            valueToDisplay: deltaValueItemDetails,
          },
        }),
      );
    });
    if (
      jsonStringify(deltaValueCurrent) !== jsonStringify(deltaValue) &&
      deltaValueCurrent.reduce((a, item) => a + item.length, 0) === 4
    ) {
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: triggerTimeRangeShortDescription(user, {[timeRangeAttribute]: [deltaValueCurrent]}, true).replace(
          /[[\]]/g,
          '',
        ),
        group: `apply`,
        icon: iconItemOk,
        command: cmdItemPress,
        options: {
          ...options,
          value: deltaValueCurrent,
          backOnPress: !typeOf(options.backOnPress, 'boolean') || options.backOnPress,
          timeTemplate: timeTemplate,
        },
      });
    }
    if (!isValueNew) {
      subMenu.push(menuMenuItemGenerateDeleteItem(user, currentIndex, subMenuIndex, options));
    }
  }
  return subMenu;
}

/**
 * This function checks time of trigger generation against configured Time Range.
 * @param {Date} time - The time to check.
 * @param {object} timeRange - The Time Range attribute of trigger.
 * @returns {boolean} - The result of check.
 */
function triggerTimeRangeCheck(time, timeRange) {
  let result = true;
  if (typeOf(timeRange, 'object')) {
    triggersTimeRangeAttributes.forEach((timeRangeAttribute) => {
      if (timeRange.hasOwnProperty(timeRangeAttribute)) {
        if (result) {
          const allowedValues = timeRange[timeRangeAttribute];
          let valueToCheck;
          switch (timeRangeAttribute) {
            case triggersTimeRangeHours: {
              valueToCheck = time.getHours();
              break;
            }
            case triggersTimeRangeHoursWithMinutes: {
              valueToCheck = time.getHours() * 60 + time.getMinutes();
              break;
            }
            case triggersTimeRangeDaysOfWeek: {
              valueToCheck = time.getDay();
              if (valueToCheck === 0) valueToCheck = 7;
              break;
            }
            case triggersTimeRangeMonths: {
              valueToCheck = time.getMonth() + 1;
              break;
            }
            case triggersTimeRangeQuarters:
            case triggersTimeRangeSeasons: {
              const currentMonth = time.getMonth() + 1,
                items =
                  timeRangeAttribute === triggersTimeRangeQuarters
                    ? triggersTimeRangeQuartersItems
                    : triggersTimeRangeSeasonsItems;
              Object.values(items).forEach((item, index) => {
                if (item.includes(currentMonth)) valueToCheck = index + 1;
              });
              break;
            }
            case triggersTimeRangeMonthsWithDays: {
              valueToCheck = (time.getMonth() + 1) * 50 + time.getDate();
              break;
            }
            default:
              break;
          }
          if (typeOf(valueToCheck, 'number'))
            switch (timeRangeAttribute) {
              case triggersTimeRangeHours:
              case triggersTimeRangeDaysOfWeek:
              case triggersTimeRangeMonths:
              case triggersTimeRangeQuarters:
              case triggersTimeRangeSeasons: {
                result = allowedValues.includes(valueToCheck);
                break;
              }
              case triggersTimeRangeHoursWithMinutes:
              case triggersTimeRangeMonthsWithDays: {
                const multiplier = timeRangeAttribute === triggersTimeRangeHoursWithMinutes ? 60 : 50;
                result = allowedValues
                  .map((deltaValues) => {
                    return deltaValues.map((deltaValue) =>
                      deltaValue.reduce((a, item, index) => a + Number(item) * (index ? 1 : multiplier), 0),
                    );
                  })
                  .every((deltaValue) => {
                    let checkResult = false;
                    if (deltaValue[0] <= deltaValue[1]) {
                      checkResult = valueToCheck >= deltaValue[0] && valueToCheck <= deltaValue[1];
                    } else {
                      checkResult = valueToCheck >= deltaValue[0] || valueToCheck <= deltaValue[1];
                    }
                    return checkResult;
                  });
                break;
              }
              default: {
                break;
              }
            }
        }
      }
    });
  }
  return result;
}

/**
 * This function generates a short description of the Time Range attribute of the trigger.
 * @param {object} user - The user object.
 * @param {object} timeRange - The Time Range attribute of trigger.
 * @param {boolean=} withoutShortNames - The selector of output format.
 * @returns {string} - The short description of the Time Range.
 */
function triggerTimeRangeShortDescription(user, timeRange, withoutShortNames = false) {
  let result = '';
  if (typeOf(timeRange, 'object')) {
    triggersTimeRangeAttributes.forEach((timeRangeAttribute, attributeIndex) => {
      if (timeRange.hasOwnProperty(timeRangeAttribute)) {
        if (result) result += ';';
        if (!withoutShortNames)
          result += `${translationsItemTextGet(user, triggersTimeRangeAttributesShort[attributeIndex])}[`;
        switch (timeRangeAttribute) {
          case triggersTimeRangeHours:
          case triggersTimeRangeDaysOfWeek:
          case triggersTimeRangeMonths:
          case triggersTimeRangeQuarters:
          case triggersTimeRangeSeasons: {
            const timeRangeAttributeValues = timeRange[timeRangeAttribute],
              valueFirst = timeRangeAttributeValues[0];
            let lastValue = valueFirst,
              valuesLocalNames = [],
              lastValueLocalName = '';
            switch (timeRangeAttribute) {
              case triggersTimeRangeHours: {
                break;
              }
              case triggersTimeRangeDaysOfWeek: {
                valuesLocalNames = getLocalDaysOfWeekNames(configOptions.getOption(cfgMenuLanguage, user), 'short');
                break;
              }
              case triggersTimeRangeMonths: {
                valuesLocalNames = getLocalMonthsNames(configOptions.getOption(cfgMenuLanguage, user), 'short');
                break;
              }
              case triggersTimeRangeQuarters: {
                valuesLocalNames = Object.keys(triggersTimeRangeQuartersItems);
                break;
              }
              case triggersTimeRangeSeasons: {
                Object.keys(triggersTimeRangeSeasonsItemsShort).forEach((seasonShort) => {
                  valuesLocalNames.push(translationsItemTextGet(user, triggersTimeRangeSeasonsItemsShort[seasonShort]));
                });
                break;
              }
              default:
                break;
            }
            for (const value of timeRangeAttributeValues) {
              const valueLocalName =
                timeRangeAttribute === triggersTimeRangeHours ? value : valuesLocalNames[value - 1];
              lastValueLocalName =
                timeRangeAttribute === triggersTimeRangeHours ? lastValue : valuesLocalNames[lastValue - 1];
              if (value > valueFirst) {
                if (value - lastValue > 1) {
                  if (result.endsWith('..')) result += `${lastValueLocalName}`;
                  result += `,${valueLocalName}`;
                } else if (!result.endsWith('..')) result += '..';
              } else {
                result += `${valueLocalName}`;
              }
              lastValue = value;
            }
            if (result.endsWith('..')) {
              lastValueLocalName =
                timeRangeAttribute === triggersTimeRangeHours ? lastValue : valuesLocalNames[lastValue - 1];
              result += `${lastValueLocalName}`;
            }
            break;
          }

          case triggersTimeRangeHoursWithMinutes:
          case triggersTimeRangeMonthsWithDays: {
            const timeRangeAttributeValues = timeRange[timeRangeAttribute];
            timeRangeAttributeValues.forEach((deltaValue, index) => {
              if (index > 0) result += ',';
              result += '(';
              deltaValue.forEach((valueItem, index) => {
                if (index > 0) result += '-';
                result += timeRangeDeltaItemToString(user, valueItem, timeRangeAttribute);
              });
              result += ')';
            });
            break;
          }

          default: {
            break;
          }
        }
        if (!withoutShortNames) result += ']';
      }
    });
  } else {
    result = 'Any';
  }
  return result;
}

/**
 * This function generates an array of start times (i.e. string in schedule format of time,
 * when this trigger is starting to be applicable).
 * @param {object} timeRange - The Time Range attribute of trigger.
 * @returns {string[]} - The result array of the start times.
 */
function triggerTimeRangeGenerateStartTimes(timeRange) {
  const scheduleArray = [];
  let result = [];
  if (typeOf(timeRange, 'object')) {
    triggersTimeRangeAttributes.forEach((attribute) => {
      if (typeOf(timeRange[attribute], 'array')) {
        let timeRangeValues = timeRange[attribute];
        switch (attribute) {
          case triggersTimeRangeHours:
          case triggersTimeRangeMonths:
          case triggersTimeRangeDaysOfWeek:
          case triggersTimeRangeQuarters:
          case triggersTimeRangeSeasons: {
            if ([triggersTimeRangeQuarters, triggersTimeRangeSeasons].includes(attribute)) {
              const allowedValuesNew = [];
              timeRangeValues.forEach((value) => {
                const subValues =
                  attribute === triggersTimeRangeQuarters
                    ? Object.values(triggersTimeRangeQuartersItems)[value - 1]
                    : Object.values(triggersTimeRangeSeasonsItems)[value - 1];
                subValues.forEach((subValue) => {
                  allowedValuesNew.push(subValue);
                });
              });
              allowedValuesNew.sort((a, b) => a - b);
              timeRangeValues = allowedValuesNew;
            }
            const valueFirst = timeRangeValues[0],
              isItFirstAttribute = scheduleArray.length === 0;
            if (isItFirstAttribute) {
              switch (attribute) {
                case triggersTimeRangeHours: {
                  scheduleArray.push('0', '0');
                  break;
                }
                case triggersTimeRangeMonths:
                case triggersTimeRangeQuarters:
                case triggersTimeRangeSeasons: {
                  scheduleArray.push('0', '0', '0');
                  scheduleArray.push(typeOf(timeRange[triggersTimeRangeDaysOfWeek], 'array') ? '*' : '1');
                  break;
                }
                case triggersTimeRangeDaysOfWeek: {
                  scheduleArray.push('0', '0', '0', '*', '*');
                  break;
                }
                default: {
                  break;
                }
              }
            } else {
              switch (attribute) {
                case triggersTimeRangeMonths:
                case triggersTimeRangeQuarters:
                case triggersTimeRangeSeasons: {
                  scheduleArray.push('*');
                  break;
                }
                case triggersTimeRangeDaysOfWeek: {
                  if (scheduleArray.length === 3) {
                    scheduleArray.push('*', '*');
                  }
                  break;
                }
                default: {
                  break;
                }
              }
            }
            let attributeMask = '',
              lastValue = valueFirst;
            for (const value of timeRangeValues) {
              if (value - lastValue > 1 || value === valueFirst) {
                if (attributeMask.endsWith('-')) attributeMask += `${lastValue}`;
                attributeMask += `${attributeMask.length > 0 ? ',' : ''}${value}`;
              } else if (!isItFirstAttribute && !attributeMask.endsWith('-')) {
                attributeMask += '-';
              }
              lastValue = value;
            }
            if (attributeMask.endsWith('-')) attributeMask += `${lastValue}`;
            if (attributeMask.length === 0) attributeMask = '*';
            scheduleArray.push(attributeMask);
            break;
          }
          default: {
            break;
          }
        }
      }
    });
    const itemsCount = scheduleArray.length;
    for (let i = itemsCount; i < 6; i++) {
      scheduleArray.push('*');
    }
    result.push(scheduleArray);
    [triggersTimeRangeHoursWithMinutes, triggersTimeRangeMonthsWithDays].forEach((attribute) => {
      if (typeOf(timeRange[attribute], 'array')) {
        const timeRangeDeltas = timeRange[attribute],
          resultCopy = [...result],
          schedulePosition = attribute === triggersTimeRangeHoursWithMinutes ? 1 : 3,
          deltaValueBorderFirst = attribute === triggersTimeRangeHoursWithMinutes ? [0, 0] : [1, 1],
          deltaValueBorderLast = attribute === triggersTimeRangeHoursWithMinutes ? [23, 59] : [12, 31];
        result = [];
        resultCopy.forEach((scheduleArray) => {
          const scheduleArrayCopy = scheduleArray.map((item, index) =>
            index < schedulePosition && item === '*' ? '0' : item,
          );
          timeRangeDeltas.forEach((deltaValue) => {
            const scheduleArrayCopyFirst = [...scheduleArrayCopy],
              deltaValueFirst = deltaValue[0],
              previousScheduleItems = scheduleArrayCopy.slice(0, schedulePosition),
              isPreviousScheduleZero = previousScheduleItems.every((item) => item === '0');
            if (attribute === triggersTimeRangeHoursWithMinutes || isPreviousScheduleZero) {
              scheduleArrayCopy.splice(schedulePosition, 2, deltaValueFirst[1], deltaValueFirst[0]);
              result.push(scheduleArrayCopy);
            } else {
              const currentDeltas =
                deltaValue[0][0] < deltaValue[1][0] ||
                (deltaValue[0][0] === deltaValue[1][0] && deltaValue[0][1] <= deltaValue[1][1])
                  ? [deltaValue]
                  : [
                      [deltaValue[0], deltaValueBorderLast],
                      [deltaValueBorderFirst, deltaValue[1]],
                    ];
              currentDeltas.forEach((currentDelta) => {
                const currentDeltaFirst = currentDelta[0],
                  currentDeltaLast = currentDelta[1],
                  currentMin = attribute === triggersTimeRangeHoursWithMinutes ? 0 : 1,
                  currentMax =
                    attribute === triggersTimeRangeHoursWithMinutes
                      ? 59
                      : timeInternalDaysInMothsArray[currentDeltaFirst[0]];
                if (currentDeltaFirst[0] === currentDeltaLast[0]) {
                  scheduleArrayCopy.splice(
                    schedulePosition,
                    2,
                    currentDeltaFirst[1] === currentDeltaLast[1]
                      ? currentDeltaFirst[1]
                      : `${currentDeltaFirst[1]}-${currentDeltaLast[1]}`,
                    currentDeltaFirst[0],
                  );
                  result.push(scheduleArrayCopy);
                } else {
                  const scheduleArrayCopyMiddle = [...scheduleArrayCopyFirst],
                    scheduleArrayCopyLast = [...scheduleArrayCopyFirst];
                  scheduleArrayCopyFirst.splice(
                    schedulePosition,
                    2,
                    currentDeltaFirst[1] === currentMax
                      ? currentDeltaFirst[1]
                      : `${currentDeltaFirst[1]}-${currentMax}`,
                    currentDeltaFirst[0],
                  );
                  result.push(scheduleArrayCopyFirst);
                  if (currentDeltaLast[0] - currentDeltaFirst[0] > 1) {
                    scheduleArrayCopyMiddle.splice(
                      schedulePosition,
                      2,
                      '*',
                      currentDeltaLast[0] - currentDeltaFirst[0] > 2
                        ? `${currentDeltaFirst[0] + 1}-${currentDeltaLast[0] - 1}`
                        : currentDeltaFirst[0] + 1,
                    );
                    result.push(scheduleArrayCopyMiddle);
                  }
                  scheduleArrayCopyLast.splice(
                    schedulePosition,
                    2,
                    currentMin === currentDeltaLast[1] ? currentMin : `${currentMin}-${currentDeltaLast[1]}`,
                    currentDeltaLast[0],
                  );
                  result.push(scheduleArrayCopyLast);
                }
              });
            }
          });
        });
      }
    });
  }
  return result.map((item) => item.join(' '));
}

/**
 * This function generates an map of start times (i.e. string in schedule format of time,
 * when this trigger is starting to be applicable) with appropriate states and triggers definitions
 * to enable checks of trigger states on the triggers time range borders (pseudo "first run").
 * @param {object=} user - The user object.
 * @param {string=} stateFullId - The appropriate state full Id or empty for all.
 */
function triggersTimeRangeStartTimesUpdate(user = {userId: 0}, stateFullId = 'all') {
  const updateOneState = stateFullId !== 'all',
    statesToUpdate = updateOneState ? [stateFullId] : Object.keys(alertsGet()),
    startTimesDeleted = [],
    startTimesNew = [];
  statesToUpdate.forEach((stateId) => {
    const [triggers, triggersOld] = updateOneState
      ? triggersGetStateTriggers(user, stateId, true)
      : [triggersGetStateTriggers(user, stateId), []];
    if (triggers.length + triggersOld.length > 0) {
      triggersOld.forEach((triggerOld) => {
        if (triggerOld.isEnabled) {
          const startTimesOld = triggerOld?.[triggersTimeRangeId]?.[triggerTimeRangeStartTimes];
          if (typeOf(startTimesOld, 'array')) {
            startTimesOld.forEach((startTimeOld) => {
              const triggersFiltered = triggers.filter(
                (trigger) =>
                  trigger.isEnabled &&
                  typeOf(trigger?.[triggersTimeRangeId]?.[triggerTimeRangeStartTimes], 'array') &&
                  trigger[triggersTimeRangeId][triggerTimeRangeStartTimes].includes(startTimeOld),
              );
              if (triggersFiltered.length === 0) {
                if (triggersTimeRangeStartTimes.has(startTimeOld)) {
                  const startTimeSchedule = triggersTimeRangeStartTimes.get(startTimeOld);
                  if (startTimeSchedule.thresholds?.length === 1) {
                    startTimeSchedule.thresholds = [];
                    if (!startTimesDeleted.includes(startTimeOld)) startTimesDeleted.push(startTimeOld);
                  } else {
                    startTimeSchedule.thresholds = startTimeSchedule.filter(
                      (startTime) => startTime.stateId !== stateId,
                    );
                  }
                }
              }
            });
          }
        }
      });
      const startTimesActual = [];
      triggers.forEach((trigger) => {
        if (trigger.isEnabled) {
          const startTimes = trigger?.[triggersTimeRangeId]?.[triggerTimeRangeStartTimes];
          if (typeOf(startTimes, 'array')) {
            startTimes.forEach((startTime) => {
              if (!startTimesActual.includes(startTime)) startTimesActual.push(startTime);
              const startTimeSchedule = triggersTimeRangeStartTimes.has(startTime)
                  ? triggersTimeRangeStartTimes.get(startTime)
                  : {thresholds: []},
                startTimeThresholds = startTimeSchedule.thresholds,
                startTimesThresholdsFiltered =
                  startTimeThresholds.length === 0
                    ? startTimeThresholds
                    : startTimeThresholds.filter((item) => {
                        let result = item.stateId === stateId;
                        if (result) result = item.value === trigger.value;
                        if (result) result = item.onAbove === trigger.onAbove;
                        if (result) result = item.onBelow === trigger.onBelow;
                        return result;
                      });
              if (startTimesThresholdsFiltered.length === 0) {
                if (startTimeThresholds.length === 0) {
                  if (!startTimesNew.includes(startTime)) startTimesNew.push(startTime);
                  if (!triggersTimeRangeStartTimes.has(startTime))
                    triggersTimeRangeStartTimes.set(startTime, startTimeSchedule);
                }
                startTimeThresholds.push({
                  stateId: stateId,
                  value: trigger.value,
                  onAbove: trigger.onAbove,
                  onBelow: trigger.onBelow,
                });
              }
            });
          }
        }
      });
      startTimesActual.forEach((startTime) => {
        if (triggersTimeRangeStartTimes.has(startTime)) {
          const startTimeThresholds = triggersTimeRangeStartTimes.get(startTime).thresholds;
          startTimeThresholds
            .filter((item) => item.stateId === stateId)
            .forEach((item) => {
              const triggersFiltered = triggers.filter((trigger) => {
                return (
                  trigger.isEnabled &&
                  typeOf(trigger?.[triggersTimeRangeId]?.[triggerTimeRangeStartTimes], 'array') &&
                  trigger[triggersTimeRangeId][triggerTimeRangeStartTimes].includes(startTime) &&
                  item.value === trigger.value &&
                  item.onAbove === trigger.onAbove &&
                  item.onBelow === trigger.onBelow
                );
              });
              if (triggersFiltered.length === 0) {
                startTimeThresholds.splice(
                  startTimeThresholds.findIndex((itemToCheck) => {
                    return (
                      item.stateId === itemToCheck.stateId &&
                      item.value === itemToCheck.value &&
                      item.onAbove === itemToCheck.onAbove &&
                      item.onBelow === itemToCheck.onBelow
                    );
                  }),
                  1,
                );
              }
            });
          if (startTimeThresholds.length === 0 && !startTimesDeleted.includes(startTime))
            startTimesDeleted.push(startTime);
        }
      });
    }
  });
  startTimesDeleted.forEach((startTime) => {
    if (triggersTimeRangeStartTimes.has(startTime)) {
      const startTimeSchedule = triggersTimeRangeStartTimes.get(startTime);
      if (isDefined(startTimeSchedule.scheduleId)) clearSchedule(startTimeSchedule.scheduleId);
      triggersTimeRangeStartTimes.delete(startTime);
    }
  });
  startTimesNew.forEach((startTime) => {
    if (triggersTimeRangeStartTimes.has(startTime)) {
      const startTimeSchedule = triggersTimeRangeStartTimes.get(startTime);
      startTimeSchedule.scheduleId = schedule(startTime, () => {
        triggersTimeRangeStartTimeScheduled(startTime);
      });
    }
  });
}

/**
 * This function emulates the threshold crossing on Time Range "start time" point for a trigger..
 * @param {string} startTime - The appropriate schedule string.
 */
function triggersTimeRangeStartTimeScheduled(startTime) {
  if (triggersTimeRangeStartTimes.has(startTime)) {
    const schedule = triggersTimeRangeStartTimes.get(startTime),
      thresholds = schedule.thresholds;
    thresholds.forEach((threshold) => {
      const {stateId, value, onAbove, onBelow} = threshold,
        triggerState = getState(stateId);
      if (isDefined(triggerState?.val)) {
        const currentValue = triggerState.val,
          isBooleanOrList = !(typeOf(onAbove, 'boolean') || typeOf(onBelow, 'boolean'));
        if (isBooleanOrList || (onAbove && currentValue >= value) || (onBelow && currentValue < value)) {
          let oldValue = currentValue;
          if (onAbove) {
            oldValue = value * 0.99;
          } else if (onBelow) {
            oldValue = value * 1.01;
          }
          const thresholdObject = {
            id: stateId,
            state: {val: currentValue},
            oldState: {val: oldValue},
            isEmulatedForTriggers: true,
          };
          alertsActionOnSubscribedState(thresholdObject);
        }
      }
    });
  }
}

/**
 * This function generates Menu item with sub menu with all Conditions of current Trigger.
* @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuItemGenerateManageConditions(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: triggerStateId, id: triggerId} = options,
    triggers = triggersGetStateTriggers(user, triggerStateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      conditions = trigger.conditions;
    if (conditions && typeOf(conditions, 'array') && conditions.length) {
      conditions.forEach((condition) => {
        const {isEnabled} = condition;
        subMenuIndex = subMenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: triggersGetConditionShortDescription(user, condition),
          icon: menuIconGenerate(user, isEnabled, triggersConditionIconsArray),
          options: {...options, item: 'conditions', index: subMenuIndex},
          text: triggersMenuItemDetailsCondition,
          submenu: triggersMenuGenerateManageCondition,
        });
      });
    }
    subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
      icon: iconItemPlus,
      group: cmdItemAdd,
      options: {...options, item: 'conditions', index: subMenuIndex, subItem: 'state'},
      submenu: triggersMenuGenerateSelectTargetDevice,
    });
  }
  return subMenu;
}

/**
 * This function generates a short descriptions of current Condition for the Trigger.
 * @param {object} user - The user object.
 * @param {object} condition - The current condition.
 * @returns {string} - The condition description.
 */
function triggersGetConditionShortDescription(user, condition) {
  let text = '';
  if (condition) {
    const {state: stateId, function: functionId, destination: destinationId, operator, value} = condition;
    text += enumerationsGetDeviceName(user, stateId, functionId, destinationId);
    text += `:${translationsGetObjectName(user, stateId, functionId)}`;
    text += ` ${typeOf(operator, 'string') ? operator : ''}`;
    text += ` ${isDefined(value) ? enumerationsStateValueDetails(user, stateId, functionId, {val: value}) : ''}`;
  }
  return text;
}

/**
 * This function generates the sub Menu with all Conditions for the appropriate Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateManageCondition(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    {state: triggerStateId, id: triggerId, index} = options,
    triggers = triggersGetStateTriggers(user, triggerStateId),
    triggerIndex = thresholdsGetIndex(triggers, triggerId);
  let subMenu = [],
    subMenuIndex = 0;
  if (triggerIndex >= 0) {
    const trigger = triggers[triggerIndex],
      conditions = trigger.conditions;
    if (conditions && typeOf(conditions, 'array') && conditions.length && index <= conditions.length) {
      const {
        isEnabled,
        state: stateId,
        function: functionId,
        destination: destinationId,
        operator,
        value,
      } = conditions[index];
      subMenuIndex = subMenu.push(
        menuMenuItemGenerateBooleanItem(
          user,
          currentIndex,
          subMenuIndex,
          translationsItemTextGet(user, 'isEnabled'),
          '',
          {...options, subItem: 'isEnabled', value: isEnabled, icons: triggersConditionIconsArray},
        ),
      );
      subMenuIndex = subMenu.push({
        index: `${currentIndex}.${subMenuIndex}`,
        name: `${translationsItemTextGet(user, 'state')} [${
          stateId
            ? enumerationsGetDeviceName(user, stateId, functionId, destinationId) +
              '/' +
              translationsGetObjectName(user, stateId, functionId)
            : iconItemNotFound
        }]`,
        icon: iconItemEdit,
        group: 'state',
        options: {...options, value: stateId, subItem: 'state'},
        submenu: triggersMenuGenerateSelectTargetDevice,
      });
      if (stateId) {
        const stateObject = existsObject(stateId) ? getObjectEnriched(stateId) : undefined,
          targetSubType = triggersGetStateCommonType(stateId, stateObject),
          operatorName = translationsItemTextGet(user, 'operator'),
          operatorsMap = new Map();
        // prettier-ignore
        triggersConditionOperators.slice(0, targetSubType !== 'number' ? 2 : undefined).forEach((operator) => { // NOSONAR
          operatorsMap.set(operator, operator);
        });
        subMenuIndex = subMenu.push(
          menuMenuItemGenerateSelectItem(user, currentIndex, subMenuIndex, operatorName, operatorsMap, 'operator', {
            ...options,
            icon: '',
            sorted: triggersConditionOperators,
            subItem: 'operator',
            value: operator,
            applyMode: true,
            showValueInName: true,
          }),
        );
        const valueItem = menuMenuItemGenerateEditItemStateValue(
          user,
          currentIndex,
          subMenuIndex,
          translationsItemTextGet(user, 'value'),
          'value',
          {
            ...options,
            triggerState: triggerStateId,
            state: stateId,
            stateObject: objectInfoDeplete(stateObject),
            booleanSelect: true,
            includeCurrent: true,
            subItem: 'value',
            showValueInName: true,
            value: value,
            valueOverride: true,
            applyMode: true,
            backOnPress: true,
          },
        );
        if (valueItem) subMenu.push(valueItem);
      }
    }
  }
  return subMenu;
}

/**
 * This function generates the text description of the current Condition.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will be described.
 * @returns {string} - The description of the Trigger.
 */
function triggersMenuItemDetailsCondition(user, menuItemToProcess) {
  const options = menuItemToProcess?.options?.extraOptions
      ? menuItemToProcess.options.extraOptions
      : menuItemToProcess.options,
    {state: triggerStateId, id, item, index} = options;
  let text = '';
  if (options && triggerStateId && typeOf(id, 'string')) {
    const triggers = triggersGetStateTriggers(user, triggerStateId),
      triggerIndex = thresholdsGetIndex(triggers, id),
      trigger = triggers && triggerIndex >= 0 ? triggers[triggerIndex] : undefined;
    if (trigger && item === 'conditions' && typeOf(index, 'number') && trigger.conditions) {
      const conditions = trigger.conditions;
      if (typeOf(conditions, 'array') && index < conditions.length) {
        const condition = conditions[index],
          {isEnabled, state: stateId, function: functionId, destination: destinationId, operator, value} = condition,
          conditionAttributesArray = [
            {
              label: translationsItemTextGet(user, 'isEnabled'),
              value: menuIconGenerate(user, isEnabled, triggersConditionIconsArray),
            },
            {
              label: ` ${translationsItemTextGet(user, 'function')}`,
              value: enumerationsItemName(user, dataTypeFunction, functionId),
            },
            {
              label: ` ${translationsItemTextGet(user, 'destination')}`,
              value: enumerationsItemName(user, dataTypeDestination, destinationId),
            },
            {
              label: ` ${translationsItemTextGet(user, 'device')}`,
              value: enumerationsGetDeviceName(user, stateId, functionId, destinationId),
            },
            {
              label: ` ${translationsItemTextGet(user, 'state')}`,
              value: translationsGetObjectName(user, stateId, functionId),
            },
            {
              label: ` ${translationsItemTextGet(user, 'operator')}`,
              value: typeOf(operator, 'string') ? operator : '',
            },
            {
              label: ` ${translationsItemTextGet(user, 'value')}`,
              value: isDefined(value) ? enumerationsStateValueDetails(user, stateId, functionId, {val: value}) : '',
            },
          ];
        text = `${menuMenuItemDetailsPrintFixedLengthLines(user, conditionAttributesArray)}`;
      }
    }
  }
  return text;
}

/**
 * This function generates the sub Menu to go thru all Menu to select any State of any Device.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateSelectTargetDevice(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = menuItemToProcess.options,
    enumerationsMenu = menuMenuItemGenerateRootMenu(user, 'enumerationsOnly'),
    subMenu = enumerationsMenu ? enumerationsMenu.submenu : [],
    convertDevice = (device) => {
      if (options.item === 'conditions') {
        device.function = triggersMenuItemDetailsCondition;
      } else {
        device.function = triggersMenuItemDetailsTrigger;
      }
      device.submenu = triggersMenuGenerateSelectTargetState;
      return device;
    };
  return menuMenuReIndex(subMenu, currentIndex, {...options, currentIndex, deviceFunction: convertDevice});
}

/**
 * This function generates the sub Menu for any Device from Menu, to select their States as target for Trigger.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function triggersMenuGenerateSelectTargetState(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
          icon: iconItemEmpty,
          command: cmdItemPress,
          options: {...extraOptions, function: functionId, destination: destinationId, value: stateIdFull},
          submenu: [],
        });
      }
    },
    optionsToProcess = {...options, attributes: 'all', buttons: 'show'};
  enumerationsProcessDeviceStatesList(user, currentAccessLevel, optionsToProcess, generateDeviceStateMenuItem);
  return subMenu;
}

/**
 * This function go thru the Trigger Conditions array, and made an appropriate checks.
 * @param {object[]} conditions - The array of conditions.
 * @returns {object} The object with all passed check details and one mandatory attribute `result` - the result of all
 * checks. If one check will be false - result will be false too.
 */
function triggersCheckConditions(conditions) {
  let result = {
    passed: true,
    checked: new Array(),
  };
  if (typeOf(conditions, 'array')) {
    result['passed'] = conditions.every((condition) => {
      let check = true;
      if (condition?.isEnabled) {
        check = false;
        if (existsState(condition.state)) {
          const {state, operator, value} = condition,
            stateValue = getState(state);
          if (stateValue && isDefined(stateValue.val)) {
            const valueCurrent = stateValue.val;
            switch (operator) {
              case '==': {
                check = valueCurrent == value;
                break;
              }
              case '!=': {
                check = valueCurrent != value;
                break;
              }
              case '>': {
                check = valueCurrent > value;
                break;
              }
              case '>=': {
                check = valueCurrent >= value;
                break;
              }
              case '<': {
                check = valueCurrent < value;
                break;
              }
              case '<=': {
                check = valueCurrent <= value;
                break;
              }
            }
            result['checked'].push({
              function: condition.function,
              destination: condition.destination,
              state: state,
              valueCurrent: valueCurrent,
              operator: operator,
              value: value,
              result: check,
            });
          }
        }
      }
      return check;
    });
  }
  return result;
}

/**
 * This function generates a submenus with appropriate inheritance levels for all Triggers Logs.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]}  Newly generated submenu.
 */
function triggersMenuGenerateTriggersLogs(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    options = typeOf(menuItemToProcess.options, 'object') ? menuItemToProcess.options : {},
    {state: triggerStateId, id: triggerId, function: functionId, destination: destinationId, item} = options,
    functionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    isFunctionDefined = typeOf(functionId, 'string'),
    isDestinationDefined = typeOf(destinationId, 'string');
  let subMenu = [],
    subMenuIndex = 0;
  if (triggersLogs.length && !typeOf(item, 'object')) {
    if (typeOf(triggerStateId, 'string') && typeOf(triggerId, 'string')) {
      const triggerLogs = triggersLogs
          .filter((logItem) => logItem.triggerState === triggerStateId && logItem.triggerId === triggerId)
          .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
        template = configOptions.getOption(cfgDateTimeTemplate, user),
        iconOn = configOptions.getOption(cfgDefaultIconOn, user),
        iconOff = configOptions.getOption(cfgDefaultIconOff, user);
      if (triggerLogs.length) {
        triggerLogs.forEach((logItem) => {
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: formatDate(logItem.date, template),
            icon: logItem.success ? iconOn : iconOff,
            text: triggersMenuTriggersLogsItemDetails,
            options: {...options, item: logItem},
            submenu: triggersMenuGenerateTriggersLogs,
          });
        });
      }
    } else if (typeOf(triggerStateId, 'string')) {
      const triggerLogs = triggersLogs.filter((logItem) => logItem.triggerState === triggerStateId),
        triggerLogsIds = new Set(triggerLogs.map((logItem) => logItem.triggerId)),
        triggers = triggersGetStateTriggers(user, triggerStateId);
      if (triggerLogsIds.size) {
        triggerLogsIds.forEach((triggerId) => {
          const triggerIndex = thresholdsGetIndex(triggers, triggerId),
            trigger = triggers && triggerIndex >= 0 ? triggers[triggerIndex] : undefined;
          if (typeOf(trigger, 'object')) {
            const triggerValue = enumerationsStateValueDetails(user, triggerStateId, functionId, {val: trigger.value});
            let itemName = `${translationsGetObjectName(user, triggerStateId, functionId)}: `;
            if (typeOf(trigger.onAbove, 'boolean') && typeOf(trigger.onBelow, 'boolean')) {
              itemName += `${trigger.onAbove ? '˃=' : '˂'} ${triggerValue}`;
            } else {
              itemName += `${triggerValue}`;
            }
            subMenuIndex = subMenu.push({
              index: `${currentIndex}.${subMenuIndex}`,
              name: itemName,
              icon: iconItemTrigger,
              text: triggersMenuTriggersLogsItemDetails,
              options: {...options, id: triggerId},
              submenu: triggersMenuGenerateTriggersLogs,
            });
          }
        });
      }
    } else {
      let triggersLogsThisLevelItems,
        thisLevelItemsId = '';
      const triggersLogsFiltered = triggersLogs.filter(
        (logItem) =>
          ((isFunctionDefined && logItem.triggerFunction === functionId) || !isFunctionDefined) &&
          ((isDestinationDefined && logItem.triggerDestination === destinationId) || !isDestinationDefined),
      );
      if (!isDestinationDefined && ((functionsFirst && isFunctionDefined) || !functionsFirst)) {
        triggersLogsThisLevelItems = new Set(triggersLogsFiltered.map((logItem) => logItem.triggerDestination));
        thisLevelItemsId = 'destination';
      } else if (!isFunctionDefined) {
        triggersLogsThisLevelItems = new Set(triggersLogsFiltered.map((logItem) => logItem.triggerFunction));
        thisLevelItemsId = 'function';
      } else {
        triggersLogsThisLevelItems = new Set(triggersLogsFiltered.map((logItem) => logItem.triggerState));
        thisLevelItemsId = 'state';
      }
      if (triggersLogsThisLevelItems.size) {
        triggersLogsThisLevelItems.forEach((thisLevelItemId) => {
          let itemName = '',
            itemIcon = '';
          if (thisLevelItemsId === 'function') {
            itemName = enumerationsItemName(user, dataTypeFunction, thisLevelItemId);
            itemIcon = enumerationsItemIcon(user, dataTypeFunction, thisLevelItemId);
          } else if (thisLevelItemsId === 'destination') {
            itemName = enumerationsItemName(user, dataTypeDestination, thisLevelItemId);
            itemIcon = enumerationsItemIcon(user, dataTypeDestination, thisLevelItemId);
          } else {
            itemName = `${enumerationsGetDeviceName(
              user,
              thisLevelItemId,
              functionId,
              destinationId,
            )}: ${translationsGetObjectName(user, thisLevelItemId, functionId)}`;
            itemIcon = enumerationsItemIcon(user, dataTypeFunction, functionId);
          }
          subMenuIndex = subMenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: itemName,
            icon: itemIcon,
            text: triggersMenuTriggersLogsItemDetails,
            options: {...options, [thisLevelItemsId]: thisLevelItemId},
            submenu: triggersMenuGenerateTriggersLogs,
          });
        });
      }
    }
  }
  return subMenu;
}

/**
 * This function generates the text description of the current Trigger Logs item.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will be described.
 * @returns {string} - The description of the Trigger Logs item.
 */
function triggersMenuTriggersLogsItemDetails(user, menuItemToProcess) {
  const options = typeOf(menuItemToProcess.options, 'object') ? menuItemToProcess.options : {},
    {state: triggerStateId, id: triggerId, function: functionId, destination: destinationId, item} = options,
    functionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    isFunctionDefined = typeOf(functionId, 'string'),
    isDestinationDefined = typeOf(destinationId, 'string'),
    triggersLogsItemArray = new Array(),
    iconOn = configOptions.getOption(cfgDefaultIconOn, user),
    iconOff = configOptions.getOption(cfgDefaultIconOff, user);
  let text = '',
    functionText = '',
    destinationText = '',
    attributeFunction = {},
    attributeDestination = {},
    trigger;
  if (typeOf(item, 'object')) {
    triggersLogsItemArray.push(
      {
        label: `${translationsItemTextGet(user, 'date', 'time')}`,
        value: formatDate(item.date, configOptions.getOption(cfgDateTimeTemplate, user)),
      },
      {
        label: `${translationsItemTextGet(user, 'success')}`,
        value: item.success ? iconOn : iconOff,
      },
    );
  }
  if (isFunctionDefined || isDestinationDefined || typeOf(triggerStateId, 'string') || typeOf(triggerId, 'string')) {
    triggersLogsItemArray.push({
      label: `${translationsItemTextGet(user, 'source')}:`,
      value: '',
    });
    if (isFunctionDefined) {
      functionText = enumerationsItemName(user, dataTypeFunction, functionId);
      if (!isDestinationDefined) {
        attributeFunction = {
          label: ` ${translationsItemTextGet(user, 'function')}`,
          value: enumerationsItemName(user, dataTypeFunction, functionId),
        };
      }
    }
    if (isDestinationDefined) {
      destinationText = enumerationsItemName(user, dataTypeDestination, destinationId);
      if (!isFunctionDefined) {
        attributeDestination = {
          label: ` ${translationsItemTextGet(user, 'destination')}`,
          value: enumerationsItemName(user, dataTypeDestination, destinationId),
        };
      }
    }
    if (functionsFirst && isFunctionDefined && !isDestinationDefined) {
      triggersLogsItemArray.push(attributeFunction);
    } else if (!functionsFirst && isDestinationDefined && !isFunctionDefined) {
      triggersLogsItemArray.push(attributeDestination);
    } else {
      triggersLogsItemArray.push({
        label: functionsFirst ? ` ${functionText}/${destinationText}` : ` ${destinationText}/${functionText}`,
        value: '',
      });
    }
    if (typeOf(triggerStateId, 'string')) {
      triggersLogsItemArray.push({
        label: ` ${translationsItemTextGet(user, 'device')}`,
        value: enumerationsGetDeviceName(user, triggerStateId, functionId, destinationId),
      });
      if (!typeOf(triggerId, 'string') || typeOf(item, 'object')) {
        triggersLogsItemArray.push({
          label: ` ${translationsItemTextGet(user, 'state')}`,
          value: translationsGetObjectName(user, triggerStateId, functionId),
        });
      }
    }
    if (typeOf(triggerId, 'string')) {
      const triggers = triggersGetStateTriggers(user, triggerStateId),
        triggerIndex = thresholdsGetIndex(triggers, triggerId);
      trigger = triggers && triggerIndex >= 0 ? triggers[triggerIndex] : undefined;
      if (typeOf(trigger, 'object')) {
        const sourceStateDetails = {
          label: ` ${translationsGetObjectName(user, triggerStateId, functionId)}`,
          value: enumerationsStateValueDetails(user, triggerStateId, functionId, {val: trigger.value}),
        };
        if (typeOf(trigger.onAbove, 'boolean') && typeOf(trigger.onBelow, 'boolean')) {
          sourceStateDetails.value = `${trigger.onAbove ? '˃=' : '˂'} ${sourceStateDetails.value}`;
        } else {
          sourceStateDetails.value = `== ${sourceStateDetails.value}`;
        }
        if (typeOf(item, 'object')) {
          sourceStateDetails.label = ` ${enumerationsStateValueDetails(user, triggerStateId, functionId, {
            val: item.triggerValue,
          })} ${sourceStateDetails.value}`;
          sourceStateDetails.value = '';
        }
        triggersLogsItemArray.push(sourceStateDetails);
      }
    }
  }
  if (typeOf(item, 'object')) {
    const targetFunctionText = enumerationsItemName(user, dataTypeFunction, trigger.targetFunction),
      targetDestinationText = enumerationsItemName(user, dataTypeDestination, trigger.targetDestination);
    if (typeOf(item.conditions, 'object')) {
      const conditions = item.conditions,
        conditionsChecked = conditions.checked;
      if (
        (typeOf(conditions.passed, 'boolean') && !conditions.passed) ||
        (typeOf(conditionsChecked, 'array') && conditionsChecked.length > 0)
      ) {
        triggersLogsItemArray.push({
          label: translationsItemTextGet(user, 'conditions'),
          value: conditions.passed ? iconOn : iconOff,
        });
      }
      if (typeOf(conditionsChecked, 'array') && conditionsChecked.length > 0) {
        conditionsChecked.forEach((condition, conditionIndex) => {
          if (typeOf(condition, 'object')) {
            const conditionStateId = condition.state,
              conditionFunctionText = enumerationsItemName(user, dataTypeFunction, condition.function),
              conditionDestinationText = enumerationsItemName(user, dataTypeDestination, condition.destination),
              resultIcon = condition.result ? iconOn : iconOff;
            triggersLogsItemArray.push({
              label: ` ${conditionIndex}:`,
              value: '',
            });
            triggersLogsItemArray.push({
              label: functionsFirst
                ? `  ${conditionFunctionText}/${conditionDestinationText}`
                : `  ${conditionDestinationText}/${conditionFunctionText}`,
              value: '',
            });
            triggersLogsItemArray.push({
              label: `  ${translationsItemTextGet(user, 'device')}`,
              value: enumerationsGetDeviceName(user, conditionStateId, condition.function, condition.destination),
            });
            triggersLogsItemArray.push({
              label: `  ${translationsItemTextGet(user, 'state')}`,
              value: translationsGetObjectName(user, conditionStateId, condition.function),
            });
            let conditionCheckText = `  ${enumerationsStateValueDetails(user, conditionStateId, condition.function, {
              val: condition.valueCurrent,
            })}`;
            conditionCheckText += ` ${condition.operator} `;
            conditionCheckText += enumerationsStateValueDetails(user, conditionStateId, condition.function, {
              val: condition.value,
            });
            triggersLogsItemArray.push({
              label: conditionCheckText,
              value: resultIcon,
            });
          }
        });
      }
    }
    triggersLogsItemArray.push({
      label: `${translationsItemTextGet(user, 'target')}:`,
      value: '',
    });
    triggersLogsItemArray.push({
      label: functionsFirst
        ? ` ${targetFunctionText}/${targetDestinationText}`
        : ` ${targetDestinationText}/${targetFunctionText}`,
      value: '',
    });
    triggersLogsItemArray.push({
      label: ` ${translationsItemTextGet(user, 'device')}`,
      value: enumerationsGetDeviceName(user, trigger.targetState, trigger.targetFunction, trigger.targetDestination),
    });
    triggersLogsItemArray.push({
      label: ` ${translationsGetObjectName(user, trigger.targetState, trigger.targetFunction)}`,
      value: enumerationsStateValueDetails(user, trigger.targetState, trigger.targetFunction, {
        val: trigger.targetValue,
      }),
    });
    if (typeOf(item.error, 'string')) {
      triggersLogsItemArray.push({
        label: `${translationsItemTextGet(user, 'error')}`,
        value: item.error,
      });
    }
  }
  if (triggersLogsItemArray.length) {
    text = `${menuMenuItemDetailsPrintFixedLengthLines(user, triggersLogsItemArray)}`;
  }
  return text;
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    _currentId = menuItemToProcess.id, // NOSONAR
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
        const backupFileDetails = RegExp(backupFileMask).exec(fileName),
          [_fullName, backupDate, backupTime, backupMode] = // NOSONAR
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
        warns(`Can't delete backup file ${fileToDelete}! Error is '${error}'.`);
        reject(error);
      } else {
        warns(`Backup file ${fileToDelete} was successfully deleted.`);
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
        warns(`Can't create backup file ${backupFileName}! Error is '${error}'.`);
        reject(error);
      } else {
        warns(`Backup file ${backupFileName} is created successfully.`);
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
        warns(`Cant' read backup file ${backupFileName}! Error is '${error}'.`);
        reject(error);
      } else {
        // NOSONAR // warns(`Backup file ${backupFileName} is created successfully.`);
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
  const backupDataJSON = jsonStringify(backupData, 2);
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
    const backupFileName = nodePath.join(backupFolder, fileName);
    if (backupFileMask.test(fileName)) {
      backupFileRead(backupFileName)
        .then((backupData) => {
          if (backupData) {
            try {
              let restoreData;
              restoreData = jsonParse(backupData);
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
                      if (restoreData.hasOwnProperty(itemToRestore) && typeOf(restoreData[itemToRestore], 'object')) {
                        configOptions.restoreDataFromBackup(restoreData[backupItemConfigOptions]);
                        rolesInMenu.refresh();
                        usersInMenu.refresh();
                      }
                      break;

                    case backupItemMenuListItems:
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
                throw new Error(`Inconsistent data from file ${backupFileName}!\nData in file is '${backupData}'`);
              }
            } catch (error) {
              warns(
                `Can't parse data from file ${backupFileName}! Error is '${jsonStringify(
                  error,
                )}'.\nData in file is '${backupData}'`,
              );
              reject(error);
            }
          } else {
            throw new Error(`No backup data in file ${backupFileName}!`);
          }
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      reject(new Error(`Backup file ${backupFileName} doesn't exists!`));
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
    result = listOfBackups.filter((fileName) => backupFileMask.test(fileName)).sort(); // NOSONAR
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
 * This function generates a submenu to create an ID of the new SimpleReports.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateCreateNewReport(user, menuItemToProcess) {
  let newMenu = [];
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    {enumType: enumId} = menuItemToProcess.options;
  if (enumId) {
    cachedValueDelete(user, cachedSimpleReportNewQuery);
    const simpleReportId = cachedValueGet(user, cachedSimpleReportIdToCreate);
    if (simpleReportId) {
      if (/[^a-zA-Z0-9]/.test(simpleReportId)) {
        newMenu.push(
          menuMenuItemGenerateEditItem(user, currentIndex, 0, translationsItemCoreGet(user, 'cmdFixId'), '', {
            dataType: dataTypeReport,
            mode: 'fixId',
          }),
        );
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
      newMenu.push(
        menuMenuItemGenerateEditItem(user, currentIndex, 0, translationsItemCoreGet(user, 'cmdSetId'), '', {
          dataType: dataTypeReport,
          mode: 'setId',
        }),
      );
    }
  }
  return newMenu;
}

/**
 * This function function for selecting states from a query result and assigning them to report.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateReportItemsNewSelectStates(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    {item: reportId} = menuItemToProcess.options,
    destinations = enumerationsList[dataTypeDestination].list,
    functions = enumerationsList[dataTypeFunction].list;
  let {queryDests, queryState, queryRole, queryStates, queryPossibleStates} = cachedValueGet(
      user,
      cachedSimpleReportNewQuery,
    ),
    subMenu = [],
    subMenuIndex = 0,
    destsList = queryDests,
    itemsMarked = 0;
  if (!destsList.length) {
    destsList = typeOf(destinations, 'object')
      ? Object.keys(destinations).filter((key) => destinations[key]?.isAvailable && destinations[key]?.isEnabled)
      : [];
  }
  if (!queryStates?.length) queryStates = [];
  if (!queryPossibleStates?.length) {
    queryPossibleStates = [];
    const getStateQuery = (state) => (state ? `[id=*.${state}]` : '[id=*]'),
      getRoleQuery = (role) => (role ? `[role=${role}]` : ''),
      getDestinationQuerySegment = (enumerations, dataType, id) => {
        if (id && enumerations[dataType]?.list[id]) {
          const currentDestination = enumerations[dataType].list[id];
          return `(${currentDestination.enum}=${id})`;
        }
        return '';
      },
      query = `state${getStateQuery(queryState)}${getRoleQuery(queryRole)}`,
      functionsIds = Object.keys(functions).filter((key) => functions[key]?.isAvailable && functions[key]?.isEnabled),
      functionsFullIds = functionsIds.map((item) => `${prefixEnums}.${functions[item].enum}.${item}`);
    destsList.forEach((destinationId) => {
      $(`${query}${getDestinationQuerySegment(enumerationsList, dataTypeDestination, destinationId)}`).each(
        (stateId) => {
          const currentObject = getObjectEnriched(stateId, '*');
          let functionId = '';
          if (currentObject['enumIds']?.length) {
            currentObject.enumIds.forEach((enumId) => {
              if (!functionId && functionsFullIds.includes(enumId))
                functionId = functionsIds[functionsFullIds.indexOf(enumId)];
            });
            if (functionId)
              queryPossibleStates.push({stateId: stateId, destinationId: destinationId, functionId: functionId});
          }
        },
      );
    });
  }
  if (queryPossibleStates?.length) {
    let destIdCurrent = '',
      subSubMenuIndex = 0,
      subMenuItem = {},
      destinationName = '';
    const labelDestination = translationsItemTextGet(user, 'destination'),
      labelFunction = translationsItemTextGet(user, 'function'),
      labelDevice = translationsItemTextGet(user, 'device'),
      labelState = translationsItemTextGet(user, 'state');
    queryPossibleStates.forEach(({stateId, destinationId, functionId}, index) => {
      if (destIdCurrent !== destinationId) {
        const holderPrefix = typeOf(destinations[destinationId].holder, 'string')
            ? `${translationsGetEnumName(user, dataTypeDestination, destinations[destinationId].holder)} > `
            : '',
          group = enumerationsGetHolderIdOrIdWithIncludedItems(destinations, destinationId);
        destinationName = `${holderPrefix}${translationsGetEnumName(user, dataTypeDestination, destinationId)}`;
        if (destIdCurrent) {
          subMenuItem.name += ` (${subMenuItem.submenu.length}, ${itemsMarked})`;
          subMenuIndex = subMenu.push(subMenuItem);
        }
        itemsMarked = 0;
        subSubMenuIndex = 0;
        destIdCurrent = destinationId;
        subMenuItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: destinationName,
          icon: destinations[destinationId].icon,
          text: `${menuMenuItemDetailsPrintFixedLengthLines(user, [
            {
              label: labelDestination,
              value: destinationName,
            },
          ])}`,
          submenu: [],
        };
        if (group) subMenuItem.group = group;
      }
      const statesSectionsCount = functions[functionId].statesSectionsCount,
        deviceId = stateId.split('.').slice(0, -statesSectionsCount).join('.'),
        deviceName = translationsGetObjectName(user, deviceId, functionId, destinationId),
        stateShortId = stateId.replace(`${deviceId}.`, ''),
        iconSelected =
          typeOf(queryStates, 'array') && queryStates?.includes(stateId)
            ? configOptions.getOption(cfgDefaultIconOn, user)
            : '',
        deviceIcon = `${iconSelected}${functions[functionId].icon}`,
        itemDetailsArray = [
          {
            label: labelDestination,
            value: destinationName,
          },
          {
            label: labelFunction,
            value: enumerationsItemName(user, dataTypeFunction, functionId),
          },
          {
            label: labelDevice,
            value: deviceName,
          },
          {
            label: labelState,
            value: translationsGetObjectName(user, stateId, functionId),
          },
        ];
      subSubMenuIndex = subMenuItem.submenu.push({
        index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}`,
        name: `${deviceName} (${stateShortId})`,
        icon: deviceIcon,
        text: `${menuMenuItemDetailsPrintFixedLengthLines(user, itemDetailsArray)}`,
        submenu: [
          {
            index: `${currentIndex}.${subMenuIndex}.${subSubMenuIndex}.0`,
            name: `${translationsItemMenuGet(user, 'ItemMarkUnMark')}`,
            icon: iconSelected,
            command: cmdItemMark,
            options: {
              dataType: dataTypeReportMember,
              itemType: 'states',
              item: index,
            },
            submenu: [],
          },
        ],
      });
      if (typeOf(queryStates, 'array') && queryStates?.includes(stateId)) itemsMarked++;
    });
    if (destIdCurrent) {
      subMenuItem.name += ` (${subMenuItem.submenu.length}, ${itemsMarked})`;
      subMenuIndex = subMenu.push(subMenuItem);
    }
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
  }
  cachedValueSet(user, cachedSimpleReportNewQuery, {
    queryDests,
    queryState,
    queryRole,
    queryStates,
    queryPossibleStates,
  });
  return subMenu;
}

/**
 * This function function for dests selection to search new report items.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateReportItemsNewSelectDestination(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    destinations = enumerationsList[dataTypeDestination]?.list;
  let subMenu = [],
    subMenuIndex = 0;
  const {queryDests, queryState, queryRole} = cachedValueExists(user, cachedSimpleReportNewQuery)
    ? cachedValueGet(user, cachedSimpleReportNewQuery)
    : simpleReportQueryParamsTemplate();
  if (!cachedValueExists(user, cachedSimpleReportNewQuery))
    cachedValueSet(user, cachedSimpleReportNewQuery, {queryDests, queryState, queryRole});
  if (typeOf(destinations, 'object')) {
    const destinationIds = Object.keys(destinations).filter((key) => destinations[key]?.isEnabled);
    destinationIds.forEach((destinationId) => {
      const holderPrefix = typeOf(destinations[destinationId].holder, 'string')
          ? `${translationsGetEnumName(user, dataTypeDestination, destinations[destinationId].holder)} > `
          : '',
        group = enumerationsGetHolderIdOrIdWithIncludedItems(destinations, destinationId),
        subMenuItem = {
          index: `${currentIndex}.${subMenuIndex}`,
          name: `${holderPrefix}${translationsGetEnumName(user, dataTypeDestination, destinationId)}`,
          icon: queryDests.includes(destinationId)
            ? configOptions.getOption(cfgDefaultIconOn, user)
            : destinations[destinationId].icon,
          command: cmdItemMark,
          options: {dataType: dataTypeReportMember, itemType: dataTypeDestination, item: destinationId},
          submenu: [],
        };
      if (group) {
        subMenuItem.group = group;
      }
      subMenuIndex = subMenu.push(subMenuItem);
    });
  }
  return subMenu;
}

/**
 * This function function for collecting query params (dests, states, roles) to add new items.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateReportItemsAddNewItems(user, menuItemToProcess) {
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
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
    submenu: simpleReportMenuGenerateReportItemsNewSelectDestination,
  });
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateEditItem(
      user,
      currentIndex,
      subMenuIndex,
      `${translationsItemMenuGet(user, 'ReportNewStatesDefineState')} (${queryState})`,
      '',
      {dataType: dataTypeReportMember, item: 'queryState'},
    ),
  );
  subMenuIndex = subMenu.push(
    menuMenuItemGenerateEditItem(
      user,
      currentIndex,
      subMenuIndex,
      `${translationsItemMenuGet(user, 'ReportNewStatesDefineRole')} (${queryRole})`,
      '',
      {dataType: dataTypeReportMember, item: 'queryRole'},
    ),
  );
  if (queryRole || queryState) {
    subMenu.push({
      index: `${currentIndex}.${subMenuIndex}`,
      name: `${translationsItemMenuGet(user, 'ReportNewStatesStartSearch')}`,
      icon: enumerationsList[dataTypeReport].icon,
      options: {item: reportId},
      submenu: simpleReportMenuGenerateReportItemsNewSelectStates,
    });
  }
  return subMenu;
}

/**
 * This function generates a submenu to manage items of the SimpleReports.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} - The array of menuItem objects.
 */
function simpleReportMenuGenerateEditReportItems(user, menuItemToProcess) {
  let newMenu = [];
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    {item: reportId} = menuItemToProcess.options;
  if (reportId) {
    const reportObjectId = `${prefixEnums}.${enumerationsList[dataTypeReport].list[reportId].enum}.${reportId}`,
      reportObject = getObject(reportObjectId);
    let memberId = 0;
    /** show list of states, already assigned to report */
    if (reportObject.common.hasOwnProperty('members')) {
      reportObject.common.members.forEach((member) => {
        if (member) {
          const memberTopObjectName = translationsGetObjectName(user, member.split('.').slice(0, -1).join('.'));
          memberId = newMenu.push({
            index: `${currentIndex}.${memberId}`,
            name: `${memberTopObjectName} (${member.split('.').pop()})`,
            icon: enumerationsList[dataTypeReport].icon,
            text: (_user, _menuItemToProcess) => `${memberTopObjectName} (${member})`,
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
      submenu: simpleReportMenuGenerateReportItemsAddNewItems,
    });
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
  let reportText = '';
  const reportsList = enumerationsList[dataTypeReport];
  if (menuItemToProcess?.hasOwnProperty('id') && Object.keys(reportsList.list).includes(menuItemToProcess.id)) {
    const reportId = menuItemToProcess.id,
      reportObject = getObject(`${prefixEnums}.${reportsList.list[reportId].enum}.${reportId}`);
    if (
      reportObject?.common?.hasOwnProperty('members') &&
      Array.isArray(reportObject.common['members']) &&
      reportObject.common['members'].length
    ) {
      const reportStatesList = reportObject.common['members'].sort(), // NOSONAR
        isAlwaysExpanded = reportsList.list[reportId].alwaysExpanded;
      let reportStatesStructure = simpleReportPrepareStructure(reportStatesList);
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
                  value: enumerationsStateValueDetails(user, currentStateObject, currentFuncId),
                };
              });
            });
          });
        });
      reportText = `${menuMenuItemDetailsPrintFixedLengthLines(user, reportLines)}`;
    }
  }
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
  const currentIndex = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
    reportId = menuItemToProcess.id,
    reportsList = enumerationsList[dataTypeReport].list,
    reportItem = reportsList[reportId],
    graphsTemplatesFolder = configOptions.getOption(cfgGraphsTemplates, user);
  let subMenu = [];
  if (reportItem) {
    const reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
    if (
      reportObject?.common?.hasOwnProperty('members') &&
      Array.isArray(reportObject.common['members']) &&
      reportObject.common['members'].length
    ) {
      const reportStatesList = reportObject.common['members'].sort(); // NOSONAR
      let shortStates = reportStatesList
        .map((state) => state.split('.').pop())
        .reduce((previousState, currentState) => {
          if (!previousState.includes(currentState)) {
            previousState.push(currentState);
          }
          return previousState;
        }, new Array());
      let graphsTemplate;
      if (shortStates.length === 1) {
        if (existsObject(`${graphsTemplatesFolder}.${shortStates[0]}`)) {
          graphsTemplate = shortStates[0];
        } else {
          graphsTemplate = graphsDefaultTemplate;
        }
      }
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
 * This function select an icon from icon pair[forTrue, forFalse]
 * @param {object} user - The user object.
 * @param {boolean} value - Tge selector for icon.
 * @param {string[]=} iconsPair - The array of two strings. If undefined - default On Off icons selected.
 * @returns {string} The result icon.
 */
function menuIconGenerate(user, value, iconsPair) {
  if (!typeOf(iconsPair, 'array')) {
    iconsPair = [configOptions.getOption(cfgDefaultIconOn, user), configOptions.getOption(cfgDefaultIconOff, user)];
  }
  // @ts-ignore
  return iconsPair[value ? 0 : 1];
}

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
      (user?.userId &&
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
          name: translationsItemMenuGet(user, 'Triggers'),
          id: 'triggers',
          icon: iconItemTrigger,
          group: 'triggersAndAlerts',
          submenu: [
            {
              name: translationsItemMenuGet(user, 'TriggersLogs'),
              id: 'triggersLogs',
              icon: iconItemHistory,
              submenu: triggersMenuGenerateTriggersLogs,
            },
            {
              name: translationsItemMenuGet(user, 'TriggersConfigured'),
              id: 'triggersConfigured',
              icon: iconItemTrigger,
              group: 'triggersAndAlerts',
              options: {mode: 'triggers'},
              submenu: alertsMenuGenerateSubscribed,
            },
          ],
        },
        {
          name: translationsItemMenuGet(user, 'Alerts'),
          id: 'alerts',
          icon: iconItemAlerts,
          group: 'triggersAndAlerts',
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
              options: {mode: 'alerts'},
              submenu: alertsMenuGenerateSubscribed,
            },
          ],
        },
      ];
      const enumerationsSubMenuPart = Object.keys(enumerationsList).map((dataType) => ({
        name: translationsItemMenuGet(user, enumerationsList[dataType].id),
        id: dataType,
        icon: enumerationsList[dataType].icon,
        group: idEnumerations,
        options: {dataType},
        submenu: enumerationsMenuGenerateListOfEnumerationItems,
      }));
      subMenu.splice(
        1,
        0,
        // @ts-ignore
        ...enumerationsSubMenuPart,
      );
      subMenu.forEach((subMenuItem) => {
        const subMenuItemAccessLevel = user?.userId
          ? usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${subMenuItem.id}`)
          : '';
        if (
          user === null ||
          (user?.userId && MenuRoles.compareAccessLevels(subMenuItemAccessLevel, rolesAccessLevelForbidden) < 0)
        ) {
          subMenuItem.accessLevel = subMenuItemAccessLevel;
          if (Array.isArray(subMenuItem.submenu) && subMenuItem.submenu.length) {
            subMenuItem.submenu.forEach((subSubMenuItem) => (subSubMenuItem.accessLevel = subMenuItemAccessLevel));
          }
          menuItem.submenu.push(subMenuItem);
        }
      });
      if (user?.userId && sentImagesExists(user)) {
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
      (user?.userId &&
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
          (user?.userId &&
            MenuRoles.compareAccessLevels(
              usersInMenu.getMenuItemAccess(user.userId, `${menuItem.id}${rolesIdAndMaskDelimiter}${reportId}`),
              rolesAccessLevelForbidden,
            ) < 0)
        ) {
          const currentReport = reportsList[reportId];
          menuItem.submenu.push({
            name: `${translationsGetEnumName(user, dataTypeReport, reportId)}`,
            icon: currentReport.icon ? currentReport.icon : enumerationsList[dataTypeReport].icon,
            text: simpleReportGenerate,
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
   * @param {string} nameDeclinationKey - The "declination" key for the Name
   * (`Main`, `Basic`, `Many`, `Inside`, `EnterTo`, `ExitFrom`).
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
      const menuItemAccessLevel = user?.userId
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
  if (typeOf(topRootMenuItemId, 'string')) {
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
        // @ts-ignore
        if (currentListIds.includes(topRootMenuItemId)) {
          rootMenu.submenu.push(
            // @ts-ignore
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
    let menuItem = menuMenuItemGenerateRootReports(user);
    if (menuItem?.submenu?.length) {
      rootMenu.submenu.push(menuItem);
    }
    menuItem = menuMenuItemGenerateRootMenuSetup(user);
    if (menuItem?.submenu?.length) {
      rootMenu.submenu.push(menuItem);
    }
  }
  return rootMenu;
}

/**
 * Generates menu item with confirmation subitem for the deletion of any menu
 * item, which will be processed by `cmdItemDeleteConfirm`.
 * @param {string} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param  {object} options - The options required for the `cmdItemDeleteConfirm`
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateDeleteItem(user, upperItemIndex, itemIndex, options) {
  return {
    index: `${upperItemIndex}.${itemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemDelete)}`,
    icon: iconItemDelete,
    group: cmdItemDelete,
    command: cmdItemDelete,
    options: {index: itemIndex},
    submenu: [
      {
        index: `${upperItemIndex}.${itemIndex}.0`,
        name: `${translationsItemCoreGet(user, cmdItemDeleteConfirm)}`,
        icon: iconItemDelete,
        //cfgItem, typeOfOption, subMenuIndex
        command: cmdItemDeleteConfirm,
        options: options,
        submenu: [],
      },
    ],
  };
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} _user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateEditItem(_user, upperItemIndex, itemIndex, itemName, groupId, options) {
  const menuItem = {
    index: `${upperItemIndex}.${itemIndex}`,
    name: itemName,
    icon: typeOf(options?.icon, 'string') ? options.icon : iconItemEdit,
    command: cmdGetInput,
    options: options,
    submenu: [],
  };
  if (groupId) menuItem.group = groupId;
  return menuItem;
}

/**
 * Generates menu item which call the user input for the Rename.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {object} options - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateRenameItem(user, upperItemIndex, itemIndex, options) {
  return menuMenuItemGenerateEditItem(
    user,
    upperItemIndex,
    itemIndex,
    `${translationsItemCoreGet(user, 'cmdItemRename')}`,
    '',
    options,
  );
}

/**
 * Generates menu item which call the user input for Add new item (i.e. set name).
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {object} options - The options to be processed by `cmdGetInput`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateAddItem(user, upperItemIndex, itemIndex, options) {
  return {
    index: `${upperItemIndex}.${itemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemAdd)}`,
    icon: iconItemPlus,
    command: cmdGetInput,
    options: options,
    group: 'addNew',
    submenu: [],
  };
}

/**
 * Generates menu item which call the reset for current menu item.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {object} options - The options to be processed by `cmdItemReset`.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}.
 */
function menuMenuItemGenerateResetItem(user, upperItemIndex, itemIndex, options) {
  return {
    index: `${upperItemIndex}.${itemIndex}`,
    name: `${translationsItemCoreGet(user, cmdItemReset)}`,
    icon: iconItemReset,
    command: cmdItemReset,
    options: options,
    group: 'reset',
    submenu: [],
  };
}

/**
 * Generates menu item which call the cmdItemPress command to inverse current value.
 * @param {object} _user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by appropriate command backend.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateBooleanItem(_user, upperItemIndex, itemIndex, itemName, groupId, options) {
  let menuItemIcon = typeOf(options?.icon, 'string') ? options.icon : '';
  if (options.icons) {
    if (!typeOf(options.value, 'boolean')) {
      menuItemIcon = iconItemNotFound;
    } else {
      menuItemIcon = options.icons[options.value ? 0 : 1];
    }
  }
  const menuItem = {
    index: `${upperItemIndex}.${itemIndex}`,
    name: itemName,
    icon: menuItemIcon,
    command: options?.replaceCommand ? options.replaceCommand : cmdItemPress,
    options: options,
    submenu: [],
  };
  if (groupId) menuItem.group = groupId;
  return menuItem;
}

/**
 * Generates menu item with possible values as subItems which call the cmdItemPress command to select one.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {Map|object[]} itemValues - The Map object with value:Nam pairs for the menu item. Or array of Map objects.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by appropriate command backend.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateSelectItem(user, upperItemIndex, itemIndex, itemName, itemValues, groupId, options) {
  const currentIndex = `${upperItemIndex}.${itemIndex}`,
    inputOptions = {...objectDeepClone(options)},
    menuItem = {
      index: currentIndex,
      name: itemName,
      icon: typeOf(inputOptions?.icon, 'string') ? inputOptions.icon : iconItemEdit,
      options: inputOptions,
      submenu: new Array(),
    };
  if (itemValues && (typeOf(itemValues, 'map') || typeOf(itemValues, 'array'))) {
    const itemValuesGroups = typeOf(itemValues, 'map') ? [itemValues] : itemValues,
      applyMode = inputOptions.applyMode,
      valuesDefault = inputOptions.valueOptions?.valuesDefault,
      isValuesDefaultAvailable = isDefined(valuesDefault),
      valuePrevious = inputOptions.value,
      valuesPrevious = inputOptions.values,
      showValueInName = inputOptions.showValueInName,
      currentCommand = inputOptions?.replaceCommand ? inputOptions.replaceCommand : cmdItemPress,
      itemCommand = applyMode ? cmdItemSetInterimValue : currentCommand,
      isValueApplicable = typeOf(inputOptions?.isValueApplicable, 'boolean') ? inputOptions.isValueApplicable : true,
      interimCalculationMode = inputOptions.valueOptions?.interimCalculationMode,
      noMarkCurrent = inputOptions?.noMarkCurrent || interimCalculationMode === interimCalculationSummarize,
      showInApply = inputOptions?.valueOptions?.showInApply;
    if (applyMode) {
      if (!typeOf(inputOptions.valueOptions?.interimItemId, 'string')) {
        inputOptions.valueOptions = {...inputOptions.valueOptions, interimItemId: currentIndex};
      }
    }
    if (isDefined(interimCalculationMode) && !isDefined(inputOptions.valueOptions?.interimItemId)) {
      inputOptions.valueOptions = {...inputOptions.valueOptions, interimItemId: currentIndex};
    }
    const itemOptions = {
      ...objectDeepClone(inputOptions, {valueOptions: {states: true, valuesDefault: true}}),
      backOnPress: !(applyMode || !inputOptions.backOnPress),
    };
    let valueCurrent = valuePrevious,
      valuesCurrent = valuesPrevious,
      valueText = iconItemNotFound;
    if (applyMode) {
      const interimValue = cachedValueGet(user, cachedInterimValue);
      if (isDefined(interimValue?.[currentIndex])) {
        if (interimCalculationMode === interimCalculationSelectMultiple) {
          valuesCurrent = interimValue[currentIndex];
          itemOptions.values = valuesCurrent;
        } else {
          valueCurrent = interimValue[currentIndex];
        }
      }
      if (interimCalculationMode == interimCalculationSummarize) {
        itemOptions.valueOptions = {...itemOptions.valueOptions, valueCurrent: valueCurrent};
      }
    }

    let subMenuIndex = 0,
      valueToDisplayInApply = '';

    itemValuesGroups.forEach((itemValuesGroup, groupIndex) => {
      itemValuesGroup.forEach((subItemName, subItemValue) => {
        subMenuIndex = menuItem.submenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: subItemName,
          group: `line${groupIndex}`,
          icon:
            !noMarkCurrent &&
            ((isDefined(valueCurrent) && valueCurrent == subItemValue) ||
              (isDefined(valuesCurrent) && valuesCurrent.includes(subItemValue)))
              ? iconItemCheckMark
              : '',
          command: itemCommand,
          options: {
            ...itemOptions,
            value: subItemValue,
          },
        });
        if (!isDefined(showInApply) && subItemValue == valueCurrent) {
          valueToDisplayInApply = `${subItemName}`;
          if (typeOf(inputOptions?.valueOptions?.unit, 'string'))
            valueToDisplayInApply += inputOptions.valueOptions.unit;
        }
        if (
          (!typeOf(interimCalculationMode, 'string') || interimCalculationMode === interimCalculationReplace) &&
          itemOptions.valueOptions?.type !== 'time' &&
          subItemValue == valuePrevious
        ) {
          valueText = `${subItemName}`;
        }
      });
    });
    if (valueText === iconItemNotFound) {
      if (typeOf(showInApply, 'function')) {
        if (interimCalculationMode === interimCalculationSelectMultiple) {
          if (typeOf(valuesPrevious, 'array')) valueText = showInApply(valuesPrevious);
        } else if (isDefined(valuePrevious)) valueText = showInApply(valuePrevious);
      } else if (typeOf(inputOptions?.valueOptions?.valueToDisplay, 'string')) {
        valueText = inputOptions.valueOptions.valueToDisplay;
      } else if (isDefined(valuePrevious)) {
        valueText = `${valuePrevious}`;
      }
    }
    if (valueToDisplayInApply === '') {
      switch (typeOf(showInApply)) {
        case 'string': {
          valueToDisplayInApply = showInApply;
          break;
        }
        case 'function': {
          if (interimCalculationMode === interimCalculationSelectMultiple) {
            valueToDisplayInApply = showInApply(valuesCurrent);
          } else {
            valueToDisplayInApply = showInApply(valueCurrent);
          }

          break;
        }
        default: {
          break;
        }
      }
    }
    if (typeOf(inputOptions?.valueOptions?.unit, 'string')) valueText += inputOptions.valueOptions.unit;
    if (showValueInName) menuItem.name += ` [${valueText}]`;
    if (!isDefined(menuItem.text)) {
      const textLines = [
        {
          label: translationsItemTextGet(user, 'CurrentValue'),
          value: valueText,
        },
      ];
      if (isDefined(inputOptions.valueOptions?.min))
        textLines.push({label: ' ' + translationsItemTextGet(user, 'Min'), value: inputOptions.valueOptions.min});
      if (isDefined(inputOptions.valueOptions?.max))
        textLines.push({label: ' ' + translationsItemTextGet(user, 'Max'), value: inputOptions.valueOptions.max});
      if (isDefined(inputOptions.valueOptions?.step))
        textLines.push({label: ' ' + translationsItemTextGet(user, 'Step'), value: inputOptions.valueOptions.step});
      menuItem.text = `${menuMenuItemDetailsPrintFixedLengthLines(user, textLines)}`;
    }
    if (inputOptions?.valueOptions?.directInput) {
      subMenuIndex = menuItem.submenu.push(
        menuMenuItemGenerateEditItem(
          user,
          `${upperItemIndex}.${itemIndex}`,
          menuItem.submenu.length,
          `${translationsItemMenuGet(user, 'SetValue')} [${valueText}]`,
          'directInput',
          itemOptions,
        ),
      );
    }
    if (applyMode) {
      if (isValueApplicable) {
        if (
          ((isDefined(valuesPrevious) || isDefined(valuesCurrent)) &&
            jsonStringify(valuesPrevious) !== jsonStringify(valuesCurrent)) ||
          ((isDefined(valuePrevious) || isDefined(valueCurrent)) && valuePrevious !== valueCurrent)
        ) {
          const applyOptions = {
            ...objectDeepClone(inputOptions, {valueOptions: {valuesDefault: true}}),
            value: valueCurrent,
            values: valuesCurrent,
            backOnPress: !typeOf(inputOptions.backOnPress, 'boolean') || inputOptions.backOnPress,
          };
          subMenuIndex = menuItem.submenu.push({
            index: `${currentIndex}.${subMenuIndex}`,
            name: `${translationsItemMenuGet(user, 'apply')} [${valueToDisplayInApply}]`,
            group: `apply`,
            icon: iconItemOk,
            command: currentCommand,
            options: applyOptions,
          });
        }
      }
      if (
        isValuesDefaultAvailable &&
        isDefined(valuesCurrent) &&
        jsonStringify(valuesDefault) !== jsonStringify(valuesCurrent)
      ) {
        inputOptions.valueOptions['resetValue'] = true;
        menuItem.submenu.push({
          index: `${currentIndex}.${subMenuIndex}`,
          name: translationsItemCoreGet(user, cmdItemReset),
          group: `reset`,
          icon: iconItemReset,
          command: itemCommand,
          options: inputOptions,
        });
      }
    }
  }
  if (groupId) menuItem.group = groupId;
  return menuItem;
}

const cachedInterimValue = 'interimValue',
  interimCalculationReplace = 'replace',
  interimCalculationSummarize = 'summarize',
  interimCalculationSelectMultiple = 'selectMultiple';

/**
 * Generates menu item which can process editing of the value depending on it's type.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by appropriate command backend.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateEditItemBasedOnValueType(user, upperItemIndex, itemIndex, itemName, groupId, options) {
  let menuItem;
  if (typeOf(options?.valueType, 'string')) {
    const inputOptions = objectDeepClone(options),
      valueOptions = typeOf(inputOptions?.valueOptions, 'object') ? inputOptions.valueOptions : {},
      valueType = inputOptions.valueType,
      valueCurrent = inputOptions?.value,
      booleanSelect = inputOptions?.booleanSelect,
      applyMode = inputOptions?.applyMode,
      mode = inputOptions?.mode,
      backOnPress = mode !== 'add' || inputOptions?.backOnPress;
    if (valueType === 'boolean' && !booleanSelect && !applyMode) {
      menuItem = menuMenuItemGenerateBooleanItem(user, upperItemIndex, itemIndex, itemName, groupId, {
        ...inputOptions,
        replaceCommand: inputOptions?.replaceCommand ? inputOptions.replaceCommand : cmdItemSetValue,
      });
    } else if (
      (valueOptions.hasOwnProperty('states') && ['string', 'number'].includes(valueType)) ||
      (valueType === 'boolean' && (booleanSelect || applyMode))
    ) {
      menuItem = menuMenuItemGenerateSelectItem(
        user,
        upperItemIndex,
        itemIndex,
        itemName,
        valueOptions['states'],
        groupId,
        {
          ...inputOptions,
          replaceCommand: inputOptions?.replaceCommand ? inputOptions.replaceCommand : cmdItemSetValue,
          backOnPress: backOnPress,
        },
      );
    } else if (valueType === 'number') {
      let valueMin = valueOptions.hasOwnProperty('min') ? valueOptions['min'] : undefined,
        valueMax = valueOptions.hasOwnProperty('max') ? valueOptions['max'] : undefined,
        valueStep = valueOptions.hasOwnProperty('step') ? valueOptions['step'] : undefined;
      const valuesMapArray = new Array(),
        valuesArray = [1, 2, 5],
        baseValue = isDefined(valueCurrent) ? valueCurrent : inputOptions.referenceValue,
        interimItemId = `${upperItemIndex}.${itemIndex}`,
        valueInterim = cachedValueExists(user, cachedInterimValue) ? cachedValueGet(user, cachedInterimValue) : null,
        valueInterimIsDefined = isDefined(valueInterim?.[interimItemId]),
        valueToWork = valueInterimIsDefined ? valueInterim[interimItemId] : baseValue;
      if (!typeOf(valueStep, 'number')) {
        const digitsNumberBase = Math.trunc(baseValue).toString.length || 0,
          digitsNumberMax = typeOf(valueMax, 'number') ? Math.trunc(valueMax).toString.length : digitsNumberBase + 1;
        for (let positionIndex = digitsNumberMax - 3; positionIndex <= digitsNumberMax; positionIndex++) {
          const multiplier = Math.pow(10, positionIndex);
          [-1, 1].forEach((sign) => {
            const valuesMap = new Map(),
              signSymbol = sign > 0 ? '+' : '';
            valuesArray.forEach((value) => {
              const valueToSet = value * multiplier * sign;
              if (
                (!typeOf(valueMin, 'number') || valueToWork + valueToSet >= valueMin) &&
                (!typeOf(valueMax, 'number') || valueToWork + valueToSet <= valueMax)
              ) {
                valuesMap.set(valueToSet, `${signSymbol}${valueToSet}`);
              }
            });
            valuesMapArray.push(valuesMap);
          });
        }
      } else {
        let stepMultiplier = 1;
        if (!typeOf(valueMax, 'number')) valueMax = 10 ** (Math.trunc(valueMax).toString.length + 1);
        if (!typeOf(valueMin, 'number')) valueMin = 0;
        while (valueStep * stepMultiplier < valueMax - valueMin) {
          [-1, 1].forEach((sign) => {
            const valuesMap = new Map(),
              signSymbol = sign > 0 ? '+' : '';
            valuesArray.forEach((value) => {
              const valueToSet = value * valueStep * stepMultiplier * sign;
              if (valueToWork + valueToSet >= valueMin && valueToWork + valueToSet <= valueMax) {
                valuesMap.set(valueToSet, `${signSymbol}${valueToSet}`);
              }
            });
            valuesMapArray.push(valuesMap);
          });
          stepMultiplier = stepMultiplier * 10;
        }
      }
      menuItem = menuMenuItemGenerateSelectItem(user, upperItemIndex, itemIndex, itemName, valuesMapArray, groupId, {
        ...inputOptions,
        replaceCommand: inputOptions?.replaceCommand ? inputOptions.replaceCommand : cmdItemSetValue,
        currentValue: valueCurrent,
        backOnPress: backOnPress,
        applyMode: true,
        valueOptions: {
          ...inputOptions.valueOptions,
          interimCalculationMode: interimCalculationSummarize,
          showInApply: `${valueToWork}${
            inputOptions.valueOptions.hasOwnProperty('unit') ? ` ${inputOptions.valueOptions['unit']}` : ''
          }`,
          directInput: true,
        },
      });
    } else {
      menuItem = menuMenuItemGenerateEditItem(user, upperItemIndex, itemIndex, itemName, groupId, inputOptions);
    }
  } else {
    menuItem = menuMenuItemGenerateEditItem(user, upperItemIndex, itemIndex, itemName, groupId, options);
  }
  return menuItem;
}

/**
 * Generates menu item which can process editing of the value related to the State.
 * Or direct State value change or, for example, trigger value related to State.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by appropriate command backend.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateEditItemStateValue(user, upperItemIndex, itemIndex, itemName, groupId, options) {
  let menuItem;
  if (typeOf(options?.state, 'string')) {
    const stateObject = options?.stateObject ? options.stateObject : getObject(options.state),
      stateObjectCommon = stateObject?.common,
      stateType = options?.stateType ? options.stateType : stateObjectCommon['type'],
      stateValue = options?.value ? options.value : getState(options.state)?.val,
      finctionId = options?.function,
      valueOptions = typeOf(options.valueOptions, 'object') ? options.valueOptions : {};
    if (stateObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(stateType)) {
      const states = enumerationsExtractPossibleValueStates(user, stateObject, finctionId);
      if (typeOf(states, 'map') && states.size > 0) {
        valueOptions['states'] = states;
      }
    } else if (stateType === 'number') {
      if (stateObjectCommon.hasOwnProperty('min')) valueOptions['min'] = stateObjectCommon['min'];
      if (stateObjectCommon.hasOwnProperty('max')) valueOptions['max'] = stateObjectCommon['max'];
      if (stateObjectCommon.hasOwnProperty('step')) valueOptions['step'] = stateObjectCommon['step'];
    } else if (stateType === 'boolean') {
      if (options?.booleanSelect) {
        const valuesMap = new Map();
        [true, false].forEach((possibleValue) => {
          valuesMap.set(
            possibleValue,
            enumerationsStateValueDetails(user, stateObject, options?.function, {val: possibleValue}),
          );
        });
        valueOptions['states'] = valuesMap;
      }
    }
    valueOptions['valueName'] = translationsGetObjectName(user, stateObject, options.function);
    if (stateObjectCommon.hasOwnProperty('unit')) valueOptions['unit'] = stateObjectCommon['unit'];
    menuItem = menuMenuItemGenerateEditItemBasedOnValueType(user, upperItemIndex, itemIndex, itemName, groupId, {
      ...options,
      valueType: stateType,
      valueOptions: valueOptions,
      referenceValue: options.valueOverride ? stateValue : undefined,
      value: options.valueOverride ? options.value : stateValue,
    });
  } else {
    menuItem = menuMenuItemGenerateEditItem(user, upperItemIndex, itemIndex, itemName, groupId, options);
  }
  return menuItem;
}

const timeInternalUnitsSeconds = 's',
  timeInternalUnitsMinutes = 'm',
  timeInternalUnitsHours = 'h',
  timeInternalUnitsDays = 'd',
  timeInternalUnitsWeeks = 'w',
  timeInternalUnitsDaysInMonth = 'D',
  timeInternalUnitsMonths = 'M',
  timeInternalUnitsDefault = timeInternalUnitsMinutes + timeInternalUnitsSeconds,
  timeInternalUnitsFull = [
    timeInternalUnitsMonths,
    timeInternalUnitsDaysInMonth,
    timeInternalUnitsWeeks,
    timeInternalUnitsDays,
    timeInternalUnitsHours,
    timeInternalUnitsMinutes,
    timeInternalUnitsSeconds,
  ],
  timeInternalDaysInMothsArray = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  timeInternalPerUnitMaxValueNonGreat = {
    [timeInternalUnitsSeconds]: 60,
    [timeInternalUnitsMinutes]: 60,
    [timeInternalUnitsHours]: 24,
    [timeInternalUnitsDays]: 365,
    [timeInternalUnitsWeeks]: 52,
    [timeInternalUnitsDaysInMonth]: timeInternalDaysInMothsArray,
    [timeInternalUnitsMonths]: 12,
  },
  timeInternalPerUnitValueMinimal = {
    [timeInternalUnitsSeconds]: 0,
    [timeInternalUnitsMinutes]: 0,
    [timeInternalUnitsHours]: 0,
    [timeInternalUnitsDays]: 0,
    [timeInternalUnitsWeeks]: 0,
    [timeInternalUnitsDaysInMonth]: 1,
    [timeInternalUnitsMonths]: 1,
  },
  timeInternalPerUnitValues = {
    [timeInternalUnitsSeconds]: [1, 2, 5, 10, 30, 50],
    [timeInternalUnitsMinutes]: [1, 2, 5, 10, 30, 50],
    [timeInternalUnitsHours]: [1, 2, 4, 8, 12, 16],
    [timeInternalUnitsDays]: [1, 5, 10, 20, 50, 100],
    [timeInternalUnitsWeeks]: [1, 2, 5, 10, 20, 40],
    [timeInternalUnitsDaysInMonth]: [1, 2, 3, 5, 10, 15],
    [timeInternalUnitsMonths]: [1, 2, 4, 6, 8, 10],
  },
  timeInternalPerUnitMultipliers = {
    [timeInternalUnitsSeconds]: {[timeInternalUnitsSeconds]: 1},
    [timeInternalUnitsMinutes]: {
      [timeInternalUnitsSeconds]: 60,
      [timeInternalUnitsMinutes]: 1,
    },
    [timeInternalUnitsHours]: {
      [timeInternalUnitsSeconds]: 3600,
      [timeInternalUnitsMinutes]: 60,
      [timeInternalUnitsHours]: 1,
    },
    [timeInternalUnitsDays]: {
      [timeInternalUnitsSeconds]: 86400,
      [timeInternalUnitsMinutes]: 1440,
      [timeInternalUnitsHours]: 24,
      [timeInternalUnitsDays]: 1,
    },
    [timeInternalUnitsWeeks]: {
      [timeInternalUnitsSeconds]: 604800,
      [timeInternalUnitsMinutes]: 10800,
      [timeInternalUnitsHours]: 168,
      [timeInternalUnitsDays]: 7,
      [timeInternalUnitsWeeks]: 1,
    },
    [timeInternalUnitsDaysInMonth]: {
      [timeInternalUnitsDaysInMonth]: 1,
    },
    [timeInternalUnitsMonths]: {
      [timeInternalUnitsDaysInMonth]: 50,
      [timeInternalUnitsMonths]: 1,
    },
  },
  timeInternalTranslationId = {
    [timeInternalUnitsSeconds]: 'timeInternalUnitSeconds',
    [timeInternalUnitsMinutes]: 'timeInternalUnitMinutes',
    [timeInternalUnitsHours]: 'timeInternalUnitHours',
    [timeInternalUnitsDays]: 'timeInternalUnitDays',
    [timeInternalUnitsWeeks]: 'timeInternalUnitWeeks',
    [timeInternalUnitsDaysInMonth]: 'timeInternalUnitDays',
    [timeInternalUnitsMonths]: 'timeInternalUnitMonths',
  },
  timeInternalParseRegExps = {
    ms: /^([0-5]\d)(:[0-5]\d)$/,
    hm: /^([0-1]?\d|2[0-3]):([0-5]\d)$/,
    hms: /^([0-1]?\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  };

/**
 * Converts internal time data to string.
 * @param {number} value - The integer value of time in smallest template units (i.e. seconds, minutes, hours).
 * @param {string} template - The template string with units id's fom smallest to highest ('smh' for example).
 * @returns {string} The string representation of internal time (10:45:03 for example).
 */
function timeInternalToString(value, template) {
  let result = '';
  if (typeOf(value, 'number') && template?.length) {
    const unitMinimal = template.slice(-1);
    template.split('').forEach((unit) => {
      const multiplier = timeInternalPerUnitMultipliers[unit][unitMinimal],
        max = timeInternalPerUnitMaxValueNonGreat[unit];
      result += `${result.length ? ':' : ''}${zeroPad(Math.trunc(value / multiplier) % max, 2)}`;
    });
  }
  return result;
}

/**
 * Converts string time to the internal time data format.
 * @param {string} value - The string representation of the time (10:45:03 for example).
 * @param {string} template - The template string with units id's fom smallest to highest ('smh' for example).
 * @returns {number} The integer value of time in smallest units (i.e. seconds, minutes, hours).
 * If units not comply with value - will return 0.
 */
function stringToTimeInternal(value, template) {
  let result = 0;
  if (typeOf(value, 'string') && template?.length && isDefined(timeInternalParseRegExps[template])) {
    const timeInternalParseRegExp = timeInternalParseRegExps[template],
      valueParsed = timeInternalParseRegExp.exec(value),
      unitsLength = template.length;
    if (typeOf(valueParsed, 'array')) {
      // @ts-ignore
      valueParsed.shift();
      const valueParsedLength = valueParsed?.length;
      if (unitsLength === valueParsedLength) {
        const unitMinimal = template.slice(-1),
          unitsArray = template.split('');
        // @ts-ignore
        valueParsed.forEach((valueItem, index) => {
          const unit = unitsArray[index],
            multiplier = timeInternalPerUnitMultipliers[unit][unitMinimal];
          result += Number(valueItem) * multiplier;
        });
      }
    }
  }
  return result;
}

/**
 * Generates menu item which can process editing of the value related to the State.
 * Or direct State value change or, for example, trigger value related to State.
 * @param {object} user - The user object.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {string} itemName - The name of the menu item.
 * @param {string} groupId - The name of the menu item.
 * @param {object} options - The options to be processed by appropriate command backend.
 * @returns {object} The menu item object {index:..., name:..., icon:..., command:..., submenu:[...]}
 */
function menuMenuItemGenerateEditTime(user, upperItemIndex, itemIndex, itemName, groupId, options) {
  let menuItem,
    showInApply = '',
    valueToProcess,
    timeTemplate,
    timeUnitsFull = timeInternalUnitsFull;
  const valuesMapArray = [],
    interimItemId = `${upperItemIndex}.${itemIndex}`,
    valueInterim = cachedValueExists(user, cachedInterimValue) ? cachedValueGet(user, cachedInterimValue) : null,
    valueInterimIsDefined = isDefined(valueInterim?.[interimItemId]),
    valueCurrent = valueInterimIsDefined ? valueInterim[`${upperItemIndex}.${itemIndex}`] : options?.value,
    timeMode = options.timeMode ? options.timeMode : timeInternalModeInterval;
  switch (timeMode) {
    case timeInternalModeInterval: {
      timeUnitsFull = timeInternalUnitsFull.slice(2);
      timeTemplate = options?.timeTemplate ? options.timeTemplate : timeInternalUnitsDefault;
      valueToProcess = valueCurrent;
      break;
    }
    case timeInternalModeTime: {
      timeUnitsFull = timeInternalUnitsFull.slice(-3);
      timeTemplate = options?.timeTemplate ? options.timeTemplate : timeInternalUnitsDefault;
      valueToProcess = stringToTimeInternal(valueCurrent, timeTemplate);
      break;
    }
    case timeInternalModeMonthAndDay: {
      timeUnitsFull = timeInternalUnitsFull.slice(0, 2);
      timeTemplate = options?.timeTemplate ? options.timeTemplate : timeUnitsFull.join('');
      valueToProcess = valueCurrent;
      break;
    }
  }
  if (timeTemplate.length) {
    const timeInternalUnitsMinimal = timeTemplate.slice(-1);
    let previousUnit = '',
      valuePrevious = 0,
      multiplierPrevious = 0,
      isValueApplicable = true;
    timeUnitsFull.forEach((unit) => {
      if (timeTemplate.includes(unit)) {
        const multiplier = timeInternalPerUnitMultipliers[unit][timeInternalUnitsMinimal],
          min = timeInternalPerUnitValueMinimal[unit],
          valueInCurrentUnits = typeOf(valueToProcess, 'number') ? Math.trunc(valueToProcess / multiplier) : 0;
        let max = timeInternalPerUnitMaxValueNonGreat[unit];
        if (timeMode === timeInternalModeMonthAndDay) {
          if (unit === timeInternalUnitsDaysInMonth && previousUnit === timeInternalUnitsMonths) {
            max = valuePrevious > 0 ? max[valuePrevious] : max[2];
          }
          max++;
        }
        const values = timeInternalPerUnitValues[unit],
          valueCurrent = multiplierPrevious ? valueInCurrentUnits % multiplierPrevious : valueInCurrentUnits,
          valuesMapPlus = new Map(),
          valuesMapMinus = new Map();
        switch (timeMode) {
          case timeInternalModeInterval: {
            if (Object.keys(timeInternalParseRegExps).includes(timeTemplate)) {
              showInApply += `${showInApply.length ? ':' : ''}${zeroPad(valueCurrent, 2)}`;
            } else {
              showInApply += `${valueCurrent}${translationsItemTextGet(user, timeInternalTranslationId[unit])}`;
            }
            break;
          }
          case timeInternalModeTime: {
            showInApply += `${showInApply.length ? ':' : ''}${zeroPad(valueCurrent, 2)}`;
            break;
          }
          case timeInternalModeMonthAndDay: {
            if (unit === timeInternalUnitsDaysInMonth) {
              showInApply += timeRangeDeltaItemToString(
                user,
                [valuePrevious, valueCurrent],
                triggersTimeRangeMonthsWithDays,
              );
            }
          }
        }
        values.forEach((value) => {
          if (value <= valueCurrent - min) {
            valuesMapMinus.set(
              -value * multiplier,
              `-${value}${translationsItemTextGet(user, timeInternalTranslationId[unit])}`,
            );
          }
        });
        if (valuesMapMinus.size) valuesMapArray.push(valuesMapMinus);
        values.forEach((value) => {
          if (max - valueCurrent > value)
            valuesMapPlus.set(
              value * multiplier,
              `+${value}${translationsItemTextGet(user, timeInternalTranslationId[unit])}`,
            );
        });
        if (valuesMapPlus.size) valuesMapArray.push(valuesMapPlus);
        isValueApplicable = isValueApplicable && valueCurrent >= min && valueCurrent < max;
        previousUnit = unit;
        valuePrevious = valueCurrent;
        multiplierPrevious = multiplier;
      }
    });
    if (valuesMapArray.length) {
      menuItem = menuMenuItemGenerateEditItemBasedOnValueType(user, upperItemIndex, itemIndex, itemName, groupId, {
        ...options,
        valueType: 'number',
        backOnPress: true,
        applyMode: true,
        noMarkCurrent: true,
        isValueApplicable: isValueApplicable,
        valueOptions: {
          ...options.valueOptions,
          showInApply: showInApply.length ? showInApply : undefined,
          type: timeInternalModeTime,
          template: timeTemplate,
          mode: timeMode,
          states: valuesMapArray,
          interimCalculationMode: interimCalculationSummarize,
          interimItemId: interimItemId,
        },
      });
    }
  }
  return menuItem;
}

/**
 * Generates two menu items to move an item `up` and `down` in it's holder
 * collection(array), which will be processed by `cmdItemMoveUp`/`cmdItemMoveDown`
 * @param {object} _user - The user object.
 * @param {object[]} subMenu - The current level menu items array.
 * @param {string} upperItemIndex - The upper level item menu index.
 * @param {number} itemIndex - The index of an item to be created.
 * @param {number} itemIndexInArray - The index of an item in the appropriate collection (array).
 * @param {number} lastItemInArrayIndex - The current max index in the appropriate collection (array)
 * which holds an item.
 * @param {object} options - The options, are required for  `cmdItemMoveUp`/`cmdItemMoveDown` to identify an item.
 * @param {string=} groupId - The group Id for menu.
 * @returns {[object[], number]} The array with an updated `subMenu` with new menu items to
 * move an item `up` and `down`, and updated `subMenuItemIndex`.
 */
function menuMenuPartGenerateMoveItemUpAndDown(
  _user,
  subMenu,
  upperItemIndex,
  itemIndex,
  itemIndexInArray,
  lastItemInArrayIndex,
  options,
  groupId = 'moveItem',
) {
  if (itemIndexInArray > 0) {
    itemIndex = subMenu.push({
      index: `${upperItemIndex}.${itemIndex}`,
      name: `${iconItemMoveUp}`,
      command: cmdItemMoveUp,
      options: options,
      group: groupId,
      submenu: [],
    });
  }
  if (itemIndexInArray < lastItemInArrayIndex) {
    itemIndex = subMenu.push({
      index: `${upperItemIndex}.${itemIndex}`,
      name: `${iconItemMoveDown}`,
      command: cmdItemMoveDown,
      options: options,
      group: groupId,
      submenu: [],
    });
  }
  return [subMenu, itemIndex];
}

//*** menu items related functions - begin ***//

/**
 * This function generates a submenu for an appropriate first level item (`function` or `destination`).
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which will hold newly generated submenu.
 * @returns {object[]} Newly generated submenu.
 */
function menuMenuGenerateFirstLevelAfterRoot(user, menuItemToProcess) {
  const currentIndex = menuItemToProcess.index,
    isFunctionsFirst = configOptions.getOption(cfgMenuFunctionsFirst, user),
    primaryInputType = isFunctionsFirst ? dataTypeFunction : dataTypeDestination,
    primaryMenuItemsList = enumerationsList[primaryInputType].list,
    primaryLevelMenuItemId = menuItemToProcess.holderId
      ? `${menuItemToProcess.holderId}.${menuItemToProcess.id}`
      : menuItemToProcess.id,
    itemOptions = menuItemToProcess.options ? menuItemToProcess.options : {},
    {extraOptions} = itemOptions;
  let subMenu = [];
  if (primaryMenuItemsList.hasOwnProperty(primaryLevelMenuItemId)) {
    const primaryEnumerationId = isFunctionsFirst ? 'function' : 'destination',
      secondaryEnumerationId = isFunctionsFirst ? 'destination' : 'function',
      secondaryInputType = isFunctionsFirst ? dataTypeDestination : dataTypeFunction,
      namesCurrent = isFunctionsFirst ? enumerationsNamesMain : enumerationsNamesMany,
      isFunctionsFirstGlobal = configOptions.getOption(cfgMenuFunctionsFirst),
      inverseMasks = isFunctionsFirst !== isFunctionsFirstGlobal,
      primaryMenuItem = primaryMenuItemsList[primaryLevelMenuItemId],
      secondaryMenuItemsList = enumerationsList[secondaryInputType].list,
      secondaryMenuItemsIndex = Object.keys(secondaryMenuItemsList)
        .filter((destId) => secondaryMenuItemsList[destId].isEnabled && secondaryMenuItemsList[destId].isAvailable)
        .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order),
      deviceList = {};
    let currentIcons = isFunctionsFirst ? {on: primaryMenuItem.iconOn, off: primaryMenuItem.iconOff} : {},
      currentIcon = isFunctionsFirst ? primaryMenuItem.icon : '';
    if (
      menuItemToProcess.hasOwnProperty('subordinates') &&
      typeOf(menuItemToProcess.subordinates, 'array') &&
      menuItemToProcess.subordinates.length
    ) {
      subMenu = menuMenuReIndex(menuItemToProcess.subordinates, currentIndex, extraOptions);
    }
    /**
     * ! This way to find an objects only by function and then filter by destination,
     * ! is a ten times faster than include destination in search pattern,
     * ! like
     * !$(`state[id=*.${functionState}](${currentFunction.enum}=${currentFuncId})(${destsList[destId].enum}=${destId})`)
     * ! And more strange - if I remove check of id in query, to filter it later in code -
     * ! it works additionally five times faster!
     */
    $(`state(${primaryMenuItem.enum}=${primaryLevelMenuItemId})`).each((stateId) => {
      if (existsObject(stateId)) {
        const currentObject = getObjectEnriched(stateId, '*');
        let statesSectionsCount, functionState;
        if (currentObject.hasOwnProperty('enumIds')) {
          secondaryMenuItemsIndex.forEach((currentLevelMenuItemId) => {
            const currentLevelMenuItem = secondaryMenuItemsList[currentLevelMenuItemId],
              secondaryFullId = `${prefixEnums}.${currentLevelMenuItem.enum}.${currentLevelMenuItemId}`;
            if (currentObject['enumIds'].includes(secondaryFullId)) {
              if (isFunctionsFirst) {
                functionState = primaryMenuItem.state;
                statesSectionsCount = primaryMenuItem.statesSectionsCount;
              } else {
                functionState = currentLevelMenuItem.state;
                statesSectionsCount = currentLevelMenuItem.statesSectionsCount;
              }
              const shortStateId = stateId.split('.').slice(-statesSectionsCount).join('.');
              if (functionState === shortStateId) {
                if (!deviceList.hasOwnProperty(currentLevelMenuItemId)) deviceList[currentLevelMenuItemId] = [];
                if (!deviceList[currentLevelMenuItemId].includes(stateId))
                  deviceList[currentLevelMenuItemId].push(stateId);
              }
            }
          });
        }
      }
    });
    Object.keys(deviceList)
      .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)
      .forEach((currentLevelMenuItemId) => {
        if (currentLevelMenuItemId?.includes('.')) {
          const [holderId, _subordinatedId] = currentLevelMenuItemId.split('.'); // NOSONAR
          if (!Object.keys(deviceList).includes(holderId)) {
            deviceList[holderId] = [];
          }
        }
      });
    Object.keys(deviceList)
      .sort((a, b) => secondaryMenuItemsList[a].order - secondaryMenuItemsList[b].order)
      .forEach((currentLevelMenuItemId) => {
        const menuItemId = `${primaryLevelMenuItemId}${rolesIdAndMaskDelimiter}${currentLevelMenuItemId}`,
          currentAccessLevel = user?.userId
            ? usersInMenu.getMenuItemAccess(user.userId, menuItemId, inverseMasks)
            : undefined,
          functionId = isFunctionsFirst ? primaryLevelMenuItemId : currentLevelMenuItemId,
          destinationId = isFunctionsFirst ? currentLevelMenuItemId : primaryLevelMenuItemId;
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
          if (MenuRoles.compareAccessLevels(currentAccessLevel, rolesAccessLevelForbidden) < 0)
            deviceList[currentLevelMenuItemId].forEach((deviceStateId, _deviceIndex) => {
              const devicePrefix = deviceStateId.split('.').slice(0, -statesSectionsCount).join('.'),
                deviceId = devicePrefix.split('.').pop();
              let deviceMenuItem = {
                index: `${currentIndex}.${currentLevelMenuItemId}.${deviceId}`,
                name: translationsGetObjectName(user, devicePrefix, functionId, destinationId),
                type: menuItemToProcess.type,
                id: menuItemId,
                accessLevel: currentAccessLevel,
                options: {
                  [primaryEnumerationId]: primaryLevelMenuItemId,
                  [secondaryEnumerationId]: currentLevelMenuItemId,
                  state: deviceStateId,
                  device: devicePrefix,
                },
                text: enumerationsMenuItemDetailsDevice,
                icons: currentIcons,
                icon: currentIcon,
                submenu: enumerationsMenuGenerateDevice,
              };
              if (extraOptions?.deviceFunction) {
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
              // NOSONAR // holderItem.submenu = makeMenuIndexed(holderItem.submenu, holderItem.index);
            }
          } else {
            subMenu.push(currentMenuItem);
          }
        }
        // }
      });
  }
  if (subMenu.length) {
    for (const subMenuIndex of subMenu.keys()) {
      const currentSubMenuItem = subMenu[subMenuIndex],
        currentSubMenuItemSubmenu = currentSubMenuItem.submenu;
      if (typeOf(currentSubMenuItemSubmenu, 'array') && currentSubMenuItemSubmenu.length === 0) {
        subMenu.splice(subMenuIndex, 1);
      }
    }
    subMenu = subMenu.filter((item) => item);
  }
  return subMenu;
}

/**
 * This function process the array with strings to create  multi-line string with fixed length of lines.
 * @param {object} user - The user object.
 * @param {object[]} linesArray - The input array of objects contained an formatted string and it's length modifier.
 * @returns {string} The result formatted string.
 */
function menuMenuItemDetailsPrintFixedLengthLines(user, linesArray) {
  const maxLineLength = configOptions.getOptionWithModifier(cfgSummaryTextLengthMax, user);
  let text = '';
  linesArray.forEach((line) => {
    let label = line.label;
    const value = line.hasOwnProperty('value') ? `${line.value}` : '',
      valueLengthModifier = line.hasOwnProperty('lengthModifier') ? line.lengthModifier : 0,
      valueLength = getStringLength(value) + valueLengthModifier,
      labelLengthMax = maxLineLength - valueLength,
      labelLengthModifier = valueLength ? 1 : 0;
    let labelLength = getStringLength(label);
    if (labelLength + labelLengthModifier > labelLengthMax) {
      label = label.slice(0, -(labelLength + labelLengthModifier - labelLengthMax));
      labelLength = getStringLength(label);
    }
    if (labelLength) {
      label += valueLength ? ':' : '';
      labelLength = getStringLength(label);
      label += ''.padEnd(labelLengthMax - labelLength);
    }
    text += `${text ? '\n' : ''}${label}${value}`;
  });
  return encodedStr(text);
}

//*** menu items related functions - end ***//

//***menu items commands and its options cache - begin ***/

/**
 * This class used to store to and get from the internal cache menu items commands and their options,
 * using the menu item index as an access key to it.
 * The reason of using this class it a limitation of the Telegram API, which allows to send
 * only 64 bytes of data in the `callback_data` field of the inline keyboard button.
 * So, the menu item index is used in the `callback_data` field, and the command and its options
 * are stored in the internal cache.
 **/
class CommandOptionsCache {
  /** The internal cache to store the command and its options. **/
  #data;
  /** The last error message. **/
  #error;

  /**
   * The constructor of the class.
   **/
  constructor(prefix = '') {
    this.#data = new Map();
    this.#error = '';
    this.prefix = prefix;
  }

  /** The maximum length of the `callback_data` field of the inline keyboard button. **/
  static maxCallbackDataLength = 64;

  /**
   * This method prepares the index of the menu item, with adding the `prefixq, if defined.
   * @param {string} index - The index of the menu item.
   * @param {string} indexShort - The shorter version of index of the menu item.
   * @param {string=} prefix - The prefix to add to the index.
   * @param {object=} self - The object to store the error message.
   * @returns {string} The prepared index of the menu item.
   * If the index is too long, it will select shoter version, if will too log too,
   * the method will return an empty string.
   **/
  static prepareIndex(index, indexShort, prefix = '', self = undefined) {
    let result = '';
    for (let input of [index, indexShort]) {
      result = input;
      if (prefix !== '' && !result.startsWith(prefix)) {
        result = `${prefix}${result}`;
      }
      if (result.length > CommandOptionsCache.maxCallbackDataLength) {
        if (self instanceof CommandOptionsCache) self.error = 'callBackDataTooLong';
        result = '';
      } else {
        if (self instanceof CommandOptionsCache) self.error = '';
        break;
      }
    }
    return result;
  }

  /**
   * This method gets the last error message.
   * @returns {string} The last error message.
   **/
  get error() {
    return this.#error;
  }

  /**
   * This method sets the error message.
   * @param {string} value - The error message.
   **/
  set error(value) {
    this.#error = value;
  }

  /**
   * This method prepares the class item to serialization into JSON.
   * @returns {object} The object with the class data.
   * The method is used by `JSON.stringify` to serialize the class instance.
   **/
  toJSON() {
    return {
      prefix: this.prefix,
      data : this.#data,
      error: this.#error,
    };
  }


  /**
   * This method resets all stored data related to the appropriate `user`.
   * @param {object} user - The user object.
   * If the `user` is not defined, the method will do nothing.
   **/
  reset(user) {
    if (isDefined(user?.chatId)) {
      if (this.#data.has(user.chatId)) {
        this.#data.delete(user.chatId);
      }
    }
  }

  /**
   * This method sets into the internal cache the command and its options for the apropriate menu item.
   * @param {object} user - The user object.
   * @param {string} index - The index of the menu item.
   * @param {string} indexShort - The index of the menu item.
   * @param {string=} command - The command of the menu item.
   * @param {object=} options - The options of the menu item command.
   * @returns {string} The result of the operation.
   */
  set(user, index, indexShort, command = '', options = {}) {
    let result = '';
    this.#error = '';
    if (isDefined(user?.chatId)) {
      result = CommandOptionsCache.prepareIndex(index, indexShort, this.prefix, this);
      if (this.#error === '') {
        if (!this.#data.has(user.chatId)) {
          this.#data.set(user.chatId, new Map());
        }
        const userData = this.#data.get(user.chatId);
        userData.set(result, {command: command === '' ? result : command, options, index});
        this.#data.set(user.chatId, userData);
      }
    }
    return result;
  }

  /** This method gets the command and its options for the apropriate menu item.
   * @param {object} user - The user object.
   * @param {string} index - The index of the menu item.
   * @returns {object} The object with the index, command and its options.
   * If the command and its options are not set, the default command and its options will be returned.
   * If the user is not defined, the default command and its options will be returned.
   **/
  get(user, index) {
    let result = {index, command: index, options: {}};
    if (isDefined(user?.chatId)) {
      if (this.#data.has(user.chatId)) {
        const userData = this.#data.get(user.chatId);
        if (userData.has(index)) {
          result = userData.get(index);
        }
      }
    }
    return result;
  }
}

const commandOptionsCache = new CommandOptionsCache(menuItemButtonPrefix);

//***menu items commands and its options cache - end ***/

//***menu draw related functions - begin ***/

const cachedMenuItemsAndRows = 'menuItemsAndRows',
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
 * This function go from the root level down to the target menu item (by `targetMenuPos`) iterative way,
 * filling on each turn the appropriate information, as to the text part of Telegram message,
 * as for the buttons part, to prepare it for "draw" to user.
 * @param {object} user - The user object.
 * @param {string[]=} targetMenuPos - The position of the menu item in the menu tree, each item of array describes
 * the position of item on each level of hierarchy of menu.
 * @param {object=} messageOptions - The options to draw the menu.
 * @param {object=} menuItemToProcess - The menu item, which have to be processed, to reach the final destination
 * item by `targetMenuPos`.
 * @param {object=} messageObject - The prepared for "draw" the Telegram message object related to
 * the `targetMenuPos`. Will be filled additionally on each iteration.
 * @param {string=} currentIndent - The current indent on this step of iteration for the text part of Telegram message.
 */
function menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent = '') {
  /**
   * Default situation for call to draw menu, outside the function (i.e. no iterative call)
   */
  let topItemIndex;
  if (!menuItemToProcess) {
    if (targetMenuPos) {
      cachedValueSet(user, cachedMenuItem, targetMenuPos);
      targetMenuPos = [...targetMenuPos];
    } else if (cachedValueExists(user, cachedMenuItem)) {
      targetMenuPos = cachedValueGet(user, cachedMenuItem);
    } else {
      targetMenuPos = [];
      cachedValueSet(user, cachedMenuItem, targetMenuPos);
    }
    topItemIndex = targetMenuPos?.length ? targetMenuPos[0] : undefined;
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
      savedPos = savedMenu?.index ? savedMenu.index.split('.') : null;
    if (savedPos && targetMenuPos && targetMenuPos.join('.').startsWith(savedPos.join('.'))) {
      targetMenuPos = targetMenuPos.slice(savedPos.length);
      menuItemToProcess = savedMenu;
      messageObject = {...savedRows};
      // @ts-ignore
      if (['function', 'string'].includes(typeOf(menuItemToProcess?.options?.generatedBy))) {
        menuItemToProcess.submenu = menuItemToProcess.options.generatedBy;
        menuItemToProcess.options.generatedBy = undefined;
        messageObject.buttons = [];
      }
      currentIndent = savedTab;
    } else {
      messageObject = {
        message: '',
        buttons: [],
      };
    }
  }
  const subMenu = menuItemToProcess.submenu;
  switch (typeOf(subMenu)) {
    case 'string': {
      const extensionMenuId = subMenu;
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
          if (
            !(typeof newMenuItem === 'object' && newMenuItem.hasOwnProperty('error')) &&
            newMenuItem.hasOwnProperty('name')
          ) {
            menuItemToProcess = menuMenuReIndex(newMenuItem);
          } else {
            if (typeof newMenuItem === 'object' && newMenuItem.hasOwnProperty('error')) {
              warns(
                `Can't update subMenu from extensionMenuId ${extensionMenuId}!` +
                  ` No result. Error is ${newMenuItem.error}`,
              );
            }
            targetMenuPos = [];
          }
          menuItemToProcess.options = {...menuItemToProcess.options, generatedBy: subMenu};
          menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent);
        },
      );
      break;
    }

    case 'function': {
      menuItemToProcess.submenu = subMenu(user, menuItemToProcess);
      menuItemToProcess.options = {...menuItemToProcess.options, generatedBy: subMenu};
      menuMenuDraw(user, targetMenuPos, messageOptions, menuItemToProcess, messageObject, currentIndent);
      break;
    }

    default: {
      const hierarchicalCaption = configOptions.getOption(cfgHierarchicalCaption, user);
      if (hierarchicalCaption) {
        if (!typeOf(currentIndent, 'string')) currentIndent = '';
        // @ts-ignore
        currentIndent = currentIndent.padStart(currentIndent.length + hierarchicalCaption);
      }
      let subMenuPos;
      if (subMenu && subMenu.length > 0 && targetMenuPos && targetMenuPos.length > 0) {
        subMenuPos = targetMenuPos.shift();
        if (typeof subMenuPos === 'string' && isNaN(Number(subMenuPos))) {
          subMenuPos = subMenu.findIndex(
            (item) =>
              (item.hasOwnProperty('id') && item.id === subMenuPos) || item.index.split('.').pop() === subMenuPos,
          );
        } else {
          subMenuPos = Number(subMenuPos);
        }
      }
      let messageCaption = '';
      if (messageObject.message) {
        if (hierarchicalCaption) {
          messageCaption = '\n\r' + currentIndent + iconItemToSubItem;
        } else {
          messageCaption = ' ' + iconItemToSubItemByArrow + ' ';
        }
      }
      if (typeOf(subMenuPos, 'number') && subMenuPos >= 0 && subMenu.length > 0 && subMenuPos < subMenu.length) {
        messageObject.message += messageCaption + menuMenuItemGetIcon(user, menuItemToProcess) + menuItemToProcess.name;
        const subMenuItem = subMenu[subMenuPos];
        messageObject.index = subMenuItem.index;
        if (messageObject.index === topItemIndex) {
          messageObject.shortIndex = topItemIndex;
        } else if (isDefined(messageObject.shortIndex)) {
          messageObject.shortIndex = [messageObject.shortIndex, subMenuPos].join('.');
        } else {
          messageObject.shortIndex = subMenuPos;
        }
        messageObject.name = subMenuItem.hasOwnProperty('name') ? subMenuItem.name : undefined;
        messageObject.options =
          subMenuItem.hasOwnProperty('options') && typeOf(subMenuItem.options, 'object') ? subMenuItem.options : {};
        if (isDefined(messageObject.navigationLeft)) messageObject.navigationLeft = undefined;
        if (isDefined(messageObject.navigationRight)) messageObject.navigationRight = undefined;
        const subMenuMaxIndex = subMenu.length - 1,
          currentOptions = messageObject.options;
        let horizontalNavigation = 0;
        if (currentOptions?.hasOwnProperty(menuOptionHorizontalNavigation)) {
          horizontalNavigation = currentOptions[menuOptionHorizontalNavigation] ? 1 : -1;
        }
        if (
          subMenuMaxIndex > 0 &&
          (horizontalNavigation > 0 || configOptions.getOption(cfgShowHorizontalNavigation, user)) &&
          horizontalNavigation >= 0
        ) {
          if (subMenuPos > 0) {
            for (let itemPos = subMenuPos - 1; itemPos >= 0; itemPos--) {
              const currentSubMenuItem = subMenu[itemPos];
              if (!typeOf(currentSubMenuItem.command, 'string') || !currentSubMenuItem.command.includes(cmdPrefix)) {
                messageObject.navigationLeft = itemPos;
                break;
              }
            }
          }
          if (subMenuPos < subMenuMaxIndex) {
            for (let itemPos = subMenuPos + 1; itemPos <= subMenuMaxIndex; itemPos++) {
              const currentSubMenuItem = subMenu[itemPos];
              if (!typeOf(currentSubMenuItem.command, 'string') || !currentSubMenuItem.command.includes(cmdPrefix)) {
                messageObject.navigationRight = itemPos;
                break;
              }
            }
          }
        }
        menuMenuDraw(user, targetMenuPos, messageOptions, subMenuItem, messageObject, currentIndent);
      } else {
        cachedValueDelete(user, cachedMenuItemsAndRows);
        if (!typeOf(subMenu, 'array') || subMenuPos >= subMenu.length) {
          let savedPos = cachedValueGet(user, cachedMenuItem);
          if (targetMenuPos?.length) {
            for (let i = targetMenuPos.length - 1; i >= 0; i--) {
              if (savedPos[savedPos.length - 1] === targetMenuPos[i]) {
                savedPos.pop();
              }
            }
          }
          if (savedPos[savedPos.length - 1] === subMenuPos) {
            savedPos.pop();
          }
          cachedValueSet(user, cachedMenuItem, savedPos);
        }
        if (subMenu?.length > 0) {
          cachedValueSet(user, cachedMenuItemsAndRows, [menuItemToProcess, {...messageObject}, currentIndent]);
        }
        messageObject.message += messageCaption + menuMenuItemGetIcon(user, menuItemToProcess) + menuItemToProcess.name;
        messageObject.message = encodedStr(messageObject.message);
        if (menuItemToProcess.hasOwnProperty('text') && isDefined(menuItemToProcess.text)) {
          let menuText = menuItemToProcess.text;
          if (typeOf(menuText, 'function')) menuText = menuText(user, menuItemToProcess);
          if (typeOf(menuText, 'string') && menuText) messageObject.message += `\n<code>${menuText}</code>`;
        }
        messageObject.buttons = [];
        const indexCurrent = typeOf(menuItemToProcess.index, 'string') ? menuItemToProcess.index : '',
          backIndexCurrent = indexCurrent ? indexCurrent.split('.').slice(0, -1).join('.') : undefined,
          indexCurrentShort = indexCurrent.replace(messageObject.index, messageObject.shortIndex),
          currentBackIndexShort = indexCurrentShort ? indexCurrentShort.split('.').slice(0, -1).join('.') : undefined,
          buttonsCountMax = configOptions.getOption(cfgMaxButtonsOnScreen, user);
        let buttonsCount = subMenu.length;
        let buttonsOffset = 0;
        if (buttonsCount > buttonsCountMax) {
          if (cachedValueExists(user, cachedMenuButtonsOffset)) {
            if (indexCurrent) cachedAddToDelCachedOnBack(user, backIndexCurrent, cachedMenuButtonsOffset);
            const [forIndex, currentOffset] = cachedValueGet(user, cachedMenuButtonsOffset);
            if (indexCurrent === forIndex) {
              buttonsOffset = Number(currentOffset);
              buttonsCount = buttonsCount - buttonsOffset;
            } else {
              cachedValueDelete(user, cachedMenuButtonsOffset);
            }
          }
        }
        commandOptionsCache.reset(user);
        let callbackData;
        for (
          let buttonsIndex = 0;
          buttonsIndex < (buttonsCount > buttonsCountMax ? buttonsCountMax : buttonsCount);
          buttonsIndex++
        ) {
          const subMenuItem = subMenu[buttonsIndex + buttonsOffset];
          const subIndexCurrent =
              subMenuItem?.index?.length > 50
                ? subMenuItem.index.replace(messageObject.index, messageObject.shortIndex)
                : subMenuItem.index,
            subIndexCurrentShort = subMenuItem.index.replace(messageObject.index, messageObject.shortIndex);
          if (
            typeOf(subMenuItem?.command, 'string') &&
            subMenuItem.command.indexOf(cmdPrefix) === 0 &&
            subMenuItem.command !== cmdPrefix
          ) {
            callbackData = commandOptionsCache.set(
              user,
              subIndexCurrent,
              subIndexCurrentShort,
              subMenuItem.command,
              subMenuItem.options,
            );
          } else if (subMenuItem.hasOwnProperty('extensionCommandId')) {
            callbackData = commandOptionsCache.set(user, subIndexCurrent, subIndexCurrentShort, cmdExternalCommand, {
              function: subMenuItem.extensionId,
              item: subMenuItem.extensionCommandId,
              attribute: subMenuItem.externalCommandParams,
            });
          } else {
            callbackData = CommandOptionsCache.prepareIndex(
              subIndexCurrent,
              subIndexCurrentShort,
              menuItemButtonPrefix,
              commandOptionsCache,
            );
          }
          if (commandOptionsCache.error) {
            warns(
              `Can't set command options for ${subIndexCurrent}!, error is ${commandOptionsCache.error}.` +
                `SubMenuItem = ${jsonStringify(subMenuItem, 1)}`,
            );
          } else {
            messageObject.buttons.push({
              icon: menuMenuItemGetIcon(user, subMenuItem),
              text: subMenuItem.name,
              group: subMenuItem.group ? subMenuItem.group : menuButtonsDefaultGroup,
              callback_data: callbackData,
            });
          }
        }
        if (buttonsOffset > 0) {
          callbackData = commandOptionsCache.set(
            user,
            [indexCurrent, 'prev'].join('.'),
            [indexCurrentShort, 'prev'].join('.'),
            cmdSetOffset,
            {index: indexCurrent, offset: buttonsOffset - buttonsCountMax},
          );
          if (commandOptionsCache.error) {
            warns(
              `Can't set command options for ${[indexCurrent, 'prev'].join(
                '.',
              )}!, error is ${commandOptionsCache.error}.`,
            );
          } else {
            messageObject.buttons.push({
              text: `${iconItemPrevious}${translationsItemMenuGet(user, 'Prev')} (${buttonsOffset / buttonsCountMax})`,
              group: 'offset',
              callback_data: callbackData,
            });
          }
        }
        if (buttonsCount > buttonsCountMax) {
          callbackData = commandOptionsCache.set(
            user,
            [indexCurrent, 'next'].join('.'),
            [indexCurrentShort, 'next'].join('.'),
            cmdSetOffset,
            {index: indexCurrent, offset: buttonsOffset + buttonsCountMax},
          );
          if (commandOptionsCache.error) {
            warns(
              `Can't set command options for ${[indexCurrent, 'next'].join(
                '.',
              )}!, error is ${commandOptionsCache.error}.`,
            );
          } else {
            messageObject.buttons.push({
              text: `${iconItemNext}${translationsItemMenuGet(user, 'Next')} (${
                Math.ceil(buttonsCount / buttonsCountMax) - 1
              })`,
              group: 'offset',
              callback_data: callbackData,
            });
          }
        }
        if (isDefined(messageObject.navigationLeft)) {
          callbackData = commandOptionsCache.set(
            user,
            [indexCurrent, 'left'].join('.'),
            [indexCurrentShort, 'left'].join('.'),
            cmdItemJumpTo,
            {jumpToArray: [jumpToUp, messageObject.navigationLeft]},
          );
          if (commandOptionsCache.error) {
            warns(
              `Can't set command options for ${[indexCurrent, 'left'].join(
                '.',
              )}!, error is ${commandOptionsCache.error}.`,
            );
          } else {
            messageObject.buttons.push({
              text: `${iconItemMoveLeft}`,
              group: menuOptionHorizontalNavigation,
              callback_data: callbackData,
            });
          }
        }
        if (isDefined(messageObject.navigationRight)) {
          callbackData = commandOptionsCache.set(
            user,
            [indexCurrent, 'right'].join('.'),
            [indexCurrentShort, 'right'].join('.'),
            cmdItemJumpTo,
            {jumpToArray: [jumpToUp, messageObject.navigationRight]},
          );
          if (commandOptionsCache.error) {
            warns(
              `Can't set command options for ${[indexCurrent, 'prev'].join(
                '.',
              )}!, error is ${commandOptionsCache.error}.`,
            );
          } else {
            messageObject.buttons.push({
              text: `${iconItemMoveRight}`,
              group: menuOptionHorizontalNavigation,
              callback_data: callbackData,
            });
          }
        }
        messageObject.buttons = menuButtonsArraySplitIntoButtonsPerRowsArray(user, messageObject.buttons);
        const lastRow = [
          {
            text: translationsItemCoreGet(user, cmdClose),
            callback_data: cmdClose,
          },
        ];
        if (user.userId) {
          lastRow[0].callback_data += `${itemsDelimiter}${user.userId}`;
        }
        if (typeOf(backIndexCurrent, 'string')) {
          if (configOptions.getOption(cfgShowHomeButton, user)) {
            lastRow.unshift({text: translationsItemCoreGet(user, cmdHome), callback_data: cmdHome});
          }
          callbackData = CommandOptionsCache.prepareIndex(
            backIndexCurrent,
            currentBackIndexShort,
            cmdBack,
            commandOptionsCache,
          );
          if (commandOptionsCache.error) {
            warns(`Can't set command options for ${cmdBack}!, error is ${commandOptionsCache.error}.`);
          } else {
            lastRow.unshift({
              text: translationsItemCoreGet(user, cmdBack),
              callback_data: callbackData,
            });
          }
        }
        messageObject.buttons.push(lastRow);
        const alertMessages = alertGetMessages(user, true),
          alertMessagesCount = alertMessages.length,
          alertMessage = alertMessages.pop();
        if (alertMessagesCount) {
          // @ts-ignore
          const alertDate = formatDate(new Date(alertMessage.date), configOptions.getOption(cfgDateTimeTemplate, user));
          messageObject.alert = `<b><u>${alertDate}:</u> ${alertMessage.message}</b>\r\n\r\n`;
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
          if (alertMessagesCount > 1) {
            messageObject.buttons.push([
              {
                text: '(' + alertMessagesCount + ') ' + translationsItemCoreGet(user, cmdAcknowledgeAllAlerts),
                callback_data: cmdAcknowledgeAllAlerts,
              },
            ]);
          }
        }
        if (!(messageOptions?.hasOwnProperty('noDraw') && messageOptions.noDraw)) {
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
  if (currentFunction?.hasOwnProperty('availableState')) {
    const currentFunctionAvailableStateId = currentFunction.availableState;
    if (currentFunctionAvailableStateId && primaryStateFullId) {
      const currentItemAvailableStateId = [
        ...primaryStateFullId.split('.').slice(0, -currentFunction.statesSectionsCount),
        currentFunctionAvailableStateId,
      ].join('.');
      if (existsState(currentItemAvailableStateId)) {
        const currentItemAvailableState = getState(currentItemAvailableStateId);
        if (currentItemAvailableState?.hasOwnProperty('val')) {
          result = currentItemAvailableState.val;
        }
      }
    }
  }
  return result;
}

/**
 * This function checks if the menu item has an `icons` property that is an object, then use the on or off icon
 * depending on the state value. In case if `icons` property that is a function, then call the function and use
 * the return value.
 * Otherwise, use the `icon` property.
 * @param {object} user - The user object.
 * @param {object} menuItemToProcess - The menu item, which have to be processed, to reach the final destination
 * item by `targetMenuPos`.
 * @returns {string} The icon of the menu item.
 */
function menuMenuItemGetIcon(user, menuItemToProcess) {
  let icon = '';
  if (typeOf(menuItemToProcess, 'object')) {
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
            icon = iconItemNotFound;
            if (isDefined(currentValue)) {
              if (enumerationsEvaluateValueConversionCode(user, currentValue, convertValueCode)) {
                icon = menuItemToProcess.icons.on;
              } else {
                icon = menuItemToProcess.icons.off;
              }
            }
          }
        } else if (typeOf(menuItemToProcess.icons, 'function')) {
          icon = menuItemToProcess.icons(user, menuItemToProcess);
        }
      }
    }
    if ((!typeOf(icon, 'string') || icon === '') && menuItemToProcess.icon) icon = menuItemToProcess.icon;
  }
  return icon;
}

/**
 * This function extract the target menu item position as an array of "coordinates" from string.
 * @param {string} menuItemPositionString - The string, contained the "coordinates" in format 1.2.3.4".
 * @return {string[]} - The "coordinates" Array in format [1, 2, 3, 4].
 */
function menuMenuItemExtractPosition(menuItemPositionString) {
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
 * This function clear Telegram message with Auto Telegram Menu, then stores it's status as closed and
 * clears appropriate cache values.
 * @param {object} user - The user object.
 */
function menuMenuClose(user) {
  telegramMessageClearCurrent(user, false);
  cachedValueSet(user, cachedMenuOn, false);
  cachedValueDelete(user, cachedMenuItem);
}

/**
 * This function, in case of the schedule for menu update is enabled in configuration, go thru all users,
 * and checks the current open by user menu item for updates.
 * In case of it consists new information - it will be "redrawn".
 */
function menuMenuUpdateBySchedule() {
  const usersIds = usersInMenu.getUsers();
  // NOSONAR // logs(`try to refresh menu for users ${usersIds}`, _l);
  for (const userId of usersIds) {
    const user = telegramGenerateUserObjectFromId(userId);
    if (cachedValueGet(user, cachedMenuOn) === true) {
      const itemPos = cachedValueGet(user, cachedMenuItem);
      // NOSONAR // logs(`for user = ${stringifySafe(userId)} menu on pos ${stringifySafe(itemPos)}`, _l);
      if (!cachedValueGet(user, cachedIsWaitForInput) && typeOf(itemPos, 'array')) {
        logs(`make an menu update for = ${jsonStringify(user)}`);
        menuMenuDraw(user);
      }
    } else {
      logs(`for user = ${jsonStringify(userId)} menu is closed`);
    }
  }
}

/**
 * This function schedule a renew of the Telegram message, which consists a Auto Telegram Menu,
 * to avoid the time limitation for the bots to edit their own messages.
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
      const currentUser = idOfUser || menuRefreshTimeAllUsers;
      const scheduledRefresh = menuRefreshScheduled.has(currentUser)
        ? menuRefreshScheduled.get(currentUser)
        : {atTime: '', reference: null};
      if (scheduledRefresh.atTime !== atTime) {
        if (scheduledRefresh.reference) clearSchedule(scheduledRefresh.reference);
        const atTimeArray = atTime.split(':');
        scheduledRefresh.atTime = atTime;
        scheduledRefresh.reference = schedule({hour: atTimeArray.shift(), minute: atTimeArray.pop()}, () => {
          logs(
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
 * @param {boolean=} forceNow - The selector, to force the refresh for all users now, independently from
 * configured value.
 * @param {boolean=} noDraw - The selector, to do only preparation work (i.e. some cached values).
 */
function menuMenuMessageRenew(idOfUser, forceNow = false, noDraw = false) {
  let userIds =
    idOfUser !== menuRefreshTimeAllUsers && usersInMenu.validId(idOfUser) ? [idOfUser] : usersInMenu.getUsers();
  if (idOfUser === menuRefreshTimeAllUsers) {
    userIds = userIds.concat(telegramGetGroupChats(true));
  }
  userIds.forEach((userId) => {
    if (
      idOfUser == userId ||
      (idOfUser === menuRefreshTimeAllUsers && (!menuRefreshScheduled.has(userId) || forceNow || noDraw))
    ) {
      const user = telegramGenerateUserObjectFromId(userId);
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
        warns('for user = ' + jsonStringify(user) + ' menu is open on ' + jsonStringify(itemPos));
        if (!cachedValueGet(user, cachedIsWaitForInput) && typeOf(itemPos, 'array')) {
          if (noDraw) {
            warns(`Make an menu object prepared for user/chat group = ${jsonStringify({...user, rootMenu: null})}`);
          } else {
            warns(`Make an menu refresh for user/chat group = ${jsonStringify({...user, rootMenu: null})}`);
          }
          menuMenuDraw(user, itemPos, {clearBefore: true, clearUserMessage: false, isSilent: true, noDraw});
        }
      } else if (!isBotMessageOld24OrNotExists) {
        warns(
          `For user/chat group = ${jsonStringify({
            ...user,
            rootMenu: null,
          })} menu is updated(by new message) less the 24 hours ago. Menu refresh is not required.`,
        );
      } else {
        warns(
          `For user/chat group = ${jsonStringify({
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
 * This function splits the input `buttonsArray` to the `buttonsRowsArray`, based on configured
 * `cfgSummaryTextLengthMax` and the buttons groups assignment.
 * @param {object} user - The user object.
 * @param {object[]} buttonsArray - The plain array with buttons objects.
 * @returns {array[]} The Array of Arrays of buttons objects, represented the rows.
 */
function menuButtonsArraySplitIntoButtonsPerRowsArray(user, buttonsArray) {
  const minimalButtonLength = 5,
    buttonTextLengthTrigger = 11,
    triggeredMaxButtonsCountInRow = 2,
    // by some reasons "length" of the buttons row in a group chat is more then text part of message
    // that's why the modifier is not applied
    maxTextLength = configOptions.getOption(cfgSummaryTextLengthMax, user),
    menuButtonsDefaultGroup = 'defaultGroup';
  let buttonsRowsArray = [],
    buttonsRow = [],
    currentRowLength = 0,
    currentGroup = '',
    isTextLengthTriggered = false;
  buttonsArray.forEach((currentButton, _buttonIndex) => {
    let currentLength = getStringLength(currentButton.text) + getStringLength(currentButton.icon) + 1;
    if (currentLength < minimalButtonLength) currentLength = minimalButtonLength;
    if (currentLength > buttonTextLengthTrigger) isTextLengthTriggered = true;
    if (
      (buttonsRow.length > 0 && currentRowLength + currentLength > maxTextLength) ||
      (isTextLengthTriggered && buttonsRow.length >= triggeredMaxButtonsCountInRow) ||
      (currentGroup && currentGroup !== currentButton.group)
    ) {
      currentGroup = currentButton.group ? currentButton.group : menuButtonsDefaultGroup;
      buttonsRowsArray.push(buttonsRow);
      buttonsRow = [];
      currentRowLength = 0;
      isTextLengthTriggered = false;
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
    newMenuRow.index = typeOf(newMenuRow.index, 'string') ? newMenuRow.index : '';
    newMenuRow.submenu = typeOf(inputMenu.submenu, 'array')
      ? menuMenuReIndex(inputMenu.submenu, newMenuRow.index, extraOptions)
      : inputMenu.submenu;
  }
  return newMenuRow;
}

//*** menu draw related functions - end ***//

//*** User input and command processing - begin ***//

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

  /**
   * This function is used to set the state value via standard 'setState' and process the result.
   * @param {object} user - The user object.
   * @param {string} stateId - The state ID to set value.
   * @param {any=} stateValue  - The possible value for the state.
   * @param {boolean=} isFromGetInput - The selector to identify a way of input value come.
   */
  function setStateValue(user, stateId, stateValue, isFromGetInput = false) {
    const currentObject = getObjectEnriched(stateId);
    if (currentObject.common['write']) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
        errs(`Error! No response from setState() for ${stateId}`);
        menuMenuDraw(user);
      }, 4000);
      cachedValueSet(user, cachedCurrentState, stateId);
      const currentObjectCommon = currentObject.common,
        currentStateType = currentObjectCommon['type'],
        setStateCallback = (error) =>
          stateOrCommandProcessed(user, {success: !isDefined(error), error}, isFromGetInput);
      if (currentStateType === 'boolean' || isDefined(stateValue)) {
        if (currentStateType === 'boolean') {
          const currentState = getState(stateId),
            currentStateValue = !isDefined(currentState.val) ? false : currentState.val;
          setState(stateId, !currentStateValue, setStateCallback);
        } else if (currentObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(currentStateType)) {
          const statePossibleValues = enumerationsExtractPossibleValueStates(user, currentObject),
            stateValueToSet = currentStateType === 'number' ? Number(stateValue) : stateValue;
          if (statePossibleValues.has(stateValueToSet)) {
            setState(stateId, stateValueToSet, setStateCallback);
          } else {
            warns(`Value '${stateValue}' not in the acceptable list ${jsonStringify(statePossibleValues.keys())}`);
            setStateCallback(translationsItemTextGet(user, 'MsgValueNotInTheList'));
          }
        } else if (currentStateType === 'number') {
          const possibleNumber = Number(stateValue);
          if (checkNumberStateValue(stateId, possibleNumber, currentObject)) {
            setState(stateId, possibleNumber, setStateCallback);
          } else {
            warns(`Unacceptable value '${possibleNumber}' for object conditions ${jsonStringify(currentObjectCommon)}`);
            setStateCallback(translationsItemTextGet(user, 'MsgValueUnacceptable'));
          }
        } else {
          warns(`Unsupported object type: '${currentStateType}'`);
          setStateCallback(translationsItemTextGet(user, 'MsgUnsupportedObjectType'));
        }
      } else {
        warns(`Unacceptable value '${stateValue}' for state conditions ${jsonStringify(currentObject.common)}`);
        setStateCallback(translationsItemTextGet(user, 'MsgValueUnacceptable'));
      }
    }
  }

  const isWaitForInput = cachedValueGet(user, cachedIsWaitForInput),
    userInput = isWaitForInput || userInputToProcess,
    menuMessageObject = {},
    {command: commandCurrent, options: commandOptions, index: commandIndex} = commandOptionsCache.get(user, userInput);
  let menuPositionCurrent = cachedValueGet(user, cachedMenuItem);
  logs(
    `userInput.start:
    - isWaitForInput = ${isWaitForInput},
    - userInputToProcess = ${userInputToProcess},
    - currentMenuPosition = ${menuPositionCurrent},
    - commandCurrent = ${commandCurrent},
    - commandOptions = ${jsonStringify(commandOptions)},
    - commandIndex = ${commandIndex}`,
    _l,
  );
  if (commandOptions?.backOnPress) menuPositionCurrent.splice(-1, 1);
  cachedValueDelete(user, cachedInterimValue);
  if (isWaitForInput || commandCurrent === cmdItemSetValue) {
    if (userInputToProcess != dataTypeIgnoreInput) {
      switch (commandCurrent) {
        case cmdItemUpload: {
          switch (commandOptions.dataType) {
            case dataTypeTranslation: {
              const isTranslationFileOk = translationsCheckAndCacheUploadedFile(
                user,
                userInputToProcess,
                commandOptions.fileName,
                commandOptions.fileSize,
              );
              if (isTranslationFileOk) {
                menuPositionCurrent.push(
                  // @ts-ignore
                  isNaN(commandOptions.translationPart)
                    ? commandOptions.translationPart
                    : Number(commandOptions.translationPart),
                );
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

        case cmdItemSetValue: {
          if (isDefined(commandOptions?.value)) userInputToProcess = commandOptions?.value;
        }
        // eslint-disable-next-line no-fallthrough
        case cmdGetInput:
        default: {
          switch (commandOptions.dataType) {
            case dataTypeTranslation: {
              let currentTranslationId;
              if (
                commandOptions.translationType &&
                typeOf(commandOptions.item, 'number') &&
                typeOf(commandOptions.index, 'index')
              ) {
                currentTranslationId = commandOptions.translationType;
                let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > commandOptions.item
                ) {
                  currentTranslationId += `.destinations.${Object.keys(destTranslation)[commandOptions.item]}`;
                  destTranslation = destTranslation[Object.keys(destTranslation)[commandOptions.item]];
                  if (
                    destTranslation &&
                    typeOf(destTranslation) === 'object' &&
                    Object.keys(destTranslation).length > commandOptions.index
                  ) {
                    currentTranslationId += `.${Object.keys(destTranslation)[commandOptions.index]}`;
                  }
                }
              } else if (commandOptions.translationId) {
                currentTranslationId = commandOptions.translationId;
              }
              if (currentTranslationId) translationsItemStore(user, currentTranslationId, userInputToProcess);
              const currentTranslation = translationsGetCurrentForUser(user);
              if (commandOptions.translationType && commandOptions.item && !typeOf(commandOptions.index, 'number')) {
                const newPosition = Object.keys(currentTranslation)
                  .filter((key) => !key.includes('.') && key.startsWith(commandOptions.item))
                  .sort((a, b) => currentTranslation[a].localeCompare(currentTranslation[b]))
                  .indexOf(commandOptions.translationType);
                if (newPosition >= 0) {
                  menuPositionCurrent.splice(-1, newPosition);
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
                ),
                attribute = commandOptions.attribute;
              switch (attribute) {
                case 'state': {
                  const currentEnumeration = currentEnumerationsList[commandOptions.item],
                    currentDeviceAttributes = currentEnumeration.deviceAttributes,
                    currentState = currentEnumeration[attribute];
                  if (currentDeviceAttributes?.hasOwnProperty(currentState)) {
                    currentDeviceAttributes[userInputToProcess] = objectDeepClone(
                      currentDeviceAttributes[currentState],
                    );
                    currentDeviceAttributes[userInputToProcess].nameTranslationId = translationsGetObjectId(
                      userInputToProcess.split('.').join('_'),
                      commandOptions.item,
                      undefined,
                    );
                    delete currentDeviceAttributes[currentState];
                  }
                  currentEnumeration[attribute] = userInputToProcess;
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
                    currentEnumerationsList[commandOptions.item][attribute] = userInputToProcess;
                  } else {
                    warns(
                      `Unacceptable value '${userInputToProcess}' code conversion of attribute ` +
                        `${commandOptions.item} for function ${commandOptions.dataTypeExtraId}`,
                    );
                    telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                  }
                  break;
                }

                default: {
                  switch (commandOptions.mode) {
                    case 'setId':
                    case 'fixId': {
                      cachedValueSet(user, cachedSimpleReportIdToCreate, userInputToProcess);
                      break;
                    }

                    default: {
                      const oldIcon =
                        commandOptions.dataType === dataTypePrimaryEnums && attribute === 'icon'
                          ? currentEnumerationsList[commandOptions.item][attribute]
                          : '';
                      if (typeOf(currentEnumerationsList[commandOptions.item], 'object')) {
                        currentEnumerationsList[commandOptions.item][attribute] = userInputToProcess;
                        if (commandOptions.dataType === dataTypePrimaryEnums && attribute === 'icon') {
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
                      }
                      break;
                    }
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
              if (commandOptions.item && currentEnumerationsList?.[commandOptions.item]) {
                currentEnumerationsList[commandOptions.item].group = userInputToProcess;
              }
              enumerationsSave(
                enumerationsGetPrimaryDataType(commandOptions.groupDataType, commandOptions.groupDataTypeExtraId),
              );
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
              queryParams = queryParams || simpleReportQueryParamsTemplate();
              queryParams[commandOptions.item] = userInputToProcess;
              queryParams.queryStates = [];
              queryParams.queryPossibleStates = [];
              cachedValueSet(user, cachedSimpleReportNewQuery, queryParams);
              cachedAddToDelCachedOnBack(user, menuPositionCurrent.slice(0, -1).join('.'), cachedSimpleReportNewQuery);
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
                        parsedValueArray = currentMask?.test(userInputToProcess)
                          ? RegExp(currentMask).exec(userInputToProcess)
                          : [],
                        parsedValue =
                          parsedValueArray &&
                          parsedValueArray.length > 2 &&
                          timeIntervalsInMinutes.hasOwnProperty(parsedValueArray[2])
                            ? Number(parsedValueArray[1]) * timeIntervalsInMinutes[parsedValueArray[2]]
                            : undefined;
                      newValue = typeOf(parsedValue, 'number') ? {id: userInputToProcess, minutes: parsedValue} : null;
                      menuMessageObject.message = `${translationsItemTextGet(
                        user,
                        'WrongValue',
                      )}!\n${translationsItemTextGet(user, 'SetNewAttributeValue')} ${translationsItemTextGet(
                        user,
                        'for',
                        commandOptions.dataType,
                      )} '${translationsItemCoreGet(user, commandOptions.item)}' (${translationsItemTextGet(
                        user,
                        'CurrentValue',
                      )} = ${userInputToProcess})${
                        configItemMask ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']` : ''
                      }:`;
                    }
                    if (isDefined(newValue)) {
                      configItem.push(newValue);
                      if (menuMessageObject.message) menuMessageObject.message = '';
                    }
                  }
                  configOptions.setOption(commandOptions.item, user, configItem);
                } else {
                  const parsedValue = configOptions.parseOption(commandOptions.item, userInputToProcess);
                  if (!isDefined(parsedValue)) {
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
                      'for',
                      commandOptions.dataType,
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
              if (commandOptions.state) {
                let detailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
                  backStepsForCacheDelete = -1,
                  threshold = detailsOrThresholds;
                const mode = commandOptions.mode,
                  item = commandOptions.item;
                switch (mode) {
                  case 'add': {
                    if (commandOptions.id === thresholdEnumerable) {
                      if (typeOf(threshold, 'array') && threshold.length > 0) {
                        threshold = undefined;
                      } else {
                        detailsOrThresholds = new Array();
                        detailsOrThresholds.push({
                          isEnabled: true,
                          id: thresholdEnumerable,
                          index: 0,
                          type: commandOptions.type,
                        });
                        threshold = detailsOrThresholds[0];
                        if (typeOf(commandOptions.subItem, 'string')) {
                          menuPositionCurrent = userInputToProcess.split('.');
                        } else {
                          threshold = undefined;
                        }
                      }
                    } else if (Number.isNaN(userInputToProcess)) {
                      warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                      telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                      threshold = undefined;
                    } else if (!checkNumberStateValue(commandOptions.state, Number(userInputToProcess))) {
                      warns(`Unacceptable value '${userInputToProcess}' for state conditions`);
                      telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                      threshold = undefined;
                    } else {
                      const thresholdValue = Number(userInputToProcess),
                        thresholdId = `${thresholdValue}`;
                      if (thresholdsGetIndex(detailsOrThresholds, thresholdId) >= 0) {
                        warns(`Unacceptable value '${userInputToProcess}' - already exists such key!`);
                        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                        threshold = undefined;
                      } else {
                        if (!typeOf(detailsOrThresholds, 'array')) detailsOrThresholds = new Array();
                        detailsOrThresholds.push({
                          isEnabled: true,
                          id: thresholdId,
                          index: 0,
                          type: 'number',
                          value: thresholdValue,
                          onAbove: true,
                          onBelow: true,
                          [onTimeIntervalId]: 0,
                        });
                        detailsOrThresholds = triggersSort(detailsOrThresholds);
                        menuPositionCurrent.push(thresholdsGetIndex(detailsOrThresholds, thresholdId));
                        backStepsForCacheDelete--;
                      }
                    }
                    break;
                  }

                  case 'edit': {
                    const thresholdId = commandOptions.id,
                      thresholdIndex = typeOf(thresholdId, 'string')
                        ? thresholdsGetIndex(detailsOrThresholds, thresholdId)
                        : -1;
                    if (thresholdIndex >= 0) {
                      threshold = detailsOrThresholds[thresholdIndex];
                      if (thresholdId !== thresholdEnumerable) backStepsForCacheDelete--;
                    }
                    if (threshold) {
                      switch (item) {
                        case 'value': {
                          if (Number.isNaN(userInputToProcess)) {
                            warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                            threshold = undefined;
                          } else if (!checkNumberStateValue(commandOptions.state, Number(userInputToProcess))) {
                            warns(`Unacceptable value '${userInputToProcess}' for state conditions`);
                            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                            threshold = undefined;
                          } else {
                            const thresholdValue = Number(userInputToProcess),
                              thresholdId = `${thresholdValue}`;
                            if (thresholdsGetIndex(detailsOrThresholds, thresholdId) >= 0) {
                              warns(`Unacceptable value '${userInputToProcess}' - already exists such key!`);
                              telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                              threshold = undefined;
                            } else {
                              threshold.value = thresholdValue;
                              threshold.id = thresholdId;
                              detailsOrThresholds = triggersSort(detailsOrThresholds);
                              menuPositionCurrent.splice(-1, 1, thresholdsGetIndex(detailsOrThresholds, thresholdId));
                            }
                          }
                          break;
                        }

                        case onTimeIntervalId:
                        case onTimeIntervalIndividualId: {
                          if (Number.isNaN(userInputToProcess)) {
                            warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                            telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                            threshold = undefined;
                          } else {
                            const thresholdValue = Number(userInputToProcess);
                            if (item === onTimeIntervalId) {
                              const intervalsIndividual = threshold[onTimeIntervalIndividualId];
                              threshold[item] = thresholdValue;
                              if (typeOf(intervalsIndividual, 'map') && intervalsIndividual.size > 0) {
                                const intervalIndividualKeys = Array.from(intervalsIndividual.keys());
                                intervalIndividualKeys.forEach((valueId) => {
                                  if (intervalsIndividual.get(valueId) === thresholdValue) {
                                    intervalsIndividual.delete(valueId);
                                  }
                                });
                              }
                            } else if (isDefined(commandOptions.subItem)) {
                              const valueId = commandOptions.subItem,
                                timeIntervalCommon = typeOf(threshold[onTimeIntervalId], 'number')
                                  ? threshold[onTimeIntervalId]
                                  : 0;
                              backStepsForCacheDelete--;
                              if (thresholdValue !== timeIntervalCommon) {
                                if (!typeOf(threshold[item], 'map')) threshold[item] = new Map();
                                threshold[item].set(valueId, thresholdValue);
                              } else if (threshold[item].has(valueId)) {
                                threshold[item].delete(valueId);
                              }
                            }
                            if (
                              threshold.hasOwnProperty(onTimeIntervalIndividualId) &&
                              (!typeOf(threshold[onTimeIntervalIndividualId], 'map') ||
                                threshold[onTimeIntervalIndividualId].size === 0)
                            ) {
                              delete threshold[onTimeIntervalIndividualId];
                            }
                          }
                          break;
                        }

                        case alertMessageTemplateId: {
                          backStepsForCacheDelete--;
                        }
                        // eslint-disable-next-line no-fallthrough
                        default: {
                          threshold[item] = userInputToProcess;
                        }
                      }
                    }
                    break;
                  }

                  default: {
                    threshold = undefined;
                    break;
                  }
                }
                if (threshold) {
                  cachedValueSet(user, cachedAlertThresholdSet, detailsOrThresholds);
                  cachedAddToDelCachedOnBack(
                    user,
                    menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
                    cachedAlertThresholdSet,
                  );
                  menuMenuItemsAndRowsClearCached(user);
                }
              }
              break;
            }

            case dataTypeTrigger: {
              if (commandOptions.state) {
                let triggers = triggersGetStateTriggers(
                    user,
                    typeOf(commandOptions.triggerState, 'string') ? commandOptions.triggerState : commandOptions.state,
                  ),
                  backStepsForCacheDelete = -1;
                if (!typeOf(triggers, 'array')) triggers = new Array();
                switch (commandOptions.mode) {
                  case 'add': {
                    const triggerType = commandOptions.triggerType,
                      stateObjectCommon = commandOptions.stateObject?.common;
                    let triggerValue;
                    if (triggerType === 'number') {
                      if (Number.isNaN(userInputToProcess)) {
                        warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                        triggers = undefined;
                      } else if (!checkNumberStateValue(commandOptions.state, Number(userInputToProcess))) {
                        warns(`Unacceptable value '${userInputToProcess}' for state conditions`);
                        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                        triggers = undefined;
                      } else {
                        triggerValue = Number(userInputToProcess);
                      }
                    } else {
                      triggerValue = userInputToProcess;
                    }
                    let trigger,
                      triggerIdPrefix = `${triggerValue}`;
                    if (
                      triggerType === 'boolean' ||
                      (stateObjectCommon.hasOwnProperty('states') && ['string', 'number'].includes(triggerType))
                    ) {
                      trigger = {
                        id: triggerIdPrefix,
                        index: 0,
                        isEnabled: false,
                        type: triggerType,
                        value: triggerValue,
                        [onTimeIntervalId]: 0,
                        targetState: '',
                        targetFunction: undefined,
                        targetValue: undefined,
                        conditions: undefined,
                      };
                    } else if (triggerType === 'number') {
                      triggerIdPrefix = [triggerIdPrefix, 'onAbove'].join('.');
                      trigger = {
                        id: triggerIdPrefix,
                        index: 0,
                        isEnabled: false,
                        type: triggerType,
                        value: triggerValue,
                        [onTimeIntervalId]: 0,
                        onAbove: true,
                        onBelow: false,
                        targetState: '',
                        targetFunction: undefined,
                        targetValue: undefined,
                        conditions: undefined,
                      };
                    }
                    if (typeOf(trigger, 'object')) {
                      backStepsForCacheDelete--;
                      // @ts-ignore
                      trigger.index = triggersGetMaxSubIndex(triggers, `${triggerIdPrefix}#`) + 1;
                      // @ts-ignore
                      trigger.id = `${triggerIdPrefix}#${trigger.index}`;
                      triggers.push(trigger);
                      triggers = triggersSort(triggers);
                      // @ts-ignore
                      menuPositionCurrent.push(thresholdsGetIndex(triggers, trigger.id));
                    }
                    break;
                  }

                  case 'edit': {
                    if (typeOf(commandOptions.id, 'string')) {
                      const triggerId = commandOptions.id,
                        triggerIndex = thresholdsGetIndex(triggers, triggerId);
                      if (triggerIndex >= 0) {
                        const trigger = triggers[triggerIndex],
                          item = commandOptions.item;
                        backStepsForCacheDelete--;
                        switch (item) {
                          case 'value':
                          case onTimeIntervalId: {
                            if (Number.isNaN(userInputToProcess)) {
                              warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                              telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgValueUnacceptable'));
                              triggers = undefined;
                            } else {
                              const triggerValue = Number(userInputToProcess);
                              if (item === 'value') {
                                if (!checkNumberStateValue(commandOptions.state, triggerValue)) {
                                  warns(`Unacceptable value '${userInputToProcess}' for state conditions`);
                                  telegramMessageDisplayPopUp(
                                    user,
                                    translationsItemTextGet(user, 'MsgValueUnacceptable'),
                                  );
                                  triggers = undefined;
                                } else {
                                  const triggerIdPrefix = [triggerValue, trigger.onAbove ? 'onAbove' : 'onBelow'].join(
                                    '.',
                                  );
                                  trigger.index = triggersGetMaxSubIndex(triggers, `${triggerIdPrefix}#`) + 1;
                                  trigger.value = triggerValue;
                                  trigger.id = `${triggerIdPrefix}#${trigger.index}`;
                                  trigger.isEnabled = false;
                                  triggers = triggersSort(triggers);
                                  menuPositionCurrent.splice(-1, 1, thresholdsGetIndex(triggers, trigger.id));
                                }
                              } else {
                                trigger[item] = triggerValue;
                                break;
                              }
                            }
                            break;
                          }
                          case 'targetValue': {
                            const targetStateObject = commandOptions.stateObject,
                              targetStateObjectCommon = targetStateObject?.common,
                              targetStateType = targetStateObjectCommon?.type;
                            let targetValue;
                            if (targetStateType === 'number') {
                              if (Number.isNaN(userInputToProcess)) {
                                warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                                telegramMessageDisplayPopUp(
                                  user,
                                  translationsItemTextGet(user, 'MsgValueUnacceptable'),
                                );
                                triggers = undefined;
                              } else {
                                targetValue = Number(userInputToProcess);
                                if (!checkNumberStateValue(trigger.targetState, targetValue, targetStateObject)) {
                                  warns(`Unacceptable value '${targetValue}' for state conditions`);
                                  telegramMessageDisplayPopUp(
                                    user,
                                    translationsItemTextGet(user, 'MsgValueUnacceptable'),
                                  );
                                  triggers = undefined;
                                }
                              }
                            } else {
                              targetValue = userInputToProcess;
                            }
                            if (triggers) trigger[item] = targetValue;
                            break;
                          }

                          case 'conditions': {
                            const conditions = trigger.conditions,
                              index = commandOptions.index,
                              subItem = commandOptions.subItem;
                            if (typeOf(conditions, 'array') && typeOf(index, 'number') && subItem) {
                              const length = conditions.length;
                              if (index < length) {
                                backStepsForCacheDelete -= 2;
                                const condition = conditions[index];
                                switch (subItem) {
                                  case 'value': {
                                    const conditionStateObject = commandOptions.stateObject,
                                      conditionStateObjectCommon = conditionStateObject?.common,
                                      conditionStateType = conditionStateObjectCommon?.type;
                                    let conditionValue;
                                    if (conditionStateType === 'number') {
                                      if (Number.isNaN(userInputToProcess)) {
                                        warns(`Unacceptable value '${userInputToProcess}' for number conditions`);
                                        telegramMessageDisplayPopUp(
                                          user,
                                          translationsItemTextGet(user, 'MsgValueUnacceptable'),
                                        );
                                        triggers = undefined;
                                      } else {
                                        conditionValue = Number(userInputToProcess);
                                        if (
                                          !checkNumberStateValue(
                                            trigger.targetState,
                                            conditionValue,
                                            conditionStateObject,
                                          )
                                        ) {
                                          warns(`Unacceptable value '${conditionValue}' for state conditions`);
                                          telegramMessageDisplayPopUp(
                                            user,
                                            translationsItemTextGet(user, 'MsgValueUnacceptable'),
                                          );
                                          triggers = undefined;
                                        }
                                      }
                                    } else {
                                      conditionValue = userInputToProcess;
                                    }
                                    if (triggers) condition[subItem] = conditionValue;
                                    break;
                                  }

                                  default: {
                                    triggers = undefined;
                                    break;
                                  }
                                }
                              } else {
                                triggers = undefined;
                              }
                            } else {
                              triggers = undefined;
                            }
                            break;
                          }

                          case alertMessageTemplateId: {
                            backStepsForCacheDelete--;
                          }
                          // eslint-disable-next-line no-fallthrough
                          default: {
                            const triggerValue = userInputToProcess;
                            trigger[item] = triggerValue;
                            break;
                          }
                        }
                      } else {
                        triggers = undefined;
                      }
                    } else {
                      triggers = undefined;
                    }
                    break;
                  }

                  default: {
                    triggers = undefined;
                  }
                }
                if (typeOf(triggers, 'array')) {
                  cachedValueSet(user, cachedTriggersDetails, triggers);
                  cachedAddToDelCachedOnBack(
                    user,
                    menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
                    cachedTriggersDetails,
                  );
                  menuMenuItemsAndRowsClearCached(user);
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
      }
    }
    if (isWaitForInput) {
      logs(`isWaitForInput.end: menuMessageObject.message = ${menuMessageObject.message}`);
      if (menuMessageObject.message) {
        menuMessageObject.message += botMessageStamp;
        cachedValueSet(user, cachedLastMessage, '');
        telegramMessageObjectPush(user, menuMessageObject, {
          clearBefore: user.userId !== user.chatId || commandCurrent !== cmdGetInput,
          clearUserMessage: user.userId === user.chatId,
          createNewMessage: false,
          isSilent: false,
        });
      } else {
        cachedValueSet(user, cachedIsWaitForInput, false);
        /** if it private chat - delete user input, if it group - clear menu, and recreate it after user input **/
        menuMenuDraw(user, menuPositionCurrent, {
          clearBefore: user.userId !== user.chatId || commandCurrent !== cmdGetInput,
          clearUserMessage: user.userId === user.chatId && commandCurrent === cmdGetInput,
        });
      }
    } else {
      menuMenuDraw(user, menuPositionCurrent);
    }
  } else if (commandCurrent.indexOf(cmdClose) === 0) {
    logs(`menuClose: currentCommand = ${commandCurrent}`);
    menuMenuClose(user);
  } else if (commandCurrent.indexOf(cmdBack) === 0) {
    logs(`menuBack: currentCommand = ${commandCurrent}`);
    menuPositionCurrent = commandCurrent.replace(cmdBack, '');
    if (cachedValueExists(user, cachedDelCachedOnBack)) {
      const cachedToDelete = cachedValueGet(user, cachedDelCachedOnBack);
      if (cachedToDelete?.hasOwnProperty(menuPositionCurrent)) {
        if (Array.isArray(cachedToDelete[menuPositionCurrent])) {
          cachedToDelete[menuPositionCurrent].forEach((cachedId) => cachedValueDelete(user, cachedId));
        }
        delete cachedToDelete[menuPositionCurrent];
      }
      cachedValueSet(user, cachedDelCachedOnBack, {...cachedToDelete});
    }
    menuPositionCurrent = menuMenuItemExtractPosition(menuPositionCurrent);
    menuMenuDraw(user, menuPositionCurrent);
  } else if (configOptions.getOption(cfgMessagesForMenuCall, user).includes(commandCurrent)) {
    logs(`menuCall: currentCommand = ${commandCurrent}`);
    /** if it private chat - delete user input, if configured **/
    menuMenuDraw(user, undefined, {
      clearBefore: true,
      clearUserMessage: configOptions.getOption(cfgClearMenuCall, user) && user.userId === user.chatId,
    });
  } else if (commandCurrent.indexOf(menuItemButtonPrefix) === 0) {
    logs(`menuItem.go: currentCommand = ${commandCurrent}`);
    menuMenuDraw(user, menuMenuItemExtractPosition(commandCurrent.replace(menuItemButtonPrefix, '')));
  } else {
    logs(`otherCommands.start: currentCommand = ${commandCurrent}`);
    switch (commandCurrent) {
      case cmdGetInput: {
        switch (commandOptions.dataType) {
          case dataTypeTranslation: {
            let currentTranslationId = commandOptions.translationType,
              currentTranslationValue;
            if (
              currentTranslationId &&
              typeOf(commandOptions.item, 'number') &&
              typeOf(commandOptions.index, 'number')
            ) {
              let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
              if (
                destTranslation &&
                typeOf(destTranslation) === 'object' &&
                Object.keys(destTranslation).length > commandOptions.item
              ) {
                currentTranslationId += `.destinations.${Object.keys(destTranslation)[commandOptions.item]}`;
                destTranslation = destTranslation[Object.keys(destTranslation)[commandOptions.item]];
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > commandOptions.index
                ) {
                  currentTranslationId += `.${Object.keys(destTranslation)[commandOptions.index]}`;
                  currentTranslationValue = destTranslation[Object.keys(destTranslation)[commandOptions.index]];
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
                switch (commandOptions.mode) {
                  case 'setId':
                  case 'fixId': {
                    const simpleReportId = cachedValueGet(user, cachedSimpleReportIdToCreate),
                      dataTypeText = translationsItemTextGet(user, 'for', commandOptions.dataType),
                      setAction = simpleReportId ? 'fix' : 'set',
                      reportIdPart = simpleReportId ? `= ${simpleReportId}` : '';
                    menuMessageObject.message = `${translationsItemTextGet(
                      user,
                      'SetNewAttributeValue',
                    )} ${dataTypeText} ${translationsItemTextGet(user, setAction, 'reportId')} ${reportIdPart}`;
                    cachedValueDelete(user, cachedSimpleReportIdToCreate);
                    break;
                  }

                  default: {
                    menuMessageObject.message = `${translationsItemTextGet(
                      user,
                      'SetNewAttributeValue',
                    )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} "${translationsItemMenuGet(
                      user,
                      commandOptions.attribute,
                    )}" = ${currentEnumerationsList?.[commandOptions.item]?.[commandOptions.attribute]}:`;
                    break;
                  }
                }

                break;
              }
            }
            break;
          }

          case dataTypeMenuRoles: {
            switch (commandOptions.mode) {
              case 'setId':
              case 'fixId': {
                const newRoleId = cachedValueGet(user, cachedRolesNewRoleId),
                  dataTypeText = translationsItemTextGet(user, 'for', commandOptions.dataType),
                  roleIdPart = newRoleId ? `= ${newRoleId}` : '',
                  setAction = newRoleId ? 'fix' : 'set';
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${dataTypeText} ${translationsItemTextGet(user, setAction, 'RoleId')} ${roleIdPart}`;
                cachedValueDelete(user, cachedRolesNewRoleId);
                break;
              }

              default: {
                // NOSONAR // menuMessageObject.message =  `${getFromTranslation(user, generateTranslationIdForText('SetNewAttributeValue'))} ${getFromTranslation(user, generateTextId('for', commandOptions.dataType))} "${getFromTranslation(user, generateTextId(commandOptions.dataType, currentParam))}" = ${enumerationItems[commandOptions.dataType].list[currentItem][currentParam]}:`;
                break;
              }
            }
            break;
          }

          case dataTypeReportMember: {
            const queryParams = cachedValueGet(user, cachedSimpleReportNewQuery),
              attributeValue = queryParams?.hasOwnProperty(commandOptions.item)
                ? `= ${queryParams[commandOptions.item]}`
                : '',
              queryItem = commandOptions.item;
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'ForReportQuery')} ${translationsItemTextGet(
              user,
              queryItem,
            )} ${attributeValue}`;
            break;
          }

          case dataTypeAlertSubscribed: {
            const attributeValue = commandOptions.value ? ` = ${commandOptions.value}` : '';
            menuMessageObject.message = `${translationsItemTextGet(
              user,
              'SetNewAttributeValue',
            )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)} ${translationsItemTextGet(
              user,
              commandOptions.item,
            )}${attributeValue}:`;
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
              const itemText = translationsItemTextGet(user, commandOptions.item);
              if (commandOptions.item === cfgMenuLanguage) {
                const newLanguageId = cachedValueGet(user, cachedConfigNewLanguageId),
                  actionText = newLanguageId ? 'FixNewAttributeValue' : 'SetNewAttributeValue',
                  languageIdPart = newLanguageId ? `(${newLanguageId})` : '';
                menuMessageObject.message = `${translationsItemTextGet(user, actionText)} ${translationsItemTextGet(
                  user,
                  'for',
                  commandOptions.dataType,
                )} ${translationsItemCoreGet(user, commandOptions.item)}'${languageIdPart}:`;
              } else {
                const currentValueText = translationsItemTextGet(user, 'CurrentValue'),
                  configItemText = `${currentValueText} = ${configItem}`,
                  configItemMaskText = configItemMask
                    ? ` [${translationsItemTextGet(user, 'Mask')}: '${configItemMask}']`
                    : '';
                menuMessageObject.message = `${translationsItemTextGet(
                  user,
                  'SetNewAttributeValue',
                )} ${translationsItemTextGet(
                  user,
                  'for',
                  commandOptions.dataType,
                )} '${itemText}' (${configItemText})${configItemMaskText}:`;
              }
            }
            break;
          }

          default: {
            if (typeOf(commandOptions?.['valueOptions'], 'object')) {
              const valueOptions = commandOptions?.valueOptions,
                currentName = valueOptions?.valueName
                  ? valueOptions.valueName
                  : translationsItemTextGet(user, 'for', commandOptions.dataType),
                currentValue = commandOptions?.value,
                actionText = translationsItemTextGet(user, 'SetNewAttributeValue'),
                currentValueText = translationsItemTextGet(user, 'CurrentValue'),
                unitText = valueOptions.hasOwnProperty('unit') ? ` ${valueOptions['unit']}` : '';
              menuMessageObject.message = `${actionText} '${currentName}' (${currentValueText} = ${
                currentValue || iconItemNotFound
              }${unitText})`;
              if (commandOptions?.['valueType'] === 'number') {
                menuMessageObject.message += `, ${translationsItemTextGet(user, 'Number')}`; //
                if (valueOptions.hasOwnProperty('min') || valueOptions.hasOwnProperty('max')) {
                  menuMessageObject.message += '[';
                  if (valueOptions.hasOwnProperty('min')) {
                    menuMessageObject.message += `${translationsItemTextGet(user, 'Min')} = ${valueOptions.min}`;
                  }
                  menuMessageObject.message += ' - ';
                  if (valueOptions.hasOwnProperty('max')) {
                    menuMessageObject.message += `${translationsItemTextGet(user, 'Max')} = ${valueOptions.max}`;
                  }
                  menuMessageObject.message += ']';
                }
              }
              menuMessageObject.message += ':';
            } else {
              menuMessageObject.message = `${translationsItemTextGet(
                user,
                'SetNewAttributeValue',
              )} ${translationsItemTextGet(user, 'for', commandOptions.dataType)}:`;
            }
            break;
          }
        }
        logs(`otherCommands.cmdGetInput.end: menuMessageObject.message = ${menuMessageObject.message}`);
        if (menuMessageObject.message) {
          menuMessageObject.message += botMessageStamp;
          menuMessageObject.buttons = [];
          cachedValueSet(user, cachedIsWaitForInput, userInputToProcess);
          telegramMessageObjectPush(user, menuMessageObject, {
            clearBefore: false,
            clearUserMessage: false,
            createNewMessage: false,
            isSilent: false,
          });
          menuPositionCurrent = undefined;
        }
        break;
      }

      case cmdHome: {
        if (cachedValueExists(user, cachedDelCachedOnBack)) {
          const cachedToDelete = cachedValueGet(user, cachedDelCachedOnBack);
          Object.keys(cachedToDelete).forEach((itemsToDelete) => {
            if (Array.isArray(cachedToDelete[itemsToDelete])) {
              cachedToDelete[itemsToDelete].forEach((cachedId) => cachedValueDelete(user, cachedId));
              delete cachedToDelete[itemsToDelete];
            }
          });
          cachedValueDelete(user, cachedDelCachedOnBack);
        }
        menuPositionCurrent = [];
        break;
      }

      case cmdSetState: {
        setStateValue(user, commandOptions.state, commandOptions.value);
        break;
      }

      case cmdExternalCommand: {
        logs(`otherCommands.external:\n- currentCommand = ${jsonStringify(commandOptions)}`);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgErrorNoResponse'));
          errs(
            `Error! No response from external command ${commandOptions.item} for function ${commandOptions.dataType}`,
          );
        }, configOptions.getOption(cfgExternalMenuTimeout) + 10);
        logs(
          `External command ${commandOptions.item} for function ${commandOptions.function}, ` +
            `with params ${commandOptions.attribute}`,
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
        menuPositionCurrent = undefined;
        break;
      }

      case cmdAcknowledgeAlert:
      case cmdAcknowledgeAllAlerts:
      case cmdAcknowledgeAndUnsubscribeAlert: {
        const alertMessages = alertGetMessages(user),
          alertMessagesNonAcknowledged = alertMessages.filter((alertMessage) => !alertMessage.ack).reverse(),
          alertAcknowledge = (alertMessage) => {
            alertMessage.ack = true;
            if (commandCurrent === cmdAcknowledgeAndUnsubscribeAlert) alertsManage(user, alertMessage.id);
            return commandCurrent === cmdAcknowledgeAllAlerts;
          };
        alertMessagesNonAcknowledged.every(alertAcknowledge);
        if (alertMessagesNonAcknowledged.length) {
          alertsStoreMessagesToCache(user, alertMessages);
          menuMenuItemsAndRowsClearCached(user);
        } else {
          menuPositionCurrent = undefined;
        }
        break;
      }

      case cmdItemSetInterimValue: {
        if (typeOf(commandOptions.valueOptions?.interimItemId, 'string')) {
          const interimItemId = commandOptions.valueOptions.interimItemId,
            interimCalculationMode = commandOptions.valueOptions?.interimCalculationMode;
          let interimValue;
          switch (interimCalculationMode) {
            case interimCalculationSummarize: {
              const valueCurrent = commandOptions.valueOptions?.valueCurrent,
                modificator = isDefined(commandOptions.value) ? Number(commandOptions.value) : 0;
              switch (commandOptions.valueOptions?.type) {
                case 'time': {
                  switch (commandOptions.valueOptions?.mode) {
                    case timeInternalModeTime: {
                      if (typeOf(commandOptions.valueOptions?.template, 'string')) {
                        const template = commandOptions.valueOptions.template;
                        interimValue = timeInternalToString(
                          modificator + stringToTimeInternal(valueCurrent, template),
                          template,
                        );
                      }
                      break;
                    }

                    default: {
                      interimValue =
                        (isDefined(commandOptions.value) ? Number(commandOptions.value) : 0) +
                        (isDefined(valueCurrent) ? Number(valueCurrent) : 0);
                      break;
                    }
                  }

                  break;
                }

                default: {
                  const valueBase = typeOf(valueCurrent, 'number') ? valueCurrent : 0,
                    valueBaseDecimals = countDecimals(valueBase),
                    valueModifier = typeOf(commandOptions.value, 'number') ? commandOptions.value : 0,
                    valueModifierDecimals = countDecimals(valueModifier),
                    maxDecimals = valueBaseDecimals > valueModifierDecimals ? valueBaseDecimals : valueModifierDecimals;
                  interimValue = valueBase + valueModifier;
                  if (maxDecimals > 0) interimValue = Math.round(interimValue * 10 ** maxDecimals) / 10 ** maxDecimals;
                  break;
                }
              }
              break;
            }
            case interimCalculationSelectMultiple: {
              if (isDefined(commandOptions.values) && isDefined(commandOptions.value)) {
                const value = commandOptions.value;
                interimValue = [...commandOptions.values];
                if (interimValue.includes(value)) {
                  interimValue = interimValue.filter((item) => item !== value);
                } else {
                  interimValue.push(value);
                  if (typeOf(value) === 'number') interimValue = interimValue.sort((a, b) => a - b);
                }
              } else if (
                typeOf(commandOptions.valueOptions?.resetValue, 'boolean') &&
                commandOptions.valueOptions?.resetValue &&
                isDefined(commandOptions.valueOptions?.valuesDefault)
              ) {
                interimValue = commandOptions.valueOptions.valuesDefault;
              }
              break;
            }
            case interimCalculationReplace:
            default: {
              interimValue =
                commandOptions.valueType === 'number' ? Number(commandOptions.value) : commandOptions.value;
              break;
            }
          }
          if (isDefined(interimValue)) cachedValueSet(user, cachedInterimValue, {[interimItemId]: interimValue});
        }
        menuMenuItemsAndRowsClearCached(user);
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
            if (typeOf(commandOptions.attribute, 'string')) {
              if (
                enumerationsDeviceStatesTypes.includes(commandOptions.dataType) &&
                enumerationsDeviceButtonsAccessLevelAttrs.includes(commandOptions.attribute)
              ) {
                currentDataItem[commandOptions.attribute] = commandOptions.value;
              } else {
                switch (typeOf(currentDataItem[commandOptions.attribute])) {
                  case 'boolean': {
                    if (!isDefined(commandOptions.value)) {
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
                menuPositionCurrent.splice(-2, 2, dataTypePrimaryEnums);
              }
            }
            break;
          }

          case dataTypeGroups: {
            const currentEnumerationsList = enumerationsGetList(
              commandOptions.groupDataType,
              commandOptions.groupDataTypeExtraId,
            );
            if (commandOptions.item && currentEnumerationsList?.[commandOptions.item]) {
              currentEnumerationsList[commandOptions.item].group =
                currentEnumerationsList[commandOptions.item].group === commandOptions.group ? '' : commandOptions.group;
            }
            enumerationsSave(
              enumerationsGetPrimaryDataType(commandOptions.groupDataType, commandOptions.groupDataTypeExtraId),
            );
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
                menuPositionCurrent.splice(-1, 1);
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
            const thresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
              currentThresholdIndex = thresholdsGetIndex(thresholds, commandOptions.id);
            if (currentThresholdIndex >= 0) {
              const threshold = thresholds[currentThresholdIndex];
              threshold[commandOptions.item] = !threshold[commandOptions.item];
              if (['onAbove', 'onBelow'].includes(commandOptions.item)) {
                if (threshold.onAbove !== threshold.onBelow) {
                  delete threshold[onTimeIntervalIndividualId];
                }
              }
              cachedValueSet(user, cachedAlertThresholdSet, thresholds);
              cachedAddToDelCachedOnBack(user, menuPositionCurrent.slice(0, -2).join('.'), cachedAlertThresholdSet);
            }
            break;
          }

          case dataTypeTrigger: {
            if (commandOptions.state) {
              const state = commandOptions.state,
                mode = commandOptions.mode;
              let triggers = triggersGetStateTriggers(user, state),
                backStepsForCacheDelete = -1;
              switch (mode) {
                case 'save': {
                  if (commandOptions.function && commandOptions.destination && typeOf(triggers, 'array')) {
                    triggersTimeRangeStartTimesUpdate(user, state);
                    alertsManage(user, state, commandOptions.function, commandOptions.destination, triggers, true);
                    cachedValueDelete(user, cachedTriggersDetails);
                    menuMenuItemsAndRowsClearCached(user);
                    triggers = undefined;
                  }
                  break;
                }

                case 'edit': {
                  if (
                    typeOf(commandOptions.item, 'string') &&
                    commandOptions.item.length &&
                    typeOf(commandOptions.id, 'string')
                  ) {
                    const triggerAttributeId = commandOptions.item,
                      triggerIndex = thresholdsGetIndex(triggers, commandOptions.id);
                    if (triggerIndex >= 0) {
                      backStepsForCacheDelete--;
                      const trigger = triggers[triggerIndex];
                      switch (triggerAttributeId) {
                        case 'onAbove':
                        case 'onBelow': {
                          const triggerIdPrefix = [trigger.value, trigger.onAbove ? 'onBelow' : 'onAbove'].join('.');
                          trigger.index = triggersGetMaxSubIndex(triggers, `${triggerIdPrefix}#`) + 1;
                          trigger.onAbove = !trigger.onAbove;
                          trigger.onBelow = !trigger.onBelow;
                          trigger.id = `${triggerIdPrefix}#${trigger.index}`;
                          trigger.isEnabled = false;
                          triggers = triggersSort(triggers);
                          menuPositionCurrent.splice(-1, 1, thresholdsGetIndex(triggers, trigger.id));
                          break;
                        }

                        case 'targetState': {
                          if (trigger[triggerAttributeId] !== commandOptions.value) {
                            trigger.isEnabled = false;
                            trigger.targetValue = undefined;
                          }
                          trigger[triggerAttributeId] = commandOptions.value;
                          trigger.targetFunction = commandOptions.function;
                          trigger.targetDestination = commandOptions.destination;
                          if (typeOf(commandOptions.currentIndex, 'string'))
                            menuPositionCurrent = commandOptions.currentIndex.split('.');
                          menuPositionCurrent.splice(-1, 1);
                          break;
                        }

                        case 'targetValue': {
                          trigger[triggerAttributeId] = commandOptions.value;
                          menuPositionCurrent.splice(-1, 1);
                          break;
                        }

                        case 'users': {
                          const users = commandOptions.values;
                          if (!typeOf(users, 'array') || users.length === 0) {
                            delete trigger[triggerAttributeId];
                          } else {
                            trigger[triggerAttributeId] = [...users];
                          }
                          break;
                        }

                        case 'isEnabled':
                        case 'log': {
                          if (trigger[triggerAttributeId]) {
                            trigger[triggerAttributeId] = false;
                          } else if (
                            triggerAttributeId === 'log' ||
                            (!trigger[triggerAttributeId] && trigger.targetState && isDefined(trigger.targetValue))
                          ) {
                            trigger[triggerAttributeId] = true;
                          } else {
                            triggers = undefined;
                          }
                          break;
                        }

                        case triggersTimeRangeId: {
                          if (!typeOf(trigger?.[triggerAttributeId], 'object')) trigger[triggerAttributeId] = {};
                          const triggerTimeRange = trigger[triggerAttributeId],
                            triggerTimeRangeAttributeId = commandOptions.subItem;
                          backStepsForCacheDelete--;
                          delete triggerTimeRange[triggerTimeRangeStartTimes];
                          switch (triggerTimeRangeAttributeId) {
                            case triggersTimeRangeHours:
                            case triggersTimeRangeMonths:
                            case triggersTimeRangeQuarters:
                            case triggersTimeRangeSeasons:
                            case triggersTimeRangeDaysOfWeek: {
                              trigger[triggerAttributeId][triggerTimeRangeAttributeId] = commandOptions.values;
                              if (
                                trigger[triggerAttributeId][triggerTimeRangeAttributeId].length ===
                                triggersTimeRangeAttributesGenerateDefaults(triggerTimeRangeAttributeId).length
                              )
                                delete triggerTimeRange[triggerTimeRangeAttributeId];
                              break;
                            }
                            case triggersTimeRangeHoursWithMinutes:
                            case triggersTimeRangeMonthsWithDays: {
                              if (typeOf(commandOptions.index, 'number')) {
                                if (typeOf(commandOptions.subIndex, 'number')) {
                                  let currentTimeRangeDelta = new Array(new Array(), new Array());
                                  const timeTemplate = commandOptions.timeTemplate;
                                  if (cachedValueExists(user, cachedTriggersTimeRangeDelta)) {
                                    currentTimeRangeDelta = cachedValueGet(user, cachedTriggersTimeRangeDelta);
                                  } else if (
                                    triggerTimeRange[triggerTimeRangeAttributeId]?.length &&
                                    triggerTimeRange[triggerTimeRangeAttributeId]?.length > commandOptions.index
                                  ) {
                                    currentTimeRangeDelta =
                                      triggerTimeRange[triggerTimeRangeAttributeId][commandOptions.index];
                                  }
                                  if (
                                    currentTimeRangeDelta &&
                                    typeOf(timeTemplate, 'string') &&
                                    timeTemplate.length === 2
                                  ) {
                                    const multiplier = timeInternalPerUnitMultipliers[timeTemplate[0]][timeTemplate[1]];
                                    currentTimeRangeDelta[commandOptions.subIndex] = [
                                      Math.trunc(commandOptions.value / multiplier),
                                      commandOptions.value % multiplier,
                                    ];
                                    cachedValueSet(user, cachedTriggersTimeRangeDelta, currentTimeRangeDelta);
                                    cachedAddToDelCachedOnBack(
                                      user,
                                      menuPositionCurrent.slice(0, -1).join('.'),
                                      cachedTriggersTimeRangeDelta,
                                    );
                                    triggers = undefined;
                                  }
                                } else if (typeOf(commandOptions.value) === 'array') {
                                  const subItemWasBlank = !typeOf(
                                    triggerTimeRange[triggerTimeRangeAttributeId],
                                    'array',
                                  );
                                  backStepsForCacheDelete--;
                                  cachedValueDelete(user, cachedTriggersTimeRangeDelta);
                                  if (subItemWasBlank) triggerTimeRange[triggerTimeRangeAttributeId] = [];
                                  if (triggerTimeRange[triggerTimeRangeAttributeId].length > commandOptions.index) {
                                    triggerTimeRange[triggerTimeRangeAttributeId][commandOptions.index] =
                                      commandOptions.value;
                                  } else {
                                    triggerTimeRange[triggerTimeRangeAttributeId].push(commandOptions.value);
                                  }
                                  if (subItemWasBlank) {
                                    switch (triggerTimeRangeAttributeId) {
                                      case triggersTimeRangeHoursWithMinutes: {
                                        menuPositionCurrent.push(Number(menuPositionCurrent.pop()) - 1);
                                        break;
                                      }
                                      case triggersTimeRangeMonthsWithDays: {
                                        menuPositionCurrent.push(Number(menuPositionCurrent.pop()) - 3);
                                        break;
                                      }
                                      default: {
                                        break;
                                      }
                                    }
                                  }
                                }
                              }
                              break;
                            }
                            default: {
                              break;
                            }
                          }
                          if (typeOf(triggers, 'array') && Object.keys(triggerTimeRange).length === 0) {
                            delete trigger[triggerAttributeId];
                          } else {
                            triggerTimeRange[triggerTimeRangeStartTimes] = triggerTimeRangeGenerateStartTimes(
                              trigger[triggerAttributeId],
                            );
                          }
                          break;
                        }

                        case 'conditions': {
                          const conditions = typeOf(trigger.conditions, 'array') ? trigger.conditions : [],
                            length = conditions.length,
                            index = commandOptions.index,
                            subItem = commandOptions.subItem;
                          if (typeOf(index, 'number') && typeOf(subItem, 'string') && index <= length) {
                            if (!typeOf(trigger.conditions, 'array')) trigger.conditions = conditions;
                            backStepsForCacheDelete -= 2;
                            const subMode = index === length ? 'add' : 'edit';
                            if (index === length) {
                              conditions.push({
                                isEnabled: false,
                                state: undefined,
                                function: undefined,
                                destination: undefined,
                                operator: undefined,
                                value: undefined,
                              });
                            }
                            const condition = conditions[index];
                            switch (subItem) {
                              case 'isEnabled': {
                                if (!condition.isEnabled) {
                                  const {state, value, operator} = condition;
                                  condition.isEnabled =
                                    typeOf(state, 'string') &&
                                    state !== '' &&
                                    isDefined(value) &&
                                    typeOf(operator, 'string') &&
                                    operator !== '';
                                } else {
                                  condition.isEnabled = false;
                                }
                                break;
                              }

                              case 'state':
                              case 'value':
                              case 'operator': {
                                if (subItem === 'state') {
                                  if (condition.state !== commandOptions.value) {
                                    condition.isEnabled = false;
                                    condition.value = undefined;
                                    condition.operator = undefined;
                                  }
                                  condition.function = commandOptions.function;
                                  condition.destination = commandOptions.destination;
                                  menuPositionCurrent = commandOptions.currentIndex.split('.');
                                  if (subMode === 'edit') menuPositionCurrent.splice(-1, 1);
                                }
                                condition[subItem] = commandOptions.value;
                                //
                                break;
                              }

                              default: {
                                triggers = undefined;
                                break;
                              }
                            }
                          } else {
                            triggers = undefined;
                          }
                          break;
                        }
                      }
                    } else {
                      triggers = undefined;
                    }
                  } else {
                    triggers = undefined;
                  }
                  break;
                }

                default: {
                  break;
                }
              }
              if (typeOf(triggers, 'array')) {
                cachedValueSet(user, cachedTriggersDetails, triggers);
                cachedAddToDelCachedOnBack(
                  user,
                  menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
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
            } else if (rolesInMenu.existsId(commandOptions.roleId)) {
              let currentRules = rolesInMenu.getRules(commandOptions.roleId);
              if (currentRules.length > currentIndex) {
                const currentRule = {...currentRules[currentIndex]};
                currentRule['accessLevel'] = commandOptions.accessLevel;
                cachedValueSet(user, cachedRolesNewRule, currentRule);
              }
            }
            break;
          }

          default: {
            break;
          }
        }
        menuMenuItemsAndRowsClearCached(user);
        break;
      }

      case cmdItemDownload: {
        nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
          if (err) {
            warns(`Can't create temporary directory! Error: '${jsonStringify(err)}'.`);
          } else {
            const languageId = configOptions.getOption(cfgMenuLanguage),
              tmpFileName = nodePath.join(tmpDirectory, `menuTranslation_${languageId}.json`),
              currentTranslation = translationsGetCurrentForUser(user);
            nodeFS.writeFile(
              tmpFileName,
              jsonStringify(
                {
                  type: translationsType,
                  language: languageId,
                  version: translationsVersion,
                  translation: currentTranslation,
                },
                2,
              ),
              (err) => {
                if (err) {
                  warns(`Can't create temporary file '${tmpFileName}'! Error: '${jsonStringify(err)}'.`);
                } else {
                  telegramFileSend(user, tmpFileName);
                }
              },
            );
          }
        });
        menuPositionCurrent = undefined;
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
                  (locales, error) => {
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
                        const menuPosition = cachedValueGet(user, cachedMenuItem);
                        menuPosition.push(
                          // @ts-ignore
                          isNaN(commandOptions.uploadMode)
                            ? commandOptions.uploadMode
                            : Number(commandOptions.uploadMode),
                        );
                        menuMenuDraw(user, menuPosition);
                      } else {
                        telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
                      }
                    } else {
                      warns(`Can't load locales from repository! Error is ${jsonStringify(error)}.`);
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
        menuPositionCurrent = undefined;
        break;
      }

      case cmdItemDelete: {
        switch (commandOptions.dataType) {
          default:
            menuPositionCurrent.push(
              // @ts-ignore
              isNaN(commandOptions.index) ? commandOptions.index : Number(commandOptions.index),
            );
            break;
        }
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
            menuPositionCurrent.splice(-2, 2);
            break;
          }

          case dataTypePrimaryEnums: {
            if (enumerationsList.hasOwnProperty(commandOptions.dataTypeExtraId)) {
              const currentEnumsList = enumerationsList[commandOptions.dataTypeExtraId].enums;
              if (Object.keys(currentEnumsList).includes(commandOptions.item)) {
                delete currentEnumsList[commandOptions.item];
                enumerationsSave(commandOptions.dataTypeExtraId);
                menuPositionCurrent.splice(-3, 3, dataTypePrimaryEnums);
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
            menuPositionCurrent.splice(-2, 2);
            break;
          }

          case dataTypeAlertSubscribed: {
            if (
              typeOf(commandOptions.state, 'string') &&
              commandOptions.state.length &&
              typeOf(commandOptions.id, 'string')
            ) {
              const detailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
                thresholdIndex = thresholdsGetIndex(detailsOrThresholds, commandOptions.id);
              if (thresholdIndex >= 0) {
                detailsOrThresholds.splice(thresholdIndex, 1);
                cachedValueSet(user, cachedAlertThresholdSet, detailsOrThresholds);
                cachedAddToDelCachedOnBack(user, menuPositionCurrent.slice(0, -3).join('.'), cachedAlertThresholdSet);
                menuPositionCurrent.splice(-2, 2);
              }
            } else {
              alertsManage(user, commandOptions.state);
              menuPositionCurrent.splice(-4, 4);
            }
            break;
          }

          case dataTypeTrigger: {
            if (commandOptions.state) {
              let triggers = triggersGetStateTriggers(user, commandOptions.state),
                backStepsForCacheDelete = 0;
              if (typeOf(commandOptions.id, 'string')) {
                const triggerIndex = thresholdsGetIndex(triggers, commandOptions.id);
                if (triggerIndex >= 0) {
                  menuPositionCurrent.splice(-2, 2);
                  backStepsForCacheDelete--;
                  const triggerAttributeId = commandOptions.item;
                  if (typeOf(triggerAttributeId, 'string')) {
                    const trigger = triggers[triggerIndex];
                    if (typeOf(trigger[triggerAttributeId], 'object')) {
                      const triggerTimeRange = trigger[triggerAttributeId],
                        triggerTimeRangeAttributeId = commandOptions.subItem,
                        triggerTimeRangeAttribute = triggerTimeRange[triggerTimeRangeAttributeId];
                      delete triggerTimeRange[triggerTimeRangeStartTimes];
                      if (typeOf(triggerTimeRangeAttribute, 'array')) {
                        const valueIndex = commandOptions.index;
                        switch (triggerTimeRangeAttributeId) {
                          case triggersTimeRangeHoursWithMinutes:
                          case triggersTimeRangeMonthsWithDays: {
                            if (typeOf(valueIndex, 'number') && valueIndex < triggerTimeRangeAttribute.length) {
                              triggerTimeRangeAttribute.splice(valueIndex, 1);
                              backStepsForCacheDelete -= 3;
                              if (triggerTimeRangeAttribute.length === 0) {
                                switch (triggerTimeRangeAttributeId) {
                                  case triggersTimeRangeHoursWithMinutes: {
                                    menuPositionCurrent.push(Number(menuPositionCurrent.pop()) + 1);
                                    break;
                                  }
                                  case triggersTimeRangeMonthsWithDays: {
                                    menuPositionCurrent.push(Number(menuPositionCurrent.pop()) + 3);
                                    break;
                                  }
                                  default: {
                                    break;
                                  }
                                }
                                delete triggerTimeRange[triggerTimeRangeAttributeId];
                              }
                            }
                            break;
                          }
                          default: {
                            break;
                          }
                        }
                      }
                      if (typeOf(triggers, 'array') && Object.keys(triggerTimeRange).length === 0) {
                        delete trigger[triggerAttributeId];
                      } else {
                        triggerTimeRange[triggerTimeRangeStartTimes] = triggerTimeRangeGenerateStartTimes(
                          trigger[triggerAttributeId],
                        );
                      }
                    }
                  } else {
                    triggers.splice(triggerIndex, 1);
                  }
                  cachedValueSet(user, cachedTriggersDetails, triggers);
                  if (backStepsForCacheDelete !== 0)
                    cachedAddToDelCachedOnBack(
                      user,
                      menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
                      cachedTriggersDetails,
                    );
                  menuMenuItemsAndRowsClearCached(user);
                }
              } else {
                const {state, function: functionId, destination: destinationId} = commandOptions;
                if (functionId && destinationId) {
                  cachedValueSet(user, cachedTriggersDetails, []);
                  triggersTimeRangeStartTimesUpdate(user, state);
                  cachedValueDelete(user, cachedTriggersDetails);
                  alertsManage(user, state, functionId, destinationId, undefined, true);
                  menuMenuItemsAndRowsClearCached(user);
                  menuPositionCurrent.splice(-1, 1);
                }
              }
            }
            break;
          }

          case dataTypeTranslation: {
            let currentTranslationId;
            if (
              commandOptions.translationType &&
              typeOf(commandOptions.item, 'number') &&
              typeOf(commandOptions.index, 'number')
            ) {
              currentTranslationId = commandOptions.translationType;
              let destTranslation = translationsPointOnItemOwner(user, `${currentTranslationId}.destinations`, true);
              if (
                destTranslation &&
                typeOf(destTranslation) === 'object' &&
                Object.keys(destTranslation).length > commandOptions.item
              ) {
                currentTranslationId += `.destinations.${Object.keys(destTranslation)[commandOptions.item]}`;
                destTranslation = destTranslation[Object.keys(destTranslation)[commandOptions.item]];
                if (
                  destTranslation &&
                  typeOf(destTranslation) === 'object' &&
                  Object.keys(destTranslation).length > commandOptions.index
                ) {
                  currentTranslationId += `.${Object.keys(destTranslation)[commandOptions.index]}`;
                }
              }
            } else if (commandOptions.translationId) {
              currentTranslationId = commandOptions.translationId;
            }
            if (currentTranslationId) {
              translationsItemDelete(user, currentTranslationId);
              menuPositionCurrent.splice(-2, 2);
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
                      menuPositionCurrent.splice(-2, 2);
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
                if (configItemArray && Array.isArray(configItemArray)) {
                  if (configItemArray.length > Number(commandOptions.index)) {
                    configItemArray.splice(Number(commandOptions.index), 1);
                    configOptions.setOption(
                      commandOptions.item,
                      commandOptions.scope === configOptionScopeGlobal ? null : user,
                      configItemArray,
                    );
                    menuPositionCurrent.splice(-2, 2);
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
                let currentRules;
                if (currentRole) {
                  currentRules = currentRole.rules;
                } else if (rolesInMenu.existsId(currentRoleId)) {
                  currentRules = rolesInMenu.getRules(currentRoleId);
                }
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
                    menuPositionCurrent.splice(-2, 2);
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
              menuPositionCurrent.splice(-2, 2);
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
            menuPositionCurrent = undefined;
            break;
          }

          default: {
            break;
          }
        }
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
            queryParams = queryParams || simpleReportQueryParamsTemplate();
            switch (commandOptions.itemType) {
              case dataTypeDestination:
                if (queryParams.queryDests.includes(commandOptions.item)) {
                  delete queryParams.queryDests[queryParams.queryDests.indexOf(commandOptions.item)];
                } else {
                  queryParams.queryDests.push(commandOptions.item);
                }
                queryParams.queryStates = [];
                queryParams.queryPossibleStates = [];
                cachedAddToDelCachedOnBack(
                  user,
                  menuPositionCurrent.slice(0, -2).join('.'),
                  cachedSimpleReportNewQuery,
                );
                break;

              case 'states':
                if (
                  typeOf(queryParams.queryStates, 'array') &&
                  typeOf(queryParams.queryPossibleStates?.[commandOptions.item]?.stateId, 'string')
                ) {
                  if (queryParams.queryStates.includes(queryParams.queryPossibleStates[commandOptions.item]?.stateId)) {
                    delete queryParams.queryStates[
                      queryParams.queryStates.indexOf(queryParams.queryPossibleStates[commandOptions.item].stateId)
                    ];
                  } else {
                    queryParams.queryStates.push(queryParams.queryPossibleStates[commandOptions.item].stateId);
                  }
                }
                menuPositionCurrent.splice(-1);
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
            break;
          }

          default: {
            break;
          }
        }
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
              telegramMessageDisplayPopUp(user, updateTranslationResult || translationsItemTextGet(user, 'MsgSuccess'));
            } else {
              telegramMessageDisplayPopUp(user, translationsItemTextGet(user, 'MsgWrongFileOrFormat'));
            }
            menuPositionCurrent.splice(-2);
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
                alertFunctionId = commandOptions.function,
                alertFunction =
                  functionsList && alertFunctionId && functionsList.hasOwnProperty(alertFunctionId)
                    ? functionsList[alertFunctionId]
                    : undefined,
                alertStateSectionsCount = alertFunction ? alertFunction.statesSectionsCount : 1,
                destinationsList = enumerationsList[dataTypeDestination].list,
                alertDestinationId = commandOptions.destination,
                alertDestination =
                  destinationsList && alertDestinationId && destinationsList.hasOwnProperty(alertDestinationId)
                    ? destinationsList[alertDestinationId]
                    : undefined,
                alertStateShortId = alertStateId.split('.').slice(-alertStateSectionsCount).join('.'),
                alerts = alertsGet(),
                alertIsOn = alerts?.hasOwnProperty(alertStateId) && alerts[alertStateId]?.chatIds?.has(user.chatId);
              if (alertIsOn) {
                const alertDetailsSource = alerts[alertStateId].chatIds.get(user.chatId),
                  filterId = `state[id=*.${alertStateShortId}]`,
                  filterFunction = `(${alertFunction.enum}=${alertFunctionId})`,
                  filterDestination = `(${alertDestination.enum}=${alertDestinationId})`;
                let filterEnum = '';
                switch (propagateRange) {
                  case alertPropagateFuncAndDest:
                  case alertPropagateFunction:
                    filterEnum = filterFunction;
                    break;
                  case alertPropagateDestination:
                    filterEnum = filterDestination;
                    break;
                }
                if (typeOf(alertDetailsSource, 'array') && alertDetailsSource.length > 0) {
                  $(`${filterId}${filterEnum}`).each((stateId) => {
                    if (stateId !== alertStateId) {
                      let targetDestinationId = alertDestinationId,
                        targetFunctionId = alertFunctionId;
                      const enumMask = propagateRange === alertPropagateFuncAndDest ? alertDestination.enum : '*',
                        currentStateObject = getObject(stateId, enumMask);
                      if (currentStateObject) {
                        let toProcessState = false;
                        const currentStateEnumIds = currentStateObject['enumIds'];
                        if (currentStateEnumIds) {
                          switch (propagateRange) {
                            case alertPropagateFuncAndDest: {
                              toProcessState = currentStateEnumIds.includes(
                                `${prefixEnums}.${alertDestination.enum}.${alertDestinationId}`,
                              );
                              break;
                            }

                            default: {
                              const currentDataType =
                                  propagateRange === alertPropagateFunction ? dataTypeDestination : dataTypeFunction,
                                currentEnums = enumerationsList[currentDataType].enums,
                                currentEnumsList = Object.keys(currentEnums);
                              currentEnumsList
                                .filter((enumId) => currentEnums[enumId].isEnabled)
                                .every((enumId) => {
                                  const enumFullId = [prefixEnums, enumId, ''].join('.'),
                                    enumIndex = currentStateEnumIds.findIndex(
                                      (enumId) => enumId.indexOf(enumFullId) === 0,
                                    );
                                  if (enumIndex >= 0) {
                                    const foundId = currentStateEnumIds[enumIndex].replace(enumFullId, '');
                                    if (propagateRange === alertPropagateFunction) {
                                      targetDestinationId = foundId;
                                    } else {
                                      targetFunctionId = foundId;
                                    }
                                    toProcessState = true;
                                  }
                                  return !toProcessState;
                                });
                              break;
                            }
                          }
                        }
                        if (toProcessState) {
                          const alertDetailsCurrent =
                              alerts?.hasOwnProperty(stateId) && alerts[stateId]?.chatIds?.has(user.chatId)
                                ? alerts[stateId].chatIds.get(user.chatId)
                                : undefined,
                            isAlertDetailsDifferent =
                              jsonStringify(alertDetailsCurrent) !== jsonStringify(alertDetailsSource);
                          if (
                            isAlertDetailsDifferent &&
                            (propagateMode === 'alertPropagateOverwrite' ||
                              !typeOf(alertDetailsCurrent, 'array') ||
                              alertDetailsCurrent?.length === 0)
                          ) {
                            alertsManage(user, stateId, targetFunctionId, targetDestinationId, alertDetailsSource);
                          }
                        }
                      }
                    }
                  });
                }
                menuPositionCurrent.splice(-2);
              }
            }
            break;
          }

          case dataTypeReportMember: {
            const queryParams = cachedValueGet(user, cachedSimpleReportNewQuery),
              queryStates =
                commandOptions.mode === doAll
                  ? queryParams.queryPossibleStates.maps((item) => item.stateId)
                  : queryParams.queryStates;
            if (queryStates.length) {
              const currentReportId = `${prefixEnums}.${
                enumerationsList[dataTypeReport].list[commandOptions.item].enum
              }.${commandOptions.item}`;
              let currentReportObject = getObject(currentReportId);
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
              }
            }
            menuPositionCurrent.splice(-2, 2);
            cachedValueDelete(user, cachedSimpleReportNewQuery);
            break;
          }

          case dataTypeConfig: {
            switch (commandOptions.item) {
              case cfgMenuLanguage:
                if (commandOptions.scope === configOptionScopeGlobal) {
                  const newLanguageId = commandOptions.value;
                  if (!translationsList.hasOwnProperty(newLanguageId)) {
                    const menuPosition = menuPositionCurrent;
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
                            newTranslation?.hasOwnProperty(idTranslation) &&
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
                    menuPositionCurrent = undefined;
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
              menuPositionCurrent.splice(-2, 2);
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
                  menuPositionCurrent.splice(-1);
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
              templateExists = (template) => template && existsObject(`${graphsTemplatesFolder}.${template}`);
            let graphTemplateId = `${graphsTemplatesFolder}.${graphsDefaultTemplate}`;
            if (templateExists(commandOptions.template)) {
              graphTemplateId = `${graphsTemplatesFolder}.${commandOptions.template}`;
            } else if (templateExists(currentShortStateId)) {
              graphTemplateId = `${graphsTemplatesFolder}.${currentShortStateId}`;
            }
            if (
              existsObject(graphTemplateId) &&
              (commandOptions.itemType === dataTypeReport || existsState(currentState))
            ) {
              let graphTemplate = getObject(graphTemplateId);
              const graphAdapter = graphsTemplatesFolder.split('.').slice(0, 2).join('.');
              if (graphTemplate?.native?.data?.lines?.length === 1) {
                if (commandOptions.itemType === dataTypeReport) {
                  const reportId = commandOptions.item,
                    reportsList = enumerationsList[dataTypeReport].list,
                    reportItem = reportsList[reportId],
                    reportObject = getObject(`${prefixEnums}.${reportItem.enum}.${reportId}`);
                  if (
                    reportObject?.common?.hasOwnProperty('members') &&
                    Array.isArray(reportObject.common['members']) &&
                    reportObject.common['members'].length
                  ) {
                    const reportStatesList = reportObject.common['members'].sort(), // NOSONAR
                      reportStatesStructure = simpleReportPrepareStructure(reportStatesList),
                      graphLines = graphTemplate.native.data.lines,
                      templateLine = graphLines.pop();
                    templateLine.instance = historyAdapter;
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
                              if (!typeOf(currentUnit, 'string'))
                                currentUnit = currentStateObject?.common?.unit ? currentStateObject.common.unit : '';
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
                              currentLine.lineStyle = 'dotted';
                              if (graphLines.length % 3 === 0) {
                                currentLine.lineStyle = 'solid';
                              } else if (graphLines.length % 3 === 1) {
                                currentLine.lineStyle = 'dashed';
                              }
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
                  currentLine.unit = currentStateObject?.common?.unit ? currentStateObject.common.unit : '';
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
                    warns(`Can't create temporary template object ${newTemplateId}`);
                  } else {
                    nodeFS.mkdtemp(nodePath.join(nodeOS.tmpdir(), temporaryFolderPrefix), (err, tmpDirectory) => {
                      if (err) {
                        warns(`Can't create temporary directory! Error: '${jsonStringify(err)}'.`);
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
                              errs(`error: stringifySafe(result.error)`);
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
            menuPositionCurrent = undefined;
            break;
          }

          case dataTypeBackup: {
            switch (commandOptions.mode) {
              case backupModeCreate: {
                menuPositionCurrent = undefined;
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
                menuPositionCurrent = undefined;
                break;
              }

              case backupModeRestore: {
                menuPositionCurrent = undefined;
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
        break;
      }

      case cmdItemReset: {
        switch (commandOptions.dataType) {
          case dataTypeConfig: {
            if (configOptions.isUserConfigOption(commandOptions.item, user)) {
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

          case dataTypeAlertSubscribed: {
            if (commandOptions.state && commandOptions.item) {
              const detailsOrThresholds = alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
                item = commandOptions.item;
              let threshold = detailsOrThresholds,
                backStepsForCacheDelete = -2;
              if (typeOf(commandOptions.id, 'string')) {
                const thresholdIndex = thresholdsGetIndex(detailsOrThresholds, commandOptions.id);
                if (thresholdIndex >= 0) {
                  threshold = detailsOrThresholds[thresholdIndex];
                  backStepsForCacheDelete--;
                } else {
                  threshold = undefined;
                }
              }
              switch (item) {
                case alertMessageTemplateId: {
                  threshold[alertMessageTemplateId] = '';
                  break;
                }

                default: {
                  threshold = undefined;
                }
              }
              if (threshold) {
                cachedValueSet(user, cachedAlertThresholdSet, detailsOrThresholds);
                cachedAddToDelCachedOnBack(
                  user,
                  menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
                  cachedAlertThresholdSet,
                );
                menuMenuItemsAndRowsClearCached(user);
              }
            }
            break;
          }

          case dataTypeTrigger: {
            if (
              typeOf(commandOptions.state, 'string') &&
              commandOptions.state.length &&
              typeOf(commandOptions.id, 'string')
            ) {
              let triggers = triggersGetStateTriggers(user, commandOptions.state);
              const triggerIndex = thresholdsGetIndex(triggers, commandOptions.id),
                item = commandOptions.item,
                backStepsForCacheDelete = -3;
              if (triggerIndex >= 0) {
                const trigger = triggers[triggerIndex];
                switch (item) {
                  case alertMessageTemplateId: {
                    trigger[alertMessageTemplateId] = '';
                    break;
                  }

                  default: {
                    triggers = undefined;
                  }
                }
                if (triggers) {
                  cachedValueSet(user, cachedTriggersDetails, triggers);
                  cachedAddToDelCachedOnBack(
                    user,
                    menuPositionCurrent.slice(0, backStepsForCacheDelete).join('.'),
                    cachedTriggersDetails,
                  );
                  menuMenuItemsAndRowsClearCached(user);
                }
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
            );
            const currentOrder = currentEnumerationsList[commandOptions.item].order,
              newOrder = currentOrder + (commandCurrent === cmdItemMoveUp ? -1 : 1);
            const newItem = Object.keys(currentEnumerationsList).find((cItem) => {
              return currentEnumerationsList[cItem].order === newOrder;
            });
            if (isDefined(newItem)) {
              // @ts-ignore
              currentEnumerationsList[newItem].order = currentOrder;
              currentEnumerationsList[commandOptions.item].order = newOrder;
              menuPositionCurrent.splice(-1, 1, newOrder);
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
                  newPosition = currentIntervalIndex + (commandCurrent === cmdItemMoveUp ? -1 : 1);
                currentOptionArray.splice(currentIntervalIndex, 1);
                currentOptionArray.splice(newPosition, 0, currentInterval);
                menuPositionCurrent.splice(-1, 1, newPosition);
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

        break;
      }

      case cmdItemNameGet: {
        const currentList = enumerationsList[commandOptions.dataType].list;
        if (!currentList[commandOptions.item].isExternal) {
          enumerationsRereadItemName(user, commandOptions.item, currentList[commandOptions.item]);
        } else {
          menuPositionCurrent = undefined;
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
          menuMenuItemsAndRowsClearCached(user);
        } catch (error) {
          errs(`Object can not be created - setObject don't enabled. Error is ${jsonStringify(error)}`);
          menuPositionCurrent.splice(-1);
        }
        if (Object.keys(enumerationsList[dataTypeReport].enums).length > 1) menuPositionCurrent.splice(-1);
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
        menuPositionCurrent = cachedValueGet(user, cachedMenuItem).slice(0, -1);
        break;
      }

      case cmdAlertSubscribe: {
        if (commandOptions.state && commandOptions.function && commandOptions.destination) {
          if (commandOptions.id === thresholdEnumerable && commandOptions.mode === 'add') {
            cachedValueSet(user, cachedAlertThresholdSet, [
              {
                isEnabled: true,
                id: thresholdEnumerable,
                index: 0,
                type: commandOptions.type,
              },
            ]);
          }
          alertsManage(
            user,
            commandOptions.state,
            commandOptions.function,
            commandOptions.destination,
            alertsGetStateAlertDetailsOrThresholds(user, commandOptions.state),
          );
        }
        menuMenuItemsAndRowsClearCached(user);
        break;
      }

      case cmdItemJumpTo: {
        const jumpToArray = commandOptions.jumpToArray ? commandOptions.jumpToArray : [];
        jumpToArray.forEach((jumpToItem) => {
          if (jumpToItem === jumpToUp) {
            if (menuPositionCurrent.length) menuPositionCurrent.pop();
          } else if (jumpToItem === jumpToLeft || jumpToItem === jumpToRight) {
            if (menuPositionCurrent.length) {
              let currentPos = menuPositionCurrent.pop();
              if (!isNaN(currentPos)) {
                currentPos = Number(currentPos) + (jumpToItem === jumpToLeft ? -1 : 1);
              }
              menuPositionCurrent.push(currentPos);
            }
          } else if (isDefined(jumpToItem)) {
            menuPositionCurrent.push(jumpToItem);
          }
        });
        menuMenuItemsAndRowsClearCached(user);
        break;
      }

      case cmdSetOffset: {
        menuPositionCurrent = commandOptions.index.split('.');
        cachedValueSet(user, cachedMenuButtonsOffset, [commandOptions.index, commandOptions.offset]);
        menuMenuItemsAndRowsClearCached(user);
        break;
      }

      case cmdDeleteAllSentImages: {
        sentImagesDelete(user);
        menuMenuItemsAndRowsClearCached(user);
        break;
      }

      case cmdNoOperation: {
        break;
      }
    }
    if (typeOf(menuPositionCurrent, 'array')) menuMenuDraw(user, menuPositionCurrent);
  }
}

//*** User input and command processing - end ***//

//*** Group chats - begin ***//

/**
 * This functions collects a list of the group chats by looking thru the tree of the its cache states.
 * @param {boolean} activeOnly - Boolean selector to filter only active group chats,
 * i.e. with last message from the bot not older the 48 hours
 * @returns {number[]} Array of group chats Ids
 */
function telegramGetGroupChats(activeOnly) {
  const chatsList = new Array();
  $(`state[id=${prefixCacheStates}.*.${cachedMenuOn}]`).each((stateId) => {
    const chatId = Number(stateId.split('.').slice(-2, -1));
    if (!isNaN(chatId) && chatId < 0) {
      if (activeOnly) {
        const user = telegramGenerateUserObjectFromId(chatId),
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
        if (!isBotMessageOldOrNotExists || !isUserMessageOldOrNotExists) chatsList.push(chatId);
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
      const errorMessage = `Can't read file ${fileFullPath}! Error is ${jsonStringify(error)}`;
      warns(errorMessage);
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
      const errorMessage = `Can't read file ${imageFullPath}! Error is ${jsonStringify(error)}`;
      warns(errorMessage);
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
    const error = `Wrong data provided! ${jsonStringify(data)}`;
    warns(error);
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
    const error = `Wrong data provided! ${jsonStringify(data)}`;
    warns(error);
    callback({success: false, error});
  }
}

/**
 * This function finalize preparation of Telegram message object, to send or edit Telegram bot message,
 * and push it to the sending queue.
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
      currentMessagePlainText = jsonStringify(messageObject);
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
      telegramObject.chatId = user.chatId;
      if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
      if ((createNewMessage && !isMenuOn) || clearBefore || isBotMessageOldOrNotExists) {
        if (typeOf(messageObject.buttons, 'array')) {
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
        if (typeOf(messageObject.buttons, 'array')) {
          telegramObject[telegramCommandEditMessage].options.reply_markup = {
            inline_keyboard: messageObject.buttons,
          };
        }
      }
      let telegramObjects = new Array();
      if (
        clearBefore ||
        ((!telegramObject.hasOwnProperty(telegramCommandEditMessage) ||
          !isDefined(telegramObject[telegramCommandEditMessage])) &&
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
      telegramObjectPushToQueue(user, telegramObjects);
      if (createNewMessage || clearBefore) {
        cachedValueSet(user, cachedMenuOn, true);
      }
    } else {
      logs(
        `lastMessage is equal to preparedMessageObject, sendTo Telegram skipped.
        Message is ${currentMessagePlainText}.`,
      );
    }
  }
}

/**
 * This function pushes current Telegram message object to the queue/
 * @param {object} user - The user object.
 * @param {object|object[]} telegramObject - The Telegram message object (or an array of "linked" objects)
 * to push to the queue.
 */
function telegramObjectPushToQueue(user, telegramObject) {
  logs(`DebugMessages: Push telegramObject = ${jsonStringify(telegramObject, 1)}`, _l);
  let userMessagesQueue = cachedValueGet(user, cachedTelegramMessagesQueue);
  if (!userMessagesQueue) {
    userMessagesQueue = [];
  }
  const isReady = userMessagesQueue.length === 0;
  if (typeOf(telegramObject, 'array') && telegramObject.length && typeOf(telegramObject[0], 'array')) {
    telegramObject.forEach((telegramSubObject) => userMessagesQueue.push(telegramSubObject));
  } else {
    userMessagesQueue.push(telegramObject);
  }
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
   * The function to process the result of sending the message to the Telegram adapter, and take and process a "linked"
   * one, if it exists(for example delete and new one).
   * @param {number|array|object} result - The result of sending the message by Telegram adapter.
   * @param {object} user - The user object.
   * @param {object} telegramObject - The Telegram message object, result of sending is processing.
   * @param {object[]} telegramObjects - The arrays of Telegram objects, which can contain one message, or two,
   * "linked" together.
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
      isMessageCantBeDeletedOrEdited = false,
      telegramError;
    const currentTS = Date.now(),
      resultObject = telegramSendToAdapterResponse(result, telegramObject);
    logs(`SendToTelegram: result (${typeOf(result)}) = ${jsonStringify(result, 1)}`, _l);
    logs(`Converted result: ${jsonStringify(resultObject, 1)}`, _l);
    if (!resultObject.success) {
      logs(`check = waitForLog = ${waitForLog}, total = ${waitForLog && !resultObject.error.level}`, _l);
      if (waitForLog && !isDefined(resultObject.error.level)) {
        setTimeout(() => {
          telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, sendToTS, false);
        }, telegramDelayToCatchLog);
      } else {
        logs(`errors = ${jsonStringify(telegramLastErrors, 1)}`, _l);
        if (telegramLastErrors?.size) {
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
        if (isDefined(telegramError?.error)) {
          resultObject.error = telegramError.error;
        }
        if (resultObject.error?.level) {
          logs(`error = ${jsonStringify(resultObject.error, 1)}`, _l);
          warns(
            `Can't send message (${jsonStringify(telegramObject)}) to (${jsonStringify({
              ...user,
              rootMenu: null,
            })})!\nResult = ${jsonStringify(resultObject)}.\nError details = ${jsonStringify(resultObject.error, 2)}.`,
          );
        }
        if (resultObject.error?.level === telegramErrorLevelFatal) {
          warns(`Going to retry send the whole message after timeout = ${telegramDelayToSendReTry} ms.`);
          setTimeout(() => {
            warns(`Retrying message send.`);
            telegramQueueProcess(user);
          }, telegramDelayToSendReTry);
        } else if (
          resultObject.error?.level === telegramErrorLevelTelegram &&
          // @ts-ignore
          telegramObject?.hasOwnProperty(resultObject.error?.command)
        ) {
          const [currentMessageId, isCurrentMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
            user,
            cachedBotSendMessageId,
            timeDelta48,
          );
          if (
            !isCurrentMessageOldOrNotExists &&
            currentMessageId != telegramObject[resultObject.error?.command].options.message_id
          ) {
            telegramObject[resultObject.error?.command].options.message_id = currentMessageId;
            sendTo(telegramAdapter, telegramObject, (result) => {
              telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
            });
          } else {
            isMessageCantBeDeletedOrEdited = true;
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
            isMessageCantBeDeletedOrEdited = true;
          }
        }
        if (telegramObject && isMessageCantBeDeletedOrEdited) {
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
    if (resultObject.success) {
      if (telegramObject.hasOwnProperty('type') && ['document', 'photo'].includes(telegramObject['type'])) {
        if (nodePath.dirname(telegramObject.text).includes(temporaryFolderPrefix))
          nodeFS.rm(nodePath.dirname(telegramObject.text), {recursive: true, force: true}, (err) => {
            if (err)
              warns(
                `Can't delete temporary file  '${telegramObject.text}' and directory! Error: '${jsonStringify(err)}'.`,
              );
          });
      }
      if (
        telegramObject?.[telegramCommandDeleteMessage]?.isBotMessage &&
        cachedValueExists(user, cachedBotSendMessageId)
      ) {
        if (
          cachedValueGet(user, cachedBotSendMessageId) ==
          telegramObject[telegramCommandDeleteMessage].options.message_id
        ) {
          cachedValueDelete(user, cachedBotSendMessageId);
        }
      }
    }
    if (telegramObjects.length) {
      telegramObject = telegramObjects.shift();
      sendTo(telegramAdapter, telegramObject, (result) => {
        telegramSendToCallBack(result, user, telegramObject, telegramObjects, currentLength, currentTS, true);
      });
    } else if (userMessagesQueue) {
      userMessagesQueue.splice(0, currentLength);
      if (userMessagesQueue.length === 0) {
        cachedValueDelete(user, cachedTelegramMessagesQueue);
      } else {
        cachedValueSet(user, cachedTelegramMessagesQueue, userMessagesQueue);
      }
    }
  }

  if (telegramIsConnected) {
    const userMessagesQueue = cachedValueGet(user, cachedTelegramMessagesQueue);
    if (userMessagesQueue?.length) {
      if (!typeOf(messageId, 'number')) {
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
      // will send a last message, to prevent spamming the telegram with flipping some states in ioBroker.
      // In case of user input - we will not lost any message
      do {
        telegramObjects = objectDeepClone(userMessagesQueue[currentPos]);
        logs(`DebugMessages: prepare telegramObjects = ${jsonStringify(telegramObjects, 1)}`, _l);
        if (!isDefined(telegramObjects)) {
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
        if (telegramObjects?.[0]?.[telegramCommandDeleteMessage]?.isBotMessage) {
          telegramObjects[0][telegramCommandDeleteMessage].options.message_id = messageId;
          if (!typeOf(telegramObjects[0][telegramCommandDeleteMessage].options.message_id, 'number')) {
            warns(`No message for Delete! Going to skip command ${jsonStringify(telegramObjects[0])}.`);
            telegramObjects.shift();
          }
          if (telegramObjects && telegramObjects.length === 0) {
            userMessagesQueue.splice(currentPos, 1);
            if (userMessagesQueue.length === 0) {
              cachedValueDelete(user, cachedTelegramMessagesQueue);
            } else {
              cachedValueSet(user, cachedTelegramMessagesQueue, userMessagesQueue);
            }
            telegramObjects = undefined;
          }
        }
      } while (!isDefined(telegramObjects) && userMessagesQueue.length);
      if (telegramObjects) {
        if (messageId) {
          if (telegramObjects[0].hasOwnProperty(telegramCommandEditMessage)) {
            telegramObjects[0][telegramCommandEditMessage].options.message_id = messageId;
          }
        }
        const telegramObject = telegramObjects.shift(),
          sentToTimeStamp = Date.now();
        logs(`DebugMessages: send telegramObject = ${jsonStringify(telegramObject, 1)}`, _l);
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
 * This function generates a Telegram message object with a command to delete Telegram message (from bot or user),
 * and return it or push to the queue.
 * @param {object} user - The user object.
 * @param {boolean} isUserMessageToDelete - The selector to delete a user message.
 * @param {boolean=} createTelegramObjectOnly - The selector to create and return message, instead of deletion.
 * @param {number=} messageIdToDelete - The Telegram message unique id for the deletion.
 * @returns
 */
function telegramMessageClearCurrent(
  user,
  isUserMessageToDelete,
  createTelegramObjectOnly = false,
  messageIdToDelete = undefined,
) {
  const [lastBotMessageId, isBotMessageOldOrNotExists] = cachedGetValueAndCheckItIfOld(
    user,
    cachedBotSendMessageId,
    timeDelta48,
  );
  let messageId;
  if (typeOf(messageIdToDelete, 'number')) {
    messageId = messageIdToDelete;
  } else if (isUserMessageToDelete) {
    messageId = cachedValueGet(user, cachedMessageId);
  } else if (!isBotMessageOldOrNotExists) {
    messageId = lastBotMessageId;
  }
  if (messageId) {
    const telegramObject = {
      [telegramCommandDeleteMessage]: {
        options: {
          chat_id: user.chatId,
          message_id: messageId,
        },
        isBotMessage: !isUserMessageToDelete,
      },
    };
    if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
    telegramObject.chatId = user.chatId;
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
        show_alert: showAlert,
      },
    };
    if (text && typeOf(text, 'string') && text.length) {
      telegramObject.answerCallbackQuery.text = text;
    }
    /** Can send pop-up only in private chat **/
    if (user.userId == user.chatId) {
      if (user.userId) telegramObject.user = telegramGetUserIdForTelegram(user);
      sendTo(telegramAdapter, telegramObject, (result) => {
        logs(`SendToTelegram: pop-up result (${typeOf(result)}) = ${jsonStringify(result, 1)}`, _l);
        logs(`Converted result: ${jsonStringify(telegramSendToAdapterResponse(result, telegramObject), 1)}`, _l);
        if (!result) {
          warns(
            `Can't send pop-up message (${jsonStringify(telegramObject)}) to (${jsonStringify(
              user,
            )})!\nResult = ${jsonStringify(result)}.`,
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
    /^telegram.\d\s+\(\d+\)\s+(Cannot\s+send|Failed)\s+(\w+)\s+\[(chatId|user)\s-\s(-?\d+|\w+)\]:\s+Error:\s(\w+?):\s(.+?):\s(.+)$/, // NOSONAR
  telegramCommandSendNewMessage = 'sendMessage',
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
 * This function processes the reponce of the iobroker Telegram adapter on SendTo command.
 * @param {number|array} response - The response itself. Old versions returned number value.
 * From version ... it has to return the arrays of strings.
 * @param {object=} telegramObject - The sent message as object.
 * @returns {object} The response as object, enriched by result attribute and error details
 *
 */
function telegramSendToAdapterResponse(response, telegramObject) {
  let result = {
    chatId: 0,
    messageId: 0,
    operation: '',
    success: false,
    error: {command: '', level: '', info: '', message: ''},
  };
  if (isDefined(telegramObject)) {
    if (isDefined(telegramObject[telegramCommandEditMessage])) {
      result.operation = telegramCommandEditMessage;
    } else if (isDefined(telegramObject[telegramCommandDeleteMessage])) {
      result.operation = telegramCommandDeleteMessage;
    } else {
      result.operation = telegramCommandSendNewMessage;
    }
    result.messageId = telegramObject[result.operation]?.options?.message_id
      ? telegramObject[result.operation].options.message_id
      : 0;
    if (telegramObject.chatId) {
      result.chatId = telegramObject.chatId;
    } else if (telegramObject[result.operation]?.options?.chat_id) {
      result.chatId = telegramObject[result.operation]?.options?.chat_id;
    }
  }
  if (typeOf(response, 'number')) {
    result.success = response !== 0;
  } else if (result.chatId) {
    // @ts-ignore
    response.forEach((element) => {
      if (!result.success) {
        try {
          let responseObject = jsonParse(element);
          if (responseObject?.[result.chatId]) {
            if (result.operation === telegramCommandSendNewMessage) {
              result.success = true;
              result.messageId = responseObject[result.chatId];
            } else if (
              result.messageId &&
              (result.operation === telegramCommandDeleteMessage || result.operation === telegramCommandEditMessage)
            ) {
              result.success = responseObject[result.chatId] === result.messageId;
            }
          }
        } catch (error) {
          warns(`Can't parse telegram adaper response element: ${element}!`);
        }
      }
    });
  }
  return result;
}

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
 * @param {number} userId
 * @returns
 */
function telegramGenerateUserObjectFromId(userId) {
  let user = {
    userId: userId && userId > 0 ? userId : undefined,
    chatId: userId,
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
    logs(`errorlog : ${jsonStringify(logRecord, 1)}`, _l);
    try {
      const telegramErrorParsed = telegramErrorParseRegExp.exec(logRecord.message);
      logs(`telegramErrorParsed : ${jsonStringify(telegramErrorParsed, 1)}`, _l);
      if (telegramErrorParsed && telegramErrorParsed.length === 8) {
        const // @ts-ignore
          chatId = isNaN(telegramErrorParsed[3]) ? 0 : Number(telegramErrorParsed[3]),
          errorMessage = {
            ts: logRecord.ts,
            chatId: chatId,
            error: {
              command: telegramErrorParsed[2],
              level: telegramErrorParsed[5],
              info: telegramErrorParsed[6],
              message: telegramErrorParsed[7],
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
      }
    } catch (error) {
      warns(`Can't parse log record: ${jsonStringify(logRecord, 1)}`);
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
    userRequest = jsonParse(obj.state.val);
  } catch (err) {
    warns(`userRequest: JSON parse error: ${jsonStringify(err)}`);
  }
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
      if (typeOf(messageId, 'number')) {
        if (userRequest.hasOwnProperty('chat') && userRequest.chat.hasOwnProperty('id')) {
          chatId = userRequest.chat.id;
        } else if (
          userRequest.hasOwnProperty('message') &&
          userRequest.message.hasOwnProperty('chat') &&
          userRequest.message.chat.hasOwnProperty('id')
        ) {
          chatId = userRequest.message.chat.id;
        }
        if (typeOf(chatId, 'number')) {
          if (userRequest.hasOwnProperty('text')) {
            command = userRequest.text;
          } else if (userRequest.hasOwnProperty('data')) {
            command = userRequest.data;
          }
          let user = {};
          if (isDefined(command) || userRequest.hasOwnProperty('document')) {
            user = {
              userId: userRequest.from.id,
              chatId: chatId,
              firstName: userRequest.from.first_name,
              lastName: userRequest.from.last_name,
              userName: userRequest.from.username,
            };
            if (user.userId == user.chatId) cachedValueSet(user, cachedUser, user);
          }
          if (isDefined(command)) {
            if (userRequest.data) {
              /** if by some reason the menu is freezed - delete freezed queue ...**/
              if (cachedValueExists(user, cachedTelegramMessagesQueue)) {
                warns(
                  `Some output is in cache:\n${jsonStringify(
                    cachedValueGet(user, cachedTelegramMessagesQueue),
                  )}.\nGoing to delete it!`,
                );
                cachedValueDelete(user, cachedTelegramMessagesQueue);
              }
              /** and as we received command - the menu is on now **/
              // NOSONAR // setCachedState(user, cachedMenuOn, true);
            }
            cachedValueSet(user, cachedMessageId, messageId);
            commandsUserInputProcess(user, command);
          } else if (userRequest.hasOwnProperty('document')) {
            if (cachedValueExists(user, cachedIsWaitForInput)) {
              const {
                command: currentCommand,
                options: commandOptions,
                index: commandIndex,
              } = commandOptionsCache.get(user, cachedValueGet(user, cachedIsWaitForInput));
              if (currentCommand === cmdItemUpload) {
                commandOptionsCache.set(user, commandIndex, commandIndex, cmdItemUpload, {
                  ...commandOptions,
                  fileName: userRequest.document.file_name,
                  fileSize: userRequest.document.file_size,
                });
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
      warns(
        `Access denied. User ${jsonStringify(userRequest.from.first_name)} ${jsonStringify(
          userRequest.from.last_name,
        )} (${jsonStringify(userRequest.from.username)}) with id = ${userId} not in the list!`,
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
    botMessage = jsonParse(obj.state.val);
  } catch (err) {
    warns(`sendToUser: JSON parse error: ${jsonStringify(err)}`);
  }
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
    if (
      botMessage.hasOwnProperty('reply_markup') &&
      botMessage.reply_markup.hasOwnProperty('inline_keyboard') &&
      typeOf(botMessage.reply_markup.inline_keyboard, 'array')
    ) {
      const inline_keyboard = botMessage.reply_markup.inline_keyboard;
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
    } else if (botMessage.hasOwnProperty('text') && botMessage.text.includes(botMessageStamp)) {
      isBotMessage = true;
    }
    if (botMessage.hasOwnProperty('photo')) {
      sentImageStore(user, botMessage.message_id);
      isDocument = true;
    } else if (botMessage.hasOwnProperty('document')) {
      isDocument = true;
    }
    if (isBotMessage) {
      if (!user.userId && userId) {
        user.userId = Number(userId);
        user = {...cachedValueGet({userId, chatId: userId}, cachedUser), ...user};
      }
      cachedValueSet(user, cachedMenuOn, true);
      telegramQueueProcess(user, messageId);
    } else if (isDocument) {
      if (!user.userId) {
        user = {...cachedValueGet(user, cachedUser), ...user};
      }
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
        logs(`Refresh after start is scheduled on ${updateAt.toString()} fo all users!`);
        menuMenuMessageRenew(menuRefreshTimeAllUsers, true, false);
      },
    );
  }
  menuMenuMessageRenew(menuRefreshTimeAllUsers, true, true);
}

autoTelegramMenuInstanceInit();

//*** Utility functions - begin ***//

/**
 * Simple check is variable defined or not.
 * @param {any} variable - The variable to check
 * @returns {boolean} The result of checking.
 */
function isDefined(variable) {
  return typeof variable !== 'undefined' && variable !== null;
}

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
  } else if (value !== null) {
    result = typeof value;
  } else {
    result = 'undefined';
  }
  if (compareWithType && typeof compareWithType === 'string' && compareWithType.length) {
    return result === compareWithType;
  } else {
    return result;
  }
}

/**
 * This function is used to convert string value to appropriate type.
 * @param {string} value - The string value to convert.
 * @param {string} type - The type to convert to.
 * @returns {any} The result of conversion.
 */
function getValueFromStringByType(value, type) {
  let result;
  if (typeOf(value, 'string')) {
    if (type === 'boolean') {
      result = value === 'true';
    } else if (type === 'number') {
      result = Number(value);
      if (isNaN(result)) result = undefined;
    } else {
      result = value;
    }
  }
  return result;
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
 * This function converts integer to string with leading zeros.
 * @param {number} value - The input integer.
 * @param {number} places - The total count of symbols for the result.
 * @returns {string} The result string.
 */
function zeroPad(value, places) {
  return String(Math.trunc(value)).padStart(places, '0');
}

/**
 * The `countDecimals` function is used to count the number of decimal places in a given number.
 * @param {number} value - The number for which the decimal places are to be counted.
 * @returns {number} The number of decimal places in the given number.  If the input is not a number or an integer,
 * the function returns 0.
 */
function countDecimals(value) {
  if (typeOf(value, 'number')) return value % 1 ? value.toString().split('.')[1].length : 0;
  return 0;
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
            if (originObject?.common) {
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

/**
 * This function deplete the object from attributes, that doesn't needed to be processed.
 * @param {object} object - The object to deplete.
 * @returns {object}  The result object.
 */
function objectInfoDeplete(object) {
  const attributesToExclude = {
    acl: true,
    from: true,
    user: true,
    ts: true,
    common: {
      custom: true,
    },
    enumNames: true,
    native: true,
  };
  return objectDeepClone(object, attributesToExclude);
}

/**
 * This functions checks, if the provided value acceptable by ioBroker State.
 * @param {string} stateId - The ID of appropriate ioBroker State.
 * @param {number} value - The value, to be checked.
 * @param {object=} stateObject - The appropriate object of the State.
 * @returns {boolean} The result of checks. If acceptable - it's true.
 */
function checkNumberStateValue(stateId, value, stateObject) {
  const currentObject = stateObject || getObjectEnriched(stateId);
  if (typeOf(value, 'number') && currentObject?.common) {
    const currentObjectCommon = currentObject.common,
      currentType = currentObjectCommon['type'];
    if (currentType === 'number') {
      return (
        (!typeOf(currentObjectCommon.min, 'number') || value >= Number(currentObjectCommon.min)) &&
        (!typeOf(currentObjectCommon.max, 'number') || value <= Number(currentObjectCommon.max)) &&
        (!typeOf(currentObjectCommon.step, 'number') || value % Number(currentObjectCommon.step) === 0)
      );
    }
  }
  return false;
}

/**
 * This function is doing a full clone of any object with all levels of hierarchy.
 * @param {any} source - The source to clone.
 * @param {object=} filter - The filter object, to filter the source attributes, if source is object.
 * @returns
 */
function objectDeepClone(source, filter = {}) {
  // If the object is `null` or not an object, return the object itself
  if (source === null || typeof source !== 'object') return source;

  // If the object is an array, clone each element in the array
  if (Array.isArray(source)) {
    return source.map(objectDeepClone);
  }

  // If the object is a Date, return a new Date object with the same value
  if (source instanceof Date) {
    return new Date(source);
  }

  // If the object is a RegExp, return a new RegExp object with the same value
  if (source instanceof RegExp) {
    return new RegExp(source);
  }

  // If the object is a Map, clone each key-value pair in the Map
  if (source instanceof Map) {
    const clonedMap = new Map();
    source.forEach((value, key) => {
      if (!filter.hasOwnProperty(key) || typeof filter[key] === 'object') {
        clonedMap.set(key, objectDeepClone(value, filter?.[key]));
      }
    });
    return clonedMap;
  }

  // If the object is a regular object, clone each property in the object
  const clonedObject = {};
  for (const key in source) {
    if (source.hasOwnProperty(key) && (!filter.hasOwnProperty(key) || typeof filter[key] === 'object')) {
      clonedObject[key] = objectDeepClone(source[key], filter?.[key]);
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
    if (isDefined(newValue)) result[key] = newValue;
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
    const keys = Object.keys(inputObject).sort(); // NOSONAR
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
 * This function trying to calculate "real" length, taking in account the Emoji's specifics.
 * @param {string} string - The source string.
 * @returns {number} The calculated string length.
 */
function getStringLength(string) {
  let count = 0;
  if (typeOf(string, 'string') && string) {
    count = string.length;
    for (const match of string.matchAll(checkEmojiRegex)) {
      const emoji = match[0];
      count += 2 - emoji.length;
    }
  }
  return count;
}

/**
 * This function generates the name of days of week according current language.
 * @param {string} locale - Locale or language Id.
 * @param {string} type - "Type" of names - 'long', 'short', 'narrow'.
 * @returns {string[]} The array of names.
 */
function getLocalDaysOfWeekNames(locale, type) {
  let d = new Date(2000, 0, 3); // Monday
  let days = [];
  for (let i = 0; i < 7; i++) {
    // @ts-ignore
    days.push(d.toLocaleString(locale, {weekday: type}));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * This function generates the name of Months according current language.
 * @param {string} locale - Locale or language Id.
 * @param {string} type - "Type" of names - 'long', 'short', 'narrow'.
 * @returns {string[]} The array of names.
 */
function getLocalMonthsNames(locale, type) {
  let d = new Date(2000, 0); // January
  let months = [];
  for (let i = 0; i < 12; i++) {
    // @ts-ignore
    months.push(d.toLocaleString(locale, {month: type}));
    d.setMonth(i + 1);
  }
  return months;
}

/**
 * This function logs the message, in case of debug variable is set.
 * @param {string} txt - The text to be logged.
 * @param {any=} debug - The selector for the logging.
 */
function logs(txt, debug) {
  if (configOptions.getOption(cfgDebugMode) || isDefined(debug)) {
    console.log((arguments?.callee?.caller?.name ? arguments.callee.caller.name : '') + ': ' + txt); // NOSONAR
  }
}

/**
 * This function logs the message as warning.
 * @param {string} txt - The text to be logged.
 */
function warns(txt) {
  console.warn((arguments?.callee?.caller?.name ? arguments?.callee?.caller.name : '') + ': ' + txt); // NOSONAR
}

/**
 * This function logs the message as errors.
 * @param {string} txt - The text to be logged.
 */
function errs(txt) {
  console.error((arguments?.callee?.caller?.name ? arguments.callee.caller.name : '') + ': ' + txt); // NOSONAR
}

/**
 * The replacer function, to convert map objects to JSON.
 * @param {any} _key - The key(name) of the object, to be replaced.
 * @param {any} value - The value of the object, to be replaced.
 * @returns {any} The result of replace.
 */
function JSONReplacer(_key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: [...value],
    };
  } else if (value instanceof Set) {
    return {
      dataType: 'Set',
      value: Array.from(value),
    };
  } else {
    return value;
  }
}

/**
 * The reviver function, to convert JSON to the Map object.
 * @param {any} _key - The key(name) of the object, to be revived.
 * @param {any} value - The value of the object, to be revived.
 * @returns {any} The result of revive.
 */
function JSONReviver(_key, value) {
  if (typeof value === 'object' && value !== null) {
    switch (value.dataType) {
      case 'Map': {
        return new Map(value.value);
      }
      case 'Set': {
        return new Set(value.value);
      }
      default: {
        return value;
      }
    }
  }
  return value;
}

/**
 * This function uses a `jsonStringifySafe` wrapper of embedded `JSON.stringify` function,
 * to prevent errors on circular references.
 * Additionally it uses a `JSONReplacerWithMap` function to convert Map objects to JSON too.
 * @param {any} value - The value to be converted to JSON.
 * @param {number=} space - The number of spaces to be used for indentation.
 * @returns {string} The result of conversion.
 */
function jsonStringify(value, space = 0) {
  return jsonStringifySafe(value, JSONReplacer, space);
}

/**
 * This function uses embedded `JSON.parse` function with reviver function to convert JSON to the Map object too.
 * @param {string} text - The text to be converted to JSON.
 * @returns {any} The result of conversion.
 */
function jsonParse(text) {
  return JSON.parse(text, JSONReviver);
}

//*** Utility functions - end ***//
