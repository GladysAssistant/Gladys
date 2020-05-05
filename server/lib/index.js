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

/**
 * @description Start a new Gladys instance
 * @param {Object} params - Params when starting Gladys.
 * @param {string} [params.jwtSecret] - A secret to generate jsonwebtoken.
 * @param {boolean} [params.disableService] - If true, disable the loading of services.
 * @param {boolean} [params.disableBrainLoading] - If true, disable the loading of the brain.
 * @param {boolean} [params.disableRoomLoading] - If true, disable the loading of the rooms.
 * @param {boolean} [params.disableSceneLoading] - If true, disable the loading of the scenes.
 * @param {boolean} [params.disableDeviceLoading] - If true, disable the loading of devices in RAM.
 * @param {boolean} [params.disableUserLoading] - If true, disable the loading of users in RAM.
 * @param {boolean} [params.disableSchedulerLoading] - If true, disable the loading of the scheduler.
 * @example
 * const gladys = Gladys();
 */
function Gladys(params = {}) {
  params.jwtSecret = params.jwtSecret || generateJwtSecret();
  const config = getConfig();

  const variable = new Variable();
  const brain = new Brain();
  const cache = new Cache();
  const calendar = new Calendar();
  const event = new Event();
  const area = new Area();
  const dashboard = new Dashboard();
  const stateManager = new StateManager(event);
  const house = new House(event);
  const room = new Room(brain);
  const service = new Service(services, stateManager);
  const message = new MessageHandler(event, brain, service, stateManager);
  const session = new Session(params.jwtSecret, cache);
  const user = new User(session, stateManager, variable);
  const location = new Location(user, event);
  const device = new Device(event, message, stateManager, service, room, variable);
  const scene = new Scene(stateManager, event, device, message);
  const scheduler = new Scheduler(event);
  const system = new System(db.sequelize, event, config);
  const weather = new Weather(service, event, message, house);
  const gateway = new Gateway(variable, event, system, db.sequelize, config, user);

  const gladys = {
    version: '0.1.0', // todo, read package.json
    area,
    calendar,
    config,
    dashboard,
    event,
    house,
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
      // Execute DB migrations
      await db.umzug.up();

      await system.init();

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
        await device.init();
      }
      if (!params.disableUserLoading) {
        await user.init();
      }
      if (!params.disableRoomLoading) {
        await room.init();
      }
      if (!params.disableSchedulerLoading) {
        scheduler.init();
      }
      gateway.init();
    },
  };

  // freeze Gladys object to ensure it's not modified
  return Object.freeze(gladys);
}

module.exports = Gladys;
