const { expect } = require('chai');

const MessageHandler = require('../../../../services/free-mobile/lib');

describe('FreeMobile MessageHandler', () => {
  it('should store gladys, axios and serviceId', () => {
    const gladys = {};
    const axios = {};
    const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

    const messageHandler = new MessageHandler(gladys, axios, serviceId);

    expect(messageHandler.gladys).to.equal(gladys);
    expect(messageHandler.axios).to.equal(axios);
    expect(messageHandler.serviceId).to.equal(serviceId);
    expect(messageHandler.send).to.be.a('function');
  });
});
