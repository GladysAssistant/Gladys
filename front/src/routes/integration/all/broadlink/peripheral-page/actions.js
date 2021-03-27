import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';

function createActions(store) {
  const actions = {
    async getBroadlinkPeripherals(state) {
      store.setState({
        getBroadlinkPeripheralsStatus: RequestStatus.Getting
      });
      try {
        const broadlinkPeripherals = await state.httpClient.get('/api/v1/service/broadlink/peripheral');
        store.setState({
          broadlinkPeripherals,
          getBroadlinkPeripheralsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          broadlinkPeripherals: [],
          getBroadlinkPeripheralsStatus: RequestStatus.Error
        });
      }
    },
    updatePeripheralProperty(state, index, property, value) {
      const newState = update(state, {
        broadlinkPeripherals: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
