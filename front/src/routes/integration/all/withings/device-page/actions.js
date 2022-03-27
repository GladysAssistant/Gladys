import update from 'immutability-helper';
import { RequestStatus } from '../../../../../utils/consts';

const actions = store => ({
  updateDeviceProperty(state, index, property, value) {
    const newState = update(state, {
      withingsDevices: {
        [index]: {
          [property]: {
            $set: value
          }
        }
      }
    });
    store.setState(newState);
  },
  async saveDevice(state, device) {
    const deviceSaved = await state.httpClient.post('/api/v1/device', device);
    device.inDB = true;
    device.selector = deviceSaved.selector;
    state.httpClient.get(`/api/v1/service/withings/post_create/${device.selector}`);
  },
  async deleteDevice(state, device, index) {
    await state.httpClient.delete(`/api/v1/device/${device.selector}`);
    device.inDB = false;
    if (!(index === null)) {
      const newState = update(state, {
        withingsDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    }
  },
  async getHouses(state) {
    store.setState({
      withingsGetStatus: RequestStatus.Getting
    });
    try {
      const params = {
        expand: 'rooms'
      };
      const houses = await state.httpClient.get(`/api/v1/house`, params);
      store.setState({
        houses,
        withingsGetStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        withingsGetStatus: RequestStatus.Error
      });
    }
  },
  async getWithingsDevice(state) {
    store.setState({
      withingsGetStatus: RequestStatus.Getting
    });
    try {
      const options = {};
      const withingsDevicesReceived = await state.httpClient.get('/api/v1/service/withings/device', options);

      store.setState({
        withingsGetStatus: RequestStatus.Success,
        withingsDevices: withingsDevicesReceived
      });
    } catch (e) {
      store.setState({
        withingsGetStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
