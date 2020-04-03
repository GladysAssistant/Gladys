import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    updateBoxRoom(state, x, y, room) {
      boxActions.updateBoxConfig(state, x, y, {
        room
      });
    }
  };
  return actions;
}

export default createActions;
