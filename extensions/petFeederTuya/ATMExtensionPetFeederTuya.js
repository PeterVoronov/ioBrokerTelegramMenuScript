/**
 * Script Name: ATM Extension Pet Feeder Tuya
 * Version: 1.0
 * Created Date: 2024-02-19
 * Last Updated: 2024-03-01
 * Author: Peter Voronov
 * Type: Extension for Auto Telegram Menu script.
 * Extension type: `attributes`.
 * `Buttons`:
 *  - `schedule` - to control the Pet Feeder schedule.
 *  - `manualFeed` - to control the manual feeding.
 * `Attributes`:
 *  - `schedule` - to show the Pet Feeder schedule.
 * Description:  To provide additional `buttons` and `attributes` to the Auto Telegram Menu script to control
 * the Tuya Pet Feeders.
 * Prerequisites:
 *  - The Auto Telegram Menu script should be installed.
 *  - The Tuya ioBroker adapter should be installed and configured.
 *  - The Tuya Pet Feeder should be added to the Tuya adapter.
 *  - The Tuya Pet Feeder should be configured to work with the Tuya adapter.
 *  - The Tuya Pet Feeder should be added to the Auto Telegram Menu script.
 *     I.e. the appropriate enums should be created and assigned to objects related to the Pet Feeder in the ioBroker.
 *     Additionally the appropriate `function` and `destination` enums should be enabled in the Auto Telegram Menu
 *     script, and properly configured.
 * If all this is done, it will enable possibility to assign this `extension` to the appropriate `function` in the Auto
 * Telegram Menu script.
 * And enable the two `buttons` and one `attribute` in the menu to control the Pet Feeder schedule and manual feeding.
 */

/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

/**
 * This function is used to hide equal names of sub functions from other scripts.
 */
function autoTelegramMenuExtensionPetFeeder() {
  const extensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    extensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    extensionsTimeout = 500,
    extensionId = 'petFeederTuya',
    extensionRepository = {
      url: 'https://github.com/PeterVoronov/ioBrokerTelegramMenuScript',
      branch: 'v0.9.5-dev',
      baseFolder: `/extensions/${extensionId}`,
      scriptName: 'ATMExtensionPetFeederTuya.js',
      localesFolder: `/extensions/${extensionId}/locales`,
    },
    extensionAttributes = {
      'schedule': {
        asButton: true,
        asAttribute: true,
      },
      'manualFeed': {
        asButton: true,
        asAttribute: false,
      },
    },
    extensionInfo ={
      id: extensionId,
      type: 'attributes',
      icon: '🐈',
      options: {
        attributes: extensionAttributes,
        repository: extensionRepository,
      },
      scriptName: scriptName,
      translationsKeys: [
        `${extensionId}`,
        'schedule',
        'enabled',
        'time',
        'weekdays',
        'portion',
        'delete',
        'add',
        'save',
        'manualFeed',
        'manualFeedCurrent',
        'manualFeedCustom',
      ],
    },
    scheduleTemplate = {
      enabled: false,
      time: '00:00',
      weekdays: [0, 0, 0, 0, 0, 0, 0],
      portion: 1,
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
    messageTo(
      messageId,
      extensionInfo,
      {timeout: timeout},
      (result) => {
        if (!result.success) {
          console.warn(`Error to register ${extensionId} - ${result.error}`);
        }
      },
    );
  }

  /**
   * This function is used to decode the schedule Tuya "coded" string to the array of objects.
   * @param {string} value - The schedule string.
   * @returns {object[]} The array of schedule items.
   */
  function scheduleDecode(value) {
    const itemLength = 5,
      schedule = [],
      scheduleSwitchCodes = [String.fromCharCode(0x00), String.fromCharCode(0x01)],
      isScheduleDecoded = (value) => scheduleSwitchCodes.reduce((a, b) => a || value.includes(b), false);
    let scheduleString = value,
      scheduleStringLength = scheduleString.length;
    if (!isScheduleDecoded(scheduleString) || scheduleStringLength % itemLength !== 0) {
      // @ts-ignore
      scheduleString = Buffer.from(scheduleString, 'base64').toString('ascii');
      scheduleStringLength = scheduleString.length;
    }
    if (scheduleStringLength === 0 || (isScheduleDecoded(scheduleString) && scheduleStringLength % itemLength === 0)) {
      const scheduleByteArray = scheduleString.split('').map((char) => char.charCodeAt(0));
      if (scheduleByteArray.length % itemLength === 0) {
        while (scheduleByteArray.length > 0) {
          const scheduleItem = scheduleByteArray.splice(0, itemLength),
            days = scheduleItem[0],
            daysOfWeek = [];
          for (let bit = 7; bit > -1; --bit) {
            if (bit < 7) daysOfWeek.push(0x01 & (days >> bit));
          }
          schedule.push({
            enabled: scheduleItem[4] === 1,
            time:
              `${scheduleItem[1] > 9 ? '' : '0'}${scheduleItem[1]}:` +
              `${scheduleItem[2] > 9 ? '' : '0'}${scheduleItem[2]}`,
            weekdays: daysOfWeek,
            portion: scheduleItem[3],
          });
        }
      }
    }
    return schedule;
  }

  /**
   * This function is used to encode the array of schedule items to the Tuya "coded" string.
   * @param {object[]} schedule - The array of schedule items.
   * @returns {string} The schedule string.
   */
  function scheduleEncode(schedule) {
    const scheduleByteArray = [];
    schedule.forEach((scheduleItem) => {
      let days = 0;
      scheduleItem['weekdays'].forEach((day, index) => {
        days |= day << (6 - index);
      });
      scheduleByteArray.push(
        days,
        ...scheduleItem['time'].split(':').map((timeItem) => Number(timeItem)),
        scheduleItem['portion'],
        scheduleItem['enabled'] ? 1 : 0,
      );
    });
    // @ts-ignore
    return Buffer.from(scheduleByteArray).toString('base64');
  }

  /**
   * This function is used to convert the schedule array to the array of "text" values which can be converted
   * by "main" script to the menu text.
   * @param {object[]} schedule - The array of schedule items.
   * @param {object} translations - The translations object.
   * @param {string} prefix - The prefix for the text values.
   * @returns {object[]} The array of "text" values.
   */
  function scheduleToTextValues(schedule, translations, prefix = '') {
    const result = [];
    schedule.forEach((item) => {
      result.push(
        {
          label: `${prefix}${item['time']}`,
          value: item['enabled'],
        },
        {
          label: ` ${prefix}${translations['weekdays']}`,
          value: item['weekdays'],
          convert: `weekdays`,
        },
        {
          label: ` ${prefix}${translations['portion']}`,
          value: item['portion'],
        },
      );
    });
    return result;
  }

  /**
   * This function is used to identify is schedule item has enough data to be enabled.
   * @param {object} item - The schedule item.
   * @returns {boolean} The result.
   **/
  function isItemCanBeEnabled(item) {
    return !(
      item['time'] === undefined ||
      item['time'] === '' ||
      item['weekdays'] === undefined ||
      item['weekdays'].reduce((a, b) => a || b === 1, false) === false ||
      item['portion'] === undefined ||
      item['portion'] === 0
    );
  }

  /** This function is used to compare is two schedules are equal.
   * @param {object[]} schedule1 - The first schedule.
   * @param {object[]} schedule2 - The second schedule.
   * @returns {boolean} The result.
   **/
  function isSchedulesAreEqual(schedule1, schedule2) {
    if (schedule1.length !== schedule2.length) return false;
    return schedule1.every((item1) => {
      const item2 = schedule2.find((item) => item['time'] === item1['time']);
      if (item2 === undefined) return false;
      return item1['portion'] === item2['portion'] &&
        item1['enabled'] === item2['enabled'] &&
        item1['weekdays'].every((day1, dayIndex) => day1 === item2['weekdays'][dayIndex]);
    });
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
  onMessage(`${extensionId}#schedule`, ({data, translations}, callback) => {
    const options = data['options'] || {},
      {
        device,
        state,
        stateValue,
        index,
        valueOptions,
        icons,
      } = options;
    if (typeof device === 'string' && typeof state === 'string' && typeof stateValue === 'string') {
      const valueInterim = valueOptions?.['externalValueInterim'],
        scheduleOriginal = scheduleDecode(stateValue),
        schedule = valueInterim !== undefined ? valueInterim : scheduleOriginal,
        iconOn = icons?.[0] || '✅',
        iconOff = icons?.[1] || '❌',
        messageToId = `${extensionId}#schedule`;
      const isChanged = valueInterim !== undefined && !isSchedulesAreEqual(scheduleOriginal, schedule),
        menuItem= {...data};
      menuItem['options'] = options;
      menuItem['submenu'] =  new Array();
      if (typeof index !== 'number') {
        const itemOptions = {
          ...options,
          valueOptions: {
            ...options['valueOptions'],
            externalValueType: 'array#object',
            externalValueId: menuItem['index'],
            externalObjectTemplate: scheduleTemplate,
          },
        };
        menuItem['options'] = {
          ...options,
          valueOptions: {
            ...options['valueOptions'],
            externalValue: schedule,
            externalValueType: 'array#object',
            externalValueId: menuItem['index'],
          },
        };
        menuItem['id'] = 'schedule';
        menuItem['textValues'] = [];
        schedule.forEach((item, index) => {
          item['enabled'] = item['enabled'] && isItemCanBeEnabled(item);
          const textValues = scheduleToTextValues([item], translations);
          menuItem['textValues'].push(...textValues);
          menuItem.submenu.push({
            name: `${item['time']}`,
            id: `${index}`,
            extensionId: extensionId,
            group: 'schedule',
            icon: item['enabled'] ? iconOn : iconOff,
            textValues: textValues,
            options: {
              ...itemOptions,
              index: index,
            },
            submenu: messageToId,
          });
        });
        menuItem.submenu.push({
          name: translations['add'],
          id: 'add',
          extensionId: extensionId,
          icon: icons['add'],
          group: 'add',
          type: 'internalMenuItem',
          command: 'editValue',
          options: {
            ...itemOptions,
            mode: 'add',
            index: schedule.length,
            item: 'time',
            value: undefined,
            valueOptions: {
              ...itemOptions['valueOptions'],
              type: 'string',
              subType: 'time',
              timeTemplate: 'hm',
            },
          },
          submenu: [],
        });
        if (isChanged) {
          menuItem.submenu.push({
            name: translations['save'],
            id: `schedule#save`,
            extensionId: extensionId,
            icon: icons['save'],
            group: 'save',
            type: 'internalMenuItem',
            command: 'setStateValue',
            options: {
              ...options,
              mode: 'save',
              value: scheduleEncode([...valueInterim].sort((a, b) => a['time'].localeCompare(b['time']))),
              valueText: [...valueInterim]
                .sort((a, b) => a['time'].localeCompare(b['time']))
                .map((item) => `${item['time']}(${item['portion']})${item['enabled'] ? iconOn : iconOff}`)
                .join(','),
            },
            submenu: [],
          });
        }
      } else if (index < schedule.length) {
        const item = schedule[index],
          itemOptions = {
            ...options,
            index: index,
          };
        item['enabled'] = item['enabled'] && isItemCanBeEnabled(item);
        menuItem['submenu'] = [
          {
            name: translations['enabled'],
            icon: item['enabled'] ? iconOn : iconOff,
            id: 'enabled',
            extensionId: extensionId,
            type: 'internalMenuItem',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'enabled',
              value: item['enabled'] === undefined ? false : item['enabled'],
              valueOptions: {
                ...itemOptions['valueOptions'],
                type: 'boolean',
              },
            },
            submenu: [],
          },
          {
            name: translations['time'],
            id: 'time',
            extensionId: extensionId,
            icon: '',
            type: 'internalMenuItem',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'time',
              value: item['time'] === undefined ? '00:00' : item['time'],
              valueOptions: {
                ...itemOptions['valueOptions'],
                showValue: true,
                type: 'string',
                subType: 'time',
                timeTemplate: 'hm',
              },
            },
            submenu: [],
          },
          {
            name: translations['weekdays'],
            id: 'weekdays',
            extensionId: extensionId,
            icon: '',
            type: 'internalMenuItem',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'weekdays',
              value: item['weekdays'] === undefined ? [0, 0, 0, 0, 0, 0, 0] : item['weekdays'],
              valueOptions: {
                ...itemOptions['valueOptions'],
                showValue: true,
                type: 'array',
                subType: 'weekdays',
              },
            },
            submenu: [],
          },
          {
            name: translations['portion'],
            id: 'portion',
            extensionId: extensionId,
            icon: '',
            type: 'internalMenuItem',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'portion',
              value: item['portion'] === undefined ? 1 : item['portion'],
              valueOptions: {
                ...itemOptions['valueOptions'],
                type: 'number',
                min: 1,
                max: 40,
                step: 1,
                showValue: true,
              },
            },
            submenu: [],
          },
          {
            name: translations['delete'],
            id: 'delete',
            extensionId: extensionId,
            icon: icons['delete'],
            group: 'delete',
            type: 'internalMenuItem',
            command: 'deleteItem',
            options: {
              ...itemOptions,
              mode: 'delete',
            },
            submenu: [],
          }
        ];
      }
      callback({...menuItem});
    }
  });

  /**
   * Register the reaction on the request to process the "manualFeed" `button` item/sub-items from "main" script.
   **/
  onMessage(`${extensionId}#manualFeed`, ({user: _user, data, translations}, callback) => {
    const options = data['options'] || {},
    {
      device,
      state,
      stateValue,
      valueOptions,
    } = options;
    if (typeof device === 'string' && typeof state === 'string' && typeof stateValue === 'number') {
      const menuItem = {...data};
      menuItem['id'] = 'manualFeed';
      menuItem['submenu'] = [
        {
          name: translations['manualFeedCurrent'],
          type: 'internalMenuItem',
          command: 'setStateValue',
          extensionId: extensionId,
          id: 'current',
          options: {
            ...options,
            valueOptions: {
              ...valueOptions,
              showValue: true,
            },
          },
          submenu: [],
        },
        {
          name: translations['manualFeedCustom'],
          type: 'internalMenuItem',
          command: 'editStateValue',
          extensionId: extensionId,
          id: 'custom',
          options: {
            ...options,
            valueOptions: {
              ...valueOptions,
              type: 'number',
              min: 1,
              max: 40,
              step: 1,
              showValue: true,
            },
          },
          submenu: [],
        },
      ];
      callback({...menuItem});
    }
  });


  /**
   * Register the reaction to the request to process all related `attributes` from the "main" script.
   **/
  onMessage(`${extensionId}#attributes`, ({data, translations}, callback) => {
    if (typeof data === 'object' ) {
      Object.keys(data).forEach((itemId) => {
        const attribute = data[itemId],
          itemExtensionId = attribute['extensionId'],
          attributeId = attribute['extensionAttributeId']
          ;
        if (itemExtensionId === extensionId) {
          attribute['valueText'] = [];
          if (extensionAttributes?.[attributeId]?.['asAttribute'] === true) {
            switch (attributeId) {
              case 'schedule': {
                if (typeof attribute?.['value'] === 'string' && attribute?.['value'] !== 'undefined') {
                  const schedule = scheduleDecode(attribute?.['value']);
                  attribute['valueText'].push(
                    {
                      label: translations['schedule'] + ':',
                      value: '',
                    }
                  );
                  attribute['valueText'].push(...scheduleToTextValues(schedule, translations, '  '));
                }
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
    callback(data);
  });

  extensionInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionPetFeeder();
