/**
 * @description Poll value of a Netatmo devices
 * @example
 * pollManual();
 */
async function pollManual() {
  await this.getThermostatsData();
  await this.getHomeStatusData();
  await this.getHomeData();
  await this.getHealthyHomeCoachData();
  await this.getStationsData();
  Object.keys(this.devices).forEach(async (key) => {
    let deviceExternalId;
    if (this.devices[key].id !== undefined) {
      deviceExternalId = `netatmo:${this.devices[key].id}`;
    } else {
      /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
      deviceExternalId = `netatmo:${this.devices[key]._id}`;
    }
    const deviceSelector = deviceExternalId.replace(/:/gi, '-');
    const device = this.gladys.device.getBySelector(deviceSelector);
    await this.updateThermostat(key, device, deviceSelector);

    await this.updateCamera(key, device, deviceSelector);

    // we save the common data of home coaches and weather stations
    await this.updateHomeCoachWeather(key, device, deviceSelector);

    // we save other home coach data
    await this.updateNHC(key, device, deviceSelector);

    // we save the other weather station data
    await this.updateWeatherStation(key, device, deviceSelector);
  });
}

module.exports = {
  pollManual,
};
