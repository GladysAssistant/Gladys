import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiSensorTemperature(state, take, skip) {
      store.setState({
        getXiaomiSensorTemperatureStatus: RequestStatus.Getting,
        sensorThGetStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiSensorTemperatureDir || 'asc',
          take,
          skip
        };
        const xiaomiSensorTemperatureReceived = await state.httpClient.get('/api/v1/service/xiaomi/device', options);
        const temp = await state.httpClient.get(`/api/v1/service/xiaomi/sensorTh`);
        let sensorThReceived = [];
        let sensorTh = [];
        for (let e in temp) {
          if (temp[e]) {
            sensorThReceived.push(temp[e]);
          }
        }
        for (let i = 0; i < sensorThReceived.length; i += 1) {
          let testTrue = 1;
          for (let j = 0; j < xiaomiSensorTemperatureReceived.length; j += 1) {
            if (sensorThReceived[i].name === xiaomiSensorTemperatureReceived[j].name) {
              testTrue = 0;
            }
          }
          if (testTrue === 1) {
            sensorTh.push(sensorThReceived[i]);
          }
        }
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
          sensorTh,
          sensorThGetStatus: RequestStatus.Success,
          getXiaomiSensorTemperatureStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiSensorTemperatureStatus: e.message,
          sensorThGetStatus: RequestStatus.Error
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
      });
    },
    updateNameFeature(state, indexDevice, indexFeature, field, value) {
      const xiaomiSensorTemperature = update(state.xiaomiSensorTemperature, {
        [indexDevice]: {
          features: {
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
    },
    async deleteSensor(state, index) {
      let sensor = state.xiaomiSensorTemperature[index];
      await state.httpClient.delete('/api/v1/device/' + sensor.selector);
      await this.getXiaomiSensorTemperature(100, 0);
    },
    async addSensor(state, index) {
      await state.httpClient.post(`/api/v1/device`, this.sensorTh[index]);
      await this.getXiaomiSensorTemperature(100, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
