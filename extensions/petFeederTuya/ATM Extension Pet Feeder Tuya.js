/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

function autoTelegramMenuExtensionPetFeeder() {
  const autoTelegramMenuExtensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    autoTelegramMenuExtensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    autoTelegramMenuExtensionsTimeout = 500,
    autoTelegramMenuExtensionId = 'petFeederTuya',
    autoTelegramMenuExtensionType = 'extraAttributesAndButtons',
    autoTelegramMenuExtensionTranslationsKeys = [
      [autoTelegramMenuExtensionId],
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
    ];

  const _autoTelegramMenuExtensionsGetCachedState = autoTelegramMenuExtensionsGetCachedStateCommand
      ? `${autoTelegramMenuExtensionsGetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsGetCachedState',
    _autoTelegramMenuExtensionsSetCachedState = autoTelegramMenuExtensionsSetCachedStateCommand
      ? `${autoTelegramMenuExtensionsSetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsSetCachedState';

  function extensionPetFeederInit(messageId, timeout) {
    messageTo(
      messageId === undefined ? autoTelegramMenuExtensionsRegister : messageId,
      {
        id: autoTelegramMenuExtensionId,
        type: autoTelegramMenuExtensionType,
        nameTranslationId: autoTelegramMenuExtensionId,
        icon: '🐈',
        options: {
          buttons: [
            {
              id: 'schedule',
            },
            {
              id: 'manualFeed',
            },
          ],
          attributes: [],
        },
        scriptName: scriptName,
        translationsKeys: autoTelegramMenuExtensionTranslationsKeys,
      },
      {timeout: timeout === undefined ? autoTelegramMenuExtensionsTimeout : timeout},
      (result) => {
        if (!result.success) {
          console.warn(`Error to register ${autoTelegramMenuExtensionId} - ${result.error}`);
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

  onMessage(autoTelegramMenuExtensionsInit, ({messageId, timeout}, callback) => {
    extensionPetFeederInit(messageId, timeout);
    callback({success: true});
  });

  onMessage('schedule', ({user: _user, data, extensionId: _extensionId, translations}, callback) => {
    const {
      device,
      state,
      value,
      function: functionId,
      destination: destinationId,
      isButton,
      interimValue,
      icons,
    } = data;
    if (typeof device === 'string' && typeof state === 'string' && typeof value === 'string') {
      const schedule = interimValue !== undefined && isButton ? interimValue : scheduleDecode(value),
        scheduleText = schedule.map((item) => `${item.enabled ? icons.on : icons.off}${item.time}`).join(',');
      if (isButton) {
        const isChanged = interimValue !== undefined && value !== scheduleEncode(interimValue),
          options = {
            device: device,
            state: state,
            function: functionId,
            destination: destinationId,
            id: 'schedule',
            mode: 'edit',
          },
          menuItem = {
            icon: '',
            submenu: new Array(),
            options: {
              ...options,
              valueOptions: {
                showValue: true,
                valueText: scheduleText,
              },
            },
          };
        schedule.forEach((item, index) => {
          const itemOptions = {
            ...options,
            index: index,
          };
          item.enabled = !(
            item.time === undefined ||
            item.time === '' ||
            item.weekdays === undefined ||
            item.weekdays.reduce((a, b) => a || b === 1, false) === false ||
            item.portion === undefined ||
            item.portion === 0
          );
          const scheduleMenuItem = {
            name: `${item.time}`,
            icon: item.enabled ? icons.on : icons.off,
            submenu: new Array(),
          };
          scheduleMenuItem.submenu.push({
            name: translations['enabled'],
            icon: item.enabled ? icons.on : icons.off,
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'enabled',
              value: item.enabled === undefined ? false : item.enabled,
              valueOptions: {
                type: 'boolean',
              },
            },
            submenu: [],
          });
          scheduleMenuItem.submenu.push({
            name: translations['time'],
            icon: '',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'time',
              value: item.time === undefined ? '00:00' : item.time,
              valueOptions: {
                showValue: true,
                type: 'time',
                format: 'hm',
              },
            },
            submenu: [],
          });
          scheduleMenuItem.submenu.push({
            name: translations['weekdays'],
            icon: '',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'weekdays',
              value: item.weekdays === undefined ? [0, 0, 0, 0, 0, 0, 0] : item.weekdays,
              valueOptions: {
                showValue: true,
                type: 'weekdays',
              },
            },
            submenu: [],
          });
          scheduleMenuItem.submenu.push({
            name: translations['portion'],
            icon: '',
            command: 'editValue',
            options: {
              ...itemOptions,
              item: 'portion',
              value: item.portion === undefined ? 1 : item.portion,
              valueOptions: {
                type: 'number',
                min: 1,
                max: 10,
                step: 1,
                showValue: true,
              },
            },
            submenu: [],
          });
          scheduleMenuItem.submenu.push({
            name: translations['delete'],
            icon: icons.delete,
            command: 'deleteItem',
            options: {
              ...itemOptions,
              mode: 'delete',
            },
            submenu: [],
          });
          menuItem.submenu.push(scheduleMenuItem);
        });
        menuItem.submenu.push({
          name: translations['add'],
          icon: icons.add,
          command: 'editItem',
          options: {
            ...options,
            index: schedule.length,
            item: 'time',
            mode: 'add',
            valueOptions: {
              type: 'time',
              format: 'hm',
            },
          },
          submenu: [],
        });
        if (isChanged) {
          menuItem.submenu.push({
            name: translations['save'],
            icon: icons.save,
            command: 'setStateValue',
            options: {
              ...options,
              mode: 'save',
              value: scheduleEncode([...interimValue].sort((a, b) => a.time.localeCompare(b.time))),
            },
            submenu: [],
          });
        }
        callback({...data, menuItem: menuItem, valueText: scheduleText, interimValue: schedule});
      } else {
        callback({...data, valueText: scheduleText});
      }
    }
  });

  onMessage('manualFeed', ({user: _user, data, extensionId: _extensionId, translations}, callback) => {
    const {device, state, function: functionId, destination: destinationId, value} = data;
    if (typeof device === 'string' && typeof state === 'string' && typeof value === 'number') {
      const options = {
          device: device,
          state: state,
          function: functionId,
          destination: destinationId,
          value: value,
          id: 'manualFeed',
        },
        menuItem = {
          icon: '',
          options: {
            ...options,
            valueOptions: {
              showValue: true,
            },
          },
          submenu: [
            {
              name: translations['manualFeedCurrent'],
              type: 'internalCommand',
              command: 'setStateValue',
              options: {
                ...options,
                valueOptions: {
                  showValue: true,
                },
              },
            },
            {
              name: translations['manualFeedCustom'],
              type: 'internalMenuItem',
              command: 'editStateValue',
              options: {
                ...options,
                valueOptions: {
                  showValue: true,
                },
              },
            },
          ],
        };
      callback({...data, menuItem: menuItem});
    }
  });

  extensionPetFeederInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionPetFeeder();
