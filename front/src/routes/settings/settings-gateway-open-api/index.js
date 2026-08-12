import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SettingsLayout from '../SettingsLayout';
import update from 'immutability-helper';
import OpenApi from './OpenApi';
import linkState from 'linkstate';

class SettingsGatewayOpenApi extends Component {
  state = {
    apiKeys: [],
    newApiKeyName: ''
  };

  getApiKeys = async () => {
    const apiKeys = await this.props.session.gatewayClient.getApiKeys();
    this.setState({ apiKeys });
  };

  createApiKey = async () => {
    if (!this.state.newApiKeyName || this.state.newApiKeyName.length === 0) {
      return this.setState({ missingNewOpenApiName: true });
    }

    const apiKey = await this.props.session.gatewayClient.createApiKey(this.state.newApiKeyName);
    const newState = update(this.state, {
      apiKeys: { $push: [apiKey] },
      newApiKey: { $set: apiKey },
      newApiKeyName: { $set: '' },
      missingNewOpenApiName: { $set: false }
    });
    this.setState(newState);
  };

  revokeOpenApiKey = async (id, index) => {
    await this.props.session.gatewayClient.revokeApiKey(id);
    const newState = update(this.state, {
      apiKeys: { $splice: [[index, 1]] }
    });
    this.setState(newState);
  };

  componentDidMount() {
    this.getApiKeys();
  }

  render({ user }, state) {
    return (
      <SettingsLayout>
        <OpenApi
          {...state}
          user={user}
          createApiKey={this.createApiKey}
          revokeOpenApiKey={this.revokeOpenApiKey}
          updateNewApiKeyName={linkState(this, 'newApiKeyName')}
        />
      </SettingsLayout>
    );
  }
}

export default connect('session,user', {})(SettingsGatewayOpenApi);
