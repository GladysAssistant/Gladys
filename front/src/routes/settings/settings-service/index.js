import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import update from 'immutability-helper';

import withIntlAsProp from '../../../utils/withIntlAsProp';
import disambiguateIntegrationNames from '../../../utils/integrationNames';
import ServicesPage from './ServicesPage';
import getServiceIntegration from './serviceIntegration';

class SettingsServices extends Component {
  getServices = async (podId = null) => {
    try {
      const query = {
        pod_id: podId
      };
      const services = await this.props.httpClient.get(`/api/v1/service`, query);
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
    const integrations = (services || []).map(service => getServiceIntegration(service));
    // names are resolved on the whole list: whether an integration needs its
    // technical identity displayed depends on the other integrations present
    const nameBySlug = disambiguateIntegrationNames(integrations);
    // sorted on the label the row actually displays: a built-in integration is
    // listed under its translated title, which its service name does not always
    // match (in French, the "rtsp-camera" service reads "Caméras"), and a
    // community integration under its manifest name, not its docker image tag
    const getDisplayedName = integration =>
      (integration.i18nKey && get(props.intl.dictionary, integration.i18nKey)) || nameBySlug.get(integration.slug);
    const servicesWithIntegration = (services || [])
      .map((service, index) => ({
        service,
        integration: { ...integrations[index], name: nameBySlug.get(integrations[index].slug) }
      }))
      .sort((a, b) =>
        getDisplayedName(a.integration).localeCompare(getDisplayedName(b.integration), undefined, {
          sensitivity: 'base'
        })
      );

    return (
      <ServicesPage
        {...props}
        services={services && servicesWithIntegration}
        startService={this.startService}
        stopService={this.stopService}
        actionOnService={this.actionOnService}
      />
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SettingsServices));
