import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ServicesPage from './ServicesPage';
import update from 'immutability-helper';

class SettingsServices extends Component {
  getServices = async (podId = null) => {
    try {
      const query = {
        pod_id: podId
      };
      const services = await this.props.httpClient.get(`/api/v1/service`, query);
      services.sort((s1, s2) => s1.name.localeCompare(s2.name));
      this.setState({
        services
      });
    } catch (e) {
      console.error(e);
    }
  };
  actionOnService = async (serviceName, action, podId = null) => {
    const query = {
      pod_id: podId
    };
    const service = await this.props.httpClient.post(`/api/v1/service/${serviceName}/${action}`, query);

    const serviceIndex = this.state.services.findIndex(s => s.selector === service.selector);
    const services = update(this.state.services, {
      $splice: [[serviceIndex, 1, service]]
    });

    this.setState({
      services
    });
  };
  startService = async (serviceName, podId = null) => {
    await this.actionOnService(serviceName, 'start', podId);
  };
  stopService = async (serviceName, podId = null) => {
    await this.actionOnService(serviceName, 'stop', podId);
  };
  componentWillMount() {
    this.getServices();
  }

  render(props, { services }) {
    return (
      <ServicesPage
        {...props}
        services={services}
        startService={this.startService}
        stopService={this.stopService}
        actionOnService={this.actionOnService}
      />
    );
  }
}

export default connect('httpClient', {})(SettingsServices);
