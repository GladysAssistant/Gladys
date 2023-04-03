---
to: test/services/<%= module %>/mocks/consts.test.js
---
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
    if (valueId === '<%= constName %>_LOGIN') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === '<%= constName %>_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};


const variableNok = {
  getValue: (valueId, notUsed) => {
    if (valueId === '<%= constName %>_LOGIN') {
      return Promise.resolve('email@unvalid.ko');
    }
    if (valueId === '<%= constName %>_PASSWORD') {
      return Promise.resolve('S0m3Th1ngF4ls3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};


module.exports = {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  variableNok,
};
