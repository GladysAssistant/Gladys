const { fake } = require('sinon');
const EventEmitter = require('events');

const Avrgirl = function Avrgirl(options) {
  // return fake.resolves(null);
};

Avrgirl.prototype = Object.create(new EventEmitter());

Avrgirl.prototype.flash = fake.resolves(null);

module.exports = Avrgirl;
