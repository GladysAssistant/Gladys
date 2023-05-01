const logger = require('../../utils/logger');
const BluetoothManager = require('./lib');
const BluetoothController = require('./api/bluetooth.controller');

module.exports = function BluetoothService(gladys, serviceId) {
  const bluetoothManager = new BluetoothManager(gladys, serviceId);

  /**
   * @public
   * @description Starts the Bluetooth service.
   * @example
   * gladys.services.bluetooth.start();
   */
  async function start() {
    logger.info('Starting Bluetooth service');
    await bluetoothManager.start();
  }

  /**
   * @public
   * @description This function stops the Bluetooth service.
   * @example
   * gladys.services.bluetooth.stop();
   */
  async function stop() {
    logger.info('Stopping Bluetooth service');
    await bluetoothManager.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: bluetoothManager,
    controllers: BluetoothController(bluetoothManager),
  });
};
