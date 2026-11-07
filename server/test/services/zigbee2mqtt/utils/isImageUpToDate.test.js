const { expect } = require('chai');

const { isImageUpToDate } = require('../../../../services/zigbee2mqtt/utils/isImageUpToDate');

describe('zigbee2mqtt isImageUpToDate', () => {
  it('should tell that a pull downloaded nothing', () => {
    const pullOutput = [
      { status: 'Pulling from library/eclipse-mosquitto', id: '2.0.15' },
      { status: 'Digest: sha256:1fe8a8d0c4b1e1c3a3a8b3a8f6d0f1c2b3e4d5c6a7b8c9d0e1f2a3b4c5d6e7f8' },
      { status: 'Status: Image is up to date for eclipse-mosquitto:2.0.15' },
    ];
    expect(isImageUpToDate(pullOutput)).to.equal(true);
  });

  it('should tell that a pull downloaded the image', () => {
    const pullOutput = [
      { status: 'Pulling from library/eclipse-mosquitto', id: '2.0.15' },
      { status: 'Pulling fs layer', progressDetail: {}, id: '8a49fdb3b6a5' },
      { status: 'Pull complete', progressDetail: {}, id: '8a49fdb3b6a5' },
      // An event without status, as an error event would be
      { error: 'unexpected' },
      null,
      { status: 'Status: Downloaded newer image for eclipse-mosquitto:2.0.15' },
    ];
    expect(isImageUpToDate(pullOutput)).to.equal(false);
  });

  it('should not tell that an image is up to date without events', () => {
    expect(isImageUpToDate(true)).to.equal(false);
    expect(isImageUpToDate(undefined)).to.equal(false);
  });
});
