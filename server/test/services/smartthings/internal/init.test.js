const sinon = require('sinon');

const { assert, fake } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const gladys = {
  oauth: {
    getClient: fake.resolves({}),
  },
  variable: {
    getValue: fake.resolves('value'),
  },
  event: {
    on: fake.returns(null),
  },
};

describe('SmartThings service - init', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('init with success', () => {
    smartthingsHandler.init();

    assert.calledWith(gladys.oauth.getClient, 'smartthings');
    assert.called(gladys.variable.getValue);
  });

  it('init with error', () => {
    gladys.variable.getValue = fake.rejects(null);
    smartthingsHandler.init();

    assert.calledWith(gladys.oauth.getClient, 'smartthings');
    assert.called(gladys.variable.getValue);
  });
});
