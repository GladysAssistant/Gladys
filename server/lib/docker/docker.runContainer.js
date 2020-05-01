const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Run container.
 * @param {Object} containerOptions - Parameters passed to Docker run command.
 * @returns {Promise} Running container.
 * @example
 * const container = await runContainer();
 */
async function runContainer(containerOptions) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.run(containerOptions.image, null, null, containerOptions.options);

  /*  docker.createContainer({
    Image: 'ubuntu',
    Cmd: ['ls', 'stuff'],
    'Volumes': {
      '/stuff': {}
    },
    'Binds': ['C:\Users\User\data:/stuff:rw']
  }, function(err, container) {
    container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      tty: true,
      'Binds': ['C:\Users\User\data:/stuff:rw']
    }, function(err, stream) {
      stream.pipe(process.stdout);

      container.start({
        'Binds': ['C:\Users\User\data:/stuff:rw']
      }, function(err, data) {
        console.log(data);
      });
    });
  }); */
  return container;
}

module.exports = {
  runContainer,
};
