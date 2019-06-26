const { fake } = require('sinon');

class Docker {
  constructor() {
    this.modem = {
      followProgress: this.followProgress,
    };
  }
}

Docker.prototype.listContainers = fake.resolves([
  {
    Id: 'b7b26232-2e3b-4425-a986-30f949a5e5e2',
    Names: ['/Gladys'],
  },
  {
    Id: 'b594e692-e6d3-4531-bdcc-f0afcf515113',
    Names: ['/watchtower'],
    Image: 'containrrr/watchtower',
  },
]);

Docker.prototype.getContainer = fake.returns({
  restart: fake.resolves(null),
});

Docker.prototype.pull = fake.resolves(null);
Docker.prototype.followProgress = (stream, onFinished, onProgress) => {
  onProgress({});
  onFinished(null, {});
};

module.exports = Docker;
