const sinon = require('sinon');

const { assert, fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge saveConfiguration', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save configuration', async () => {
    const config = {
      dockerMatterbridgeVersion: '1',
    };

    await matterbridgeManager.saveConfiguration(config);

    assert.calledWith(gladys.variable.setValue, 'DOCKER_MATTERBRIDGE_VERSION', '1', serviceId);
    assert.calledWith(gladys.variable.setValue, 'MATTERBRIDGE_PORT', '8283', serviceId);
  });

  it('should destroy configuration when value is null', async () => {
    const config = {
      dockerMatterbridgeVersion: null,
    };

    await matterbridgeManager.saveConfiguration(config);

    assert.calledWith(gladys.variable.destroy, 'DOCKER_MATTERBRIDGE_VERSION', serviceId);
  });
});
