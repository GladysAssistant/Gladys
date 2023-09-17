/* eslint-disable no-unused-expressions */
const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');

const OverkizHandler = require('../../../../../services/overkiz/lib/index');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';

describe('SyncOverkizDevices command', () => {
  let gladys;
  let overkizHandler;

  beforeEach(async () => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    overkizHandler = new OverkizHandler(gladys, OVERKIZ_SERVICE_ID);
    overkizHandler.overkizServerAPI = {
      getSetup: fake.returns({
        gateways: 'gateway',
        devices: [
          {
            placeOID: 'place_oid',
            api: 'api',
          },
        ],
        rootPlace: {
          subPlaces: [
            {
              oid: 'place_oid',
              label: 'place',
            },
          ],
        },
      }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should synchronize devices', async () => {
    overkizHandler.connected = true;
    await overkizHandler.syncOverkizDevices();
    expect(overkizHandler.scanInProgress).to.be.false;
    expect(overkizHandler.gateways).to.be.deep.equals(['gateway']);
  });

  it('should not synchronize devices - not connected', async () => {
    overkizHandler.connected = false;
    try {
      await overkizHandler.syncOverkizDevices();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceof(ServiceNotConfiguredError);
      expect(e.message).to.be.equal('OVERKIZ_NOT_CONNECTED');
    }
  });
});
