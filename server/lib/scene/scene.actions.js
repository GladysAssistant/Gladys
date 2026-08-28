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
const { AbortScene, SceneStopped } = require('../../utils/coreErrors');
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

// Formats of the "date" variable of the "get date" action, by precision.
// The date/time is truncated to the chosen precision, so a scene displaying "it's 14:30"
// doesn't end up saying "it's 14:30:27.412".
const GET_DATE_FORMATS = {
  second: 'YYYY-MM-DD HH:mm:ss',
  minute: 'YYYY-MM-DD HH:mm',
  hour: 'YYYY-MM-DD HH:00',
  day: 'YYYY-MM-DD',
};
const GET_DATE_TIME_FORMATS = {
  second: 'HH:mm:ss',
  minute: 'HH:mm',
  hour: 'HH:00',
  day: 'HH:mm',
};
const GET_DATE_DEFAULT_PRECISION = 'minute';

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

    // A text feature (a message displayed on a TV, a text virtual sensor, a select among
    // string values discovered on the appliance...) receives the value as a raw string with
    // scene variables injected, and skips the math evaluation below which would reject any
    // non-numeric text
    if (
      deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
      (deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.TEXT || deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.SELECT)
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

    const { abortSignal } = scope;
    // Abortable wait: resolves after the delay, or rejects immediately if the
    // scene is stopped while waiting (so a long "delay" can be interrupted).
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, timeToWaitMilliseconds);
      if (!abortSignal) {
        return;
      }
      // An already-aborted signal never fires its 'abort' listeners, so re-check
      // before subscribing.
      if (abortSignal.aborted) {
        clearTimeout(timer);
        reject(new SceneStopped('SCENE_STOPPED'));
        return;
      }
      abortSignal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new SceneStopped('SCENE_STOPPED'));
        },
        { once: true },
      );
    });
  },

  [ACTIONS.SCENE.START]: async (self, action, scope) => {
    if (scope.alreadyExecutedScenes && scope.alreadyExecutedScenes.has(action.scene)) {
      logger.info(
        `It looks the scene "${action.scene}" has already been triggered in this chain. Preventing running again to avoid loops.`,
      );
      return;
    }
    // we clone the scope so that the new scene is not polluting
    // other scenes writing on the same scope: it needs to be a fresh object.
    // The signal is dropped rather than deep-cloned, execute() gives the child
    // its own.
    const { abortSignal, ...scopeToClone } = scope;
    self.execute(action.scene, cloneDeep(scopeToClone));
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
  [ACTIONS.TIME.GET_DATE]: async (self, action, scope, path) => {
    // Only an absent precision falls back to the default: a precision explicitly set to
    // an empty/falsy value is not a supported precision, so it must abort the scene below.
    const precision = action.precision === undefined ? GET_DATE_DEFAULT_PRECISION : action.precision;
    const dateFormat = GET_DATE_FORMATS[precision];
    // An action written by hand (or coming from an older/newer version of Gladys) could
    // contain a precision we don't know: we abort instead of storing an unusable date.
    if (dateFormat === undefined) {
      logger.warn(`Get date: Unknown precision "${precision}".`);
      throw new AbortScene('INVALID_PRECISION');
    }
    // The date is returned in the timezone configured by the user, so a scene displays
    // the local time and not the time of the server.
    const now = dayjs.tz(dayjs(), self.timezone).startOf(precision);
    set(
      scope,
      path,
      {
        datetime: now.format(dateFormat),
        date: now.format('YYYY-MM-DD'),
        time: now.format(GET_DATE_TIME_FORMATS[precision]),
        // Unix timestamp in seconds, so it can be compared/subtracted in a formula
        // to another date stored earlier (in a variable or in a device feature).
        // It is truncated like the other variables, so that the 4 of them always describe
        // the same instant: a formula needing an exact date should use the "second" precision.
        timestamp: now.unix(),
      },
      { merge: true },
    );
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
  [ACTIONS.CALENDAR.GET_EVENTS]: async (self, action, scope, path) => {
    const now = dayjs.tz(dayjs(), self.timezone);
    let from;
    let to;
    // The day ranges are calendar days, the "next x hours" range is a rolling time window.
    let dayRange = false;
    // eslint-disable-next-line default-case
    switch (action.time_range) {
      case 'today':
        from = now.startOf('day');
        to = now.endOf('day');
        dayRange = true;
        break;
      case 'tomorrow':
        from = now.add(1, 'day').startOf('day');
        to = now.add(1, 'day').endOf('day');
        dayRange = true;
        break;
      case 'next-x-hours':
        // dayjs.add(undefined) returns an invalid date and dayjs.add(null) an empty
        // range, so the duration is validated before building the range.
        if (!Number.isInteger(action.duration) || action.duration < 1) {
          throw new AbortScene('INVALID_DURATION');
        }
        from = now;
        to = now.add(action.duration, 'hour');
        break;
    }
    if (!from || !to) {
      throw new AbortScene('INVALID_TIME_RANGE');
    }

    // Full-day events are stored at midnight UTC, so on a calendar day range they are
    // matched on the UTC days covered by the range instead of its local bounds. Otherwise
    // a full-day event of the day is missed in the timezones west of UTC (and the one of
    // the next day returned instead).
    let fullDayFrom;
    let fullDayTo;
    if (dayRange) {
      fullDayFrom = dayjs.utc(from.format('YYYY-MM-DD')).toDate();
      fullDayTo = dayjs
        .utc(to.format('YYYY-MM-DD'))
        .endOf('day')
        .toDate();
    }

    const events = await self.calendar.findEventsInRange(
      action.calendars,
      from.toDate(),
      to.toDate(),
      fullDayFrom,
      fullDayTo,
    );

    if (events.length === 0 && action.stop_scene_if_no_events === true) {
      throw new AbortScene('NO_EVENTS_FOUND');
    }

    // Small translation map for the generated summary sentence, as the
    // server has no i18n system. Falls back to english.
    const AT_TRANSLATIONS = {
      en: 'at',
      fr: 'à',
      de: 'um',
    };

    const eventsFormatted = events.map((eventRaw) => {
      const language = get(eventRaw, 'calendar.creator.language') || 'en';
      const startDayjs = dayjs(eventRaw.start)
        .tz(self.timezone)
        .locale(language);
      let summary;
      if (eventRaw.full_day) {
        summary = eventRaw.name;
      } else {
        // Events starting on the same day as the range are announced with the
        // time only, events further away with the full date.
        const startFormatted = startDayjs.isSame(from, 'day') ? startDayjs.format('LT') : startDayjs.format('LLL');
        summary = `${eventRaw.name} ${AT_TRANSLATIONS[language] || AT_TRANSLATIONS.en} ${startFormatted}`;
      }
      return {
        name: eventRaw.name,
        location: eventRaw.location,
        description: eventRaw.description,
        start: startDayjs.format('LLL'),
        end: eventRaw.end
          ? dayjs(eventRaw.end)
              .tz(self.timezone)
              .locale(language)
              .format('LLL')
          : null,
        summary,
      };
    });

    // The list of events is an array of objects, so injecting it directly in a message gives
    // an unreadable result. A ready-to-use multi-line list, with one line per event, is
    // exposed as well so the events can be sent to the user without iterating over the array.
    const textDetailed = eventsFormatted
      .map((event) => (event.location ? `- ${event.summary} (${event.location})` : `- ${event.summary}`))
      .join('\n');

    set(
      scope,
      path,
      {
        calendarEvents: {
          text: eventsFormatted.map((event) => event.summary).join(', '),
          textDetailed,
          count: eventsFormatted.length,
          events: eventsFormatted,
        },
      },
      { merge: true },
    );
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

    let { volume } = action;

    // The volume can also be a formula based on scene variables, so an announcement can be
    // played quieter in the evening for example.
    if (action.evaluate_volume !== undefined) {
      try {
        volume = evaluate(
          Handlebars.compile(action.evaluate_volume, {
            noEscape: true,
          })(scope).replace(/\s/g, ''),
        );
      } catch (e) {
        logger.warn(`Play notification: Error evaluating volume: ${action.evaluate_volume}`);
        logger.warn(e);
        throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
      }
      // mathjs can return something which is not a usable number: a string, a matrix, or
      // Infinity when the formula overflows. The speaker services expect a real number.
      if (typeof volume !== 'number' || !Number.isFinite(volume)) {
        logger.warn(`Play notification: Volume is not a number: ${volume}`);
        throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
      }
      // The volume is a percentage: a formula going out of bounds is clamped instead of
      // being sent as-is to the speaker.
      volume = Math.min(100, Math.max(0, Math.round(volume)));
    }

    // Get TTS URL
    const { url } = await self.gateway.getTTSApiUrl({ text: messageWithVariables });
    // Play TTS Notification on device
    await self.device.setValue(device, deviceFeature, url, { volume });
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
        if (e instanceof AbortScene && !(e instanceof SceneStopped)) {
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
      if (e instanceof AbortScene && !(e instanceof SceneStopped)) {
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
