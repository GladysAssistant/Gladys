const { NlpManager } = require('node-nlp');
const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

const { addRoom } = require('./brain.addRoom');
const { removeRoom } = require('./brain.removeRoom');
const { train } = require('./brain.train');
const { classify } = require('./brain.classify');
const { getReply } = require('./brain.getReply');
const { load } = require('./brain.load');
const { getEntityIdByName } = require('./brain.getEntityIdByName');

const Brain = function Brain() {
  this.nlpManager = new NlpManager({
    languages: SUPPORTED_LANGUAGES,
    nlu: { log: false },
    autoSave: false,
  });
  this.roomsToId = new Map();
};

Brain.prototype.addRoom = addRoom;
Brain.prototype.removeRoom = removeRoom;
Brain.prototype.train = train;
Brain.prototype.load = load;
Brain.prototype.classify = classify;
Brain.prototype.getReply = getReply;
Brain.prototype.getEntityIdByName = getEntityIdByName;

module.exports = Brain;
