const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt pullMissingImages', () => {
  let zigbee2mqttManager;
  // Each pull waits for its end, decided by the test
  let pulls;

  beforeEach(() => {
    pulls = [];
    const gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.pullImage = fake(
      (image) =>
        new Promise((resolve) => {
          pulls.push({ image, resolve });
        }),
    );
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should download the images of both containers at the same time', async () => {
    // EXECUTE
    let done = false;
    const promise = (async () => {
      await zigbee2mqttManager.pullMissingImages();
      done = true;
    })();
    // ASSERT
    // Both started before either ends
    expect(pulls.map(({ image }) => image)).to.deep.equal(['koenkk/zigbee2mqtt:2.14.2', 'eclipse-mosquitto:2.0.15']);
    pulls[0].resolve(true);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    expect(done).to.equal(false);
    pulls[1].resolve(false);
    await promise;
    expect(done).to.equal(true);
    assert.calledTwice(zigbee2mqttManager.pullImage);
  });

  it('should fail when a download fails', async () => {
    // PREPARE
    zigbee2mqttManager.pullImage = fake.rejects(new Error('docker fail pull'));
    // EXECUTE & ASSERT
    await expect(zigbee2mqttManager.pullMissingImages()).to.be.rejectedWith('docker fail pull');
  });
});
