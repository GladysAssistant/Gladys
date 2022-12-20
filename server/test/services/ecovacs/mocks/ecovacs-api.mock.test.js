const { fake } = require('sinon');

const countries = {
  FR: {
    name: 'France',
    continent: 'EU',
  },
  DE: {
    name: 'Deutschland',
    continent: 'EU',
  },
};

const fakes = {
  deviceImageURL: 'http://image.url',
  deviceModel: 'Ecovacs',
  getName: fake.returns('DEEBOT OZMO 920 Series'),
  hasMainBrush: fake.returns(true),
  hasMappingCapabilities: fake.returns(true),
  hasCustomAreaCleaningMode: fake.returns(true),
  hasMoppingSystem: fake.returns(true),
  clean: fake.returns(true),
  stop: fake.returns(true),
  pause: fake.returns(true),
};

class VacBotClass {}
VacBotClass.prototype.deviceImageURL = fakes.deviceImageURL;
VacBotClass.prototype.deviceModel = fakes.deviceModel;
VacBotClass.prototype.getName = fakes.getName;
VacBotClass.prototype.hasMainBrush = fakes.hasMainBrush;
VacBotClass.prototype.hasMappingCapabilities = fakes.hasMappingCapabilities;
VacBotClass.prototype.hasCustomAreaCleaningMode = fakes.hasCustomAreaCleaningMode;
VacBotClass.prototype.hasMoppingSystem = fakes.hasMoppingSystem;
VacBotClass.prototype.clean = fakes.clean;
VacBotClass.prototype.stop = fakes.stop;
VacBotClass.prototype.pause = fakes.pause;

class EcoVacsAPI {
  constructor(deviceId, country, continent = '') {
    this.resource = deviceId;
    this.country = country;
    this.continent = continent;
    this.deviceId = deviceId;
    this.vacbots = [
      {
        did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a12',
        name: 'E0001278919601690356',
        class: 'vi829v',
        resource: 'NjxW',
        nick: null,
        company: 'eco-ng',
        bindTs: 1575723788332,
        service: { jmq: 'jmq-ngiot-eu.dc.ww.ecouser.net', mqs: 'api-ngiot.dc-as.ww.ecouser.net' },
        homeId: '626a935763a68e33482ec2e3',
        homeSort: 9999,
        deviceName: 'DEEBOT OZMO 920 Series',
        icon: 'https://portal-ww.ecouser.net/api/pim/file/get/606278d3fc527c00087fdb08',
        ota: true,
        UILogicId: 'DX_5G',
        materialNo: '110-1819-0101',
        pid: '5c19a8f3a1e6ee0001782247',
        product_category: 'DEEBOT',
        model: 'DX5G',
        updateInfo: { needUpdate: false, changeLog: '' },
        status: 1,
        offmap: true,
        deviceNumber: 0,
      },
      {
        did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a13',
        name: 'E0001278919601690357',
        class: 'vi829v',
        resource: 'NjxW',
        nick: null,
        company: 'eco-ng',
        bindTs: 1575723788332,
        service: { jmq: 'jmq-ngiot-eu.dc.ww.ecouser.net', mqs: 'api-ngiot.dc-as.ww.ecouser.net' },
        homeId: '626a935763a68e33482ec2e3',
        homeSort: 9999,
        deviceName: 'DEEBOT OZMO 990 Series',
        icon: 'https://portal-ww.ecouser.net/api/pim/file/get/606278d3fc527c00087fdb08',
        ota: true,
        UILogicId: 'DX_6G',
        materialNo: '110-1819-0101',
        pid: '5c19a8f3a1e6ee0001782247-bis',
        product_category: 'DEEBOT',
        model: 'DX6G',
        updateInfo: { needUpdate: false, changeLog: '' },
        status: 1,
        offmap: true,
        deviceNumber: 1,
      },
      {
        did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a13',
        name: 'E0001278919601690357',
        class: 'vi829v',
        resource: 'NjxW',
        nick: null,
        company: 'eco-ng',
        bindTs: 1575723788332,
        service: { jmq: 'jmq-ngiot-eu.dc.ww.ecouser.net', mqs: 'api-ngiot.dc-as.ww.ecouser.net' },
        homeId: '626a935763a68e33482ec2e3',
        homeSort: 9999,
        deviceName: 'DEEBOT OZMO 42 Series',
        icon: 'https://portal-ww.ecouser.net/api/pim/file/get/606278d3fc527c00087fdb08',
        ota: true,
        UILogicId: 'DX_7G',
        materialNo: '110-1819-0101',
        pid: '5c19a8f3a1e6ee0001782247-beta',
        product_category: 'DEEBOT',
        model: 'DX7G',
        updateInfo: { needUpdate: false, changeLog: '' },
        status: 1,
        offmap: true,
        deviceNumber: 2,
      },
    ];
    this.errorMsg = `Authentication error`;
    this.readyMsg = `ready`;
  }

  async connect(accountId, passwordHash) {
    if (accountId === 'email@valid.ok' && passwordHash === 'S0m3Th1ngTru3') {
      return Promise.resolve(this.readyMsg);
    }
    throw new Error(this.errorMsg);
  }

  static getDeviceId(machineId, deviceNumber = 0) {
    return machineId + deviceNumber.toString();
  }

  static md5(password) {
    return password;
  }

  async devices() {
    return this.vacbots;
  }

  getVacBot(user, hostname, resource, userToken, vacuum, continent) {
    return new VacBotClass(user, hostname, resource, userToken, vacuum, this.continent, this.country);
  }
}

module.exports = {
  EcoVacsAPI,
  fakes,
  countries,
};
