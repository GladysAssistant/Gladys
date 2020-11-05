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
const { completeDevice } = require('./commands/bluetooth.completeDevice');
const { getDiscoveredDevice } = require('./commands/bluetooth.getDiscoveredDevice');
const { getDiscoveredDevices } = require('./commands/bluetooth.getDiscoveredDevices');
const { getStatus } = require('./commands/bluetooth.getStatus');
const { readDevice } = require('./commands/bluetooth.readDevice');
const { poll } = require('./commands/bluetooth.poll');
const { setValue } = require('./commands/bluetooth.setValue');
const { writeDevice } = require('./commands/bluetooth.writeDevice');
const { scanDevice } = require('./commands/bluetooth.scanDevice');
const { connectDevices } = require('./commands/bluetooth.connectDevices');
const { subscribeDevice } = require('./commands/bluetooth.subscribeDevice');
const { applyOnPeripheral } = require('./commands/bluetooth.applyOnPeripheral');
const { getCharacteristic } = require('./commands/bluetooth.getCharacteristic');

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
BluetoothManager.prototype.completeDevice = completeDevice;
BluetoothManager.prototype.getDiscoveredDevice = getDiscoveredDevice;
BluetoothManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
BluetoothManager.prototype.getStatus = getStatus;
BluetoothManager.prototype.readDevice = readDevice;
BluetoothManager.prototype.writeDevice = writeDevice;
BluetoothManager.prototype.scanDevice = scanDevice;
BluetoothManager.prototype.connectDevices = connectDevices;
BluetoothManager.prototype.subscribeDevice = subscribeDevice;
BluetoothManager.prototype.applyOnPeripheral = applyOnPeripheral;
BluetoothManager.prototype.getCharacteristic = getCharacteristic;

// Gladys commands
BluetoothManager.prototype.setValue = setValue;
BluetoothManager.prototype.poll = poll;

module.exports = BluetoothManager;
