const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS } = require('../../utils/constants');
const { resolveAiChatModel } = require('../../utils/aiChatModels');
const { Error400 } = require('../../utils/httpErrors');

module.exports = function MessageController(gladys) {
  /**
   * @api {post} /api/v1/message Send message to Gladys
   * @apiName SendMessage
   * @apiGroup Message
   * @apiParam {string} text Text to send
   * @apiSuccessExample {json} Success-Example
   * {
   *   "text": "Turn on the light in the kitchen",
   *   "source": "api_client",
   *   "language": "fr",
   *   "source_user_id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "created_at": "2019-05-09T03:40:52.881Z"
   * }
   */
  async function create(req, res) {
    const resolvedModel = resolveAiChatModel(req.body.model);
    if (req.body.model && resolvedModel === null) {
      throw new Error400('INVALID_AI_MODEL');
    }

    const messageToSend = {
      text: req.body.text,
      source: 'api_client',
      language: req.user.language,
      source_user_id: req.user.id,
      user: req.user,
      created_at: req.body.created_at || new Date(),
      id: req.body.id,
    };
    if (resolvedModel) {
      messageToSend.model = resolvedModel;
    }
    gladys.event.emit(EVENTS.MESSAGE.NEW, messageToSend);
    res.status(201).json({
      text: req.body.text,
      source: 'api_client',
      language: req.user.language,
      source_user_id: req.user.id,
      created_at: messageToSend.created_at,
    });
  }

  /**
   * @api {get} /api/v1/message get
   * @apiName get
   * @apiGroup Message
   */
  async function get(req, res) {
    const messages = await gladys.message.get(req.user.id);
    res.json(messages);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    get: asyncMiddleware(get),
  });
};
