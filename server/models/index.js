const Sequelize = require('sequelize');
const duckdb = require('duckdb');
const Umzug = require('umzug');
const Promise = require('bluebird');
const chunk = require('lodash.chunk');
const path = require('path');
const util = require('util');
const getConfig = require('../utils/getConfig');
const logger = require('../utils/logger');
const { formatDateInUTC } = require('../utils/date');

const config = getConfig();

// SQLite
const sequelize = new Sequelize('mainDB', null, null, config);

// Migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [sequelize.getQueryInterface(), Sequelize],
  },
  logging: logger.debug,
  storage: 'sequelize',
  storageOptions: {
    sequelize,
  },
});

const AreaModel = require('./area');
const CalendarModel = require('./calendar');
const CalendarEventModel = require('./calendar_event');
const DashboardModel = require('./dashboard');
const DeviceFeatureStateModel = require('./device_feature_state');
const DeviceFeatureAggregateModel = require('./device_feature_state_aggregate');
const DeviceFeatureModel = require('./device_feature');
const DeviceParamModel = require('./device_param');
const DeviceModel = require('./device');
const HouseModel = require('./house');
const JobModel = require('./job');
const LifeEventModel = require('./life_event');
const LocationModel = require('./location');
const MessageModel = require('./message');
const PodModel = require('./pod');
const RoomModel = require('./room');
const SceneModel = require('./scene');
const ScriptModel = require('./script');
const ServiceModel = require('./service');
const SessionModel = require('./session');
const TagScene = require('./tag_scene');
const UserModel = require('./user');
const VariableModel = require('./variable');

const models = {
  Area: AreaModel(sequelize, Sequelize),
  Calendar: CalendarModel(sequelize, Sequelize),
  CalendarEvent: CalendarEventModel(sequelize, Sequelize),
  Dashboard: DashboardModel(sequelize, Sequelize),
  DeviceFeatureState: DeviceFeatureStateModel(sequelize, Sequelize),
  DeviceFeatureStateAggregate: DeviceFeatureAggregateModel(sequelize, Sequelize),
  DeviceFeature: DeviceFeatureModel(sequelize, Sequelize),
  DeviceParam: DeviceParamModel(sequelize, Sequelize),
  Device: DeviceModel(sequelize, Sequelize),
  House: HouseModel(sequelize, Sequelize),
  Job: JobModel(sequelize, Sequelize),
  LifeEvent: LifeEventModel(sequelize, Sequelize),
  Location: LocationModel(sequelize, Sequelize),
  Message: MessageModel(sequelize, Sequelize),
  Pod: PodModel(sequelize, Sequelize),
  Room: RoomModel(sequelize, Sequelize),
  Scene: SceneModel(sequelize, Sequelize),
  Script: ScriptModel(sequelize, Sequelize),
  Service: ServiceModel(sequelize, Sequelize),
  Session: SessionModel(sequelize, Sequelize),
  TagScene: TagScene(sequelize, Sequelize),
  User: UserModel(sequelize, Sequelize),
  Variable: VariableModel(sequelize, Sequelize),
};

// Associate all model
// Run `.associate` if it exists,
// ie create relationships in the ORM
Object.values(models)
  .filter((model) => typeof model.associate === 'function')
  .forEach((model) => model.associate(models));

// DuckDB
const duckDbFilePath = `${config.storage.replace('.db', '')}.duckdb`;
const duckDb = new duckdb.Database(duckDbFilePath);
const duckDbWriteConnection = duckDb.connect();
const duckDbReadConnection = duckDb.connect();
const duckDbWriteConnectionAllAsync = util.promisify(duckDbWriteConnection.all).bind(duckDbWriteConnection);
const duckDbReadConnectionAllAsync = util.promisify(duckDbReadConnection.all).bind(duckDbReadConnection);

const duckDbCreateTableIfNotExist = async () => {
  logger.info(`DuckDB - Creating database table if not exist`);
  await duckDbWriteConnectionAllAsync(`
    CREATE TABLE IF NOT EXISTS t_device_feature_state (
        device_feature_id UUID,
        value DOUBLE,
        created_at TIMESTAMPTZ
    );
  `);
};

const duckDbInsertState = async (deviceFeatureId, value, createdAt) => {
  const createdAtInString = formatDateInUTC(createdAt);
  await duckDbWriteConnectionAllAsync(
    'INSERT INTO t_device_feature_state VALUES (?, ?, ?)',
    deviceFeatureId,
    value,
    createdAtInString,
  );
};

const duckDbBatchInsertState = async (deviceFeatureId, states) => {
  const chunks = chunk(states, 10000);
  await Promise.each(chunks, async (oneStatesChunk, chunkIndex) => {
    let queryString = `INSERT INTO t_device_feature_state (device_feature_id, value, created_at) VALUES `;
    const queryParams = [];
    oneStatesChunk.forEach((state, index) => {
      if (index > 0) {
        queryString += `,`;
      }
      queryString += '(?, ?, ?)';
      queryParams.push(deviceFeatureId);
      queryParams.push(state.value);
      queryParams.push(formatDateInUTC(state.created_at));
    });
    logger.info(`DuckDB : Inserting chunk ${chunkIndex} for deviceFeature = ${deviceFeatureId}.`);
    await duckDbWriteConnectionAllAsync(queryString, ...queryParams);
  });
};

const duckDbShowVersion = async () => {
  const result = await duckDbReadConnectionAllAsync('SELECT version() AS version;');
  logger.info(`DuckDB version = ${result[0].version}`);
};

const db = {
  ...models,
  sequelize,
  umzug,
  duckDb,
  duckDbWriteConnectionAllAsync,
  duckDbReadConnectionAllAsync,
  duckDbCreateTableIfNotExist,
  duckDbInsertState,
  duckDbBatchInsertState,
  duckDbShowVersion,
};

module.exports = db;
