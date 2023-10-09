function createActions(store) {
  const actions = {
    setFullScreen(state, fullScreen) {
      store.setState({
        fullScreen
      });
    }
  };
  return actions;
}

export default createActions;
