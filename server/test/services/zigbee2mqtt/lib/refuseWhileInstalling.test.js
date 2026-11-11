const { expect } = require('chai');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ConflictError } = require('../../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt refuseWhileInstalling', () => {
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
  });

  ['idle', 'done', 'failed'].forEach((state) => {
    it(`should accept a request when the installation is ${state} and no init runs`, () => {
      // PREPARE
      zigbee2mqttManager.installation.state = state;
      // EXECUTE & ASSERT
      expect(() => zigbee2mqttManager.refuseWhileInstalling('reset')).not.to.throw();
    });
  });

  it('should refuse a request while an installation runs', () => {
    // PREPARE
    zigbee2mqttManager.installation.state = 'running';
    // The init of the installation
    zigbee2mqttManager.runningInits = 1;
    // EXECUTE & ASSERT
    expect(() => zigbee2mqttManager.refuseWhileInstalling('reset')).to.throw(
      ConflictError,
      'Zigbee2mqtt: cannot reset while an installation is running',
    );
  });

  it('should refuse a request while an init runs outside an installation, as at the start of Gladys', () => {
    // PREPARE
    zigbee2mqttManager.runningInits = 1;
    // EXECUTE & ASSERT
    expect(() => zigbee2mqttManager.refuseWhileInstalling('save the setup')).to.throw(
      ConflictError,
      'Zigbee2mqtt: cannot save the setup while the integration is starting',
    );
  });
});
