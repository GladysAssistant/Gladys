const { expect } = require('chai');

const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const KodiMock = require('./kodi.mock.test');

const KodiService = proxyquire('../../../services/kodi/index', {
  './lib': KodiMock,
});

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

const logger = require('../../../utils/logger');

describe('KodiService', () => {
  logger.debug('Gladys: ', gladys);

  const kodiService = KodiService(gladys, 'a03b03b-6d83-4697-bed3-c4b72c996279');

  logger.debug(kodiService.prototype);
  logger.info('Start test of KodiService: ');

  it('should have controllers', () => {
    expect(kodiService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });

  it('should have start function', () => {
    expect(kodiService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(kodiService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});
