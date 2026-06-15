const { Op } = require('sequelize');

const db = require('../../models');

/**
 * @description Build previous chat exchanges for AI context from stored messages.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<{question: string|null, answer: string|null}>>} Previous exchanges.
 * @example
 * getPreviousQuestionsForUser('user-uuid');
 */
async function getPreviousQuestionsForUser(userId) {
  const previousMessages = await db.Message.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    order: [['created_at', 'desc']],
    limit: 4,
  });

  const previousQuestions = [];
  let currentExchange = null;

  previousMessages.reverse().forEach((msg) => {
    if (msg.sender_id !== null) {
      currentExchange = {
        question: msg.text,
        answer: null,
      };
    } else if (currentExchange && currentExchange.question && !currentExchange.answer) {
      currentExchange.answer = msg.text;
      previousQuestions.push({ ...currentExchange });
      currentExchange = null;
    } else {
      previousQuestions.push({
        question: null,
        answer: msg.text,
      });
    }
  });

  return previousQuestions;
}

module.exports = {
  getPreviousQuestionsForUser,
};
