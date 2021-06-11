const Promise = require('bluebird');
const Handlebars = require('handlebars');
const cloneDeep = require('lodash.clonedeep');
const set = require('set-value');
const get = require('get-value');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');
const { getDeviceFeature } = require('../../utils/device');
const { AbortScene } = require('../../utils/coreErrors');
const { compare } = require('../../utils/compare');
const { parseJsonIfJson } = require('../../utils/json');
const logger = require('../../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

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
    return self.device.setValue(device, deviceFeature, action.value);
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
  [ACTIONS.DEVICE.GET_VALUE]: async (self, action, scope, columnIndex, rowIndex) => {
    const deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
    set(scope, `${columnIndex}.${rowIndex}`, deviceFeature);
  },
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: async (self, action, scope) => {
    let oneConditionVerified = false;
    action.conditions.forEach((condition) => {
      const conditionVerified = compare(condition.operator, get(scope, condition.variable), condition.value);
      if (conditionVerified) {
        oneConditionVerified = true;
      } else {
        logger.debug(
          `Condition not verified. Condition: "${get(scope, condition.variable)} ${condition.operator} ${
            condition.value
          }"`,
        );
      }
    });
    if (oneConditionVerified === false) {
      throw new AbortScene('CONDITION_NOT_VERIFIED');
    }
  },
  [ACTIONS.CONDITION.CHECK_TIME]: async (self, action, scope) => {
    const now = dayjs.tz(dayjs(), self.timezone);
    if (action.before) {
      const beforeDate = dayjs.tz(`${now.format('YYYY-MM-DD')} ${action.before}`, self.timezone);
      const isBeforeCondition = now.isBefore(beforeDate);
      if (!isBeforeCondition) {
        logger.debug(
          `Check time before: ${now.format('HH:mm')} > ${beforeDate.format('HH:mm')} condition is not verified.`,
        );
        throw new AbortScene('CONDITION_IS_BEFORE_HOUR_NOT_VERIFIED');
      } else {
        logger.debug(`Check time before: ${now.format('HH:mm')} < ${beforeDate.format('HH:mm')} condition is valid.`);
      }
    }
    if (action.after) {
      const afterDate = dayjs.tz(`${now.format('YYYY-MM-DD')} ${action.after}`, self.timezone);
      const isAfterCondition = now.isAfter(afterDate);
      if (!isAfterCondition) {
        logger.debug(
          `Check time after: ${now.format('HH:mm')} > ${afterDate.format('HH:mm')} condition is not verified.`,
        );
        throw new AbortScene('CONDITION_IS_AFTER_HOUR_NOT_VERIFIED');
      } else {
        logger.debug(`Check time after: ${now.format('HH:mm')} > ${afterDate.format('HH:mm')} condition is valid.`);
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
    set(scope, `${columnIndex}.${rowIndex}`, response);
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
};

module.exports = {
  actionsFunc,
};
