const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { BadParameters } = require('../../utils/coreErrors');

module.exports = function DeviceController(gladys) {
  /**
   * @api {get} /api/v1/device/:device_selector getBySelector
   * @apiName getBySelector
   * @apiGroup Device
   */
  async function getBySelector(req, res) {
    const device = gladys.device.getBySelector(req.params.device_selector);
    res.json(device);
  }

  /**
   * @api {get} /api/v1/device get
   * @apiName get
   * @apiGroup Device
   */
  async function get(req, res) {
    const devices = await gladys.device.get(req.query);
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/:service_name/device getDevicesByService
   * @apiName getDevicesByService
   * @apiGroup Device
   */
  async function getDevicesByService(req, res) {
    const params = {
      ...req.query,
      service: req.params.service_name,
    };
    const devices = await gladys.device.get(params);
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/device create
   * @apiName create
   * @apiGroup Device
   */
  async function create(req, res) {
    const device = await gladys.device.create(req.body);
    res.json(device);
  }

  /**
   * @api {delete} /api/v1/device/:device_selector delete
   * @apiName delete
   * @apiGroup Device
   */
  async function destroy(req, res) {
    await gladys.device.destroy(req.params.device_selector);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/device/:device_selector/:feature_category/:feature_type/value setValue
   * @apiName setValue
   * @apiGroup Device
   */
  async function setValue(req, res) {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      device: req.params.device_selector,
      feature_category: req.params.feature_category,
      feature_type: req.params.feature_type,
      value: req.body.value,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {post} /api/v1/device_feature/:device_feature_selector/value setValueFeature
   * @apiName setValueFeature
   * @apiGroup Device
   */
  async function setValueFeature(req, res) {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      device_feature: req.params.device_feature_selector,
      value: req.body.value,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {get} /api/v1/device_feature/aggregated_states getDeviceFeaturesAggregated
   * @apiName getDeviceFeaturesAggregated
   * @apiGroup Device
   */
  async function getDeviceFeaturesAggregated(req, res) {
    // Query string values are strings: they are normalized here so the
    // aggregation layer only ever receives numbers.
    const parsedMaxStates = parseInt(req.query.max_states, 10);
    const maxStates = Number.isNaN(parsedMaxStates) ? undefined : parsedMaxStates;
    const states = await gladys.device.getDeviceFeaturesAggregatesMulti(
      req.query.device_features.split(','),
      parseInt(req.query.interval, 10),
      maxStates,
      req.query.group_by,
      parseInt(req.query.offset, 10) || 0,
    );
    res.json(states);
  }

  /**
   * @api {get} /api/v1/device_feature/states_history getDeviceStatesHistory
   * @apiName getDeviceStatesHistory
   * @apiGroup Device
   */
  async function getDeviceStatesHistory(req, res) {
    const states = await gladys.device.getDeviceStatesHistory(req.query);
    res.json(states);
  }

  /**
   * @api {get} /api/v1/device_feature/states_csv exportStatesToCsv
   * @apiName exportStatesToCsv
   * @apiGroup Device
   * @apiParam {String} device_features Comma separated list of device feature selectors.
   * @apiParam {String} start Beginning of the exported period (ISO 8601 date).
   * @apiParam {String} end End of the exported period (ISO 8601 date).
   * @apiParam {Number} [max_states] When set, answer one JSON chunk of at most this many
   * states ({ csv, next, states }) instead of the whole file: the caller keeps requesting
   * with the returned `next` cursor until it is null, and concatenates the `csv` chunks.
   * @apiParam {String} [after_created_at_us] Cursor of the previous chunk (next.createdAtUs).
   * @apiParam {String} [after_device_feature_id] Cursor of the previous chunk (next.deviceFeatureId).
   */
  async function exportStatesToCsv(req, res) {
    const deviceFeatures = req.query.device_features ? req.query.device_features.split(',') : [];
    const { start, end } = req.query;
    // Calls coming from Gladys Plus are answered through the gateway, whose response
    // object only implements send/json/status: there is no header to set, and each
    // message has to stay small enough to travel over the websocket.
    const isHttpResponse = typeof res.setHeader === 'function';

    // Paginated mode: one small JSON chunk per call, whatever the transport. This is
    // how the web client exports without any limit on the size of the period: it
    // reassembles the file chunk by chunk.
    if (req.query.max_states !== undefined) {
      const after =
        req.query.after_created_at_us !== undefined
          ? { createdAtUs: req.query.after_created_at_us, deviceFeatureId: req.query.after_device_feature_id }
          : undefined;
      const chunk = await gladys.device.exportStatesToCsv(deviceFeatures, start, end, {
        maxStates: parseInt(req.query.max_states, 10),
        after,
      });
      res.json(chunk);
      return;
    }

    // Whole-file mode, kept for direct API/scripting use. Over HTTP the file is
    // streamed chunk by chunk, so a period of any size can be exported while the
    // server never holds more than one chunk in memory.
    let chunk = await gladys.device.exportStatesToCsv(deviceFeatures, start, end);
    if (isHttpResponse) {
      // The dates are already validated by the export itself, so they can safely be
      // used to build a filename explaining what the file contains.
      const startDay = new Date(start).toISOString().slice(0, 10);
      const endDay = new Date(end).toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gladys-history-${startDay}-${endDay}.csv"`);
      res.write(chunk.csv);
      while (chunk.next !== null) {
        // eslint-disable-next-line no-await-in-loop
        chunk = await gladys.device.exportStatesToCsv(deviceFeatures, start, end, { after: chunk.next });
        if (chunk.states > 0) {
          res.write(`\n${chunk.csv}`);
        }
      }
      res.end();
      return;
    }

    // A non-paginated call through the gateway has to fit in one websocket message:
    // it is refused beyond the same limit as the log download, with the pagination
    // as the way out (the web client always paginates, so it never hits this).
    const parts = [chunk.csv];
    let sizeInBytes = Buffer.byteLength(chunk.csv, 'utf8');
    for (;;) {
      if (sizeInBytes > gladys.device.MAX_CSV_EXPORT_SIZE_THROUGH_GATEWAY_IN_BYTES) {
        throw new BadParameters(
          `This export is bigger than the ${gladys.device.MAX_CSV_EXPORT_SIZE_THROUGH_GATEWAY_IN_BYTES} bytes a Gladys Plus answer can carry. Please paginate with max_states, or export a shorter period.`,
        );
      }
      if (chunk.next === null) {
        break;
      }
      // eslint-disable-next-line no-await-in-loop
      chunk = await gladys.device.exportStatesToCsv(deviceFeatures, start, end, { after: chunk.next });
      if (chunk.states > 0) {
        parts.push(chunk.csv);
        sizeInBytes += Buffer.byteLength(chunk.csv, 'utf8') + 1;
      }
    }
    res.send(parts.join('\n'));
  }

  /**
   * @api {get} /api/v1/device_feature/energy_consumption getConsumptionByDates
   * @apiName getConsumptionByDates
   * @apiGroup Device
   */
  async function getConsumptionByDates(req, res) {
    const states = await gladys.device.energySensorManager.getConsumptionByDates(
      req.query.device_features.split(','),
      req.query,
    );
    res.json(states);
  }

  /**
   * @api {post} /api/v1/device/purge_all_sqlite_state purgeAllSqliteStates
   * @apiName purgeAllSqliteStates
   * @apiGroup Device
   */
  async function purgeAllSqliteStates(req, res) {
    gladys.event.emit(EVENTS.DEVICE.PURGE_ALL_SQLITE_STATES);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/device/migrate_from_sqlite_to_duckdb migrateFromSQLiteToDuckDb
   * @apiName migrateFromSQLiteToDuckDb
   * @apiGroup Device
   */
  async function migrateFromSQLiteToDuckDb(req, res) {
    await gladys.variable.destroy(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
    gladys.event.emit(EVENTS.DEVICE.MIGRATE_FROM_SQLITE_TO_DUCKDB);
    res.json({ success: true });
  }

  /**
   * @api {patch} /api/v1/device_feature/:device_feature_selector updateDeviceFeature
   * @apiName updateDeviceFeature
   * @apiGroup Device
   */
  async function updateDeviceFeature(req, res) {
    const feature = await gladys.device.updateFeature(req.params.device_feature_selector, req.body);
    res.json(feature);
  }

  /**
   * @api {post} /api/v1/device/:device_selector/migrate migrate
   * @apiName migrate
   * @apiGroup Device
   * @apiParam {String} destination_device_selector Selector of the destination device.
   * @apiParam {Object} [features_mapping] Map of source feature selector to destination feature selector.
   */
  async function migrate(req, res) {
    const result = await gladys.device.migrate(req.params.device_selector, req.body);
    res.json(result);
  }

  /**
   * @api {get} /api/v1/device/duckdb_migration_state getDuckDbMigrationState
   * @apiName getDuckDbMigrationState
   * @apiGroup Device
   */
  async function getDuckDbMigrationState(req, res) {
    const migrationState = await gladys.device.getDuckDbMigrationState();
    res.json(migrationState);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    get: asyncMiddleware(get),
    getDevicesByService: asyncMiddleware(getDevicesByService),
    getBySelector: asyncMiddleware(getBySelector),
    destroy: asyncMiddleware(destroy),
    setValue: asyncMiddleware(setValue),
    setValueFeature: asyncMiddleware(setValueFeature),
    getDeviceFeaturesAggregated: asyncMiddleware(getDeviceFeaturesAggregated),
    getDeviceStatesHistory: asyncMiddleware(getDeviceStatesHistory),
    exportStatesToCsv: asyncMiddleware(exportStatesToCsv),
    getConsumptionByDates: asyncMiddleware(getConsumptionByDates),
    purgeAllSqliteStates: asyncMiddleware(purgeAllSqliteStates),
    getDuckDbMigrationState: asyncMiddleware(getDuckDbMigrationState),
    migrateFromSQLiteToDuckDb: asyncMiddleware(migrateFromSQLiteToDuckDb),
    migrate: asyncMiddleware(migrate),
    updateDeviceFeature: asyncMiddleware(updateDeviceFeature),
  });
};
