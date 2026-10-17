const { expect } = require('chai');

const { BadParameters } = require('../../../utils/coreErrors');
const { getAccountField } = require('../../../lib/external-integration/externalIntegration.getAccountField');

const SERVICE = {
  manifest: {
    config_schema: [
      { key: 'latitude', type: 'number', label: { en: 'Latitude' } },
      { key: 'netatmo_account', type: 'oauth2', label: { en: 'Netatmo account' } },
      { key: 'xiaomi_account', type: 'account_link', label: { en: 'Xiaomi account' } },
    ],
  },
};

describe('externalIntegration.getAccountField', () => {
  it('should return the oauth2 and account_link fields', () => {
    expect(getAccountField(SERVICE, 'netatmo_account')).to.equal(SERVICE.manifest.config_schema[1]);
    expect(getAccountField(SERVICE, 'xiaomi_account')).to.equal(SERVICE.manifest.config_schema[2]);
  });

  it('should restrict the accepted types when the route asks for it', () => {
    expect(getAccountField(SERVICE, 'netatmo_account', ['oauth2'])).to.equal(SERVICE.manifest.config_schema[1]);
    expect(() => getAccountField(SERVICE, 'xiaomi_account', ['oauth2']))
      .to.throw(BadParameters)
      .with.property('message', 'config.xiaomi_account: not an oauth2 field');
  });

  it('should refuse a setting, an unknown key and a manifest without config_schema', () => {
    expect(() => getAccountField(SERVICE, 'latitude'))
      .to.throw(BadParameters)
      .with.property('message', 'config.latitude: not an oauth2 or account_link field');
    expect(() => getAccountField(SERVICE, 'nope')).to.throw(BadParameters);
    expect(() => getAccountField({ manifest: null }, 'netatmo_account')).to.throw(BadParameters);
    expect(() => getAccountField({ manifest: {} }, 'netatmo_account')).to.throw(BadParameters);
  });
});
