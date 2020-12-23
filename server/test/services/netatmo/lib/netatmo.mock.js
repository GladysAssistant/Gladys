const { fake } = require('sinon');
const EventEmitter = require('events');

class Netatmo extends EventEmitter {}

Netatmo.prototype.auth = fake.resolves(null);
Netatmo.prototype.getHealthyHomeCoachData = fake.resolves(null);
Netatmo.prototype.getThermostatsData = fake.resolves(null);
Netatmo.prototype.homesData = fake.resolves(null);
Netatmo.prototype.getHomeData = fake.resolves(null);
Netatmo.prototype.getStationsData = fake.resolves(null);

module.exports = Netatmo;
