const { request } = require('./http.request');

const Http = function Http(system) {
  this.system = system;
};

Http.prototype.request = request;

module.exports = Http;
