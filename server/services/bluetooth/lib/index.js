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
const { getDiscoveredDevice } = require('./commands/bluetooth.getDiscoveredDevice');
const { getDiscoveredDevices } = require('./commands/bluetooth.getDiscoveredDevices');
const { getStatus } = require('./commands/bluetooth.getStatus');
const { readDevice } = require('./commands/bluetooth.readDevice');
const { setValue } = require('./commands/bluetooth.setValue');
const { writeDevice } = require('./commands/bluetooth.writeDevice');
const { scanDevice } = require('./commands/bluetooth.scanDevice');
const { connectDevices } = require('./commands/bluetooth.connectDevices');
const { subscribePeripheral } = require('./commands/bluetooth.subscribePeripheral');
const { applyOnPeripheral } = require('./commands/bluetooth.applyOnPeripheral');

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
BluetoothManager.prototype.getDiscoveredDevice = getDiscoveredDevice;
BluetoothManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
BluetoothManager.prototype.getStatus = getStatus;
BluetoothManager.prototype.readDevice = readDevice;
BluetoothManager.prototype.writeDevice = writeDevice;
BluetoothManager.prototype.scanDevice = scanDevice;
BluetoothManager.prototype.connectDevices = connectDevices;
BluetoothManager.prototype.subscribePeripheral = subscribePeripheral;
BluetoothManager.prototype.applyOnPeripheral = applyOnPeripheral;
// Gladys commands
BluetoothManager.prototype.setValue = setValue;
BluetoothManager.prototype.poll = readDevice;

module.exports = BluetoothManager;
