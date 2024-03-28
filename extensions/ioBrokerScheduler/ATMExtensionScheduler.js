/**
 * Script Name: ATM Extension Scheduler
 * Version: 1.0
 * Created Date: 2024-03-15
 * Last Updated: 2024-03-28
 * Author: Peter Voronov
 * Type: Extension for Auto Telegram Menu script.
 * Extension type: `attributes`.
 * `Buttons`:
 *  - `schedule` - to control the schedules assigned by Scheduler adapter to the device states.
 * `Attributes`:
 *  - none
 * `AttributesProperties:
 *  - `schedules` - to display the schedules assigned by ioBroker.scheduler adapter to the state.
 * Description:  This extension is used to control the schedules assigned by Scheduler adapter to the
 * device states.
 * Prerequisites:
 *  - The Auto Telegram Menu script should be installed.
 *  - The Scheduler ioBroker adapter should be installed and configured.
 * If all this is done, it will enable possibility to assign this `extension` to the appropriate `function` in the
 * Auto Telegram Menu script.
 * And enable the one `buttons` and one `attributeProperty` in the menu to control the schedules.
 */

/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

// @ts-ignore
const {v4: uuidv4} = require('uuid');

/**
 * This function is used to hide equal names of sub functions from other scripts.
 */
function autoTelegramMenuExtensionScheduler() {
  const extensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    extensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    extensionsTimeout = 500,
    extensionId = 'ioBrokerScheduler',
    extensionRepository = {
      url: 'https://github.com/PeterVoronov/ioBrokerTelegramMenuScript',
      branch: 'v0.9.5-dev',
      baseFolder: `/extensions/${extensionId}`,
      scriptName: 'ATMExtensionScheduler.js',
      localesFolder: `/extensions/${extensionId}/locales`,
    },
    idSchedules = 'schedules',
    extensionAttributes = {
      [idSchedules]: {
        asButton: true,
        asAttribute: false,
        asAttributeProperty: true,
        icon: '🕒',
      },
    },
    scheduleOnOff = 'onoff',
    scheduleTemperature = 'temperature',
    scheduleHumidity = 'humidity',
    statesFilterRoles = ['switch', 'value.temperature', 'value.humidity'],
    statesFilterTypes = ['boolean', 'number', 'number'],
    stateAccessModes = {write: true},
    stateSchedulesFromRoles = {
      switch: scheduleOnOff,
      'value.temperature': scheduleTemperature,
      'value.humidity': scheduleHumidity,
    },
    stateTypeFromScheduleType = {
      [scheduleOnOff]: 'boolean',
      [scheduleTemperature]: 'number',
      [scheduleHumidity]: 'number',
    },
    extensionInfo = {
      id: extensionId,
      type: 'attributes',
      icon: '🗓️',
      options: {
        attributes: extensionAttributes,
        repository: extensionRepository,
        stateAssignment: 'filtered',
        filter: {
          role: statesFilterRoles,
          type: statesFilterTypes,
          access: stateAccessModes,
        },
      },
      scriptName: scriptName,
      translationsKeys: [
        `${extensionId}`,
        `${idSchedules}`,
        'schedule',
        'enabled',
        ...Object.values(stateSchedulesFromRoles),
        'time',
        'weekdays',
        'browse',
        'delete',
        'add',
        'save',
        'priority',
        'interval',
        'normal',
        'high',
        'high-weekends',
        'intervalStart',
        'intervalEnd',
        'intervalSetTo',
        'intervals',
        'create',
        'folder',
        'type',
        'attribute',
        'value',
        'associated',
        'associateWith',
        'associatedWith',
        'dissociate',
      ],
    },
    _idAttributes = 'attributes',
    idProperties = 'properties',
    systemPrefix = 'system.adapter',
    adapterPrefix = 'scheduler',
    adapterName = 'scheduler',
    adapterSuffixAlive = '.alive',
    adapterSuffixConnected = '.connected',
    priorityTextValues = new Map([
      [0, 'normal'],
      [1, 'high'],
      [2, 'high-weekends'],
    ]),
    intervalDurations = new Map([
      [0.25, '00:15'],
      [0.5, '00:30'],
      [1, '01:00'],
      [2, '02:00'],
      [4, '04:00'],
    ]),
    iconInterval = '🕒',
    iconProfile = '📅',
    iconFolder = '📂',
    intervalOn = '🟢',
    intervalOff = '🔴',
    scheduleTemplate = {
      id: '',
      title: '',
      parent: '',
      type: '',
      data: {
        state: true,
        members: [],
        type: 'temperature',
        prio: 0,
        dow: [1, 2, 3, 4, 5],
        intervalDuration: 4,
        intervals: [22, 22, 22, 22, 22, 22],
      },
    };

  const _autoTelegramMenuExtensionsGetCachedState = autoTelegramMenuExtensionsGetCachedStateCommand
      ? `${autoTelegramMenuExtensionsGetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsGetCachedState',
    _autoTelegramMenuExtensionsSetCachedState = autoTelegramMenuExtensionsSetCachedStateCommand
      ? `${autoTelegramMenuExtensionsSetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsSetCachedState';

  /**
   * This function is used to send to "main" Auto Telegram Menu script all information about the extension.
   * @param {string=} messageId - message id to which the result will be sent
   * @param {number=} timeout - timeout for the message.
   */
  function extensionInit(messageId = extensionsRegister, timeout = extensionsTimeout) {
    messageTo(messageId, extensionInfo, {timeout: timeout}, (result) => {
      if (!result.success) {
        console.warn(`Error to register ${extensionId} - ${result.error}`);
      }
    });
  }

  /**
   * This function is used to get the translation item from the translations object.
   * @param {object} translations - The translations object.
   * @param {string} key - The translation key.
   * @returns {string} The translation.
   **/
  function getTranslation(translations, key) {
    return translations?.[key] || key;
  }

  /**
   * This function is used convert the time in minutes to the string in format 'HH:MM".
   * @param {number} minutes - The time in minutes.
   * @returns {string} The time in format 'HH:MM".
   **/
  function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60),
      mins = minutes % 60;
    return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
  }

  /**
   * This class is used to work with the schedules from the ioBroker scheduler adapter.
   * It provides the methods to load, save, and manipulate the schedules.
   * @class
   * @property {object[]} #schedules - The array of schedules.
   * @method load - The method to load the schedules from the ioBroker adapter.
   * @method save - The method to save the schedules to the ioBroker adapter.
   * @method count - The method to get the schedules count.
   * @method scheduleAdd - The method to add or update the schedule item.
   * @method scheduleDelete - The method to delete the schedule item.
   * @method scheduleIsCanBeDeleted - The method to identify is the schedule item can be deleted.
   * @method generateId - The method to generate the unique id for the schedule item.
   * @method getAdapters - The method to get the array of available adapters.
   * @method getByAdapterAndParent - The method to get the schedule by adapter id and, if set - assigned to parent.
   * @method getByDeviceId - The method to get the schedule by device id.
   * @method getByAdapterAndDeviceId - The method to get the schedules by adapter id and device id.
   * @method scheduleGetById - The method to get the schedule by id.
   * @method scheduleMakePath - The method to make the path for the schedule item based on it's hierarchy.
   * @method scheduleWeekdaysDecode - The method to get the schedule weekdays in 'main' script format.
   * @method scheduleWeekdaysEncode - The method to get the schedule weekdays from 'main' script format.
   * @method scheduleIntervalsDecode - The method to get the schedule intervals in 'main' script format.
   * @method scheduleIntervalEncode - The method to get the schedule intervals from 'main' script format.
   * @method scheduleGetStateId - The method to get the state id associated with the schedule item.
   * @method scheduleIsEnabled - The method to identify is the schedule item is enabled.
   * @method scheduleValueToText - The method to convert the schedule value to the text value.
   * @method schedulesToTextValues - The method to convert the schedule array to the array of "text" values which can be
   * converted by "main" script to the menu text.
   * @method schedulesGetByStateId - The method to get the schedules with appropriate state associated.
   * @method isSchedulesAreEqual - The static method to compare is two schedules are equal.
   * @method isScheduleFilledFully - The static method to identify is the schedule item is filled fully.
   * @constructor
   * @returns {Schedules} The instance of the Schedules class.
   **/
  class Schedules {
    #schedules = [];

    static forbiddenCharsRegEx = /[^._\-/ :!#$%&()+=@^{}|~\p{Ll}\p{Lu}\p{Nd}]+/gu;
    static timeMinimal = '00:00';
    static timeMinimalInMinutes = 0;
    static timeMaximal = '24:00';
    static timeMaximalInMinutes = 24 * 60;
    /**
     * The class constructor
     **/
    constructor() {
      this.load();
    }

    /**
     * This method is used to load the schedules from the ioBroker adapter.
     * @returns {boolean} The result.
     **/
    load() {
      this.#schedules = new Array();
      let adapterIndex = 0;
      while (Schedules.adapterIsAvailable(adapterIndex)) {
        const adapter = getObject(`${systemPrefix}.${adapterPrefix}.${adapterIndex}`);
        if (
          typeof adapter === 'object' &&
          // @ts-ignore
          adapter.type === 'instance' &&
          adapter.common?.name === adapterName
        ) {
          if (Array.isArray(adapter.native?.profiles) && adapter.native.profiles.length > 0) {
            const profiles = adapter.native.profiles;
            profiles.forEach((profile) => {
              if (
                typeof profile === 'object' &&
                typeof profile.title === 'string' &&
                typeof profile.data === 'object'
              ) {
                profile.adapterId = adapterIndex;
                this.#schedules.push(profile);
              } else {
                log(`Invalid profile: ${JSON.stringify(profile, null, 2)}`);
              }
            });
          }
        }
        adapterIndex++;
      }
      return this.#schedules.length > 0;
    }

    /**
     * This method is used to save the schedules to the ioBroker adapter.
     * @param {object} schedule - The schedule to save or delete.
     * @param {function} callback - The callback function.
     **/
    save(schedule, callback) {
      if (typeof schedule === 'object' && typeof schedule.adapterId === 'number') {
        const adapterId = schedule.adapterId,
          adapter = getObject(`${systemPrefix}.${adapterPrefix}.${adapterId}`);
        if (typeof adapter === 'object' && adapter.type === 'instance') {
          const profiles = new Array(),
            scheduleIsExists = this.scheduleGetById(schedule.id) !== undefined,
            saveToAdapter = () => {
              getObject(`${systemPrefix}.${adapterPrefix}.${adapterId}`, (error, object) => {
                if (error || object === null || object === undefined) {
                  log(`Error to read the adapter: ${JSON.stringify(error)}`);
                  callback();
                } else {
                  // @ts-ignore
                  if (typeof object.native !== 'object') object.native = {};
                  // @ts-ignore
                  object.native.profiles = profiles;
                  setObject(`${systemPrefix}.${adapterPrefix}.${adapterId}`, object, (error, result) => {
                    if (error) {
                      log(`Error to write the schedules: ${JSON.stringify(error)}`);
                    } else {
                      log(`Schedules written successfully: ${JSON.stringify(result)}`);
                    }
                    callback();
                  });
                }
              });
            };
          if (Schedules.adapterIsAvailable(adapterId) === true) {
            this.#schedules
              .filter((schedule) => schedule.adapterId === adapterId)
              .forEach((profile) => {
                profiles.push({...profile, adapterId: undefined, enabled: undefined});
              });
            if (
              schedule.type === 'profile' &&
              (schedule.enabled !== this.scheduleIsEnabled(schedule, true) || !scheduleIsExists)
            ) {
              const stateId = this.scheduleGetStateId(schedule),
                enabled = schedule.enabled === true,
                setStateValue = () => {
                  setState(stateId, enabled, (error, result) => {
                    if (error) {
                      log(`Error to set the state ${stateId} to ${enabled}: ${JSON.stringify(error)}`);
                      callback();
                    } else {
                      log(`State ${stateId} set to ${enabled}. Result is: ${JSON.stringify(result)}.`);
                      saveToAdapter();
                    }
                  });
                };
              if (typeof stateId === 'string') {
                if (existsState(stateId) === true) {
                  if (!scheduleIsExists) {
                    deleteState(stateId, (error, result) => {
                      if (error) {
                        log(`Error to delete the state ${stateId}: ${JSON.stringify(error)}`);
                        callback();
                      } else {
                        log(`State ${stateId} deleted with result: ${JSON.stringify(result)}`);
                        if (existsObject(stateId)) {
                          deleteObject(stateId, (error, result) => {
                            if (error) {
                              log(`Error to delete the object ${stateId}: ${JSON.stringify(error)}`);
                              saveToAdapter();
                            } else {
                              log(`Object ${stateId} deleted with result: ${JSON.stringify(result)}`);
                              saveToAdapter();
                            }
                          });
                        } else {
                          saveToAdapter();
                        }
                      }
                    });
                  } else {
                    setStateValue();
                  }
                } else {
                  setObject(
                    stateId,
                    {
                      type: 'state',
                      common: {
                        type: 'boolean',
                        read: true,
                        write: true,
                        role: 'switch',
                        def: true,
                        name: schedule.title,
                      },
                      native: {},
                    },
                    (error, result) => {
                      if (error) {
                        log(`Error to create the state ${stateId}: ${JSON.stringify(error)}`);
                        callback();
                      } else {
                        log(`State ${stateId} created with result: ${JSON.stringify(result)}`);
                        setStateValue();
                      }
                    },
                  );
                }
              } else {
                log(`State id for the schedule ${schedule.id} not found`);
                callback();
              }
            } else {
              saveToAdapter();
            }
          } else {
            log(`The adapter ${adapterId} is not available`);
            callback();
          }
        } else {
          callback();
        }
      } else {
        callback();
      }
    }

    /**
     * This method is used to get the schedules count.
     * @returns {number} The schedules count.
     **/
    count() {
      return this.#schedules.length;
    }

    /**
     * This method is used to add ore update the schedule item.
     * @param {object} schedule - The schedule item.
     **/
    scheduleAdd(schedule) {
      if (Schedules.isScheduleFilledFully(schedule)) {
        const scheduleIndex = this.#schedules.findIndex(
          (item) => item.id === schedule.id && item.adapterId === schedule.adapterId,
        );
        if (scheduleIndex >= 0) {
          this.#schedules[scheduleIndex] = schedule;
        } else {
          this.#schedules.push(schedule);
        }
      }
    }

    /**
     * This method is used to delete the schedule item.
     * @param {string} id - The schedule id.
     **/
    scheduleDelete(id) {
      const scheduleIndex = this.#schedules.findIndex((item) => item.id === id);
      if (scheduleIndex >= 0) {
        this.#schedules.splice(scheduleIndex, 1);
      }
    }

    scheduleIsCanBeDeleted(id) {
      const schedule = this.scheduleGetById(id);
      return (
        (!Array.isArray(schedule.data?.members) || schedule.data.members.length === 0) &&
        this.#schedules.find((item) => item.parent === id) === undefined
      );
    }

    /**
     * This method is used to generate the unique id for the schedule item.
     * @returns {string} The unique id.
     **/
    generateId() {
      let id = uuidv4();
      while (this.#schedules.find((schedule) => schedule.id === id) !== undefined) {
        id = uuidv4();
      }
      return id;
    }

    /**
     * This method is used to get the array of available adapters.
     * @returns {number[]} The array of available adapters.
     **/
    getAdapters() {
      const adapters = [];
      let adapterIndex = 0;
      while (Schedules.adapterIsAvailable(adapterIndex)) {
        adapters.push(adapterIndex);
        adapterIndex++;
      }
      return adapters;
    }

    /**
     * This method is used to identify is the adapter is available.
     * @param {number} adapterId - The adapter id.
     * @returns {boolean} The result.
     **/
    static adapterIsAvailable(adapterId) {
      return (
        existsState(`${systemPrefix}.${adapterPrefix}.${adapterId}${adapterSuffixAlive}`) === true &&
        getState(`${systemPrefix}.${adapterPrefix}.${adapterId}${adapterSuffixAlive}`).val === true &&
        existsState(`${systemPrefix}.${adapterPrefix}.${adapterId}${adapterSuffixConnected}`) === true &&
        getState(`${systemPrefix}.${adapterPrefix}.${adapterId}${adapterSuffixConnected}`).val === true &&
        existsObject(`${systemPrefix}.${adapterPrefix}.${adapterId}`)
      );
    }

    /**
     * This method is used to get the schedule by adapter id and, if set - assigned to parent.
     * @param {number} adapterId - The adapter id.
     * @param {string=} parent - The parent id.
     * @returns {object[]} The array of schedules.
     **/
    getByAdapterAndParent(adapterId, parent = '') {
      return this.#schedules.filter((schedule) => schedule.adapterId === adapterId && schedule.parent === parent);
    }

    /**
     * This method is used to get the schedules by adapter id and device id.
     * @param {number} adapterId - The adapter id.
     * @param {string} deviceId - The device id.
     * @returns {object[]} The array of schedules.
     **/
    getByAdapterAndDeviceId(adapterId, deviceId) {
      return this.#schedules.filter(
        (schedule) =>
          schedule.adapterId === adapterId &&
          schedule.type === 'profile' &&
          Array.isArray(schedule.data?.members) &&
          schedule.data.members.length > 0 &&
          schedule.data.members.every((member) => member.startsWith(deviceId) === true),
      );
    }

    /**
     * This method is used to get the schedules by device id.
     * @param {string} deviceId - The schedule id.
     * @returns {object[]} The array of schedules.
     **/
    getByDeviceId(deviceId) {
      return this.#schedules.filter(
        (schedule) =>
          schedule.type === 'profile' &&
          Array.isArray(schedule.data?.members) &&
          schedule.data.members.length > 0 &&
          schedule.data.members.every((member) => member.startsWith(deviceId) === true),
      );
    }

    /**
     * This method is used to get the schedule by id.
     * @param {string} id - The schedule id.
     * @returns {object} The schedule item.
     **/
    scheduleGetById(id) {
      return this.#schedules.find((schedule) => schedule.id === id);
    }

    /**
     * This method is used to make the path for the schedule item based on it's hierarchy.
     * @param {object} schedule - The schedule item.
     * @param {boolean=} isForState - The flag to identify is the path is for the state.
     * @param {string=} delimiter - The delimiter for the path.
     * @returns {string} The path for the schedule item.
     **/
    scheduleMakePath(schedule, isForState = false, delimiter = '.') {
      let result = schedule.title;
      if (isForState === true) {
        result = result.replace(Schedules.forbiddenCharsRegEx, '_');
      }
      if (typeof schedule.parent === 'string' && schedule.parent.length > 0) {
        result = `${this.scheduleMakePath(
          this.#schedules.find((item) => item.id === schedule.parent && item.adapterId === schedule.adapterId),
          isForState,
          delimiter,
        )}${delimiter}${result}`;
      }
      return result;
    }

    /**
     * This method is used to get the schedule weekdays in 'main' script format.
     * @param {object} schedule - The schedule item.
     * @returns {number[]} The schedule weekdays.
     **/
    static scheduleWeekdaysDecode(schedule) {
      const weekdays = Array.isArray(schedule.data?.dow) ? [...schedule.data.dow] : [],
        sundayIndex = weekdays.findIndex((day) => day === 0);
      if (sundayIndex >= 0) {
        weekdays.splice(sundayIndex, 1);
        weekdays.push(7);
        weekdays.sort((a, b) => a - b);
      }
      return weekdays;
    }

    /**
     * This method is used to get the schedule weekdays from 'main' script format.
     * @param {number[]} weekdays - The schedule weekdays.
     * @returns {number[]} The schedule weekdays.
     **/
    static scheduleWeekdaysEncode(weekdays) {
      const result = [...weekdays];
      result.sort((a, b) => a - b);
      if (result.includes(7)) {
        result.splice(result.indexOf(7), 1);
        result.push(0);
      }
      return result;
    }

    /**
     * This method is used to get the schedule intervals in 'main' script format.
     * @param {object} schedule - The schedule item.
     * @returns {object[]} The schedule intervals.
     **/
    static scheduleIntervalsDecode(schedule) {
      const intervals = [],
        intervalsSource = schedule.data?.intervals || [],
        intervalValue = schedule.data?.intervalDuration || 1,
        intervalDelta = intervalValue * 60,
        intervalsCount = Math.round(24 / intervalValue);
      let intervalIndex = -1,
        lastIndex = 0,
        lastValue = intervalsSource[lastIndex];
      if (Array.isArray(intervalsSource) && intervalsSource.length >= intervalsCount) {
        while (intervalIndex < intervalsCount) {
          intervalIndex++;
          const interval = intervalIndex < intervalsCount ? intervalsSource[intervalIndex] : undefined;
          if (interval !== lastValue) {
            intervals.push({
              start: minutesToTime(intervalDelta * lastIndex),
              end: minutesToTime(intervalDelta * intervalIndex),
              value: lastValue,
            });
            lastIndex = intervalIndex;
            lastValue = interval;
          }
        }
      }
      return intervals;
    }

    /**
     * This method is used to get the schedule intervals from 'main' script format.
     * @param {object[]} intervals - The schedule intervals.
     * @param {number} intervalDuration - The interval duration.
     * @returns {number[]} The schedule intervals.
     **/
    static scheduleIntervalEncode(intervals, intervalDuration = 1) {
      const result = new Array(),
        intervalDurationInMinutes = intervalDuration * 60,
        resultLength = this.timeMaximalInMinutes / intervalDurationInMinutes;
      if (Array.isArray(intervals) && intervals.length > 0) {
        intervals.forEach((interval) => {
          const startInMinutes = Math.round(
              (timeToMinutes(interval.start) / intervalDurationInMinutes) * intervalDurationInMinutes,
            ),
            endInMinutes = Math.round(
              (timeToMinutes(interval.end) / intervalDurationInMinutes) * intervalDurationInMinutes,
            );
          let timeInMinutes = startInMinutes;
          while (timeInMinutes < endInMinutes) {
            result.push(interval.value);
            timeInMinutes += intervalDurationInMinutes;
          }
        });
      }
      if (result.length < resultLength) {
        return [];
      }
      return result.slice(0, resultLength);
    }

    /**
     * This method is used to get the state id associated with the schedule item.
     * @param {object} schedule - The schedule item.
     * @returns {string} The state id.
     **/
    scheduleGetStateId(schedule) {
      const stateFromProfile = schedule.data?.state,
        schedulesPrefix = `${adapterPrefix}.${schedule.adapterId}`,
        scheduleStateId =
          typeof stateFromProfile === 'string'
            ? stateFromProfile
            : `${schedulesPrefix}.${this.scheduleMakePath(schedule, true)}`;
      return scheduleStateId;
    }

    /**
     * This function is used to identify is the schedule item is enabled.
     * @param {object} schedule - The schedule item.
     * @param {boolean=} stateOnly - The flag to identify is the state only should be checked.
     * @returns {boolean|undefined} The result.
     **/
    scheduleIsEnabled(schedule, stateOnly = false) {
      if (typeof schedule.enabled === 'boolean' && stateOnly === false) {
        return schedule.enabled;
      } else {
        const scheduleStateId = this.scheduleGetStateId(schedule);
        if (typeof scheduleStateId === 'string' && existsState(scheduleStateId) === true) {
          const scheduleState = getState(scheduleStateId);
          return typeof scheduleState === 'object' && scheduleState.val === true;
        }
      }
    }

    /**
     * This method is used to convert the schedule value to the text value.
     * @param {object} schedule - The schedule item.
     * @param {number} value - The value.
     * @returns {string} The text value.
     **/
    scheduleValueToText(schedule, value) {
      let result = typeof value !== 'number' ? '❓' : value;
      if (typeof schedule.data?.type === 'string' && typeof value === 'number') {
        switch (schedule.data?.type) {
          case 'onoff': {
            result = result === 1 ? intervalOn : intervalOff;
            break;
          }
          case 'temperature': {
            result = `${result}°C`;
            break;
          }
          case 'humidity': {
            result = `${result}%`;
            break;
          }
          default: {
            break;
          }
        }
      }
      return `${result}`;
    }

    /**
     * This method is used to convert the schedule array to the array of "text" values which can be converted
     * by "main" script to the menu text.
     * @param {object[]} schedules - The array of schedule items.
     * @param {object} translations - The translations object.
     * @param {string} prefix - The prefix for the text values.
     * @param {object[]} firstItems - The array of first items to add to the result.
     * @returns {object[]} The array of "text" values.
     */
    schedulesToTextValues(schedules, translations, prefix = '', firstItems = []) {
      const result = [...firstItems];
      schedules.forEach((schedule) => {
        if (schedule.type === 'profile') {
          result.push(
            {
              label: `${prefix}${this.scheduleMakePath(schedule, false, '/')}`,
              value: this.scheduleIsEnabled(schedule) === true,
              convert: 'boolean',
              options: {icons: {true: intervalOn, false: intervalOff}},
            },
            {
              label: ` ${prefix}${getTranslation(translations, 'type')}`,
              value: getTranslation(translations, schedule.data?.type),
            },
            {
              label: ` ${prefix}${getTranslation(translations, 'priority')}`,
              value: getTranslation(translations, priorityTextValues.get(schedule.data?.prio) || 'normal'),
            },
            {
              label: ` ${prefix}${getTranslation(translations, 'interval')}`,
              value: intervalDurations.get(schedule.data?.intervalDuration || 1),
            },
            {
              label: ` ${prefix}${getTranslation(translations, 'weekdays')}`,
              value: Schedules.scheduleWeekdaysDecode(schedule),
              convert: `weekdays`,
            },
          );
          Schedules.scheduleIntervalsDecode(schedule).forEach((interval) => {
            result.push({
              label: ` ${prefix}${interval.start}-${interval.end}`,
              value: this.scheduleValueToText(schedule, interval.value),
            });
          });
        } else {
          result.push({
            label: `${prefix}${getTranslation(translations, 'folder')}`,
            value: this.scheduleMakePath(schedule, false, '/'),
          });
        }
      });
      return result;
    }

    /**
     * This method is used to get the schedules with appropriate state associated.
     * @param {string} stateId - The state id.
     * @param {string} parentStateType - The schedule type.
     * @returns {object[]} The array of schedules with appropriate state associated.
     **/
    schedulesGetByStateId(stateId, parentStateType) {
      const result = [];
      this.#schedules.forEach((schedule) => {
        if (
          schedule.data?.type === parentStateType &&
          Array.isArray(schedule.data?.members) &&
          schedule.data.members.includes(stateId)
        ) {
          result.push(schedule);
        }
      });
      return result;
    }

    /** This static method is used to compare is two schedules are equal.
     * @param {object} scheduleA - The first schedule.
     * @param {object} scheduleB - The second schedule.
     * @param {Schedules} schedules - The schedules instance.
     * @returns {boolean} The result.
     **/
    static isSchedulesAreEqual(scheduleA, scheduleB, schedules) {
      if (typeof scheduleA !== 'object' || typeof scheduleB !== 'object') return false;
      return (
        scheduleA.adapterId === scheduleB.adapterId &&
        scheduleA.id === scheduleB.id &&
        scheduleA.title === scheduleB.title &&
        schedules.scheduleIsEnabled(scheduleA) === schedules.scheduleIsEnabled(scheduleB) &&
        scheduleA.type === scheduleB.type &&
        scheduleA.parent === scheduleB.parent &&
        scheduleA.data?.type === scheduleB.data?.type &&
        scheduleA.data?.state === scheduleB.data?.state &&
        scheduleA.data?.prio === scheduleB.data?.prio &&
        scheduleA.data?.dow.every((day1, dayIndex) => day1 === scheduleB.data?.dow[dayIndex]) &&
        scheduleA.data?.intervalDuration === scheduleB.data?.intervalDuration &&
        scheduleA.data?.intervals.length === scheduleB.data?.intervals.length &&
        scheduleA.data?.intervals.every(
          (interval1, intervalIndex) => interval1 === scheduleB.data?.intervals[intervalIndex],
        ) &&
        scheduleA.data?.members.length === scheduleB.data?.members.length &&
        scheduleA.data?.members.every((member1, memberIndex) => member1 === scheduleB.data?.members[memberIndex])
      );
    }

    static isScheduleFilledFully(schedule) {
      return (
        typeof schedule === 'object' &&
        typeof schedule.id === 'string' &&
        schedule.id.length > 0 &&
        typeof schedule.title === 'string' &&
        schedule.title.length > 0 &&
        typeof schedule.type === 'string' &&
        schedule.type.length > 0 &&
        typeof schedule.parent === 'string' &&
        typeof schedule.data === 'object' &&
        typeof schedule.data?.type === 'string' &&
        schedule.data.type.length > 0 &&
        ((typeof schedule.data?.state === 'string' && schedule.data.state.length > 0) ||
          typeof schedule.data?.state === 'boolean') &&
        typeof schedule.data?.prio === 'number' &&
        schedule.data.prio >= 0 &&
        Array.isArray(schedule.data?.dow) &&
        typeof schedule.data?.intervalDuration === 'number' &&
        schedule.data.intervalDuration > 0 &&
        Array.isArray(schedule.data?.intervals) &&
        schedule.data.intervals.length > 0 &&
        Array.isArray(schedule.data?.members)
      );
    }
  }

  /**
   * This function is used to convert the time in format 'HH:MM' to the time in minutes.
   * @param {string} time - The time in format 'HH:MM'.
   * @returns {number} The time in minutes.
   **/
  function timeToMinutes(time) {
    const timeParts = time.split(':');
    return parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
  }

  /**
   * This function is used to compare two times.
   * @param {string} time1 - The first time.
   * @param {string} time2 - The second time.
   * @returns {number} The result.
   **/
  function timeCompare(time1, time2) {
    return timeToMinutes(time1) - timeToMinutes(time2);
  }

  /**
   * Register the reaction on the extension init message from "main" script.
   **/
  onMessage(extensionsInit, ({messageId, timeout}, callback) => {
    extensionInit(messageId, timeout);
    callback({success: true});
  });

  /**
   * Register the reaction on the request to process the "schedule" `button` item/sub-items from the "main" script.
   **/
  onMessage(`${extensionId}#${idSchedules}`, ({data, translations}, callback) => {
    let options = data.options || {},
      {device, states, parentStateId, parent, item, subItem, index, subIndex, mode, valueOptions, icons} = options,
      parentStateType = options.parentStateType || '',
      saveSchedule;
    const valueInterim = valueOptions?.externalValueInterim,
      schedules = new Schedules(),
      iconOn = icons?.[0] || '✅',
      iconOff = icons?.[1] || '🚫',
      messageToId = `${extensionId}#${idSchedules}`,
      menuItem = {...data},
      modeBrowse = typeof mode !== 'string' || mode === 'browse';
    menuItem.submenu = new Array();
    if (
      mode === 'save' &&
      Schedules.isScheduleFilledFully(valueInterim) &&
      typeof valueInterim.adapterId === 'number'
    ) {
      schedules.scheduleAdd(valueInterim);
      saveSchedule = {...valueInterim};
      menuItem.goTo = menuItem.index.split('.').slice(0, -2).join('.');
      log(`goto = ${menuItem.goTo}`);
      menuItem.submenu = messageToId;
    }
    if (typeof device === 'string' && typeof states === 'object' && !Array.isArray(states)) {
      menuItem.id = idSchedules;
      menuItem.textValues = [];
      Object.keys(states).forEach((stateId) => {
        if (existsObject(stateId) === true) {
          const stateInfo = getObject(stateId),
            stateInfoCommon = stateInfo?.common || {},
            stateRole = stateInfoCommon?.role || '',
            stateScheduleType = stateSchedulesFromRoles[stateRole] || '',
            parentStateParams = {};
          if (typeof stateInfoCommon?.step === 'number') {
            parentStateParams.step = stateInfoCommon.step;
          }
          if (typeof stateInfoCommon?.min === 'number') {
            parentStateParams.min = stateInfoCommon.min;
          }
          if (typeof stateInfoCommon?.max === 'number') {
            parentStateParams.max = stateInfoCommon.max;
          }
          if (stateScheduleType !== '') {
            const schedulesAssigned = schedules.schedulesGetByStateId(stateId, stateScheduleType),
              stateText = {
                label: getTranslation(translations, 'attribute'),
                value: states[stateId] || '',
              };
            menuItem.submenu.push({
              name: `${states[stateId]} [${schedules.getByDeviceId(stateId).length}]`,
              id: stateId.split('.').pop(),
              extensionId: extensionId,
              icon: extensionInfo.icon,
              textValues: schedules.schedulesToTextValues(schedulesAssigned, translations, '  ', [stateText]),
              group: 'state',
              options: {
                parentStateId: stateId,
                parentStateName: states[stateId],
                parentStateType: stateScheduleType,
                parentStateParams: parentStateParams,
                icons: icons,
              },
              submenu: messageToId,
            });
          }
        }
      });
    } else if (typeof parentStateId === 'string' && typeof index !== 'number' && modeBrowse) {
      const scheduleForText = [
        {
          label: getTranslation(translations, 'attribute'),
          value: options.parentStateName || '',
        },
      ];
      if (typeof mode !== 'string') {
        const schedulesToShow = schedules.schedulesGetByStateId(parentStateId, parentStateType);
        if (schedulesToShow.length > 0) {
          let adapterId = -1;
          schedulesToShow.forEach((schedule) => {
            if (adapterId !== schedule.adapterId) {
              adapterId = schedule.adapterId;
              menuItem.submenu.push({
                name:
                  `${getTranslation(translations, 'associated')}: ` +
                  `${getTranslation(translations, extensionId)}.${adapterId}` +
                  ` [${schedules.getByAdapterAndDeviceId(adapterId, parentStateId).length}]`,
                id: `${adapterPrefix}${adapterId}`,
                extensionId: extensionId,
                icon: extensionInfo.icon,
                textValues: schedules.schedulesToTextValues(
                  schedulesToShow.filter((schedule) => schedule.adapterId === adapterId),
                  translations,
                  '  ',
                  scheduleForText,
                ),
                group: 'adapter',
                options: {
                  ...options,
                  index: adapterId,
                },
                submenu: messageToId,
              });
            }
          });
        }
        menuItem.submenu.push({
          name: getTranslation(translations, 'browse'),
          id: 'browse',
          extensionId: extensionId,
          icon: icons?.add || '',
          textValues: scheduleForText,
          group: 'browse',
          options: {
            ...options,
            mode: 'browse',
          },
          submenu: messageToId,
        });
      } else if (mode === 'browse') {
        schedules.getAdapters().forEach((adapterId) => {
          menuItem.submenu.push({
            name: `${getTranslation(translations, extensionId)}.${adapterId}`,
            id: `${adapterPrefix}${adapterId}`,
            extensionId: extensionId,
            icon: extensionInfo.icon,
            group: 'adapter',
            textValues: [scheduleForText],
            options: {
              ...options,
              index: adapterId,
            },
            submenu: messageToId,
          });
        });
      }
    } else if (typeof parentStateId === 'string' && typeof index === 'number' && (modeBrowse || mode === 'create')) {
      const scheduleForText = [
        {
          label: getTranslation(translations, 'attribute'),
          value: options.parentStateName || '',
        },
      ];
      let scheduleCurrent = schedules.scheduleGetById(item) || {};
      if (typeof subItem !== 'string' && typeof item !== 'string' && mode !== 'create') {
        let schedulesToShow = schedules.getByAdapterAndParent(index, parent);
        if (mode === 'browse') {
          scheduleForText.push({
            label: `${getTranslation(translations, 'associatedWith')}:`,
            value: '',
          });
          schedulesToShow = schedulesToShow.filter(
            (schedule) => schedule.type === 'folder' || schedule.data?.type === parentStateType,
          );
        } else {
          schedulesToShow = schedules
            .schedulesGetByStateId(parentStateId, parentStateType)
            .filter((schedule) => schedule.adapterId === index);
        }
        if (mode === 'browse' && typeof valueInterim === 'object' && !valueInterim.hasOwnProperty('id')) {
          schedulesToShow.forEach((schedule, scheduleIndex) => {
            if (valueInterim?.[schedule?.id] === false) {
              schedulesToShow.splice(scheduleIndex, 1);
              saveSchedule = {...schedule};
              schedules.scheduleDelete(schedule.id);
            }
          });
        }
        schedulesToShow.forEach((schedule, scheduleIndex) => {
          const subMenuItem = {
            name: mode === 'browse' ? schedule.title : schedules.scheduleMakePath(schedule, false, '/'),
            id: `${scheduleIndex}`,
            extensionId: extensionId,
            textValues: schedules.schedulesToTextValues([schedule], translations, '  ', scheduleForText),
            group: 'schedules',
            options: {
              ...options,
              valueOptions: {
                ...options?.valueOptions,
                externalValueId: `${menuItem.index}.${scheduleIndex}`,
              },
            },
            submenu: messageToId,
          };
          if (schedule.type === 'profile') {
            subMenuItem.icon = schedules.scheduleIsEnabled(schedule) === true ? iconOn : iconOff;
            subMenuItem.options.item = schedule.id;
            if (typeof subMenuItem.options.valueOptions !== 'object') {
              subMenuItem.options.valueOptions = {};
            }
            delete subMenuItem.options.parent;
          } else {
            subMenuItem.icon = iconFolder;
            subMenuItem.options.parent = schedule.id;
          }
          menuItem.submenu.push(subMenuItem);
        });
        if (mode === 'browse') {
          menuItem.options = {
            ...menuItem.options,
            valueOptions: {
              ...menuItem.options.valueOptions,
              externalValueId: menuItem.index,
              externalValueType: 'object',
              externalValue: {},
            },
          };
          if (typeof parent === 'string' && parent.length > 0) {
            if (schedules.scheduleIsCanBeDeleted(parent)) {
              menuItem.submenu.push({
                name: getTranslation(translations, 'delete'),
                id: 'delete',
                extensionId: extensionId,
                icon: icons.delete || '',
                group: 'delete',
                type: 'internalMenuItem',
                command: 'deleteItem',
                options: {
                  ...options,
                  item: parent,
                  mode: 'delete',
                  subMode: 'boolean',
                  valueOptions: {
                    ...options.valueOptions,
                    externalValueId: menuItem.index.split('.').slice(0, -1).join('.'),
                  },
                },
                submenu: [],
              });
            }
          }
          menuItem.submenu.push({
            name: getTranslation(translations, 'create'),
            id: 'create',
            extensionId: extensionId,
            icon: icons?.create || '',
            group: 'create',
            options: {
              ...options,
              mode: 'create',
              valueOptions: {
                ...options.valueOptions,
                externalValueId: `${menuItem.index}.create`,
              },
            },
            submenu: messageToId,
          });
        }
      } else if (
        (typeof item === 'string' || mode === 'create') &&
        (typeof mode !== 'string' || (mode === 'browse' && scheduleCurrent.type === 'profile') || mode === 'create')
      ) {
        const scheduleOriginal = schedules.scheduleGetById(item);
        let schedule = scheduleOriginal;
        if (
          menuItem.index.startsWith(options.valueOptions?.externalValueId) &&
          typeof valueInterim === 'object' &&
          ((typeof item === 'string' && valueInterim.id === item) || typeof valueInterim.id === 'string')
        ) {
          schedule = valueInterim;
        }
        if (mode === 'create') {
          if (typeof schedule !== 'object') {
            schedule = {
              ...scheduleTemplate,
              id: schedules.generateId(),
              parent: options.parent || '',
              adapterId: index,
            };
            schedule.type = '';
            item = schedule.id;
            options.item = item;
          } else {
            item = schedule.id;
          }
        }
        if (typeof schedule === 'object' && typeof item === 'string' && schedule.id === item) {
          let priorityStates = [];
          priorityTextValues.forEach((value, key) => {
            priorityStates.push([key, getTranslation(translations, value)]);
          });
          options = {
            ...options,
            valueOptions: {
              ...options?.valueOptions,
              externalValueType: 'object',
              externalValueParamsLevel: 'sub',
            },
          };
          if (typeof schedule.edit === 'object') {
            const scheduleEdit = schedule.edit;
            options.valueOptions.externalValueSet = true;
            Object.keys(scheduleEdit).forEach((key) => {
              switch (key) {
                case 'enabled': {
                  if (typeof scheduleEdit?.enabled === 'boolean') {
                    schedule.enabled = scheduleEdit.enabled;
                  }
                  break;
                }
                case 'title': {
                  if (typeof scheduleEdit?.title === 'string' && scheduleEdit.title.length > 0) {
                    schedule.title = scheduleEdit.title;
                  }
                  break;
                }
                case 'type': {
                  if (typeof scheduleEdit?.type === 'string' && scheduleEdit.type.length > 0) {
                    schedule.type = scheduleEdit.type;
                    if (schedule.type === 'profile') {
                      schedule.data.type = options.parentStateType || 'temperature';
                      if (schedule.data.type === 'onoff') {
                        schedule.data.intervals.forEach((interval) => {
                          interval.value = interval.value === 1;
                        });
                      }
                    }
                  }
                  break;
                }
                case 'prio': {
                  if (typeof scheduleEdit?.prio === 'number') {
                    schedule.data.prio = scheduleEdit.prio;
                  }
                  break;
                }
                case 'weekdays': {
                  if (Array.isArray(scheduleEdit[key])) {
                    schedule.data.dow = Schedules.scheduleWeekdaysEncode(scheduleEdit.weekdays);
                  }
                  break;
                }
                case 'intervalDuration': {
                  if (typeof scheduleEdit?.intervalDuration === 'number') {
                    const intervals = Schedules.scheduleIntervalsDecode(schedule);
                    schedule.data.intervalDuration = scheduleEdit.intervalDuration;
                    schedule.data.intervals = Schedules.scheduleIntervalEncode(
                      intervals,
                      schedule.data.intervalDuration,
                    );
                  }
                  break;
                }
                case 'intervals': {
                  if (typeof scheduleEdit?.intervals === 'object') {
                    const intervals = Schedules.scheduleIntervalsDecode(schedule),
                      intervalsEdit = scheduleEdit.intervals;
                    Object.keys(intervalsEdit).forEach((intervalIndex) => {
                      const index = parseInt(intervalIndex, 10),
                        interval = intervals[index],
                        intervalEdit = intervalsEdit[intervalIndex];
                      Object.keys(intervalEdit).forEach((key) => {
                        switch (key) {
                          case 'start': {
                            const startInMinutes = timeToMinutes(intervalEdit[key]);
                            if (startInMinutes >= Schedules.timeMaximalInMinutes) {
                              intervals.splice(index, 1);
                            } else {
                              interval.start = intervalEdit[key];
                              if (startInMinutes === Schedules.timeMinimalInMinutes) {
                                if (index > 0) {
                                  intervals.splice(0, index);
                                }
                              } else {
                                if (index > 0) {
                                  let itemsToDelete = 0,
                                    indexToEdit;
                                  for (indexToEdit = index - 1; indexToEdit >= 0; indexToEdit--) {
                                    if (timeCompare(interval.start, intervals[indexToEdit].start) <= 0) {
                                      itemsToDelete++;
                                    } else {
                                      break;
                                    }
                                  }
                                  if (itemsToDelete > 0) {
                                    intervals.splice(indexToEdit + 1, itemsToDelete);
                                  }
                                }
                                if (index === 0 || timeCompare(interval.start, intervals[index - 1].end) > 0) {
                                  intervals.splice(index, 0, {
                                    start: index === 0 ? Schedules.timeMinimal : intervals[index - 1].end,
                                    end: interval.start,
                                  });
                                } else {
                                  intervals[index - 1].end = interval.start;
                                }
                              }
                            }
                            break;
                          }
                          case 'end': {
                            const endInMinutes = timeToMinutes(intervalEdit[key]);
                            if (endInMinutes <= Schedules.timeMinimalInMinutes) {
                              intervals.splice(index, 1);
                            } else {
                              interval.end = intervalEdit[key];
                              if (endInMinutes === Schedules.timeMaximalInMinutes) {
                                if (index < intervals.length - 1) {
                                  intervals.splice(index + 1, intervals.length - index - 1);
                                }
                              } else {
                                if (index < intervals.length - 1) {
                                  let itemsToDelete = 0,
                                    indexToEdit;
                                  for (indexToEdit = index + 1; indexToEdit < intervals.length; indexToEdit++) {
                                    if (timeCompare(interval.end, intervals[indexToEdit].end) >= 0) {
                                      itemsToDelete++;
                                    } else {
                                      break;
                                    }
                                  }
                                  if (itemsToDelete > 0) {
                                    intervals.splice(index + 1, itemsToDelete);
                                  }
                                }
                                if (
                                  index === intervals.length - 1 ||
                                  timeCompare(interval.end, intervals[index + 1].start) < 0
                                ) {
                                  intervals.splice(index + 1, 0, {
                                    start: interval.end,
                                    end:
                                      index === intervals.length - 1
                                        ? Schedules.timeMaximal
                                        : intervals[index + 1].start,
                                  });
                                } else {
                                  intervals[index + 1].start = interval.end;
                                }
                              }
                            }
                            break;
                          }
                          case 'value': {
                            if (stateTypeFromScheduleType[schedule.data?.type] === 'boolean') {
                              interval.value = intervalEdit[key] ? 1 : 0;
                            } else {
                              interval.value = intervalEdit[key];
                            }
                            break;
                          }
                          default: {
                            break;
                          }
                        }
                      });
                      schedule.data.intervals = Schedules.scheduleIntervalEncode(
                        intervals,
                        schedule.data.intervalDuration,
                      );
                    });
                  }
                  break;
                }
                case 'associate': {
                  if (typeof scheduleEdit?.associate === 'string' && scheduleEdit.associate.length > 0) {
                    const memberToAdd = scheduleEdit.associate;
                    if (schedule.data.members.includes(memberToAdd) === false) {
                      schedule.data.members.push(memberToAdd);
                    }
                  }
                  break;
                }
                case 'dissociate': {
                  if (typeof scheduleEdit?.dissociate === 'string' && scheduleEdit.dissociate.length > 0) {
                    const memberToRemove = scheduleEdit.dissociate;
                    if (schedule.data.members.includes(memberToRemove) === true) {
                      schedule.data.members.splice(schedule.data.members.indexOf(memberToRemove), 1);
                    }
                  }
                  break;
                }
              }
            });
            delete schedule.edit;
          }
          const enabled = schedules.scheduleIsEnabled(schedule) === true;
          options.valueOptions.externalValue = {...schedule, enabled: enabled};
          menuItem.textValues = schedules.schedulesToTextValues([schedule], translations, '  ', scheduleForText);
          menuItem.options = options;
          if (typeof subItem !== 'string') {
            menuItem.options.valueOptions.externalValueId = menuItem.index;
            if (typeof schedule.type !== 'string' || schedule.type.length === 0) {
              menuItem.submenu.push({
                name: getTranslation(translations, 'type'),
                id: 'type',
                extensionId: extensionId,
                icon: extensionInfo.icon,
                group: 'intervals',
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...options,
                  subItem: 'edit.type',
                  mode: 'edit',
                  valueOptions: {
                    ...options.valueOptions,
                    type: 'string',
                    states: [
                      ['profile', `${iconProfile}${getTranslation(translations, 'profile')}`],
                      ['folder', `${iconFolder}${getTranslation(translations, 'folder')}`],
                    ],
                  },
                },
                submenu: [],
              });
            } else if (
              typeof schedule.title !== 'string' ||
              schedule.title.length === 0 ||
              schedule.type === 'folder'
            ) {
              menuItem.submenu.push({
                name: getTranslation(translations, 'title'),
                id: 'title',
                extensionId: extensionId,
                icon: extensionInfo.icon,
                group: 'title',
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...options,
                  subItem: 'edit.title',
                  mode: 'edit',
                  value: schedule.title,
                  showValueInName: true,
                  valueOptions: {
                    ...options.valueOptions,
                    type: 'string',
                  },
                },
                submenu: [],
              });
            } else {
              menuItem.submenu.push(
                {
                  name: getTranslation(translations, 'enabled'),
                  id: 'enabled',
                  extensionId: extensionId,
                  group: 'enabled',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    subItem: 'edit.enabled',
                    value: enabled,
                    mode: 'edit',
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'boolean',
                    },
                  },
                  submenu: [],
                },
                {
                  name: getTranslation(translations, 'priority'),
                  id: 'priority',
                  extensionId: extensionId,
                  icon: extensionInfo.icon,
                  group: 'priority',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    subItem: 'edit.prio',
                    value: schedule.data?.prio,
                    mode: 'edit',
                    showValueInName: true,
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'number',
                      states: priorityStates,
                    },
                  },
                  submenu: [],
                },
                {
                  name: getTranslation(translations, 'weekdays'),
                  id: 'weekdays',
                  extensionId: extensionId,
                  icon: extensionInfo.icon,
                  group: 'weekdays',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    subItem: 'edit.weekdays',
                    value: Schedules.scheduleWeekdaysDecode(schedule),
                    mode: 'edit',
                    showValueInName: true,
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'array',
                      subType: 'weekdays',
                    },
                  },
                },
                {
                  name: getTranslation(translations, 'interval'),
                  id: 'interval',
                  extensionId: extensionId,
                  icon: extensionInfo.icon,
                  group: 'intervals',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    subItem: 'edit.intervalDuration',
                    value: schedule.data?.intervalDuration,
                    mode: 'edit',
                    showValueInName: true,
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'number',
                      states: [...intervalDurations],
                      valueToDisplay: intervalDurations.has(schedule.data?.intervalDuration)
                        ? intervalDurations.get(schedule.data?.intervalDuration)
                        : schedule.data?.intervalDuration,
                    },
                  },
                  submenu: [],
                },
                {
                  name: getTranslation(translations, 'intervals'),
                  id: 'intervals',
                  extensionId: extensionId,
                  icon: iconInterval,
                  group: 'intervals',
                  options: {
                    ...options,
                    subItem: 'intervals',
                  },
                  submenu: messageToId,
                },
              );
              if (mode === 'browse') {
                if (schedules.scheduleIsCanBeDeleted(item)) {
                  menuItem.submenu.push({
                    name: getTranslation(translations, 'delete'),
                    id: 'delete',
                    extensionId: extensionId,
                    icon: icons.delete || '',
                    group: 'delete',
                    type: 'internalMenuItem',
                    command: 'deleteItem',
                    options: {
                      ...options,
                      mode: 'delete',
                      subMode: 'boolean',
                      valueOptions: {
                        ...options.valueOptions,
                        externalValueId: menuItem.index.split('.').slice(0, -1).join('.'),
                      },
                    },
                    submenu: [],
                  });
                }
              }
              if (
                Array.isArray(schedule.data?.members) === false ||
                schedule.data.members.includes(parentStateId) === false
              ) {
                menuItem.submenu.push({
                  name: `${getTranslation(translations, 'associate')} [${options.parentStateName}]`,
                  id: 'associate',
                  extensionId: extensionId,
                  icon: icons?.associate || '',
                  group: 'associate',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    mode: 'edit',
                    subItem: 'edit.associate',
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'string',
                      states: [
                        [parentStateId, getTranslation(translations, 'associate')],
                        ['', getTranslation(translations, 'cancel')],
                      ],
                    },
                  },
                  submenu: messageToId,
                });
              } else if (
                Array.isArray(schedule.data?.members) === true &&
                schedule.data.members.includes(parentStateId) === true
              ) {
                menuItem.submenu.push({
                  name: `${getTranslation(translations, 'dissociate')} [${options.parentStateName}]`,
                  id: 'dissociate',
                  extensionId: extensionId,
                  icon: icons?.dissociate || '',
                  group: 'dissociate',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    mode: 'edit',
                    subItem: 'edit.dissociate',
                    valueOptions: {
                      ...options.valueOptions,
                      type: 'string',
                      states: [
                        [parentStateId, getTranslation(translations, 'dissociate')],
                        ['', getTranslation(translations, 'cancel')],
                      ],
                    },
                  },
                  submenu: messageToId,
                });
              }
            }
            if (
              Schedules.isScheduleFilledFully(schedule) &&
              Schedules.isSchedulesAreEqual(schedule, scheduleOriginal, schedules) !== true
            ) {
              menuItem.submenu.push({
                name: getTranslation(translations, 'save'),
                id: 'save',
                extensionId: extensionId,
                icon: icons?.save || '',
                group: 'save',
                options: {
                  ...options,
                  mode: 'save',
                },
                submenu: messageToId,
              });
            }
          } else if (subItem === 'intervals') {
            const intervals = Schedules.scheduleIntervalsDecode(schedule);
            if (typeof subIndex !== 'number') {
              intervals.forEach((interval, intervalIndex) => {
                const valueText = schedules.scheduleValueToText(schedule, interval.value);
                menuItem.submenu.push({
                  name: `${interval.start}-${interval.end}: ${valueText}`,
                  id: `${intervalIndex}`,
                  extensionId: extensionId,
                  icon: iconInterval,
                  textValues: [
                    {
                      label: getTranslation(translations, 'value'),
                      value: interval.value,
                    },
                  ],
                  group: 'interval',
                  options: {
                    ...options,
                    showValueInName: true,
                    subIndex: intervalIndex,
                  },
                  submenu: messageToId,
                });
              });
            } else {
              const interval = intervals[subIndex],
                intervalsPrefix = `edit.intervals.${subIndex}`,
                valueType = stateTypeFromScheduleType[schedule.data?.type] || 'number',
                valueCurrent = valueType === 'boolean' ? interval.value === 1 : interval.value,
                timeStep = intervalDurations.get(schedule.data?.intervalDuration || 1);
              menuItem.submenu.push(
                {
                  name: getTranslation(translations, 'intervalStart'),
                  id: 'intervalStart',
                  extensionId: extensionId,
                  icon: iconInterval,
                  textValues: [
                    {
                      label: getTranslation(translations, 'value'),
                      value: interval.value,
                    },
                  ],
                  group: 'intervalTime',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    mode: 'edit',
                    subSubItem: `${intervalsPrefix}.start`,
                    value: interval.start === undefined ? '00:00' : interval.start,
                    showValueInName: true,
                    timeTemplate: 'hm',
                    timeStep: timeStep,
                    valueOptions: {
                      ...options.valueOptions,
                      externalValueParamsLevel: 'subSub',
                      externalStepBack: 1,
                      type: 'string',
                      subType: 'time',
                    },
                  },
                },
                {
                  name: getTranslation(translations, 'intervalEnd'),
                  id: 'intervalEnd',
                  extensionId: extensionId,
                  icon: iconInterval,
                  textValues: [
                    {
                      label: getTranslation(translations, 'value'),
                      value: interval.value,
                    },
                  ],
                  group: 'intervalTime',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    mode: 'edit',
                    subSubItem: `${intervalsPrefix}.end`,
                    value: interval.end === undefined ? '24:00' : interval.end,
                    showValueInName: true,
                    timeTemplate: 'hm',
                    timeStep: timeStep,
                    timeMax: '24:00',
                    valueOptions: {
                      ...options.valueOptions,
                      externalValueParamsLevel: 'subSub',
                      externalStepBack: 1,
                      type: 'string',
                      subType: 'time',
                    },
                  },
                },
                {
                  name: getTranslation(translations, 'intervalSetTo'),
                  id: 'intervalSetTo',
                  extensionId: extensionId,
                  icon: iconInterval,
                  textValues: [
                    {
                      label: getTranslation(translations, 'value'),
                      value: interval.value,
                    },
                  ],
                  group: 'intervalValue',
                  type: 'internalMenuItem',
                  command: 'editValue',
                  options: {
                    ...options,
                    mode: 'edit',
                    showValueInName: true,
                    icons: typeof valueCurrent === 'boolean' ? [intervalOn, intervalOff] : undefined,
                    value: ['boolean', 'number'].includes(typeof valueCurrent) ? valueCurrent : undefined,
                    subSubItem: `${intervalsPrefix}.value`,
                    valueOptions: {
                      ...options.valueOptions,
                      externalValueParamsLevel: 'subSub',
                      externalStepBack: 1,
                      type: valueType,
                      ...(options.parentStateParams || {}),
                    },
                  },
                },
              );
            }
          }
        }
      }
    }
    if (typeof saveSchedule === 'object' && typeof saveSchedule.id === 'string' && saveSchedule.id.length > 0) {
      schedules.save(saveSchedule, () => callback({...menuItem}));
    } else {
      callback({...menuItem});
    }
  });

  /**
   * Register the reaction to the request to process all related `properties` for `attributes` from the "main" script.
   **/
  onMessage(`${extensionId}#${idProperties}`, ({data, translations}, callback) => {
    if (typeof data === 'object') {
      const deviceId = data.deviceId,
        extensions = data.extensions;
      if (typeof deviceId === 'string' && deviceId.length > 0 && typeof extensions === 'object') {
        Object.keys(extensions).forEach((extensionItemId) => {
          const extensionData = extensions[extensionItemId];
          if (extensionItemId === extensionId && typeof extensionData.valueText !== 'object') {
            const textValuesPrefix = [
              {
                label: getTranslation(translations, `${idSchedules}`) + ':',
              },
            ];
            extensionData.valueText = {};
            if (Array.isArray(extensionData.attributes) && extensionData.attributes.length > 0) {
              extensionData.attributes.forEach((attributeId) => {
                if (attributeId === idSchedules) {
                  const schedules = new Schedules(),
                    schedulesAssociated = schedules.getByDeviceId(deviceId) || [];
                  schedulesAssociated.forEach((schedule) => {
                    if (schedules.scheduleIsEnabled(schedule) === true) {
                      schedule.data?.[`members`].forEach((member) => {
                        if (member.startsWith(deviceId)) {
                          if (Array.isArray(extensionData.valueText[member]) !== true) {
                            extensionData.valueText[member] = textValuesPrefix;
                          }
                          extensionData.valueText[member].push(
                            ...schedules.schedulesToTextValues([schedule], translations, '  '),
                          );
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        });
      }
    }
    if (typeof callback === 'function') callback(data);
  });

  extensionInit();
}

log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionScheduler();
