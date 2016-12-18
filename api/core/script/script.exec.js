var vm = require('vm');
var shared = require('./script.shared.js');

module.exports = function(options) {

    // handle both direct call and scenario call
    var id = options.id || options.params.id;

    return gladys.script.getById({id})
        .then(function(script) {
            return execCode(script.text, options.scope.user);
        });
};

// execute the code
function execCode(code, user) {
    return new Promise(function(resolve, reject) {
        try {
            shared.sandbox.user = user;
            var script = new vm.Script(code, sails.config.scripts.vmOptions);
            script.runInNewContext(shared.sandbox);
            resolve();
        } catch (e) {
            sails.log.warn('Error in script : ' + e);
            return reject(e);
        }
    });
}
