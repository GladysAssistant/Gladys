const { fake } = require('sinon');
const EventEmitter = require('events');

const Rflink = function Rflink(options) {};

Rflink.prototype = Object.create(new EventEmitter());

Rflink.prototype.message = fake.returns(null);
Rflink.prototype.newValue = fake.returns(null);
Rflink.prototype.addDevice = fake.returns(null);
Rflink.prototype.error = fake.returns(null);
Rflink.prototype.setValue = fake.returns(null);
Rflink.prototype.connect = fake.returns(null);
Rflink.prototype.disconnect = fake.returns(null);
Rflink.prototype.listen = fake.returns(null);
Rflink.prototype.getDevices = fake.returns(null);
Rflink.prototype.pair = fake.returns(null);
Rflink.prototype.unpair = fake.returns(null);

module.exports = Rflink;
