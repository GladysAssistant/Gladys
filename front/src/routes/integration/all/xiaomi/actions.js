import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiSensorTemperature(state, take, skip) {
      store.setState({
        getXiaomiSensorTemperatureStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiSensorTemperatureDir || 'asc',
          take,
          skip
        };
        if (state.rtspCameraSearch && state.rtspCameraSearch.length) {
          options.search = state.rtspCameraSearch;
        }
        const xiaomiSensorTemperatureReceived = await state.httpClient.get('/api/v1/service/xiaomi/device', options);
        // find camera url
        xiaomiSensorTemperatureReceived.forEach(camera => {
          const cameraUrlParam = camera.params.find(param => param.name === 'CAMERA_URL');
          if (cameraUrlParam) {
            camera.cameraUrl = cameraUrlParam;
          }
        });
        let xiaomiSensorTemperature;
        if (skip === 0) {
          xiaomiSensorTemperature = xiaomiSensorTemperatureReceived;
        } else {
          xiaomiSensorTemperature = update(state.xiaomiSensorTemperature, {
            $push: xiaomiSensorTemperatureReceived
          });
        }
        store.setState({
          xiaomiSensorTemperature,
          getXiaomiSensorTemperatureStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiSensorTemperatureStatus: e.message
        });
      }
    },
    async getSensorTh(state) {
      try {
        const sensorTh = await state.httpClient.get(`/api/v1/service/xiaomi/sensorTh`);
        console.log(sensorTh)
      } catch (e) {
        console.log('erreur')
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
    updateSensorField(state, index, field, value) {
      const xiaomiSensorTemperature = update(state.xiaomiSensorTemperature, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        xiaomiSensorTemperature
      })
    },
    updateNameFeature(state, indexDevice, indexFeature, field, value) {
      const xiaomiSensorTemperature = update(state.xiaomiSensorTemperature, {
        [indexDevice]: {
          'features': {
            [indexFeature]: {
              [field]: {
                $set: value
              }
            }
          }
        }
      });
      store.setState({
        xiaomiSensorTemperature
      });
    },
    async saveSensor(state, index, device) {
      let sensor = state.xiaomiSensorTemperature[index];
      device.features.map((feature, ind) => {
        sensor.features[ind].name = feature.name;
      });
      await state.httpClient.post(`/api/v1/device`, sensor);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
