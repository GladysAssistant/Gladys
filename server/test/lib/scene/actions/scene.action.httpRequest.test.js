const { assert, fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('action.httpRequest', () => {
  it('should execute action http.request', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ success: true }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(http.request, 'post', 'http://test.test', { toto: 'toto' }, { authorization: 'token' });
  });
  it('should execute multiple http.request and verify scope of result', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ success: true }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      '0': { '0': { success: true }, '1': { success: true } },
      '1': { '0': { success: true } },
    });
  });
  it('should execute action http.request with empty body', async () => {
    const stateManager = new StateManager(event);
    const http = {
      request: fake.resolves({ success: true }),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            headers: [
              {
                key: 'authorization',
                value: 'token',
              },
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(http.request, 'post', 'http://test.test', undefined, { authorization: 'token' });
  });
});
