const callApi = require('./utils').callApi;
const importControllers = require('./utils').importControllers;
const DeviceTypeController = require('../../controllers/DeviceTypeController.js');

var controllers = importControllers();

module.exports = function(data, cb) {
  switch(data.type) {
    case 'gladys-api-call':
      var route = (data.options.method + ' ' + data.options.url).toLowerCase();
      var controller = controllers[route];
      if(!controller) {
        return cb(new Error('ROUTE_NOT_FOUND'));
      }
      callApi(data.sender_id, controller, cb);
    break;

    default: 
      sails.log.warn(`Gladys Gateway: Unknown message type ${data.type}`);
      cb(new Error('INVALID_MESSAGE_TYPE'));
    break;
  } 
};