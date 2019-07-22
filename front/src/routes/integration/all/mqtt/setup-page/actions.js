import createActionsIntegration from '../../../../../actions/integration';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {};
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
