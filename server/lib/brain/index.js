const { load } = require('./brain.load');
const { getReply } = require('./brain.getReply');

const Brain = function Brain() {
  this.answers = new Map();
};

Brain.prototype.load = load;
Brain.prototype.getReply = getReply;

module.exports = Brain;
