const sinon = require('sinon');
const { expect } = require('chai');
const get = require('get-value');

const { assert, fake } = sinon;
const AlexaHandler = require('../../../../services/alexa/lib');
const { EVENTS } = require('../../../../utils/constants');

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
    }).to.throw('Unkown directive Alexa.UNKNOWN_COMMAND');
  });
});
