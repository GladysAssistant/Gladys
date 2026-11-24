const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getPermitJoin', () => {
  let zigbee2MqttManager;

  beforeEach(() => {
    sinon.useFakeTimers(new Date('2026-11-20T10:00:00.000Z'));
    zigbee2MqttManager = new Zigbee2MqttService(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should tell joining closed, without a countdown', () => {
    expect(zigbee2MqttManager.getPermitJoin()).to.deep.equal({ allowed: false, remainingSeconds: null });
  });

  it('should tell joining allowed, with the seconds left rounded', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = Date.now() + 241400;
    expect(zigbee2MqttManager.getPermitJoin()).to.deep.equal({ allowed: true, remainingSeconds: 241 });
  });

  it('should tell joining allowed without a countdown when its end is unknown', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = null;
    expect(zigbee2MqttManager.getPermitJoin()).to.deep.equal({ allowed: true, remainingSeconds: null });
  });

  it('should tell 0 seconds left once the end is passed', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = Date.now() - 3000;
    expect(zigbee2MqttManager.getPermitJoin()).to.deep.equal({ allowed: true, remainingSeconds: 0 });
  });

  it('should tell at most 254 seconds left, whatever the clock of Zigbee2mqtt', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = Date.now() + 3600 * 1000;
    expect(zigbee2MqttManager.getPermitJoin()).to.deep.equal({ allowed: true, remainingSeconds: 254 });
  });
});
