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

  /**
   * @api {post} /api/v1/service/telegram/disable Disable the Telegram integration
   * @apiName disable
   * @apiGroup Telegram
   */
  async function disable(req, res) {
    await messageHandler.disable();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/telegram/link': {
      authenticated: true,
      controller: asyncMiddleware(getCustomLink),
    },
    'post /api/v1/service/telegram/disable': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disable),
    },
  };
};
