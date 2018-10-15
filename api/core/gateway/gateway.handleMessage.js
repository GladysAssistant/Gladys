const callApi = require('./utils').callApi;
const importControllers = require('./utils').importControllers;

var controllers = importControllers();
var idRouteRegex = /\/\d+\//g;

module.exports = function(data, cb) {
  switch (data.type) {
  case 'gladys-api-call':
    var route = (data.options.method + ' ' + data.options.url).toLowerCase();

    var id = route.match(idRouteRegex);
    route = route.replace(idRouteRegex, '/:id/');

    var params = {};

    if (id && id.length > 0) {
      params.id = id[0].replace(/\//g, '');
    }

    var controller = controllers[route];
    if (!controller) {
      return cb({ error_code: 'ROUTE_NOT_FOUND', error_message: `Route: ${route} not found` });
    }

    callApi(data.sender_id, controller, params, data.options.query, data.options.data, cb);
    break;

  default:
    sails.log.warn(`Gladys Gateway: Unknown message type ${data.type}`);
    cb(new Error('INVALID_MESSAGE_TYPE'));
    break;
  }
};