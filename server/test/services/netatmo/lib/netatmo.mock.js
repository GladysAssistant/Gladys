const { fake } = require('sinon');
const EventEmitter = require('events');

class Netatmo extends EventEmitter {};

Netatmo.prototype.auth = fake.resolves(null);

module.exports = Netatmo;
