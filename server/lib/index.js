const { generateJwtSecret } = require('../utils/jwtSecret');
const { Cache } = require('../utils/cache');
const getConfig = require('../utils/getConfig');
const db = require('../models');
const Area = require('./area');
const Brain = require('./brain');
const Calendar = require('./calendar');
const Dashboard = require('./dashboard');
const Event = require('./event');
const House = require('./house');
const Gateway = require('./gateway');
const Http = require('./http');
const Job = require('./job');
const Location = require('./location');
const MessageHandler = require('./message');
const Service = require('./service');
const Session = require('./session');
const User = require('./user');
const Device = require('./device');
const Room = require('./room');
const Scheduler = require('./scheduler');
const StateManager = require('./state');
const Scene = require('./scene');
const System = require('./system');
const Variable = require('./variable');
const services = require('../services');
const Weather = require('./weather');
const { EVENTS } = require('../utils/constants');

/**
 * @description Start a new Gladys instance.
 * @param {object} params - Params when starting Gladys.
 * @param {string} [params.jwtSecret] - A secret to generate jsonwebtoken.
 * @param {boolean} [params.disableService] - If true, disable the loading of services.
 * @param {boolean} [params.disableBrainLoading] - If true, disable the loading of the brain.
 * @param {boolean} [params.disableRoomLoading] - If true, disable the loading of the rooms.
 * @param {boolean} [params.disableSceneLoading] - If true, disable the loading of the scenes.
 * @param {boolean} [params.disableDeviceLoading] - If true, disable the loading of devices in RAM.
 * @param {boolean} [params.disableUserLoading] - If true, disable the loading of users in RAM.
 * @param {boolean} [params.disableSchedulerLoading] - If true, disable the loading of the scheduler.
 * @param {boolean} [params.disableAreaLoading] - If true, disable the loading of the areas.
 * @param {boolean} [params.disableJobInit] - If true, disable the pruning of background jobs.
 * @param {boolean} [params.disableDuckDbMigration] - If true, disable the DuckDB migration.
 * @returns {object} Return gladys object.
 * @example
 * const gladys = Gladys();
 */
function Gladys(params = {}) {
  params.jwtSecret = params.jwtSecret || generateJwtSecret();
  const config = getConfig();

  const event = new Event();
  const variable = new Variable(event);
  const brain = new Brain();
  const cache = new Cache();
  const job = new Job(event);
  const area = new Area(event);
  const dashboard = new Dashboard();
  const stateManager = new StateManager(event);
  const session = new Session(params.jwtSecret, cache);
  const system = new System(db.sequelize, event, config, job);
  const http = new Http(system);
  const house = new House(event, stateManager, session);
  const room = new Room(brain);
  const service = new Service(services, stateManager);
  const message = new MessageHandler(event, brain, service, stateManager, variable);
  const user = new User(session, stateManager, variable);
  const location = new Location(user, event);
  const device = new Device(event, message, stateManager, service, room, variable, job, brain, user);
  const calendar = new Calendar(service);
  const scheduler = new Scheduler(event);
  const weather = new Weather(service, event, message, house);
  const gateway = new Gateway(
    variable,
    event,
    system,
    db.sequelize,
    config,
    user,
    stateManager,
    service,
    job,
    scheduler,
    message,
    brain,
  );
  const scene = new Scene(
    stateManager,
    event,
    device,
    message,
    variable,
    house,
    calendar,
    http,
    gateway,
    scheduler,
    brain,
    service,
  );

  const gladys = {
    version: '0.1.0', // todo, read package.json
    area,
    calendar,
    config,
    dashboard,
    event,
    house,
    http,
    job,
    gateway,
    location,
    message,
    user,
    service,
    scene,
    scheduler,
    session,
    cache,
    device,
    room,
    stateManager,
    system,
    variable,
    weather,
    start: async () => {
      // set wal mode
      await db.sequelize.query('PRAGMA journal_mode=WAL;');

      // Execute DB migrations
      await db.umzug.up();

      // Show DuckDB version
      await db.duckDbShowVersion();

      // Execute DuckDB DB migration
      await db.duckDbCreateTableIfNotExist();

      await system.init();

      // this should be before device.init
      if (!params.disableJobInit) {
        await job.init();
      }

      if (!params.disableBrainLoading) {
        await brain.load();
      }

      if (!params.disableService) {
        await service.load(gladys);
        await service.startAll();
      }
      if (!params.disableSceneLoading) {
        await scene.init();
      }
      if (!params.disableDeviceLoading) {
        await device.init(!params.disableDuckDbMigration);
      }
      if (!params.disableUserLoading) {
        await user.init();
      }
      if (!params.disableRoomLoading) {
        await room.init();
      }
      if (!params.disableAreaLoading) {
        await area.init();
      }
      if (!params.disableSchedulerLoading) {
        scheduler.init();
      }
      gateway.init();

      event.emit(EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.SYSTEM.START,
      });
    },
  };

  // freeze Gladys object to ensure it's not modified
  return Object.freeze(gladys);
}

module.exports = Gladys;
