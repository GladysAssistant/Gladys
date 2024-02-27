const Promise = require('bluebird');
const { fake } = require('sinon');

const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

const event = { emit: fake.resolves(null) };

const variableNotConfigured = {
  getValue: (valueId, notUsed) => {
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOk = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'NUKI_LOGIN') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'NUKI_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableNok = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'NUKI_LOGIN') {
      return Promise.resolve('email@unvalid.ko');
    }
    if (valueId === 'NUKI_PASSWORD') {
      return Promise.resolve('S0m3Th1ngF4ls3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const existingDevice = {
  external_id: 'alreadyExists',
  name: 'alreadyExists',
  model: 'Smart Lock 3.0 Pro',
  room_id: 'room_id',
  features: [
    {
      name: 'feature 1',
      type: 'type 1',
      category: 'category 1',
      external_id: 'external_id:1',
    },
    {
      name: 'feature 2',
      type: 'type 2',
      category: 'category 2',
      external_id: 'external_id:2',
    },
  ],
  params: [],
};

module.exports = {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  variableNok,
  existingDevice,
};
