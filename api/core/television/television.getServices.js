const Promise = require('bluebird');

const televisionServices = {
  'play': true,
  'pause': true,
  'stop': true,
  'rewind': true,
  'fastForward': true,
  'switchState': true,
  'getState': true,
  'setChannel': true,
  'getChannel': false,
  'setMuted': true,
  'getMuted': true,
  'volumeUp': true,
  'volumeDown': true,
  'pressKey': true,
  'getSources': true,
  'openSource': true,
  'openMenu': true,
  'rec': true,
  'customCommand': true,
  'programPlus': true,
  'programMinus': true,
  'openInfo': true,
  'programVod': true
};

module.exports = function getServices(params) {
  var availableService = {};
  for (var service in televisionServices) {
    if (!gladys.modules[params.service] || typeof gladys.modules[params.service].television[service] != 'function') {
      availableService[service] = false;
    } else {
      availableService[service] = true;
    }
  }
  return Promise.resolve(availableService);
};