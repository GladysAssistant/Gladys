/**
 * @public
 * @description this function returns a list of methods passed in parameters with a true or false value if they are exposed by a module.
 * @name gladys.module.getMethods
 * @param {string} module The module slug
 * @param {string} service The name of the gladys api service, like 'television', 'music', ... (option)
 * @param {array} methods the module's method(s) you want to test
 * @returns {array} data
 * @example
 * 
 * var params = {
            'module' :"livebox",
            'service':"television",
            'methods' :["getState", "setChannel", "getChannel", "setMuted", "getMuted"]
        };
 * 
 * gladys.module.getMethods(params)
 *      .then((data) => {
 *          var availableMethods = data.data
 *          
 *      })
 *      .catch((err) => {
 *          // something bad happened ! :/
 *      });
 * 
 * The structure of availableMethods is then as follows:
 * {
 *  getState: true,
 *  setChannel: true,
 *  getChannel: false,
 *  setMuted: true,
 *  getMuted: false
 *  }
 */


module.exports = function getMethods(params) {
  var availableMethods = {};
  if(params.hasOwnProperty('service')) {
    params.methods.forEach(function(method) {
      if (!gladys.modules[params.module] || !gladys.modules[params.module][params.service] || typeof gladys.modules[params.module][params.service][method] != 'function') {
        availableMethods[method] = false;
      } else {
        availableMethods[method] = true;
      }   
    });        
  } else {
    params.methods.forEach(function(method) {
      if (!gladys.modules[params.module] || typeof gladys.modules[params.module][method] != 'function') {
        availableMethods[method] = false;
      } else {
        availableMethods[method] = true;
      }   
    });        
  }


  return Promise.resolve(availableMethods);
};