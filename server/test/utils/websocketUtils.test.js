const { expect } = require('chai');
const { formatWebsocketMessage, parseWebsocketMessage } = require('../../utils/websocketUtils');

describe('formatWebsocketMessage', () => {
  it('should format websocket message', async () => {
    const message = formatWebsocketMessage('test', {});
    expect(message).to.deep.equal(
      JSON.stringify({
        type: 'test',
        payload: {},
      }),
    );
  });
});

describe('parseWebsocketMessage', () => {
  it('should format websocket message', async () => {
    const message = parseWebsocketMessage('{"type": "test", "payload": {}}');
    expect(message).to.deep.equal({
      type: 'test',
      payload: {},
    });
  });
});
