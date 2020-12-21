const logger = require('../../../../utils/logger');
/* eslint-disable jsdoc */
/* eslint-disable jsdoc/require-returns */
/**
 * @description Get devices value from a home.
 * @example
 * getHomeStatusData();
 */
async function getHomeStatusData() {
  // we get the houses of Netatmo Energy
  new Promise((resolve, reject) => {
    this.api.homesData((err, data) => {
      resolve(data.homes);
    });
  })
    .then((data) => {
      data.forEach((home) => {
        const options = {
          device: '',
          home_id: home.id,
        };
        new Promise((resolve, reject) => {
          this.api.homeStatus(options, (err, homeStatus) => {
            resolve(homeStatus.home);
          });
        }).then((homeStatus) => {
          let valves = [];
          home.modules.forEach((module) => {
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
              valves = module;
              const indexValveHomeStatus = homeStatus.modules.findIndex((element) => element.id === valves.id);
              const indexRoomHomeStatus = homeStatus.rooms.findIndex((element) => element.id === valves.room_id);

              // then we get the 2nd part of the valves
              valves.homeStatus = homeStatus.modules[indexValveHomeStatus];
              // then we get the 3rd part of the valves : rooms
              valves.room = homeStatus.rooms[indexRoomHomeStatus];
              this.newValueValve(valves);
            }
          });
        });
      });
    })
    .catch((err) => {
      logger.info(`Error on getHomeStatusData - ${err}`);
    });
}

module.exports = {
  getHomeStatusData,
};
