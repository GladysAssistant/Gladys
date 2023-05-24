const { PRESENCE_STATUS, TIMERS } = require('./utils/bluetooth.constants');

// EVENTS
const { stateChange } = require('./events/bluetooth.stateChange');
const { scanStart } = require('./events/bluetooth.scanStart');
const { scanStop } = require('./events/bluetooth.scanStop');
const { discover } = require('./events/bluetooth.discover');
const { broadcastStatus } = require('./events/bluetooth.broadcastStatus');

// COMMANDS
const { start } = require('./commands/bluetooth.start');
const { stop } = require('./commands/bluetooth.stop');
const { scan } = require('./commands/bluetooth.scan');
const { scanPresence } = require('./commands/bluetooth.scanPresence');
const { stopScanPresence } = require('./commands/bluetooth.stopScanPresence');
const { completeDevice } = require('./commands/bluetooth.completeDevice');
const { getPeripheral } = require('./commands/bluetooth.getPeripheral');
const { getDiscoveredDevice } = require('./commands/bluetooth.getDiscoveredDevice');
const { getDiscoveredDevices } = require('./commands/bluetooth.getDiscoveredDevices');
const { getStatus } = require('./commands/bluetooth.getStatus');
const { readDevice } = require('./commands/bluetooth.readDevice');
const { writeDevice } = require('./commands/bluetooth.writeDevice');
const { scanDevice } = require('./commands/bluetooth.scanDevice');
const { subscribeDevice } = require('./commands/bluetooth.subscribeDevice');
const { unsubscribeDevice } = require('./commands/bluetooth.unsubscribeDevice');
const { applyOnPeripheral } = require('./commands/bluetooth.applyOnPeripheral');
const { getCharacteristic } = require('./commands/bluetooth.getCharacteristic');

// CONFIG
const { saveConfiguration } = require('./config/bluetooth.saveConfiguration');
const { getConfiguration } = require('./config/bluetooth.getConfiguration');
const { initPresenceScanner } = require('./config/bluetooth.initPresenceScanner');

const BluetoothManager = function BluetoothManager(gladys, serviceId) {
  this.bluetooth = undefined;
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.scanTimer = undefined;
  this.scanCounter = 0;

  this.ready = false;
  this.scanning = false;
  this.peripheralLookup = false;

  this.discoveredDevices = {};

  this.presenceScanner = {
    status: PRESENCE_STATUS.ENABLED,
    frequency: TIMERS.PRESENCE,
  };
};

// EVENTS
BluetoothManager.prototype.stateChange = stateChange;
BluetoothManager.prototype.scanStart = scanStart;
BluetoothManager.prototype.scanStop = scanStop;
BluetoothManager.prototype.discover = discover;
BluetoothManager.prototype.broadcastStatus = broadcastStatus;

// COMMANDS
BluetoothManager.prototype.start = start;
BluetoothManager.prototype.stop = stop;
BluetoothManager.prototype.scan = scan;
BluetoothManager.prototype.scanPresence = scanPresence;
BluetoothManager.prototype.stopScanPresence = stopScanPresence;
BluetoothManager.prototype.completeDevice = completeDevice;
BluetoothManager.prototype.getPeripheral = getPeripheral;
BluetoothManager.prototype.getDiscoveredDevice = getDiscoveredDevice;
BluetoothManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
BluetoothManager.prototype.getStatus = getStatus;
BluetoothManager.prototype.readDevice = readDevice;
BluetoothManager.prototype.writeDevice = writeDevice;
BluetoothManager.prototype.scanDevice = scanDevice;
BluetoothManager.prototype.subscribeDevice = subscribeDevice;
BluetoothManager.prototype.unsubscribeDevice = unsubscribeDevice;
BluetoothManager.prototype.applyOnPeripheral = applyOnPeripheral;
BluetoothManager.prototype.getCharacteristic = getCharacteristic;

// CONFIG
BluetoothManager.prototype.saveConfiguration = saveConfiguration;
BluetoothManager.prototype.getConfiguration = getConfiguration;
BluetoothManager.prototype.initPresenceScanner = initPresenceScanner;

module.exports = BluetoothManager;
