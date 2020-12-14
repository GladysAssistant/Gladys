const { assert, fake } = require('sinon');
const sinon = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const NetatmoManager = require('../../../../../services/netatmo/lib');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: sinon.stub(),
  },
};

// describe('netatmoManager AddSensor', () => {
//   it('should connect to netatmo', async () => {
//     const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
//     await netatmoManager.connect();
//     assert.called(netatmoManager.getDevices());
//   });
//
//   it('should failed to connect to netatmo', async () => {
//     const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
//     await netatmoManager.connect();
//     assert.throws(ServiceNotConfiguredError);
//   })
// });
