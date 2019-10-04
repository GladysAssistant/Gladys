import createActionsHouse from './house';
import createActionsIntegration from './integration';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {};
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
