const { expect } = require('chai');
const sinon = require('sinon');
const { assert: sinonAssert, fake } = require('sinon');

const { BadParameters } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { validateConfigValue } = require('../../../lib/external-integration/externalIntegration.validateConfigValue');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.validateConfigValue', () => {
  it('should reject an unknown field type', () => {
    try {
      validateConfigValue({ key: 'weird', type: 'unknown-type' }, 'value');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('unknown field type');
    }
  });

  it('should validate multi_select values as arrays of unique option values', () => {
    const field = {
      key: 'rooms',
      type: 'multi_select',
      options: [{ value: 'living' }, { value: 'kitchen' }],
    };
    expect(validateConfigValue(field, ['living', 'kitchen'])).to.deep.equal(['living', 'kitchen']);
    expect(validateConfigValue(field, [])).to.deep.equal([]);
    ['living', ['nope'], ['living', 'living'], 42].forEach((value) => {
      try {
        validateConfigValue(field, value);
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('must be an array of unique values');
      }
    });
  });

  it('should reject a direct value on an oauth2 field', () => {
    try {
      validateConfigValue({ key: 'netatmo_account', type: 'oauth2' }, 'anything');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('oauth2 fields cannot be set directly');
    }
  });
});

describe('externalIntegration config', () => {
  let externalIntegration;
  let variable;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, variable } = buildSupervisor());
  });

  describe('getIntegrationConfig / setIntegrationConfig', () => {
    it('should save and return typed values, secrets included', async () => {
      await externalIntegration.setIntegrationConfig(service, {
        latitude: 48.85,
        api_key: 's3cr3t',
        enabled: true,
        internal_state: 'pairing-step-2',
      });
      const config = await externalIntegration.getIntegrationConfig(service);
      expect(config).to.deep.equal({
        latitude: 48.85,
        api_key: 's3cr3t',
        enabled: true,
        internal_state: 'pairing-step-2',
      });
    });

    it('should return raw strings for values set outside the config API', async () => {
      await variable.setValue('LEGACY_VALUE', 'not json at all', service.id);
      const config = await externalIntegration.getIntegrationConfig(service);
      expect(config).to.deep.equal({ legacy_value: 'not json at all' });
    });

    it('should validate keys present in the config_schema', async () => {
      try {
        await externalIntegration.setIntegrationConfig(service, { latitude: 200 });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
      }
    });

    it('should reject a non-object config', async () => {
      try {
        await externalIntegration.setIntegrationConfig(service, 'nope');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(BadParameters);
      }
    });

    it('should reject an invalid config key', async () => {
      try {
        await externalIntegration.setIntegrationConfig(service, { 'BAD KEY': 'value' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(BadParameters);
        expect(e.message).to.include('keys must match');
      }
    });
  });

  describe('getConfigForFront', () => {
    it('should never return secrets and hide keys outside the schema', async () => {
      await externalIntegration.setIntegrationConfig(service, {
        latitude: 48.85,
        api_key: 's3cr3t',
        internal_state: 'hidden',
      });
      const result = await externalIntegration.getConfigForFront(service.selector);
      expect(result.config).to.deep.equal({
        latitude: 48.85,
        api_key: null,
        unit: null,
        name: null,
        enabled: null,
      });
      expect(result.configured_secrets).to.deep.equal(['api_key']);
      expect(result.config).to.not.have.property('internal_state');
    });
  });

  describe('saveConfigFromFront', () => {
    it('should validate, persist and push config-updated to the integration', async () => {
      externalIntegration.sendMessage = fake.returns(true);
      const result = await externalIntegration.saveConfigFromFront(service.selector, {
        latitude: 48.85,
        unit: 'celsius',
        api_key: 'new-secret',
      });
      expect(result.config).to.have.property('latitude', 48.85);
      expect(result.configured_secrets).to.deep.equal(['api_key']);
      sinonAssert.calledWith(
        externalIntegration.sendMessage,
        sinon.match.has('id', service.id),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED,
        {
          config: { latitude: 48.85, unit: 'celsius', api_key: 'new-secret' },
        },
      );
      const fullConfig = await externalIntegration.getIntegrationConfig(service);
      expect(fullConfig).to.deep.equal({ latitude: 48.85, unit: 'celsius', api_key: 'new-secret' });
    });

    it('should keep the previous secret when null is sent', async () => {
      externalIntegration.sendMessage = fake.returns(true);
      await externalIntegration.setIntegrationConfig(service, { api_key: 'old-secret' });
      await externalIntegration.saveConfigFromFront(service.selector, { api_key: null, latitude: 10 });
      const fullConfig = await externalIntegration.getIntegrationConfig(service);
      expect(fullConfig).to.deep.equal({ api_key: 'old-secret', latitude: 10 });
    });

    it('should reject unknown keys', async () => {
      try {
        await externalIntegration.saveConfigFromFront(service.selector, { unknown_key: 1 });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('unknown config key');
      }
    });

    it('should reject invalid values against the schema', async () => {
      const expect422 = async (config, messagePart) => {
        try {
          await externalIntegration.saveConfigFromFront(service.selector, config);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(Error422);
          expect(e.properties).to.include(messagePart);
        }
      };
      await expect422({ latitude: 'not-a-number' }, 'must be a number');
      await expect422({ latitude: -100 }, 'must be >= -90');
      await expect422({ latitude: 100 }, 'must be <= 90');
      await expect422({ unit: 'kelvin' }, 'must be one of celsius, fahrenheit');
      await expect422({ name: 42 }, 'must be a string');
      await expect422({ enabled: 'yes' }, 'must be a boolean');
    });

    it('should reject a non-object config', async () => {
      try {
        await externalIntegration.saveConfigFromFront(service.selector, [1, 2]);
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(BadParameters);
      }
    });
  });

  describe('section config fields', () => {
    let sectionService;

    beforeEach(async () => {
      sectionService = await seedExternalService({
        name: 'ext-dev-netatmo-section',
        selector: 'ext-dev-netatmo-section',
        manifest: {
          ...service.manifest,
          config_schema: [
            {
              key: 'intro',
              type: 'section',
              label: { en: 'Getting started' },
              links: [{ url: 'https://dev.netatmo.com', label: { en: 'Netatmo dev portal' } }],
            },
            ...service.manifest.config_schema,
          ],
        },
      });
    });

    it('should never expose a section key in the front config', async () => {
      const result = await externalIntegration.getConfigForFront(sectionService.selector);
      expect(result.config).to.not.have.property('intro');
    });

    it('should refuse a section key in a config payload, front and integration alike', async () => {
      try {
        await externalIntegration.saveConfigFromFront(sectionService.selector, { intro: 'value' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('section fields have no value');
      }
      try {
        await externalIntegration.setIntegrationConfig(sectionService, { intro: 'value' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('section fields have no value');
      }
    });
  });

  describe('oauth2 config fields', () => {
    let oauthService;

    beforeEach(async () => {
      oauthService = await seedExternalService({
        name: 'ext-dev-netatmo-demo',
        selector: 'ext-dev-netatmo-demo',
        manifest: {
          ...service.manifest,
          config_schema: [
            ...service.manifest.config_schema,
            { key: 'netatmo_account', type: 'oauth2', label: { en: 'Netatmo account' } },
          ],
        },
      });
    });

    it('should always return null for an oauth2 key, even with a stored value', async () => {
      // a value stored under the oauth2 key (should not happen) stays hidden
      await variable.setValue('NETATMO_ACCOUNT', JSON.stringify('leaked'), oauthService.id);
      const result = await externalIntegration.getConfigForFront(oauthService.selector);
      expect(result.config).to.have.property('netatmo_account', null);
      expect(result.configured_secrets).to.deep.equal([]);
    });

    it('should refuse an oauth2 key from the frontend', async () => {
      try {
        await externalIntegration.saveConfigFromFront(oauthService.selector, { netatmo_account: 'value' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('oauth2 fields cannot be set directly');
      }
    });

    it('should refuse the oauth2 key itself but accept off-schema token keys from the integration', async () => {
      try {
        await externalIntegration.setIntegrationConfig(oauthService, { netatmo_account: 'value' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
      }
      // tokens are stored off-schema, never displayed in the UI
      await externalIntegration.setIntegrationConfig(oauthService, {
        netatmo_access_token: 'token',
        netatmo_refresh_token: 'refresh',
      });
      const config = await externalIntegration.getIntegrationConfig(oauthService);
      expect(config).to.deep.equal({ netatmo_access_token: 'token', netatmo_refresh_token: 'refresh' });
      const front = await externalIntegration.getConfigForFront(oauthService.selector);
      expect(front.config).to.not.have.property('netatmo_access_token');
    });
  });
});
