const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;

const HomeKitService = require('../../../services/homekit/index');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

describe('HomeKitService', () => {
  let gladys;
  let homekitService;

  before(() => {
    gladys = {
      device: {
        get: stub().resolves([
          {
            id: '07f16117-8556-4b50-b9f0-e190d08f8d92',
            name: 'Lampe bureau',
            features: [{ category: DEVICE_FEATURE_CATEGORIES.LIGHT }],
          },
        ]),
      },
      variable: {
        getValue: stub().resolves(null),
      },
      system: {
        isDocker: stub().resolves(true),
      },
      house: {
        get: stub().resolves([]),
      },
      event: {
        on: stub().returns(),
        removeListener: stub().returns(),
      },
    };
    homekitService = HomeKitService(gladys);
  });

  it('should start service in docker', async () => {
    const setValue = stub().resolves({});
    gladys.system.getGladysBasePath = stub().resolves({ basePathOnContainer: 'test/folder' });
    gladys.variable.setValue = setValue;

    await homekitService.start();

    expect(homekitService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
    expect(setValue.callCount).to.equal(4);
    expect(setValue.args[0][1]).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(setValue.args[1][1]).to.match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/);
    expect(setValue.args[2][1]).to.match(/^\d{3}-\d{2}-\d{3}$/);
    expect(setValue.args[3][1]).to.match(/^X-HM:\/\/[0-9A-Z]+$/);
  });

  it('should start service', async () => {
    const setValue = stub().resolves({});
    gladys.system.isDocker = stub().resolves(false);
    gladys.variable.setValue = setValue;

    await homekitService.start();

    expect(homekitService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
    expect(setValue.callCount).to.equal(4);
    expect(setValue.args[0][1]).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(setValue.args[1][1]).to.match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/);
    expect(setValue.args[2][1]).to.match(/^\d{3}-\d{2}-\d{3}$/);
    expect(setValue.args[3][1]).to.match(/^X-HM:\/\/[0-9A-Z]+$/);
  });

  // This one runs against the real HAP library on purpose. Every other HomeKit test stubs it, and a
  // stub happily accepts two services of one type on an accessory where HAP throws — which is how a
  // detector carrying its own siren came to take the whole bridge down in 4.86.
  it('should start service with a device whose features share one HomeKit service', async () => {
    gladys.system.isDocker = stub().resolves(false);
    gladys.variable.setValue = stub().resolves({});
    gladys.device.get = stub().resolves([
      {
        id: '5b2b0ea1-5a25-4b6a-9a4c-1a6ba0f4b9c1',
        name: 'Detecteur_Cave',
        selector: 'detecteur-cave',
        features: [
          {
            selector: 'detecteur-cave-relais',
            name: 'Relais',
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            last_value: 0,
          },
          {
            selector: 'detecteur-cave-sirene',
            name: 'Sirène',
            category: DEVICE_FEATURE_CATEGORIES.SIREN,
            type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
            last_value: 0,
          },
        ],
      },
    ]);

    // createBridge drops a device it cannot build rather than failing the whole bridge, so a
    // published bridge is not proof on its own: what is asserted is that nothing was dropped.
    const loggerError = stub(logger, 'error');

    try {
      await homekitService.start();

      expect(loggerError.callCount).to.equal(0);
    } finally {
      loggerError.restore();
    }

    expect(gladys.variable.setValue.callCount).to.equal(4);
    expect(gladys.variable.setValue.args[3][1]).to.match(/^X-HM:\/\/[0-9A-Z]+$/);
  });

  it('should stop service', async () => {
    await homekitService.stop();
    expect(homekitService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});
