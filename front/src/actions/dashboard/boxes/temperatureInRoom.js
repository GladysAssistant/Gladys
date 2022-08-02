import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

const BOX_KEY = 'TemperatureInRoom';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getTemperatureInRoom(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const room = await state.httpClient.get(`/api/v1/room/${box.room}?expand=temperature,devices`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          room
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    async deviceFeatureWebsocketEvent(state, box, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'room.devices', { default: [] });

      // Search if feature is in room
      const featureIndex = devices.findIndex(device => {
        const featureIndex = device.features.findIndex(feature => feature.selector === payload.device_feature_selector);
        return featureIndex !== -1;
      });

      // If feature is in room
      if (featureIndex !== -1) {
        // Refresh box value
        this.getTemperatureInRoom(box, x, y);
      }
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
