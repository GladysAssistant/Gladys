const { REGISTER, MODEL } = require('../../../../../services/sunspec/lib/sunspec.constants');

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

  // eslint-disable-next-line class-methods-use-this
  readModel(modelId) {
    if (modelId === MODEL.COMMON) {
      const arr = new Uint8Array(132);
      arr[1] = 1;
      return Buffer.from(arr.buffer);
    }
    if (modelId === MODEL.MPPT_INVERTER_EXTENSION) {
      const arr = new Uint8Array(94);
      arr[1] = 160;

      arr[5] = 0; // UInt16
      arr[7] = 1; // UInt16
      arr[9] = 2; // UInt16
      arr[11] = 3; // UInt16

      arr[39] = 10; // UInt16
      arr[41] = 11; // UInt16
      arr[43] = 12; // UInt16
      arr[47] = 13; // UInt32

      return Buffer.from(arr.buffer);
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  readRegisterAsInt16(registerId) {
    return 1;
  }

  close(callback) {
    callback.call(this);
  }
}

module.exports = ModbusTCPMock;
