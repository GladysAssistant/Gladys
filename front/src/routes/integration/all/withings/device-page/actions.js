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
  updateWithingsDeviceImg() {
    // Build map of device image by device name
    const mapOfDeviceImgByModel = new Map();
    mapOfDeviceImgByModel.set('Kid Scale', 'KidScale.jpg');
    mapOfDeviceImgByModel.set('WBS08', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('WBS10', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('WBS11', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('WS30', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('Smart Body Analyzer', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('Withings WBS01', 'body-plus-black-kg.jpg');
    mapOfDeviceImgByModel.set('Body+', 'body-plus-black-kg.jpg');
    mapOfDeviceImgByModel.set('Body Cardio', 'body-cardio-black-kg.jpg');
    mapOfDeviceImgByModel.set('Body', 'body-black-kg.jpg');
    mapOfDeviceImgByModel.set('Smart Baby Monitor', 'SmartBabyMonitor.jpg');
    mapOfDeviceImgByModel.set('Withings Home', 'home.jpg');
    mapOfDeviceImgByModel.set('Withings Blood Pressure Monitor V1', 'bpm-connect.jpg');
    mapOfDeviceImgByModel.set('Withings Blood Pressure Monitor V2', 'bpm-connect.jpg');
    mapOfDeviceImgByModel.set('Withings Blood Pressure Monitor V3', 'bpm-connect.jpg');
    mapOfDeviceImgByModel.set('BPM Core', 'bpm-core.jpg');
    mapOfDeviceImgByModel.set('BPM Connect', 'bpm-connect.jpg');
    mapOfDeviceImgByModel.set('BPM Connect Pro', 'bpm-connect.jpg');
    mapOfDeviceImgByModel.set('Pulse', 'pulse-hr-black.jpg');
    mapOfDeviceImgByModel.set('Activite', 'go.jpg');
    mapOfDeviceImgByModel.set('Activite (Pop, Steel)', 'steel-white.jpg');
    mapOfDeviceImgByModel.set('Withings Go', 'go.jpg');
    mapOfDeviceImgByModel.set('Activite Steel HR', 'steel-hr-36b.jpg');
    mapOfDeviceImgByModel.set('Activite Steel HR Sport Edition', 'steel-hr-sport-40b.jpg');
    mapOfDeviceImgByModel.set('Pulse HR', 'pulse-hr-black.jpg');
    mapOfDeviceImgByModel.set('Move', 'move-ecg-white-kg.jpg');
    mapOfDeviceImgByModel.set('Move ECG', 'move-ecg-white-kg.jpg');
    mapOfDeviceImgByModel.set('Aura Dock', 'Aura_2.jpg');
    mapOfDeviceImgByModel.set('Aura Sensor', 'Aura_2.jpg');
    mapOfDeviceImgByModel.set('Aura Sensor V2', 'Aura_2.jpg');
    mapOfDeviceImgByModel.set('Thermo', 'thermo-c.jpg');
    store.setState({
      withingsImgMap: mapOfDeviceImgByModel
    });
  },
  async saveDevice(state, device) {
    const deviceSaved = await state.httpClient.post('/api/v1/device', device);
    device.inDB = true;
    device.selector = deviceSaved.selector;
    await state.httpClient.get('/api/v1/service/withings/poll');
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
