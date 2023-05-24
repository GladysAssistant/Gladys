const { fake } = require('sinon');
const { REGISTER } = require('../../../../services/sunspec/lib/sunspec.constants');

class ModbusTCPMock {
  connectTCP(host, options, callback) {
    callback.call(this);
  }

  readHoldingRegisters(registerId, length, callback) {
    let data;
    if (registerId === REGISTER.SID - 1) {
      data = [21365, 28243];
    } else if (registerId === REGISTER.MODEL_ID - 1) {
      data = [1];
    } else if (registerId === REGISTER.MODEL_ID) {
      data = [0];
    } else if (registerId === REGISTER.MANUFACTURER - 1) {
      data = [0xffff];
    }
    callback.call(this, null, { data });
  }

  close(callback) {
    callback.call(this);
  }
}

ModbusTCPMock.prototype.sendPhoto = fake.resolves(null);

module.exports = ModbusTCPMock;
