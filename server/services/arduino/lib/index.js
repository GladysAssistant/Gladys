const ArduinoManager = function ArduinoManager(Arduino, eventManager, serviceId) {
    this.eventManager = eventManager;
    this.serviceId = serviceId;
    this.nodes = {};
    this.connected = false;
    // setup all events listener
    /*this.arduino.on('driver ready', this.driverReady.bind(this));
    this.arduino.on('driver failed', this.driverFailed.bind(this));
    this.arduino.on('node added', this.nodeAdded.bind(this));
    this.arduino.on('node removed', this.nodeRemoved.bind(this));
    this.arduino.on('node event', this.nodeEvent.bind(this));
    this.arduino.on('value added', this.valueAdded.bind(this));
    this.arduino.on('value changed', this.valueChanged.bind(this));
    this.arduino.on('node ready', this.nodeReady.bind(this));
    this.arduino.on('notification', this.notification.bind(this));
    this.arduino.on('scan complete', this.scanComplete.bind(this));
    this.arduino.on('controller command', this.controllerCommand.bind(this));*/
};

module.exports = ArduinoManager;