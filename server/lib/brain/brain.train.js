const { getConfiguration } = require('../../config/brain/index');
const logger = require('../../utils/logger');
/**
 * @description Train the brain.
 * @example
 * brain.train();
 */
async function train() {
  // first, we read the configuration folder
  const brainConfig = getConfiguration();

  // we fill the this.nlpManager with all questions
  brainConfig.questions.forEach((question) => {
    // we add questions text
    question.questions.forEach((text) => {
      this.nlpManager.addDocument(question.language, text, question.label);
    });
    // we add synchronous answers
    if (question.answers) {
      question.answers.forEach((text) => {
        this.nlpManager.addAnswer(question.language, question.label, text);
      });
    }
    // if there are slots in the question, we handle them
    if (question.slots) {
      question.slots.forEach((slot) => {
        if (slot.betweenCondition) {
          this.nlpManager.addBetweenCondition(
            question.language,
            slot.key,
            slot.betweenCondition.between[0],
            slot.betweenCondition.between[1],
            slot.betweenCondition.options,
          );
        }
        if (slot.afterLastCondition) {
          this.nlpManager.addAfterLastCondition(
            question.language,
            slot.key,
            slot.afterLastCondition.after,
            slot.afterLastCondition.options,
          );
        }
        this.nlpManager.nlp.slotManager.addSlot(question.label, slot.key, slot.mandatory, {
          [question.language]: slot.ifMissing,
        });
      });
    }
  });

  // we fill the nlgManager with all async answers
  brainConfig.answers.forEach((answer) => {
    answer.answers.forEach((text) => {
      this.nlpManager.addAnswer(answer.language, answer.label, text);
    });
  });

  // training
  logger.debug(`Training brain...`);
  await this.nlpManager.train();
  logger.debug(`Brain trained!`);
}

module.exports = {
  train,
};
