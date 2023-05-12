import createActionsProfilePicture from '../profilePicture';

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const actions = {
    async getMySelf(state) {
      const tasks = [state.httpClient.get('/api/v1/me'), actionsProfilePicture.loadProfilePicture(state)];
      const [user] = await Promise.all(tasks);
      store.setState({
        user
      });
    }
  };
  return actions;
}

export default createActions;
