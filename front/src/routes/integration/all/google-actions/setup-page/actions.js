import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const readConfigurationFile = async file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.readAsText(file);
  });
};

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let googleActionsProjectKey;
      let googleActionsClient;
      store.setState({
        loadGoogleActionsStatus: RequestStatus.Getting,
        addDetailsGoogleActionsStatus: RequestStatus.Getting
      });

      let newState = {};
      try {
        googleActionsProjectKey = await state.httpClient.get(
          '/api/v1/service/google-actions/variable/GOOGLEACTIONS_PROJECT_KEY'
        );

        newState = {
          googleActionsProjectKey: googleActionsProjectKey.value,
          loadGoogleActionsStatus: RequestStatus.Success
        };
      } catch (e) {
        newState = {
          loadGoogleActionsStatus: RequestStatus.Success
        };
      }

      try {
        googleActionsClient = await state.httpClient.get('/api/v1/oauth/client/google-actions');
        newState = {
          ...newState,
          googleActionsGladysClientId: googleActionsClient.id,
          googleActionsGladysClientSecret: googleActionsClient.secret,
          addDetailsGoogleActionsStatus: RequestStatus.Success
        };
      } catch (e) {
        newState = { ...newState, addDetailsGoogleActionsStatus: RequestStatus.Success };
      }

      store.setState(newState);
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      store.setState(data);
    },
    async updateConfigrationFile(state, e) {
      const fileContent = await readConfigurationFile(e.target.files[0]);

      try {
        const googleActionsConfiguration = JSON.parse(fileContent);

        if (!googleActionsConfiguration.project_id || !googleActionsConfiguration.private_key) {
          throw new Error();
        }

        const data = {
          googleActionsConfiguration,
          fileGoogleActionsValue: e.target.value,
          googleActionsConfigurationError: false
        };

        store.setState(data);
      } catch (e) {
        store.setState({ googleActionsConfigurationError: true });
      }
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        configureGoogleActionsStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/google-actions/variable/GOOGLEACTIONS_PROJECT_KEY', {
          value: state.googleActionsProjectKey
        });
        await state.httpClient.post('/api/v1/service/google-actions/init', {
          value: JSON.stringify(state.googleActionsConfiguration)
        });

        store.setState({
          configureGoogleActionsStatus: RequestStatus.Success,
          fileGoogleActionsValue: null
        });
      } catch (e) {
        store.setState({
          configureGoogleActionsStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
