const { fake } = require('sinon');
const EventEmitter = require('events');

const Avrgirl = function Avrgirl(options) {};

Avrgirl.prototype = Object.create(new EventEmitter());

/* const flash = (path, req) => {
    return fake.rejects(null);
}; */

Avrgirl.prototype.flash = fake.resolves(null);

module.exports = Avrgirl;
