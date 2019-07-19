const { play } = require('./music.play');
const { callService } = require('./music.callService');
const { getPlaylist } = require('./music.getPlaylist');

const MusicHandler = function MusicHandler(event, stateManager, brain, serviceManager) {
  this.event = event;
  this.stateManager = stateManager;
  this.brain = brain;
  this.serviceManager = serviceManager;
};

MusicHandler.prototype.callService = callService;
MusicHandler.prototype.play = play;
MusicHandler.prototype.getPlaylist = getPlaylist;

module.exports = MusicHandler;
