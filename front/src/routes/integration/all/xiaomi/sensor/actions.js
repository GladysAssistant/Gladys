import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiSensor(state, take, skip) {
      store.setState({
        getXiaomiSensorStatus: RequestStatus.Getting,
        sensorGetStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiSensorDir || 'asc',
          take,
          skip
        };
        const xiaomiSensorReceived = await state.httpClient.get('/api/v1/service/xiaomi/device', options);

        const temp = await state.httpClient.get(`/api/v1/service/xiaomi/sensor`);
        let sensorReceived = [];
        let sensor = [];
        for (let e in temp) {
          if (temp[e]) {
            sensorReceived.push(temp[e]);
          }
        }
        for (let i = 0; i < sensorReceived.length; i += 1) {
          let testTrue = 1;
          for (let j = 0; j < xiaomiSensorReceived.length; j += 1) {
            if (sensorReceived[i].name === xiaomiSensorReceived[j].name) {
              testTrue = 0;
            }
          }
          if (testTrue === 1) {
            sensor.push(sensorReceived[i]);
          }
        }
        let xiaomiSensor = [];
        if (skip === 0) {
          for (let k = 0; k < xiaomiSensorReceived.length; k++) {
            xiaomiSensor.push(xiaomiSensorReceived[k]);
          }
        } else {
          xiaomiSensor = update(state.xiaomiSensor, {
            $push: xiaomiSensorReceived
          });
        }
        store.setState({
          xiaomiSensor,
          sensor,
          sensorGetStatus: RequestStatus.Success,
          getXiaomiSensorStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiSensorStatus: e.message,
          sensorGetStatus: RequestStatus.Error
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
      const xiaomiSensor = update(state.xiaomiSensor, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        xiaomiSensor
      });
    },
    updateNameFeature(state, indexDevice, indexFeature, field, value) {
      const xiaomiSensor = update(state.xiaomiSensor, {
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
        xiaomiSensor
      });
    },
    async saveSensor(state, index, device) {
      let sensor = state.xiaomiSensor[index];
      device.features.map((feature, ind) => {
        sensor.features[ind].name = feature.name;
      });
      await state.httpClient.post(`/api/v1/device`, sensor);
    },
    async deleteSensor(state, index) {
      let sensor = state.xiaomiSensor[index];
      await state.httpClient.delete('/api/v1/device/' + sensor.selector);
      const xiaomiSensor = update(state, {
        xiaomiSensor: {
          $splice: [[index, 1]]
        }
      });
      state.sensor.push(sensor);
      store.setState(xiaomiSensor);
    },
    async addSensor(state, index) {
      await state.httpClient.post(`/api/v1/device`, this.sensor[index]);
      await this.getXiaomiSensor(100, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
