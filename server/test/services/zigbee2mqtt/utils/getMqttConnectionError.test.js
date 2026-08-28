const { expect } = require('chai');

const { getMqttConnectionError } = require('../../../../services/zigbee2mqtt/utils/getMqttConnectionError');

describe('zigbee2mqtt getMqttConnectionError', () => {
  it('should detect wrong credentials in MQTT 3.1.1', () => {
    const error = new Error('Connection refused: Bad username or password');
    error.code = 4;
    expect(getMqttConnectionError(error)).to.deep.equal({ code: 'BAD_CREDENTIALS', message: null });
  });

  it('should detect wrong credentials in MQTT 5', () => {
    const error = new Error('Connection refused: Not authorized');
    error.code = 135;
    expect(getMqttConnectionError(error)).to.deep.equal({ code: 'BAD_CREDENTIALS', message: null });
  });

  it('should detect an unreachable broker', () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:1883');
    error.code = 'ECONNREFUSED';
    expect(getMqttConnectionError(error)).to.deep.equal({ code: 'BROKER_UNREACHABLE', message: null });
  });

  it('should return the raw message on unknown errors', () => {
    expect(getMqttConnectionError(new Error('something went wrong'))).to.deep.equal({
      code: null,
      message: 'something went wrong',
    });
  });

  it('should return a null message when the error has no message', () => {
    expect(getMqttConnectionError()).to.deep.equal({ code: null, message: null });
  });
});
