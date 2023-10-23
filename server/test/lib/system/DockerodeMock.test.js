const sinon = require('sinon');
const stream = require('stream');

const { fake } = sinon;
const { containers, images, networks } = require('./DockerApiMock.test');

class Docker {
  constructor() {
    this.modem = {
      followProgress: this.followProgress,
      demuxStream: (oneStream) => oneStream.emit('end'),
    };
  }
}

Docker.prototype.listContainers = fake.resolves(containers);
Docker.prototype.listImages = fake.resolves(images);
Docker.prototype.createContainer = fake.resolves({ id: containers[0].Id });

Docker.prototype.getContainer = fake.returns({
  inspect: fake.resolves({
    HostConfig: {
      NetworkMode: 'host',
      Devices: [
        {
          PathOnHost: '/dev/ttyUSB0',
          PathInContainer: '/dev/ttyACM0',
          CgroupPermissions: 'rwm',
        },
      ],
    },
    SizeRw: 152635,
  }),
  restart: fake.resolves(true),
  remove: fake.resolves(true),
  stop: fake.resolves(true),
  exec: ({ Cmd }) => {
    const mockedStream = new stream.Readable();
    return fake.resolves({
      start: sinon.stub().yields(Cmd[0] === 'fail' ? 'error' : null, mockedStream),
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

Docker.prototype.followProgress = (onStream, onFinished, onProgress) => {
  onProgress({});
  onFinished(null, {});
};

module.exports = Docker;
