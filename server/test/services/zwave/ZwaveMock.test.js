const { fake } = require('sinon');
const EventEmitter = require('events');

const ZwaveMock = function ZwaveMock(options) {};

ZwaveMock.prototype = Object.create(new EventEmitter());

ZwaveMock.prototype.addNode = fake.returns(null);
ZwaveMock.prototype.removeNode = fake.returns(null);
ZwaveMock.prototype.connect = fake.returns(null);
ZwaveMock.prototype.disconnect = fake.returns(null);
ZwaveMock.prototype.setValue = fake.returns(null);
ZwaveMock.prototype.hardReset = fake.returns(null);
ZwaveMock.prototype.softReset = fake.returns(null);
ZwaveMock.prototype.healNetwork = fake.returns(null);
ZwaveMock.prototype.requestAllConfigParams = fake.returns(null);
ZwaveMock.prototype.setNodeName = fake.returns(null);

ZwaveMock.prototype.getControllerNodeId = fake.returns(1);
ZwaveMock.prototype.getSUCNodeId = fake.returns(1);
ZwaveMock.prototype.isPrimaryController = fake.returns(true);
ZwaveMock.prototype.isStaticUpdateController = fake.returns(true);
ZwaveMock.prototype.isBridgeController = fake.returns(false);
ZwaveMock.prototype.getLibraryVersion = fake.returns('Z-Wave 3.99');
ZwaveMock.prototype.getLibraryTypeName = fake.returns('Static Controller');
ZwaveMock.prototype.getSendQueueCount = fake.returns(3);

module.exports = ZwaveMock;
