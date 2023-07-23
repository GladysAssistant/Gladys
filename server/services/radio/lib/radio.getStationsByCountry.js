const RadioBrowser = require('radio-browser');
const { RADIO } = require('./utils/radio.constants');

/**
 * @description Return list of stations by country.
 * @param {string} country - Country to search.
 * @returns {Array} List of stations by country.
 * @example
 * getStationsByCountry('France');
 */
async function getStationsByCountry(country) {
  let countryUsed = country;
  if (!countryUsed) {
    countryUsed = await this.gladys.variable.getValue(RADIO.DEFAULT_COUNTRY, this.serviceId);
  }

  if (countryUsed) {
    this.radioList = [];
    const filter = {
      by: 'country',
      searchterm: countryUsed,
      hidebroken: true,
    };

    const stations = await RadioBrowser.getStations(filter);
    const mapOfStation = new Map();
    await stations.forEach((element) => {
      if (element.codec === 'MP3') {
        const station = {
          value: element.stationuuid,
          label: element.name,
          url: element.url,
          cover: element.favicon,
        };
        const isHttpsURL = element.url.startsWith('https');
        if (!mapOfStation.get(element.name) || isHttpsURL) {
          mapOfStation.set(element.name, station);
        }
      }
    });
    this.radioList = Array.from(mapOfStation.values());
    this.radioList.sort();
  }

  return this.radioList;
}

module.exports = {
  getStationsByCountry,
};
