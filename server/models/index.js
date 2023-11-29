const Sequelize = require('sequelize');
const Umzug = require('umzug');
const path = require('path');
const getConfig = require('../utils/getConfig');
const logger = require('../utils/logger');

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

const db = {
  ...models,
  sequelize,
  umzug,
};

module.exports = db;
