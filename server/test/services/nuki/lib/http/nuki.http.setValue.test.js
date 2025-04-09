const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiHTTPHandler = require('../../../../../services/nuki/lib/http');

const fakeNukiWebApi = {
     setAction: fake.returns(true),
};

const gladys = {};

const device = {
  external_id: 'nuki:398172F4',
};

describe('nuki.http.setValue command', () => {
  let nukiHttpHandler;

  beforeEach(() => {
    const nukiHandler = new NukiHandler(gladys, serviceId);
    nukiHttpHandler = new NukiHTTPHandler(nukiHandler);
    nukiHttpHandler.nukiApi = fakeNukiWebApi;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should call setAction of the Nuki Web API', async () => {
    const command = 'on';
    const value = 1;
    nukiHttpHandler.setValue(device, command, value);
    assert.calledOnce(nukiHttpHandler.nukiApi.setAction);
    
  });
});
