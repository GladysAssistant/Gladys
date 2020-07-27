import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import { BRIDGE_MODEL } from '../../../../../../../server/services/philips-hue/lib/utils/consts';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getPhilipsHueDevices(state) {
      store.setState({
        getPhilipsHueDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getPhilipsHueDeviceOrderDir || 'asc'
        };
        if (state.philipsHueDeviceSearch && state.philipsHueDeviceSearch.length) {
          options.search = state.philipsHueDeviceSearch;
        }
        const philipsHueDevicesReceived = await state.httpClient.get('/api/v1/service/philips-hue/device', options);
        const philipsHueDevices = philipsHueDevicesReceived.filter(device => device.model !== BRIDGE_MODEL);
        const philipsHueDevicesMap = new Map();
        philipsHueDevices.forEach(device => philipsHueDevicesMap.set(device.external_id, device));
        store.setState({
          philipsHueDevices,
          philipsHueDevicesMap,
          getPhilipsHueDevicesStatus: RequestStatus.Success
        });
        actions.getPhilipsHueNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getPhilipsHueDevicesStatus: RequestStatus.Error
        });
      }
    },
    async getPhilipsHueNewDevices(state) {
      store.setState({
        getPhilipsHueNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const philipsHueNewDevices = await state.httpClient.get('/api/v1/service/philips-hue/light');
        const philipsHueNewDevicesFiltered = philipsHueNewDevices.filter(device => {
          if (!state.philipsHueDevicesMap) {
            return true;
          }
          return !state.philipsHueDevicesMap.has(device.external_id);
        });
        const testData = [
          {
            name: 'Prise pompe Piscine',
            service_id: '86b98c11-f85f-44e4-8f18-030576b3ee9d',
            external_id: 'philips-hue-light:ecb5fa25a522:3',
            selector: 'philips-hue-light:ecb5fa25a522:3',
            should_poll: true,
            model: 'LOM002',
            poll_frequency: 60000,
            features: [],
            not_handled: true,
            raw_philips_hue_device: {
              _rawData: {
                state: {
                  on: false,
                  alert: 'select',
                  mode: 'homeautomation',
                  reachable: true
                },
                swupdate: {
                  state: 'noupdates',
                  lastinstall: '2020-04-26T12:13:30'
                },
                type: 'On/Off plug-in unit',
                name: 'Prise pompe Piscine',
                modelid: 'LOM002',
                manufacturername: 'Signify Netherlands B.V.',
                productname: 'Hue Smart plug',
                capabilities: {
                  certified: true,
                  control: {},
                  streaming: {
                    renderer: false,
                    proxy: false
                  }
                },
                config: {
                  archetype: 'plug',
                  function: 'functional',
                  direction: 'omnidirectional',
                  startup: {
                    mode: 'safety',
                    configured: true
                  }
                },
                uniqueid: '00:17:88:01:08:9d:f7:5a-0b',
                swversion: '1.65.9_hB3217DF',
                swconfigid: '4303D274',
                productid: 'SmartPlug_OnOff_v01-00_02'
              },
              _id: 3
            }
          }
        ];
        store.setState({
          philipsHueNewDevices: testData || philipsHueNewDevicesFiltered,
          getPhilipsHueNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getPhilipsHueNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        philipsHueDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getPhilipsHueCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getPhilipsHueCreateDeviceStatus: RequestStatus.Success
        });
        actions.getPhilipsHueDevices(store.getState());
      } catch (e) {
        store.setState({
          getPhilipsHueCreateDeviceStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        philipsHueDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        philipsHueDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        philipsHueDeviceSearch: e.target.value
      });
      await actions.getPhilipsHueDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getPhilipsHueDeviceOrderDir: e.target.value
      });
      await actions.getPhilipsHueDevices(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
