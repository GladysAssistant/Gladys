const { expect } = require('chai');

const { validateSetup } = require('../../../../services/zigbee2mqtt/utils/validateSetup');

describe('zigbee2mqtt validateSetup', () => {
  it('should return the configuration when no adapter mode is sent', () => {
    // PREPARE
    const config = { ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0' };
    // EXECUTE
    const result = validateSetup(config);
    // ASSERT
    expect(result).to.deep.equal(config);
  });

  it('should return the configuration when the adapter mode is destroyed', () => {
    // PREPARE
    const config = { Z2M_ADAPTER_MODE: null };
    // EXECUTE
    const result = validateSetup(config);
    // ASSERT
    expect(result).to.deep.equal(config);
  });

  it('should return the configuration in USB mode', () => {
    // PREPARE
    const config = { Z2M_ADAPTER_MODE: 'usb', ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0' };
    // EXECUTE
    const result = validateSetup(config);
    // ASSERT
    expect(result).to.deep.equal(config);
  });

  it('should fail with an unknown adapter mode', () => {
    // PREPARE
    const config = { Z2M_ADAPTER_MODE: 'bluetooth' };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: adapter mode "bluetooth" is invalid, expected one of usb, network',
    );
  });

  it('should fail with an unknown network adapter type', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'unknown-adapter',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: network coordinator type "unknown-adapter" is invalid, expected one of deconz, ember, ezsp, zstack',
    );
  });

  it('should fail without network adapter URL', () => {
    // PREPARE
    const config = { Z2M_ADAPTER_MODE: 'network', Z2M_NETWORK_ADAPTER_TYPE: 'ember' };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw('Zigbee2mqtt: network coordinator URL is required');
  });

  it('should fail with an empty network adapter URL', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: '   ',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw('Zigbee2mqtt: network coordinator URL is required');
  });

  it('should fail with a network adapter URL without port', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: '192.168.1.20',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: network coordinator URL "192.168.1.20" is invalid, expected format is "tcp://<host>:<port>"',
    );
  });

  it('should fail with a network adapter URL with a bad scheme', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: 'http://192.168.1.20:6638',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: network coordinator URL "http://192.168.1.20:6638" is invalid, expected format is "tcp://<host>:<port>"',
    );
  });

  it('should fail with a network adapter port equal to 0', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:0',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: network coordinator port "0" should be between 1 and 65535',
    );
  });

  it('should fail with a network adapter port greater than 65535', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:70000',
    };
    // EXECUTE
    expect(() => validateSetup(config)).to.throw(
      'Zigbee2mqtt: network coordinator port "70000" should be between 1 and 65535',
    );
  });

  it('should normalize a network adapter URL without scheme', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'zstack',
      Z2M_NETWORK_ADAPTER_URL: ' 192.168.1.20:6638 ',
    };
    // EXECUTE
    const result = validateSetup(config);
    // ASSERT
    expect(result).to.deep.equal({
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'zstack',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://192.168.1.20:6638',
    });
  });

  it('should accept a hostname based network adapter URL', () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://slzb-06.local:6638',
    };
    // EXECUTE
    const result = validateSetup(config);
    // ASSERT
    expect(result).to.deep.equal({
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      Z2M_NETWORK_ADAPTER_URL: 'tcp://slzb-06.local:6638',
    });
  });
});
