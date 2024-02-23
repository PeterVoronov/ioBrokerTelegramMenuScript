/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

// @ts-ignore
if(!Object.hasOwn(Function.prototype, 'toJSON')) {
  Object.defineProperty(Function.prototype, 'toJSON', { // NOSONAR
    // eslint-disable-next-line space-before-function-paren
    value: function () {
      return `function ${this.name}`;
    },
  });
}

function autoTelegramMenuExtensionPetFeeder() {
  const extensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    extensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    extensionsTimeout = 500,
    extensionId = 'petFeederTuya',
    extensionType = 'attributesModifier',
    extensionTranslationsKeys = [
      [extensionId],
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

  function extensionPetFeederInit(messageId, timeout) {
    messageTo(
      messageId === undefined ? extensionsRegister : messageId,
      {
        id: extensionId,
        type: extensionType,
        nameTranslationId: extensionId,
        icon: '🐈',
        options: {
          attributes: {
            'schedule': {
              asButton: true,
              asAttribute: true,
            },
            'manualFeed': {
              asButton: true,
              asAttribute: false,
            },
          }
        },
        scriptName: scriptName,
        translationsKeys: extensionTranslationsKeys,
      },
      {timeout: timeout === undefined ? extensionsTimeout : timeout},
      (result) => {
        if (!result.success) {
          console.warn(`Error to register ${extensionId} - ${result.error}`);
        }
      },
    );
  }

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

  function scheduleEncode(schedule) {
    const scheduleByteArray = [];
    schedule.forEach((scheduleItem) => {
      let days = 0;
      scheduleItem.weekdays.forEach((day, index) => {
        days |= day << (6 - index);
      });
      scheduleByteArray.push(
        days,
        ...scheduleItem.time.split(':').map((timeItem) => Number(timeItem)),
        scheduleItem.portion,
        scheduleItem.enabled ? 1 : 0,
      );
    });
    // @ts-ignore
    return Buffer.from(scheduleByteArray).toString('base64');
  }

  onMessage(extensionsInit, ({messageId, timeout}, callback) => {
    extensionPetFeederInit(messageId, timeout);
    callback({success: true});
  });

  onMessage(`${extensionId}#schedule`, ({user: _user, data, translations}, callback) => {
    const options = data.options || {},
      {
        device,
        state,
        stateValue,
        index,
        isButton,
        valueOptions,
        icons,
      } = options;
    if (typeof device === 'string' && typeof state === 'string' && typeof stateValue === 'string') {
      const valueInterim = valueOptions?.['externalValueInterim'],
        schedule = valueInterim !== undefined && isButton ? valueInterim : scheduleDecode(stateValue),
        iconOn = icons?.[0] || '✅',
        iconOff = icons?.[1] || '❌',
        scheduleText = schedule.map((item) => `${item.enabled ? iconOn : iconOff}${item.time}`).join(','),
        messageToId = `${extensionId}#schedule`;
      if (isButton) {
        const isChanged = valueInterim !== undefined && stateValue !== scheduleEncode(valueInterim),
          menuItem= {...data};
        menuItem.options = options;
        menuItem.submenu =  new Array();
        if (typeof index === 'number') {
          if (index < schedule.length) {
            const item = schedule[index],
              itemOptions = {
                ...options,
                index: index,
              };
            item.enabled = item.enabled && !(
              item.time === undefined ||
              item.time === '' ||
              item.weekdays === undefined ||
              item.weekdays.reduce((a, b) => a || b === 1, false) === false ||
              item.portion === undefined ||
              item.portion === 0
            );
            menuItem.submenu = [
              {
                name: translations['enabled'] || 'enabled',
                icon: item.enabled ? iconOn : iconOff,
                id: 'enabled',
                extensionId: extensionId,
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...itemOptions,
                  item: 'enabled',
                  value: item.enabled === undefined ? false : item.enabled,
                  valueOptions: {
                    ...itemOptions.valueOptions,
                    type: 'boolean',
                  },
                },
                submenu: [],
              },
              {
                name: `${translations['time'] || 'time'}`,
                id: 'time',
                extensionId: extensionId,
                icon: '',
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...itemOptions,
                  item: 'time',
                  value: item.time === undefined ? '00:00' : item.time,
                  valueOptions: {
                    ...itemOptions.valueOptions,
                    showValue: true,
                    type: 'string',
                    subType: 'time',
                    timeTemplate: 'hm',
                  },
                },
                submenu: [],
              },
              {
                name: `${translations['weekdays'] || 'weekdays'}`,
                id: 'weekdays',
                extensionId: extensionId,
                icon: '',
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...itemOptions,
                  item: 'weekdays',
                  value: item.weekdays === undefined ? [0, 0, 0, 0, 0, 0, 0] : item.weekdays,
                  valueOptions: {
                    ...itemOptions.valueOptions,
                    showValue: true,
                    type: 'array',
                    subType: 'weekdays',
                  },
                },
                submenu: [],
              },
              {
                name: `${translations['portion'] || 'portion'}`,
                id: 'portion',
                extensionId: extensionId,
                icon: '',
                type: 'internalMenuItem',
                command: 'editValue',
                options: {
                  ...itemOptions,
                  item: 'portion',
                  value: item.portion === undefined ? 1 : item.portion,
                  valueOptions: {
                    ...itemOptions.valueOptions,
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
                name: translations['delete'] || 'delete',
                id: 'delete',
                extensionId: extensionId,
                icon: icons.delete,
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
        } else {
          const itemOptions = {
            ...options,
            valueOptions: {
              ...options.valueOptions,
              externalValueType: 'array#object',
              externalValueId: menuItem.index,
              externalObjectTemplate: scheduleTemplate,
            },
          };
          menuItem.options = {
            ...options,
            valueOptions: {
              ...options.valueOptions,
              externalValue: schedule,
              externalValueType: 'array#object',
              externalValueId: menuItem.index,
            },
          };
          menuItem.id = 'schedule';
          schedule.forEach((item, index) => {
            item.enabled = !(
              item.time === undefined ||
              item.time === '' ||
              item.weekdays === undefined ||
              item.weekdays.reduce((a, b) => a || b === 1, false) === false ||
              item.portion === undefined ||
              item.portion === 0
            );
            menuItem.submenu.push({
              name: `${item.time}`,
              id: `${index}`,
              extensionId: extensionId,
              group: 'schedule',
              icon: item.enabled ? iconOn : iconOff,
              options: {
                ...itemOptions,
                index: index,
              },
              submenu: messageToId,
            });
          });
          menuItem.submenu.push({
            name: translations['add'] || 'add',
            id: 'add',
            extensionId: extensionId,
            icon: icons.add,
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
                ...itemOptions.valueOptions,
                type: 'string',
                subType: 'time',
                timeTemplate: 'hm',
              },
            },
            submenu: [],
          });
          if (isChanged) {
            menuItem.submenu.push({
              name: translations['save'] || 'save'  ,
              id: `schedule#save`,
              extensionId: extensionId,
              icon: icons.save,
              group: 'save',
              type: 'internalMenuItem',
              command: 'setStateValue',
              options: {
                ...options,
                mode: 'save',
                value: scheduleEncode([...valueInterim].sort((a, b) => a.time.localeCompare(b.time))),
              },
              submenu: [],
            });
          }
        }
        callback({...menuItem});
      } else {
        callback({...data, valueText: scheduleText});
      }
    }
  });

  onMessage(`${extensionId}#manualFeed`, ({user: _user, data, translations}, callback) => {
    const options = data.options || {},
    {
      device,
      state,
      stateValue,
      isButton,
      valueOptions,
    } = options;
    if (typeof device === 'string' && typeof state === 'string' && typeof stateValue === 'number') {
      if (isButton) {
        const menuItem = {...data};
        menuItem['id'] = 'manualFeed';
        menuItem['submenu'] = [
          {
            name: translations['manualFeedCurrent'] || 'manualFeedCurrent',
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
            name: translations['manualFeedCustom'] || 'manualFeedCustom',
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
      } else {
        callback(data);
      }
    }
  });

  extensionPetFeederInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionPetFeeder();
