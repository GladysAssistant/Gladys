const { expect } = require('chai');
const { fake, stub } = require('sinon');

const gladys = {
  variable: {
    getValue: fake.resolves('test-value'),
  },
  http: {
    request: fake.resolves({ data: 'Message Queued' }),
  },
};

const MessageHandler = require('../../../../services/callmebot/lib');

describe('CallMeBot.message', () => {
  const messageHandler = new MessageHandler(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');

  beforeEach(() => {
    gladys.variable.getValue.resetHistory();
    gladys.http.request.resetHistory();
  });

  it('should send WhatsApp message successfully', async () => {
    // Mock the variable values
    gladys.variable.getValue = stub()
      .onFirstCall()
      .resolves('test-api-key')
      .onSecondCall()
      .resolves('whatsapp')
      .onThirdCall()
      .resolves('1234567890');

    await messageHandler.send('test-user-id', {
      text: 'Hello from Gladys!',
    });

    // Check if variables were retrieved
    expect(gladys.variable.getValue.callCount).to.equal(3);
    expect(gladys.variable.getValue.args[0]).to.eql([
      'CALLMEBOT_API_KEY',
      'a810c3c0-8c79-4e5c-9872-111f1d27d96e',
      'test-user-id',
    ]);
    expect(gladys.variable.getValue.args[1]).to.eql([
      'CALLMEBOT_MESSAGING_SERVICE',
      'a810c3c0-8c79-4e5c-9872-111f1d27d96e',
      'test-user-id',
    ]);
    expect(gladys.variable.getValue.args[2]).to.eql([
      'CALLMEBOT_PHONE_NUMBER',
      'a810c3c0-8c79-4e5c-9872-111f1d27d96e',
      'test-user-id',
    ]);

    // Check if HTTP request was made correctly
    expect(gladys.http.request.callCount).to.equal(1);
    expect(gladys.http.request.args[0][0]).to.equal('get');
    expect(gladys.http.request.args[0][1]).to.include('https://api.callmebot.com/whatsapp.php');
    expect(gladys.http.request.args[0][1]).to.include('phone=1234567890');
    expect(gladys.http.request.args[0][1]).to.include(encodeURIComponent('Hello from Gladys!'));
    expect(gladys.http.request.args[0][1]).to.include('apikey=test-api-key');
  });

  it('should send Signal message successfully', async () => {
    // Mock the variable values
    gladys.variable.getValue = stub()
      .onFirstCall()
      .resolves('test-api-key')
      .onSecondCall()
      .resolves('signal')
      .onThirdCall()
      .resolves('uuid-test-123');

    await messageHandler.send('test-user-id', {
      text: 'Hello from Gladys!',
    });

    expect(gladys.http.request.args[0][1]).to.include('https://api.callmebot.com/signal/send.php');
  });

  it('should return when configuration is missing', async () => {
    // Mock missing configuration
    gladys.variable.getValue = stub().resolves(null);

    await messageHandler.send('test-user-id', {
      text: 'Hello from Gladys!',
    });
  });

  it('should throw error when messaging service is not supported', async () => {
    // Mock invalid messaging service
    gladys.variable.getValue = stub()
      .onFirstCall()
      .resolves('test-api-key')
      .onSecondCall()
      .resolves('unsupported-service')
      .onThirdCall()
      .resolves('1234567890');

    const promise = messageHandler.send('test-user-id', {
      text: 'Hello from Gladys!',
    });

    await expect(promise).to.be.rejectedWith('Unsupported messaging service: unsupported-service');
  });

  it('should throw error when API returns error', async () => {
    // Mock API error response
    gladys.variable.getValue = stub()
      .onFirstCall()
      .resolves('test-api-key')
      .onSecondCall()
      .resolves('whatsapp')
      .onThirdCall()
      .resolves('1234567890');

    gladys.http.request = stub().resolves({ data: 'Error occurred' });

    const promise = messageHandler.send('test-user-id', {
      text: 'Hello from Gladys!',
    });

    await expect(promise).to.be.rejectedWith('Failed to send message: Error occurred');
  });
});
