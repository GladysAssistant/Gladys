const sinon = require('sinon');

const { fake } = sinon;

const proxyquire = require('proxyquire');

describe('SendCommand command', () => {
  let overkizServerAPI;
  let sendCommand;

  beforeEach(() => {
    overkizServerAPI = {
      exec: fake.returns('0123456789'),
    };
    sendCommand = proxyquire('../../../../../services/overkiz/lib/commands/overkiz.sendCommand', {
      overkizServerAPI: { overkizServerAPI },
    }).sendCommand;
  });

  it('should sendCommand', async () => {
    await sendCommand.bind({
      overkizServerAPI,
    })('command', 'io:xxx');
  });
});
