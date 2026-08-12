import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import MCPPage from './mcp';
import { RequestStatus } from '../../../../utils/consts';
import { SESSION_TOKEN_TYPES } from '../../../../../../server/utils/constants';

class MCPIntegration extends Component {
  getMCPApiKeys = async () => {
    this.setState({
      sessionsGetStatus: RequestStatus.Getting
    });
    try {
      const mcpApiKeys = await this.props.httpClient.get('/api/v1/session', {
        scope: ['mcp'],
        token_type: SESSION_TOKEN_TYPES.API_KEY
      });
      this.setState({
        mcpApiKeys,
        sessionsGetStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        sessionsGetStatus: RequestStatus.Error
      });
    }
  };

  createMCPApiKey = async () => {
    if (!this.state.newMCPClient || this.state.newMCPClient.length === 0) {
      return this.setState({ missingNewMCPClient: true });
    }

    this.setState({
      sessionsCreateStatus: RequestStatus.Getting
    });
    try {
      const newApiKey = await this.props.httpClient.post('/api/v1/session/api_key', {
        scope: ['mcp'],
        useragent: this.state.newMCPClient
      });
      const mcpApiKeys = update(this.state.mcpApiKeys, {
        $push: [{ ...newApiKey, useragent: this.state.newMCPClient }]
      });
      this.setState({
        mcpApiKeys,
        sessionsCreateStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        sessionsCreateStatus: RequestStatus.Error
      });
    }
  };

  revokeMCPApiKey = async (sessionId, index) => {
    this.setState({
      sessionsRevokeStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post(`/api/v1/session/${sessionId}/revoke`);
      const mcpApiKeys = update(this.state.mcpApiKeys, {
        $splice: [[index, 1]]
      });
      this.setState({
        mcpApiKeys,
        sessionsRevokeStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        sessionsRevokeStatus: RequestStatus.Error
      });
    }
  };

  updateNewMCPClient = e => {
    this.setState({
      newMCPClient: e.target.value
    });
  };

  componentWillMount() {
    this.getMCPApiKeys();
  }

  render(props, state) {
    const loading = state.sessionsGetStatus === RequestStatus.Getting;
    return (
      <MCPPage
        {...props}
        {...state}
        loading={loading}
        createMCPApiKey={this.createMCPApiKey}
        revokeMCPApiKey={this.revokeMCPApiKey}
        updateNewMCPClient={this.updateNewMCPClient}
      />
    );
  }
}

export default connect('user,httpClient')(MCPIntegration);
