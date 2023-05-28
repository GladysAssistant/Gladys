const { EVENTS } = require('../../utils/constants');
const { play } = require('./speaker.play');
const { stop } = require('./speaker.stop');
const { mute } = require('./speaker.mute');
const { pause } = require('./speaker.pause');
const { volume } = require('./speaker.volume');
const { buildSpeakerStream } = require('./utils/speaker.buildSpeakerStream');
const { buildStreamControl } = require('./utils/speaker.buildStreamControl');
const { removeStreamControl } = require('./utils/speaker.removeStreamControl');
const { checkStreamControl } = require('./utils/speaker.checkStreamControl');

const SpeakerHandler = function SpeakerHandler(event, service) {
  this.event = event;
  this.service = service;
  this.mapOfStreamControl = new Map();
  this.defaultOutputName = 'default';

  event.on(EVENTS.MUSIC.PLAY, (message) => this.play(message));
  event.on(EVENTS.MUSIC.STOP, (message) => this.stop(message));
  event.on(EVENTS.MUSIC.PAUSE, (message) => this.pause(message));
  event.on(EVENTS.MUSIC.VOLUME, (message) => this.volume(message));
  event.on(EVENTS.MUSIC.MUTE, (message) => this.mute(message));
};

SpeakerHandler.prototype.play = play;
SpeakerHandler.prototype.stop = stop;
SpeakerHandler.prototype.mute = mute;
SpeakerHandler.prototype.pause = pause;
SpeakerHandler.prototype.volume = volume;
SpeakerHandler.prototype.buildSpeakerStream = buildSpeakerStream;
SpeakerHandler.prototype.buildStreamControl = buildStreamControl;
SpeakerHandler.prototype.removeStreamControl = removeStreamControl;
SpeakerHandler.prototype.checkStreamControl = checkStreamControl;

module.exports = SpeakerHandler;
