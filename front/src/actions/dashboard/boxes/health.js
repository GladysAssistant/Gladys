import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
// import createDeviceActions from '../../device';
import update from 'immutability-helper';
import get from 'get-value';

const BOX_KEY = 'Health';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getHealthData(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        // we get the all health data
        const healthData = await state.httpClient.get(`/api/v1/health`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          healthData
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        console.log(e);
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    deviceFeatureWebsocketEvent(state, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'healthData.devices');
      if (devices) {
        let found = false;
        let currentDeviceIndex = 0;
        let currentFeatureIndex = 0;
        while (!found && currentDeviceIndex < devices.length) {
          while (!found && currentFeatureIndex < devices[currentDeviceIndex].features.length) {
            if (
              devices[currentDeviceIndex].features[currentFeatureIndex].selector === payload.device_feature_selector
            ) {
              found = true;
              const newData = update(data, {
                healthData: {
                  devices: {
                    [currentDeviceIndex]: {
                      features: {
                        [currentFeatureIndex]: {
                          last_value: {
                            $set: payload.last_value
                          },
                          last_value_changed: {
                            $set: payload.last_value_changed
                          }
                        }
                      }
                    }
                  }
                }
              });
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                healthData: newData.healthData
              });
            }
            currentFeatureIndex += 1;
          }
          currentDeviceIndex += 1;
          currentFeatureIndex = 0;
        }
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
