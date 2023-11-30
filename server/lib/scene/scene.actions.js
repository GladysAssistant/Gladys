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
  roundDependencies,
  smallerDependencies,
  smallerEqDependencies,
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

dayjs.extend(utc);
dayjs.extend(timezone);

const { evaluate } = create({
  addDependencies,
  divideDependencies,
  evaluateDependencies,
  largerDependencies,
  smallerDependencies,
  largerEqDependencies,
  modDependencies,
  smallerEqDependencies,
  roundDependencies,
});

const actionsFunc = {
  [ACTIONS.DEVICE.SET_VALUE]: async (self, action, scope, columnIndex, rowIndex) => {
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
    if (action.evaluate_value !== undefined) {
      value = evaluate(Handlebars.compile(action.evaluate_value)(scope).replace(/\s/g, ''));
    }

    if (Number.isNaN(Number(value))) {
      throw new AbortScene('ACTION_VALUE_NOT_A_NUMBER');
    }

    return self.device.setValue(device, deviceFeature, value);
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
  [ACTIONS.TIME.DELAY]: async (self, action, scope) =>
    new Promise((resolve) => {
      let timeToWaitMilliseconds;
      switch (action.unit) {
        case 'milliseconds':
          timeToWaitMilliseconds = action.value;
          break;
        case 'seconds':
          timeToWaitMilliseconds = action.value * 1000;
          break;
        case 'minutes':
          timeToWaitMilliseconds = action.value * 1000 * 60;
          break;
        case 'hours':
          timeToWaitMilliseconds = action.value * 1000 * 60 * 60;
          break;
        default:
          throw new Error(`Unit ${action.unit} not recognized`);
      }
      setTimeout(resolve, timeToWaitMilliseconds);
    }),
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
    const textWithVariables = Handlebars.compile(action.text)(scope);
    await self.message.sendToUser(action.user, textWithVariables);
  },
  [ACTIONS.MESSAGE.SEND_CAMERA]: async (self, action, scope) => {
    const textWithVariables = Handlebars.compile(action.text)(scope);
    const image = await self.device.camera.getLiveImage(action.camera);
    await self.message.sendToUser(action.user, textWithVariables, image);
  },
  [ACTIONS.DEVICE.GET_VALUE]: async (self, action, scope, columnIndex, rowIndex) => {
    const deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
    set(
      scope,
      `${columnIndex}`,
      {
        [rowIndex]: cloneDeep(deviceFeature),
      },
      { merge: true },
    );
  },
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: async (self, action, scope) => {
    let oneConditionVerified = false;
    action.conditions.forEach((condition) => {
      let { value } = condition;
      if (condition.evaluate_value !== undefined) {
        value = evaluate(Handlebars.compile(condition.evaluate_value)(scope).replace(/\s/g, ''));
      }

      if (Number.isNaN(Number(value))) {
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
  [ACTIONS.HTTP.REQUEST]: async (self, action, scope, columnIndex, rowIndex) => {
    const headersObject = {};
    action.headers.forEach((header) => {
      if (header.key && header.value) {
        headersObject[header.key] = Handlebars.compile(header.value)(scope);
      }
    });
    const urlWithVariables = Handlebars.compile(action.url)(scope);
    // body can be empty
    const bodyWithVariables = action.body ? Handlebars.compile(action.body)(scope) : undefined;
    const response = await self.http.request(
      action.method,
      urlWithVariables,
      parseJsonIfJson(bodyWithVariables),
      headersObject,
    );
    set(
      scope,
      `${columnIndex}`,
      {
        [rowIndex]: response,
      },
      { merge: true },
    );
  },
  [ACTIONS.USER.CHECK_PRESENCE]: async (self, action, scope, columnIndex, rowIndex) => {
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
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: async (self, action, scope, columnIndex, rowIndex) => {
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
        `${columnIndex}`,
        {
          [rowIndex]: {
            calendarEvent: eventFormatted,
          },
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
      const messageWithVariables = Handlebars.compile(action.message)(scope);
      mqttService.device.publish(action.topic, messageWithVariables);
    }
  },
};

module.exports = {
  actionsFunc,
};
