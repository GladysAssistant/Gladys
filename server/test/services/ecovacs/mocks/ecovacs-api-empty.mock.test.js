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

class EcoVacsAPI {
  constructor(deviceId, country, continent = '') {
    this.resource = deviceId;
    this.country = country;
    this.continent = continent;
    this.deviceId = deviceId;
    this.vacbots = [];
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

  async devices() {
    return this.vacbots;
  }
}

module.exports = {
  EcoVacsAPI,
  countries,
};
