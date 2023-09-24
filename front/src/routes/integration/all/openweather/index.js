import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import OpenWeatherPage from './OpenWeather';
import { RequestStatus } from '../../../../utils/consts';

class OpenWeatherIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.openWeatherSaveApiKeyStatus === RequestStatus.Getting ||
      props.openWeatherGetApiKeyStatus === RequestStatus.Getting;
    return <OpenWeatherPage {...props} loading={loading} />;
  }
}

export default connect(
  'user,openWeatherApiKey,openWeatherSaveApiKeyStatus,openWeatherGetApiKeyStatus',
  actions
)(OpenWeatherIntegration);
