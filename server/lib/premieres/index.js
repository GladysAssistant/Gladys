const { getUpcoming } = require('./premieres.getUpcoming');
const { getProviders } = require('./premieres.getProviders');
const { checkNewReleases } = require('./premieres.checkNewReleases');
const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const Premieres = function Premieres(service, event) {
  this.service = service;
  this.event = event;
  // last seen movie ids per provider, diffed by checkNewReleases; in-memory
  // on purpose, a restart resets the baseline without firing
  this.providerMovieIds = new Map();
  // in-flight guard of checkNewReleases: the scheduled job must never diff
  // the same baseline concurrently
  this.checkNewReleasesRunning = false;
  this.event.on(EVENTS.MOVIES.CHECK_NEW_RELEASES, eventFunctionWrapper(this.checkNewReleases.bind(this)));
};

Premieres.prototype.getUpcoming = getUpcoming;
Premieres.prototype.getProviders = getProviders;
Premieres.prototype.checkNewReleases = checkNewReleases;

module.exports = Premieres;
