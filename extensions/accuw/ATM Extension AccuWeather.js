/* global autoTelegramMenuExtensionsInitCommand, autoTelegramMenuExtensionsRegisterCommand */
/* global autoTelegramMenuExtensionsGetCachedStateCommand, autoTelegramMenuExtensionsSetCachedStateCommand */
/* global  autoTelegramMenuExtensionsSendFile, autoTelegramMenuExtensionsSendImage */
/* global autoTelegramMenuExtensionsSendAlertToTelegram */

function autoTelegramMenuExtensionAccuWeather() {
  const extensionsInit = autoTelegramMenuExtensionsInitCommand
      ? `${autoTelegramMenuExtensionsInitCommand}`
      : 'autoTelegramMenuExtensionsInit',
    extensionsRegister = autoTelegramMenuExtensionsRegisterCommand
      ? `${autoTelegramMenuExtensionsRegisterCommand}`
      : 'autoTelegramMenuExtensionsRegister',
    extensionsTimeout = 500,
    extensionId = 'accuw',
    extensionType = 'function',
    extensionMenuId = 'menuAccuWeatherForecast',
    extensionTranslationsKeys = [
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
      'mmHg',
    ];

  const _autoTelegramMenuExtensionsGetCachedState = autoTelegramMenuExtensionsGetCachedStateCommand
      ? `${autoTelegramMenuExtensionsGetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsGetCachedState',
    _autoTelegramMenuExtensionsSetCachedState = autoTelegramMenuExtensionsSetCachedStateCommand
      ? `${autoTelegramMenuExtensionsSetCachedStateCommand}`
      : 'autoTelegramMenuExtensionsSetCachedState';

  function extensionInit(messageId, timeout) {
    messageTo(
      messageId === undefined ? extensionsRegister : messageId,
      {
        id: extensionId,
        type: extensionType,
        nameTranslationId: 'WeatherForecast',
        icon: '☂️',
        options: {
          state: extensionMenuId
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

  onMessage(extensionsInit, ({messageId, timeout}, callback) => {
    extensionInit(messageId, timeout);
    callback({success: true});
  });

  const accuWeatherIcons = {
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

  function convertSpeed(inKmH) {
    return Math.round((inKmH * 10) / 3.6) / 10;
  }

  function convertPressure(inMB) {
    return Math.round(inMB * 7.500621) / 10;
  }

  function convertDirection(degrees, translations) {
    if (degrees >= 338 || degrees <= 22) {
      return `⇓(${translations['windNorth']})`;
    } else if (degrees > 22 && degrees < 67) {
      return `⇙(${translations['windNorthEast']})`;
    } else if (degrees >= 68 && degrees <= 112) {
      return `⇐(${translations['windEast']})`;
    } else if (degrees >= 112 && degrees <= 157) {
      return `⇖(${translations['windSouthEast']})`;
    } else if (degrees >= 158 && degrees <= 202) {
      return `⇑(${translations['windSouth']})`;
    } else if (degrees > 202 && degrees < 247) {
      return `⇗(${translations['windSouthWest']})`;
    } else if (degrees >= 247 && degrees <= 292) {
      return `⇒(${translations['windWest']})`;
    } else {
      return `⇘(${translations['windNorthWest']})`;
    }
  }

  function getForecastDate(inputDate, languageId) {
    return inputDate.toLocaleDateString(languageId, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getForecastTime(inputDate, languageId) {
    return inputDate.toLocaleTimeString(languageId, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getDetailedForecast(day, translations) {
    const currentDate = new Date(getState(`accuweather.0.Daily.Day${day}.Date`).val),
      amountPrecipitation = getState(`accuweather.0.Summary.TotalLiquidVolume_d${day}`).val,
      precipitation =
        amountPrecipitation > 0
          ? `\r\n * ${translations['Precipitations']}: ${amountPrecipitation} ${translations['millimetersShort']} ${
              translations['withProbability']
            } ` + getState(`accuweather.0.Summary.PrecipitationProbability_d${day}`).val + '%'
          : `. ${translations['NoPrecipitation']}`,
      degrees = getObject(`accuweather.0.Current.Temperature`).common.unit,
      languageId = translations['currentLanguage'] ? translations['currentLanguage'] : 'en';
    let text = ` ${getForecastDate(currentDate, languageId)} :`;
    text += `\r\n * ` + getState(`accuweather.0.Summary.WeatherText_d${day}`).val + `${precipitation}${
      day === 1 ? possiblePrecipitationHours(translations) : ''
    }`;
    text += `\r\n * ${translations['Temperature']}: ${translations['from']} ${
      getState(`accuweather.0.Summary.TempMin_d${day}`).val
    }${degrees} ${translations['to']} ` + getState(`accuweather.0.Summary.TempMax_d${day}`).val + `${degrees}`;
    text += `\r\n * ${translations['RealFeel']}: ${translations['from']} ${
      getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val
    }${degrees} ${translations['to']} ${
      getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val
    }${degrees}`;
    for (const dayNight of ['Day', 'Night']) {
      const hasDayNightPrecipitation = getState(`accuweather.0.Daily.Day${day}.${dayNight}.HasPrecipitation`).val;
      let dayNightPrecipitation = `. ${translations['NoPrecipitation']}`;
      if (hasDayNightPrecipitation) {
        dayNightPrecipitation = `\r\n * ${translations['Precipitations']}:`;
        for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
          const typeProbability = Number.parseInt(
            getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Probability`).val,
          );
          const typeVolume = Number.parseInt(
            getState(`accuweather.0.Daily.Day${day}.${dayNight}.${precipitationType}Volume`).val,
          );
          if (typeProbability > 0 && typeVolume > 0) {
            dayNightPrecipitation += `\r\n    * ${translations[precipitationType.toLowerCase()]} ${typeVolume} ${
              translations['millimetersShort']
            } ${translations['withProbability']} ${typeProbability}%.`;
          }
        }
        const totalLiquidVolume = Number.parseInt(
          getState(`accuweather.0.Daily.Day${day}.${dayNight}.TotalLiquidVolume`).val,
        );
        if (totalLiquidVolume > 0)
          dayNightPrecipitation +=
          `\r\n    * ${translations['total']} ${translations['upTo']
        } ${totalLiquidVolume} ${translations['millimetersShort']}`;
        const thunderstormProbability = Number.parseInt(
          getState(`accuweather.0.Daily.Day${day}.${dayNight}.ThunderstormProbability`).val,
        );
        if (thunderstormProbability > 0)
          dayNightPrecipitation += `\r\n    * ${translations['thunderstormProbability']} ${thunderstormProbability}%`;
      }

      text += `\r\n${translations[dayNight]}:\r\n * ${
        getState(`accuweather.0.Daily.Day${day}.${dayNight}.LongPhrase`).val
      }${dayNightPrecipitation}`;
      text += `\r\n * ${translations['Wind']} ${convertDirection(
        getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindDirection`).val,
        translations,
      )} ${convertSpeed(getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindSpeed`).val)} ${
        translations['metersPerSecondShort']
      }, ${translations['windGust']} ${translations['upTo']} ${convertSpeed(
        getState(`accuweather.0.Daily.Day${day}.${dayNight}.WindGust`).val,
      )} ${translations['metersPerSecondShort']}`;
    }
    return text;
  }

  function getHourlyForecast(hour, translations) {
    const currentDate = new Date(getState(`accuweather.0.Hourly.h${hour}.DateTime`).val),
      degrees = getObject(`accuweather.0.Hourly.h${hour}.Temperature`).common.unit,
      languageId = translations['currentLanguage'] ? translations['currentLanguage'] : 'en';
    let text = ` ${getForecastDate(currentDate, languageId)} ${getForecastTime(currentDate, languageId)}`;
    const hasPrecipitation = getState(`accuweather.0.Hourly.h${hour}.HasPrecipitation`).val;
    let precipitation = `. ${translations['NoPrecipitation']}`;
    if (hasPrecipitation) {
      precipitation = `\r\n * ${translations['Precipitations']} ${translations['upTo']} ${
        getState(`accuweather.0.Hourly.h${hour}.TotalLiquidVolume`).val
      } ${translations['millimetersShort']} ${translations['withProbability']} ${
        getState(`accuweather.0.Hourly.h${hour}.PrecipitationProbability`).val
      }%: `;
      for (const precipitationType of ['Rain', 'Snow', 'Ice']) {
        const typeProbability = Number.parseInt(
          getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Probability`).val,
        );
        const typeVolume = Number.parseInt(getState(`accuweather.0.Hourly.h${hour}.${precipitationType}Volume`).val);
        if (typeProbability > 0 && typeVolume > 0) {
          precipitation += `\r\n    * ${translations[precipitationType.toLowerCase()]} ${typeVolume} ${
            translations['millimetersShort']
          } ${translations['withProbability']} ${typeProbability}%.`;
        }
      }
    }
    text += `\r\n * ` + getState(`accuweather.0.Hourly.h${hour}.IconPhrase`).val+ `${precipitation}`;
    text += `\r\n * ${translations['Temperature']}: ${
      getState(`accuweather.0.Hourly.h${hour}.Temperature`).val
    }${degrees}, ${translations['RealFeel']}: ${
      getState(`accuweather.0.Hourly.h${hour}.RealFeelTemperature`).val
    }${degrees}`;
    text += `\r\n * ${translations['Wind']}: ${convertDirection(
      getState(`accuweather.0.Hourly.h${hour}.WindDirection`).val,
      translations,
    )} ${convertSpeed(getState(`accuweather.0.Hourly.h${hour}.WindSpeed`).val)}  ${
      translations['metersPerSecondShort']
    }, ${translations['windGust']} ${translations['upTo']} ${convertSpeed(
      getState(`accuweather.0.Hourly.h${hour}.WindGust`).val,
    )} ${translations['metersPerSecondShort']}`;
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
          if (hour - 1 > previousPrecipitationHour) {
            precipitation += `${delim}${previousPrecipitationHour}..${hour - 1}`;
          } else {
            precipitation += `${delim}${previousPrecipitationHour}`;
          }
          delim = ', ';
          previousPrecipitationHour = undefined;
        }
      } else if (previousPrecipitationHour === undefined) {
        previousPrecipitationHour = hour;
      }
    }
    if (previousPrecipitationHour !== undefined) {
      if (previousPrecipitationHour < 24) {
        precipitation += `${delim}${previousPrecipitationHour}..${24}`;
      } else {
        precipitation += `${delim}${previousPrecipitationHour}`;
      }
    }
    return precipitation;
  }

  function getTodaysForecast(translations) {
    const currentDate = new Date(getState(`accuweather.0.Current.LocalObservationDateTime`).val),
      hasPrecipitation = getState(`accuweather.0.Current.HasPrecipitation`).val,
      languageId = translations['currentLanguage'] ? translations['currentLanguage'] : 'en';
    let precipitation = hasPrecipitation
      ? `\r\n * ${translations['Precipitations']}: ` + getState(`accuweather.0.Current.PrecipitationType`).val
      : translations['NoPrecipitation'];
    const degrees = getObject(`accuweather.0.Current.Temperature`).common.unit;
    let text = ` ${getForecastDate(currentDate, languageId)} на ${getForecastTime(currentDate, languageId)}:`;
    text += `\r\n * ` + getState(`accuweather.0.Current.WeatherText`).val+
      `. ${precipitation}${possiblePrecipitationHours(translations,)}`;
    text += `\r\n * ${translations['Temperature']}: ` + getState(`accuweather.0.Current.Temperature`).val +
      `${degrees}`;
    text += `\r\n * ${translations['RealFeel']}: ${
      getState(`accuweather.0.Current.RealFeelTemperature`).val
    }${degrees}, ${translations['inShade']}: ${
      getState(`accuweather.0.Current.RealFeelTemperatureShade`).val
    }${degrees}`;
    text += `\r\n * ${translations['RelativeHumidity']}: ` + getState(`accuweather.0.Current.RelativeHumidity`).val +
       `%, ${translations['dewPoint']}: ` + getState(`accuweather.0.Current.DewPoint`).val + `${degrees}`;
    text += `\r\n * ` + getState(`accuweather.0.Current.PressureTendency`).val +
      ` ${translations['pressure']}: ` + convertPressure(getState(`accuweather.0.Current.Pressure`).val) +
      ` ${translations['mmHg']}`;
    text += `\r\n * ${translations['Wind']}: ${convertDirection(
      getState(`accuweather.0.Current.WindDirection`).val,
      translations,
    )} ${convertSpeed(getState(`accuweather.0.Current.WindSpeed`).val)} ${translations['metersPerSecondShort']}, ${
      translations['windGust']
    } ${translations['upTo']} ${convertSpeed(getState(`accuweather.0.Current.WindGust`).val)} ${
      translations['metersPerSecondShort']
    }`;
    return text;
  }

  onMessage(extensionMenuId, ({user: _user, data, translations}, callback) => {
    if (typeof data === 'object' && data.hasOwnProperty('submenu')) {
      switch (data.id) {
        case 'ForecastDetailed': {
          data.text = getDetailedForecast(1, translations);
          data.submenu = [];
          break;
        }
        case 'ForecastHourly': {
          data.icon = accuWeatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
          const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
          const mainHour = new Date().getHours();
          data.text = getHourlyForecast(mainHour, translations);
          data.submenu = [];
          for (let currentHour = new Date().getHours(); currentHour < 24; currentHour++) {
            data.submenu.push({
              name: `${
                getState(`accuweather.0.Hourly.h${currentHour}.RealFeelTemperature`).val
              } ${degrees} (${currentHour})`,
              text: getHourlyForecast(currentHour, translations),
              icon: accuWeatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
              submenu: [],
            });
          }
          break;
        }
        case 'ForecastTomorrow': {
          data.text = getDetailedForecast(2, translations);
          data.submenu = [];
          break;
        }
        case 'ForecastLong': {
          data.icon = accuWeatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
          const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
          data.submenu = [];
          for (let day = 3; day <= 5; day++) {
            const currentDate = new Date(getState(`accuweather.0.Summary.DateTime_d${day}`).val);
            const currentDay = getState(`accuweather.0.Summary.DayOfWeek_d${day}`).val + ` ${currentDate.getDate()}`;
            data.submenu.push({
              name: getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Minimum`).val + ` ${degrees} .. ` +
                getState(`accuweather.0.Daily.Day${day}.RealFeelTemperature.Maximum`).val +
                ` ${degrees} (${currentDay})`,
              text: getDetailedForecast(day, translations),
              icon: accuWeatherIcons[getState(`accuweather.0.Summary.WeatherIcon_d${day}`).val].icon,
              submenu: [],
            });
          }
          break;
        }
        default: {
          data.icon = accuWeatherIcons[getState('accuweather.0.Current.WeatherIcon').val].icon;
          const degrees = getObject(`accuweather.0.Current.RealFeelTemperature`).common.unit;
          const currentHour = new Date().getHours();
          data.text = getTodaysForecast(translations);
          data.submenu = [
            {
              id: 'ForecastDetailed',
              name: translations['ForecastDetailed'],
              extensionId: extensionId,
              icon: data.icon,
              submenu: extensionMenuId,
            },
            {
              id: 'ForecastHourly',
              name: translations['ForecastHourly'],
              extensionId: extensionId,
              icon: accuWeatherIcons[getState(`accuweather.0.Hourly.h${currentHour}.WeatherIcon`).val].icon,
              submenu: extensionMenuId,
            },
            {
              id: 'ForecastTomorrow',
              name: `${getState('accuweather.0.Daily.Day2.RealFeelTemperature.Minimum').val} ${degrees} .. ${
                getState('accuweather.0.Daily.Day2.RealFeelTemperature.Maximum').val
              } ${degrees} - ${translations['ForecastTomorrow']}`,
              extensionId: extensionId,
              icon: accuWeatherIcons[getState('accuweather.0.Summary.WeatherIcon_d2').val].icon,
              submenu: extensionMenuId,
            },
            {
              id: 'ForecastLong',
              name: `- ${translations['ForecastLong']}`,
              extensionId: extensionId,
              icon:
                accuWeatherIcons[getState('accuweather.0.Summary.WeatherIcon_d3').val].icon +
                ' ' +
                accuWeatherIcons[getState('accuweather.0.Summary.WeatherIcon_d4').val].icon +
                ' ' +
                accuWeatherIcons[getState('accuweather.0.Summary.WeatherIcon_d5').val].icon,
              submenu: extensionMenuId,
            },
          ];
          break;
        }
      }
      callback(data);
    }
  });

  extensionInit();
}

console.log(`Script is ${scriptName} on instance ${instance}`);
autoTelegramMenuExtensionAccuWeather();
