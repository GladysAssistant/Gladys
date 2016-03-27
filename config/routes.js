/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/


  // views
  '/login' : 'WelcomeController.login',
  '/': 'WelcomeController.index',
  '/installation': 'WelcomeController.installation',
  
  //dashboard
  '/dashboard': 'DashboardController.index' ,
  
  // Box
  'get /box': 'BoxController.index',
  'post /box': 'BoxController.create',
  'delete /box/:id': 'BoxController.delete',
  
  //BoxType
  'get /boxtype' : 'BoxTypeController.index',
  
  // Brain
  'get /brain/classify': 'BrainController.classify', 
  'post /brain/trainnew': 'BrainController.trainNew', 
  
  // Device 
  
  'get /device': 'DeviceController.index',
  'post /device': 'DeviceController.create',
  'patch /device/:id': 'DeviceController.update',
  'delete /device/:id': 'DeviceController.delete',
  'get /device/:id/devicetype': 'DeviceController.getDeviceTypes',
  
  
  // DeviceState
  
  'get /devicestate': 'DeviceStateController.index',
  
  // DeviceType
  
  'get /devicetype': 'DeviceTypeController.index',
  'patch /devicetype/:id': 'DeviceTypeController.update',
  'post /devicetype/:id/exec': 'DeviceTypeController.exec',
  
  // Event
  
  'get /event': 'EventController.index',
  
  // House
  'get /house': 'HouseController.index',
  'post /house': 'HouseController.create',
  'patch /house/:id': 'HouseController.update',
  'delete /house/:id': 'HouseController.delete',
  
  // Location
  'post /location': 'LocationController.create',
  'get /location/create': 'LocationController.create',
  
  // Module
  'get /module': 'ModuleController.index',
  
  // Notification
  'get /notification': 'NotificationController.index',
  
  // Script
  'get /script': 'ScriptController.index',
  'post /script': 'ScriptController.create',
  'patch /script/:id': 'ScriptController.update',
  'post /script/:id/exec': 'ScriptController.exec',
  'delete /script/:id': 'ScriptController.delete',
  
  // Room
  'get /room': 'RoomController.index',
  'post /room': 'RoomController.create',
  'patch /room/:id': 'RoomController.update',
  'delete /room/:id': 'RoomController.delete',
  
  //Socket
  
  'post /socket/subscribe': 'SocketController.subscribe',
  
  // Update
  'get /update/verify': 'UpdateController.verify',
  'get /update/event': 'UpdateController.updateEvents',
  'get /update/mode': 'UpdateController.updateModes',
  'get /update/sentence': 'UpdateController.updateSentences',
  'get /update/box': 'UpdateController.updateBoxTypes',
  
  //User
  'get /user': 'UserController.index',
  'post /user': 'UserController.create',
  'post /user/login': 'UserController.login',
  'patch /user/:id': 'UserController.update',
  'delete /user/:id': 'UserController.delete',
  'get /user/whoami': 'UserController.whoami',
  
  
  // Weather
  'get /weather': 'WeatherController.index'



  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  *  If a request to a URL doesn't match any of the custom routes above, it  *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
