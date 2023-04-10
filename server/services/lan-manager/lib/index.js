const { init } = require('./lan-manager.init');
const { stop } = require('./lan-manager.stop');
const { scan } = require('./lan-manager.scan');
const { getStatus } = require('./lan-manager.getStatus');
const { getConfiguration } = require('./lan-manager.getConfiguration');
const { loadConfiguration } = require('./lan-manager.loadConfiguration');
const { saveConfiguration } = require('./lan-manager.saveConfiguration');
const { getDiscoveredDevices } = require('./lan-manager.getDiscoveredDevices');
const { transformDevice } = require('./lan-manager.transformDevice');
const { mergeWithExistingDevice } = require('./lan-manager.mergeWithExistingDevice');
const { initPresenceScanner } = require('./lan-manager.initPresenceScanner');
const { scanPresence } = require('./lan-manager.scanPresence');

const { PRESENCE_STATUS, TIMERS } = require('./lan-manager.constants');

const LANManager = function LANManager(gladys, serviceId, ScannerClass) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.configured = false;
  this.scanning = false;
  this.ScannerClass = ScannerClass;
  this.scanner = null;
  this.discoveredDevices = [];

  this.presenceScanner = {
    status: PRESENCE_STATUS.ENABLED,
    frequency: TIMERS.PRESENCE,
  };

  this.ipMasks = [];
};

LANManager.prototype.init = init;
LANManager.prototype.stop = stop;
LANManager.prototype.scan = scan;
LANManager.prototype.getConfiguration = getConfiguration;
LANManager.prototype.loadConfiguration = loadConfiguration;
LANManager.prototype.saveConfiguration = saveConfiguration;
LANManager.prototype.getStatus = getStatus;
LANManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
LANManager.prototype.transformDevice = transformDevice;
LANManager.prototype.mergeWithExistingDevice = mergeWithExistingDevice;
LANManager.prototype.initPresenceScanner = initPresenceScanner;
LANManager.prototype.scanPresence = scanPresence;

module.exports = LANManager;
