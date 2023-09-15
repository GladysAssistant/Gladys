const logger = require('../../../../utils/logger');
const { REGISTER, DEFAULT, MODEL } = require('../sunspec.constants');
const { trimString } = require('./sunspec.utils');

class ModbusClient {
  constructor(modbusClient) {
    this.modbusClient = modbusClient;
    this.models = {};
  }

  async connect(sunspecHost, sunspecPort) {
    try {
      await this.modbusClient.connectTCP(sunspecHost, { port: sunspecPort, timeout: 10000 });
      logger.info(`SunSpec service connected`);
      // this.modbusClient.setID(UNIT_ID.SID);
      const sid = await this.readRegisterAsInt32(REGISTER.SID);
      if (sid !== DEFAULT.SUNSPEC_MODBUS_MAP) {
        logger.error(`Invalid SID received. Expected ${DEFAULT.SUNSPEC_MODBUS_MAP} but got ${sid}`);
      }
      const model = await this.readRegisterAsInt16(REGISTER.MODEL_ID);
      if (model !== DEFAULT.SUNSPEC_COMMON_MODEL) {
        logger.error(`Invalid SunSpec Model received. Expected ${DEFAULT.SUNSPEC_COMMON_MODEL} but got ${model}`);
        return;
      }
      this.models[1] = {
        registerStart: REGISTER.MODEL_ID,
        registerLength: await this.readRegisterAsInt16(REGISTER.MODEL_ID + 1),
      };
      let nextModel;
      let nextModelLength;
      let registerId = REGISTER.MODEL_ID + 1;
      registerId += (await this.readRegisterAsInt16(registerId)) + 1;
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        nextModel = await this.readRegisterAsInt16(registerId);
        if (nextModel === 0xffff) {
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        nextModelLength = await this.readRegisterAsInt16(registerId + 1);
        // eslint-disable-next-line no-await-in-loop
        this.models[nextModel] = {
          registerStart: registerId,
          registerLength: nextModelLength,
        };
        registerId += nextModelLength + 2;
      }
    } catch (e) {
      throw new Error(`Unable to connect Sunspec device ${sunspecHost}:${sunspecPort} - ${e}`);
    }
  }

  close() {
    return new Promise((resolve, reject) => {
      this.modbusClient.close(() => {
        logger.info('SunSpec service disconnected');
        resolve();
      });
    });
  }

  getValueModel() {
    if (this.models[MODEL.INVERTER_1_PHASE] !== null) {
      return MODEL.INVERTER_1_PHASE;
    }
    if (this.models[MODEL.INVERTER_3_PHASE] !== null) {
      return MODEL.INVERTER_3_PHASE;
    }
    return MODEL.INVERTER_SPLIT_PHASE;
  }

  async readModel(modelId) {
    const { registerStart, registerLength } = this.models[modelId];
    return this.readRegister(registerStart, registerLength);
  }

  async readRegister(registerId, registerLength) {
    return new Promise((resolve, reject) => {
      this.modbusClient.readHoldingRegisters(registerId - 1, registerLength, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.buffer);
        }
      });
    });
  }

  async readRegisterAsString(registerId, registerLength) {
    return new Promise((resolve, reject) => {
      this.modbusClient.readHoldingRegisters(registerId - 1, registerLength, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const res = data.buffer.toString();
          resolve(trimString(res));
        }
      });
    });
  }

  async readRegisterAsInt16(registerId) {
    return new Promise((resolve, reject) => {
      this.modbusClient.readHoldingRegisters(registerId - 1, 1, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const res = data.data[0];
          resolve(res);
        }
      });
    });
  }

  async readRegisterAsInt32(registerId) {
    return new Promise((resolve, reject) => {
      this.modbusClient.readHoldingRegisters(registerId - 1, 2, (err, data) => {
        if (err) {
          reject(err);
        } else {
          // eslint-disable-next-line no-bitwise
          const res = (data.data[0] << 16) | data.data[1];
          resolve(res);
        }
      });
    });
  }
}

module.exports = {
  ModbusClient,
};
