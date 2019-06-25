const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const MockedClient = require('./mocks.test');

const ExampleService = proxyquire('../../../services/example/index', {
  axios: MockedClient,
});

describe('ExampleService', () => {
  const exampleService = ExampleService();
  it('should have start function', () => {
    expect(exampleService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(exampleService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have light object', () => {
    expect(exampleService)
      .to.have.property('light')
      .and.be.instanceOf(Object);
  });
  it('exampleService.light should have turnOn function', () => {
    expect(exampleService.light)
      .to.have.property('turnOn')
      .and.be.instanceOf(Function);
  });
  it('exampleService.light should have turnOff function', () => {
    expect(exampleService.light)
      .to.have.property('turnOff')
      .and.be.instanceOf(Function);
  });
});

describe('ExampleService lifecycle', () => {
  const exampleService = ExampleService();
  it('should start the service', async () => {
    await exampleService.start();
  });
  it('should stop the service', async () => {
    await exampleService.stop();
  });
});

describe('ExampleService.light', () => {
  const exampleService = ExampleService();
  const deviceFeature = {
    id: 'd0a6cfc7-fe07-4df1-b0db-70d878bcdd2b',
    external_id: 'example:1',
    type: 'binary',
  };
  it('should turnOn the light', async () => {
    await exampleService.light.turnOn(deviceFeature);
  });
  it('should turnOff the light', async () => {
    await exampleService.light.turnOff(deviceFeature);
  });
  it('should get the state of the light', async () => {
    const value = await exampleService.light.getState(deviceFeature);
    expect(value).to.equal(1);
  });
});
