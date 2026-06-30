const { getAnswers } = require('../../config/brain/index');
const logger = require('../../utils/logger');

/**
 * @description Load brain answer templates from configuration files.
 * @example
 * brain.load();
 */
async function load() {
  const answers = getAnswers();

  this.answers.clear();
  answers.forEach((answer) => {
    const key = `${answer.language}:${answer.label}`;
    this.answers.set(key, answer.answers);
  });

  logger.debug('Brain answers loaded');
}

module.exports = {
  load,
};
