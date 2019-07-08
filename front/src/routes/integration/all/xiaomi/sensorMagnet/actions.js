import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getXiaomiSensorMagnet(state, take, skip) {
      store.setState({
        getXiaomiSensorMagnetStatus: RequestStatus.Getting,
        sensorMagnetGetStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getXiaomiSensorMagnetDir || 'asc',
          take,
          skip
        };
        const xiaomiSensorMagnetReceived = await state.httpClient.get('/api/v1/service/xiaomi/device', options);
        const temp = await state.httpClient.get(`/api/v1/service/xiaomi/sensorMagnet`);
        let sensorMagnetReceived = [];
        let sensorMagnet = [];
        for (let e in temp) {
          if (temp[e]) {
            sensorMagnetReceived.push(temp[e]);
          }
        }
        for (let i = 0; i < sensorMagnetReceived.length; i += 1) {
          let testTrue = 1;
          for (let j = 0; j < xiaomiSensorMagnetReceived.length; j += 1) {
            if (sensorMagnetReceived[i].name === xiaomiSensorMagnetReceived[j].name) {
              testTrue = 0;
            }
          }
          if (testTrue === 1) {
            sensorMagnet.push(sensorMagnetReceived[i]);
          }
        }
        let xiaomiSensorMagnet = [];
        if (skip === 0) {
          for (let k = 0; k < xiaomiSensorMagnetReceived.length; k++) {
            if (xiaomiSensorMagnetReceived[k].features[0].unit === null) {
              xiaomiSensorMagnet.push(xiaomiSensorMagnetReceived[k]);
            }
          }
        } else {
          xiaomiSensorMagnet = update(state.xiaomiSensorMagnet, {
            $push: xiaomiSensorMagnetReceived
          });
        }
        store.setState({
          xiaomiSensorMagnet,
          sensorMagnet,
          sensorMagnetGetStatus: RequestStatus.Success,
          getXiaomiSensorMagnetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getXiaomiSensorMagnetStatus: e.message,
          sensorMagnetGetStatus: RequestStatus.Error
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
      const xiaomiSensorMagnet = update(state.xiaomiSensorMagnet, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        xiaomiSensorMagnet
      });
    },
    updateNameField(state, index, field, value) {
      const xiaomiSensorMagnet = update(state.xiaomiSensorMagnet, {
        [index]: {
          features: {
            0: {
              [field]: {
                $set: value
              }
            }
          }
        }
      });
      store.setState({
        xiaomiSensorMagnet
      });
    },
    async saveSensor(state, index, device) {
      let sensor = state.xiaomiSensorMagnet[index];
      device.features.map((feature, ind) => {
        sensor.features[ind].name = feature.name;
      });
      await state.httpClient.post(`/api/v1/device`, sensor);
    },
    async deleteSensor(state, index) {
      let sensor = state.xiaomiSensorMagnet[index];
      await state.httpClient.delete('/api/v1/device/' + sensor.selector);
      const xiaomiSensorMagnet = update(state, {
        xiaomiSensorMagnet: {
          $splice: [[index, 1]]
        }
      });
      store.setState(xiaomiSensorMagnet);
      await this.getXiaomiSensorMagnet(100, 0);
    },
    async addSensor(state, index) {
      await state.httpClient.post(`/api/v1/device`, this.sensorMagnet[index]);
      await this.getXiaomiSensorMagnet(100, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
