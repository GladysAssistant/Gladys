const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function SlackController(messageHandler) {
  /**
   * @api {get} /api/v1/service/slack/link Get custom link
   * @apiName getCustomLink
   * @apiGroup RtspCamera
   */
  async function getCustomLink(req, res) {
    const customLink = await messageHandler.getCustomLink(req.user.id);
    res.json({
      link: customLink,
    });
  }

  return {
    'get /api/v1/service/slack/link': {
      authenticated: true,
      controller: asyncMiddleware(getCustomLink),
    },
  };
};
