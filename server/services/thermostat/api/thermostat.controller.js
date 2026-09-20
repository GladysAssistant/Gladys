const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

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

  return {
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
  };
};
