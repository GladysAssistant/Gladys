import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
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
    updateNameFeature(state, indexDevice, indexFeature, field, value) {
      const xiaomiCapteurTemperature = update(state.xiaomiCapteurTemperature, {
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
        xiaomiCapteurTemperature
      });
    },
    async saveCapteur(state, index, device) {
      let capteur = state.xiaomiCapteurTemperature[index];
      device.features.map((feature, ind) => {
        capteur.features[ind].name = feature.name;
      });
      await state.httpClient.post(`/api/v1/device`, capteur);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
