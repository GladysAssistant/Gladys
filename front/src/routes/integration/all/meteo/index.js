import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MeteoPage from './Meteo';
import { RequestStatus } from '../../../../utils/consts';

class MeteoIntegration extends Component {
  componentWillMount() {
    this.props.getMeteoSettings();
  }

  render(props, {}) {
    const loading =
      props.meteoSaveSettingsStatus === RequestStatus.Getting || props.meteoGetSettingsStatus === RequestStatus.Getting;
    return <MeteoPage {...props} loading={loading} />;
  }
}

export default connect(
  'user,meteoSource,meteoFranceApiKey,meteoOpenWeatherApiKey,meteoSaveSettingsStatus,meteoGetSettingsStatus',
  actions
)(MeteoIntegration);
