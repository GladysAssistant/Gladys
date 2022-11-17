const Promise = require('bluebird');
const { fake } = require('sinon');

const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

const event = { emit: fake.resolves(null) };

const devices = [
  {
    service_id: serviceId,
    name: 'DEEBOT OZMO 920 Series',
    model: 'DX5G',
    external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:0',
    selector: 'ecovacs:5c19a8f3a1e6ee0001782247:0',
    should_poll: false,
    features: [
      {
        name: 'power',
        selector: 'ecovacs:5c19a8f3a1e6ee0001782247:state:0',
        external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:state:0',
        category: 'vacbot',
        type: 'state',
        read_only: false,
        keep_history: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
    params: [],
  },
  {
    service_id: serviceId,
    name: 'DEEBOT OZMO 990 Series',
    model: 'DX6G',
    external_id: 'ecovacs:5c19a8f3a1e6ee0001782247-bis:1',
    selector: 'ecovacs:5c19a8f3a1e6ee0001782247-bis:1',
    should_poll: false,
    features: [
      {
        name: 'power',
        selector: 'ecovacs:5c19a8f3a1e6ee0001782247-bis:state:1',
        external_id: 'ecovacs:5c19a8f3a1e6ee0001782247-bis:state:1',
        category: 'vacbot',
        type: 'state',
        read_only: false,
        keep_history: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
    params: [],
  },
  {
    service_id: serviceId,
    name: 'DEEBOT OZMO 42 Series',
    model: 'DX7G',
    external_id: 'ecovacs:5c19a8f3a1e6ee0001782247-beta:2',
    selector: 'ecovacs:5c19a8f3a1e6ee0001782247-beta:2',
    should_poll: false,
    features: [
      {
        name: 'power',
        selector: 'ecovacs:5c19a8f3a1e6ee0001782247-beta:state:2',
        external_id: 'ecovacs:5c19a8f3a1e6ee0001782247-beta:state:2',
        category: 'vacbot',
        type: 'state',
        read_only: false,
        keep_history: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
    params: [],
  },
];

const variableNotConfigured = {
  getValue: (valueId, notUsed) => {
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOk = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'ECOVACS_LOGIN') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'ECOVACS_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    if (valueId === 'ECOVACS_COUNTRY_CODE') {
      return Promise.resolve('fr');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOkNoRegion = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'ECOVACS_LOGIN') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'ECOVACS_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableOkFalseRegion = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'ECOVACS_LOGIN') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'ECOVACS_PASSWORD') {
      return Promise.resolve('S0m3Th1ngTru3');
    }
    if (valueId === 'ECOVACS_COUNTRY_CODE') {
      return Promise.resolve('uk');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const variableNok = {
  getValue: (valueId, notUsed) => {
    if (valueId === 'ECOVACS_LOGIN') {
      return Promise.resolve('email@unvalid.ko');
    }
    if (valueId === 'ECOVACS_PASSWORD') {
      return Promise.resolve('S0m3Th1ngF4ls3');
    }
    if (valueId === 'ECOVACS_COUNTRY_CODE') {
      return Promise.resolve('de');
    }
    return Promise.resolve(undefined);
  },
  setValue: fake.returns(null),
};

const deviceManagerFull = {
  get: fake.resolves(true),
};

const stateManagerWith0Devices = {
  get: (key, externalId) => {
    return undefined;
  },
};

const stateManagerWith2Devices = {
  get: (key, externalId) => {
    if (externalId === 'ecovacs:5c19a8f3a1e6ee0001782247:0') {
      return devices[0];
    }
    if (externalId === 'ecovacs:5c19a8f3a1e6ee0001782247-bis:1') {
      return devices[1];
    }
    return undefined;
  },
};

const stateManagerFull = {
  get: (key, externalId) => {
    if (externalId === 'ecovacs:5c19a8f3a1e6ee0001782247:0') {
      return devices[0];
    }
    if (externalId === 'ecovacs:5c19a8f3a1e6ee0001782247-bis:1') {
      return devices[1];
    }
    if (externalId === 'ecovacs:5c19a8f3a1e6ee0001782247-beta:2') {
      return devices[2];
    }
    return undefined;
  },
};

module.exports = {
  serviceId,
  event,
  devices,
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
