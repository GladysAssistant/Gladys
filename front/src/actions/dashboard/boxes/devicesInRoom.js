import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../../server/utils/constants');

const BOX_KEY = 'DevicesInRoom';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getDevicesInRoom(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const room = await state.httpClient.get(`/api/v1/room/${box.room}?expand=devices`);
        // we test if there are lights ON/OFF device features to control in this room
        let roomLightStatus = 0;
        const binaryLightDevice = room.devices.find(device => {
          return (
            device.features.find(feature => {
              // if it's a light
              const isLight =
                feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
                feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY;
              // if it's a light and it's turned on, we consider that the light
              // is on in the room
              if (isLight && feature.last_value === 1) {
                roomLightStatus = 1;
              }
              return isLight;
            }) !== undefined
          );
        });
        // if yes, it will display the "ON/OFF" button for the room
        const hasBinaryLightDeviceFeature = binaryLightDevice !== undefined;
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          room,
          hasBinaryLightDeviceFeature,
          roomLightStatus
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    async changeAllLightsStatusRoom(state, x, y, action) {
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        roomLightStatus: action
      });
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const promises = [];
      data.room.devices.forEach(device => {
        device.features.forEach(feature => {
          const isLightBinary =
            feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT && feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY;
          if (isLightBinary && action === 1) {
            promises.push(deviceActions.turnOnLight(state, device.selector));
            feature.last_value = 1;
            feature.last_value_changed = new Date();
          } else if (isLightBinary && action === 0) {
            promises.push(deviceActions.turnOffLight(state, device.selector));
            feature.last_value = 0;
            feature.last_value_changed = new Date();
          }
        });
      });
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        room: data.room
      });
      await Promise.all(promises);
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
