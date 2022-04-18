const sinon = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladys = {
  variable: {
    getValue: sinon.fake.returns(null),
    setValue: sinon.fake.returns(null),
  },
};

describe('WithingsHandler init', () => {
  it('init withingsservice in Gladys', async () => {
    const withingsHandler = new WithingsHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');

    await withingsHandler.init();

    sinon.assert.callCount(gladys.variable.getValue, 1);
    sinon.assert.callCount(gladys.variable.setValue, 8);
  });
});
