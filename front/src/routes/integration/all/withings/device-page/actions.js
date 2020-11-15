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
    await state.httpClient.post('/api/v1/device', device);
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

      // Build map of device image by device name
      const mapOfDeviceImgByName = new Map();
      mapOfDeviceImgByName.set('Withings - Withings WBS01', 'sleep-analyzer-single.png');
      mapOfDeviceImgByName.set('Withings - WS30', 'sleep-analyzer-single.png');
      mapOfDeviceImgByName.set('Withings - Kid Scale', 'KidScale.jpeg');
      mapOfDeviceImgByName.set('Withings - Smart Body Analyzer', 'body-plus-black-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Body+', 'body-plus-black-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Body Cardio', 'body-cardio-black-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Body', 'body-black-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Smart Baby Monitor', 'SmartBabyMonitor.jpg');
      mapOfDeviceImgByName.set('Withings - Withings Home', 'home.jpg');
      mapOfDeviceImgByName.set('Withings - Withings Blood Pressure Monitor V1', 'bpm-connect.jpg');
      mapOfDeviceImgByName.set('Withings - Withings Blood Pressure Monitor V2', 'bpm-connect.jpg');
      mapOfDeviceImgByName.set('Withings - Withings Blood Pressure Monitor V3', 'bpm-connect.jpg');
      mapOfDeviceImgByName.set('Withings - BPM Core', 'bpm-core.jpg');
      mapOfDeviceImgByName.set('Withings - BPM Connect', 'bpm-connect.jpg');
      mapOfDeviceImgByName.set('Withings - Pulse', 'pulse-hr-black.jpg');
      mapOfDeviceImgByName.set('Withings - Activite', 'go.jpg');
      mapOfDeviceImgByName.set('Withings - Activite (Pop, Steel)', 'steel-white.jpg');
      mapOfDeviceImgByName.set('Withings - Withings Go', 'go.jpg');
      mapOfDeviceImgByName.set('Withings - Activite Steel HR', 'steel-hr-36b.jpg');
      mapOfDeviceImgByName.set('Withings - Activite Steel HR Sport Edition', 'steel-hr-sport-40b.jpg');
      mapOfDeviceImgByName.set('Withings - Pulse HR', 'pulse-hr-black.jpg');
      mapOfDeviceImgByName.set('Withings - Move', 'move-ecg-white-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Move ECG', 'move-ecg-white-kg.jpg');
      mapOfDeviceImgByName.set('Withings - Aura Dock', 'Aura_2.jpg');
      mapOfDeviceImgByName.set('Withings - Aura Sensor', 'Aura_2.jpg');
      mapOfDeviceImgByName.set('Withings - Aura Sensor V2', 'Aura_2.jpg');
      mapOfDeviceImgByName.set('Withings - Thermo', 'thermo-c.jpg');

      store.setState({
        withingsGetStatus: RequestStatus.Success,
        withingsImgMap: mapOfDeviceImgByName,
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
