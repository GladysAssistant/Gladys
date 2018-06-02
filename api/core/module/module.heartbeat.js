/**
 * @public
 * @description This function set the lastSeen attribute of the module to now
 * @name gladys.module.heartbeat
 * @param {module} module The module
 * @param {uuid} module.machine The uuid of the machine
 * @param {String} module.slug The slug of the module
 * @returns {Module} module
 * @example
 * 
 * var module = {
 *  machine: '46929309-0fa0-4f29-8c51-4d8e6ff6b078',
 *  slug: 'hue'
 * };
 * 
 * gladys.module.heartbeat(module)
 *      .then((module) => {
 *          
 *      })
 *      .catch((err) => {
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(module) {
    return Module.update({machine: module.machine, slug: module.slug}, {lastSeen: new Date()})
        .then((modules) => {
            if(modules.length === 0){
                return Promise.reject(new Error('NotFound'));
            } else {
                return Promise.resolve(modules[0]);
            }
        })
};