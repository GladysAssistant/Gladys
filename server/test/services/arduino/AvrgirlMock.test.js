const { fake } = require('sinon');
const EventEmitter = require('events');

const Avrgirl = function Avrgirl(options) {};

Avrgirl.prototype = Object.create(new EventEmitter());

Avrgirl.prototype.flash = fake.resolves(null);

module.exports = Avrgirl;
