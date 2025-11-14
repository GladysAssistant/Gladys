import { Component } from 'preact';
import { connect } from 'unistore/preact';
import EnergyMonitoringPage from './EnergyMonitoring';

class EnergyMonitoringIntegration extends Component {
  render(props, {}) {
    return <EnergyMonitoringPage {...props} />;
  }
}

export default connect('user,session,httpClient', {})(EnergyMonitoringIntegration);
