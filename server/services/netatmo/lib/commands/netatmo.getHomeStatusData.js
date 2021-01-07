const axios = require('axios');
const logger = require('../../../../utils/logger');
/* eslint-disable jsdoc */
/* eslint-disable jsdoc/require-returns */
/**
 * @description Get devices value from a home.
 * @example
 * getHomeStatusData();
 */
async function getHomeStatusData() {
  try {
    const responseHomes = await axios.post(`${this.baseUrl}/api/homesdata`, { access_token: this.token });
    responseHomes.data.body.homes.forEach(async (home) => {
      const options = {
        device_types: 'NRV',
        home_id: home.id,
        access_token: this.token,
      };
      const responseHomeStatus = await axios.post(`${this.baseUrl}/api/homestatus`, options);
      responseHomeStatus.data.body.home.modules.forEach((module) => {
        // we get the 1st part of the smoke detectors - no interesting data for the moment - pending update API Netatmo because data available on https://dev.netatmo.com/apidocumentation/energy
        // if (module.type === 'NSD') {
        //   smokedetectors = module;
        //   const indexSmokedetectorsHomeStatus = homeStatus.modules.findIndex((element) =>
        //     element.id === smokedetectors.id
        //   );
        //   const indexRoomHomeStatus = homeStatus.rooms.findIndex((element) =>
        //     element.id === smokedetectors.room_id
        //   );
        //
        //   // then we get the 2nd part of the smoke detectors - no interesting data for the moment -
        //   // pending update Netatmo API because data available on https://dev.netatmo.com/apidocumentation/energy
        //   smokedetectors['homeStatus'] = homeStatus.modules[indexValveHomeStatus];
        //   // then we get the 3rd part of the smoke detectors : rooms
        //   smokedetectors['room'] = homeStatus.rooms[indexRoomHomeStatus];
        //   this.newValueSmokeDetector( smokedetectors);
        // }

        if (module.type === 'NRV') {
          // then we get the 1st part of the valves
          const valves = module;
          const indexValveHomeStatus = responseHomeStatus.data.body.home.modules.findIndex(
            (element) => element.id === valves.id,
          );
          const indexRoomHomeStatus = responseHomeStatus.data.body.home.rooms.findIndex(
            (element) => element.id === valves.room_id,
          );

          // then we get the 2nd part of the valves
          valves.homeStatus = responseHomeStatus.data.body.home.modules[indexValveHomeStatus];
          // then we get the 3rd part of the valves : rooms
          valves.room = responseHomeStatus.data.body.home.rooms[indexRoomHomeStatus];
          this.newValueValve(valves);
        }
      });
    });
  } catch (err) {
    logger.info(`Error on getHomeStatusData - ${err}`);
  }
}

module.exports = {
  getHomeStatusData,
};
