import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import debounce from 'debounce';
import {
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../../server/utils/constants';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiCapteurTemperature(state, take, skip) {
      store.setState({
        getXiaomiCapteurTemperatureStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiCapteurTemperatureDir || 'asc',
          take,
          skip
        };
        if (state.rtspCameraSearch && state.rtspCameraSearch.length) {
          options.search = state.rtspCameraSearch;
        }
        const xiaomiCapteurTemperatureReceived = await state.httpClient.get('/api/v1/service/xiaomi/device', options);
        // find camera url
        xiaomiCapteurTemperatureReceived.forEach(camera => {
          const cameraUrlParam = camera.params.find(param => param.name === 'CAMERA_URL');
          if (cameraUrlParam) {
            camera.cameraUrl = cameraUrlParam;
          }
        });
        let xiaomiCapteurTemperature;
        if (skip === 0) {
          xiaomiCapteurTemperature = xiaomiCapteurTemperatureReceived;
        } else {
          xiaomiCapteurTemperature = update(state.xiaomiCapteurTemperature, {
            $push: xiaomiCapteurTemperatureReceived
          });
        }
        store.setState({
          xiaomiCapteurTemperature,
          getXiaomiCapteurTemperatureStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiCapteurTemperatureStatus: e.message
        });
      }
    },
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const houses = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          houses,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    updateCapteurField(state, index, field, value) {
      let xiaomiCapteurTemperature;
      if (value.value) {
        xiaomiCapteurTemperature = update(state.xiaomiCapteurTemperature, {
          [index]: {
            features: {
              [value.getAttribute('data-key')]: {
                [field]: {
                  $set: value.value
                }
              }
            }
          }
        });
      } else {
        xiaomiCapteurTemperature = update(state.xiaomiCapteurTemperature, {
          [index]: {
            [field]: {
              $set: value
            }
          }
        });
      }
      store.setState({
        xiaomiCapteurTemperature
      });
    },
    async saveCapteur(state, index, device) {
      let capteur = state.xiaomiCapteurTemperature[index];
      device.features.map((feature, ind) => {
        capteur.features[ind].name = feature.name
      });
      console.log(capteur);
      await state.httpClient.post(`/api/v1/device`, capteur);
    },
    addCapteurTemperature(state) {
      const uniqueId = uuid.v4();
      let capteurTemperature = {
        service_id: '3445bf82-1608-404b-bf77-a0dab85ae46c',
        name: 'xiaomi-temperature-2',
        external_id: uniqueId,
        features: [{
          name: 'xiaomi-temperature-2',
          external_id: uniqueId,
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -20,
          max: 100
        }]
      }
      try {
        state.httpClient.post(`/api/v1/device`, capteurTemperature);
      } catch (e) {
        console.log(e)
      }
      const xiaomiCapteurTemperature = update(state.xiaomiCapteurTemperature, {
        $push: [{
          service_id: '3445bf82-1608-404b-bf77-a0dab85ae46c',
          name: 'xiaomi-temperature-1',
          external_id: uniqueId,
          features: [{
            name: 'Temperature',
            external_id: uniqueId,
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -20,
            max: 100
          }]
        }]
      })
      store.setState({
        xiaomiCapteurTemperature
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;