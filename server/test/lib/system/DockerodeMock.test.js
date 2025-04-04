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

const container = {
  id: containers[0].Id,
  start: fake.resolves(true),
  wait: fake.resolves({ StatusCode: 0 }),
  logs: () => {
    const logStream = {
      on: (event, callback) => {
        if (event === 'data') {
          const logLines = [
            'D > Watchtower starting',
            'atime="2025-03-31T14:24:23Z" level=info msg="Watchtower 1.7.1"',
            'mtime="2025-03-31T14:24:23Z" level=info msg="Using no notifications"',
            'Htime="2025-03-31T14:24:23Z" level=info msg="Checking all containers (except explicitly disabled with label)"',
            'mtime="2025-03-31T14:24:23Z" level=info msg="Running a one time update."',
            'time="2025-03-31T14:24:23Z" level=info msg="Watchtower is running"', // Malformed line
            'mtime="2025-03-31T14:24:23Z" level=info msg="Waiting for the notification goroutine to finish"',
            'mtime="2025-03-31T14:24:23Z" level=info msg="Found new gladysassistant/gladys:add-upgrade-gladys-button image (3190df200e61)"',
            'mtime="2025-03-31T14:24:23Z" level=info msg="Stopping /gladys (12283a8deb34) with SIGTERM"',
            'mtime="2025-03-31T14:24:23Z" level=info msg="Session done"',
          ];

          logLines.forEach((line) => {
            callback(line);
          });
        }
      },
    };

    return logStream;
  },
};

Docker.prototype.createContainer = fake.resolves(container);

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
