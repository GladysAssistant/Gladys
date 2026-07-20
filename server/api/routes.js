const AreaController = require('./controllers/area.controller');
const CalendarController = require('./controllers/calendar.controller');
const CameraController = require('./controllers/camera.controller');
const DashboardController = require('./controllers/dashboard.controller');
const DeviceController = require('./controllers/device.controller');
const UserController = require('./controllers/user.controller');
const PingController = require('./controllers/ping.controller');
const JobController = require('./controllers/job.controller');
const GatewayController = require('./controllers/gateway.controller');
const HouseController = require('./controllers/house.controller');
const HttpController = require('./controllers/http.controller');
const LightController = require('./controllers/light.controller');
const LocationController = require('./controllers/location.controller');
const MessageController = require('./controllers/message.controller');
const RoomController = require('./controllers/room.controller');
const SessionController = require('./controllers/session.controller');
const ServiceController = require('./controllers/service.controller');
const ExternalIntegrationController = require('./controllers/externalIntegration.controller');
const IntegrationHostController = require('./controllers/integrationHost.controller');
const SceneController = require('./controllers/scene.controller');
const SystemController = require('./controllers/system.controller');
const VariableController = require('./controllers/variable.controller');
const WeatherController = require('./controllers/weather.controller');
const EnergyPriceController = require('./controllers/energy-price.controller');

/**
 * @description Return object of routes.
 * @param {object} gladys - Gladys object.
 * @returns {object} Return object of routes.
 * @example
 * getRoutes(gladys);
 */
function getRoutes(gladys) {
  const areaController = AreaController(gladys);
  const calendarController = CalendarController(gladys);
  const cameraController = CameraController(gladys);
  const dashboardController = DashboardController(gladys);
  const deviceController = DeviceController(gladys);
  const lightController = LightController(gladys);
  const jobController = JobController(gladys);
  const locationController = LocationController(gladys);
  const userController = UserController(gladys);
  const houseController = HouseController(gladys);
  const httpController = HttpController(gladys);
  const messageController = MessageController(gladys);
  const pingController = PingController();
  const gatewayController = GatewayController(gladys);
  const roomController = RoomController(gladys);
  const variableController = VariableController(gladys);
  const sessionController = SessionController(gladys);
  const serviceController = ServiceController(gladys);
  const externalIntegrationController = ExternalIntegrationController(gladys);
  const integrationHostController = IntegrationHostController(gladys);
  const sceneController = SceneController(gladys);
  const systemController = SystemController(gladys);
  const weatherController = WeatherController(gladys);
  const energyPriceController = EnergyPriceController(gladys);

  const routes = {};

  // add services routes
  const services = Object.entries(gladys.service.getServices());
  // foreach service
  services.forEach((service) => {
    // if the service has a controllers object
    if (service[1].get().controllers) {
      Object.assign(routes, service[1].get().controllers);
    }
  });

  const coreRoutes = {
    // open routes
    'get /api/v1/ping': {
      authenticated: false,
      controller: pingController.ping,
    },
    'post /api/v1/login': {
      authenticated: false,
      rateLimit: true,
      controller: userController.login,
    },
    'post /api/v1/access_token': {
      authenticated: false,
      rateLimit: true,
      controller: userController.getAccessToken,
    },
    'post /api/v1/forgot_password': {
      authenticated: false,
      rateLimit: true,
      controller: userController.forgotPassword,
    },
    'post /api/v1/reset_password': {
      authenticated: false,
      rateLimit: true,
      resetPasswordAuth: true,
      controller: userController.resetPassword,
    },
    'get /api/v1/setup': {
      authenticated: false,
      controller: userController.getSetupState,
    },
    'post /api/v1/signup': {
      authenticated: false,
      instanceNotConfigured: true,
      controller: userController.create,
    },
    // area
    'post /api/v1/area': {
      authenticated: true,
      controller: areaController.create,
    },
    'get /api/v1/area': {
      authenticated: true,
      controller: areaController.get,
    },
    'get /api/v1/area/:area_selector': {
      authenticated: true,
      controller: areaController.getBySelector,
    },
    'patch /api/v1/area/:area_selector': {
      authenticated: true,
      controller: areaController.update,
    },
    'delete /api/v1/area/:area_selector': {
      authenticated: true,
      controller: areaController.destroy,
    },
    // calendar
    'post /api/v1/calendar': {
      authenticated: true,
      controller: calendarController.create,
    },
    'get /api/v1/calendar': {
      authenticated: true,
      controller: calendarController.get,
    },
    'get /api/v1/calendar/event': {
      authenticated: true,
      controller: calendarController.getEvents,
    },
    'patch /api/v1/calendar/:calendar_selector': {
      authenticated: true,
      controller: calendarController.update,
    },
    'delete /api/v1/calendar/:calendar_selector': {
      authenticated: true,
      controller: calendarController.destroy,
    },
    'post /api/v1/calendar/:calendar_selector/event': {
      authenticated: true,
      controller: calendarController.createEvent,
    },
    'patch /api/v1/calendar/event/:calendar_event_selector': {
      authenticated: true,
      controller: calendarController.updateEvent,
    },
    'delete /api/v1/calendar/event/:calendar_event_selector': {
      authenticated: true,
      controller: calendarController.destroyEvent,
    },
    // camera
    'get /api/v1/camera': {
      authenticated: true,
      controller: cameraController.get,
    },
    'get /api/v1/camera/:camera_selector/image': {
      authenticated: true,
      controller: cameraController.getImage,
    },
    'post /api/v1/camera/:camera_selector/image': {
      authenticated: true,
      controller: cameraController.setImage,
    },
    // dashboard
    'get /api/v1/dashboard': {
      authenticated: true,
      controller: dashboardController.get,
    },
    'post /api/v1/dashboard': {
      authenticated: true,
      controller: dashboardController.create,
    },
    'post /api/v1/dashboard/order': {
      authenticated: true,
      controller: dashboardController.updateOrder,
    },
    'get /api/v1/dashboard/:dashboard_selector': {
      authenticated: true,
      controller: dashboardController.getBySelector,
    },
    'patch /api/v1/dashboard/:dashboard_selector': {
      authenticated: true,
      controller: dashboardController.update,
    },
    'delete /api/v1/dashboard/:dashboard_selector': {
      authenticated: true,
      controller: dashboardController.destroy,
    },
    // device
    'post /api/v1/device': {
      authenticated: true,
      controller: deviceController.create,
    },
    'get /api/v1/device': {
      authenticated: true,
      controller: deviceController.get,
    },
    'get /api/v1/device/duckdb_migration_state': {
      authenticated: true,
      controller: deviceController.getDuckDbMigrationState,
    },
    'post /api/v1/device/purge_all_sqlite_state': {
      authenticated: true,
      controller: deviceController.purgeAllSqliteStates,
    },
    'post /api/v1/device/migrate_from_sqlite_to_duckdb': {
      authenticated: true,
      controller: deviceController.migrateFromSQLiteToDuckDb,
    },
    'get /api/v1/service/:service_name/device': {
      authenticated: true,
      controller: deviceController.getDevicesByService,
    },
    'get /api/v1/device/:device_selector': {
      authenticated: true,
      controller: deviceController.getBySelector,
    },
    'delete /api/v1/device/:device_selector': {
      authenticated: true,
      controller: deviceController.destroy,
    },
    'post /api/v1/device/:device_selector/:feature_category/:feature_type/value': {
      authenticated: true,
      controller: deviceController.setValue,
    },
    'post /api/v1/device_feature/:device_feature_selector/value': {
      authenticated: true,
      controller: deviceController.setValueFeature,
    },
    'patch /api/v1/device_feature/:device_feature_selector': {
      authenticated: true,
      controller: deviceController.updateDeviceFeature,
    },
    'get /api/v1/device_feature/aggregated_states': {
      authenticated: true,
      controller: deviceController.getDeviceFeaturesAggregated,
    },
    'get /api/v1/device_feature/states_history': {
      authenticated: true,
      controller: deviceController.getDeviceStatesHistory,
    },
    'get /api/v1/device_feature/energy_consumption': {
      authenticated: true,
      controller: deviceController.getConsumptionByDates,
    },
    // house
    'post /api/v1/house': {
      authenticated: true,
      admin: true,
      controller: houseController.create,
    },
    'get /api/v1/house/:house_selector': {
      authenticated: true,
      controller: houseController.getBySelector,
    },
    'patch /api/v1/house/:house_selector': {
      authenticated: true,
      admin: true,
      controller: houseController.update,
    },
    'get /api/v1/house': {
      authenticated: true,
      controller: houseController.get,
    },
    'delete /api/v1/house/:house_selector': {
      authenticated: true,
      admin: true,
      controller: houseController.destroy,
    },
    'get /api/v1/house/:house_selector/room': {
      authenticated: true,
      controller: houseController.getRooms,
    },
    'post /api/v1/house/:house_selector/user/:user_selector/seen': {
      authenticated: true,
      controller: houseController.userSeen,
    },
    // House Alarm
    'post /api/v1/house/:house_selector/arm': {
      authenticated: true,
      controller: houseController.arm,
    },
    'post /api/v1/house/:house_selector/disarm': {
      authenticated: true,
      controller: houseController.disarm,
    },
    'post /api/v1/house/:house_selector/disarm_with_code': {
      alarmAuth: true,
      controller: houseController.disarmWithCode,
    },
    'post /api/v1/house/:house_selector/partial_arm': {
      authenticated: true,
      controller: houseController.partialArm,
    },
    'post /api/v1/house/:house_selector/panic': {
      authenticated: true,
      controller: houseController.panic,
    },
    // job
    'get /api/v1/job': {
      authenticated: true,
      admin: true,
      controller: jobController.get,
    },
    // http
    'post /api/v1/http/request': {
      authenticated: true,
      admin: true,
      controller: httpController.request,
    },
    // gateway
    // Routes marked as "authenticatedOrNotConfigured" are accessible without
    // authentication as long as no user exists on the instance, so the signup
    // flow can restore a Gladys Plus backup without creating a local account.
    // The "admin" flag is kept on those routes because it is also used by
    // setupGateway to protect API calls done through the Gladys Plus tunnel.
    'get /api/v1/gateway/status': {
      authenticatedOrNotConfigured: true,
      admin: true,
      controller: gatewayController.getStatus,
    },
    'post /api/v1/gateway/login': {
      authenticatedOrNotConfigured: true,
      admin: true,
      rateLimit: true,
      controller: gatewayController.login,
    },
    'post /api/v1/gateway/logout': {
      authenticated: true,
      admin: true,
      controller: gatewayController.logout,
    },
    'post /api/v1/gateway/login-two-factor': {
      authenticatedOrNotConfigured: true,
      admin: true,
      rateLimit: true,
      controller: gatewayController.loginTwoFactor,
    },
    'post /api/v1/gateway/configure-two-factor': {
      authenticated: true,
      admin: true,
      controller: gatewayController.configureTwoFactor,
    },
    'post /api/v1/gateway/enable-two-factor': {
      authenticated: true,
      admin: true,
      controller: gatewayController.enableTwoFactor,
    },
    'get /api/v1/gateway/key': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getUsersKeys,
    },
    'patch /api/v1/gateway/key': {
      authenticated: true,
      controller: gatewayController.saveUsersKeys,
    },
    'get /api/v1/gateway/backup': {
      authenticatedOrNotConfigured: true,
      admin: true,
      controller: gatewayController.getBackups,
    },
    'post /api/v1/gateway/backup-key': {
      authenticatedOrNotConfigured: true,
      admin: true,
      rateLimit: true,
      controller: gatewayController.saveBackupKey,
    },
    'post /api/v1/gateway/backup': {
      authenticated: true,
      admin: true,
      controller: gatewayController.createBackup,
    },
    'post /api/v1/gateway/backup/restore': {
      authenticatedOrNotConfigured: true,
      admin: true,
      controller: gatewayController.restoreBackup,
    },
    'get /api/v1/gateway/backup/restore/status': {
      authenticatedOrNotConfigured: true,
      admin: true,
      controller: gatewayController.getRestoreStatus,
    },
    'get /api/v1/gateway/instance/key': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getInstanceKeysFingerprint,
    },
    'post /api/v1/gateway/aichat/chat': {
      authenticated: true,
      controller: gatewayController.aiChat,
    },
    'get /api/v1/gateway/aichat/debug-context': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getAiChatDebugContext,
    },
    'get /api/v1/gateway/aichat/quota': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getOpenAIQuota,
    },
    'get /api/v1/gateway/aichat/models': {
      authenticated: true,
      controller: gatewayController.getAiChatModels,
    },
    'post /api/v1/gateway/stt': {
      authenticated: true,
      audioRawBody: true,
      controller: gatewayController.stt,
    },
    'post /api/v1/gateway/voice': {
      authenticated: true,
      audioRawBody: true,
      controller: gatewayController.processVoice,
    },
    'post /api/v1/gateway/tts': {
      authenticated: true,
      controller: gatewayController.getTtsUrl,
    },
    'post /api/v1/gateway/refresh-latest-gladys-version': {
      authenticated: true,
      admin: true,
      controller: gatewayController.refreshLatestGladysVersion,
    },
    'post /api/v1/gateway/weekly-digest/send': {
      authenticated: true,
      admin: true,
      controller: gatewayController.sendWeeklyDigest,
    },
    'post /api/v1/gateway/weekly-digest/reschedule': {
      authenticated: true,
      admin: true,
      controller: gatewayController.rescheduleWeeklyDigest,
    },
    // room
    'get /api/v1/room': {
      authenticated: true,
      controller: roomController.get,
    },
    'get /api/v1/room/:room_selector': {
      authenticated: true,
      controller: roomController.getBySelector,
    },
    'post /api/v1/house/:house_selector/room': {
      authenticated: true,
      admin: true,
      controller: roomController.create,
    },
    'patch /api/v1/room/:room_selector': {
      authenticated: true,
      admin: true,
      controller: roomController.update,
    },
    'delete /api/v1/room/:room_selector': {
      authenticated: true,
      admin: true,
      controller: roomController.destroy,
    },
    // message
    'post /api/v1/message': {
      authenticated: true,
      controller: messageController.create,
    },
    'get /api/v1/message': {
      authenticated: true,
      controller: messageController.get,
    },
    // service
    'post /api/v1/service/:service_name/start': {
      authenticated: true,
      admin: true,
      controller: serviceController.start,
    },
    'post /api/v1/service/:service_name/stop': {
      authenticated: true,
      admin: true,
      controller: serviceController.stop,
    },
    'get /api/v1/service/:service_name': {
      authenticated: true,
      controller: serviceController.getByName,
    },
    'get /api/v1/service': {
      authenticated: true,
      controller: serviceController.getAll,
    },
    // external integrations (admin API)
    // ⚠️ the literal `store` routes must be declared BEFORE `:selector`
    // (setupRoutes registers routes in declaration order). Selectors are
    // prefixed `ext-` so `store` can never be a valid selector anyway.
    'get /api/v1/external_integration': {
      authenticated: true,
      controller: externalIntegrationController.getAll,
    },
    'get /api/v1/external_integration/store': {
      authenticated: true,
      controller: externalIntegrationController.getStore,
    },
    'get /api/v1/external_integration/hardware': {
      authenticated: true,
      controller: externalIntegrationController.getHardware,
    },
    'post /api/v1/external_integration/store/refresh': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.refreshStore,
    },
    'post /api/v1/external_integration': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.install,
    },
    'get /api/v1/external_integration/:selector': {
      authenticated: true,
      controller: externalIntegrationController.getBySelector,
    },
    'post /api/v1/external_integration/:selector/start': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.start,
    },
    'post /api/v1/external_integration/:selector/stop': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.stop,
    },
    'post /api/v1/external_integration/:selector/restart': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.restart,
    },
    'post /api/v1/external_integration/:selector/update': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.update,
    },
    'post /api/v1/external_integration/:selector/hardware': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.setHardware,
    },
    'get /api/v1/external_integration/:selector/logs': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.getLogs,
    },
    'get /api/v1/external_integration/:selector/discovered_device': {
      authenticated: true,
      controller: externalIntegrationController.getDiscoveredDevices,
    },
    'post /api/v1/external_integration/:selector/scan': {
      authenticated: true,
      controller: externalIntegrationController.scan,
    },
    'get /api/v1/external_integration/:selector/config': {
      authenticated: true,
      controller: externalIntegrationController.getConfig,
    },
    'post /api/v1/external_integration/:selector/config': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.saveConfig,
    },
    'post /api/v1/external_integration/:selector/oauth/authorize_url': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.getOAuthAuthorizeUrl,
    },
    'post /api/v1/external_integration/:selector/oauth/callback': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.oauthCallback,
    },
    'post /api/v1/external_integration/:selector/action/:key': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.runAction,
    },
    'delete /api/v1/external_integration/:selector': {
      authenticated: true,
      admin: true,
      controller: externalIntegrationController.destroy,
    },
    // host API of external integrations (integration -> core). Only surface
    // integration -> core, authenticated by integration JWT, strict tenant
    // isolation. Never exposed through the Gladys Plus gateway.
    'get /api/integration/v1/status': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.getStatus,
    },
    'post /api/integration/v1/heartbeat': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.heartbeat,
    },
    'post /api/integration/v1/connection_status': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.saveConnectionStatus,
    },
    'post /api/integration/v1/network_discovery/scan': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.networkDiscoveryScan,
    },
    'post /api/integration/v1/camera/image': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.saveCameraImage,
    },
    'post /api/integration/v1/device/transport': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.setDeviceTransports,
    },
    'post /api/integration/v1/discovered_device': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.publishDiscoveredDevices,
    },
    'get /api/integration/v1/device': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.getDevices,
    },
    'post /api/integration/v1/state': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.publishStates,
    },
    'get /api/integration/v1/config': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.getConfig,
    },
    'post /api/integration/v1/config': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.saveConfig,
    },
    'get /api/integration/v1/container': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.getContainers,
    },
    'post /api/integration/v1/container/:name/start': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.startContainer,
    },
    'post /api/integration/v1/container/:name/stop': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.stopContainer,
    },
    'post /api/integration/v1/container/:name/restart': {
      authenticated: false,
      externalIntegrationAuth: true,
      controller: integrationHostController.restartContainer,
    },
    // user
    'get /api/v1/user': {
      authenticated: true,
      controller: userController.getUsers,
    },
    'get /api/v1/user/:user_selector': {
      authenticated: true,
      controller: userController.getUserBySelector,
    },
    'patch /api/v1/user/:user_selector': {
      authenticated: true,
      admin: true,
      controller: userController.update,
    },
    'delete /api/v1/user/:user_selector': {
      authenticated: true,
      admin: true,
      controller: userController.deleteUser,
    },
    'get /api/v1/me': {
      authenticated: true,
      controller: userController.getMySelf,
    },
    'patch /api/v1/me': {
      authenticated: true,
      controller: userController.updateMySelf,
    },
    'get /api/v1/me/picture': {
      authenticated: true,
      controller: userController.getMyPicture,
    },
    // location
    'post /api/v1/user/:user_selector/location': {
      authenticated: true,
      controller: locationController.create,
    },
    'get /api/v1/user/:user_selector/location': {
      authenticated: true,
      controller: locationController.getLocationsUser,
    },
    // variable
    'post /api/v1/service/:service_name/variable/:variable_key': {
      authenticated: true,
      controller: variableController.setForLocalService,
    },
    'get /api/v1/service/:service_name/variable/:variable_key': {
      authenticated: true,
      controller: variableController.getByLocalService,
    },
    'post /api/v1/variable/:variable_key': {
      authenticated: true,
      controller: variableController.setValue,
    },
    'get /api/v1/variable/:variable_key': {
      authenticated: true,
      controller: variableController.getValue,
    },
    'post /api/v1/user/variable/:variable_key': {
      authenticated: true,
      controller: variableController.setForUser,
    },
    'get /api/v1/user/variable/:variable_key': {
      authenticated: true,
      controller: variableController.getForUser,
    },
    // session
    'post /api/v1/session/:session_id/revoke': {
      authenticated: true,
      controller: sessionController.revoke,
    },
    'post /api/v1/session/tablet_mode': {
      authenticated: true,
      controller: sessionController.setTabletMode,
    },
    'get /api/v1/session/tablet_mode': {
      authenticated: true,
      controller: sessionController.getTabletMode,
    },
    'post /api/v1/session/api_key': {
      authenticated: true,
      controller: sessionController.createApiKey,
    },
    'get /api/v1/session': {
      authenticated: true,
      controller: sessionController.get,
    },
    // light
    'post /api/v1/light/:device_selector/on': {
      authenticated: true,
      controller: lightController.turnOn,
    },
    // scene
    'post /api/v1/scene': {
      authenticated: true,
      admin: true,
      controller: sceneController.create,
    },
    'get /api/v1/scene': {
      authenticated: true,
      controller: sceneController.get,
    },
    'get /api/v1/scene/:scene_selector': {
      authenticated: true,
      controller: sceneController.getBySelector,
    },
    'patch /api/v1/scene/:scene_selector': {
      authenticated: true,
      admin: true,
      controller: sceneController.update,
    },
    'delete /api/v1/scene/:scene_selector': {
      authenticated: true,
      admin: true,
      controller: sceneController.destroy,
    },
    'post /api/v1/scene/:scene_selector/start': {
      authenticated: true,
      controller: sceneController.start,
    },
    'post /api/v1/scene/:scene_selector/duplicate': {
      authenticated: true,
      controller: sceneController.duplicate,
    },
    'get /api/v1/tag_scene': {
      authenticated: true,
      controller: sceneController.getTag,
    },
    // system
    'get /api/v1/system/info': {
      authenticated: true,
      controller: systemController.getSystemInfos,
    },
    'get /api/v1/system/disk': {
      authenticated: true,
      controller: systemController.getDiskSpace,
    },
    'get /api/v1/system/container': {
      authenticated: true,
      controller: systemController.getContainers,
    },
    'post /api/v1/system/shutdown': {
      authenticated: true,
      admin: true,
      controller: systemController.shutdown,
    },
    'post /api/v1/system/upgrade': {
      authenticated: true,
      admin: true,
      controller: systemController.installUpgrade,
    },
    'post /api/v1/system/vacuum': {
      authenticated: true,
      admin: true,
      controller: systemController.vacuum,
    },
    'get /api/v1/system/logs': {
      authenticated: true,
      admin: true,
      controller: systemController.getGladysLogs,
    },
    // user
    'post /api/v1/user': {
      authenticated: true,
      admin: true,
      controller: userController.create,
    },
    // weather
    'get /api/v1/user/:user_selector/weather': {
      authenticated: true,
      controller: weatherController.getByUser,
    },
    'get /api/v1/house/:house_selector/weather': {
      authenticated: true,
      controller: weatherController.getByHouse,
    },
    // energy price
    'get /api/v1/energy_price': {
      authenticated: true,
      controller: energyPriceController.get,
    },
    'post /api/v1/energy_price': {
      authenticated: true,
      controller: energyPriceController.create,
    },
    'patch /api/v1/energy_price/:selector': {
      authenticated: true,
      controller: energyPriceController.update,
    },
    'delete /api/v1/energy_price/:selector': {
      authenticated: true,
      controller: energyPriceController.destroy,
    },
    'get /api/v1/energy_price/default_electric_meter_feature_id': {
      authenticated: true,
      controller: energyPriceController.getDefaultElectricMeterFeatureId,
    },
  };

  Object.assign(routes, coreRoutes);

  return routes;
}

module.exports = getRoutes;
