const Promise = require('bluebird');
const { fake } = require('sinon');
const GladysPowDevice = require('./Gladys-pow.json');
const GladysOfflineDevice = require('./Gladys-offline.json');
const Gladys2ChDevice = require('./Gladys-2ch.json');
const GladysUnhandledDevice = require('./Gladys-unhandled.json');
const GladysThDevice = require('./Gladys-th.json');

const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';

const event = { emit: fake.resolves(null) };

const variableNotConfigured = {
  getValue: (valueId, notUsed) => {
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOk = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    if (valueId === 'EWELINK_REGION') {
      return Promise.resolve('eu');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOkNoRegion = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOkFalseRegion = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    if (valueId === 'EWELINK_REGION') {
      return Promise.resolve('uk');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableNok = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@unvalid.ko');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('S0m3Th1ngF4ls3');
    }
    if (valueId === 'EWELINK_REGION') {
      return Promise.resolve('eu');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const deviceManagerFull = {
  get: fake.resolves([Gladys2ChDevice, GladysOfflineDevice, GladysPowDevice, GladysThDevice, GladysUnhandledDevice]),
};

const stateManagerWith0Devices = {
  get: (key, externalId) => {
    return undefined;
  },
};

const stateManagerWith2Devices = {
  get: (key, externalId) => {
    if (externalId === 'ewelink:10004531ae') {
      return Gladys2ChDevice;
    }
    if (externalId === 'ewelink:10004533ae') {
      return GladysPowDevice;
    }
    return undefined;
  },
};

const stateManagerFull = {
  get: (key, externalId) => {
    if (externalId === 'ewelink:10004531ae') {
      return Gladys2ChDevice;
    }
    if (externalId === 'ewelink:10004532ae') {
      return GladysOfflineDevice;
    }
    if (externalId === 'ewelink:10004533ae') {
      return GladysPowDevice;
    }
    if (externalId === 'ewelink:10004534ae') {
      return GladysThDevice;
    }
    if (externalId === 'ewelink:10004535ae') {
      return GladysUnhandledDevice;
    }
    return undefined;
  },
};

module.exports = {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  variableOkNoRegion,
  variableOkFalseRegion,
  variableNok,
  deviceManagerFull,
  stateManagerWith0Devices,
  stateManagerWith2Devices,
  stateManagerFull,
};
