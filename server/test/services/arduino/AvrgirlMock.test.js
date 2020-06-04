const { fake } = require('sinon');
const EventEmitter = require('events');

const Avrgirl = function Avrgirl() {
  return fake.resolves(null);
};

Avrgirl.prototype = Object.create(new EventEmitter());

Avrgirl.flash = () => {
  return new Promise(null);
};

module.exports = Avrgirl;
