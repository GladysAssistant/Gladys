const { fake } = require('sinon');
const EventEmitter = require('events');

const ReadLine = function ReadLine(options) {};

ReadLine.prototype = Object.create(new EventEmitter());

ReadLine.on = () => {
  return fake.resolves(null);
};

ReadLine.prototype.pipe = fake.resolves(null);
ReadLine.prototype.open = fake.resolves(null);
ReadLine.prototype.on = fake.resolves(null);

module.exports = ReadLine;
