var vm = require('vm');
var shared = require('./script.shared.js');
const clone = require('clone');

module.exports = function(options) {

    // handle both direct call and scenario call
    var id = options.id || options.params.id;

    return gladys.script.getById({id})
        .then(function(script) {
            return execCode(script.text, options.user);
        });
};

// execute the code
function execCode(code, user) {
    return new Promise(function(resolve, reject) {
        try {
            var script = new vm.Script(code, sails.config.scripts.vmOptions);

            // we clone the sandbox so that all users do not have the same object
            var sandbox = clone(shared.sandbox, false, 1);

            // add context
            sandbox.context = {
                user: user
            };

            script.runInNewContext(sandbox);

            resolve();
        } catch (e) {
            sails.log.warn('Error in script : ' + e);
            return reject(e);
        }
    });
}
