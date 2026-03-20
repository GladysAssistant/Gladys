const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';

const fsMock = {
  mkdir: fake.resolves(true),
  chown: fake.resolves(true),
};

const configureContainer = proxyquire('../../../../services/matterbridge/lib/configureContainer', {
  'fs/promises': fsMock,
});

const MatterbridgeManager = proxyquire('../../../../services/matterbridge/lib', {
  './configureContainer': configureContainer,
});

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge configureContainer', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      system: {
        getGladysBasePath: fake.resolves({
          basePathOnHost: TEMP_GLADYS_FOLDER,
          basePathOnContainer: TEMP_GLADYS_FOLDER,
        }),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should configure container directories', async () => {
    const result = await matterbridgeManager.configureContainer();

    assert.called(fsMock.mkdir);
    assert.called(fsMock.chown);
    expect(result).to.equal(true);
  });

  it('should handle chown error gracefully', async () => {
    fsMock.chown = fake.rejects(new Error('Permission denied'));

    const result = await matterbridgeManager.configureContainer();

    assert.called(fsMock.mkdir);
    expect(result).to.equal(true);
  });
});
