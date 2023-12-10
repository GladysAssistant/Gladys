const { NlpManager } = require('node-nlp');
const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

const { addNamedEntity } = require('./brain.addNamedEntity');
const { removeNamedEntity } = require('./brain.removeNamedEntity');
const { train } = require('./brain.train');
const { classify } = require('./brain.classify');
const { getReply } = require('./brain.getReply');
const { load } = require('./brain.load');
const { getEntityIdByName } = require('./brain.getEntityIdByName');

const Brain = function Brain() {
  this.nlpManager = new NlpManager({
    ner: { threshold: 0.8, builtins: [] },
    languages: SUPPORTED_LANGUAGES,
    nlu: { log: false },
    autoSave: false,
  });
  this.namedEntities = {
    room: new Map(),
    scene: new Map(),
    device: new Map(),
  };
};

Brain.prototype.addNamedEntity = addNamedEntity;
Brain.prototype.removeNamedEntity = removeNamedEntity;
Brain.prototype.train = train;
Brain.prototype.load = load;
Brain.prototype.classify = classify;
Brain.prototype.getReply = getReply;
Brain.prototype.getEntityIdByName = getEntityIdByName;

module.exports = Brain;
