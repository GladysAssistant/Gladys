const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TelegramController(messageHandler) {
  /**
   * @api {get} /api/v1/service/telegram/link Get custom link
   * @apiName getCustomLink
   * @apiGroup Telegram
   */
  async function getCustomLink(req, res) {
    const customLink = await messageHandler.getCustomLink(req.user.id);
    res.json({
      link: customLink,
    });
  }

  return {
    'get /api/v1/service/telegram/link': {
      authenticated: true,
      controller: asyncMiddleware(getCustomLink),
    },
  };
};
