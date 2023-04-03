---
to: ./services/<%= module %>/lib/index.js
---
const <%= attributeName %>Handler = function <%= className %>Handler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

const { start } = require('./commands/<%= module %>.start');
const { stop } = require('./commands/<%= module %>.stop');
const { getStatus } = require('./commands/<%= module %>.getStatus');
const { getConfiguration } = require('./config/<%= module %>.getConfiguration');
const { saveConfiguration } = require('./config/<%= module %>.saveConfiguration');

// COMMANDS
<%= attributeName %>Handler.prototype.start = start;
<%= attributeName %>Handler.prototype.stop = stop;
<%= attributeName %>Handler.prototype.getStatus = getStatus;

// CONFIG
<%= attributeName %>Handler.prototype.getConfiguration = getConfiguration;
<%= attributeName %>Handler.prototype.saveConfiguration = saveConfiguration;

module.exports =  <%= attributeName %>Handler;
