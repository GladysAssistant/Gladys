const sinon = require('sinon');

const { fake } = sinon;
const { containers, images, networks } = require('./DockerApiMock.test');

class Docker {
  constructor() {
    this.modem = {
      followProgress: this.followProgress,
    };
  }
}

Docker.prototype.listContainers = fake.resolves(containers);
Docker.prototype.listImages = fake.resolves(images);
Docker.prototype.createContainer = fake.resolves({ id: containers[0].Id });

Docker.prototype.getContainer = fake.returns({
  restart: fake.resolves(true),
  exec: ({ Cmd }) => {
    return fake.resolves({
      start: sinon.stub().yields(Cmd[0] === 'fail' ? 'error' : null, 'success'),
    })();
  },
});

Docker.prototype.getNetwork = (networkName) => {
  const network = networks.find((n) => n.Name === networkName);

  if (network) {
    return Promise.resolve(network);
  }

  return Promise.reject(new Error('Network not found'));
};

Docker.prototype.createNetwork = fake.resolves(true);

Docker.prototype.pull = (repoTag) => {
  if (repoTag.endsWith('latest')) {
    return fake.resolves(true)();
  }
  return fake.rejects('ERROR')();
};

Docker.prototype.followProgress = (stream, onFinished, onProgress) => {
  onProgress({});
  onFinished(null, {});
};

module.exports = Docker;
