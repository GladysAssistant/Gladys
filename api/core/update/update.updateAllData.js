const Promise = require('bluebird');

module.exports = function(user) {
  return Promise.all([
    gladys.update.getActions(user),
    gladys.update.getAnswers(user),
    gladys.update.getBoxTypes(user),
    gladys.update.getCategories(user),
    gladys.update.getEvents(user),
    gladys.update.getSentences(user),
    gladys.update.getStates(user)
  ]);
};