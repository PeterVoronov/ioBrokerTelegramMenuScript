/**
 * Script Name: ATM Extension ZigBee
 * Version: 1.0
 * Created Date: 2023-02-29
 * Last Updated: 2024-03-28
 * Author: Peter Voronov
 * Type: Extension for Auto Telegram Menu script.
 * Extension type: function
 * Description: This script is an extension for Auto Telegram Menu script. It allows to manage ioBroker ZigBee adapter.
 * Prerequisites:
 *  - Auto Telegram Menu script should be installed.
 *  - ioBroker ZigBee adapter should be installed and configured.
 * If all this is done and extensions is enabled and configured under appropriate menu of "main" script, then you can
 * use this extension to initiate pairing for any working instance of the ioBroker ZigBee adapter.
 */

/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

/**
 * This function is used to hide equal names of sub functions from other scripts.
 */
function autoTelegramMenuExtensionZigBee() {
  const extensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    extensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    extensionsTimeout = 500,
    extensionId = 'zigbee',
    extensionRepository = {
      url: 'https://github.com/PeterVoronov/ioBrokerTelegramMenuScript',
      branch: 'v0.9.5-dev',
      baseFolder: `/extensions/${extensionId}`,
      scriptName: 'ATMExtensionZigBee.js',
      localesFolder: `/extensions/${extensionId}/locales`,
    },
    extensionInfo = {
      id: extensionId,
      nameTranslationId: 'ZigBee',
      icon: '⚡',
      type: 'function',
      options: {
        state: 'zigbeeManageMenu',
        repository: extensionRepository,
      },
      scriptName: scriptName,
      translationsKeys: [
        [extensionId],
        'ZigBee',
        'PairDevices',
        'PairingCantBeStarted',
        'PairingStarted',
        'PairingFinished',
        'PairingIsAlreadyStarted',
        'WrongCommandOptions',
        'DeviceIsNotConnected',
      ],
    },
    _stateSuffixPairingMode = '.info.pairingMode',
    adapterPrefix = 'zigbee',
    adapterCommandPairingStart = 'letsPairing',
    adapterResponsePairingStarted = 'Start pairing!',
    stateSuffixInfoConnection = '.info.connection',
    stateSuffixPairingMessage = '.info.pairingMessage',
    stateSuffixPairingCountdown = '.info.pairingCountdown',
    zigbeePairingLogMessageRegExp = new RegExp(/^[^:]+:\s+\d+$/);

  /**
   * This function is used to send message to appropriate user via Auto Telegram Menu script.
   * @param {string} user - The user object.
   * @param {string} extensionId - The extension id.
   * @param {string} message - The message to send.
   **/
  function sendAlertToTelegram(user, extensionId, message) {
    messageTo(
      autoTelegramMenuExtensionsSendAlertToTelegram,
      {user: user, id: extensionId, alertMessage: message},
      {timeout: extensionsTimeout},
      (result, ..._other) => {
        if (result?.success !== true) {
          console.warn(`Message not sent. Result = ${JSON.stringify(result)}, other = ${JSON.stringify(_other)}`);
        }
      },
    );
  }

  /**
   * This function is used to send to "main" Auto Telegram Menu script all information about the extension.
   * @param {string=} messageId - message id to which the result will be sent
   * @param {number=} timeout - timeout for the message.
   **/
  function extensionInit(messageId, timeout) {
    messageTo(
      messageId === undefined ? extensionsRegister : messageId,
      extensionInfo,
      {timeout: timeout === undefined ? extensionsTimeout : timeout},
      (result) => {
        if (!result.success) {
          console.warn(`Error to register ${extensionId} - ${result.error}`);
        }
      },
    );
  }

  /**
   * Register the reaction on the extension init message from "main" script.
   **/
  onMessage(extensionsInit, ({messageId, timeout}, callback) => {
    extensionInit(messageId, timeout);
    callback({success: true});
  });

  /**
   * Register the reaction on the menu draw request message from "main" script.
   **/
  onMessage('zigbeeManageMenu', ({user: _user, data, translations}, callback) => {
    if (typeof data === 'object' && data.hasOwnProperty('submenu')) {
      const options = data.options || {};
      let index = options.index;
      data.submenu = [];
      if (typeof index !== 'number') {
        index = 0;
        while (
          existsState(`${adapterPrefix}.${index}${stateSuffixInfoConnection}`) === true &&
          getState(`${adapterPrefix}.${index}${stateSuffixInfoConnection}`).val === true
        ) {
          data.submenu.push({
            name: `${translations.ZigBee}.${index}`,
            icon: extensionInfo.icon,
            id: `${index}`,
            extensionId: extensionId,
            options: {
              ...options,
              index: index,
            },
            submenu: `${extensionId}ManageMenu`,
          });
          index++;
        }
      } else {
        data.submenu = [
          {
            name: translations.PairDevices,
            icon: '🤝',
            extensionId: extensionId,
            extensionCommandId: 'zigbeeManageLetsPair',
            options: options,
            submenu: [],
          },
        ];
      }
    } else {
      if (typeof data !== 'object') data = {};
      data.submenu = [];
    }
    callback(data);
  });

  /**
   * Register the reaction on the extension command to start pairing on appropriate ZigBee adapter.
   **/
  onMessage(`zigbeeManageLetsPair`, ({user, data, translations}, callback) => {
    if (typeof data === 'object' && data?.extensionId === extensionId) {
      const index = data.index,
        adapterId = `${adapterPrefix}.${index}`,
        statePairingCountdown = `${adapterId}${stateSuffixPairingCountdown}`,
        statePairingMessage = `${adapterId}${stateSuffixPairingMessage}`,
        stateInfoConnection = `${adapterId}${stateSuffixInfoConnection}`;
      if (
        typeof index === 'number' &&
        existsState(stateInfoConnection) === true &&
        getState(stateInfoConnection).val === true
      ) {
        if (getState(statePairingCountdown).val === 0) {
          sendTo(adapterId, adapterCommandPairingStart, {}, (result, ..._other) => {
            if (result === adapterResponsePairingStarted) {
              unsubscribe(statePairingMessage);
              unsubscribe(statePairingCountdown);
              on({id: statePairingCountdown, change: 'ne'}, (object) => {
                if (object.state.val === 0 && object.oldState.val > 0) {
                  sendAlertToTelegram(user, extensionId, `${translations.PairingFinished}`);
                  console.log(`Pairing finished!`);
                  unsubscribe(statePairingMessage);
                  unsubscribe(statePairingCountdown);
                } else if (object.state.val > 0 && object.oldState.val === 0) {
                  sendAlertToTelegram(user, extensionId, `${translations.PairingStarted}`);
                  console.log(`Pairing started!`);
                }
              });
              on({id: statePairingMessage, change: 'ne'}, (object) => {
                const logMessage = object.state.val;
                if (logMessage && logMessage !== undefined) {
                  if (!zigbeePairingLogMessageRegExp.test(logMessage)) {
                    sendAlertToTelegram(user, extensionId, logMessage);
                  }
                }
              });
              callback({success: true, data: data, error: ''});
            } else {
              console.warn(`Error to start pairing - ${JSON.stringify(result)}, ${JSON.stringify(_other)}!`);
              callback({success: false, data: data, error: translations.PairingCantBeStarted});
            }
          });
        } else {
          console.warn('Pairing is already started!');
          callback({success: false, data: data, error: translations.PairingIsAlreadyStarted});
        }
      } else {
        console.warn('Device is not connected!');
        callback({success: false, data: data, error: translations.DeviceIsNotConnected});
      }
    } else {
      console.warn('Wrong command options!');
      callback({success: false, data: data, error: translations.WrongCommandOptions});
    }
  });
  extensionInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionZigBee();
