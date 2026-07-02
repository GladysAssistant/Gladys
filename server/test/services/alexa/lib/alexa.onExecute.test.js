const sinon = require('sinon');
const { expect } = require('chai');
const get = require('get-value');

const { assert, fake } = sinon;
const AlexaHandler = require('../../../../services/alexa/lib');
const { EVENTS, COVER_STATE } = require('../../../../utils/constants');
const {
  BLIND_MODES,
  BLIND_MODE_CONTROLLER_INSTANCE,
  BLIND_RANGE_CONTROLLER_INSTANCE,
} = require('../../../../services/alexa/lib/alexa.constants');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

const DEVICE_1_LIGHT = {
  name: 'Device 1',
  selector: 'device-1',
  external_id: 'device-1-external-id',
  features: [
    {
      read_only: false,
      category: 'light',
      type: 'brightness',
      min: 0,
      max: 100,
      last_value: 100,
    },
    {
      read_only: false,
      category: 'light',
      type: 'color',
    },
    {
      read_only: false,
      category: 'light',
      type: 'binary',
    },
  ],
  model: 'device-model',
  room: {
    name: 'living-room',
  },
};

const DEVICE_1_SWITCH = {
  name: 'Device 1',
  selector: 'device-1',
  external_id: 'device-1-external-id',
  features: [
    {
      read_only: false,
      category: 'switch',
      type: 'binary',
    },
  ],
  model: 'device-model',
  room: {
    name: 'living-room',
  },
};

const DEVICE_1_SHUTTER = {
  name: 'Living Room Shutter',
  selector: 'device-shutter',
  external_id: 'device-shutter-external-id',
  features: [
    {
      read_only: false,
      category: 'shutter',
      type: 'state',
      last_value: COVER_STATE.CLOSE,
    },
    {
      read_only: false,
      category: 'shutter',
      type: 'position',
      min: 0,
      max: 100,
      last_value: 0,
    },
  ],
  model: 'device-model',
  room: {
    name: 'living-room',
  },
};

describe('alexa.onExecute', () => {
  it('Should turn on the light', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOn',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'ON',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should turn on the light and put brightness to 100', async () => {
    const DEVICE_WITH_LIGHT_TURNED_OFF = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          read_only: false,
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 100,
          last_value: 0,
        },
        {
          read_only: false,
          category: 'light',
          type: 'color',
        },
        {
          read_only: false,
          category: 'light',
          type: 'binary',
          last_value: 0,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_WITH_LIGHT_TURNED_OFF;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_WITH_LIGHT_TURNED_OFF),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOn',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 100,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'ON',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should turn put the light to 50% (200)', async () => {
    const DEVICE_WITH_LIGHT_TURNED_OFF = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          read_only: false,
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 400,
          last_value: 0,
        },
        {
          read_only: false,
          category: 'light',
          type: 'color',
        },
        {
          read_only: false,
          category: 'light',
          type: 'binary',
          last_value: 0,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_WITH_LIGHT_TURNED_OFF;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_WITH_LIGHT_TURNED_OFF),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'SetBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightness: 50 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 200,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 50,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should turn off the light', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOff',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'OFF',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should change brightness of light', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'SetBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightness: 50 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 50,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 50,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness of light relatively', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: -25 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 75,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 75,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness of light relatively, with a light with custom min max', async () => {
    const DEVICE_WITH_CUSTOM_MIN_MAX = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          read_only: false,
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 400,
          last_value: 200,
        },
        {
          read_only: false,
          category: 'light',
          type: 'color',
        },
        {
          read_only: false,
          category: 'light',
          type: 'binary',
          last_value: 1,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_WITH_CUSTOM_MIN_MAX;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_WITH_CUSTOM_MIN_MAX),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: -25 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 100,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 25,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness of light relatively from a turned off light', async () => {
    const DEVICE_WITH_LIGHT_TURNED_OFF = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          read_only: false,
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 100,
          last_value: 100,
        },
        {
          read_only: false,
          category: 'light',
          type: 'color',
        },
        {
          read_only: false,
          category: 'light',
          type: 'binary',
          last_value: 0,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_WITH_LIGHT_TURNED_OFF;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_WITH_LIGHT_TURNED_OFF),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: 25 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 25,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 25,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness -25% of light relatively from a turned off light', async () => {
    const DEVICE_WITH_LIGHT_TURNED_OFF = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          read_only: false,
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 100,
          last_value: 100,
        },
        {
          read_only: false,
          category: 'light',
          type: 'color',
        },
        {
          read_only: false,
          category: 'light',
          type: 'binary',
          last_value: 0,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_WITH_LIGHT_TURNED_OFF;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_WITH_LIGHT_TURNED_OFF),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: -25 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 0,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness of light relatively, and put it to 0', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: -120 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 0,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should ajust brightness of light relatively, and put it to 100', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.BrightnessController',
          name: 'AdjustBrightness',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: { brightnessDelta: 25 },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 100,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'brightness',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 100,
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should change color of light', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_LIGHT;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_LIGHT),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.ColorController',
          name: 'SetColor',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {
          color: {
            hue: 300,
            saturation: 1,
            brightness: 1,
          },
        },
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'binary',
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 16711935,
      device: 'device-1',
      feature_category: 'light',
      feature_type: 'color',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.ColorController',
            name: 'color',
            value: {
              hue: 300,
              saturation: 1,
              brightness: 1,
            },
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should turn on a powerplug', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_SWITCH;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_SWITCH),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOn',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 1,
      device: 'device-1',
      feature_category: 'switch',
      feature_type: 'binary',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'ON',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should turn off a powerplug', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return DEVICE_1_SWITCH;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns(DEVICE_1_SWITCH),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOff',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-1',
      feature_category: 'switch',
      feature_type: 'binary',
    });
    expect(result).to.deep.equal({
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'OFF',
            timeOfSample: get(result, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 500,
          },
        ],
      },
    });
  });
  it('Should return error, device feature not found', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return null;
        },
        state: {
          device: {
            device_1: {
              get: fake.returns({
                name: 'Device 1',
                selector: 'device-1',
                external_id: 'device-1-external-id',
                features: [
                  {
                    read_only: false,
                    category: 'switch',
                    type: 'binary',
                  },
                ],
                model: 'device-model',
                room: {
                  name: 'living-room',
                },
              }),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.PowerController',
          name: 'TurnOff',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    expect(() => {
      alexaHandler.onExecute(body);
    }).to.throw('Device "device-1" not found');
    assert.notCalled(gladys.event.emit);
  });
  it('Should return error, unknown directive', async () => {
    const gladys = {
      stateManager: {
        get: () => {
          return {
            read_only: false,
            category: 'light',
            type: 'binary',
          };
        },
        state: {
          device: {
            device_1: {
              get: fake.returns({
                name: 'Device 1',
                selector: 'device-1',
                external_id: 'device-1-external-id',
                features: [
                  {
                    read_only: false,
                    category: 'light',
                    type: 'binary',
                  },
                ],
                model: 'device-model',
                room: {
                  name: 'living-room',
                },
              }),
            },
          },
        },
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.UNKNOWN_COMMAND',
          name: 'TurnOff',
          payloadVersion: '3',
          messageId: 'c43c5ef1-b456-4736-ba6b-4643a98a7e27',
          correlationToken:
            'AAAAAAAAAQBe8ATzt+PzWVqbUXXQAv6JFAIAAAAAAADNYsvnxph02bkNS9vIkVRS1S/HQ30Nab1ai4U8WdBDVhSBKEkvJkzXTZFidmkW/eI78kPC8zSg4HTO0I1BfpLZ3qKVHkvLija4pKuhadAHKg96ccMDKR7krNc3AZ5RaDrg1QTPGbEfKXbUoPMNNo9HyRJzoEaqphBRI2/aFLmHaHnENYM8Ou3y7CzFj41xQ3VBjKQdyb4cxD2MJrAln2X5t0vuMcxkgMJ0ZTt9L9N3aQKFx9Xi3RI91cR4cDajUxGGx1RzYa2t6oroos5tjN3IutEntO7V0iKO/9CMnerWuFbihll7EeiDxY33h2KcY4MCIg2zQKaBRnyHwin+R/e9A7Ozv3CR/Qvxj5CxmL9nHHFjZMRXsauNNfG5vzzo03H5WutpXjC/UwfPviGk0dG+FBH7AqQ4TH1RojoLS/a1mcpsxSORo/dezT3d9zxlD/8lcsMcWZao5mxEkQybkrOBxXVhgAJyyH+5X/RJjUWVjVBxR4ODIRie1RKuTcmla7VwqM8JocAUy9lWsCMXjW5KhNBnVca/xU8I/XfhaVD+LV+pqDDvgDmq/KVYyp8bbFKVdSQ9mFrVMpgt97lnMDd2oNASDET10grmQdwbn/FivkK2tnveVlaU7/BpnC+JpGBqHT0DSJucu0es0SLlEd875QAdGPJ4Eg+OD4t8z4NqXyyH2iqVhq+AwQDFjY6UpPaWkykN',
        },
        endpoint: { endpointId: 'device-1', cookie: {} },
        payload: {},
      },
      user: { id: 'cbd42dc1-1b15-4c59-bea6-7e01968a9603', local_user_id: '275faa00-8a9c-4747-8fbe-417ddb966b16' },
    };
    expect(() => {
      alexaHandler.onExecute(body);
    }).to.throw('Unknown directive Alexa.UNKNOWN_COMMAND');
  });

  it('Should open the shutter', async () => {
    const gladys = {
      stateManager: {
        get: () => DEVICE_1_SHUTTER,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.ModeController',
          instance: BLIND_MODE_CONTROLLER_INSTANCE,
          name: 'SetMode',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { mode: BLIND_MODES.UP },
      },
    };

    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: COVER_STATE.OPEN,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'state',
    });
    expect(result.context.properties[0]).to.deep.equal({
      namespace: 'Alexa.ModeController',
      instance: BLIND_MODE_CONTROLLER_INSTANCE,
      name: 'mode',
      value: BLIND_MODES.UP,
      timeOfSample: get(result, 'context.properties.0.timeOfSample'),
      uncertaintyInMilliseconds: 500,
    });
  });

  it('Should close the shutter', async () => {
    const gladys = {
      stateManager: {
        get: () => DEVICE_1_SHUTTER,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.ModeController',
          instance: BLIND_MODE_CONTROLLER_INSTANCE,
          name: 'SetMode',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { mode: BLIND_MODES.DOWN },
      },
    };

    alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: COVER_STATE.CLOSE,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'state',
    });
  });

  it('Should set shutter position to 50%', async () => {
    const gladys = {
      stateManager: {
        get: () => DEVICE_1_SHUTTER,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.RangeController',
          instance: BLIND_RANGE_CONTROLLER_INSTANCE,
          name: 'SetRangeValue',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { rangeValue: 50 },
      },
    };

    const result = alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 50,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'position',
    });
    expect(result.context.properties[0]).to.deep.equal({
      namespace: 'Alexa.RangeController',
      instance: BLIND_RANGE_CONTROLLER_INSTANCE,
      name: 'rangeValue',
      value: 50,
      timeOfSample: get(result, 'context.properties.0.timeOfSample'),
      uncertaintyInMilliseconds: 500,
    });
  });

  it('Should adjust shutter position relatively', async () => {
    const shutterWithPosition = {
      ...DEVICE_1_SHUTTER,
      features: [
        DEVICE_1_SHUTTER.features[0],
        {
          ...DEVICE_1_SHUTTER.features[1],
          last_value: 40,
        },
      ],
    };
    const gladys = {
      stateManager: {
        get: () => shutterWithPosition,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.RangeController',
          instance: BLIND_RANGE_CONTROLLER_INSTANCE,
          name: 'AdjustRangeValue',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { rangeValueDelta: 10 },
      },
    };

    alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 50,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'position',
    });
  });

  it('Should adjust shutter position and clamp to max', async () => {
    const shutterWithPosition = {
      ...DEVICE_1_SHUTTER,
      features: [
        DEVICE_1_SHUTTER.features[0],
        {
          ...DEVICE_1_SHUTTER.features[1],
          last_value: 95,
        },
      ],
    };
    const gladys = {
      stateManager: {
        get: () => shutterWithPosition,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.RangeController',
          instance: BLIND_RANGE_CONTROLLER_INSTANCE,
          name: 'AdjustRangeValue',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { rangeValueDelta: 10 },
      },
    };

    alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 100,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'position',
    });
  });

  it('Should adjust shutter position and clamp to min', async () => {
    const shutterWithPosition = {
      ...DEVICE_1_SHUTTER,
      features: [
        DEVICE_1_SHUTTER.features[0],
        {
          ...DEVICE_1_SHUTTER.features[1],
          last_value: 5,
        },
      ],
    };
    const gladys = {
      stateManager: {
        get: () => shutterWithPosition,
      },
      event: {
        emit: fake.returns(null),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const body = {
      directive: {
        header: {
          namespace: 'Alexa.RangeController',
          instance: BLIND_RANGE_CONTROLLER_INSTANCE,
          name: 'AdjustRangeValue',
          payloadVersion: '3',
          messageId: 'message-id',
          correlationToken: 'correlation-token',
        },
        endpoint: { endpointId: 'device-shutter', cookie: {} },
        payload: { rangeValueDelta: -10 },
      },
    };

    alexaHandler.onExecute(body);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      type: 'device.set-value',
      status: 'pending',
      value: 0,
      device: 'device-shutter',
      feature_category: 'shutter',
      feature_type: 'position',
    });
  });
});
