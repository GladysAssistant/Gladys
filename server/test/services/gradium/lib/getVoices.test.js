const { expect } = require('chai');
const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('getVoices', () => {
  let warn;
  let getVoices;

  beforeEach(() => {
    warn = stub();
    ({ getVoices } = proxyquire('../../../../services/gradium/lib/getVoices', {
      '../../../utils/logger': {
        warn,
      },
    }));
  });

  it('should return mapped voices', async () => {
    const context = {
      serviceId: 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa',
      gladys: {
        variable: {
          getValue: stub(),
        },
        http: {
          request: stub().resolves({
            data: [
              {
                uid: 'voice-1',
                name: 'Voice 1',
                description: 'Description 1',
                language: 'fr',
              },
              {
                uid: 'voice-2',
                name: 'Voice 2',
                description: 'Description 2',
                language: 'en',
              },
            ],
          }),
        },
      },
    };

    context.gladys.variable.getValue.withArgs('GRADIUM_ENDPOINT', context.serviceId).resolves('my-endpoint');
    context.gladys.variable.getValue.withArgs('GRADIUM_API_KEY', context.serviceId).resolves('my-api-key');

    const result = await getVoices.call(context);

    expect(context.gladys.http.request.callCount).to.equal(1);
    expect(context.gladys.http.request.firstCall.args).to.deep.equal([
      'get',
      'https://my-endpoint.api.gradium.ai/api/voices?include_catalog=true&limit=500',
      {},
      {
        'x-api-key': 'my-api-key',
        'Content-Type': 'application/json',
      },
    ]);
    expect(result).to.deep.equal([
      {
        id: 'voice-1',
        name: 'Voice 1',
        description: 'Description 1',
        language: 'fr',
      },
      {
        id: 'voice-2',
        name: 'Voice 2',
        description: 'Description 2',
        language: 'en',
      },
    ]);
  });

  it('should return an empty array on API error', async () => {
    const error = new Error('Gradium unavailable');
    const context = {
      serviceId: 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa',
      gladys: {
        variable: {
          getValue: stub(),
        },
        http: {
          request: stub().rejects(error),
        },
      },
    };

    context.gladys.variable.getValue.withArgs('GRADIUM_ENDPOINT', context.serviceId).resolves('my-endpoint');
    context.gladys.variable.getValue.withArgs('GRADIUM_API_KEY', context.serviceId).resolves('my-api-key');

    const result = await getVoices.call(context);

    expect(result).to.deep.equal([]);
    expect(warn.callCount).to.equal(1);
    expect(warn.firstCall.args[0]).to.equal(error);
  });
});
