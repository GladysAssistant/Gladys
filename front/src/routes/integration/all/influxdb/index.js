import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import InfluxDBPage from './InfluxDBPage';

import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,session,influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket, influxdbGetSettingsStatus, influxdbSaveSettingsStatus, currentIntegration',
  actions
)
class InfluxDBSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('influxdb');
    this.props.loadProps();
  }

  componentWillUnmount() {}

  render(props, {}) {
    const loading = props.influxdbGetSettingsStatus === RequestStatus.Getting;
    return <InfluxDBPage {...props} loading={loading} />;
  }
}

export default InfluxDBSetupPage;
