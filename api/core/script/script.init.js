var shared = require('./script.shared.js');

module.exports = function init() {

  // adding sails.log function to sandbox
  shared.sandbox.sails = {};
  shared.sandbox.sails.log = sails.log;
  shared.sandbox.gladys = gladys;
};