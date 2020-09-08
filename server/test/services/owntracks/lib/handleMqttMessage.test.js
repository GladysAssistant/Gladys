

const sinon = require('sinon');

const { assert, fake } = sinon;
const OwntracksHandler = require('../../../../services/owntracks/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};
const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};

describe('Mqtt handle message', () => {
  const owntracksHandler = new OwntracksHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  owntracksHandler.mqttService = mqttService;

  beforeEach(async () => {
    sinon.reset();
  });

  it('should change user position', () => {
    owntracksHandler.handleMqttMessage('owntracks/gladys/user', JSON.stringify( {_type:'location', acc:104, alt:233, batt:97, conn:'w', lat:42.69, lon:42.666, tid:'1', tst:1599250110, vac:2, vel:0} ));

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });



  it('should do nothing on unkown user topic', () => {
    owntracksHandler.handleMqttMessage('owntracks/gladys/UNKOWN', JSON.stringify( {_type:'location', acc:104, alt:233, batt:97, conn:'w', lat:42.69, lon:42.666, tid:'1', tst:1599250110, vac:2, vel:0} ));

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
