import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import InfluxDBPage from './InfluxDB';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user, influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket',
  'influxdbGetSettingsStatus',
  'influxdbSaveSettingsStatus',
  actions
)
class InfluxDBIntegration extends Component {
  componentWillMount() {
    this.props.getInfluxdbSettings();
  }

  render(props, {}) {
    const loading =
      props.openWeatherSaveApiKeyStatus === RequestStatus.Getting ||
      props.openWeatherGetApiKeyStatus === RequestStatus.Getting;
    return <InfluxDBPage {...props} loading={loading} />;
  }
}

export default InfluxDBIntegration;
