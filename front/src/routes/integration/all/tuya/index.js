import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import { RequestStatus } from '../../../../utils/consts';
import TuyaPage from './TuyaPage';

class TuyaIntegration extends Component {
  componentWillMount() {
    this.props.getTuyaConfiguration();
  }

  render(props, {}) {
    const loading =
      props.tuyaGetSettingsStatus === RequestStatus.Getting || props.tuyaSaveSettingsStatus === RequestStatus.Getting;
    return <TuyaPage {...props} loading={loading} />;
  }
}

export default connect(
  'user,tuyaBaseUrl,tuyaAccessKey,tuyaSecretKey,tuyaGetSettingsStatus,tuyaSaveSettingsStatus',
  actions
)(TuyaIntegration);
