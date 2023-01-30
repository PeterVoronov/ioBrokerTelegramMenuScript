/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

function autoTelegramMenuExtensionAccuWeather() {
    const
        autoTelegramMenuExtensionsInit = autoTelegramMenuExtensionsInitCommand ? `${autoTelegramMenuExtensionsInitCommand}` : 'autoTelegramMenuExtensionsInit',
        autoTelegramMenuExtensionsRegister = autoTelegramMenuExtensionsRegisterCommand ? `${autoTelegramMenuExtensionsRegisterCommand}` : 'autoTelegramMenuExtensionsRegister',
        autoTelegramMenuExtensionsTimeout = 500,
        autoTelegramMenuExtensionId = 'accuw',

        autoTelegramMenuExtensionTranslationsKeys = [
            'WeatherForecast',
            'ForecastDetailed',
            'ForecastHourly',
            'ForecastTomorrow',
            'ForecastLong',
            'Day',
            'Night',
            'Wind',
            'metersPerSecondShort',
            'windGust',
            'windNorth',
            'windNorthEast',
            'windEast',
            'windSouthEast',
            'windSouth',
            'windSouthWest',
            'windWest',
            'windNorthWest',
            'Precipitations',
            'NoPrecipitation',
            'millimetersShort',
            'PossiblePrecipitationHours',
            'thunderstormProbability',
            'total',
            'rain',
            'snow',
            'ice',
            'withProbability',
            'Temperature',
            'from',
            'to',
            'upTo',
            'RealFeel',
            'inShade',
            'RelativeHumidity',
            'dewPoint',
            'pressure',
            'mmHg'
        ];

    const
        _autoTelegramMenuExtensionsGetCachedState = autoTelegramMenuExtensionsGetCachedStateCommand ? `${autoTelegramMenuExtensionsGetCachedStateCommand}` : 'autoTelegramMenuExtensionsGetCachedState',
        _autoTelegramMenuExtensionsSetCachedState = autoTelegramMenuExtensionsSetCachedStateCommand ? `${autoTelegramMenuExtensionsSetCachedStateCommand}` : 'autoTelegramMenuExtensionsSetCachedState';

    function extensionAccuWeatherInit(messageId, timeout){
        messageTo(messageId === undefined ? autoTelegramMenuExtensionsRegister : messageId,
            {
                id : autoTelegramMenuExtensionId,
                nameTranslationId: 'WeatherForecast',
                icon: '☂️',
                externalMenu: 'menuAccuweatherForecast',
                scriptName: scriptName,
                translationsKeys: autoTelegramMenuExtensionTranslationsKeys
            },
            {timeout: timeout === undefined ? autoTelegramMenuExtensionsTimeout : timeout},
            (result) => {
                if (result.success) {
                    // console.log(`${extensionId} in script '${scriptName}' is registered = ${JSON.stringify(result.success)}`);
                }
                else {
                    console.warn(`Error to register ${autoTelegramMenuExtensionId} - ${result.error}`);
                }
            }
        );
    }

    onMessage(autoTelegramMenuExtensionsInit, ({messageId, timeout}, callback) => {
        // console.log(`messageId = ${messageId}, timeout = ${timeout}`);
        extensionAccuWeatherInit(messageId, timeout);
        callback({success: true});
    });


    const accuweatherIcons = {
        1: {
            icon: '☀️',
        },
        2: {
            icon: '☀️',
        },
        3: {
            icon: '🌤️',
        },
        4: {
            icon: '🌤️',
        },
        5: {
            icon: '⛅',
        },
        6: {
            icon: '🌥️',
        },
        7: {
            icon: '☁️',
        },
        8: {
            icon: '☁️',
        },
        11: {
            icon: '🌫️',
        },
        12: {
            icon: '🌧️',
        },
        13: {
            icon: '🌦️',
        },
        14: {
            icon: '🌦️',
        },
        15: {
            icon: '⛈️',
        },
        16: {
            icon: '🌥️⛈️',
        },
        17: {
            icon: '⛅⛈️',
        },
        18: {
            icon: '🌧️',
        },
        19: {
            icon: '🌨️',
        },
        20: {
            icon: '🌥️🌨️',
        },
        21: {
            icon: '⛅🌨️',
        },
        22: {
            icon: '🌨️',
        },
        23: {
            icon: '🌥️🌨️',
        },
        24: {
            icon: '❄️',
        },
        25: {
            icon: '🌧️🌨️',
        },
        26: {
            icon: '🌧️🌨️',
        },
        29: {
            icon: '🌧️🌨️',
        },
        30: {
            icon: '🥵',
        },
        31: {
            icon: '🥶',
        },
        32: {
            icon: '🌬️',
        },
        33: {
            icon: '🌑',
        },
        34: {
            icon: '🌑',
        },
        35: {
            icon: '🌑🌤️',
        },
        36: {
            icon: '🌑🌤️',
        },
        37: {
            icon: '🌑⛅',
        },
        38: {
            icon: '🌑🌥️',
        },
        39: {
            icon: '🌑🌦️',
        },
        40: {
            icon: '🌑🌦️',
        },
        41: {
            icon: '🌑⛅⛈️',
        },
        42: {
            icon: '🌑🌥️⛈️',
        },
        43: {
            icon: '🌑🌥️🌨️',
        },
        44: {
            icon: '🌑⛅🌨️',
        },
    };

    function _getCurrentHour() {
        let currentHour = Number.parseInt(new Date().toTimeString().slice(0, 2));
        if (currentHour === 24) currentHour = 0;
        return currentHour;
    }

    function convertSpeed(inKmH) {
        return Math.round(inKmH * 10 / 3.6) / 10;
    }

    function convertPressure(inMB) {
        return Math.round(inMB * 7.5006210) / 10;
    }

    function convertDirection(degrees, translations) {
        if ((degrees >= 338) || (degrees <= 22)) {
            return `${translations['windNorth']} ⇓`;
        }
        else if ((degrees > 22) && (degrees < 67)) {
            return `${translations['windNorthEast']} ⇙`;
        }
        else if ((degrees >= 68) && (degrees <= 112)) {
            return `${translations['windEast']} ⇐`;
        }
        else if ((degrees >= 112) && (degrees <= 157)) {
            return `${translations['windSouthEast']} ⇖`;
        }
        else if ((degrees >= 158) && (degrees <= 202)) {
            return `${translations['windSouth']} ⇑`;
        }
        else if ((degrees > 202) && (degrees < 247)) {
            return `${translations['windSouthWest']} ⇗`;
        }
        else if ((degrees >= 247) && (degrees <= 292)) {
            return `${translations['windWest']} ⇒`;
        }
        else {
            return `${translations['windNorthWest']} ⇘`;
        }
    }

    function getForecastDate(inputDate) {
        return inputDate.toLocaleDateString('ru-Ru', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getForecastTime(inputDate) {
        return inputDate.toLocaleTimeString('ru-Ru', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getDetailedForecast(day, translations) {
        const currentDate = new Date(getState(`accuweather.0.Daily.Day${day}.Date`).val);
        const amountPrecipitation = getState(`accuweather.0.Summary.TotalLiquidVolume_d${day}`).val;
        const precipitation = amountPrecipitation > 0 ? `\r\n * ${translations['Precipitations']}: ${amountPrecipitation} ${translations['millimetersShort']} ${translations['withProbability']} ${getState(`accuweather.0.Summary.PrecipitationProbability_d${day}`).val}%` : `. ${translations['NoPrecipitation']}`;
        const degrees = getObject(`accuweather.0.Current.Temperature`).common.unit;
        let text = ` ${getForecastDate(currentDate)} :`;
        text += `\r\n * ${getState(`accuweather.0.Summary.WeatherText_d${day}`).val}${precipitation}${day === 1 ? possiblePrecipitationHours(translations) : ''}`;
        text += `\r\n * ${translations['Temperature']}: ${translations['from']} ${getState(`accuweather.0.Summary.TempMin_d${day}`).val}${degrees} ${translations['to']} ${getState(`accuweather.0.Summary.TempMax_d${day}`).val}${degrees}`;
        text += `\r\n * ${translations['RealFeel']}: ${translations['from']} ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val}${degrees} ${translations['to']} ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val}${degrees}`;
        for (const dayNight of ['Day', 'Night']) {
            const hasDayNightPrecipitation = getState(`accuweather.0.Daily.Day${day}.${dayNight}.HasPrecipitation`).val;
            let dayNightPrecipitation = `. ${translations['NoPrecipitation']}`;
            if (hasDayNightPrecipitation) {
                dayNightPrecipitation = `\r\n * : ${translations['Precipitations']}`;
                for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
                    const typeProbability = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Probability`).val);
                    const typeVolume = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Volume`).val);
                    if ((typeProbability > 0) && (typeVolume > 0)) {
                        dayNightPrecipitation += `\r\n    * ${translations[precipitationType.toLowerCase()]} ${typeVolume} ${translations['millimetersShort']} ${translations['withProbability']} ${typeProbability}%.`;
                    }
                }
                const totalLiquidVolume = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.TotalLiquidVolume`).val);
                if (totalLiquidVolume > 0) dayNightPrecipitation += `\r\n    * ${translations['total']} ${translations['upTo']} ${totalLiquidVolume} ${translations['millimetersShort']}`;
                const thunderstormProbability = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.ThunderstormProbability`).val);
                if (thunderstormProbability > 0) dayNightPrecipitation += `\r\n    * ${translations['thunderstormProbability']} ${thunderstormProbability}%`;
            }

            text += `\r\n${translations[dayNight]}:\r\n * ${getState(`accuweather.0.Daily.Day${day}.${dayNight}.LongPhrase`).val}${dayNightPrecipitation}`;
            text += `\r\n * ${translations['Wind']} ${convertDirection(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindDirection`).val, translations)} ${convertSpeed(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindSpeed`).val)} ${translations['metersPerSecondShort']}, ${translations['windGust']} ${translations['upTo']} ${convertSpeed(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindGust`).val)} ${translations['metersPerSecondShort']}`;
        }
        return text;
    }

    function getHourlyForecast(hour, translations) {
        const currentDate = new Date(getState(`accuweather.0.Hourly.h${hour}.DateTime`).val);
        const degrees = getObject(`accuweather.0.Hourly.h${hour}.Temperature`).common.unit;
        let text = ` ${getForecastDate(currentDate)} ${getForecastTime(currentDate)}`;
        const hasPrecipitation = getState(`accuweather.0.Hourly.h${hour}.HasPrecipitation`).val;
        let precipitation = `. ${translations['NoPrecipitation']}`;
        if (hasPrecipitation) {
            precipitation = `\r\n * ${translations['Precipitations']} ${translations['upTo']} ${getState(`accuweather.0.Hourly.h${hour}.TotalLiquidVolume`).val} ${translations['millimetersShort']} ${translations['withProbability']} ${getState(`accuweather.0.Hourly.h${hour}.PrecipitationProbability`).val}%: `;
            for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
                const typeProbability = Number.parseInt(getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Probability`).val);
                const typeVolume = Number.parseInt(getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Volume`).val);
                if ((typeProbability > 0) && (typeVolume > 0)) {
                    precipitation += `\r\n    * ${translations[precipitationType.toLowerCase()]} ${typeVolume} ${translations['millimetersShort']} ${translations['withProbability']} ${typeProbability}%.`;
                }
            }
        }
        text += `\r\n * ${getState(`accuweather.0.Hourly.h${hour}.IconPhrase`).val}${precipitation}`;
        text += `\r\n * ${translations['Temperature']}: ${getState(`accuweather.0.Hourly.h${hour}.Temperature`).val}${degrees}, ${translations['RealFeel']}: ${getState(`accuweather.0.Hourly.h${hour}.RealFeelTemperature`).val}${degrees}`;
        text += `\r\n * ${translations['Wind']}: ${convertDirection(getState(`accuweather.0.Hourly.h${hour}.WindDirection`).val, translations)} ${convertSpeed(getState(`accuweather.0.Hourly.h${hour}.WindSpeed`).val)}  ${translations['metersPerSecondShort']}, ${translations['windGust']} ${translations['upTo']} ${convertSpeed(getState(`accuweather.0.Hourly.h${hour}.WindGust`).val)} ${translations['metersPerSecondShort']}`;
        return text;
    }

    function possiblePrecipitationHours(translations) {
        let precipitation = '';
        let previousPrecipitationHour;
        let delim = `\r\n    * ${translations['PossiblePrecipitationHours']}: `;
        let hasHourPrecipitation = false;
        for (let hour = 1; hour <= 24; hour++) {
            hasHourPrecipitation = getState(`accuweather.0.Hourly.h${hour < 24 ? hour : 0}.HasPrecipitation`).val;
            if (!hasHourPrecipitation) {
                if (previousPrecipitationHour !== undefined) {
                    if ((hour - 1) > previousPrecipitationHour) {
                        precipitation += `${delim}${previousPrecipitationHour}..${hour-1}`;
                    }
                    else {
                        precipitation += `${delim}${previousPrecipitationHour}`;
                    }
                    delim = ', ';
                    previousPrecipitationHour = undefined;
                }
            }
            else if (previousPrecipitationHour === undefined) {
                previousPrecipitationHour = hour;
            }
        }
        if (previousPrecipitationHour !== undefined) {
            if (previousPrecipitationHour < 24) {
                precipitation += `${delim}${previousPrecipitationHour}..${24}`;
            }
            else {
                precipitation += `${delim}${previousPrecipitationHour}`;
            }
        }
        return precipitation;
    }

    function getTodaysForecast(translations) {
        const currentDate = new Date(getState(`accuweather.0.Current.LocalObservationDateTime`).val);
        const hasPrecipitation = getState(`accuweather.0.Current.HasPrecipitation`).val;
        let precipitation = hasPrecipitation ? `\r\n * ${translations['Precipitations']}: ${getState(`accuweather.0.Current.PrecipitationType`).val}` : translations['NoPrecipitation'];
        const degrees = getObject(`accuweather.0.Current.Temperature`).common.unit;
        let text = ` ${getForecastDate(currentDate)} на ${getForecastTime(currentDate)}:`;
        text += `\r\n * ${getState(`accuweather.0.Current.WeatherText`).val}. ${precipitation}${possiblePrecipitationHours(translations)}`;
        text += `\r\n * ${translations['Temperature']}: ${getState(`accuweather.0.Current.Temperature`).val}${degrees}`;
        text += `\r\n * ${translations['RealFeel']}: ${getState(`accuweather.0.Current.RealFeelTemperature`).val}${degrees}, ${translations['inShade']}: ${getState(`accuweather.0.Current.RealFeelTemperatureShade`).val}${degrees}`;
        text += `\r\n * ${translations['RelativeHumidity']}: ${getState(`accuweather.0.Current.RelativeHumidity`).val}%, ${translations['dewPoint']}: ${getState(`accuweather.0.Current.DewPoint`).val}${degrees}`;
        text += `\r\n * ${getState(`accuweather.0.Current.PressureTendency`).val} ${translations['pressure']}: ${convertPressure(getState(`accuweather.0.Current.Pressure`).val)} ${translations['mmHg']}`;
        text += `\r\n * ${translations['Wind']}: ${convertDirection(getState(`accuweather.0.Current.WindDirection`).val, translations)} ${convertSpeed(getState(`accuweather.0.Current.WindSpeed`).val)} ${translations['metersPerSecondShort']}, ${translations['windGust']} ${translations['upTo']} ${convertSpeed(getState(`accuweather.0.Current.WindGust`).val)} ${translations['metersPerSecondShort']}`;
        return text;
    }


    onMessage('menuAccuweatherForecast', ({user: _user, data, funcEnum, translations}, callback) => {
        // console.log(`Received translations for weatherForecast: ${JSON.stringify(translations, null, ' ')}`);
        if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
            data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
            const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
            const currentHour = new Date().getHours();
            data.text = getTodaysForecast(translations);
            data.submenu = [{
                    "name": translations['ForecastDetailed'],
                    "funcEnum": funcEnum,
                    "icon": data.icon,
                    "externalMenu": 'menuAccuweatherForecastDetailed',
                    "submenu": [],
                },
                {
                    "name": translations['ForecastHourly'],
                    "funcEnum": funcEnum,
                    "icon": accuweatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
                    "externalMenu": 'menuAccuweatherForecastHourly',
                    "submenu": [],
                },
                {
                    "name": `${getState(`accuweather.0.Daily.Day2.RealFeelTemperature.Minimum`).val} ${degrees} .. ${getState(`accuweather.0.Daily.Day2.RealFeelTemperature.Maximum`).val} ${degrees} - ${translations['ForecastTomorrow']}`,
                    "funcEnum": funcEnum,
                    "icon": accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d2').val].icon,
                    "externalMenu": 'menuAccuweatherForecastTomorrow',
                    "submenu": [],
                },
                {
                    "name": `- ${translations['ForecastLong']}`,
                    "funcEnum": funcEnum,
                    "icon": accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d3').val].icon + ' ' + accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d4').val].icon + ' ' + accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d5').val].icon,
                    "externalMenu": 'menuAccuweatherForecastLong',
                    "submenu": [],
                },
            ];
            callback(data);
        }
    });

    onMessage('menuAccuweatherForecastDetailed', ({user: _user, data, funcEnum: _funcEnum, translations}, callback) => {
        if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
            data.text = getDetailedForecast(1, translations);
            data.submenu = [];
            callback(data);
        }
    });

    onMessage('menuAccuweatherForecastTomorrow', ({user: _user, data, funcEnum: _funcEnum, translations}, callback) => {
        if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
            data.text = getDetailedForecast(2, translations);
            data.submenu = [];
            callback(data);
        }
    });

    onMessage('menuAccuweatherForecastHourly', ({user: _user, data, funcEnum: _funcEnum, translations}, callback) => {
        if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
            data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
            const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
            const mainHour = new Date().getHours();
            data.text = getHourlyForecast(mainHour, translations);
            data.submenu = [];
            for (let currentHour = new Date().getHours(); currentHour < 24; currentHour++) {
                data.submenu.push({
                    "name": `${getState(`accuweather.0.Hourly.h${currentHour}.RealFeelTemperature`).val} ${degrees} (${currentHour})`,
                    "funcEnum": autoTelegramMenuExtensionId,
                    "text": getHourlyForecast(currentHour, translations),
                    "icon": accuweatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
                    "submenu": [],
                });
            }
            callback(data);
        }
    });

    onMessage('menuAccuweatherForecastLong', ({user: _user, data, funcEnum: _funcEnum, translations}, callback) => {
        if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
            data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
            const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
            data.submenu = [];
            for (let day = 3; day <= 5; day++) {
                const currentDate = new Date(getState(`accuweather.0.Summary.DateTime_d${day}`).val);
                const currentDay = `${getState(`accuweather.0.Summary.DayOfWeek_d${day}`).val} ${currentDate.getDate()}`;
                data.submenu.push({
                    "name": `${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val} ${degrees} .. ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val} ${degrees} (${currentDay})`,
                    "text": getDetailedForecast(day, translations),
                    "icon": accuweatherIcons[getState(`accuweather.0.Summary.WeatherIcon_d${day}`).val].icon,
                    "submenu": [],
                });
            }
            callback(data);
        }
    });

    extensionAccuWeatherInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionAccuWeather();