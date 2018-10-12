const Promise = require('bluebird');

module.exports = function() {
  return Promise.all([
    gladys.update.getActions(),
    gladys.update.getAnswers(),
    gladys.update.getBoxTypes(),
    gladys.update.getCategories(),
    gladys.update.getEvents(),
    gladys.update.getSentences(),
    gladys.update.getStates()
  ]);
};