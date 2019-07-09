module.exports = function xiaomiController(gladys, xiaomiManager, serviceId) {
  
  /**
   * @api {get} /api/v1/service/xiaomi Get Xiaomi sensor temperature
   * @apiName getTemperatureSensor
   * @apiGroup Xiaomi
   */
  async function getSensor(req, res) {
    const magnetSensor = await xiaomiManager.getMagnetSensor();
    const temperatureSensor = await xiaomiManager.getTemperatureSensor();
    const motionSensor = await xiaomiManager.getMotionSensor();
    const sensor = {};
    const keysMagnet = Object.keys(magnetSensor);
    keysMagnet.forEach((keys) => {
      sensor[keys] = magnetSensor[keys];
    });
    const keysMotion = Object.keys(motionSensor);
    keysMotion.forEach((keys) => {
      sensor[keys] = motionSensor[keys];
    });
    const keysTemperature = Object.keys(temperatureSensor);
    keysTemperature.forEach((keys) => {
      sensor[keys] = temperatureSensor[keys];
    });
    res.json(sensor);
  }

  /**
   * @api {get} /api/v1/service/xiaomi/sensor/temperature Get Xiaomi sensor temperature
   * @apiName getTemperatureSensor
   * @apiGroup Xiaomi
   */
  async function getTemperatureSensor(req, res) {
    const temperatureSensor = await xiaomiManager.getTemperatureSensor();
    res.json(temperatureSensor);
  }

  /**
   * @api {get} /api/v1/service/xiaomi/sensor/magnet Get Xiaomi sensor magnet
   * @apiName getMagnetSensor
   * @apiGroup Xiaomi
   */
  async function getMagnetSensor(req, res) {
    const magnetSensor = await xiaomiManager.getMagnetSensor();
    res.json(magnetSensor);
  }

  /**
   * @api {get} /api/v1/service/xiaomi/sensor/motion Get Xiaomi sensor motion
   * @apiName getMotionSensor
   * @apiGroup Xiaomi
   */
  async function getMotionSensor(req, res) {
    const motionSensor = await xiaomiManager.getMotionSensor();
    res.json(motionSensor);
  }

  return {
    'get /api/v1/service/xiaomi/sensor': {
      authenticated: true,
      controller: getSensor,
    },
    'get /api/v1/service/xiaomi/sensor/temperature': {
      authenticated: true,
      controller: getTemperatureSensor,
    },
    'get /api/v1/service/xiaomi/sensor/magnet': {
      authenticated: true,
      controller: getMagnetSensor,
    },
    'get /api/v1/service/xiaomi/sensor/motion': {
      authenticated: true,
      controller: getMotionSensor,
    },
  };
};
