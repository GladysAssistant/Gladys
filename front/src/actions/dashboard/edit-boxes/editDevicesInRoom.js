import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    updateBoxRoom(state, x, y, room) {
      boxActions.updateBoxConfig(state, x, y, {
        room
      });
    },
    updateBoxDeviceFeatures(state, x, y, deviceFeatures) {
      boxActions.updateBoxConfig(state, x, y, {
        device_features: deviceFeatures
      });
    }
  };
  return actions;
}

export default createActions;
