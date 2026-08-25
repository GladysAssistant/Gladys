const { expect } = require('chai');

const MqttController = require('../../services/mqtt/api/mqtt.controller');
const NetatmoController = require('../../services/netatmo/api/netatmo.controller');
const NukiController = require('../../services/nuki/api/nuki.controller');
const TuyaController = require('../../services/tuya/api/tuya.controller');
const ZwaveJSUIController = require('../../services/zwavejs-ui/api/zwaveJSUI.controller');

// Some services expose their stored credentials through a route of their own,
// next to the generic /api/v1/service/:service_name/variable/:variable_key one:
// they hand the configuration object straight to res.json(), broker password
// and OAuth client secret included. Those routes are the same secrets by
// another door, so they must stay admin-only. The controllers only build their
// route map here, they never touch the handler, so a bare object is enough.
const SECRET_BEARING_ROUTES = [
  { name: 'mqtt', controller: MqttController, route: 'get /api/v1/service/mqtt/config' },
  { name: 'netatmo', controller: NetatmoController, route: 'get /api/v1/service/netatmo/configuration' },
  { name: 'netatmo', controller: NetatmoController, route: 'post /api/v1/service/netatmo/configuration' },
  { name: 'nuki', controller: NukiController, route: 'get /api/v1/service/nuki/config' },
  { name: 'nuki', controller: NukiController, route: 'post /api/v1/service/nuki/config' },
  { name: 'tuya', controller: TuyaController, route: 'post /api/v1/service/tuya/configuration' },
  { name: 'zwavejs-ui', controller: ZwaveJSUIController, route: 'get /api/v1/service/zwavejs-ui/configuration' },
  { name: 'zwavejs-ui', controller: ZwaveJSUIController, route: 'post /api/v1/service/zwavejs-ui/configuration' },
];

describe('Service routes carrying integration secrets', () => {
  SECRET_BEARING_ROUTES.forEach(({ name, controller, route }) => {
    it(`should keep "${route}" reserved to admin users`, () => {
      const routes = controller({});
      expect(routes, `${name} does not declare ${route} anymore`).to.have.property(route);
      expect(routes[route]).to.have.property('authenticated', true);
      expect(routes[route]).to.have.property('admin', true);
    });
  });
});
