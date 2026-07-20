import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import LogsTab from './LogsTab';
import { RequestStatus } from '../../../../../utils/consts';

// the main container of the integration, always first in the selector
const MAIN_CONTAINER = 'main';

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
    const { selectedContainer = MAIN_CONTAINER } = this.state;
    try {
      const query = { lines: 200 };
      if (selectedContainer !== MAIN_CONTAINER) {
        query.container = selectedContainer;
      }
      const { logs } = await this.props.httpClient.get(`/api/v1/external_integration/${selector}/logs`, query);
      if (selector !== this.props.selector) {
        return;
      }
      this.setState({ logs, logsStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ logs: null, logsStatus: RequestStatus.Error });
    }
  };

  selectContainer = e => {
    this.setState({ selectedContainer: e.target.value }, this.getLogs);
  };

  componentWillMount() {
    this.loadIntegration();
    this.getLogs();
  }

  resetAndReload = () => {
    this.setState({ selectedContainer: MAIN_CONTAINER }, () => {
      this.loadIntegration();
      this.getLogs();
    });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.resetAndReload();
    }
  }

  render(props, { integration, logs, logsStatus, selectedContainer = MAIN_CONTAINER }) {
    const subContainers = (get(integration, 'manifest.containers') || []).map(container => container.name);
    return (
      <ExternalIntegrationPage selector={props.selector} integration={integration}>
        <LogsTab
          logs={logs}
          logsStatus={logsStatus}
          getLogs={this.getLogs}
          subContainers={subContainers}
          selectedContainer={selectedContainer}
          selectContainer={this.selectContainer}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('httpClient')(ExternalIntegrationLogsPage);
