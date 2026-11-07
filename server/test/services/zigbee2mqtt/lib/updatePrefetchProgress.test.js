const { expect } = require('chai');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const Z2M_IMAGE = 'koenkk/zigbee2mqtt:2.14.2';
const MQTT_IMAGE = 'eclipse-mosquitto:2.0.15';

describe('zigbee2mqtt updatePrefetchProgress', () => {
  let zigbee2mqttManager;

  beforeEach(() => {
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
    // Both images are missing: 214 MB and 22.4 MB
    zigbee2mqttManager.prefetch = {
      state: 'running',
      progress: 0,
      freeBytes: 1000000000,
      neededBytes: 236400000,
      error: null,
    };
    zigbee2mqttManager.prefetchProgressByImage = { [Z2M_IMAGE]: 0, [MQTT_IMAGE]: 0 };
  });

  it('should count each image for its size', () => {
    // EXECUTE
    zigbee2mqttManager.updatePrefetchProgress(Z2M_IMAGE, 50);
    // ASSERT
    expect(zigbee2mqttManager.prefetch.progress).to.equal(45);
    // EXECUTE
    zigbee2mqttManager.updatePrefetchProgress(MQTT_IMAGE, 100);
    // ASSERT
    expect(zigbee2mqttManager.prefetch.progress).to.equal(54);
  });

  it('should never go backwards', () => {
    // PREPARE
    zigbee2mqttManager.updatePrefetchProgress(Z2M_IMAGE, 50);
    // EXECUTE
    // A large layer starts: the progress of the pull goes back a little
    zigbee2mqttManager.updatePrefetchProgress(Z2M_IMAGE, 40);
    // ASSERT
    expect(zigbee2mqttManager.prefetch.progress).to.equal(45);
  });

  it('should ignore an image that the prefetch does not download', () => {
    // PREPARE
    zigbee2mqttManager.prefetch.neededBytes = 214000000;
    zigbee2mqttManager.prefetchProgressByImage = { [Z2M_IMAGE]: 0 };
    // EXECUTE
    zigbee2mqttManager.updatePrefetchProgress(MQTT_IMAGE, 100);
    // ASSERT
    expect(zigbee2mqttManager.prefetch.progress).to.equal(0);
    expect(zigbee2mqttManager.prefetchProgressByImage).to.deep.equal({ [Z2M_IMAGE]: 0 });
  });

  it('should do nothing outside a prefetch', () => {
    // PREPARE
    // The containers are also installed when Gladys starts
    zigbee2mqttManager.prefetch.state = 'done';
    zigbee2mqttManager.prefetch.progress = 100;
    // EXECUTE
    zigbee2mqttManager.updatePrefetchProgress(Z2M_IMAGE, 10);
    // ASSERT
    expect(zigbee2mqttManager.prefetch.progress).to.equal(100);
    expect(zigbee2mqttManager.prefetchProgressByImage[Z2M_IMAGE]).to.equal(0);
  });
});
