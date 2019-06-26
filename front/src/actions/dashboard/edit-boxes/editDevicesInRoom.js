import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getRooms(state) {
      store.setState({
        DashboardEditDeviceInRoomStatus: RequestStatus.Getting
      });
      try {
        const rooms = await state.httpClient.get('/api/v1/room');
        store.setState({
          rooms,
          DashboardEditDeviceInRoomStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          DashboardEditDeviceInRoomStatus: RequestStatus.Error
        });
      }
    },
    updateBoxRoom(state, x, y, room) {
      boxActions.updateBoxConfig(state, x, y, {
        room
      });
    }
  };
  return actions;
}

export default createActions;
