const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { readExposure, isExposed } = require('../../../../services/matter-bridge/lib/exposure');
const { VARIABLES } = require('../../../../services/matter-bridge/lib/constants');

const gladysWith = (values) => ({
  variable: { getValue: sinon.stub().callsFake(async (name) => (name in values ? values[name] : null)) },
});

describe('Matter bridge exposure', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should expose everything by default', async () => {
    const exposure = await readExposure(gladysWith({}), 'service');
    expect(exposure).to.deep.equal({ exposureMode: 'all', exposedDevices: [] });
    expect(isExposed({ selector: 'any' }, exposure)).to.equal(true);
  });

  it('should only expose the selected devices', async () => {
    const exposure = await readExposure(
      gladysWith({ [VARIABLES.EXPOSURE_MODE]: 'selection', [VARIABLES.EXPOSED_DEVICES]: '["lamp"]' }),
      'service',
    );
    expect(exposure).to.deep.equal({ exposureMode: 'selection', exposedDevices: ['lamp'] });
    expect(isExposed({ selector: 'lamp' }, exposure)).to.equal(true);
    expect(isExposed({ selector: 'other' }, exposure)).to.equal(false);
  });

  it('should read an unknown mode as a selection, never as every device', async () => {
    const exposure = await readExposure(
      gladysWith({ [VARIABLES.EXPOSURE_MODE]: 'everything', [VARIABLES.EXPOSED_DEVICES]: '["lamp"]' }),
      'service',
    );
    expect(exposure.exposureMode).to.equal('selection');
    expect(isExposed({ selector: 'lamp' }, exposure)).to.equal(true);
    expect(isExposed({ selector: 'other' }, exposure)).to.equal(false);
    const all = await readExposure(gladysWith({ [VARIABLES.EXPOSURE_MODE]: 'all' }), 'service');
    expect(all.exposureMode).to.equal('all');
  });

  it('should expose nothing when the selection is broken', async () => {
    const broken = await readExposure(
      gladysWith({ [VARIABLES.EXPOSURE_MODE]: 'selection', [VARIABLES.EXPOSED_DEVICES]: '{not json' }),
      'service',
    );
    expect(broken.exposedDevices).to.deep.equal([]);
    const notArray = await readExposure(
      gladysWith({ [VARIABLES.EXPOSURE_MODE]: 'selection', [VARIABLES.EXPOSED_DEVICES]: '{"a":1}' }),
      'service',
    );
    expect(notArray.exposedDevices).to.deep.equal([]);
  });
});
