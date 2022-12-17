/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

console.log(`Script is ${scriptName} on instance ${instance}`);
const
    // @ts-ignore
    autoTelegramMenuExtensionsInit = autoTelegramMenuExtensionsInitCommand ? `${autoTelegramMenuExtensionsInitCommand}` : 'autoTelegramMenuExtensionsInit',
    // @ts-ignore
    autoTelegramMenuExtensionsRegister = autoTelegramMenuExtensionsRegisterCommand ? `${autoTelegramMenuExtensionsRegisterCommand}` : 'autoTelegramMenuExtensionsRegister',
    // @ts-ignore
    autoTelegramMenuExtensionsTimeout = 500,
    // @ts-ignore
    autoTelegramMenuExtensionId = 'accuw';

const
    // @ts-ignore
    _autoTelegramMenuExtensionsGetCachedState = autoTelegramMenuExtensionsGetCachedStateCommand ? `${autoTelegramMenuExtensionsGetCachedStateCommand}` : 'autoTelegramMenuExtensionsGetCachedState',
    // @ts-ignore
    _autoTelegramMenuExtensionsSetCachedState = autoTelegramMenuExtensionsSetCachedStateCommand ? `${autoTelegramMenuExtensionsSetCachedStateCommand}` : 'autoTelegramMenuExtensionsSetCachedState';

function extensionAccuWeatherInit(messageId, timeout){
    messageTo(messageId === undefined ? autoTelegramMenuExtensionsRegister : messageId,
        {
            id : autoTelegramMenuExtensionId,
            name: "Прогноз погоды",
            icon: '☂️',
            externalMenu: 'accuweatherForecast',
            scriptName: scriptName
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

function convertDirection(degrees) {
    if ((degrees >= 338) || (degrees <= 22)) {
        return 'C ⇓';
    }
    else if ((degrees > 22) && (degrees < 67)) {
        return 'CВ ⇙';
    }
    else if ((degrees >= 68) && (degrees <= 112)) {
        return 'В ⇐';
    }
    else if ((degrees >= 112) && (degrees <= 157)) {
        return 'ЮВ ⇖';
    }
    else if ((degrees >= 158) && (degrees <= 202)) {
        return 'Ю ⇑';
    }
    else if ((degrees > 202) && (degrees < 247)) {
        return 'ЮЗ ⇗';
    }
    else if ((degrees >= 247) && (degrees <= 292)) {
        return 'З ⇒';
    }
    else {
        return 'СЗ ⇘';
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

function getDetailedForecast(day) {
    const currentDate = new Date(getState(`accuweather.0.Daily.Day${day}.Date`).val);
    const amountPrecipitation = getState(`accuweather.0.Summary.TotalLiquidVolume_d${day}`).val;
    const precipitation = amountPrecipitation > 0 ? `\r\n * Осадки: ${amountPrecipitation} мм. с вероятностью ${getState(`accuweather.0.Summary.PrecipitationProbability_d${day}`).val}%` : '. Без осадков';
    // @ts-ignore
    const degrees = getObject(`accuweather.0.Current.Temperature`).common.unit;
    let text = ` ${getForecastDate(currentDate)} :`;
    text += `\r\n * ${getState(`accuweather.0.Summary.WeatherText_d${day}`).val}${precipitation}${day === 1 ? possiblePrecipitationHours() : ''}`;
    text += `\r\n * Температура: от ${getState(`accuweather.0.Summary.TempMin_d${day}`).val}${degrees} до ${getState(`accuweather.0.Summary.TempMax_d${day}`).val}${degrees}`;
    text += `\r\n * Ощущаемая: от ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val}${degrees} до ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val}${degrees}`;
    for (const dayNight of ['Day', 'Night']) {
        const hasDayNightPrecipitation = getState(`accuweather.0.Daily.Day${day}.${dayNight}.HasPrecipitation`).val;
        let dayNightPrecipitation = '. Без осадков';
        //console.log(`Probability for ${day} ${dayNight} = ${hasDayNightPrecipitation}, type : ${typeof(hasDayNightPrecipitation)}`);
        if (hasDayNightPrecipitation) {
            dayNightPrecipitation = `\r\n * Осадки: `;
            for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
                const typeProbability = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Probability`).val);
                const typeVolume = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Volume`).val);
                if ((typeProbability > 0) && (typeVolume > 0)) {
                    dayNightPrecipitation += `\r\n    * ${(precipitationType === 'Rain' ? 'Дождь' : (precipitationType === 'Snow' ? 'Снег' : 'Лёд') )} ${typeVolume} мм. с вероятностью ${typeProbability}%.`;
                }
            }
            const totalLiquidVolume = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.TotalLiquidVolume`).val);
            if (totalLiquidVolume > 0) dayNightPrecipitation += `\r\n    * Всего до ${totalLiquidVolume} мм.`;
            const thunderstormProbability = Number.parseInt(getState(`accuweather.0.Daily.Day${day}.${dayNight}.ThunderstormProbability`).val);
            if (thunderstormProbability > 0) dayNightPrecipitation += `\r\n    * Вероятность грозы ${thunderstormProbability}%`;
        }

        text += `\r\n${dayNight === 'Day' ? `Днём` : `Ночью`}:\r\n * ${getState(`accuweather.0.Daily.Day${day}.${dayNight}.LongPhrase`).val}${dayNightPrecipitation}`;
        text += `\r\n * Ветер ${convertDirection(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindDirection`).val)} ${convertSpeed(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindSpeed`).val)} м/с, порывы до ${convertSpeed(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindGust`).val)} м/с`;
    }
    return text;
}

function getHourlyForecast(hour) {
    const currentDate = new Date(getState(`accuweather.0.Hourly.h${hour}.DateTime`).val);
    // @ts-ignore
    const degrees = getObject(`accuweather.0.Hourly.h${hour}.Temperature`).common.unit;
    let text = ` ${getForecastDate(currentDate)} ${getForecastTime(currentDate)}`;
    const hasPrecipitation = getState(`accuweather.0.Hourly.h${hour}.HasPrecipitation`).val;
    let precipitation = '. Без осадков';
    if (hasPrecipitation) {
        precipitation = `\r\n * Осадки до ${getState(`accuweather.0.Hourly.h${hour}.TotalLiquidVolume`).val} мм. с вероятностью ${getState(`accuweather.0.Hourly.h${hour}.PrecipitationProbability`).val}%: `;
        for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
            const typeProbability = Number.parseInt(getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Probability`).val);
            const typeVolume = Number.parseInt(getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Volume`).val);
            if ((typeProbability > 0) && (typeVolume > 0)) {
                precipitation += `\r\n    * ${(precipitationType === 'Rain' ? 'Дождь' : (precipitationType === 'Snow' ? 'Снег' : 'Лёд') )} ${typeVolume} мм. с вероятностью ${typeProbability}%.`;
            }
        }
    }
    text += `\r\n * ${getState(`accuweather.0.Hourly.h${hour}.IconPhrase`).val}${precipitation}`;
    text += `\r\n * Температура: ${getState(`accuweather.0.Hourly.h${hour}.Temperature`).val}${degrees}, ощущаемая: ${getState(`accuweather.0.Hourly.h${hour}.RealFeelTemperature`).val}${degrees}`;
    text += `\r\n * Ветер ${convertDirection(getState(`accuweather.0.Hourly.h${hour}.WindDirection`).val)} ${convertSpeed(getState(`accuweather.0.Hourly.h${hour}.WindSpeed`).val)} м/с, порывы до ${convertSpeed(getState(`accuweather.0.Hourly.h${hour}.WindGust`).val)} м/с`;

    return text;
}

function possiblePrecipitationHours() {
    let precipitation = '';
    let previousPrecipitationHour;
    let delim = '\r\n    * Возможные часы осадков: ';
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

function getTodaysForecast() {
    // @ts-ignore
    const _day = 1;
    const currentDate = new Date(getState(`accuweather.0.Current.LocalObservationDateTime`).val);
    const hasPrecipitation = getState(`accuweather.0.Current.HasPrecipitation`).val;
    let precipitation = hasPrecipitation ? `\r\n * Осадки: ${getState(`accuweather.0.Current.PrecipitationType`).val}` : 'Без осадков';
    // @ts-ignore
    const degrees = getObject(`accuweather.0.Current.Temperature`).common.unit;
    let text = ` ${getForecastDate(currentDate)} на ${getForecastTime(currentDate)}:`;
    text += `\r\n * ${getState(`accuweather.0.Current.WeatherText`).val}. ${precipitation}${possiblePrecipitationHours()}`;
    text += `\r\n * Температура: ${getState(`accuweather.0.Current.Temperature`).val}${degrees}`;
    text += `\r\n * Ощущаемая: ${getState(`accuweather.0.Current.RealFeelTemperature`).val}${degrees}, в тени: ${getState(`accuweather.0.Current.RealFeelTemperatureShade`).val}${degrees}`;
    text += `\r\n * Влажность воздуха: ${getState(`accuweather.0.Current.RelativeHumidity`).val}%, точка росы: ${getState(`accuweather.0.Current.DewPoint`).val}${degrees}`;
    text += `\r\n * ${getState(`accuweather.0.Current.PressureTendency`).val} давление: ${convertPressure(getState(`accuweather.0.Current.Pressure`).val)} мм.рст.`;
    text += `\r\n * Ветер ${convertDirection(getState(`accuweather.0.Current.WindDirection`).val)} ${convertSpeed(getState(`accuweather.0.Current.WindSpeed`).val)} м/с, порывы до ${convertSpeed(getState(`accuweather.0.Current.WindGust`).val)} м/с`;
    return text;
}


onMessage('accuweatherForecast', ({_user, data}, callback) => {
    //console.log(`Received data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
    if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
        data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
        const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
        const currentHour = new Date().getHours();
        data.text = getTodaysForecast();
        data.submenu = [{
                "name": "Детальный",
                "icon": data.icon,
                "externalMenu": 'accuweatherForecastDetailed',
                "submenu": [],
            },
            {
                "name": "Почасовой",
                "icon": accuweatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
                "externalMenu": 'accuweatherForecastHourly',
                "submenu": [],
            },
            {
                "name": `${getState(`accuweather.0.Daily.Day2.RealFeelTemperature.Minimum`).val} ${degrees} .. ${getState(`accuweather.0.Daily.Day2.RealFeelTemperature.Maximum`).val} ${degrees} - На завтра`,
                "icon": accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d2').val].icon,
                "externalMenu": 'accuweatherForecastTomorrow',
                "submenu": [],
            },
            {
                "name": "- Длительный",
                "icon": accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d3').val].icon + ' ' + accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d4').val].icon + ' ' + accuweatherIcons[getState('accuweather.0.Summary.WeatherIcon_d5').val].icon,
                "externalMenu": 'accuweatherForecastLong',
                "submenu": [],
            },
        ];
        //console.log(`Prepared data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
        callback(data);
    }
});

onMessage('accuweatherForecastDetailed', ({_user, data}, callback) => {
    //console.log(`Received data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
    if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
        data.text = getDetailedForecast(1);
        data.submenu = [];
        //console.log(`Prepared data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
        callback(data);
    }
});

onMessage('accuweatherForecastTomorrow', ({_user, data}, callback) => {
    //console.log(`Received data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
    if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
        data.text = getDetailedForecast(2);
        data.submenu = [];
        //console.log(`Prepared data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
        callback(data);
    }
});

onMessage('accuweatherForecastHourly', ({_user, data}, callback) => {
    //console.log(`Received data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
    if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
        data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
        // @ts-ignore
        const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
        const mainHour = new Date().getHours();
        // @ts-ignore
        let _currentHour = mainHour;
        data.text = getHourlyForecast(mainHour);
        data.submenu = [];
        for (let currentHour = new Date().getHours(); currentHour < 24; currentHour++) {
            data.submenu.push({
                "name": `${getState(`accuweather.0.Hourly.h${currentHour}.RealFeelTemperature`).val} ${degrees} (${currentHour})`,
                "text": getHourlyForecast(currentHour),
                "icon": accuweatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
                "submenu": [],
            });
        }
        //console.log(`Prepared data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
        callback(data);
    }
});

onMessage('accuweatherForecastLong', ({_user, data}, callback) => {
    //console.log(`Received data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
    if ((typeof (data) === 'object') && data.hasOwnProperty('submenu')) {
        data.icon = accuweatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
        // @ts-ignore
        const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
        data.submenu = [];
        for (let day = 3; day <= 5; day++) {
            const currentDate = new Date(getState(`accuweather.0.Summary.DateTime_d${day}`).val);
            const currentDay = `${getState(`accuweather.0.Summary.DayOfWeek_d${day}`).val} ${currentDate.getDate()}`;
            data.submenu.push({
                "name": `${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val} ${degrees} .. ${getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val} ${degrees} (${currentDay})`,
                "text": getDetailedForecast(day),
                "icon": accuweatherIcons[getState(`accuweather.0.Summary.WeatherIcon_d${day}`).val].icon,
                "submenu": [],
            });
        }
        //console.log(`Prepared data for weatherForecast: ${JSON.stringify(data, null, ' ')}`);
        callback(data);
    }
});

extensionAccuWeatherInit();