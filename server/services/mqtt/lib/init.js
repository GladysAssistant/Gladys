const { DEFAULT } = require('./constants');

/**
 * @description Prepares service.
 * @example
 * init();
 */
function init() {
  DEFAULT.TOPICS.forEach((topic) => {
    this.subscribe(topic, this.handleGladysMessage.bind(this));
  });
}

module.exports = {
  init,
};
