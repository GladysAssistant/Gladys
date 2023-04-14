---
to: ../front/src/routes/integration/all/<%= module %>/actions.js
---
import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

const HIDDEN_PASSWORD = '*********';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/<%= module %>/config');
      } finally {
        store.setState({
          <%= attributeName %>Username: configuration.login,
          <%= attributeName %>Password: configuration.login && HIDDEN_PASSWORD,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === '<%= attributeName %>Password') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        <%= attributeName %>ConnectionStatus: RequestStatus.Getting,
        <%= attributeName %>Connected: false,
        <%= attributeName %>ConnectionError: undefined
      });
      try {
        const { <%= attributeName %>Username, <%= attributeName %>Password } = state;
        await state.httpClient.post('/api/v1/service/<%= module %>/config', {
          accountId: <%= attributeName %>Username,
          password: (state.passwordChanges && <%= attributeName %>Password) || undefined
        });
        await state.httpClient.get(`/api/v1/service/<%= module %>/connect`);

        store.setState({
          <%= attributeName %>ConnectionStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ <%= attributeName %>ConnectionStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          <%= attributeName %>ConnectionStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "<%= className %> connected"
      store.setState({
        <%= attributeName %>Connected: true,
        <%= attributeName %>ConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            <%= attributeName %>Connected: false,
            <%= attributeName %>ConnectionStatus: undefined
          }),
        3000
      );
    },
    display<%= className %>Error(state, error) {
      store.setState({
        <%= attributeName %>Connected: false,
        <%= attributeName %>ConnectionStatus: undefined,
        <%= attributeName %>ConnectionError: error
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;