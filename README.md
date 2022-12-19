# AutoTelegramMenuScript(i.e. ATM script) for [ioBroker](https://www.iobroker.net/)

Auto generated telegram bot with inline menu for the [ioBroker](https://www.iobroker.net/).

## Table of Contents
  - [The main idea](#the-main-idea)
  - [Features](#features)
  - [Distributive](#distributive)
  - [Initial configuration](#initial-configuration)
  - [Credits](#credits)

## The main idea
The main idea of this script - to generate a menu of bot automatically. This generation is made based on the object structure in  [ioBroker](https://www.iobroker.net/). Assigning the objects to appropriate [enums](https://www.iobroker.net/#en/documentation/admin/enums.md) give possibility to generate upper and second level of the menu. There are two "types" of enums are processed by the script for such generation: `Functions` and `Destination`. Basically `Functions` is equal to the default `Functions` enums in `ioBroker`. The `Destinations` is equal to `Rooms`.

## Features
In common, each menu item under appropriate `Function` and `Destination` is equal to one ioBroker device(or folder) with a bunch of attributes(inherited state objects). Read-only attributes are shown as a menu item description. Writable attributes are shown as a buttons.

In addition to the showing the current values, for each numeric attribute with enabled history you can get an image with a graph of its historical changes, in case if the ioBroker [eCharts](https://github.com/ioBroker/ioBroker.echarts) adapter is installed and basically configured.

And any boolean, numeric and string value, which can be converted to the numeric one, can be put on the its change monitoring. This feature has name `Alerts`. In case of alert enablement on the appropriate state, on its change the alert will be generated, in case if the menu is active for the appropriate user.

And yes - this script support multi-users mode, i.e. each user can have own alerts, configuration parameters. And much more - you can manage access of the users to the menu items, assign to them appropriate roles. Each role can have a bunch of masks with access levels, to separate access to the `Functions` and `Destinations` for the exact role.

And finally, it's supports the `Extensions`: a separate scripts, which can be used for the generation a single top level menu item, with the appropriate submenu. There is one example of such extension - Weather Forecast, based on [AccuWeather adapter](https://github.com/iobroker-community-adapters/ioBroker.accuweather).

## "Distributive"
If you not plan to use the `Extensions`, you can use only one file - [AutoTelegramMenuMainScript.js](/AutoTelegramMenuMainScript.js). Otherwise I will recommend to install additional one - [autoTelegramMenuDefaults.js](/global/autoTelegramMenuDefaults.js), and put it to the [global](https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#global-functions) folder of the scripts tree in ioBroker. And, for sure, it have to be installed and run before the main ATM script.
## Initial configuration
Before starting the main script (or the Defaults one) you have to configure only one parameter - the [Telegram adapter](https://github.com/iobroker-community-adapters/ioBroker.telegram) Id. No any other changes are required to start.
#### autoTelegramMenuDefaults.js
```javascript
    autoTelegramMenuTelegramAdapterInstanceId = 0,
```
or
#### AutoTelegramMenuMainScript.js
```javascript
/*************************************************/
/* Primary and only one thing to configure       */
/*************************************************/
const telegramInstance = autoTelegramMenuTelegramAdapterInstanceId ? `${autoTelegramMenuTelegramAdapterInstanceId}` :  '0';
/*************************************************/
```
Please take in account - if the [autoTelegramMenuDefaults.js](/global/autoTelegramMenuDefaults.js) is exists and running, its instance Id will be used.

## Credits
This script is heavily inspired by the Telegram menu script from Vladimir Vilisov aka [instalator](https://github.com/instalator) .
