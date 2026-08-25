const { generateJwtSecret } = require('../utils/jwtSecret');
const logger = require('../utils/logger');
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
const Mdns = require('./mdns');
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
const EnergyPrice = require('./energy-price');
const ExternalIntegration = require('./external-integration');
const Tts = require('./tts');

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
 * @param {boolean} [params.disableGladysUpgradedCheck] - If true, disable the check if Gladys is upgraded.
 * @param {boolean} [params.disableExternalIntegration] - If true, disable the external integration supervisor.
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
  const house = new House(event, stateManager, session, variable);
  const room = new Room();
  const service = new Service(services, stateManager);
  const message = new MessageHandler(event, brain, service, stateManager, variable);
  const user = new User(session, stateManager, variable);
  const system = new System(db.sequelize, event, config, job, variable, user, message, brain);
  const http = new Http(system);
  const location = new Location(user, event);
  const mdns = new Mdns(variable, event, system);
  const device = new Device(event, message, stateManager, service, room, variable, job, brain, user);
  const calendar = new Calendar(service);
  const scheduler = new Scheduler(event);
  const weather = new Weather(service, event, message, house);
  const energyPrice = new EnergyPrice(stateManager);
  const externalIntegration = new ExternalIntegration(
    event,
    system,
    service,
    stateManager,
    device,
    variable,
    energyPrice,
    params.jwtSecret,
    cache,
  );
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
    device,
  );
  const tts = new Tts(variable, service, stateManager, gateway);
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
    tts,
  );
  gateway.scene = scene;
  gateway.energyPrice = energyPrice;
  // the voice assistant reply (gateway.processVoiceMessage) speaks through
  // the active TTS provider; attached post-construction like gateway.scene
  gateway.tts = tts;
  // The device migration (device.migrate) rewrites scenes: the scene manager
  // is created after the device manager, so it is attached post-construction
  // (same pattern as gateway.scene above). Dashboards have no RAM cache and
  // are rewritten straight through the DB model.
  device.sceneManager = scene;

  const gladys = {
    version: '0.1.0', // todo, read package.json
    area,
    brain,
    calendar,
    config,
    dashboard,
    event,
    house,
    http,
    job,
    gateway,
    location,
    mdns,
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
    energyPrice,
    externalIntegration,
    tts,
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

      // init the external integration supervisor before service.startAll, so
      // the proxy services are registered and startAll starts internal and
      // external integrations through the same path
      if (!params.disableExternalIntegration) {
        await externalIntegration.init();
      }
      if (!params.disableService) {
        // only load services here (instantiate them and register them in the
        // stateManager, so the API can serve them as soon as the server
        // listens): starting them is deferred to the end of the boot
        // sequence, see below
        await service.load(gladys);
      }
      if (!params.disableDeviceLoading) {
        // only load the devices in RAM here, so the API can serve them as
        // soon as the server listens: polling is started at the end of the
        // boot sequence, see below
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

      const startServicesAndEmitSystemStart = async () => {
        try {
          if (!params.disableService) {
            // service.start catches and persists per-service errors, so a
            // failing service cannot reject here — only a global failure
            // (e.g. database error) can, and it is caught below
            await service.startAll();
          }
          // Scenes are only loaded in the trigger store once every service is
          // started: while they start, integrations replay the state of their
          // devices (MQTT retained messages, Zigbee/Matter state dumps, first
          // poll result...), and those states must not trigger scenes while
          // the other integrations are still down — exactly like when the
          // boot was sequential. The scene API reads the database, so the
          // front still lists and edits scenes during this window.
          if (!params.disableSceneLoading) {
            await scene.init();
          }
        } catch (e) {
          // this function must never reject: it is voluntarily not awaited
          logger.warn('Error while finishing the Gladys boot sequence', e);
        }

        if (!params.disableDeviceLoading) {
          // Polling is only started once the services are started: polling a
          // device calls service.device.poll on its integration, which cannot
          // answer while service.startAll has not reached it — it would only
          // log errors, or send a command to an external integration
          // container which is not up yet. On master, device.init ran after
          // service.startAll, so this keeps the same guarantee. Outside of
          // the try on purpose: polling must be started even if a service or
          // the scenes failed above.
          device.setupPoll();
        }

        if (!params.disableGladysUpgradedCheck) {
          // Runs here, after the services are started: the upgrade
          // notification is forwarded to the outbound channels of the user
          // (Telegram, an external integration container...), which are only
          // usable once service.startAll has reached them. Voluntarily not
          // awaited so it does not delay the SYSTEM.START trigger —
          // checkIfGladysUpgraded catches its own errors and never rejects,
          // so the promise can safely float.
          system.checkIfGladysUpgraded(gateway);
        }

        // the SYSTEM.START trigger is only emitted once all services are
        // started, so "on startup" scenes still find their integrations
        // ready, like when the boot was sequential
        event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.SYSTEM.START,
        });
      };
      // Voluntarily not awaited: starting the services (Zigbee, MQTT,
      // external integration containers...) is by far the slowest part of
      // the boot, and the HTTP server only starts listening once this boot
      // sequence resolves — awaiting here would keep the API and the front
      // unreachable until the last integration is up. External integration
      // containers also authenticate on the WebSocket, which needs the HTTP
      // server to be listening: deferring their start avoids a reconnection
      // loop at boot. The function above never rejects, so the promise can
      // safely float.
      startServicesAndEmitSystemStart();
    },
  };

  // freeze Gladys object to ensure it's not modified
  return Object.freeze(gladys);
}

module.exports = Gladys;
