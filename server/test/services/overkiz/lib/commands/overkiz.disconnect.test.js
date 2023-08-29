/* eslint-disable no-unused-expressions */
const sinon = require('sinon');

const { fake, assert } = sinon;

const { expect } = require('chai');
const OverkizHandler = require('../../../../../services/overkiz/lib/index');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';

describe('Disconnect command', () => {
  let gladys;
  let overkizHandler;

  beforeEach(() => {
    gladys = {};
    overkizHandler = new OverkizHandler(gladys, OVERKIZ_SERVICE_ID);
    overkizHandler.connected = true;
  });

  it('should disconnect and stop job', async () => {
    overkizHandler.updateDevicesJob = {
      stop: fake.returns(true),
    };
    await overkizHandler.disconnect();
    assert.calledOnce(overkizHandler.updateDevicesJob.stop);
    expect(overkizHandler.connected).to.be.false;
  });

  it('should disconnect', async () => {
    await overkizHandler.disconnect();
    expect(overkizHandler.connected).to.be.false;
  });
});
