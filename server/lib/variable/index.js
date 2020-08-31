const { destroy } = require('./variable.destroy');
const { getValue } = require('./variable.getValue');
const { setValue } = require('./variable.setValue');

const Variable = function Variable(event) {
  this.event = event;
};

Variable.prototype.destroy = destroy;
Variable.prototype.setValue = setValue;
Variable.prototype.getValue = getValue;

module.exports = Variable;
