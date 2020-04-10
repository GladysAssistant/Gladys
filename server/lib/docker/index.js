const Dockerode = require('dockerode');

const { init } = require('./docker.init');
const { isDockerInstalled } = require('./docker.isDockerInstalled');
const { getContainers } = require('./docker.getContainers');
const { startContainer } = require('./docker.startContainer');
const { stopContainer } = require('./docker.stopContainer');

const Docker = function Docker() {
  this.Dockerode = Dockerode;
  this.dockerode = null;
};

Docker.prototype.init = init;
Docker.prototype.isDockerInstalled = isDockerInstalled;
Docker.prototype.getContainers = getContainers;
Docker.prototype.startContainer = startContainer;
Docker.prototype.stopContainer = stopContainer;

module.exports = Docker;
