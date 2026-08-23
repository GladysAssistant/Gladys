const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isRuntimeVariableKey } = require('../lib/thermostat.setVariable');

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
    const schedules = await thermostatHandler.getSchedules();
    res.json(schedules);
  }

  /**
   * @api {post} /api/v1/service/thermostat/schedule Create a schedule
   * @apiName createSchedule
   * @apiGroup Thermostat
   */
  async function createSchedule(req, res) {
    const schedule = await thermostatHandler.createSchedule(req.body);
    res.json(schedule);
  }

  /**
   * @api {patch} /api/v1/service/thermostat/schedule/:selector Update a schedule
   * @apiName updateSchedule
   * @apiGroup Thermostat
   */
  async function updateSchedule(req, res) {
    const schedule = await thermostatHandler.updateSchedule(req.params.selector, req.body);
    res.json(schedule);
  }

  /**
   * @api {delete} /api/v1/service/thermostat/schedule/:selector Delete a schedule
   * @apiName deleteSchedule
   * @apiGroup Thermostat
   */
  async function deleteSchedule(req, res) {
    await thermostatHandler.deleteSchedule(req.params.selector);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/service/thermostat/setpoint/:feature_selector Set thermostat setpoint
   * @apiName setSetpoint
   * @apiGroup Thermostat
   */
  async function setSetpoint(req, res) {
    const featureSelector = req.params.feature_selector;
    // Number('') and Number(null) are both 0, so the raw value has to be
    // rejected before coercion: an empty body would otherwise be accepted as a
    // manual hold at 0 °C.
    const rawValue = req.body ? req.body.value : undefined;
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      res.status(400).json({ error: 'INVALID_VALUE' });
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      res.status(400).json({ error: 'INVALID_VALUE' });
      return;
    }
    // Only a thermostat setpoint owned by this service may be written here.
    // Without this check any authenticated user could persist a value on a lock,
    // a cover or a light just by naming its selector.
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
      return false;
    });
    if (!deviceFeature) {
      res.status(404).json({ error: 'FEATURE_NOT_FOUND' });
      return;
    }
    // Go through setValue so the widget, the API and scenes share one path.
    await thermostatHandler.setValue(device, deviceFeature, value);
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
    const variable = await thermostatHandler.setVariable(req.params.variable_key, req.body.value);
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
