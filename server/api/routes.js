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
const SceneController = require('./controllers/scene.controller');
const SystemController = require('./controllers/system.controller');
const VariableController = require('./controllers/variable.controller');
const WeatherController = require('./controllers/weather.controller');

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
  const sceneController = SceneController(gladys);
  const systemController = SystemController(gladys);
  const weatherController = WeatherController(gladys);

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
    'get /api/v1/device_feature/aggregated_states': {
      authenticated: true,
      controller: deviceController.getDeviceFeaturesAggregated,
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
    'get /api/v1/gateway/status': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getStatus,
    },
    'post /api/v1/gateway/login': {
      authenticated: true,
      admin: true,
      controller: gatewayController.login,
    },
    'post /api/v1/gateway/logout': {
      authenticated: true,
      admin: true,
      controller: gatewayController.logout,
    },
    'post /api/v1/gateway/login-two-factor': {
      authenticated: true,
      admin: true,
      controller: gatewayController.loginTwoFactor,
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
      authenticated: true,
      admin: true,
      controller: gatewayController.getBackups,
    },
    'post /api/v1/gateway/backup': {
      authenticated: true,
      admin: true,
      controller: gatewayController.createBackup,
    },
    'post /api/v1/gateway/backup/restore': {
      authenticated: true,
      admin: true,
      controller: gatewayController.restoreBackup,
    },
    'get /api/v1/gateway/backup/restore/status': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getRestoreStatus,
    },
    'get /api/v1/gateway/instance/key': {
      authenticated: true,
      admin: true,
      controller: gatewayController.getInstanceKeysFingerprint,
    },
    'post /api/v1/gateway/openai/ask': {
      authenticated: true,
      controller: gatewayController.openAIAsk,
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
    'post /api/v1/system/upgrade/download': {
      authenticated: true,
      admin: true,
      controller: systemController.downloadUpgrade,
    },
    'get /api/v1/system/upgrade/download/status': {
      authenticated: true,
      controller: systemController.getUpgradeDownloadStatus,
    },
    'post /api/v1/system/vacuum': {
      authenticated: true,
      admin: true,
      controller: systemController.vacuum,
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
  };

  Object.assign(routes, coreRoutes);

  return routes;
}

module.exports = getRoutes;
