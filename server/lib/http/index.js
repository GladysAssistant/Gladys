const { request } = require('./http.request');

const Http = function Http() {};

Http.prototype.request = request;

module.exports = Http;
