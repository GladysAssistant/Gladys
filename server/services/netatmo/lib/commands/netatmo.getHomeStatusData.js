const axios = require('axios');
const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description Get devices value from a home.
 * @param {string} mode - Data received
 * @example
 * getHomeStatusData();
 */
async function getHomeStatusData(mode = '') {
  try {
    const responseThermostats = await axios.get(`${this.baseUrl}/api/getthermostatsdata?access_token=${this.token}`);
    const responseHomes = await axios.post(`${this.baseUrl}/api/homesdata`, { access_token: this.token });
    responseHomes.data.body.homes.forEach(async (home) => {
      const options = {
        device_types: 'NRV',
        home_id: home.id,
        access_token: this.token,
      };
      const responseHomeStatus = await axios.post(`${this.baseUrl}/api/homestatus`, options);
      if (home.modules !== undefined) {
        home.modules.forEach((module) => {
          // we get the 1st part of the smoke detectors - no interesting data for the moment - pending update API Netatmo because data available on https://dev.netatmo.com/apidocumentation/energy
          // if (module.type === 'NSD') {
          //   smokedetectors = module;
          //   const indexSmokedetectorsHomeStatus = responseHomeStatus.data.body.home.modules.findIndex((element) =>
          //     element.id === smokedetectors.id
          //   );
          //   const indexRoomHomeStatus = homeStatus.rooms.findIndex((element) =>
          //     element.id === smokedetectors.room_id
          //   );
          //
          //   // then we get the 2nd part of the smoke detectors - no interesting data for the moment -
          //   // pending update Netatmo API because data available on https://dev.netatmo.com/apidocumentation/energy
          //   smokedetectors['homeStatus'] = responseHomeStatus.data.body.home.modules[indexValveHomeStatus];
          //   // then we get the 3rd part of the smoke detectors : rooms
          //   smokedetectors['room'] = responseHomeStatus.data.body.home.rooms[indexRoomHomeStatus];
          //   this.newValueSmokeDetector(smokedetectors);
          // }
          if (module.type === 'NAPlug') {
            const indexBridge = responseThermostats.data.body.devices.findIndex((element) => element._id === module.id);
            if (
              indexBridge !== -1 &&
              responseThermostats.data.body.devices[indexBridge].plug_connected_boiler === true
            ) {
              this.boiler[home.id] = {
                bridge: module.id,
                thermostat: responseThermostats.data.body.devices[indexBridge].modules[0]._id,
              };
            }
          }
          if (module.type === 'NATherm1') {
            // then we get the 1st part of the valves
            const thermostat = module;
            const indexThermostatHomeStatus = responseHomeStatus.data.body.home.modules.findIndex(
              (element) => element.id === thermostat.id,
            );
            const indexRoomHomeStatus = responseHomeStatus.data.body.home.rooms.findIndex(
              (element) => element.id === thermostat.room_id,
            );
            const indexBridge = responseThermostats.data.body.devices.findIndex(
              (element) => element._id === thermostat.bridge,
            );
            const indexThermostatData = responseThermostats.data.body.devices[indexBridge].modules.findIndex(
              (element) => element._id === thermostat.id,
            );
            // then we get the 2nd part of the valves
            thermostat.fullData = responseThermostats.data.body.devices[indexBridge].modules[indexThermostatData];
            thermostat.homeStatus = responseHomeStatus.data.body.home.modules[indexThermostatHomeStatus];
            thermostat.house_id = home.id;
            // then we get the 3rd part of the valves : rooms
            thermostat.room = responseHomeStatus.data.body.home.rooms[indexRoomHomeStatus];

            const sid = thermostat.id;
            if (this.devices[sid] === undefined || mode === 'refresh') {
              this.newValueThermostat(thermostat);
            }
            this.devices[sid] = thermostat;
          }

          if (module.type === 'NRV') {
            // then we get the 1st part of the valves
            const valve = module;
            const indexValveHomeStatus = responseHomeStatus.data.body.home.modules.findIndex(
              (element) => element.id === valve.id,
            );
            const indexRoomHomeStatus = responseHomeStatus.data.body.home.rooms.findIndex(
              (element) => element.id === valve.room_id,
            );
            // then we get the 2nd part of the valves
            valve.homeStatus = responseHomeStatus.data.body.home.modules[indexValveHomeStatus];
            valve.house_id = home.id;
            // then we get the 3rd part of the valves : rooms
            valve.room = responseHomeStatus.data.body.home.rooms[indexRoomHomeStatus];

            const sid = valve.id;
            if (this.devices[sid] === undefined || mode === 'refresh') {
              this.newValueValve(valve);
            }
            this.devices[sid] = valve;
          }
        });
      } else {
        logger.info(`Files getHomeStatusData - No data devices in ${home.name}`);
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
          payload: `Files getHomeStatusData - No data devices in ${home.name}`,
        });
      }
    });
  } catch (err) {
    logger.info(`Error on getHomeStatusData - ${err}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `Error on getHomeStatusData - ${err}`,
    });
  }
}

module.exports = {
  getHomeStatusData,
};
