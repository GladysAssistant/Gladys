const { fake } = require('sinon');
const { containers } = require('./DockerApiMock.test');

class Docker {
  constructor() {
    this.modem = {
      followProgress: this.followProgress,
    };
  }
}

Docker.prototype.listContainers = fake.resolves(containers);

Docker.prototype.getContainer = fake.returns({
  restart: fake.resolves(null),
});

Docker.prototype.pull = (repoTag, callback) => {
  if (repoTag.endsWith('latest')) {
    callback(null, {});
  } else {
    callback('ERROR');
  }
};

Docker.prototype.followProgress = (stream, onFinished, onProgress) => {
  onProgress({});
  onFinished(null, {});
};

module.exports = Docker;
