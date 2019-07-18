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
        let numberSensor = 0;
        if (xiaomiSensorReceived.length !== 0) {
          let tempNumber = parseInt(xiaomiSensorReceived[xiaomiSensorReceived.length - 1].name.split('-')[1], 10);
          numberSensor = tempNumber + 1;
        }
        for (let e in temp) {
          if (temp[e]) {
            sensorReceived.push(temp[e]);
          }
        }
        for (let i = 0; i < sensorReceived.length; i += 1) {
          let testTrue = 1;
          for (let j = 0; j < xiaomiSensorReceived.length; j += 1) {
            if (sensorReceived[i].external_id === xiaomiSensorReceived[j].external_id) {
              testTrue = 0;
            }
          }
          if (testTrue === 1) {
            sensorReceived[i].name = sensorReceived[i].name.replace(
              /xiaomi-[a-zA-Z0-9]+/,
              'xiaomi-' + numberSensor.toString()
            );
            for (let j = 0; j < sensorReceived[i].features.length; j++) {
              sensorReceived[i].features[j].name = sensorReceived[i].features[j].name.replace(
                /xiaomi-[a-zA-Z0-9]+/,
                'xiaomi-' + numberSensor.toString()
              );
            }
            numberSensor += 1;
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
      const sensor = update(state.sensor, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        sensor
      });
    },
    async addSensor(state, sensorSend, index) {
      await state.httpClient.post(`/api/v1/device`, sensorSend);
      const newState = update(state, {
        sensor: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
