service will be find here : /gladys_path/server/services/ecovacs

commands :
ecovacs.start.js
ecovacs.stop.js


HANDLER
Handler class name prefix (ie: AndroidTv => AndroidTvHandler)  : EcovacsHandler
const ecovacs = new EcovacsHandler(gladys, serviceId);


API
controller class name prefix (ie : AndroidTv => AndroidTVController) : EcovacsController
const Ecovacs = require('./api/ecovacs.controller');

controllers: EcovacsController(ecovacs);
