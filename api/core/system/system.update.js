const spawn = require('child_process').spawn;

module.exports = function(){
    const child = spawn('sh', [sails.config.update.updateScript], {
        detached: true,
        stdio: 'ignore'
    });

    child.on('error', (err) => {
        sails.log.error('Failed to start update script');
        sails.log.error(err);
    });

    child.unref();
}