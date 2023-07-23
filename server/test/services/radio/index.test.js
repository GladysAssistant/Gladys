const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { SYSTEM_VARIABLE_NAMES, MUSIC } = require('../../../utils/constants');
const { RADIO } = require('../../../services/radio/lib/utils/radio.constants');
const RadioHandler = require('../../../services/radio/lib');

const RadioService = proxyquire('../../../services/radio', {
  './lib': RadioHandler,
});

const gladys = {
  variable: {
    getValue: (key) => {
      switch (key) {
        case SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED:
          return '{"radio":"ENABLED","music-file":"DISABLED"}';
        case RADIO.DEFAULT_COUNTRY:
          return 'England';
        default:
          return null;
      }
    },
  },
};

describe('Radio Service', () => {
  const radioService = RadioService(gladys, 'faea9c35-983k-44d5-bcc9-2af1de37b8b4');
  radioService.soundHandler.getStationsByCountry = fake.returns(null);

  it('should start service', async () => {
    await radioService.start();
    expect(radioService.soundHandler).to.be.instanceOf(RadioHandler);
    expect(radioService.soundHandler.defaultCountry).to.eq('England');
    assert.calledOnce(radioService.soundHandler.getStationsByCountry);
  });

  it('should stop service', async () => {
    radioService.stop();
  });
});
