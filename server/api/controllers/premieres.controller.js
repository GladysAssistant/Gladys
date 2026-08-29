const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function PremieresController(gladys) {
  /**
   * @api {get} /api/v1/premieres/upcoming get upcoming movies
   * @apiName getUpcomingMovies
   * @apiGroup Premieres
   */
  async function getUpcoming(req, res) {
    const options = {
      language: req.user.language,
      region: req.query.region,
      daysAhead: Number(req.query.daysAhead),
    };
    // ?service=<name>: the widget configuration can pin a provider —
    // premieres.getUpcoming shrinks its loop to that name, no silent fallback
    if (typeof req.query.service === 'string' && req.query.service.length > 0) {
      options.service = req.query.service;
    }
    const movies = await gladys.premieres.getUpcoming(options);
    res.json(movies);
  }

  /**
   * @api {get} /api/v1/premieres/provider get movie providers
   * @apiName getProviders
   * @apiGroup Premieres
   * @apiSuccessExample {json} Success-Example
   * [
   *   { "service_name": "tmdb", "label": null }
   * ]
   * @apiDescription The available movie providers, in the precedence order
   * of the automatic mode. Open to every authenticated user (any user can
   * configure their own premieres widget).
   */
  async function getProviders(req, res) {
    const serviceNames = gladys.premieres.getProviders();
    const integrations = await gladys.externalIntegration.get();
    const providers = serviceNames.map((serviceName) => {
      const integration = integrations.find((row) => row.name === serviceName);
      return {
        service_name: serviceName,
        label: (integration && integration.manifest && integration.manifest.name) || null,
      };
    });
    res.json(providers);
  }

  return Object.freeze({
    getUpcoming: asyncMiddleware(getUpcoming),
    getProviders: asyncMiddleware(getProviders),
  });
};
