const { getValue } = require('./variable.getValue');
const { setValue } = require('./variable.setValue');

const Variable = function Variable() {};

Variable.prototype.setValue = setValue;
Variable.prototype.getValue = getValue;

module.exports = Variable;
