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
   *   { "service_name": "tmdb", "label": null, "supports_region_and_period": true }
   * ]
   * @apiDescription The available movie providers, in the precedence order
   * of the automatic mode. Open to every authenticated user (any user can
   * configure their own premieres widget). `supports_region_and_period` is
   * true only for a provider whose `movies.getUpcoming(options)` actually
   * interprets `region`/`daysAhead` (TMDB does; an arbitrary "movies"-type
   * external integration is not assumed to) — the widget configuration uses
   * it to hide those two fields for a provider they don't apply to.
   */
  async function getProviders(req, res) {
    const serviceNames = gladys.premieres.getProviders();
    const integrations = await gladys.externalIntegration.get();
    const providers = serviceNames.map((serviceName) => {
      const integration = integrations.find((row) => row.name === serviceName);
      const service = gladys.service.getService(serviceName);
      return {
        service_name: serviceName,
        label: (integration && integration.manifest && integration.manifest.name) || null,
        supports_region_and_period: Boolean(service && service.movies && service.movies.supportsRegionAndPeriod),
      };
    });
    res.json(providers);
  }

  return Object.freeze({
    getUpcoming: asyncMiddleware(getUpcoming),
    getProviders: asyncMiddleware(getProviders),
  });
};
