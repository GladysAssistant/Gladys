import { Component } from 'preact';
import { connect } from 'unistore/preact';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import LogsTab from './LogsTab';
import { RequestStatus } from '../../../../../utils/consts';

class ExternalIntegrationLogsPage extends Component {
  loadIntegration = async () => {
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      this.setState({ integration });
    } catch (e) {
      console.error(e);
    }
  };

  getLogs = async () => {
    this.setState({ logsStatus: RequestStatus.Getting });
    const { selector } = this.props;
    try {
      const { logs } = await this.props.httpClient.get(`/api/v1/external_integration/${selector}/logs`, {
        lines: 200
      });
      if (selector !== this.props.selector) {
        return;
      }
      this.setState({ logs, logsStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ logs: null, logsStatus: RequestStatus.Error });
    }
  };

  componentWillMount() {
    this.loadIntegration();
    this.getLogs();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadIntegration();
      this.getLogs();
    }
  }

  render(props, { integration, logs, logsStatus }) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={integration}>
        <LogsTab logs={logs} logsStatus={logsStatus} getLogs={this.getLogs} />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('httpClient')(ExternalIntegrationLogsPage);
