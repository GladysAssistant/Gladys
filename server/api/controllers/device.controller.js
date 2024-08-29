const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

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
    const states = await gladys.device.getDeviceFeaturesAggregatesMulti(
      req.query.device_features.split(','),
      req.query.interval,
      req.query.max_states,
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
    purgeAllSqliteStates: asyncMiddleware(purgeAllSqliteStates),
    getDuckDbMigrationState: asyncMiddleware(getDuckDbMigrationState),
    migrateFromSQLiteToDuckDb: asyncMiddleware(migrateFromSQLiteToDuckDb),
  });
};
