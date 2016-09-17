var child_process = require('child_process');

module.exports = function(){
    return exec(sails.config.update.updateScript);
}

/**
 * Exec a shell command
 */
function exec(command){
    return new Promise(function(resolve, reject){
        child_process.exec(command, function (err, stdout, stderr){
            if(err) return reject(err);
            
            return resolve(stdout);
        });
    });
}