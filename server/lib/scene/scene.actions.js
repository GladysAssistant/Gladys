const Promise = require('bluebird');
const Handlebars = require('handlebars');
const cloneDeep = require('lodash.clonedeep');
const {
  create,
  addDependencies,
  divideDependencies,
  evaluateDependencies,
  largerDependencies,
  largerEqDependencies,
  modDependencies,
  multiplyDependencies,
  roundDependencies,
  smallerDependencies,
  smallerEqDependencies,
  subtractDependencies,
  unaryMinusDependencies,
  randomDependencies,
} = require('mathjs');
const set = require('set-value');
const get = require('get-value');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, ALARM_MODES } = require('../../utils/constants');
const { getDeviceFeature } = require('../../utils/device');
const { AbortScene } = require('../../utils/coreErrors');
const { compare } = require('../../utils/compare');
const { parseJsonIfJson } = require('../../utils/json');
const logger = require('../../utils/logger');
const executeActionsFactory = require('./scene.executeActions');

dayjs.extend(utc);
dayjs.extend(timezone);

// Every operator the formula engine supports must be listed explicitly here.
// mathjs only exposes in the "math" namespace what is passed to create(), so an operator
// that is only pulled in transitively by another factory (multiply through divide, for example)
// is not guaranteed to stay available across mathjs releases.
const { evaluate } = create({
  addDependencies,
  divideDependencies,
  evaluateDependencies,
  largerDependencies,
  smallerDependencies,
  largerEqDependencies,
  modDependencies,
  multiplyDependencies,
  smallerEqDependencies,
  subtractDependencies,
  unaryMinusDependencies,
  roundDependencies,
  randomDependencies,
});

// Safety limits for the "while" loop action
const WHILE_DEFAULT_MAX_ITERATIONS = 1000;
const WHILE_ABSOLUTE_MAX_ITERATIONS = 10000;
const WHILE_MIN_ITERATION_TIME_MS = 100;

/**
 * @description Warn the user when a rendered MQTT payload looks like JSON but is not valid JSON.
 * This is the usual symptom of a `{{variable}}` which could not be resolved and was
 * rendered as an empty string by Handlebars.
 * @param {string} actionName - Name of the scene action, used as log prefix.
 * @param {string} topic - Topic the message is published to.
 * @param {string} message - Message after Handlebars rendering.
 * @example warnIfInvalidJsonMessage('MQTT', 'my/topic', '{"state":}');
 */
function warnIfInvalidJsonMessage(actionName, topic, message) {
  const trimmedMessage = String(message).trim();
  if (trimmedMessage.startsWith('{') && typeof parseJsonIfJson(trimmedMessage) === 'string') {
    logger.warn(
      `${actionName}: the message sent on topic "${topic}" looks like JSON but is not valid JSON. ` +
        `It's usually the sign of a variable which could not be resolved. Message sent: ${message}`,
    );
  }
}

const actionsFunc = {
  [ACTIONS.DEVICE.SET_VALUE]: async (self, action, scope) => {
    let device;
    let deviceFeature;
    if (action.device_feature) {
      deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
      device = self.stateManager.get('deviceById', deviceFeature.device_id);
    } else {
      device = self.stateManager.get('device', action.device);
      deviceFeature = getDeviceFeature(device, action.feature_category, action.feature_type);
    }

    let { value } = action;

    // A text feature (a message displayed on a TV, a text virtual sensor...) receives the
    // value as a raw string with scene variables injected, and skips the math evaluation
    // below which would reject any non-numeric text
    if (
      deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
      deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.TEXT
    ) {
      if (action.evaluate_value !== undefined) {
        value = Handlebars.compile(action.evaluate_value, {
          noEscape: true,
        })(scope);
      }
      if (value === undefined || value === null || value === '') {
        throw new AbortScene('ACTION_VALUE_EMPTY');
      }
      return self.device.setValue(device, deviceFeature, String(value));
    }

    if (action.evaluate_value !== undefined) {
      value = evaluate(
        Handlebars.compile(action.evaluate_value, {
          noEscape: true,
        })(scope).replace(/\s/g, ''),
      );
    }

    if (Number.isNaN(Number(value))) {
      throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
    }

    const valueInNumber = Number(value);

    return self.device.setValue(device, deviceFeature, valueInNumber);
  },
  [ACTIONS.LIGHT.TURN_ON]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        );
        await self.device.setValue(device, deviceFeature, 1);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.LIGHT.TURN_OFF]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        );
        await self.device.setValue(device, deviceFeature, 0);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.LIGHT.TOGGLE]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        );
        await self.device.setValue(device, deviceFeature, deviceFeature.last_value === 0 ? 1 : 0);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.LIGHT.BLINK]: async (self, action, scope) => {
    const blinkingSpeed = action.blinking_speed;
    const blinkingTime = action.blinking_time * 1000 + 1;
    let blinkingInterval;
    switch (blinkingSpeed) {
      case 'slow':
        blinkingInterval = 1000;
        break;
      case 'medium':
        blinkingInterval = 500;
        break;
      case 'fast':
        blinkingInterval = 200;
        break;
      default:
        blinkingInterval = 200;
        break;
    }
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        let deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        );
        if (!deviceFeature) {
          deviceFeature = getDeviceFeature(
            device,
            DEVICE_FEATURE_CATEGORIES.SWITCH,
            DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          );
        }
        const oldValue = deviceFeature.last_value;
        let newValue = 0;
        /* eslint-disable no-await-in-loop */
        // We want this loops to be sequential
        for (let i = 0; i < blinkingTime; i += blinkingInterval) {
          newValue = 1 - newValue;
          await self.device.setValue(device, deviceFeature, newValue);
          await Promise.delay(blinkingInterval);
        }
        /* eslint-enable no-await-in-loop */
        await self.device.setValue(device, deviceFeature, oldValue);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.SWITCH.TURN_ON]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.SWITCH,
          DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        );
        await self.device.setValue(device, deviceFeature, 1);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.SWITCH.TURN_OFF]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.SWITCH,
          DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        );
        await self.device.setValue(device, deviceFeature, 0);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.SWITCH.TOGGLE]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.SWITCH,
          DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        );
        await self.device.setValue(device, deviceFeature, deviceFeature.last_value === 0 ? 1 : 0);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.TIME.DELAY]: async (self, action, scope) => {
    let { value } = action;

    // If the value should be calculated from a formula
    if (action.evaluate_value !== undefined) {
      try {
        value = evaluate(
          Handlebars.compile(action.evaluate_value, {
            noEscape: true,
          })(scope).replace(/\s/g, ''),
        );
      } catch (e) {
        logger.warn(`Delay: Error evaluating value: ${action.evaluate_value}`);
        logger.warn(e);
        throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
      }
    }

    if (Number.isNaN(Number(value))) {
      logger.warn(`Delay: Value is not a number: ${value}`);
      throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
    }

    // We convert the value to a number
    const valueInNumber = Number(value);

    let timeToWaitMilliseconds;

    switch (action.unit) {
      case 'milliseconds':
        timeToWaitMilliseconds = Math.round(valueInNumber);
        break;
      case 'seconds':
        timeToWaitMilliseconds = Math.round(valueInNumber * 1000);
        break;
      case 'minutes':
        timeToWaitMilliseconds = Math.round(valueInNumber * 1000 * 60);
        break;
      case 'hours':
        timeToWaitMilliseconds = Math.round(valueInNumber * 1000 * 60 * 60);
        break;
      default:
        throw new AbortScene(`Unit ${action.unit} not recognized`);
    }

    logger.debug(`Delay: Wait ${timeToWaitMilliseconds} milliseconds.`);

    await Promise.delay(timeToWaitMilliseconds);
  },

  [ACTIONS.SCENE.START]: async (self, action, scope) => {
    if (scope.alreadyExecutedScenes && scope.alreadyExecutedScenes.has(action.scene)) {
      logger.info(
        `It looks the scene "${action.scene}" has already been triggered in this chain. Preventing running again to avoid loops.`,
      );
      return;
    }
    // we clone the scope so that the new scene is not polluting
    // other scenes writing on the same scope: it needs to be a fresh object
    self.execute(action.scene, cloneDeep(scope));
  },
  [ACTIONS.MESSAGE.SEND]: async (self, action, scope) => {
    const textWithVariables = Handlebars.compile(action.text, {
      noEscape: true,
    })(scope);
    // no `service` on the action = historical behaviour: broadcast to every
    // channel the user has configured
    await self.message.sendToUser(action.user, textWithVariables, null, { service: action.service });
  },
  [ACTIONS.MESSAGE.SEND_CAMERA]: async (self, action, scope) => {
    const textWithVariables = Handlebars.compile(action.text, {
      noEscape: true,
    })(scope);
    const image = await self.device.camera.getLiveImage(action.camera);
    await self.message.sendToUser(action.user, textWithVariables, image, { service: action.service });
  },
  [ACTIONS.AI.ASK]: async (self, action, scope, path) => {
    const textWithVariables = Handlebars.compile(action.text, {
      noEscape: true,
    })(scope);
    let image;
    if (action.camera) {
      image = await self.device.camera.getLiveImage(action.camera);
      image = `data:${image}`;
    }
    const user = self.stateManager.get('user', action.user);
    const message = {
      source: 'AI',
      user: {
        id: user.id,
        language: user.language,
        selector: user.selector,
      },
      language: user.language,
      text: textWithVariables,
    };
    const { answer } = await self.gateway.forwardMessageToAiChat({
      message,
      image,
      context: {},
    });
    set(scope, path, { answer }, { merge: true });
  },
  [ACTIONS.DEVICE.GET_VALUE]: async (self, action, scope, path) => {
    const deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
    set(scope, path, cloneDeep(deviceFeature), { merge: true });
  },
  [ACTIONS.VARIABLE.SET]: async (self, action, scope, path) => {
    let value;

    // "text" and "evaluate_value" are mutually exclusive. The scene editor never sets both,
    // but an action written by hand could: in that case we cannot guess which one was meant,
    // so we fail closed instead of silently ignoring one of them.
    if (action.text !== undefined && action.evaluate_value !== undefined) {
      logger.warn('Set variable: "text" and "evaluate_value" cannot be used at the same time.');
      throw new AbortScene('VARIABLE_VALUE_AMBIGUOUS');
    }

    // If the value should be calculated from a formula
    if (action.evaluate_value !== undefined) {
      try {
        value = evaluate(
          Handlebars.compile(action.evaluate_value, {
            noEscape: true,
          })(scope).replace(/\s/g, ''),
        );
      } catch (e) {
        logger.warn(`Set variable: Error evaluating value: ${action.evaluate_value}`);
        logger.warn(e);
        throw new AbortScene('VARIABLE_VALUE_NOT_A_NUMBER');
      }
      // mathjs can return something which is not a usable number: a string, a matrix, or
      // Infinity when the formula overflows (1e309). The next actions expect a real number,
      // so anything else aborts the scene instead of storing an unusable variable.
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        logger.warn(`Set variable: Value is not a number: ${value}`);
        throw new AbortScene('VARIABLE_VALUE_NOT_A_NUMBER');
      }
    } else {
      // Otherwise, the text is a simple template which can contain other variables.
      // Like the formula branch, an invalid template aborts the scene: the following
      // actions rely on this variable being set.
      try {
        value = Handlebars.compile(action.text || '', {
          noEscape: true,
        })(scope);
      } catch (e) {
        logger.warn(`Set variable: Error rendering text: ${action.text}`);
        logger.warn(e);
        throw new AbortScene('VARIABLE_TEXT_NOT_VALID');
      }
      // A text which renders to a plain number ("123", or an injected numeric variable)
      // is stored as a number: "only continue if" compares strictly, so keeping the
      // string would make an equality between identical values fail (123 !== '123').
      const valueAsNumber = Number(value);
      if (value.trim() !== '' && Number.isFinite(valueAsNumber)) {
        value = valueAsNumber;
      }
    }

    set(scope, path, { value }, { merge: true });
  },
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: async (self, action, scope) => {
    let oneConditionVerified = false;
    action.conditions.forEach((condition) => {
      let { value } = condition;
      if (condition.evaluate_value !== undefined) {
        // If the formula cannot be evaluated, the condition cannot be trusted:
        // we abort the scene instead of silently letting the rest of the scene run.
        try {
          value = evaluate(
            Handlebars.compile(condition.evaluate_value, {
              noEscape: true,
            })(scope).replace(/\s/g, ''),
          );
        } catch (e) {
          logger.warn(`Continue only if: Error evaluating value: ${condition.evaluate_value}`);
          logger.warn(e);
          throw new AbortScene('CONDITION_VALUE_NOT_A_NUMBER');
        }
      }

      // For numeric comparison operators (>, >=, <, <=), value must be a number
      const numericOperators = ['>', '>=', '<', '<='];
      if (numericOperators.includes(condition.operator) && Number.isNaN(Number(value))) {
        throw new AbortScene('CONDITION_VALUE_NOT_A_NUMBER');
      }

      // removing brackets
      const variableWithoutBrackets = condition.variable.replace(/\[|\]/g, '');
      const conditionVerified = compare(condition.operator, get(scope, variableWithoutBrackets), value);
      if (conditionVerified) {
        oneConditionVerified = true;
      } else {
        logger.debug(
          `Condition not verified. Condition: "${get(scope, variableWithoutBrackets)} ${condition.operator} ${value}"`,
        );
      }
    });
    if (oneConditionVerified === false) {
      throw new AbortScene('CONDITION_NOT_VERIFIED');
    }
  },
  [ACTIONS.CONDITION.CHECK_TIME]: async (self, action, scope) => {
    const now = dayjs.tz(dayjs(), self.timezone);
    let beforeDate;
    let afterDate;
    let isBeforeCondition = true;
    let isAfterCondition = true;

    if (action.before) {
      beforeDate = dayjs.tz(`${now.format('YYYY-MM-DD')} ${action.before}`, self.timezone);
      isBeforeCondition = now.isBefore(beforeDate);
      if (!isBeforeCondition) {
        logger.debug(
          `Check time before: ${now.format('HH:mm')} < ${beforeDate.format('HH:mm')} condition is not verified.`,
        );
      } else {
        logger.debug(`Check time before: ${now.format('HH:mm')} < ${beforeDate.format('HH:mm')} condition is valid.`);
      }
    }
    if (action.after) {
      afterDate = dayjs.tz(`${now.format('YYYY-MM-DD')} ${action.after}`, self.timezone);
      isAfterCondition = now.isAfter(afterDate);
      if (!isAfterCondition) {
        logger.debug(
          `Check time after: ${now.format('HH:mm')} > ${afterDate.format('HH:mm')} condition is not verified.`,
        );
      } else {
        logger.debug(`Check time after: ${now.format('HH:mm')} > ${afterDate.format('HH:mm')} condition is valid.`);
      }
    }

    // if the afterDate is not before the beforeDate
    // It means the user is trying to do a cross-day time check
    // Example: AFTER 23:00 and BEFORE 8:00.
    // This means H > 23 OR h < 8
    // Putting a AND has no sense because it'll simply not work
    // Example: H > 23 AND H < 8 is always wrong.
    if (action.before && action.after && !afterDate.isBefore(beforeDate)) {
      // So the condition is a OR in this case
      const conditionVerified = isBeforeCondition || isAfterCondition;
      if (!conditionVerified) {
        throw new AbortScene('CONDITION_BEFORE_OR_AFTER_NOT_VERIFIED');
      } else {
        logger.debug(`Check time: Condition OR verified.`);
      }
    } else {
      // Otherwise, the condition is a AND
      const conditionVerified = isBeforeCondition && isAfterCondition;
      if (!conditionVerified) {
        throw new AbortScene('CONDITION_BEFORE_AND_AFTER_NOT_VERIFIED');
      } else {
        logger.debug(`Check time: Condition AND verified.`);
      }
    }
    if (action.days_of_the_week) {
      const currentDayOfTheWeek = now.format('dddd').toLowerCase();
      const isCurrentDayInCondition = action.days_of_the_week.indexOf(currentDayOfTheWeek) !== -1;
      if (!isCurrentDayInCondition) {
        logger.debug(
          `Condition isInDayOfWeek not verified. Current day of the week = ${currentDayOfTheWeek}. Allowed days = ${action.days_of_the_week.join(
            ',',
          )}`,
        );
        throw new AbortScene('CONDITION_IS_IN_DAYS_OF_WEEK_NOT_VERIFIED');
      }
    }
  },
  [ACTIONS.HOUSE.IS_EMPTY]: async (self, action) => {
    const houseEmpty = await self.house.isEmpty(action.house);
    if (!houseEmpty) {
      throw new AbortScene('HOUSE_IS_NOT_EMPTY');
    }
  },
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: async (self, action) => {
    const houseEmpty = await self.house.isEmpty(action.house);
    if (houseEmpty) {
      throw new AbortScene('HOUSE_IS_EMPTY');
    }
  },
  [ACTIONS.USER.SET_SEEN_AT_HOME]: async (self, action) => {
    await self.house.userSeen(action.house, action.user);
  },
  [ACTIONS.USER.SET_OUT_OF_HOME]: async (self, action) => {
    await self.house.userLeft(action.house, action.user);
  },
  [ACTIONS.HTTP.REQUEST]: async (self, action, scope, path) => {
    const headersObject = {};
    action.headers.forEach((header) => {
      if (header.key && header.value) {
        headersObject[header.key] = Handlebars.compile(header.value, {
          noEscape: true,
        })(scope);
      }
    });
    const urlWithVariables = Handlebars.compile(action.url, {
      noEscape: true,
    })(scope);
    // body can be empty
    const bodyWithVariables = action.body
      ? Handlebars.compile(action.body, {
          noEscape: true,
        })(scope)
      : undefined;
    const response = await self.http.request(
      action.method,
      urlWithVariables,
      parseJsonIfJson(bodyWithVariables),
      headersObject,
    );
    set(scope, path, response, { merge: true });
  },
  [ACTIONS.USER.CHECK_PRESENCE]: async (self, action) => {
    let deviceSeenRecently = false;
    // we want to see if a device was seen before now - XX minutes
    const thresholdDate = new Date(Date.now() - action.minutes * 60 * 1000);
    // foreach selected device
    action.device_features.forEach((deviceFeatureSelector) => {
      // we get the time when the device was last seen
      const deviceFeature = self.stateManager.get('deviceFeature', deviceFeatureSelector);
      // if it's recent, we save true
      if (deviceFeature.last_value_changed > thresholdDate) {
        deviceSeenRecently = true;
      }
    });
    // if no device was seen, the user has left home
    if (deviceSeenRecently === false) {
      logger.info(
        `CheckUserPresence action: No devices of the user "${action.user}" were seen in the last ${action.minutes} minutes.`,
      );
      logger.info(`CheckUserPresence action: Set "${action.user}" to left home of house "${action.house}"`);
      await self.house.userLeft(action.house, action.user);
    }
  },
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: async (self, action, scope, path) => {
    // find if one event match the condition
    const events = await self.calendar.findCurrentlyRunningEvent(
      action.calendars,
      action.calendar_event_name_comparator,
      action.calendar_event_name,
    );

    const atLeastOneEventFound = events.length > 0;
    // If one event was found, and the scene should be stopped in that case
    if (atLeastOneEventFound && action.stop_scene_if_event_found === true) {
      throw new AbortScene('EVENT_FOUND');
    }
    // If no event was found, and the scene should be stopped in that case
    if (!atLeastOneEventFound && action.stop_scene_if_event_not_found === true) {
      throw new AbortScene('EVENT_NOT_FOUND');
    }

    // set variable
    if (atLeastOneEventFound) {
      const eventRaw = events[0];
      const eventFormatted = {
        name: eventRaw.name,
        location: eventRaw.location,
        description: eventRaw.description,
        start: dayjs(eventRaw.start)
          .tz(self.timezone)
          .locale(eventRaw.calendar.creator.language)
          .format('LLL'),
        end: dayjs(eventRaw.end)
          .tz(self.timezone)
          .locale(eventRaw.calendar.creator.language)
          .format('LLL'),
      };
      set(
        scope,
        path,
        {
          calendarEvent: eventFormatted,
        },
        { merge: true },
      );
    }
  },
  [ACTIONS.ECOWATT.CONDITION]: async (self, action) => {
    try {
      const data = await self.gateway.getEcowattSignals();
      const todayDate = dayjs.tz(dayjs(), self.timezone).format('YYYY-MM-DD');
      const todayHour = dayjs.tz(dayjs(), self.timezone).hour();
      const todayLiveData = data.signals.find((day) => {
        const signalDate = dayjs(day.jour).format('YYYY-MM-DD');
        return todayDate === signalDate;
      });
      if (!todayLiveData) {
        throw new AbortScene('Ecowatt: day not found');
      }
      const currentHourNetworkStatus = todayLiveData.values.find((hour) => hour.pas === todayHour);
      if (!currentHourNetworkStatus) {
        throw new AbortScene('Ecowatt: hour not found');
      }
      const ECOWATT_STATUSES = {
        1: 'ok',
        2: 'warning',
        3: 'critical',
      };
      if (ECOWATT_STATUSES[currentHourNetworkStatus.hvalue] !== action.ecowatt_network_status) {
        throw new AbortScene('ECOWATT_DIFFERENT_STATUS');
      }
    } catch (e) {
      throw new AbortScene(e.message);
    }
  },
  [ACTIONS.EDF_TEMPO.CONDITION]: async (self, action) => {
    try {
      const edfTempoService = self.service.getService('edf-tempo');
      const data = await edfTempoService.getEdfTempoStates();
      let peakDayTypeValid;
      let peakHourTypeValid;
      if (action.edf_tempo_day === 'today') {
        peakDayTypeValid =
          action.edf_tempo_peak_day_type === data.today_peak_state || action.edf_tempo_peak_day_type === 'no-check';
        peakHourTypeValid =
          action.edf_tempo_peak_hour_type === data.current_hour_peak_state ||
          action.edf_tempo_peak_hour_type === 'no-check';
      } else {
        peakDayTypeValid =
          action.edf_tempo_peak_day_type === data.tomorrow_peak_state || action.edf_tempo_peak_day_type === 'no-check';
        peakHourTypeValid = true;
      }
      const conditionValid = peakDayTypeValid && peakHourTypeValid;
      if (!conditionValid) {
        throw new AbortScene('EDF_TEMPO_DIFFERENT_STATE');
      }
    } catch (e) {
      throw new AbortScene(e.message);
    }
  },
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: async (self, action) => {
    const house = await self.house.getBySelector(action.house);
    if (house.alarm_mode !== action.alarm_mode) {
      throw new AbortScene(`House "${house.name}" is not in mode ${action.alarm_mode}`);
    }
  },
  [ACTIONS.ALARM.SET_ALARM_MODE]: async (self, action) => {
    if (action.alarm_mode === ALARM_MODES.ARMED) {
      await self.house.arm(action.house, true);
    }
    if (action.alarm_mode === ALARM_MODES.DISARMED) {
      await self.house.disarm(action.house);
    }
    if (action.alarm_mode === ALARM_MODES.PARTIALLY_ARMED) {
      await self.house.partialArm(action.house);
    }
    if (action.alarm_mode === ALARM_MODES.PANIC) {
      await self.house.panic(action.house);
    }
  },
  [ACTIONS.MQTT.SEND]: (self, action, scope) => {
    const mqttService = self.service.getService('mqtt');

    if (mqttService) {
      const messageWithVariables = Handlebars.compile(action.message, {
        noEscape: true,
      })(scope);
      warnIfInvalidJsonMessage('MQTT', action.topic, messageWithVariables);
      mqttService.device.publish(action.topic, messageWithVariables);
    }
  },
  [ACTIONS.ZIGBEE2MQTT.SEND]: (self, action, scope) => {
    const zigbee2mqttService = self.service.getService('zigbee2mqtt');

    if (zigbee2mqttService) {
      const messageWithVariables = Handlebars.compile(action.message, {
        noEscape: true,
      })(scope);
      warnIfInvalidJsonMessage('Zigbee2mqtt', action.topic, messageWithVariables);
      zigbee2mqttService.device.publish(action.topic, messageWithVariables);
    }
  },
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: async (self, action, scope) => {
    // Get device
    const device = self.stateManager.get('device', action.device);
    const deviceFeature = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.MUSIC,
      DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION,
    );
    // replace variable in text
    const messageWithVariables = Handlebars.compile(action.text, { noEscape: true })(scope);
    // Get TTS URL
    const { url } = await self.gateway.getTTSApiUrl({ text: messageWithVariables });
    // Play TTS Notification on device
    await self.device.setValue(device, deviceFeature, url, { volume: action.volume });
  },
  [ACTIONS.SMS.SEND]: async (self, action, scope) => {
    const freeMobileService = self.service.getService('free-mobile');

    if (freeMobileService) {
      const textWithVariables = Handlebars.compile(action.text, { noEscape: true })(scope);
      freeMobileService.sms.send(textWithVariables);
    }
  },
  [ACTIONS.CONDITION.WHILE]: async (self, action, scope, path) => {
    const { if: conditionActions, then: loopActions } = action;
    const { executeAction, executeActions } = executeActionsFactory(actionsFunc);

    // Without conditions, the loop would run until the max iterations safety limit
    if (!conditionActions || conditionActions.length === 0) {
      throw new AbortScene('WHILE_CONDITION_EMPTY');
    }

    // A loop with an empty body would only burn iterations doing nothing
    const numberOfActionsInLoop = (loopActions || []).reduce((acc, group) => acc + group.length, 0);
    if (numberOfActionsInLoop === 0) {
      throw new AbortScene('WHILE_ACTIONS_EMPTY');
    }

    const maxIterations = Math.min(
      action.max_iterations !== undefined ? action.max_iterations : WHILE_DEFAULT_MAX_ITERATIONS,
      WHILE_ABSOLUTE_MAX_ITERATIONS,
    );

    const verifyConditions = async () => {
      try {
        // Unlike "if-then-else", conditions are executed in serie: it allows a "device.get-value"
        // placed before a condition to refresh the scope with the live value of the device
        // on each iteration, instead of comparing a value read once before the loop.
        // The path matches the path used by the scene editor, so variables can be re-used.
        await Promise.mapSeries(conditionActions, (conditionAction, index) =>
          executeAction(self, conditionAction, scope, `${path}.if.${index}`, { throwUnknownError: true }),
        );
        return true;
      } catch (e) {
        if (e instanceof AbortScene) {
          return false;
        }
        throw e;
      }
    };

    let iterations = 0;
    /* eslint-disable no-await-in-loop */
    // Iterations are sequential by design: conditions are re-evaluated before each one.
    // The max iterations limit is checked first, so conditions are never evaluated
    // one extra time after the last allowed iteration.
    while (iterations < maxIterations) {
      if (!(await verifyConditions())) {
        // Conditions are not verified anymore: this is the normal end of the loop
        return;
      }
      const iterationStartTime = Date.now();
      await executeActions(self, loopActions, scope, `${path}.then`);
      iterations += 1;
      // Safety: prevent CPU-intensive tight loops when the executed actions are instantaneous
      const iterationDuration = Date.now() - iterationStartTime;
      if (iterationDuration < WHILE_MIN_ITERATION_TIME_MS) {
        await Promise.delay(WHILE_MIN_ITERATION_TIME_MS - iterationDuration);
      }
    }
    /* eslint-enable no-await-in-loop */
    logger.warn(`While loop: max number of iterations reached (${maxIterations}), stopping the loop.`);
  },
  [ACTIONS.CONDITION.IF_THEN_ELSE]: async (self, action, scope, path) => {
    const { if: ifActions, then: thenActions, else: elseActions } = action;
    const { executeAction, executeActions } = executeActionsFactory(actionsFunc);

    // verify the conditions
    let conditionsVerified;
    try {
      // Conditions are executed in parallel, but each one writes in the scope at the path
      // used by the scene editor, so a variable declared by a condition (for example the
      // event of a "calendar.is-event-running") can be re-used in the branches.
      await Promise.map(ifActions, (ifAction, index) =>
        executeAction(self, ifAction, scope, `${path}.if.${index}`, { throwUnknownError: true }),
      );
      conditionsVerified = true;
    } catch (e) {
      if (e instanceof AbortScene) {
        conditionsVerified = false;
      } else {
        throw e;
      }
    }
    // Execute the correct branch of actions
    if (conditionsVerified) {
      await executeActions(self, thenActions, scope, `${path}.then`);
    } else {
      await executeActions(self, elseActions, scope, `${path}.else`);
    }
  },
};

module.exports = actionsFunc;
