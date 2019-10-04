const sinon = require('sinon');

const { assert, fake } = sinon;

const SmartthingsHandler = require('../../../../services/smartthings/lib');

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const gladys = {};

describe('SmartThings service - handleHttpCallback', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();

    smartthingsHandler.connector = {
      handleHttpCallback: fake.resolves(null),
    };
  });

  it('should call connector', async () => {
    const req = 'request';
    const res = 'response';

    smartthingsHandler.handleHttpCallback(req, res);

    assert.calledWith(smartthingsHandler.connector.handleHttpCallback, req, res);
  });
});
