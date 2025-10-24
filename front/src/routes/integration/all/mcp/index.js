import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MCPPage from './mcp';
import { RequestStatus } from '../../../../utils/consts';

class MCPIntegration extends Component {
  componentWillMount() {
    this.props.getMCPApiKeys();
  }

  render(props, {}) {
    const loading = props.sessionsGetStatus === RequestStatus.Getting;
    return <MCPPage {...props} loading={loading} />;
  }
}

export default connect(
  'user,sessionsGetStatus,sessionsCreateStatus,sessionsRevokeStatus,mcpApiKeys,newMCPClient,missingNewMCPClient',
  actions
)(MCPIntegration);
