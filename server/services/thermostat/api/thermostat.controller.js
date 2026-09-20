const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isRuntimeVariableKey } = require('../lib/thermostat.setVariable');
const { getFeatureBySelector } = require('../lib/thermostat.deviceConfig');

// The schedule routes report their failures by code rather than by message: the
// front picks the translation, and "not found" and "already taken" are ordinary
// outcomes of a form, not server errors.
const SCHEDULE_ERRORS = [
  { match: /^Schedule not found/, status: 404, error: 'SCHEDULE_NOT_FOUND' },
  { match: /^House not found/, status: 404, error: 'HOUSE_NOT_FOUND' },
  { match: /^Device not found/, status: 404, error: 'DEVICE_NOT_FOUND' },
  { match: /already exists$/, status: 409, error: 'SCHEDULE_NAME_ALREADY_EXISTS' },
  { match: /^Device is not a thermostat/, status: 400, error: 'NOT_A_THERMOSTAT' },
  { match: /^Device is not in the house/, status: 400, error: 'DEVICE_NOT_IN_HOUSE' },
  { match: /^Invalid thermostat schedule: duplicate transition/, status: 400, error: 'DUPLICATE_TRANSITION' },
  { match: /^Invalid thermostat schedule/, status: 400, error: 'INVALID_SCHEDULE' },
];

/**
 * @description Turn a schedule error into its HTTP status and code, so a bad
 * name or an unknown house reads as a 4xx the front can translate instead of a
 * 500 that looks like a crash.
 * @param {Error} e - The error thrown by the handler.
 * @param {object} res - The Express response.
 * @returns {boolean} True when the error was handled, false to rethrow it.
 * @example
 * try { await handler.createSchedule(...); } catch (e) { if (!sendScheduleError(e, res)) throw e; }
 */
function sendScheduleError(e, res) {
  const known = SCHEDULE_ERRORS.find((candidate) => candidate.match.test(e.message));
  if (!known) {
    return false;
  }
  res.status(known.status).json({ error: known.error, message: e.message });
  return true;
}

module.exports = function ThermostatController(thermostatHandler) {
  /**
   * @api {get} /api/v1/service/thermostat/device Get thermostat devices
   * @apiName getDevices
   * @apiGroup Thermostat
   */
  async function getDevices(req, res) {
    const devices = await thermostatHandler.getDevices({
      search: req.query.search,
      order_dir: req.query.order_dir,
    });
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/thermostat/device Create thermostat device
   * @apiName createDevice
   * @apiGroup Thermostat
   */
  async function createDevice(req, res) {
    const device = await thermostatHandler.createDevice(req.body);
    res.json(device);
  }

  /**
   * @api {get} /api/v1/service/thermostat/schedule Get all schedules
   * @apiName getSchedules
   * @apiGroup Thermostat
   */
  async function getSchedules(req, res) {
    const schedules = await thermostatHandler.getSchedules(req.query.house);
    res.json(schedules);
  }

  /**
   * @api {get} /api/v1/service/thermostat/schedule/:selector Get one schedule
   * @apiName getSchedule
   * @apiGroup Thermostat
   */
  async function getSchedule(req, res) {
    try {
      res.json(await thermostatHandler.getScheduleBySelector(req.params.selector));
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {post} /api/v1/service/thermostat/schedule Create a schedule
   * @apiName createSchedule
   * @apiGroup Thermostat
   */
  async function createSchedule(req, res) {
    try {
      const { house, ...scheduleData } = req.body || {};
      res.json(await thermostatHandler.createSchedule(house, scheduleData));
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {patch} /api/v1/service/thermostat/schedule/:selector Update a schedule
   * @apiName updateSchedule
   * @apiGroup Thermostat
   */
  async function updateSchedule(req, res) {
    try {
      res.json(await thermostatHandler.updateSchedule(req.params.selector, req.body));
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {delete} /api/v1/service/thermostat/schedule/:selector Delete a schedule
   * @apiName deleteSchedule
   * @apiGroup Thermostat
   */
  async function deleteSchedule(req, res) {
    try {
      await thermostatHandler.deleteSchedule(req.params.selector);
      res.json({ success: true });
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {put} /api/v1/service/thermostat/schedule/:selector/device/:device_selector Follow a schedule
   * @apiName attachScheduleToDevice
   * @apiGroup Thermostat
   * @apiDescription Makes that thermostat follow this schedule, replacing the one
   * it followed. Idempotent.
   */
  async function attachScheduleToDevice(req, res) {
    try {
      await thermostatHandler.attachScheduleToDevice(req.params.selector, req.params.device_selector);
      res.json({ success: true });
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {delete} /api/v1/service/thermostat/schedule/:selector/device/:device_selector Stop following
   * @apiName detachScheduleFromDevice
   * @apiGroup Thermostat
   */
  async function detachScheduleFromDevice(req, res) {
    try {
      await thermostatHandler.detachScheduleFromDevice(req.params.selector, req.params.device_selector);
      res.json({ success: true });
    } catch (e) {
      if (!sendScheduleError(e, res)) {
        throw e;
      }
    }
  }

  /**
   * @api {post} /api/v1/service/thermostat/setpoint/:feature_selector Set thermostat setpoint
   * @apiName setSetpoint
   * @apiGroup Thermostat
   */
  async function setSetpoint(req, res) {
    const featureSelector = req.params.feature_selector;
    // Number() turns '', ' ', false and [] into 0, so the raw value has to be
    // narrowed before coercion: any of them would otherwise be accepted as a
    // manual hold at 0 °C. Only a number or a non-blank string may go through.
    const rawValue = req.body ? req.body.value : undefined;
    const isNumber = typeof rawValue === 'number';
    const isNumericString = typeof rawValue === 'string' && rawValue.trim() !== '';
    if (!isNumber && !isNumericString) {
      res.status(400).json({ error: 'INVALID_VALUE' });
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      res.status(400).json({ error: 'INVALID_VALUE' });
      return;
    }
    // Only a setpoint this service regulates may be written here. Without this
    // check any authenticated user could persist a value on a lock, a cover or
    // a light just by naming its selector.
    //
    // For a virtual thermostat that means a target-temperature feature of one of
    // this service's own devices. An external thermostat owns no feature — its
    // setpoint belongs to Netatmo, Zigbee, Matter... — so the accepted selector
    // is the THERMOSTAT_TARGET_FEATURE the user configured on the integration
    // page. The guard is just as narrow: an arbitrary selector still matches
    // nothing, only a feature deliberately wired to a thermostat is reachable.
    const devices = await thermostatHandler.getDevices({});
    let device = null;
    let deviceFeature = null;
    devices.some((candidate) => {
      const found = (candidate.features || []).find(
        (feature) =>
          feature.selector === featureSelector &&
          feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
          feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      );
      if (found) {
        device = candidate;
        deviceFeature = found;
        return true;
      }
      const target = (candidate.params || []).find(
        (param) => param.name === 'THERMOSTAT_TARGET_FEATURE' && param.value === featureSelector,
      );
      if (target) {
        device = candidate;
        return true;
      }
      return false;
    });
    if (!device) {
      res.status(404).json({ error: 'FEATURE_NOT_FOUND' });
      return;
    }
    if (!deviceFeature) {
      // External: resolve the real device and its feature, so setValue writes
      // through the owning integration rather than on a feature of ours.
      const external = await getFeatureBySelector(thermostatHandler.gladys, featureSelector);
      if (!external) {
        res.status(404).json({ error: 'FEATURE_NOT_FOUND' });
        return;
      }
      // setValue needs the thermostat device for its config (manual duration,
      // active schedule), but the feature of the real device to write on.
      await thermostatHandler.setValue(device, external.feature, value, req.body.manual !== false);
      res.json({ success: true, value });
      return;
    }
    // Go through setValue so the widget, the API and scenes share one path.
    // `manual: false` is how the widget writes back the scheduled setpoint when a
    // hold ends: without it the write would immediately re-arm the very override
    // it is clearing. Anything else — a scene, the generic API, the dial — means
    // a manual override, so that stays the default.
    const manual = req.body.manual !== false;
    await thermostatHandler.setValue(device, deviceFeature, value, manual);
    res.json({ success: true, value });
  }

  /**
   * @api {post} /api/v1/service/thermostat/state/:variable_key Set a thermostat runtime variable
   * @apiName setVariable
   * @apiGroup Thermostat
   * @apiDescription Sets a THERMOSTAT_* runtime variable (preset, manual override),
   * broadcasts the matching websocket message and schedules an immediate regulation
   * pass. The path is "state" rather than "variable" because the core already mounts
   * `/api/v1/service/:service_name/variable/:variable_key`, which would shadow it.
   * The configuration is not writable here: it lives on the device.
   */
  async function setVariable(req, res) {
    if (!isRuntimeVariableKey(req.params.variable_key)) {
      res.status(400).json({ error: 'INVALID_VARIABLE_KEY' });
      return;
    }
    // The variable table stores text: an object would reach `variable.setValue`
    // as-is and come back out as "[object Object]" on the next read.
    const rawValue = req.body ? req.body.value : undefined;
    if (typeof rawValue !== 'string') {
      res.status(400).json({ error: 'INVALID_VALUE' });
      return;
    }
    // The key must name a feature this service owns; the shape check above only
    // covers the prefix and the suffix.
    const owned = await thermostatHandler.resolveRuntimeVariableKey(req.params.variable_key);
    if (!owned) {
      res.status(404).json({ error: 'FEATURE_NOT_FOUND' });
      return;
    }
    const variable = await thermostatHandler.setVariable(req.params.variable_key, rawValue);
    res.json(variable);
  }

  /**
   * @api {get} /api/v1/service/thermostat/state/:variable_key Get a thermostat runtime variable
   * @apiName getVariable
   * @apiGroup Thermostat
   * @apiDescription Reads a THERMOSTAT_* runtime variable in this service's scope,
   * so the widget reads exactly the rows the regulation loop writes.
   */
  async function getVariable(req, res) {
    if (!isRuntimeVariableKey(req.params.variable_key)) {
      res.status(400).json({ error: 'INVALID_VARIABLE_KEY' });
      return;
    }
    const value = await thermostatHandler.getVariable(req.params.variable_key);
    if (value === null || value === undefined) {
      res.status(404).json({ error: 'VARIABLE_NOT_FOUND' });
      return;
    }
    res.json({ value });
  }

  /**
   * @api {post} /api/v1/service/thermostat/apply-schedules Trigger a regulation pass
   * @apiName applySchedules
   * @apiGroup Thermostat
   * @apiDescription Runs a debounced regulation pass so a configuration change
   * takes effect immediately instead of on the next minute tick.
   */
  async function applySchedules(req, res) {
    // The caller just changed a device's configuration: tell the open dashboards
    // to reload it, then regulate on it without waiting for the next minute tick.
    thermostatHandler.broadcastConfigUpdated();
    thermostatHandler.triggerApplySchedules();
    res.json({ success: true });
  }

  return {
    'post /api/v1/service/thermostat/apply-schedules': {
      authenticated: true,
      controller: asyncMiddleware(applySchedules),
    },
    'get /api/v1/service/thermostat/device': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'post /api/v1/service/thermostat/device': {
      authenticated: true,
      controller: asyncMiddleware(createDevice),
    },
    'get /api/v1/service/thermostat/schedule': {
      authenticated: true,
      controller: asyncMiddleware(getSchedules),
    },
    'post /api/v1/service/thermostat/schedule': {
      authenticated: true,
      controller: asyncMiddleware(createSchedule),
    },
    'get /api/v1/service/thermostat/schedule/:selector': {
      authenticated: true,
      controller: asyncMiddleware(getSchedule),
    },
    'put /api/v1/service/thermostat/schedule/:selector/device/:device_selector': {
      authenticated: true,
      controller: asyncMiddleware(attachScheduleToDevice),
    },
    'delete /api/v1/service/thermostat/schedule/:selector/device/:device_selector': {
      authenticated: true,
      controller: asyncMiddleware(detachScheduleFromDevice),
    },
    'patch /api/v1/service/thermostat/schedule/:selector': {
      authenticated: true,
      controller: asyncMiddleware(updateSchedule),
    },
    'delete /api/v1/service/thermostat/schedule/:selector': {
      authenticated: true,
      controller: asyncMiddleware(deleteSchedule),
    },
    'post /api/v1/service/thermostat/setpoint/:feature_selector': {
      authenticated: true,
      controller: asyncMiddleware(setSetpoint),
    },
    'post /api/v1/service/thermostat/state/:variable_key': {
      authenticated: true,
      controller: asyncMiddleware(setVariable),
    },
    'get /api/v1/service/thermostat/state/:variable_key': {
      authenticated: true,
      controller: asyncMiddleware(getVariable),
    },
  };
};
