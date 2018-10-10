var fs = require('fs');
var path = require('path');

module.exports.callApi = function(userId, controllerFunc, params, query, data, callback) {
  
  var req = {
    user: {
      id: userId
    },
    params, 
    query,
    body: data
  };
  
  var res = {
    json: callback
  };

  var next = function(err) {
    sails.log.warn('Gladys Gateway: Error in API call');
    sails.log.warn(err);
    if(err instanceof Error && err.message) {
      err = {
        status: 500,
        error_code: 'ERROR',
        error_message: err.message
      };
    }
    callback(err);
  };

  controllerFunc(req, res, next);
};

module.exports.importControllers = function() {
  var controllers = {};

  // we iterate in the list of routes
  for (var route in sails.config.routes) {
    
    // we get the path
    var routePath = sails.config.routes[route];

    // some routes are not string but object injected by sails so we test
    if(typeof routePath === 'string') {

      // The route looks like 'WelcomeController.login' so we split with the .
      var pathSplitted = routePath.split('.');

      var controllerPath = path.join(__dirname, '../../controllers/', pathSplitted[0] + '.js');

      // we test if the controller really exist
      if (fs.existsSync(controllerPath)) {
        var controllerObject = require(controllerPath);

        // we test if the function in the controller really exist
        if(controllerObject[pathSplitted[1]]) {
          controllers[route] = controllerObject[pathSplitted[1]];
        }
      }
    }
  }

  return controllers;
};