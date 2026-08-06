import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MeteoFrancePage from './MeteoFrance';
import { RequestStatus } from '../../../../utils/consts';

class MeteoFranceIntegration extends Component {
  componentWillMount() {
    this.props.getMeteoFranceApiKey();
  }

  render(props, {}) {
    const loading =
      props.meteoFranceSaveApiKeyStatus === RequestStatus.Getting ||
      props.meteoFranceGetApiKeyStatus === RequestStatus.Getting;
    return <MeteoFrancePage {...props} loading={loading} />;
  }
}

export default connect(
  'user,meteoFranceApiKey,meteoFranceSaveApiKeyStatus,meteoFranceGetApiKeyStatus',
  actions
)(MeteoFranceIntegration);
