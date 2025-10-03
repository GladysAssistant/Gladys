const { fake } = require('sinon');

const NukiMQTTHandlerMock = function NukiMQTTHandlerMock() {};

NukiMQTTHandlerMock.prototype.connect = fake.returns(null);
NukiMQTTHandlerMock.prototype.disconnect = fake.returns(null);
NukiMQTTHandlerMock.prototype.scan = fake.returns(null);
NukiMQTTHandlerMock.prototype.getValue = fake.returns(null);
NukiMQTTHandlerMock.prototype.subscribeDeviceTopic = fake.returns(null);

module.exports = NukiMQTTHandlerMock;
